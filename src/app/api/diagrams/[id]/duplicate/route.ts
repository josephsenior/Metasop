import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/response";
import { handleGuestAuth } from "@/lib/middleware/guest-auth";
import { diagramDb } from "@/lib/diagrams/db";

/**
 * POST /api/diagrams/[id]/duplicate - Duplicate a diagram
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guestAuth = await handleGuestAuth(request);
    const cookieOpt = guestAuth.sessionId ? { guestSessionId: guestAuth.sessionId } : undefined;
    if (!guestAuth.canProceed || !guestAuth.userId) {
      return createErrorResponse(guestAuth.reason || "Unauthorized", 401, cookieOpt);
    }
    const userId = guestAuth.userId;

    const { id } = await params;
    const duplicated = await diagramDb.duplicate(id, userId);

    return createSuccessResponse(
      { diagram: duplicated },
      "Diagram duplicated successfully",
      cookieOpt
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return createErrorResponse("Unauthorized", 401);
    }
    if (error.message === "Diagram not found") {
      return createErrorResponse("Diagram not found", 404);
    }
    return createErrorResponse(error.message || "Failed to duplicate diagram", 500);
  }
}

