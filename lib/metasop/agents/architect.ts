import type { AgentContext, MetaSOPArtifact, MetaSOPEvent } from "../types";
import type { ArchitectBackendArtifact } from "../artifacts/architect/types";
import { architectSchema } from "../artifacts/architect/schema";
import { generateStreamingStructuredWithLLM } from "../utils/llm-helper";
import { logger } from "../utils/logger";
import { buildRefinementPrompt, shouldUseRefinement } from "../utils/refinement-helper";

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
    let architectPrompt: string;

    if (shouldUseRefinement(context)) {
      logger.info("Architect agent in REFINEMENT mode");
      const guidelines = `
1. **Architecture Style**: Refine system patterns and design decisions
2. **API Contracts**: Update or add API endpoints as needed  
3. **Database Schema**: Enhance schema, indexes, or relationships
4. **Integration Points**: Update external service integrations
5. **Executive Summary**: Update architecture summary and description`;
      architectPrompt = buildRefinementPrompt(context, "Architect", guidelines);
    } else {
      const projectTitle = (pmSpec?.content as any)?.title || "Project";

      architectPrompt = `As a Principal Software Architect, design a high-fidelity system architecture for '${projectTitle}'.

${pmSpec?.content ? `Project Goals: ${(pmSpec.content as any).summary}
Target Audience: ${(pmSpec.content as any).description}` : `User Request: ${user_request}`}

MISSION OBJECTIVES:
1. **System Pattern Selection**: Define the authoritative architecture pattern (e.g., Event-Driven Microservices, Clean Architecture). Justify your choice based on the core user stories.
2. **Database Intelligence**: Architect a relational schema with specific indexing, relationship strategies, and migrations approach. Prioritize data integrity and performance.
3. **High-Impact API Design**: Define a type-safe API contract with CRUD coverage, authentication requirements, and rate limits.
4. **Technology Stack**: Specify the exact frontend, backend, database, and hosting solutions with technical justifications.
5. **Integration Points**: Identify critical external services (Auth, Payment, CDN, etc.) and their specific purpose.
6. **Scalability & Security Philosophy**: Detail how the system will scale horizontally and mitigate architectural risks (OWASP, data encryption).
7. **Comprehensive Design Doc**: Provide a detailed Blueprint/Manifesto covering the system overview and architectural patterns.
8. **Actionable Roadmap**: Provide a prioritized list of next tasks with roles and priorities for immediate execution.

Your design must be professional, scalable, and optimized for high-throughput production environments. Focus on systemic clarity and technical rigor. Respond with ONLY the JSON object.`;
    }

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

    const content: ArchitectBackendArtifact = {
      design_doc: llmArchitecture.design_doc,
      apis: llmArchitecture.apis,
      summary: llmArchitecture.summary,
      description: llmArchitecture.description,
      decisions: llmArchitecture.decisions?.map((d: any) => ({
        decision: d.decision,
        status: d.status,
        reason: d.reason,
        rationale: d.rationale || d.reason, // Ensure rationale is populated for UI
        tradeoffs: d.tradeoffs,
        consequences: d.consequences,
        alternatives: d.alternatives
      })),
      next_tasks: llmArchitecture.next_tasks,
      database_schema: llmArchitecture.database_schema,
      technology_stack: llmArchitecture.technology_stack,
      integration_points: llmArchitecture.integration_points,
      security_considerations: llmArchitecture.security_considerations ?? [],
      scalability_approach: llmArchitecture.scalability_approach,
    };


    // Validation check: must have at least a design doc or some components
    if (!content.design_doc && (!content.apis || content.apis.length === 0) && (!content.database_schema)) {
      throw new Error("Architect agent failed: Generated content is empty");
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
