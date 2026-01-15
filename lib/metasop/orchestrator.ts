import { MetaSOPResult, MetaSOPStep, AgentContext, MetaSOPEvent, KnowledgeGraph, ArtifactDependency } from "./types";
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
import * as fs from "fs";
import * as path from "path";
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
    onProgress?: (event: MetaSOPEvent) => void
  ): Promise<MetaSOPResult> {
    const startTime = Date.now();
    logger.info("Starting MetaSOP Orchestration", {
      agents: this.config.agents.enabled.length,
      model: this.config.llm.model,
      reasoning: options?.reasoning ?? false
    });
    this.steps = [];
    this.artifacts = {};
    this.report = { events: [] };
    this.cacheId = undefined;

    const context: AgentContext = {
      user_request,
      previous_artifacts: {},
      options,
    };

    try {
      // Step 1: Product Manager (Always full context, no cache yet)
      await this.executeStep("pm_spec", "Product Manager", productManagerAgent, context, onProgress);

      // Update context with PM artifact
      context.previous_artifacts.pm_spec = this.artifacts.pm_spec;

      // START CONTEXT CACHING: Create base cache after PM spec is ready
      if (this.config.llm.provider === "gemini" && this.config.performance.cacheEnabled) {
        try {
          const cacheContent = `
=== SHARED CONTEXT: USER REQUEST ===
${user_request}

=== SHARED CONTEXT: PRODUCT SPECIFICATION ===
${JSON.stringify(this.artifacts.pm_spec?.content, null, 2)}
`.trim();
          this.cacheId = await createCacheWithLLM(
            cacheContent,
            "You are a professional software development team. This is a shared context cache for collaborative agent work. Use it to avoid redundancy."
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
          const deepCacheContent = `
=== SHARED CONTEXT: USER REQUEST ===
${user_request}

=== SHARED CONTEXT: PRODUCT SPECIFICATION ===
${JSON.stringify(this.artifacts.pm_spec?.content, null, 2)}

=== SHARED CONTEXT: ARCHITECTURE DESIGN ===
${JSON.stringify(this.artifacts.arch_design?.content, null, 2)}
`.trim();
          const newCacheId = await createCacheWithLLM(
            deepCacheContent,
            "You are a professional software development team. This is deep shared context including architecture design. Reference this to ensure technical consistency across all agents."
          );
          this.cacheId = newCacheId;
          context.cacheId = this.cacheId;
          logger.info("Orchestrator updated to deep context cache", { cacheId: this.cacheId });
        } catch (e: any) {
          logger.warn("Failed to update deep context cache", { error: e.message });
        }
      }

      // Step 3: DevOps
      await this.executeStep("devops_infrastructure", "DevOps", devopsAgent, context, onProgress);
      context.previous_artifacts.devops_infrastructure = this.artifacts.devops_infrastructure;

      // Step 4: Security
      await this.executeStep("security_architecture", "Security", securityAgent, context, onProgress);
      context.previous_artifacts.security_architecture = this.artifacts.security_architecture;

      // Step 5: UI Designer
      await this.executeStep("ui_design", "UI Designer", uiDesignerAgent, context, onProgress);
      context.previous_artifacts.ui_design = this.artifacts.ui_design;

      // Step 6: Engineer
      await this.executeStep("engineer_impl", "Engineer", engineerAgent, context, onProgress);
      context.previous_artifacts.engineer_impl = this.artifacts.engineer_impl;

      // Step 7: QA
      await this.executeStep("qa_verification", "QA", qaAgent, context, onProgress);

      const success = this.steps.every((step) => step.status === "success");

      return {
        success,
        artifacts: { ...this.artifacts } as any,
        report: this.report,
        steps: this.steps,
        graph: this.buildKnowledgeGraph(),
        a2a: this.getA2AState(),
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Orchestration error", { error: error.message, duration: `${duration}ms` });
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
   * Refine a specific artifact based on user feedback
   */
  async refineArtifact(
    stepId: string,
    instruction: string,
    onProgress?: (event: MetaSOPEvent) => void
  ): Promise<MetaSOPResult> {
    logger.info("Starting artifact refinement", { stepId, instruction });

    const currentArtifact = this.artifacts[stepId];
    if (!currentArtifact) {
      throw new Error(`Cannot refine artifact ${stepId}: artifact not found`);
    }

    const context: AgentContext = {
      user_request: instruction,
      previous_artifacts: { ...this.artifacts },
      refinement: {
        instruction,
        target_step_id: stepId,
        previous_artifact_content: currentArtifact.content,
      }
    };

    if (this.cacheId) context.cacheId = this.cacheId;

    const agentMap: Record<string, any> = {
      pm_spec: productManagerAgent,
      arch_design: architectAgent,
      devops_infrastructure: devopsAgent,
      security_architecture: securityAgent,
      engineer_impl: engineerAgent,
      ui_design: uiDesignerAgent,
      qa_verification: qaAgent,
    };

    const agentFn = agentMap[stepId];
    if (!agentFn) {
      throw new Error(`No agent function found for step ${stepId}`);
    }

    this.steps = this.steps.filter(s => s.id !== stepId);
    await this.executeStep(stepId, stepId.replace(/_/g, " "), agentFn, context, onProgress);

    return {
      success: this.steps.every(s => s.status === "success"),
      artifacts: { ...this.artifacts } as any,
      report: this.report,
      steps: this.steps,
      graph: this.buildKnowledgeGraph(),
    };
  }

  /**
   * Refine an artifact and then propagate changes to all downstream dependencies.
   * This ensures system-wide consistency after an update.
   */
  async cascadeRefinement(
    stepId: string,
    instruction: string,
    onProgress?: (event: MetaSOPEvent) => void
  ): Promise<MetaSOPResult> {
    logger.info("Starting cascading refinement", { stepId, instruction });

    // 1. Refine the initial target
    const result = await this.refineArtifact(stepId, instruction, onProgress);
    if (!result.success) return result;

    // 2. Identify downstream agents based on the standard MetaSOP pipeline order
    const pipelineOrder = [
      "pm_spec",
      "arch_design",
      "devops_infrastructure",
      "security_architecture",
      "ui_design",
      "engineer_impl",
      "qa_verification"
    ];

    const startIndex = pipelineOrder.indexOf(stepId);
    if (startIndex === -1) {
      throw new Error(`Unknown step ID: ${stepId}`);
    }

    const downstreamSteps = pipelineOrder.slice(startIndex + 1);

    // 3. Ripple the changes through downstream dependents
    for (const downstreamId of downstreamSteps) {
      // Skip if agent is disabled in config
      if (!this.config.agents.enabled.includes(downstreamId)) {
        logger.debug(`Skipping disabled downstream agent during cascade: ${downstreamId}`);
        continue;
      }

      // Check if artifact even exists yet (might be a partial generation)
      if (!this.artifacts[downstreamId]) {
        logger.debug(`Skipping missing downstream artifact during cascade: ${downstreamId}`);
        continue;
      }

      const alignmentInstruction = `The upstream artifact '${stepId}' has been refined with the following changes: "${instruction}". 
Please refine this artifact to ensure full technical alignment and consistency with these updates. 
Maintain all existing high-quality elements while incorporating necessary adjustments.`;

      logger.info(`Cascading ripple update to ${downstreamId}...`);

      try {
        const cascadeResult = await this.refineArtifact(downstreamId, alignmentInstruction, onProgress);

        if (!cascadeResult.success) {
          logger.error(`Cascading refinement failed at ${downstreamId}`);
          return cascadeResult;
        }
      } catch (error: any) {
        logger.error(`Error during cascading refinement for ${downstreamId}: ${error.message}`);
        // For cascade, we can decide if we want to fail hard or just log a warning
        // Given the goal of "useful system", we should probably stop if consistency is broken
        throw error;
      }
    }

    logger.info("Cascading refinement completed successfully across all dependents");

    return {
      success: true,
      artifacts: { ...this.artifacts } as any,
      report: this.report,
      steps: this.steps,
      graph: this.buildKnowledgeGraph(),
    };
  }

  /**
   * Build a knowledge graph of the artifacts
   */
  private buildKnowledgeGraph(): KnowledgeGraph {
    const nodes = Object.values(this.artifacts);
    const edges: ArtifactDependency[] = [];

    if (this.artifacts.pm_spec && this.artifacts.arch_design) {
      edges.push({ source_id: "pm_spec", target_id: "arch_design", type: "data_flow" });
    }
    if (this.artifacts.arch_design && this.artifacts.engineer_impl) {
      edges.push({ source_id: "arch_design", target_id: "engineer_impl", type: "api_contract" });
    }

    return { nodes, edges };
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

    const result = await this.executionService.executeStep(
      agentFn,
      context || { user_request: "", previous_artifacts: {}, options: {} },
      options,
      onProgress
    );

    if (result.success && result.artifact) {
      // Validate artifact content based on step type
      const validationResult = this.validateArtifact(stepId, result.artifact);

      if (!validationResult.valid) {
        logger.warn(`Artifact validation failed for ${stepId}`, {
          errors: validationResult.errors,
          artifactPreview: JSON.stringify(result.artifact).substring(0, 500),
        });
        // Continue with artifact even if validation fails (lenient approach)
        // Log warnings but don't fail the step
      } else {
        logger.info(`Artifact validation passed for ${stepId}`);
      }

      this.artifacts[stepId] = result.artifact;
      step.status = "success";
      step.artifact = result.artifact;
      step.timestamp = new Date().toISOString();
      this.addStepToReport(stepId, role, "success", result.artifact);

      // DEBUG: Dump raw artifact to file for inspection
      try {
        const dumpPath = path.join(process.cwd(), `${stepId}_raw_response.json`);
        const dumpContent = {
          step_id: stepId,
          role: role,
          content: result.artifact.content
        };
        // Use synchronous write to ensure it's written before moving on
        fs.writeFileSync(dumpPath, JSON.stringify(dumpContent, null, 2));
        logger.info(`[DEBUG] Dumped raw artifact to ${dumpPath}`);
      } catch (dumpError: any) {
        logger.warn(`[DEBUG] Failed to dump artifact for ${stepId}: ${dumpError.message}`);
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

      step.status = "failed";
      step.error = error.message;
      step.timestamp = new Date().toISOString();
      this.addStepToReport(stepId, role, "failed", undefined, error.message);

      // --- A2A: Mark task failed ---
      this.updateA2ATask(a2aTask.id, "failed");
      this.sendA2AMessage(a2aTask.id, agentName, "Orchestrator", `${agentName} failed ${stepId}: ${error.message}`);
      logger.info(`[A2A] ${agentName} failed ${stepId}`, { taskId: a2aTask.id, error: error.message });

      // Emit failure event
      if (onProgress) {
        onProgress({
          type: "step_failed",
          step_id: stepId,
          role: role,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }

      // Log detailed error for debugging
      logger.error(`Step ${stepId} (${role}) failed after ${result.attempts} attempts`, {
        error: error.message,
        stack: error.stack,
        executionTime: result.executionTime,
      });

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
      : RetryService.createDefaultPolicy();

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
  onProgress?: (event: MetaSOPEvent) => void
): Promise<MetaSOPResult> {
  const orchestrator = new MetaSOPOrchestrator();
  return orchestrator.run(user_request, options, onProgress);
}

/**
 * Convenience function to refine an artifact
 */
export async function refineMetaSOPArtifact(
  stepId: string,
  instruction: string,
  previousArtifacts: Record<string, any>,
  onProgress?: (event: MetaSOPEvent) => void,
  cascade: boolean = false
): Promise<MetaSOPResult> {
  const orchestrator = new MetaSOPOrchestrator();
  // Hydrate orchestrator with previous state
  (orchestrator as any).artifacts = previousArtifacts;
  // Create dummy steps for the previous artifacts to maintain consistency
  (orchestrator as any).steps = Object.keys(previousArtifacts).map(id => ({
    id,
    name: id.replace(/_/g, " "),
    status: "success",
    role: id.replace(/_impl|_spec|_design/g, "")
  }));

  if (cascade) {
    return orchestrator.cascadeRefinement(stepId, instruction, onProgress);
  } else {
    return orchestrator.refineArtifact(stepId, instruction, onProgress);
  }
}

