
// ============================================================================
// QA ARTIFACT TYPES
// ============================================================================


// ============================================================================
// QA ARTIFACT TYPES (PLANNING ONLY)
// ============================================================================

export interface TestCase {
    id: string;      // REQUIRED - Short ID (e.g., TC-1)
    title: string;   // REQUIRED - Test case title
    description?: string;
    type: "unit" | "integration" | "e2e" | "manual";
    priority: "high" | "medium" | "low";
    expected_result: string; // REQUIRED
}

export interface QABackendArtifact {
    ok: boolean;
    test_strategy: {
        unit: string;
        integration: string;
        e2e: string;
        approach?: string;
        types?: string[];
        tools?: string[];
    };
    test_cases: TestCase[];
    security_plan: {
        auth_verification_steps?: string[];
        vulnerability_scan_strategy?: string;
    };
    manual_verification_steps: string[];
    risk_analysis: Array<{
        risk: string;
        impact: "high" | "medium" | "low";
        mitigation: string;
    }>;
    summary: string;
    description: string;
    accessibility_plan: {
        standard: string;
        automated_tools?: string[];
        manual_checks?: string[];
        screen_readers?: string[];
    };
    manual_uat_plan?: {
        scenarios?: string[];
        acceptance_criteria?: string[];
        stakeholders?: string[];
    };
    coverage: {
        percentage: number;
        threshold: number;
        lines: number;
        statements: number;
        functions: number;
        branches: number;
    };
    performance_metrics: {
        api_response_time_p95: string;
        page_load_time: string;
        database_query_time: string;
        first_contentful_paint: string;
        time_to_interactive: string;
        largest_contentful_paint: string;
    };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isQABackendArtifact(artifact: any): artifact is QABackendArtifact {
    return (
        artifact &&
        typeof artifact.ok === "boolean" &&
        typeof artifact.test_strategy === "object" &&
        Array.isArray(artifact.test_cases) &&
        typeof artifact.security_plan === "object" &&
        Array.isArray(artifact.manual_verification_steps) &&
        Array.isArray(artifact.risk_analysis) &&
        typeof artifact.summary === "string" &&
        typeof artifact.description === "string" &&
        typeof artifact.coverage === "object" &&
        typeof artifact.performance_metrics === "object"
    );
}
