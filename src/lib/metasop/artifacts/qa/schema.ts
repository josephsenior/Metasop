export const qaSchema = {
    type: "object",
    required: ["ok", "test_strategy", "test_cases", "security_plan", "manual_verification_steps", "risk_analysis", "summary", "description", "coverage", "performance_metrics", "accessibility_plan"],
    propertyOrdering: ["ok", "summary", "description", "test_strategy", "test_cases", "coverage", "risk_analysis", "security_plan", "manual_verification_steps", "performance_metrics", "accessibility_plan"],
    properties: {
        ok: {
            type: "boolean",
            description: "Indicates if the architectural/engineering design is robust enough to proceed with a test plan.",
        },
        test_strategy: {
            type: "object",
            required: ["unit", "integration", "e2e"],
            properties: {
                unit: { type: "string", maxLength: 300, description: "Unit testing approach with framework, coverage targets, and mocking strategy." },
                integration: { type: "string", maxLength: 300, description: "Integration testing approach with scope, data management, and tools." },
                e2e: { type: "string", maxLength: 300, description: "E2E testing approach with framework, critical paths, and environment strategy." },
                approach: { type: "string", maxLength: 300, description: "General QA philosophy and testing pyramid rationale." },
                types: { type: "array", items: { type: "string", maxLength: 30 }, description: "Test types (unit, integration, e2e, performance, security, accessibility)." },
                tools: { type: "array", items: { type: "string", maxLength: 30 }, description: "Testing frameworks and tools (Vitest, Playwright, etc.)." }
            },
            description: "Layered QA strategy following the testing pyramid."
        },
        test_cases: {
            type: "array",
            description: "Core test cases. Keep it focused and minimal.",
            items: {
                type: "object",
                required: ["id", "title", "expected_result", "type", "priority"],
                properties: {
                    id: { type: "string", maxLength: 10, pattern: "^TC-[0-9]+$", description: "Short ID (e.g., TC-1)." },
                    title: { type: "string", maxLength: 60, description: "Test case title." },
                    description: { type: "string", maxLength: 200, description: "Detailed test scenario." },
                    type: { type: "string", enum: ["unit", "integration", "e2e", "manual"], description: "Test category." },
                    priority: { type: "string", enum: ["high", "medium", "low"], description: "Importance of this test case." },
                    expected_result: { type: "string", maxLength: 100, description: "Success criteria." }
                }
            }
        },
        security_plan: {
            type: "object",
            properties: {
                auth_verification_steps: {
                    type: "array",
                    items: { type: "string", maxLength: 100 },
                    description: "Steps to verify authentication and authorization mechanisms."
                },
                vulnerability_scan_strategy: {
                    type: "string",
                    maxLength: 150,
                    description: "Tools and frequency for security scanning (e.g. OWASP ZAP)."
                }
            }
        },
        manual_verification_steps: {
            type: "array",
            items: { type: "string", maxLength: 100 },
            description: "Checklist for manual UAT or visual inspection."
        },
        risk_analysis: {
            type: "array",
            items: {
                type: "object",
                required: ["risk", "impact", "mitigation"],
                properties: {
                    risk: { type: "string", maxLength: 50, description: "Potential failure mode or quality risk." },
                    impact: { type: "string", enum: ["high", "medium", "low"], description: "Severity of the risk." },
                    mitigation: { type: "string", maxLength: 150, description: "Strategy to prevent or handle the risk." }
                }
            },
            description: "Quality risks and mitigations."
        },
        summary: { type: "string", maxLength: 250, description: "A technical, 1-2 sentence summary of the QA strategy and verification approach." },
        description: { type: "string", maxLength: 600, description: "Detailed verification philosophy, test plan overview, and quality objectives." },
        coverage: {
            type: "object",
            required: ["percentage", "threshold", "lines", "statements", "functions", "branches"],
            properties: {
                percentage: { type: "number", description: "Estimated overall code coverage percentage." },
                threshold: { type: "number", description: "Target code coverage percentage (e.g. 80)." },
                lines: { type: "number", description: "Estimated number of lines covered." },
                statements: { type: "number", description: "Estimated number of statements covered." },
                functions: { type: "number", description: "Estimated number of functions covered." },
                branches: { type: "number", description: "Estimated number of branches covered." }
            },
            description: "Code coverage targets and estimates."
        },
        performance_metrics: {
            required: ["api_response_time_p95", "page_load_time", "database_query_time", "first_contentful_paint", "time_to_interactive", "largest_contentful_paint"],
            type: "object",
            properties: {
                api_response_time_p95: { type: "string", maxLength: 15, description: "Target P95 API latency (e.g. '200ms')." },
                page_load_time: { type: "string", maxLength: 15, description: "Target full page load time (e.g. '2s')." },
                database_query_time: { type: "string", maxLength: 15, description: "Target slow query threshold (e.g. '100ms')." },
                first_contentful_paint: { type: "string", maxLength: 15, description: "Target FCP (e.g. '1.5s')." },
                time_to_interactive: { type: "string", maxLength: 15, description: "Target TTI (e.g. '3.5s')." },
                largest_contentful_paint: { type: "string", maxLength: 15, description: "Target LCP (e.g. '2.5s')." }
            },
            description: "Performance budgets and targets."
        },
        accessibility_plan: {
            type: "object",
            properties: {
                standard: { type: "string", maxLength: 30, description: "WCAG level target (e.g., 'WCAG 2.1 AA')." },
                automated_tools: { type: "array", items: { type: "string", maxLength: 30 }, description: "Automated testing tools (axe-core, Lighthouse)." },
                manual_checks: { type: "array", items: { type: "string", maxLength: 100 }, description: "Manual verification checklist items." },
                screen_readers: { type: "array", items: { type: "string", maxLength: 20 }, description: "Screen readers to test (NVDA, VoiceOver)." }
            },
            description: "Comprehensive accessibility testing plan for WCAG compliance."
        },
        manual_uat_plan: {
            type: "object",
            properties: {
                scenarios: { type: "array", items: { type: "string", maxLength: 150 }, description: "UAT scenarios for stakeholder sign-off." },
                acceptance_criteria: { type: "array", items: { type: "string", maxLength: 150 }, description: "Business acceptance criteria." },
                stakeholders: { type: "array", items: { type: "string", maxLength: 50 }, description: "Stakeholders involved in UAT." }
            },
            description: "Manual user acceptance testing plan with stakeholder scenarios."
        }
    }
};
