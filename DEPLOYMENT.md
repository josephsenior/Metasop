# Deployment Guide

This guide provides instructions for deploying MetaSOP in a production environment.

## 🚀 Deployment Options

### 1. Docker (Recommended)

The easiest way to deploy MetaSOP is using Docker.

#### Build the image
```bash
docker build -t metasop .
```

#### Run the container
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="your_db_url" \
  -e GOOGLE_AI_API_KEY="your_api_key" \
  -e JWT_SECRET="your_secret" \
  metasop
```

### 2. Vercel (Next.js)

MetaSOP is built with Next.js and can be easily deployed to Vercel.

1. Connect your repository to Vercel.
2. Add the required environment variables in the Vercel dashboard.
3. Vercel will automatically detect the Next.js project and deploy it.

## ⚙️ Environment Variables

Ensure the following environment variables are set in your production environment:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `GOOGLE_AI_API_KEY` | Gemini API Key | `AIza...` |
| `JWT_SECRET` | Secret for signing JWT tokens | `your-long-random-secret` |
| `NODE_ENV` | Environment mode | `production` |

## 🗄️ Database Setup

Before running the application, you need to set up the database schema:

```bash
# Generate Prisma Client
pnpm db:generate

# Push schema to database
pnpm db:push
```

## 🔐 Security Considerations

- Always use a strong `JWT_SECRET` in production.
- Ensure your database is not publicly accessible.
- Use HTTPS for all communications.
- Rotate your API keys regularly.
