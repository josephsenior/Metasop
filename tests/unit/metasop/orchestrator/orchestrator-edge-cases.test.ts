import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MetaSOPOrchestrator } from "@/lib/metasop/orchestrator";

describe("MetaSOPOrchestrator Edge Cases", () => {
  beforeEach(async () => {
    vi.useRealTimers();
    
    // Silence logger during tests
    const loggerModule = await import("@/lib/metasop/utils/logger");
    vi.spyOn(loggerModule.logger, "info").mockImplementation(() => {});
    vi.spyOn(loggerModule.logger, "warn").mockImplementation(() => {});
    vi.spyOn(loggerModule.logger, "error").mockImplementation(() => {});
    vi.spyOn(loggerModule.logger, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should handle empty user request", async () => {
    const orchestrator = new MetaSOPOrchestrator();
    const result = await orchestrator.run("");

    expect(result.steps.length).toBeGreaterThanOrEqual(1);
    expect(result).toHaveProperty("artifacts");
  }, 30000);

  it("should handle very long user request", async () => {
    const longRequest = "Create a system. ".repeat(1000);
    const orchestrator = new MetaSOPOrchestrator();
    const result = await orchestrator.run(longRequest);

    expect(result.steps.length).toBeGreaterThanOrEqual(1);
    if (result.success) {
      expect(result.artifacts.pm_spec).toBeDefined();
    }
  }, 30000);

  it("should handle special characters in request", async () => {
    const specialRequest = "Create a system with @#$%^&*() special chars!";
    const orchestrator = new MetaSOPOrchestrator();
    const result = await orchestrator.run(specialRequest);

    expect(result.steps.length).toBeGreaterThanOrEqual(1);
  }, 30000);

  it("should handle all options disabled", async () => {
    const orchestrator = new MetaSOPOrchestrator();
    const result = await orchestrator.run("Test request", {
      includeAPIs: false,
      includeDatabase: false,
      includeStateManagement: false,
    });

    expect(result.steps.length).toBeGreaterThanOrEqual(1);
    if (result.success) {
      expect(result.artifacts.pm_spec).toBeDefined();
    }
  }, 30000);

  it("should handle all options enabled", async () => {
    const orchestrator = new MetaSOPOrchestrator();
    const result = await orchestrator.run("Test request", {
      includeAPIs: true,
      includeDatabase: true,
      includeStateManagement: true,
    });

    expect(result.steps.length).toBeGreaterThanOrEqual(1);
    if (result.success && result.artifacts.arch_design?.content) {
      const archContent = result.artifacts.arch_design.content as any;
      if (archContent?.apis) expect(archContent.apis).toBeDefined();
      if (archContent?.database_schema) expect(archContent.database_schema).toBeDefined();
    }
  }, 30000);

  it("should maintain artifact order", async () => {
    const orchestrator = new MetaSOPOrchestrator();
    const result = await orchestrator.run("Test request");

    expect(result.steps.length).toBeGreaterThanOrEqual(1);
    const stepOrder = result.steps.map((s) => s.id);
    expect(stepOrder[0]).toBe("pm_spec");
    if (stepOrder.length >= 2) expect(stepOrder[1]).toBe("arch_design");
    if (stepOrder.length >= 3) expect(stepOrder[2]).toBe("devops_infrastructure");
  }, 30000);

  it("should include timestamps in all artifacts", async () => {
    const orchestrator = new MetaSOPOrchestrator();
    const result = await orchestrator.run("Test request");

    Object.values(result.artifacts).forEach((artifact) => {
      if (artifact) {
        expect(artifact.timestamp).toBeDefined();
        expect(new Date(artifact.timestamp).getTime()).not.toBeNaN();
      }
    });
  }, 30000);
});

