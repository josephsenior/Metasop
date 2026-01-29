import { NextRequest } from "next/server";
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from "@/lib/auth/middleware";
import { diagramDb } from "@/lib/diagrams/db";

/**
 * GET /api/diagrams/[id]/orchestration - Get orchestration status for a diagram generation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let userId: string;
    
    try {
      const user = await getAuthenticatedUser(request);
      userId = user.userId;
    } catch {
      return createErrorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    const diagram = await diagramDb.findById(id, userId);

    if (!diagram) {
      return createErrorResponse("Diagram not found", 404);
    }

    // Extract orchestration data from diagram metadata
    const metadata = diagram.metadata as any;
    const orchestrationData = {
      status: diagram.status === "completed" ? "success" : diagram.status === "processing" ? "processing" : "failed",
      artifacts: metadata?.metasop_artifacts || {},
      report: metadata?.metasop_report || {},
      steps: extractStepsFromMetadata(metadata),
    };

    return createSuccessResponse(orchestrationData);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return createErrorResponse("Unauthorized", 401);
    }
    return createErrorResponse(error.message || "Failed to get orchestration status", 500);
  }
}

/**
 * Extract steps from diagram metadata
 */
function extractStepsFromMetadata(metadata?: any) {
  if (!metadata?.metasop_report?.events) {
    return [];
  }

  return metadata.metasop_report.events.map((event: any, index: number) => ({
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

