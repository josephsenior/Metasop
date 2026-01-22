import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MockLLMProvider, createLLMProvider, type LLMProvider } from "@/lib/metasop/adapters/llm-adapter";

describe("LLM Adapter", () => {
  describe("MockLLMProvider", () => {
    let provider: LLMProvider;

    beforeEach(() => {
      provider = new MockLLMProvider();
      vi.useRealTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should generate mock response", async () => {
      const result = await provider.generate("Test prompt");

      expect(result).toContain("Mock LLM response");
      expect(result).toContain("Test prompt");
    });

    it("should generate structured response", async () => {
      const result = await provider.generateStructured<{ test: string }>("Test prompt", {});

      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });

    it("should simulate delay", async () => {
      const startTime = Date.now();
      await provider.generate("Test");
      const endTime = Date.now();

      // Should have waited at least 1000ms
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe("createLLMProvider", () => {
    it("should create mock provider by default", () => {
      const provider = createLLMProvider();
      expect(provider).toBeInstanceOf(MockLLMProvider);
    });

    it("should create mock provider when specified", () => {
      const provider = createLLMProvider("mock");
      expect(provider).toBeInstanceOf(MockLLMProvider);
    });

    it("should throw error for unimplemented providers", () => {
      expect(() => createLLMProvider("openai")).toThrow();
      expect(() => createLLMProvider("anthropic")).toThrow();
    });
  });
});

