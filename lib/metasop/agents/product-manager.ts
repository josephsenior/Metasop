import type { AgentContext, MetaSOPArtifact, MetaSOPEvent } from "../types";
import type { ProductManagerBackendArtifact } from "../artifacts/product-manager/types";
import { pmSchema } from "../artifacts/product-manager/schema";
import { generateStreamingStructuredWithLLM } from "../utils/llm-helper";
import { logger } from "../utils/logger";
import { FEW_SHOT_EXAMPLES, getDomainContext, getQualityCheckPrompt } from "../utils/prompt-standards";
import { getAgentTemperature } from "../config";

/**
 * Product Manager Agent
 * Generates product specifications, user stories, and requirements
 * Uses EXACT Forge backend JSON schema structure (pm_spec.schema.json)
 */
export async function productManagerAgent(
  context: AgentContext,
  onProgress?: (event: Partial<MetaSOPEvent>) => void
): Promise<MetaSOPArtifact> {
  const { user_request, clarificationAnswers } = context;

  logger.info("Product Manager agent starting", { user_request: user_request.substring(0, 100) });

  try {
    let content: ProductManagerBackendArtifact;

    // Get domain-specific context if applicable
      const domainContext = getDomainContext(user_request);
      const qualityCheck = getQualityCheckPrompt("pm");

      const clarificationBlock =
        clarificationAnswers && Object.keys(clarificationAnswers).length > 0
          ? `\n\n=== USER CLARIFICATIONS (use these to scope the spec) ===\n${Object.entries(clarificationAnswers)
              .map(([k, v]) => `${k}: ${v}`)
              .join("\n")}\n`
          : "";

      // Original generation logic with enhanced prompts
      const pmPrompt = `You are a Senior Product Manager with 10+ years of experience in agile product development, user research, and stakeholder management. Create a comprehensive, production-ready product specification for:

"${user_request}"
${clarificationBlock}
${(context as any).previous_artifacts ? `Review the initial request and ensure all aspects are covered in the spec.` : ""}
${domainContext ? `\n${domainContext}\n` : ""}

=== MISSION OBJECTIVES ===

1. **Product Strategy & Vision**
   - Write a crisp, technical summary (1-2 sentences, no marketing fluff)
   - Define the product vision with clear success metrics
   - Identify the primary user persona and their core pain points

2. **Feature Gaps & Opportunities**
   - Analyze competitive landscape and identify differentiators
   - Map user pain points to specific feature opportunities
   - Prioritize opportunities by business value and technical feasibility

3. **User Stories (INVEST-Compliant)**
   - Each story must be: Independent, Negotiable, Valuable, Estimable, Small, Testable
   - Use format: "As a [role], I want [feature] so that [benefit]"
   - Include specific, measurable acceptance criteria for each story
   - Assign realistic story points (Fibonacci: 1, 2, 3, 5, 8, 13)
   - Map dependencies between stories

4. **Acceptance Criteria**
   - Write testable, unambiguous criteria
   - Include both functional and non-functional requirements
   - Use Given/When/Then format where applicable

5. **SWOT Analysis & Stakeholder Mapping**
   - Be realistic about weaknesses and threats
   - Identify key stakeholders with their interests and influence levels
   - Map stakeholder communication strategies

6. **Project Scope Definition**
   - Explicitly list assumptions (technical, business, resource)
   - Define clear out-of-scope items to prevent scope creep
   - Identify potential risks and dependencies

=== EXAMPLE USER STORY (Follow this quality level) ===
${FEW_SHOT_EXAMPLES.userStory}

=== INVEST ANALYSIS GUIDANCE ===
For each user story, evaluate:
- **Independent**: Can be developed without depending on other stories
- **Negotiable**: Details can be refined during development
- **Valuable**: Delivers clear value to users or business
- **Estimable**: Can be reasonably estimated by the team
- **Small**: Completable within one sprint (1-2 weeks)
- **Testable**: Has clear pass/fail criteria

${qualityCheck}

Respond with ONLY the structured JSON object matching the schema. No explanations or markdown.`;

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
            temperature: getAgentTemperature("pm_spec"),
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
