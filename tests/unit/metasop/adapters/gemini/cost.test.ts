import { describe, it, expect } from "vitest";
import { calculateGeminiCost, type GeminiUsage } from "@/lib/metasop/adapters/gemini/cost";

describe("Gemini cost", () => {
  it("calculates cost for flash (default gemini-3)", () => {
    const usage: GeminiUsage = {
      promptTokenCount: 1_000_000,
      candidatesTokenCount: 1_000_000,
      cachedContentTokenCount: 0,
      thoughtsTokenCount: 0,
    };

    const cost = calculateGeminiCost("gemini-3-flash-preview", usage);

    // rates: input 0.1, output 0.4, cached 0.025 per 1M tokens
    expect(cost).toBeCloseTo(0.1 + 0.4, 10);
  });

  it("uses pro pricing when model contains 'pro'", () => {
    const usage: GeminiUsage = {
      promptTokenCount: 2_000_000,
      candidatesTokenCount: 3_000_000,
      cachedContentTokenCount: 0,
      thoughtsTokenCount: 1_000_000,
    };

    const cost = calculateGeminiCost("Gemini-3-Pro-Preview", usage);

    // rates: input 1.25, output 5.0 per 1M tokens
    const expected = 2 * 1.25 + (3 + 1) * 5.0;
    expect(cost).toBeCloseTo(expected, 10);
  });

  it("charges cached tokens at cached rate and subtracts from live prompt tokens", () => {
    const usage: GeminiUsage = {
      promptTokenCount: 1_000_000,
      cachedContentTokenCount: 400_000,
      candidatesTokenCount: 0,
      thoughtsTokenCount: 0,
    };

    const cost = calculateGeminiCost("gemini-3-flash-preview", usage);

    // live prompt tokens = 600k @ 0.1 per 1M, cached 400k @ 0.025 per 1M
    const expected = (600_000 / 1_000_000) * 0.1 + (400_000 / 1_000_000) * 0.025;
    expect(cost).toBeCloseTo(expected, 10);
  });

  it("never uses negative live prompt tokens when cached exceeds prompt", () => {
    const usage: GeminiUsage = {
      promptTokenCount: 100,
      cachedContentTokenCount: 1_000,
      candidatesTokenCount: 0,
      thoughtsTokenCount: 0,
    };

    const cost = calculateGeminiCost("gemini-3-flash-preview", usage);

    // live prompt tokens clamp to 0; cached is still charged.
    const expected = (1_000 / 1_000_000) * 0.025;
    expect(cost).toBeCloseTo(expected, 10);
  });

  it("uses gemini-2.0-flash pricing when model includes gemini-2.0-flash", () => {
    const usage: GeminiUsage = {
      promptTokenCount: 1_000_000,
      candidatesTokenCount: 1_000_000,
      cachedContentTokenCount: 0,
      thoughtsTokenCount: 0,
    };

    const cost = calculateGeminiCost("gemini-2.0-flash", usage);

    // same rates as flash-preview: input 0.1, output 0.4
    expect(cost).toBeCloseTo(0.1 + 0.4, 10);
  });

  it("uses native-audio pricing when model includes native-audio", () => {
    const usage: GeminiUsage = {
      promptTokenCount: 1_000_000,
      candidatesTokenCount: 1_000_000,
      cachedContentTokenCount: 0,
      thoughtsTokenCount: 0,
    };

    const cost = calculateGeminiCost("gemini-2.5-flash-native-audio-dialog", usage);

    // same rates as flash-preview: input 0.1, output 0.4
    expect(cost).toBeCloseTo(0.1 + 0.4, 10);
  });
});
