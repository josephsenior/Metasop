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

ADAPTIVE DEPTH GUIDELINE:
- For **simple web apps/utilities**: Prioritize a flat, efficient file structure and straightforward state management. Focus on "getting it running" with standard best practices.
- For **complex/enterprise systems**: Provide exhaustive technical depth, a deep modular architecture, and production-ready rigor.

${pmArtifact ? `Project Context: ${pmArtifact.summary}` : `User Request: ${user_request}`}
${archArtifact ? `Architecture Target: ${archArtifact.summary}
Tech Stack: ${Object.values(archArtifact.technology_stack || {}).flat().slice(0, 5).join(", ")}` : ""}
${uiArtifact ? `Visual Strategy: ${uiArtifact.summary}
Design Tokens: primary=${uiArtifact.design_tokens?.colors?.primary}, background=${uiArtifact.design_tokens?.colors?.background}` : ""}

Please provide a comprehensive technical roadmap:
1. **Implementation Plan**: A detailed step-by-step technical implementation guide (Markdown). Match the detail level to the project's scale.
2. **State Management**: Your specific strategy for managing application state, including tool choices and data flow.
3. **File Structure**: An organized directory tree that mirrors a professional architecture. Propose a depth proportional to the project's complexity. Note: Only include metadata (names), DO NOT include any file source code.
4. **Technical Decisions**: Critical architectural choices, rationales, and considered alternatives.
5. **Dependencies**: Essential libraries and tools required for the build.
6. **Phases**: Essential implementation phases with granular technical tasks and milestones.

Important Guidelines:
- Focus on architectural clarity and actionable technical value.
- Match the folder hierarchy depth to the project's inherent complexity.
- Avoid being overly brief, but prioritize essential patterns for simple apps.
- Ensure all fields in the schema are populated with meaningful data.

RESPOND WITH ONLY THE JSON OBJECT - NO PREAMBLE OR EXPLANATION.`;

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
        state_management: llmEngineerImpl.state_management,
        file_structure: llmEngineerImpl.file_structure,
        technical_patterns: llmEngineerImpl.technical_patterns,
        dependencies: llmEngineerImpl.dependencies,
        phases: llmEngineerImpl.phases
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
