import type { Diagram } from "@/types/diagram"

export class SecurityAuditGenerator {
  private diagram: Diagram
  private artifacts: any

  constructor(diagram: Diagram) {
    this.diagram = diagram
    this.artifacts = diagram.metadata?.metasop_artifacts || {}
  }

  /**
   * Generate security audit report
   */
  generateSecurityAudit(): string {
    const qaArtifact = this.artifacts.qa_verification?.content || {}
    const archContent = this.artifacts.arch_design?.content || {}
    const nodes = this.diagram.nodes || []
    const securityFindings = qaArtifact.security_findings || []

    let markdown = `# Security Audit Report\n\n`
    markdown += `**Project:** ${this.diagram.title}\n\n`
    markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`
    markdown += `**Audit Type:** Comprehensive Security Assessment\n\n`
    markdown += `---\n\n`

    // Executive Summary
    markdown += `## Executive Summary\n\n`
    const criticalCount = securityFindings.filter((f: any) => f.severity === "critical").length
    const highCount = securityFindings.filter((f: any) => f.severity === "high").length
    const mediumCount = securityFindings.filter((f: any) => f.severity === "medium").length
    const lowCount = securityFindings.filter((f: any) => f.severity === "low").length

    markdown += `This security audit identified **${securityFindings.length}** security findings:\n`
    markdown += `- **Critical:** ${criticalCount}\n`
    markdown += `- **High:** ${highCount}\n`
    markdown += `- **Medium:** ${mediumCount}\n`
    markdown += `- **Low:** ${lowCount}\n\n`

    if (criticalCount > 0 || highCount > 0) {
      markdown += `⚠️ **Action Required:** Critical and high-severity issues must be addressed immediately.\n\n`
    } else {
      markdown += `✅ **Status:** No critical security issues identified.\n\n`
    }

    // OWASP Top 10 Assessment
    markdown += `## OWASP Top 10 Assessment\n\n`
    markdown += this.generateOWASPAssessment(archContent, nodes)

    // Security Findings
    if (securityFindings.length > 0) {
      markdown += `## Security Findings\n\n`
      securityFindings.forEach((finding: any, idx: number) => {
        const severity = finding.severity || "medium"
        const severityEmojiMap: Record<string, string> = {
          critical: "🔴",
          high: "🟠",
          medium: "🟡",
          low: "🟢"
        }
        const severityEmoji = severityEmojiMap[severity] || "🟡"

        markdown += `### ${severityEmoji} Finding ${idx + 1}: ${finding.vulnerability || "Security Issue"}\n\n`
        markdown += `**Severity:** ${severity.toUpperCase()}\n\n`
        markdown += `**Description:**\n${finding.description || "No description provided."}\n\n`
        
        if (finding.affected_components) {
          markdown += `**Affected Components:**\n`
          const components = Array.isArray(finding.affected_components) 
            ? finding.affected_components 
            : [finding.affected_components]
          components.forEach((comp: string) => {
            markdown += `- ${comp}\n`
          })
          markdown += `\n`
        }

        if (finding.remediation) {
          markdown += `**Remediation:**\n${finding.remediation}\n\n`
        }

        if (finding.recommendation) {
          markdown += `**Recommendation:**\n${finding.recommendation}\n\n`
        }

        markdown += `---\n\n`
      })
    }

    // Authentication & Authorization
    markdown += `## Authentication & Authorization\n\n`
    const hasAuth = this.diagram.description.toLowerCase().includes("auth") || 
                   this.diagram.description.toLowerCase().includes("login") ||
                   nodes.some(n => n.label.toLowerCase().includes("auth"))

    if (hasAuth) {
      markdown += `### Current Implementation\n`
      markdown += `- Authentication mechanism detected in architecture\n`
      markdown += `- Authorization checks should be implemented\n\n`
      markdown += `### Recommendations\n`
      markdown += `1. **Use Strong Password Policies**\n`
      markdown += `   - Minimum 12 characters\n`
      markdown += `   - Require uppercase, lowercase, numbers, and special characters\n`
      markdown += `   - Implement password strength meter\n\n`
      markdown += `2. **Implement Multi-Factor Authentication (MFA)**\n`
      markdown += `   - Support TOTP (Time-based One-Time Password)\n`
      markdown += `   - Support SMS/Email verification as backup\n\n`
      markdown += `3. **Use Secure Session Management**\n`
      markdown += `   - Use HTTP-only cookies for session tokens\n`
      markdown += `   - Implement token rotation\n`
      markdown += `   - Set appropriate session timeout\n\n`
      markdown += `4. **Implement Role-Based Access Control (RBAC)**\n`
      markdown += `   - Define clear user roles\n`
      markdown += `   - Enforce permissions at API and UI level\n\n`
    } else {
      markdown += `⚠️ **Warning:** No authentication mechanism detected. Consider implementing:\n`
      markdown += `- User authentication (login/register)\n`
      markdown += `- Session management\n`
      markdown += `- Authorization checks\n\n`
    }

    // API Security
    markdown += `## API Security\n\n`
    const apis = archContent.apis || []
    const apiArray = Array.isArray(apis) ? apis : []

    if (apiArray.length > 0) {
      markdown += `### Current API Endpoints: ${apiArray.length}\n\n`
      markdown += `### Security Recommendations\n\n`
      markdown += `1. **API Authentication**\n`
      const authRequiredCount = apiArray.filter((api: any) => api.auth_required).length
      markdown += `   - ${authRequiredCount}/${apiArray.length} endpoints require authentication\n`
      if (authRequiredCount < apiArray.length) {
        markdown += `   - ⚠️ Review endpoints without authentication\n`
      }
      markdown += `   - Use JWT tokens or OAuth 2.0\n`
      markdown += `   - Implement token refresh mechanism\n\n`
      markdown += `2. **Rate Limiting**\n`
      markdown += `   - Implement rate limiting on all endpoints\n`
      markdown += `   - Use sliding window or token bucket algorithm\n`
      markdown += `   - Set appropriate limits per user/IP\n\n`
      markdown += `3. **Input Validation**\n`
      markdown += `   - Validate all input parameters\n`
      markdown += `   - Use schema validation (Zod, Joi, etc.)\n`
      markdown += `   - Sanitize user inputs\n\n`
      markdown += `4. **CORS Configuration**\n`
      markdown += `   - Configure CORS properly\n`
      markdown += `   - Whitelist allowed origins\n`
      markdown += `   - Don't use wildcard (*) in production\n\n`
    }

    // Data Security
    markdown += `## Data Security\n\n`
    const dbNodes = nodes.filter(n => n.type === "database")
    
    if (dbNodes.length > 0) {
      markdown += `### Database Security\n\n`
      markdown += `1. **Encryption at Rest**\n`
      markdown += `   - Enable database encryption\n`
      markdown += `   - Encrypt sensitive fields\n\n`
      markdown += `2. **Encryption in Transit**\n`
      markdown += `   - Use TLS/SSL for database connections\n`
      markdown += `   - Use connection pooling with SSL\n\n`
      markdown += `3. **Access Control**\n`
      markdown += `   - Use least privilege principle\n`
      markdown += `   - Separate read/write permissions\n`
      markdown += `   - Use database roles and users\n\n`
      markdown += `4. **Backup Security**\n`
      markdown += `   - Encrypt database backups\n`
      markdown += `   - Store backups securely\n`
      markdown += `   - Test backup restoration regularly\n\n`
    }

    // Security Headers
    markdown += `## Security Headers\n\n`
    markdown += `### Recommended HTTP Security Headers\n\n`
    markdown += `\`\`\`\n`
    markdown += `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';\n`
    markdown += `X-Content-Type-Options: nosniff\n`
    markdown += `X-Frame-Options: DENY\n`
    markdown += `X-XSS-Protection: 1; mode=block\n`
    markdown += `Strict-Transport-Security: max-age=31536000; includeSubDomains\n`
    markdown += `Referrer-Policy: strict-origin-when-cross-origin\n`
    markdown += `Permissions-Policy: geolocation=(), microphone=(), camera=()\n`
    markdown += `\`\`\`\n\n`

    // Dependency Security
    markdown += `## Dependency Security\n\n`
    markdown += `### Recommendations\n\n`
    markdown += `1. **Regular Updates**\n`
    markdown += `   - Keep dependencies up to date\n`
    markdown += `   - Use automated dependency scanning\n`
    markdown += `   - Review changelogs before updating\n\n`
    markdown += `2. **Vulnerability Scanning**\n`
    markdown += `   - Use tools like npm audit, Snyk, or Dependabot\n`
    markdown += `   - Set up automated scanning in CI/CD\n`
    markdown += `   - Fix critical vulnerabilities immediately\n\n`
    markdown += `3. **Minimize Dependencies**\n`
    markdown += `   - Only include necessary packages\n`
    markdown += `   - Review transitive dependencies\n`
    markdown += `   - Consider alternatives with fewer dependencies\n\n`

    // Compliance
    markdown += `## Compliance Considerations\n\n`
    markdown += `### GDPR (if applicable)\n`
    markdown += `- Implement data minimization\n`
    markdown += `- Provide data export functionality\n`
    markdown += `- Implement right to deletion\n`
    markdown += `- Document data processing activities\n\n`
    markdown += `### PCI DSS (if handling payments)\n`
    markdown += `- Never store credit card numbers\n`
    markdown += `- Use PCI-compliant payment processors\n`
    markdown += `- Encrypt all payment data in transit\n\n`

    // Remediation Priority
    markdown += `## Remediation Priority\n\n`
    markdown += `### Immediate (Critical/High)\n`
    if (criticalCount > 0 || highCount > 0) {
      securityFindings
        .filter((f: any) => f.severity === "critical" || f.severity === "high")
        .forEach((finding: any, idx: number) => {
          markdown += `${idx + 1}. ${finding.vulnerability || "Security Issue"}\n`
        })
    } else {
      markdown += `- No critical or high-severity issues found\n`
    }
    markdown += `\n### Short Term (Medium)\n`
    const mediumFindings = securityFindings.filter((f: any) => f.severity === "medium")
    if (mediumFindings.length > 0) {
      mediumFindings.forEach((finding: any, idx: number) => {
        markdown += `${idx + 1}. ${finding.vulnerability || "Security Issue"}\n`
      })
    } else {
      markdown += `- No medium-severity issues found\n`
    }
    markdown += `\n### Long Term (Low)\n`
    const lowFindings = securityFindings.filter((f: any) => f.severity === "low")
    if (lowFindings.length > 0) {
      lowFindings.forEach((finding: any, idx: number) => {
        markdown += `${idx + 1}. ${finding.vulnerability || "Security Issue"}\n`
      })
    } else {
      markdown += `- No low-severity issues found\n`
    }
    markdown += `\n`

    // Conclusion
    markdown += `## Conclusion\n\n`
    if (criticalCount === 0 && highCount === 0) {
      markdown += `✅ The application architecture shows good security practices. Continue to:\n`
      markdown += `- Implement the recommended security measures\n`
      markdown += `- Conduct regular security audits\n`
      markdown += `- Keep dependencies updated\n`
      markdown += `- Monitor for security vulnerabilities\n\n`
    } else {
      markdown += `⚠️ Critical and high-severity issues must be addressed before production deployment.\n\n`
      markdown += `**Next Steps:**\n`
      markdown += `1. Review all findings with the development team\n`
      markdown += `2. Prioritize remediation based on severity\n`
      markdown += `3. Implement fixes and re-audit\n`
      markdown += `4. Establish ongoing security practices\n\n`
    }

    return markdown
  }

  private generateOWASPAssessment(archContent: any, nodes: any[]): string {
    const apis = archContent.apis || []
    const apiArray = Array.isArray(apis) ? apis : []
    const hasDatabase = nodes.some(n => n.type === "database")
    const hasAuth = this.diagram.description.toLowerCase().includes("auth")

    let assessment = `| OWASP Top 10 | Status | Notes |\n`
    assessment += `|--------------|--------|-------|\n`

    // A01:2021 – Broken Access Control
    assessment += `| **A01:2021 – Broken Access Control** | ${hasAuth ? "⚠️ Review" : "🔴 Critical"} | ${hasAuth ? "Authentication detected, verify authorization checks" : "No authentication mechanism detected"} |\n`

    // A02:2021 – Cryptographic Failures
    assessment += `| **A02:2021 – Cryptographic Failures** | ⚠️ Review | Ensure HTTPS, encrypt sensitive data, use strong hashing for passwords |\n`

    // A03:2021 – Injection
    assessment += `| **A03:2021 – Injection** | ${hasDatabase ? "⚠️ Review" : "✅ Low Risk"} | ${hasDatabase ? "Database detected - implement parameterized queries, input validation" : "No database detected"} |\n`

    // A04:2021 – Insecure Design
    assessment += `| **A04:2021 – Insecure Design** | ⚠️ Review | Follow secure design principles, threat modeling |\n`

    // A05:2021 – Security Misconfiguration
    assessment += `| **A05:2021 – Security Misconfiguration** | ⚠️ Review | Review default configurations, disable unnecessary features |\n`

    // A06:2021 – Vulnerable and Outdated Components
    assessment += `| **A06:2021 – Vulnerable Components** | ⚠️ Review | Keep dependencies updated, scan for vulnerabilities |\n`

    // A07:2021 – Identification and Authentication Failures
    assessment += `| **A07:2021 – Auth Failures** | ${hasAuth ? "⚠️ Review" : "🔴 Critical"} | ${hasAuth ? "Verify password policies, session management, MFA" : "Implement authentication"} |\n`

    // A08:2021 – Software and Data Integrity Failures
    assessment += `| **A08:2021 – Integrity Failures** | ⚠️ Review | Verify CI/CD pipeline security, use signed packages |\n`

    // A09:2021 – Security Logging and Monitoring Failures
    assessment += `| **A09:2021 – Logging Failures** | ⚠️ Review | Implement security logging, monitoring, and alerting |\n`

    // A10:2021 – Server-Side Request Forgery (SSRF)
    assessment += `| **A10:2021 – SSRF** | ${apiArray.length > 0 ? "⚠️ Review" : "✅ Low Risk"} | ${apiArray.length > 0 ? "Validate and sanitize all user-supplied URLs" : "No external API calls detected"} |\n`

    assessment += `\n**Legend:** 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low | ⚠️ Review | ✅ Good\n\n`

    return assessment
  }
}

