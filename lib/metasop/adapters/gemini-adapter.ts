/**
 * Google Gemini LLM Provider
 * Supports Gemini 2.0 Flash and other Gemini models
 * Gemini 2.0 Flash offers excellent structured output support via responseSchema
 */

import type { LLMProvider, LLMOptions } from "./llm-adapter";
import { logger } from "../utils/logger";
import { MetaSOPEvent } from "../types";

export class GeminiLLMProvider implements LLMProvider {
  private apiKey: string;
  private baseUrl: string = "https://generativelanguage.googleapis.com/v1alpha";
  private defaultModel: string = "gemini-3-flash-preview";

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || "";
    this.defaultModel = model || "gemini-3-flash-preview";
  }

  async generate(prompt: string, options?: LLMOptions): Promise<string> {
    const startTime = Date.now();
    const model = options?.model || this.defaultModel;

    try {
      // If using cache, the prompt should be concise as most context is already cached
      const finalPrompt = options?.cacheId
        ? `Based on the cached context, please perform your task as ${options.role || 'an agent'}.
      
${prompt}`
        : prompt;

      const requestBody: any = {
        contents: [
          {
            parts: [
              {
                text: finalPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 16000,
          ...(options?.reasoning ? { thinkingConfig: { includeThoughts: true } } : {}),
        },
      };

      // Apply context cache if provided
      if (options?.cacheId) {
        requestBody.cachedContent = options.cacheId;
      }

      const response = await fetch(
        `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text;
      const thoughts = data.candidates?.[0]?.content?.parts?.find((p: any) => p.thought)?.thought;

      if (thoughts) {
        const thoughtsText = typeof thoughts === 'string' ? thoughts : JSON.stringify(thoughts, null, 2);
        console.log("\n💭 THOUGHTS:\n", thoughtsText.substring(0, 500) + (thoughtsText.length > 500 ? "..." : ""));
      }

      // Token Economy Log
      if (data.usageMetadata) {
        const usage = data.usageMetadata;
        const total = usage.totalTokenCount || 0;
        const cached = usage.cachedContentTokenCount || 0;
        const savedPercent = total > 0 ? Math.round((cached / (total + cached)) * 100) : 0;

        console.log("\n" + "-".repeat(40));
        console.log(`   TOKEN ECONOMY : ${model}`);
        console.log(`   Prompt: ${usage.promptTokenCount}`);
        console.log(`   Response: ${usage.candidatesTokenCount}`);
        console.log(`   Cached: ${cached} (${savedPercent}% saved)`);
        console.log(`   Total: ${total}`);
        console.log(`   Latency: ${Date.now() - startTime}ms`);
        console.log("-".repeat(40) + "\n");

        logger.info("Token usage metadata", { usage, model });
      }

      if (!content) {
        throw new Error("No response from Gemini API");
      }

      return content;
    } catch (error: any) {
      logger.error("Gemini generation failed", { error: error.message, model });
      throw error;
    }
  }

  /**
   * Create a context cache for large prompts
   */
  async createCache(content: string, systemInstruction?: string, ttlSeconds: number = 3600): Promise<string> {
    const model = `models/${this.defaultModel}`;

    try {
      logger.info("Creating Gemini context cache", { model, contentLength: content.length });

      const body: any = {
        model,
        ttl: `${ttlSeconds}s`,
      };

      if (systemInstruction) {
        body.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      body.contents = [
        {
          role: "user",
          parts: [{ text: content }]
        }
      ];

      const response = await fetch(
        `${this.baseUrl}/cachedContents?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(`Gemini Cache creation error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const cacheName = data.name;

      if (!cacheName) {
        throw new Error("No cache name returned from Gemini API");
      }

      logger.info("Gemini context cache created successfully", { cacheName });
      return cacheName;
    } catch (error: any) {
      logger.error("Gemini cache creation failed", { error: error.message });
      throw error;
    }
  }

  async generateStructured<T>(prompt: string, schema: any, options?: LLMOptions): Promise<T> {
    const startTime = Date.now();
    const model = options?.model || this.defaultModel;

    // If using cache, the prompt should be concise as most context is already cached
    const finalPrompt = options?.cacheId
      ? `Based on the cached context, please perform your task as ${options.role || 'an agent'}.

          ${prompt}`
      : prompt;

    // For Gemini 3, we rely primarily on responseSchema to minimize prompt noise
    // For other models, we keep the schema in the prompt as a fallback
    const structuredPrompt = model.includes('gemini-3')
      ? finalPrompt
      : `${finalPrompt}

        === JSON SCHEMA ===
        ${JSON.stringify(schema, null, 2)}

        === CRITICAL REQUIREMENTS ===
        1. You MUST respond with ONLY a valid JSON object matching the provided schema.
        2. Ensure ALL fields are present according to the schema.
        3. RESPOND WITH ONLY THE JSON OBJECT - NO PREAMBLE OR EXPLANATION.`;

    try {
      // Gemini supports structured output via responseSchema parameter
      // Convert our schema to Gemini's schema format
      const dynamicPaths = new Set<string>();
      const geminiSchema = this.convertToGeminiSchema(schema, dynamicPaths);
      console.log(`[Gemini] Dynamic fields identified: ${Array.from(dynamicPaths).join(", ")}`);

      const requestBody: any = {
        contents: [
          {
            parts: [
              {
                text: structuredPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: model.includes('gemini-3') ? 0.3 : (options?.temperature ?? 0.7),
          maxOutputTokens: options?.maxTokens ?? 64000,
          responseMimeType: "application/json",
          responseSchema: geminiSchema,
          // Gemini 3 does internal thinking by default. 
          // Enabling thinkingConfig explicitly often breaks JSON adherence for structured outputs.
          ...(options?.reasoning && !model.includes('gemini-3') ? { thinkingConfig: { includeThoughts: true } } : {}),
        },
      };

      // ONLY add systemInstruction if NOT using context cache (API restriction)
      if (!options?.cacheId) {
        requestBody.systemInstruction = {
          parts: [{ text: "You are a specialized JSON generator. You MUST ONLY output valid JSON. No conversational text, no preamble, no markdown. Just the raw JSON object." }]
        };
      }

      // Apply context cache if provided
      if (options?.cacheId) {
        requestBody.cachedContent = options.cacheId;
      }

      const response = await fetch(
        `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(`Gemini API error: ${error.error?.message || response.statusText} `);
      }

      const data = await response.json();
      console.log(`[Gemini] Response data received. Candidates: ${data.candidates?.length || 0}`);

      const jsonText = data.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text || "";
      const thoughts = data.candidates?.[0]?.content?.parts?.find((p: any) => p.thought)?.thought;

      if (jsonText) {
        console.log(`[Gemini] JSON text received (${jsonText.length} chars)`);
      } else {
        console.warn(`[Gemini] NO JSON TEXT RECEIVED! Parts:`, JSON.stringify(data.candidates?.[0]?.content?.parts, null, 2));
      }

      if (thoughts) {
        const thoughtsText = typeof thoughts === 'string' ? thoughts : JSON.stringify(thoughts, null, 2);
        console.log("\n💭 THOUGHTS (Structured):\n", thoughtsText.substring(0, 500) + (thoughtsText.length > 500 ? "..." : ""));
      }

      // Token Economy Log
      if (data.usageMetadata) {
        const usage = data.usageMetadata;
        const total = usage.totalTokenCount || 0;
        const cached = usage.cachedContentTokenCount || 0;
        const savedPercent = total > 0 ? Math.round((cached / (total + cached)) * 100) : 0;

        const logEntry = `
        ----------------------------------------
       TOKEN ECONOMY: ${model}
        Prompt: ${usage.promptTokenCount}
        Response: ${usage.candidatesTokenCount}
        Cached: ${cached} (${savedPercent}% saved)
        Total: ${total}
        Latency: ${Date.now() - startTime} ms
        ----------------------------------------
          `;
        console.log(logEntry);

        if (usage.candidatesTokenCount >= (options?.maxTokens ?? 64000) - 100) {
          console.warn("[RELIABILITY] Response likely truncated due to token limit.");
        }

        logger.info("Token usage metadata", { usage, model });
      }

      if (!jsonText) {
        throw new Error("No JSON response from Gemini API");
      }

      // Parse JSON (should be valid due to responseSchema)
      let result: any;
      try {
        // First try standard parse
        result = JSON.parse(jsonText);
      } catch (parseError: any) {
        logger.warn("Gemini standard JSON parse failed, attempting reliability repair", { error: parseError.message });

        // Reliability Repair Logic
        let cleaned = jsonText.trim();

        // 1. Extract JSON content between the first '{' or '[' and the last '}' or ']'
        const firstBrace = cleaned.indexOf('{');
        const firstBracket = cleaned.indexOf('[');
        let startIdx = -1;
        if (firstBrace !== -1 && firstBracket !== -1) {
          startIdx = Math.min(firstBrace, firstBracket);
        } else {
          startIdx = firstBrace !== -1 ? firstBrace : firstBracket;
        }

        const lastBrace = cleaned.lastIndexOf('}');
        const lastBracket = cleaned.lastIndexOf(']');
        let endIdx = -1;
        if (lastBrace !== -1 && lastBracket !== -1) {
          endIdx = Math.max(lastBrace, lastBracket);
        } else {
          endIdx = lastBrace !== -1 ? lastBrace : lastBracket;
        }

        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          cleaned = cleaned.substring(startIdx, endIdx + 1);
        } else {
          // Fallback to markdown block removal if no braces found
          cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
        }

        // 1b. Final cleanup - sometimes models add "JSON" or other markers after extraction
        cleaned = cleaned.trim();

        // 2. Fix unterminated strings
        // If the last character is NOT a closing brace/bracket/quote, it might be a truncated string
        if (!cleaned.endsWith('}') && !cleaned.endsWith(']') && !cleaned.endsWith('"')) {
          // Count quotes to see if we're in the middle of a string
          const quoteCount = (cleaned.match(/"/g) || []).length;
          if (quoteCount % 2 !== 0) {
            cleaned += '"';
          }
        }

        // 3. Remove trailing commas before closing braces/brackets
        cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

        // 4. Balance braces and brackets
        let openBraces = (cleaned.match(/\{/g) || []).length;
        let closeBraces = (cleaned.match(/\}/g) || []).length;
        let openBrackets = (cleaned.match(/\[/g) || []).length;
        let closeBrackets = (cleaned.match(/\]/g) || []).length;

        // If we have more open than closed, append the missing ones
        while (openBrackets > closeBrackets) {
          cleaned += ']';
          closeBrackets++;
        }
        while (openBraces > closeBraces) {
          cleaned += '}';
          closeBraces++;
        }

        // 5. Sanitize control characters
        cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");

        try {
          result = JSON.parse(cleaned);
        } catch (e3: any) {
          logger.error("Reliability repair failed", { original: jsonText.substring(jsonText.length - 100) });
          throw new Error(`Failed to parse Gemini JSON despite reliability cleanup: ${e3.message}`);
        }
      }

      // Post-process dynamic fields (JSON strings to objects)
      if (dynamicPaths.size > 0) {
        this.processDynamicFields(result, dynamicPaths);
      }

      return result as T;
    } catch (error: any) {
      logger.error("Gemini structured generation failed", { error: error.message, model });
      throw error;
    }
  }

  /**
   * Streaming version of structured generation.
   * Currently provides compatibility wrapper as true element-streaming requires specific API support.
   */
  async generateStreamingStructured<T>(
    prompt: string,
    schema: any,
    onProgress: (event: Partial<MetaSOPEvent>) => void,
    options?: LLMOptions
  ): Promise<T> {
    // Call standard structured generation
    const result = await this.generateStructured<T>(prompt, schema, options);

    // For now, true real-time streaming of Gemini thoughts via raw fetch is complex.
    // The VercelAILlmProvider is the primary choice for Immersive Streaming.

    return result;
  }

  /**
   * Process dynamic fields that were stringified for Gemini API
   */
  private processDynamicFields(obj: any, dynamicPaths: Set<string>, currentPath: string = ""): void {
    if (!obj || typeof obj !== "object") return;

    for (const [key, value] of Object.entries(obj)) {
      const path = currentPath ? `${currentPath}.${key}` : key;

      // Check if this path or a wildcard path matches
      // Wildcard example: apis.0.request_schema matches apis.*.request_schema
      const isDynamic = Array.from(dynamicPaths).some(dp => {
        if (dp === path) return true;

        // Handle array wildcards: apis.*.request_schema
        const pattern = dp.replace(/\./g, "\\.").replace(/\*/g, "[^.]+");
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(path);
      });

      if (isDynamic && typeof value === "string") {
        console.log(`[Gemini] Attempting to parse dynamic field: ${path}`);
        try {
          // Attempt to parse the stringified JSON
          let cleaned = value.trim();
          // Remove potential markdown braces if the LLM added them inside the string
          cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");

          // Handle potential double-stringification
          if (cleaned.startsWith('"') && cleaned.endsWith('"') && cleaned.length > 2) {
            cleaned = JSON.parse(cleaned);
          }

          obj[key] = JSON.parse(cleaned);
        } catch {
          // If it's not valid JSON, try to wrap it in an object if it looks like key-value pairs
          if (value.includes(":") && !value.includes("{")) {
            try {
              const lines = value.split("\n").filter(l => l.includes(":"));
              const partialObj: any = {};
              lines.forEach(l => {
                const parts = l.split(":");
                if (parts.length >= 2) {
                  partialObj[parts[0].trim().replace(/^["']|["']$/g, "")] = parts[1].trim().replace(/^["']|["']$/g, "");
                }
              });
              obj[key] = partialObj;
            } catch {
              logger.warn(`Failed to parse dynamic field at ${path} even with heuristics`, { value });
              obj[key] = { raw: value }; // Standardize on object even in failure
            }
          } else {
            logger.warn(`Failed to parse dynamic field at ${path}`, { value });
            // Fallback: provide an object with the raw string so Zod doesn't fail on "string" type
            obj[key] = { raw: value };
          }
        }

        // Final sanity check: if it's still not an object, make it an object to satisfy Zod
        if (typeof obj[key] !== "object" || obj[key] === null) {
          obj[key] = { "value": obj[key] };
        }
      } else if (value && typeof value === "object") {
        // Recurse into objects/arrays
        this.processDynamicFields(value, dynamicPaths, path);
      }
    }
  }

  /**
   * Convert JSON Schema to Gemini's schema format
   */
  private convertToGeminiSchema(schema: any, dynamicPaths: Set<string>): any {
    if (schema.type === "object") {
      const geminiSchema: any = {
        type: "object",
        properties: {},
        required: schema.required || [],
      };

      if (schema.properties) {
        for (const [key, value] of Object.entries(schema.properties)) {
          const prop = value as any;
          geminiSchema.properties[key] = this.convertProperty(prop, key, dynamicPaths);
        }
      }

      return geminiSchema;
    }

    // Fallback: return schema as-is
    return schema;
  }

  /**
   * Convert a JSON Schema property to Gemini format
   */
  private convertProperty(prop: any, path: string, dynamicPaths: Set<string>): any {
    // Handle oneOf/anyOf by picking the first option if it's an object or string
    // This is a simplification as Gemini doesn't support unions in responseSchema
    if (prop.oneOf || prop.anyOf) {
      const options = prop.oneOf || prop.anyOf;
      // Prefer object type if available for better structure
      const bestOption = options.find((opt: any) => opt.type === "object") || options[0];
      return this.convertProperty(bestOption, path, dynamicPaths);
    }

    // Default type to object if missing but properties exist
    const type = prop.type || (prop.properties ? "object" : "string");

    const geminiProp: any = {
      type: type,
    };

    if (prop.description) {
      geminiProp.description = prop.description;
    }

    if (type === "array" && prop.items) {
      geminiProp.items = this.convertProperty(prop.items, `${path}.*`, dynamicPaths);
    }

    if (type === "object") {
      if (prop.required) {
        geminiProp.required = prop.required;
      }

      const hasProperties = prop.properties && Object.keys(prop.properties).length > 0;

      if (hasProperties) {
        geminiProp.properties = {};
        for (const [key, value] of Object.entries(prop.properties)) {
          geminiProp.properties[key] = this.convertProperty(value as any, `${path}.${key}`, dynamicPaths);
        }
      } else {
        // This is a dynamic object (e.g., z.record or z.object({}).catchall())
        // Gemini's responseSchema doesn't support additionalProperties or empty properties for type: object.
        // We convert it to a string and ask Gemini to provide JSON stringified content.
        dynamicPaths.add(path);
        return {
          type: "string",
          description: (prop.description ? prop.description + " " : "") +
            "[REQUIREMENT: This field must be a valid JSON string representing the object data]"
        };
      }
    }

    if (prop.enum) {
      geminiProp.enum = prop.enum;
    }

    return geminiProp;
  }
}
