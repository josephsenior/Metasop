
export const architectSchema = {
    type: "object",
    required: ["design_doc", "apis", "decisions", "next_tasks", "technology_stack", "database_schema", "integration_points", "security_considerations", "scalability_approach", "summary", "description"],
    properties: {
        design_doc: {
            type: "string",
            description: "Comprehensive architecture design document in markdown format. Aim for ~2000 characters for complex systems. Cover system overview, architecture patterns, data flow, security architecture, and scalability considerations.",
        },
        apis: {
            type: "array",
            maxItems: 12,
            description: "Detailed API specification. Generate necessary endpoints covering full CRUD for core entities.",
            items: {
                type: "object",
                required: ["path", "method", "description", "request_schema", "response_schema"],
                properties: {
                    path: { type: "string", pattern: "^/.*", description: "API endpoint path" },
                    method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE", "PATCH"], description: "HTTP method" },
                    description: { type: "string", description: "Detailed endpoint description" },
                    request_schema: { type: "object", description: "Request body or query schema as a JSON object (field names to types)" },
                    response_schema: { type: "object", description: "Response body schema as a JSON object (field names to types)" },
                    auth_required: { type: "boolean", description: "Whether authentication is required" },
                    rate_limit: { type: "string", description: "Rate limit (e.g., '100 requests/minute')" },
                },
            },
        },
        decisions: {
            type: "array",
            maxItems: 8,
            description: "Core architectural decisions.",
            items: {
                type: "object",
                required: ["decision", "status", "reason", "tradeoffs", "consequences"],
                properties: {
                    decision: { type: "string", description: "The architectural decision" },
                    status: { type: "string", enum: ["accepted", "proposed", "superseded"], description: "Current status of the decision" },
                    reason: { type: "string", description: "Comprehensive reasoning" },
                    rationale: { type: "string", description: "Executive summary of the reasoning" },
                    tradeoffs: { type: "string", description: "Detailed tradeoffs analysis" },
                    consequences: { type: "string", description: "The consequences (positive and negative) of the decision" },
                    alternatives: {
                        type: "array",
                        maxItems: 3,
                        items: { type: "string" },
                        description: "Alternative approaches considered",
                    },
                },
            },
        },
        next_tasks: {
            type: "array",
            maxItems: 6,
            description: "Specific next tasks for the implementation team.",
            items: {
                type: "object",
                required: ["role", "task"],
                properties: {
                    role: { type: "string", enum: ["Engineer", "DevOps", "QA", "Designer", "Product Manager"] },
                    task: { type: "string", description: "Actionable task description" },
                    title: { type: "string", description: "Short title for the task" },
                    description: { type: "string", description: "Additional implementation details" },
                    priority: { type: "string", enum: ["high", "medium", "low"] },
                },
            },
        },
        database_schema: {
            type: "object",
            description: "Complete relational database schema. Design tables covering core application data and user management.",
            properties: {
                tables: {
                    type: "array",
                    minItems: 1,
                    maxItems: 8,
                    items: {
                        type: "object",
                        required: ["name", "columns"],
                        properties: {
                            name: { type: "string", pattern: "^[a-z_][a-z0-9_]*$", description: "Table name (snake_case)" },
                            description: { type: "string", description: "Table description" },
                            columns: {
                                type: "array",
                                minItems: 1,
                                maxItems: 12,
                                items: {
                                    type: "object",
                                    required: ["name", "type"],
                                    properties: {
                                        name: { type: "string", pattern: "^[a-z_][a-z0-9_]*$", description: "Column name (snake_case)" },
                                        type: { type: "string", description: "SQL data type" },
                                        constraints: { type: "array", items: { type: "string" }, description: "Column constraints (PK, FK, UNIQUE, etc.)" },
                                        description: { type: "string", description: "Column purpose" },
                                    },
                                },
                            },
                            indexes: {
                                type: "array",
                                maxItems: 4,
                                items: {
                                    type: "object",
                                    required: ["columns"],
                                    properties: {
                                        columns: { type: "array", items: { type: "string" }, minItems: 1 },
                                        type: { type: "string", enum: ["btree", "hash", "gin", "gist"] },
                                        reason: { type: "string" },
                                    },
                                },
                            },
                            relationships: {
                                type: "array",
                                maxItems: 6,
                                items: {
                                    type: "object",
                                    required: ["type", "from", "to"],
                                    properties: {
                                        type: { type: "string", enum: ["one-to-one", "one-to-many", "many-to-one", "many-to-many"] },
                                        from: { type: "string", description: "Source column" },
                                        to: { type: "string", description: "Target table.column" },
                                        through: { type: "string", description: "Junction table for M2M" },
                                        description: { type: "string" },
                                    },
                                },
                            },
                        },
                    },
                },
                migrations_strategy: { type: "string", description: "Database migration strategy" },
            },
        },
        technology_stack: {
            type: "object",
            description: "Specific technology choices with justification.",
            properties: {
                frontend: { type: "array", items: { type: "string" }, description: "Frontend stack" },
                backend: { type: "array", items: { type: "string" }, description: "Backend stack" },
                database: { type: "array", items: { type: "string" }, description: "Database choice" },
                authentication: { type: "array", items: { type: "string" }, description: "Auth solutions" },
                hosting: { type: "array", items: { type: "string" }, description: "Deployment/Cloud" },
                other: { type: "array", items: { type: "string" }, description: "Cache, Queue, etc." },
            },
        },
        integration_points: {
            type: "array",
            items: {
                type: "object",
                required: ["service", "purpose"],
                properties: {
                    service: { type: "string", description: "External service" },
                    system: { type: "string", description: "System name" },
                    name: { type: "string", description: "Display name" },
                    purpose: { type: "string", description: "Purpose of integration" },
                    api_docs: { type: "string", format: "uri", description: "Docs URL" },
                },
            },
        },
        security_considerations: {
            type: "array",
            items: { type: "string" },
            description: "Specific security considerations for this architecture",
        },
        scalability_approach: {
            type: "object",
            properties: {
                horizontal_scaling: { type: "string" },
                database_scaling: { type: "string" },
                caching_strategy: { type: "string" },
                performance_targets: { type: "string" },
            },
        },
        summary: { type: "string", description: "Executive summary of the architecture" },
        description: { type: "string", description: "Detailed description of the system" },
    },
};
