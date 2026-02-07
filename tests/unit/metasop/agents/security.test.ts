import { describe, it, expect, vi } from "vitest";
import type { AgentContext } from "@/lib/metasop/types";
import type { SecurityBackendArtifact } from "@/lib/metasop/artifacts/security/types";

const llmHelperMock = vi.hoisted(() => {
  return {
    generateStreamingStructuredWithLLM: vi.fn(),
  };
});

vi.mock("@/lib/metasop/utils/llm-helper", () => llmHelperMock);

describe("SecurityAgent", () => {
  it("returns a Security artifact with expected shape", async () => {
    const fixture: SecurityBackendArtifact = {
      summary: "Security architecture summary.",
      description: "Security architecture description.",
      security_architecture: {
        authentication: {
          method: "JWT",
          providers: ["custom"],
          mfa_enabled: true,
        },
        authorization: {
          model: "RBAC",
          roles: ["admin", "user"],
          policies: [{ resource: "projects", permissions: ["read"], roles: ["user"] }],
        },
        session_management: {
          strategy: "stateless",
          session_timeout: "30m",
          secure_cookies: true,
          http_only_cookies: true,
          same_site_policy: "Lax",
        },
        audit_logging: {
          enabled: true,
          retention: "30d",
          events: ["login"],
        },
      },
      threat_model: [
        {
          threat: "Spoofing via credential stuffing",
          severity: "high",
          likelihood: "medium",
          mitigation: "Rate limiting + MFA",
        },
        {
          threat: "Injection in search endpoint",
          severity: "critical",
          likelihood: "medium",
          mitigation: "Parameterized queries + WAF",
        },
      ],
      encryption: {
        data_at_rest: { method: "AES-256", key_management: "KMS" },
        data_in_transit: { method: "TLS 1.3" },
        key_management: { strategy: "KMS + rotation" },
        envelope_encryption: true,
        secrets_management: "AWS Secrets Manager",
      },
      security_controls: [{ category: "Protect", control: "least privilege", implementation: "IAM roles" } as any],
      compliance: { frameworks: ["SOC 2"], requirements: ["Audit logging"] } as any,
      vulnerability_management: { scanning: "Snyk", remediation_sla: "7d" } as any,
      security_monitoring: { siem: "CloudWatch", alerts: ["auth failures"] } as any,
    };

    llmHelperMock.generateStreamingStructuredWithLLM.mockImplementation(async (_prompt, _schema, onProgress) => {
      onProgress({ type: "agent_progress", message: "partial" });
      return fixture;
    });

    const { securityAgent } = await import("@/lib/metasop/agents/security");

    const context: AgentContext = {
      user_request: "Build a SaaS app",
      previous_artifacts: {},
      options: { model: "gemini-3-flash-preview" },
    };

    const progressEvents: any[] = [];
    const result = await securityAgent(context, (evt) => progressEvents.push(evt));

    expect(result.step_id).toBe("security_architecture");
    expect(result.role).toBe("Security");
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);

    const content = result.content as SecurityBackendArtifact;
    expect(content.security_architecture.authentication.method).toBe("JWT");
    expect(content.threat_model.length).toBeGreaterThan(0);

    expect(progressEvents.length).toBeGreaterThan(0);
  });

  it("throws when threat model is missing", async () => {
    const fixture: SecurityBackendArtifact = {
      summary: "Security architecture summary.",
      description: "Security architecture description.",
      security_architecture: {
        authentication: { method: "JWT" },
        authorization: { model: "RBAC" },
        audit_logging: { enabled: true },
        session_management: {},
      } as any,
      threat_model: [],
      encryption: {
        data_at_rest: { method: "AES-256", key_management: "KMS" },
        data_in_transit: { method: "TLS 1.3" },
        key_management: { strategy: "KMS" },
        envelope_encryption: true,
        secrets_management: "Vault",
      },
      security_controls: [] as any,
      compliance: {} as any,
      vulnerability_management: {} as any,
      security_monitoring: {} as any,
    };

    llmHelperMock.generateStreamingStructuredWithLLM.mockResolvedValueOnce(fixture);

    const { securityAgent } = await import("@/lib/metasop/agents/security");

    const context: AgentContext = {
      user_request: "Build a SaaS app",
      previous_artifacts: {},
    };

    await expect(securityAgent(context)).rejects.toThrow(/threat model is missing/i);
  });
});
