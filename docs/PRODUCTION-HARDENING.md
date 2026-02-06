# Production Hardening Guide

This document describes the production hardening features implemented for Blueprinta, including database configuration, rate limiting, and monitoring.

## Overview

The production hardening includes:

1. **Database Hardening**: Connection pooling, health checks, graceful shutdown
2. **Rate Limiting**: Per-endpoint rate limiting with Redis/in-memory support
3. **Monitoring**: Structured logging, metrics collection, error tracking

## Database Hardening

### Features

- ✅ Connection pooling (handled by Prisma/PostgreSQL)
- ✅ Health check endpoint
- ✅ Graceful shutdown handling
- ✅ Production-only mode (no in-memory fallback)
- ✅ Connection retry logic

### Configuration

The database configuration is in `lib/database/prisma.ts`. Key features:

```typescript
// Health check
import { checkDatabaseHealth } from "@/lib/database/prisma";
const health = await checkDatabaseHealth();
// Returns: { healthy: boolean, latency?: number, error?: string }
```

### Environment Variables

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
DIRECT_URL="postgresql://user:password@host:5432/dbname"  # For migrations
```

### Production Checklist

- [ ] Remove in-memory fallback (already disabled in production)
- [ ] Configure connection pooling in your database provider
- [ ] Set up database backups
- [ ] Monitor connection pool usage
- [ ] Set up alerts for connection failures

## Rate Limiting

### Features

- ✅ Per-endpoint rate limiting
- ✅ Redis support (production) and in-memory (development)
- ✅ Different limits for authenticated vs guest users
- ✅ Rate limit headers in responses
- ✅ Configurable rate limiters

### Usage

```typescript
import { rateLimit, rateLimiters } from "@/lib/middleware/rate-limit";

// In API route
const result = await rateLimit(request, rateLimiters.standard());
if (result instanceof NextResponse) {
  return result; // Rate limit exceeded
}
```

### Pre-configured Rate Limiters

- `rateLimiters.strict()` - 10 requests/minute
- `rateLimiters.standard()` - 60 requests/minute
- `rateLimiters.generous()` - 100 requests/minute
- `rateLimiters.api()` - 1000 requests/hour (skips authenticated users)
- `rateLimiters.diagramGeneration()` - 5 requests/hour (expensive operation)

### Custom Rate Limiter

```typescript
const result = await rateLimit(request, {
  max: 100,
  window: 60, // seconds
  identifier: (req) => req.headers.get("x-user-id") || "unknown",
  message: "Custom rate limit message",
  skipIfAuthenticated: true,
});
```

### Redis Configuration (Optional)

For production with multiple instances, use Redis:

1. **Install Redis client** (optional dependency):
```bash
pnpm add ioredis
```

2. **Configure Redis URL**:
```env
REDIS_URL="redis://localhost:6379"
# or
REDIS_URL="rediss://user:password@host:6379"  # SSL
```

**Note:** Redis is completely optional. If `REDIS_URL` is not set or `ioredis` is not installed, the system automatically falls back to in-memory storage (works perfectly for single-instance deployments).

### Rate Limit Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704067200000
Retry-After: 15  # Only when rate limit exceeded
```

## Monitoring

### Structured Logging

The logging system provides structured, production-ready logs with support for Sentry integration.

```typescript
import { logger, createRequestLogger } from "@/lib/monitoring/logger";

// Basic logging
logger.info("User logged in", { userId: "123" });
logger.error("Database query failed", error, { query: "SELECT *" });

// Request logging
const requestLogger = createRequestLogger(request);
requestLogger.info("Processing request", { customField: "value" });
```

### Log Levels

- `debug` - Development only
- `info` - General information
- `warn` - Warnings
- `error` - Errors
- `fatal` - Critical errors

### Environment Configuration

```env
LOG_LEVEL="info"  # debug, info, warn, error, fatal
DISABLE_CONSOLE_LOGS="false"  # Set to true to disable console output
SENTRY_DSN="https://..."  # Optional: Sentry error tracking
```

### Metrics Collection

Track performance and business metrics:

```typescript
import { metrics, MetricNames, trackPerformance } from "@/lib/monitoring/metrics";

// Increment counter
metrics.increment(MetricNames.DIAGRAM_GENERATED, 1, { success: "true" });

// Record timing
metrics.timing(MetricNames.API_RESPONSE_TIME, duration, { endpoint: "diagrams.generate" });

// Track function performance
const result = await trackPerformance(
  () => expensiveOperation(),
  MetricNames.AGENT_EXECUTION_TIME,
  { agent: "architect" }
);
```

### Available Metrics

- `api.request` - API request count
- `api.response_time` - API response time
- `api.error` - API error count
- `agent.execution` - Agent execution count
- `agent.execution_time` - Agent execution time
- `db.query` - Database query count
- `db.query_time` - Database query time
- `rate_limit.hit` - Rate limit hit count
- `rate_limit.exceeded` - Rate limit exceeded count
- `diagram.generated` - Diagrams generated
- `diagram.generation_time` - Diagram generation time

### Metrics Configuration

```env
ENABLE_METRICS="true"  # Set to false to disable metrics collection
```

## Health Check Endpoint

### GET /api/health

Returns system health status:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "services": {
    "database": {
      "status": "healthy",
      "latency": 5
    },
    "memory": {
      "status": "healthy",
      "used": 256,
      "total": 512,
      "percentage": 50
    }
  }
}
```

### Status Codes

- `200` - Healthy or degraded (still operational)
- `503` - Unhealthy (critical services down)

### Include Metrics

Set `HEALTH_CHECK_INCLUDE_METRICS=true` to include metrics in health check response.

## Error Tracking (Sentry)

### Setup

1. Install Sentry:

```bash
pnpm add @sentry/nextjs
```

2. Configure Sentry:

```env
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
SENTRY_ENVIRONMENT="production"
```

3. The logger automatically sends errors to Sentry in production when `SENTRY_DSN` is set.

## Production Checklist

### Database

- [ ] Configure `DATABASE_URL` with production credentials
- [ ] Set up connection pooling (if not using managed service)
- [ ] Configure database backups
- [ ] Set up monitoring for connection pool usage
- [ ] Test health check endpoint

### Rate Limiting

- [ ] Configure Redis (if using multiple instances)
- [ ] Review rate limits for each endpoint
- [ ] Test rate limiting behavior
- [ ] Monitor rate limit hits

### Monitoring

- [ ] Configure `LOG_LEVEL` appropriately
- [ ] Set up Sentry (optional but recommended)
- [ ] Configure log aggregation (e.g., Datadog, LogRocket)
- [ ] Set up alerts for errors
- [ ] Monitor metrics dashboard

### Security

- [ ] Change `JWT_SECRET` to a strong, unique value
- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Review rate limits for security
- [ ] Set up WAF (Web Application Firewall) if needed

### Performance

- [ ] Monitor API response times
- [ ] Monitor database query performance
- [ ] Set up performance alerts
- [ ] Review and optimize slow queries
- [ ] Monitor memory usage

## Example Production Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# Rate Limiting (Optional)
REDIS_URL="rediss://user:password@host:6379"

# Monitoring
LOG_LEVEL="info"
ENABLE_METRICS="true"
HEALTH_CHECK_INCLUDE_METRICS="false"
SENTRY_DSN="https://..."

# Security
JWT_SECRET="your-super-secret-production-key"
NODE_ENV="production"
```

## Troubleshooting

### Database Connection Issues

1. Check `DATABASE_URL` format
2. Verify database is accessible
3. Check connection pool settings
4. Review health check endpoint

### Rate Limiting Not Working

1. Check Redis connection (if using Redis)
2. Verify rate limit configuration
3. Check rate limit headers in responses
4. Review logs for rate limit errors

### Metrics Not Collecting

1. Verify `ENABLE_METRICS` is not set to `false`
2. Check metrics are being called in code
3. Review health check endpoint (if metrics enabled)

## Next Steps

- Set up log aggregation service
- Configure error alerting
- Set up performance monitoring dashboard
- Review and adjust rate limits based on usage
- Set up automated backups
