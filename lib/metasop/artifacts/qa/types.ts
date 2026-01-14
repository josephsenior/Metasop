
// ============================================================================
// QA ARTIFACT TYPES
// ============================================================================


// ============================================================================
// QA ARTIFACT TYPES (PLANNING ONLY)
// ============================================================================

export interface TestCase {
    name: string; // REQUIRED
    description?: string;
    priority: "critical" | "high" | "medium" | "low"; // REQUIRED
    type: "unit" | "integration" | "e2e" | "performance" | "security"; // REQUIRED
    gherkin?: string; // BDD Gherkin-style steps (Given/When/Then)
    expected_result?: string;
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
    security_plan?: {
        auth_verification_steps: string[];
        vulnerability_scan_strategy: string;
    };
    manual_verification_steps?: string[];
    risk_analysis?: Array<{
        risk: string;
        impact: "high" | "medium" | "low";
        mitigation: string;
    }>;
    summary?: string;
    description?: string;
    coverage?: {
        percentage?: number;
        threshold?: number;
        lines?: number;
        statements?: number;
        functions?: number;
        branches?: number;
    } | null;
    security_findings?: Array<{
        severity: "critical" | "high" | "medium" | "low" | "info";
        vulnerability: string;
        description: string;
        affected_endpoints?: string[];
        remediation?: string;
        cve?: string;
    }>;
    performance_metrics?: {
        api_response_time_p95?: string;
        page_load_time?: string;
        database_query_time?: string;
        recommendations?: string[];
        first_contentful_paint?: string;
        time_to_interactive?: string;
        largest_contentful_paint?: string;
    };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isQABackendArtifact(artifact: any): artifact is QABackendArtifact {
    return (
        artifact && typeof artifact.ok === "boolean" && typeof artifact.test_strategy === "object"
    );
}
