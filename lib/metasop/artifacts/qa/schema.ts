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
            items: {
                type: "object",
                required: ["name", "priority", "type"],
                properties: {
                    id: { type: "string", maxLength: 15, description: "Test case ID (e.g., TC-001)." },
                    name: { type: "string", maxLength: 80, description: "Descriptive test case name." },
                    description: { type: "string", maxLength: 250, description: "What is verified and why it's important." },
                    priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
                    type: { type: "string", enum: ["unit", "integration", "e2e", "performance", "security", "accessibility"] },
                    preconditions: { type: "array", items: { type: "string", maxLength: 100 }, description: "Required setup before test." },
                    gherkin: { 
                        type: "object",
                        properties: {
                            given: { type: "string", maxLength: 200 },
                            when: { type: "string", maxLength: 200 },
                            then: { type: "string", maxLength: 200 }
                        },
                        description: "BDD format: Given/When/Then steps."
                    },
                    expected_result: { type: "string", maxLength: 200, description: "Clear success criteria." },
                    user_story_ref: { type: "string", maxLength: 10, description: "Reference to user story (e.g., US-1)." }
                }
            },
            description: "Critical business flow test cases. Cover happy paths, error cases, and edge cases proportional to complexity."
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
        summary: { type: "string", maxLength: 250, description: "A technical, 1-2 sentence summary of the QA strategy and verification approach." },
        description: { type: "string", maxLength: 600, description: "Detailed verification philosophy, test plan overview, and quality objectives." },
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
