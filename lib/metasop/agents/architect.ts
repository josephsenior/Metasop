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
      const hasCache = !!context.cacheId;
      architectPrompt = hasCache
        ? `As a Principal Software Architect, refine the system design based on the cached context.

CRITICAL GOALS:
1. **Architecture Style**: Explicitly define the system pattern (e.g., Clean Architecture, Hexagonal, or Event-Driven Microservices).
2. **ADR Rigor**: Document all major decisions as **Architecture Decision Records (ADRs)** including Status, Context (Reasoning), Tradeoffs, and Consequences.
3. **Database Intelligence**: Refine the database schema with explicit **Indexing Strategies** and **Referential Integrity** (Foreign Keys).
4. **API Contract**: Ensure 100% type-safe API definitions with validation logic for all endpoints.

Your design must be professional, scalable, and optimized for high-throughput production environments.`
        : `As a Principal Software Architect, design a high-fidelity system architecture.

User Request: ${user_request}

${pmSpec?.content ? `Product Manager Specification:
${JSON.stringify(pmSpec.content, null, 2)}` : ""}

CRITICAL GOALS:
1. **Executive Summary**: Provide a high-level summary and detailed description of the architecture.
2. **Architecture Style**: Define the system pattern (Clean Architecture, Hexagonal, or Event-Driven).
3. **Database Intelligence**: Refine the database schema with explicit indexing and relationships.
4. **Actionable Tasks**: Provide a list of next tasks with titles and priorities.

Ensure the design is professional, scalable, and optimized for high-throughput production environments.`;
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
          reasoning: true,
          temperature: 0.7,
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

    if (Array.isArray(content.apis)) {
      const hasHealth = content.apis.some((api: any) => api?.path === "/api/health");
      if (!hasHealth) {
        content.apis.unshift({
          path: "/api/health",
          method: "GET",
          description: "Health check endpoint",
          request_schema: "{}",
          response_schema: "{\"status\": \"ok\"}",
          auth_required: false,
          rate_limit: "300 requests/minute",
        } as any);
      }
    }

    if (context.options?.includeStateManagement && content.technology_stack) {
      const other = Array.isArray((content.technology_stack as any).other) ? (content.technology_stack as any).other : [];
      const hasState = other.some((t: any) => typeof t === "string" && t.toLowerCase().includes("state"));
      if (!hasState) other.push("State management (Zustand/Redux) for client state");
      (content.technology_stack as any).other = other;
    }

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
