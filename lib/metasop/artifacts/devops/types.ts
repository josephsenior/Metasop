
// ============================================================================
// DEVOPS ARTIFACT TYPES
// ============================================================================

export interface DevOpsBackendArtifact {
    summary?: string;
    description?: string;
    cloud_provider?: string; // UI convenience field
    infra_components?: number; // UI convenience field
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
            configuration?: any;
            description?: string;
        }>; // REQUIRED: minItems: 3
        iac?: "Terraform" | "CloudFormation" | "Crossplane" | "Ansible" | "Pulumi";
        regions?: string[];
    }; // REQUIRED
    cicd: {
        pipeline_stages: Array<{
            name: string; // REQUIRED: minLength: 1
            steps?: string[]; // minItems: 1
            description?: string;
            status?: "active" | "planned" | "deprecated"; // UI expected field
        }>; // REQUIRED: minItems: 3
        tools: string[]; // REQUIRED: minItems: 1
        triggers?: Array<{
            type: "push" | "pull_request" | "schedule" | "manual"; // REQUIRED
            branch?: string;
            description?: string;
        }>;
    }; // REQUIRED
    containerization?: {
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
            configuration?: any;
            description?: string;
        }>; // REQUIRED: minItems: 1
        rollback_strategy?: string;
    }; // REQUIRED
    monitoring: {
        tools: string[]; // REQUIRED: minItems: 1
        metrics: string[]; // REQUIRED: minItems: 3
        alerts?: Array<{
            name: string; // REQUIRED: minLength: 1
            condition: string; // REQUIRED: minLength: 1
            severity?: "critical" | "warning" | "info";
        }>;
        logging?: {
            tools?: string[];
            retention?: string;
        };
    }; // REQUIRED
    scaling?: {
        auto_scaling?: {
            enabled?: boolean;
            min_replicas?: number; // minimum: 1
            max_replicas?: number; // minimum: 1
            target_cpu?: number; // 0-100
            target_memory?: number; // 0-100
        };
        manual_scaling?: {
            replicas?: number; // minimum: 1
        };
    };
    disaster_recovery?: {
        rpo: string; // Recovery Point Objective (e.g. "1 hour")
        rto: string; // Recovery Time Objective (e.g. "4 hours")
        backup_strategy: string;
        failover_plan?: string;
    };
    nodes?: any[];
    edges?: any[];
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isDevOpsBackendArtifact(artifact: any): artifact is DevOpsBackendArtifact {
    return (
        artifact &&
        typeof artifact.infrastructure === "object" &&
        typeof artifact.cicd === "object" &&
        typeof artifact.deployment === "object" &&
        typeof artifact.monitoring === "object"
    );
}
