import { NextRequest, NextResponse } from "next/server";
import { verifyToken, type TokenPayload } from "@/lib/auth/jwt";

export interface AuthenticatedRequest extends NextRequest {
  user?: TokenPayload;
}

/**
 * Middleware helper to extract and verify JWT token from request
 * In development mode (DEV_MODE=true), returns a mock user without requiring auth
 */
export function getAuthenticatedUser(request: NextRequest): TokenPayload {
  // Development mode: bypass authentication
  if (process.env.DEV_MODE === "true") {
    return {
      userId: "dev-user-123",
      email: "dev@localhost",
      role: "admin",
    };
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.substring(7);
  return verifyToken(token);
}

/**
 * Create an error response
 */
export function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    {
      status: "error",
      message,
    },
    { status }
  );
}

/**
 * Create a success response
 */
export function createSuccessResponse(data: any, message?: string) {
  return NextResponse.json({
    status: "success",
    data,
    ...(message && { message }),
  });
}

