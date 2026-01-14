
export const devopsSchema = {
    type: "object",
    required: ["infrastructure", "cicd", "deployment", "monitoring", "containerization", "scaling", "disaster_recovery", "summary", "description"],
    properties: {
        cloud_provider: { type: "string" },
        infra_components: { type: "number" },
        description: { type: "string" },
        summary: { type: "string" },
        infrastructure: {
            type: "object",
            required: ["cloud_provider", "services"],
            properties: {
                cloud_provider: {
                    type: "string",
                    enum: ["AWS", "GCP", "Azure", "self-hosted", "hybrid"],
                    description: "Cloud provider or deployment model",
                },
                iac: {
                    type: "string",
                    enum: ["Terraform", "CloudFormation", "Crossplane", "Ansible", "Pulumi"],
                    description: "Infrastructure as Code tool",
                },
                services: {
                    type: "array",
                    description:
                        "Array of infrastructure services needed (compute, database, storage, etc.)",
                    items: {
                        type: "object",
                        required: ["name", "type"],
                        properties: {
                            name: {
                                type: "string",
                                minLength: 1,
                                description: "Service name",
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
                                properties: {
                                    key: { type: "string" },
                                    value: { type: "string" },
                                },
                                description: "Service configuration details",
                            },
                            description: {
                                type: "string",
                                description: "Service description",
                            },
                        },
                    },
                },
                regions: {
                    type: "array",
                    items: { type: "string" },
                    description: "Deployment regions",
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
                        "CI/CD pipeline stages (build, test, deploy, etc.)",
                    items: {
                        type: "object",
                        required: ["name", "steps"],
                        properties: {
                            name: {
                                type: "string",
                                minLength: 1,
                                description: "Stage name",
                            },
                            steps: {
                                type: "array",

                                items: { type: "string" },
                                description: "Steps in this stage",
                            },
                            description: {
                                type: "string",
                                description: "Stage description",
                            },
                            status: {
                                type: "string",
                                enum: ["active", "planned", "deprecated"],
                                description: "Current status of this stage",
                            },
                        },
                    },
                },
                tools: {
                    type: "array",

                    items: { type: "string" },
                    description:
                        "CI/CD tools (GitHub Actions, GitLab CI, Jenkins, etc.)",
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
                            branch: { type: "string", description: "Branch name" },
                            description: {
                                type: "string",
                                description: "Trigger description",
                            },
                        },
                    },
                    description: "Pipeline triggers",
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

                    items: { type: "string" },
                    description:
                        "Monitoring tools (Prometheus, Grafana, Datadog, etc.)",
                },
                metrics: {
                    type: "array",

                    items: { type: "string" },
                    description:
                        "Key metrics to monitor (CPU, memory, response time, error rate, etc.)",
                },
                alerts: {
                    type: "array",
                    items: {
                        type: "object",
                        required: ["name", "condition"],
                        properties: {
                            name: { type: "string", minLength: 1, description: "Alert name" },
                            condition: {
                                type: "string",
                                minLength: 1,
                                description: "Alert condition",
                            },
                            severity: {
                                type: "string",
                                enum: ["critical", "warning", "info"],
                                description: "Alert severity",
                            },
                        },
                    },
                    description: "Alert configurations",
                },
                logging: {
                    type: "object",
                    properties: {
                        tools: {
                            type: "array",
                            items: { type: "string" },
                            description: "Logging tools (ELK, Splunk, CloudWatch, etc.)",
                        },
                        retention: { type: "string", description: "Log retention period" },
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
