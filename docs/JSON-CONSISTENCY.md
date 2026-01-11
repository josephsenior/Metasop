# JSON Consistency and Validation

This document covers JSON output consistency improvements, validation schemas, and best practices.

## Overview

The MetaSOP system uses structured JSON output with comprehensive validation to ensure consistent, high-quality artifacts from all agents.

## Implementation

### 1. Structured JSON Output

All agents now use structured JSON output with JSON Schema Mode:

- **Product Manager:** Uses `generateStructuredWithLLM` with comprehensive schema
- **Architect:** Uses `generateStructuredWithLLM` with full JSON schema
- **Engineer:** Uses `generateStructuredWithLLM` with implementation plan and file structure schema
- **QA:** Uses `generateStructuredWithLLM` with test plan and verification schema
- **UI Designer:** Uses `generateStructuredWithLLM` with component hierarchy and design tokens schema
- **Security:** Uses `generateStructuredWithLLM` with security architecture schema
- **DevOps:** Uses `generateStructuredWithLLM` with infrastructure and CI/CD schema

### 2. Zod Validation Schemas

Comprehensive Zod schemas validate all agent artifacts:

#### Product Manager Schema
- Validates user stories (string or object format)
- Validates acceptance criteria (string or object format)
- Enforces minimum array lengths (8-12 stories, 12-18 criteria)
- Validates optional fields (assumptions, out_of_scope, ui_multi_section)

#### Architect Schema
- Validates design document (min 100 characters)
- Validates APIs array (min 1, with path, method, description)
- Validates decisions array (min 1, with decision, reason, tradeoffs)
- Validates database schema (tables, columns, indexes, relationships)
- Validates technology stack, integration points, security considerations

#### Engineer Schema
- Validates artifact_path, tests_added, run_results
- Validates file_structure (recursive FileNode schema)
- Validates implementation_plan (min 50 characters)
- Validates dependencies array
- Validates technical_decisions, environment_variables

#### QA Schema
- Validates ok (boolean)
- Validates tests (object or array format)
- Validates lint, coverage, coverage_delta
- Validates test_results, security_findings, performance_metrics
- Validates report array

**Location:** `lib/metasop/schemas/artifact-validation.ts`

### 3. Post-Processing Validation

The orchestrator validates artifacts after each agent step:

```typescript
// Validation happens automatically after each agent step
const validationResult = this.validateArtifact(stepId, result.artifact);
if (!validationResult.valid) {
  logger.warn(`Artifact validation failed for ${stepId}`, {
    errors: validationResult.errors,
  });
}
```

**Features:**
- Validates artifact content based on step type
- Logs validation warnings but doesn't fail the step (lenient approach)
- Provides detailed error messages with field paths

### 4. JSON Schema Mode Benefits

JSON Schema Mode (strict) provides:

- ✅ **Guaranteed Schema Compliance** - API enforces schema at generation time
- ✅ **Type Safety** - Strings are strings, numbers are numbers
- ✅ **Constraint Enforcement** - minItems, required fields, etc.
- ✅ **Better Quality** - Model is forced to follow the schema
- ✅ **Reduced Post-Processing** - No need to check if fields exist

**Example:**
```typescript
{
  type: "object",
  properties: {
    user_stories: {
      type: "array",
      items: { type: "object" },
      minItems: 8,  // ✅ Enforced by API
      maxItems: 12,
    },
  },
  required: ["user_stories"],  // ✅ Enforced by API
  additionalProperties: false,  // ✅ Prevents extra fields
}
```

## Validation Flow

```
1. Agent generates artifact using structured output
   ↓
2. LLM enforces JSON schema (if JSON Schema Mode supported)
   ↓
3. Orchestrator validates artifact with Zod schema
   ↓
4. Warnings logged if validation fails (but process continues)
   ↓
5. Artifact stored and used regardless of validation result (lenient)
```

## Error Handling

### Lenient Approach

The system uses a lenient validation approach:
- Validation warnings are logged
- Process continues even if validation fails
- Artifacts are used regardless of validation result
- This allows for graceful degradation

### Fallback Strategies

If LLM structured output fails:
1. Try to parse partial JSON
2. Extract valid fields
3. Fill gaps with templates
4. Log errors for debugging

## Usage Examples

### Validating an Artifact

```typescript
import { safeValidateProductManagerArtifact } from "@/lib/metasop/schemas/artifact-validation";

const result = safeValidateProductManagerArtifact(artifact.content);
if (result.success) {
  // Use result.data
} else {
  // Handle result.error.errors
  console.error("Validation errors:", result.error.errors);
}
```

### In Orchestrator

Validation happens automatically after each agent step. Warnings are logged but don't stop the process.

## Quality Metrics

### JSON Consistency
- ✅ 100% of agents now use structured output with JSON schemas
- ✅ 100% of agent artifacts have Zod validation schemas
- ✅ Post-processing validation for all artifacts
- ✅ Consistent artifact structure across runs

### Error Handling
- ✅ Detailed error logging
- ✅ Fallback strategies for invalid responses
- ✅ Lenient validation (warnings, not failures)

## Current Status

### ✅ Working
- All agents use structured JSON output with JSON schemas:
  - Product Manager
  - Architect
  - Engineer
  - QA
  - UI Designer
  - Security
  - DevOps
- All artifacts validated with Zod schemas
- Post-processing validation in orchestrator
- OpenAI Structured Outputs support for GPT-4o, GPT-4o-mini, GPT-4-turbo, GPT-5, and o1 models

### ⚠️ Planned
- Make validation stricter (optional: fail steps on validation errors)
- Add validation metrics/statistics

## Best Practices

1. **Always Use Structured Output:** Use `generateStructuredWithLLM` for LLM calls
2. **Define Comprehensive Schemas:** Include all required fields and constraints
3. **Validate Post-Processing:** Use Zod schemas to validate artifacts
4. **Log Validation Errors:** Helpful for debugging and improvement
5. **Handle Failures Gracefully:** Use fallback strategies when validation fails

## Related Files

- `lib/metasop/agents/product-manager.ts` - Product Manager with structured output
- `lib/metasop/agents/architect.ts` - Architect with structured output
- `lib/metasop/agents/engineer.ts` - Engineer with structured output
- `lib/metasop/agents/qa.ts` - QA with structured output
- `lib/metasop/agents/ui-designer.ts` - UI Designer with structured output
- `lib/metasop/agents/security.ts` - Security with structured output
- `lib/metasop/agents/devops.ts` - DevOps with structured output
- `lib/metasop/schemas/artifact-validation.ts` - Zod validation schemas
- `lib/metasop/orchestrator.ts` - Post-processing validation
- `lib/metasop/types-backend-schema.ts` - TypeScript types for artifacts

## Related Documentation

- [LLM-SETUP.md](./LLM-SETUP.md) - LLM provider setup
- [PRODUCTION-QUALITY-GUIDE.md](./PRODUCTION-QUALITY-GUIDE.md) - Quality improvement strategies

