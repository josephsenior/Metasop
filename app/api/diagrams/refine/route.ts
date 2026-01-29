import { NextRequest } from "next/server";
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from "@/lib/auth/middleware";
import { refineMetaSOPArtifact, MetaSOPOrchestrator } from "@/lib/metasop/orchestrator";
import { validateRefineDiagramRequest } from "@/lib/diagrams/schemas";
import { logger } from "@/lib/metasop/utils/logger";

export const maxDuration = 300; // 5 minutes for refinement

export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.json();
        const body = validateRefineDiagramRequest(rawBody);

        // Check if client wants streaming
        const wantsStream = request.headers.get("accept") === "text/event-stream";

        // Authentication: Use user if authenticated, otherwise allow refinement for guests if diagram allows
        try {
            await getAuthenticatedUser(request);
        } catch {
            // For now, allow guest refinement if diagramId starts with guest_ or diagram_
            if (!body.diagramId.startsWith("guest_") && !body.diagramId.startsWith("diagram_")) {
                return createErrorResponse("Unauthorized", 401);
            }
        }

        if (wantsStream) {
            // Return streaming response
            return handleStreamingRefinement(body);
        } else {
            // Run refinement without streaming (original behavior)
            const result = await refineMetaSOPArtifact(
                body.stepId,
                body.instruction,
                body.previousArtifacts,
                undefined, // onProgress
                body.cascade, // Pass cascade flag
                body.isAtomicAction // Pass atomic action flag
            );

            return createSuccessResponse(
                { result },
                "Artifact refined successfully"
            );
        }
    } catch (error: any) {
        console.error("Refinement error:", error);
        return createErrorResponse(error.message || "Failed to refine artifact", 500);
    }
}

function sendEvent(
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder,
    data: any
) {
    const event = `data: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(encoder.encode(event));
}

async function handleStreamingRefinement(body: any) {
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
        async start(controller) {
            try {
                // Send initial event
                sendEvent(controller, encoder, {
                    type: "start",
                    message: "Starting refinement...",
                    timestamp: new Date().toISOString()
                });

                // Create orchestrator with progress tracking
                const orchestrator = new MetaSOPOrchestrator();
                
                // Hydrate orchestrator with previous state
                (orchestrator as any).artifacts = body.previousArtifacts;
                (orchestrator as any).steps = Object.keys(body.previousArtifacts).map((id: string) => ({
                    id,
                    name: id.replace(/_/g, " "),
                    status: "success",
                    role: id.replace(/_impl|_spec|_design/g, "")
                }));

                // Build knowledge graph first
                sendEvent(controller, encoder, {
                    type: "analyzing",
                    message: "Analyzing dependencies...",
                    timestamp: new Date().toISOString()
                });

                await (orchestrator as any).knowledgeGraph.build(body.previousArtifacts);
                const graphStats = (orchestrator as any).knowledgeGraph.getStats();

                sendEvent(controller, encoder, {
                    type: "graph_built",
                    message: `Knowledge graph built: ${graphStats.nodes} nodes, ${graphStats.edges} edges`,
                    stats: graphStats,
                    timestamp: new Date().toISOString()
                });

                // Progress callback that sends SSE events
                const onProgress = (event: any) => {
                    let message = "";
                    let progressData: any = {
                        type: event.type,
                        stepId: event.step_id,
                        role: event.role,
                        timestamp: new Date().toISOString()
                    };

                    switch (event.type) {
                        case "step_start":
                            message = `🔄 Updating ${event.role}...`;
                            progressData.status = "running";
                            break;
                        case "step_thought":
                            message = `💭 ${event.role} is analyzing...`;
                            progressData.thought = event.thought;
                            break;
                        case "step_complete":
                            message = `✅ ${event.role} updated successfully`;
                            progressData.status = "success";
                            break;
                        case "step_failed":
                            message = `❌ ${event.role} failed: ${event.error}`;
                            progressData.status = "failed";
                            progressData.error = event.error;
                            break;
                        case "orchestration_complete":
                            message = "🎉 Refinement complete!";
                            progressData.status = "complete";
                            break;
                        default:
                            return; // Skip unknown event types
                    }

                    sendEvent(controller, encoder, {
                        type: "progress",
                        message,
                        data: progressData,
                        timestamp: new Date().toISOString()
                    });
                };

                // Run refinement with progress tracking
                let result;
                if (body.cascade) {
                    result = await orchestrator.cascadeRefinement(
                        body.stepId,
                        body.instruction,
                        onProgress,
                        0,
                        body.isAtomicAction
                    );
                } else {
                    result = await orchestrator.refineArtifact(
                        body.stepId,
                        body.instruction,
                        onProgress,
                        0,
                        body.isAtomicAction
                    );
                }

                // Send completion event with summary
                const updatedArtifacts = Object.keys(result.artifacts || {});
                const successCount = result.steps?.filter((s: any) => s.status === "success").length || 0;
                const failedCount = result.steps?.filter((s: any) => s.status === "failed").length || 0;

                sendEvent(controller, encoder, {
                    type: "complete",
                    message: `Refinement complete! ${successCount} artifacts updated successfully.${failedCount > 0 ? ` ${failedCount} failed.` : ""}`,
                    data: {
                        success: result.success,
                        updatedArtifacts,
                        successCount,
                        failedCount,
                        steps: result.steps?.map((s: any) => ({
                            id: s.id,
                            role: s.role,
                            status: s.status
                        }))
                    },
                    timestamp: new Date().toISOString()
                });

                controller.close();
            } catch (error: any) {
                logger.error("Streaming refinement error", { error: error.message });
                
                sendEvent(controller, encoder, {
                    type: "error",
                    message: `Refinement failed: ${error.message}`,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}

function sendEvent(
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder,
    data: any
) {
    const event = `data: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(encoder.encode(event));
}
