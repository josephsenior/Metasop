# MetaSOP Integration Guide

## Overview

This project includes an integrated MetaSOP multi-agent system written in TypeScript to generate architecture diagrams using AI agents. The system is fully self-contained within the Next.js application.

## Architecture

The MetaSOP system consists of:

- **Orchestrator** (`lib/metasop/orchestrator.ts`): Coordinates the execution of multiple agents
- **Agents** (`lib/metasop/agents/`): All seven run **sequentially** in this order:
  - Product Manager: Generates specifications and requirements
  - Architect: Designs system architecture and APIs
  - DevOps: CI/CD pipelines and infrastructure
  - Security: Threat modeling and security controls
  - UI Designer: Designs UI components
  - Engineer: Creates implementation plans
  - QA: Generates test plans

## Configuration

The system supports multiple LLM providers. Configure these in `.env.local`:

```env
# Primary Provider (Google Gemini)
GOOGLE_AI_API_KEY=your_key_here
METASOP_LLM_PROVIDER=gemini
METASOP_LLM_MODEL=gemini-3-flash-preview

# Alternative: Token Factory (Free Llama models)
TOKEN_FACTORY_API_KEY=your_key_here
TOKEN_FACTORY_BASE_URL=https://tokenfactory.esprit.tn/api
# METASOP_LLM_PROVIDER=tokenfactory
```

## How It Works

### Generation Flow

1. User submits a prompt on `/dashboard/create`
2. Frontend calls `/api/diagrams/generate`
3. API route uses the integrated MetaSOP orchestrator (agents run sequentially):
   - Product Manager generates specifications
   - Architect designs system architecture
   - DevOps produces CI/CD and infrastructure
   - Security produces threat model and security architecture
   - UI Designer designs components
   - Engineer creates implementation plan
   - QA generates test plans
4. MetaSOP artifacts are stored in diagram metadata (`metadata.metasop_artifacts`) and displayed in the artifacts panel.
5. Diagram is saved with MetaSOP metadata.

### Agent Execution Order

Agents run **sequentially** (no parallelism). Order matches dependency flow:

1. **Product Manager** → Generates user stories and requirements
2. **Architect** → Designs architecture based on PM specs
3. **DevOps** → CI/CD and infrastructure
4. **Security** → Threat model and security architecture
5. **UI Designer** → Designs UI components
6. **Engineer** → Creates implementation plan
7. **QA** → Generates test plans based on all previous artifacts

### API Endpoint

```
POST /api/diagrams/generate
```

**Request Body:**
```json
{
  "prompt": "User's description",
  "options": {
    "includeStateManagement": true,
    "includeAPIs": true,
    "includeDatabase": true
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "diagram": {...},
    "orchestration": {
      "status": "success",
      "artifacts": {
        "pm_spec": {...},
        "arch_design": {...},
        "security_architecture": {...},
        "devops_infrastructure": {...},
        "ui_design": {...},
        "engineer_impl": {...},
        "qa_verification": {...}
      },
      "report": {
        "events": [...]
      },
      "steps": [...]
    }
  }
}
```

## Features

### Orchestration Panel

The `OrchestrationPanel` component displays:
- **Flow Tab**: React Flow visualization of the diagram
- **Steps Tab**: List of orchestration steps with status
- **Artifacts Tab**: Raw MetaSOP artifacts (PM, Architect, Engineer, UI)

### Real-time Updates

Generation progress is streamed via SSE at:

```
GET /api/diagrams/generate/stream?jobId=<jobId>
```

### Refinement (tool-based)

Refinement is done via **Edit Artifacts** (`POST /api/diagrams/artifacts/edit`). Send `previousArtifacts` and an `edits` array of ops (`set_at_path`, `delete_at_path`, `add_array_item`, `remove_array_item`). No agent re-runs; see [API.md](API.md#edit-artifacts-tool-based).

## Customization

### Adding New Agents

1. Create a new agent file in `lib/metasop/agents/`
2. Implement the agent function following the `AgentFunction` type
3. Add the agent to the orchestrator in `lib/metasop/orchestrator.ts`

### Enhancing Agents

Each agent can be enhanced to:
- Use actual LLM APIs (OpenAI, Anthropic, etc.)
- Parse user requests more intelligently
- Generate more detailed artifacts
- Add validation and error handling

## Extending with Real LLMs

To use actual LLM APIs, modify the agent functions:

```typescript
// Example: Using OpenAI
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function productManagerAgent(context: AgentContext) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are a Product Manager..." },
      { role: "user", content: context.user_request }
    ],
  });
  
  // Parse response and create artifact
  return { ... };
}
```

## Next Steps

1. **Add LLM Integration** - Connect agents to real LLM APIs
2. **Enhance Artifact Parsing** - Improve how artifacts are converted to diagrams
3. **Real-time Streaming** - Add WebSocket support for live updates
4. **Caching** - Cache agent responses for similar requests
5. **Error Handling** - Add retry logic and better error messages

