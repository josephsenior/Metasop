import { google } from "@ai-sdk/google";
import { streamObject, streamText } from "ai";
import { LLMProvider, LLMOptions } from "./llm-adapter";
import { logger } from "../utils/logger";
import { MetaSOPEvent } from "../types";

export class VercelAILlmProvider implements LLMProvider {
    private modelId: string;

    constructor(_apiKey?: string, modelId?: string) {
        this.modelId = modelId || "gemini-1.5-flash";
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
        logger.info(`[VercelAI] Starting streaming generation with ${modelId}`);

        // Capture Reasoning/Thoughts if supported by the model (e.g., Gemini 2.0 Flash Thinking)
        // For structured output, we use streamObject.
        // We'll also try to stream thoughts if the model supports it and it's requested.

        try {
            const result = await streamObject({
                model: google(modelId, {
                    // Enable thinking if the model supports it (Gemini 2.0 Flash Thinking)
                    // @ts-ignore - Experimental SDK feature
                    experimental_allowThinking: options?.reasoning ?? true,
                }) as any, // Cast to any to resolve @ai-sdk/google and ai package version mismatch
                schema: schema,
                prompt,
                temperature: options?.temperature ?? 0.7,
            });

            const { elementStream, object } = result;

            // Stream partial elements (artifacts) as they are generated
            // @ts-ignore - elementStream iterator type mismatch
            for await (const partial of elementStream) {
                onProgress({
                    type: "step_partial_artifact",
                    partial_content: partial,
                    timestamp: new Date().toISOString()
                });
            }

            const finalResult = await object;
            return finalResult as T;
        } catch (error: any) {
            logger.error(`[VercelAI] Streaming error: ${error.message}`);
            // Fallback to non-streaming if streamObject fails
            return this.generateStructured<T>(prompt, schema, options);
        }
    }
}
