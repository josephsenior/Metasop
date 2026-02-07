import { NextRequest } from "next/server";
import { z } from "zod";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/response";
import { handleGuestAuth } from "@/lib/middleware/guest-auth";
import { diagramDb } from "@/lib/diagrams/db";
import type { CreateDiagramRequest } from "@/types/diagram";
import { validateCreateDiagramRequest } from "@/lib/diagrams/schemas";
import { persistDiagramShadow } from "@/lib/diagrams/shadow-persist";

/**
 * GET /api/diagrams - Get all diagrams for the current guest session
 */
export async function GET(request: NextRequest) {
  try {
    const guestAuth = await handleGuestAuth(request);
    const cookieOpt = guestAuth.sessionId ? { guestSessionId: guestAuth.sessionId } : undefined;
    if (!guestAuth.canProceed || !guestAuth.userId) {
      return createErrorResponse(guestAuth.reason || "Unauthorized", 401, cookieOpt);
    }
    const userId = guestAuth.userId;

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : undefined;
    const status = searchParams.get("status") as "processing" | "completed" | "failed" | undefined;

    const result = await diagramDb.findByUserId(userId, { limit, offset, status });
    return createSuccessResponse(result, undefined, cookieOpt);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return createErrorResponse("Unauthorized", 401);
    }
    return createErrorResponse(error.message || "Failed to fetch diagrams", 500);
  }
}

/**
 * POST /api/diagrams - Create a new diagram
 */
export async function POST(request: NextRequest) {
  try {
    const guestAuth = await handleGuestAuth(request);
    const cookieOpt = guestAuth.sessionId ? { guestSessionId: guestAuth.sessionId } : undefined;
    if (!guestAuth.canProceed || !guestAuth.userId) {
      return createErrorResponse(guestAuth.reason || "Unauthorized", 401, cookieOpt);
    }
    const userId = guestAuth.userId;

    const rawBody = await request.json();

    // Validate request using schema
    let body: CreateDiagramRequest;
    try {
      body = validateCreateDiagramRequest(rawBody);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return createErrorResponse(
          `Invalid request: ${error.errors.map((e) => e.message).join(", ")}`,
          400,
          cookieOpt
        );
      }
      return createErrorResponse("Invalid request format", 400, cookieOpt);
    }

    // Create diagram
    const diagram = await diagramDb.create(userId, body);

    persistDiagramShadow(diagram);

    return createSuccessResponse(
      { diagram },
      "Diagram created successfully",
      cookieOpt
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return createErrorResponse("Unauthorized", 401);
    }
    return createErrorResponse(error.message || "Failed to create diagram", 500);
  }
}


