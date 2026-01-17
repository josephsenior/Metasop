import { NextRequest } from "next/server";
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from "@/lib/auth/middleware";
import { prisma } from "@/lib/database/prisma";
import { validateCreateDocumentRequest } from "@/lib/diagrams/schemas";

/**
 * GET /api/diagrams/[id]/documents
 * Get all documents for a diagram
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = getAuthenticatedUser(request);

        // Check if diagram belongs to user
        const diagram = await (prisma as any).diagram.findUnique({
            where: { id, user_id: user.userId },
            include: { documents: true }
        });

        if (!diagram) {
            return createErrorResponse("Diagram not found", 404);
        }

        return createSuccessResponse({ documents: (diagram as any).documents }, "Documents retrieved successfully");
    } catch (error: any) {
        return createErrorResponse(error.message || "Failed to retrieve documents", 500);
    }
}

/**
 * POST /api/diagrams/[id]/documents
 * Upload/Add a new document to a diagram
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = getAuthenticatedUser(request);

        const rawBody = await request.json();
        const body = validateCreateDocumentRequest(rawBody);

        // Check if diagram belongs to user
        const diagram = await (prisma as any).diagram.findUnique({
            where: { id, user_id: user.userId }
        });

        if (!diagram) {
            return createErrorResponse("Diagram not found", 404);
        }

        const document = await (prisma as any).document.create({
            data: {
                diagram_id: id,
                name: body.name,
                type: body.type,
                content: body.content,
                url: body.url
            }
        });

        return createSuccessResponse({ document }, "Document added successfully");
    } catch (error: any) {
        return createErrorResponse(error.message || "Failed to add document", 500);
    }
}
