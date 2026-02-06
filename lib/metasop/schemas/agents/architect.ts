import { z } from "zod";

const APISchema = z.object({
    path: z.string().regex(/^\/.*/, "API path must start with /"),
    method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
    endpoint: z.string().optional(),
    description: z.string().min(10, "API description must be at least 10 characters"),
    request_schema: z.record(z.string(), z.any()).optional().describe("A map of field names to their types/descriptions"),
    response_schema: z.record(z.string(), z.any()).optional().describe("A map of field names to their types/descriptions"),
    auth_required: z.boolean().optional(),
    rate_limit: z.string().optional(),
});

const DecisionSchema = z.object({
    decision: z.string().min(5, "Decision must be at least 5 characters"),
    status: z.enum(["accepted", "proposed", "superseded"]),
    reason: z.string().min(10, "Reason must be at least 10 characters"),
    tradeoffs: z.string().min(5, "Tradeoffs must be at least 5 characters"),
    consequences: z.string().min(5, "Consequences must be at least 5 characters"),
    alternatives: z.array(z.string()).optional(),
});

const TableColumnSchema = z.object({
    name: z.string().regex(/^[a-z_][a-z0-9_]*$/, "Column name must be snake_case"),
    type: z.string().min(1, "Column type is required"),
    constraints: z.array(z.string()).optional(),
    description: z.string().optional(),
});

const TableIndexSchema = z.object({
    columns: z.array(z.string()).min(1, "At least one column is required"),
    type: z.enum(["btree", "hash", "gin", "gist"]).optional(),
    reason: z.string().optional(),
});

const TableRelationshipSchema = z.object({
    type: z.enum(["one-to-one", "one-to-many", "many-to-one", "many-to-many"]),
    from: z.string().min(1, "From column is required"),
    to: z.string().min(1, "To reference is required"),
    through: z.string().optional(),
    description: z.string().optional(),
});

const TableSchema = z.object({
    name: z.string().regex(/^[a-z_][a-z0-9_]*$/, "Table name must be snake_case"),
    description: z.string().optional(),
    columns: z.array(TableColumnSchema).min(1, "At least one column is required"),
    indexes: z.array(TableIndexSchema).optional(),
    relationships: z.array(TableRelationshipSchema).optional(),
});

const DatabaseSchemaSchema = z.object({
    tables: z.array(TableSchema).optional(),
    migrations_strategy: z.string().optional(),
});

const TechnologyStackSchema = z.object({
    frontend: z.array(z.string()).optional(),
    backend: z.array(z.string()).optional(),
    database: z.array(z.string()).optional(),
    authentication: z.array(z.string()).optional(),
    hosting: z.array(z.string()).optional(),
    other: z.array(z.string()).optional(),
});

const IntegrationPointSchema = z.object({
    service: z.string().min(1, "Service name is required"),
    name: z.string().optional(),
    system: z.string().optional(),
    purpose: z.string().min(1, "Purpose is required"),
    api_docs: z.string().url("API docs must be a valid URL").optional(),
});

const ScalabilityApproachSchema = z.object({
    horizontal_scaling: z.string().optional(),
    database_scaling: z.string().optional(),
    caching_strategy: z.string().optional(),
    performance_targets: z.string().optional(),
});

export const ArchitectArtifactSchema = z.object({
    design_doc: z.string().min(100, "Design document must be at least 100 characters"),
    apis: z.array(APISchema).min(1, "At least one API is required"),
    decisions: z.array(DecisionSchema).min(1, "At least one decision is required"),
    database_schema: DatabaseSchemaSchema,
    technology_stack: TechnologyStackSchema,
    integration_points: z.array(IntegrationPointSchema),
    security_considerations: z.array(z.string().min(10, "Security consideration must be at least 10 characters")),
    scalability_approach: ScalabilityApproachSchema,
    summary: z.string(),
    description: z.string(),
});

export function validateArchitectArtifact(data: unknown) {
    return ArchitectArtifactSchema.parse(data);
}

export function safeValidateArchitectArtifact(data: unknown) {
    return ArchitectArtifactSchema.safeParse(data);
}
