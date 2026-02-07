import { z } from "zod";

type CanonicalFileNode = {
    name: string;
    type: "file" | "directory";
    description?: string;
    children?: CanonicalFileNode[];
};

const FileNodeSchema: z.ZodType<CanonicalFileNode, z.ZodTypeDef, any> = z.lazy(() =>
    z
        .object({
            name: z.string().min(1, "File/folder name is required"),
            type: z.enum(["file", "directory"]),
            description: z.string().optional(),
            children: z.array(FileNodeSchema).optional(),
        })
        .strict()
);

const RunResultsSchema = z.object({
    setup_commands: z.array(z.string()), // REQUIRED: Setup commands (e.g., 'npm install')
    test_commands: z.array(z.string()), // REQUIRED: Test commands (e.g., 'npm test')
    dev_commands: z.array(z.string()), // REQUIRED: Dev commands (e.g., 'npm run dev')
    build_commands: z.array(z.string()),
    notes: z.string().optional(),
}).strict();

const TechnicalDecisionSchema = z.object({
    decision: z.string().min(1, "Decision is required"),
    rationale: z.string().min(1, "Rationale is required"),
    alternatives: z.string(),
}).strict();

const EnvironmentVariableSchema = z.object({
    name: z.string().min(1, "Environment variable name is required"),
    description: z.string().min(1, "Description is required"),
    example: z.string().optional(),
    required: z.boolean(),
}).strict();

export const EngineerArtifactSchema = z
    .object({
        artifact_path: z.string().min(1, "Artifact path is required"),
        run_results: RunResultsSchema, // REQUIRED: Must have setup_commands, test_commands, dev_commands

        file_structure: FileNodeSchema,

        implementation_plan_phases: z.array(
            z.object({
                name: z.string(),
                description: z.string(),
                tasks: z.array(z.string()),
            })
        ),
        dependencies: z.array(z.string().min(1, "Dependency must not be empty")), // REQUIRED
        technical_decisions: z.array(TechnicalDecisionSchema), // REQUIRED
        environment_variables: z.array(EnvironmentVariableSchema), // REQUIRED
        technical_patterns: z.array(z.string()), // REQUIRED
        state_management: z.object({
            tool: z.string(),
            strategy: z.string(),
        }), // REQUIRED
        summary: z.string(), // REQUIRED
        description: z.string(), // REQUIRED
    })
    .strict();

export function validateEngineerArtifact(data: unknown) {
    return EngineerArtifactSchema.parse(data);
}

export function safeValidateEngineerArtifact(data: unknown) {
    return EngineerArtifactSchema.safeParse(data);
}
