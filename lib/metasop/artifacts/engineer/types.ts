
// ============================================================================
// ENGINEER ARTIFACT TYPES
// ============================================================================

export interface FileNode {
    name: string; // REQUIRED
    type: "file" | "directory"; // REQUIRED
    children?: FileNode[];
}

export interface EngineerBackendArtifact {
    summary: string;
    description: string;
    artifact_path: string; // REQUIRED: minLength: 1
    file_structure: FileNode; // REQUIRED: Complete recursive file/folder structure (object, NOT array!)
    implementation_plan_phases: Array<{
        name: string;
        description: string;
        tasks: string[];
    }>;
    dependencies: string[]; // REQUIRED: Array of strings like "package@version" (NOT objects!)
    technical_decisions: Array<{
        decision: string;
        rationale: string; // REQUIRED
        alternatives: string;
    }>;
    environment_variables: Array<{
        name: string; // REQUIRED
        description: string; // REQUIRED
        example: string;
        required: boolean;
    }>;
    technical_patterns: string[]; // e.g. ["SOLID", "Factory", "Observer"]
    state_management: {
        tool: string;
        strategy: string;
    };
    run_results: {
        setup_commands: string[];
        dev_commands: string[];
        test_commands: string[];
        build_commands: string[];
        notes?: string;
    };

    // Allow additional/legacy fields to be present without breaking consumers
    [key: string]: any;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isEngineerBackendArtifact(
    artifact: any
): artifact is EngineerBackendArtifact {
    return (
        artifact &&
        typeof artifact.summary === "string" &&
        typeof artifact.description === "string" &&
        typeof artifact.artifact_path === "string" &&
        Array.isArray(artifact.implementation_plan_phases) &&
        Array.isArray(artifact.dependencies) &&
        typeof artifact.file_structure === "object"
    );
}
