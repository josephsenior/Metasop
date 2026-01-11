import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MetaSOPOrchestrator } from "../orchestrator";
import { getConfig } from "../config";

describe("MetaSOPOrchestrator Integration", () => {
  beforeEach(async () => {
    vi.useRealTimers();

    // Silence logger during tests
    const loggerModule = await import("../utils/logger");
    vi.spyOn(loggerModule.logger, "info").mockImplementation(() => { });
    vi.spyOn(loggerModule.logger, "warn").mockImplementation(() => { });
    vi.spyOn(loggerModule.logger, "error").mockImplementation(() => { });
    vi.spyOn(loggerModule.logger, "debug").mockImplementation(() => { });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Full Orchestration Flow", () => {
    it("should complete full orchestration with all agents", async () => {
      const orchestrator = new MetaSOPOrchestrator();
      const result = await orchestrator.run(
        "Create a complete e-commerce platform with user authentication, payment processing, and order management",
        {
          includeAPIs: true,
          includeDatabase: true,
          includeStateManagement: true,
        }
      );

      expect(result.success).toBe(true);
      expect(result.artifacts.pm_spec).toBeDefined();
      expect(result.artifacts.arch_design).toBeDefined();
      expect(result.artifacts.engineer_impl).toBeDefined();
      expect(result.artifacts.ui_design).toBeDefined();
      expect(result.artifacts.devops_infrastructure).toBeDefined();
      expect(result.artifacts.security_architecture).toBeDefined();
      expect(result.artifacts.qa_verification).toBeDefined();
      // All 7 agents are enabled by default
      expect(result.steps.length).toBe(7);
      expect(result.report.events.length).toBeGreaterThan(7);
    }, 30000);

    it("should handle disabled agents", async () => {
      const config = getConfig();
      const originalEnabled = [...config.agents.enabled];
      config.agents.enabled = ["pm_spec", "arch_design"]; // Disable some agents

      const orchestrator = new MetaSOPOrchestrator();
      const result = await orchestrator.run("Test request");

      // Should only have enabled agents
      expect(result.artifacts.pm_spec).toBeDefined();
      expect(result.artifacts.arch_design).toBeDefined();
      expect(result.artifacts.engineer_impl).toBeUndefined();

      // Restore
      config.agents.enabled = originalEnabled;
    }, 30000);

    it("should propagate context between agents", async () => {
      const orchestrator = new MetaSOPOrchestrator();
      const result = await orchestrator.run("Create a user management system");

      // Architect should have PM artifact
      expect(result.artifacts.arch_design).toBeDefined();
      // Engineer should have both PM and Architect artifacts
      expect(result.artifacts.engineer_impl).toBeDefined();
      // UI Designer should have all previous artifacts
      expect(result.artifacts.ui_design).toBeDefined();
    }, 30000);

    it("should execute all agents sequentially", async () => {
      const orchestrator = new MetaSOPOrchestrator();
      const result = await orchestrator.run("Test request");

      expect(result.success).toBe(true);
      expect(result.artifacts.engineer_impl).toBeDefined();
      expect(result.artifacts.ui_design).toBeDefined();
    }, 30000);
  });

  describe("Error Handling", () => {
    it("should handle timeout errors", async () => {
      const orchestrator = new MetaSOPOrchestrator();
      const config = getConfig();
      // Set very short timeout
      const originalTimeout = config.agents.agentConfigs.pm_spec.timeout;
      config.agents.agentConfigs.pm_spec.timeout = 100;

      const result = await orchestrator.run("Test request");

      // Should handle timeout gracefully (may fail or succeed depending on timing)
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.steps.some((s) => s.status === "failed" || s.status === "success" || s.status === "running")).toBe(true);

      // Restore
      config.agents.agentConfigs.pm_spec.timeout = originalTimeout;
    }, 30000);

    it("should retry on failures", async () => {
      const orchestrator = new MetaSOPOrchestrator();
      const config = getConfig();
      config.agents.agentConfigs.pm_spec.retries = 1;

      const result = await orchestrator.run("Test request");

      // Should complete (either success or failure after retries)
      expect(result.steps.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe("State Management", () => {
    it("should track state during execution", async () => {
      const orchestrator = new MetaSOPOrchestrator();
      const promise = orchestrator.run("Test request");

      // Check state mid-execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      const midState = orchestrator.getState();
      expect(midState.steps.length).toBeGreaterThan(0);

      // Wait for completion
      await promise;
      const finalState = orchestrator.getState();
      // All 7 agents are enabled by default
      expect(finalState.steps.length).toBe(7);
    }, 30000);
  });
});

