/**
 * Thin wrapper around fetch for diagram/orchestration APIs.
 * Applies getRequestHeaders() so auth/guest and error handling stay consistent
 * with apiClient (axios) usage.
 *
 * Guest/session identity: Use this or apiClient for ALL diagram API calls.
 * Same-origin requests also get guest id via the cookie (Set-Cookie from API);
 * the header is still sent so identity is never forgotten when adding new fetch calls.
 */

import { getRequestHeaders } from "./request-headers";

/**
 * Fetch with shared diagram API headers (guest session or auth).
 * Use for all /api/diagrams/* and orchestration calls that need streaming
 * or raw fetch instead of axios. Do not use raw fetch for diagram APIs.
 */
export async function fetchDiagramApi(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const overrides: Record<string, string> = {};
  if (init?.headers) {
    const h = new Headers(init.headers);
    h.forEach((value, key) => {
      overrides[key] = value;
    });
  }
  const headers = new Headers(getRequestHeaders(overrides));
  return fetch(input, { ...init, headers });
}
