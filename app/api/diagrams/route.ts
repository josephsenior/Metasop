import { NextRequest } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from "@/lib/auth/middleware";
import { diagramDb } from "@/lib/diagrams/db";
import type { CreateDiagramRequest } from "@/types/diagram";
import { validateCreateDiagramRequest } from "@/lib/diagrams/schemas";

/**
 * GET /api/diagrams - Get all diagrams for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : undefined;
    const status = searchParams.get("status") as "processing" | "completed" | "failed" | undefined;

    const result = await diagramDb.findByUserId(user.userId, {
      limit,
      offset,
      status,
    });

    return createSuccessResponse(result);
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
    const user = getAuthenticatedUser(request);
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
    const diagram = await diagramDb.create(user.userId, body);

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

