/**
 * Production-ready rate limiting middleware
 * Supports both in-memory (development) and Redis (production) stores
 */

import { NextRequest, NextResponse } from "next/server";

export interface RateLimitConfig {
  /** Maximum number of requests */
  max: number;
  /** Time window in seconds */
  window: number;
  /** Identifier function - returns a unique key for rate limiting */
  identifier: (request: NextRequest) => string | Promise<string>;
  /** Custom error message */
  message?: string;
  /** Whether to skip rate limiting for authenticated users */
  skipIfAuthenticated?: boolean;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

/**
 * In-memory rate limit store (for development/single-instance)
 * In production with multiple instances, use Redis instead
 */
class InMemoryRateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.store.entries()) {
        if (value.resetTime < now) {
          this.store.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    // Check if expired
    if (entry.resetTime < Date.now()) {
      this.store.delete(key);
      return null;
    }
    
    return entry;
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const entry = this.store.get(key);
    const now = Date.now();
    
    if (!entry || entry.resetTime < now) {
      // Create new entry
      const newEntry = {
        count: 1,
        resetTime: now + windowMs,
      };
      this.store.set(key, newEntry);
      return newEntry;
    }
    
    // Increment existing entry
    entry.count++;
    this.store.set(key, entry);
    return entry;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Singleton instance
const inMemoryStore = new InMemoryRateLimitStore();

/**
 * Redis rate limit store (for production with multiple instances)
 * Requires REDIS_URL environment variable
 */
class RedisRateLimitStore {
  private redis: any = null;
  private initialized = false;

  async init() {
    if (this.initialized) return this.redis !== null;
    
    try {
      // Dynamic import to avoid requiring redis in development
      // Suppress module not found errors - it's expected if ioredis isn't installed
      let Redis;
      try {
        const redisModule = await import("ioredis");
        Redis = redisModule.default;
      } catch (importError: any) {
        if (importError.code === "MODULE_NOT_FOUND" || importError.message?.includes("Cannot find module")) {
          // ioredis not installed - this is fine, we'll use in-memory
          return false;
        }
        throw importError;
      }
      
      const redisUrl = process.env.REDIS_URL;
      
      if (!redisUrl) {
        // No REDIS_URL configured - use in-memory (this is normal for single-instance deployments)
        return false;
      }

      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      this.redis.on("error", (err: Error) => {
        console.error("[RateLimit] Redis error:", err);
      });

      this.initialized = true;
      return true;
    } catch (error: any) {
      // Only log if it's not a "module not found" error
      if (error.code !== "MODULE_NOT_FOUND" && !error.message?.includes("Cannot find module")) {
        console.warn("[RateLimit] Redis initialization failed, using in-memory store:", error.message);
      }
      return false;
    }
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    if (!this.redis) return null;
    
    try {
      const data = await this.redis.get(key);
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      if (parsed.resetTime < Date.now()) {
        await this.redis.del(key);
        return null;
      }
      
      return parsed;
    } catch {
      return null;
    }
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    if (!this.redis) {
      // Don't throw - let the caller handle fallback
      throw new Error("Redis not initialized - use in-memory store instead");
    }

    const now = Date.now();
    const resetTime = now + windowMs;
    
    try {
      const data = await this.redis.get(key);
      
      if (!data) {
        const newEntry = { count: 1, resetTime };
        await this.redis.setex(key, Math.ceil(windowMs / 1000), JSON.stringify(newEntry));
        return newEntry;
      }
      
      const entry = JSON.parse(data);
      if (entry.resetTime < now) {
        const newEntry = { count: 1, resetTime };
        await this.redis.setex(key, Math.ceil(windowMs / 1000), JSON.stringify(newEntry));
        return newEntry;
      }
      
      entry.count++;
      await this.redis.setex(key, Math.ceil((entry.resetTime - now) / 1000), JSON.stringify(entry));
      return entry;
    } catch (error) {
      console.error("[RateLimit] Redis increment error:", error);
      throw error;
    }
  }

  async reset(key: string): Promise<void> {
    if (this.redis) {
      await this.redis.del(key);
    }
  }
}

// Use Redis in production if available, otherwise in-memory
const redisStore = new RedisRateLimitStore();
let storeInitialized = false;
let useRedisStore = false;

async function getStore() {
  if (!storeInitialized) {
    try {
      const useRedis = await redisStore.init();
      storeInitialized = true;
      useRedisStore = useRedis === true;
      
      if (!useRedisStore) {
        return inMemoryStore;
      }
      
      // Verify Redis is actually working
      try {
        await redisStore.get("__health_check__");
        return redisStore;
      } catch {
        console.warn("[RateLimit] Redis health check failed, falling back to in-memory");
        useRedisStore = false;
        return inMemoryStore;
      }
    } catch (error) {
      console.warn("[RateLimit] Redis initialization error, using in-memory store:", error);
      storeInitialized = true;
      useRedisStore = false;
      return inMemoryStore;
    }
  }
  
  // Return the appropriate store based on initialization result
  return useRedisStore ? redisStore : inMemoryStore;
}

/**
 * Default identifier: uses IP address
 */
export function getDefaultIdentifier(request: NextRequest): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  // Fallback to a default identifier
  return "unknown";
}

/**
 * Rate limit middleware
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<RateLimitResult | NextResponse> {
  // Skip if authenticated and configured to do so
  if (config.skipIfAuthenticated) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      return {
        success: true,
        limit: config.max,
        remaining: config.max,
        reset: Date.now() + config.window * 1000,
      };
    }
  }

  const identifier = await config.identifier(request);
  const key = `ratelimit:${identifier}`;
  const windowMs = config.window * 1000;

  let store;
  let entry;
  
  try {
    store = await getStore();
    entry = await store.increment(key, windowMs);
  } catch (error: any) {
    // If Redis store fails, fallback to in-memory
    if (error.message?.includes("Redis not initialized")) {
      console.warn("[RateLimit] Redis store failed, using in-memory fallback");
      entry = await inMemoryStore.increment(key, windowMs);
    } else {
      throw error;
    }
  }

  const remaining = Math.max(0, config.max - entry.count);
  const reset = entry.resetTime;
  const success = entry.count <= config.max;

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: config.message || `Rate limit exceeded. Please try again after ${retryAfter} seconds.`,
          retryAfter,
        },
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": config.max.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": reset.toString(),
          "Retry-After": retryAfter.toString(),
        },
      }
    );
  }

  return {
    success: true,
    limit: config.max,
    remaining,
    reset,
  };
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  /** Strict rate limit: 10 requests per minute */
  strict: (identifier?: (req: NextRequest) => string | Promise<string>) => ({
    max: 10,
    window: 60,
    identifier: identifier || getDefaultIdentifier,
    message: "Too many requests. Please slow down.",
  }),

  /** Standard rate limit: 60 requests per minute */
  standard: (identifier?: (req: NextRequest) => string | Promise<string>) => ({
    max: 60,
    window: 60,
    identifier: identifier || getDefaultIdentifier,
    message: "Rate limit exceeded. Please try again later.",
  }),

  /** Generous rate limit: 100 requests per minute */
  generous: (identifier?: (req: NextRequest) => string | Promise<string>) => ({
    max: 100,
    window: 60,
    identifier: identifier || getDefaultIdentifier,
    message: "Rate limit exceeded. Please try again later.",
  }),

  /** API rate limit: 1000 requests per hour */
  api: (identifier?: (req: NextRequest) => string | Promise<string>) => ({
    max: 1000,
    window: 3600,
    identifier: identifier || getDefaultIdentifier,
    message: "API rate limit exceeded. Please upgrade your plan.",
    skipIfAuthenticated: true,
  }),

  /** Diagram generation: 5 requests per hour (expensive operation) */
  diagramGeneration: (identifier?: (req: NextRequest) => string | Promise<string>) => ({
    max: 5,
    window: 3600,
    identifier: identifier || getDefaultIdentifier,
    message: "Too many diagram generation requests. Please wait before trying again.",
  }),
};

/**
 * Helper to add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set("X-RateLimit-Limit", result.limit.toString());
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  response.headers.set("X-RateLimit-Reset", result.reset.toString());
  
  if (result.retryAfter) {
    response.headers.set("Retry-After", result.retryAfter.toString());
  }
  
  return response;
}
