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
  { params }: { params: { id: string } }
) {
  try {
    let userId: string;
    
    const guestAuth = await handleGuestAuth(request);
    
    if (guestAuth.isGuest) {
      if (!guestAuth.canProceed || !guestAuth.userId) {
        return createErrorResponse(guestAuth.reason || "Unauthorized", 401);
      }
      userId = guestAuth.userId;
    } else {
      const user = await getAuthenticatedUser(request);
      userId = user.userId;
    }

    const resolvedParams = await params;
    const diagram = await diagramDb.findById(resolvedParams.id, userId);

    if (!diagram) {
      return createErrorResponse("Diagram not found", 404);
    }

    return createSuccessResponse({ diagram });
  } catch (error: any) {
    return createErrorResponse(error.message || "Failed to fetch diagram", 500);
  }
}

/**
 * PATCH /api/diagrams/[id] - Update a diagram
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let userId: string;
    
    const guestAuth = await handleGuestAuth(request);
    
    if (guestAuth.isGuest) {
      if (!guestAuth.canProceed || !guestAuth.userId) {
        return createErrorResponse(guestAuth.reason || "Unauthorized", 401);
      }
      userId = guestAuth.userId;
    } else {
      const user = await getAuthenticatedUser(request);
      userId = user.userId;
    }

    const resolvedParams = await params;
    const body = await request.json();
    const diagram = await diagramDb.update(resolvedParams.id, userId, body);

    return createSuccessResponse({ diagram });
  } catch (error: any) {
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
  { params }: { params: { id: string } }
) {
  try {
    let userId: string;
    
    const guestAuth = await handleGuestAuth(request);
    
    if (guestAuth.isGuest) {
      if (!guestAuth.canProceed || !guestAuth.userId) {
        return createErrorResponse(guestAuth.reason || "Unauthorized", 401);
      }
      userId = guestAuth.userId;
    } else {
      const user = await getAuthenticatedUser(request);
      userId = user.userId;
    }

    const resolvedParams = await params;
    await diagramDb.delete(resolvedParams.id, userId);

    return createSuccessResponse({ message: "Diagram deleted successfully" });
  } catch (error: any) {
    if (error.message === "Diagram not found") {
      return createErrorResponse("Diagram not found", 404);
    }
    return createErrorResponse(error.message || "Failed to delete diagram", 500);
  }
}

