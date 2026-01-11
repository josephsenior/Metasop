import type { AgentContext, MetaSOPArtifact } from "../types";
import type { DevOpsBackendArtifact } from "../artifacts/devops/types";
import { devopsSchema } from "../artifacts/devops/schema";
import { generateStructuredWithLLM } from "../utils/llm-helper";
import { logger } from "../utils/logger";
import { buildRefinementPrompt, shouldUseRefinement } from "../utils/refinement-helper";

/**
 * DevOps Agent
 * Generates infrastructure specifications, CI/CD pipelines, and deployment strategies
 */
export async function devopsAgent(context: AgentContext): Promise<MetaSOPArtifact> {
  const { user_request, previous_artifacts } = context;
  const archDesign = previous_artifacts.arch_design;
  const pmSpec = previous_artifacts.pm_spec;

  logger.info("DevOps agent starting", { user_request: user_request.substring(0, 100) });

  try {
    let devopsPrompt: string;

    if (shouldUseRefinement(context)) {
      logger.info("DevOps agent in REFINEMENT mode");
      const guidelines = `
1. **Infrastructure**: Update cloud services, regions, or orchestration
2. **CI/CD Pipelines**: Enhance build, test, or deployment stages
3. **Monitoring & Alerting**: Refine metrics, alerts, or logging strategies
4. **Disaster Recovery**: Update backup or failover strategies`;
      devopsPrompt = buildRefinementPrompt(context, "DevOps", guidelines);
    } else {
      const hasCache = !!context.cacheId;

      devopsPrompt = hasCache
        ? `As a Principal Site Reliability Engineer (SRE), refine the infrastructure and deployment strategy based on the cached context.

CRITICAL GOALS:
1. **Infrastructure as Code (IaC)**: Specify a robust IaC approach (e.g., Terraform or Crossplane) for all cloud resources.
2. **Environment Tiering**: Define distinct configurations for Dev, Staging, and Production environments.
3. **Disaster Recovery (DR)**: Establish specific **RPO (Recovery Point Objective)** and **RTO (Recovery Time Objective)** targets and a comprehensive failover plan.
4. **Resilience**: Design for high availability (multi-region/multi-AZ) and automated self-healing.

Your design must be battle-hardened, cost-optimized, and follow the AWS/GCP Well-Architected Framework.`
        : `As a Principal Site Reliability Engineer (SRE), design a comprehensive infrastructure and deployment strategy.

User Request: ${user_request}

${archDesign?.content ? `Architecture Design:
${JSON.stringify(archDesign.content, null, 2)}` : ""}

${pmSpec?.content ? `Product Requirements:
${JSON.stringify(pmSpec.content, null, 2)}` : ""}

CRITICAL GOALS:
1. **IaC First**: All infrastructure must be managed via Code. Selection and justification of tools (Terraform, Pulumi, etc.) is mandatory.
2. **Standard Environment Tiering**: Define a 3-tier environment strategy (Dev, Staging, Prod) with locked-down production access.
3. **Deployment Strategy**: Select a sophisticated deployment model (e.g., Blue-Green or Canary) to ensure zero-downtime releases.
4. **Observability**: Design a "Golden Signals" monitoring system (Latency, Traffic, Errors, Saturation).
5. **Disaster Recovery**: Define the RPO/RTO metrics and backup/restore procedures.
6. **Executive Summary**: Provide a high-level summary and detailed description of the infrastructure strategy.

Ensure the specifications are professional, scalable, and perfectly aligned with the provided Architecture Design.`;
    }

    let llmDevOps: DevOpsBackendArtifact | null = null;

    try {
      llmDevOps = await generateStructuredWithLLM<DevOpsBackendArtifact>(
        devopsPrompt,
        devopsSchema,
        { reasoning: true, temperature: 0.7, cacheId: context.cacheId, role: "DevOps" }
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
