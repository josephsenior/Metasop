import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/auth/db";
import type { ForgotPasswordRequest } from "@/types/auth";

export async function POST(request: NextRequest) {
  try {
    const body: ForgotPasswordRequest = await request.json();

    // Validation
    if (!body.email) {
      return NextResponse.json(
        {
          status: "error",
          message: "Email is required",
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.findUserByEmail(body.email);
    
    // For security, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (user) {
      // Generate reset token
      const resetToken = await db.createResetToken(body.email);

      // In production, send email with reset link
      // For now, we'll just log it (in development)
      if (process.env.NODE_ENV === "development") {
        console.log(`Password reset token for ${body.email}: ${resetToken}`);
        console.log(`Reset link: ${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(body.email)}`);
      }

      // TODO: Send email with reset link
      // await sendPasswordResetEmail(user.email, resetToken);
    }

    return NextResponse.json({
      status: "success",
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "Failed to process request",
      },
      { status: 500 }
    );
  }
}

