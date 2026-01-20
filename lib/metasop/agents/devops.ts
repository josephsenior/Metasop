import type { AgentContext, MetaSOPArtifact, MetaSOPEvent } from "../types";
import type { DevOpsBackendArtifact } from "../artifacts/devops/types";
import { devopsSchema } from "../artifacts/devops/schema";
import { generateStreamingStructuredWithLLM } from "../utils/llm-helper";
import { logger } from "../utils/logger";
import { shouldUseRefinement, refineWithAtomicActions } from "../utils/refinement-helper";
import { FEW_SHOT_EXAMPLES, getDomainContext, getQualityCheckPrompt } from "../utils/prompt-standards";

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
      const projectTitle = pmArtifact?.summary?.substring(0, 50) || "Project";
      
      const domainContext = getDomainContext(user_request);
      const qualityCheck = getQualityCheckPrompt("devops");

      const devopsPrompt = `You are a Principal Site Reliability Engineer (SRE) and Platform Engineer with 10+ years of experience in cloud infrastructure, CI/CD automation, and production operations. Design a production-ready infrastructure strategy for:

"${projectTitle}"

${pmArtifact ? `Project Context: ${pmArtifact.summary}` : `User Request: ${user_request}`}
${archArtifact ? `
Architecture Context:
- Summary: ${archArtifact.summary}
- Tech Stack: ${Object.values(archArtifact.technology_stack || {}).flat().slice(0, 8).join(", ")}
- Database: ${archArtifact.technology_stack?.database?.join(", ") || "PostgreSQL"}
- Scalability Target: ${archArtifact.scalability_approach?.performance_targets || "Standard web application"}` : ""}
${domainContext ? `\n${domainContext}\n` : ""}

=== MISSION OBJECTIVES ===

1. **Infrastructure as Code (IaC)**
   - Choose appropriate IaC tool (Terraform, Pulumi, CloudFormation, CDK)
   - Define infrastructure modules: networking, compute, storage, security
   - Implement state management strategy (remote state, locking)
   - Design for environment parity (dev/staging/prod consistency)
   - Include cost estimation considerations

2. **Cloud Provider & Services**
   - Select primary cloud provider (AWS, GCP, Azure) with justification
   - Map services to architecture components:
     * Compute: ECS/EKS/Lambda, Cloud Run, App Service
     * Database: RDS, Cloud SQL, managed PostgreSQL
     * Cache: ElastiCache, Memorystore, Redis
     * Storage: S3, GCS, Blob Storage
     * CDN: CloudFront, Cloud CDN, Azure CDN
     * DNS: Route53, Cloud DNS, Azure DNS

3. **Environment Strategy**
   - Define environments: development, staging, production
   - Specify resource sizing per environment
   - Design access control per environment (least privilege)
   - Define data handling (synthetic data for non-prod, production data protection)

4. **CI/CD Pipeline Architecture**
   - Choose CI/CD platform (GitHub Actions, GitLab CI, CircleCI, Jenkins)
   - Design pipeline stages:
     * Build: Dependency installation, compilation
     * Test: Unit, integration, E2E (with parallel execution)
     * Security: SAST, DAST, dependency scanning
     * Quality: Linting, type checking, coverage thresholds
     * Deploy: Environment-specific deployments
   - Implement quality gates with failure conditions
   - Design artifact management and versioning

5. **Containerization & Orchestration**
   - Define Docker build strategy (multi-stage builds, layer caching)
   - Container registry strategy (ECR, GCR, ACR)
   - Orchestration approach:
     * Kubernetes: Namespace strategy, resource quotas, HPA/VPA
     * ECS/Cloud Run: Service definitions, scaling policies
   - Define health checks and readiness probes

6. **Deployment Strategy**
   - Choose deployment model based on requirements:
     * Blue/Green: Zero-downtime, instant rollback
     * Canary: Gradual rollout, traffic splitting
     * Rolling: Simple, resource-efficient
   - Define rollback procedures and triggers
   - Implement feature flags for gradual feature releases

7. **Observability Stack**
   - **Metrics**: Application metrics, infrastructure metrics, business KPIs
   - **Logging**: Structured logging, log aggregation (ELK, CloudWatch, Datadog)
   - **Tracing**: Distributed tracing (OpenTelemetry, Jaeger, X-Ray)
   - **Alerting**: Alert thresholds, escalation policies, on-call rotation
   - Define SLIs/SLOs for critical user journeys

8. **Scaling Strategy**
   - Horizontal Pod Autoscaler (HPA) configurations
   - Vertical scaling policies
   - Database scaling: Read replicas, connection pooling
   - CDN and caching for traffic offloading

9. **Disaster Recovery & Business Continuity**
   - Define RTO (Recovery Time Objective) and RPO (Recovery Point Objective)
   - Backup strategy: Frequency, retention, cross-region replication
   - Disaster recovery procedures and runbooks
   - Regular DR testing schedule

10. **Security Integration (DevSecOps)**
    - Secret management (Vault, AWS Secrets Manager)
    - Security scanning in CI/CD (Snyk, Trivy, OWASP ZAP)
    - Infrastructure security (security groups, NACLs, IAM policies)
    - Compliance automation (AWS Config, Azure Policy)

=== EXAMPLE CI/CD STAGE (Follow this format) ===
${FEW_SHOT_EXAMPLES.cicdPipeline}

=== CLOUD SERVICE SELECTION GUIDANCE ===
- **Startups/MVPs**: Prefer managed services (Vercel, Railway, Render) for speed
- **Growth Stage**: Container platforms (ECS, Cloud Run) for control + simplicity
- **Enterprise**: Kubernetes (EKS, GKE, AKS) for full control and multi-cloud

${qualityCheck}

Respond with ONLY the structured JSON object matching the schema. No explanations or markdown.`;

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
