import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/auth/db";
import type { ResetPasswordRequest } from "@/types/auth";

export async function POST(request: NextRequest) {
  try {
    const body: ResetPasswordRequest = await request.json();

    // Validation
    if (!body.email || !body.reset_token || !body.new_password || !body.confirm_password) {
      return NextResponse.json(
        {
          status: "error",
          message: "All fields are required",
        },
        { status: 400 }
      );
    }

    if (body.new_password !== body.confirm_password) {
      return NextResponse.json(
        {
          status: "error",
          message: "Passwords do not match",
        },
        { status: 400 }
      );
    }

    if (body.new_password.length < 8) {
      return NextResponse.json(
        {
          status: "error",
          message: "Password must be at least 8 characters long",
        },
        { status: 400 }
      );
    }

    // Verify reset token
    const emailFromToken = await db.verifyResetToken(body.reset_token);
    if (!emailFromToken) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid or expired reset token",
        },
        { status: 400 }
      );
    }

    // Verify email matches token
    if (emailFromToken !== body.email) {
      return NextResponse.json(
        {
          status: "error",
          message: "Email does not match reset token",
        },
        { status: 400 }
      );
    }

    // Update password
    await db.updateUserPassword(body.email, body.new_password);

    // Delete reset token (one-time use)
    await db.deleteResetToken(body.reset_token);

    return NextResponse.json({
      status: "success",
      message: "Password has been reset successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "Failed to reset password",
      },
      { status: 500 }
    );
  }
}

