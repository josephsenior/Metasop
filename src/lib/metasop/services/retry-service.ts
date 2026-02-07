/**
 * Retry Service - Inspired by Forge's robust retry handling
 * Handles retry logic with exponential backoff and failure analysis
 */

import { logger } from "../utils/logger";

export interface RetryPolicy {
  maxRetries: number;
  initialDelay: number; // in milliseconds
  maxDelay: number; // in milliseconds
  backoffMultiplier: number;
  jitter: boolean; // Add randomness to prevent thundering herd
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalDuration: number;
}

export class RetryService {
  /**
   * Execute a function with retry logic and exponential backoff
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    policy: RetryPolicy,
    context?: { stepId?: string; role?: string }
  ): Promise<RetryResult<T>> {
    const startTime = Date.now();
    let lastError: Error | undefined;
    let attempts = 0;

    for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
      attempts = attempt + 1;

      try {
        const result = await fn();
        const totalDuration = Date.now() - startTime;

        if (attempt > 0) {
          logger.info(
            `Retry succeeded after ${attempt} retries`,
            context ? { ...context, attempts, duration: totalDuration } : { attempts, duration: totalDuration }
          );
        }

        return {
          success: true,
          result,
          attempts,
          totalDuration,
        };
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // DO NOT retry if the client disconnected (Stream closed)
        if (lastError.message === "STREAM_CLOSED") {
          return {
            success: false,
            error: lastError,
            attempts,
            totalDuration: Date.now() - startTime,
          };
        }

        if (attempt < policy.maxRetries) {
          // Check if this is a rate limit error and apply special handling
          const isRateLimit = this.isRateLimitError(lastError);
          const delay = isRateLimit
            ? this.calculateRateLimitDelay(attempt, policy)
            : this.calculateBackoffDelay(attempt, policy);

          const retryType = isRateLimit ? 'rate limit' : 'general';
          logger.warn(
            `Attempt ${attempts} failed (${retryType} error), retrying in ${delay}ms`,
            context
            ? {
                ...context,
                error: lastError.message,
                nextRetryIn: delay,
                retryType,
              }
            : { error: lastError.message, nextRetryIn: delay, retryType }
          );

          await this.sleep(delay);
        } else {
          const totalDuration = Date.now() - startTime;
          logger.error(
            `All ${attempts} attempts failed`,
            context
            ? {
                ...context,
                error: lastError.message,
                totalDuration,
              }
            : { error: lastError.message, totalDuration }
          );
        }
      }
    }

    return {
      success: false,
      error: lastError,
      attempts,
      totalDuration: Date.now() - startTime,
    };
  }

  /**
   * Check if error is a rate limit error
   */
  private isRateLimitError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('rate limit') ||
           message.includes('too many requests') ||
           message.includes('requests per min') ||
           message.includes('rpm') ||
           message.includes('quota') ||
           message.includes('exhausted');
  }

  /**
   * Calculate backoff delay with exponential backoff and optional jitter
   */
  private calculateBackoffDelay(attempt: number, policy: RetryPolicy): number {
    // Exponential backoff: initialDelay * (backoffMultiplier ^ attempt)
    let delay = policy.initialDelay * Math.pow(policy.backoffMultiplier, attempt);

    // Apply max delay cap
    delay = Math.min(delay, policy.maxDelay);

    // Add jitter to prevent thundering herd problem
    if (policy.jitter) {
      // Random jitter between 0.8 and 1.2 of the delay
      const jitterFactor = 0.8 + Math.random() * 0.4;
      delay = delay * jitterFactor;
    }

    return Math.floor(delay);
  }

  /**
   * Calculate delay specifically for rate limit errors
   * Uses much longer delays to respect API rate limits
   */
  private calculateRateLimitDelay(attempt: number, policy: RetryPolicy): number {
    // For rate limits, start with at least 20 seconds (matching OpenAI's suggestion)
    // and use exponential backoff from there
    const rateLimitBaseDelay = 20000; // 20 seconds
    let delay = rateLimitBaseDelay * Math.pow(policy.backoffMultiplier, attempt);

    // Apply max delay cap (but allow longer delays for rate limits)
    const rateLimitMaxDelay = Math.max(policy.maxDelay, 120000); // At least 2 minutes
    delay = Math.min(delay, rateLimitMaxDelay);

    // Add jitter to prevent thundering herd problem
    if (policy.jitter) {
      // Random jitter between 0.9 and 1.1 of the delay (less jitter for rate limits)
      const jitterFactor = 0.9 + Math.random() * 0.2;
      delay = delay * jitterFactor;
    }

    return Math.floor(delay);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Create default retry policy - NO RETRIES (fail fast)
   */
  static createDefaultPolicy(): RetryPolicy {
    return {
      maxRetries: 0, // No retries - fail immediately on error
      initialDelay: 0,
      maxDelay: 0,
      backoffMultiplier: 1,
      jitter: false,
    };
  }

  /**
   * Create no-retry policy (explicit fail-fast)
   */
  static createNoRetryPolicy(): RetryPolicy {
    return {
      maxRetries: 0,
      initialDelay: 0,
      maxDelay: 0,
      backoffMultiplier: 1,
      jitter: false,
    };
  }

  /**
   * Create fast policy (1 retry, short delays) for tests or low-latency paths
   */
  static createFastPolicy(): RetryPolicy {
    return {
      maxRetries: 1,
      initialDelay: 500,
      maxDelay: 5000,
      backoffMultiplier: 2,
      jitter: false,
    };
  }

  /**
   * Create aggressive policy (more retries, longer delays) for critical operations
   */
  static createAggressivePolicy(): RetryPolicy {
    return {
      maxRetries: 5,
      initialDelay: 2000,
      maxDelay: 60000,
      backoffMultiplier: 2,
      jitter: true,
    };
  }
}

