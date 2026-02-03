import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createErrorResponse, createSuccessResponse, addGuestCookie } from "@/lib/api/response";
import { handleGuestAuth, checkGuestDiagramLimit, recordGuestDiagramCreation } from "@/lib/middleware/guest-auth";
import { diagramDb } from "@/lib/diagrams/db";
import { checkDatabaseHealth } from "@/lib/database/prisma";
import { runMetaSOPOrchestration } from "@/lib/metasop/orchestrator";
import type { CreateDiagramRequest } from "@/types/diagram";
import { validateCreateDiagramRequest } from "@/lib/diagrams/schemas";
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
    const guestAuth = await handleGuestAuth(request);
    const cookieOpt = guestAuth.sessionId ? { guestSessionId: guestAuth.sessionId } : undefined;
    if (!guestAuth.canProceed || !guestAuth.userId) {
      return createErrorResponse(guestAuth.reason || "Unauthorized", 401, cookieOpt);
    }
    const userId = guestAuth.userId;

    const guestCheck = await checkGuestDiagramLimit(request);
    if (!guestCheck.allowed) {
      metrics.increment(MetricNames.RATE_LIMIT_EXCEEDED, 1, { endpoint: "diagrams.generate", type: "guest_limit" });
      return createErrorResponse(
        guestCheck.reason || "Guest diagram limit reached. Create more after a while.",
        403,
        cookieOpt
      );
    }
    const guestSessionId = guestCheck.sessionId;

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
          400,
          cookieOpt
        );
      }
      metrics.increment(MetricNames.API_ERROR, 1, { endpoint: "diagrams.generate", error: "parse" });
      return createErrorResponse("Invalid request format", 400, cookieOpt);
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
            const dbHealth = await checkDatabaseHealth();
            if (!dbHealth.healthy) {
              requestLogger.error("Database unavailable before orchestration", undefined, { error: dbHealth.error });
              safeEnqueue({ type: "error", message: `Database unavailable: ${dbHealth.error ?? "connection failed"}` });
              safeClose();
              return;
            }

            requestLogger.info("Starting diagram generation with streaming", { userId });

            // Forward progress events from orchestrator to the stream
            const onProgress = (event: any) => {
              try {
                safeEnqueue(event);
              } catch {
                // Stream might be closed, ignore
              }
            };

            const orchestrationFn = trackPerformance(
              async () =>
                runMetaSOPOrchestration(
                  body.prompt,
                  body.options || {},
                  onProgress,
                  body.documents,
                  body.clarificationAnswers
                ),
              MetricNames.DIAGRAM_GENERATION_TIME,
              { streaming: "true", isGuest: "true" }
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
            const createdDiagram = await diagramDb.create(userId, {
              prompt: body.prompt,
              options: body.options,
            });

            // Update with artifacts metadata
            const savedDiagram = await diagramDb.update(createdDiagram.id, userId, {
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

            if (guestSessionId) {
              recordGuestDiagramCreation(guestSessionId);
            }

            // Send orchestration_complete event with full diagram data
            const diagramPayload = {
              type: "orchestration_complete" as const,
              diagram: {
                id: savedDiagram.id,
                title: savedDiagram.title,
                description: savedDiagram.description,
                metadata: savedDiagram.metadata,
              }
            };

            requestLogger.info("Sending orchestration_complete event", {
              diagramId: savedDiagram.id,
            });

            safeEnqueue(diagramPayload);
            safeClose();
          } catch (error: any) {
            requestLogger.error("Diagram generation failed", error, { userId });
            safeEnqueue({ type: "error", message: error.message || "Generation failed" });
            safeClose();
          }
        },
      });

      const streamRes = new NextResponse(customReadable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
      if (cookieOpt?.guestSessionId) addGuestCookie(streamRes, cookieOpt.guestSessionId);
      return streamRes;
    }

    // Non-streaming path
    const dbHealth = await checkDatabaseHealth();
    if (!dbHealth.healthy) {
      requestLogger.error("Database unavailable before orchestration", undefined, { error: dbHealth.error });
      return createErrorResponse(
        `Database unavailable: ${dbHealth.error ?? "connection failed"}`,
        503,
        cookieOpt
      );
    }

    requestLogger.info("Starting diagram generation", { userId });

    const orchestrationFn = trackPerformance(
      async () =>
        runMetaSOPOrchestration(
          body.prompt,
          body.options || {},
          undefined,
          body.documents,
          body.clarificationAnswers
        ),
      MetricNames.DIAGRAM_GENERATION_TIME,
      { streaming: "false", isGuest: "true" }
    );
    const orchestrationResult = await orchestrationFn();

    if (!orchestrationResult.success) {
      metrics.increment(MetricNames.DIAGRAM_GENERATED, 0, { success: "false" });
      const errorMessage = orchestrationResult.steps.find(s => s.error)?.error || "Orchestration failed";
      requestLogger.error("Orchestration failed", new Error(errorMessage), { userId });
      return createErrorResponse(errorMessage, 500, cookieOpt);
    }

    // Extract title from PM spec or use prompt
    const pmArtifact = orchestrationResult.artifacts.pm_spec?.content;
    const title = (pmArtifact as any)?.project_name || body.prompt.split('\n')[0].substring(0, 50) || "New Diagram";
    const description = (pmArtifact as any)?.summary || body.prompt.substring(0, 200) || "";

    // Create diagram first
    const createdDiagram = await diagramDb.create(userId, {
      prompt: body.prompt,
      options: body.options,
    });

    // Update with artifacts metadata
    const savedDiagram = await diagramDb.update(createdDiagram.id, userId, {
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

    if (guestSessionId) {
      recordGuestDiagramCreation(guestSessionId);
    }

    metrics.increment(MetricNames.DIAGRAM_GENERATED, 1, { success: "true", isGuest: "true" });

    const responseTime = Date.now() - startTime;
    metrics.timing(MetricNames.API_RESPONSE_TIME, responseTime, { endpoint: "diagrams.generate" });

    const response = createSuccessResponse(
      {
        id: savedDiagram.id,
        title: savedDiagram.title,
        description: savedDiagram.description,
        metadata: savedDiagram.metadata,
      },
      undefined,
      cookieOpt
    );

    return response;
  } catch (error: any) {
    metrics.increment(MetricNames.API_ERROR, 1, { endpoint: "diagrams.generate", error: "unexpected" });
    requestLogger.error("Unexpected error in diagram generation", error);
    return createErrorResponse(
      error.message || "An unexpected error occurred",
      500
    );
  }
}
