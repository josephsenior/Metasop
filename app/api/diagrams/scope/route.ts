import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/response";
import { handleGuestAuth } from "@/lib/middleware/guest-auth";
import { validateScopeRequest } from "@/lib/diagrams/schemas";
import { scopePrompt } from "@/lib/metasop/scoping";

/**
 * POST /api/diagrams/scope
 * Decide whether to proceed with generation or return clarification questions.
 * When the agent needs more info, it returns questions (id, label, options) for the user to select.
 */
export async function POST(request: NextRequest) {
  try {
    const guestAuth = await handleGuestAuth(request);
    const cookieOpt = guestAuth.sessionId ? { guestSessionId: guestAuth.sessionId } : undefined;
    if (!guestAuth.canProceed) {
      return createErrorResponse(guestAuth.reason || "Unauthorized", 401, cookieOpt);
    }

    const rawBody = await request.json();
    const body = validateScopeRequest(rawBody);

    const result = await scopePrompt(body.prompt);

    return createSuccessResponse(result, undefined, cookieOpt);
  } catch (error: any) {
    console.error("Scope error:", error);
    return createErrorResponse(error.message || "Scope failed", 500);
  }
}
