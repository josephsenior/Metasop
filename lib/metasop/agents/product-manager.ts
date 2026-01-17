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
      const pmPrompt = `As a Principal Product Manager, create a high-fidelity product specification for '${user_request}'.

ADAPTIVE DEPTH GUIDELINE:
- For **simple web apps/utilities**: Prioritize clarity, essential functionality, and speed. Keep descriptions concise and focused on the core value proposition.
- For **complex/enterprise systems**: Provide exhaustive technical depth, battle-hardened specs, and detailed strategic alignment.

CRITICAL GOALS:
1. **Vision & Scope**: Define a crystal-clear product vision and description. Explain the core "Why" and the strategic value.
2. **INVEST User Stories**: Develop a comprehensive set of user stories following the INVEST framework. The number of stories should be proportional to the project's complexity. Include IDs (US-1...), titles, detailed stories, priorities, and story points.
3. **Acceptance Criteria**: Generate global acceptance criteria (AC-1...) and specific criteria for user stories.
4. **INVEST Analysis**: For every user story, provide an INVEST quality analysis and a technical score (0-10).
5. **Strategic SWOT Analysis**: Conduct a thorough evaluation of the product's Strengths, Weaknesses, Opportunities, and Threats.
6. **Stakeholder Mapping**: Identify key roles, their interests, and communication requirements.
7. **Assumptions & Boundaries**: Explicitly list project Assumptions, Constraints, and Out-of-Scope items to prevent scope creep.
8. **Navigation & Information Architecture**: Define the core navigation strategy and information architecture.
9. **Success Metrics (KPIs)**: Define the core success metrics and KPIs for the product.

Your specifications must provide the definitive "Source of Truth" for the architecture and engineering teams. Match the granularity of your response to the inherent complexity of the user's request. Respond with ONLY the JSON object.`;

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
            temperature: 0.4, // Slightly higher for strategic creativity
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
