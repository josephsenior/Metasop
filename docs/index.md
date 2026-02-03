# MetaSOP Documentation

Complete documentation index for MetaSOP - Multi-Agent Orchestration Platform.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### Installation & Setup

- **[Quick Start Guide](../README.md#-quick-start)** - Get up and running in 5 minutes
- **[Setup Guide](SETUP.md)** - Complete setup with database configuration
- **[Environment Variables](SETUP.md#environment-variables)** - All configuration options

### First Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/josephsenior/Metasop.git
   cd Metasop
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with GOOGLE_AI_API_KEY and DATABASE_URL (see SETUP.md)
   ```

4. **Initialize database**
   ```bash
   pnpm db:generate
   pnpm db:push
   ```

5. **Start development**
   ```bash
   pnpm dev
   ```

---

## 🏗️ Architecture

### System Overview

- **[Architecture Overview](ARCHITECTURE.md)** - Complete system architecture and design
- **[Agent System](ARCHITECTURE.md#agents)** - Multi-agent orchestration

### Core Components

| Component | Description | Location |
|-----------|-------------|----------|
| **Orchestrator** | Coordinates agent execution | [`lib/metasop/orchestrator.ts`](../lib/metasop/orchestrator.ts) |
| **Execution Service** | Handles timeouts and retries | [`lib/metasop/services/execution-service.ts`](../lib/metasop/services/execution-service.ts) |
| **Agents** | Specialized AI agents | [`lib/metasop/agents/`](../lib/metasop/agents/) |
| **LLM Adapter** | Abstracts LLM providers | [`lib/metasop/adapters/`](../lib/metasop/adapters/) |

### Data Flow

```
User Request → Orchestrator → Agents → LLM → Artifacts
```

---

## 📚 API Reference

### REST API

- **[API Documentation](API.md)** - Complete API reference with examples

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/diagrams` | POST | Create new diagram |
| `/api/diagrams/:id` | GET | Get diagram details |
| `/api/diagrams/:id/orchestration` | POST | Start orchestration |
| `/api/diagrams/artifacts/edit` | POST | Edit artifacts (tool-based) |
| `/api/health` | GET | Health check |

### Authentication

Most endpoints require authentication. See [API Authentication](API.md#authentication) for details.

---

## 💻 Development

### Testing

- **[Testing Guide](TESTING.md)** - Comprehensive testing documentation
- **[Test Commands](TESTING.md#commands)** - Run tests with coverage

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

### Code Quality

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint
pnpm lint:fix
```

### Contributing

- **[Contributing Guide](../CONTRIBUTING.md)** - How to contribute
- **[Code of Conduct](../CODE_OF_CONDUCT.md)** - Community guidelines

---

## 🚀 Deployment

### Deployment Options

- **[Deployment Guide](DEPLOYMENT.md)** - Complete deployment instructions

### Quick Deploy

#### Vercel (Recommended)

```bash
npm i -g vercel
vercel login
vercel --prod
```

#### Docker

```bash
docker build -t metasop:latest .
docker run -d -p 3000:3000 --env-file .env.production metasop:latest
```

#### VPS

See [Deployment Guide](DEPLOYMENT.md#option-4-vps-digitalocean-aws-etc) for detailed VPS setup.

### Environment Variables

Required for production (local/open-source):

```env
NODE_ENV=production
DATABASE_URL=file:./prisma/local.db
GOOGLE_AI_API_KEY=your-api-key
```

---

## 🔧 Troubleshooting

### Common Issues

- **[Troubleshooting Guide](TROUBLESHOOTING.md)** - Common problems and solutions

### Quick Fixes

#### Database (SQLite)

```bash
# Ensure DATABASE_URL=file:./prisma/local.db in .env
pnpm db:push
# If issues, delete prisma/local.db and run db:push again
```

#### Test Failures

```bash
# If tests fail with "spawn EPERM" (Windows/Cursor)
# Use external terminal or enable legacy terminal mode
```

#### Environment Variables

```bash
# Verify .env.local is in project root
# Restart dev server after changes
pnpm dev
```

### Getting Help

- 📖 Check [Documentation](../README.md)
- 💬 Join [Discord](https://discord.gg/metasop)
- 🐛 Report [Issues](https://github.com/josephsenior/Metasop/issues)

---

## 📖 Additional Resources

### Guides

- **[Migration Guide](MIGRATION-GUIDE.md)** - Migrating from previous versions
- **[Production Quick Start](PRODUCTION-QUICK-START.md)** - Production deployment checklist
- **[Production Quality Guide](PRODUCTION-QUALITY-GUIDE.md)** - Quality improvement strategies

### Reference

- **[Database Schema](DATABASE.md)** - Database structure and relationships
- **[TypeScript vs Python](TYPESCRIPT-VS-PYTHON.md)** - Language comparison
- **[Token Factory](TOKEN-FACTORY.md)** - LLM token management

### Open Source

- **[Open Source Strategy](OPEN-SOURCE-STRATEGY.md)** - Open source approach
- **[Open Source FAQs](OPEN-SOURCE-FAQs.md)** - Common questions
- **[Open Source Launch Checklist](OPEN-SOURCE-LAUNCH-CHECKLIST.md)** - Launch preparation

---

## 🎓 Learning Path

### Beginner

1. Read [Quick Start](../README.md#-quick-start)
2. Follow [Setup Guide](SETUP.md)
3. Explore [Architecture Overview](ARCHITECTURE.md)
4. Try the [API](API.md)

### Intermediate

1. Learn [Agent System](ARCHITECTURE.md#agents)
2. Review [Testing Guide](TESTING.md)
3. Build [Custom Agents](../CONTRIBUTING.md#building-custom-agents)

### Advanced

1. Study [Deployment Guide](DEPLOYMENT.md)
2. Explore [Production Hardening](PRODUCTION-HARDENING.md)
3. Contribute to [Core Code](../CONTRIBUTING.md)
4. Review [Security Best Practices](../SECURITY.md)

---

## 🆘 Support

### Documentation

- 📖 [README](../README.md) - Main project documentation
- 📚 [Support](../SUPPORT.md) - Support resources and community
- 🗺️ [Roadmap](../ROADMAP.md) - Planned features

### Community

- 💬 [Discord](https://discord.gg/metasop) - Real-time chat
- 🐦 [Twitter](https://twitter.com/MetaSOP_AI) - Latest updates
- 💡 [GitHub Discussions](https://github.com/josephsenior/Metasop/discussions) - Q&A

### Issues

- 🐛 [Report a Bug](https://github.com/josephsenior/Metasop/issues/new?template=bug_report.md)
- 💡 [Request a Feature](https://github.com/josephsenior/Metasop/issues/new?template=feature_request.md)

---

## 📝 Changelog

See [CHANGELOG.md](../CHANGELOG.md) for version history and release notes.

---

**Last Updated**: January 2025
