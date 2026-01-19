import type { AgentContext, MetaSOPArtifact, MetaSOPEvent } from "../types";
import type { DevOpsBackendArtifact } from "../artifacts/devops/types";
import { devopsSchema } from "../artifacts/devops/schema";
import { generateStreamingStructuredWithLLM } from "../utils/llm-helper";
import { logger } from "../utils/logger";
import { shouldUseRefinement, refineWithAtomicActions } from "../utils/refinement-helper";

/**
 * DevOps Agent
 * Generates infrastructure specifications, CI/CD pipelines, and deployment strategies
 */
export async function devopsAgent(
  context: AgentContext,
  onProgress?: (event: Partial<MetaSOPEvent>) => void
): Promise<MetaSOPArtifact> {
  const { user_request, previous_artifacts } = context;
  const archDesign = previous_artifacts.arch_design;
  const pmSpec = previous_artifacts.pm_spec;

  logger.info("DevOps agent starting", { user_request: user_request.substring(0, 100) });

  try {
    let content: DevOpsBackendArtifact;

    if (shouldUseRefinement(context)) {
      logger.info("DevOps agent in ATOMIC REFINEMENT mode");
      content = await refineWithAtomicActions<DevOpsBackendArtifact>(
        context,
        "DevOps",
        devopsSchema,
        { 
          cacheId: context.cacheId,
          temperature: 0.2 
        }
      );
    } else {
      const pmArtifact = pmSpec?.content as any;
      const archArtifact = archDesign?.content as any;
      const projectTitle = pmArtifact?.title || "Project";

      const devopsPrompt = `As a Principal Site Reliability Engineer (SRE), design a modern infrastructure strategy for '${projectTitle}'.

${pmArtifact ? `Project Context: ${pmArtifact.summary}` : `User Request: ${user_request}`}
${archArtifact ? `Architecture Target: ${archArtifact.summary}
Tech Stack: ${Object.values(archArtifact.technology_stack || {}).flat().slice(0, 5).join(", ")}` : ""}

MISSION OBJECTIVES:
1. **Infrastructure as Code (IaC)**: Architect an IaC layer proportional to the project's scale.
2. **Environment Tiering**: Define an environment strategy and access controls.
3. **CI/CD Pipeline Architecture**: Design a pipeline with essential stages (Build, Test, Deploy).
4. **Containerization & Orchestration**: Provide a container strategy (Docker/K8s) if applicable.
5. **Deployment Model**: Select a deployment model based on the project's criticality.
6. **Observability**: Design a monitoring and logging system focusing on essential signals.
7. **DR & Resilience**: Define RPO/RTO targets and backup strategies.
8. **Security & Compliance**: Integrate security into the DevOps lifecycle (DevSecOps).

Respond with ONLY the structured JSON object.`;

      let llmDevOps: DevOpsBackendArtifact | null = null;

      try {
        llmDevOps = await generateStreamingStructuredWithLLM<DevOpsBackendArtifact>(
          devopsPrompt,
          devopsSchema,
          (partialEvent) => {
            if (onProgress) {
              onProgress(partialEvent);
            }
          },
          {
            reasoning: context.options?.reasoning ?? false,
            temperature: 0.3,
            cacheId: context.cacheId,
            role: "DevOps"
          }
        );
      } catch (error: any) {
        logger.error("DevOps agent LLM call failed", { error: error.message });
        throw error;
      }

      if (!llmDevOps) {
        throw new Error("DevOps agent failed: No structured data received from LLM");
      }

      logger.info("DevOps agent received structured LLM response");

      content = {
        summary: llmDevOps.summary,
        description: llmDevOps.description,
        cloud_provider: llmDevOps.cloud_provider || llmDevOps.infrastructure?.cloud_provider,
        infra_components: llmDevOps.infra_components || llmDevOps.infrastructure?.services?.length,
        infrastructure: llmDevOps.infrastructure,
        cicd: llmDevOps.cicd,
        containerization: llmDevOps.containerization,
        monitoring: llmDevOps.monitoring,
        deployment: llmDevOps.deployment,
        scaling: llmDevOps.scaling,
        disaster_recovery: llmDevOps.disaster_recovery,
      };
    }

    logger.info("DevOps agent completed");

    return {
      step_id: "devops_infrastructure",
      role: "DevOps",
      content,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error("DevOps agent failed", { error: error.message });
    throw error;
  }
}
