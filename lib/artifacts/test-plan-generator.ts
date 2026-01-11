import type { Diagram } from "@/types/diagram"

export class TestPlanGenerator {
  private diagram: Diagram
  private artifacts: any

  constructor(diagram: Diagram) {
    this.diagram = diagram
    this.artifacts = diagram.metadata?.metasop_artifacts || {}
  }

  /**
   * Generate comprehensive test plan
   */
  generateTestPlan(): string {
    const qaArtifact = this.artifacts.qa_verification?.content || {}
    const pmSpec = this.artifacts.pm_spec?.content || {}
    const archContent = this.artifacts.arch_design?.content || {}
    const nodes = this.diagram.nodes || []

    let markdown = `# Test Plan\n\n`
    markdown += `**Project:** ${this.diagram.title}\n\n`
    markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`
    markdown += `**Version:** 1.0\n\n`
    markdown += `---\n\n`

    // Overview
    markdown += `## 1. Overview\n\n`
    markdown += `### 1.1 Purpose\n\n`
    markdown += `This test plan outlines the testing strategy for ${this.diagram.title}. It covers unit testing, integration testing, end-to-end testing, and performance testing.\n\n`
    markdown += `### 1.2 Scope\n\n`
    markdown += `Testing will cover:\n`
    markdown += `- All functional requirements\n`
    markdown += `- API endpoints\n`
    markdown += `- User interface components\n`
    markdown += `- Database operations\n`
    markdown += `- Security and authentication\n`
    markdown += `- Performance and scalability\n\n`

    // Test Strategy
    markdown += `## 2. Test Strategy\n\n`
    markdown += `### 2.1 Testing Levels\n\n`
    markdown += `#### Unit Testing\n`
    markdown += `- **Coverage Target:** 80%+\n`
    markdown += `- **Tools:** Jest, Vitest, or similar\n`
    markdown += `- **Scope:** Individual functions, components, and utilities\n\n`
    markdown += `#### Integration Testing\n`
    markdown += `- **Coverage Target:** Critical paths\n`
    markdown += `- **Tools:** Supertest, Playwright, or similar\n`
    markdown += `- **Scope:** API endpoints, database interactions, service integrations\n\n`
    markdown += `#### End-to-End Testing\n`
    markdown += `- **Coverage Target:** User journeys\n`
    markdown += `- **Tools:** Playwright, Cypress, or similar\n`
    markdown += `- **Scope:** Complete user workflows from start to finish\n\n`
    markdown += `#### Performance Testing\n`
    markdown += `- **Tools:** k6, Artillery, or similar\n`
    markdown += `- **Scope:** Load testing, stress testing, and scalability\n\n`

    // Test Cases
    markdown += `## 3. Test Cases\n\n`

    // Unit Test Cases
    markdown += `### 3.1 Unit Test Cases\n\n`
    const componentCount = nodes.filter(n => n.type === "component").length
    const serviceCount = nodes.filter(n => n.type === "service").length

    if (componentCount > 0) {
      markdown += `#### Frontend Components\n\n`
      nodes.filter(n => n.type === "component").forEach((node, idx) => {
        markdown += `**TC-UNIT-${idx + 1}:** Test ${node.label} Component\n`
        markdown += `- **Priority:** High\n`
        markdown += `- **Description:** Verify ${node.label} component renders correctly and handles props\n`
        markdown += `- **Steps:**\n`
        markdown += `  1. Render component with valid props\n`
        markdown += `  2. Verify component displays correctly\n`
        markdown += `  3. Test prop changes trigger re-renders\n`
        markdown += `  4. Test error states\n`
        markdown += `- **Expected Result:** Component renders and behaves as expected\n\n`
      })
    }

    if (serviceCount > 0) {
      markdown += `#### Backend Services\n\n`
      nodes.filter(n => n.type === "service").forEach((node, idx) => {
        markdown += `**TC-UNIT-${idx + 1}:** Test ${node.label} Service\n`
        markdown += `- **Priority:** High\n`
        markdown += `- **Description:** Verify ${node.label} service functions correctly\n`
        markdown += `- **Steps:**\n`
        markdown += `  1. Test service initialization\n`
        markdown += `  2. Test core business logic\n`
        markdown += `  3. Test error handling\n`
        markdown += `  4. Test edge cases\n`
        markdown += `- **Expected Result:** Service functions correctly in all scenarios\n\n`
      })
    }

    // Integration Test Cases
    markdown += `### 3.2 Integration Test Cases\n\n`

    if (archContent.apis) {
      const apis = Array.isArray(archContent.apis) ? archContent.apis : []
      markdown += `#### API Endpoints\n\n`
      apis.forEach((api: any, idx: number) => {
        const method = api.method || "GET"
        const path = api.path || api.endpoint || "/api/endpoint"
        markdown += `**TC-INT-${idx + 1}:** Test ${method} ${path}\n`
        markdown += `- **Priority:** High\n`
        markdown += `- **Description:** Verify ${method} ${path} endpoint works correctly\n`
        markdown += `- **Prerequisites:** Database seeded, authentication configured\n`
        markdown += `- **Steps:**\n`
        if (api.auth_required) {
          markdown += `  1. Test without authentication (should fail)\n`
          markdown += `  2. Test with valid authentication token\n`
        }
        if (method === "GET") {
          markdown += `  ${api.auth_required ? "3" : "1"}. Send GET request\n`
          markdown += `  ${api.auth_required ? "4" : "2"}. Verify response status 200\n`
          markdown += `  ${api.auth_required ? "5" : "3"}. Verify response structure\n`
        } else if (method === "POST" || method === "PUT") {
          markdown += `  ${api.auth_required ? "3" : "1"}. Send ${method} request with valid payload\n`
          markdown += `  ${api.auth_required ? "4" : "2"}. Verify response status 201/200\n`
          markdown += `  ${api.auth_required ? "5" : "3"}. Verify data persisted correctly\n`
          markdown += `  ${api.auth_required ? "6" : "4"}. Test with invalid payload (should fail)\n`
        }
        markdown += `- **Expected Result:** API endpoint responds correctly\n\n`
      })
    }

    // Database Integration Tests
    if (archContent.database_schema) {
      markdown += `#### Database Operations\n\n`
      const schema = archContent.database_schema
      if (schema.tables) {
        const tables = Array.isArray(schema.tables) ? schema.tables : []
        tables.forEach((table: any, idx: number) => {
          const tableName = table.table_name || table.name || "Table"
          markdown += `**TC-INT-DB-${idx + 1}:** Test ${tableName} Operations\n`
          markdown += `- **Priority:** High\n`
          markdown += `- **Description:** Verify CRUD operations for ${tableName} table\n`
          markdown += `- **Steps:**\n`
          markdown += `  1. Test CREATE operation\n`
          markdown += `  2. Test READ operation\n`
          markdown += `  3. Test UPDATE operation\n`
          markdown += `  4. Test DELETE operation\n`
          markdown += `  5. Test constraints and validations\n`
          markdown += `- **Expected Result:** All database operations work correctly\n\n`
        })
      }
    }

    // E2E Test Cases
    markdown += `### 3.3 End-to-End Test Cases\n\n`
    if (pmSpec.user_stories) {
      const stories = Array.isArray(pmSpec.user_stories) ? pmSpec.user_stories : []
      stories.slice(0, 5).forEach((story: any, idx: number) => {
        const title = typeof story === "string" ? story : story.title || story.story || `Story ${idx + 1}`
        markdown += `**TC-E2E-${idx + 1}:** ${title}\n`
        markdown += `- **Priority:** High\n`
        markdown += `- **Description:** Test complete user journey for ${title}\n`
        markdown += `- **Steps:**\n`
        markdown += `  1. Navigate to application\n`
        markdown += `  2. Perform user actions\n`
        markdown += `  3. Verify expected outcomes\n`
        markdown += `  4. Verify data persistence\n`
        markdown += `- **Expected Result:** User can complete the workflow successfully\n\n`
      })
    }

    // Performance Test Cases
    markdown += `### 3.4 Performance Test Cases\n\n`
    markdown += `**TC-PERF-1:** Load Testing\n`
    markdown += `- **Priority:** Medium\n`
    markdown += `- **Description:** Test application under normal load\n`
    markdown += `- **Load:** 100 concurrent users\n`
    markdown += `- **Duration:** 5 minutes\n`
    markdown += `- **Expected Result:** Response time < 500ms, error rate < 1%\n\n`
    markdown += `**TC-PERF-2:** Stress Testing\n`
    markdown += `- **Priority:** Medium\n`
    markdown += `- **Description:** Test application under peak load\n`
    markdown += `- **Load:** 500 concurrent users\n`
    markdown += `- **Duration:** 10 minutes\n`
    markdown += `- **Expected Result:** Application remains stable, graceful degradation\n\n`

    // Security Test Cases
    markdown += `### 3.5 Security Test Cases\n\n`
    markdown += `**TC-SEC-1:** Authentication Testing\n`
    markdown += `- **Priority:** Critical\n`
    markdown += `- **Description:** Verify authentication mechanisms\n`
    markdown += `- **Steps:**\n`
    markdown += `  1. Test login with valid credentials\n`
    markdown += `  2. Test login with invalid credentials\n`
    markdown += `  3. Test token expiration\n`
    markdown += `  4. Test password reset flow\n`
    markdown += `- **Expected Result:** Authentication works securely\n\n`
    markdown += `**TC-SEC-2:** Authorization Testing\n`
    markdown += `- **Priority:** Critical\n`
    markdown += `- **Description:** Verify authorization checks\n`
    markdown += `- **Steps:**\n`
    markdown += `  1. Test access to protected resources\n`
    markdown += `  2. Test role-based access control\n`
    markdown += `  3. Test unauthorized access attempts\n`
    markdown += `- **Expected Result:** Authorization enforced correctly\n\n`
    markdown += `**TC-SEC-3:** Input Validation Testing\n`
    markdown += `- **Priority:** High\n`
    markdown += `- **Description:** Verify input validation and sanitization\n`
    markdown += `- **Steps:**\n`
    markdown += `  1. Test SQL injection attempts\n`
    markdown += `  2. Test XSS attempts\n`
    markdown += `  3. Test CSRF protection\n`
    markdown += `  4. Test input length limits\n`
    markdown += `- **Expected Result:** All malicious inputs are rejected\n\n`

    // Test Environment
    markdown += `## 4. Test Environment\n\n`
    markdown += `### 4.1 Test Data\n`
    markdown += `- Use seed data for consistent testing\n`
    markdown += `- Create test fixtures for each test suite\n`
    markdown += `- Clean up test data after each test run\n\n`
    markdown += `### 4.2 Test Tools\n`
    markdown += `- **Unit Testing:** Jest/Vitest\n`
    markdown += `- **Integration Testing:** Supertest\n`
    markdown += `- **E2E Testing:** Playwright/Cypress\n`
    markdown += `- **Performance Testing:** k6/Artillery\n`
    markdown += `- **Coverage:** Istanbul/NYC\n\n`

    // Test Schedule
    markdown += `## 5. Test Schedule\n\n`
    markdown += `### 5.1 Phases\n`
    markdown += `1. **Unit Testing:** Week 1-2\n`
    markdown += `2. **Integration Testing:** Week 2-3\n`
    markdown += `3. **E2E Testing:** Week 3-4\n`
    markdown += `4. **Performance Testing:** Week 4\n`
    markdown += `5. **Security Testing:** Week 4-5\n`
    markdown += `6. **Regression Testing:** Ongoing\n\n`

    // Coverage Requirements
    if (qaArtifact.coverage) {
      markdown += `## 6. Coverage Requirements\n\n`
      const coverage = qaArtifact.coverage
      markdown += `- **Overall Coverage:** ${coverage.percentage || 80}%\n`
      if (coverage.lines) markdown += `- **Line Coverage:** ${coverage.lines}%\n`
      if (coverage.functions) markdown += `- **Function Coverage:** ${coverage.functions}%\n`
      if (coverage.branches) markdown += `- **Branch Coverage:** ${coverage.branches}%\n`
      markdown += `\n`
    }

    // Risk Assessment
    markdown += `## 7. Risk Assessment\n\n`
    markdown += `### 7.1 High Risk Areas\n`
    markdown += `- Authentication and authorization\n`
    markdown += `- Payment processing (if applicable)\n`
    markdown += `- Data persistence and integrity\n`
    markdown += `- API security\n\n`
    markdown += `### 7.2 Mitigation Strategies\n`
    markdown += `- Comprehensive security testing\n`
    markdown += `- Code reviews for critical paths\n`
    markdown += `- Automated testing in CI/CD pipeline\n`
    markdown += `- Regular security audits\n\n`

    // Sign-off
    markdown += `## 8. Sign-off\n\n`
    markdown += `This test plan should be reviewed and approved by:\n`
    markdown += `- [ ] Product Manager\n`
    markdown += `- [ ] Lead Developer\n`
    markdown += `- [ ] QA Lead\n`
    markdown += `- [ ] Security Team\n\n`

    return markdown
  }
}

