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
  maxDiagrams: 2, // Limit for guests
  saveEnabled: false, // Guests cannot save to DB permanently
  exportEnabled: true, // Guests can export
  sessionTimeout: 30 * 60 * 1000, // 30 minutes of inactivity
  maxSessionAge: 24 * 60 * 60 * 1000, // 24 hours total session age
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
export function getGuestSession(sessionId?: string, ipAddress?: string): GuestSession {
  if (!sessionId) {
    // Create new session
    const newSession: GuestSession = {
      sessionId: generateGuestSessionId(),
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
    // Session expired or doesn't exist, create new one
    return getGuestSession(undefined, ipAddress);
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
 * Check if guest can create a diagram
 */
export function canGuestCreateDiagram(session: GuestSession): {
  allowed: boolean;
  reason?: string;
} {
  if (session.diagramsCreated >= GUEST_LIMITS.maxDiagrams) {
    return {
      allowed: false,
      reason: `You've reached the limit of ${GUEST_LIMITS.maxDiagrams} diagrams. Please sign up to create more.`,
    };
  }

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
 * Get guest session info
 */
export function getGuestSessionInfo(sessionId: string): {
  diagramsCreated: number;
  diagramsRemaining: number;
  canCreateMore: boolean;
} | null {
  // In dev mode, always allow
  if (process.env.DEV_MODE === "true") {
    return {
      diagramsCreated: 0,
      diagramsRemaining: Infinity,
      canCreateMore: true,
    };
  }

  const session = guestSessions.get(sessionId);
  if (!session) return null;

  return {
    diagramsCreated: session.diagramsCreated,
    diagramsRemaining: Math.max(0, GUEST_LIMITS.maxDiagrams - session.diagramsCreated),
    canCreateMore: session.diagramsCreated < GUEST_LIMITS.maxDiagrams,
  };
}

// Clean up expired sessions every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredSessions, 5 * 60 * 1000);
}

