import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from "@/lib/auth/middleware";
import { handleGuestAuth } from "@/lib/middleware/guest-auth";
import { diagramDb } from "@/lib/diagrams/db";
import type { CreateDiagramRequest } from "@/types/diagram";
import { validateCreateDiagramRequest } from "@/lib/diagrams/schemas";

/**
 * GET /api/diagrams - Get all diagrams for the authenticated user or guest
 */
export async function GET(request: NextRequest) {
  try {
    let userId: string;
    
    const guestAuth = await handleGuestAuth(request);
    
    if (guestAuth.isGuest) {
      if (!guestAuth.canProceed || !guestAuth.userId) {
        return createErrorResponse(guestAuth.reason || "Unauthorized", 401);
      }
      userId = guestAuth.userId;
    } else {
      // Authenticated user
      const user = await getAuthenticatedUser(request);
      userId = user.userId;

      // Check for guest session cookie to migrate diagrams if they just logged in
      const guestSessionCookie = request.cookies.get("guest_session_id");
      if (guestSessionCookie?.value) {
        const guestUserId = `guest_${guestSessionCookie.value}`;
        await diagramDb.migrateGuestDiagrams(guestUserId, userId);
      }
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : undefined;
    const status = searchParams.get("status") as "processing" | "completed" | "failed" | undefined;

    let response: NextResponse;
    const result = await diagramDb.findByUserId(userId, {
      limit,
      offset,
      status,
    });

    response = createSuccessResponse(result);

    // Clear guest session cookie after migration
    if (!guestAuth.isGuest && request.cookies.get("guest_session_id")) {
      response.cookies.set("guest_session_id", "", { maxAge: 0, path: "/" });
    }

    return response;
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

    const rawBody = await request.json();

    // Validate request using schema
    let body: CreateDiagramRequest;
    try {
      body = validateCreateDiagramRequest(rawBody);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return createErrorResponse(
          `Invalid request: ${error.errors.map((e) => e.message).join(", ")}`,
          400
        );
      }
      return createErrorResponse("Invalid request format", 400);
    }

    // Create diagram
    const diagram = await diagramDb.create(userId, body);

    return createSuccessResponse(
      { diagram },
      "Diagram created successfully"
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return createErrorResponse("Unauthorized", 401);
    }
    return createErrorResponse(error.message || "Failed to create diagram", 500);
  }
}


