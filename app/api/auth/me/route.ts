import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/auth/db";
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from "@/lib/auth/middleware";

export async function GET(request: NextRequest) {
  try {
    const authenticatedUser = await getAuthenticatedUser(request);
    
    // Get user from database
    const user = await db.findUserById(authenticatedUser.userId);
    if (!user) {
      return createErrorResponse("User not found", 404);
    }

    if (!user.isActive) {
      return createErrorResponse("Account is deactivated", 403);
    }

    return createSuccessResponse({
      user: {
        ...user,
        password: undefined as any,
      },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return createErrorResponse("Unauthorized", 401);
    }
    return createErrorResponse(error.message || "Failed to get user", 500);
  }
}

