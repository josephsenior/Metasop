/**
 * Execution Service - Handles step execution with timeout and error handling
 * Inspired by Forge's execution coordinator
 */

import { logger } from "../utils/logger";
import { RetryService, RetryPolicy } from "./retry-service";
import type { MetaSOPArtifact, AgentContext, MetaSOPEvent } from "../types";

export interface ExecutionOptions {
  timeout: number; // in milliseconds
  retryPolicy: RetryPolicy;
  stepId: string;
  role: string;
}

export interface ExecutionResult {
  success: boolean;
  artifact?: MetaSOPArtifact;
  error?: Error;
  executionTime: number;
  attempts: number;
}

export class ExecutionService {
  private retryService: RetryService;

  constructor() {
    this.retryService = new RetryService();
  }

  /**
   * Execute an agent function with timeout and retry logic
   */
  async executeStep(
    agentFn: (context: AgentContext, onProgress?: (event: Partial<MetaSOPEvent>) => void) => Promise<MetaSOPArtifact>,
    context: AgentContext,
    options: ExecutionOptions,
    onProgress?: (event: MetaSOPEvent) => void
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const { timeout, retryPolicy, stepId, role } = options;

    logger.info(`Executing step: ${stepId} (${role})`, {
      stepId,
      role,
      timeout,
      maxRetries: retryPolicy.maxRetries,
    });

    // Execute with retry, wrapped in timeout
    const executionPromise = this.retryService.executeWithRetry(
      async () => {
        // Create a fresh timeout promise for each attempt
        let timeoutHandle: NodeJS.Timeout;
        const attemptTimeoutPromise = new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(() => {
            reject(new Error(`Step execution timeout after ${timeout}ms`));
          }, timeout);
        });

        try {
          // Pass the onProgress callback to the agent function
          // We wrap it to ensure it includes the stepId and role
          const wrappedOnProgress = onProgress ? (event: Partial<MetaSOPEvent>) => {
            try {
              onProgress({
                ...event,
                step_id: stepId,
                role: role,
                timestamp: event.timestamp || new Date().toISOString()
              } as MetaSOPEvent);
            } catch (e: any) {
              logger.warn(`[Execution] Failed to propagate progress for ${stepId}: ${e.message}`);
              // If we detect the stream is closed, we rethrow a specific error that the orchestrator/route can handle
              if (e.message === "STREAM_CLOSED" || e.message.includes("closed")) {
                throw e; 
              }
            }
          } : undefined;

          // Wrap agent function with timeout
          const result = await Promise.race([
            agentFn(context, wrappedOnProgress),
            attemptTimeoutPromise,
          ]);

          // Clear timeout on success to avoid keeping process alive
          if (timeoutHandle!) clearTimeout(timeoutHandle);
          return result;
        } catch (error) {
          // Clear timeout if agent function failed before timeout
          if (timeoutHandle!) clearTimeout(timeoutHandle);
          throw error;
        }
      },
      retryPolicy,
      { stepId, role }
    );

    try {
      const retryResult = await executionPromise;
      const executionTime = Date.now() - startTime;

      if (retryResult.success && retryResult.result) {
        logger.info(`Step completed successfully: ${stepId}`, {
          stepId,
          role,
          executionTime,
          attempts: retryResult.attempts,
        });

        return {
          success: true,
          artifact: retryResult.result,
          executionTime,
          attempts: retryResult.attempts,
        };
      } else {
        logger.error(`Step failed after all retries: ${stepId}`, {
          stepId,
          role,
          error: retryResult.error?.message,
          attempts: retryResult.attempts,
          executionTime,
        });

        return {
          success: false,
          error: retryResult.error || new Error("Unknown error"),
          executionTime,
          attempts: retryResult.attempts,
        };
      }
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      logger.error(`Step execution error: ${stepId}`, {
        stepId,
        role,
        error: err.message,
        executionTime,
      });

      return {
        success: false,
        error: err,
        executionTime,
        attempts: 1,
      };
    }
  }

  /**
   * Execute multiple steps in parallel
   */
  async executeParallel(
    steps: Array<{
      agentFn: (context: AgentContext, onProgress?: (event: Partial<MetaSOPEvent>) => void) => Promise<MetaSOPArtifact>;
      context: AgentContext;
      options: ExecutionOptions;
      onProgress?: (event: MetaSOPEvent) => void;
    }>
  ): Promise<ExecutionResult[]> {
    logger.info(`Executing ${steps.length} steps in parallel`);

    const promises = steps.map((step) =>
      this.executeStep(step.agentFn, step.context, step.options, step.onProgress)
    );

    const results = await Promise.allSettled(promises);

    return results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        logger.error(`Parallel step execution failed`, {
          stepId: steps[index].options.stepId,
          error: result.reason?.message,
        });

        return {
          success: false,
          error: result.reason instanceof Error ? result.reason : new Error(String(result.reason)),
          executionTime: 0,
          attempts: 1,
        };
      }
    });
  }
}
