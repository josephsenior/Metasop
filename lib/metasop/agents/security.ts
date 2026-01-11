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
  const devopsArtifact = previous_artifacts.devops_infrastructure;

  logger.info("Security agent starting", { user_request: user_request.substring(0, 100) });

  try {
    let securityPrompt: string;

    if (shouldUseRefinement(context)) {
      logger.info("Security agent in REFINEMENT mode");
      const guidelines = `
1. **Authentication & Authorization**: Update auth methods, MFA, or role definitions
2. **Threat Model**: Add new threats or update mitigations
3. **Encryption**: Enhance data protection strategies
4. **Compliance**: Update compliance requirements or security controls`;
      securityPrompt = buildRefinementPrompt(context, "Security", guidelines);
    } else {
      const hasCache = !!context.cacheId;
      securityPrompt = hasCache
        ? `As a Principal Security Architect, refine the security architecture based on the cached context.

CRITICAL GOALS:
1. **Threat Intelligence**: Conduct a detailed threat model following the **STRIDE** or **PASTA** framework. Identify threats specific to the application architecture.
2. **Access Control**: Design a rigorous authorization system. Decide between **RBAC (Role-Based Access Control)** or **ABAC (Attribute-Based Access Control)** based on the complexity of resources.
3. **OWASP/NIST Alignment**: Ensure the architecture explicitly addresses the **OWASP Top 10** vulnerabilities and follows **NIST SP 800-53** security controls.
4. **Data Protection**: Specify an advanced encryption strategy tailored to the application's data sensitivity. Include details on key management and secrets management (e.g., Vault, Cloud KMS).
5. **Continuous Security**: Define vulnerability management and security monitoring strategies including specific tools and frequency that make sense for this architecture.

Your architecture must be battle-hardened, zero-trust, and aligned with international security standards.`
        : `As a Principal Security Architect, design a high-fidelity security architecture.

User Request: ${user_request}

${archDesign?.content ? `Architecture Design:
${JSON.stringify(archDesign.content, null, 2)}` : ""}

${pmSpec?.content ? `Product Specification:
${JSON.stringify(pmSpec.content, null, 2)}` : ""}

${devopsArtifact?.content ? `DevOps Infrastructure:
${JSON.stringify(devopsArtifact.content, null, 2)}` : ""}

CRITICAL GOALS:
1. **Advanced Threat Modeling**: Conduct a multi-vector threat model (3-7 key threats) using the STRIDE framework. Map threats to specific architectural components.
2. **Zero-Trust Identity**: Define a secure authentication and authorization architecture. Evaluate RBAC vs ABAC models based on the application's scale and user complexity.
3. **Professional Encryption**: Develop a comprehensive encryption strategy. Determine appropriate algorithms (e.g., AES-256, RSA) and include key rotation and secrets management policies tailored to the data sensitivity.
4. **Secrets Governance**: Define how sensitive keys and credentials will be managed. Select and justify the choice of secrets management tools based on the infrastructure (e.g., Cloud native vs self-hosted).
5. **Standard Alignment**: Ensure all security controls map directly to **NIST** or **ISO27001** requirements.
6. **Continuous Security**: Specify vulnerability management (scanning, patching) and security monitoring strategies.
7. **Executive Summary**: Provide a high-level summary and detailed description of the security architecture and posture.

Your architecture must be professional, battle-hardened, and perfectly aligned with the application's scale and data sensitivity.`;
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
          temperature: 0.7,
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
