# Architecture Documentation

This document describes the system architecture, including the TypeScript-based full-stack structure and the robust MetaSOP multi-agent system.

## Overview

This application uses **TypeScript** for both frontend and backend, creating a unified and consistent architecture. The system includes a MetaSOP multi-agent orchestration system for generating architecture diagrams using AI agents.

## Project Structure

```
saa-s-landing-page/
├── app/                          # Next.js App Router
│   ├── api/                      # Backend API Routes (TypeScript)
│   │   ├── auth/                 # Authentication routes
│   │   └── diagrams/             # Diagram routes
│   │       └── generate/         # MetaSOP generation
│   ├── dashboard/                # Frontend pages (TypeScript)
│   ├── login/                    # Authentication pages
│   └── ...
│
├── lib/                          # Shared business logic (TypeScript)
│   ├── metasop/                  # MetaSOP multi-agent system
│   │   ├── agents/               # AI agents (PM, Architect, Engineer, UI, QA)
│   │   ├── services/             # Core services
│   │   │   ├── retry-service.ts  # Retry with exponential backoff
│   │   │   ├── execution-service.ts # Execution with timeout
│   │   │   └── failure-handler.ts   # Error analysis
│   │   ├── orchestrator.ts       # Main orchestrator
│   │   ├── config.ts             # Configuration
│   │   ├── types.ts              # TypeScript types
│   │   └── utils/                # Utilities (logger, parser)
│   ├── diagrams/                 # Diagram management
│   ├── auth/                     # Authentication
│   └── api/                      # API clients
│
├── components/                   # React components (TypeScript)
│   ├── diagrams/                 # Diagram components
│   ├── auth/                     # Auth components
│   └── ui/                       # Reusable UI components
│
├── hooks/                        # React Hooks (TypeScript)
├── types/                        # Shared TypeScript types
└── prisma/                       # Database schema
```

## Data Flow

### Diagram Generation Flow

```
1. User Input (Frontend)
   ↓
2. POST /api/diagrams/generate
   ↓
3. MetaSOP Orchestrator (Backend TypeScript)
   ├── Product Manager Agent
   ├── Architect Agent
   ├── Engineer Agent (parallel)
   ├── UI Designer Agent (parallel)
   └── QA Agent
   ↓
4. Transform to React Flow Diagram
   ↓
5. Save to Database
   ↓
6. Return to Frontend
   ↓
7. Display with React Flow
```

## Technologies

### Frontend
- **Next.js 14+** (App Router)
- **React 18+**
- **TypeScript**
- **Tailwind CSS**
- **React Flow** (diagram visualization)
- **next-themes** (dark mode)

### Backend
- **Next.js API Routes** (TypeScript)
- **MetaSOP Orchestrator** (TypeScript)
- **JWT** (authentication)
- **Prisma** (database ORM)
- **PostgreSQL** (via Supabase/Neon)

### Shared
- **TypeScript** (shared types)
- **Axios** (HTTP client)
- **UUID** (ID generation)

## MetaSOP Architecture

### Robust Architecture Features

The MetaSOP system implements a robust architecture inspired by Forge, with comprehensive error handling, retry logic, timeouts, and parallel execution.

#### 1. Retry Service (`lib/metasop/services/retry-service.ts`)

**Features:**
- ✅ Retry with exponential backoff
- ✅ Jitter to prevent thundering herd
- ✅ Configurable retry policies (default, aggressive, fast)
- ✅ Detailed attempt logging

**Example:**
```typescript
const retryService = new RetryService();
const result = await retryService.executeWithRetry(
  async () => agentFn(),
  RetryService.createDefaultPolicy(),
  { stepId: "pm_spec", role: "Product Manager" }
);
```

#### 2. Execution Service (`lib/metasop/services/execution-service.ts`)

**Features:**
- ✅ Configurable timeout per agent
- ✅ Integration with retry service
- ✅ Parallel execution with `Promise.allSettled`
- ✅ Robust error handling
- ✅ Performance measurement

**Example:**
```typescript
const executionService = new ExecutionService();
const result = await executionService.executeStep(
  architectAgent,
  context,
  {
    timeout: 30000,
    retryPolicy: RetryService.createDefaultPolicy(),
    stepId: "arch_design",
    role: "Architect",
  }
);
```

#### 3. Failure Handler (`lib/metasop/services/failure-handler.ts`)

**Features:**
- ✅ Error type analysis (timeout, network, validation, execution)
- ✅ Detection of retryable vs non-retryable errors
- ✅ Structured failure logging
- ✅ Intelligent error classification

**Error Types:**
- `TIMEOUT` - Retryable
- `NETWORK` - Retryable
- `VALIDATION` - Non-retryable
- `EXECUTION` - Retryable
- `UNKNOWN` - Retryable by default

#### 4. Configuration (`lib/metasop/config.ts`)

**Features:**
- ✅ Per-agent configuration (timeout, retries)
- ✅ Customizable retry policies
- ✅ Centralized configuration
- ✅ Environment variable support

**Example:**
```typescript
agentConfigs: {
  engineer_impl: {
    stepId: "engineer_impl",
    timeout: 40000, // 40 seconds
    retries: 3,
    retryPolicy: {
      initialDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitter: true,
    },
  },
}
```

### Orchestrator Features

1. **Sequential or Parallel Execution**
   - Configurable via `config.performance.parallelExecution`
   - Parallel execution for Engineer + UI Designer
   - Configurable concurrency limit

2. **Robust Error Handling**
   - Automatic error analysis
   - Intelligent retry based on error type
   - Structured logging

3. **Configurable Timeouts**
   - Per-agent timeout
   - Global default timeout
   - Timeout management with retry

4. **Structured Logging**
   - Log levels (debug, info, warn, error)
   - Complete context (stepId, role, duration, attempts)
   - Can be disabled in production

### Execution Flow

```
1. Orchestrator.run()
   ↓
2. For each step:
   ├─ Check if agent is enabled
   ├─ Create step tracking
   ├─ ExecutionService.executeStep()
   │  ├─ RetryService.executeWithRetry()
   │  │  ├─ Attempt 1
   │  │  ├─ If failure → Exponential backoff
   │  │  ├─ Attempt 2
   │  │  └─ ...
   │  └─ Timeout wrapper
   ├─ FailureHandler.analyzeFailure()
   └─ Structured logging
   ↓
3. Final result with all artifacts
```

### Agent Execution Order

1. **Product Manager** → Generates user stories and requirements
2. **Architect** → Designs architecture based on PM specs
3. **Engineer** + **UI Designer** → Run in parallel
4. **QA** → Generates test plans based on all previous artifacts

## Environment Configuration

```env
# Timeouts and retries
METASOP_AGENT_TIMEOUT=30000
METASOP_AGENT_RETRIES=2

# LLM Configuration
METASOP_LLM_PROVIDER=mock
METASOP_LLM_MODEL=default
METASOP_LLM_API_KEY=your-key-here
```

## Advantages of This Architecture

1. **Robustness**: Retry, timeout, error handling
2. **Flexibility**: Per-agent configuration
3. **Observability**: Complete structured logging
4. **Performance**: Configurable parallel execution
5. **Maintainability**: Separated, testable services
6. **Type Safety**: Shared types between frontend and backend
7. **Unified Stack**: Single language for entire project
8. **Productivity**: Autocompletion and refactoring facilitated

## Adding New Agents

1. Create `lib/metasop/agents/my-agent.ts`
2. Implement the agent function following the `AgentFunction` type
3. Add the agent to the orchestrator in `lib/metasop/orchestrator.ts`

## Development

### Start the project

```bash
npm run dev
# or
pnpm dev
```

### Agent Structure

Each agent is a TypeScript function that:
1. Receives a context (user request, previous artifacts)
2. Generates a structured artifact
3. Returns a `MetaSOPArtifact`

## Next Steps

### Short Term
- [ ] Improve diagram generation
- [ ] Add unit tests
- [ ] Enhance error handling

### Medium Term
- [ ] Integrate real LLMs (OpenAI, Anthropic)
- [ ] Add persistent database
- [ ] Implement real-time streaming

### Long Term
- [ ] Optimize performance
- [ ] Add caching
- [ ] Horizontal scaling

## Related Documentation

- [INTEGRATION-METASOP.md](./INTEGRATION-METASOP.md) - MetaSOP integration details
- [TESTING.md](./TESTING.md) - Testing documentation
- [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) - Future migration considerations

