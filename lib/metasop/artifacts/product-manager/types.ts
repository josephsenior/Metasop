
// ============================================================================
// PRODUCT MANAGER ARTIFACT TYPES
// ============================================================================

export interface ProductManagerBackendArtifact {
    user_stories: Array<
        | string // User story as string in 'As a... I want... so that...' format (minLength: 10)
        | {
            id?: string; // Pattern: "^US-[0-9]+$"
            title: string; // REQUIRED: minLength: 5, maxLength: 200
            story?: string; // minLength: 20
            description?: string;
            priority?: "critical" | "high" | "medium" | "low";
            story_points?: number; // 1-13 (Fibonacci)
            acceptance_criteria?: string[]; // Array of strings (minLength: 10)
            dependencies?: string[]; // Array of story IDs (pattern: "^US-[0-9]+$")
            estimated_complexity?: "small" | "medium" | "large";
            user_value?: string; // minLength: 10
        }
    >; // REQUIRED: minItems: 1
    acceptance_criteria: Array<
        | string // Acceptance criterion as string (minLength: 10)
        | {
            id?: string; // Pattern: "^AC-[0-9]+$"
            title?: string;
            description?: string;
            criteria: string; // REQUIRED: minLength: 10
        }
    >; // REQUIRED: minItems: 1
    ui_multi_section?: boolean; // Default: false
    assumptions: string[]; // Array of strings (minLength: 10)
    out_of_scope: string[]; // Array of strings (minLength: 5)
    swot: {
        strengths: string[];
        weaknesses: string[];
        opportunities: string[];
        threats: string[];
    };
    stakeholders: Array<{
        role: string;
        interest: string;
        influence: "high" | "medium" | "low";
    }>;
    invest_analysis: Array<{
        user_story_id: string;
        independent: boolean;
        negotiable: boolean;
        valuable: boolean;
        estimatable: boolean;
        small: boolean;
        testable: boolean;
        score: number;
        comments: string;
    }>;
    summary: string;
    description: string;
    gaps: Array<{
        gap: string;
        impact: string;
        priority: "high" | "medium" | "low";
    }>;
    opportunities: Array<{
        opportunity: string;
        value: string;
        feasibility: "high" | "medium" | "low";
    }>;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isProductManagerBackendArtifact(
    artifact: any
): artifact is ProductManagerBackendArtifact {
    return (
        artifact &&
        Array.isArray(artifact.user_stories) &&
        Array.isArray(artifact.acceptance_criteria) &&
        Array.isArray(artifact.assumptions) &&
        Array.isArray(artifact.out_of_scope) &&
        typeof artifact.swot === "object" &&
        Array.isArray(artifact.stakeholders) &&
        Array.isArray(artifact.invest_analysis) &&
        typeof artifact.summary === "string" &&
        typeof artifact.description === "string" &&
        Array.isArray(artifact.gaps) &&
        Array.isArray(artifact.opportunities)
    );
}
