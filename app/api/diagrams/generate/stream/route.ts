import { NextRequest, NextResponse } from "next/server";
import { addGuestCookie, createErrorResponse } from "@/lib/api/response";
import { handleGuestAuth } from "@/lib/middleware/guest-auth";
import { getGenerationJob, subscribeToJob } from "@/lib/diagrams/generation-queue";

function isTerminalEvent(eventType?: string): boolean {
  return eventType === "orchestration_complete" || eventType === "orchestration_failed";
}

export async function GET(request: NextRequest) {
  const guestAuth = await handleGuestAuth(request);
  const cookieOpt = guestAuth.sessionId ? { guestSessionId: guestAuth.sessionId } : undefined;
  if (!guestAuth.canProceed || !guestAuth.userId) {
    return createErrorResponse(guestAuth.reason || "Unauthorized", 401, cookieOpt);
  }

  const jobId = request.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return createErrorResponse("Missing jobId", 400, cookieOpt);
  }

  const job = getGenerationJob(jobId);
  if (!job || job.userId !== guestAuth.userId) {
    return createErrorResponse("Job not found", 404, cookieOpt);
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let isClosed = false;
      let keepAliveInterval: NodeJS.Timeout | undefined;

      const safeEnqueue = (payload: any) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          isClosed = true;
        }
      };

      let unsubscribe: (() => void) | null = null;

      const safeClose = () => {
        if (isClosed) return;
        isClosed = true;
        if (keepAliveInterval) clearInterval(keepAliveInterval);
        if (unsubscribe) unsubscribe();
        try {
          controller.close();
        } catch {
          // ignore
        }
      };

      unsubscribe = subscribeToJob(jobId, (event) => {
        safeEnqueue(event);
        if (isTerminalEvent(event.type)) {
          safeClose();
        }
      });

      if (!unsubscribe) {
        safeEnqueue({ type: "orchestration_failed", error: "Job not found", timestamp: new Date().toISOString() });
        safeClose();
        return;
      }

      keepAliveInterval = setInterval(() => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        } catch {
          safeClose();
        }
      }, 15000);
    },
  });

  const response = new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });

  if (cookieOpt?.guestSessionId) addGuestCookie(response, cookieOpt.guestSessionId);

  return response;
}
