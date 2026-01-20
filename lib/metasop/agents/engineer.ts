import type { AgentContext, MetaSOPArtifact, MetaSOPEvent } from "../types";
import type { EngineerBackendArtifact } from "../artifacts/engineer/types";
import { engineerSchema } from "../artifacts/engineer/schema";
import { generateStreamingStructuredWithLLM } from "../utils/llm-helper";
import { logger } from "../utils/logger";
import { shouldUseRefinement, refineWithAtomicActions } from "../utils/refinement-helper";

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
    let content: EngineerBackendArtifact;

    if (shouldUseRefinement(context)) {
      logger.info("Engineer agent in ATOMIC REFINEMENT mode");
      content = await refineWithAtomicActions<EngineerBackendArtifact>(
        context,
        "Engineer",
        engineerSchema,
        { 
          cacheId: context.cacheId,
          temperature: 0.2 
        }
      );
    } else {
      const pmArtifact = pmSpec?.content as any;
      const archArtifact = archDesign?.content as any;
      const uiArtifact = uiDesign?.content as any;
      const projectTitle = pmArtifact?.title || "Project";

      const engineerPrompt = `As an expert Software Engineer, design a high-fidelity technical implementation blueprint for '${projectTitle}'.

${pmArtifact ? `Project Context: ${pmArtifact.summary}` : `User Request: ${user_request}`}
${archArtifact ? `Architecture Target: ${archArtifact.summary}
Tech Stack: ${Object.values(archArtifact.technology_stack || {}).flat().slice(0, 5).join(", ")}` : ""}
${uiArtifact ? `Visual Strategy: ${uiArtifact.summary}
Design Tokens: primary=${uiArtifact.design_tokens?.colors?.primary}, background=${uiArtifact.design_tokens?.colors?.background}` : ""}

MISSION OBJECTIVES:
1. **Implementation Plan**: A detailed technical implementation guide in Markdown.
2. **Technical Decisions**: MANDATORY. List at least 3-5 critical architectural choices, rationales, and alternatives. Do not leave empty.
3. **File Structure**: An organized directory tree mirroring professional architecture. (No file content).
4. **CLI Scripts**: MANDATORY. Essential commands for setup, development, testing, and building in the 'run_results' field.
5. **Environment Variables**: MANDATORY. List all required configuration variables with descriptions and examples. Do not leave empty.
6. **Dependencies**: Essential libraries and tools required (e.g., 'package@version').
7. **Implementation Roadmap**: Granular technical tasks organized into logical phases.
8. **State Management**: Specific strategy for managing application state.

CRITICAL: You MUST provide non-empty values for 'technical_decisions', 'environment_variables', and 'run_results' (including setup_commands, dev_commands, and test_commands). These are essential for the engineering specification.

Respond with ONLY the structured JSON object matching the provided schema.`;

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
            reasoning: context.options?.reasoning ?? false,
            temperature: 0.3, // Increased to avoid deterministic loops/recitation
            cacheId: context.cacheId,
            role: "Engineer",
          }
        );
      } catch (error: any) {
        logger.error("Engineer agent LLM call failed", { error: error.message });
        throw error;
      }

      if (!llmEngineerImpl) {
        throw new Error("Engineer agent failed: No structured data received from LLM");
      }

      content = {
        summary: llmEngineerImpl.summary,
        description: llmEngineerImpl.description,
        artifact_path: llmEngineerImpl.artifact_path,
        implementation_plan: llmEngineerImpl.implementation_plan,
        implementation_plan_phases: llmEngineerImpl.implementation_plan_phases || llmEngineerImpl.phases,
        state_management: llmEngineerImpl.state_management,
        file_structure: llmEngineerImpl.file_structure,
        technical_patterns: llmEngineerImpl.technical_patterns || [],
        technical_decisions: llmEngineerImpl.technical_decisions || [],
        environment_variables: llmEngineerImpl.environment_variables || [],
        dependencies: llmEngineerImpl.dependencies || [],
        run_results: {
          setup_commands: llmEngineerImpl.run_results?.setup_commands || [],
          test_commands: llmEngineerImpl.run_results?.test_commands || [],
          dev_commands: llmEngineerImpl.run_results?.dev_commands || [],
          build_commands: llmEngineerImpl.run_results?.build_commands || [],
          notes: llmEngineerImpl.run_results?.notes || ""
        },
        phases: llmEngineerImpl.phases || llmEngineerImpl.implementation_plan_phases || []
      };
    }


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
