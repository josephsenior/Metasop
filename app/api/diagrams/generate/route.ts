import { NextRequest } from "next/server";
import { z } from "zod";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/response";
import { handleGuestAuth, checkGuestDiagramLimit } from "@/lib/middleware/guest-auth";
import { diagramDb } from "@/lib/diagrams/db";
import { checkDatabaseHealth } from "@/lib/database/prisma";
import type { CreateDiagramRequest } from "@/types/diagram";
import { validateCreateDiagramRequest } from "@/lib/diagrams/schemas";
import { createRequestLogger } from "@/lib/monitoring/logger";
import { metrics, MetricNames } from "@/lib/monitoring/metrics";
import { createGenerationJob, startGenerationJob } from "@/lib/diagrams/generation-queue";

/**
 * POST /api/diagrams/generate - Generate diagrams using MetaSOP multi-agent system
 * 
 * This endpoint uses the integrated MetaSOP orchestrator to generate diagrams
 * using the multi-agent orchestration system.
 * 
 * Supports both authenticated users and guest users (with limits).
 */
export const maxDuration = 900; // 15 minutes

export async function POST(request: NextRequest) {
  const requestLogger = createRequestLogger(request);
  const startTime = Date.now();

  try {
    const guestAuth = await handleGuestAuth(request);
    const cookieOpt = guestAuth.sessionId ? { guestSessionId: guestAuth.sessionId } : undefined;
    if (!guestAuth.canProceed || !guestAuth.userId) {
      return createErrorResponse(guestAuth.reason || "Unauthorized", 401, cookieOpt);
    }
    const userId = guestAuth.userId;

    const guestCheck = await checkGuestDiagramLimit(request);
    if (!guestCheck.allowed) {
      metrics.increment(MetricNames.RATE_LIMIT_EXCEEDED, 1, { endpoint: "diagrams.generate", type: "guest_limit" });
      return createErrorResponse(
        guestCheck.reason || "Guest diagram limit reached. Create more after a while.",
        403,
        cookieOpt
      );
    }
    const guestSessionId = guestCheck.sessionId;

    const rawBody = await request.json();

    let body: CreateDiagramRequest;
    try {
      body = validateCreateDiagramRequest(rawBody);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        metrics.increment(MetricNames.API_ERROR, 1, { endpoint: "diagrams.generate", error: "validation" });
        return createErrorResponse(
          `Invalid request: ${error.errors.map((e) => e.message).join(", ")}`,
          400,
          cookieOpt
        );
      }
      metrics.increment(MetricNames.API_ERROR, 1, { endpoint: "diagrams.generate", error: "parse" });
      return createErrorResponse("Invalid request format", 400, cookieOpt);
    }

    const dbHealth = await checkDatabaseHealth();
    if (!dbHealth.healthy) {
      requestLogger.error("Database unavailable before orchestration", undefined, { error: dbHealth.error });
      return createErrorResponse(
        `Database unavailable: ${dbHealth.error ?? "connection failed"}`,
        503,
        cookieOpt
      );
    }

    requestLogger.info("Starting diagram generation", { userId });

    const createdDiagram = await diagramDb.create(userId, {
      prompt: body.prompt,
      options: body.options,
      documents: body.documents,
      clarificationAnswers: body.clarificationAnswers,
    });

    const job = createGenerationJob(userId, createdDiagram.id);

    startGenerationJob({
      jobId: job.id,
      userId,
      diagramId: createdDiagram.id,
      prompt: body.prompt,
      options: body.options,
      documents: body.documents,
      clarificationAnswers: body.clarificationAnswers,
      guestSessionId,
    });

    metrics.increment(MetricNames.DIAGRAM_GENERATED, 1, { success: "true", isGuest: "true" });

    const responseTime = Date.now() - startTime;
    metrics.timing(MetricNames.API_RESPONSE_TIME, responseTime, { endpoint: "diagrams.generate" });

    return createSuccessResponse(
      {
        jobId: job.id,
        diagramId: createdDiagram.id,
        streamUrl: `/api/diagrams/generate/stream?jobId=${job.id}`,
      },
      undefined,
      cookieOpt
    );
  } catch (error: any) {
    metrics.increment(MetricNames.API_ERROR, 1, { endpoint: "diagrams.generate", error: "unexpected" });
    requestLogger.error("Unexpected error in diagram generation", error);
    return createErrorResponse(
      error.message || "An unexpected error occurred",
      500
    );
  }
}
