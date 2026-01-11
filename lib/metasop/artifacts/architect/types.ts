
// ============================================================================
// ARCHITECT ARTIFACT TYPES
// ============================================================================

export interface ArchitectBackendArtifact {
    design_doc: string; // REQUIRED: markdown string (minLength: 100)
    apis: Array<{
        path: string; // REQUIRED: pattern "^/.*"
        method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"; // REQUIRED
        description: string; // REQUIRED: minLength: 10
        endpoint?: string; // Alias for path
        request_schema?: any; // Object
        response_schema?: any; // Object
        auth_required?: boolean; // Default: true
        rate_limit?: string; // Pattern: "^[0-9]+ requests/(second|minute|hour|day)$"
    }>; // REQUIRED: minItems: 1
    summary?: string;
    description?: string;
    decisions: Array<{
        decision: string; // REQUIRED: minLength: 10
        status: "accepted" | "proposed" | "superseded"; // REQUIRED
        reason: string; // REQUIRED: minLength: 20
        rationale?: string; // UI alias for reason
        tradeoffs: string; // REQUIRED: minLength: 10
        consequences: string; // REQUIRED: minLength: 20
        alternatives?: string[]; // Array of strings (minLength: 5)
    }>; // REQUIRED: minItems: 1
    next_tasks: Array<{
        role: "Engineer" | "DevOps" | "QA" | "Designer" | "Product Manager"; // REQUIRED
        task: string; // REQUIRED: minLength: 20
        title?: string; // UI expected field
        description?: string;
        priority?: "high" | "medium" | "low"; // UI expected field
    }>; // REQUIRED: minItems: 1
    database_schema?: {
        tables?: Array<{
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
    technology_stack?: {
        frontend?: string[];
        backend?: string[];
        database?: string[];
        authentication?: string[];
        hosting?: string[];
        other?: string[];
    };
    integration_points?: Array<{
        service: string; // REQUIRED
        system?: string; // UI alias for service
        name?: string; // UI alias for service
        purpose: string; // REQUIRED
        api_docs?: string; // URI format
    }>;
    security_considerations?: string[]; // Array of strings (minLength: 10)
    scalability_approach?: {
        horizontal_scaling?: string;
        database_scaling?: string;
        caching_strategy?: string;
        performance_targets?: string;
    };
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
        Array.isArray(artifact.apis) &&
        Array.isArray(artifact.decisions) &&
        Array.isArray(artifact.next_tasks)
    );
}
