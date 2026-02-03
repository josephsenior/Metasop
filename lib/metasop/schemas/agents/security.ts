import { z } from "zod";

const AuthenticationSchema = z.object({
    method: z.enum(["OAuth2", "JWT", "SAML", "OpenID Connect", "custom", "session-based"]),
    providers: z.array(z.string()).optional(),
    token_expiry: z.string().optional(),
    refresh_tokens: z.boolean().optional(),
    multi_factor_auth: z.boolean().optional(),
    description: z.string().optional(),
    mfa_enabled: z.boolean().optional(),
});

const AuthorizationPolicySchema = z.object({
    resource: z.string().min(1, "Resource name is required"),
    permissions: z.array(z.string()).min(1, "At least one permission is required"),
    roles: z.array(z.string()).optional(),
    description: z.string().optional(),
});

const AuthorizationSchema = z.object({
    model: z.enum(["RBAC", "ABAC", "PBAC", "ACL", "none"]),
    roles: z.array(z.string()).optional(),
    policies: z.array(AuthorizationPolicySchema).optional(),
    description: z.string().optional(),
});

const SessionManagementSchema = z.object({
    strategy: z.enum(["stateless", "stateful", "hybrid"]),
    session_timeout: z.string().optional(),
    secure_cookies: z.boolean().optional(),
    http_only_cookies: z.boolean().optional(),
    same_site_policy: z.enum(["Strict", "Lax", "None"]).optional(),
});

const SecurityArchitectureSchema = z.object({
    authentication: AuthenticationSchema,
    authorization: AuthorizationSchema,
    session_management: SessionManagementSchema.optional(),
});

const ThreatModelSchema = z.object({
    threat: z.string().min(10, "Threat description must be at least 10 characters"),
    severity: z.enum(["critical", "high", "medium", "low"]),
    likelihood: z.enum(["high", "medium", "low"]).optional(),
    impact: z.string().optional(),
    description: z.string().optional(),
    mitigation: z.string().min(10, "Mitigation must be at least 10 characters"),
    affected_components: z.array(z.string()).optional(),
});

const DataAtRestEncryptionSchema = z.object({
    method: z.string().min(1, "Encryption method is required"),
    key_management: z.string().min(1, "Key management solution is required"),
    description: z.string().optional(),
});

const DataInTransitEncryptionSchema = z.object({
    method: z.string().min(1, "Encryption method is required"),
    certificate_management: z.string().optional(),
    description: z.string().optional(),
});

const KeyManagementSchema = z.object({
    strategy: z.string().min(1, "Key management strategy is required"),
    rotation_policy: z.string().optional(),
    description: z.string().optional(),
});

const EncryptionSchema = z.object({
    data_at_rest: DataAtRestEncryptionSchema,
    data_in_transit: DataInTransitEncryptionSchema,
    key_management: KeyManagementSchema,
    envelope_encryption: z.boolean().optional(),
    secrets_management: z.string().optional(),
});

const ComplianceSchema = z.object({
    standard: z.enum(["GDPR", "HIPAA", "SOC2", "PCI-DSS", "ISO27001", "CCPA", "other"]),
    requirements: z.array(z.string()).min(1, "At least one requirement is required"),
    implementation_status: z.enum(["planned", "in-progress", "compliant"]).optional(),
    description: z.string().optional(),
});

const SecurityControlSchema = z.object({
    id: z.string().optional(),
    control: z.string().min(10, "Control name must be at least 10 characters"),
    type: z.string().optional(),
    description: z.string().optional(),
    category: z.enum(["preventive", "detective", "corrective", "compensating"]).optional(),
    implementation: z.string().min(10, "Implementation must be at least 10 characters"),
    priority: z.enum(["critical", "high", "medium", "low"]).optional(),
});

const VulnerabilityManagementSchema = z.object({
    scanning_frequency: z.string().optional(),
    tools: z.array(z.string()).optional(),
    remediation_sla: z.string().optional(),
});

const SecurityMonitoringSchema = z.object({
    logging_strategy: z.string().optional(),
    siem_solution: z.string().optional(),
    alerting_thresholds: z.string().optional(),
});

export const SecurityArtifactSchema = z.object({
    security_architecture: SecurityArchitectureSchema,
    threat_model: z.array(ThreatModelSchema).min(2, "At least 2 threats are required"),
    encryption: EncryptionSchema,
    compliance: z.array(ComplianceSchema),
    security_controls: z.array(SecurityControlSchema).min(3, "At least 3 security controls are required"),
    vulnerability_management: VulnerabilityManagementSchema,
    security_monitoring: SecurityMonitoringSchema,
    summary: z.string(),
    description: z.string(),
});

export function validateSecurityArtifact(data: unknown) {
    return SecurityArtifactSchema.parse(data);
}

export function safeValidateSecurityArtifact(data: unknown) {
    return SecurityArtifactSchema.safeParse(data);
}
