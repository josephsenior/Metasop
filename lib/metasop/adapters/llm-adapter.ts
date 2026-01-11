/**
 * LLM Adapter - Simplified Provider Interface
 * Supports Gemini (Primary) and Mock (Fallback)
 */

export interface LLMProvider {
  generate(prompt: string, options?: LLMOptions): Promise<string>;
  generateStructured<T>(prompt: string, schema: any, options?: LLMOptions): Promise<T>;
  generateStreamingStructured?<T>(
    prompt: string,
    schema: any,
    onProgress: (event: any) => void,
    options?: LLMOptions
  ): Promise<T>;
  createCache?(content: string, systemInstruction?: string, ttlSeconds?: number): Promise<string>;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  reasoning?: boolean; // Enable thinking/reasoning mode
  cacheId?: string; // Optional Gemini Context Cache ID
  role?: string; // Optional role for agents
}

export interface ReasoningDetails {
  reasoning?: string;
  [key: string]: any;
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

  async generateStructured<T>(_prompt: string, schema: any): Promise<T> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return generateMockFromSchema(schema) as T;
  }

  async generateStreamingStructured<T>(
    prompt: string,
    schema: any,
    onProgress: (event: any) => void
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
}

function generateMockFromSchema(schema: any): any {
  return generateMockValue(schema, [], 0);
}

function generateMockValue(schema: any, path: string[], depth: number): any {
  if (!schema || depth > 6) return {};

  const resolved = pickSchemaVariant(schema);
  const type = resolved.type;

  if (resolved.const !== undefined) return resolved.const;
  if (Array.isArray(resolved.enum) && resolved.enum.length > 0) return resolved.enum[0];
  if (resolved.default !== undefined) return resolved.default;

  if (resolved.oneOf || resolved.anyOf) {
    const chosen = pickSchemaVariant(resolved);
    return generateMockValue(chosen, path, depth + 1);
  }

  if (type === "string") {
    return mockStringValue(resolved, path);
  }
  if (type === "boolean") return true;
  if (type === "number" || type === "integer") return Math.max(1, resolved.minimum ?? 1);

  if (type === "array") {
    const itemsSchema = resolved.items ?? {};
    const minItems = typeof resolved.minItems === "number" ? resolved.minItems : 1;
    const count = Math.max(1, minItems);
    return Array.from({ length: count }, () => generateMockValue(itemsSchema, path, depth + 1));
  }

  if (type === "object" || resolved.properties) {
    const properties: Record<string, any> = resolved.properties || {};
    const required: string[] = Array.isArray(resolved.required) ? resolved.required : [];

    const obj: Record<string, any> = {};
    const keys = required.length > 0 ? required : Object.keys(properties);

    for (const key of keys) {
      obj[key] = generateMockValue(properties[key], [...path, key], depth + 1);
    }

    if (properties.ui_patterns && obj.ui_patterns === undefined) {
      obj.ui_patterns = ["Pagination", "Search", "Empty state"];
    }

    if (path[path.length - 1] === "component_hierarchy" && typeof obj.root === "string") {
      obj.root = "App";
    }

    if (path[path.length - 1] === "design_tokens" && typeof obj.colors === "object") {
      obj.colors.primary = obj.colors.primary || "#0ea5e9";
      obj.colors.secondary = obj.colors.secondary || "#6366f1";
      obj.colors.background = obj.colors.background || "#0b1220";
      obj.colors.text = obj.colors.text || "#e5e7eb";
    }

    return obj;
  }

  return {};
}

function pickSchemaVariant(schema: any): any {
  const variants: any[] = schema.oneOf || schema.anyOf || [];
  if (Array.isArray(variants) && variants.length > 0) {
    const objectVariant = variants.find((v) => v && (v.type === "object" || v.properties));
    return objectVariant || variants[0];
  }
  return schema;
}

function mockStringValue(schema: any, path: string[]): string {
  const key = path[path.length - 1];
  const joined = path.join(".");

  if (schema.pattern && typeof schema.pattern === "string" && schema.pattern.includes("^#[0-9A-Fa-f]{6}$")) {
    return "#111111";
  }

  if (key === "artifact_path") return "src";
  if (key === "id" && schema.pattern === "^US-[0-9]+$") return "US-1";
  if (key === "id" && schema.pattern === "^AC-[0-9]+$") return "AC-1";
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
