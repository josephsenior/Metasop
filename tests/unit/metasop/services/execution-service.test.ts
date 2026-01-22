import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ExecutionService, ExecutionOptions } from "@/lib/metasop/services/execution-service";
import { RetryService } from "@/lib/metasop/services/retry-service";
import type { AgentContext, MetaSOPArtifact } from "@/lib/metasop/types";

describe("ExecutionService", () => {
  let executionService: ExecutionService;
  let mockAgentFn: (context: AgentContext) => Promise<MetaSOPArtifact>;

  beforeEach(() => {
    executionService = new ExecutionService();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("executeStep", () => {
    it("should execute agent function successfully", async () => {
      const artifact: MetaSOPArtifact = {
        step_id: "test_step",
        role: "Test Role",
        content: { test: "data" },
        timestamp: new Date().toISOString(),
      };

      mockAgentFn = vi.fn().mockResolvedValue(artifact);
      const context: AgentContext = {
        user_request: "test request",
        previous_artifacts: {},
      };

      const options: ExecutionOptions = {
        timeout: 5000,
        retryPolicy: RetryService.createDefaultPolicy(),
        stepId: "test_step",
        role: "Test Role",
      };

      const result = await executionService.executeStep(mockAgentFn, context, options);

      expect(result.success).toBe(true);
      expect(result.artifact).toEqual(artifact);
      expect(result.attempts).toBe(1);
      expect(mockAgentFn).toHaveBeenCalledWith(context);
    });

    it("should handle timeout", async () => {
      mockAgentFn = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10000))
      );
      const context: AgentContext = {
        user_request: "test request",
        previous_artifacts: {},
      };

      const options: ExecutionOptions = {
        timeout: 1000,
        retryPolicy: RetryService.createFastPolicy(),
        stepId: "test_step",
        role: "Test Role",
      };

      const result = await executionService.executeStep(mockAgentFn, context, options);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain("timeout");
    }, 10000);

    it("should retry on failure", async () => {
      const artifact: MetaSOPArtifact = {
        step_id: "test_step",
        role: "Test Role",
        content: {},
        timestamp: new Date().toISOString(),
      };

      mockAgentFn = vi
        .fn()
        .mockRejectedValueOnce(new Error("First failure"))
        .mockResolvedValueOnce(artifact);

      const context: AgentContext = {
        user_request: "test request",
        previous_artifacts: {},
      };

      const options: ExecutionOptions = {
        timeout: 5000,
        retryPolicy: {
          maxRetries: 2,
          initialDelay: 100,
          maxDelay: 1000,
          backoffMultiplier: 2,
          jitter: false,
        },
        stepId: "test_step",
        role: "Test Role",
      };

      const result = await executionService.executeStep(mockAgentFn, context, options);

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
      expect(mockAgentFn).toHaveBeenCalledTimes(2);
    });

    it("should return execution time", async () => {
      const artifact: MetaSOPArtifact = {
        step_id: "test_step",
        role: "Test Role",
        content: {},
        timestamp: new Date().toISOString(),
      };

      mockAgentFn = vi.fn().mockResolvedValue(artifact);
      const context: AgentContext = {
        user_request: "test request",
        previous_artifacts: {},
      };

      const options: ExecutionOptions = {
        timeout: 5000,
        retryPolicy: RetryService.createDefaultPolicy(),
        stepId: "test_step",
        role: "Test Role",
      };

      const result = await executionService.executeStep(mockAgentFn, context, options);

      // Execution time should be tracked (may be 0 with fake timers, but should be defined)
      expect(result.executionTime).toBeDefined();
      expect(typeof result.executionTime).toBe("number");
    });
  });

  describe("executeParallel", () => {
    it("should execute multiple steps in parallel", async () => {
      const artifact1: MetaSOPArtifact = {
        step_id: "step1",
        role: "Role1",
        content: { data: "1" },
        timestamp: new Date().toISOString(),
      };

      const artifact2: MetaSOPArtifact = {
        step_id: "step2",
        role: "Role2",
        content: { data: "2" },
        timestamp: new Date().toISOString(),
      };

      const agentFn1 = vi.fn().mockResolvedValue(artifact1);
      const agentFn2 = vi.fn().mockResolvedValue(artifact2);

      const context: AgentContext = {
        user_request: "test request",
        previous_artifacts: {},
      };

      const steps = [
        {
          agentFn: agentFn1,
          context,
          options: {
            timeout: 5000,
            retryPolicy: RetryService.createDefaultPolicy(),
            stepId: "step1",
            role: "Role1",
          } as ExecutionOptions,
        },
        {
          agentFn: agentFn2,
          context,
          options: {
            timeout: 5000,
            retryPolicy: RetryService.createDefaultPolicy(),
            stepId: "step2",
            role: "Role2",
          } as ExecutionOptions,
        },
      ];

      const results = await executionService.executeParallel(steps);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[0].artifact).toEqual(artifact1);
      expect(results[1].artifact).toEqual(artifact2);
    });

    it("should handle partial failures in parallel execution", async () => {
      const artifact: MetaSOPArtifact = {
        step_id: "step1",
        role: "Role1",
        content: {},
        timestamp: new Date().toISOString(),
      };

      const agentFn1 = vi.fn().mockResolvedValue(artifact);
      const agentFn2 = vi.fn().mockRejectedValue(new Error("Step 2 failed"));

      const context: AgentContext = {
        user_request: "test request",
        previous_artifacts: {},
      };

      const steps = [
        {
          agentFn: agentFn1,
          context,
          options: {
            timeout: 5000,
            retryPolicy: RetryService.createFastPolicy(),
            stepId: "step1",
            role: "Role1",
          } as ExecutionOptions,
        },
        {
          agentFn: agentFn2,
          context,
          options: {
            timeout: 5000,
            retryPolicy: RetryService.createFastPolicy(),
            stepId: "step2",
            role: "Role2",
          } as ExecutionOptions,
        },
      ];

      const results = await executionService.executeParallel(steps);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error?.message).toBe("Step 2 failed");
    });

    it("should handle rejected promises in parallel execution", async () => {
      const agentFn1 = vi.fn().mockRejectedValue(new Error("Rejected"));
      const agentFn2 = vi.fn().mockRejectedValue("String error");

      const context: AgentContext = {
        user_request: "test request",
        previous_artifacts: {},
      };

      const steps = [
        {
          agentFn: agentFn1,
          context,
          options: {
            timeout: 5000,
            retryPolicy: RetryService.createFastPolicy(),
            stepId: "step1",
            role: "Role1",
          } as ExecutionOptions,
        },
        {
          agentFn: agentFn2,
          context,
          options: {
            timeout: 5000,
            retryPolicy: RetryService.createFastPolicy(),
            stepId: "step2",
            role: "Role2",
          } as ExecutionOptions,
        },
      ];

      const results = await executionService.executeParallel(steps);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[1].success).toBe(false);
      expect(results[0].error).toBeInstanceOf(Error);
      expect(results[1].error).toBeInstanceOf(Error);
    });
  });

  describe("edge cases", () => {
    it("should handle retry result with success but undefined result", async () => {
      // Mock retry service to return success but no result
      const retryServiceModule = await import("../retry-service");
      const mockExecuteWithRetry = vi.fn().mockResolvedValue({
        success: true,
        result: undefined,
        attempts: 1,
        totalDuration: 100,
      });

      vi.spyOn(retryServiceModule.RetryService.prototype, "executeWithRetry").mockImplementation(mockExecuteWithRetry);

      const artifact: MetaSOPArtifact = {
        step_id: "test_step",
        role: "Test Role",
        content: {},
        timestamp: new Date().toISOString(),
      };

      mockAgentFn = vi.fn().mockResolvedValue(artifact);
      const context: AgentContext = {
        user_request: "test request",
        previous_artifacts: {},
      };

      const options: ExecutionOptions = {
        timeout: 5000,
        retryPolicy: RetryService.createDefaultPolicy(),
        stepId: "test_step",
        role: "Test Role",
      };

      const result = await executionService.executeStep(mockAgentFn, context, options);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

