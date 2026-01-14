import { google } from "@ai-sdk/google";
import { streamObject, streamText } from "ai";
import { LLMProvider, LLMOptions } from "./llm-adapter";
import { logger } from "../utils/logger";
import { MetaSOPEvent } from "../types";

export class VercelAILlmProvider implements LLMProvider {
    private modelId: string;

    constructor(_apiKey?: string, modelId?: string) {
        // Default to Gemini 2.0 Flash, but can be overridden via config
        this.modelId = modelId || "gemini-3-flash-preview";
    }

    async generate(prompt: string, options?: LLMOptions): Promise<string> {
        const { text } = await streamText({
            model: google(this.modelId) as any,
            prompt,
            temperature: options?.temperature,
            maxTokens: options?.maxTokens,
        });
        return text;
    }

    async generateStructured<T>(prompt: string, schema: any, options?: LLMOptions): Promise<T> {
        const { object } = await streamObject({
            model: google(this.modelId) as any,
            schema: schema,
            prompt,
            temperature: options?.temperature,
        });
        return object as T;
    }

    async generateStreamingStructured<T>(
        prompt: string,
        schema: any,
        onProgress: (event: Partial<MetaSOPEvent>) => void,
        options?: LLMOptions
    ): Promise<T> {
        const modelId = options?.model || this.modelId;
        logger.info(`[VercelAI] Starting streaming generation with ${modelId} (Reasoning: ${options?.reasoning})`);

        try {
            // STRATEGY: Use streamText with tools to capture BOTH reasoning (text) AND structured output (tool args)
            // Don't force the tool immediately - let the model think first

            const toolName = "generate_artifact";

            // Enhanced prompt to encourage both thinking and tool use
            const enhancedPrompt = `${prompt}\n\nIMPORTANT: First, think through your approach step-by-step. Then, use the ${toolName} tool to provide your structured output.`;

            const result = await streamText({
                model: google(modelId) as any,
                tools: {
                    [toolName]: {
                        description: "Generate the requested artifact with structured data",
                        parameters: schema,
                    }
                },
                // Don't force tool call - let model generate text first
                prompt: enhancedPrompt,
                temperature: options?.temperature ?? 0.7,
            });


            // Iterate over the full stream to capture text (reasoning) and tool calls
            // @ts-ignore - fullStream type mismatch in some SDK versions
            for await (const part of result.fullStream) {
                // Log ALL event types to understand what Gemini is sending
                logger.info(`[VercelAI] Stream event type: ${part.type}`, part);

                if (part.type === 'text-delta') {
                    // This is the reasoning/thought stream!
                    logger.info(`[VercelAI] Got text-delta: ${part.textDelta?.substring(0, 30)}`)
                    onProgress({
                        type: "step_thought",
                        thought: part.textDelta,
                        timestamp: new Date().toISOString()
                    });
                } else if (part.type === 'tool-call') {
                    logger.info(`[VercelAI] Got tool-call: ${part.toolName}`)
                } else {
                    // Check if there are thinking/thoughts fields in unknown event types
                    const partAny = part as any;
                    if (partAny.thinking || partAny.thoughts || partAny.thinkingDelta) {
                        logger.info(`[VercelAI] Found thinking content in ${part.type}:`, {
                            thinking: partAny.thinking,
                            thoughts: partAny.thoughts,
                            thinkingDelta: partAny.thinkingDelta
                        });
                        onProgress({
                            type: "step_thought",
                            thought: partAny.thinking || partAny.thoughts || partAny.thinkingDelta,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            }

            // Get the final tool call results
            const toolCalls = await result.toolCalls;
            const artifactCall = toolCalls.find(tc => tc.toolName === toolName);

            // CRITICAL: Check for thinking content in the response metadata
            // @ts-ignore - experimental API
            const metadata = result.experimental_providerMetadata;
            const usage = await result.usage;

            logger.info(`[VercelAI] Response metadata:`, {
                hasMetadata: !!metadata,
                usage: usage,
                metadataKeys: metadata ? Object.keys(metadata) : []
            });

            // Check if thinking content is in metadata
            if (metadata) {
                const metadataAny = metadata as any;
                logger.info(`[VercelAI] Full metadata:`, metadataAny);

                // Gemini might include thinking in grounding metadata or other fields
                if (metadataAny.google) {
                    logger.info(`[VercelAI] Google-specific metadata:`, metadataAny.google);
                }

                // Check for thinking in various possible locations
                const thinkingContent = metadataAny.thinking ||
                    metadataAny.thoughts ||
                    metadataAny.groundingMetadata?.thinking ||
                    (metadataAny.google && metadataAny.google.thinking);

                if (thinkingContent) {
                    logger.info(`[VercelAI] Found thinking content in metadata!`);
                    onProgress({
                        type: "step_thought",
                        thought: JSON.stringify(thinkingContent),
                        timestamp: new Date().toISOString()
                    });
                }
            }

            if (artifactCall) {
                return artifactCall.args as T;
            }

            // If no tool was called, try to parse the text output as JSON
            const finalText = await result.text;
            logger.warn(`[VercelAI] No tool call found, attempting JSON parse of text output`);

            try {
                return JSON.parse(finalText) as T;
            } catch {
                logger.error(`[VercelAI] Could not parse text as JSON, falling back to non-streaming`);
                throw new Error("Model did not call the generation tool and text is not valid JSON");
            }

        } catch (error: any) {
            logger.error(`[VercelAI] Streaming error: ${error.message}`);
            // Fallback to non-streaming structured generation if streaming fails
            return this.generateStructured<T>(prompt, schema, options);
        }
    }
}
