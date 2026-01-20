/**
 * Shared Technical Standards and Few-Shot Examples for All Agents
 * 
 * This module provides:
 * 1. Technical standards that ensure consistency across all artifacts
 * 2. High-quality few-shot examples to guide LLM output
 * 3. Domain-specific context for different project types
 */

// =============================================================================
// SHARED TECHNICAL STANDARDS
// =============================================================================

export const TECHNICAL_STANDARDS = {
  naming: `
NAMING CONVENTIONS:
- Database tables: snake_case (e.g., user_profiles, order_items)
- API endpoints: kebab-case paths (e.g., /api/user-profiles)
- JSON fields: camelCase (e.g., userId, createdAt)
- Environment variables: SCREAMING_SNAKE_CASE (e.g., DATABASE_URL)
- TypeScript interfaces: PascalCase (e.g., UserProfile)
- Constants: SCREAMING_SNAKE_CASE (e.g., MAX_RETRY_COUNT)`,

  api: `
API DESIGN STANDARDS:
- Use RESTful conventions: GET (read), POST (create), PUT (replace), PATCH (update), DELETE (remove)
- HTTP Status Codes: 200 (OK), 201 (Created), 204 (No Content), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 409 (Conflict), 422 (Unprocessable Entity), 500 (Server Error)
- Error Response Format: { "error": { "code": "VALIDATION_ERROR", "message": "Human readable message", "details": [...] } }
- Pagination: Use cursor-based pagination with ?cursor=&limit= for large datasets
- Versioning: URL path versioning (/api/v1/) for breaking changes
- Rate Limiting: Include X-RateLimit-* headers in responses`,

  database: `
DATABASE DESIGN STANDARDS:
- Every table must have: id (UUID/ULID), created_at, updated_at
- Use soft deletes (deleted_at) for recoverable data
- Foreign keys must have ON DELETE CASCADE or ON DELETE SET NULL explicitly defined
- Index strategy: Primary key auto-indexed, add indexes for frequently queried columns and foreign keys
- Use database-level constraints (NOT NULL, UNIQUE, CHECK) over application-level validation where possible`,

  security: `
SECURITY STANDARDS:
- Authentication: JWT with short-lived access tokens (15min) and refresh tokens (7 days)
- Password hashing: bcrypt with cost factor 12 or Argon2id
- Input validation: Validate and sanitize all user input at API boundary
- CORS: Explicitly whitelist allowed origins, never use wildcard in production
- Secrets: Never log secrets, use environment variables or secret managers
- HTTPS: Required for all production traffic, HSTS headers enabled`,

  errorHandling: `
ERROR HANDLING STANDARDS:
- Use structured error types with error codes for programmatic handling
- Log errors with context (request ID, user ID, timestamp, stack trace)
- Never expose internal error details to clients in production
- Implement circuit breakers for external service calls
- Use exponential backoff with jitter for retries`,
};

// =============================================================================
// FEW-SHOT EXAMPLES BY ARTIFACT TYPE
// =============================================================================

export const FEW_SHOT_EXAMPLES = {
  userStory: `
EXAMPLE USER STORY:
{
  "id": "US-1",
  "title": "User Registration",
  "story": "As a new visitor, I want to create an account with my email and password, so that I can access personalized features and save my preferences.",
  "description": "Implement secure user registration with email verification, password strength validation, and duplicate email detection.",
  "priority": "critical",
  "story_points": 5,
  "acceptance_criteria": [
    "User can register with valid email format and password (min 8 chars, 1 uppercase, 1 number)",
    "System sends verification email within 30 seconds of registration",
    "Duplicate email addresses are rejected with clear error message",
    "Password is hashed before storage, never stored in plaintext",
    "User cannot access protected routes until email is verified"
  ],
  "estimated_complexity": "medium",
  "user_value": "Enables personalized experience and data persistence across sessions"
}`,

  adr: `
EXAMPLE ARCHITECTURAL DECISION RECORD:
{
  "decision": "Use PostgreSQL as primary database over MongoDB",
  "status": "accepted",
  "reason": "Strong ACID compliance essential for financial transaction integrity, mature ecosystem with excellent TypeScript/Prisma support, and superior query performance for relational data with complex joins.",
  "rationale": "Financial data requires transactional guarantees that only ACID-compliant databases provide reliably.",
  "tradeoffs": "Less flexible schema evolution requires migrations; horizontal scaling more complex than document stores",
  "consequences": "Need to implement proper migration strategy; may need read replicas for high-read workloads",
  "alternatives": ["MongoDB (rejected: eventual consistency unsuitable for financial data)", "CockroachDB (considered: overkill for current scale)", "MySQL (rejected: weaker JSON support)"]
}`,

  api: `
EXAMPLE API ENDPOINT:
{
  "path": "/api/v1/users",
  "method": "POST",
  "description": "Create a new user account with email verification",
  "request_schema": {
    "email": "string (required, valid email format)",
    "password": "string (required, min 8 chars)",
    "name": "string (optional, max 100 chars)"
  },
  "response_schema": {
    "id": "string (UUID)",
    "email": "string",
    "name": "string | null",
    "createdAt": "string (ISO 8601)",
    "emailVerified": "boolean"
  },
  "auth_required": false,
  "rate_limit": "10 req/min per IP"
}`,

  threatModel: `
EXAMPLE STRIDE THREAT:
{
  "threat": "SQL Injection via user input",
  "category": "Tampering",
  "severity": "critical",
  "likelihood": "medium",
  "impact": "Full database compromise, data exfiltration, privilege escalation",
  "description": "Attackers may inject malicious SQL through unvalidated form inputs to manipulate database queries.",
  "mitigation": "Use parameterized queries exclusively via ORM (Prisma); implement input validation with Zod schemas; apply principle of least privilege to database users",
  "affected_components": ["API Layer", "Database", "Authentication Service"],
  "owasp_ref": "A03:2021 - Injection",
  "cwe_ref": "CWE-89"
}`,

  testCase: `
EXAMPLE BDD TEST CASE:
{
  "id": "TC-001",
  "title": "Successful user registration with valid credentials",
  "type": "integration",
  "priority": "critical",
  "preconditions": ["Database is accessible", "Email service is configured"],
  "gherkin": {
    "given": "a new user with email 'test@example.com' and valid password 'SecurePass123'",
    "when": "the user submits the registration form",
    "then": "the system creates a new user record AND sends a verification email AND returns 201 with user data (excluding password)"
  },
  "expected_result": "User created, verification email sent, 201 response",
  "test_data": { "email": "test@example.com", "password": "SecurePass123" }
}`,

  component: `
EXAMPLE COMPONENT SPEC:
{
  "name": "Button",
  "category": "atom",
  "description": "Primary interactive element for user actions",
  "props": [
    { "name": "variant", "type": "'primary' | 'secondary' | 'ghost' | 'destructive'", "default": "primary", "description": "Visual style variant" },
    { "name": "size", "type": "'sm' | 'md' | 'lg'", "default": "md", "description": "Button size" },
    { "name": "disabled", "type": "boolean", "default": "false", "description": "Disables interaction" },
    { "name": "loading", "type": "boolean", "default": "false", "description": "Shows loading spinner" },
    { "name": "onClick", "type": "() => void", "required": true, "description": "Click handler" }
  ],
  "states": ["default", "hover", "active", "focus", "disabled", "loading"],
  "accessibility": {
    "role": "button",
    "aria_label": "Required if no visible text",
    "keyboard": "Enter/Space to activate, Tab to focus"
  }
}`,

  cicdPipeline: `
EXAMPLE CI/CD STAGE:
{
  "name": "build-and-test",
  "trigger": "push to main or pull_request",
  "steps": [
    { "name": "checkout", "action": "actions/checkout@v4" },
    { "name": "setup-node", "action": "actions/setup-node@v4", "with": { "node-version": "20", "cache": "pnpm" } },
    { "name": "install", "run": "pnpm install --frozen-lockfile" },
    { "name": "lint", "run": "pnpm lint" },
    { "name": "typecheck", "run": "pnpm typecheck" },
    { "name": "test", "run": "pnpm test:ci", "env": { "CI": "true" } },
    { "name": "build", "run": "pnpm build" }
  ],
  "artifacts": ["coverage/", "dist/"],
  "timeout": "15 minutes"
}`,
};

// =============================================================================
// DOMAIN-SPECIFIC CONTEXT
// =============================================================================

export const DOMAIN_CONTEXTS = {
  fintech: `
FINTECH-SPECIFIC REQUIREMENTS:
- Compliance: PCI-DSS for payment data, SOX for financial reporting
- Data handling: Encrypt all PII at rest and in transit
- Audit logging: Log all financial transactions with immutable audit trail
- Error handling: Never expose financial details in error messages
- Testing: Require comprehensive testing for all money-handling code paths`,

  healthcare: `
HEALTHCARE-SPECIFIC REQUIREMENTS:
- Compliance: HIPAA for PHI, HITECH for electronic records
- Data handling: Minimum necessary principle - only access required data
- Audit logging: Log all PHI access with user, timestamp, and purpose
- Encryption: AES-256 for PHI at rest, TLS 1.3 for transit
- Access control: Role-based with regular access reviews`,

  ecommerce: `
ECOMMERCE-SPECIFIC REQUIREMENTS:
- Performance: Page load < 3s, checkout flow optimized
- Scalability: Handle traffic spikes (Black Friday, flash sales)
- Payment: PCI-DSS compliance, tokenize payment methods
- Inventory: Real-time stock management, prevent overselling
- SEO: Server-side rendering for product pages, structured data`,

  saas: `
SAAS-SPECIFIC REQUIREMENTS:
- Multi-tenancy: Data isolation between tenants
- Billing: Usage tracking, subscription management, invoicing
- Onboarding: Self-service signup, trial periods
- Feature flags: Gradual rollout, A/B testing capability
- Analytics: Product usage metrics, customer health scoring`,
};

// =============================================================================
// QUALITY CRITERIA FOR SELF-EVALUATION
// =============================================================================

export const QUALITY_CRITERIA = {
  pm: [
    "User stories follow INVEST principles",
    "Acceptance criteria are testable and specific",
    "Dependencies between stories are clearly mapped",
    "Out-of-scope items prevent scope creep",
    "SWOT analysis is realistic and actionable",
  ],
  architect: [
    "ADRs include alternatives considered and tradeoffs",
    "API design follows REST conventions with proper status codes",
    "Database schema is normalized with proper relationships",
    "Technology choices are justified with rationale",
    "Scalability approach addresses realistic growth scenarios",
  ],
  security: [
    "Threat model covers all STRIDE categories",
    "Mitigations are specific and implementable",
    "Encryption strategy covers data at rest and in transit",
    "Compliance requirements are mapped to controls",
    "Authentication flow handles edge cases (token refresh, session timeout)",
  ],
  devops: [
    "CI/CD pipeline includes all quality gates",
    "Environment strategy covers dev/staging/prod",
    "Monitoring includes business metrics, not just infrastructure",
    "Disaster recovery has defined RTO/RPO targets",
    "IaC is version-controlled and reproducible",
  ],
  engineer: [
    "File structure follows framework conventions",
    "Environment variables are documented with examples",
    "Technical decisions have clear rationale",
    "Implementation phases are ordered by dependency",
    "Commands cover setup, development, testing, and deployment",
  ],
  ui: [
    "Design tokens cover colors, spacing, typography, shadows",
    "Component hierarchy follows atomic design principles",
    "Accessibility requirements are WCAG 2.1 AA compliant",
    "Responsive breakpoints cover mobile, tablet, desktop",
    "Component specs include props, states, and variants",
  ],
  qa: [
    "Test strategy covers unit, integration, and E2E layers",
    "BDD scenarios map to user stories",
    "Performance benchmarks have specific targets",
    "Risk analysis identifies mitigation strategies",
    "Manual UAT steps are actionable and complete",
  ],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get domain-specific context based on project type
 */
export function getDomainContext(projectDescription: string): string {
  const lower = projectDescription.toLowerCase();
  
  if (lower.includes("payment") || lower.includes("banking") || lower.includes("fintech") || lower.includes("financial")) {
    return DOMAIN_CONTEXTS.fintech;
  }
  if (lower.includes("health") || lower.includes("medical") || lower.includes("patient") || lower.includes("hipaa")) {
    return DOMAIN_CONTEXTS.healthcare;
  }
  if (lower.includes("shop") || lower.includes("store") || lower.includes("cart") || lower.includes("ecommerce") || lower.includes("e-commerce")) {
    return DOMAIN_CONTEXTS.ecommerce;
  }
  if (lower.includes("saas") || lower.includes("subscription") || lower.includes("multi-tenant")) {
    return DOMAIN_CONTEXTS.saas;
  }
  
  return ""; // No specific domain context
}

/**
 * Build quality self-evaluation prompt suffix
 */
export function getQualityCheckPrompt(agentType: keyof typeof QUALITY_CRITERIA): string {
  const criteria = QUALITY_CRITERIA[agentType];
  return `
QUALITY SELF-CHECK (Ensure your output meets these criteria):
${criteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

If any criterion is not met, revise your output before returning.`;
}

/**
 * Get all technical standards as a single string
 */
export function getAllTechnicalStandards(): string {
  return Object.values(TECHNICAL_STANDARDS).join("\n\n");
}
