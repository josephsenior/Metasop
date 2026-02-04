import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse, addGuestCookie } from "@/lib/api/response";
import { handleGuestAuth } from "@/lib/middleware/guest-auth";
import { validateRefineArtifactsRequest } from "@/lib/diagrams/schemas";
import { analyzeIntent } from "@/lib/metasop/refinement/intent-analyzer";
import { applyBatchUpdate, mergeArtifacts } from "@/lib/metasop/refinement/batch-updater";
import type { RefinementEvent, RefinementContext } from "@/lib/metasop/refinement/types";

export const maxDuration = 120; // 2 minutes for full refinement cycle

/**
 * POST /api/diagrams/artifacts/refine
 * 
 * 2-Layer Refinement Architecture with SSE Streaming:
 * 1. Layer 1 (Intent Analyzer): Analyze request → produce EditPlan
 * 2. Layer 2 (Batch Updater): Apply changes atomically → return updated artifacts
 * 
 * Streams events: analyzing → plan_ready → applying → complete
 */
export async function POST(request: NextRequest) {
  const useStreaming = request.nextUrl.searchParams.get("stream") === "true";

  try {
    const guestAuth = await handleGuestAuth(request);
    const cookieOpt = guestAuth.sessionId ? { guestSessionId: guestAuth.sessionId } : undefined;
    if (!guestAuth.canProceed) {
      return createErrorResponse(guestAuth.reason || "Unauthorized", 401, cookieOpt);
    }

    const rawBody = await request.json();
    const body = validateRefineArtifactsRequest(rawBody);

    // Extract artifact content (handle wrapped format)
    const artifacts: Record<string, any> = {};
    const originalWrappers: Record<string, any> = {};

    for (const [id, art] of Object.entries(body.previousArtifacts)) {
      const isWrapped = art && typeof art === "object" && "content" in art;
      if (isWrapped) {
        originalWrappers[id] = art;
        artifacts[id] = (art as { content: unknown }).content;
      } else {
        artifacts[id] = art;
      }
    }

    const context: RefinementContext = {
      intent: body.intent,
      artifacts,
      chatHistory: body.chatHistory,
      activeTab: body.activeTab
    };

    if (useStreaming) {
      return handleStreamingRefinement(context, cookieOpt, originalWrappers);
    } else {
      return handleSyncRefinement(context, cookieOpt, originalWrappers);
    }
  } catch (error: any) {
    console.error("Refine artifacts error:", error);
    return createErrorResponse(error.message || "Failed to refine artifacts", 500);
  }
}

/**
 * Streaming refinement with SSE events
 */
async function handleStreamingRefinement(
  context: RefinementContext,
  cookieOpt?: { guestSessionId: string },
  originalWrappers: Record<string, any>
): Promise<NextResponse> {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: RefinementEvent) => {
        controller.enqueue(
          encoder.encode(JSON.stringify(event) + "\n")
        );
      };

      try {
        // ─────────────────────────────────────────────────────────────
        // LAYER 1: Intent Analysis
        // ─────────────────────────────────────────────────────────────
        sendEvent({
          type: "analyzing",
          payload: { message: "Understanding your request..." },
          timestamp: Date.now()
        });

        const editPlan = await analyzeIntent(context);

        // Extract affected artifacts from edit plan
        const artifactsAffected = [...new Set(
          editPlan.edits.flatMap(e => [
            e.artifact,
            ...e.cascading_effects.map(ce => ce.artifact)
          ])
        )];

        sendEvent({
          type: "plan_ready",
          payload: {
            edits_count: editPlan.edits.length,
            artifacts_affected: artifactsAffected,
            reasoning: editPlan.reasoning,
            edit_plan: editPlan
          },
          timestamp: Date.now()
        });

        // Check if no real edits were planned
        if (editPlan.edits.length === 0 ||
          (editPlan.edits.length === 1 && editPlan.edits[0].artifact === "unknown")) {
          sendEvent({
            type: "complete",
            payload: {
              changelog: [],
              updated_artifacts: context.artifacts,
              message: "No changes needed for this request."
            },
            timestamp: Date.now()
          });
          controller.close();
          return;
        }

        // ─────────────────────────────────────────────────────────────
        // LAYER 2: Batch Update
        // ─────────────────────────────────────────────────────────────
        sendEvent({
          type: "applying",
          payload: {
            current_artifact: "all",
            progress: `Applying ${editPlan.edits.length} edit(s)...`
          },
          timestamp: Date.now()
        });

        const result = await applyBatchUpdate(editPlan, context.artifacts);


        // Merge with original artifacts (preserve unchanged ones)
        const mergedContent = mergeArtifacts(context.artifacts, result.updated_artifacts);

        // Re-wrap artifacts to preserve original structure
        const finalArtifacts: Record<string, any> = {};
        for (const [id, content] of Object.entries(mergedContent)) {
          if (originalWrappers[id]) {
            finalArtifacts[id] = {
              ...originalWrappers[id],
              content: content
            };
          } else {
            finalArtifacts[id] = content;
          }
        }



        // Send artifact_updated events for each changed artifact
        for (const [artifact, _] of Object.entries(result.updated_artifacts)) {
          const fieldsChanged = result.changelog.filter(c => c.artifact === artifact).length;
          sendEvent({
            type: "artifact_updated",
            payload: { artifact, fields_changed: fieldsChanged },
            timestamp: Date.now()
          });
        }

        // ─────────────────────────────────────────────────────────────
        // COMPLETE
        // ─────────────────────────────────────────────────────────────
        sendEvent({
          type: "complete",
          payload: {
            changelog: result.changelog,
            updated_artifacts: finalArtifacts,
            applied: result.changelog.length
          },
          timestamp: Date.now()
        });

        controller.close();
      } catch (error: any) {
        console.error("[Streaming Refinement] Error:", error);
        sendEvent({
          type: "error",
          payload: {
            message: error.message || "Refinement failed",
            phase: "unknown"
          },
          timestamp: Date.now()
        });
        controller.close();
      }
    }
  });

  const response = new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });

  if (cookieOpt?.guestSessionId) {
    addGuestCookie(response, cookieOpt.guestSessionId);
  }

  return response;
}

/**
 * Synchronous refinement (fallback for non-streaming clients)
 */
async function handleSyncRefinement(
  context: RefinementContext,
  cookieOpt?: { guestSessionId: string },
  originalWrappers: Record<string, any>
): Promise<NextResponse> {
  // Layer 1: Analyze intent
  const editPlan = await analyzeIntent(context);

  if (editPlan.edits.length === 0 ||
    (editPlan.edits.length === 1 && editPlan.edits[0].artifact === "unknown")) {
    return NextResponse.json({
      success: true,
      data: {
        artifacts: context.artifacts,
        applied: 0,
        message: "No changes needed for this request."
      }
    });
  }

  // Layer 2: Apply changes
  const result = await applyBatchUpdate(editPlan, context.artifacts);
  const mergedContent = mergeArtifacts(context.artifacts, result.updated_artifacts);

  // Re-wrap
  const finalArtifacts: Record<string, any> = {};
  for (const [id, content] of Object.entries(mergedContent)) {
    if (originalWrappers[id]) {
      finalArtifacts[id] = {
        ...originalWrappers[id],
        content: content
      };
    } else {
      finalArtifacts[id] = content;
    }
  }

  // Re-wrap
  const finalArtifacts: Record<string, any> = {};
  for (const [id, content] of Object.entries(mergedContent)) {
    if (originalWrappers[id]) {
      finalArtifacts[id] = {
        ...originalWrappers[id],
        content: content
      };
    } else {
      finalArtifacts[id] = content;
    }
  }

  const response = NextResponse.json({
    success: true,
    data: {
      artifacts: finalArtifacts,
      applied: result.changelog.length,
      changelog: result.changelog,
      editPlan: editPlan
    }
  });

  if (cookieOpt?.guestSessionId) {
    addGuestCookie(response, cookieOpt.guestSessionId);
  }

  return response;
}
