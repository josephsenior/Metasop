
// ============================================================================
// DEVOPS ARTIFACT TYPES
// ============================================================================

export interface DevOpsBackendArtifact {
    summary: string;
    description: string;
    infrastructure: {
        cloud_provider: "AWS" | "GCP" | "Azure" | "self-hosted" | "hybrid"; // REQUIRED
        services: Array<{
            name: string; // REQUIRED: minLength: 1
            type:
            | "compute"
            | "database"
            | "storage"
            | "networking"
            | "monitoring"
            | "security"
            | "cdn"
            | "load-balancer";
            configuration?: Record<string, string>;
            description?: string;
        }>; // REQUIRED: minItems: 1
        iac?: "Terraform" | "CloudFormation" | "Crossplane" | "Ansible" | "Pulumi";
        regions: string[];
    }; // REQUIRED
    cicd: {
        pipeline_stages: Array<{
            name: string; // REQUIRED: minLength: 1
            steps: string[]; // minItems: 1
            goal?: string; // added to match schema
            status?: string; // added to match schema
        }>; // REQUIRED: minItems: 1
        tools: string[]; // REQUIRED: minItems: 1
        triggers: Array<{
            type: "push" | "pull_request" | "schedule" | "manual"; // REQUIRED
            branch?: string;
            description?: string;
        }>;
    }; // REQUIRED
    containerization: {
        dockerfile?: string;
        docker_compose?: string;
        kubernetes?: {
            namespace?: string;
            deployments?: Array<{
                name: string; // REQUIRED
                replicas?: number; // minimum: 1
                resources?: {
                    cpu?: string;
                    memory?: string;
                };
            }>;
            services?: Array<{
                name: string; // REQUIRED
                type?: "ClusterIP" | "NodePort" | "LoadBalancer";
                ports?: Array<{
                    port: number; // REQUIRED
                    targetPort: number; // REQUIRED
                }>;
            }>;
        };
    };
    deployment: {
        strategy: "blue-green" | "canary" | "rolling" | "recreate" | "none"; // REQUIRED
        environments: Array<{
            name: string; // REQUIRED: minLength: 1
            configuration?: Record<string, string>;
            description?: string;
        }>; // REQUIRED: minItems: 1
        rollback_strategy?: string;
    }; // REQUIRED
    monitoring: {
        tools: string[]; // REQUIRED: minItems: 1
        metrics: Array<{
            name: string; // Metric name (e.g., "cpu_usage", "request_latency")
            threshold: string; // SLO threshold (e.g., "<80%", "<200ms")
            action?: string; // Action when threshold breached
        }>; // REQUIRED: Key performance metrics and SLOs
        alerts: Array<{
            name: string; // REQUIRED: minLength: 1
            condition: string; // REQUIRED: minLength: 1
            severity?: "critical" | "warning" | "info";
        }>;
        logging?: {
            tools?: string[];
            retention?: string;
        };
    }; // REQUIRED
    scaling: {
        auto_scaling: {
            enabled?: boolean;
            min_replicas?: number; // minimum: 1
            max_replicas?: number; // minimum: 1
            target_cpu?: number; // 0-100
            target_memory?: number; // 0-100
            metrics?: Record<string, string | number>;
            triggers?: Array<{
                type: string;
                threshold: string;
            }>;
        };
        manual_scaling?: {
            replicas?: number; // minimum: 1
        };
    };
    disaster_recovery: {
        rpo: string; // Recovery Point Objective (e.g. "1 hour")
        rto: string; // Recovery Time Objective (e.g. "4 hours")
        backup_strategy: string;
        failover_plan: string;
    };

    // Allow additional/legacy fields to be present without breaking consumers
    [key: string]: any;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isDevOpsBackendArtifact(artifact: any): artifact is DevOpsBackendArtifact {
    return (
        artifact &&
        typeof artifact.summary === "string" &&
        typeof artifact.description === "string" &&
        typeof artifact.infrastructure === "object" &&
        typeof artifact.cicd === "object" &&
        typeof artifact.containerization === "object" &&
        typeof artifact.deployment === "object" &&
        typeof artifact.monitoring === "object" &&
        typeof artifact.scaling === "object" &&
        typeof artifact.disaster_recovery === "object"
    );
}
