
// ============================================================================
// ENGINEER ARTIFACT TYPES
// ============================================================================

export interface FileNode {
    name: string; // REQUIRED
    path?: string;
    file?: string; // Alias for name
    type?: "file" | "folder" | "directory";
    children?: FileNode[];
}

export interface EngineerBackendArtifact {
    summary?: string;
    description?: string;
    artifact_path: string; // REQUIRED: minLength: 1
    files?: FileNode[]; // Alias for file_structure (flat structure)
    file_changes?: FileNode[]; // Alias for files
    components?: FileNode[]; // List of components created
    file_structure?: FileNode; // REQUIRED: Complete recursive file/folder structure (object, NOT array!)
    implementation_plan?: string; // REQUIRED: Multi-phase development plan (string, NOT array!) (minLength: 50)
    phases?: Array<{
        name: string;
        description: string;
        tasks: string[];
    }>; // Structured plan to prevent truncation issues
    implementation_plan_phases?: Array<{
        name: string;
        description: string;
        tasks: string[];
    }>; // Alias for phases
    plan?: string; // Alias for implementation_plan
    dependencies?: string[]; // REQUIRED: Array of strings like "package@version" (NOT objects!)
    technical_decisions?: Array<{
        decision: string;
        rationale: string; // REQUIRED
        alternatives?: string;
    }>;
    environment_variables?: Array<{
        name: string; // REQUIRED
        description: string; // REQUIRED
        example?: string;
    }>;
    technical_patterns?: string[]; // e.g. ["SOLID", "Factory", "Observer"]
    state_management?: {
        tool: "Zustand" | "Redux" | "React Query" | "Context API" | "none";
        strategy: string;
    };
    tests_added?: boolean;
    run_results?: {
        setup_commands?: string[];
        dev_commands?: string[];
        test_commands?: string[];
        build_commands?: string[];
        notes?: string;
    };
    nodes?: any[];
    edges?: any[];
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isEngineerBackendArtifact(
    artifact: any
): artifact is EngineerBackendArtifact {
    return (
        artifact &&
        typeof artifact.artifact_path === "string" &&
        (typeof artifact.implementation_plan === "string" || typeof artifact.plan === "string")
    );
}
