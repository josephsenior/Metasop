import path from "node:path";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Cached project root so we resolve it once and reuse. */
let cachedProjectRoot: string | null = null;

/**
 * Resolve project root: prefer cwd if it contains package.json or prisma/schema.prisma,
 * else walk up from __dirname. Safe for Next.js/Turbopack dev (cwd = project root).
 */
function getProjectRoot(): string {
  if (cachedProjectRoot) return cachedProjectRoot;
  const cwd = process.cwd();
  const hasPkg = fs.existsSync(path.join(cwd, "package.json"));
  const hasPrisma = fs.existsSync(path.join(cwd, "prisma", "schema.prisma"));
  if (hasPkg || hasPrisma) {
    cachedProjectRoot = cwd;
    return cwd;
  }
  let dir: string;
  if (typeof __dirname !== "undefined") {
    dir = path.resolve(__dirname);
  } else {
    dir = path.resolve(cwd, "lib", "database");
  }
  const root = path.parse(dir).root;
  while (dir !== root) {
    if (
      fs.existsSync(path.join(dir, "package.json")) ||
      fs.existsSync(path.join(dir, "prisma", "schema.prisma"))
    ) {
      cachedProjectRoot = dir;
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  cachedProjectRoot = cwd;
  return cwd;
}

/** Default SQLite path relative to project root (single source of truth). */
const DEFAULT_DB_PATH = "prisma/local.db";

// Prefer destructuring when repeatedly accessing env vars
const { NODE_ENV, PRISMA_LOG_LEVEL } = process.env;

/** Convert file URL to absolute filesystem path (Windows-safe). */
function fileUrlToPath(fileUrl: string): string {
  try {
    const u = new URL(fileUrl);
    if (u.protocol !== "file:") return path.resolve(fileUrl);
    let p = u.pathname;
    if (p.startsWith("/") && /^\/[A-Za-z]:/.test(p)) p = p.slice(1);
    return path.resolve(p);
  } catch {
    return path.resolve(fileUrl.replace(/^file:\/?/i, "").replace(/^\/([A-Za-z]:)/i, "$1"));
  }
}

/**
 * Resolve DATABASE_URL to an absolute file URL. Never returns undefined.
 * - If env has a non-file URL (e.g. postgres), return it.
 * - If env has absolute file URL, ensure dir exists and return it.
 * - Otherwise use getProjectRoot() + DEFAULT_DB_PATH (ignores env for path).
 */
function resolveDatabaseUrl(): string {
  const { DATABASE_URL: envUrl } = process.env;
  if (envUrl && !envUrl.includes("undefined") && envUrl.trim() !== "") {
    if (!envUrl.startsWith("file:")) {
      return envUrl;
    }
    const absolutePath = fileUrlToPath(envUrl);
    if (path.isAbsolute(absolutePath)) {
      try {
        const dir = path.dirname(absolutePath);
        if (dir) fs.mkdirSync(dir, { recursive: true });
      } catch {
        // fall through to default path
      }
      return envUrl;
    }
  }

  const root = getProjectRoot();
  const absolutePath = path.resolve(root, DEFAULT_DB_PATH);
  try {
    const dir = path.dirname(absolutePath);
    if (dir) fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    if (NODE_ENV === "development") {
      console.warn("[prisma] Could not create prisma dir:", (err as Error).message);
    }
  }
  const resolved = pathToFileURL(absolutePath).href;
  process.env.DATABASE_URL = resolved;
  return resolved;
}

/** Ensure prisma directory exists. Uses same logic as resolveDatabaseUrl for path. */
export function ensureDatabaseDir(): void {
  const url = process.env.DATABASE_URL;
  if (url && url.startsWith("file:")) {
    const absolutePath = fileUrlToPath(url);
    const dir = path.dirname(absolutePath);
    if (dir) fs.mkdirSync(dir, { recursive: true });
    return;
  }
  const root = getProjectRoot();
  const absolutePath = path.resolve(root, DEFAULT_DB_PATH);
  const dir = path.dirname(absolutePath);
  if (dir) fs.mkdirSync(dir, { recursive: true });
}

const resolvedUrl = resolveDatabaseUrl();
if (typeof resolvedUrl !== "string" || resolvedUrl.length === 0) {
  throw new Error("[prisma] resolveDatabaseUrl returned invalid value");
}
ensureDatabaseDir();

/**
 * Production-ready Prisma Client. URL is resolved at load time and never undefined.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : PRISMA_LOG_LEVEL === "debug"
        ? ["error", "warn", "info"]
        : ["error"],
    datasources: {
      db: {
        url: resolvedUrl,
      },
    },
  });

if (NODE_ENV !== "production") globalForPrisma.prisma = prisma;

if (typeof process !== "undefined") {
  const g = global as typeof globalThis & { prismaListenersAdded?: boolean };
  if (!g.prismaListenersAdded) {
    process.on("beforeExit", async () => {
      await prisma.$disconnect();
    });
    process.on("SIGINT", async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
    process.on("SIGTERM", async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
    g.prismaListenersAdded = true;
  }
}

/**
 * Health check for database connection.
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    return { healthy: true, latency };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database connection failed";
    return { healthy: false, error: message };
  }
}

/**
 * Get database connection info (without sensitive data).
 */
export function getDatabaseInfo(): { connected: boolean; database?: string; host?: string; port?: string; url?: string } {
  const url = process.env.DATABASE_URL;
  if (!url) return { connected: false };

  try {
    if (url.startsWith("file:")) {
      return { connected: true, database: "SQLite (local)" };
    }
    const urlObj = new URL(url);
    return {
      connected: true,
      host: urlObj.hostname,
      port: urlObj.port,
      database: urlObj.pathname.slice(1),
    };
  } catch {
    return { connected: true, url: "configured" };
  }
}
