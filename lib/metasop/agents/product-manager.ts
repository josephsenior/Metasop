import type { AgentContext, MetaSOPArtifact, MetaSOPEvent } from "../types";
import type { ProductManagerBackendArtifact } from "../artifacts/product-manager/types";
import { pmSchema } from "../artifacts/product-manager/schema";
import { generateStreamingStructuredWithLLM } from "../utils/llm-helper";
import { logger } from "../utils/logger";
import { shouldUseRefinement, refineWithAtomicActions } from "../utils/refinement-helper";

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
    let content: ProductManagerBackendArtifact;

    // Check if this is a refinement request
    if (shouldUseRefinement(context)) {
      logger.info("PM agent in ATOMIC REFINEMENT mode");
      content = await refineWithAtomicActions<ProductManagerBackendArtifact>(
        context,
        "Product Manager",
        pmSchema,
        { 
          cacheId: context.cacheId,
          temperature: 0.2 
        }
      );
    } else {
      // Original generation logic
      const pmPrompt = `As a Senior Product Manager, create a comprehensive product specification for '${user_request}'.

${(context as any).previous_artifacts ? `Review the initial request and ensure all aspects are covered in the spec.` : ""}

MISSION OBJECTIVES:
1. **Product Strategy**: Define a clear summary and description as specified in the schema.
2. **Feature Gaps & Opportunities**: Identify technical gaps and growth areas.
3. **User Stories**: Generate INVEST-compliant user stories (Independent, Negotiable, Valuable, Estimable, Small, Testable).
4. **Acceptance Criteria**: Detail comprehensive ACs for the overall product.
5. **SWOT & Analysis**: Provide a strategic SWOT analysis and stakeholder map.
6. **Project Scope**: Define explicit assumptions and out-of-scope items to prevent scope creep.

Respond with ONLY the structured JSON object.`;

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
            reasoning: context.options?.reasoning ?? false,
            temperature: 0.2, // Lowered for precise specification output
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
        throw error;
      }

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
          ui_multi_section: llmPMSpec.ui_multi_section,
          assumptions: llmPMSpec.assumptions,
          out_of_scope: llmPMSpec.out_of_scope,
          swot: llmPMSpec.swot,
          stakeholders: llmPMSpec.stakeholders,
          invest_analysis: llmPMSpec.invest_analysis,
          gaps: llmPMSpec.gaps,
          opportunities: llmPMSpec.opportunities,
        };
      } else {
        throw new Error("Product Manager agent failed: No structured data received from LLM");
      }
    }

    // Validation check: must have at least user stories
    if (!content.user_stories || content.user_stories.length === 0) {
      throw new Error("Product Manager agent failed: No user stories generated/refined");
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
