import { z } from "zod";

const CoverageSchema = z
    .object({
        percentage: z.number().min(0).max(100).optional(),
        threshold: z.number().min(0).max(100).optional(),
        lines: z.number().min(0).max(100).optional(),
        statements: z.number().min(0).max(100).optional(),
        functions: z.number().min(0).max(100).optional(),
        branches: z.number().min(0).max(100).optional(),
    })
    .nullable()
    .optional();

const PerformanceMetricsSchema = z.object({
    api_response_time_p95: z.string().optional(),
    page_load_time: z.string().optional(),
    database_query_time: z.string().optional(),
    first_contentful_paint: z.string().optional(),
    time_to_interactive: z.string().optional(),
    largest_contentful_paint: z.string().optional(),
});

export const QAArtifactSchema = z.object({
    ok: z.boolean(), // REQUIRED
    test_strategy: z.object({
        unit: z.string().min(10, "Unit test strategy must be descriptive"), // REQUIRED
        integration: z.string().min(10, "Integration test strategy must be descriptive"), // REQUIRED
        e2e: z.string().min(10, "E2E test strategy must be descriptive"), // REQUIRED
        approach: z.string().optional(),
        types: z.array(z.string()).optional(),
        tools: z.array(z.string()).optional(),
    }), // REQUIRED
    test_cases: z.array(
        z.object({
            id: z.string().max(10), // REQUIRED
            title: z.string().min(5).max(60), // REQUIRED
            priority: z.enum(["high", "medium", "low"]), // REQUIRED
            expected_result: z.string().min(5).max(100), // REQUIRED
        })
    ).min(1, "At least one test case is required"), // REQUIRED
    security_plan: z.object({
        auth_verification_steps: z.array(z.string()).optional(),
        vulnerability_scan_strategy: z.string().optional(),
    }), // REQUIRED (object must exist, but fields inside are optional)
    manual_verification_steps: z.array(z.string()), // REQUIRED
    risk_analysis: z.array(
        z.object({
            risk: z.string(), // REQUIRED
            impact: z.enum(["high", "medium", "low"]), // REQUIRED
            mitigation: z.string(), // REQUIRED
        })
    ), // REQUIRED
    summary: z.string(), // REQUIRED
    description: z.string(), // REQUIRED
    coverage: CoverageSchema, // REQUIRED (can be null/undefined but field must exist)
    performance_metrics: PerformanceMetricsSchema, // REQUIRED (object must exist, but fields inside are optional)
    accessibility_plan: z.object({
        standard: z.string().max(30).optional(),
        automated_tools: z.array(z.string().max(30)).optional(),
        manual_checks: z.array(z.string().max(100)).optional(),
        screen_readers: z.array(z.string().max(20)).optional(),
    }).optional(),
    manual_uat_plan: z.object({
        scenarios: z.array(z.string().max(150)).optional(),
        acceptance_criteria: z.array(z.string().max(150)).optional(),
        stakeholders: z.array(z.string().max(50)).optional(),
    }).optional(),
});

export function validateQAArtifact(data: unknown) {
    return QAArtifactSchema.parse(data);
}

export function safeValidateQAArtifact(data: unknown) {
    return QAArtifactSchema.safeParse(data);
}
