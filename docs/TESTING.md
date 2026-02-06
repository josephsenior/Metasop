# Testing Documentation

This document covers unit tests, integration tests, and reliability checks for Blueprinta.

## Quick Commands

```bash
# Run all unit tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

## Test Types and Locations

- **Unit tests**: `tests/unit/` and `lib/metasop/**/__tests__/`
- **Integration tests**: `tests/integration/` (manual, not part of `pnpm test`)

Coverage thresholds are defined in `vitest.config.ts`.

## Integration Tests (Manual)

Integration tests use the running API server and real orchestration flow.

```bash
# Start the dev server in one terminal
pnpm dev

# Run integration scripts in another
npx tsx tests/integration/verify_full_pipeline.ts
npx tsx tests/integration/test_cascading_refinement.ts
```

## Deterministic Runs (Recommended for CI)

Use the mock provider for fast, deterministic results:

```bash
METASOP_LLM_PROVIDER=mock pnpm test
```

## Reliability Checks

- **SSE progress stream**: Verify `GET /api/diagrams/generate/stream?jobId=...` emits `step_*` events and ends with `orchestration_complete` or `orchestration_failed`.
- **Artifact validation**: Confirm `metasop_artifacts` are present in the final diagram metadata.
- **Queue behavior**: Generation jobs are in-process; a server restart cancels in-flight jobs.

## Notes

- Integration tests require a valid LLM API key unless using `METASOP_LLM_PROVIDER=mock`.
- Coverage is focused on `lib/metasop/**` and core orchestration logic.

## Related Documentation

- [PRODUCTION-QUALITY-GUIDE.md](./PRODUCTION-QUALITY-GUIDE.md)
