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

      securityPrompt = `As a Principal Security Architect, design a robust security architecture for '${projectTitle}'.

ADAPTIVE DEPTH GUIDELINE:
- For **simple web apps/utilities**: Prioritize standard security best practices (HTTPS, secure headers, basic auth). Focus on the most common web vulnerabilities.
- For **complex/enterprise systems**: Provide exhaustive threat modeling, zero-trust flows, and production-ready security rigor.

${pmArtifact ? `Project Context: ${pmArtifact.summary}` : `User Request: ${user_request}`}
${archArtifact ? `Architecture Target: ${archArtifact.summary}
Integrated APIs: ${archArtifact.apis?.slice(0, 3).map((a: any) => a.path).join(", ")}` : ""}

MISSION OBJECTIVES:
1. **Threat Modeling**: Conduct a threat model using the STRIDE framework. Identify threats and mitigations proportional to the project's scale. **Keep descriptions to a maximum of 2 sentences.**
2. **Identity & Access Flow**: Define the authentication (OAuth2/OIDC) and authorization (RBAC) architecture suitable for the project.
3. **Encryption & Secrets**: Specify encryption-at-rest and in-transit strategies. Detail a secrets management policy.
4. **Security Controls & Compliance**: Map security controls and relevant compliance benchmarks (GDPR, etc.) with implementation details.
5. **Vulnerability & Monitoring**: Define a security operations plan (DevSecOps) including scanning and incident response at an appropriate level.
6. **Network Security**: Specify network isolation and secure provisioning policies.

Focus on technical rigor and secure-by-default logic. Match the complexity of your security design to the inherent needs of the project. Respond with ONLY the JSON object.`;
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
