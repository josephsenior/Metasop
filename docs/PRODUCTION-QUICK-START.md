# Production Hardening Quick Start

Quick reference for enabling production hardening features.

## 1. Database Hardening ✅

Already configured! The database now includes:
- Health checks
- Graceful shutdown
- Production-only mode (no in-memory fallback)

**Action Required:** None - works out of the box.

## 2. Rate Limiting ✅

Rate limiting is now integrated into `/api/diagrams/generate`. 

### For Single Instance (Default)
No configuration needed - uses in-memory store.

### For Multiple Instances (Production)
Add Redis:

```env
REDIS_URL="redis://localhost:6379"
# or with SSL
REDIS_URL="rediss://user:password@host:6379"
```

**Note:** Redis is optional. If not configured, rate limiting works with in-memory store (single instance only).

## 3. Monitoring ✅

### Basic Setup (No Configuration)
Logging and metrics work out of the box.

### Optional: Enhanced Monitoring

```env
# Logging
LOG_LEVEL="info"  # debug, info, warn, error, fatal
DISABLE_CONSOLE_LOGS="false"

# Metrics
ENABLE_METRICS="true"
HEALTH_CHECK_INCLUDE_METRICS="false"

# Error Tracking (Optional - requires @sentry/nextjs)
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
```

## 4. Health Check Endpoint

Test your deployment:

```bash
curl http://your-domain.com/api/health
```

Returns:
- `200` - Healthy
- `503` - Unhealthy

## Quick Checklist

- [x] Database hardening (automatic)
- [x] Rate limiting (automatic, Redis optional)
- [x] Monitoring (automatic, Sentry optional)
- [ ] Test health check endpoint
- [ ] Configure Redis (if multi-instance)
- [ ] Set up Sentry (optional)

## Example Production .env.local

```env
# Required
DATABASE_URL="postgresql://..."
NODE_ENV="production"
JWT_SECRET="your-strong-secret"

# Optional but Recommended
REDIS_URL="redis://..."  # For multi-instance rate limiting
LOG_LEVEL="info"
ENABLE_METRICS="true"
SENTRY_DSN="https://..."  # If using Sentry
```

That's it! Your app is production-ready.
