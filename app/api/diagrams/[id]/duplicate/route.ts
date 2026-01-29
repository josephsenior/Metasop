import { NextRequest } from "next/server";
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from "@/lib/auth/middleware";
import { diagramDb } from "@/lib/diagrams/db";

/**
 * POST /api/diagrams/[id]/duplicate - Duplicate a diagram
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let userId: string;
    
    try {
      const user = await getAuthenticatedUser(request);
      userId = user.userId;
    } catch {
      return createErrorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    const duplicated = await diagramDb.duplicate(id, userId);

    return createSuccessResponse(
      { diagram: duplicated },
      "Diagram duplicated successfully"
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

