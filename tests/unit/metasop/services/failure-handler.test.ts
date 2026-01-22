import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FailureHandler, FailureType } from "@/lib/metasop/services/failure-handler";

describe("FailureHandler", () => {
  let failureHandler: FailureHandler;

  beforeEach(() => {
    failureHandler = new FailureHandler();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("analyzeFailure", () => {
    it("should identify timeout errors", () => {
      const error = new Error("Execution timeout after 30000ms");
      const analysis = failureHandler.analyzeFailure(error);

      expect(analysis.type).toBe(FailureType.TIMEOUT);
      expect(analysis.isRetryable).toBe(true);
      expect(analysis.message).toBe("Execution timeout");
    });

    it("should identify network errors", () => {
      const networkErrors = [
        new Error("Network error"),
        new Error("fetch failed"),
        new Error("Connection refused"),
        new Error("ENOTFOUND"),
        new Error("ECONNREFUSED"),
      ];

      networkErrors.forEach((error) => {
        const analysis = failureHandler.analyzeFailure(error);
        expect(analysis.type).toBe(FailureType.NETWORK);
        expect(analysis.isRetryable).toBe(true);
      });
    });

    it("should identify validation errors as non-retryable", () => {
      const validationErrors = [
        new Error("Validation error"),
        new Error("Invalid input"),
        new Error("Malformed data"),
      ];

      validationErrors.forEach((error) => {
        const analysis = failureHandler.analyzeFailure(error);
        expect(analysis.type).toBe(FailureType.VALIDATION);
        expect(analysis.isRetryable).toBe(false);
      });
    });

    it("should identify execution errors", () => {
      const executionErrors = [
        new Error("Execution error"),
        new Error("Runtime error"),
        new Error("Internal error"),
      ];

      executionErrors.forEach((error) => {
        const analysis = failureHandler.analyzeFailure(error);
        expect(analysis.type).toBe(FailureType.EXECUTION);
        expect(analysis.isRetryable).toBe(true);
      });
    });

    it("should default to unknown for unrecognized errors", () => {
      const error = new Error("Some random error");
      const analysis = failureHandler.analyzeFailure(error);

      expect(analysis.type).toBe(FailureType.UNKNOWN);
      expect(analysis.isRetryable).toBe(true); // Default to retryable
      expect(console.warn).toHaveBeenCalled();
    });

    it("should include error details in analysis", () => {
      const error = new Error("Test error");
      const analysis = failureHandler.analyzeFailure(error, {
        stepId: "test_step",
        role: "Test Role",
      });

      expect(analysis.details).toBeDefined();
      expect(analysis.details?.originalError).toBe("Test error");
    });
  });

  describe("logFailure", () => {
    it("should log retryable failures as warnings", () => {
      const error = new Error("Network error");
      const analysis = failureHandler.analyzeFailure(error);

      failureHandler.logFailure(error, analysis, {
        stepId: "test_step",
        role: "Test Role",
        attempt: 1,
      });

      expect(console.warn).toHaveBeenCalled();
    });

    it("should log non-retryable failures as errors", () => {
      const error = new Error("Validation error");
      const analysis = failureHandler.analyzeFailure(error);

      failureHandler.logFailure(error, analysis, {
        stepId: "test_step",
        role: "Test Role",
      });

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("shouldRetry", () => {
    it("should return false if max retries exceeded", () => {
      const error = new Error("Test error");
      const shouldRetry = failureHandler.shouldRetry(error, 3, 2);

      expect(shouldRetry).toBe(false);
    });

    it("should return false for non-retryable errors", () => {
      const error = new Error("Validation error");
      const shouldRetry = failureHandler.shouldRetry(error, 0, 2);

      expect(shouldRetry).toBe(false);
    });

    it("should return true for retryable errors within limit", () => {
      const error = new Error("Network error");
      const shouldRetry = failureHandler.shouldRetry(error, 1, 2);

      expect(shouldRetry).toBe(true);
    });

    it("should handle timeout error in error name", () => {
      const error = new Error("Some error");
      error.name = "TimeoutError";
      const analysis = failureHandler.analyzeFailure(error);

      expect(analysis.type).toBe(FailureType.TIMEOUT);
      expect(analysis.isRetryable).toBe(true);
    });
  });
});

