export const qaSchema = {
    type: "object",
    required: ["ok", "test_strategy", "test_cases", "security_plan", "manual_verification_steps", "risk_analysis", "summary", "description", "coverage", "performance_metrics"],
    properties: {
        ok: {
            type: "boolean",
            description: "Indicates if the architectural/engineering design is robust enough to proceed with a test plan.",
        },
        test_strategy: {
            type: "object",
            required: ["unit", "integration", "e2e"],
            properties: {
                unit: { type: "string", maxLength: 100, description: "Unit testing approach." },
                integration: { type: "string", maxLength: 100, description: "Integration testing approach." },
                e2e: { type: "string", maxLength: 100, description: "E2E testing approach." },
                approach: { type: "string", maxLength: 150, description: "General QA philosophy." },
                types: { type: "array", items: { type: "string", maxLength: 20 }, description: "Test types." },
                tools: { type: "array", items: { type: "string", maxLength: 20 }, description: "Frameworks/tools." }
            },
            description: "Layered QA strategy."
        },
        test_cases: {
            type: "array",
            items: {
                type: "object",
                required: ["name", "priority", "type"],
                properties: {
                    name: { type: "string", maxLength: 50, description: "Test case name." },
                    description: { type: "string", maxLength: 150, description: "What is verified." },
                    priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
                    type: { type: "string", enum: ["unit", "integration", "e2e", "performance", "security"] },
                    gherkin: { type: "string", maxLength: 300, description: "Given/When/Then steps." },
                    expected_result: { type: "string", maxLength: 100, description: "Success criteria." }
                }
            },
            description: "Critical business flow test cases."
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
                    risk: { type: "string", maxLength: 50, description: "Failure mode." },
                    impact: { type: "string", enum: ["high", "medium", "low"] },
                    mitigation: { type: "string", maxLength: 150, description: "Mitigation strategy." }
                }
            },
            description: "Quality risks and mitigations."
        },
        summary: { type: "string", maxLength: 150, description: "A technical, 1-sentence summary of the QA strategy." },
        description: { type: "string", maxLength: 300, description: "Detailed verification philosophy and test plan. Max 3 sentences." },
        coverage: {
            type: "object",
            properties: {
                percentage: { type: "number" },
                threshold: { type: "number", description: "Target code coverage percentage (e.g. 80)" },
                lines: { type: "number" },
                statements: { type: "number" },
                functions: { type: "number" },
                branches: { type: "number" }
            }
        },
        performance_metrics: {
            type: "object",
            properties: {
                api_response_time_p95: { type: "string", maxLength: 15 },
                page_load_time: { type: "string", maxLength: 15 },
                database_query_time: { type: "string", maxLength: 15 },
                first_contentful_paint: { type: "string", maxLength: 15 },
                time_to_interactive: { type: "string", maxLength: 15 },
                largest_contentful_paint: { type: "string", maxLength: 15 }
            }
        },
        accessibility_plan: { type: "string", maxLength: 150, description: "Verification plan for accessibility compliance (WCAG)." },
        manual_uat_plan: { type: "string", maxLength: 150, description: "Manual user acceptance testing plan." }
    }
};
