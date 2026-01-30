# Changelog

All notable changes to MetaSOP will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial open source release
- Multi-agent orchestration system with 7 specialized agents
- Cascading refinement system for automatic artifact updates
- Knowledge graph for dependency tracking and management
- Agent-to-Agent (A2A) communication protocol
- Web interface built with Next.js 16 and React 19
- Comprehensive test suite with Vitest
- Documentation and contribution guidelines

### Changed
- Updated to TypeScript 5.0
- Migrated to Next.js 16
- Improved error handling and logging

### Fixed
- Fixed TypeScript error in orchestrator.ts (partialData property)
- Improved timeout handling in execution service

## [0.1.0] - 2025-01-30

### Added
- Initial release of MetaSOP
- Product Manager agent for user stories and acceptance criteria
- Architect agent for API contracts and database schemas
- Security Architecture agent for threat modeling
- DevOps Infrastructure agent for CI/CD pipelines
- Engineer Implementation agent for technical plans
- UI Designer agent for design tokens and components
- QA Verification agent for test strategies
- Execution service with timeout and retry logic
- Refinement planner for surgical updates
- Schema knowledge graph for dependency management
- Guest support for non-authenticated users
- Multi-provider LLM support (Gemini, Vercel AI SDK)
- Context caching for improved performance
- Structured validation with Zod schemas

### Security
- Secure authentication with NextAuth.js
- Input validation and sanitization
- Environment variable management
- Secure API endpoints with rate limiting

### Documentation
- Comprehensive README with getting started guide
- Architecture documentation
- API reference
- Contribution guidelines
- Security policy

---

## Version Format

- **[Unreleased]** - Changes that are planned but not yet released
- **[X.Y.Z]** - Released versions following semantic versioning

## Change Types

- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security vulnerability fixes

---

**Note:** This changelog follows the [Keep a Changelog](https://keepachangelog.com/) format.
