import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { qaAgent } from "@/lib/metasop/agents/qa";
import type { AgentContext, MetaSOPArtifact } from "@/lib/metasop/types";
import type { QABackendArtifact } from "@/lib/metasop/types-backend-schema";

describe("QAAgent", () => {
  let context: AgentContext;

  beforeEach(() => {
    context = {
      user_request: "Create a user authentication system",
      previous_artifacts: {
        pm_spec: {
          step_id: "pm_spec",
          role: "Product Manager",
          content: {
            user_stories: [
              {
                title: "User Authentication",
                story: "As a user, I want to login",
                description: "User login feature",
              },
            ],
            acceptance_criteria: [
              {
                criteria: "User can login",
                description: "Login functionality works",
              },
            ],
          },
          timestamp: new Date().toISOString(),
        } as MetaSOPArtifact,
        arch_design: {
          step_id: "arch_design",
          role: "Architect",
          content: {
            apis: [
              {
                path: "/api/auth/login",
                method: "POST",
                description: "Login endpoint",
              },
            ],
            database_schema: {
              tables: [
                {
                  name: "users",
                  columns: [{ name: "id", type: "uuid" }],
                },
              ],
            },
          },
          timestamp: new Date().toISOString(),
        } as MetaSOPArtifact,
        engineer_impl: {
          step_id: "engineer_impl",
          role: "Engineer",
          content: {},
          timestamp: new Date().toISOString(),
        } as MetaSOPArtifact,
      },
    };
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should generate QA artifact", async () => {
    const artifact = await qaAgent(context);
    const content = artifact.content as QABackendArtifact;

    expect(artifact.step_id).toBe("qa_verification");
    expect(artifact.role).toBe("QA");
    expect(artifact.content).toBeDefined();
    expect(typeof content.ok).toBe("boolean");
    expect(content.test_strategy).toBeDefined();
    expect(typeof content.test_strategy).toBe("object");
    expect(Array.isArray(content.test_cases)).toBe(true);
    expect(content.test_cases.length).toBeGreaterThan(0);
    expect(artifact.timestamp).toBeDefined();
  });

  it("should include unit/integration/e2e strategy strings", async () => {
    const artifact = await qaAgent(context);
    const content = artifact.content as QABackendArtifact;

    expect(typeof content.test_strategy.unit).toBe("string");
    expect(typeof content.test_strategy.integration).toBe("string");
    expect(typeof content.test_strategy.e2e).toBe("string");
  });

  it("should have test cases with optional gherkin", async () => {
    const artifact = await qaAgent(context);
    const content = artifact.content as QABackendArtifact;

    expect(Array.isArray(content.test_cases)).toBe(true);
    expect(content.test_cases.length).toBeGreaterThan(0);
    content.test_cases.forEach((t) => {
      if (t.expected_result !== undefined) {
        expect(typeof t.expected_result).toBe("string");
      }
    });
  });
});
