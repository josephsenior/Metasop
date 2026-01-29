import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { uiDesignerAgent } from "@/lib/metasop/agents/ui-designer";
import type { AgentContext, MetaSOPArtifact } from "@/lib/metasop/types";

describe("UIDesignerAgent", () => {
  let context: AgentContext;

  beforeEach(() => {
    context = {
      user_request: "Create a user dashboard",
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

  it("should generate UI designer artifact", async () => {
    const artifact = await uiDesignerAgent(context);

    expect(artifact.step_id).toBe("ui_design");
    expect(artifact.role).toBe("UI Designer");
    expect(artifact.content).toBeDefined();
    // UI Designer doesn't have a backend schema, so we check for Record<string, any>
    expect((artifact.content as any).component_hierarchy).toBeDefined();
    expect((artifact.content as any).design_tokens).toBeDefined();
    expect(artifact.timestamp).toBeDefined();
  });

  it("should include component hierarchy", async () => {
    const artifact = await uiDesignerAgent(context);
    const content = artifact.content as any;

    expect(content.component_hierarchy).toBeDefined();
    expect(content.component_hierarchy.root).toBe("App");
    if (content.component_hierarchy.children !== undefined) {
      expect(Array.isArray(content.component_hierarchy.children)).toBe(true);
    }
  });

  it("should include design tokens", async () => {
    const artifact = await uiDesignerAgent(context);
    const content = artifact.content as any;

    expect(content.design_tokens.colors).toBeDefined();
    expect(content.design_tokens.spacing).toBeDefined();
    expect(content.design_tokens.typography).toBeDefined();
  });

  it("should include UI patterns", async () => {
    const artifact = await uiDesignerAgent(context);
    const content = artifact.content as any;

    expect(Array.isArray(content.ui_patterns)).toBe(true);
    expect(content.ui_patterns.length).toBeGreaterThan(0);
  });
});

