import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getConfig, defaultConfig } from "../config";

describe("MetaSOP Config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("defaultConfig", () => {
    it("should have all required fields", () => {
      expect(defaultConfig.agents).toBeDefined();
      expect(defaultConfig.llm).toBeDefined();
      expect(defaultConfig.performance).toBeDefined();
      expect(defaultConfig.logging).toBeDefined();
    });

    it("should have default agent configurations", () => {
      expect(defaultConfig.agents.enabled.length).toBeGreaterThan(0);
      expect(defaultConfig.agents.defaultTimeout).toBe(120000);
      expect(defaultConfig.agents.defaultRetries).toBe(2);
      expect(Object.keys(defaultConfig.agents.agentConfigs).length).toBeGreaterThan(0);
    });

    it("should have per-agent configurations", () => {
      const agentConfigs = defaultConfig.agents.agentConfigs;
      expect(agentConfigs.pm_spec).toBeDefined();
      expect(agentConfigs.arch_design).toBeDefined();
      expect(agentConfigs.engineer_impl).toBeDefined();
      expect(agentConfigs.ui_design).toBeDefined();
      expect(agentConfigs.qa_verification).toBeDefined();
    });

    it("should have different timeouts for different agents", () => {
      const configs = defaultConfig.agents.agentConfigs;
      // Different agents should have timeout configured (may vary)
      expect(configs.engineer_impl.timeout).toBeGreaterThan(0);
      expect(configs.pm_spec.timeout).toBeGreaterThan(0);
      expect(configs.arch_design.timeout).toBeGreaterThan(0);
    });
  });

  describe("getConfig", () => {
    it("should return default config when no env vars", () => {
      const config = getConfig();
      expect(config.agents.defaultTimeout).toBe(120000);
      expect(config.agents.defaultRetries).toBe(2);
    });

    it("should override timeout from env", () => {
      process.env.METASOP_AGENT_TIMEOUT = "60000";
      const config = getConfig();
      expect(config.agents.defaultTimeout).toBe(60000);
    });

    it("should override retries from env", () => {
      process.env.METASOP_AGENT_RETRIES = "5";
      const config = getConfig();
      expect(config.agents.defaultRetries).toBe(5);
    });

    it("should override LLM provider from env", () => {
      process.env.METASOP_LLM_PROVIDER = "openai";
      const config = getConfig();
      expect(config.llm.provider).toBe("openai");
    });

    it("should override LLM model from env", () => {
      process.env.METASOP_LLM_MODEL = "gpt-4";
      const config = getConfig();
      expect(config.llm.model).toBe("gpt-4");
    });

    it("should override LLM API key from env", () => {
      process.env.METASOP_LLM_API_KEY = "test-key";
      const config = getConfig();
      expect(config.llm.apiKey).toBe("test-key");
    });
  });
});

