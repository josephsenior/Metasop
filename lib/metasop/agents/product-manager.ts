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
3. **SWOT Analysis**: Update SWOT analysis if relevant
4. **Stakeholder Mapping**: Update stakeholders if new roles are introduced
5. **Non-Functional Requirements**: Enhance performance, security, and accessibility specs
6. **Executive Summary**: Update summary and description to reflect changes`;

      pmPrompt = buildRefinementPrompt(context, "Product Manager", guidelines);
    } else {
      // Original generation logic
      const hasCache = !!context.cacheId;

      pmPrompt = hasCache
        ? `As a Principal Product Manager, refine the product specification based on the cached User Request and context. 

CRITICAL GOALS:
1. Refine the product vision and high-level requirements.
2. Develop detailed user stories following the **INVEST** criteria (Independent, Negotiable, Valuable, Estimable, Small, Testable).
3. Conduct a thorough **SWOT** analysis (Strengths, Weaknesses, Opportunities, Threats).
4. Identify key **Stakeholders**, their interests, and influence levels.
5. Define failure-proof success metrics and non-functional requirements.

Ensure the specification is battle-hardened and ready for a complex engineering cycle.`
        : `As a Principal Product Manager, create a comprehensive product specification.

User Request: ${user_request}

CRITICAL GOALS:
1. **Vision & Scope**: Define a crystal-clear product vision and rigorous scope (including explicit Out-of-Scope items).
2. **INVEST User Stories**: Develop 8-12 elite user stories. Each MUST be Independent, Negotiable, Valuable, Estimable, Small, and Testable.
3. **SWOT Analysis**: Evaluate the product's Strengths, Weaknesses, Opportunities, and Threats to ensure strategic alignment.
4. **Stakeholder Mapping**: Identify key roles, their specific interests, and their influence on project outcomes.
5. **Non-Functional Rigor**: Outline performance targets (latencies, throughput), security standards, and accessibility (WCAG) requirements.
6. **Executive Summary**: Provide a high-level summary and detailed description of the product vision and scope.

Your specifications must provide the definitive \"Source of Truth\" for the architecture and engineering teams.`;
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
          temperature: 0.7,
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
        user_stories: llmPMSpec.user_stories?.map((story: any) => {
          if (typeof story !== "object" || story === null) return story;
          if (typeof story.description === "string" || typeof story.story === "string") return story;
          const title = typeof story.title === "string" ? story.title : "User Story";
          return {
            ...story,
            story: `As a user, I want ${title} so that I can achieve my goals.`,
            description: `Requested feature: ${user_request}`,
          };
        }),
        acceptance_criteria: llmPMSpec.acceptance_criteria,
        ui_multi_section: llmPMSpec.ui_multi_section ?? false,
        ui_sections: llmPMSpec.ui_sections ?? 1,
        assumptions: llmPMSpec.assumptions,
        out_of_scope: llmPMSpec.out_of_scope,
        swot: llmPMSpec.swot,
        stakeholders: llmPMSpec.stakeholders,
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
