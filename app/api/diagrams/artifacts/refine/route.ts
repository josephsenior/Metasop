import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/response";
import { handleGuestAuth } from "@/lib/middleware/guest-auth";
import { validateRefineArtifactsRequest } from "@/lib/diagrams/schemas";
import { applyEditOps, type ArtifactRecord } from "@/lib/artifacts/edit-tools";
import { intentToEditOps } from "@/lib/artifacts/refinement";

/**
 * POST /api/diagrams/artifacts/refine
 * Agentic refinement: intent (natural language) + current artifacts (source of truth)
 * → LLM produces edit ops → apply ops and return updated artifacts.
 */
export async function POST(request: NextRequest) {
  try {
    const guestAuth = await handleGuestAuth(request);
    const cookieOpt = guestAuth.sessionId ? { guestSessionId: guestAuth.sessionId } : undefined;
    if (!guestAuth.canProceed) {
      return createErrorResponse(guestAuth.reason || "Unauthorized", 401, cookieOpt);
    }

    const rawBody = await request.json();
    const body = validateRefineArtifactsRequest(rawBody);

    const previousArtifacts: Record<string, ArtifactRecord> = {};
    for (const [id, art] of Object.entries(body.previousArtifacts)) {
      const content = art && typeof art === "object" && "content" in art ? (art as { content: unknown }).content : art;
      previousArtifacts[id] = {
        content: content && typeof content === "object" ? (content as Record<string, unknown>) : {},
        step_id: (art as { step_id?: string })?.step_id,
        role: (art as { role?: string })?.role,
        timestamp: (art as { timestamp?: string })?.timestamp,
      };
    }

    const edits = await intentToEditOps(body.intent, previousArtifacts);

    if (edits.length === 0) {
      return createSuccessResponse(
        {
          success: true,
          artifacts: previousArtifacts,
          applied: 0,
          message: "No edits suggested for this request.",
        },
        "No edits suggested.",
        cookieOpt
      );
    }

    const result = applyEditOps(previousArtifacts, edits);

    return createSuccessResponse(
      {
        success: result.success,
        artifacts: result.artifacts,
        applied: result.applied,
        errors: result.errors.length ? result.errors : undefined,
      },
      result.success
        ? `Applied ${result.applied} edit(s).`
        : `Applied ${result.applied} edit(s); ${result.errors.length} failed.`,
      cookieOpt
    );
  } catch (error: any) {
    console.error("Refine artifacts error:", error);
    return createErrorResponse(error.message || "Failed to refine artifacts", 500);
  }
}
