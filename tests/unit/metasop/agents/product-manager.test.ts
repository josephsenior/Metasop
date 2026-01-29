import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { productManagerAgent } from "@/lib/metasop/agents/product-manager";
import type { AgentContext } from "@/lib/metasop/types";
import type { ProductManagerBackendArtifact } from "@/lib/metasop/types-backend-schema";

describe("ProductManagerAgent", () => {
  let context: AgentContext;

  beforeEach(() => {
    context = {
      user_request: "Create a user authentication system",
      previous_artifacts: {},
      options: {
        includeAPIs: true,
        includeDatabase: true,
      },
    };
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should generate product manager artifact", async () => {
    const artifact = await productManagerAgent(context);
    const content = artifact.content as ProductManagerBackendArtifact;

    expect(artifact.step_id).toBe("pm_spec");
    expect(artifact.role).toBe("Product Manager");
    expect(artifact.content).toBeDefined();
    expect(content.user_stories).toBeDefined();
    expect(Array.isArray(content.user_stories)).toBe(true);
    expect(content.acceptance_criteria).toBeDefined();
    expect(Array.isArray(content.acceptance_criteria)).toBe(true);
    expect(artifact.timestamp).toBeDefined();
  });

  it("should include user request in user stories", async () => {
    const artifact = await productManagerAgent(context);
    const content = artifact.content as ProductManagerBackendArtifact;

    const userStory = content.user_stories[0];
    if (typeof userStory === "object" && userStory !== null) {
      expect(userStory.title).toBeDefined();
      expect(userStory.description || userStory.story).toBeDefined();
    }
  });

  it("should have user stories with required fields", async () => {
    const artifact = await productManagerAgent(context);
    const content = artifact.content as ProductManagerBackendArtifact;

    const userStory = content.user_stories[0];
    if (typeof userStory === "object" && userStory !== null) {
      expect(userStory.title).toBeDefined();
      expect(typeof userStory.title).toBe("string");
    }
  });

  it("should have acceptance criteria", async () => {
    const artifact = await productManagerAgent(context);
    const content = artifact.content as ProductManagerBackendArtifact;

    expect(Array.isArray(content.acceptance_criteria)).toBe(true);
    expect(content.acceptance_criteria.length).toBeGreaterThan(0);
    
    const criteria = content.acceptance_criteria[0];
    if (typeof criteria === "object" && criteria !== null) {
      expect(criteria.criteria).toBeDefined();
    }
  });

  it("should include ui_multi_section when present", async () => {
    const artifact = await productManagerAgent(context);
    const content = artifact.content as ProductManagerBackendArtifact;

    if (content.ui_multi_section !== undefined) {
      expect(typeof content.ui_multi_section).toBe("boolean");
    }
  });
});
