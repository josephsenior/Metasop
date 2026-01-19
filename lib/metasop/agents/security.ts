import type { AgentContext, MetaSOPArtifact, MetaSOPEvent } from "../types";
import type { SecurityBackendArtifact } from "../artifacts/security/types";
import { securitySchema } from "../artifacts/security/schema";
import { generateStreamingStructuredWithLLM } from "../utils/llm-helper";
import { logger } from "../utils/logger";
import { shouldUseRefinement, refineWithAtomicActions } from "../utils/refinement-helper";

/**
 * Security Agent
 * Generates security architecture, threat modeling, encryption strategy, and compliance specifications
 */
export async function securityAgent(
  context: AgentContext,
  onProgress?: (event: Partial<MetaSOPEvent>) => void
): Promise<MetaSOPArtifact> {
  const { user_request, previous_artifacts } = context;
  const archDesign = previous_artifacts.arch_design;
  const pmSpec = previous_artifacts.pm_spec;

  logger.info("Security agent starting", { user_request: user_request.substring(0, 100) });

  try {
    let content: SecurityBackendArtifact;

    if (shouldUseRefinement(context)) {
      logger.info("Security agent in ATOMIC REFINEMENT mode");
      content = await refineWithAtomicActions<SecurityBackendArtifact>(
        context,
        "Security",
        securitySchema,
        { 
          cacheId: context.cacheId,
          temperature: 0.2 
        }
      );
    } else {
      const pmArtifact = pmSpec?.content as any;
      const archArtifact = archDesign?.content as any;
      const projectTitle = pmArtifact?.title || "Project";

      const securityPrompt = `As a Principal Security Architect, design a robust security architecture for '${projectTitle}'.

${pmArtifact ? `Project Context: ${pmArtifact.summary}` : `User Request: ${user_request}`}
${archArtifact ? `Architecture Target: ${archArtifact.summary}
Integrated APIs: ${archArtifact.apis?.slice(0, 3).map((a: any) => a.path).join(", ")}` : ""}

MISSION OBJECTIVES:
1. **Threat Modeling**: Conduct a threat model using the STRIDE framework. Identify threats and mitigations proportional to the project's scale.
2. **Identity & Access Flow**: Define the authentication (OAuth2/OIDC) and authorization (RBAC) architecture.
3. **Encryption & Secrets**: Specify encryption-at-rest and in-transit strategies.
4. **Security Controls & Compliance**: Map security controls and relevant compliance benchmarks (GDPR, etc.).
5. **Vulnerability & Monitoring**: Define a security operations plan (DevSecOps) including scanning and incident response.
6. **Network Security**: Specify network isolation and secure provisioning policies.

Respond with ONLY the structured JSON object.`;

      let llmSecurity: SecurityBackendArtifact | null = null;

      try {
        llmSecurity = await generateStreamingStructuredWithLLM<SecurityBackendArtifact>(
          securityPrompt,
          securitySchema,
          (partialEvent) => {
            if (onProgress) {
              onProgress(partialEvent);
            }
          },
          {
            reasoning: context.options?.reasoning ?? false,
            temperature: 0.2, // Lower for high-precision security analysis
            cacheId: context.cacheId,
            role: "Security"
          }
        );
      } catch (error: any) {
        logger.error("Security agent LLM call failed", { error: error.message });
        throw error;
      }

      if (!llmSecurity) {
        throw new Error("Security agent failed: No structured data received from LLM");
      }

      content = {
        summary: llmSecurity.summary,
        description: llmSecurity.description,
        security_architecture: {
          authentication: {
            method: llmSecurity.security_architecture?.authentication?.method,
            providers: llmSecurity.security_architecture?.authentication?.providers,
            mfa_enabled: llmSecurity.security_architecture?.authentication?.mfa_enabled ?? llmSecurity.security_architecture?.authentication?.multi_factor_auth
          },
          authorization: {
            model: llmSecurity.security_architecture?.authorization?.model,
            roles: llmSecurity.security_architecture?.authorization?.roles,
            policies: llmSecurity.security_architecture?.authorization?.policies
          },
          session_management: llmSecurity.security_architecture?.session_management
        },
        threat_model: llmSecurity.threat_model,
        encryption: llmSecurity.encryption,
        security_controls: llmSecurity.security_controls,
        compliance: llmSecurity.compliance,
        vulnerability_management: llmSecurity.vulnerability_management,
        security_monitoring: llmSecurity.security_monitoring,
        network_security: llmSecurity.network_security,
      };
    }

    // Validation check
    if (!content.security_architecture || !content.threat_model || content.threat_model.length === 0) {
      throw new Error("Security agent failed: Security architecture or threat model is missing");
    }

    logger.info("Security agent completed");

    return {
      step_id: "security_architecture",
      role: "Security",
      content,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error("Security agent failed", { error: error.message });
    throw error;
  }
}
