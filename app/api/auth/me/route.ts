import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { db } from "@/lib/auth/db";

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          status: "error",
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify token
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid or expired token",
        },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await db.findUserById(payload.userId);
    if (!user) {
      return NextResponse.json(
        {
          status: "error",
          message: "User not found",
        },
        { status: 404 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        {
          status: "error",
          message: "Account is deactivated",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      status: "success",
      data: {
        user: {
          ...user,
          password: undefined as any,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "Failed to get user",
      },
      { status: 500 }
    );
  }
}

