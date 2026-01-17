import { NextRequest } from "next/server";
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from "@/lib/auth/middleware";
import { generateWithLLM, createCacheWithLLM } from "@/lib/metasop/utils/llm-helper";
import { validateAskQuestionRequest } from "@/lib/diagrams/schemas";

export const maxDuration = 60; // 1 minute for Q&A

export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.json();
        const body = validateAskQuestionRequest(rawBody);

        // Authentication: Optional for Q&A, but check if diagram exists/is guest
        try {
            getAuthenticatedUser(request);
        } catch {
            if (!body.diagramId.startsWith("guest_")) {
                return createErrorResponse("Unauthorized", 401);
            }
        }

        const systemInstruction = `
You are an expert Software Architect and Project Manager assistant. 
You have full context of a project's technical artifacts including PM specifications, architecture design, DevOps infrastructure, security protocols, and engineering implementation.
Provide detailed, accurate answers based ONLY on the provided project context.
If the answer is not in the context, be honest and say you don't have that specific information yet.
Use a professional, helpful tone. Keep the response concise but informative.
`.trim();

        let cacheId = body.cacheId;

        // If no cacheId is provided and we have significant context, create a cache
        // Gemini cache minimum is 32k tokens, but for our case, any large context benefits from caching
        // especially in multi-turn conversations.
        if (!cacheId && body.contextMarkdown.length > 2000) {
            try {
                console.log(`[Ask] Creating context cache for diagram ${body.diagramId} (${body.contextMarkdown.length} chars)`);
                cacheId = await createCacheWithLLM(
                    body.contextMarkdown,
                    systemInstruction,
                    3600 // 1 hour TTL
                );
            } catch (cacheError) {
                console.warn("[Ask] Failed to create cache, falling back to standard prompt:", cacheError);
                // Continue without cache
            }
        }

        const prompt = cacheId 
            ? `USER QUESTION: "${body.question}"\n\n${body.activeTab && body.activeTab !== 'summary' && body.activeTab !== 'all' ? `Note: The user is currently looking at the ${body.activeTab} artifact.` : ''}\n\nANSWER:`
            : `
PROJECT CONTEXT:
${body.contextMarkdown}

USER QUESTION:
"${body.question}"

${body.activeTab && body.activeTab !== 'summary' && body.activeTab !== 'all' ? `Note: The user is currently looking at the ${body.activeTab} artifact.` : ''}

INSTRUCTIONS:
1. Provide a detailed, accurate answer based ONLY on the provided project context.
2. If the answer is not in the context, be honest and say you don't have that specific information yet.
3. Use a professional, helpful tone.
4. Keep the response concise but informative.
5. You can use markdown for formatting.

ANSWER:`.trim();

        const answer = await generateWithLLM(prompt, {
            temperature: 0.2, // Lower temperature for more factual answers
            role: "Project Architect Assistant",
            cacheId: cacheId
        });

        return createSuccessResponse(
            { answer, cacheId },
            "Question answered successfully"
        );
    } catch (error: any) {
        console.error("Ask Question error:", error);
        return createErrorResponse(error.message || "Failed to answer question", 500);
    }
}
