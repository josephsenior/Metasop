/**
 * Health check endpoint for monitoring and load balancers
 * GET /api/health
 */

import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/database/prisma";
import { metrics } from "@/lib/monitoring/metrics";
import { logger } from "@/lib/monitoring/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  const health: {
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    uptime: number;
    services: {
      database: {
        status: "healthy" | "unhealthy";
        latency?: number;
        error?: string;
      };
      memory: {
        status: "healthy" | "unhealthy";
        used: number;
        total: number;
        percentage: number;
      };
    };
    metrics?: {
      counters: Record<string, number>;
      histograms: Record<string, any>;
    };
  } = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: { status: "unhealthy" },
      memory: { status: "unhealthy", used: 0, total: 0, percentage: 0 },
    },
  };

  // Check database
  try {
    const dbHealth = await checkDatabaseHealth();
    health.services.database = {
      status: dbHealth.healthy ? "healthy" : "unhealthy",
      latency: dbHealth.latency,
      error: dbHealth.error,
    };

    if (!dbHealth.healthy) {
      health.status = "unhealthy";
    }
  } catch (error: any) {
    logger.error("Health check: Database check failed", error);
    health.services.database = {
      status: "unhealthy",
      error: error.message,
    };
    health.status = "unhealthy";
  }

  // Check memory
  try {
    const memUsage = process.memoryUsage();
    const used = memUsage.heapUsed;
    const total = memUsage.heapTotal;
    const percentage = (used / total) * 100;
    const isHealthy = percentage < 90; // Consider unhealthy if >90% memory used

    health.services.memory = {
      status: isHealthy ? "healthy" : "unhealthy",
      used: Math.round(used / 1024 / 1024), // MB
      total: Math.round(total / 1024 / 1024), // MB
      percentage: Math.round(percentage * 100) / 100,
    };

    if (!isHealthy) {
      health.status = health.status === "unhealthy" ? "unhealthy" : "degraded";
    }
  } catch (error: any) {
    logger.error("Health check: Memory check failed", error);
    health.status = "unhealthy";
  }

  // Include metrics if requested
  const includeMetrics = process.env.HEALTH_CHECK_INCLUDE_METRICS === "true";
  if (includeMetrics) {
    health.metrics = metrics.getAllMetrics();
  }

  const responseTime = Date.now() - startTime;
  metrics.timing("health_check.response_time", responseTime);

  const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
