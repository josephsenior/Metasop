/**
 * Client-side guest session management
 */

const GUEST_SESSION_KEY = "guest_session_id";

/**
 * Get the guest session ID from local storage
 */
export function getGuestSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(GUEST_SESSION_KEY);
}

/**
 * Set the guest session ID in local storage
 */
export function setGuestSessionId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_SESSION_KEY, id);
}

/**
 * Ensure a guest session ID exists and return it
 */
export function ensureGuestSessionId(): string {
  let id = getGuestSessionId();
  if (!id) {
    id = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    setGuestSessionId(id);
  }
  return id;
}
