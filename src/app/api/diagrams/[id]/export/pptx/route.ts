import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api/response";
import { handleGuestAuth } from "@/lib/middleware/guest-auth";
import { diagramDb } from "@/lib/diagrams/db";
import { PPTXGeneratorScreenshot } from "@/lib/generators/pptx-generator-screenshot";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { canProceed, userId: authedUserId, reason, sessionId } = await handleGuestAuth(request);
        const cookieOpt = sessionId ? { guestSessionId: sessionId } : undefined;

        // We allow guests to export diagrams they own (or if authentication is disabled/optional in this context)
        // The handleGuestAuth logic already verifies ownership if the diagram belongs to a guest user
        if (!canProceed || !authedUserId) {
            return createErrorResponse(reason || "Unauthorized", 401, cookieOpt);
        }
        const userId = authedUserId;
        const { id: diagramId } = await params;

        // Fetch the diagram
        const diagram = await diagramDb.findById(diagramId);

        if (!diagram) {
            return createErrorResponse("Diagram not found", 404, cookieOpt);
        }

        // Verify ownership
        if (diagram.userId !== userId) {
            // Fallback: Check query param for guest session (common for file downloads where cookies might get mishandled)
            const { searchParams } = new URL(request.url);
            const paramSessionId = searchParams.get('guestSessionId');

            if (paramSessionId) {
                // Manually verify if this session ID owns the diagram
                const paramUserId = paramSessionId.startsWith("guest_")
                    ? paramSessionId
                    : `guest_${paramSessionId}`;

                if (paramUserId !== diagram.userId) {
                    return createErrorResponse("Unauthorized access to this diagram", 403, cookieOpt);
                }
                // If match, allow proceed
            } else {
                return createErrorResponse("Unauthorized access to this diagram", 403, cookieOpt);
            }
        }

        // Generate PPTX with screenshot-based rendering
        const generator = new PPTXGeneratorScreenshot(diagram);
        const buffer = await generator.generate();

        // Return as downloadable file
        // Note: Buffer from pptxgenjs needs to be sent correctly
        const filename = `${diagram.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'diagram'}.pptx`;

        return new NextResponse(buffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'Content-Disposition': `attachment; filename="${filename}"`,
                // Include guest cookie if needed
                ...(cookieOpt?.guestSessionId ? { 'Set-Cookie': `guest_session_id=${cookieOpt.guestSessionId}; Path=/; HttpOnly; SameSite=Lax` } : {})
            }
        });

    } catch (error: any) {
        console.error("PPTX Export Error:", error);
        return createErrorResponse(error.message || "Failed to export PPTX", 500);
    }
}
