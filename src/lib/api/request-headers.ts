/**
 * Shared request headers for all API calls (axios and fetch).
 * Single source of truth for guest session header so diagram and orchestration
 * calls behave consistently. No login/auth; guest session only.
 */

import { ensureGuestSessionId } from "./guest-session";

/**
 * Build common headers for diagram/orchestration API requests.
 * Always sends x-guest-session-id (guest session only; no auth).
 */
export function getRequestHeaders(
  overrides?: Record<string, string>
): Record<string, string> {
  const base: Record<string, string> = {
    "Content-Type": "application/json",
    "x-guest-session-id": ensureGuestSessionId(),
  };
  if (overrides) {
    return { ...base, ...overrides };
  }
  return base;
}
