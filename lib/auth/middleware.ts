import { NextRequest, NextResponse } from "next/server";
import { verifyToken, type TokenPayload } from "@/lib/auth/jwt";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./options";

export interface AuthenticatedRequest extends NextRequest {
  user?: TokenPayload;
}

/**
 * Middleware helper to extract and verify JWT token from request
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<TokenPayload> {
  // 1. Try Bearer Token (Custom JWT)
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      return verifyToken(token);
    } catch {
      // If token is invalid, don't immediately fail, try session
      console.warn("Invalid Bearer token, trying session...");
    }
  }

  // 2. Try NextAuth Session
  const session = await getServerSession(authOptions);
  
  if (session?.user) {
    const user = session.user as any;
    return {
      userId: user.id || "",
      email: user.email || "",
      role: user.role || "user",
    };
  }

  throw new Error("Unauthorized");
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

