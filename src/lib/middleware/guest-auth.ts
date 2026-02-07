/**
 * Guest session handling (auth removed for open-source; everyone uses guest session).
 *
 * Identity: Server reads guest id from cookie first, then x-guest-session-id header.
 * API responses set the guest_session_id cookie so same-origin requests carry it
 * automatically. Frontend should still use fetchDiagramApi or apiClient so the header
 * is sent; the cookie is a fallback so new fetch calls don't forget the header.
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

function getGuestSessionId(request: NextRequest): string | undefined {
  const cookie = request.cookies.get("guest_session_id");
  if (cookie) return cookie.value;
  const header = request.headers.get("x-guest-session-id");
  if (header) return header;
  return undefined;
}

function getIpAddress(request: NextRequest): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? undefined;
}

/**
 * Resolve current "user" for diagram ownership. Auth is disabled; everyone is a guest.
 */
 
export async function handleGuestAuth(request: NextRequest): Promise<GuestAuthResult> {
  const sessionId = getGuestSessionId(request);
  const ipAddress = getIpAddress(request);
  const session = getGuestSession(sessionId, ipAddress);
  const sessionInfo = getGuestSessionInfo(session.sessionId);
  const userId = session.sessionId.startsWith("guest_")
    ? session.sessionId
    : `guest_${session.sessionId}`;

  return {
    isGuest: true,
    sessionId: session.sessionId,
    userId,
    canProceed: true,
    sessionInfo: sessionInfo ?? undefined,
  };
}

export async function checkGuestDiagramLimit(
  request: NextRequest
): Promise<{ allowed: boolean; reason?: string; sessionId?: string }> {
  const authResult = await handleGuestAuth(request);
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

export function recordGuestDiagramCreation(sessionId: string): void {
  incrementGuestDiagramCount(sessionId);
}
