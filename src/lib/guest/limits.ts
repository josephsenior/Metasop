/**
 * Guest user limits and session management
 * For unauthenticated users trying the app
 */

export interface GuestSession {
  sessionId: string;
  diagramsCreated: number;
  createdAt: number;
  lastActivity: number;
  ipAddress?: string;
}

export const GUEST_LIMITS = {
  maxDiagrams: Infinity, // Open-source: no limit
  saveEnabled: true,
  exportEnabled: true,
  sessionTimeout: 60 * 60 * 1000, // 60 minutes of inactivity
  maxSessionAge: 48 * 60 * 60 * 1000, // 48 hours total session age
} as const;

// In-memory storage for guest sessions (in production, use Redis or similar)
const guestSessions = new Map<string, GuestSession>();

/**
 * Generate a guest session ID
 */
export function generateGuestSessionId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
}

/**
 * Get or create a guest session
 */
export function getGuestSession(sessionId?: string, ipAddress?: string, overriddenSessionId?: string): GuestSession {
  if (!sessionId) {
    // Create new session
    const newSession: GuestSession = {
      sessionId: overriddenSessionId || generateGuestSessionId(),
      diagramsCreated: 0,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      ipAddress,
    };
    guestSessions.set(newSession.sessionId, newSession);
    return newSession;
  }

  // Get existing session
  const session = guestSessions.get(sessionId);
  if (!session) {
    // Session doesn't exist in memory (e.g. server restart)
    // TRUST the provided session ID and re-initialize it
    return getGuestSession(undefined, ipAddress, sessionId);
  }

  // Check if session is expired
  const now = Date.now();
  const isExpired =
    now - session.lastActivity > GUEST_LIMITS.sessionTimeout ||
    now - session.createdAt > GUEST_LIMITS.maxSessionAge;

  if (isExpired) {
    guestSessions.delete(sessionId);
    return getGuestSession(undefined, ipAddress);
  }

  // Update last activity
  session.lastActivity = now;
  return session;
}

/**
 * Check if guest can create a diagram (open-source: no limit)
 */
 
export function canGuestCreateDiagram(_: GuestSession): {
  allowed: boolean;
  reason?: string;
} {
  return { allowed: true };
}

/**
 * Increment diagram count for guest session
 */
export function incrementGuestDiagramCount(sessionId: string): void {
  const session = guestSessions.get(sessionId);
  if (session) {
    session.diagramsCreated++;
    session.lastActivity = Date.now();
  }
}

/**
 * Clean up expired sessions (call periodically)
 */
export function cleanupExpiredSessions(): void {
  const now = Date.now();
  for (const [sessionId, session] of guestSessions.entries()) {
    const isExpired =
      now - session.lastActivity > GUEST_LIMITS.sessionTimeout ||
      now - session.createdAt > GUEST_LIMITS.maxSessionAge;

    if (isExpired) {
      guestSessions.delete(sessionId);
    }
  }
}

/**
 * Get guest session info (open-source: no limit, always can create more)
 */
export function getGuestSessionInfo(sessionId: string): {
  diagramsCreated: number;
  diagramsRemaining: number;
  canCreateMore: boolean;
} | null {
  const session = guestSessions.get(sessionId);
  if (!session) return null;

  return {
    diagramsCreated: session.diagramsCreated,
    diagramsRemaining: Infinity,
    canCreateMore: true,
  };
}

// Clean up expired sessions every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredSessions, 5 * 60 * 1000);
}

