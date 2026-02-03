import { z } from "zod";

const FileNodeSchema: z.ZodType<any> = z.lazy(() =>
    z.object({
        name: z.string().min(1, "File/folder name is required"),
        path: z.string().optional(),
        file: z.string().optional(),
        type: z.enum(["file", "folder", "directory"]).optional(),
        description: z.string().min(5, "Description must be at least 5 characters").optional(),
        children: z.array(FileNodeSchema).optional(),
    })
);

const RunResultsSchema = z.object({
    setup_commands: z.array(z.string()), // REQUIRED: Setup commands (e.g., 'npm install')
    test_commands: z.array(z.string()), // REQUIRED: Test commands (e.g., 'npm test')
    dev_commands: z.array(z.string()), // REQUIRED: Dev commands (e.g., 'npm run dev')
    build_commands: z.array(z.string()).optional(),
    notes: z.string().optional(),
});

const TechnicalDecisionSchema = z.object({
    decision: z.string().min(1, "Decision is required"),
    rationale: z.string().min(1, "Rationale is required"),
    alternatives: z.string().optional(),
});

const EnvironmentVariableSchema = z.object({
    name: z.string().min(1, "Environment variable name is required"),
    description: z.string().min(1, "Description is required"),
    example: z.string().optional(),
});

export const EngineerArtifactSchema = z.object({
    artifact_path: z.string().min(1, "Artifact path is required"),
    run_results: RunResultsSchema, // REQUIRED: Must have setup_commands, test_commands, dev_commands
    files: z.array(FileNodeSchema).optional(),
    file_changes: z.array(FileNodeSchema).optional(),
    components: z.array(FileNodeSchema).optional(),
    file_structure: FileNodeSchema, // REQUIRED: Complete file structure
    implementation_plan: z.string().min(50, "Implementation plan must be at least 50 characters"),
    plan: z.string().min(50, "Plan must be at least 50 characters").optional(),
    phases: z.array(z.object({
        name: z.string(),
        description: z.string(),
        tasks: z.array(z.string()),
    })).optional(),
    implementation_plan_phases: z.array(z.object({
        name: z.string(),
        description: z.string(),
        tasks: z.array(z.string()),
    })).optional(),
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
});

export function validateEngineerArtifact(data: unknown) {
    return EngineerArtifactSchema.parse(data);
}

export function safeValidateEngineerArtifact(data: unknown) {
    return EngineerArtifactSchema.safeParse(data);
}
