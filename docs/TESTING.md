# Testing Documentation

This document covers all testing aspects of the project, including unit tests, integration tests, and LLM testing.

## Test Suite Overview

The project uses **Vitest** for comprehensive testing with a target of **95% code coverage** (branches, functions, lines, statements).

### Configuration

- **Framework**: Vitest 4.0.14
- **Coverage**: v8 provider
- **Thresholds**: 95% for lines, functions, branches, statements
- **Configuration**: `vitest.config.ts`

## Test Structure

```
lib/metasop/
├── services/
│   └── __tests__/
│       ├── retry-service.test.ts      ✅ 9 tests
│       ├── execution-service.test.ts  ✅ 6 tests
│       └── failure-handler.test.ts    ✅ 11 tests
├── utils/
│   └── __tests__/
│       ├── logger.test.ts             ✅ 6 tests
│       └── prompt-parser.test.ts      ✅ 12 tests
├── agents/
│   └── __tests__/
│       ├── product-manager.test.ts    ✅ 4 tests
│       ├── architect.test.ts          ✅ 6 tests
│       ├── engineer.test.ts           ⚠️ 7 tests (needs fixes)
│       ├── ui-designer.test.ts        ✅ 4 tests
│       └── qa.test.ts                 ✅ 4 tests
├── adapters/
│   └── __tests__/
│       └── llm-adapter.test.ts        ✅ 6 tests
└── __tests__/
    ├── orchestrator.test.ts           ⚠️ 8 tests (needs fixes)
    ├── orchestrator-integration.test.ts ⚠️ 7 tests (needs fixes)
    ├── orchestrator-edge-cases.test.ts ⚠️ 7 tests (needs fixes)
    └── config.test.ts                 ✅ 10 tests
```

## Commands

```bash
# Run all tests
pnpm test

# Run with UI
pnpm test:ui

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

## Current Coverage

- **Statements**: 91.56% (target: 95%)
- **Branches**: 83.42% (target: 95%)
- **Functions**: ~91% (target: 95%)
- **Lines**: 91.96% (target: 95%)

## Test Categories

### Services (26 tests)

1. **Retry Service** (9 tests)
   - ✅ Success on first attempt
   - ✅ Retry with exponential backoff
   - ✅ Failure after max retries
   - ✅ Jitter
   - ✅ Max delay cap
   - ✅ Policies (default, aggressive, fast)

2. **Execution Service** (6 tests)
   - ✅ Successful execution
   - ✅ Timeout handling
   - ✅ Retry on failure
   - ✅ Execution time measurement
   - ✅ Parallel execution
   - ✅ Partial failure handling

3. **Failure Handler** (11 tests)
   - ✅ Timeout detection
   - ✅ Network error detection
   - ✅ Validation error detection
   - ✅ Execution error detection
   - ✅ Unknown errors
   - ✅ Retryable/non-retryable logging
   - ✅ Should retry decision

### Utils (18 tests)

1. **Logger** (6 tests)
   - ✅ Debug only in dev
   - ✅ Info/Warn/Error
   - ✅ Timestamps

2. **Prompt Parser** (12 tests)
   - ✅ Detection: auth, database, API, payment, email, storage
   - ✅ Component extraction
   - ✅ Technology extraction
   - ✅ Keyword extraction
   - ✅ Edge cases (empty, complex)

### Agents (25 tests)

1. **Product Manager** (4 tests)
   - ✅ Artifact generation
   - ✅ User stories
   - ✅ Requirements (functional/non-functional)
   - ✅ Acceptance criteria

2. **Architect** (6 tests)
   - ✅ Artifact generation
   - ✅ Conditional API specs
   - ✅ Conditional database schema
   - ✅ Component extraction
   - ✅ Technical decisions

3. **Engineer** (7 tests) ⚠️
   - ✅ Artifact generation
   - ✅ File structure
   - ✅ Dependencies
   - ✅ State management dependency
   - ✅ Database dependency
   - ✅ Implementation plan
   - ✅ Run commands

4. **UI Designer** (4 tests)
   - ✅ Artifact generation
   - ✅ Component hierarchy
   - ✅ Design tokens
   - ✅ UI patterns

5. **QA** (4 tests)
   - ✅ Artifact generation
   - ✅ Test plan (unit, integration, e2e)
   - ✅ Verification criteria
   - ✅ Quality metrics

### Orchestrator (22 tests)

1. **Orchestrator** (8 tests) ⚠️
   - ✅ Sequential execution
   - ✅ Parallel execution
   - ✅ Failure handling
   - ✅ Context propagation
   - ✅ Report generation
   - ✅ Step tracking
   - ✅ getState()
   - ✅ runMetaSOPOrchestration()

2. **Integration** (7 tests) ⚠️
   - ✅ Complete flow
   - ✅ Disabled agents
   - ✅ Context propagation
   - ✅ Sequential execution
   - ✅ Timeout handling
   - ✅ Retry
   - ✅ State management

3. **Edge Cases** (7 tests) ⚠️
   - ✅ Empty request
   - ✅ Long request
   - ✅ Special characters
   - ✅ Options disabled/enabled
   - ✅ Artifact order
   - ✅ Timestamps

### Configuration (10 tests)

- ✅ Default config
- ✅ Per-agent configs
- ✅ Environment variable overrides
- ✅ LLM provider config

## Next Steps to Reach 95%

1. **Fix failing tests** (27 tests)
   - Engineer tests (file_structure error)
   - Orchestrator tests (timeouts)
   - Logger tests (format)

2. **Add tests for missing branches**
   - Error cases in orchestrator
   - Edge cases in agents
   - Configuration edge cases

3. **Additional integration tests**
   - Complete real-world scenarios
   - Complex error handling
   - Performance tests

## LLM Testing

### Testing with Llama 3.3 70B Instruct

1. **Update `.env.local`:**
   ```bash
   METASOP_LLM_PROVIDER=openrouter
   METASOP_LLM_MODEL=meta-llama/llama-3.3-70b-instruct:free
   OPENROUTER_API_KEY=your-key-here
   ```

2. **Restart dev server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

3. **Run test:**
   ```bash
   node scripts/test-openrouter-llama.js
   ```

### Expected Results

With Llama 3.3 70B Instruct, you should see:

#### ✅ Good Quality Indicators:
- **PM User Stories:** 5-10 (not 1)
- **PM Acceptance Criteria:** 10-15 (not 1)
- **Architect APIs:** 8-15 (not 3)
- **Architect Decisions:** 5-10 (not 1)
- **Database Tables:** 5-10 (not 2)
- **Design Doc:** 2000+ chars (not 800)

#### Quality Score:
- **80%+** = Excellent ✅
- **60-79%** = Good ⚠️
- **<60%** = Poor ❌

### What to Look For

1. **Detail Level:** Are the outputs comprehensive and specific?
2. **Completeness:** Are all required fields present?
3. **Relevance:** Do the outputs match the user's request?
4. **Structure:** Is the JSON valid and well-formed?

### Troubleshooting LLM Tests

If you see errors:
- Check server logs for API errors
- Verify OpenRouter API key is valid
- Ensure model name is correct: `meta-llama/llama-3.3-70b-instruct:free`
- Check rate limits (OpenRouter free tier has limits)

## Notes

- Tests use `vi.useFakeTimers()` to control time
- Agents are mocked for isolated tests
- Integration tests use complete orchestrator
- Coverage configured for `lib/metasop/**/*.ts` only

## Related Documentation

- [TESTING-GUIDE.md](./TESTING-GUIDE.md) - LLM testing guide
- [PRODUCTION-QUALITY-GUIDE.md](./PRODUCTION-QUALITY-GUIDE.md) - Quality improvement strategies
