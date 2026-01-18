import { NextRequest, NextResponse } from "next/server";
import { verifyToken, generateToken, getTokenExpiration } from "@/lib/auth/jwt";
import { db } from "@/lib/auth/db";

export async function POST(request: NextRequest) {
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

    // Verify token (even if expired, we can refresh it)
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      // Token might be expired, but we can still refresh if it's valid format
      // In production, you might want to use refresh tokens instead
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid token",
        },
        { status: 401 }
      );
    }

    // Verify user still exists and is active
    const user = await db.findUserById(payload.userId);
    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          status: "error",
          message: "User not found or inactive",
        },
        { status: 401 }
      );
    }

    // Generate new token
    const newToken = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const expiresIn = getTokenExpiration();

    return NextResponse.json({
      status: "success",
      data: {
        token: newToken,
        expires_in: expiresIn,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "Failed to refresh token",
      },
      { status: 500 }
    );
  }
}

