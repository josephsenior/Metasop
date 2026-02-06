# Blueprinta API Reference

This document provides a comprehensive reference for the Blueprinta API.

---

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Endpoints](#endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Overview

The Blueprinta API provides programmatic access to the multi-agent orchestration platform. All endpoints are RESTful and return JSON responses.

### Features

- Create and manage diagrams
- Run generation jobs
- Refine artifacts
- Query progress
- Export results

---

## Session (Guest Only)

The app is guest-only; there is no login or API keys. Diagram endpoints identify the session via:

- **Header:** `x-guest-session-id` (set by the frontend; use `fetchDiagramApi` or `apiClient` so it is sent automatically).
- **Cookie:** `guest_session_id` (set by the API on responses so same-origin requests carry it).

All diagram and generation endpoints use this guest session. Use the same client (or cookie) so all requests are tied to one session.

---

## Base URL

```
Development: http://localhost:3000/api
Production: set NEXT_PUBLIC_API_URL in your deployment (e.g. https://your-app.com/api)
```

---

## Endpoints

### Diagrams

#### Generate diagram (primary creation flow)

```http
POST /api/diagrams/generate
```

Enqueues the Blueprinta orchestration and creates a diagram. Use **guest session** (cookie or `x-guest-session-id`); no login or API key required for the app.

**Request Body**:

```typescript
{
  prompt: string;                    // Natural language description (min 20 chars)
  options?: {
    includeStateManagement?: boolean;
    includeAPIs?: boolean;
    includeDatabase?: boolean;
    model?: string;                  // e.g. "gemini-3-flash-preview", "gemini-3-pro-preview"
    reasoning?: boolean;             // Extended reasoning (slower)
  };
  documents?: Array<{ name?: string; content?: string }>;  // Optional attached context
  clarificationAnswers?: Record<string, string>;       // From guided-mode questions
}
```

**Response**:

```typescript
{
  jobId: string;
  diagramId: string;
  streamUrl: string; // e.g. "/api/diagrams/generate/stream?jobId=..."
}
```

Use the `streamUrl` to subscribe to progress updates.

**Example**:

```bash
# 1) Enqueue generation
curl -X POST "http://localhost:3000/api/diagrams/generate" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Build a modern e-commerce platform with auth, product catalog, and checkout"}'

# 2) Stream events (SSE)
curl -N "http://localhost:3000/api/diagrams/generate/stream?jobId=<jobId>"
```

#### Create diagram (metadata only)

```http
POST /api/diagrams
```

Creates a new diagram record (metadata only). Orchestration is started via **POST /api/diagrams/generate**; this endpoint is used internally or for listing/CRUD.

**Request Body** (if used): typically minimal; see implementation.

#### Get diagram

```http
GET /api/diagrams/:id
```

Retrieves a diagram by ID (scoped to the current guest session).

**Response**:

```typescript
{
  id: string;
  userId: string;
  title: string;
  description: string;
  status: "pending" | "processing" | "completed" | "failed";
  metadata?: {
    prompt?: string;
    options?: object;
    metasop_artifacts?: Record<string, MetaSOPArtifact>;  // pm_spec, arch_design, etc.
    metasop_steps?: any;
  };
  createdAt: string;
  updatedAt: string;
}
```

#### List Diagrams

```http
GET /api/diagrams
```

Lists diagrams for the current guest session (cookie or x-guest-session-id).

**Query Parameters**:

| Parameter | Type | Default | Description |
|-----------|-------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `status` | string | - | Filter by status |

**Response**:

```typescript
{
  diagrams: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    createdAt: string;
  }>;
  total: number;
  page: number;
  limit: number;
}
```

#### Update Diagram

```http
PUT /api/diagrams/:id
```

Updates diagram metadata.

**Request Body**:

```typescript
{
  title?: string;
  description?: string;
}
```

#### Delete Diagram

```http
DELETE /api/diagrams/:id
```

Deletes a diagram.

#### Duplicate Diagram

```http
POST /api/diagrams/:id/duplicate
```

Creates a copy of an existing diagram.

**Response**:

```typescript
{
  id: string;
  title: string;
  description: string;
  status: "pending";
  createdAt: string;
}
```

#### Export Diagram

```http
GET /api/diagrams/:id/export
```

Exports diagram in specified format.

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|-------|-----------|-------------|
| `artifact` | string | No | Export artifact type (default: `documentation`). |
| `format` | string | No | Format varies by artifact (default: `markdown`). |

**Artifacts & formats**:

- `documentation`: `markdown`, `pdf`, `html`, `pptx`
- `openapi`: `json`
- `sql`: `migration`, `seed`
- `estimates`: `json`
- `deployment`: `markdown`
- `adr`: `markdown`
- `erd`: `mermaid`, `plantuml`, `markdown`
- `tech-comparison`: `markdown`
- `test-plan`: `markdown`
- `security-audit`: `markdown`
- `mermaid`: `flowchart`, `sequence`

**Response**: File download

---

### Generation Stream (SSE)

```http
GET /api/diagrams/generate/stream?jobId=:jobId
```

Streams progress updates for a queued generation job. Each SSE event is a JSON payload with a `type` field.

**Note**: Jobs are in-process. A server restart will drop in-flight jobs.

**Event types**:
`step_start`, `step_thought`, `step_complete`, `step_failed`, `orchestration_complete`, `orchestration_failed`, `agent_progress`.

---

### Refinement (tool-based)

Refinement is done by editing artifact JSON via predefined tools. There is no instruction-based or agent re-run refinement.

#### Edit Artifacts

```http
POST /api/diagrams/artifacts/edit
```

Applies predefined edit operations to artifact JSON without re-running agents. Treats artifacts as documents; all changes go through validated tools (set_at_path, delete_at_path, add_array_item, remove_array_item). Deterministic and performant.

**Request Body**:

```typescript
{
  diagramId?: string;
  previousArtifacts: Record<string, { content: object; step_id?: string; role?: string; timestamp?: string }>;
  edits: Array<
    | { tool: "set_at_path"; artifactId: string; path: string; value: any }
    | { tool: "delete_at_path"; artifactId: string; path: string }
    | { tool: "add_array_item"; artifactId: string; path: string; value: any }
    | { tool: "remove_array_item"; artifactId: string; path: string; index?: number }
  >;
}
```

- **artifactId**: One of `pm_spec`, `arch_design`, `security_architecture`, `devops_infrastructure`, `ui_design`, `engineer_impl`, `qa_verification`.
- **path**: Dot-separated path, e.g. `apis.0.path` or `user_stories[1].title`.

**Response**:

```typescript
{
  success: boolean;
  artifacts: Record<string, ArtifactRecord>;
  applied: number;
  errors?: Array<{ op: EditOp; error: string }>;
}
```

#### Refine Artifacts (intent-driven)

```http
POST /api/diagrams/artifacts/refine
POST /api/diagrams/artifacts/refine?stream=true
```

Uses intent analysis to generate edit operations, then applies them atomically.

**Request Body**:

```typescript
{
  diagramId?: string;
  intent: string;
  previousArtifacts: Record<string, { content: object; step_id?: string; role?: string; timestamp?: string }>;
  chatHistory?: string;
  activeTab?: string;
}
```

**Streaming**: newline-delimited JSON events with types: `analyzing`, `plan_ready`, `applying`, `artifact_updated`, `complete`, `error`.

#### Ask Question

```http
POST /api/diagrams/ask
```

Asks a question about a diagram.

**Request Body**:

```typescript
{
  diagramId: string;
  question: string;
}
```

**Response**:

```typescript
{
  answer: string;
  relevantArtifacts: string[];
  confidence: number;
}
```

---

### Health

#### Health Check

```http
GET /api/health
```

Checks API health status.

**Response**:

```typescript
{
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  timestamp: string;
  services: {
    database: "healthy" | "unhealthy";
    llm: "healthy" | "unhealthy";
    cache: "healthy" | "unhealthy";
  };
}
```

---

## Data Models

### MetaSOPArtifact

```typescript
interface MetaSOPArtifact {
  step_id: string;
  role: string;
  content: BackendArtifactData;
  timestamp: string;
}
```

### MetaSOPEvent

```typescript
interface MetaSOPEvent {
  type: "step_start" | "step_thought" | "step_partial_artifact" | 
         "step_complete" | "step_failed" | "orchestration_complete" | 
         "orchestration_failed" | "agent_progress";
  step_id?: string;
  role?: string;
  artifact?: MetaSOPArtifact;
  thought?: string;
  partial_content?: any;
  error?: string;
  status?: string;
  message?: string;
  diagram?: {
    id: string;
    title?: string;
    description?: string;
    metadata?: any;
  };
  timestamp: string;
}
```

### BackendArtifactData

```typescript
type BackendArtifactData =
  | ArchitectBackendArtifact
  | ProductManagerBackendArtifact
  | EngineerBackendArtifact
  | QABackendArtifact
  | DevOpsBackendArtifact
  | SecurityBackendArtifact
  | UIDesignerBackendArtifact;
```

---

## Error Handling

All errors follow a consistent format:

```typescript
{
  error: {
    code: string;
    message: string;
    details?: any;
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|-------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing guest session |
| `FORBIDDEN` | 403 | Guest limit exceeded or insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

### Example Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid user request",
    "details": {
      "field": "userRequest",
      "issue": "Must be at least 10 characters"
    }
  }
}
```

---

## Rate Limiting

API requests are rate limited to prevent abuse.

### Limits

| Plan | Requests per Minute | Requests per Hour |
|-------|-------------------|-------------------|
| Free | 10 | 100 |
| Pro | 100 | 1000 |
| Enterprise | Unlimited | Unlimited |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Handling Rate Limits

When rate limited, the API returns:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
```

Implement exponential backoff:

```typescript
async function makeRequest(url: string, retries = 3) {
  try {
    const response = await fetch(url);
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      await sleep(parseInt(retryAfter) * 1000);
      return makeRequest(url, retries - 1);
    }
    return response.json();
  } catch (error) {
    if (retries > 0) {
      await sleep(1000 * (4 - retries));
      return makeRequest(url, retries - 1);
    }
    throw error;
  }
}
```

---

**Last Updated**: January 2025
