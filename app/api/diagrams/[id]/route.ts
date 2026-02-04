import { NextRequest } from "next/server";
import * as fs from 'fs';
import * as path from 'path';
import { createErrorResponse, createSuccessResponse } from "@/lib/api/response";
import { handleGuestAuth } from "@/lib/middleware/guest-auth";
import { diagramDb } from "@/lib/diagrams/db";

/**
 * GET /api/diagrams/[id] - Get a specific diagram
 */
export async function GET(
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

    const resolvedParams = await params;
    const diagram = await diagramDb.findById(resolvedParams.id, userId);

    if (!diagram) {
      return createErrorResponse("Diagram not found", 404, cookieOpt);
    }

    const response = createSuccessResponse({ diagram }, undefined, cookieOpt);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;
  } catch (error: any) {
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
    const guestAuth = await handleGuestAuth(request);
    const cookieOpt = guestAuth.sessionId ? { guestSessionId: guestAuth.sessionId } : undefined;
    if (!guestAuth.canProceed || !guestAuth.userId) {
      return createErrorResponse(guestAuth.reason || "Unauthorized", 401, cookieOpt);
    }
    const userId = guestAuth.userId;

    const resolvedParams = await params;
    const body = await request.json();
    const diagram = await diagramDb.update(resolvedParams.id, userId, body);

    // Save to local filesystem (Shadow Persistence)
    try {
      const saveDir = path.join(process.cwd(), 'saved_diagrams');
      if (!fs.existsSync(saveDir)) {
        fs.mkdirSync(saveDir, { recursive: true });
      }
      fs.writeFileSync(
        path.join(saveDir, `${diagram.id}.json`),
        JSON.stringify(diagram, null, 2)
      );
    } catch (error) {
      console.error("Failed to save local backup:", error);
      // Non-blocking error
    }

    return createSuccessResponse({ diagram }, undefined, cookieOpt);
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guestAuth = await handleGuestAuth(request);
    const cookieOpt = guestAuth.sessionId ? { guestSessionId: guestAuth.sessionId } : undefined;
    if (!guestAuth.canProceed || !guestAuth.userId) {
      return createErrorResponse(guestAuth.reason || "Unauthorized", 401, cookieOpt);
    }
    const userId = guestAuth.userId;

    const resolvedParams = await params;
    await diagramDb.delete(resolvedParams.id, userId);

    return createSuccessResponse({ message: "Diagram deleted successfully" }, undefined, cookieOpt);
  } catch (error: any) {
    if (error.message === "Diagram not found") {
      return createErrorResponse("Diagram not found", 404);
    }
    return createErrorResponse(error.message || "Failed to delete diagram", 500);
  }
}

