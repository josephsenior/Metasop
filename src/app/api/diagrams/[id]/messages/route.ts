
import { NextRequest } from "next/server";
import { z } from "zod";
import { createErrorResponse, createSuccessResponse } from "@/lib/api/response";
import { handleGuestAuth } from "@/lib/middleware/guest-auth";
import { diagramDb } from "@/lib/diagrams/db";

// Minimal validation for a chat message
const messageSchema = z.object({
    id: z.string(),
    role: z.enum(["user", "assistant"]),
    content: z.string(),
    type: z.string().optional(),
    timestamp: z.string().or(z.date()).transform(val => new Date(val).toISOString())
});

/**
 * POST /api/diagrams/[id]/messages
 * Append a single message to the chat history.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const guestAuth = await handleGuestAuth(request);
        const cookieOpt = guestAuth.sessionId ? { guestSessionId: guestAuth.sessionId } : undefined;
        if (!guestAuth.canProceed || !guestAuth.userId) {
            return createErrorResponse(guestAuth.reason || "Unauthorized", 401, cookieOpt);
        }
        const userId = guestAuth.userId;
        const resolvedParams = await params;

        const body = await request.json();

        // Validate request body
        const result = messageSchema.safeParse(body.message);
        if (!result.success) {
            return createErrorResponse("Invalid message format", 400, cookieOpt);
        }
        const newMessage = result.data;

        // 1. Get current diagram
        const diagram = await diagramDb.findById(resolvedParams.id, userId);
        if (!diagram) {
            return createErrorResponse("Diagram not found", 404, cookieOpt);
        }

        // 2. Append message to history
        const history = (diagram.metadata?.chat_history as any[]) || [];
        history.push(newMessage);

        // 3. Save updated history (using merged metadata update logic)
        // Note: We only send chat_history in metadata to rely on the db.ts merge logic
        // preventing overwrite of artifacts.
        await diagramDb.update(resolvedParams.id, userId, {
            metadata: {
                chat_history: history
            }
        });

        return createSuccessResponse({ success: true }, undefined, cookieOpt);
    } catch (error: any) {
        console.error("Save message error:", error);
        return createErrorResponse(error.message || "Failed to save message", 500);
    }
}
