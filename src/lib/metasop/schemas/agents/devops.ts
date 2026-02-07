import { z } from "zod";

const InfrastructureServiceSchema = z.object({
    name: z.string().min(1, "Service name is required"),
    type: z.enum(["compute", "database", "storage", "networking", "monitoring", "security", "cdn", "load-balancer"]),
    configuration: z.record(z.string(), z.any()).optional(),
    description: z.string().optional(),
});

const InfrastructureSchema = z.object({
    cloud_provider: z.enum(["AWS", "GCP", "Azure", "self-hosted", "hybrid"]),
    iac: z.enum(["Terraform", "CloudFormation", "Crossplane", "Ansible", "Pulumi"]).optional(),
    services: z.array(InfrastructureServiceSchema).min(1, "At least one service is required"),
    regions: z.array(z.string()).optional(),
});

const CICDTriggerSchema = z.object({
    type: z.enum(["push", "pull_request", "schedule", "manual"]),
    branch: z.string().optional(),
    description: z.string().optional(),
});

const CICDPipelineStageSchema = z.object({
    name: z.string().min(1, "Stage name is required"),
    steps: z.array(z.string()).min(1, "At least one step is required"),
    goal: z.string().optional(),
});

const CICDSchema = z.object({
    pipeline_stages: z.array(CICDPipelineStageSchema).min(1, "At least one pipeline stage is required"),
    tools: z.array(z.string()).min(1, "At least one CI/CD tool is required"),
    triggers: z.array(CICDTriggerSchema).optional(),
});

const KubernetesDeploymentSchema = z.object({
    name: z.string().min(1, "Deployment name is required"),
    replicas: z.number().int().min(1).optional(),
    resources: z
        .object({
            cpu: z.string().optional(),
            memory: z.string().optional(),
        })
        .optional(),
});

const KubernetesServiceSchema = z.object({
    name: z.string().min(1, "Service name is required"),
    type: z.enum(["ClusterIP", "NodePort", "LoadBalancer"]).optional(),
    ports: z
        .array(
            z.object({
                port: z.number().int().min(1),
                targetPort: z.number().int().min(1),
            })
        )
        .optional(),
});

const KubernetesSchema = z.object({
    namespace: z.string().optional(),
    deployments: z.array(KubernetesDeploymentSchema).optional(),
    services: z.array(KubernetesServiceSchema).optional(),
});

const ContainerizationSchema = z.object({
    dockerfile: z.string().optional(),
    docker_compose: z.string().optional(),
    kubernetes: KubernetesSchema.optional(),
});

const DeploymentEnvironmentSchema = z.object({
    name: z.string().min(1, "Environment name is required"),
    configuration: z.record(z.string(), z.any()),
    description: z.string().optional(),
});

const DeploymentSchema = z.object({
    strategy: z.enum(["blue-green", "canary", "rolling", "recreate", "none"]),
    environments: z.array(DeploymentEnvironmentSchema).min(1, "At least one environment is required"),
    rollback_strategy: z.string().optional(),
});

const MonitoringAlertSchema = z.object({
    name: z.string().min(1, "Alert name is required"),
    condition: z.string().min(1, "Alert condition is required"),
    severity: z.enum(["critical", "warning", "info"]).optional(),
});

const MonitoringLoggingSchema = z.object({
    tools: z.array(z.string()).optional(),
    retention: z.string().optional(),
});

const MonitoringMetricSchema = z.object({
    name: z.string().min(1, "Metric name is required"),
    threshold: z.string().min(1, "Metric threshold is required"),
    action: z.string().optional(),
});

const MonitoringSchema = z.object({
    tools: z.array(z.string()).min(1, "At least one monitoring tool is required"),
    metrics: z.array(MonitoringMetricSchema).min(1, "At least one metric is required"),
    alerts: z.array(MonitoringAlertSchema).optional(),
    logging: MonitoringLoggingSchema.optional(),
});

const AutoScalingSchema = z.object({
    enabled: z.boolean(),
    min_replicas: z.number().int().min(1).optional(),
    max_replicas: z.number().int().min(1).optional(),
    target_cpu: z.number().min(0).max(100).optional(),
    target_memory: z.number().min(0).max(100).optional(),
});

const ManualScalingSchema = z.object({
    replicas: z.number().int().min(1),
});

const ScalingSchema = z.object({
    auto_scaling: AutoScalingSchema.optional(),
    manual_scaling: ManualScalingSchema.optional(),
});

export const DevOpsArtifactSchema = z.object({
    infrastructure: InfrastructureSchema, // REQUIRED
    cicd: CICDSchema, // REQUIRED
    containerization: ContainerizationSchema, // REQUIRED
    deployment: DeploymentSchema, // REQUIRED
    monitoring: MonitoringSchema, // REQUIRED
    scaling: ScalingSchema, // REQUIRED
    disaster_recovery: z.object({
        rpo: z.string(), // REQUIRED: Recovery Point Objective
        rto: z.string(), // REQUIRED: Recovery Time Objective
        backup_strategy: z.string(), // REQUIRED: Backup strategy description
        failover_plan: z.string().optional(),
    }), // REQUIRED
    summary: z.string(), // REQUIRED
    description: z.string(), // REQUIRED
});

export function validateDevOpsArtifact(data: unknown) {
    return DevOpsArtifactSchema.parse(data);
}

export function safeValidateDevOpsArtifact(data: unknown) {
    return DevOpsArtifactSchema.safeParse(data);
}
