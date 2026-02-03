import { z } from "zod";

const UserStorySchema = z.union([
    z.string().min(10, "User story must be at least 10 characters"),
    z.object({
        id: z.string().regex(/^US-[0-9]+$/, "User story ID must match pattern US-{number}").optional(),
        title: z.string().min(5, "Title must be at least 5 characters").max(500, "Title must be at most 500 characters"),
        story: z.string().min(10, "Story must be at least 10 characters").optional(),
        narrative: z.string().min(10, "Narrative must be at least 10 characters").optional(), // Alias for story
        description: z.string().optional(),
        priority: z.string().transform(v => v.toLowerCase()).pipe(z.enum(["critical", "high", "medium", "low"])).optional(),
        story_points: z.number().int().min(1).max(100).optional(),
        acceptance_criteria: z.array(z.string().min(5, "Acceptance criterion must be at least 5 characters")).optional(),
        dependencies: z.array(z.string()).optional(),
        estimated_complexity: z.string().transform(v => v.toLowerCase()).pipe(z.enum(["small", "medium", "large"])).optional(),
        user_value: z.string().min(5, "User value must be at least 5 characters").optional(),
    }),
]);

const AcceptanceCriterionSchema = z.object({
    id: z.string().regex(/^AC-[0-9]+$/, "Acceptance criterion ID must match pattern AC-{number}").optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    criteria: z.string().min(10, "Criteria must be at least 10 characters"),
    priority: z.enum(["must", "should", "could"]).optional(),
});

export const ProductManagerArtifactSchema = z.object({
    user_stories: z.array(UserStorySchema).min(1, "At least one user story is required"),
    acceptance_criteria: z.array(AcceptanceCriterionSchema).min(1, "At least one acceptance criterion is required"),
    gaps: z.array(z.object({
        gap: z.string().min(5, "Gap must be at least 5 characters"),
        impact: z.string().min(5, "Impact must be at least 5 characters"),
        priority: z.enum(["high", "medium", "low"]),
    })),
    opportunities: z.array(z.object({
        opportunity: z.string().min(5, "Opportunity must be at least 5 characters"),
        value: z.string().min(5, "Value must be at least 5 characters"),
        feasibility: z.enum(["high", "medium", "low"]),
    })),
    ui_multi_section: z.boolean().optional().default(false),
    assumptions: z.array(z.string()),
    out_of_scope: z.array(z.string()),
    swot: z.object({
        strengths: z.array(z.string()),
        weaknesses: z.array(z.string()),
        opportunities: z.array(z.string()),
        threats: z.array(z.string()),
    }),
    stakeholders: z.array(z.object({
        role: z.string(),
        interest: z.string(),
        influence: z.enum(["high", "medium", "low"]),
    })),
    invest_analysis: z.array(z.object({
        user_story_id: z.string(),
        independent: z.boolean(),
        negotiable: z.boolean(),
        valuable: z.boolean(),
        estimatable: z.boolean(),
        small: z.boolean(),
        testable: z.boolean(),
        score: z.number(),
        comments: z.string().optional(),
    })),
    summary: z.string(),
    description: z.string(),
});

export function validateProductManagerArtifact(data: unknown) {
    return ProductManagerArtifactSchema.parse(data);
}

export function safeValidateProductManagerArtifact(data: unknown) {
    return ProductManagerArtifactSchema.safeParse(data);
}
