
// ============================================================================
// SECURITY ARTIFACT TYPES
// ============================================================================

export interface SecurityBackendArtifact {
    security_architecture: {
        authentication: {
            method:
            | "OAuth2"
            | "JWT"
            | "SAML"
            | "OpenID Connect"
            | "custom"
            | "session-based"; // REQUIRED
            providers?: string[];
            token_expiry?: string;
            refresh_tokens?: boolean;
            multi_factor_auth?: boolean;
            mfa_enabled?: boolean; // UI expected field
            sso_integration?: boolean;
            description?: string;
        }; // REQUIRED
        authorization: {
            model: "RBAC" | "ABAC" | "PBAC" | "ACL" | "none"; // REQUIRED
            roles?: string[]; // UI convenience field
            policies?: Array<{
                resource: string; // REQUIRED: minLength: 1
                permissions?: string[];
                roles?: string[];
                description?: string;
            }>;
            description?: string;
        }; // REQUIRED
        session_management?: {
            strategy?: "stateless" | "stateful" | "hybrid";
            session_timeout?: string;
            timeout?: string;
            secure_cookies?: boolean;
            http_only_cookies?: boolean;
            same_site_policy?: "strict" | "lax" | "none";
            invalidation_strategy?: string;
            concurrency_control?: string;
        };
    }; // REQUIRED
    threat_model: Array<{
        threat: string; // REQUIRED: minLength: 10
        severity: "critical" | "high" | "medium" | "low"; // REQUIRED
        likelihood?: "high" | "medium" | "low";
        impact?: string;
        mitigation: string; // REQUIRED: minLength: 10
        affected_components?: string[];
    }>; // REQUIRED: minItems: 3
    encryption: {
        data_at_rest: {
            method: string; // REQUIRED: minLength: 1
            key_management: string; // REQUIRED: minLength: 1
            description?: string;
        }; // REQUIRED
        data_in_transit: {
            method: string; // REQUIRED: minLength: 1
            certificate_management?: string;
            description?: string;
        }; // REQUIRED
        key_management: {
            strategy: string; // REQUIRED: minLength: 1
            rotation_policy?: string;
            description?: string;
        }; // REQUIRED
        envelope_encryption?: boolean;
        secrets_management?: string; // e.g. "HashiCorp Vault", "AWS Secrets Manager"
    }; // REQUIRED
    compliance?: Array<{
        standard:
        | "GDPR"
        | "HIPAA"
        | "SOC2"
        | "PCI-DSS"
        | "ISO27001"
        | "CCPA"
        | "other"; // REQUIRED
        requirements?: string[]; // minItems: 1
        implementation_status?: "planned" | "in-progress" | "compliant";
        description?: string;
    }>;
    security_controls: Array<{
        control: string; // REQUIRED: minLength: 10
        category?: "preventive" | "detective" | "corrective" | "compensating";
        implementation: string; // REQUIRED: minLength: 10
        priority?: "critical" | "high" | "medium" | "low";
    }>; // REQUIRED: minItems: 5
    vulnerability_management?: {
        scanning_frequency?: string;
        tools?: string[];
        patch_management?: string;
    };
    security_monitoring?: {
        tools?: string[];
        log_retention?: string;
        incident_response_plan?: string;
    };
    operations?: string;
    network_security?: string;
    encryption_strategy?: string;
    secrets_management?: string;
    summary?: string;
    description?: string;
    nodes?: any[];
    edges?: any[];
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isSecurityBackendArtifact(
    artifact: any
): artifact is SecurityBackendArtifact {
    return (
        artifact &&
        typeof artifact.security_architecture === "object" &&
        Array.isArray(artifact.threat_model) &&
        typeof artifact.encryption === "object" &&
        Array.isArray(artifact.security_controls)
    );
}
