# Troubleshooting Guide

Common issues and solutions for running Blueprinta locally.

---

## Database (SQLite)

### "Can't reach database server" / SQLITE_CANTOPEN (Error 14)

1. **Ensure `DATABASE_URL` is set** in `.env`:

   ```env
   DATABASE_URL="file:./prisma/local.db"
   ```

2. **Create the database and tables:**

   ```bash
   pnpm db:generate
   pnpm db:push
   ```

3. If the error persists, ensure the project root is writable and no other process has the `.db` file locked.

### "Invalid connection string"

```env
# ✅ Correct
DATABASE_URL="file:./prisma/local.db"

# ❌ Wrong — space before =
DATABASE_URL = "file:./prisma/local.db"

# ❌ Wrong — missing quotes if path has spaces
DATABASE_URL=file:./prisma/local.db
```

### Reset the local database

```bash
# Delete the SQLite file, then re-create
rm prisma/local.db        # or delete manually on Windows
pnpm db:push
```

---

## Prisma

### "Prisma Client not generated"

```bash
pnpm db:generate
```

### "Schema validation failed"

Check `prisma/schema.prisma` for syntax errors — missing commas, incorrect field types, or invalid relations.

---

## Environment Variables

### `.env` not being read

1. Ensure the file is named `.env` (or `.env.local`) and is in the **project root**
2. Check for syntax errors (no spaces around `=`, values in quotes)
3. **Restart the dev server** after any changes:

   ```bash
   pnpm dev
   ```

---

## Build Issues (Windows)

### `pnpm build` fails with EPERM symlink

Next.js standalone output uses symlinks, which Windows restricts without Developer Mode.

**Fixes (in order of preference):**

1. **Enable Developer Mode** — Windows Settings → Privacy & security → For developers → Developer Mode → restart terminal
2. **Run terminal as Administrator**
3. **Disable standalone output** (workaround):

   ```powershell
   $env:NEXT_DISABLE_STANDALONE = "1"; pnpm build
   ```

---

## Tests: spawn EPERM in Cursor terminal

Cursor's integrated terminal sandbox blocks child processes that Vitest/esbuild use.

**Fixes (in order of preference):**

1. **Use legacy terminal mode** — The project includes `.vscode/settings.json` with `"experimental.legacyTerminalMode": true`. Reload the window (`Ctrl+Shift+P` → "Developer: Reload Window"), then retry.
2. **Run tests from an external terminal** — Open PowerShell, `cd` to the project root, and run `pnpm test`.
3. **Antivirus exclusion** — Add the project folder to your antivirus exclusions if EPERM persists.

---

## LLM / API Key Issues

### "Invalid API key" or generation fails

1. Verify your API key is correct in `.env`
2. Ensure the key matches your provider (`GOOGLE_AI_API_KEY` for Gemini, etc.)
3. Restart the dev server after changes
4. Check rate limits on your API key (free tiers have limits)

→ See **[LLM Providers Guide](LLM-PROVIDERS.md)** for full provider configuration.

---

## Network Issues

### Firewall blocking connections

- Check Windows Firewall settings
- Temporarily disable antivirus to test
- Ensure the required port (default: 3000) is not occupied

### Port already in use

```bash
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

---

## Still Stuck?

- 📖 Check the [Setup Guide](SETUP.md) for correct configuration
- 🐛 [Report a bug](https://github.com/josephsenior/Metasop/issues/new?template=bug_report.md)
- 💬 Ask in [GitHub Discussions](https://github.com/josephsenior/Metasop/discussions)
