
export const architectSchema = {
    type: "object",
    required: ["design_doc", "apis", "decisions", "technology_stack", "database_schema", "integration_points", "security_considerations", "scalability_approach", "summary", "description"],
    properties: {
        design_doc: {
            type: "string",
            maxLength: 3000,
            description: "Comprehensive architecture design document in markdown format. Aim for ~2000 characters for complex systems. Max 3000 chars.",
        },
        summary: { type: "string", maxLength: 150, description: "Technical executive summary of the architecture. Max 150 chars." },
        description: { type: "string", maxLength: 300, description: "Brief overview of the system architecture. Max 300 chars." },
    apis: {
            type: "array",
            description: "CRUD-focused API specification. Technical and concise.",
            items: {
                type: "object",
                required: ["path", "method", "description", "request_schema", "response_schema"],
                properties: {
                    path: { type: "string", pattern: "^/.*", maxLength: 50, description: "API path (e.g., '/api/users')" },
                    method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE", "PATCH"] },
                    endpoint: { type: "string", maxLength: 100, description: "Specific endpoint identifier or base URL." },
                    description: { type: "string", maxLength: 100, description: "Concise purpose. Max 100 chars." },
                    request_schema: { type: "object", description: "Request mapping (field: type). No descriptions." },
                    response_schema: { type: "object", description: "Response mapping (field: type). No descriptions." },
                    auth_required: { type: "boolean" },
                    rate_limit: { type: "string", maxLength: 20 },
                },
            },
        },
        decisions: {
            type: "array",
            description: "Core architectural decisions. Technical focus. Max 10.",
            items: {
                type: "object",
                required: ["decision", "status", "reason", "tradeoffs", "consequences"],
                properties: {
                    decision: { type: "string", maxLength: 60 },
                    status: { type: "string", enum: ["accepted", "proposed", "superseded"] },
                    reason: { type: "string", maxLength: 150, description: "Technical reasoning. Max 150 chars." },
                    rationale: { type: "string", maxLength: 80, description: "One-sentence rationale." },
                    tradeoffs: { type: "string", maxLength: 150 },
                    consequences: { type: "string", maxLength: 150 },
                    alternatives: {
                        type: "array",
                        items: { type: "string", maxLength: 50 },
                    },
                },
            },
        },
        database_schema: {
            type: "object",
            description: "Relational database schema. Snake_case only.",
            properties: {
                tables: {
                    type: "array",
                    minItems: 1,
                    items: {
                        type: "object",
                        required: ["name", "columns"],
                        properties: {
                            name: { type: "string", maxLength: 30, description: "Table name (snake_case)" },
                            description: { type: "string", maxLength: 100 },
                            columns: {
                                type: "array",
                                minItems: 1,
                                items: {
                                    type: "object",
                                    required: ["name", "type"],
                                    properties: {
                                        name: { type: "string", maxLength: 30, description: "Column name (snake_case)" },
                                        type: { type: "string", maxLength: 20, description: "SQL type (e.g., 'UUID', 'VARCHAR(255)')" },
                                        constraints: { type: "array", items: { type: "string", maxLength: 20 } },
                                        description: { type: "string", maxLength: 80 },
                                    },
                                },
                            },
                            indexes: {
                                type: "array",
                                items: {
                                    type: "object",
                                    required: ["columns"],
                                    properties: {
                                        columns: { type: "array", items: { type: "string", maxLength: 30 }, minItems: 1 },
                                        type: { type: "string", enum: ["btree", "hash", "gin", "gist"] },
                                        reason: { type: "string", maxLength: 100 },
                                    },
                                },
                            },
                            relationships: {
                                type: "array",
                                maxItems: 10,
                                items: {
                                    type: "object",
                                    required: ["type", "from", "to"],
                                    properties: {
                                        type: { type: "string", enum: ["one-to-one", "one-to-many", "many-to-one", "many-to-many"] },
                                        from: { type: "string", maxLength: 30, description: "Source column" },
                                        to: { type: "string", maxLength: 50, description: "Target table.column" },
                                        through: { type: "string", maxLength: 30, description: "Junction table for M2M" },
                                        description: { type: "string", maxLength: 100 },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        technology_stack: {
            type: "object",
            description: "Specific technology choices with justification.",
            properties: {
                frontend: { type: "array", items: { type: "string", maxLength: 30 }, description: "Frontend stack" },
                backend: { type: "array", items: { type: "string", maxLength: 30 }, description: "Backend stack" },
                database: { type: "array", items: { type: "string", maxLength: 30 }, description: "Database choice" },
                authentication: { type: "array", items: { type: "string", maxLength: 30 }, description: "Auth solutions" },
                hosting: { type: "array", items: { type: "string", maxLength: 30 }, description: "Deployment/Cloud" },
                other: { type: "array", items: { type: "string", maxLength: 30 }, description: "Cache, Queue, etc." },
            },
        },
        integration_points: {
            type: "array",
            items: {
                type: "object",
                required: ["service", "purpose"],
                properties: {
                    service: { type: "string", maxLength: 30, description: "External service" },
                    system: { type: "string", maxLength: 30, description: "System name" },
                    name: { type: "string", maxLength: 30, description: "Display name" },
                    purpose: { type: "string", maxLength: 100, description: "Purpose of integration" },
                    api_docs: { type: "string", format: "uri", maxLength: 100, description: "Docs URL" },
                },
            },
        },
        security_considerations: {
            type: "array",
            items: { type: "string", maxLength: 100 },
            description: "Specific security considerations for this architecture",
        },
        scalability_approach: {
            type: "object",
            properties: {
                horizontal_scaling: { type: "string", maxLength: 150 },
                database_scaling: { type: "string", maxLength: 150 },
                caching_strategy: { type: "string", maxLength: 150 },
                performance_targets: { type: "string", maxLength: 150 },
            },
        },

    },
};
