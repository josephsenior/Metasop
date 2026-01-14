import type { AgentContext, MetaSOPArtifact, MetaSOPEvent } from "../types";
import type { SecurityBackendArtifact } from "../artifacts/security/types";
import { securitySchema } from "../artifacts/security/schema";
import { generateStreamingStructuredWithLLM } from "../utils/llm-helper";
import { logger } from "../utils/logger";
import { buildRefinementPrompt, shouldUseRefinement } from "../utils/refinement-helper";

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
    let securityPrompt: string;

    if (shouldUseRefinement(context)) {
      logger.info("Security agent in REFINEMENT mode");
      const previousSecurityContent = context.previous_artifacts?.security_architecture?.content as SecurityBackendArtifact | undefined;
      const guidelines = `
1. **Authentication & Authorization**: Update auth methods, MFA (${previousSecurityContent?.security_architecture?.authentication?.mfa_enabled ? 'present' : 'missing'}), or role definitions
2. **Threat Model**: Add new threats or update mitigations
3. **Encryption**: Enhance data protection strategies
4. **Compliance**: Update compliance requirements or security controls`;
      securityPrompt = buildRefinementPrompt(context, "Security", guidelines);
    } else {
      const pmArtifact = pmSpec?.content as any;
      const archArtifact = archDesign?.content as any;
      const projectTitle = pmArtifact?.title || "Project";

      securityPrompt = `As a Principal Security Architect, design a battle-hardened security architecture for '${projectTitle}'.

${pmArtifact ? `Project Context: ${pmArtifact.summary}` : `User Request: ${user_request}`}
${archArtifact ? `Architecture Target: ${archArtifact.summary}
Integrated APIs: ${archArtifact.apis?.slice(0, 3).map((a: any) => a.path).join(", ")}` : ""}

MISSION OBJECTIVES:
1. **Integrated Threat Modeling**: Conduct a multi-vector threat model using the STRIDE framework. Identify threats, severities, likelihoods, and specific mitigations for each component.
2. **Zero-Trust Identity Flow**: Define the authentication (OAuth2, JWT, etc.) and authorization (RBAC/ABAC) architecture. Include session management strategies and MFA requirements.
3. **Professional Encryption & Secrets**: Specify encryption-at-rest (AES-256) and in-transit (TLS 1.3) strategies. Detail a secrets management policy and key rotation strategy.
4. **Security Controls & Compliance**: Map security controls to categories (preventive, detective). List compliance benchmarks (GDPR, HIPAA, SOC2) relevant to the project.
5. **Vulnerability & Monitoring**: Define scanning frequencies, security tools (WAF, SIEM), and incident response plans to ensure long-term resilience.
6. **Executive Summary**: Provide a high-level summary and detailed description of the security architecture.

Focus on creating a secure-by-default architecture that is perfectly synchronized with the underlying system design. Quality, precision, and battle-hardened logic are prioritized. Respond with ONLY the JSON object.`;
    }

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
          reasoning: true,
          temperature: 0.3,
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

    const content: SecurityBackendArtifact = {
      summary: llmSecurity.summary,
      description: llmSecurity.description,
      security_architecture: {
        ...llmSecurity.security_architecture,
        authentication: {
          ...llmSecurity.security_architecture?.authentication,
          mfa_enabled: llmSecurity.security_architecture?.authentication?.mfa_enabled ?? llmSecurity.security_architecture?.authentication?.multi_factor_auth
        },
        authorization: {
          ...llmSecurity.security_architecture?.authorization,
          roles: llmSecurity.security_architecture?.authorization?.roles || Array.from(new Set(llmSecurity.security_architecture?.authorization?.policies?.flatMap((p: any) => p.roles || []) || []))
        }
      },
      threat_model: llmSecurity.threat_model,
      encryption: {
        data_at_rest: llmSecurity.encryption?.data_at_rest,
        data_in_transit: llmSecurity.encryption?.data_in_transit,
        key_management: llmSecurity.encryption?.key_management,
        envelope_encryption: llmSecurity.encryption?.envelope_encryption,
        secrets_management: llmSecurity.encryption?.secrets_management
      },
      compliance: llmSecurity.compliance,
      security_controls: llmSecurity.security_controls,
      vulnerability_management: llmSecurity.vulnerability_management,
      security_monitoring: llmSecurity.security_monitoring,
    };

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
