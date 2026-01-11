# Database Configuration

This document describes the database setup and configuration using PostgreSQL with Prisma ORM.

## Overview

The application uses **PostgreSQL** as the database, managed through **Prisma ORM**. The database can be hosted on Supabase (recommended) or Neon.

## What's Configured

### 1. Prisma Schema (`prisma/schema.prisma`)

- `User` model with all required fields
- `ResetToken` model for password reset functionality
- PostgreSQL configuration

### 2. Prisma Client (`lib/prisma.ts`)

- Prisma instance configured for Next.js
- Singleton pattern to avoid multiple connections
- Development logging enabled

### 3. Data Layer (`lib/auth/db.ts`)

- Complete migration from in-memory database to PostgreSQL
- All functions now use Prisma
- Password hashing with bcrypt

### 4. NPM Scripts

- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema to database (development)
- `pnpm db:migrate` - Create migration (production)
- `pnpm db:studio` - Open Prisma Studio GUI

## Setup

See [SETUP.md](./SETUP.md) for complete setup instructions.

### Quick Setup

1. Create a Supabase or Neon account
2. Get your connection string
3. Add to `.env.local`:
   ```env
   DATABASE_URL="postgresql://..."
   ```
4. Run:
   ```bash
   pnpm db:push
   ```

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

## Migration from In-Memory Database

Data from the in-memory database will be lost. This is expected as it was temporary. New users will be stored permanently in PostgreSQL.

## Security Notes

⚠️ **IMPORTANT:**

1. **Never commit `.env.local`** (already in `.gitignore`)
2. **Change JWT_SECRET** in production - use a strong, unique secret key
3. **Use strong passwords** for database access
4. **Enable SSL** in production connections
5. **Use connection pooling** for production workloads

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common database connection issues.

## Related Documentation

- [SETUP.md](./SETUP.md) - Complete setup guide
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions
- [Prisma Docs](https://www.prisma.io/docs) - Official Prisma documentation
