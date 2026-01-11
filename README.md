# MetaSOP 🌊

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![AI Orchestration](https://img.shields.io/badge/AI-Orchestration-orange.svg)](#)

**MetaSOP** is a high-fidelity, multi-agent orchestration platform designed to automate the end-to-end software development lifecycle. By coordinating specialized AI agents—Product Managers, Architects, Engineers, Security Experts, and DevOps—MetaSOP generates synchronized, production-ready system designs and implementation plans from simple natural language requests.

## 🚀 Key Features

- **Cascading Refinement**: Industry-leading "ripple" update system. When requirements change at the PM level, the platform automatically propagates those changes through the entire artifact chain (Architect -> Engineer -> Security -> QA).
- **Context-Aware Agents**: Each agent operates with deep awareness of upstream dependencies, ensuring architectural decisions are consistent across the stack.
- **LLM-Native Caching**: Leverages advanced Gemini context caching to minimize latency and token consumption during iterative refinement cycles.
- **Structured Validation**: All agent outputs are validated against strict Zod schemas and JSON structures, ensuring reliable, machine-readable artifacts.
- **Agent-to-Agent (A2A) Communication**: Specialized protocol for inter-agent delegation and task management.

## 🏗️ Architecture

MetaSOP utilizes a sequential pipeline with feedback loops:

1.  **Product Manager**: Defines user stories and acceptance criteria.
2.  **Architect**: Generates API contracts, database schemas, and ADRs.
3.  **Security Architecture**: Performs threat modeling and defines security controls.
4.  **DevOps Infrastructure**: Designs CI/CD pipelines and cloud infrastructure (Terraform/K8s).
5.  **Engineer Implementation**: Drafts file structures and technical implementation plans.
6.  **UI Designer**: Generates design tokens and component hierarchies.
7.  **QA Verification**: Creates comprehensive test strategies and test cases.

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- npm/pnpm/yarn
- Gemini API Key (set in `.env.local`)

### Installation

```bash
git clone https://github.com/josephsenior/Metasop.git
cd Metasop
npm install
```

### Configuration

Create a `.env.local` file with:

```env
GOOGLE_AI_API_KEY=your_gemini_api_key_here
METASOP_LLM_PROVIDER=gemini
METASOP_LLM_MODEL=gemini-1.5-pro-latest
```

### Running Orchestration

```bash
npx tsx scripts/test_cascading_refinement.ts
```

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Generated with ❤️ by MetaSOP - Automating the future of engineering.*
