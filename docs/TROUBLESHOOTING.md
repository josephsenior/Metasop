# Troubleshooting Guide

This guide helps you resolve common issues when setting up and running the application.

## Database Connection Issues

### Error: "Can't reach database server"

**Possible causes:**

1. **Project is paused**
   - Go to [app.supabase.com](https://app.supabase.com)
   - Check project status
   - If paused, click "Resume" and wait 1-2 minutes

2. **Wrong connection string format**
   - Ensure you're using **Direct connection** (port 5432) for migrations
   - Remove brackets around password: `[password]` → `password`
   - Verify quotes around the connection string in `.env.local`

3. **Incorrect password**
   - Verify the password matches what you set when creating the project
   - Check for special characters that might need URL encoding

**Solution:**
```env
# Correct format
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
```

### Error: "Connection refused"

**Check:**
1. Project status in Supabase dashboard (must be Active)
2. Firewall/antivirus isn't blocking port 5432
3. Connection string is exactly as shown in Supabase (Settings → Database → Direct connection)

**Test connection:**
```bash
# If you have psql installed
psql "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"
```

### Error: "Invalid connection string"

**Common issues:**
- Missing quotes around connection string
- Spaces before/after `=`
- Incomplete connection string copied

**Fix:**
```env
# Correct
DATABASE_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"

# Wrong
DATABASE_URL = "postgresql://..."  # Space before =
DATABASE_URL=postgresql://...      # Missing quotes
```

### Error: "Database does not exist"

- For Supabase: Use `postgres` as the database name (default)
- For Neon: Use `neondb` or `main` as the database name

## Environment File Issues

### `.env.local` not being read

**Check:**
1. File is named exactly `.env.local` (not `.env.local.txt`)
2. File is in the project root directory
3. No syntax errors (missing quotes, extra spaces)

**Restart dev server after changes:**
```bash
# Stop server (Ctrl+C)
pnpm dev
```

### Password with special characters

If your password contains special characters, you may need to URL-encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`

Or change your database password to one without special characters.

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
2. Ensure project is Active in Supabase
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

