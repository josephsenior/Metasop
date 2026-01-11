/**
 * LLM Helper - Provides easy access to LLM provider
 */

import { createLLMProvider, LLMProvider } from "../adapters/llm-adapter";
import { getConfig } from "../config";
import { logger } from "./logger";

let llmProviderInstance: LLMProvider | null = null;

/**
 * Get or create LLM provider instance
 */
export function getLLMProvider(): LLMProvider {
  if (!llmProviderInstance) {
    const config = getConfig();
    try {
      llmProviderInstance = createLLMProvider(config.llm.provider as "openai" | "gemini" | "mock" | undefined);
      logger.info("LLM provider initialized", { provider: config.llm.provider, model: config.llm.model });
    } catch (error: any) {
      logger.warn("Failed to initialize LLM provider, falling back to mock", { error: error.message });
      // Fallback to mock if provider fails
      llmProviderInstance = createLLMProvider("mock");
    }
  }
  return llmProviderInstance;
}

/**
 * Generate text using LLM
 */
export async function generateWithLLM(
  prompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    reasoning?: boolean;
    cacheId?: string;
    role?: string;
  }
): Promise<string> {
  const provider = getLLMProvider();
  const config = getConfig();

  return provider.generate(prompt, {
    temperature: options?.temperature ?? config.llm.temperature,
    maxTokens: options?.maxTokens ?? config.llm.maxTokens,
    model: config.llm.model,
    reasoning: options?.reasoning,
    cacheId: options?.cacheId,
    role: options?.role,
  });
}

/**
 * Generate structured output using LLM
 */
export async function generateStructuredWithLLM<T>(
  prompt: string,
  schema: any,
  options?: {
    temperature?: number;
    maxTokens?: number;
    reasoning?: boolean;
    cacheId?: string;
    role?: string;
  }
): Promise<T> {
  const provider = getLLMProvider();
  const config = getConfig();

  return provider.generateStructured<T>(prompt, schema, {
    temperature: options?.temperature ?? config.llm.temperature,
    maxTokens: options?.maxTokens ?? config.llm.maxTokens,
    model: config.llm.model,
    reasoning: options?.reasoning,
    cacheId: options?.cacheId,
    role: options?.role,
  });
}

/**
 * Create a context cache using Gemini LLM
 */
export async function createCacheWithLLM(content: string, systemInstruction?: string, ttlSeconds: number = 3600): Promise<string> {
  const provider = getLLMProvider();

  if (!provider.createCache) {
    throw new Error("Context caching is not supported by the current LLM provider");
  }

  return provider.createCache(content, systemInstruction, ttlSeconds);
}

/**
 * Reset LLM provider instance (useful for testing)
 */
export function resetLLMProvider(): void {
  llmProviderInstance = null;
}
