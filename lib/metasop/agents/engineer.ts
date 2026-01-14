import type { AgentContext, MetaSOPArtifact, MetaSOPEvent } from "../types";
import type { EngineerBackendArtifact } from "../artifacts/engineer/types";
import { engineerSchema } from "../artifacts/engineer/schema";
import { generateStreamingStructuredWithLLM } from "../utils/llm-helper";
import { logger } from "../utils/logger";
import { buildRefinementPrompt, shouldUseRefinement } from "../utils/refinement-helper";

/**
 * Engineer Agent
 * Generates implementation plan, file structure, and code
 * Uses EXACT Forge backend JSON schema structure (engineer.schema.json)
 */
export async function engineerAgent(
  context: AgentContext,
  onProgress?: (event: Partial<MetaSOPEvent>) => void
): Promise<MetaSOPArtifact> {
  const { user_request, previous_artifacts } = context;
  const archDesign = previous_artifacts.arch_design;
  const pmSpec = previous_artifacts.pm_spec;
  const uiDesign = previous_artifacts.ui_design;

  logger.info("Engineer agent starting", { user_request: user_request.substring(0, 100) });

  try {
    let engineerPrompt: string;

    if (shouldUseRefinement(context)) {
      logger.info("Engineer agent in REFINEMENT mode");
      const previousEngineerContent = context.previous_artifacts?.engineer_impl?.content as EngineerBackendArtifact | undefined;
      const guidelines = `
1. **Implementation Plan**: Update phases or tasks based on new requirements
2. **File Structure**: Add new files or directories as needed
3. **Dependencies**: Add or update package dependencies (${previousEngineerContent?.dependencies?.length || 0} existing)
4. **Technical Decisions**: Document new patterns or architectural choices`;
      engineerPrompt = buildRefinementPrompt(context, "Engineer", guidelines);
    } else {
      const pmArtifact = pmSpec?.content as any;
      const archArtifact = archDesign?.content as any;
      const uiArtifact = uiDesign?.content as any;
      const projectTitle = pmArtifact?.title || "Project";

      engineerPrompt = `As an expert Software Engineer, your task is to design the technical implementation plan for '${projectTitle}'.

${pmArtifact ? `Project Context: ${pmArtifact.summary}` : `User Request: ${user_request}`}
${archArtifact ? `Architecture Target: ${archArtifact.summary}
Tech Stack: ${Object.values(archArtifact.technology_stack || {}).flat().slice(0, 5).join(", ")}` : ""}
${uiArtifact ? `Visual Strategy: ${uiArtifact.summary}
Design Tokens: primary=${uiArtifact.design_tokens?.colors?.primary}, background=${uiArtifact.design_tokens?.colors?.background}` : ""}

Please provide a comprehensive and detailed technical roadmap:
1. **Implementation Plan**: A detailed step-by-step technical implementation guide (Markdown). This should be a robust roadmap that a senior developer could follow.
2. **State Management**: Your specific strategy for managing application state, including tool choices and data flow.
3. **File Structure**: An organized directory tree. Note: Only include metadata (names), DO NOT include any file source code or content.
4. **Technical Decisions**: Critical architectural choices, rationales, and considered alternatives.
5. **Dependencies**: Essential libraries and tools required for the build, including versions.
6. **Phases**: Essential implementation phases with granular technical tasks and milestones.

Important Guidelines:
- Focus on high architectural clarity and technical depth.
- Avoid being overly brief; ensure every section provides actionable technical value.
- Keep descriptions professional and avoid repetitive phrasing.
- Ensure all fields in the schema are populated with meaningful, detailed data.

RESPOND WITH ONLY THE JSON OBJECT - NO PREAMBLE OR EXPLANATION.`;
    }

    let llmEngineerImpl: EngineerBackendArtifact | null = null;

    try {
      llmEngineerImpl = await generateStreamingStructuredWithLLM<EngineerBackendArtifact>(
        engineerPrompt,
        engineerSchema,
        (partialEvent) => {
          if (onProgress) {
            onProgress(partialEvent);
          }
        },
        {
          reasoning: true,
          temperature: 0.3, // Increased to avoid deterministic loops/recitation
          cacheId: context.cacheId,
          role: "Engineer",
          maxTokens: 32000 // Safer token limit to prevent overflow
        }
      );
    } catch (error: any) {
      logger.error("Engineer agent LLM call failed", { error: error.message });
      throw error;
    }

    if (!llmEngineerImpl) {
      throw new Error("Engineer agent failed: No structured data received from LLM");
    }

    const content: EngineerBackendArtifact = {
      summary: llmEngineerImpl.summary,
      description: llmEngineerImpl.description,
      artifact_path: llmEngineerImpl.artifact_path,
      file_structure: llmEngineerImpl.file_structure,
      implementation_plan: llmEngineerImpl.implementation_plan,
      phases: llmEngineerImpl.phases,
      dependencies: llmEngineerImpl.dependencies,
      technical_decisions: llmEngineerImpl.technical_decisions,
      environment_variables: llmEngineerImpl.environment_variables,
      technical_patterns: llmEngineerImpl.technical_patterns,
      state_management: llmEngineerImpl.state_management,
      run_results: llmEngineerImpl.run_results,
    };


    // Validation check
    if (!content.file_structure || !content.implementation_plan) {
      throw new Error("Engineer agent failed: File structure or implementation plan is missing");
    }

    logger.info("Engineer agent completed");

    return {
      step_id: "engineer_impl",
      role: "Engineer",
      content,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error("Engineer agent failed", { error: error.message });
    throw error;
  }
}
