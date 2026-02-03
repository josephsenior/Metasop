import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/response";
import { handleGuestAuth } from "@/lib/middleware/guest-auth";
import { validateEditArtifactsRequest } from "@/lib/diagrams/schemas";
import { applyEditOps, type ArtifactRecord, type EditOp } from "@/lib/artifacts/edit-tools";

/**
 * POST /api/diagrams/artifacts/edit
 * Tool-based refinement: apply predefined edit ops (set_at_path, delete_at_path, add_array_item, remove_array_item)
 * to artifact JSON. Does not re-run agents; edits are deterministic and schema-safe.
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

    const ops = body.edits as EditOp[];
    const result = applyEditOps(previousArtifacts, ops);

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
    console.error("Edit artifacts error:", error);
    return createErrorResponse(error.message || "Failed to edit artifacts", 500);
  }
}
