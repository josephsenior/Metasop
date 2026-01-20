import { NextRequest } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from "@/lib/auth/middleware";
import { handleGuestAuth } from "@/lib/middleware/guest-auth";
import { diagramDb } from "@/lib/diagrams/db";
import type { UpdateDiagramRequest } from "@/types/diagram";
import { validateUpdateDiagramRequest } from "@/lib/diagrams/schemas";

/**
 * GET /api/diagrams/[id] - Get a specific diagram
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let userId: string;
    
    try {
      const user = await getAuthenticatedUser(request);
      userId = user.userId;
    } catch (authError) {
      const guestAuth = await handleGuestAuth(request);
      if (guestAuth.isGuest && guestAuth.sessionId) {
        userId = `guest_${guestAuth.sessionId}`;
      } else {
        return createErrorResponse("Unauthorized", 401);
      }
    }

    const { id } = await params;
    const diagram = await diagramDb.findById(id, userId);

    if (!diagram) {
      return createErrorResponse("Diagram not found", 404);
    }

    return createSuccessResponse({ diagram });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return createErrorResponse("Unauthorized", 401);
    }
    return createErrorResponse(error.message || "Failed to fetch diagram", 500);
  }
}

/**
 * PATCH /api/diagrams/[id] - Update a diagram
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let userId: string;
    
    try {
      const user = await getAuthenticatedUser(request);
      userId = user.userId;
    } catch (authError) {
      const guestAuth = await handleGuestAuth(request);
      if (guestAuth.isGuest && guestAuth.sessionId) {
        userId = `guest_${guestAuth.sessionId}`;
      } else {
        return createErrorResponse("Unauthorized", 401);
      }
    }

    const { id } = await params;
    let body: UpdateDiagramRequest = await request.json();
    
    // Validate request data
    try {
      body = validateUpdateDiagramRequest(body);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return createErrorResponse(
          `Invalid request: ${error.errors.map((e) => e.message).join(", ")}`,
          400
        );
      }
      return createErrorResponse("Invalid request format", 400);
    }

    const diagram = await diagramDb.update(id, userId, body);

    return createSuccessResponse(
      { diagram },
      "Diagram updated successfully"
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return createErrorResponse("Unauthorized", 401);
    }
    if (error.message === "Diagram not found") {
      return createErrorResponse("Diagram not found", 404);
    }
    return createErrorResponse(error.message || "Failed to update diagram", 500);
  }
}

/**
 * DELETE /api/diagrams/[id] - Delete a diagram
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let userId: string;
    
    try {
      const user = await getAuthenticatedUser(request);
      userId = user.userId;
    } catch (authError) {
      const guestAuth = await handleGuestAuth(request);
      if (guestAuth.isGuest && guestAuth.sessionId) {
        userId = `guest_${guestAuth.sessionId}`;
      } else {
        return createErrorResponse("Unauthorized", 401);
      }
    }

    const { id } = await params;
    await diagramDb.delete(id, userId);

    return createSuccessResponse(null, "Diagram deleted successfully");
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return createErrorResponse("Unauthorized", 401);
    }
    if (error.message === "Diagram not found") {
      return createErrorResponse("Diagram not found", 404);
    }
    return createErrorResponse(error.message || "Failed to delete diagram", 500);
  }
}

