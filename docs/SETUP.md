# Setup Guide

This guide covers setup for **local open-source usage** — no remote database or auth required.

## Quick Start (3 Steps)

### Step 1: Clone and install

```bash
git clone <repo-url>
cd MultiAGentPLatform
pnpm install
```

### Step 2: Environment

Create a `.env` file in the project root (or copy from `.env.example`):

```env
# Required: Gemini/LLM (for diagram generation)
GOOGLE_AI_API_KEY="your-google-ai-api-key"

# Database (local SQLite — no remote server)
DATABASE_URL="file:./prisma/local.db"

# App URLs (defaults for local)
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Step 3: Database and run

```bash
pnpm db:generate
pnpm db:push
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Diagrams are stored locally in `prisma/local.db`; no login or remote DB needed.

## Environment Variables

### Required

- **`GOOGLE_AI_API_KEY`** – For Gemini (diagram generation). Get one at [Google AI Studio](https://aistudio.google.com/apikey).
- **`DATABASE_URL`** – For local SQLite use `file:./prisma/local.db`.

### Optional

- **`NEXT_PUBLIC_API_URL`** – API base URL (default: `http://localhost:3000/api`).
- **`NEXT_PUBLIC_APP_URL`** – App URL (default: `http://localhost:3000`).
- **`METASOP_LLM_MODEL`** – Override LLM model (e.g. `gemini-3-flash-preview`).
- **`METASOP_LLM_API_KEY`** – Alternative to `GOOGLE_AI_API_KEY`/`GEMINI_API_KEY` for Gemini.
- **`METASOP_LLM_PROVIDER`** – Set to `mock` for offline or deterministic runs.

## Database (Local SQLite)

- No account or remote server. A file `prisma/local.db` is created on first `pnpm db:push`.
- To reset: delete `prisma/local.db` and run `pnpm db:push` again.

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues.
