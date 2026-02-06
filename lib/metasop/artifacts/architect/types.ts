
// ============================================================================
// ARCHITECT ARTIFACT TYPES
// ============================================================================

export interface ArchitectBackendArtifact {
    design_doc: string; // REQUIRED: markdown string (minLength: 100)
    apis: Array<{
        path: string; // REQUIRED: pattern "^/.*"
        method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"; // REQUIRED
        description: string; // REQUIRED: minLength: 10
        request_schema: Record<string, string>; // REQUIRED: field -> type
        response_schema: Record<string, string>; // REQUIRED: field -> type
        auth_required: boolean; // Default: true
        rate_limit?: string; // Pattern: "^[0-9]+ requests/(second|minute|hour|day)$"
    }>; // REQUIRED: minItems: 1
    summary: string;
    description: string;
    decisions: Array<{
        decision: string; // REQUIRED: minLength: 10
        status: "accepted" | "proposed" | "superseded"; // REQUIRED
        reason: string; // REQUIRED: minLength: 20
        tradeoffs: string; // REQUIRED: minLength: 10
        consequences: string; // REQUIRED: minLength: 20
        alternatives?: string[]; // Array of strings (minLength: 5)
    }>; // REQUIRED: minItems: 1
    database_schema: {
        tables: Array<{
            name: string; // REQUIRED: pattern "^[a-z_][a-z0-9_]*$"
            description?: string;
            columns: Array<{
                name: string; // REQUIRED: pattern "^[a-z_][a-z0-9_]*$"
                type: string; // REQUIRED: SQL data type
                constraints?: string[]; // Array of strings
                description?: string;
            }>; // REQUIRED: minItems: 1
            indexes?: Array<{
                columns: string[]; // REQUIRED: minItems: 1
                type?: "btree" | "hash" | "gin" | "gist";
                reason?: string;
            }>;
            relationships?: Array<{
                type: "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many"; // REQUIRED
                from: string; // REQUIRED: Column in this table
                to: string; // REQUIRED: Referenced table.column
                through?: string; // Junction table for many-to-many
                description?: string;
            }>;
        }>;
        migrations_strategy?: string;
    };
    technology_stack: {
        frontend: string[];
        backend: string[];
        database: string[];
        authentication: string[];
        hosting: string[];
        other: string[];
    };
    integration_points: Array<{
        service: string; // REQUIRED
        purpose: string; // REQUIRED
        api_docs?: string; // URI format
    }>;
    security_considerations: string[]; // Array of strings (minLength: 10)
    scalability_approach: {
        horizontal_scaling: string;
        database_scaling: string;
        caching_strategy: string;
        performance_targets: string;
    };
    next_tasks: Array<{
        task: string;
        priority: "high" | "medium" | "low";
        assignee: "engineer" | "devops" | "qa";
        description?: string;
    }>;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isArchitectBackendArtifact(
    artifact: any
): artifact is ArchitectBackendArtifact {
    return (
        artifact &&
        typeof artifact.design_doc === "string" &&
        typeof artifact.summary === "string" &&
        typeof artifact.description === "string" &&
        Array.isArray(artifact.apis) &&
        artifact.apis.every((api: any) =>
            api &&
            typeof api.path === "string" &&
            typeof api.method === "string" &&
            typeof api.description === "string" &&
            typeof api.request_schema === "object" &&
            api.request_schema !== null &&
            typeof api.response_schema === "object" &&
            api.response_schema !== null
        ) &&
        Array.isArray(artifact.decisions) &&
        typeof artifact.database_schema === "object" &&
        typeof artifact.technology_stack === "object" &&
        Array.isArray(artifact.integration_points) &&
        Array.isArray(artifact.security_considerations) &&
        typeof artifact.scalability_approach === "object" &&
        Array.isArray(artifact.next_tasks)
    );
}
