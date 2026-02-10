# Blueprinta Documentation

> **Blueprinta** is a multi-agent orchestration platform that automates the end-to-end software development lifecycle — from requirements to deployment plans — using coordinated AI agents.

---

## 📖 Documentation Map

| Document | What You'll Learn |
|----------|-------------------|
| **[Setup Guide](SETUP.md)** | Install, configure, and run Blueprinta locally |
| **[Architecture](ARCHITECTURE.md)** | System design, agent pipeline, data flow |
| **[API Reference](API.md)** | REST endpoints, request/response formats, auth |
| **[LLM Configuration](LLM-PROVIDERS.md)** | Gemini setup, model selection, mock provider |
| **[Testing](TESTING.md)** | Unit tests, integration tests, CI setup |
| **[Deployment](DEPLOYMENT.md)** | Deploy to Vercel, Docker, VPS + production hardening |
| **[Troubleshooting](TROUBLESHOOTING.md)** | Fix common setup and runtime issues |
| **[Contributing](../CONTRIBUTING.md)** | How to contribute code, docs, or ideas |

---

## ⚡ Quick Start

```bash
# 1. Clone and install
git clone https://github.com/josephsenior/Metasop.git
cd Metasop && pnpm install

# 2. Configure
cp .env.example .env
# Edit .env → add your GOOGLE_AI_API_KEY

# 3. Set up local database (SQLite)
pnpm db:generate && pnpm db:push

# 4. Run
pnpm dev
# Open http://localhost:3000
```

> **Need help?** See [Setup Guide](SETUP.md) for detailed instructions or [Troubleshooting](TROUBLESHOOTING.md) if something goes wrong.

---

## 🏗️ How It Works

Blueprinta runs 7 specialized AI agents **sequentially**, each building on the previous agent's output:

```
User Prompt → PM → Architect → DevOps → Security → UI → Engineer → QA → Artifacts
```

| Agent | Produces |
|-------|----------|
| **Product Manager** | User stories, acceptance criteria |
| **Architect** | API contracts, database schemas, ADRs |
| **DevOps** | CI/CD pipelines, infrastructure-as-code |
| **Security** | Threat model, security controls |
| **UI Designer** | Design tokens, component hierarchy |
| **Engineer** | File structure, implementation plan |
| **QA** | Test strategy, test cases |

All artifacts are stored as structured JSON and can be refined via the [Edit Artifacts API](API.md#edit-artifacts-tool-based).

→ Deep dive: **[Architecture](ARCHITECTURE.md)**

---

## 🔑 Key Features

- **Tool-based refinement** — Edit artifact JSON via ops (`set_at_path`, `add_array_item`) without re-running agents
- **SSE progress streaming** — Real-time generation progress via Server-Sent Events
- **Gemini-powered** — Uses Google Gemini for high-quality structured output with context caching
- **Documentation exports** — Export as Markdown, PDF, HTML, or PPTX
- **Project estimates** — Time, cost, and complexity estimates derived from artifacts
- **Guest support** — Limited generation for non-authenticated users

---

## 🎓 Learning Path

### New to Blueprinta?

1. Follow the **[Setup Guide](SETUP.md)** to get running locally
2. Read the **[Architecture](ARCHITECTURE.md)** to understand how agents work
3. Try the **[API Reference](API.md)** to generate your first diagram

### Ready to contribute?

1. Read the **[Contributing Guide](../CONTRIBUTING.md)**
2. Review the **[Testing Guide](TESTING.md)** to run and write tests
3. Check open [GitHub Issues](https://github.com/josephsenior/Metasop/issues) labeled `good first issue`

### Going to production?

1. Review your **[Gemini configuration](LLM-PROVIDERS.md)**
2. Follow the **[Deployment Guide](DEPLOYMENT.md)** (includes production hardening)

---

## 🆘 Getting Help

- 📖 **[Troubleshooting Guide](TROUBLESHOOTING.md)** — Common issues and fixes
- 🐛 **[Report a Bug](https://github.com/josephsenior/Metasop/issues/new?template=bug_report.md)**
- 💡 **[Request a Feature](https://github.com/josephsenior/Metasop/issues/new?template=feature_request.md)**
- 💬 **[GitHub Discussions](https://github.com/josephsenior/Metasop/discussions)** — Questions and ideas
- 🗺️ **[Roadmap](../ROADMAP.md)** — What's planned next
