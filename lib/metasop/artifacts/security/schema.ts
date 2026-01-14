
export const securitySchema = {
    type: "object",
    required: [
        "security_architecture",
        "threat_model",
        "encryption",
        "security_controls",
        "summary",
        "description",
        "compliance",
        "vulnerability_management",
        "security_monitoring"
    ],
    properties: {
        summary: { type: "string", description: "Executive summary of the security architecture" },
        description: { type: "string", description: "Detailed security specifications" },
        security_architecture: {
            type: "object",
            required: ["authentication", "authorization"],
            properties: {
                authentication: {
                    type: "object",
                    required: ["method"],
                    properties: {
                        method: {
                            type: "string",
                            enum: [
                                "OAuth2",
                                "JWT",
                                "SAML",
                                "OpenID Connect",
                                "custom",
                                "session-based",
                            ],
                            description: "Authentication method",
                        },
                        providers: {
                            type: "array",
                            items: { type: "string" },
                            description:
                                "OAuth providers (Google, GitHub, Microsoft, etc.)",
                        },
                        token_expiry: {
                            type: "string",
                            description: "Token expiration time (e.g., '1h', '24h', '7d')",
                        },
                        refresh_tokens: {
                            type: "boolean",
                            description: "Whether refresh tokens are used",
                        },
                        multi_factor_auth: {
                            type: "boolean",
                            description: "Whether MFA is required",
                        },
                        mfa_enabled: {
                            type: "boolean",
                            description: "UI convenience for MFA status",
                        },
                        description: {
                            type: "string",
                            description: "Authentication description",
                        },
                    },
                },
                authorization: {
                    type: "object",
                    required: ["model"],
                    properties: {
                        model: {
                            type: "string",
                            enum: ["RBAC", "ABAC", "PBAC", "ACL", "none"],
                            description: "Authorization model",
                        },
                        roles: {
                            type: "array",
                            items: { type: "string" },
                            description: "Defined system roles",
                        },
                        policies: {
                            type: "array",
                            items: {
                                type: "object",
                                required: ["resource", "permissions"],
                                properties: {
                                    resource: {
                                        type: "string",
                                        description: "Resource name",
                                    },
                                    permissions: {
                                        type: "array",
                                        items: { type: "string" },
                                        description:
                                            "List of permissions (read, write, delete, etc.)",
                                    },
                                    roles: {
                                        type: "array",
                                        items: { type: "string" },
                                        description: "Roles that have these permissions",
                                    },
                                    description: {
                                        type: "string",
                                        description: "Policy description",
                                    },
                                },
                            },
                            description: "Authorization policies",
                        },
                        description: {
                            type: "string",
                            description: "Authorization description",
                        },
                    },
                },
                session_management: {
                    type: "object",
                    properties: {
                        strategy: {
                            type: "string",
                            enum: ["stateless", "stateful", "hybrid"],
                            description: "Session management strategy",
                        },
                        session_timeout: {
                            type: "string",
                            description: "Session timeout (e.g., '30m', '2h')",
                        },
                        secure_cookies: {
                            type: "boolean",
                            description: "Use secure cookies (HTTPS only)",
                        },
                        http_only_cookies: {
                            type: "boolean",
                            description: "Use HTTP-only cookies",
                        },
                        same_site_policy: {
                            type: "string",
                            enum: ["strict", "lax", "none"],
                            description: "SameSite cookie policy",
                        },
                    },
                },
            },
        },
        threat_model: {
            type: "array",
            description: "Threat model with identified threats and mitigations",
            items: {
                type: "object",
                required: ["threat", "severity", "mitigation"],
                properties: {
                    threat: {
                        type: "string",
                        description: "Threat description",
                    },
                    severity: {
                        type: "string",
                        enum: ["critical", "high", "medium", "low"],
                        description: "Threat severity",
                    },
                    likelihood: {
                        type: "string",
                        enum: ["high", "medium", "low"],
                        description: "Threat likelihood",
                    },
                    impact: { type: "string", description: "Impact description" },
                    mitigation: {
                        type: "string",
                        description: "Mitigation strategy",
                    },
                    affected_components: {
                        type: "array",
                        items: { type: "string" },
                        description: "Components affected by this threat",
                    },
                },
            },
        },
        encryption: {
            type: "object",
            required: ["data_at_rest", "data_in_transit", "key_management"],
            properties: {
                data_at_rest: {
                    type: "object",
                    required: ["method", "key_management"],
                    properties: {
                        method: {
                            type: "string",
                            description: "Encryption method (e.g., AES-256)",
                        },
                        key_management: {
                            type: "string",
                            description: "Key management solution",
                        },
                        description: {
                            type: "string",
                            description: "Data at rest encryption description",
                        },
                    },
                },
                data_in_transit: {
                    type: "object",
                    required: ["method"],
                    properties: {
                        method: {
                            type: "string",
                            description: "Encryption method (e.g., TLS 1.3)",
                        },
                        certificate_management: {
                            type: "string",
                            description: "Certificate management approach",
                        },
                        description: {
                            type: "string",
                            description: "Data in transit encryption description",
                        },
                    },
                },
                key_management: {
                    type: "object",
                    required: ["strategy"],
                    properties: {
                        strategy: {
                            type: "string",
                            description: "Key management strategy",
                        },
                        rotation_policy: {
                            type: "string",
                            description: "Key rotation policy",
                        },
                        description: {
                            type: "string",
                            description: "Key management description",
                        },
                    },
                },
                envelope_encryption: {
                    type: "boolean",
                    description: "Whether envelope encryption is used for data at rest",
                },
                secrets_management: {
                    type: "string",
                    description: "Secret management solution (e.g., HashiCorp Vault, AWS Secrets Manager)",
                },
            },
        },
        compliance: {
            type: "array",
            items: {
                type: "object",
                required: ["standard", "requirements"],
                properties: {
                    standard: {
                        type: "string",
                        enum: [
                            "GDPR",
                            "HIPAA",
                            "SOC2",
                            "PCI-DSS",
                            "ISO27001",
                            "CCPA",
                            "other",
                        ],
                        description: "Compliance standard",
                    },
                    requirements: {
                        type: "array",
                        items: { type: "string" },
                        description: "Compliance requirements",
                    },
                    implementation_status: {
                        type: "string",
                        enum: ["planned", "in-progress", "compliant"],
                        description: "Implementation status",
                    },
                    description: {
                        type: "string",
                        description: "Compliance description",
                    },
                },
            },
            description: "Compliance standards and requirements",
        },
        security_controls: {
            type: "array",
            description: "Security controls and implementations",
            items: {
                type: "object",
                required: ["control", "implementation"],
                properties: {
                    control: {
                        type: "string",
                        description: "Security control name",
                    },
                    category: {
                        type: "string",
                        enum: ["preventive", "detective", "corrective", "compensating"],
                        description: "Control category",
                    },
                    implementation: {
                        type: "string",
                        description: "Implementation details",
                    },
                    priority: {
                        type: "string",
                        enum: ["critical", "high", "medium", "low"],
                        description: "Control priority",
                    },
                },
            },
        },
        vulnerability_management: {
            type: "object",
            properties: {
                scanning_frequency: {
                    type: "string",
                    description: "Vulnerability scanning frequency",
                },
                tools: {
                    type: "array",
                    items: { type: "string" },
                    description:
                        "Vulnerability scanning tools (OWASP ZAP, Snyk, Dependabot, etc.)",
                },
                patch_management: {
                    type: "string",
                    description: "Patch management strategy",
                },
            },
        },
        security_monitoring: {
            type: "object",
            properties: {
                tools: {
                    type: "array",
                    items: { type: "string" },
                    description:
                        "Security monitoring tools (SIEM, WAF, IDS/IPS, etc.)",
                },
                log_retention: {
                    type: "string",
                    description: "Security log retention period",
                },
                incident_response_plan: {
                    type: "string",
                    description: "Incident response plan description",
                },
            },
        },
    },
};
