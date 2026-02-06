# Blueprinta Architecture

This document provides a comprehensive overview of Blueprinta's architecture, design decisions, and system components.

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Core Components](#core-components)
- [Diagram model (artifact-centric)](#diagram-model-artifact-centric)
- [Data Flow](#data-flow)
- [Design Principles](#design-principles)
- [Technology Stack](#technology-stack)
- [Runtime configuration](#runtime-configuration)
- [Scalability](#scalability)

---

## Overview

Blueprinta is a multi-agent orchestration platform that automates the software development lifecycle. The system coordinates specialized AI agents to generate synchronized, production-ready artifacts from natural language requests.

### Key Architectural Goals

1. **Modularity**: Each component is independent and replaceable
2. **Scalability**: System can handle multiple concurrent orchestrations
3. **Extensibility**: Easy to add new agents and features
4. **Reliability**: Robust error handling and recovery
5. **Performance**: Optimized for speed and resource efficiency

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                        │
│                    (Next.js Web Application)                  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│              (Next.js API Routes + Middleware)                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Orchestrator                              │
│         (Coordinates agent execution & workflow)                │
└────────────────────┬──────────────────────────────────────────┘
                     │
      ┌──────────────┴──────────────┐
      ▼                             ▼
┌──────────────┐             ┌───────────────┐
│ Execution   │             │    Agents     │
│ Service     │             │  (7 Specialized│
│ (timeouts,  │             │   AI Agents)  │
│  retries)   │             └───────┬───────┘
└──────────────┘                     │
                                     ▼
                             ┌───────────────┐
                             │  LLM Adapter  │
                             │  (Gemini, etc)│
                             └───────────────┘
```

---

## Core Components

### 1. Orchestrator

**Location**: [`lib/metasop/orchestrator.ts`](../lib/metasop/orchestrator.ts)

The orchestrator is the central coordinator that manages the entire workflow:

**Responsibilities**:
- Execute agents in the correct order
- Handle agent dependencies
- Manage workflow (refinement is tool-based; see Edit Artifacts API)
- Track progress and emit events
- Handle errors and retries

**Key Methods**:
```typescript
class Orchestrator {
  async run(request: string, options?: Options): Promise<MetaSOPResult>
}
```

Refinement is tool-based via `POST /api/diagrams/artifacts/edit`; there is no in-orchestrator refinement or knowledge graph.

### 2. Execution Service

**Location**: [`lib/metasop/services/execution-service.ts`](../lib/metasop/services/execution-service.ts)

Handles agent execution with timeout and retry logic:

**Responsibilities**:
- Execute agents with timeout protection
- Implement retry policies
- Handle errors gracefully
- Track execution metrics

**Key Features**:
- Configurable timeouts per agent
- Exponential backoff for retries
- Detailed error reporting
- Execution time tracking

### 4. Agents

**Location**: [`lib/metasop/agents/`](../lib/metasop/agents/)

Specialized AI agents for different roles:

| Agent | Responsibility | Output |
|--------|---------------|---------|
| Product Manager | User stories, acceptance criteria | PM Spec |
| Architect | API contracts, database schemas | Arch Design |
| DevOps | CI/CD pipelines, infrastructure | DevOps Infrastructure |
| Security | Threat modeling, security controls | Security Architecture |
| UI Designer | Design tokens, components | UI Design |
| Engineer | File structures, implementation phases | Engineer Implementation |
| QA | Test strategies, test cases | QA Verification |

### 4. LLM Adapter

**Location**: [`lib/metasop/adapters/`](../lib/metasop/adapters/)

Abstracts LLM provider interactions:

**Responsibilities**:
- Provide unified interface for different LLMs
- Handle context caching
- Manage rate limiting
- Format requests and responses

**Supported Providers**:
- Google Gemini
- Vercel AI SDK
- Token Factory (Llama 3.1)

### 5. Refinement (tool-based)

**Refinement**: Refinement is **tool-based** only. Use **Edit Artifacts** (`POST /api/diagrams/artifacts/edit`): send `previousArtifacts` and an `edits` array of ops (`set_at_path`, `delete_at_path`, `add_array_item`, `remove_array_item`). No agent re-runs; edits are applied deterministically to artifact JSON. See [API.md](API.md) for request/response shape.

---

## Diagram model (artifact-centric)

**Diagram (for the user) = metadata + artifacts. No graph in the DB.**

- The database (Prisma) stores only diagram **metadata**: id, userId, title, description, status, metadata JSON, timestamps. It does **not** store nodes or edges.
- Diagram is artifact-centric: artifacts live in `metadata.metasop_artifacts`; there is no knowledge graph or dependency graph built or returned.
- Refinement is tool-based (Edit Artifacts API), not graph-based.

---

## Data Flow

### Orchestration flow

```
User Request
    │
    ▼
Parse Request (prompt, options, documents)
    │
    ▼
Create Agent Context (previous_artifacts)
    │
    ▼
Execute PM Agent → store in context
    │
    ▼
Execute Architect Agent (with PM artifact)
    │
    ▼
Execute DevOps Agent (with PM + Architect)
    │
    ▼
Execute Security Agent
    │
    ▼
Execute UI Designer Agent
    │
    ▼
Execute Engineer Agent
    │
    ▼
Execute QA Agent
    │
    ▼
Persist diagram (DB) → Return / stream result
```

### Refinement flow (tool-based only)

Refinement is **not** agent re-run or graph-based. Use the Edit Artifacts API:

```
User wants to change an artifact
    │
    ▼
POST /api/diagrams/artifacts/edit
    │
    ▼
Request: previousArtifacts + edits (set_at_path, add_array_item, etc.)
    │
    ▼
Apply edits to artifact JSON (validated, deterministic)
    │
    ▼
Return updated artifacts
```

---

## Design Principles

### 1. Separation of Concerns

Each component has a single, well-defined responsibility:

- **Orchestrator**: Workflow coordination
- **Execution Service**: Agent execution
- **Agents**: Domain-specific logic
- **Adapters**: LLM abstraction

### 2. Dependency Injection

Components receive dependencies through constructors:

```typescript
class Orchestrator {
  constructor(
    private executionService: ExecutionService
  ) {}
}
```

### 3. Event-Driven Architecture

Components communicate through events:

```typescript
onProgress({
  type: "step_complete",
  step_id: "arch_design",
  artifact: {...}
})
```

### 4. Artifact Updates

In-memory artifact updates replace content in place; there is no version history or version IDs. Tool-based refinement (Edit Artifacts API) applies ops to a copy of artifacts and returns the updated set.

```typescript
const updatedArtifact = {
  ...originalArtifact,
  content: newContent
}
```

### 5. Type Safety

Strong TypeScript typing throughout:

```typescript
interface MetaSOPArtifact {
  step_id: string;
  role: string;
  content: BackendArtifactData;
  timestamp: string;
}
```

---

## Technology Stack

### Frontend
- **Next.js 16** - React framework
- **React 19** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Styling
- **Radix UI** - Component library

### Backend
- **Next.js API Routes** - Serverless API
- **Prisma** - Database ORM
- **Zod** - Schema validation
- **Vitest** - Testing framework

### AI/ML
- **Google Gemini** - Primary LLM
- **Vercel AI SDK** - AI utilities
- **Context Caching** - Performance optimization

### Infrastructure
- **Node.js 18+** - Runtime
- **pnpm** - Package manager
- **GitHub Actions** - CI/CD

---

## Runtime configuration

A single **runtime config** module (`lib/runtime-config.ts`) provides env + defaults + feature flags so behavior is easy to reason about for both API routes and `lib/metasop`. All defaults live there; env vars override.

- **`getRuntimeConfig()`** – full config (llm, agents, performance, logging, featureFlags).
- **Blueprinta** – `getConfig()` in `lib/metasop/config.ts` reads from `getRuntimeConfig()` and merges into Blueprinta defaults.
- **Env vars** – `METASOP_LLM_*`, `METASOP_AGENT_*`, etc. See `.env.example` and `lib/runtime-config.ts`.

---

## Scalability

### Horizontal Scaling

The system can scale horizontally by:

1. **Multiple Orchestrator Instances**: Run multiple orchestrators behind a load balancer
2. **Stateless Design**: Orchestrators don't maintain state between requests
3. **Stateless orchestration**: No shared in-memory graph; refinement is tool-based (Edit Artifacts API).

### Vertical Scaling

Performance optimizations:

1. **Context Caching**: Reuse LLM context across requests
2. **Parallel Execution**: Run independent agents in parallel
3. **Lazy Loading**: Load agents only when needed
4. **Connection Pooling**: Reuse database connections

### Caching Strategy

```
┌─────────────┐
│   Request   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Cache     │ ◄─── Hit? Return cached result
└──────┬──────┘
       │ Miss
       ▼
┌─────────────┐
│  Execute    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Cache     │ ◄─── Store result
└─────────────┘
```

---

## Security Considerations

### Input Validation
- All user inputs validated with Zod schemas
- Sanitization of user-generated content
- Type checking prevents injection attacks

### API Security
- Rate limiting on all endpoints
- CORS configuration
- Secure HTTP headers
- Guest session identification (cookie and `x-guest-session-id` header); no user accounts or JWT

### Data Protection
- Environment variables for sensitive data
- No hardcoded credentials
- Encrypted database connections
- Secure session management

---

## Monitoring & Observability

### Logging
- Structured logging with context
- Log levels: debug, info, warn, error
- Request/response logging
- Error stack traces

### Metrics
- Agent execution time
- Success/failure rates
- Cache hit rates
- Resource usage

### Tracing
- Request tracing across components
- Distributed tracing support
- Performance profiling

---

## Future Enhancements

### Planned Improvements

1. **Streaming Responses**: Real-time agent output
2. **Advanced Caching**: Multi-level caching strategy
3. **Parallel Execution**: Run independent agents concurrently
4. **Plugin System**: Extensible architecture for custom agents
5. **Event Sourcing**: Immutable event log for audit trails

### Research Areas

1. **Self-Optimizing Agents**: Agents that learn from past executions
2. **Cross-Project Learning**: Share knowledge across projects
3. **Predictive Caching**: Pre-cache likely requests
4. **Adaptive Timeouts**: Dynamic timeout based on complexity

---

**Last Updated**: January 2025
