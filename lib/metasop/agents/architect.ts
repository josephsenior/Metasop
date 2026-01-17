import type { AgentContext, MetaSOPArtifact, MetaSOPEvent } from "../types";
import type { ArchitectBackendArtifact } from "../artifacts/architect/types";
import { architectSchema } from "../artifacts/architect/schema";
import { generateStreamingStructuredWithLLM } from "../utils/llm-helper";
import { logger } from "../utils/logger";
import { shouldUseRefinement, refineWithAtomicActions } from "../utils/refinement-helper";

/**
 * Architect Agent
 * Generates architecture design documents using LLM structured output
 */
export async function architectAgent(
  context: AgentContext,
  onProgress?: (event: Partial<MetaSOPEvent>) => void
): Promise<MetaSOPArtifact> {
  const { user_request, previous_artifacts } = context;
  const pmSpec = previous_artifacts.pm_spec;

  logger.info("Architect agent starting", { user_request: user_request.substring(0, 100) });

  try {
    let content: ArchitectBackendArtifact;

    if (shouldUseRefinement(context)) {
      logger.info("Architect agent in ATOMIC REFINEMENT mode");
      content = await refineWithAtomicActions<ArchitectBackendArtifact>(
        context,
        "Architect",
        architectSchema,
        { 
          cacheId: context.cacheId,
          temperature: 0.2 
        }
      );
    } else {
      const projectTitle = (pmSpec?.content as any)?.title || "Project";

      const architectPrompt = `As a Principal Software Architect, design a high-fidelity system architecture for '${projectTitle}'.

ADAPTIVE DEPTH GUIDELINE:
- For **simple web apps/utilities**: Prioritize a clean, standard stack, and straightforward data flow. Keep justifications brief and focused on implementation speed.
- For **complex/enterprise systems**: Provide exhaustive technical rigor, systemic clarity, and production-ready depth.

${pmSpec?.content ? `Project Goals: ${(pmSpec.content as any).summary}
Target Audience: ${(pmSpec.content as any).description}` : `User Request: ${user_request}`}

MISSION OBJECTIVES:
1. **System Pattern Selection**: Define the authoritative architecture pattern in 'design_doc'.
2. **Database Intelligence**: Architect a relational schema in 'database_schema'. Specify table structures, data types, indexing strategies, and relationships.
3. **API Design**: Define a type-safe API contract in 'apis'. Include CRUD coverage, error handling, and authentication flows.
4. **Technology Stack**: Specify the complete tech stack in 'technology_stack' with justifications.
5. **Integration Points**: Identify critical external services in 'integration_points'.
6. **Scalability & Security Philosophy**: Detail a security strategy in 'security_considerations' and a scalability plan in 'scalability_approach'.
7. **Design Doc**: Provide a definitive Blueprint in 'design_doc' covering system overview and data flow.
8. **Actionable Roadmap**: Provide a prioritized list of technical tasks in 'next_tasks'.
9. **Executive Summary**: Provide a high-level 'summary' and 'description' of the architecture.

Ensure all fields in the schema are populated with high-quality, actionable technical content. Respond with ONLY the JSON object.`;

      let llmArchitecture: ArchitectBackendArtifact | null = null;

      try {
        llmArchitecture = await generateStreamingStructuredWithLLM<ArchitectBackendArtifact>(
          architectPrompt,
          architectSchema,
          (partialEvent) => {
            if (onProgress) {
              onProgress(partialEvent);
            }
          },
          {
            reasoning: context.options?.reasoning ?? false,
            temperature: 0.3,
            cacheId: context.cacheId,
            role: "Architect"
          }
        );
      } catch (error: any) {
        logger.error("Architect agent LLM call failed", { error: error.message });
        throw error;
      }

      if (!llmArchitecture) {
        throw new Error("Architect agent failed: No structured data received from LLM");
      }

      logger.info("Architect agent received structured LLM response");

      content = {
        design_doc: llmArchitecture.design_doc,
        apis: llmArchitecture.apis,
        summary: llmArchitecture.summary,
        description: llmArchitecture.description,
        decisions: llmArchitecture.decisions.map((d: any) => ({
          decision: d.decision,
          status: d.status,
          reason: d.reason,
          rationale: d.rationale || d.reason, // Ensure rationale is populated for UI
          tradeoffs: d.tradeoffs,
          consequences: d.consequences,
          alternatives: d.alternatives
        })),
        database_schema: llmArchitecture.database_schema,
        technology_stack: llmArchitecture.technology_stack,
        security_considerations: llmArchitecture.security_considerations,
        scalability_approach: llmArchitecture.scalability_approach,
        integration_points: llmArchitecture.integration_points,
        next_tasks: llmArchitecture.next_tasks
      };
    }

    logger.info("Architect agent completed");

    return {
      step_id: "arch_design",
      role: "Architect",
      content,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error("Architect agent failed", { error: error.message });
    throw error;
  }
}
