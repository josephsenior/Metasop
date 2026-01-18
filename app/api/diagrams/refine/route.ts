import { NextRequest } from "next/server";
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from "@/lib/auth/middleware";
import { refineMetaSOPArtifact } from "@/lib/metasop/orchestrator";
import { validateRefineDiagramRequest } from "@/lib/diagrams/schemas";

export const maxDuration = 300; // 5 minutes for refinement

export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.json();
        const body = validateRefineDiagramRequest(rawBody);

        // Authentication: Use user if authenticated, otherwise allow refinement for guests if diagram allows
        try {
            await getAuthenticatedUser(request);
        } catch {
            // For now, allow guest refinement if diagramId starts with guest_ or diagram_
            if (!body.diagramId.startsWith("guest_") && !body.diagramId.startsWith("diagram_")) {
                return createErrorResponse("Unauthorized", 401);
            }
        }

        // Run refinement
        const result = await refineMetaSOPArtifact(
            body.stepId,
            body.instruction,
            body.previousArtifacts,
            undefined, // onProgress
            body.cascade, // Pass cascade flag
            body.isAtomicAction // Pass atomic action flag
        );

        return createSuccessResponse(
            { result },
            "Artifact refined successfully"
        );
    } catch (error: any) {
        console.error("Refinement error:", error);
        return createErrorResponse(error.message || "Failed to refine artifact", 500);
    }
}
