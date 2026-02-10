/**
 * LLM Adapter - Simplified Provider Interface
 * Supports Gemini (Primary) and Mock (Fallback)
 */

import type { MetaSOPEvent } from "../types";

export type LLMProgressEvent = Partial<MetaSOPEvent>;

export interface LLMProvider {
  generate(prompt: string, options?: LLMOptions): Promise<string>;
  generateStructured<T>(prompt: string, schema: unknown, options?: LLMOptions): Promise<T>;
  generateStreamingStructured?<T>(
    prompt: string,
    schema: unknown,
    onProgress: (event: LLMProgressEvent) => void,
    options?: LLMOptions
  ): Promise<T>;
  /**
   * Stream text generation token-by-token
   * @param prompt The input prompt
   * @param onChunk Callback for each text chunk received
   * @param options LLM options
   * @returns The complete generated text
   */
  generateStream?(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: LLMOptions
  ): Promise<string>;
  createCache?(content: string, systemInstruction?: string, ttlSeconds?: number, model?: string): Promise<string>;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  reasoning?: boolean; // Enable thinking/reasoning mode
  cacheId?: string; // Optional Gemini Context Cache ID
  role?: string; // Optional role for agents
  systemInstruction?: string; // System-level instruction for the LLM
  onProgress?: (event: LLMProgressEvent) => void; // Optional callback for streaming events
  responseSchema?: any; // Optional JSON schema for structured output enforcement
}

export interface ReasoningDetails {
  [key: string]: string | number | boolean | null | undefined;
}

export interface LLMResponse {
  content: string;
  reasoning_details?: ReasoningDetails;
}

/**
 * Mock LLM Provider (for development/testing without keys)
 */
export class MockLLMProvider implements LLMProvider {
  async generate(prompt: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return `Mock LLM response for: ${prompt.substring(0, 50)}...`;
  }

  async generateStructured<T>(_prompt: string, schema: unknown): Promise<T> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return generateMockFromSchema(schema) as T;
  }

  async generateStreamingStructured<T>(
    prompt: string,
    schema: unknown,
    onProgress: (event: LLMProgressEvent) => void
  ): Promise<T> {
    // Simulate thinking tokens for development/testing
    const mockThoughts = [
      "Initializing agent cognitive engine...",
      "Analyzing user request intent...",
      "Synthesizing architectural patterns...",
      "Validating schema constraints...",
      "Optimizing response tokens..."
    ];

    for (const thought of mockThoughts) {
      await new Promise(resolve => setTimeout(resolve, 600));
      onProgress({
        type: "step_thought",
        thought: thought + "\n",
        timestamp: new Date().toISOString()
      });
    }

    return this.generateStructured<T>(prompt, schema);
  }

  async generateStream(
    prompt: string,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    // Simulate streaming by chunking the mock response
    const response = `Mock LLM response for: ${prompt.substring(0, 50)}...`;
    const chunkSize = 5;

    for (let i = 0; i < response.length; i += chunkSize) {
      await new Promise(resolve => setTimeout(resolve, 50));
      onChunk(response.slice(i, i + chunkSize));
    }

    return response;
  }
}

function generateMockFromSchema(schema: unknown): unknown {
  return generateMockValue(schema as Record<string, unknown>, [], 0);
}

type JsonSchema = {
  type?: string;
  const?: unknown;
  enum?: unknown[];
  default?: unknown;
  oneOf?: unknown;
  anyOf?: unknown;
  items?: unknown;
  minItems?: unknown;
  minimum?: unknown;
  properties?: unknown;
  required?: unknown;
  pattern?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function toJsonSchema(value: unknown): JsonSchema {
  return (isRecord(value) ? (value as JsonSchema) : {}) as JsonSchema;
}

function generateMockValue(schemaInput: unknown, path: string[], depth: number): unknown {
  if (!schemaInput || depth > 6) return {};

  const schema = toJsonSchema(schemaInput);

  const resolved = pickSchemaVariant(schema);
  const {
    type,
    const: constValue,
    enum: enumValues,
    default: defaultValue,
    oneOf,
    anyOf,
    items,
    minItems,
    minimum,
    properties,
    required,
  } = resolved;

  if (constValue !== undefined) return constValue;
  if (Array.isArray(enumValues) && enumValues.length > 0) {
    const firstEnumValue = enumValues[0];
    if (firstEnumValue !== undefined) return firstEnumValue;
  }
  if (defaultValue !== undefined) return defaultValue;

  if (oneOf || anyOf) {
    const chosen = pickSchemaVariant(resolved);
    return generateMockValue(chosen, path, depth + 1);
  }

  if (type === "string") {
    return mockStringValue(resolved, path);
  }
  if (type === "boolean") return true;
  if (type === "number" || type === "integer") {
    const min = typeof minimum === "number" ? minimum : 1;
    return Math.max(1, min);
  }

  if (type === "array") {
    const itemsSchema = items ?? {};
    const min = typeof minItems === "number" ? minItems : 1;
    const count = Math.max(1, min);
    return Array.from({ length: count }, () => generateMockValue(itemsSchema, path, depth + 1));
  }

  if (type === "object" || properties) {
    const propertiesSchema = isRecord(properties) ? properties : {};
    const requiredKeys: string[] = Array.isArray(required) ? (required as string[]) : [];

    const obj: Record<string, unknown> = {};
    const keys = requiredKeys.length > 0 ? requiredKeys : Object.keys(propertiesSchema);

    for (const key of keys) {
      obj[key] = generateMockValue(propertiesSchema[key], [...path, key], depth + 1);
    }

    if (Object.prototype.hasOwnProperty.call(propertiesSchema, "ui_patterns") && obj.ui_patterns === undefined) {
      obj.ui_patterns = ["Pagination", "Search", "Empty state"];
    }

    if (path[path.length - 1] === "component_hierarchy" && typeof obj.root === "string") {
      obj.root = "App";
    }

    if (path[path.length - 1] === "design_tokens") {
      const { colors } = obj;
      if (isRecord(colors)) {
        colors.primary = colors.primary || "#0ea5e9";
        colors.secondary = colors.secondary || "#6366f1";
        colors.background = colors.background || "#0b1220";
        colors.text = colors.text || "#e5e7eb";
      }
    }

    return obj;
  }

  return {};
}

function pickSchemaVariant(schemaInput: unknown): JsonSchema {
  const schema = toJsonSchema(schemaInput);
  const variantsUnknown = schema.oneOf || schema.anyOf;
  const variants: unknown[] = Array.isArray(variantsUnknown) ? variantsUnknown : [];
  if (Array.isArray(variants) && variants.length > 0) {
    const objectVariant = variants
      .map(toJsonSchema)
      .find((v) => v && (v.type === "object" || v.properties));
    return objectVariant || toJsonSchema(variants[0]);
  }
  return schema;
}

function mockStringValue(schemaInput: unknown, path: string[]): string {
  const schema = toJsonSchema(schemaInput);
  const key = path[path.length - 1];
  const joined = path.join(".");

  const { pattern } = schema;
  if (typeof pattern === "string" && pattern.includes("^#[0-9A-Fa-f]{6}$")) {
    return "#111111";
  }

  if (key === "artifact_path") return "src";
  if (key === "id" && pattern === "^US-[0-9]+$") return "US-1";
  if (key === "id" && pattern === "^AC-[0-9]+$") return "AC-1";
  if (key === "gherkin") return "Given a user exists\nWhen they sign in\nThen they see their dashboard";
  if (joined.endsWith("component_hierarchy.root")) return "App";
  if (key === "model") return "google/gemini-flash-1.5:free";

  return "test";
}

/**
 * LLM Provider Factory
 */
export function createLLMProvider(provider?: "gemini" | "openai" | "mock" | "vercel-ai" | string): LLMProvider {
  const providerType = provider || process.env.METASOP_LLM_PROVIDER || "mock";

  switch (providerType) {
    case "gemini": {
      const { getConfig } = require("../config");
      const config = getConfig();
      const apiKey = config.llm.apiKey || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
      const model = config.llm.model || "gemini-3-pro-preview";
      const { GeminiLLMProvider } = require("./gemini-adapter");
      return new GeminiLLMProvider(apiKey, model);
    }
    case "vercel-ai": {
      const { getConfig } = require("../config");
      const config = getConfig();
      const model = config.llm.model || "gemini-1.5-flash";
      const { VercelAILlmProvider } = require("./vercel-ai-adapter");
      return new VercelAILlmProvider(undefined, model);
    }
    case "openai": {
      // Stub for OpenAI - can be implemented fully if needed
      throw new Error("OpenAI provider not yet implemented. Use 'gemini' or 'mock'.");
    }
    case "mock":
      return new MockLLMProvider();
    default:
      throw new Error(`Provider '${providerType}' not supported`);
  }
}
