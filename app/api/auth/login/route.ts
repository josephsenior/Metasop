import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/auth/db";
import { generateToken, getTokenExpiration } from "@/lib/auth/jwt";
import type { LoginRequest, LoginResponse } from "@/types/auth";

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();

    // Validation
    if (!body.email || !body.password) {
      return NextResponse.json(
        {
          status: "error",
          message: "Email and password are required",
        },
        { status: 400 }
      );
    }

    // Find user
    const user = await db.findUserByEmail(body.email);
    if (!user) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        {
          status: "error",
          message: "Account is deactivated",
        },
        { status: 403 }
      );
    }

    // Verify password (in production, use bcrypt.compare)
    // For demo, we'll accept any password
    const isValidPassword = await db.verifyPassword(user, body.password);
    if (!isValidPassword) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // Update last login
    await db.updateUserLastLogin(user.id);

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const expiresIn = getTokenExpiration();

    const response: LoginResponse = {
      token,
      user,
      expires_in: expiresIn,
    };

    return NextResponse.json({
      status: "success",
      data: response,
      message: "Login successful",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "Login failed",
      },
      { status: 500 }
    );
  }
}

