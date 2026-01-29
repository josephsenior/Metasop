/**
 * Production-ready structured logging system
 * Supports multiple log levels, structured data, and error tracking integration
 */

type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: {
    userId?: string;
    requestId?: string;
    path?: string;
    method?: string;
    ip?: string;
    userAgent?: string;
  };
}

class StructuredLogger {
  private minLevel: LogLevel;
  private enableConsole: boolean;
  private enableSentry: boolean;

  constructor() {
    // Determine minimum log level from environment
    const envLevel = (process.env.LOG_LEVEL || "info").toLowerCase() as LogLevel;
    const levels: LogLevel[] = ["debug", "info", "warn", "error", "fatal"];
    this.minLevel = levels.includes(envLevel) ? envLevel : "info";

    this.enableConsole = process.env.DISABLE_CONSOLE_LOGS !== "true";
    this.enableSentry = !!process.env.SENTRY_DSN && process.env.NODE_ENV === "production";
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error", "fatal"];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatLog(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level.toUpperCase()}]`,
      entry.message,
    ];

    if (entry.context && Object.keys(entry.context).length > 0) {
      parts.push(JSON.stringify(entry.context));
    }

    if (entry.metadata) {
      const metaParts: string[] = [];
      if (entry.metadata.requestId) metaParts.push(`req=${entry.metadata.requestId}`);
      if (entry.metadata.userId) metaParts.push(`user=${entry.metadata.userId}`);
      if (entry.metadata.path) metaParts.push(`path=${entry.metadata.path}`);
      if (metaParts.length > 0) {
        parts.push(`(${metaParts.join(", ")})`);
      }
    }

    return parts.join(" ");
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
    metadata?: LogEntry["metadata"]
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      metadata,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  private async sendToSentry(entry: LogEntry): Promise<void> {
    if (!this.enableSentry) return;

    try {
      // Dynamic import to avoid requiring @sentry/nextjs in development
      // Use a more robust import that handles module not found gracefully
      const sentryModule = await import("@sentry/nextjs").catch(() => null);
      
      if (!sentryModule) {
        // Sentry not installed, skip silently
        return;
      }
      
      const Sentry = sentryModule;
      
      if (entry.level === "error" || entry.level === "fatal") {
        Sentry.captureException(entry.error || new Error(entry.message), {
          level: entry.level === "fatal" ? "fatal" : "error",
          tags: {
            ...entry.metadata,
          },
          extra: entry.context,
        });
      } else if (entry.level === "warn") {
        Sentry.captureMessage(entry.message, {
          level: "warning",
          tags: entry.metadata,
          extra: entry.context,
        });
      }
    } catch {
      // Silently fail if Sentry is not available or has errors
      // Only log in development to avoid noise
      if (process.env.NODE_ENV === "development") {
        // Suppress the error - it's expected if Sentry isn't installed
      }
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error, metadata?: LogEntry["metadata"]) {
    if (!this.shouldLog(level)) return;

    const entry = this.createEntry(level, message, context, error, metadata);

    // Console output
    if (this.enableConsole) {
      const formatted = this.formatLog(entry);
      const consoleMethod = level === "error" || level === "fatal" ? "error" : 
                           level === "warn" ? "warn" : 
                           level === "debug" ? "debug" : "log";
      
      if (error) {
        console[consoleMethod](formatted, error);
      } else {
        console[consoleMethod](formatted);
      }
    }

    // Send to Sentry in production
    if (this.enableSentry && (level === "error" || level === "warn" || level === "fatal")) {
      this.sendToSentry(entry).catch(() => {
        // Silently fail
      });
    }
  }

  debug(message: string, context?: LogContext, metadata?: LogEntry["metadata"]) {
    this.log("debug", message, context, undefined, metadata);
  }

  info(message: string, context?: LogContext, metadata?: LogEntry["metadata"]) {
    this.log("info", message, context, undefined, metadata);
  }

  warn(message: string, context?: LogContext, metadata?: LogEntry["metadata"]) {
    this.log("warn", message, context, undefined, metadata);
  }

  error(message: string, error?: Error, context?: LogContext, metadata?: LogEntry["metadata"]) {
    this.log("error", message, context, error, metadata);
  }

  fatal(message: string, error?: Error, context?: LogContext, metadata?: LogEntry["metadata"]) {
    this.log("fatal", message, context, error, metadata);
  }

  /**
   * Create a child logger with default metadata
   */
  child(defaultMetadata: LogEntry["metadata"]): StructuredLogger {
    const childLogger = new StructuredLogger();
    const originalLog = childLogger.log.bind(childLogger);
    
    childLogger.log = (level: LogLevel, message: string, context?: LogContext, error?: Error, metadata?: LogEntry["metadata"]) => {
      originalLog(level, message, context, error, { ...defaultMetadata, ...metadata });
    };

    return childLogger;
  }
}

export const logger = new StructuredLogger();

// Re-export for convenience
import type { NextRequest } from "next/server";
export type { LogLevel, LogContext, LogEntry };

/**
 * Request logger middleware helper
 */
export function createRequestLogger(request: NextRequest, requestId?: string) {
  const metadata: LogEntry["metadata"] = {
    requestId: requestId || `req_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    method: request.method,
    path: request.nextUrl.pathname,
    ip: request.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
        request.headers.get("x-real-ip") || 
        "unknown",
    userAgent: request.headers.get("user-agent") || undefined,
  };

  return logger.child(metadata);
}
