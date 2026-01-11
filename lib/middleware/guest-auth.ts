/**
 * Middleware to handle guest authentication and limits
 */

import { NextRequest } from "next/server";
import {
  getGuestSession,
  canGuestCreateDiagram,
  incrementGuestDiagramCount,
  getGuestSessionInfo,
} from "@/lib/guest/limits";

export interface GuestAuthResult {
  isGuest: boolean;
  userId?: string;
  sessionId?: string;
  canProceed: boolean;
  reason?: string;
  sessionInfo?: {
    diagramsCreated: number;
    diagramsRemaining: number;
    canCreateMore: boolean;
  };
}

/**
 * Extract guest session ID from request
 */
function getGuestSessionId(request: NextRequest): string | undefined {
  // Try to get from cookie
  const cookie = request.cookies.get("guest_session_id");
  if (cookie) return cookie.value;

  // Try to get from header
  const header = request.headers.get("x-guest-session-id");
  if (header) return header;

  return undefined;
}

/**
 * Get IP address from request
 */
function getIpAddress(request: NextRequest): string | undefined {
  // Try various headers (for proxies/load balancers)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return undefined;
}

/**
 * Check if request is from authenticated user
 */
function isAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  return !!(authHeader && authHeader.startsWith("Bearer "));
}

/**
 * Middleware to handle guest authentication
 */
export async function handleGuestAuth(
  request: NextRequest,
  requireAuth: boolean = false
): Promise<GuestAuthResult> {
  // Check if user is authenticated
  if (isAuthenticated(request)) {
    // User is authenticated, extract userId from token if needed
    // For now, we'll just return that they're not a guest
    return {
      isGuest: false,
      canProceed: true,
    };
  }

  // User is not authenticated
  if (requireAuth) {
    return {
      isGuest: true,
      canProceed: false,
      reason: "Authentication required. Please sign up or log in.",
    };
  }

  // Allow guest access
  const sessionId = getGuestSessionId(request);
  const ipAddress = getIpAddress(request);
  const session = getGuestSession(sessionId, ipAddress);

  const sessionInfo = getGuestSessionInfo(session.sessionId);

  return {
    isGuest: true,
    sessionId: session.sessionId,
    canProceed: true,
    sessionInfo: sessionInfo || undefined,
  };
}

/**
 * Check if guest can create a diagram
 */
export async function checkGuestDiagramLimit(
  request: NextRequest
): Promise<{ allowed: boolean; reason?: string; sessionId?: string }> {
  // In dev mode, always allow
  if (process.env.DEV_MODE === "true") {
    return { allowed: true, sessionId: "dev-session" };
  }

  const authResult = await handleGuestAuth(request, false);

  if (!authResult.isGuest) {
    // Authenticated user, no limits
    return { allowed: true };
  }

  if (!authResult.sessionId) {
    return { allowed: false, reason: "Invalid session" };
  }

  const session = getGuestSession(authResult.sessionId);
  const check = canGuestCreateDiagram(session);

  return {
    allowed: check.allowed,
    reason: check.reason,
    sessionId: authResult.sessionId,
  };
}

/**
 * Record diagram creation for guest
 */
export function recordGuestDiagramCreation(sessionId: string): void {
  incrementGuestDiagramCount(sessionId);
}

