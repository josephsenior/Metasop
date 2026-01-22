import type { AgentContext, MetaSOPArtifact, MetaSOPEvent } from "../types";
import type { SecurityBackendArtifact } from "../artifacts/security/types";
import { securitySchema } from "../artifacts/security/schema";
import { generateStreamingStructuredWithLLM } from "../utils/llm-helper";
import { logger } from "../utils/logger";
import { shouldUseRefinement, refineWithAtomicActions } from "../utils/refinement-helper";
import { TECHNICAL_STANDARDS, FEW_SHOT_EXAMPLES, getDomainContext, getQualityCheckPrompt } from "../utils/prompt-standards";
import { getAgentTemperature } from "../config";

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
          temperature: getAgentTemperature("security_architecture")
        }
      );
    } else {
      const pmArtifact = pmSpec?.content as any;
      const archArtifact = archDesign?.content as any;
      const projectTitle = pmArtifact?.summary?.substring(0, 50) || "Project";
      
      const domainContext = getDomainContext(user_request);
      const qualityCheck = getQualityCheckPrompt("security");

      const securityPrompt = `You are a Principal Security Architect and CISSP with 12+ years of experience in application security, threat modeling, and compliance frameworks. Design a comprehensive security architecture for:

"${projectTitle}"

${pmArtifact ? `Project Context: ${pmArtifact.summary}` : `User Request: ${user_request}`}
${archArtifact ? `
Architecture Context:
- Summary: ${archArtifact.summary}
- APIs: ${archArtifact.apis?.slice(0, 5).map((a: any) => `${a.method} ${a.path}`).join(", ")}
- Database Tables: ${archArtifact.database_schema?.tables?.map((t: any) => t.name).join(", ") || "N/A"}
- Tech Stack: ${Object.values(archArtifact.technology_stack || {}).flat().slice(0, 8).join(", ")}` : ""}
${domainContext ? `\n${domainContext}\n` : ""}

=== SECURITY STANDARDS (MUST FOLLOW) ===
${TECHNICAL_STANDARDS.security}

=== MISSION OBJECTIVES ===

1. **STRIDE Threat Modeling**
   - Analyze each threat category systematically:
     * **S**poofing: Identity theft, credential compromise
     * **T**ampering: Data modification, SQL injection, parameter manipulation
     * **R**epudiation: Audit log tampering, non-attribution
     * **I**nformation Disclosure: Data leaks, verbose errors, insecure storage
     * **D**enial of Service: Resource exhaustion, amplification attacks
     * **E**levation of Privilege: RBAC bypass, privilege escalation
   - Map threats to OWASP Top 10 2021 categories where applicable
   - Reference CWE IDs for specific vulnerability types
   - Provide specific, implementable mitigations for each threat

2. **Authentication Architecture**
   - Define primary authentication method (JWT, OAuth2, OIDC, SAML)
   - Specify token lifecycle: access token expiry, refresh token handling
   - Design MFA strategy with fallback options
   - Address session management: stateless vs stateful, timeout policies
   - Handle edge cases: password reset, account lockout, token revocation

3. **Authorization Model**
   - Define authorization model (RBAC, ABAC, PBAC)
   - Map roles to specific permissions
   - Design resource-level access control policies
   - Address cross-tenant data isolation (if applicable)

4. **Encryption Strategy**
   - Data at rest: AES-256-GCM for sensitive fields, transparent encryption for databases
   - Data in transit: TLS 1.3, certificate pinning for mobile apps
   - Key management: KMS integration, key rotation policies, envelope encryption
   - Secrets management: HashiCorp Vault, AWS Secrets Manager, or equivalent

5. **Security Controls (Map to NIST CSF)**
   - Identify: Asset inventory, risk assessment
   - Protect: Access control, encryption, secure configuration
   - Detect: Logging, monitoring, anomaly detection
   - Respond: Incident response plan, containment procedures
   - Recover: Backup strategy, disaster recovery

6. **Compliance Mapping**
   - Identify applicable regulations (GDPR, HIPAA, PCI-DSS, SOC 2, etc.)
   - Map specific requirements to implementation controls
   - Define compliance verification procedures

7. **Security Monitoring & Operations**
   - Define logging strategy: what to log, retention period, log aggregation
   - Specify SIEM solution and alerting thresholds
   - Design incident response playbooks
   - Define vulnerability scanning frequency and remediation SLAs

8. **Network Security**
   - Define network segmentation strategy
   - Specify firewall rules and security groups
   - Address API gateway security (WAF, rate limiting, DDoS protection)

=== EXAMPLE STRIDE THREAT (Follow this depth) ===
${FEW_SHOT_EXAMPLES.threatModel}

=== OWASP TOP 10 2021 REFERENCE ===
- A01:2021 – Broken Access Control
- A02:2021 – Cryptographic Failures
- A03:2021 – Injection
- A04:2021 – Insecure Design
- A05:2021 – Security Misconfiguration
- A06:2021 – Vulnerable and Outdated Components
- A07:2021 – Identification and Authentication Failures
- A08:2021 – Software and Data Integrity Failures
- A09:2021 – Security Logging and Monitoring Failures
- A10:2021 – Server-Side Request Forgery (SSRF)

${qualityCheck}

Respond with ONLY the structured JSON object matching the schema. No explanations or markdown.`;

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
            temperature: getAgentTemperature("security_architecture"),
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
