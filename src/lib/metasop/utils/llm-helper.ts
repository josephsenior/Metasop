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
      // Prioritize vercel-ai if explicitly set or if possible
      const providerType = process.env.METASOP_LLM_PROVIDER || config.llm.provider || "mock";
      llmProviderInstance = createLLMProvider(providerType);
      logger.info("LLM provider initialized", { provider: providerType, model: config.llm.model });
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
    model?: string; // Per-call model override
  }
): Promise<string> {
  const provider = getLLMProvider();
  const config = getConfig();

  return provider.generate(prompt, {
    temperature: options?.temperature ?? config.llm.temperature,
    maxTokens: options?.maxTokens ?? config.llm.maxTokens,
    model: options?.model ?? config.llm.model,
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
    model?: string;
  }
): Promise<T> {
  const provider = getLLMProvider();
  const config = getConfig();

  return provider.generateStructured<T>(prompt, schema, {
    temperature: options?.temperature ?? config.llm.temperature,
    maxTokens: options?.maxTokens ?? config.llm.maxTokens,
    model: options?.model ?? config.llm.model,
    reasoning: options?.reasoning,
    cacheId: options?.cacheId,
    role: options?.role,
  });
}

/**
 * Generate structured output using LLM with real-time streaming
 */
export async function generateStreamingStructuredWithLLM<T>(
  prompt: string,
  schema: any,
  onProgress: (event: any) => void,
  options?: {
    temperature?: number;
    maxTokens?: number;
    reasoning?: boolean;
    cacheId?: string;
    role?: string;
    model?: string; // Per-agent model override
  }
): Promise<T> {
  const provider = getLLMProvider();
  const config = getConfig();

  // Use per-agent model override if provided, otherwise use global config
  const modelToUse = options?.model || config.llm.model;

  if (provider.generateStreamingStructured) {
    return provider.generateStreamingStructured<T>(prompt, schema, onProgress, {
      temperature: options?.temperature ?? config.llm.temperature,
      maxTokens: options?.maxTokens ?? config.llm.maxTokens,
      model: modelToUse,
      reasoning: options?.reasoning,
      cacheId: options?.cacheId,
      role: options?.role,
    });
  }

  // Fallback to non-streaming
  return generateStructuredWithLLM<T>(prompt, schema, options);
}

/**
 * Create a context cache using Gemini LLM
 */
export async function createCacheWithLLM(content: string, systemInstruction?: string, ttlSeconds: number = 3600, model?: string): Promise<string> {
  const provider = getLLMProvider();
  const config = getConfig();

  if (!provider.createCache) {
    throw new Error("Context caching is not supported by the current LLM provider");
  }

  return provider.createCache(content, systemInstruction, ttlSeconds, model || config.llm.model);
}

/**
 * Generate text with streaming using LLM
 */
export async function generateStreamWithLLM(
  prompt: string,
  onChunk: (chunk: string) => void,
  options?: {
    temperature?: number;
    maxTokens?: number;
    reasoning?: boolean;
    cacheId?: string;
    role?: string;
  }
): Promise<string> {
  const provider = getLLMProvider();

  if (!provider.generateStream) {
    // Fallback to non-streaming if provider doesn't support streaming
    const result = await generateWithLLM(prompt, options);
    // Simulate streaming by chunking the result
    const chunkSize = 10;
    for (let i = 0; i < result.length; i += chunkSize) {
      onChunk(result.slice(i, i + chunkSize));
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    return result;
  }

  const config = getConfig();
  return provider.generateStream(prompt, onChunk, {
    temperature: options?.temperature ?? config.llm.temperature,
    maxTokens: options?.maxTokens ?? config.llm.maxTokens,
    model: config.llm.model,
    reasoning: options?.reasoning,
    cacheId: options?.cacheId,
    role: options?.role,
  });
}

/**
 * Reset LLM provider instance (useful for testing)
 */
export function resetLLMProvider(): void {
  llmProviderInstance = null;
}
