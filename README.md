# MetaSOP 🌊

[![CI](https://github.com/josephsenior/Metasop/actions/workflows/ci.yml/badge.svg)](https://github.com/josephsenior/Metasop/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![AI Orchestration](https://img.shields.io/badge/AI-Orchestration-orange.svg)](#)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![GitHub Stars](https://img.shields.io/github/stars/josephsenior/Metasop?style=social)](https://github.com/josephsenior/Metasop/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/josephsenior/Metasop?style=social)](https://github.com/josephsenior/Metasop/network/members)

<div align="center">

**MetaSOP** is a high-fidelity, multi-agent orchestration platform designed to automate the end-to-end software development lifecycle. By coordinating specialized AI agents—Product Managers, Architects, Engineers, Security Experts, and DevOps—MetaSOP generates synchronized, production-ready system designs and implementation plans from simple natural language requests.

[⚡ Quick Start](#-quick-start) • [📚 Documentation](#-documentation) • [🤝 Contributing](#-contributing) • [💬 Community](#-community) • [⭐ Star us on GitHub](https://github.com/josephsenior/Metasop)

</div>

---

## 🌟 Why MetaSOP?

Building software today requires coordinating multiple specialized roles, each with their own expertise and tools. MetaSOP automates this entire process by:

- **Eliminating manual coordination** between PMs, Architects, Engineers, Security, DevOps, and QA
- **Ensuring consistency** across artifacts via tool-based refinement (Edit Artifacts API)
- **Reducing development time** from weeks to hours
- **Providing production-ready outputs** validated against industry standards

---

##  Key Features

- **Tool-based Refinement**: Edit artifact JSON via predefined ops (`set_at_path`, `add_array_item`, etc.) without re-running agents. Use `POST /api/diagrams/artifacts/edit` with an `edits` array for deterministic, performant updates.
- **Context-Aware Agents**: Each agent operates with deep awareness of upstream dependencies, ensuring architectural decisions are consistent across the stack.
- **LLM-Native Caching**: Leverages advanced Gemini context caching to minimize latency and token consumption during generation.
- **Structured Validation**: All agent outputs are validated against strict Zod schemas and JSON structures, ensuring reliable, machine-readable artifacts.
- **Agent-to-Agent (A2A) Communication**: Specialized protocol for inter-agent delegation and task management.
- **Generation Jobs + SSE**: Long-running generation is queued, with progress streamed via Server-Sent Events.
- **Guest Support**: Limited diagram generation for non-authenticated users with session tracking.
- **Multi-Provider Support**: Built-in adapters for Google Gemini, Vercel AI SDK, and Token Factory (Llama 3.1).

## 🏗️ Architecture

MetaSOP utilizes a sequential pipeline:

1.  **Product Manager**: Defines user stories and acceptance criteria.
2.  **Architect**: Generates API contracts, database schemas, and ADRs.
3.  **DevOps Infrastructure**: Designs CI/CD pipelines and cloud infrastructure (Terraform/K8s).
4.  **Security Architecture**: Performs threat modeling and defines security controls.
5.  **UI Designer**: Generates design tokens and component hierarchies.
6.  **Engineer Implementation**: Drafts file structures and technical implementation plans.
7.  **QA Verification**: Creates comprehensive test strategies and test cases.

## 🛠️ Getting Started

### ⚡ Quick Start

Get MetaSOP up and running in under 5 minutes:

```bash
# Clone the repository
git clone https://github.com/josephsenior/Metasop.git
cd Metasop

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your Gemini API key (GOOGLE_AI_API_KEY)

# Create local database (SQLite)
pnpm db:generate
pnpm db:push

# Run the development server
pnpm dev

# Open http://localhost:3000
```

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **pnpm** (recommended) or npm/yarn
- **Gemini API Key** ([Get one here](https://ai.google.dev/))
- **Git** for version control

### Configuration

Create a `.env` file in the root directory (see `.env.example` for a template):

```env
# Required: Gemini API Key (get one at https://aistudio.google.com/apikey)
GOOGLE_AI_API_KEY=your_gemini_api_key_here

# Required for local storage: SQLite
DATABASE_URL="file:./prisma/local.db"

# Optional: LLM Provider (default: gemini)
METASOP_LLM_PROVIDER=gemini

# Optional: use mock provider for offline/dev tests
# METASOP_LLM_PROVIDER=mock

# Optional: Model (default: gemini-3-flash-preview)
METASOP_LLM_MODEL=gemini-3-flash-preview

# Optional: Agent timeout (ms) and retries
# METASOP_AGENT_TIMEOUT=180000
# METASOP_AGENT_RETRIES=0
```

### Running orchestration (integration tests)

```bash
# Run integration tests (orchestration flow)
npx tsx tests/integration/verify_full_pipeline.ts
npx tsx tests/integration/test_cascading_refinement.ts

# With custom model
METASOP_LLM_MODEL=gemini-3-pro-preview npx tsx tests/integration/verify_full_pipeline.ts
```

### Development

```bash
# Start development server
pnpm dev

# Type checking
pnpm type-check

# Linting
pnpm lint
pnpm lint:fix

# Build for production
pnpm build
pnpm start
```

### Testing

The project uses [Vitest](https://vitest.dev/) for unit tests. The suite covers the MetaSOP pipeline: orchestrator, agents, services, adapters, and utilities.

```bash
pnpm test              # Run unit tests once
pnpm test:watch        # Run tests in watch mode
pnpm test:coverage     # Run tests with coverage report (lib/, components/, app/api/)
pnpm test:ui           # Open Vitest UI
```

Integration tests under `tests/integration/` are excluded from the default run and can be executed separately. Coverage reports are written to `./coverage` (HTML, LCOV, text).

If `pnpm test` fails with **spawn EPERM** in Cursor's terminal (common on Windows), see [Tests: spawn EPERM](docs/TROUBLESHOOTING.md#tests-spawn-eperm-in-cursor-terminal).

---

## 📚 Documentation

- **[Documentation Hub](docs/index.md)** - Complete documentation index and navigation
- [Architecture Overview](docs/ARCHITECTURE.md) - Deep dive into the system architecture
- [API Reference](docs/API.md) - Complete API documentation with examples
- [Deployment Guide](docs/DEPLOYMENT.md) - Deploy to production (Vercel, Docker, VPS)
- [Contributing Guide](CONTRIBUTING.md) - How to contribute to MetaSOP
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions

---

## 🏗️ Architecture

MetaSOP utilizes a sequential pipeline with feedback loops:

```mermaid
graph LR
    A[User Request] --> B[Product Manager]
    B --> C[Architect]
    C --> D[DevOps]
    D --> E[Security]
    E --> F[UI Designer]
    F --> G[Engineer]
    G --> H[QA Verification]
```

### Agent pipeline (sequential)

1.  **Product Manager**: Defines user stories and acceptance criteria.
2.  **Architect**: Generates API contracts, database schemas, and ADRs.
3.  **DevOps Infrastructure**: Designs CI/CD pipelines and cloud infrastructure (Terraform/K8s).
4.  **Security Architecture**: Performs threat modeling and defines security controls.
5.  **UI Designer**: Generates design tokens and component hierarchies.
6.  **Engineer Implementation**: Drafts file structures and technical implementation plans.
7.  **QA Verification**: Creates comprehensive test strategies and test cases.

### Key components

- **Orchestrator**: Runs agents in order and passes artifacts as context; no graph in DB.
- **Execution Service**: Handles timeouts, retries, and error handling.
- **Refinement**: Tool-based only via `POST /api/diagrams/artifacts/edit` (no agent re-runs).

---

## 🤝 Contributing

We love contributions! Whether you're fixing a bug, adding a feature, or improving documentation, we want your help.

### How to Contribute

1. **Fork the repository** and create your branch (`git checkout -b feature/amazing-feature`)
2. **Make your changes** and ensure tests pass (`pnpm test`)
3. **Commit your changes** (`git commit -m 'Add some amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

For detailed guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

### Development setup

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/Metasop.git
cd Metasop

# Install dependencies
pnpm install

# Create a feature branch
git checkout -b feature/my-feature

# Make your changes and test
pnpm test
pnpm type-check
pnpm lint

# Commit and push
git add .
git commit -m "feat: add my feature"
git push origin feature/my-feature
```

---

## 💬 Community

- **GitHub Discussions**: [Join the conversation](https://github.com/josephsenior/Metasop/discussions)
- **Discord Server**: [Join our Discord](https://discord.gg/metasop) (coming soon)
- **Twitter/X**: Follow [@MetaSOP_AI](https://twitter.com/MetaSOP_AI) for updates
- **Blog**: Read our [latest posts](https://blog.metasop.dev) (coming soon)

### Getting Help

- 📖 Check the [Documentation](docs/)
- 🐛 Report bugs on [GitHub Issues](https://github.com/josephsenior/Metasop/issues)
- 💡 Ask questions on [GitHub Discussions](https://github.com/josephsenior/Metasop/discussions)
- 💬 Join our [Discord community](https://discord.gg/metasop)

---

## 🗺️ Roadmap

- [x] Multi-agent orchestration system
- [x] Tool-based refinement (Edit Artifacts API)
- [x] Knowledge graph for dependency tracking
- [x] Agent-to-agent communication protocol
- [x] Web interface with Next.js
- [ ] Additional LLM providers (OpenAI, Anthropic, etc.)
- [x] SSE progress streaming for generation
- [ ] Custom agent templates marketplace
- [ ] Advanced analytics and insights
- [ ] Mobile app
- [ ] Enterprise features (SSO, audit logs, etc.)

See [ROADMAP.md](ROADMAP.md) for detailed plans.

---

## 🌟 Sponsors

Support MetaSOP's development by becoming a sponsor! Your support helps us:

- Maintain and improve the core platform
- Add new features and integrations
- Provide better documentation and support
- Keep the project free and open source

[![Sponsor](https://img.shields.io/badge/Sponsor-Us-fb7245?logo=githubsponsors)](https://github.com/sponsors/josephsenior)

---

## 📜 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Google Gemini](https://ai.google.dev/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Testing with [Vitest](https://vitest.dev/)

---

<div align="center">

**Built with ❤️ by the MetaSOP community**

[⭐ Star us on GitHub](https://github.com/josephsenior/Metasop) • [🐛 Report a Bug](https://github.com/josephsenior/Metasop/issues) • [💡 Request a Feature](https://github.com/josephsenior/Metasop/issues)

*Automating the future of engineering*

</div>
