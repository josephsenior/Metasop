# Setup Guide

This guide covers the complete setup process for the application, including environment configuration and database setup.

## Quick Start (3 Steps)

### Step 1: Get Database Connection String

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project:
   - Choose a name (e.g., `architectai`)
   - **IMPORTANT**: Create a strong database password and **SAVE IT**
   - Select the region closest to you
   - Choose the Free plan
3. Wait for project creation (2-3 minutes)
4. Get the connection string:
   - Go to **Settings** → **Database**
   - Scroll to **Connection string** section
   - Select **Direct connection** (port 5432)
   - Copy the connection string exactly as shown

### Step 2: Create `.env.local`

Create a `.env.local` file in the project root:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
NEXT_PUBLIC_API_URL=http://localhost:3000/api
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
```

**Important:**
- Replace `[YOUR-PASSWORD]` with your actual database password
- Keep the connection string in quotes
- `DIRECT_URL` is optional and not needed initially

### Step 3: Initialize Database

```bash
# Generate Prisma client
pnpm db:generate

# Create database tables
pnpm db:push
```

That's it! Your database is now configured.

## Alternative: Neon Database

If you prefer Neon over Supabase:

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string from the dashboard
4. Add it to `.env.local`:

```env
DATABASE_URL="postgresql://user:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

## Environment Variables

### Required Variables

- `DATABASE_URL`: PostgreSQL connection string
- `NEXT_PUBLIC_API_URL`: API base URL (default: `http://localhost:3000/api`)
- `JWT_SECRET`: Secret key for JWT tokens (change in production!)
- `JWT_EXPIRES_IN`: Token expiration time (default: `7d`)

### Optional Variables

- `DIRECT_URL`: Direct database connection (for migrations, optional)
- `METASOP_LLM_PROVIDER`: LLM provider (e.g., `openai`, `anthropic`, `openrouter`)
- `METASOP_LLM_MODEL`: LLM model name
- `OPENAI_API_KEY`: OpenAI API key (if using OpenAI)
- `ANTHROPIC_API_KEY`: Anthropic API key (if using Anthropic)
- `OPENROUTER_API_KEY`: OpenRouter API key (if using OpenRouter)

## Database Commands

```bash
# Generate Prisma client (after schema changes)
pnpm db:generate

# Push schema to database (development)
pnpm db:push

# Create migration (production)
pnpm db:migrate

# Open Prisma Studio (database GUI)
pnpm db:studio
```

## Verification

To verify everything is working:

```bash
# Open Prisma Studio to view your database
pnpm db:studio
```

This opens a web interface at `http://localhost:5555` where you can view and manage your data.

## Common Issues

### Connection String Format

**Correct format:**
```env
DATABASE_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"
```

**Common mistakes:**
- ❌ Missing quotes around the connection string
- ❌ Brackets around password: `[password]` (remove brackets)
- ❌ Wrong port: using 6543 (pooler) instead of 5432 (direct) for migrations
- ❌ Spaces before/after the `=` sign

### Project Status

If you get connection errors:
1. Check that your Supabase project status is **Active** (not Paused)
2. If paused, click "Resume" and wait 1-2 minutes
3. Verify the connection string is copied exactly from Supabase

### Direct vs Pooler Connection

- **Direct connection** (port 5432): Required for migrations (`db:push`, `db:migrate`)
- **Pooler connection** (port 6543): Can be used for application connections, but not for migrations

For `.env.local`, always use the **Direct connection** string.

## Next Steps

- See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- See [ARCHITECTURE.md](./ARCHITECTURE.md) for system architecture
- See [API.md](./API.md) for API documentation

