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
import { generateWithLLM, createCacheWithLLM } from "./utils/llm-helper";
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
    documents?: any[]
  ): Promise<MetaSOPResult> {
    const startTime = Date.now();
    
    // Create debug session for this generation run
    this.debugSession = createDebugSession(user_request);
    setCurrentSession(this.debugSession);
    
    logger.info("Starting MetaSOP Orchestration", {
      agents: this.config.agents.enabled.length,
      model: this.config.llm.model,
      reasoning: options?.reasoning ?? false,
      debugSessionId: this.debugSession.sessionId
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

      // Step 3: Security (runs BEFORE DevOps - security defines policy, DevOps implements it)
      // Security needs: PM spec (what to secure), Architect (tech stack, APIs, database)
      // Security produces: Auth requirements, threat model, encryption policy, compliance needs
      await this.executeStep("security_architecture", "Security", securityAgent, context, onProgress);
      context.previous_artifacts.security_architecture = this.artifacts.security_architecture;

      // Step 4: DevOps (runs AFTER Security - implements security requirements)
      // DevOps needs: Security (auth method, encryption, compliance) to configure infrastructure correctly
      // Examples: OAuth2 → identity provider setup, PCI-DSS → network segmentation, WAF → CDN config
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
        const completedAgents = this.steps.filter(s => s.status === "success").map(s => s.step_id);
        const failedAgents = this.steps.filter(s => s.status === "failed").map(s => s.step_id);
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
        graph: this.buildKnowledgeGraph(),
        a2a: this.getA2AState(),
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Orchestration error", { error: error.message, duration: `${duration}ms` });

      // Write debug session summary for failed run
      if (this.debugSession) {
        const completedAgents = this.steps.filter(s => s.status === "success").map(s => s.step_id);
        const failedAgents = this.steps.filter(s => s.status === "failed").map(s => s.step_id);
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
   * Refine a specific artifact based on user feedback
   */
  async refineArtifact(
    stepId: string,
    instruction: string,
    onProgress?: (event: MetaSOPEvent) => void,
    depth: number = 0,
    isAtomicAction: boolean = false
  ): Promise<MetaSOPResult> {
    logger.info("Starting artifact refinement", { stepId, instruction, depth, isAtomicAction });

    if (depth > this.config.performance.maxRefinementDepth) {
      logger.warn(`Refinement depth limit reached (${depth}), stopping recursion.`);
      return {
        success: true,
        artifacts: { ...this.artifacts } as any,
        report: this.report,
        steps: this.steps,
        graph: this.buildKnowledgeGraph(),
      };
    }

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
        isAtomicAction,
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
   * Determine which downstream agents actually need to be refined based on the changes.
   * This improves efficiency by skipping agents whose artifacts wouldn't be affected.
   */
  private async determineDownstreamImpact(
    upstreamStepId: string,
    instruction: string,
    downstreamSteps: string[]
  ): Promise<string[]> {
    if (downstreamSteps.length === 0) return [];

    logger.info(`Analyzing downstream impact of ${upstreamStepId} refinement...`);

    // 1. RULE-BASED PRE-SCREENING (Fast path for common cases)
    const lowerInstruction = instruction.toLowerCase();
    
    // If the instruction is very specific to documentation or minor tweaks that don't change logic/structure
    const isMinorTweak = /typo|grammar|wording|color|padding|margin|font|icon|text only|spelling/i.test(lowerInstruction);
    
    if (isMinorTweak && upstreamStepId !== "pm_spec") {
      logger.info("Impact analysis: Minor tweak detected, skipping downstream refinement.");
      return [];
    }

    // 2. LLM-BASED ANALYSIS
    try {
      const prompt = `
You are a Senior System Architect analyzing a change in a multi-agent development pipeline.

UPSTREAM STEP MODIFIED: ${upstreamStepId}
CHANGE INSTRUCTION: "${instruction}"

POTENTIAL DOWNSTREAM STEPS:
${downstreamSteps.map(step => `- ${step}`).join("\n")}

TASK:
Identify which downstream steps MUST be refined to maintain technical consistency with this change.
Only include a step if the change in '${upstreamStepId}' likely impacts its output.

REFINEMENT GUIDELINES:
- Changes to 'pm_spec' usually impact EVERYTHING downstream.
- Changes to 'arch_design' impact 'engineer_impl', 'qa_verification', and often 'devops_infrastructure' or 'security_architecture'.
- Changes to 'ui_design' usually only impact 'engineer_impl' (frontend) and 'qa_verification'.
- Changes to 'security_architecture' or 'devops_infrastructure' impact 'engineer_impl' and 'qa_verification'.

RESPONSE FORMAT:
Return ONLY a comma-separated list of the step IDs that need refinement. 
If none need refinement, return "none".
Do not provide any explanation, just the IDs.
`.trim();

      const response = await generateWithLLM(prompt, {
        temperature: 0.1,
        role: "Impact Analyzer"
      });

      const cleanedResponse = response.toLowerCase().trim();
      
      if (cleanedResponse === "none") {
        logger.info("Impact analysis: No downstream steps affected (LLM).");
        return [];
      }

      const impactedSteps = cleanedResponse
        .split(",")
        .map(s => s.trim())
        .filter(s => downstreamSteps.includes(s));

      if (impactedSteps.length > 0) {
        logger.info(`Impact analysis complete (LLM). Impacted steps: ${impactedSteps.join(", ")}`);
        return impactedSteps;
      }
    } catch (e: any) {
      logger.warn(`Impact analysis LLM failed, falling back to rule-based: ${e.message}`);
    }

    // 3. RULE-BASED FALLBACK (Enhanced path)
    logger.info("Using enhanced rule-based fallback for impact analysis.");
    
    const dependencyMap: Record<string, string[]> = {
      "pm_spec": ["arch_design", "devops_infrastructure", "security_architecture", "ui_design", "engineer_impl", "qa_verification"],
      "arch_design": ["devops_infrastructure", "security_architecture", "engineer_impl", "qa_verification"],
      "devops_infrastructure": ["engineer_impl", "qa_verification"],
      "security_architecture": ["engineer_impl", "qa_verification"],
      "ui_design": ["engineer_impl", "qa_verification"],
      "engineer_impl": ["qa_verification"],
      "qa_verification": []
    };

    // Keyword-based refinement for the rule-based fallback
    let ruleImpacted = dependencyMap[upstreamStepId] || [];
    
    if (upstreamStepId !== "pm_spec") {
      const hasUI = /ui|ux|color|font|theme|style|button|layout|screen|page|view|component|css|frontend/i.test(lowerInstruction);
      const hasBackend = /api|endpoint|database|schema|backend|server|logic|auth|security|performance|logic/i.test(lowerInstruction);
      const hasInfra = /deploy|docker|k8s|cloud|aws|infrastructure|ci|cd|pipeline|environment/i.test(lowerInstruction);

      if (hasUI && !hasBackend && !hasInfra) {
        // UI-only changes mostly impact UI Design, Engineering, and QA
        ruleImpacted = ruleImpacted.filter(step => ["ui_design", "engineer_impl", "qa_verification"].includes(step));
      } else if (!hasUI && hasBackend && !hasInfra) {
        // Backend-only changes mostly impact Architecture, Engineering, and QA
        ruleImpacted = ruleImpacted.filter(step => ["arch_design", "engineer_impl", "qa_verification"].includes(step));
      } else if (!hasUI && !hasBackend && hasInfra) {
        // Infra-only changes mostly impact DevOps and QA
        ruleImpacted = ruleImpacted.filter(step => ["devops_infrastructure", "qa_verification"].includes(step));
      }
    }

    const filteredImpacted = ruleImpacted.filter(step => downstreamSteps.includes(step));
    
    logger.info(`Impact analysis complete (Rule-based). Impacted steps: ${filteredImpacted.join(", ") || "none"}`);
    return filteredImpacted;
  }

  /**
   * Refine an artifact and then propagate changes to all downstream dependencies.
   * This ensures system-wide consistency after an update.
   */
  async cascadeRefinement(
    stepId: string,
    instruction: string,
    onProgress?: (event: MetaSOPEvent) => void,
    depth: number = 0,
    isAtomicAction: boolean = false
  ): Promise<MetaSOPResult> {
    logger.info("Starting cascading refinement", { stepId, instruction, depth, isAtomicAction });

    // 1. Refine the initial target
    const result = await this.refineArtifact(stepId, instruction, onProgress, depth, isAtomicAction);
    if (!result.success) return result;

    // 2. Identify all steps for bidirectional sync
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

    // --- PHASE 1: UPSTREAM SYNC (Maintain Source of Truth) ---
    // If we refine a downstream artifact, check if we need to update the "Foundational" artifacts
    const upstreamSteps = pipelineOrder.slice(0, startIndex);
    if (upstreamSteps.length > 0) {
        logger.info(`Checking if upstream sync is needed for ${stepId} refinement...`);
        
        // We only sync upstream if the change is significant (not a minor tweak)
        const isMinor = /typo|grammar|color|padding|margin|font/i.test(instruction.toLowerCase());
        
        if (!isMinor) {
            for (const upstreamId of upstreamSteps.reverse()) { // Update PM Spec first, then Arch
                const syncInstruction = `The downstream artifact '${stepId}' has been refined with: "${instruction}". 
Please update this upstream specification to reflect this change, ensuring the "Universal Source of Truth" remains consistent with the latest implementation decisions.`;
                
                logger.info(`Syncing upstream: Updating ${upstreamId} to align with ${stepId}...`);
                await this.refineArtifact(upstreamId, syncInstruction, onProgress, depth + 1, isAtomicAction);
            }
        }
    }

    // --- PHASE 2: DOWNSTREAM CASCADE ---
    const allDownstream = pipelineOrder.slice(startIndex + 1);
    
    // 3. Filter downstream steps that are enabled and exist
    const enabledDownstream = allDownstream.filter(id => {
      return this.config.agents.enabled.includes(id) && this.artifacts[id];
    });

    if (enabledDownstream.length === 0) {
      logger.info("No downstream artifacts to refine.");
      return result;
    }

    // 4. SMART CASCADE: Determine actual impact
    const downstreamSteps = await this.determineDownstreamImpact(stepId, instruction, enabledDownstream);

    if (downstreamSteps.length === 0) {
      return result;
    }

    let rippleCount = 0;

    // 5. Ripple the changes through downstream dependents sequentially
    // We maintain a strict linear sequence to ensure total logical alignment.
    // Each agent receives the cumulative context of all previous updates.
    for (const downstreamId of downstreamSteps) {
      if (rippleCount >= this.config.performance.maxCascadeRipples) {
        logger.warn(`Cascade ripple limit reached (${rippleCount}), stopping.`);
        break;
      }

      const alignmentInstruction = `The upstream artifact '${stepId}' has been updated with the following changes: "${instruction}". 
Please synchronize this artifact to maintain technical alignment, structural consistency, and cross-functional coherence with the updated upstream state. 
Ensure all references, dependencies, and shared logic are correctly updated while preserving existing high-quality implementation details.`;

      logger.info(`Cascading sequential ripple update to ${downstreamId}...`);

      try {
        // We use await here to ensure strict sequence
        const cascadeResult = await this.refineArtifact(downstreamId, alignmentInstruction, onProgress, depth + 1, isAtomicAction);

        if (!cascadeResult.success) {
          logger.error(`Cascading refinement failed at ${downstreamId}`);
          return cascadeResult;
        }
        rippleCount++;
      } catch (error: any) {
        logger.error(`Error during cascading refinement for ${downstreamId}: ${error.message}`);
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
  documents?: any[]
): Promise<MetaSOPResult> {
  const orchestrator = new MetaSOPOrchestrator();
  return orchestrator.run(user_request, options, onProgress, documents);
}

/**
 * Convenience function to refine an artifact
 */
export async function refineMetaSOPArtifact(
  stepId: string,
  instruction: string,
  previousArtifacts: Record<string, any>,
  onProgress?: (event: MetaSOPEvent) => void,
  cascade: boolean = false,
  isAtomicAction: boolean = false
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
    return orchestrator.cascadeRefinement(stepId, instruction, onProgress, 0, isAtomicAction);
  } else {
    return orchestrator.refineArtifact(stepId, instruction, onProgress, 0, isAtomicAction);
  }
}

