import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RetryService, RetryPolicy } from "@/lib/metasop/services/retry-service";

describe("RetryService", () => {
  let retryService: RetryService;

  beforeEach(() => {
    retryService = new RetryService();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("executeWithRetry", () => {
    it("should succeed on first attempt", async () => {
      const fn = vi.fn().mockResolvedValue("success");
      const policy = RetryService.createDefaultPolicy();
      policy.maxRetries = 2;

      const promise = retryService.executeWithRetry(fn, policy);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.success).toBe(true);
      expect(result.result).toBe("success");
      expect(result.attempts).toBe(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should retry on failure and succeed on second attempt", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("First failure"))
        .mockResolvedValueOnce("success");
      const policy = RetryService.createDefaultPolicy();
      policy.maxRetries = 2;
      policy.initialDelay = 100;

      const promise = retryService.executeWithRetry(fn, policy);
      await vi.advanceTimersByTimeAsync(100);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.success).toBe(true);
      expect(result.result).toBe("success");
      expect(result.attempts).toBe(2);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should fail after max retries", async () => {
      const error = new Error("Persistent failure");
      const fn = vi.fn().mockRejectedValue(error);
      const policy = RetryService.createDefaultPolicy();
      policy.maxRetries = 2;
      policy.initialDelay = 100;

      const promise = retryService.executeWithRetry(fn, policy);
      await vi.advanceTimersByTimeAsync(500);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      expect(result.attempts).toBe(3); // initial + 2 retries
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should apply exponential backoff", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("Failure"));
      const policy: RetryPolicy = {
        maxRetries: 2,
        initialDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2,
        jitter: false,
      };

      const promise = retryService.executeWithRetry(fn, policy);
      
      // First retry should wait 100ms
      await vi.advanceTimersByTimeAsync(100);
      expect(fn).toHaveBeenCalledTimes(2);
      
      // Second retry should wait 200ms (100 * 2)
      await vi.advanceTimersByTimeAsync(200);
      expect(fn).toHaveBeenCalledTimes(3);
      
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3);
    });

    it("should respect max delay cap", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("Failure"));
      const policy: RetryPolicy = {
        maxRetries: 2,
        initialDelay: 1000,
        maxDelay: 2000,
        backoffMultiplier: 10, // Would be 10000ms without cap
        jitter: false,
      };

      const promise = retryService.executeWithRetry(fn, policy);
      await vi.advanceTimersByTimeAsync(3000);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.success).toBe(false);
      // Should not exceed maxDelay
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should add jitter when enabled", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("Failure"));
      const policy: RetryPolicy = {
        maxRetries: 1,
        initialDelay: 1000,
        maxDelay: 2000,
        backoffMultiplier: 2,
        jitter: true,
      };

      const promise = retryService.executeWithRetry(fn, policy);
      await vi.advanceTimersByTimeAsync(1500); // Should be between 800-1200ms with jitter
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.success).toBe(false);
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("createDefaultPolicy", () => {
    it("should create default policy with correct values", () => {
      const policy = RetryService.createDefaultPolicy();

      expect(policy.maxRetries).toBe(0);
      expect(policy.initialDelay).toBe(0);
      expect(policy.maxDelay).toBe(0);
      expect(policy.backoffMultiplier).toBe(1);
      expect(policy.jitter).toBe(false);
    });
  });

  describe("createAggressivePolicy", () => {
    it("should create aggressive policy with more retries", () => {
      const policy = RetryService.createAggressivePolicy();

      expect(policy.maxRetries).toBe(5);
      expect(policy.initialDelay).toBe(2000);
      expect(policy.maxDelay).toBe(60000);
    });
  });

  describe("createFastPolicy", () => {
    it("should create fast policy with fewer retries", () => {
      const policy = RetryService.createFastPolicy();

      expect(policy.maxRetries).toBe(1);
      expect(policy.initialDelay).toBe(500);
      expect(policy.maxDelay).toBe(5000);
      expect(policy.jitter).toBe(false);
    });
  });
});

