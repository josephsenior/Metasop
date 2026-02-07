import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse, createSuccessResponse, addGuestCookie } from "@/lib/api/response";
import { handleGuestAuth } from "@/lib/middleware/guest-auth";
import { generateWithLLM, generateStreamWithLLM, createCacheWithLLM } from "@/lib/metasop/utils/llm-helper";
import { validateAskQuestionRequest } from "@/lib/diagrams/schemas";

export const maxDuration = 60; // 1 minute for Q&A

export async function POST(request: NextRequest) {
    const useStreaming = request.nextUrl.searchParams.get("stream") === "true";
    try {
        const guestAuth = await handleGuestAuth(request);
        const cookieOpt = guestAuth.sessionId ? { guestSessionId: guestAuth.sessionId } : undefined;
        if (!guestAuth.canProceed) {
            return createErrorResponse(guestAuth.reason || "Unauthorized", 401, cookieOpt);
        }

        const rawBody = await request.json();
        const body = validateAskQuestionRequest(rawBody);

        const artifactNames: Record<string, string> = {
            pm_spec: "Product Specification",
            arch_design: "Architecture Design",
            ui_design: "UI & Design System",
            engineer_impl: "Engineering Blueprint",
            security_architecture: "Security Architecture",
            devops_infrastructure: "Infrastructure & DevOps",
            qa_verification: "Quality Assurance & Testing"
        };

        const systemInstruction = `
You are Blueprinta, an expert AI Software Architect and Project Manager.
You have full context of a project's technical blueprints including product specifications, architecture design, infrastructure, security, and implementation plans.

STRICT GUIDELINES:
1. RESPONSE FORMAT: Provide direct, concise, and technical answers. 
2. NO FILLER: Do not start responses with conversational filler like "Hello", "I'd be happy to help", or "I see you are looking at...". 
3. DIRECT ANSWERS: If asked a question, answer it immediately. If no question is asked or just a greeting, provide a very brief (1-sentence) technical status update of the blueprints you are analyzing.
4. MARKDOWN: Use clean markdown. Avoid excessive bolding or complex layouts that might break in chat bubbles.
5. SOURCE ATTRIBUTION: If an answer comes from a specific artifact or document, mention it briefly (e.g., "According to the Security Architecture...").
6. ACCURACY: Base your answers ONLY on the provided context. If unsure, state that the information is not present.
7. TONE: Professional, technical, and efficient.
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

        const activeArtifactNote = body.activeTab && body.activeTab !== 'summary' && body.activeTab !== 'all' 
            ? `Note: The user is currently looking at the ${artifactNames[body.activeTab] || body.activeTab} blueprint.`
            : '';

        const prompt = cacheId 
            ? `USER QUESTION: "${body.question}"${conversationContext}${activeArtifactNote}\n\nANSWER:`
            : `
PROJECT CONTEXT:
${body.contextMarkdown}

USER QUESTION:
"${body.question}"${conversationContext}
${activeArtifactNote}

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
                                role: "Blueprinta Assistant",
                                cacheId: cacheId,
                                systemInstruction: cacheId ? undefined : systemInstruction
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

            const streamRes = new NextResponse(stream, {
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                },
            });
            if (cookieOpt?.guestSessionId) addGuestCookie(streamRes, cookieOpt.guestSessionId);
            return streamRes;
        }

        // Non-streaming response
        try {
            const answer = await generateWithLLM(prompt, {
                temperature: 0.2, // Lower temperature for more factual answers
                role: "Blueprinta Assistant",
                cacheId: cacheId,
                systemInstruction: cacheId ? undefined : systemInstruction
            });

            return createSuccessResponse(
                { answer, cacheId },
                "Question answered successfully",
                cookieOpt
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

${activeArtifactNote}

ANSWER:`.trim();

                const answer = await generateWithLLM(retryPrompt, {
                    temperature: 0.2,
                    role: "Blueprinta Assistant",
                    systemInstruction: systemInstruction
                });

                return createSuccessResponse(
                    { answer, cacheId: undefined },
                    "Question answered successfully (cache expired, recreated)",
                    cookieOpt
                );
            }
            throw error;
        }
    } catch (error: any) {
        console.error("Ask Question error:", error);
        return createErrorResponse(error.message || "Failed to answer question", 500);
    }
}
