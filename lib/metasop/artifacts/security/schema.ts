
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
        summary: { type: "string", maxLength: 200, description: "A technical, 1-sentence summary of the security architecture. No conversational filler." },
        description: { type: "string", maxLength: 500, description: "Detailed security specifications and threat mitigations." },
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
                            description: "Primary authentication method.",
                        },
                        providers: {
                            type: "array",
                            items: { type: "string", maxLength: 20 },
                            description:
                                "Auth providers (e.g., 'Google').",
                        },
                        token_expiry: {
                            type: "string",
                            maxLength: 10,
                            description: "Token TTL (e.g., '1h').",
                        },
                        refresh_tokens: {
                            type: "boolean",
                            description: "Use of refresh tokens.",
                        },
                        multi_factor_auth: {
                            type: "boolean",
                            description: "MFA requirement.",
                        },
                        mfa_enabled: {
                            type: "boolean",
                            description: "MFA status flag.",
                        },
                        description: {
                            type: "string",
                            maxLength: 100,
                            description: "Auth flow description.",
                        },
                    },
                },
                session_management: {
                    type: "object",
                    properties: {
                        strategy: { type: "string", enum: ["stateless", "stateful", "hybrid"] },
                        session_timeout: { type: "string", maxLength: 10, description: "e.g., '30m'." },
                        secure_cookies: { type: "boolean" },
                        http_only_cookies: { type: "boolean" },
                        same_site_policy: { type: "string", enum: ["Strict", "Lax", "None"] },
                    },
                },
                authorization: {
                    type: "object",
                    required: ["model"],
                    properties: {
                        model: {
                            type: "string",
                            enum: ["RBAC", "ABAC", "PBAC", "ACL", "none"],
                            description: "Authorization model.",
                        },
                        roles: {
                            type: "array",
                            items: { type: "string", maxLength: 20 },
                            description: "System roles.",
                        },
                        policies: {
                        type: "array",
                        items: {
                                type: "object",
                                required: ["resource", "permissions"],
                                properties: {
                                    resource: {
                                        type: "string",
                                        maxLength: 30,
                                        description: "Resource name.",
                                    },
                                    permissions: {
                                        type: "array",
                                        items: { type: "string", maxLength: 20 },
                                        description:
                                            "Permissions (e.g., 'read').",
                                    },
                                    roles: {
                                        type: "array",
                                        items: { type: "string", maxLength: 20 },
                                        description: "Roles allowed.",
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        threat_model: {
            type: "array",
            items: {
                type: "object",
                required: ["threat", "mitigation"],
                properties: {
                        threat: { type: "string", maxLength: 50, description: "STRIDE threat." },
                        severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                        likelihood: { type: "string", enum: ["high", "medium", "low"] },
                        impact: { type: "string", maxLength: 100, description: "Technical impact description." },
                        description: { type: "string", maxLength: 150, description: "Detailed threat description." },
                        mitigation: { type: "string", maxLength: 150, description: "Technical mitigation." },
                        affected_components: { 
                            type: "array", 
                            items: { type: "string", maxLength: 30 },
                            description: "Systems or components impacted."
                        },
                    }
            },
            description: "STRIDE-based threat model."
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
                            maxLength: 50,
                            description: "Encryption method (e.g., AES-256).",
                        },
                        key_management: {
                            type: "string",
                            maxLength: 100,
                            description: "Key management solution.",
                        },
                        description: {
                            type: "string",
                            maxLength: 150,
                            description: "Data at rest encryption description.",
                        },
                    },
                },
                data_in_transit: {
                    type: "object",
                    required: ["method"],
                    properties: {
                        method: {
                            type: "string",
                            maxLength: 50,
                            description: "Encryption method (e.g., TLS 1.3).",
                        },
                        certificate_management: {
                            type: "string",
                            maxLength: 100,
                            description: "Certificate management approach.",
                        },
                        description: {
                            type: "string",
                            maxLength: 150,
                            description: "Data in transit encryption description.",
                        },
                    },
                },
                key_management: {
                    type: "object",
                    required: ["strategy"],
                    properties: {
                        strategy: {
                            type: "string",
                            maxLength: 100,
                            description: "Key management strategy.",
                        },
                        rotation_policy: {
                            type: "string",
                            maxLength: 100,
                            description: "Key rotation policy.",
                        },
                        description: {
                            type: "string",
                            maxLength: 150,
                            description: "Key management description.",
                        },
                    },
                },
                envelope_encryption: {
                    type: "boolean",
                    description: "Whether envelope encryption is used for data at rest",
                },
                secrets_management: {
                    type: "string",
                    maxLength: 100,
                    description: "Secret management solution (e.g., HashiCorp Vault, AWS Secrets Manager).",
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
                        items: { type: "string", maxLength: 100 },
                        description: "Compliance requirements.",
                    },
                    implementation_status: {
                        type: "string",
                        enum: ["planned", "in-progress", "compliant"],
                        description: "Implementation status",
                    },
                    description: {
                        type: "string",
                        maxLength: 200,
                        description: "Compliance description.",
                    },
                },
            },
            description: "Compliance standards and requirements.",
        },
        security_controls: {
            type: "array",
            description: "Security controls and implementations.",
            items: {
                type: "object",
                required: ["id", "control", "description", "category", "implementation"],
                properties: {
                    control: {
                        type: "string",
                        maxLength: 50,
                        description: "Security control name.",
                    },
                    id: {
                        type: "string",
                        maxLength: 15,
                        description: "Unique control identifier (e.g., CTRL-001).",
                    },
                    type: {
                        type: "string",
                        maxLength: 30,
                        description: "Control type (e.g., Technical, Administrative).",
                    },
                    description: {
                        type: "string",
                        maxLength: 100,
                        description: "Detailed description of the control.",
                    },
                    category: {
                        type: "string",
                        enum: ["preventive", "detective", "corrective", "compensating"],
                        description: "Control category",
                    },
                    implementation: {
                        type: "string",
                        maxLength: 150,
                        description: "Technical implementation details.",
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
                    maxLength: 30,
                    description: "Vulnerability scanning frequency.",
                },
                tools: {
                    type: "array",
                    items: { type: "string", maxLength: 30 },
                    description: "Scanning tools.",
                },
                remediation_sla: {
                    type: "string",
                    maxLength: 100,
                    description: "Remediation SLAs by severity.",
                },
            },
        },
        security_monitoring: {
            type: "object",
            properties: {
                logging_strategy: {
                    type: "string",
                    maxLength: 150,
                    description: "Strategy for security logging.",
                },
                siem_solution: {
                    type: "string",
                    maxLength: 50,
                    description: "SIEM or log aggregation tool.",
                },
                alerting_thresholds: {
                    type: "string",
                    maxLength: 150,
                    description: "Critical alert thresholds.",
                },
            },
        },
    },
};
