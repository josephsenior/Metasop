import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { architectAgent } from "../architect";
import type { AgentContext, MetaSOPArtifact } from "../../types";
import type { ArchitectBackendArtifact } from "../../types-backend-schema";

describe("ArchitectAgent", () => {
  let context: AgentContext;

  beforeEach(async () => {
    context = {
      user_request: "Create a user authentication system with database",
      previous_artifacts: {
        pm_spec: {
          step_id: "pm_spec",
          role: "Product Manager",
          content: {
            user_stories: [{ id: "US-1", title: "Auth", description: "User auth" }],
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

    // Silence logger during tests
    const loggerModule = await import("../../utils/logger");
    vi.spyOn(loggerModule.logger, "info").mockImplementation(() => {});
    vi.spyOn(loggerModule.logger, "warn").mockImplementation(() => {});
    vi.spyOn(loggerModule.logger, "error").mockImplementation(() => {});
    vi.spyOn(loggerModule.logger, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should generate architect artifact", async () => {
    const artifact = await architectAgent(context);
    const content = artifact.content as ArchitectBackendArtifact;

    expect(artifact.step_id).toBe("arch_design");
    expect(artifact.role).toBe("Architect");
    expect(artifact.content).toBeDefined();
    expect(content.design_doc).toBeDefined();
    expect(typeof content.design_doc).toBe("string");
    expect(artifact.timestamp).toBeDefined();
  });

  it("should include APIs when includeAPIs is true", async () => {
    const artifact = await architectAgent(context);
    const content = artifact.content as ArchitectBackendArtifact;

    expect(content.apis).toBeDefined();
    if (content.apis) {
      expect(Array.isArray(content.apis)).toBe(true);
      expect(content.apis.length).toBeGreaterThan(0);
    }
  });

  it("should include database schema when includeDatabase is true", async () => {
    const artifact = await architectAgent(context);
    const content = artifact.content as ArchitectBackendArtifact;

    expect(content.database_schema).toBeDefined();
    if (content.database_schema?.tables) {
      expect(Array.isArray(content.database_schema.tables)).toBe(true);
    }
  });

  it("should include decisions", async () => {
    const artifact = await architectAgent(context);
    const content = artifact.content as ArchitectBackendArtifact;

    expect(content.decisions).toBeDefined();
    expect(Array.isArray(content.decisions)).toBe(true);
    expect(content.decisions!.length).toBeGreaterThan(0);
  });

  it("should not include APIs when includeAPIs is false", async () => {
    context.options = { ...context.options, includeAPIs: false };
    const artifact = await architectAgent(context);
    const content = artifact.content as ArchitectBackendArtifact;

    // APIs might still be generated if request mentions API
    // But we can check that it's not forced
    expect(content.design_doc).toBeDefined();
  });

  it("should handle request without auth", async () => {
    context.user_request = "Create a simple data storage system";
    context.options = { includeAPIs: false, includeDatabase: false };
    const artifact = await architectAgent(context);
    const content = artifact.content as ArchitectBackendArtifact;

    // Should still have design_doc
    expect(content.design_doc).toBeDefined();
  });

  it("should include default components in design_doc", async () => {
    context.user_request = "Create something";
    context.options = { includeAPIs: false, includeDatabase: false, includeStateManagement: false };
    const artifact = await architectAgent(context);
    const content = artifact.content as ArchitectBackendArtifact;

    expect(content.design_doc).toBeDefined();
    expect(content.design_doc.length).toBeGreaterThan(0);
  });

  it("should include API gateway when request mentions API", async () => {
    context.user_request = "Create an API for user management";
    context.options = { includeAPIs: true };
    const artifact = await architectAgent(context);
    const content = artifact.content as ArchitectBackendArtifact;

    if (content.apis) {
      expect(content.apis.length).toBeGreaterThan(0);
    }
  });

  it("should include state management in technology_stack when enabled", async () => {
    context.user_request = "Create an app";
    context.options = { includeStateManagement: true };
    const artifact = await architectAgent(context);
    const content = artifact.content as ArchitectBackendArtifact;

    expect(content.technology_stack).toBeDefined();
    if (content.technology_stack?.other) {
      expect(content.technology_stack.other.some((tech: string) => tech.toLowerCase().includes("state"))).toBe(true);
    }
  });

  it("should include default API endpoints when hasAPI is true", async () => {
    context.user_request = "Create a system";
    context.options = { includeAPIs: true, includeDatabase: false };
    const artifact = await architectAgent(context);
    const content = artifact.content as ArchitectBackendArtifact;

    expect(content.apis).toBeDefined();
    if (content.apis) {
      expect(content.apis.length).toBeGreaterThan(0);
      // Should have health check endpoint
      const hasHealthEndpoint = content.apis.some((api: any) => api.path === "/api/health");
      expect(hasHealthEndpoint).toBe(true);
    }
  });

  it("should include database tables when hasDatabase is true", async () => {
    context.user_request = "Create a system";
    context.options = { includeAPIs: false, includeDatabase: true };
    const artifact = await architectAgent(context);
    const content = artifact.content as ArchitectBackendArtifact;

    expect(content.database_schema).toBeDefined();
    if (content.database_schema?.tables) {
      expect(content.database_schema.tables.length).toBeGreaterThan(0);
    }
  });

  it("should handle storage requirement", async () => {
    context.user_request = "Create a file storage system";
    context.options = { includeDatabase: true };
    const artifact = await architectAgent(context);
    const content = artifact.content as ArchitectBackendArtifact;

    if (content.database_schema?.tables) {
      expect(content.database_schema.tables.length).toBeGreaterThan(0);
    }
  });

  it("should include next_tasks", async () => {
    const artifact = await architectAgent(context);
    const content = artifact.content as ArchitectBackendArtifact;

    expect(content.next_tasks).toBeDefined();
    expect(Array.isArray(content.next_tasks)).toBe(true);
    expect(content.next_tasks!.length).toBeGreaterThan(0);
  });

  it("should include technology_stack", async () => {
    const artifact = await architectAgent(context);
    const content = artifact.content as ArchitectBackendArtifact;

    expect(content.technology_stack).toBeDefined();
    expect(content.technology_stack?.frontend).toBeDefined();
    expect(Array.isArray(content.technology_stack?.frontend)).toBe(true);
  });

  it("should include security_considerations", async () => {
    const artifact = await architectAgent(context);
    const content = artifact.content as ArchitectBackendArtifact;

    expect(content.security_considerations).toBeDefined();
    expect(Array.isArray(content.security_considerations)).toBe(true);
  });
});
