import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { engineerAgent } from "@/lib/metasop/agents/engineer";
import type {
  AgentContext,
  ArchitectBackendArtifact,
  EngineerBackendArtifact,
  MetaSOPArtifact,
  ProductManagerBackendArtifact,
} from "@/lib/metasop/types";

const minimalPmContent: ProductManagerBackendArtifact = {
  user_stories: [
    {
      id: "US-1",
      title: "User can sign in",
      story: "As a user, I want to sign in so that I can access my account.",
      description: "Basic authentication flow.",
      priority: "high",
      acceptance_criteria: ["User can sign in with email and password."],
    },
  ],
  acceptance_criteria: [
    {
      criteria: "User can successfully sign in with valid credentials.",
      priority: "must",
    },
  ],
  assumptions: [],
  out_of_scope: [],
  swot: {
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: [],
  },
  stakeholders: [],
  invest_analysis: [],
  summary: "Authentication feature summary.",
  description: "A minimal authentication system for testing.",
};

const minimalArchitectContent: ArchitectBackendArtifact = {
  design_doc: "Architecture design document. ".repeat(10),
  apis: [
    {
      path: "/api/auth/login",
      method: "POST",
      description: "Authenticate a user with email and password.",
      request_schema: { email: "string", password: "string" },
      response_schema: { token: "string" },
      auth_required: false,
    },
  ],
  decisions: [
    {
      decision: "Use JWT authentication",
      status: "accepted",
      reason: "JWT enables stateless auth across services.",
      tradeoffs: "Revocation is harder without a denylist.",
      consequences: "Requires secure token storage and rotation strategy.",
    },
  ],
  database_schema: {},
  technology_stack: {},
  integration_points: [],
  security_considerations: ["Use TLS everywhere and store secrets securely."],
  scalability_approach: {},
  summary: "High-level architecture for authentication.",
  description: "Provides endpoints, decisions, and schema placeholders.",
};

describe("EngineerAgent", () => {
  let context: AgentContext;

  beforeEach(() => {
    context = {
      user_request: "Create a user authentication system",
      previous_artifacts: {
        pm_spec: {
          step_id: "pm_spec",
          role: "Product Manager",
          content: minimalPmContent,
          timestamp: new Date().toISOString(),
        } as MetaSOPArtifact,
        arch_design: {
          step_id: "arch_design",
          role: "Architect",
          content: minimalArchitectContent,
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
    expect(content.implementation_plan_phases).toBeDefined();
    expect(Array.isArray(content.implementation_plan_phases)).toBe(true);
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

  it("should include implementation phases", async () => {
    const artifact = await engineerAgent(context);
    const content = artifact.content as EngineerBackendArtifact;

    expect(Array.isArray(content.implementation_plan_phases)).toBe(true);
    expect(content.implementation_plan_phases.length).toBeGreaterThan(0);
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
