# MetaSOP Integration Guide

## Overview

This project includes an integrated MetaSOP multi-agent system written in TypeScript to generate architecture diagrams using AI agents. The system is fully self-contained within the Next.js application.

## Architecture

The MetaSOP system consists of:

- **Orchestrator** (`lib/metasop/orchestrator.ts`): Coordinates the execution of multiple agents
- **Agents** (`lib/metasop/agents/`):
  - Product Manager: Generates specifications and requirements
  - Architect: Designs system architecture and APIs
  - Engineer: Creates implementation plans
  - UI Designer: Designs UI components
  - QA: Generates test plans

## Configuration

No additional configuration is required! The MetaSOP system is fully integrated and ready to use.

## How It Works

### Generation Flow

1. User submits a prompt on `/dashboard/create`
2. Frontend calls `/api/diagrams/generate`
3. API route uses the integrated MetaSOP orchestrator:
   - Product Manager generates specifications
   - Architect designs system architecture
   - Engineer creates implementation plan
   - UI Designer designs components
   - QA generates test plans
4. MetaSOP artifacts are transformed to React Flow diagram format
5. Diagram is saved with MetaSOP metadata

### Agent Execution Order

1. **Product Manager** → Generates user stories and requirements
2. **Architect** → Designs architecture based on PM specs
3. **Engineer** + **UI Designer** → Run in parallel
4. **QA** → Generates test plans based on all previous artifacts

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
        "engineer_impl": {...},
        "ui_design": {...},
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

The `useMetaSOPOrchestration` hook polls for updates every 2 seconds while orchestrating.

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

### Transform Function

Modify `transformMetaSOPToDiagram()` in `/app/api/diagrams/generate/route.ts` to customize how MetaSOP artifacts are converted to diagram nodes/edges.

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

