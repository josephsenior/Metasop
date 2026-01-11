# Contributing to MultiAgentPlatform

First off, thank you for considering contributing to MultiAgentPlatform! 🎉

This document provides guidelines for contributing to the project. Following these guidelines helps communicate that you respect the time of the developers managing and developing this open source project.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Clear title and description**
- **Steps to reproduce** the behavior
- **Expected behavior**
- **Actual behavior**
- **Screenshots** (if applicable)
- **Environment details** (OS, Node version, browser, etc.)
- **Error messages** (if any)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Clear title and description**
- **Use case**: Why is this enhancement useful?
- **Proposed solution** (if you have one)
- **Alternatives considered** (if any)

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Add tests** (if applicable)
5. **Ensure tests pass** (`npm test`)
6. **Update documentation** (if needed)
7. **Commit your changes** (follow commit message conventions)
8. **Push to your branch** (`git push origin feature/amazing-feature`)
9. **Open a Pull Request**

#### Pull Request Guidelines

- **Keep PRs small and focused** - One feature/fix per PR
- **Write clear commit messages** - Follow conventional commits format
- **Add tests** - For new features or bug fixes
- **Update documentation** - If you change functionality
- **Link related issues** - Use "Fixes #123" or "Closes #123"
- **Request review** - Tag maintainers if needed

### Commit Message Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(agents): add new architect agent

Add support for microservices architecture patterns in the architect agent.

Closes #123
```

```
fix(diagrams): resolve layout issue in vertical flow

Fix node positioning when using vertical-flow layout type.

Fixes #456
```

## Development Setup

### Prerequisites

- Node.js 18+ and npm/pnpm
- PostgreSQL (or Docker)
- Git

### Installation

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/MultiAgentPlatform.git
   cd MultiAgentPlatform
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up database**
   ```bash
   pnpm db:generate
   pnpm db:push
   ```

5. **Run development server**
   ```bash
   pnpm dev
   ```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests with UI
pnpm test:ui
```

### Code Style

- We use **ESLint** for linting
- We use **Prettier** for formatting (via ESLint)
- We use **TypeScript** for type safety

**Check code style:**
```bash
pnpm lint
```

**Fix code style:**
```bash
pnpm lint:fix
```

**Type check:**
```bash
pnpm type-check
```

## Project Structure

```
MultiAgentPlatform/
├── app/                    # Next.js app directory
├── components/             # React components
├── lib/                    # Core libraries
│   ├── metasop/           # MetaSOP orchestrator
│   ├── diagrams/          # Diagram generation
│   └── ...
├── docs/                   # Documentation
├── tests/                  # Test files
└── ...
```

## Adding New Features

### Adding a New Agent

1. Create agent file in `lib/metasop/agents/`
2. Implement agent function following `AgentFunction` type
3. Register agent in orchestrator
4. Add tests
5. Update documentation

### Adding a New Component

1. Create component in `components/`
2. Follow existing component patterns
3. Add TypeScript types
4. Add tests (if applicable)
5. Update documentation

## Testing Guidelines

- Write tests for new features
- Write tests for bug fixes
- Aim for >80% code coverage
- Use descriptive test names
- Test edge cases

## Documentation

- Update README.md if needed
- Add JSDoc comments to functions
- Update API documentation
- Add examples for new features

## Questions?

- Open a GitHub Discussion
- Check existing issues
- Reach out to maintainers

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Thanked in the project

Thank you for contributing! 🙏
