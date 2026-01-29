import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from "@/lib/auth/middleware";
import { checkGuestDiagramLimit, recordGuestDiagramCreation } from "@/lib/middleware/guest-auth";
import { diagramDb } from "@/lib/diagrams/db";
import { runMetaSOPOrchestration } from "@/lib/metasop/orchestrator";
import type { MetaSOPEvent } from "@/lib/metasop/types";
import type { CreateDiagramRequest } from "@/types/diagram";
import { validateCreateDiagramRequest } from "@/lib/diagrams/schemas";
import { rateLimit, rateLimiters, addRateLimitHeaders } from "@/lib/middleware/rate-limit";
import { createRequestLogger } from "@/lib/monitoring/logger";
import { metrics, MetricNames, trackPerformance } from "@/lib/monitoring/metrics";

/**
 * POST /api/diagrams/generate - Generate diagrams using MetaSOP multi-agent system
 * 
 * This endpoint uses the integrated MetaSOP orchestrator to generate diagrams
 * using the multi-agent orchestration system.
 * 
 * Supports both authenticated users and guest users (with limits).
 */
export const maxDuration = 900; // 15 minutes

export async function POST(request: NextRequest) {
  const requestLogger = createRequestLogger(request);
  const startTime = Date.now();
  
  try {
    // Rate limiting - stricter for guests
    let userId: string | undefined;
    let isGuest = false;
    
    try {
      const user = await getAuthenticatedUser(request);
      userId = user.userId;
      isGuest = false;
    } catch {
      isGuest = true;
    }

    // Apply rate limiting based on user type
    const rateLimitConfig = isGuest 
      ? rateLimiters.diagramGeneration()
      : rateLimiters.api();

    const rateLimitResult = await rateLimit(request, {
      ...rateLimitConfig,
      identifier: async (req) => {
        if (userId) return `user:${userId}`;
        const forwarded = req.headers.get("x-forwarded-for");
        return forwarded?.split(",")[0].trim() || "unknown";
      },
    });

    // If rate limit check returned a response (429), return it
    if (rateLimitResult instanceof NextResponse) {
      metrics.increment(MetricNames.RATE_LIMIT_EXCEEDED, 1, { endpoint: "diagrams.generate" });
      return rateLimitResult;
    }

    const rawBody = await request.json();

    if (rawBody?.options?.model) {
      requestLogger.info("LLM model override", { model: rawBody.options.model });
      process.env.METASOP_LLM_MODEL = rawBody.options.model;
    } else {
      delete process.env.METASOP_LLM_MODEL;
    }

    let body: CreateDiagramRequest;
    try {
      body = validateCreateDiagramRequest(rawBody);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        metrics.increment(MetricNames.API_ERROR, 1, { endpoint: "diagrams.generate", error: "validation" });
        return createErrorResponse(
          `Invalid request: ${error.errors.map((e) => e.message).join(", ")}`,
          400
        );
      }
      metrics.increment(MetricNames.API_ERROR, 1, { endpoint: "diagrams.generate", error: "parse" });
      return createErrorResponse("Invalid request format", 400);
    }

    let guestSessionId: string | undefined;

    if (isGuest) {
      const guestCheck = await checkGuestDiagramLimit(request);
      if (!guestCheck.allowed) {
        metrics.increment(MetricNames.RATE_LIMIT_EXCEEDED, 1, { endpoint: "diagrams.generate", type: "guest_limit" });
        return createErrorResponse(
          guestCheck.reason || "Please sign up to create more diagrams",
          403
        );
      }
      guestSessionId = guestCheck.sessionId;
      userId = `guest_${guestSessionId}`;
    }

    const useStreaming = request.nextUrl.searchParams.get("stream") === "true" || (body as any).stream === true;

    if (useStreaming) {
      const encoder = new TextEncoder();
      let isStreamClosed = false;
      let heartbeatInterval: NodeJS.Timeout | undefined;

      const customReadable = new ReadableStream({
        async start(controller) {
          const safeClose = () => {
            if (!isStreamClosed) {
              isStreamClosed = true;
              if (heartbeatInterval) clearInterval(heartbeatInterval);
              try {
                controller.close();
              } catch (e: any) {
                const isAlreadyClosed = e instanceof TypeError && e.message.includes("already closed");
                if (!isAlreadyClosed) {
                  requestLogger.error("Error closing stream controller", e);
                }
              }
            }
          };

          const safeEnqueue = (payload: any) => {
            if (isStreamClosed) return false;
            try {
              controller.enqueue(encoder.encode(JSON.stringify(payload) + "\n"));
              return true;
            } catch (e: any) {
              isStreamClosed = true;
              if (heartbeatInterval) clearInterval(heartbeatInterval);
              const isAlreadyClosed = e instanceof TypeError && e.message.includes("already closed");
              if (!isAlreadyClosed) {
                requestLogger.error("Error enqueueing stream data", e);
              }
              return false;
            }
          };

          try {
            requestLogger.info("Starting diagram generation with streaming", { userId, isGuest });

            // Forward progress events from orchestrator to the stream
            const onProgress = (event: any) => {
              try {
                safeEnqueue(event);
              } catch (e) {
                // Stream might be closed, ignore
              }
            };

            const orchestrationFn = trackPerformance(
              async () => runMetaSOPOrchestration(body.prompt, body.options || {}, onProgress),
              MetricNames.DIAGRAM_GENERATION_TIME,
              { streaming: "true", isGuest: isGuest ? "true" : "false" }
            );
            const orchestrationResult = await orchestrationFn();

            if (!orchestrationResult.success) {
              const errorMessage = orchestrationResult.steps.find((s: any) => s.error)?.error || "Orchestration failed";
              safeEnqueue({ type: "error", message: errorMessage });
              safeClose();
              return;
            }

            // Extract title from PM spec or use prompt
            const pmArtifact = orchestrationResult.artifacts.pm_spec?.content;
            const title = (pmArtifact as any)?.project_name || body.prompt.split('\n')[0].substring(0, 50) || "New Diagram";
            const description = (pmArtifact as any)?.summary || body.prompt.substring(0, 200) || "";

            // Create diagram first
            const createdDiagram = await diagramDb.create(userId!, {
              prompt: body.prompt,
              options: body.options,
            });

            // Update with artifacts metadata
            const savedDiagram = await diagramDb.update(createdDiagram.id, userId!, {
              title,
              description,
              status: "completed",
              metadata: {
                prompt: body.prompt,
                options: body.options,
                metasop_artifacts: orchestrationResult.artifacts,
                generated_at: new Date().toISOString(),
              },
            });

            if (isGuest && guestSessionId) {
              recordGuestDiagramCreation(guestSessionId);
            }

            // Send orchestration_complete event with full diagram data
            const diagramPayload = {
              type: "orchestration_complete" as const,
              diagram: {
                id: savedDiagram.id,
                title: savedDiagram.title,
                description: savedDiagram.description,
                nodes: [],
                edges: [],
                metadata: savedDiagram.metadata,
              }
            };

            requestLogger.info("Sending orchestration_complete event", {
              diagramId: savedDiagram.id,
            });

            safeEnqueue(diagramPayload);
            safeClose();
          } catch (error: any) {
            requestLogger.error("Diagram generation failed", error, { userId, isGuest });
            safeEnqueue({ type: "error", message: error.message || "Generation failed" });
            safeClose();
          }
        },
      });

      return new NextResponse(customReadable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Non-streaming path
    requestLogger.info("Starting diagram generation", { userId, isGuest });

    const orchestrationFn = trackPerformance(
      async () => runMetaSOPOrchestration(body.prompt, body.options || {}),
      MetricNames.DIAGRAM_GENERATION_TIME,
      { streaming: "false", isGuest: isGuest ? "true" : "false" }
    );
    const orchestrationResult = await orchestrationFn();

    if (!orchestrationResult.success) {
      metrics.increment(MetricNames.DIAGRAM_GENERATED, 0, { success: "false" });
      const errorMessage = orchestrationResult.steps.find(s => s.error)?.error || "Orchestration failed";
      requestLogger.error("Orchestration failed", new Error(errorMessage), { userId });
      return createErrorResponse(errorMessage, 500);
    }

    // Extract title from PM spec or use prompt
    const pmArtifact = orchestrationResult.artifacts.pm_spec?.content;
    const title = (pmArtifact as any)?.project_name || body.prompt.split('\n')[0].substring(0, 50) || "New Diagram";
    const description = (pmArtifact as any)?.summary || body.prompt.substring(0, 200) || "";

    // Create diagram first
    const createdDiagram = await diagramDb.create(userId!, {
      prompt: body.prompt,
      options: body.options,
    });

    // Update with artifacts metadata
    const savedDiagram = await diagramDb.update(createdDiagram.id, userId!, {
      title,
      description,
      status: "completed",
      metadata: {
        prompt: body.prompt,
        options: body.options,
        metasop_artifacts: orchestrationResult.artifacts,
        generated_at: new Date().toISOString(),
      },
    });

    if (isGuest && guestSessionId) {
      recordGuestDiagramCreation(guestSessionId);
    }

    metrics.increment(MetricNames.DIAGRAM_GENERATED, 1, { success: "true", isGuest: isGuest ? "true" : "false" });
    
    const responseTime = Date.now() - startTime;
    metrics.timing(MetricNames.API_RESPONSE_TIME, responseTime, { endpoint: "diagrams.generate" });

    const response = createSuccessResponse({
      id: savedDiagram.id,
      title: savedDiagram.title,
      description: savedDiagram.description,
      nodes: [],
      edges: [],
      metadata: savedDiagram.metadata,
    });

    // Add rate limit headers
    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error: any) {
    metrics.increment(MetricNames.API_ERROR, 1, { endpoint: "diagrams.generate", error: "unexpected" });
    requestLogger.error("Unexpected error in diagram generation", error);
    return createErrorResponse(
      error.message || "An unexpected error occurred",
      500
    );
  }
}
