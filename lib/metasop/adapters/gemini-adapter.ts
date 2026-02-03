/**
 * Google Gemini LLM Provider
 * Supports Gemini 2.0 Flash and other Gemini models
 * Gemini 2.0 Flash offers excellent structured output support via responseSchema
 * Updated: Implements Schema Injection for Thinking Visibility
 */

import axios from "axios";
import type { LLMProvider, LLMOptions } from "./llm-adapter";
import { logger } from "../utils/logger";
import { MetaSOPEvent } from "../types";
import { getSessionDebugDir } from "../utils/debug-session";
import * as fs from "fs";
import * as path from "path";

export class GeminiLLMProvider implements LLMProvider {
  private apiKey: string;
  private baseUrl: string = "https://generativelanguage.googleapis.com/v1beta";
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
      'gemini-2.5-flash-native-audio-dialog': { input: 0.1, output: 0.4, cached: 0.025 },
    };

    // Extract base model name
    const isPro = model.toLowerCase().includes('pro');
    const isFlash2 = model.toLowerCase().includes('gemini-2.0-flash');
    const isNativeAudio = model.toLowerCase().includes('native-audio');
    
    let rates = pricing['gemini-3-flash-preview'];
    if (isPro) rates = pricing['gemini-3-pro-preview'];
    else if (isFlash2) rates = pricing['gemini-2.0-flash'];
    else if (isNativeAudio) rates = pricing['gemini-2.5-flash-native-audio-dialog'];
    else if (model.includes('gemini-3')) rates = pricing['gemini-3-flash-preview'];

    // Live prompt tokens = Total prompt - Cached
    const livePromptTokens = Math.max(0, promptTokens - cachedTokens);

    const inputCost = (livePromptTokens / 1_000_000) * rates.input;
    const cachedCost = (cachedTokens / 1_000_000) * rates.cached;
    const outputCost = ((responseTokens + thoughtsTokens) / 1_000_000) * rates.output;

    return inputCost + cachedCost + outputCost;
  }

  constructor(apiKey: string, model?: string) {
    this.apiKey = (apiKey || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || "").trim();
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

      const response = await axios.post(
        `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`,
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;
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

        // DEBUG: Dump full context to session folder
        if (options?.role) {
          try {
            const agentRole = options.role.toLowerCase().replace(/\s+/g, '_');
            const debugDir = getSessionDebugDir();
            
            if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });

            const debugPayload = {
              agent: options.role,
              model: model,
              timestamp: new Date().toISOString(),
              request: {
                prompt: prompt,
                config: {
                  temperature: options?.temperature,
                  maxTokens: options?.maxTokens,
                  reasoning: !!options?.reasoning,
                  cacheId: options?.cacheId
                }
              },
              response: {
                content: content,
                raw: data,
                thoughts: thoughts
              }
            };

            fs.writeFileSync(
              path.join(debugDir, `${agentRole}_llm_response.json`), 
              JSON.stringify(debugPayload, null, 2)
            );
            } catch {
              // Failed to dump debug artifacts - continue silently
          }
        }

        const finishReason = data.candidates?.[0]?.finishReason;
        logger.info("Token usage metadata", { usage, model, cost, finishReason });
      }

      return content ?? "";
    } catch (error: any) {
      logger.error("Gemini generation failed", { error: error.message, model });
      throw error;
    }
  }

  /**
   * Stream text generation using Gemini's streamGenerateContent API
   * Provides real-time token-by-token streaming
   */
  async generateStream(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: LLMOptions
  ): Promise<string> {
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

      // Use streamGenerateContent endpoint with SSE format
      // Note: Gemini uses ?alt=sse for Server-Sent Events format
      const apiUrl = `${this.baseUrl}/models/${model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;
      
      const response = await axios.post(apiUrl, requestBody, {
        headers: {
          "Content-Type": "application/json",
        },
        responseType: "stream", // Important: use stream response type for SSE
      });

      let fullText = "";
      let buffer = "";

      // Handle streaming response
      return new Promise((resolve, reject) => {
        response.data.on("data", (chunk: Buffer) => {
          buffer += chunk.toString();
          
          // Process complete JSON objects from the stream
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line.trim()) continue;
            
            // Skip SSE event type lines (e.g., "event: ...")
            if (line.startsWith("event:") || line === "[DONE]") continue;
            
            // Gemini streaming format: each line is a JSON object prefixed with "data: "
            let jsonStr = "";
            if (line.startsWith("data: ")) {
              jsonStr = line.slice(6).trim(); // Remove "data: " prefix
            } else if (line.trim().startsWith("{")) {
              // Try parsing as direct JSON (fallback)
              jsonStr = line.trim();
            } else {
              continue; // Skip non-JSON lines
            }

            if (!jsonStr || jsonStr === "[DONE]") continue;

            try {
              const data = JSON.parse(jsonStr);
              
              // Extract text from candidates
              const candidates = data.candidates || [];
              for (const candidate of candidates) {
                // Check if this is a finish reason (stream ended)
                if (candidate.finishReason && candidate.finishReason !== "STOP") {
                  logger.warn("Gemini stream finished with reason", { 
                    finishReason: candidate.finishReason,
                    finishMessage: candidate.finishMessage 
                  });
                }

                const content = candidate.content;
                if (content?.parts) {
                  for (const part of content.parts) {
                    if (part.text) {
                      // Gemini sends cumulative text, extract delta
                      const newText = part.text;
                      if (newText.length >= fullText.length) {
                        // Normal case: new text is longer (cumulative)
                        const delta = newText.slice(fullText.length);
                        fullText = newText;
                        if (delta) {
                          onChunk(delta);
                        }
                      } else {
                        // Edge case: text was reset (shouldn't happen, but handle gracefully)
                        logger.warn("Gemini stream text reset detected", {
                          oldLength: fullText.length,
                          newLength: newText.length
                        });
                        // Send the new text as-is
                        fullText = newText;
                        onChunk(newText);
                      }
                    }
                  }
                }
              }
            } catch (parseError: any) {
              // Log parse errors for debugging but don't crash
              logger.debug("Failed to parse Gemini stream line", {
                line: line.substring(0, 100),
                error: parseError.message
              });
              continue;
            }
          }
        });

        response.data.on("end", () => {
          // Process any remaining buffer to ensure we don't lose final chunks
          if (buffer.trim()) {
            const lines = buffer.split("\n").filter(l => l.trim());
            for (const line of lines) {
              if (!line.trim() || line === "[DONE]") continue;
              
              let jsonStr = "";
              if (line.startsWith("data: ")) {
                jsonStr = line.slice(6).trim();
              } else if (line.trim().startsWith("{")) {
                jsonStr = line.trim();
              } else {
                continue;
              }

              try {
                const data = JSON.parse(jsonStr);
                const candidates = data.candidates || [];
                for (const candidate of candidates) {
                  const content = candidate.content;
                  if (content?.parts) {
                    for (const part of content.parts) {
                      if (part.text) {
                        const newText = part.text;
                        if (newText.length >= fullText.length) {
                          const delta = newText.slice(fullText.length);
                          fullText = newText;
                          if (delta) {
                            onChunk(delta);
                          }
                        }
                      }
                    }
                  }
                }
              } catch (parseError: any) {
                logger.debug("Failed to parse final buffer line", {
                  line: line.substring(0, 100),
                  error: parseError.message
                });
              }
            }
          }

          const latency = Date.now() - startTime;
          logger.info("Gemini streaming generation completed", { 
            model, 
            latency,
            finalLength: fullText.length,
            chunksProcessed: true
          });

          resolve(fullText);
        });

        response.data.on("error", (error: Error) => {
          logger.error("Gemini streaming error", { error: error.message, model });
          reject(error);
        });
      });
    } catch (error: any) {
      logger.error("Gemini streaming generation failed", { error: error.message, model });
      throw error;
    }
  }

  /**
   * Transcribe audio using Gemini 2.0 Flash - highly efficient for
   * high-fidelity native audio processing via standard generation.
   */
  async transcribe(audioBase64: string, mimeType: string = "audio/webm"): Promise<string> {
    const startTime = Date.now();
    // Using Gemini 2.0 Flash for best transcription performance
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

      const response = await axios.post(
        `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`,
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;
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

      const response = await axios.post(
        `${this.baseUrl}/cachedContents?key=${this.apiKey}`,
        body,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;
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
        const baseInstruction = "You are a specialized JSON generator. You MUST ONLY output valid JSON. No conversational text, no preamble, no markdown, no explanations. Just the raw JSON object.";
        const uiDesignerAddition = options?.role === "UI Designer"
          ? " Every string value in the JSON must contain only the intended value (e.g. 0.25rem or 400). Do not append any explanations or extra words to any field."
          : "";
        requestBody.systemInstruction = {
          parts: [{ text: baseInstruction + uiDesignerAddition }]
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
      const apiUrl = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;
      
      try {
          const response = await axios.post(apiUrl, requestBody, {
            headers: {
              "Content-Type": "application/json",
            },
            signal: controller.signal,
            timeout: timeoutMs,
          });

          data = response.data;
        } catch (axiosErr: any) {
        if (axios.isCancel(axiosErr)) {
          throw new Error(`Gemini request timed out after ${timeoutMs}ms`);
        }
        
        if (axiosErr.response) {
          const errorData = axiosErr.response.data;
          
          // DEBUG: Dump error response to session folder
          if (options?.role) {
            try {
              const agentRole = options.role.toLowerCase().replace(/\s+/g, '_');
              const debugDir = getSessionDebugDir();
              
              if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });

              const errorPayload = {
                agent: options.role,
                model: model,
                timestamp: new Date().toISOString(),
                status: axiosErr.response.status,
                statusText: axiosErr.response.statusText,
                request: {
                  prompt: structuredPrompt,
                  schema: schema,
                  config: requestBody.generationConfig
                },
                error: errorData
              };

              fs.writeFileSync(
                path.join(debugDir, `${agentRole}_API_ERROR.json`), 
                JSON.stringify(errorPayload, null, 2)
              );
              console.error(`\n[DEBUG] ${options.role} API ERROR captured to session folder`);
            } catch {
              // ignore
            }
          }

          throw new Error(`Gemini API error (${axiosErr.response.status}): ${errorData.error?.message || axiosErr.response.statusText}`);
        }

          logger.error("Low-level Axios failure", { 
            message: axiosErr.message, 
            name: axiosErr.name,
            code: axiosErr.code,
            url: apiUrl.replace(/key=.*$/, "key=REDACTED"),
            stack: axiosErr.stack
          });
          throw axiosErr;
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

      if (!jsonText && data) {
        // Log additional info if text is missing but data exists
        logger.warn(`[Gemini] ${options?.role || 'Agent'} returned data but no text part`, { 
          candidateCount: data.candidates?.length,
          finishReason: data.candidates?.[0]?.finishReason
        });
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

        // ALWAYS dump response when MAX_TOKENS is hit (truncated output)
        if (finishReason === "MAX_TOKENS" && options?.role) {
          try {
            const agentRole = options.role.toLowerCase().replace(/\s+/g, '_');
            const debugDir = getSessionDebugDir();
            
            if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
            
            const debugPayload = {
              agent: options.role,
              model: model,
              timestamp: new Date().toISOString(),
              finishReason: "MAX_TOKENS",
              tokenUsage: {
                prompt: usage.promptTokenCount,
                response: usage.candidatesTokenCount,
                thoughts: usage.thoughtsTokenCount,
                total: total
              },
              truncatedResponse: jsonText,
              responseLength: jsonText.length
            };
            
            const debugFilePath = path.join(debugDir, `${agentRole}_MAX_TOKENS_truncated.json`);
            fs.writeFileSync(debugFilePath, JSON.stringify(debugPayload, null, 2));
            logger.error(`[DEBUG] MAX_TOKENS TRUNCATION DUMPED TO: ${debugFilePath}`);
            logger.error(`[DEBUG] Response size: ${jsonText.length} chars, ${usage.candidatesTokenCount} tokens`);
          } catch {
            // ignore dump errors
          }
        }
      }

      if (!jsonText) {
        throw new Error("No JSON response from Gemini API");
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

          // Dump malformed response to session folder
          if (options?.role) {
            try {
              const agentRole = options.role.toLowerCase().replace(/\s+/g, '_');
              const debugDir = getSessionDebugDir();
              
              if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
              
              const debugFilePath = path.join(debugDir, `${agentRole}_malformed_response.json`);
              fs.writeFileSync(debugFilePath, jsonText);
              logger.error(`[DEBUG] MALFORMED RESPONSE DUMPED TO: ${debugFilePath}`);
              logger.error(`[DEBUG] Size: ${jsonText.length} characters`);
            } catch {
              // Failed to dump error response - continue silently
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
      try {
        onProgress({
          type: "agent_progress",
          status: "in_progress",
          message: `Agent ${options?.role || "LLM"} is thinking...`,
          timestamp: new Date().toISOString()
        });
      } catch (e: any) {
        logger.warn(`[Gemini] Failed to send initial progress: ${e.message}`);
      }

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
        
        try {
          onProgress({
            type: "agent_progress",
            status: "in_progress",
            message: `${options?.role || "Agent"}: ${message}`,
            timestamp: new Date().toISOString()
          });
        } catch (e: any) {
          logger.warn(`[Gemini] Failed to send heartbeat progress: ${e.message}`);
          // If the stream is closed, stop the interval
          if (e.message === "STREAM_CLOSED" || e.message.includes("closed")) {
            if (progressInterval) clearInterval(progressInterval);
          }
        }
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
            try {
              cleaned = JSON.parse(cleaned);
            } catch {
              // Ignore parse error and keep cleaned as is
            }
          }

          obj[key] = JSON.parse(cleaned);
        } catch {
          // If it's not valid JSON, try to wrap it in an object if it looks like key-value pairs
          if (typeof value === 'string' && value.includes(":") && !value.includes("{")) {
            try {
              const lines = value.split("\n").filter(l => l.includes(":"));
              const partialObj: any = {};
              lines.forEach(l => {
                const parts = l.split(":");
                if (parts.length >= 2) {
                  const k = parts[0].trim().replace(/^["']|["']$/g, "");
                  const v = parts.slice(1).join(":").trim().replace(/^["']|["']$/g, "");
                  if (k) partialObj[k] = v;
                }
              });
              if (Object.keys(partialObj).length > 0) {
                obj[key] = partialObj;
              } else {
                obj[key] = { value: value };
              }
            } catch {
              logger.warn(`Failed to parse dynamic field at ${path} even with heuristics`, { value });
              obj[key] = { value: value }; 
            }
          } else {
            logger.warn(`Failed to parse dynamic field at ${path}`, { value });
            // Fallback: provide an object with the value so Zod doesn't fail on "string" type
            obj[key] = { value: value };
          }
        }

        // Final sanity check: if it's still not an object, make it an object to satisfy Zod/Schema
        // Only if we are sure it's supposed to be an object (which it is if it's in dynamicPaths)
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

    // Pass through JSON Schema constraints that Gemini supports
    if (prop.pattern) geminiProp.pattern = prop.pattern;
    if (prop.minLength !== undefined) geminiProp.minLength = prop.minLength;
    if (prop.maxLength !== undefined) geminiProp.maxLength = prop.maxLength;
    if (prop.format) geminiProp.format = prop.format;
    if (prop.minItems !== undefined) geminiProp.minItems = prop.minItems;
    if (prop.maxItems !== undefined) geminiProp.maxItems = prop.maxItems;

    return geminiProp;
  }
}
