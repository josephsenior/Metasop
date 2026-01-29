import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from "@/lib/auth/middleware";
import { generateWithLLM, generateStreamWithLLM, createCacheWithLLM } from "@/lib/metasop/utils/llm-helper";
import { validateAskQuestionRequest } from "@/lib/diagrams/schemas";

export const maxDuration = 60; // 1 minute for Q&A

export async function POST(request: NextRequest) {
    const useStreaming = request.nextUrl.searchParams.get("stream") === "true";
    try {
        const rawBody = await request.json();
        const body = validateAskQuestionRequest(rawBody);

        // Authentication: Optional for Q&A, but check if diagram exists/is guest
        try {
            await getAuthenticatedUser(request);
        } catch {
            if (!body.diagramId.startsWith("guest_") && !body.diagramId.startsWith("diagram_")) {
                return createErrorResponse("Unauthorized", 401);
            }
        }

        const systemInstruction = `
You are an expert Diagram Architect and Project Manager assistant. 
You have full context of a diagram's technical artifacts including PM specifications, architecture design, DevOps infrastructure, security protocols, and engineering implementation.
Additionally, you have access to user-uploaded research papers and supplemental documents.

INSTRUCTIONS:
1. Provide concise, accurate answers based ONLY on the provided diagram context and uploaded documents.
2. If the answer comes from an uploaded document, briefly identify the document name.
3. If the answer is not in the context, be honest and say you don't have that specific information yet.
4. Use a professional, helpful tone. Be direct and to the point - avoid unnecessary elaboration.
5. Keep responses under 300 words unless the question requires detailed technical explanation.
`.trim();

        let cacheId = body.cacheId;

        // If no cacheId is provided and we have significant context, create a cache
        // Increased threshold to ~10k chars (closer to Gemini's 32k token minimum for better efficiency)
        // especially in multi-turn conversations.
        // Note: contextMarkdown may be empty string when cacheId exists (frontend optimization)
        if (!cacheId && body.contextMarkdown && body.contextMarkdown.length > 10000) {
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

        // Build prompt with conversation history if available
        const conversationContext = body.conversationHistory 
            ? `\n\nPREVIOUS CONVERSATION:\n${body.conversationHistory}\n\n`
            : '';

        const prompt = cacheId 
            ? `USER QUESTION: "${body.question}"${conversationContext}${body.activeTab && body.activeTab !== 'summary' && body.activeTab !== 'all' ? `Note: The user is currently looking at the ${body.activeTab} artifact.` : ''}\n\nANSWER:`
            : `
PROJECT CONTEXT:
${body.contextMarkdown}

USER QUESTION:
"${body.question}"${conversationContext}
${body.activeTab && body.activeTab !== 'summary' && body.activeTab !== 'all' ? `Note: The user is currently looking at the ${body.activeTab} artifact.` : ''}

INSTRUCTIONS:
1. Provide a concise, accurate answer based ONLY on the provided project context.
2. If the answer is not in the context, be honest and say you don't have that specific information yet.
3. Use a professional, helpful tone. Be direct and to the point.
4. Keep responses under 300 words unless the question requires detailed technical explanation.
5. You can use markdown for formatting, but keep it minimal.
${body.conversationHistory ? '6. Consider the previous conversation context when answering to maintain continuity.' : ''}

ANSWER:`.trim();

        // Streaming support using Gemini's streamGenerateContent API
        if (useStreaming) {
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                async start(controller) {
                    try {
                        // Use true streaming with Gemini's streamGenerateContent
                        await generateStreamWithLLM(
                            prompt,
                            (chunk: string) => {
                                // Send each chunk as it arrives from Gemini
                                controller.enqueue(
                                    encoder.encode(JSON.stringify({ 
                                        type: "chunk", 
                                        content: chunk 
                                    }) + "\n")
                                );
                            },
                            {
                                temperature: 0.2,
                                role: "Project Architect Assistant",
                                cacheId: cacheId
                            }
                        );

                        // Send final message with cacheId
                        controller.enqueue(
                            encoder.encode(JSON.stringify({ 
                                type: "complete", 
                                cacheId: cacheId 
                            }) + "\n")
                        );
                        controller.close();
                    } catch (error: any) {
                        controller.enqueue(
                            encoder.encode(JSON.stringify({ 
                                type: "error", 
                                message: error.message 
                            }) + "\n")
                        );
                        controller.close();
                    }
                }
            });

            return new NextResponse(stream, {
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                },
            });
        }

        // Non-streaming response
        try {
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
            // Check if error is due to cache expiration
            const isCacheError = error.message?.includes("cachedContent") || 
                                error.message?.includes("NOT_FOUND") ||
                                error.response?.status === 404;
            
            if (isCacheError && cacheId) {
                console.warn("[Ask] Cache expired or invalid, retrying without cache");
                // Retry without cache
                const retryPrompt = `
PROJECT CONTEXT:
${body.contextMarkdown}

USER QUESTION:
"${body.question}"

${body.activeTab && body.activeTab !== 'summary' && body.activeTab !== 'all' ? `Note: The user is currently looking at the ${body.activeTab} artifact.` : ''}

INSTRUCTIONS:
1. Provide a concise, accurate answer based ONLY on the provided project context.
2. If the answer is not in the context, be honest and say you don't have that specific information yet.
3. Use a professional, helpful tone. Be direct and to the point.
4. Keep responses under 300 words unless the question requires detailed technical explanation.
5. You can use markdown for formatting, but keep it minimal.

ANSWER:`.trim();

                const answer = await generateWithLLM(retryPrompt, {
                    temperature: 0.2,
                    role: "Project Architect Assistant"
                });

                return createSuccessResponse(
                    { answer, cacheId: undefined },
                    "Question answered successfully (cache expired, recreated)"
                );
            }
            throw error;
        }
    } catch (error: any) {
        console.error("Ask Question error:", error);
        return createErrorResponse(error.message || "Failed to answer question", 500);
    }
}
