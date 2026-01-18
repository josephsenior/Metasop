import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/auth/db";
import { generateToken, getTokenExpiration } from "@/lib/auth/jwt";
import type { RegisterRequest, LoginResponse } from "@/types/auth";

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();

    // Validation
    if (!body.email || !body.username || !body.password || !body.confirm_password) {
      return NextResponse.json(
        {
          status: "error",
          message: "All fields are required",
        },
        { status: 400 }
      );
    }

    if (body.password !== body.confirm_password) {
      return NextResponse.json(
        {
          status: "error",
          message: "Passwords do not match",
        },
        { status: 400 }
      );
    }

    if (body.password.length < 8) {
      return NextResponse.json(
        {
          status: "error",
          message: "Password must be at least 8 characters long",
        },
        { status: 400 }
      );
    }

    // Create user
    const user = await db.createUser({
      email: body.email,
      username: body.username,
      name: body.name,
      password: body.password, // Will be hashed in createUser
    });

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
      message: "User registered successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "Registration failed",
      },
      { status: 400 }
    );
  }
}

