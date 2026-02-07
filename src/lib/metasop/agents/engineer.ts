import type { AgentContext, MetaSOPArtifact, MetaSOPEvent } from "../types";
import type { EngineerBackendArtifact } from "../artifacts/engineer/types";
import { engineerSchema } from "../artifacts/engineer/schema";
import { generateStreamingStructuredWithLLM } from "../utils/llm-helper";
import { logger } from "../utils/logger";
import { TECHNICAL_STANDARDS, getDomainContext, getQualityCheckPrompt } from "../utils/prompt-standards";
import { getAgentTemperature } from "../config";

/**
 * Engineer Agent
 * Generates implementation plan, file structure, and code
 * Uses EXACT Forge backend JSON schema structure (engineer.schema.json)
 */
export async function engineerAgent(
  context: AgentContext,
  onProgress?: (event: Partial<MetaSOPEvent>) => void
): Promise<MetaSOPArtifact> {
  const { user_request, previous_artifacts } = context;
  const archDesign = previous_artifacts.arch_design;
  const pmSpec = previous_artifacts.pm_spec;
  const uiDesign = previous_artifacts.ui_design;

  logger.info("Engineer agent starting", { user_request: user_request.substring(0, 100) });

  try {
    let content: EngineerBackendArtifact;

    const pmArtifact = pmSpec?.content as any;
      const archArtifact = archDesign?.content as any;
      const uiArtifact = uiDesign?.content as any;
      const securityArtifact = context.previous_artifacts?.security_architecture?.content as any;
      const devopsArtifact = context.previous_artifacts?.devops_infrastructure?.content as any;
      const projectTitle = pmArtifact?.summary?.substring(0, 50) || "Project";
      
      const domainContext = getDomainContext(user_request);
      const qualityCheck = getQualityCheckPrompt("engineer");

      const engineerPrompt = `You are a Staff Software Engineer with 10+ years of experience in full-stack development, system design, and technical leadership. Create a comprehensive implementation blueprint for:

"${projectTitle}"

${pmArtifact ? `
Project Context:
- Summary: ${pmArtifact.summary}
- Key User Stories: ${pmArtifact.user_stories?.slice(0, 4).map((s: any) => s.title).join(", ") || "N/A"}` : `User Request: ${user_request}`}
${archArtifact ? `
Architecture Context:
- Summary: ${archArtifact.summary}
- Tech Stack: ${Object.values(archArtifact.technology_stack || {}).flat().join(", ")}
- Database Tables: ${archArtifact.database_schema?.tables?.slice(0, 5).map((t: any) => t.name).join(", ") || "N/A"}
- Key APIs: ${archArtifact.apis?.slice(0, 4).map((a: any) => `${a.method} ${a.path}`).join(", ") || "N/A"}` : ""}
${uiArtifact ? `
UI/UX Context:
- Design Summary: ${uiArtifact.summary}
- Primary Color: ${uiArtifact.design_tokens?.colors?.primary || "#3B82F6"}
- Key Components: ${uiArtifact.component_hierarchy?.organisms?.slice(0, 3).join(", ") || "N/A"}` : ""}
${securityArtifact ? `
Security Context:
- Auth Method: ${securityArtifact.security_architecture?.authentication?.method || "JWT"}
- Authorization Model: ${securityArtifact.security_architecture?.authorization?.model || "RBAC"}` : ""}
${devopsArtifact ? `
Infrastructure Context:
- Cloud Provider: ${devopsArtifact.infrastructure?.cloud_provider || "AWS"}
- Deployment Strategy: ${devopsArtifact.deployment?.strategy || "Blue/Green"}` : ""}
${domainContext ? `\n${domainContext}\n` : ""}

=== TECHNICAL STANDARDS ===
${TECHNICAL_STANDARDS.naming}

${TECHNICAL_STANDARDS.errorHandling}

=== MISSION OBJECTIVES ===

1. **Technical Decisions**
   - Document critical implementation choices with full context
   - Include: decision, rationale, alternatives considered, tradeoffs
   - Example decisions:
     * Why React Query over Redux for server state?
     * Why Tailwind over CSS Modules?
     * Why tRPC over REST?

2. **File Structure**
   - Design a professional, scalable directory structure
   - Follow framework conventions (Next.js App Router, etc.)
   - Organize by feature/domain, not by type
   - Include:
     * /app or /src - Application code
     * /components - UI components (atoms/molecules/organisms)
     * /lib - Utilities, helpers, API clients
     * /hooks - Custom React hooks
     * /types - TypeScript type definitions
     * /tests - Test files mirroring src structure
     * Configuration files (tsconfig, eslint, prettier, etc.)

3. **CLI Commands (MANDATORY)**
   - **Setup Commands**: Project initialization, dependency installation, database setup
   - **Dev Commands**: Local development server, watch modes
   - **Test Commands**: Unit tests, integration tests, E2E tests, coverage
   - **Build Commands**: Production build, type checking, linting
   - Example: \`pnpm install\`, \`pnpm dev\`, \`pnpm test\`, \`pnpm build\`

4. **Environment Variables**
   - List required configuration variables for this specific project
   - Include: name, description, example value, required/optional
   - Common categories (include only what's needed):
     * Database: DATABASE_URL
     * Authentication: JWT_SECRET, NEXTAUTH_SECRET
     * External Services: API keys
     * Runtime: NODE_ENV, PORT

5. **Dependencies**
   - List all production and dev dependencies
   - Include version constraints (e.g., "next@^14.0.0")
   - Categorize: Framework, UI, State Management, Testing, Utilities

6. **Implementation Phases**
   - Break down implementation into logical phases
   - Each phase should be deployable/testable
   - Phase 1: Foundation (auth, database, core API)
   - Phase 2: Core Features (main user flows)
   - Phase 3: Enhancement (performance, polish)
   - Phase 4: Production Readiness (monitoring, documentation)

7. **State Management Strategy**
   - Define approach for different state types:
     * Server State: React Query, SWR, tRPC
     * Client State: Zustand, Jotai, Context
     * Form State: React Hook Form, Formik
     * URL State: nuqs, searchParams
   - Document data fetching and caching strategy

8. **Technical Patterns**
   - List architectural patterns used:
     * Repository Pattern for data access
     * Factory Pattern for object creation
     * Observer Pattern for event handling
     * Strategy Pattern for interchangeable algorithms

${qualityCheck}

IMPORTANT: Provide values proportional to project complexity:
- 'technical_decisions': Key decisions for this specific project
- 'environment_variables': Only variables needed for this project
- 'run_results': Essential commands (setup, dev, test, build)

Respond with ONLY the structured JSON object matching the schema. No explanations or markdown.`;

      let llmEngineerImpl: EngineerBackendArtifact | null = null;

      try {
        llmEngineerImpl = await generateStreamingStructuredWithLLM<EngineerBackendArtifact>(
          engineerPrompt,
          engineerSchema,
          (partialEvent) => {
            if (onProgress) {
              onProgress(partialEvent);
            }
          },
          {
            reasoning: context.options?.reasoning ?? false,
            temperature: getAgentTemperature("engineer_impl"),
            cacheId: context.cacheId,
            role: "Engineer",
            model: context.options?.model,
          }
        );
      } catch (error: any) {
        logger.error("Engineer agent LLM call failed", { error: error.message });
        throw error;
      }

      if (!llmEngineerImpl) {
        throw new Error("Engineer agent failed: No structured data received from LLM");
      }

      const impl_phases = llmEngineerImpl.implementation_plan_phases ?? (llmEngineerImpl as any).phases ?? [];

      content = {
        summary: llmEngineerImpl.summary,
        description: llmEngineerImpl.description,
        artifact_path: llmEngineerImpl.artifact_path,
        implementation_plan_phases: impl_phases,
        state_management: llmEngineerImpl.state_management,
        file_structure: llmEngineerImpl.file_structure,
        technical_patterns: llmEngineerImpl.technical_patterns || [],
        technical_decisions: llmEngineerImpl.technical_decisions || [],
        environment_variables: llmEngineerImpl.environment_variables || [],
        dependencies: llmEngineerImpl.dependencies || [],
        run_results: {
          setup_commands: llmEngineerImpl.run_results?.setup_commands || [],
          test_commands: llmEngineerImpl.run_results?.test_commands || [],
          dev_commands: llmEngineerImpl.run_results?.dev_commands || [],
          build_commands: llmEngineerImpl.run_results?.build_commands || [],
          notes: llmEngineerImpl.run_results?.notes || ""
        }
      };

    // Validation check
    if (!content.file_structure || !content.implementation_plan_phases) {
      throw new Error("Engineer agent failed: File structure or implementation phases are missing");
    }

    logger.info("Engineer agent completed");

    return {
      step_id: "engineer_impl",
      role: "Engineer",
      content,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error("Engineer agent failed", { error: error.message });
    throw error;
  }
}
