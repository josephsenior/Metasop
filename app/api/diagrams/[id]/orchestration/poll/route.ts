import { NextRequest } from "next/server";
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from "@/lib/auth/middleware";
import { diagramDb } from "@/lib/diagrams/db";

/**
 * GET /api/diagrams/[id]/orchestration/poll - Poll for orchestration updates
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const lastStepId = searchParams.get("last_step_id") || undefined;

    const diagram = await diagramDb.findById(id, user.userId);

    if (!diagram) {
      return createErrorResponse("Diagram not found", 404);
    }

    // Extract orchestration data from diagram metadata
    const metadata = diagram.metadata as any;
    const orchestrationData = {
      status: diagram.status === "completed" ? "success" : diagram.status === "processing" ? "processing" : "failed",
      artifacts: metadata?.metasop_artifacts || {},
      report: metadata?.metasop_report || {},
      steps: extractStepsFromMetadata(metadata, lastStepId),
    };

    return createSuccessResponse(orchestrationData);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return createErrorResponse("Unauthorized", 401);
    }
    return createErrorResponse(error.message || "Failed to poll orchestration", 500);
  }
}

/**
 * Extract steps from diagram metadata, optionally filtering by lastStepId
 */
function extractStepsFromMetadata(metadata?: any, lastStepId?: string) {
  if (!metadata?.metasop_report?.events) {
    return [];
  }

  let events = metadata.metasop_report.events;

  // Filter events after lastStepId if provided
  if (lastStepId) {
    const lastIndex = events.findIndex((e: any) => e.step_id === lastStepId);
    if (lastIndex >= 0) {
      events = events.slice(lastIndex + 1);
    }
  }

  return events.map((event: any, index: number) => ({
    step_id: event.step_id || `step_${index}`,
    role: event.role || "Unknown",
    status: mapStatus(event.status),
    timestamp: new Date().toISOString(),
  }));
}

function mapStatus(status: string): "pending" | "running" | "success" | "failed" {
  if (status === "executed" || status === "success") return "success";
  if (status === "failed") return "failed";
  if (status === "running") return "running";
  return "pending";
}

