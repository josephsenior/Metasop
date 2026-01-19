
export const devopsSchema = {
    type: "object",
    required: ["infrastructure", "cicd", "deployment", "monitoring", "containerization", "scaling", "disaster_recovery", "summary", "description"],
    properties: {
        cloud_provider: { type: "string", maxLength: 20 },
        infra_components: { type: "number" },
        summary: { type: "string", maxLength: 150, description: "A technical, 1-sentence summary of the DevOps strategy. No conversational filler. Max 150 chars." },
        description: { type: "string", maxLength: 300, description: "Detailed infrastructure philosophy and SRE approach. Max 3 sentences, 300 chars." },
        infrastructure: {
            type: "object",
            required: ["cloud_provider", "services"],
            properties: {
                cloud_provider: {
                    type: "string",
                    enum: ["AWS", "GCP", "Azure", "self-hosted", "hybrid"],
                    description: "Primary cloud provider. Must match project scale.",
                },
                iac: {
                    type: "string",
                    enum: ["Terraform", "CloudFormation", "Crossplane", "Ansible", "Pulumi"],
                    description: "Infrastructure as Code tool for automation.",
                },
                services: {
                    type: "array",
                    description:
                        "Infrastructure services (compute, DB, storage).",
                    items: {
                        type: "object",
                        required: ["name", "type"],
                        properties: {
                            name: {
                                type: "string",
                                maxLength: 30,
                                description: "Service name (e.g., 'prod-db').",
                            },
                            type: {
                                type: "string",
                                enum: [
                                    "compute",
                                    "database",
                                    "storage",
                                    "networking",
                                    "monitoring",
                                    "security",
                                    "cdn",
                                    "load-balancer",
                                ],
                                description: "Service type",
                            },
                            configuration: {
                                type: "object",
                                description: "Technical config (e.g., 'instance_type: t3.medium').",
                            },
                            description: {
                                type: "string",
                                maxLength: 100,
                                description: "Technical role of this service.",
                            },
                        },
                    },
                },
                regions: {
                    type: "array",
                    items: { type: "string", maxLength: 20 },
                    description: "Deployment regions (e.g., 'us-east-1').",
                },
            },
        },
        cicd: {
            type: "object",
            required: ["pipeline_stages", "tools"],
            properties: {
                pipeline_stages: {
                    type: "array",
                    description:
                        "CI/CD pipeline stages.",
                    items: {
                        type: "object",
                        required: ["name", "steps"],
                        properties: {
                            name: {
                                type: "string",
                                maxLength: 20,
                                description: "Stage name (e.g., 'Build'). Max 20 chars.",
                            },
                            steps: {
                                type: "array",
                                items: { type: "string", maxLength: 50 },
                                description: "Steps in this stage.",
                            },
                            description: {
                                type: "string",
                                maxLength: 100,
                                description: "Technical goal of this stage. Max 100 chars.",
                            },
                        },
                    },
                },
                tools: {
                    type: "array",
                    items: { type: "string", maxLength: 20 },
                    description:
                        "CI/CD tools (GitHub Actions, GitLab CI, Jenkins, etc.).",
                },
                triggers: {
                    type: "array",
                    items: {
                        type: "object",
                        required: ["type"],
                        properties: {
                            type: {
                                type: "string",
                                enum: ["push", "pull_request", "schedule", "manual"],
                                description: "Trigger type",
                            },
                            branch: { type: "string", maxLength: 20, description: "Branch name. Max 20 chars." },
                            description: {
                                type: "string",
                                maxLength: 50,
                                description: "Trigger description. Max 50 chars.",
                            },
                        },
                    },
                    description: "Pipeline triggers.",
                },
            },
        },
        containerization: {
            type: "object",
            properties: {
                dockerfile: {
                    type: "string",
                    description: "Dockerfile content or path",
                },
                docker_compose: {
                    type: "string",
                    description: "Docker Compose configuration",
                },
                kubernetes: {
                    type: "object",
                    properties: {
                        namespace: { type: "string", description: "Kubernetes namespace" },
                        deployments: {
                            type: "array",
                            items: {
                                type: "object",
                                required: ["name"],
                                properties: {
                                    name: { type: "string", description: "Deployment name" },
                                    replicas: {
                                        type: "number",
                                        minimum: 1,
                                        description: "Number of replicas",
                                    },
                                    resources: {
                                        type: "object",
                                        properties: {
                                            cpu: {
                                                type: "string",
                                                description: "CPU resource (e.g., '500m', '1')",
                                            },
                                            memory: {
                                                type: "string",
                                                description: "Memory resource (e.g., '512Mi', '1Gi')",
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        services: {
                            type: "array",
                            items: {
                                type: "object",
                                required: ["name"],
                                properties: {
                                    name: { type: "string", description: "Service name" },
                                    type: {
                                        type: "string",
                                        enum: ["ClusterIP", "NodePort", "LoadBalancer"],
                                        description: "Service type",
                                    },
                                    ports: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            required: ["port", "targetPort"],
                                            properties: {
                                                port: { type: "number", description: "Service port" },
                                                targetPort: {
                                                    type: "number",
                                                    description: "Target container port",
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        deployment: {
            type: "object",
            required: ["strategy", "environments"],
            properties: {
                strategy: {
                    type: "string",
                    enum: ["blue-green", "canary", "rolling", "recreate", "none"],
                    description: "Deployment strategy",
                },
                environments: {
                    type: "array",

                    description:
                        "Deployment environments (dev, staging, production)",
                    items: {
                        type: "object",
                        required: ["name", "configuration"],
                        properties: {
                            name: {
                                type: "string",
                                minLength: 1,
                                description: "Environment name",
                            },
                            configuration: {
                                type: "object",
                                properties: {
                                    key: { type: "string" },
                                    value: { type: "string" },
                                },
                                description: "Environment-specific configuration",
                            },
                            description: {
                                type: "string",
                                description: "Environment description",
                            },
                        },
                    },
                },
                rollback_strategy: { type: "string", description: "Rollback strategy" },
            },
        },
        monitoring: {
            type: "object",
            required: ["tools", "metrics", "alerts",],
            properties: {
                tools: {
                    type: "array",
                    items: { type: "string", maxLength: 20 },
                    description: "Monitoring tools.",
                },
                metrics: {
                    type: "array",
                    items: { type: "string", maxLength: 30 },
                    description: "Key performance metrics.",
                },
                alerts: {
                    type: "array",
                    items: {
                        type: "object",
                        required: ["name", "condition"],
                        properties: {
                            name: { type: "string", maxLength: 30, description: "Alert name." },
                        condition: { type: "string", maxLength: 100, description: "Threshold/condition." },
                            severity: { type: "string", enum: ["critical", "warning", "info"] },
                        },
                    },
                    description: "Infrastructure alerts.",
                },
                logging: {
                    type: "object",
                    properties: {
                        tools: {
                            type: "array",
                            items: { type: "string", maxLength: 20 },
                            description: "Logging tools.",
                        },
                        retention: { type: "string", maxLength: 10, description: "e.g., '30d'." },
                    },
                },
            },
        },
        scaling: {
            type: "object",
            properties: {
                auto_scaling: {
                    type: "object",
                    properties: {
                        enabled: {
                            type: "boolean",
                            description: "Whether auto-scaling is enabled",
                        },
                        min_replicas: {
                            type: "number",
                            minimum: 1,
                            description: "Minimum number of replicas",
                        },
                        max_replicas: {
                            type: "number",
                            minimum: 1,
                            description: "Maximum number of replicas",
                        },
                        target_cpu: {
                            type: "number",
                            minimum: 0,
                            maximum: 100,
                            description: "Target CPU percentage",
                        },
                        target_memory: {
                            type: "number",
                            minimum: 0,
                            maximum: 100,
                            description: "Target memory percentage",
                        },
                    },
                },
                manual_scaling: {
                    type: "object",
                    properties: {
                        replicas: {
                            type: "number",
                            minimum: 1,
                            description: "Number of replicas",
                        },
                    },
                },
            },
        },
        disaster_recovery: {
            type: "object",
            required: ["rpo", "rto", "backup_strategy"],
            properties: {
                rpo: { type: "string", description: "Recovery Point Objective" },
                rto: { type: "string", description: "Recovery Time Objective" },
                backup_strategy: { type: "string", description: "Detailed backup strategy" },
                failover_plan: { type: "string", description: "Automated or manual failover steps" },
            },
            description: "Disaster recovery and business continuity plan",
        },
    },
};
