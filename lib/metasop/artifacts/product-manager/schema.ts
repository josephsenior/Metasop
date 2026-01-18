
export const pmSchema = {
    type: "object",
    required: ["user_stories", "acceptance_criteria", "summary", "description", "assumptions", "out_of_scope", "swot", "stakeholders", "invest_analysis", "gaps", "opportunities"],
    properties: {
        gaps: {
            type: "array",
            description: "Identified product gaps, missing features, or user pain points.",
            items: {
                type: "object",
                required: ["gap", "impact", "priority"],
                properties: {
                    gap: { type: "string" },
                    impact: { type: "string" },
                    priority: { type: "string", enum: ["high", "medium", "low"] }
                }
            }
        },
        opportunities: {
            type: "array",
            description: "Product opportunities and growth areas.",
            items: {
                type: "object",
                required: ["opportunity", "value", "feasibility"],
                properties: {
                    opportunity: { type: "string" },
                    value: { type: "string" },
                    feasibility: { type: "string", enum: ["high", "medium", "low"] }
                }
            }
        },
        user_stories: {
            type: "array",
            maxItems: 10,
            description: "Array of user stories. Aim for 5-10 detailed stories.",
            items: {
                type: "object",
                required: ["title", "story", "description", "priority", "story_points", "acceptance_criteria", "estimated_complexity", "user_value"],
                properties: {
                    id: {
                        type: "string",
                        pattern: "^US-[0-9]+$",
                        description: "User story ID (e.g., US-1, US-2)",
                    },
                    title: {
                        type: "string",
                        description: "User story title",
                    },
                    story: {
                        type: "string",
                        description: "User story in 'As a... I want... so that...' format",
                    },
                    description: {
                        type: "string",
                        description: "Detailed description of the user story",
                    },
                    priority: {
                        type: "string",
                        enum: ["critical", "high", "medium", "low"],
                        description: "Priority level",
                    },
                    story_points: {
                        type: "number",
                        minimum: 1,
                        maximum: 13,
                        description: "Story points (Fibonacci: 1, 2, 3, 5, 8, 13)",
                    },
                    acceptance_criteria: {
                        type: "array",
                        maxItems: 5,
                        items: {
                            type: "string",
                        },
                        description: "Acceptance criteria for this user story",
                    },
                    dependencies: {
                        type: "array",
                        maxItems: 3,
                        items: {
                            type: "string",
                            pattern: "^US-[0-9]+$",
                        },
                        description: "Array of user story IDs this story depends on",
                    },
                    estimated_complexity: {
                        type: "string",
                        enum: ["small", "medium", "large"],
                        description: "Estimated complexity",
                    },
                    user_value: {
                        type: "string",
                        description: "Value this story provides to users",
                    },
                },
            },
        },
        acceptance_criteria: {
            type: "array",
            maxItems: 12,
            description: "Array of acceptance criteria. Aim for 8-12 comprehensive criteria.",
            items: {
                type: "object",
                required: ["criteria"],
                properties: {
                    id: {
                        type: "string",
                        pattern: "^AC-[0-9]+$",
                        description: "Acceptance criterion ID (e.g., AC-1, AC-2)",
                    },
                    title: {
                        type: "string",
                        description: "Acceptance criterion title",
                    },
                    description: {
                        type: "string",
                        description: "Detailed description",
                    },
                    criteria: {
                        type: "string",
                        description: "The actual acceptance criterion",
                    },
                    priority: {
                        type: "string",
                        enum: ["must", "should", "could"],
                        description: "MoSCoW priority",
                    },
                },
            },
        },
        ui_multi_section: {
            type: "boolean",
            description: "Whether the UI has multiple sections",
            default: false,
        },
        assumptions: {
            type: "array",
            items: {
                type: "string",
            },
            description: "Array of assumptions about the project",
        },
        out_of_scope: {
            type: "array",
            items: {
                type: "string",
            },
            description: "Array of items explicitly out of scope",
        },
        swot: {
            type: "object",
            required: ["strengths", "weaknesses", "opportunities", "threats"],
            properties: {
                strengths: { type: "array", items: { type: "string" } },
                weaknesses: { type: "array", items: { type: "string" } },
                opportunities: { type: "array", items: { type: "string" } },
                threats: { type: "array", items: { type: "string" } },
            },
            description: "SWOT analysis of the product",
        },
        stakeholders: {
            type: "array",
            items: {
                type: "object",
                required: ["role", "interest", "influence"],
                properties: {
                    role: { type: "string", description: "Stakeholder role" },
                    interest: { type: "string", description: "Stakeholder interest/concern" },
                    influence: { type: "string", enum: ["high", "medium", "low"], description: "Level of influence" },
                },
            },
            description: "Key project stakeholders",
        },
        invest_analysis: {
            type: "array",
            items: {
                type: "object",
                required: ["user_story_id", "independent", "negotiable", "valuable", "estimatable", "small", "testable", "score"],
                properties: {
                    user_story_id: { type: "string", description: "ID of the user story" },
                    independent: { type: "boolean", description: "Is the story independent?" },
                    negotiable: { type: "boolean", description: "Is it negotiable?" },
                    valuable: { type: "boolean", description: "Does it provide value?" },
                    estimatable: { type: "boolean", description: "Is it estimatable?" },
                    small: { type: "boolean", description: "Is it small enough?" },
                    testable: { type: "boolean", description: "Is it testable?" },
                    score: { type: "number", description: "Overall INVEST score (0-10)" },
                    comments: { type: "string", description: "Specific comments on the INVEST evaluation" },
                },
            },
            description: "INVEST analysis for user stories",
        },
        summary: { type: "string", description: "Executive summary of the product specification" },
        description: { type: "string", description: "Detailed description of the product and its vision" },
    },
};
