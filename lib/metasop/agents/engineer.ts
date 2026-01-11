import type { AgentContext, MetaSOPArtifact } from "../types";
import type { EngineerBackendArtifact } from "../artifacts/engineer/types";
import { engineerSchema } from "../artifacts/engineer/schema";
import { generateStructuredWithLLM } from "../utils/llm-helper";
import { logger } from "../utils/logger";
import { buildRefinementPrompt, shouldUseRefinement } from "../utils/refinement-helper";

/**
 * Engineer Agent
 * Generates implementation plan, file structure, and code
 * Uses EXACT Forge backend JSON schema structure (engineer.schema.json)
 */
export async function engineerAgent(context: AgentContext): Promise<MetaSOPArtifact> {
  const { user_request, previous_artifacts, options } = context;
  const archDesign = previous_artifacts.arch_design;
  const pmSpec = previous_artifacts.pm_spec;

  logger.info("Engineer agent starting", { user_request: user_request.substring(0, 100) });

  const hasAPI = options?.includeAPIs ?? true;
  const hasDatabase = options?.includeDatabase ?? true;
  const hasState = options?.includeStateManagement ?? true;

  try {
    let engineerPrompt: string;

    if (shouldUseRefinement(context)) {
      logger.info("Engineer agent in REFINEMENT mode");
      const guidelines = `
1. **Implementation Plan**: Update phases or tasks based on new requirements
2. **File Structure**: Add new files or directories as needed
3. **Dependencies**: Add or update package dependencies
4. **Technical Decisions**: Document new patterns or architectural choices`;
      engineerPrompt = buildRefinementPrompt(context, "Engineer", guidelines);
    } else {
      const hasCache = !!context.cacheId;
      engineerPrompt = hasCache
        ? `As a Senior Software Engineer, refine the implementation strategy based on the cached context.

CRITICAL GOALS:
1. **Clean Code Rigor**: Enforce **SOLID** principles and select appropriate **Design Patterns** (e.g., Repository, Service, Factory).
2. **State Hierarchy**: Define a specific state management architecture (e.g., Zustand vs React Query vs Redux) based on requirements.
3. **Execution Confidence**: Breakdown the implementation into granular, non-redundant technical phases with specific tasks.
4. **File Blueprint**: Create an elite-level file structure including types, test mocks, and infrastructure code.
5. **Quality Hardening**: Ensure full TypeScript safety and dependency injection for testability.

Your implementation must be professional, scalable, and follow industry best practices.`
        : `As a Senior Software Engineer, create a comprehensive implementation plan.

User Request: ${user_request}

${pmSpec?.content ? `Product Specification:
${JSON.stringify(pmSpec.content, null, 2)}` : ""}

${archDesign?.content ? `Architecture Design:
${JSON.stringify(archDesign.content, null, 2)}` : ""}

CRITICAL GOALS:
1. **SOLID Architecture**: Justify and apply SOLID principles. Specify technical patterns to be used across the codebase.
2. **State Management**: Detail the state management strategy. If "includeStateManagement" is true, specify tools and implementation patterns (e.g. Slices, Hooks).
3. **Complete Scaffolding**: Provide a comprehensive file structure that handles all requirements including:
   ${hasAPI ? "- Robust API routes and middleware" : ""}
   ${hasDatabase ? "- Database ORM/Schema management" : ""}
4. **Actionable Phases**: Breakdown implementation into 4-6 distinct phases (Setup -> Data Layer -> Logic/API -> UI -> Testing).
5. **Dependency Rigor**: Specify essential packages with version constraints.
6. **Executive Summary**: Provide a high-level summary and detailed description of the implementation strategy.

Your plan must be the authoritative technical guide for the development cycle, ensuring high-fidelity implementation.`;
    }

    let llmEngineerImpl: EngineerBackendArtifact | null = null;

    try {
      llmEngineerImpl = await generateStructuredWithLLM<EngineerBackendArtifact>(
        engineerPrompt,
        engineerSchema,
        { reasoning: true, temperature: 0.7, cacheId: context.cacheId, role: "Engineer" }
      );
    } catch (error: any) {
      logger.error("Engineer agent LLM call failed", { error: error.message });
      throw error;
    }

    if (!llmEngineerImpl) {
      throw new Error("Engineer agent failed: No structured data received from LLM");
    }

    const content: EngineerBackendArtifact = {
      summary: llmEngineerImpl.summary,
      description: llmEngineerImpl.description,
      artifact_path: llmEngineerImpl.artifact_path,
      file_structure: llmEngineerImpl.file_structure,
      implementation_plan: llmEngineerImpl.implementation_plan,
      phases: llmEngineerImpl.phases,
      dependencies: llmEngineerImpl.dependencies,
      technical_decisions: llmEngineerImpl.technical_decisions,
      environment_variables: llmEngineerImpl.environment_variables,
      technical_patterns: llmEngineerImpl.technical_patterns,
      state_management: llmEngineerImpl.state_management,
      tests_added: llmEngineerImpl.tests_added ?? true,
      run_results: llmEngineerImpl.run_results,
    };

    const normalizedDeps = (content.dependencies || []).slice();
    const ensureDep = (name: string, version: string) => {
      const exact = `${name}@${version}`;
      const has = normalizedDeps.some((d) => typeof d === "string" && (d === exact || d.startsWith(`${name}@`)));
      if (!has) normalizedDeps.push(exact);
    };
    const removeDep = (name: string) => {
      for (let i = normalizedDeps.length - 1; i >= 0; i--) {
        const d = normalizedDeps[i];
        if (typeof d === "string" && (d === name || d.startsWith(`${name}@`))) {
          normalizedDeps.splice(i, 1);
        }
      }
    };

    ensureDep("react", "^18.0.0");
    ensureDep("next", "^14.0.0");

    if (hasDatabase) ensureDep("prisma", "^5.0.0");
    else removeDep("prisma");

    if (hasState) ensureDep("zustand", "^4.0.0");
    else removeDep("zustand");

    content.dependencies = normalizedDeps;

    if (typeof content.implementation_plan === "string" && !content.implementation_plan.includes("#")) {
      content.implementation_plan = `# Implementation Plan\n\n${content.implementation_plan}`;
    }

    const normalizeFileNode = (node: any): any => {
      const name = typeof node?.name === "string" && node.name.length > 0 ? node.name : "src";
      const children = Array.isArray(node?.children) ? node.children.map(normalizeFileNode) : [];
      const hasChildren = children.length > 0;
      const typeRaw = typeof node?.type === "string" ? node.type : undefined;
      const type = typeRaw === "file" || typeRaw === "folder" || typeRaw === "directory" ? typeRaw : hasChildren ? "directory" : "file";
      return { ...node, name, type, children };
    };

    if (!content.file_structure || typeof content.file_structure !== "object") {
      content.file_structure = { name: "src", type: "directory", children: [] };
    } else {
      content.file_structure = normalizeFileNode(content.file_structure as any);
    }

    const ensureChildDir = (root: any, dirName: string, withChildFile: boolean): void => {
      root.children = Array.isArray(root.children) ? root.children : [];
      let dir = root.children.find((c: any) => c?.name === dirName && (c?.type === "directory" || c?.type === "folder"));
      if (!dir) {
        dir = { name: dirName, type: "directory", children: [] };
        root.children.push(dir);
      }
      if (!Array.isArray(dir.children)) dir.children = [];
      if (withChildFile && dir.children.length === 0) {
        dir.children.push({ name: "index.ts", type: "file" });
      }
      if (!withChildFile) {
        dir.children = [];
      }
    };

    const removeDirByName = (node: any, dirName: string): any => {
      if (!node || typeof node !== "object") return node;
      if (Array.isArray(node.children)) {
        node.children = node.children
          .filter((c: any) => c?.name !== dirName)
          .map((c: any) => removeDirByName(c, dirName));
      }
      return node;
    };

    if (hasAPI) ensureChildDir(content.file_structure as any, "api", true);
    else ensureChildDir(content.file_structure as any, "api", false);

    if (hasDatabase) ensureChildDir(content.file_structure as any, "db", true);
    else content.file_structure = removeDirByName(content.file_structure as any, "db");

    // Validation check
    if (!content.file_structure || !content.implementation_plan) {
      throw new Error("Engineer agent failed: File structure or implementation plan is missing");
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
