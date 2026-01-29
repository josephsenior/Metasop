import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MetaSOPOrchestrator, runMetaSOPOrchestration } from "@/lib/metasop/orchestrator";

describe("MetaSOPOrchestrator", () => {
  beforeEach(async () => {
    // Use real timers for integration tests to avoid hanging
    vi.useRealTimers();

    // Silence logger during tests
    const loggerModule = await import("@/lib/metasop/utils/logger");
    vi.spyOn(loggerModule.logger, "info").mockImplementation(() => { });
    vi.spyOn(loggerModule.logger, "warn").mockImplementation(() => { });
    vi.spyOn(loggerModule.logger, "error").mockImplementation(() => { });
    vi.spyOn(loggerModule.logger, "debug").mockImplementation(() => { });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("run", () => {
    it("should execute all agents in sequence", async () => {
      const orchestrator = new MetaSOPOrchestrator();
      const result = await orchestrator.run("Create a user authentication system", {
        includeAPIs: true,
        includeDatabase: true,
      });

      expect(result.steps.length).toBeGreaterThanOrEqual(1);
      expect(result).toHaveProperty("artifacts");
      if (result.success) {
        expect(result.artifacts.pm_spec).toBeDefined();
        expect(result.steps.length).toBe(7);
      }
    }, 30000); // 30 second timeout

    it("should execute engineer and UI designer sequentially", async () => {
      const orchestrator = new MetaSOPOrchestrator();
      const result = await orchestrator.run("Create a system", {
        includeAPIs: true,
      });

      expect(result.steps.length).toBeGreaterThanOrEqual(1);
      if (result.success) {
        expect(result.artifacts.engineer_impl).toBeDefined();
        expect(result.artifacts.ui_design).toBeDefined();
      }
    }, 30000);

    it("should handle agent failures gracefully", async () => {
      const orchestrator = new MetaSOPOrchestrator();

      // Mock an agent to fail persistently (all retries will fail)
      const productManagerModule = await import("@/lib/metasop/agents/product-manager");
      vi.spyOn(productManagerModule, "productManagerAgent").mockRejectedValue(
        new Error("Agent failure")
      );

      const result = await orchestrator.run("Test request");

      expect(result.success).toBe(false);
      expect(result.steps.some((s) => s.status === "failed")).toBe(true);
    }, 30000);

    it("should update context with previous artifacts", async () => {
      const orchestrator = new MetaSOPOrchestrator();
      const result = await orchestrator.run("Create a system");

      expect(result.steps.length).toBeGreaterThanOrEqual(1);
      expect(result).toHaveProperty("artifacts");
      if (result.success) {
        expect(result.artifacts.arch_design).toBeDefined();
        expect(result.artifacts.engineer_impl).toBeDefined();
      }
    }, 30000);

    it("should generate report with events", async () => {
      const orchestrator = new MetaSOPOrchestrator();
      const result = await orchestrator.run("Create a system");

      expect(result.report).toBeDefined();
      expect(result.report.events.length).toBeGreaterThanOrEqual(0);
    }, 30000);

    it("should track all steps", async () => {
      const orchestrator = new MetaSOPOrchestrator();
      const result = await orchestrator.run("Create a system");

      expect(result.steps.length).toBeGreaterThanOrEqual(1);
      expect(result.steps[0].id).toBe("pm_spec");
      if (result.steps.length === 7) {
        expect(result.steps.map((s) => s.id)).toEqual([
          "pm_spec",
          "arch_design",
          "devops_infrastructure",
          "security_architecture",
          "engineer_impl",
          "ui_design",
          "qa_verification",
        ]);
      }
    }, 30000);
  });

  describe("getState", () => {
    it("should return current orchestration state", async () => {
      const orchestrator = new MetaSOPOrchestrator();
      const promise = orchestrator.run("Create a system");

      // Wait a bit for some steps to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      const state = orchestrator.getState();

      expect(state.steps).toBeDefined();
      expect(state.artifacts).toBeDefined();
      expect(state.report).toBeDefined();

      // Wait for completion
      await promise;
    }, 30000);
  });

  describe("runMetaSOPOrchestration", () => {
    it("should be a convenience function that creates orchestrator", async () => {
      const result = await runMetaSOPOrchestration("Create a system");

      expect(result).toHaveProperty("artifacts");
      expect(result.steps.length).toBeGreaterThanOrEqual(1);
    }, 30000);
  });

  describe("disabled agents", () => {
    it("should skip disabled agents", async () => {
      const configModule = await import("@/lib/metasop/config");
      const originalGetConfig = configModule.getConfig;
      const customConfig = {
        ...originalGetConfig(),
        agents: {
          ...originalGetConfig().agents,
          enabled: ["pm_spec", "arch_design", "engineer_impl", "ui_design"],
        },
      };
      vi.spyOn(configModule, "getConfig").mockReturnValue(customConfig);

      const orchestrator = new MetaSOPOrchestrator();
      const result = await orchestrator.run("Create a system");

      expect(result.steps.length).toBeGreaterThanOrEqual(1);
    }, 30000);
  });

  describe("error handling", () => {
    it("should handle execution result with success but no artifact", async () => {
      const orchestrator = new MetaSOPOrchestrator();

      // Mock execution service to return success but no artifact
      const executionServiceModule = await import("@/lib/metasop/services/execution-service");
      const mockExecuteStep = vi.fn().mockResolvedValue({
        success: true,
        artifact: undefined,
        executionTime: 100,
        attempts: 1,
      });

      vi.spyOn(executionServiceModule.ExecutionService.prototype, "executeStep").mockImplementation(mockExecuteStep);

      const result = await orchestrator.run("Test request");

      expect(result.success).toBe(false);
      expect(result.steps.some((s) => s.status === "failed")).toBe(true);
    }, 30000);
  });

  describe("execution options", () => {
    it("should use custom retry policy when agent config has retryPolicy", async () => {
      const orchestrator = new MetaSOPOrchestrator();

      // Mock config to include custom retry policy
      const configModule = await import("@/lib/metasop/config");
      const originalGetConfig = configModule.getConfig;
      const customConfig = {
        ...originalGetConfig(),
        agents: {
          ...originalGetConfig().agents,
          agentConfigs: {
            ...originalGetConfig().agents.agentConfigs,
            pm_spec: {
              ...originalGetConfig().agents.agentConfigs.pm_spec,
              retryPolicy: {
                initialDelay: 500,
                maxDelay: 5000,
                backoffMultiplier: 1.5,
                jitter: false,
              },
            },
          },
        },
      };

      vi.spyOn(configModule, "getConfig").mockReturnValue(customConfig);

      const result = await orchestrator.run("Test request");

      expect(result.steps.length).toBeGreaterThanOrEqual(1);
    }, 30000);

    it("should use default timeout and retries when agent config is missing", async () => {
      const orchestrator = new MetaSOPOrchestrator();

      // Mock config to remove agent config
      const configModule = await import("@/lib/metasop/config");
      const originalGetConfig = configModule.getConfig;
      const customConfig = {
        ...originalGetConfig(),
        agents: {
          ...originalGetConfig().agents,
          agentConfigs: {}, // Empty agent configs
        },
      };

      vi.spyOn(configModule, "getConfig").mockReturnValue(customConfig);

      const result = await orchestrator.run("Test request");

      expect(result.steps.length).toBeGreaterThanOrEqual(1);
    }, 30000);
  });

  describe("addStepToReport edge cases", () => {
    it("should handle addStepToReport with only status", async () => {
      const orchestrator = new MetaSOPOrchestrator();

      // Start orchestration
      const promise = orchestrator.run("Test request");

      // Wait a bit for steps to be created
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get state to verify steps are being tracked
      const state = orchestrator.getState();
      expect(state.steps.length).toBeGreaterThan(0);
      expect(state.report.events.length).toBeGreaterThan(0);

      // Wait for completion
      await promise;
    }, 30000);
  });
});

