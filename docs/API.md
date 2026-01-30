# MetaSOP API Reference

This document provides a comprehensive reference for the MetaSOP API.

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

The MetaSOP API provides programmatic access to the multi-agent orchestration platform. All endpoints are RESTful and return JSON responses.

### Features

- Create and manage diagrams
- Execute orchestrations
- Refine artifacts
- Query progress
- Export results

---

## Authentication

MetaSOP uses NextAuth.js for authentication. Most endpoints require authentication.

### Getting an API Key

1. Sign up at [metasop.dev](https://metasop.dev)
2. Go to Settings > API Keys
3. Generate a new API key
4. Include the key in the `Authorization` header

### Using the API Key

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.metasop.dev/v1/diagrams
```

### Guest Access

Some endpoints support guest access without authentication:

- `POST /api/diagrams/generate` - Limited diagram generation
- `GET /api/health` - Health check

---

## Base URL

```
Production: https://api.metasop.dev/v1
Development: http://localhost:3000/api
```

---

## Endpoints

### Diagrams

#### Create Diagram

```http
POST /api/diagrams
```

Creates a new diagram and starts orchestration.

**Request Body**:

```typescript
{
  title: string;
  description: string;
  userRequest: string;
  options?: {
    includeStateManagement?: boolean;
    includeAPIs?: boolean;
    includeDatabase?: boolean;
    model?: string;
    reasoning?: boolean;
  };
}
```

**Response**:

```typescript
{
  id: string;
  title: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
}
```

**Example**:

```bash
curl -X POST https://api.metasop.dev/v1/diagrams \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "E-commerce Platform",
    "description": "Full-stack e-commerce application",
    "userRequest": "Build a modern e-commerce platform with user authentication, product catalog, shopping cart, and payment processing"
  }'
```

#### Get Diagram

```http
GET /api/diagrams/:id
```

Retrieves a specific diagram by ID.

**Response**:

```typescript
{
  id: string;
  title: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed";
  artifacts: {
    pm_spec?: MetaSOPArtifact;
    arch_design?: MetaSOPArtifact;
    devops_infrastructure?: MetaSOPArtifact;
    security_architecture?: MetaSOPArtifact;
    engineer_impl?: MetaSOPArtifact;
    ui_design?: MetaSOPArtifact;
    qa_verification?: MetaSOPArtifact;
  };
  createdAt: string;
  updatedAt: string;
}
```

#### List Diagrams

```http
GET /api/diagrams
```

Lists all diagrams for the authenticated user.

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
| `format` | string | Yes | Export format: `json`, `pdf`, `markdown` |

**Response**: File download

---

### Orchestration

#### Start Orchestration

```http
POST /api/diagrams/:id/orchestration
```

Starts orchestration for a diagram.

**Response**:

```typescript
{
  sessionId: string;
  status: "running";
  startedAt: string;
}
```

#### Poll Progress

```http
GET /api/diagrams/:id/orchestration/poll
```

Polls orchestration progress.

**Response**:

```typescript
{
  sessionId: string;
  status: "running" | "completed" | "failed";
  progress: {
    total: number;
    completed: number;
    percentage: number;
  };
  currentStep?: {
    stepId: string;
    role: string;
    status: string;
  };
  events: MetaSOPEvent[];
}
```

---

### Refinement

#### Refine Artifact

```http
POST /api/diagrams/refine
```

Refines a specific artifact.

**Request Body**:

```typescript
{
  diagramId: string;
  targetStepId: string;
  instruction: string;
  isAtomicAction?: boolean;
  targetPaths?: string[];
  context?: {
    upstreamChange: string;
    reason: string;
    referenceValues?: Record<string, any>;
  };
}
```

**Response**:

```typescript
{
  updatedArtifacts: {
    [stepId: string]: MetaSOPArtifact;
  };
  affectedSteps: string[];
}
```

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
| `UNAUTHORIZED` | 401 | Invalid or missing API key |
| `FORBIDDEN` | 403 | Insufficient permissions |
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

## SDKs

### JavaScript/TypeScript

```bash
npm install @metasop/sdk
```

```typescript
import { MetaSOPClient } from '@metasop/sdk';

const client = new MetaSOPClient({
  apiKey: 'YOUR_API_KEY'
});

const diagram = await client.diagrams.create({
  title: 'My Project',
  description: 'Project description',
  userRequest: 'Build a web application'
});
```

### Python

```bash
pip install metasop-sdk
```

```python
from metasop import MetaSOPClient

client = MetaSOPClient(api_key='YOUR_API_KEY')

diagram = client.diagrams.create(
    title='My Project',
    description='Project description',
    user_request='Build a web application'
)
```

---

## Webhooks

MetaSOP supports webhooks for real-time notifications.

### Setting Up Webhooks

```http
POST /api/webhooks
```

**Request Body**:

```typescript
{
  url: string;
  events: Array<"orchestration.completed" | "orchestration.failed" | "artifact.updated">;
  secret?: string;
}
```

### Webhook Events

#### Orchestration Completed

```json
{
  "event": "orchestration.completed",
  "data": {
    "diagramId": "abc123",
    "sessionId": "xyz789",
    "completedAt": "2025-01-30T00:00:00Z"
  }
}
```

#### Artifact Updated

```json
{
  "event": "artifact.updated",
  "data": {
    "diagramId": "abc123",
    "artifactId": "arch_design",
    "updatedAt": "2025-01-30T00:00:00Z"
  }
}
```

### Verifying Webhooks

Verify webhook signatures using the secret:

```typescript
import crypto from 'crypto';

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');
  return signature === expectedSignature;
}
```

---

**Last Updated**: January 2025
