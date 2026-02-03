# Database Configuration

This document describes the database setup for **local open-source usage**.

## Overview

The application uses **SQLite** with **Prisma ORM** for local storage. No remote database server or account is required — everything runs locally at no extra cost.

## What's Configured

### 1. Prisma Schema (`prisma/schema.prisma`)

- **Provider:** SQLite (single file, no server)
- **Diagram** model: stores diagram metadata (id, userId, title, description, status, metadata JSON, timestamps). **No nodes or edges** are stored.

#### Diagram model: artifact-centric, no graph in DB

**Diagram = metadata + artifacts.** Stored fields: `id`, `userId`, `title`, `description`, `status`, `metadata`, `createdAt`, `updatedAt`. Artifacts live in `metadata.metasop_artifacts`; there is no knowledge graph.

### 2. Prisma Client (`lib/database/prisma.ts`)

- Singleton pattern for Next.js
- Development logging when `NODE_ENV === "development"`
- Resolves relative `DATABASE_URL` paths to absolute file URLs (avoids "Unable to open the database file" on Windows/Next.js)
- Creates the database directory automatically if missing (`prisma/` for `file:./prisma/local.db`)

### 3. NPM Scripts

- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Create/update local SQLite file and tables
- `pnpm db:studio` - Open Prisma Studio GUI

## Setup (Local)

1. Add to `.env` (or copy from `.env.example`):

   ```env
   DATABASE_URL="file:./prisma/local.db"
   ```

2. Run:

   ```bash
   pnpm db:generate
   pnpm db:push
   ```

The file `prisma/local.db` will be created in your project. Add `prisma/*.db` to `.gitignore` if you don't want to commit the database.

## Database Commands

```bash
# Generate Prisma client (after schema changes)
pnpm db:generate

# Create/update local database and tables
pnpm db:push

# Open Prisma Studio (database GUI)
pnpm db:studio
```

## Security Notes

- **Never commit `.env`** if it contains secrets (API keys). `.env` is often in `.gitignore`.
- The SQLite file (`prisma/local.db`) is local to your machine; no network exposure by default.

## Related Documentation

- [SETUP.md](./SETUP.md) - Full setup guide
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues
