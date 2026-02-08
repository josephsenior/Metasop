import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse, addGuestCookie } from "@/lib/api/response";
import { handleGuestAuth } from "@/lib/middleware/guest-auth";
import { validateEditArtifactsRequest } from "@/lib/diagrams/schemas";
import { applyEditOps, type ArtifactRecord, type EditOp } from "@/lib/metasop/refinement/edit-tools";

/**
 * POST /api/diagrams/artifacts/edit
 * Deterministically edits artifact JSON using predefined tools.
 */
export async function POST(request: NextRequest) {
  try {
    const guestAuth = await handleGuestAuth(request);
    const cookieOpt = guestAuth.sessionId ? { guestSessionId: guestAuth.sessionId } : undefined;
    if (!guestAuth.canProceed) {
      return createErrorResponse(guestAuth.reason || "Unauthorized", 401, cookieOpt);
    }

    const rawBody = await request.json();
    const body = validateEditArtifactsRequest(rawBody);

    // Normalize artifacts into ArtifactRecord shape and preserve wrappers.
    const previousArtifacts: Record<string, ArtifactRecord> = {};
    const originalWrappers: Record<string, any> = {};

    for (const [id, art] of Object.entries(body.previousArtifacts)) {
      const isWrapped = art && typeof art === "object" && "content" in (art as any);
      if (isWrapped) {
        originalWrappers[id] = art;
        const wrapper = art as any;
        previousArtifacts[id] = {
          content: (wrapper.content && typeof wrapper.content === "object" ? wrapper.content : {}) as Record<string, unknown>,
          step_id: wrapper.step_id,
          role: wrapper.role,
          timestamp: wrapper.timestamp,
        };
      } else {
        previousArtifacts[id] = {
          content: (art && typeof art === "object" ? (art as Record<string, unknown>) : {}),
        };
      }
    }

    const edits = body.edits as EditOp[];
    const result = applyEditOps(previousArtifacts, edits);

    // Re-wrap artifacts if the request used wrappers.
    const finalArtifacts: Record<string, any> = {};
    for (const [id, record] of Object.entries(result.artifacts)) {
      if (originalWrappers[id]) {
        finalArtifacts[id] = {
          ...originalWrappers[id],
          content: record.content,
        };
      } else {
        finalArtifacts[id] = record;
      }
    }

    const response = NextResponse.json({
      success: true,
      artifacts: finalArtifacts,
      applied: result.applied,
      errors: result.errors,
    });

    if (cookieOpt?.guestSessionId) {
      addGuestCookie(response, cookieOpt.guestSessionId);
    }

    return response;
  } catch (error: any) {
    console.error("Edit artifacts error:", error);
    return createErrorResponse(error.message || "Failed to edit artifacts", 500);
  }
}
