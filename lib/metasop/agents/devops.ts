import type { AgentContext, MetaSOPArtifact, MetaSOPEvent } from "../types";
import type { DevOpsBackendArtifact } from "../artifacts/devops/types";
import { devopsSchema } from "../artifacts/devops/schema";
import { generateStreamingStructuredWithLLM } from "../utils/llm-helper";
import { logger } from "../utils/logger";
import { buildRefinementPrompt, shouldUseRefinement } from "../utils/refinement-helper";

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
    let devopsPrompt: string;

    if (shouldUseRefinement(context)) {
      logger.info("DevOps agent in REFINEMENT mode");
      const previousDevOpsContent = context.previous_artifacts?.devops_infrastructure?.content as DevOpsBackendArtifact | undefined;
      const guidelines = `
1. **Infrastructure**: Update cloud services, regions, or orchestration (${previousDevOpsContent?.cloud_provider || 'provider unknown'})
2. **CI/CD Pipelines**: Enhance build, test, or deployment stages
3. **Monitoring & Alerting**: Refine metrics, alerts, or logging strategies
4. **Disaster Recovery**: Update backup or failover strategies (RPO/RTO)`;
      devopsPrompt = buildRefinementPrompt(context, "DevOps", guidelines);
    } else {
      const pmArtifact = pmSpec?.content as any;
      const archArtifact = archDesign?.content as any;
      const projectTitle = pmArtifact?.title || "Project";

      devopsPrompt = `As a Principal Site Reliability Engineer (SRE), design a modern infrastructure and deployment strategy for '${projectTitle}'.

${pmArtifact ? `Project Context: ${pmArtifact.summary}` : `User Request: ${user_request}`}
${archArtifact ? `Architecture Target: ${archArtifact.summary}
Tech Stack: ${Object.values(archArtifact.technology_stack || {}).flat().slice(0, 5).join(", ")}` : ""}

MISSION OBJECTIVES:
1. **Infrastructure as Code (IaC)**: Architect a robust IaC layer (Terraform/Pulumi). Specify cloud provider, regions, and core infrastructure components (Compute, DB, Storage).
2. **Standard Environment Tiering**: Define a strict 3-tier strategy (Dev, Staging, Prod). Map specific scaling rules and access controls to each environment.
3. **CI/CD Pipeline Architecture**: Design a complete pipeline with build, test, and deploy stages. Define triggers, tools, and rollback strategies.
4. **Containerization & Orchestration**: Provide a high-fidelity Docker/Kubernetes specification. Include Dockerfile strategy and scaling policies.
5. **Zero-Downtime Deployment**: Select a high-fidelity deployment model (Blue-Green/Canary) that supports the project's availability requirements.
6. **Golden Signals Observability**: Design a monitoring and logging system focused on Latency, Traffic, Errors, and Saturation. Include alerting rules.
7. **DR & Resilience**: Define mandatory RPO/RTO targets, backup strategies, and failover procedures.
8. **Executive Summary**: Provide a high-level summary and detailed description of the infrastructure design.

Focus on creating a professional, cost-optimized, and battle-hardened infrastructure strategy. Strategic reasoning and technical justification are prioritized. Respond with ONLY the JSON object.`;
    }

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
          reasoning: true,
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

    const content: DevOpsBackendArtifact = {
      ...llmDevOps,
      cloud_provider: llmDevOps.cloud_provider || llmDevOps.infrastructure?.cloud_provider,
      infra_components: llmDevOps.infra_components || llmDevOps.infrastructure?.services?.length || 0,
      summary: llmDevOps.summary,
      description: llmDevOps.description,
      infrastructure: {
        ...llmDevOps.infrastructure,
      }
    };

    // Validation check
    if (!content.infrastructure || !content.cicd) {
      throw new Error("DevOps agent failed: Infrastructure or CI/CD spec is missing");
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
