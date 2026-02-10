# Setup Guide

This guide covers local setup for **open-source usage** — no remote database, auth, or paid APIs required.

---

## Prerequisites

- **Node.js** 18+ — [Download](https://nodejs.org/)
- **pnpm** — Install with `npm install -g pnpm`
- **Git** — [Download](https://git-scm.com/)
- **Gemini API Key** — Free at [Google AI Studio](https://aistudio.google.com/apikey)

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/josephsenior/Metasop.git
cd Metasop
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your API key:

```env
# Required
GOOGLE_AI_API_KEY="your-google-ai-api-key"
DATABASE_URL="file:./prisma/local.db"

# Optional
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Set up database and run

```bash
pnpm db:generate    # Generate Prisma client
pnpm db:push        # Create local SQLite database
pnpm dev            # Start dev server
```

Open **[http://localhost:3000](http://localhost:3000)**. Diagrams are stored locally in `prisma/local.db` — no login or remote DB needed.

---

## Database

Blueprinta uses **SQLite** with **Prisma ORM** for local storage. No remote database server is required.

### How it works

- The database is a single file: `prisma/local.db`
- It's created automatically on first `pnpm db:push`
- The **Diagram** model stores metadata + agent artifacts as JSON — no separate graph database

### Commands

```bash
pnpm db:generate    # Regenerate Prisma client (after schema changes)
pnpm db:push        # Create/update tables in local SQLite
pnpm db:studio      # Open Prisma Studio GUI (browser-based DB viewer)
```

### Reset

To start fresh, delete the database file and recreate:

```bash
rm prisma/local.db          # or delete manually on Windows
pnpm db:push
```

---

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `GOOGLE_AI_API_KEY` | Gemini API key for diagram generation |
| `DATABASE_URL` | Database path — use `file:./prisma/local.db` for local SQLite |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000/api` | API base URL |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | App URL |
| `METASOP_LLM_PROVIDER` | `gemini` | LLM provider (`gemini` or `mock`) |
| `METASOP_LLM_MODEL` | `gemini-3-flash-preview` | Override LLM model |
| `METASOP_AGENT_TIMEOUT` | `180000` | Agent timeout in ms |
| `METASOP_AGENT_RETRIES` | `0` | Number of retries on failure |

→ Full provider configuration: **[LLM Providers Guide](LLM-PROVIDERS.md)**

---

## Security Notes

- **Never commit `.env`** if it contains API keys. The file is listed in `.gitignore` by default.
- The SQLite file (`prisma/local.db`) is local to your machine with no network exposure.

---

## Next Steps

- **[LLM Providers](LLM-PROVIDERS.md)** — Configure alternative LLM providers
- **[Architecture](ARCHITECTURE.md)** — Understand how the agent pipeline works
- **[API Reference](API.md)** — Explore the REST API
- **[Troubleshooting](TROUBLESHOOTING.md)** — Fix common issues
