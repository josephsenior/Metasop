
export const pmSchema = {
    type: "object",
    required: ["user_stories", "acceptance_criteria", "summary", "description", "assumptions", "out_of_scope", "swot", "stakeholders", "invest_analysis", "gaps", "opportunities"],
    propertyOrdering: ["summary", "description", "gaps", "opportunities", "user_stories", "acceptance_criteria", "assumptions", "out_of_scope", "swot", "stakeholders", "invest_analysis"],
    properties: {
        summary: { type: "string", maxLength: 250, description: "A technical, 1-2 sentence summary of the product. No conversational filler." },
        description: { type: "string", maxLength: 500, description: "Detailed product vision, target audience, and value proposition." },
        gaps: {
            type: "array",
            description: "Identified product gaps or user pain points.",
            items: {
                type: "object",
                required: ["gap", "impact", "priority"],
                properties: {
                    gap: { type: "string", maxLength: 50 },
                    impact: { type: "string", maxLength: 100 },
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
                    opportunity: { type: "string", maxLength: 50 },
                    value: { type: "string", maxLength: 100 },
                    feasibility: { type: "string", enum: ["high", "medium", "low"] }
                }
            }
        },
        user_stories: {
            type: "array",
            description: "Array of INVEST-compliant user stories.",
            items: {
                type: "object",
                required: ["title", "story", "description", "priority", "story_points", "acceptance_criteria", "estimated_complexity", "user_value", "dependencies"],
                properties: {
                    id: {
                        type: "string",
                        pattern: "^US-[0-9]+$",
                        description: "User story ID (e.g., US-1, US-2)",
                    },
                    title: {
                        type: "string",
                        maxLength: 80,
                        description: "Concise user story title.",
                    },
                    story: {
                        type: "string",
                        maxLength: 250,
                        description: "Story in 'As a [role], I want [feature] so that [benefit]' format.",
                    },
                    description: {
                        type: "string",
                        maxLength: 350,
                        description: "Brief technical description with implementation hints.",
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
                        items: {
                            type: "string",
                            maxLength: 200,
                        },
                        description: "Specific, testable acceptance criteria for this story.",
                    },
                    dependencies: {
                        type: "array",
                        items: {
                            type: "string",
                            pattern: "^US-[0-9]+$",
                        },
                        description: "Story IDs this depends on.",
                    },
                    estimated_complexity: {
                        type: "string",
                        enum: ["small", "medium", "large"],
                        description: "Estimated complexity",
                    },
                    user_value: { type: "string", maxLength: 150, description: "Clear statement of value delivered to the user." },
                },
            },
        },
        acceptance_criteria: {
            type: "array",
            description: "Array of acceptance criteria.",
            items: {
                type: "object",
                required: ["criteria", "priority"],
                properties: {
                    id: {
                        type: "string",
                        pattern: "^AC-[0-9]+$",
                        description: "Acceptance criterion ID (e.g., AC-1, AC-2)",
                    },
                    title: {
                        type: "string",
                        maxLength: 50,
                        description: "Acceptance criterion title.",
                    },
                    description: {
                        type: "string",
                        maxLength: 200,
                        description: "Detailed description.",
                    },
                    criteria: {
                        type: "string",
                        maxLength: 200,
                        description: "The actual acceptance criterion.",
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
                maxLength: 100,
            },
            description: "Array of assumptions about the project.",
        },
        out_of_scope: {
            type: "array",
            items: {
                type: "string",
                maxLength: 100,
            },
            description: "Array of items explicitly out of scope.",
        },
        swot: {
            type: "object",
            required: ["strengths", "weaknesses", "opportunities", "threats"],
            properties: {
                strengths: { type: "array", items: { type: "string", maxLength: 50 } },
                weaknesses: { type: "array", items: { type: "string", maxLength: 50 } },
                opportunities: { type: "array", items: { type: "string", maxLength: 50 } },
                threats: { type: "array", items: { type: "string", maxLength: 50 } },
            },
            description: "SWOT analysis of the product",
        },
        stakeholders: {
            type: "array",
            items: {
                type: "object",
                required: ["role", "interest", "influence"],
                properties: {
                    role: { type: "string", maxLength: 30, description: "Stakeholder role" },
                    interest: { type: "string", maxLength: 100, description: "Stakeholder interest/concern" },
                    influence: { type: "string", enum: ["high", "medium", "low"], description: "Level of influence" },
                },
            },
            description: "Key project stakeholders.",
        },
        invest_analysis: {
            type: "array",
            items: {
                type: "object",
                required: ["user_story_id", "independent", "negotiable", "valuable", "estimatable", "small", "testable", "score"],
                properties: {
                    user_story_id: { type: "string", maxLength: 20, description: "ID of the user story" },
                    independent: { type: "boolean" },
                    negotiable: { type: "boolean" },
                    valuable: { type: "boolean" },
                    estimatable: { type: "boolean" },
                    small: { type: "boolean" },
                    testable: { type: "boolean" },
                    score: { type: "number", minimum: 0, maximum: 10 },
                    comments: { type: "string", maxLength: 100 },
                },
            },
            description: "INVEST analysis for user stories.",
        },
    },
};
