# Deployment Guide

This guide covers deploying Blueprinta to production environments.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Deployment Options](#deployment-options)
- [Configuration](#configuration)
- [Monitoring](#monitoring)
- [Scaling](#scaling)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying Blueprinta, ensure you have:

- **Node.js** 18+ installed
- **pnpm** package manager
- **Domain name** (for production)
- **SSL certificate** (for HTTPS)
- **Database** (PostgreSQL recommended)
- **Redis** (for caching, optional)
- **Gemini API Key** (or other LLM provider)

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/josephsenior/Metasop.git
cd Metasop
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

Create a `.env.production` file:

```env
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/Blueprinta

# Authentication
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key-here

# LLM Provider
GOOGLE_AI_API_KEY=your-gemini-api-key
METASOP_LLM_PROVIDER=gemini
METASOP_LLM_MODEL=gemini-1.5-pro-latest

# Redis (optional)
REDIS_URL=redis://user:password@host:6379

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

### 4. Initialize Database

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Run migrations
pnpm db:migrate
```

---

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications.

#### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

#### Step 3: Deploy

```bash
vercel --prod
```

#### Step 4: Configure Environment Variables

Go to Vercel dashboard > Project > Settings > Environment Variables and add all variables from `.env.production`.

#### Step 5: Set Up Database

Use a managed PostgreSQL service:

- [Vercel Postgres](https://vercel.com/postgres)
- [Neon](https://neon.tech)
- [Supabase](https://supabase.com)

Update `DATABASE_URL` in Vercel environment variables.

#### Step 6: Run Migrations

```bash
vercel env pull .env.production
pnpm db:push
```

---

### Option 2: Railway

Railway provides a simple deployment platform with built-in database.

#### Step 1: Install Railway CLI

```bash
npm i -g @railway/cli
```

#### Step 2: Login

```bash
railway login
```

#### Step 3: Initialize Project

```bash
railway init
```

#### Step 4: Add Services

```bash
# Add PostgreSQL database
railway add postgresql

# Add Redis (optional)
railway add redis
```

#### Step 5: Deploy

```bash
railway up
```

#### Step 6: Configure Environment

Railway automatically injects database URLs. Add remaining variables in Railway dashboard.

---

### Option 3: Docker

Deploy using Docker containers for maximum control.

#### Step 1: Build Docker Image

```bash
docker build -t metasop:latest .
```

#### Step 2: Run Container

```bash
docker run -d \
  --name Blueprinta \
  -p 3000:3000 \
  --env-file .env.production \
  metasop:latest
```

#### Step 3: Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/Blueprinta
      - GOOGLE_AI_API_KEY=${GOOGLE_AI_API_KEY}
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=Blueprinta
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

Run with:

```bash
docker-compose up -d
```

---

### Option 4: VPS (DigitalOcean, AWS, etc.)

Deploy to a virtual private server for full control.

#### Step 1: Connect to Server

```bash
ssh user@your-server-ip
```

#### Step 2: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2 (process manager)
npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt install -y nginx
```

#### Step 3: Clone Repository

```bash
cd /var/www
git clone https://github.com/josephsenior/Metasop.git
cd Metasop
```

#### Step 4: Install Dependencies

```bash
pnpm install
```

#### Step 5: Build Application

```bash
pnpm build
```

#### Step 6: Set Up Database

Install PostgreSQL:

```bash
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql
```

Create database:

```sql
CREATE DATABASE Blueprinta;
CREATE USER metasop_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE Blueprinta TO metasop_user;
\q
```

Run migrations:

```bash
pnpm db:push
```

#### Step 7: Configure PM2

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'Blueprinta',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/Blueprinta',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: 'postgresql://metasop_user:password@localhost:5432/Blueprinta',
      GOOGLE_AI_API_KEY: 'your-api-key',
    },
    instances: 'max',
    exec_mode: 'cluster',
  }]
};
```

Start application:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Step 8: Configure Nginx

Create `/etc/nginx/sites-available/Blueprinta`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/Blueprinta /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 9: Set Up SSL

Use Certbot for free SSL:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Configuration

### Database Configuration

#### PostgreSQL

```env
DATABASE_URL=postgresql://user:password@host:5432/Blueprinta?schema=public
```

#### Connection Pooling

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Connection pool
  connection_limit = 10
}
```

### Redis Configuration

```env
REDIS_URL=redis://user:password@host:6379
```

Enable caching in config:

```typescript
// lib/metasop/config.ts
performance: {
  cacheEnabled: true,
  maxRefinementDepth: 3,
  maxCascadeRipples: 10,
}
```

### LLM Provider Configuration

#### Gemini

```env
GOOGLE_AI_API_KEY=your-api-key
METASOP_LLM_PROVIDER=gemini
METASOP_LLM_MODEL=gemini-1.5-pro-latest
```

#### OpenAI (future)

```env
OPENAI_API_KEY=your-api-key
METASOP_LLM_PROVIDER=openai
METASOP_LLM_MODEL=gpt-4
```

---

## Monitoring

### Application Monitoring

#### Sentry

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

```env
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=production
```

#### Logging

Configure log levels:

```env
LOG_LEVEL=info
```

Access logs:

```bash
# PM2 logs
pm2 logs Blueprinta

# Docker logs
docker logs Blueprinta

# Application logs
tail -f /var/www/Blueprinta/logs/app.log
```

### Database Monitoring

#### Prisma Studio

```bash
pnpm db:studio
```

#### Query Performance

```sql
-- Slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Server Monitoring

#### System Resources

```bash
# CPU and memory
htop

# Disk usage
df -h

# Network connections
netstat -tulpn
```

#### Uptime Monitoring

Use services like:
- [UptimeRobot](https://uptimerobot.com)
- [Pingdom](https://www.pingdom.com)
- [StatusCake](https://www.statuscake.com)

---

## Scaling

### Horizontal Scaling

#### Load Balancing with Nginx

```nginx
upstream metasop_backend {
    server 10.0.0.1:3000;
    server 10.0.0.2:3000;
    server 10.0.0.3:3000;
}

server {
    location / {
        proxy_pass http://metasop_backend;
    }
}
```

#### Kubernetes Deployment

Create `deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: Blueprinta
spec:
  replicas: 3
  selector:
    matchLabels:
      app: Blueprinta
  template:
    metadata:
      labels:
        app: Blueprinta
    spec:
      containers:
      - name: Blueprinta
        image: metasop:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: Blueprinta-secrets
              key: database-url
```

### Vertical Scaling

#### Increase Resources

```bash
# PM2 instances
pm2 scale Blueprinta 4

# Docker resources
docker run -d \
  --cpus="2.0" \
  --memory="4g" \
  metasop:latest
```

#### Database Scaling

```sql
-- Increase connection pool
ALTER SYSTEM SET max_connections = 100;

-- Increase shared buffers
ALTER SYSTEM SET shared_buffers = '256MB';

-- Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## Troubleshooting

### Common Issues

#### Application Won't Start

**Problem**: Application fails to start

**Solution**:
```bash
# Check logs
pm2 logs Blueprinta

# Check port availability
netstat -tulpn | grep 3000

# Check environment variables
pm2 env 0
```

#### Database Connection Failed

**Problem**: Cannot connect to database

**Solution**:
```bash
# Test connection
psql -U user -h host -d Blueprinta

# Check DATABASE_URL
echo $DATABASE_URL

# Check PostgreSQL status
sudo systemctl status postgresql
```

#### Out of Memory

**Problem**: Application crashes due to memory

**Solution**:
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" pm2 restart Blueprinta

# Check memory usage
free -h

# Monitor memory
pm2 monit
```

#### Slow Performance

**Problem**: Application is slow

**Solution**:
```bash
# Enable caching
METASOP_CACHE_ENABLED=true

# Check database queries
pnpm db:studio

# Profile application
npm run build -- --profile
```

---

## Security Best Practices

### 1. Keep Dependencies Updated

```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update

# Fix vulnerabilities
npm audit fix
```

### 2. Use Environment Variables

Never commit secrets to version control:

```gitignore
.env
.env.local
.env.production
.env.*.local
```

### 3. Enable HTTPS

Always use SSL/TLS in production:

```nginx
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
}
```

### 4. Implement Rate Limiting

```typescript
// middleware.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

### 5. Regular Backups

```bash
# Database backup
pg_dump -U user Blueprinta > backup.sql

# Automated backup
0 2 * * * pg_dump -U user Blueprinta > /backups/METASOP_$(date +\%Y\%m\%d).sql
```

---

## Backup and Recovery

### Database Backup

```bash
# Manual backup
pg_dump -U user -h host Blueprinta > backup.sql

# Restore
psql -U user -h host Blueprinta < backup.sql
```

### Application Backup

```bash
# Backup code
tar -czf Blueprinta-backup.tar.gz /var/www/Blueprinta

# Backup environment
cp .env.production .env.production.backup
```

---

**Last Updated**: January 2025
