# Contributing to MetaSOP 🤝

Thank you for your interest in contributing to MetaSOP! We welcome contributions from everyone, whether you're fixing a bug, adding a feature, improving documentation, or just helping others.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)
- [Feature Requests](#feature-requests)

---

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md). We expect all contributors to be respectful, inclusive, and collaborative.

---

## Getting Started

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **pnpm** (recommended) or npm/yarn
- **Git** for version control
- **Gemini API Key** for testing ([Get one here](https://ai.google.dev/))

### Setting Up Your Development Environment

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/Metasop.git
cd Metasop

# 3. Install dependencies
pnpm install

# 4. Create a .env.local file
cp .env.example .env.local
# Edit .env.local and add your Gemini API key

# 5. Create a new branch for your changes
git checkout -b feature/your-feature-name

# 6. Start the development server
pnpm dev
```

### Verifying Your Setup

```bash
# Run tests to ensure everything is working
pnpm test

# Run type checking
pnpm type-check

# Run linting
pnpm lint
```

---

## Development Workflow

### 1. Find an Issue

- Browse [open issues](https://github.com/josephsenior/Metasop/issues) to find something to work on
- Look for issues labeled `good first issue` for beginner-friendly tasks
- Comment on the issue to let others know you're working on it

### 2. Create a Branch

```bash
# Use a descriptive branch name
git checkout -b feature/add-new-agent
# or
git checkout -b fix/timeout-handling
# or
git checkout -b docs/update-readme
```

### 3. Make Your Changes

- Write clean, readable code following our [Coding Standards](#coding-standards)
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass

### 4. Test Your Changes

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Type checking
pnpm type-check

# Linting
pnpm lint
pnpm lint:fix
```

### 5. Commit Your Changes

```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "feat: add new agent for database optimization"

# Use conventional commit messages:
# feat: new feature
# fix: bug fix
# docs: documentation changes
# style: formatting, missing semi colons, etc
# refactor: refactoring production code
# test: adding tests, refactoring tests
# chore: updating build tasks, package manager configs, etc
```

### 6. Push and Create a Pull Request

```bash
# Push your branch to your fork
git push origin feature/your-feature-name

# Go to GitHub and create a Pull Request
# Provide a clear description of your changes
```

---

## Coding Standards

### TypeScript

- Use **TypeScript** for all new code
- Enable strict type checking
- Avoid `any` types - use proper type definitions
- Use interfaces for object shapes
- Use type aliases for union types and primitives

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
}

type UserRole = 'admin' | 'user' | 'guest';

// ❌ Bad
const user: any = { id: 1, name: 'John' };
```

### Code Style

- Use **2 spaces** for indentation
- Use **single quotes** for strings
- Use **semicolons**
- Use **camelCase** for variables and functions
- Use **PascalCase** for classes and interfaces
- Use **UPPER_SNAKE_CASE** for constants

```typescript
// ✅ Good
const maxRetries = 3;
const getUserById = (id: string): User => { ... };
class UserService { ... }
interface ApiResponse { ... }

// ❌ Bad
const MAX_RETRIES = 3;
const get_user_by_id = (id: string) => { ... };
class userService { ... }
```

### Error Handling

- Always handle errors appropriately
- Use try-catch blocks for async operations
- Provide meaningful error messages
- Log errors for debugging

```typescript
// ✅ Good
async function executeAgent(agent: Agent): Promise<Artifact> {
  try {
    const result = await agent.execute();
    return result;
  } catch (error) {
    logger.error(`Agent execution failed: ${error.message}`, { agent: agent.id });
    throw new Error(`Failed to execute agent ${agent.id}: ${error.message}`);
  }
}

// ❌ Bad
async function executeAgent(agent: Agent): Promise<Artifact> {
  return await agent.execute();
}
```

### Comments and Documentation

- Add JSDoc comments for public functions and classes
- Use inline comments for complex logic
- Keep comments up-to-date with code changes

```typescript
/**
 * Executes an agent with the given context
 * @param agent - The agent to execute
 * @param context - The execution context
 * @returns Promise<Artifact> The generated artifact
 * @throws Error if execution fails
 */
async function executeAgent(
  agent: Agent,
  context: AgentContext
): Promise<Artifact> {
  // Complex logic here
  const result = await agent.execute(context);
  return result;
}
```

---

## Testing

### Writing Tests

- Write tests for all new functionality
- Aim for high test coverage
- Use descriptive test names
- Follow the Arrange-Act-Assert pattern

```typescript
// ✅ Good
describe('ExecutionService', () => {
  describe('executeStep', () => {
    it('should return success result when agent executes successfully', async () => {
      // Arrange
      const agent = createMockAgent();
      const context = createMockContext();
      const options = createMockOptions();

      // Act
      const result = await service.executeStep(agent, context, options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.artifact).toBeDefined();
    });
  });
});
```

### Test Structure

- Unit tests: `tests/unit/`
- Integration tests: `tests/integration/`
- Test files should be named `*.test.ts`

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test orchestrator.test.ts

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

---

## Documentation

### Updating Documentation

- Keep documentation in sync with code changes
- Use clear, concise language
- Include code examples where helpful
- Update the README for user-facing changes
- Add inline comments for complex logic

### Documentation Files

- `README.md` - Main project documentation
- `CONTRIBUTING.md` - Contribution guidelines
- `docs/` - Additional documentation
- Inline comments in code

---

## Submitting Changes

### Pull Request Checklist

Before submitting a PR, ensure:

- [ ] All tests pass (`pnpm test`)
- [ ] Type checking passes (`pnpm type-check`)
- [ ] Linting passes (`pnpm lint`)
- [ ] New code has tests
- [ ] Documentation is updated
- [ ] Commit messages follow conventional commits
- [ ] PR description is clear and descriptive

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested your changes

## Checklist
- [ ] Tests pass
- [ ] Linting passes
- [ ] Documentation updated
```

### Review Process

1. Automated checks must pass
2. At least one maintainer review
3. Address review feedback
4. Approval and merge

---

## Reporting Issues

### Before Reporting

- Search existing issues first
- Check if the issue is already fixed in the latest version
- Reproduce the issue with minimal code

### Issue Template

```markdown
## Description
Clear description of the issue

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Node.js version:
- OS:
- MetaSOP version:

## Additional Context
Logs, screenshots, etc.
```

---

## Feature Requests

### Before Requesting

- Search existing feature requests
- Check if the feature aligns with project goals
- Consider if you can implement it yourself

### Feature Request Template

```markdown
## Feature Description
Clear description of the feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How should this work?

## Alternatives Considered
What other approaches did you consider?

## Additional Context
Examples, mockups, etc.
```

---

## Getting Help

- 📖 Check the [Documentation](docs/)
- 💬 Join our [Discord community](https://discord.gg/metasop)
- 🐛 Report bugs on [GitHub Issues](https://github.com/josephsenior/Metasop/issues)
- 💡 Ask questions on [GitHub Discussions](https://github.com/josephsenior/Metasop/discussions)

---

## Recognition

Contributors will be:

- Listed in the [CONTRIBUTORS.md](CONTRIBUTORS.md) file
- Mentioned in release notes
- Eligible for contributor badges
- Invited to join the core team for significant contributions

---

## License

By contributing to MetaSOP, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

Thank you for contributing to MetaSOP! 🎉
