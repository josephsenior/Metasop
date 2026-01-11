import { NextResponse } from "next/server";

export async function POST() {
  // In a real application, you might want to:
  // 1. Blacklist the token in Redis/database
  // 2. Clear session data
  // 3. Log the logout event

  // For now, logout is handled client-side by clearing the token
  // The token will expire naturally, or we can implement token blacklisting

  return NextResponse.json({
    status: "success",
    message: "Logged out successfully",
  });
}

