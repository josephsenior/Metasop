import { MetaSOPResult, MetaSOPStep, AgentContext, MetaSOPEvent } from "./types";
import { productManagerAgent } from "./agents/product-manager";
import { architectAgent } from "./agents/architect";
import { devopsAgent } from "./agents/devops";
import { securityAgent } from "./agents/security";
import { engineerAgent } from "./agents/engineer";
import { uiDesignerAgent } from "./agents/ui-designer";
import { qaAgent } from "./agents/qa";
import { logger } from "./utils/logger";
import { getConfig } from "./config";
import { createCacheWithLLM } from "./utils/llm-helper";
import { ExecutionService } from "./services/execution-service";
import { RetryService, RetryPolicy } from "./services/retry-service";
import { FailureHandler } from "./services/failure-handler";
import { 
  createDebugSession, 
  writeDebugArtifact, 
  writeSessionSummary, 
  setCurrentSession,
  type DebugSession 
} from "./utils/debug-session";
import {
  safeValidateProductManagerArtifact,
  safeValidateArchitectArtifact,
  safeValidateEngineerArtifact,
  safeValidateQAArtifact,
  safeValidateDevOpsArtifact,
  safeValidateSecurityArtifact,
  safeValidateUIDesignerArtifact,
} from "./schemas/artifact-validation";
import type { A2ATask, A2AMessage } from "./a2a-types";

/**
 * MetaSOP Orchestrator
 * Coordinates multiple AI agents to generate architecture diagrams
 */
export class MetaSOPOrchestrator {
  private steps: MetaSOPStep[] = [];
  private artifacts: Record<string, any> = {};
  private report: MetaSOPResult["report"] = {
    events: [],
  };
  private config = getConfig();
  private executionService: ExecutionService;
  private retryService: RetryService;
  private failureHandler: FailureHandler;
  private cacheId: string | undefined = undefined;
  private debugSession: DebugSession | null = null;

  // A2A Protocol State
  private a2aTasks: A2ATask[] = [];
  private a2aMessages: A2AMessage[] = [];

  constructor() {
    this.executionService = new ExecutionService();
    this.retryService = new RetryService();
    this.failureHandler = new FailureHandler();
  }

  /**
   * Create an A2A Task for inter-agent delegation
   */
  private createA2ATask(senderId: string, recipientId: string, type: string, input: Record<string, any>): A2ATask {
    const task: A2ATask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      senderId,
      recipientId,
      type,
      status: "pending",
      input,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.a2aTasks.push(task);
    return task;
  }

  /**
   * Send an A2A Message between agents
   */
  private sendA2AMessage(taskId: string, senderId: string, recipientId: string, content: string, parts?: any[]): A2AMessage {
    const message: A2AMessage = {
      taskId,
      senderId,
      recipientId,
      content,
      parts,
      timestamp: new Date().toISOString(),
    };
    this.a2aMessages.push(message);
    return message;
  }

  /**
   * Update an A2A Task status
   */
  private updateA2ATask(taskId: string, status: A2ATask["status"], output?: Record<string, any>): void {
    const task = this.a2aTasks.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      task.updatedAt = new Date().toISOString();
      if (output) task.output = output;
    }
  }

  /**
   * Get A2A state for external consumption
   */
  getA2AState(): { tasks: A2ATask[]; messages: A2AMessage[] } {
    return {
      tasks: [...this.a2aTasks],
      messages: [...this.a2aMessages],
    };
  }


  /**
   * Run the orchestration process
   */
  async run(
    user_request: string,
    options?: {
      includeStateManagement?: boolean;
      includeAPIs?: boolean;
      includeDatabase?: boolean;
      reasoning?: boolean;
    },
    onProgress?: (event: MetaSOPEvent) => void,
    documents?: any[],
    clarificationAnswers?: Record<string, string>
  ): Promise<MetaSOPResult> {
    const startTime = Date.now();
    
    // Create debug session for this generation run
    this.debugSession = createDebugSession(user_request);
    setCurrentSession(this.debugSession);
    
    logger.info("Starting MetaSOP Orchestration", {
      agents: this.config.agents.enabled.length,
      model: this.config.llm.model,
      reasoning: options?.reasoning ?? false,
      debugSessionId: this.debugSession.sessionId,
      hasClarification: !!clarificationAnswers && Object.keys(clarificationAnswers).length > 0,
    });
    this.steps = [];
    this.artifacts = {};
    this.report = { events: [] };
    this.cacheId = undefined;

    const context: AgentContext = {
      user_request,
      previous_artifacts: {},
      options,
      documents,
      clarificationAnswers,
    };

    try {
      // Step 1: Product Manager (Always full context, no cache yet)
      await this.executeStep("pm_spec", "Product Manager", productManagerAgent, context, onProgress);

      // Update context with PM artifact
      context.previous_artifacts.pm_spec = this.artifacts.pm_spec;

      // START CONTEXT CACHING: Create base cache after PM spec is ready
      if (this.config.llm.provider === "gemini" && this.config.performance.cacheEnabled) {
        try {
          // Format documents for context if they exist
          const documentsSection = documents && documents.length > 0
            ? `\n\n=== SHARED CONTEXT: SUPPLEMENTAL DOCUMENTS ===\n${documents.map((doc: any, i: number) => `Document ${i + 1}: ${doc.name || 'Untitled'}\nContent: ${doc.content || 'No content'}`).join('\n\n')}`
            : '';

          const cacheContent = `
=== SHARED CONTEXT: USER REQUEST ===
${user_request}
${documentsSection}

=== SHARED CONTEXT: PRODUCT SPECIFICATION ===
${JSON.stringify(this.artifacts.pm_spec?.content, null, 2)}
`.trim();
          this.cacheId = await createCacheWithLLM(
            cacheContent,
            "You are a professional software development team. This is a shared context cache for collaborative agent work. Use it to avoid redundancy.",
            3600,
            this.config.llm.model
          );
          logger.info("Orchestrator created base context cache", { cacheId: this.cacheId });
        } catch (cacheError: any) {
          logger.warn("Failed to create context cache, proceeding without it", { error: cacheError.message });
        }
      }

      // Inject cacheId into context for subsequent agents
      if (this.cacheId) context.cacheId = this.cacheId;

      // Step 2: Architect
      await this.executeStep("arch_design", "Architect", architectAgent, context, onProgress);

      // Update context with Architect artifact
      context.previous_artifacts.arch_design = this.artifacts.arch_design;

      // UPDATE CACHE: After Architect, the context grows significantly. 
      if (this.config.llm.provider === "gemini" && this.config.performance.cacheEnabled) {
        try {
          // Format documents for context if they exist
          const documentsSection = documents && documents.length > 0
            ? `\n\n=== SHARED CONTEXT: SUPPLEMENTAL DOCUMENTS ===\n${documents.map((doc: any, i: number) => `Document ${i + 1}: ${doc.name || 'Untitled'}\nContent: ${doc.content || 'No content'}`).join('\n\n')}`
            : '';

          const deepCacheContent = `
=== SHARED CONTEXT: USER REQUEST ===
${user_request}
${documentsSection}

=== SHARED CONTEXT: PRODUCT SPECIFICATION ===
${JSON.stringify(this.artifacts.pm_spec?.content, null, 2)}

=== SHARED CONTEXT: ARCHITECTURE DESIGN ===
${JSON.stringify(this.artifacts.arch_design?.content, null, 2)}
`.trim();
          const newCacheId = await createCacheWithLLM(
            deepCacheContent,
            "You are a professional software development team. This is deep shared context including architecture design. Reference this to ensure technical consistency across all agents.",
            3600,
            this.config.llm.model
          );
          this.cacheId = newCacheId;
          context.cacheId = this.cacheId;
          logger.info("Orchestrator updated to deep context cache", { cacheId: this.cacheId });
        } catch (e: any) {
          logger.warn("Failed to update deep context cache", { error: e.message });
        }
      }

      // Step 3: Security (runs before DevOps - defines policy and controls; DevOps implements them)
      // Security needs: PM spec, Architect for threat model and compliance
      await this.executeStep("security_architecture", "Security", securityAgent, context, onProgress);
      context.previous_artifacts.security_architecture = this.artifacts.security_architecture;

      // Step 4: DevOps (runs after Security - implements infra and CI/CD with security in mind)
      // DevOps needs: PM spec, Architect, Security (controls) to plan CI/CD and infra
      await this.executeStep("devops_infrastructure", "DevOps", devopsAgent, context, onProgress);
      context.previous_artifacts.devops_infrastructure = this.artifacts.devops_infrastructure;

      // Step 5: UI Designer
      await this.executeStep("ui_design", "UI Designer", uiDesignerAgent, context, onProgress);
      context.previous_artifacts.ui_design = this.artifacts.ui_design;

      // Step 6: Engineer
      await this.executeStep("engineer_impl", "Engineer", engineerAgent, context, onProgress);
      context.previous_artifacts.engineer_impl = this.artifacts.engineer_impl;

      // Step 7: QA
      await this.executeStep("qa_verification", "QA", qaAgent, context, onProgress);

      const success = this.steps.every((step) => step.status === "success");
      const duration = Date.now() - startTime;

      // Write debug session summary
      if (this.debugSession) {
        const completedAgents = this.steps.filter(s => s.status === "success").map(s => s.id);
        const failedAgents = this.steps.filter(s => s.status === "failed").map(s => s.id);
        writeSessionSummary(this.debugSession, {
          success,
          duration,
          agentsCompleted: completedAgents,
          agentsFailed: failedAgents,
        });
        setCurrentSession(null);
      }

      return {
        success,
        artifacts: { ...this.artifacts } as any,
        report: this.report,
        steps: this.steps,
        a2a: this.getA2AState(),
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Orchestration error", { error: error.message, duration: `${duration}ms` });

      // Write debug session summary for failed run
      if (this.debugSession) {
        const completedAgents = this.steps.filter(s => s.status === "success").map(s => s.id);
        const failedAgents = this.steps.filter(s => s.status === "failed").map(s => s.id);
        writeSessionSummary(this.debugSession, {
          success: false,
          duration,
          agentsCompleted: completedAgents,
          agentsFailed: failedAgents,
          error: error.message,
        });
        setCurrentSession(null);
      }

      return {
        success: false,
        artifacts: this.artifacts,
        report: this.report,
        steps: this.steps,
        a2a: this.getA2AState(),
      };
    }
  }

  /**
   * Execute a single step using the execution service
   */
  private async executeStep(
    stepId: string,
    role: string,
    agentFn: (context: AgentContext, onProgress?: (event: Partial<MetaSOPEvent>) => void) => Promise<any>,
    context?: AgentContext,
    onProgress?: (event: MetaSOPEvent) => void
  ): Promise<void> {
    // ... agent enable check omitted for brevity ...
    if (!this.config.agents.enabled.includes(stepId)) {
      logger.warn(`Agent ${stepId} is disabled, skipping`);
      return;
    }

    // --- A2A logic omitted for brevity ---
    const agentName = role.replace(/\s+/g, "");
    const a2aTask = this.createA2ATask("Orchestrator", agentName, stepId, context?.previous_artifacts || {});
    this.updateA2ATask(a2aTask.id, "in_progress");

    const inputArtifactNames = Object.keys(context?.previous_artifacts || {});
    const handoffMessage = inputArtifactNames.length > 0
      ? `Delegating ${stepId} to ${agentName}. Received artifacts: ${inputArtifactNames.join(", ")}.`
      : `Delegating ${stepId} to ${agentName}. Initial request.`;
    this.sendA2AMessage(a2aTask.id, "Orchestrator", agentName, handoffMessage, [
      { type: "artifact_ref", content: inputArtifactNames }
    ]);

    const step: MetaSOPStep = {
      id: stepId,
      role,
      status: "running",
      timestamp: new Date().toISOString(),
    };

    this.steps.push(step);
    this.addStepToReport(stepId, role, "running");

    if (onProgress) {
      onProgress({
        type: "step_start",
        step_id: stepId,
        role: role,
        timestamp: new Date().toISOString()
      });
    }

    const options = this.getExecutionOptions(stepId, role);

    // Capture last partial/artifact so we can send it on timeout for UI display
    let lastPartialForStep: any = null;
    const wrappedOnProgress = onProgress
      ? (ev: MetaSOPEvent) => {
          if (ev.partial_content !== undefined || ev.artifact !== undefined) {
            lastPartialForStep = ev.partial_content ?? ev.artifact;
          }
          onProgress(ev);
        }
      : undefined;

    const result = await this.executionService.executeStep(
      agentFn,
      context || { user_request: "", previous_artifacts: {}, options: {} },
      options,
      wrappedOnProgress
    );

    if (result.success && result.artifact) {
      // Validate artifact content based on step type
      const validationResult = this.validateArtifact(stepId, result.artifact);

      if (!validationResult.valid) {
        const errorMessage = `Artifact validation failed: ${validationResult.errors.join("; ")}`;
        
        // Log full artifact content for debugging
        const artifactContent = result.artifact?.content || result.artifact;
        logger.error(`Artifact validation failed for ${stepId}`, {
          errors: validationResult.errors,
          artifactContent: artifactContent, // Full artifact content
          artifactStringified: JSON.stringify(result.artifact, null, 2), // Full artifact as JSON string
        });
        
        // Save failed artifact to debug session for inspection
        if (this.debugSession) {
          const dumpContent = {
            step_id: stepId,
            role: role,
            timestamp: new Date().toISOString(),
            content: artifactContent,
            validation_errors: validationResult.errors,
            full_artifact: result.artifact,
          };
          const debugPath = writeDebugArtifact(this.debugSession, stepId, 'artifact', dumpContent);
          logger.info(`Failed artifact saved to debug session: ${debugPath}`);
        }
        
        // Validation errors block the artifact - fail the step
        step.status = "failed";
        step.error = errorMessage;
        step.timestamp = new Date().toISOString();
        this.addStepToReport(stepId, role, "failed", undefined, errorMessage);
        
        // --- A2A: Mark task failed ---
        this.updateA2ATask(a2aTask.id, "failed");
        this.sendA2AMessage(a2aTask.id, agentName, "Orchestrator", `${agentName} failed ${stepId}: ${errorMessage}`);
        logger.info(`[A2A] ${agentName} failed ${stepId}`, { taskId: a2aTask.id });
        
        // Emit failure event with artifact content for UI display
        if (onProgress) {
          onProgress({
            type: "step_failed",
            step_id: stepId,
            role: role,
            error: errorMessage,
            artifact: result.artifact, // Include artifact in failure event
            timestamp: new Date().toISOString()
          });
        }
        
        // Throw error to prevent artifact from being stored
        throw new Error(errorMessage);
      } else {
        logger.info(`Artifact validation passed for ${stepId}`);
      }

      this.artifacts[stepId] = result.artifact;
      step.status = "success";
      step.artifact = result.artifact;
      step.timestamp = new Date().toISOString();
      this.addStepToReport(stepId, role, "success", result.artifact);

      // DEBUG: Dump raw artifact to session folder for inspection
      if (this.debugSession) {
        const dumpContent = {
          step_id: stepId,
          role: role,
          timestamp: new Date().toISOString(),
          content: result.artifact.content
        };
        writeDebugArtifact(this.debugSession, stepId, 'artifact', dumpContent);
      }

      // --- A2A: Mark task completed and send completion message ---
      this.updateA2ATask(a2aTask.id, "completed", result.artifact?.content || result.artifact);
      this.sendA2AMessage(a2aTask.id, agentName, "Orchestrator", `${agentName} completed ${stepId}. Produced artifact: ${stepId}.`, [
        { type: "artifact_ref", content: { [stepId]: true } }
      ]);
      logger.info(`[A2A] ${agentName} completed ${stepId}`, { taskId: a2aTask.id });

      // Emit success event
      if (onProgress) {
        onProgress({
          type: "step_complete",
          step_id: stepId,
          role: role,
          artifact: result.artifact,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      const error = result.error || new Error("Unknown error");
      const analysis = this.failureHandler.analyzeFailure(error, { stepId, role });
      this.failureHandler.logFailure(error, analysis, { stepId, role, attempt: result.attempts });

      // Log full error details including any partial artifact if available
      logger.error(`Step ${stepId} (${role}) failed after ${result.attempts} attempts`, {
        error: error.message,
        stack: error.stack,
        executionTime: result.executionTime,
        errorDetails: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : error,
      });

      step.status = "failed";
      step.error = error.message;
      step.timestamp = new Date().toISOString();
      this.addStepToReport(stepId, role, "failed", undefined, error.message);

      // --- A2A: Mark task failed ---
      this.updateA2ATask(a2aTask.id, "failed");
      this.sendA2AMessage(a2aTask.id, agentName, "Orchestrator", `${agentName} failed ${stepId}: ${error.message}`);
      logger.info(`[A2A] ${agentName} failed ${stepId}`, { taskId: a2aTask.id, error: error.message });

      // DEBUG: Write failed agent response to debug session
      if (this.debugSession) {
        const failedResponse = {
          step_id: stepId,
          role: role,
          timestamp: new Date().toISOString(),
          error: {
            message: error.message,
            name: error.name,
            stack: error.stack,
          },
          executionTime: result.executionTime,
          attempts: result.attempts,
          // Include any partial response data if available
          partialResult: result.artifact || null,
        };
        const debugPath = writeDebugArtifact(this.debugSession, stepId, 'error', failedResponse);
        logger.info(`Failed agent response saved to debug session: ${debugPath}`);
      }

      // Emit failure event with full error details; include partial response when reason is timeout
      const isTimeout = error.message?.toLowerCase().includes("timeout") ?? false;
      if (onProgress) {
        onProgress({
          type: "step_failed",
          step_id: stepId,
          role: role,
          error: error.message,
          message: error.message,
          ...(isTimeout && lastPartialForStep != null ? { partial_response: lastPartialForStep } : {}),
          timestamp: new Date().toISOString()
        });
      }

      throw error;
    }
  }

  /**
   * Get execution options for a specific agent
   */
  private getExecutionOptions(stepId: string, role: string) {
    const agentConfig = this.config.agents.agentConfigs[stepId];
    const defaultTimeout = this.config.agents.defaultTimeout;
    const defaultRetries = this.config.agents.defaultRetries;

    const timeout = agentConfig?.timeout || defaultTimeout;
    const retries = agentConfig?.retries || defaultRetries;

    // Create retry policy
    const retryPolicy: RetryPolicy = agentConfig?.retryPolicy
      ? {
        maxRetries: retries,
        initialDelay: agentConfig.retryPolicy.initialDelay,
        maxDelay: agentConfig.retryPolicy.maxDelay,
        backoffMultiplier: agentConfig.retryPolicy.backoffMultiplier,
        jitter: agentConfig.retryPolicy.jitter,
      }
      : {
        ...RetryService.createDefaultPolicy(),
        maxRetries: retries, // Explicitly override with agent's retry setting
      };

    retryPolicy.maxRetries = retries;

    return {
      timeout,
      retryPolicy,
      stepId,
      role,
    };
  }

  /**
   * Add step event to report
   */
  private addStepToReport(
    stepId: string,
    role: string,
    status: "running" | "success" | "failed",
    artifact?: any,
    error?: string
  ): void {
    this.report.events.push({
      step_id: stepId,
      role,
      status,
      timestamp: new Date().toISOString(),
    });

    // Update step in steps array
    const step = this.steps.find((s) => s.id === stepId);
    if (step) {
      step.status = status;
      if (artifact) step.artifact = artifact;
      if (error) step.error = error;
      step.timestamp = new Date().toISOString();
    }
  }

  /**
   * Validate artifact content based on step type
   */
  private validateArtifact(stepId: string, artifact: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Extract content from artifact (artifacts are wrapped in MetaSOPArtifact structure)
    const content = artifact?.content || artifact;

    try {
      switch (stepId) {
        case "pm_spec": {
          const result = safeValidateProductManagerArtifact(content);
          if (!result.success) {
            errors.push(...result.error.errors.map((e) => `PM: ${e.path.join(".")} - ${e.message}`));
          }
          break;
        }
        case "arch_design": {
          const result = safeValidateArchitectArtifact(content);
          if (!result.success) {
            errors.push(...result.error.errors.map((e) => `Architect: ${e.path.join(".")} - ${e.message}`));
          }
          break;
        }
        case "engineer_impl": {
          const result = safeValidateEngineerArtifact(content);
          if (!result.success) {
            errors.push(...result.error.errors.map((e) => `Engineer: ${e.path.join(".")} - ${e.message}`));
          }
          break;
        }
        case "qa_verification": {
          const result = safeValidateQAArtifact(content);
          if (!result.success) {
            errors.push(...result.error.errors.map((e) => `QA: ${e.path.join(".")} - ${e.message}`));
          }
          break;
        }
        case "devops_infrastructure": {
          const result = safeValidateDevOpsArtifact(content);
          if (!result.success) {
            errors.push(...result.error.errors.map((e) => `DevOps: ${e.path.join(".")} - ${e.message}`));
          }
          break;
        }
        case "security_architecture": {
          const result = safeValidateSecurityArtifact(content);
          if (!result.success) {
            errors.push(...result.error.errors.map((e) => `Security: ${e.path.join(".")} - ${e.message}`));
          }
          break;
        }
        case "ui_design": {
          const result = safeValidateUIDesignerArtifact(content);
          if (!result.success) {
            errors.push(...result.error.errors.map((e) => `UI Designer: ${e.path.join(".")} - ${e.message}`));
          }
          break;
        }
        default:
          logger.warn(`Unknown step ID for validation: ${stepId}`);
      }
    } catch (error: any) {
      errors.push(`Validation error: ${error.message}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get current orchestration state
   */
  getState(): {
    steps: MetaSOPStep[];
    artifacts: Record<string, any>;
    report: MetaSOPResult["report"];
  } {
    return {
      steps: [...this.steps],
      artifacts: { ...this.artifacts },
      report: { ...this.report },
    };
  }
}

/**
 * Convenience function to run orchestration
 */
export async function runMetaSOPOrchestration(
  user_request: string,
  options?: {
    includeStateManagement?: boolean;
    includeAPIs?: boolean;
    includeDatabase?: boolean;
  },
  onProgress?: (event: MetaSOPEvent) => void,
  documents?: any[],
  clarificationAnswers?: Record<string, string>
): Promise<MetaSOPResult> {
  const orchestrator = new MetaSOPOrchestrator();
  return orchestrator.run(user_request, options, onProgress, documents, clarificationAnswers);
}

