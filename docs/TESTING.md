# Testing Guide

This document covers how to run and write tests for Blueprinta.

---

## Quick Commands

```bash
pnpm test              # Run all unit tests
pnpm test:watch        # Watch mode (re-runs on file changes)
pnpm test:coverage     # Generate coverage report
pnpm test:ui           # Open Vitest visual UI
```

---

## Test Structure

```
tests/
├── unit/                          # Unit tests (run by default)
│   ├── orchestrator.test.ts
│   ├── execution-service.test.ts
│   └── ...
└── integration/                   # Integration tests (manual)
    ├── verify_full_pipeline.ts
    └── test_cascading_refinement.ts

lib/metasop/**/__tests__/          # Co-located unit tests
```

- **Unit tests** run automatically with `pnpm test`
- **Integration tests** are excluded from the default run and require a running dev server

---

## Unit Tests

Unit tests use [Vitest](https://vitest.dev/) and cover the Blueprinta pipeline: orchestrator, agents, services, adapters, and utilities.

### Running

```bash
# All unit tests
pnpm test

# Specific file
pnpm test orchestrator.test.ts

# With coverage report (HTML + LCOV + text → ./coverage/)
pnpm test:coverage
```

### Writing Tests

Follow the **Arrange → Act → Assert** pattern:

```typescript
import { describe, it, expect } from 'vitest';

describe('ExecutionService', () => {
  describe('executeStep', () => {
    it('should return success when agent completes', async () => {
      // Arrange
      const agent = createMockAgent();
      const context = createMockContext();

      // Act
      const result = await service.executeStep(agent, context);

      // Assert
      expect(result.success).toBe(true);
      expect(result.artifact).toBeDefined();
    });
  });
});
```

### Deterministic Runs (CI)

Use the mock LLM provider for fast, deterministic results without API calls:

```bash
METASOP_LLM_PROVIDER=mock pnpm test
```

---

## Integration Tests

Integration tests exercise the full orchestration flow against a running server. They are **not** part of `pnpm test` and must be run manually.

### Prerequisites

- A running dev server (`pnpm dev`)
- A valid LLM API key (unless using `METASOP_LLM_PROVIDER=mock`)

### Running

```bash
# Terminal 1: Start the server
pnpm dev

# Terminal 2: Run integration tests
npx tsx tests/integration/verify_full_pipeline.ts
npx tsx tests/integration/test_cascading_refinement.ts

# With a specific model
METASOP_LLM_MODEL=gemini-3-pro-preview npx tsx tests/integration/verify_full_pipeline.ts
```

### What They Verify

- **Full pipeline**: All 7 agents execute in sequence and produce valid artifacts
- **SSE streaming**: `GET /api/diagrams/generate/stream?jobId=...` emits `step_*` events and ends with `orchestration_complete` or `orchestration_failed`
- **Artifact validation**: `metasop_artifacts` are present in final diagram metadata
- **Cascading refinement**: Edit ops propagate correctly through the artifact tree

---

## Code Quality

```bash
pnpm type-check        # TypeScript strict type checking
pnpm lint              # ESLint
pnpm lint:fix          # Auto-fix lint issues
```

---

## Coverage

Coverage thresholds are defined in `vitest.config.ts`. Reports are generated in `./coverage/` as HTML, LCOV, and text.

Coverage focuses on:

- `lib/metasop/**` — Core orchestration logic
- `components/**` — React components
- `app/api/**` — API routes

---

## Troubleshooting

### `spawn EPERM` in Cursor terminal (Windows)

Cursor's sandbox blocks child processes that Vitest uses. See [Troubleshooting → Tests: spawn EPERM](TROUBLESHOOTING.md#tests-spawn-eperm-in-cursor-terminal) for fixes.
