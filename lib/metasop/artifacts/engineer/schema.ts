
export const engineerSchema = {
    type: "object",
    required: ["artifact_path", "file_structure", "implementation_plan", "dependencies", "tests_added", "run_results"],
    properties: {
        summary: { type: "string" },
        description: { type: "string" },
        artifact_path: {
            type: "string",
            description: "Base implementation directory (e.g., 'src', 'app').",
        },
        tests_added: {
            type: "boolean",
            description: "Whether unit or integration tests were included in the plan.",
        },
        run_results: {
            type: "object",
            description: "Standard commands for the project.",
            properties: {
                setup_commands: { type: "array", items: { type: "string" }, description: "Commands to set up the environment" },
                test_commands: { type: "array", items: { type: "string" }, description: "Commands to run tests" },
                dev_commands: { type: "array", items: { type: "string" }, description: "Commands to start dev server" },
            }
        },
        file_structure: {
            type: "object",
            required: ["name", "type"],
            description: "High-level project file structure. Focus on core directories and key files.",
            properties: {
                name: { type: "string", description: "File or folder name" },
                type: { type: "string", enum: ["file", "directory"], description: "Node type" },
                description: { type: "string", description: "Brief purpose" },
                children: {
                    type: "array",
                    maxItems: 12,
                    description: "Contents of the directory. Limit to essential files.",
                    items: {
                        type: "object",
                        properties: {
                            name: { type: "string" },
                            type: { type: "string", enum: ["file", "directory"] },
                            description: { type: "string" },
                            children: {
                                type: "array",
                                maxItems: 8,
                                items: {
                                    type: "object",
                                    properties: {
                                        name: { type: "string" },
                                        type: { type: "string", enum: ["file", "directory"] },
                                        description: { type: "string" }
                                    }
                                },
                            },
                        },
                    },
                },
            },
        },
        implementation_plan: {
            type: "string",
            description: "Concise step-by-step implementation guide in Markdown (~300 chars).",
        },
        phases: {
            type: "array",
            maxItems: 5,
            description: "Essential implementation phases.",
            items: {
                type: "object",
                required: ["name", "description", "tasks"],
                properties: {
                    name: { type: "string", description: "Phase name" },
                    description: { type: "string", description: "Brief summary" },
                    tasks: {
                        type: "array",
                        maxItems: 5,
                        items: { type: "string" },
                        description: "Key technical tasks"
                    }
                }
            }
        },
        dependencies: {
            type: "array",
            items: { type: "string", pattern: "^[^@]+@[^@]+$", description: "package@version" },
            description: "Generate essential dependencies for a modern TypeScript/Next.js stack.",
        },
        technical_decisions: {
            type: "array",
            items: {
                type: "object",
                required: ["decision", "rationale"],
                properties: {
                    decision: { type: "string" },
                    rationale: { type: "string" },
                    alternatives: { type: "string" },
                },
            },
            description: "Critical implementation decisions (e.g., State Management choice, UI Kit, ORM selection).",
        },
        environment_variables: {
            type: "array",
            items: {
                type: "object",
                required: ["name", "description"],
                properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    example: { type: "string" },
                },
            },
        },
        technical_patterns: {
            type: "array",
            items: { type: "string" },
            description: "Industry patterns used (e.g., SOLID, Repository, Factory)",
        },
        state_management: {
            type: "object",
            required: ["tool", "strategy"],
            properties: {
                tool: { type: "string", enum: ["Zustand", "Redux", "React Query", "Context API", "none"] },
                strategy: { type: "string", description: "Implementation strategy (e.g., 'Slice pattern', 'Hydration')" },
            },
        },
    },
};
