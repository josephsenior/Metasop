import type { AgentContext, MetaSOPArtifact, MetaSOPEvent } from "../types";
import type { QABackendArtifact } from "../artifacts/qa/types";
import type { ArchitectBackendArtifact } from "../artifacts/architect/types";
import { qaSchema } from "../artifacts/qa/schema";
import { generateStreamingStructuredWithLLM } from "../utils/llm-helper";
import { logger } from "../utils/logger";
import { FEW_SHOT_EXAMPLES, getDomainContext, getQualityCheckPrompt } from "../utils/prompt-standards";
import { getAgentTemperature } from "../config";

/**
 * QA Agent
 * Generates test plans and verification criteria
 */
export async function qaAgent(
  context: AgentContext,
  onProgress?: (event: Partial<MetaSOPEvent>) => void
): Promise<MetaSOPArtifact> {
  const { user_request, previous_artifacts } = context;
  const pmSpec = previous_artifacts.pm_spec;
  const archDesign = previous_artifacts.arch_design;
  const engineerImpl = previous_artifacts.engineer_impl;

  logger.info("QA agent starting", { user_request: user_request.substring(0, 100) });

  try {
    let content: QABackendArtifact;

    const pmArtifact = pmSpec?.content as any;
      const archArtifact = archDesign?.content as ArchitectBackendArtifact | undefined;
      const engineerArtifact = engineerImpl?.content as any;
      const securityArtifact = context.previous_artifacts?.security_architecture?.content as any;
      const uiArtifact = context.previous_artifacts?.ui_design?.content as any;
      const projectTitle = pmArtifact?.summary?.substring(0, 50) || "Project";
      const techStackString = archArtifact?.technology_stack ? Object.values(archArtifact.technology_stack).flat().join(", ") : "Modern Stack";

      const domainContext = getDomainContext(user_request);
      const qualityCheck = getQualityCheckPrompt("qa");

      const qaPrompt = `You are a Lead QA Engineer and ISTQB-certified Test Architect with 10+ years of experience in test automation, quality strategy, and continuous testing. Design a comprehensive verification strategy for:

"${projectTitle}"

=== OUTPUT RULES ===
- Give each test case a unique ID (max 10 chars, e.g. TC-1, TC-2, TC-01) and a unique name. One scenario per test; no duplicate IDs or names.
- Cover auth, CRUD, validation, error handling, security, and performance where relevant. Stop after scope is covered.
- Response: Output only the JSON object matching the schema. No markdown, no explanations.

${pmArtifact ? `
Project Context:
- Summary: ${pmArtifact.summary}
- User Stories: ${pmArtifact.user_stories?.length || 0} stories defined
- Key Stories: ${pmArtifact.user_stories?.slice(0, 4).map((s: any) => s.title).join(", ") || "N/A"}
- Acceptance Criteria: ${pmArtifact.acceptance_criteria?.length || 0} criteria defined` : `User Request: ${user_request}`}
${archArtifact ? `
Architecture Context:
- Tech Stack: ${techStackString}
- APIs: ${archArtifact.apis?.length || 0} endpoints defined
- Database Tables: ${archArtifact.database_schema?.tables?.length || 0} tables` : ""}
${engineerArtifact ? `
Implementation Context:
- Technical Patterns: ${engineerArtifact.technical_patterns?.join(", ") || "N/A"}
- Test Commands: ${engineerArtifact.run_results?.test_commands?.join(", ") || "N/A"}` : ""}
${securityArtifact ? `
Security Context:
- Auth Method: ${securityArtifact.security_architecture?.authentication?.method || "JWT"}
- Threat Count: ${securityArtifact.threat_model?.length || 0} threats identified` : ""}
${uiArtifact ? `
UI Context:
- Components: ${uiArtifact.component_hierarchy?.organisms?.length || 0} organisms
- Accessibility: ${uiArtifact.accessibility?.wcag_level || "AA"} compliance target` : ""}
${domainContext ? `\n${domainContext}\n` : ""}

=== MISSION OBJECTIVES ===

1. **Test Strategy (Testing Pyramid)**
   - **Unit Tests (70%)**
     * Scope: Individual functions, components, utilities
     * Framework: Vitest/Jest for logic, React Testing Library for components
     * Coverage target: 80%+ line coverage, 90%+ for critical paths
     * Mocking strategy: Mock external dependencies, use MSW for API mocking
   
   - **Integration Tests (20%)**
     * Scope: API endpoints, database operations, service interactions
     * Framework: Supertest for APIs, Testcontainers for database
     * Focus: Happy paths, error handling, edge cases
     * Data management: Test fixtures, factory functions
   
   - **E2E Tests (10%)**
     * Scope: Critical user journeys, cross-browser testing
     * Framework: Playwright (preferred) or Cypress
     * Focus: Smoke tests, regression tests, user flows
     * Environment: Staging environment with production-like data

2. **Test Cases**
   - Map each user story to test scenarios
   - Include positive, negative, and edge case scenarios
   - Link test cases to acceptance criteria
   - Use clear, descriptive names and detailed descriptions
   
   **COMPLEX FLOWS - Use Test Case Chaining:**
   Instead of cramming multiple steps into one test case, break into chained tests:
   - TC-001: Initiate OAuth flow → depends_on: null
   - TC-002: Complete OAuth approval → depends_on: "TC-001"
   - TC-003: Verify account connected → depends_on: "TC-002"
   
   Put detailed test steps and setup requirements in the 'description' field.

3. **Coverage & Quality Gates**
   - Define coverage thresholds:
     * Statements: 80%
     * Branches: 75%
     * Functions: 85%
     * Lines: 80%
   - CI/CD quality gates:
     * All tests pass
     * Coverage thresholds met
     * No critical security vulnerabilities
     * Linting passes
     * Type checking passes

4. **Performance Testing**
   - Define performance benchmarks:
     * API response time: p50 < 100ms, p95 < 500ms, p99 < 1s
     * Page load time: LCP < 2.5s, FID < 100ms, CLS < 0.1
     * Throughput: Target requests/second under load
   - Load testing strategy (k6, Artillery, Locust)
   - Stress testing for breaking points
   - Soak testing for memory leaks

5. **Security Testing Plan**
   - Authentication testing: Valid/invalid credentials, token expiration, session handling
   - Authorization testing: Role-based access, privilege escalation attempts
   - Input validation: SQL injection, XSS, CSRF
   - API security: Rate limiting, authentication bypass, parameter tampering
   - Dependency scanning: Known vulnerabilities in dependencies

6. **Risk Analysis & Mitigation**
   - Identify high-risk areas based on:
     * Business impact
     * Technical complexity
     * Change frequency
     * Integration points
   - Define mitigation strategies for each risk
   - Prioritize testing effort by risk level

7. **Accessibility Testing (WCAG 2.1 AA)**
   - Automated testing: axe-core, Lighthouse accessibility audit
   - Manual testing checklist:
     * Keyboard navigation
     * Screen reader compatibility
     * Color contrast
     * Focus management
     * Error identification
   - Testing tools: NVDA, VoiceOver, JAWS

8. **Manual UAT Plan**
   - Define UAT scenarios for business stakeholders
   - Create step-by-step test scripts
   - Define acceptance criteria for sign-off
   - Schedule and environment requirements

9. **Test Data Management**
   - Define test data strategy:
     * Factory functions for generating test data
     * Fixtures for static test data
     * Database seeding scripts
   - Data privacy considerations for non-production environments

10. **Continuous Testing Integration**
    - Pre-commit: Linting, type checking, unit tests
    - PR/MR: Full test suite, coverage check
    - Main branch: E2E tests, security scans
    - Nightly: Performance tests, full regression

=== EXAMPLE BDD TEST CASE (Follow this format) ===
${FEW_SHOT_EXAMPLES.testCase}

=== TESTING FRAMEWORK RECOMMENDATIONS ===
- **Unit/Integration**: Vitest (fast, ESM-native) or Jest
- **Component**: React Testing Library (user-centric)
- **E2E**: Playwright (cross-browser, reliable) or Cypress
- **API**: Supertest, Postman/Newman
- **Performance**: k6, Artillery, Lighthouse
- **Security**: OWASP ZAP, Snyk, npm audit
- **Accessibility**: axe-core, Lighthouse, Pa11y

${qualityCheck}

Respond with ONLY the structured JSON object matching the schema. No explanations or markdown.`;

      let llmQA: QABackendArtifact | null = null;

      try {
        llmQA = await generateStreamingStructuredWithLLM<QABackendArtifact>(
          qaPrompt,
          qaSchema,
          (partialEvent) => {
            if (onProgress) {
              onProgress(partialEvent);
            }
          },
          {
            reasoning: context.options?.reasoning ?? false,
            temperature: getAgentTemperature("qa_verification"),
            cacheId: context.cacheId,
            role: "QA",
            model: context.options?.model
          }
        );
      } catch (error: any) {
        logger.error("QA agent LLM call failed", { error: error.message });
        throw error;
      }

      if (!llmQA) {
        throw new Error("QA agent failed: No structured data received from LLM");
      }

      content = {
        ok: llmQA.ok ?? true,
        test_strategy: llmQA.test_strategy,
        test_cases: llmQA.test_cases,
        security_plan: llmQA.security_plan,
        manual_verification_steps: llmQA.manual_verification_steps,
        risk_analysis: llmQA.risk_analysis,
        summary: llmQA.summary,
        description: llmQA.description,
        coverage: llmQA.coverage,
        performance_metrics: llmQA.performance_metrics,
        accessibility_plan: llmQA.accessibility_plan || (llmQA as any).accessibility,
        manual_uat_plan: llmQA.manual_uat_plan,
      };

    logger.info("QA agent completed");

    return {
      step_id: "qa_verification",
      role: "QA",
      content,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error("QA agent failed", { error: error.message });
    throw error;
  }
}
