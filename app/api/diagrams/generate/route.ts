import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from "@/lib/auth/middleware";
import { checkGuestDiagramLimit, recordGuestDiagramCreation } from "@/lib/middleware/guest-auth";
import { diagramDb } from "@/lib/diagrams/db";
import { runMetaSOPOrchestration } from "@/lib/metasop/orchestrator";
import type { CreateDiagramRequest, DiagramNode, DiagramEdge } from "@/types/diagram";
import type { ArchitectBackendArtifact } from "@/lib/metasop/types";
import { validateCreateDiagramRequest } from "@/lib/diagrams/schemas";
import { ensureUniqueNodeIds, ensureEdgeIds, validateEdgeReferences } from "@/lib/diagrams/validation";

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
  try {
    const rawBody = await request.json();

    if (rawBody?.options?.model) {
      console.log(`[API Route] Overriding LLM model to: ${rawBody.options.model}`);
      process.env.METASOP_LLM_MODEL = rawBody.options.model;
    } else {
      delete process.env.METASOP_LLM_MODEL;
    }

    let body: CreateDiagramRequest;
    try {
      body = validateCreateDiagramRequest(rawBody);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return createErrorResponse(
          `Invalid request: ${error.errors.map((e) => e.message).join(", ")}`,
          400
        );
      }
      return createErrorResponse("Invalid request format", 400);
    }

    let userId: string;
    let isGuest = false;
    let guestSessionId: string | undefined;

    try {
      const user = await getAuthenticatedUser(request);
      userId = user.userId;
      isGuest = false;
    } catch {
      const guestCheck = await checkGuestDiagramLimit(request);
      if (!guestCheck.allowed) {
        return createErrorResponse(
          guestCheck.reason || "Please sign up to create more diagrams",
          403
        );
      }
      isGuest = true;
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
                  console.error("[Backend] Error closing controller:", e);
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
                console.warn("[Backend] Failed to enqueue, stream might be closed:", e.message);
              }
              return false;
            }
          };

          safeEnqueue({ type: "stream_open", timestamp: new Date().toISOString() });

          heartbeatInterval = setInterval(() => {
            const ok = safeEnqueue({ type: "heartbeat", timestamp: new Date().toISOString() });
            if (!ok) {
              if (heartbeatInterval) clearInterval(heartbeatInterval);
            }
          }, 15000);

          try {
            const metasopResult = await runMetaSOPOrchestration(
              body.prompt,
              body.options,
              (event) => {
                const ok = safeEnqueue(event);
                if (!ok && isStreamClosed) {
                  throw new Error("STREAM_CLOSED");
                }
              },
              body.documents
            );

            clearInterval(heartbeatInterval);

            try {
              const transformedDiagram = transformMetaSOPToDiagram(metasopResult);

              transformedDiagram.nodes = ensureUniqueNodeIds(transformedDiagram.nodes);
              transformedDiagram.edges = ensureEdgeIds(transformedDiagram.edges);

              const refValidation = validateEdgeReferences(transformedDiagram.nodes, transformedDiagram.edges);
              if (!refValidation.valid) {
                const nodeIds = new Set(transformedDiagram.nodes.map((n) => n.id));
                transformedDiagram.edges = transformedDiagram.edges.filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to));
              }

              if (isGuest && guestSessionId) {
                // recordGuestDiagramCreation(guestSessionId); // User requested no guest diagram rendering
                
                safeEnqueue({
                  type: "orchestration_complete",
                  diagram: {
                    id: `temp_${Date.now()}`,
                    userId: userId,
                    title: body.prompt.substring(0, 50) + (body.prompt.length > 50 ? "..." : ""),
                    description: body.prompt,
                    nodes: transformedDiagram.nodes,
                    edges: transformedDiagram.edges,
                    status: "completed" as const,
                    metadata: {
                      prompt: body.prompt,
                      options: body.options,
                      metasop_artifacts: metasopResult.artifacts,
                      metasop_report: metasopResult.report,
                      metasop_steps: metasopResult.steps,
                      is_guest: true,
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  },
                  success: true,
                  timestamp: new Date().toISOString()
                });
              } else {
                let diagram;
                let diagramWithMetadata;
                
                try {
                  diagram = await diagramDb.create(userId, body);
                  diagramWithMetadata = diagram;
                  
                  try {
                    diagramWithMetadata = await diagramDb.update(diagram.id, userId, {
                      nodes: transformedDiagram.nodes,
                      edges: transformedDiagram.edges,
                      status: "completed",
                      metadata: {
                        prompt: body.prompt,
                        options: body.options,
                        metasop_artifacts: metasopResult.artifacts,
                        metasop_report: metasopResult.report,
                        metasop_steps: metasopResult.steps,
                      },
                    });
                  } catch (updateError: any) {
                    console.error("Failed to update diagram:", updateError);
                    diagramWithMetadata = {
                      ...diagram,
                      nodes: transformedDiagram.nodes,
                      edges: transformedDiagram.edges,
                      status: "completed" as const
                    };
                  }
                } catch (dbError: any) {
                  console.error("Database error during diagram creation:", dbError);
                  diagramWithMetadata = {
                    id: `temp_${Date.now()}`,
                    userId: userId,
                    title: body.prompt.substring(0, 50) + (body.prompt.length > 50 ? "..." : ""),
                    description: body.prompt,
                    nodes: transformedDiagram.nodes,
                    edges: transformedDiagram.edges,
                    status: "completed" as const,
                    metadata: {
                      prompt: body.prompt,
                      options: body.options,
                      metasop_artifacts: metasopResult.artifacts,
                      metasop_report: metasopResult.report,
                      metasop_steps: metasopResult.steps,
                      db_error: dbError.message,
                      is_temporary: true,
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  };
                }

                safeEnqueue({
                  type: "orchestration_complete",
                  diagram: diagramWithMetadata,
                  success: true,
                  timestamp: new Date().toISOString()
                });
              }
            } catch (transformError: any) {
              console.error("[Backend] Transformation error:", transformError);
              safeEnqueue({
                type: "orchestration_failed",
                error: transformError.message || "Failed to process results",
                timestamp: new Date().toISOString()
              });
            } finally {
              safeClose();
            }
          } catch (error: any) {
            clearInterval(heartbeatInterval);
            if (error.message === "STREAM_CLOSED") {
              safeClose();
              return;
            }
            console.error("[Backend] Streaming error:", error);
            try {
              safeEnqueue({
                type: "orchestration_failed",
                error: error.message || "Orchestration failed",
                timestamp: new Date().toISOString()
              });
            } finally {
              safeClose();
            }
          }
        },
        cancel() {
          isStreamClosed = true;
          if (heartbeatInterval) clearInterval(heartbeatInterval);
        }
      });

      return new NextResponse(customReadable, {
        headers: {
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "X-Accel-Buffering": "no",
        },
      });
    }

    // NON-STREAMING MODE
    let metasopResult = await runMetaSOPOrchestration(body.prompt, body.options, undefined, body.documents);
    const transformedDiagram = transformMetaSOPToDiagram(metasopResult);

    transformedDiagram.nodes = ensureUniqueNodeIds(transformedDiagram.nodes);
    transformedDiagram.edges = ensureEdgeIds(transformedDiagram.edges);

    const refValidation = validateEdgeReferences(transformedDiagram.nodes, transformedDiagram.edges);
    if (!refValidation.valid) {
      const nodeIds = new Set(transformedDiagram.nodes.map((n) => n.id));
      transformedDiagram.edges = transformedDiagram.edges.filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to));
    }

    if (isGuest && guestSessionId) {
      // recordGuestDiagramCreation(guestSessionId); // User requested no guest diagram rendering
      
      return NextResponse.json({
        status: "success",
        data: {
          diagram: {
            id: `temp_${Date.now()}`,
            userId: userId,
            title: body.prompt.substring(0, 50) + (body.prompt.length > 50 ? "..." : ""),
            description: body.prompt,
            nodes: transformedDiagram.nodes,
            edges: transformedDiagram.edges,
            status: "completed" as const,
            metadata: {
              prompt: body.prompt,
              options: body.options,
              metasop_artifacts: metasopResult.artifacts,
              metasop_report: metasopResult.report,
              metasop_steps: metasopResult.steps,
              is_guest: true,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          orchestration: {
            status: metasopResult.success ? "success" : "failed",
            artifacts: metasopResult.artifacts,
            report: metasopResult.report,
            steps: metasopResult.steps,
          },
        },
      });
    }

    let diagram = await diagramDb.create(userId, body);
    let diagramWithMetadata = diagram;
    try {
      diagramWithMetadata = await diagramDb.update(diagram.id, userId, {
        nodes: transformedDiagram.nodes,
        edges: transformedDiagram.edges,
        status: "completed",
        metadata: {
          prompt: body.prompt,
          options: body.options,
          metasop_artifacts: metasopResult.artifacts,
          metasop_report: metasopResult.report,
          metasop_steps: metasopResult.steps,
        },
      });
    } catch (dbError: any) {
      console.error("Database error creating diagram:", dbError);
      return createErrorResponse(dbError.message || "Failed to create diagram", 500);
    }

    return createSuccessResponse(
      { diagram: diagramWithMetadata, orchestration: {
        status: metasopResult.success ? "success" : "failed",
        artifacts: metasopResult.artifacts,
        report: metasopResult.report,
        steps: metasopResult.steps,
      }},
      "Diagram generated and saved successfully"
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return createErrorResponse("Unauthorized", 401);
    }
    console.error("Diagram error:", error);
    return createErrorResponse(error.message || "Failed to generate diagram", 500);
  }
}

/**
 * Transform MetaSOP orchestration artifacts to Diagram format
 */
function transformMetaSOPToDiagram(
  metasopResult: any
): { nodes: DiagramNode[]; edges: DiagramEdge[] } {
  const artifacts = metasopResult.artifacts || {};
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  const agentNodes = [
    { id: "agent-pm", label: "Product Manager", type: "agent", role: "pm", pos: { x: 0, y: 0 } },
    { id: "agent-arch", label: "Architect", type: "agent", role: "arch", pos: { x: 250, y: 0 } },
    { id: "agent-devops", label: "DevOps", type: "agent", role: "devops", pos: { x: 500, y: 0 } },
    { id: "agent-security", label: "Security", type: "agent", role: "security", pos: { x: 750, y: 0 } },
    { id: "agent-eng", label: "Engineer", type: "agent", role: "engineer", pos: { x: 1000, y: 0 } },
    { id: "agent-ui", label: "UI Designer", type: "agent", role: "ui", pos: { x: 1250, y: 0 } },
    { id: "agent-qa", label: "QA Engineer", type: "agent", role: "qa", pos: { x: 1500, y: 0 } },
  ];

  agentNodes.forEach(agent => {
    nodes.push({
      id: agent.id,
      label: agent.label,
      type: "agent",
      position: agent.pos,
      data: { agentRole: agent.role, label: agent.label }
    });
  });

  const pmSpec = artifacts.pm_spec?.content || {};
  if (pmSpec.user_stories && Array.isArray(pmSpec.user_stories)) {
    const storyId = "artifact-user-stories";
    nodes.push({
      id: storyId,
      type: "user_story",
      position: { x: 0, y: 250 },
      label: "User Stories",
      data: {
        label: "User Stories",
        items: pmSpec.user_stories.map((s: any) => ({
          title: s.title,
          description: s.description || s.story,
          priority: s.priority
        }))
      }
    });
    edges.push({ id: `pm-stories`, from: "agent-pm", to: storyId, label: "defines", animated: true });
  }

  const archContent = (artifacts.arch_design?.content || {}) as ArchitectBackendArtifact;
  if (archContent.database_schema?.tables) {
    const schemaId = "artifact-schema";
    nodes.push({
      id: schemaId,
      type: "database_schema",
      position: { x: 300, y: 250 },
      label: "Database Schema",
      data: { label: "Data Schema", items: archContent.database_schema.tables }
    });
    edges.push({ id: `arch-schema`, from: "agent-arch", to: schemaId, label: "specifies", animated: true });
  }

  if (archContent.apis && Array.isArray(archContent.apis)) {
    const apisId = "artifact-apis";
    nodes.push({
      id: apisId,
      type: "apis",
      position: { x: 450, y: 250 },
      label: "API Definitions",
      data: { label: "API Endpoints", items: archContent.apis }
    });
    edges.push({ id: `arch-apis`, from: "agent-arch", to: apisId, label: "defines", animated: true });
  }

  return { nodes, edges };
}

