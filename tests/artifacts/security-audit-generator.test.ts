import { describe, it, expect } from "vitest";
import { SecurityAuditGenerator } from "@/lib/artifacts/security-audit-generator";
import type { Diagram } from "@/types/diagram";

const mockDiagram: Diagram = {
  id: "test-1",
  user_id: "user-1",
  title: "Test Application",
  description: "A test application with authentication",
  nodes: [
    { id: "1", label: "Auth Service", type: "service" },
    { id: "2", label: "Database", type: "database" },
  ],
  edges: [],
  status: "completed",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  metadata: {
    metasop_artifacts: {
      arch_design: {
        content: {
          apis: [
            { method: "POST", path: "/api/login", auth_required: false },
          ],
        },
      },
      qa_verification: {
        content: {
          security_findings: [
            {
              vulnerability: "XSS",
              severity: "high",
              description: "Potential XSS vulnerability",
              remediation: "Sanitize inputs",
            },
          ],
        },
      },
    },
  },
};

describe("SecurityAuditGenerator", () => {
  describe("generateSecurityAudit", () => {
    it("should generate security audit report", () => {
      const generator = new SecurityAuditGenerator(mockDiagram);
      const audit = generator.generateSecurityAudit();

      expect(audit).toContain("# Security Audit Report");
      expect(audit).toContain("Test Application");
    });

    it("should include OWASP Top 10 assessment", () => {
      const generator = new SecurityAuditGenerator(mockDiagram);
      const audit = generator.generateSecurityAudit();

      expect(audit).toContain("OWASP Top 10 Assessment");
      expect(audit).toContain("A01:2021");
    });

    it("should include security findings", () => {
      const generator = new SecurityAuditGenerator(mockDiagram);
      const audit = generator.generateSecurityAudit();

      expect(audit).toContain("Security Findings");
      expect(audit).toContain("XSS");
    });

    it("should include authentication recommendations", () => {
      const generator = new SecurityAuditGenerator(mockDiagram);
      const audit = generator.generateSecurityAudit();

      expect(audit).toContain("Authentication & Authorization");
    });
  });
});

