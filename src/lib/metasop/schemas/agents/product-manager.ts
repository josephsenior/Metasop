import { z } from "zod";

const deriveTitle = (storyText: string) => {
    const trimmed = storyText.trim();
    if (!trimmed) return "User story";
    const firstSentence = trimmed.split(/\.(\s|$)/)[0] ?? trimmed;
    return firstSentence.length > 80 ? `${firstSentence.slice(0, 77)}...` : firstSentence;
};

const UserStorySchema = z
    .object({
        id: z.string().regex(/^US-[0-9]+$/, "User story ID must match pattern US-{number}"),
        title: z.string().min(5, "Title must be at least 5 characters").max(500, "Title must be at most 500 characters"),
        story: z.string().min(10, "Story must be at least 10 characters"),
        description: z.string().optional(),
        priority: z.string().transform(v => v.toLowerCase()).pipe(z.enum(["critical", "high", "medium", "low"])).optional(),
        story_points: z.number().int().min(1).max(100).optional(),
        acceptance_criteria: z.array(z.string().min(5, "Acceptance criterion must be at least 5 characters")).optional(),
        dependencies: z.array(z.string()).optional(),
        estimated_complexity: z.string().transform(v => v.toLowerCase()).pipe(z.enum(["small", "medium", "large"])).optional(),
        user_value: z.string().min(5, "User value must be at least 5 characters").optional(),
    })
    .strict();

const AcceptanceCriterionSchema = z.object({
    id: z.string().regex(/^AC-[0-9]+$/, "Acceptance criterion ID must match pattern AC-{number}").optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    criteria: z.string().min(10, "Criteria must be at least 10 characters"),
    priority: z.enum(["must", "should", "could"]).optional(),
}).strict();

export const ProductManagerArtifactSchema = z.object({
    user_stories: z.array(UserStorySchema).min(1, "At least one user story is required"),
    acceptance_criteria: z.array(AcceptanceCriterionSchema).min(1, "At least one acceptance criterion is required"),
    ui_multi_section: z.boolean().optional(),
    assumptions: z.array(z.string()),
    out_of_scope: z.array(z.string()),
    swot: z.object({
        strengths: z.array(z.string()),
        weaknesses: z.array(z.string()),
        opportunities: z.array(z.string()),
        threats: z.array(z.string()),
    }).strict(),
    stakeholders: z.array(z.object({
        role: z.string(),
        interest: z.string(),
        influence: z.enum(["high", "medium", "low"]),
    }).strict()),
    invest_analysis: z.array(z.object({
        user_story_id: z.string(),
        independent: z.boolean(),
        negotiable: z.boolean(),
        valuable: z.boolean(),
        estimatable: z.boolean(),
        small: z.boolean(),
        testable: z.boolean(),
        score: z.number().optional(),
        comments: z.string().optional(),
    }).strict()),
    summary: z.string(),
    description: z.string(),
}).strict();

export function validateProductManagerArtifact(data: unknown) {
    return ProductManagerArtifactSchema.parse(data);
}

export function safeValidateProductManagerArtifact(data: unknown) {
    return ProductManagerArtifactSchema.safeParse(data);
}
