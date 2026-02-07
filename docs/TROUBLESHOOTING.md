# Troubleshooting Guide

This guide helps you resolve common issues when setting up and running the application (local/open-source with SQLite).

## Database (SQLite) Issues

### Error: "Can't reach database server" / "SQLITE_CANTOPEN" (Error code 14)

**For local SQLite (default):**

1. **Ensure `DATABASE_URL` is set** in `.env`:
   ```env
   DATABASE_URL="file:./prisma/local.db"
   ```
2. **Create the database and tables:**
   ```bash
   pnpm db:generate
   pnpm db:push
   ```
3. The app creates the `prisma` directory automatically when using a relative path (`file:./prisma/local.db`). If the error persists, ensure the project root is writable and no other process has the DB file locked.

### Error: "Invalid connection string"

**Fix:**
```env
# Correct (SQLite)
DATABASE_URL="file:./prisma/local.db"

# Wrong
DATABASE_URL = "file:./prisma/local.db"  # Space before =
DATABASE_URL=file:./prisma/local.db     # Missing quotes (if path has spaces)
```

### Reset local database

To start fresh:
```bash
# Delete the SQLite file (e.g. prisma/local.db)
# Then:
pnpm db:push
```

## Environment File Issues

### `.env` not being read

**Check:**
1. File is named `.env` and is in the project root (or `.env.local` for local overrides)
2. No syntax errors (missing quotes, extra spaces)
3. Restart the dev server after changes: `pnpm dev`

## Prisma Issues

### Error: "Prisma Client not generated"

```bash
pnpm db:generate
```

### Error: "Schema validation failed"

Check `prisma/schema.prisma` for syntax errors. Common issues:
- Missing commas
- Incorrect field types
- Invalid relation syntax

### Error: "Migration failed"

1. Use **Direct connection** (port 5432), not pooler (port 6543)
2. For SQLite, ensure `pnpm db:push` has been run
3. Check database password is correct

## Supabase-Specific Issues

### Project Reference Mismatch

Verify the project reference ID in Supabase:
1. Go to **Settings** → **General**
2. Check **Reference ID**
3. Ensure it matches the ID in your connection string

### Connection Pooler vs Direct

- **Pooler** (port 6543): For application connections, not migrations
- **Direct** (port 5432): Required for Prisma migrations

Always use Direct connection for `DATABASE_URL` in `.env.local`.

### Project Paused

Free tier projects pause after inactivity:
1. Go to Supabase dashboard
2. Click "Resume" or "Restore"
3. Wait 1-2 minutes for restart
4. Retry connection

## Network Issues

### Firewall blocking connections

- Check Windows Firewall settings
- Temporarily disable antivirus to test
- Ensure port 5432 (PostgreSQL) is allowed

### DNS resolution issues

If hostname can't be resolved:
1. Verify project is Active in Supabase
2. Check connection string hostname matches Supabase dashboard
3. Try using IP address (if available in Supabase)

## Alternative Solutions

### Use Supabase CLI

If direct connection doesn't work:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Push schema
supabase db push
```

### Use Pooler with SSL

For application connections (not migrations), you can try:

```env
DATABASE_URL="postgresql://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require"
```

**Note:** This won't work for migrations. Use Direct connection for `db:push`.

## Build: `pnpm build` fails with EPERM symlink (Windows)

If `pnpm build` fails on Windows with an error like:

- `EPERM: operation not permitted, symlink ... -> .next/standalone/...`

This typically happens because Next.js standalone output (`output: 'standalone'` in `next.config.mjs`) uses symlinks when assembling `.next/standalone`, and Windows requires elevated permissions unless **Developer Mode** is enabled.

**Fix options (try in order):**

1. **Enable Windows Developer Mode (recommended)**
   - Windows Settings → Privacy & security → For developers → **Developer Mode**
   - Restart your terminal/editor and re-run `pnpm build`

2. **Run your terminal as Administrator**
   - Open PowerShell/Terminal “Run as administrator”
   - Re-run `pnpm build`

3. **Disable standalone output for local Windows builds (workaround)**
   - Run the build with standalone disabled:
     - PowerShell: ` $env:NEXT_DISABLE_STANDALONE = "1"; pnpm build `
     - cmd.exe: ` set NEXT_DISABLE_STANDALONE=1 && pnpm build `
   - Or, if you prefer, you can remove/conditionally disable `output: 'standalone'` in `next.config.mjs` for your local environment.

If you’re contributing on Windows and CI/build is part of your workflow, enabling Developer Mode is usually the smoothest path.

## Tests: spawn EPERM in Cursor terminal

If `pnpm test` fails with **Error: spawn EPERM** (common in Cursor's integrated terminal on Windows), the terminal sandbox is blocking child processes that Vitest/esbuild use.

**Options (try in order):**

1. **Use legacy terminal mode (recommended for this workspace)**  
   The project includes `.vscode/settings.json` with `"experimental.legacyTerminalMode": true` so the integrated terminal may run without the sandbox. Reload the window (Ctrl+Shift+P → "Developer: Reload Window") after opening the project, then run `pnpm test` again.

2. **Run tests from an external terminal**  
   Open PowerShell or Command Prompt, `cd` to the project root, and run:
   ```bash
   pnpm test
   ```
   This avoids Cursor's sandbox entirely.

3. **Windows Defender / antivirus**  
   If EPERM persists, add the project folder to your antivirus exclusions; some tools block Node from spawning subprocesses.

## Getting Help

If issues persist:

1. Check Supabase dashboard for project status
2. Review Supabase logs (Settings → Logs)
3. Verify connection string format matches Supabase exactly
4. Test with a simple connection tool (psql, DBeaver, etc.)

## Related Documentation

- [SETUP.md](./SETUP.md) - Initial setup guide
- [DATABASE.md](./DATABASE.md) - Database configuration details
- [API.md](./API.md) - API documentation

