/**
 * Google Gemini LLM Provider
 * Supports Gemini 2.0 Flash and other Gemini models
 * Gemini 2.0 Flash offers excellent structured output support via responseSchema
 * Updated: Implements Schema Injection for Thinking Visibility
 */

import type { LLMProvider, LLMOptions } from "./llm-adapter";
import { logger } from "../utils/logger";
import { MetaSOPEvent } from "../types";
import * as fs from "fs";
import * as path from "path";

export class GeminiLLMProvider implements LLMProvider {
  private apiKey: string;
  private baseUrl: string = "https://generativelanguage.googleapis.com/v1alpha";
  private defaultModel: string = "gemini-3-flash-preview";

  /**
   * Calculate cost based on model and token usage
   */
  private calculateCost(model: string, usage: any): number {
    const promptTokens = usage.promptTokenCount || 0;
    const responseTokens = usage.candidatesTokenCount || 0;
    const cachedTokens = usage.cachedContentTokenCount || 0;
    const thoughtsTokens = usage.thoughtsTokenCount || 0;

    // Gemini pricing per 1M tokens (as of 2026)
    // Input: Live prompt tokens
    // Cached: Tokens read from context cache (discounted)
    // Output: Candidate tokens + native thoughts tokens
    const pricing: Record<string, { input: number; output: number; cached: number }> = {
      'gemini-3-pro-preview': { input: 1.25, output: 5.0, cached: 0.3125 },
      'gemini-3-flash-preview': { input: 0.1, output: 0.4, cached: 0.025 },
      'gemini-2.0-flash': { input: 0.1, output: 0.4, cached: 0.025 },
    };

    // Extract base model name
    const isPro = model.toLowerCase().includes('pro');
    const isFlash2 = model.toLowerCase().includes('gemini-2.0-flash');
    
    let rates = pricing['gemini-3-flash-preview'];
    if (isPro) rates = pricing['gemini-3-pro-preview'];
    else if (isFlash2) rates = pricing['gemini-2.0-flash'];
    else if (model.includes('gemini-3')) rates = pricing['gemini-3-flash-preview'];

    // Live prompt tokens = Total prompt - Cached
    const livePromptTokens = Math.max(0, promptTokens - cachedTokens);

    const inputCost = (livePromptTokens / 1_000_000) * rates.input;
    const cachedCost = (cachedTokens / 1_000_000) * rates.cached;
    const outputCost = ((responseTokens + thoughtsTokens) / 1_000_000) * rates.output;

    return inputCost + cachedCost + outputCost;
  }

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || "";
    this.defaultModel = model ?? "gemini-3-flash-preview";
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
          temperature: options?.temperature ?? 0.1,
          maxOutputTokens: options?.maxTokens ?? 65000,
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
        const cost = this.calculateCost(model, usage);

        console.log("\n" + "-".repeat(40));
        console.log(`   TOKEN ECONOMY : ${model}`);
        console.log(`   Prompt: ${usage.promptTokenCount}${usage.promptTokensDetails ? ` (${JSON.stringify(usage.promptTokensDetails)})` : ""}`);
        console.log(`   Response: ${usage.candidatesTokenCount}`);
        if (usage.thoughtsTokenCount) console.log(`   Thoughts: ${usage.thoughtsTokenCount}`);
        console.log(`   Cached: ${cached} (${savedPercent}% saved)${usage.cacheTokensDetails ? ` (${JSON.stringify(usage.cacheTokensDetails)})` : ""}`);
        console.log(`   Total: ${total}`);
        console.log(`   Cost: $${cost.toFixed(6)}`);
        console.log(`   Reasoning: ${!!options?.reasoning}`);
        console.log(`   Latency: ${Date.now() - startTime}ms`);
        console.log("-".repeat(40) + "\n");

        const finishReason = data.candidates?.[0]?.finishReason;
        logger.info("Token usage metadata", { usage, model, cost, finishReason });
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
   * Transcribe audio using Gemini 2.0 Flash - highly efficient for
   * high-fidelity native audio processing via standard generation.
   */
  async transcribe(audioBase64: string, mimeType: string = "audio/webm"): Promise<string> {
    const startTime = Date.now();
    // Using Gemini 2.0 Flash for best transcription performance via generateContent
    const model = "gemini-2.0-flash"; 

    try {
      const requestBody = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: audioBase64
                }
              },
              {
                text: `You are a world-class multimodal expert specializing in high-fidelity voice transcription.
                1. Transcribe the provided audio exactly as spoken with 100% accuracy. 
                2. Maintain capitalization, punctuation, and formatting for professional readability.
                3. Expertly handle technical jargon (e.g., 'Prisma', 'Next.js', 'Redis', 'API', 'Docker', 'Zod', 'Tailwind').
                4. Detect and preserve the speaker's tone and emphasis where appropriate.
                5. Return ONLY the transcribed text.
                6. If no speech is detected, return an empty string.
                
                No preamble, no markdown, no commentary.`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.0,
          maxOutputTokens: 2000,
          responseMimeType: "text/plain",
        }
      };

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
        throw new Error(`Gemini Transcription error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (data.usageMetadata) {
        const cost = this.calculateCost(model, data.usageMetadata);
        logger.info("Transcription completed", { 
          latency: Date.now() - startTime, 
          tokens: data.usageMetadata.totalTokenCount,
          cost 
        });
      }

      return content?.trim() || "";
    } catch (error: any) {
      logger.error("Transcription failed", { error: error.message });
      throw error;
    }
  }

  /**
   * Create a context cache for large prompts
   */
  async createCache(content: string, systemInstruction?: string, ttlSeconds: number = 3600, model?: string): Promise<string> {
    const modelName = model ? (model.startsWith('models/') ? model : `models/${model}`) : `models/${this.defaultModel}`;

    try {
      logger.info("Creating Gemini context cache", { model: modelName, contentLength: content.length });

      const body: any = {
        model: modelName,
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
    const structuredPrompt = `${finalPrompt}

        === JSON SCHEMA ===
        ${JSON.stringify(schema, null, 2)}

        === CRITICAL REQUIREMENTS ===
        1. You MUST respond with ONLY a valid JSON object matching the provided schema.
        2. Ensure ALL fields are present according to the schema.
        3. RESPOND WITH ONLY THE JSON OBJECT - NO PREAMBLE OR EXPLANATION.`;

    // Schema Injection: Force Gemini 3 to output reasoning visible in JSON since native thinking is hidden
    // UPDATE: Gemini 3 now supports native thinking in some contexts, and schema injection can cause truncation.
    // We only use injection for models that DON'T support native thinking or where we want explicit JSON reasoning.
    let finalSchema = schema;
    const isGemini3 = model.includes('gemini-3');

    if (options?.reasoning && !isGemini3 && schema.type === 'object' && schema.properties) {
      try {
        finalSchema = JSON.parse(JSON.stringify(schema)); // Deep clone
        finalSchema.properties._reasoning = {
          type: 'string',
          description: 'INTERNAL: First, think step-by-step about the solution before generating the rest of the JSON. Write your reasoning here.'
        };
        if (!finalSchema.required) finalSchema.required = [];
        // Add to required if not present
        if (!finalSchema.required.includes('_reasoning')) {
          // Try to put it first to encourage thinking before generation
          finalSchema.required.unshift('_reasoning');
        }
        logger.info("[Gemini] Injected _reasoning field into schema for legacy thinking capture");
      } catch (err) {
        logger.warn("[Gemini] Failed to inject reasoning schema", { err });
        finalSchema = schema; // Fallback
      }
    }

    try {
      // Gemini supports structured output via responseSchema parameter
      // Convert our schema to Gemini's schema format
      const dynamicPaths = new Set<string>();
      const geminiSchema = this.convertToGeminiSchema(finalSchema, dynamicPaths);

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
          temperature: isGemini3 ? 0.1 : (options?.temperature ?? 0.7),
          maxOutputTokens: options?.maxTokens ?? 65000,
          responseMimeType: "application/json",
          responseSchema: geminiSchema,
          // Removed thinkingConfig to prevent stream contamination and resolve PM agent failures
        },
      };

      // ONLY add systemInstruction if NOT using context cache (API restriction)
      if (!options?.cacheId) {
        requestBody.systemInstruction = {
          parts: [{ text: "You are a specialized JSON generator. You MUST ONLY output valid JSON. No conversational text, no preamble, no markdown, no explanations. Just the raw JSON object." }]
        };
      }

      // Apply context cache if provided
      if (options?.cacheId) {
        requestBody.cachedContent = options.cacheId;
      }

      // Use non-streaming endpoint for structured generation to avoid truncation issues
      const controller = new AbortController();
      const timeoutMs = (options?.maxTokens ?? 64000) > 30000 ? 600000 : 300000; // 10m or 5m
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      let data: any;
      try {
          const response = await fetch(`${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
            throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
          }

          data = await response.json();
        } finally {
          clearTimeout(timeoutId);
        }

      // Extract JSON content from response
      const parts = data.candidates?.[0]?.content?.parts || [];
      let jsonText = "";

      for (const part of parts) {
        if (part.text) {
          jsonText += part.text;
        }
      }

      const usageMetadata = data.usageMetadata;

      // Token Economy Log
      if (usageMetadata) {
        const usage = usageMetadata;
        const total = usage.totalTokenCount || 0;
        const cached = usage.cachedContentTokenCount || 0;
        const savedPercent = total > 0 ? Math.round((cached / (total + cached)) * 100) : 0;
        const cost = this.calculateCost(model, usage);

        const finishReason = data.candidates?.[0]?.finishReason;

        const logEntry = `
        ----------------------------------------
       TOKEN ECONOMY: ${model}
        Prompt: ${usage.promptTokenCount}${usage.promptTokensDetails ? ` (${JSON.stringify(usage.promptTokensDetails)})` : ""}
        Response: ${usage.candidatesTokenCount}
        ${usage.thoughtsTokenCount ? `Thoughts: ${usage.thoughtsTokenCount}\n        ` : ""}Cached: ${cached} (${savedPercent}% saved)${usage.cacheTokensDetails ? ` (${JSON.stringify(usage.cacheTokensDetails)})` : ""}
        Total: ${total}
        Cost: $${cost.toFixed(6)}
        Reasoning: ${!!options?.reasoning}
        Latency: ${Date.now() - startTime} ms
        Finish Reason: ${finishReason}
        ----------------------------------------
          `;
        console.log(logEntry);

        if (usage.candidatesTokenCount >= (options?.maxTokens ?? 64000) - 100) {
          console.warn("[RELIABILITY] Response likely truncated due to token limit.");
        }

        logger.info("Token usage metadata", { usage, model, cost });
      }

      if (!jsonText) {
        throw new Error("No JSON response from Gemini API");
      }

      // DUMP TO FILE FOR USER INSPECTION (Generic for all agents on error or request)
      if (options?.role) {
        // We dump here for Engineer specifically as requested, but also if we encounter errors later
        if (options.role === "Engineer") {
          try {
            const debugFilePath = path.join(process.cwd(), "engineer_raw_response.json");
            fs.writeFileSync(debugFilePath, jsonText);
            console.error(`\n[DEBUG] ENGINEER RAW RESPONSE DUMPED TO: ${debugFilePath}`);
            console.error(`[DEBUG] Size: ${jsonText.length} characters\n`);
          } catch (dumpErr) {
            logger.error("Failed to dump engineer debug response", { error: (dumpErr as Error).message });
          }
        }
      }

      // Parse final aggregated JSON
      let result: any;
      try {
        result = JSON.parse(jsonText);
      } catch (parseError: any) {
        logger.warn("Gemini standard JSON parse failed, attempting reliability repair", { error: parseError.message });

        // Reliability Repair Logic
        let cleaned = jsonText.trim();

        // 1. Extract JSON content boundaries
        // We look for the first { or [ to start the JSON
        const firstBrace = cleaned.indexOf('{');
        const firstBracket = cleaned.indexOf('[');
        let startIdx = -1;
        if (firstBrace !== -1 && firstBracket !== -1) {
          startIdx = Math.min(firstBrace, firstBracket);
        } else {
          startIdx = firstBrace !== -1 ? firstBrace : firstBracket;
        }

        if (startIdx !== -1) {
          // Check if it ends with a closing character
          const lastChar = cleaned.trim().slice(-1);
          const isFinished = lastChar === '}' || lastChar === ']';

          if (isFinished) {
            // If it seems finished, we find the last closing character
            const lastBrace = cleaned.lastIndexOf('}');
            const lastBracket = cleaned.lastIndexOf(']');
            const endIdx = Math.max(lastBrace, lastBracket);
            cleaned = cleaned.substring(startIdx, endIdx + 1);
          } else {
            // If it seems truncated, we take everything from startIdx and try to repair it
            cleaned = cleaned.substring(startIdx);
          }
        } else {
          // No braces found, try cleaning markdown blocks
          cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
        }

        cleaned = cleaned.trim();

        // 2. Handle truncation at key/value level
        // Remove trailing commas which are invalid in JSON
        cleaned = cleaned.replace(/,\s*$/g, "");

        // 3. Fix unterminated strings
        // If it doesn't end with a closing brace or bracket, it might be a truncated string
        if (!cleaned.endsWith('}') && !cleaned.endsWith(']')) {
          const lastQuote = cleaned.lastIndexOf('"');
          const lastBrace = cleaned.lastIndexOf('{');
          const lastBracket = cleaned.lastIndexOf('[');
          const lastComma = cleaned.lastIndexOf(',');
          const lastColon = cleaned.lastIndexOf(':');

          // If the last quote is after all other structural characters, it's likely an open string
          if (lastQuote !== -1 && lastQuote > Math.max(lastBrace, lastBracket, lastComma, lastColon)) {
            const quoteCount = (cleaned.match(/"/g) || []).length;
            if (quoteCount % 2 !== 0) {
              cleaned += '"';
            }
          }
        }

        // 4. Remove trailing commas again after possible string repair
        cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

        // 5. Balance braces and brackets
        let openBraces = (cleaned.match(/\{/g) || []).length;
        let closeBraces = (cleaned.match(/\}/g) || []).length;
        let openBrackets = (cleaned.match(/\[/g) || []).length;
        let closeBrackets = (cleaned.match(/\]/g) || []).length;

        while (openBrackets > closeBrackets) {
          cleaned += ']';
          closeBrackets++;
        }
        while (openBraces > closeBraces) {
          cleaned += '}';
          closeBraces++;
        }

        try {
          result = JSON.parse(cleaned);
        } catch (repairError: any) {
          logger.error("Reliability repair failed", { error: repairError.message, text: cleaned.substring(0, 100) });

          // DUMP MALFORMED RESPONSE FOR DEBUGGING
          if (options?.role) {
            try {
              const debugFileName = `${options.role.toLowerCase().replace(/\s+/g, '_')}_error_response_${Date.now()}.json`;
              const debugFilePath = path.join(process.cwd(), debugFileName);
              fs.writeFileSync(debugFilePath, jsonText);
              logger.error(`\n[DEBUG] MALFORMED RESPONSE DUMPED TO: ${debugFilePath}`);
              logger.error(`[DEBUG] Size: ${jsonText.length} characters`);
            } catch (dumpErr) {
              logger.error("Failed to dump error response", { error: (dumpErr as Error).message });
            }
          }

          throw new Error(`Failed to parse Gemini response: ${parseError.message}`);
        }
      }

      // Post-process dynamic fields (JSON strings to objects)
      if (dynamicPaths.size > 0) {
        this.processDynamicFields(result, dynamicPaths);
      }

      // Extract and stream injected reasoning if present
      if ((result as any)._reasoning) {
        // Just logs here, we already streamed it!
        const thoughtContent = (result as any)._reasoning;
        logger.info("[Gemini] Captured injected reasoning complete", { length: thoughtContent.length });

        // Clean up metadata from result
        delete (result as any)._reasoning;
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
    // For Gemini, we use a combined approach:
    // 1. Start a heartbeat to keep the connection alive and show progress
    // 2. Use the standard structured generation which is more reliable for JSON
    
    let progressInterval: NodeJS.Timeout | undefined;
    let progressCount = 0;
    
    if (onProgress) {
      onProgress({
        type: "agent_progress",
        status: "in_progress",
        message: `Agent ${options?.role || "LLM"} is thinking...`,
        timestamp: new Date().toISOString()
      });

      // Emit progress updates every 5 seconds to prevent "hanging" perception
      progressInterval = setInterval(() => {
        progressCount++;
        const messages = [
          "Analyzing requirements...",
          "Structuring response...",
          "Validating architectural consistency...",
          "Generating detailed artifacts...",
          "Finalizing structured output...",
          "Applying technical constraints...",
          "Reviewing generated plan..."
        ];
        const message = messages[Math.min(progressCount - 1, messages.length - 1)];
        
        onProgress({
          type: "agent_progress",
          status: "in_progress",
          message: `${options?.role || "Agent"}: ${message}`,
          timestamp: new Date().toISOString()
        });
      }, 5000);
    }

    try {
      const result = await this.generateStructured<T>(prompt, schema, { ...options, onProgress });
      return result;
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    }
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
