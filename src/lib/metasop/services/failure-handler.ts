/**
 * Failure Handler - Analyzes and categorizes failures
 * Inspired by Forge's failure handling system
 */

import { logger } from "../utils/logger";

export enum FailureType {
  TIMEOUT = "timeout",
  NETWORK = "network",
  RATE_LIMIT = "rate_limit",
  VALIDATION = "validation",
  EXECUTION = "execution",
  UNKNOWN = "unknown",
}

export interface FailureAnalysis {
  type: FailureType;
  isRetryable: boolean;
  message: string;
  details?: Record<string, any>;
}

export class FailureHandler {
  /**
   * Analyze a failure and determine if it's retryable
   */
  analyzeFailure(error: Error, context?: { stepId?: string; role?: string }): FailureAnalysis {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Timeout errors
    if (errorMessage.includes("timeout") || errorName.includes("timeout")) {
      return {
        type: FailureType.TIMEOUT,
        isRetryable: true,
        message: "Execution timeout",
        details: { originalError: error.message },
      };
    }

    // Network errors
    if (
      errorMessage.includes("network") ||
      errorMessage.includes("fetch") ||
      errorMessage.includes("connection") ||
      errorMessage.includes("econnrefused") ||
      errorMessage.includes("enotfound")
    ) {
      return {
        type: FailureType.NETWORK,
        isRetryable: true,
        message: "Network error",
        details: { originalError: error.message },
      };
    }

    // Rate limit and quota errors
    if (
      errorMessage.includes("rate limit") ||
      errorMessage.includes("too many requests") ||
      errorMessage.includes("quota") ||
      errorMessage.includes("exhausted")
    ) {
      return {
        type: FailureType.RATE_LIMIT,
        isRetryable: true,
        message: "Rate limit or quota exceeded",
        details: { originalError: error.message },
      };
    }

    // Validation errors (usually not retryable)
    if (
      errorMessage.includes("validation") ||
      errorMessage.includes("invalid") ||
      errorMessage.includes("malformed")
    ) {
      return {
        type: FailureType.VALIDATION,
        isRetryable: false,
        message: "Validation error",
        details: { originalError: error.message },
      };
    }

    // Execution errors (may be retryable)
    if (
      errorMessage.includes("execution") ||
      errorMessage.includes("runtime") ||
      errorMessage.includes("internal")
    ) {
      return {
        type: FailureType.EXECUTION,
        isRetryable: true,
        message: "Execution error",
        details: { originalError: error.message },
      };
    }

    // Unknown errors (default to retryable)
    logger.warn("Unknown error type, defaulting to retryable", {
      error: error.message,
      ...context,
    });

    return {
      type: FailureType.UNKNOWN,
      isRetryable: true,
      message: "Unknown error",
      details: { originalError: error.message },
    };
  }

  /**
   * Log failure with context
   */
  logFailure(
    error: Error,
    analysis: FailureAnalysis,
    context?: { stepId?: string; role?: string; attempt?: number }
  ): void {
    const logData = {
      ...context,
      failureType: analysis.type,
      isRetryable: analysis.isRetryable,
      error: error.message,
      ...analysis.details,
    };

    if (analysis.isRetryable) {
      logger.warn("Retryable failure detected", logData);
    } else {
      logger.error("Non-retryable failure detected", logData);
    }
  }

  /**
   * Determine if error should trigger retry
   */
  shouldRetry(error: Error, attempt: number, maxRetries: number): boolean {
    if (attempt >= maxRetries) {
      return false;
    }

    const analysis = this.analyzeFailure(error);
    return analysis.isRetryable;
  }
}

