export type GeminiUsage = {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  cachedContentTokenCount?: number;
  thoughtsTokenCount?: number;
};

export function calculateGeminiCost(model: string, usage: GeminiUsage): number {
  const promptTokens = usage.promptTokenCount || 0;
  const responseTokens = usage.candidatesTokenCount || 0;
  const cachedTokens = usage.cachedContentTokenCount || 0;
  const thoughtsTokens = usage.thoughtsTokenCount || 0;

  // Gemini pricing per 1M tokens (as of 2026)
  // Input: Live prompt tokens
  // Cached: Tokens read from context cache (discounted)
  // Output: Candidate tokens + native thoughts tokens
  const pricing: Record<string, { input: number; output: number; cached: number }> = {
    "gemini-3-pro-preview": { input: 1.25, output: 5.0, cached: 0.3125 },
    "gemini-3-flash-preview": { input: 0.1, output: 0.4, cached: 0.025 },
    "gemini-2.0-flash": { input: 0.1, output: 0.4, cached: 0.025 },
    "gemini-2.5-flash-native-audio-dialog": { input: 0.1, output: 0.4, cached: 0.025 },
  };

  const isPro = model.toLowerCase().includes("pro");
  const isFlash2 = model.toLowerCase().includes("gemini-2.0-flash");
  const isNativeAudio = model.toLowerCase().includes("native-audio");

  let rates = pricing["gemini-3-flash-preview"];
  if (isPro) rates = pricing["gemini-3-pro-preview"];
  else if (isFlash2) rates = pricing["gemini-2.0-flash"];
  else if (isNativeAudio) rates = pricing["gemini-2.5-flash-native-audio-dialog"];
  else if (model.includes("gemini-3")) rates = pricing["gemini-3-flash-preview"];

  const livePromptTokens = Math.max(0, promptTokens - cachedTokens);

  const inputCost = (livePromptTokens / 1_000_000) * rates.input;
  const cachedCost = (cachedTokens / 1_000_000) * rates.cached;
  const outputCost = ((responseTokens + thoughtsTokens) / 1_000_000) * rates.output;

  return inputCost + cachedCost + outputCost;
}
