import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Production-ready Prisma Client with connection pooling and optimized configuration
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" 
      ? ["query", "error", "warn"] 
      : process.env.PRISMA_LOG_LEVEL === "debug"
      ? ["error", "warn", "info"]
      : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Connection pool configuration
    // These are handled by the connection string in production (e.g., Supabase/Neon)
    // For local development, ensure your PostgreSQL has appropriate pool settings
  });

// Graceful shutdown handling
if (typeof process !== "undefined") {
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
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Health check for database connection
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
  } catch (error: any) {
    return {
      healthy: false,
      error: error?.message || "Database connection failed",
    };
  }
}

/**
 * Get database connection info (without sensitive data)
 */
export function getDatabaseInfo() {
  const url = process.env.DATABASE_URL;
  if (!url) return { connected: false };

  try {
    const urlObj = new URL(url);
    return {
      connected: true,
      host: urlObj.hostname,
      port: urlObj.port,
      database: urlObj.pathname.slice(1),
      // Don't expose credentials
    };
  } catch {
    return { connected: true, url: "configured" };
  }
}

