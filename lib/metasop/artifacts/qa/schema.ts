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
                unit: { type: "string", description: "Methodology for unit testing (e.g. Jest, isolated functionality)." },
                integration: { type: "string", description: "Strategy for testing component interactions and API flows." },
                e2e: { type: "string", description: "Plan for end-to-end critical path verification (e.g. Playwright)." },
                approach: { type: "string", description: "High-level testing methodology/philosophy." },
                types: { type: "array", items: { type: "string" }, description: "Categories of tests included (e.g. Functional, Security, UX)." },
                tools: { type: "array", items: { type: "string" }, description: "Testing frameworks and tools used." }
            },
            description: "High-level quality assurance strategy by testing layer."
        },
        test_cases: {
            type: "array",
            items: {
                type: "object",
                required: ["name", "priority", "type"],
                properties: {
                    name: { type: "string", description: "Concise name of the test case" },
                    description: { type: "string", description: "What this test verifies" },
                    priority: { type: "string", enum: ["critical", "high", "medium", "low"], description: "Business impact" },
                    type: { type: "string", enum: ["unit", "integration", "e2e", "performance", "security"], description: "Test layer" },
                    gherkin: { type: "string", description: "BDD steps: Given/When/Then" },
                    expected_result: { type: "string", description: "Success criteria" }
                }
            },
            description: "Detailed list of planned test cases for critical business flows."
        },
        security_plan: {
            type: "object",
            properties: {
                auth_verification_steps: {
                    type: "array",
                    items: { type: "string" },
                    description: "Steps to verify authentication and authorization mechanisms."
                },
                vulnerability_scan_strategy: {
                    type: "string",
                    description: "Tools and frequency for security scanning (e.g. OWASP ZAP)."
                }
            }
        },
        manual_verification_steps: {
            type: "array",
            items: { type: "string" },
            description: "Checklist for manual UAT or visual inspection."
        },
        risk_analysis: {
            type: "array",
            items: {
                type: "object",
                required: ["risk", "impact", "mitigation"],
                properties: {
                    risk: { type: "string", description: "Potential failure mode or quality risk" },
                    impact: { type: "string", enum: ["high", "medium", "low"] },
                    mitigation: { type: "string", description: "Strategy to prevent or minimize this risk" }
                }
            },
            description: "Analysis of potential quality risks and mitigation strategies."
        },
        summary: {
            type: "string",
            description: "Executive summary of the Quality Assurance Plan."
        },
        description: {
            type: "string",
            description: "Detailed quality assurance strategy and verification steps."
        },
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
                api_response_time_p95: { type: "string" },
                page_load_time: { type: "string" },
                database_query_time: { type: "string" },
                recommendations: { type: "array", items: { type: "string" } },
                first_contentful_paint: { type: "string" },
                time_to_interactive: { type: "string" },
                largest_contentful_paint: { type: "string" }
            }
        }
    }
};
