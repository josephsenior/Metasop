import { NextResponse } from "next/server";

const GUEST_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 365, // 1 year
  httpOnly: true,
};

/** Set-Cookie header value for guest session (for Response that doesn't use .cookies). */
export function getGuestCookieHeader(guestSessionId: string): string {
  return `guest_session_id=${encodeURIComponent(guestSessionId)}; Path=/; SameSite=Lax; Max-Age=${GUEST_COOKIE_OPTIONS.maxAge}; HttpOnly`;
}

/** Add guest session cookie to any response (e.g. streaming). Export for use in routes that return custom NextResponse. */
export function addGuestCookie(response: NextResponse, guestSessionId: string): NextResponse {
  response.cookies.set("guest_session_id", guestSessionId, GUEST_COOKIE_OPTIONS);
  return response;
}

function withGuestCookie(response: NextResponse, guestSessionId: string): NextResponse {
  return addGuestCookie(response, guestSessionId);
}

export type ResponseOptions = { guestSessionId?: string };

/**
 * Create an error response. Pass guestSessionId to set the guest cookie so same-origin requests carry it.
 */
export function createErrorResponse(
  message: string,
  status: number = 400,
  options?: ResponseOptions
) {
  const response = NextResponse.json(
    { status: "error", message },
    { status }
  );
  if (options?.guestSessionId) return withGuestCookie(response, options.guestSessionId);
  return response;
}

/**
 * Create a success response. Pass guestSessionId to set the guest cookie so same-origin requests carry it.
 */
export function createSuccessResponse(
  data: unknown,
  message?: string,
  options?: ResponseOptions
) {
  const response = NextResponse.json({
    status: "success",
    data,
    ...(message && { message }),
  });
  if (options?.guestSessionId) return withGuestCookie(response, options.guestSessionId);
  return response;
}
