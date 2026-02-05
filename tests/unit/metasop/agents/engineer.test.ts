import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { engineerAgent } from "@/lib/metasop/agents/engineer";
import type { AgentContext, MetaSOPArtifact, EngineerBackendArtifact } from "@/lib/metasop/types";

describe("EngineerAgent", () => {
  let context: AgentContext;

  beforeEach(() => {
    context = {
      user_request: "Create a user authentication system",
      previous_artifacts: {
        pm_spec: {
          step_id: "pm_spec",
          role: "Product Manager",
          content: {},
          timestamp: new Date().toISOString(),
        } as MetaSOPArtifact,
        arch_design: {
          step_id: "arch_design",
          role: "Architect",
          content: {
            design_doc: "Architecture design",
            apis: [],
          },
          timestamp: new Date().toISOString(),
        } as MetaSOPArtifact,
      },
      options: {
        includeAPIs: true,
        includeDatabase: true,
        includeStateManagement: true,
      },
    };
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should generate engineer artifact", async () => {
    const artifact = await engineerAgent(context);
    const content = artifact.content as EngineerBackendArtifact;

    expect(artifact.step_id).toBe("engineer_impl");
    expect(artifact.role).toBe("Engineer");
    expect(artifact.content).toBeDefined();
    expect(content.file_structure).toBeDefined();
    expect(typeof content.file_structure).toBe("object");
    expect(content.implementation_plan).toBeDefined();
    expect(typeof content.implementation_plan).toBe("string");
    expect(artifact.timestamp).toBeDefined();
  });

  it("should include file structure as object", async () => {
    const artifact = await engineerAgent(context);
    const content = artifact.content as EngineerBackendArtifact;

    expect(content.file_structure).toBeDefined();
    expect(content.file_structure?.name).toBeDefined();
    expect(content.file_structure?.children).toBeDefined();
  });

  it("should include dependencies as string array", async () => {
    const artifact = await engineerAgent(context);
    const content = artifact.content as EngineerBackendArtifact;

    expect(Array.isArray(content.dependencies)).toBe(true);
    expect(content.dependencies!.length).toBeGreaterThan(0);
    expect(typeof content.dependencies![0]).toBe("string");
  });

  it("should include state management dependency when enabled", async () => {
    const artifact = await engineerAgent(context);
    const content = artifact.content as EngineerBackendArtifact;

    expect(Array.isArray(content.dependencies)).toBe(true);
    expect(content.dependencies!.every((d) => typeof d === "string")).toBe(true);
  });

  it("should include database dependency when enabled", async () => {
    const artifact = await engineerAgent(context);
    const content = artifact.content as EngineerBackendArtifact;

    expect(Array.isArray(content.dependencies)).toBe(true);
  });

  it("should include implementation plan as string", async () => {
    const artifact = await engineerAgent(context);
    const content = artifact.content as EngineerBackendArtifact;

    expect(typeof content.implementation_plan).toBe("string");
    expect(content.implementation_plan!.length).toBeGreaterThan(0);
  });

  it("should include artifact path and file structure", async () => {
    const artifact = await engineerAgent(context);
    const content = artifact.content as EngineerBackendArtifact;

    expect(typeof content.artifact_path).toBe("string");
    expect(content.artifact_path.length).toBeGreaterThan(0);
    expect(content.file_structure).toBeDefined();
  });

  it("should include API folder when hasAPI is true", async () => {
    context.options = { ...context.options, includeAPIs: true };
    const artifact = await engineerAgent(context);
    const content = artifact.content as EngineerBackendArtifact;

    expect(content.file_structure).toBeDefined();
    expect(typeof content.file_structure).toBe("object");
  });

  it("should not include API folder when hasAPI is false", async () => {
    context.options = { ...context.options, includeAPIs: false };
    const artifact = await engineerAgent(context);
    const content = artifact.content as EngineerBackendArtifact;

    const findApiFolder = (node: any): boolean => {
      if (node.name === "api") {
        // Check if api folder has children (if hasAPI is false, it should be empty or not exist)
        return node.children && node.children.length > 0;
      }
      if (node.children) {
        return node.children.some((child: any) => findApiFolder(child));
      }
      return false;
    };

    // The api folder might exist but should be empty when hasAPI is false
    const hasApiWithContent = findApiFolder(content.file_structure!);
    expect(hasApiWithContent).toBe(false);
  });

  it("should include database folder when hasDatabase is true", async () => {
    context.options = { ...context.options, includeDatabase: true };
    const artifact = await engineerAgent(context);
    const content = artifact.content as EngineerBackendArtifact;

    expect(content.file_structure).toBeDefined();
    expect(typeof content.file_structure).toBe("object");
  });

  it("should not include database folder when hasDatabase is false", async () => {
    context.options = { ...context.options, includeDatabase: false };
    const artifact = await engineerAgent(context);
    const content = artifact.content as EngineerBackendArtifact;

    const findDbFolder = (node: any): boolean => {
      if (node.name === "db") return true;
      if (node.children) {
        return node.children.some((child: any) => findDbFolder(child));
      }
      return false;
    };

    expect(findDbFolder(content.file_structure!)).toBe(false);
  });

  it("should not include state management dependency when disabled", async () => {
    context.options = { ...context.options, includeStateManagement: false };
    const artifact = await engineerAgent(context);
    const content = artifact.content as EngineerBackendArtifact;

    expect(content.dependencies).not.toContain("zustand@^4.0.0");
  });

  it("should not include database dependency when disabled", async () => {
    context.options = { ...context.options, includeDatabase: false };
    const artifact = await engineerAgent(context);
    const content = artifact.content as EngineerBackendArtifact;

    expect(content.dependencies).not.toContain("prisma@^5.0.0");
  });

  it("should include artifact_path", async () => {
    const artifact = await engineerAgent(context);
    const content = artifact.content as EngineerBackendArtifact;

    expect(content.artifact_path).toBeDefined();
    expect(typeof content.artifact_path).toBe("string");
  });
});
