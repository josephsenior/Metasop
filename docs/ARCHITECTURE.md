# MetaSOP Architecture

This document provides a comprehensive overview of MetaSOP's architecture, design decisions, and system components.

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Core Components](#core-components)
- [Data Flow](#data-flow)
- [Design Principles](#design-principles)
- [Technology Stack](#technology-stack)
- [Scalability](#scalability)

---

## Overview

MetaSOP is a multi-agent orchestration platform that automates the software development lifecycle. The system coordinates specialized AI agents to generate synchronized, production-ready artifacts from natural language requests.

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
└─────┬───────────────┬───────────────┬───────────────────┘
      │               │               │
      ▼               ▼               ▼
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Knowledge│    │Execution │    │ Refinement│
│  Graph   │    │ Service  │    │ Planner  │
└──────────┘    └──────────┘    └──────────┘
      │               │               │
      └───────────────┴───────────────┘
                      │
                      ▼
              ┌───────────────┐
              │    Agents     │
              │  (7 Specialized│
              │   AI Agents)  │
              └───────┬───────┘
                      │
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
- Manage cascading refinement
- Track progress and emit events
- Handle errors and retries

**Key Methods**:
```typescript
class Orchestrator {
  async orchestrate(request: string, options: Options): Promise<MetaSOPResult>
  async refineArtifact(artifactId: string, instruction: string): Promise<MetaSOPArtifact>
  async getProgress(sessionId: string): Promise<Progress>
}
```

### 2. Knowledge Graph

**Location**: [`lib/metasop/knowledge-graph/`](../lib/metasop/knowledge-graph/)

The knowledge graph tracks dependencies between artifacts:

**Responsibilities**:
- Store artifact relationships
- Query dependencies
- Calculate impact of changes
- Plan refinement updates

**Key Components**:
- `SchemaKnowledgeGraph` - Main graph implementation
- `RefinementPlanner` - Plans surgical updates
- `SchemaNode` - Represents artifact properties

### 3. Execution Service

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
| Security | Threat modeling, security controls | Security Architecture |
| DevOps | CI/CD pipelines, infrastructure | DevOps Infrastructure |
| Engineer | File structures, implementation plans | Engineer Implementation |
| UI Designer | Design tokens, components | UI Design |
| QA | Test strategies, test cases | QA Verification |

### 5. LLM Adapter

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

### 6. Refinement System

**Location**: [`lib/metasop/utils/refinement-helper.ts`](../lib/metasop/utils/refinement-helper.ts)

Implements cascading refinement:

**Responsibilities**:
- Parse user refinement requests
- Calculate affected artifacts
- Generate refinement prompts
- Execute refinement updates

**Key Features**:
- Surgical updates (target specific paths)
- Cascading changes (propagate to dependents)
- Atomic actions (single property updates)
- Context-aware (includes upstream changes)

---

## Data Flow

### Orchestration Flow

```
User Request
    │
    ▼
Parse Request
    │
    ▼
Create Agent Context
    │
    ▼
Execute PM Agent
    │
    ▼
Store Artifact in Knowledge Graph
    │
    ▼
Execute Architect Agent (with PM artifact)
    │
    ▼
Store Artifact in Knowledge Graph
    │
    ▼
Execute Security Agent (with Architect artifact)
    │
    ▼
... (continue for all agents)
    │
    ▼
Return Complete Result
```

### Refinement Flow

```
User Refinement Request
    │
    ▼
Parse Request (identify target artifact and changes)
    │
    ▼
Query Knowledge Graph (find dependents)
    │
    ▼
Create Refinement Plan
    │
    ▼
Execute Target Agent Update
    │
    ▼
Propagate Changes to Dependents
    │
    ▼
Update Knowledge Graph
    │
    ▼
Return Updated Artifacts
```

---

## Design Principles

### 1. Separation of Concerns

Each component has a single, well-defined responsibility:

- **Orchestrator**: Workflow coordination
- **Knowledge Graph**: Dependency management
- **Execution Service**: Agent execution
- **Agents**: Domain-specific logic
- **Adapters**: LLM abstraction

### 2. Dependency Injection

Components receive dependencies through constructors:

```typescript
class Orchestrator {
  constructor(
    private knowledgeGraph: SchemaKnowledgeGraph,
    private executionService: ExecutionService,
    private refinementPlanner: RefinementPlanner
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

### 4. Immutable Data

Artifacts are immutable - updates create new versions:

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

## Scalability

### Horizontal Scaling

The system can scale horizontally by:

1. **Multiple Orchestrator Instances**: Run multiple orchestrators behind a load balancer
2. **Stateless Design**: Orchestrators don't maintain state between requests
3. **Database Backing**: Knowledge graph stored in database for shared access

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
- JWT token validation

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
