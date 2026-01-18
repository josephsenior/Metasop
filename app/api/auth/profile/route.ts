import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/auth/db";
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from "@/lib/auth/middleware";

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const { name, image } = body;

    if (!name && !image) {
      return createErrorResponse("No fields to update provided", 400);
    }

    const updatedUser = await db.updateUser(user.userId, {
      ...(name && { name }),
      ...(image && { image }),
    });

    if (!updatedUser) {
      return createErrorResponse("User not found", 404);
    }

    return createSuccessResponse({ user: updatedUser }, "Profile updated successfully");
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return createErrorResponse("Unauthorized", 401);
    }
    return createErrorResponse(error.message || "Failed to update profile", 500);
  }
}
