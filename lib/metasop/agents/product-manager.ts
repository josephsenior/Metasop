import type { AgentContext, MetaSOPArtifact, MetaSOPEvent } from "../types";
import type { ProductManagerBackendArtifact } from "../artifacts/product-manager/types";
import { pmSchema } from "../artifacts/product-manager/schema";
import { generateStreamingStructuredWithLLM } from "../utils/llm-helper";
import { logger } from "../utils/logger";
import { buildRefinementPrompt, shouldUseRefinement } from "../utils/refinement-helper";

/**
 * Product Manager Agent
 * Generates product specifications, user stories, and requirements
 * Uses EXACT Forge backend JSON schema structure (pm_spec.schema.json)
 */
export async function productManagerAgent(
  context: AgentContext,
  onProgress?: (event: Partial<MetaSOPEvent>) => void
): Promise<MetaSOPArtifact> {
  const { user_request } = context;

  logger.info("Product Manager agent starting", { user_request: user_request.substring(0, 100) });

  try {
    let pmPrompt: string;

    // Check if this is a refinement request
    if (shouldUseRefinement(context)) {
      logger.info("PM agent in REFINEMENT mode");
      const guidelines = `
1. **Vision & Scope**: Refine product vision and scope based on the instruction
2. **INVEST User Stories**: Add or enhance user stories following INVEST criteria
3. **Out-of-Scope**: Refine or add explicitly out-of-scope items to prevent scope creep
4. **SWOT Analysis**: Update SWOT analysis if relevant
5. **Stakeholder Mapping**: Update stakeholders if new roles are introduced
6. **Non-Functional Requirements**: Enhance performance, security, and accessibility specs
7. **Executive Summary**: Update summary and description to reflect changes`;

      pmPrompt = buildRefinementPrompt(context, "Product Manager", guidelines);
    } else {
      // Original generation logic
      const hasCache = !!context.cacheId;

      pmPrompt = hasCache
        ? `As a Principal Product Manager, refine the product specification based on the cached User Request and context. 

CRITICAL GOALS:
1. **Refined Vision**: Deepen the product vision and high-level requirements.
2. **INVEST User Stories**: Provide 8-12 elite user stories. Each MUST be Independent, Negotiable, Valuable, Estimable, Small, and Testable.
3. **Acceptance Criteria**: Define rigorous global acceptance criteria (Definition of Done) and specific criteria for each story.
4. **INVEST Analysis**: Conduct a technical INVEST score-based analysis for every user story.
5. **Strategic SWOT**: Conduct a thorough SWOT analysis (Strengths, Weaknesses, Opportunities, Threats).
6. **Stakeholder Mapping**: Identify key roles, their specific interests, and their influence levels.
7. **Constraints & Boundary**: Define explicit Assumptions and Out-of-Scope items to prevent scope creep.
8. **Navigation Strategy**: Specify if the UI requires a multi-section navigation structure.

Ensure the specification is battle-hardened and ready for a complex engineering cycle. Respond with ONLY the JSON object.`
        : `As a Principal Product Manager, create a comprehensive product specification.

User Request: ${user_request}

CRITICAL GOALS:
1. **Vision & Scope**: Define a crystal-clear product vision and rigorous description of the product and its vision.
2. **INVEST User Stories**: Develop 8-12 detailed user stories following the INVEST framework. Include IDs (US-1...), titles, stories, priorities, and story points.
3. **Acceptance Criteria**: Generate a set of comprehensive global acceptance criteria (AC-1...).
4. **INVEST Analysis**: For each user story, provide a detailed INVEST quality analysis and score (0-10).
5. **Strategic SWOT**: Evaluate the product's Strengths, Weaknesses, Opportunities, and Threats for strategic alignment.
6. **Stakeholder Mapping**: Identify key roles, their interest in the project, and their level of influence.
7. **Assumptions & Boundaries**: Explicitly list all project Assumptions and Out-of-Scope items.
8. **Navigation Strategy**: Determine if the app requires a multi-section navigation structure.

Your specifications must provide the definitive "Source of Truth" for the architecture and engineering teams. Respond with ONLY the JSON object.`;
    }

    let llmPMSpec: ProductManagerBackendArtifact | null = null;

    try {
      // Use LLM to generate product specifications with structured output and real-time streaming
      llmPMSpec = await generateStreamingStructuredWithLLM<ProductManagerBackendArtifact>(
        pmPrompt,
        pmSchema,
        (partialEvent) => {
          if (onProgress) {
            onProgress(partialEvent);
          }
        },
        {
          reasoning: true,
          temperature: 0.3,
          cacheId: context.cacheId,
          role: "Product Manager"
        }
      );

      logger.info("Product Manager agent received structured LLM response", {
        userStoriesCount: llmPMSpec?.user_stories?.length || 0,
        acceptanceCriteriaCount: llmPMSpec?.acceptance_criteria?.length || 0,
      });
    } catch (error: any) {
      logger.error("Product Manager agent LLM call failed", {
        error: error.message,
        errorStack: error.stack,
        errorType: error.constructor.name,
      });
    }

    // Use LLM-generated PM spec if available
    let content: ProductManagerBackendArtifact;

    if (llmPMSpec) {
      // Use LLM-generated PM spec
      logger.info("Using LLM-generated PM spec", {
        userStoriesCount: llmPMSpec.user_stories?.length || 0,
        acceptanceCriteriaCount: llmPMSpec.acceptance_criteria?.length || 0,
      });

      content = {
        summary: llmPMSpec.summary,
        description: llmPMSpec.description,
        user_stories: llmPMSpec.user_stories,
        acceptance_criteria: llmPMSpec.acceptance_criteria,
        ui_multi_section: llmPMSpec.ui_multi_section ?? false,
        assumptions: llmPMSpec.assumptions,
        out_of_scope: llmPMSpec.out_of_scope,
        swot: llmPMSpec.swot,
        stakeholders: llmPMSpec.stakeholders,
        invest_analysis: llmPMSpec.invest_analysis,
      };

      // Validation check: must have at least user stories
      if (!content.user_stories || content.user_stories.length === 0) {
        throw new Error("Product Manager agent failed: No user stories generated");
      }
    } else {
      throw new Error("Product Manager agent failed: No structured data received from LLM");
    }

    logger.info("Product Manager agent completed");

    return {
      step_id: "pm_spec",
      role: "Product Manager",
      content,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error("Product Manager agent failed", { error: error.message });
    throw error;
  }
}
