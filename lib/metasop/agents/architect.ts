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
      const projectContext = pmSpec?.content 
        ? `Project Goals: ${(pmSpec.content as any).summary}\nTarget Audience: ${(pmSpec.content as any).description}`
        : `User Request: ${user_request}`;

      const architectPrompt = `As a Principal Software Architect, design a robust system architecture for '${user_request}'.

${projectContext}

MISSION OBJECTIVES:
1. **Design Documentation**: Create a high-fidelity Markdown design document as specified in the schema.
2. **API Specification**: Design a clean RESTful API surface with full CRUD coverage for core entities.
3. **Database Architecture**: Design a normalized relational schema with clear table/column naming.
4. **Architectural Decisions**: Document key ADRs (Architectural Decision Records) including rationale and tradeoffs.
5. **Technical Roadmap**: Define specific, actionable next tasks for the engineering and DevOps teams.
6. **System Quality**: Address security, scalability, and integration points in detail.

Respond with ONLY the structured JSON object.`;

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
            temperature: 0.2, // Lowered for technical precision
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
