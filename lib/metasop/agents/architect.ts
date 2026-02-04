import type { AgentContext, MetaSOPArtifact, MetaSOPEvent } from "../types";
import type { ArchitectBackendArtifact } from "../artifacts/architect/types";
import { architectSchema } from "../artifacts/architect/schema";
import { generateStreamingStructuredWithLLM } from "../utils/llm-helper";
import { logger } from "../utils/logger";
import { TECHNICAL_STANDARDS, FEW_SHOT_EXAMPLES, getDomainContext, getQualityCheckPrompt } from "../utils/prompt-standards";
import { getAgentTemperature } from "../config";

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

    const pmContent = pmSpec?.content as any;
      const projectContext = pmContent 
        ? `Project Goals: ${pmContent.summary}\nTarget Audience: ${pmContent.description}\nKey User Stories: ${pmContent.user_stories?.slice(0, 3).map((s: any) => s.title).join(", ") || "N/A"}`
        : `User Request: ${user_request}`;

      const domainContext = getDomainContext(user_request);
      const qualityCheck = getQualityCheckPrompt("architect");

      const architectPrompt = `You are a Principal Software Architect with 15+ years of experience designing scalable, secure, and maintainable systems. Design a production-ready system architecture for:

"${user_request}"

${projectContext}
${domainContext ? `\n${domainContext}\n` : ""}

=== TECHNICAL STANDARDS ===
${TECHNICAL_STANDARDS.naming}

${TECHNICAL_STANDARDS.api}

${TECHNICAL_STANDARDS.database}

=== MISSION OBJECTIVES ===

1. **Architecture Design Document**
   - Write comprehensive markdown documentation (~2000-3000 chars)
   - Include system overview, component interactions, and data flow
   - Document key architectural patterns used (MVC, CQRS, Event Sourcing, etc.)
   - Address cross-cutting concerns (logging, monitoring, caching)

2. **API Specification**
   - Design RESTful APIs following REST maturity level 2+
   - Include proper HTTP methods, status codes, and error responses
   - Define request/response schemas with types
   - Specify authentication requirements and rate limits
   - Consider API versioning strategy

3. **Database Architecture**
   - Design normalized schema (3NF minimum for transactional data)
   - Define all tables with columns, types, and constraints
   - Map relationships (1:1, 1:N, M:N) with proper foreign keys
   - Include indexes for frequently queried columns
   - Consider read/write patterns and query optimization

4. **Architectural Decision Records (ADRs)**
   - Document 4-6 key decisions with full context
   - Include: decision, status, rationale, tradeoffs, consequences
   - List alternatives considered and why they were rejected
   - Be specific about technical tradeoffs

5. **Technology Stack**
   - Justify each technology choice
   - Consider team expertise, ecosystem maturity, and long-term support
   - Balance innovation with stability

6. **Scalability & Performance**
   - Define horizontal and vertical scaling strategies
   - Address database scaling (read replicas, sharding if needed)
   - Specify caching layers and strategies
   - Set performance targets (latency, throughput)

7. **Integration Points**
   - List external services and APIs
   - Define integration patterns (REST, webhooks, message queues)
   - Address failure handling and circuit breakers

8. **Next Tasks**
   - Provide actionable tasks for engineering, DevOps, and QA teams
   - Prioritize by dependency and business value

=== EXAMPLE ADR (Follow this depth) ===
${FEW_SHOT_EXAMPLES.adr}

=== EXAMPLE API ENDPOINT (Follow this format) ===
${FEW_SHOT_EXAMPLES.api}

${qualityCheck}

Respond with ONLY the structured JSON object matching the schema. No explanations or markdown.`;

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
            temperature: getAgentTemperature("arch_design"),
            cacheId: context.cacheId,
            role: "Architect",
            model: context.options?.model
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
