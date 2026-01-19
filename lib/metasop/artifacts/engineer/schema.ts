
export const engineerSchema = {
    type: "object",
    required: ["artifact_path", "file_structure", "implementation_plan", "implementation_plan_phases", "dependencies", "run_results", "summary", "description", "technical_decisions", "environment_variables", "technical_patterns", "state_management"],
    properties: {
        summary: { type: "string", maxLength: 150, description: "A technical, 1-sentence summary of the implementation strategy." },
        description: { type: "string", maxLength: 300, description: "Detailed implementation philosophy and technical roadmap." },
        artifact_path: {
            type: "string",
            maxLength: 30,
            description: "Base directory (e.g., 'src/app').",
        },
        run_results: {
            type: "object",
            required: ["setup_commands", "test_commands", "dev_commands"],
            description: "Essential CLI commands.",
            properties: {
                setup_commands: { type: "array", items: { type: "string", maxLength: 50 }, description: "Setup (e.g., 'npm install')." },
                test_commands: { type: "array", items: { type: "string", maxLength: 50 }, description: "Tests (e.g., 'npm test')." },
                dev_commands: { type: "array", items: { type: "string", maxLength: 50 }, description: "Dev (e.g., 'npm run dev')." },
                build_commands: { type: "array", items: { type: "string", maxLength: 50 }, description: "Build (e.g., 'npm run build')." },
                notes: { type: "string", maxLength: 200, description: "Operational notes or context." },
            }
        },
        file_structure: {
            type: "object",
            required: ["name", "type", "children"],
            description: "Full project scaffold and boilerplate. Focus on metadata. DO NOT include file content.",
            properties: {
                name: { type: "string", maxLength: 30, description: "Root name." },
                type: { type: "string", enum: ["file", "directory"] },
                children: {
                    type: "array",
                    items: {
                        type: "object",
                        required: ["name", "type"],
                        properties: {
                            name: { type: "string", maxLength: 30 },
                            type: { type: "string", enum: ["file", "directory"] },
                            children: {
                                type: "array",
                                items: {
                                    type: "object",
                                    required: ["name", "type"],
                                    properties: {
                                        name: { type: "string", maxLength: 30 },
                                        type: { type: "string", enum: ["file", "directory"] },
                                        children: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                required: ["name", "type"],
                                                properties: {
                                                    name: { type: "string", maxLength: 30 },
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
        implementation_plan: {
            type: "string",
            maxLength: 3000,
            description: "Technical step-by-step guide in Markdown. Focused and concise.",
        },
        implementation_plan_phases: {
            type: "array",
            items: {
                type: "object",
                required: ["name", "description", "tasks"],
                properties: {
                    name: { type: "string", maxLength: 50 },
                    description: { type: "string", maxLength: 200 },
                    tasks: { type: "array", items: { type: "string", maxLength: 100 } },
                }
            },
            description: "Structured implementation phases for the roadmap view.",
        },
        dependencies: {
            type: "array",
            items: { type: "string", maxLength: 40, description: "Dep (e.g., 'next@14.1.0')." },
            description: "Essential build dependencies.",
        },
        technical_decisions: {
            type: "array",
            items: {
                type: "object",
                required: ["decision", "rationale"],
                properties: {
                    decision: { type: "string", maxLength: 60 },
                    rationale: { type: "string", maxLength: 150 },
                    alternatives: { type: "string", maxLength: 100 },
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
                    name: { type: "string", maxLength: 40 },
                    description: { type: "string", maxLength: 100 },
                    example: { type: "string", maxLength: 100 },
                },
            },
            description: "Environment variables.",
        },
        technical_patterns: {
            type: "array",
            items: { type: "string", maxLength: 30 },
            description: "Industry patterns used (e.g., SOLID, Repository, Factory).",
        },
        state_management: {
            type: "object",
            required: ["tool", "strategy"],
            properties: {
                tool: { type: "string", maxLength: 30, description: "The state management tool or pattern." },
                strategy: { type: "string", maxLength: 150, description: "Implementation strategy." },
            },
        },
    },
};
