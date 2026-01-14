
export const engineerSchema = {
    type: "object",
    required: ["artifact_path", "file_structure", "implementation_plan", "dependencies", "run_results", "summary", "description", "technical_decisions", "environment_variables", "technical_patterns", "state_management"],
    properties: {
        summary: { type: "string" },
        description: { type: "string" },
        artifact_path: {
            type: "string",
            description: "Base implementation directory (e.g., 'src', 'app').",
        },
        run_results: {
            type: "object",
            required: ["setup_commands", "test_commands", "dev_commands"],
            description: "Standard commands for the project.",
            properties: {
                setup_commands: { type: "array", items: { type: "string" }, description: "Commands to set up the environment" },
                test_commands: { type: "array", items: { type: "string" }, description: "Commands to run tests" },
                dev_commands: { type: "array", items: { type: "string" }, description: "Commands to start dev server" },
            }
        },
        file_structure: {
            type: "object",
            required: ["name", "type", "children"],
            description: "High-level project file structure. Focus on metadata only. DO NOT include 'content', 'code', or 'source' fields.",
            properties: {
                name: { type: "string", description: "File or folder name" },
                type: { type: "string", enum: ["file", "directory"], description: "Node type" },
                children: {
                    type: "array",
                    minItems: 0,
                    description: "Contents of the directory. Limit to essential files. DO NOT include file content.",
                    items: {
                        type: "object",
                        properties: {
                            name: { type: "string" },
                            type: { type: "string", enum: ["file", "directory"] },
                            children: {
                                type: "array",
                                minItems: 0,
                                items: {
                                    type: "object",
                                    properties: {
                                        name: { type: "string" },
                                        type: { type: "string", enum: ["file", "directory"] },
                                        children: {
                                            type: "array",
                                            minItems: 0,
                                            items: {
                                                type: "object",
                                                properties: {
                                                    name: { type: "string" },
                                                    type: { type: "string", enum: ["file", "directory"] },
                                                    children: {
                                                        type: "array",
                                                        minItems: 0,
                                                        items: {
                                                            type: "object",
                                                            properties: {
                                                                name: { type: "string" },
                                                                type: { type: "string", enum: ["file", "directory"] },
                                                                children: {
                                                                    type: "array",
                                                                    minItems: 0,
                                                                    items: {
                                                                        type: "object",
                                                                        properties: {
                                                                            name: { type: "string" },
                                                                            type: { type: "string", enum: ["file", "directory"] },
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                description: "Nested files and folders. Provide a deep, production-ready structure."
                            },
                        },
                    },
                },
            },
        },
        implementation_plan: {
            type: "string",
            description: "Detailed step-by-step technical implementation guide in Markdown.",
        },
        dependencies: {
            type: "array",
            items: { type: "string", description: "Dependency name and version (e.g., 'package@version', 'package==version', or 'package v1.0')" },
            description: "Generate all essential dependencies required for the project based on the chosen technology stack.",
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
                tool: { type: "string", description: "The state management tool or pattern (e.g., 'Zustand', 'Context API', 'Vuex', 'Redux', 'Signals', or server-side session management)" },
                strategy: { type: "string", description: "Implementation strategy (e.g., 'Slice pattern', 'Hydration', 'Server-side state')" },
            },
        },
    },
};
