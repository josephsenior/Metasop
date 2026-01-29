/**
 * Refinement Planner Tests
 * 
 * Comprehensive test suite for the RefinementPlanner class
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RefinementPlanner } from "@/lib/metasop/knowledge-graph/planner";
import { SchemaKnowledgeGraph } from "@/lib/metasop/knowledge-graph/graph";
import type { RefinementPlan, SurgicalUpdate } from "@/lib/metasop/knowledge-graph/types";

// Mock the LLM helper
vi.mock("@/lib/metasop/utils/llm-helper", () => ({
  generateWithLLM: vi.fn(),
}));

import { generateWithLLM } from "@/lib/metasop/utils/llm-helper";

// Mock logger
vi.mock("@/lib/metasop/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("RefinementPlanner", () => {
  let graph: SchemaKnowledgeGraph;
  let planner: RefinementPlanner;
  const mockGenerateWithLLM = vi.mocked(generateWithLLM);

  // Sample artifacts with clear dependencies
  const sampleArtifacts = {
    pm_spec: {
      content: {
        summary: "E-commerce platform",
        user_stories: [
          { id: "US-1", title: "Add to cart", story: "As a user, I want to add items to cart" },
          { id: "US-2", title: "Checkout", story: "As a user, I want to checkout" },
        ],
      },
    },
    arch_design: {
      content: {
        summary: "E-commerce architecture",
        apis: [
          { path: "/api/cart/add", method: "POST", description: "Add item to cart" },
          { path: "/api/checkout", method: "POST", description: "Process checkout" },
        ],
        database_schema: {
          tables: [
            { name: "cart_items", columns: [{ name: "id", type: "UUID" }] },
            { name: "orders", columns: [{ name: "id", type: "UUID" }] },
          ],
        },
      },
    },
    engineer_impl: {
      content: {
        summary: "E-commerce implementation",
        file_structure: {
          name: "src",
          type: "directory",
          children: [
            { name: "cart", type: "directory", children: [{ name: "add.ts", type: "file" }] },
            { name: "checkout", type: "directory", children: [{ name: "process.ts", type: "file" }] },
          ],
        },
        dependencies: ["express", "stripe"],
      },
    },
    qa_verification: {
      content: {
        summary: "E-commerce test plan",
        test_cases: [
          { id: "TC-1", name: "Test add to cart", expected_result: "Item added" },
          { id: "TC-2", name: "Test checkout", expected_result: "Order created" },
        ],
      },
    },
  };

  beforeEach(async () => {
    mockGenerateWithLLM.mockResolvedValue("[]");
    graph = new SchemaKnowledgeGraph();
    await graph.build(sampleArtifacts);
    planner = new RefinementPlanner(graph);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createPlan", () => {
    it("should create a refinement plan for a target node", () => {
      const plan = planner.createPlan(
        "Change authentication to OAuth",
        "arch_design",
        "apis[0].path",
        "/api/oauth/login"
      );

      expect(plan).toBeDefined();
      expect(plan.originalIntent).toBe("Change authentication to OAuth");
      expect(plan.targetNode).toBeDefined();
      expect(plan.newValue).toBe("/api/oauth/login");
    });

    it("should include updates for the target artifact", () => {
      const plan = planner.createPlan(
        "Update API path",
        "arch_design",
        "apis[0].path",
        "/api/new-path"
      );

      const targetUpdate = plan.updates.find(u => u.artifactType === "arch_design");
      expect(targetUpdate).toBeDefined();
      expect(targetUpdate?.priority).toBe("critical");
    });

    it("should include updates for dependent artifacts", () => {
      const plan = planner.createPlan(
        "Change cart API",
        "arch_design",
        "apis[0].path",
        "/api/cart/v2/add"
      );

      // Should have updates for downstream artifacts
      const engineerUpdate = plan.updates.find(u => u.artifactType === "engineer_impl");
      expect(engineerUpdate).toBeDefined();
    });

    it("should sort updates by dependency order", () => {
      const plan = planner.createPlan(
        "Change requirement",
        "pm_spec",
        "summary",
        "Updated e-commerce platform"
      );

      const updateOrder = plan.updates.map(u => u.artifactType);
      const pmIndex = updateOrder.indexOf("pm_spec");
      const archIndex = updateOrder.indexOf("arch_design");
      const engineerIndex = updateOrder.indexOf("engineer_impl");

      // PM should come before arch, which should come before engineer
      if (archIndex !== -1) {
        expect(pmIndex).toBeLessThan(archIndex);
      }
      if (engineerIndex !== -1 && archIndex !== -1) {
        expect(archIndex).toBeLessThan(engineerIndex);
      }
    });

    it("should calculate impact score", () => {
      const plan = planner.createPlan(
        "Major architecture change",
        "arch_design",
        "summary",
        "New architecture"
      );

      expect(plan.impactScore).toBeGreaterThanOrEqual(0);
      expect(plan.impactScore).toBeLessThanOrEqual(1);
    });

    it("should identify unaffected artifacts", () => {
      const plan = planner.createPlan(
        "Minor API change",
        "arch_design",
        "apis[0].description",
        "Updated description"
      );

      expect(Array.isArray(plan.unaffectedArtifacts)).toBe(true);
    });

    it("should throw error for non-existent target node", () => {
      expect(() => {
        planner.createPlan(
          "Change non-existent",
          "arch_design",
          "nonexistent.path",
          "value"
        );
      }).toThrow("Target node not found");
    });

    it("should include context in updates", () => {
      const plan = planner.createPlan(
        "Update checkout API",
        "arch_design",
        "apis[1].path",
        "/api/checkout/v2"
      );

      const update = plan.updates.find(u => u.artifactType === "engineer_impl");
      if (update) {
        expect(update.context).toBeDefined();
        expect(update.context.upstreamChange).toBeDefined();
        expect(update.context.reason).toBeDefined();
      }
    });
  });

  describe("generateTargetInstruction", () => {
    it("should generate specific instruction for array items", () => {
      const plan = planner.createPlan(
        "Update API",
        "arch_design",
        "apis[0].path",
        "/api/new"
      );

      const targetUpdate = plan.updates.find(u => u.artifactType === "arch_design");
      expect(targetUpdate?.instruction).toContain("Update");
      expect(targetUpdate?.instruction).toContain("/api/new");
    });

    it("should generate specific instruction for object fields", () => {
      const plan = planner.createPlan(
        "Update summary",
        "arch_design",
        "summary",
        "New summary"
      );

      const targetUpdate = plan.updates.find(u => u.artifactType === "arch_design");
      expect(targetUpdate?.instruction).toBeDefined();
      expect(targetUpdate?.instruction.length).toBeGreaterThan(0);
    });
  });

  describe("generateDependentInstruction", () => {
    it("should generate context-aware instructions for engineer", () => {
      const plan = planner.createPlan(
        "Change API path",
        "arch_design",
        "apis[0].path",
        "/api/cart/v2/add"
      );

      const engineerUpdate = plan.updates.find(u => u.artifactType === "engineer_impl");
      if (engineerUpdate) {
        expect(engineerUpdate.instruction).toContain("implementation");
        expect(engineerUpdate.instruction.toLowerCase()).toContain("api");
      }
    });

    it("should generate context-aware instructions for QA", () => {
      const plan = planner.createPlan(
        "Change API path",
        "arch_design",
        "apis[0].path",
        "/api/cart/v2/add"
      );

      const qaUpdate = plan.updates.find(u => u.artifactType === "qa_verification");
      if (qaUpdate) {
        expect(qaUpdate.instruction.toLowerCase()).toContain("test");
      }
    });

    it("should include reference values in context", () => {
      const plan = planner.createPlan(
        "Update value",
        "arch_design",
        "summary",
        "New architecture summary"
      );

      const update = plan.updates.find(u => u.artifactType !== "arch_design");
      if (update && update.context.referenceValues) {
        expect(update.context.referenceValues).toHaveProperty("newValue");
      }
    });
  });

  describe("analyzeIntent", () => {
    it("should classify 'modify' intent", () => {
      const analysis = planner.analyzeIntent("Change the color to blue");

      expect(analysis.type).toBe("modify");
      expect(analysis.confidence).toBeGreaterThan(0);
    });

    it("should classify 'add' intent", () => {
      const analysis = planner.analyzeIntent("Add a new user story for login");

      expect(analysis.type).toBe("add");
      expect(analysis.confidence).toBeGreaterThan(0);
    });

    it("should classify 'remove' intent", () => {
      const analysis = planner.analyzeIntent("Remove the old authentication method");

      expect(analysis.type).toBe("remove");
      expect(analysis.confidence).toBeGreaterThan(0);
    });

    it("should classify 'restructure' intent", () => {
      const analysis = planner.analyzeIntent("Refactor the database schema");

      expect(analysis.type).toBe("restructure");
      expect(analysis.confidence).toBeGreaterThan(0);
    });

    it("should extract matched keywords", () => {
      const analysis = planner.analyzeIntent("Update the API endpoint");

      expect(analysis.keywords.length).toBeGreaterThan(0);
      expect(analysis.keywords).toContain("update");
    });

    it("should return confidence between 0 and 1", () => {
      const analysis = planner.analyzeIntent("Make some changes");

      expect(analysis.confidence).toBeGreaterThanOrEqual(0);
      expect(analysis.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe("validatePlan", () => {
    it("should validate a correct plan", () => {
      const plan = planner.createPlan(
        "Valid change",
        "arch_design",
        "summary",
        "New summary"
      );

      const validation = planner.validatePlan(plan);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should detect missing target node", () => {
      const invalidPlan: RefinementPlan = {
        originalIntent: "test",
        targetNode: null as any,
        newValue: "test",
        updates: [],
        unaffectedArtifacts: [],
        impactScore: 0,
      };

      const validation = planner.validatePlan(invalidPlan);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain("Target node is missing");
    });

    it("should detect updates without target paths", () => {
      const plan = planner.createPlan(
        "Test change",
        "arch_design",
        "summary",
        "New summary"
      );

      // Manually add an invalid update
      plan.updates.push({
        artifactType: "test",
        targetPaths: [],
        instruction: "test",
        context: { upstreamChange: "test", reason: "test" },
        priority: "medium",
        dependsOn: [],
      });

      const validation = planner.validatePlan(plan);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes("no target paths"))).toBe(true);
    });

    it("should detect circular dependencies", () => {
      const plan = planner.createPlan(
        "Test change",
        "arch_design",
        "summary",
        "New summary"
      );

      // Create circular dependency
      const updateA = plan.updates.find(u => u.artifactType === "arch_design");
      const updateB = plan.updates.find(u => u.artifactType === "engineer_impl");

      if (updateA && updateB) {
        updateA.dependsOn = ["engineer_impl"];
        updateB.dependsOn = ["arch_design"];

        const validation = planner.validatePlan(plan);

        expect(validation.valid).toBe(false);
        expect(validation.errors.some(e => e.includes("Circular"))).toBe(true);
      }
    });
  });

  describe("calculateImpactScore", () => {
    it("should have base score for any change", () => {
      const plan = planner.createPlan(
        "Minor change",
        "arch_design",
        "summary",
        "New summary"
      );

      expect(plan.impactScore).toBeGreaterThanOrEqual(0.2);
    });

    it("should increase score with more dependents", () => {
      const plan1 = planner.createPlan(
        "Change pm spec",
        "pm_spec",
        "summary",
        "New summary"
      );

      const plan2 = planner.createPlan(
        "Change arch design",
        "arch_design",
        "summary",
        "New summary"
      );

      // PM spec typically has more downstream dependents
      expect(plan1.impactScore).toBeGreaterThanOrEqual(plan2.impactScore);
    });

    it("should cap score at 1.0", () => {
      const plan = planner.createPlan(
        "Major change",
        "pm_spec",
        "summary",
        "Complete rewrite"
      );

      expect(plan.impactScore).toBeLessThanOrEqual(1.0);
    });
  });

  describe("priority assignment", () => {
    it("should assign critical priority to target artifact", () => {
      const plan = planner.createPlan(
        "Test change",
        "arch_design",
        "summary",
        "New summary"
      );

      const targetUpdate = plan.updates.find(u => u.artifactType === "arch_design");
      expect(targetUpdate?.priority).toBe("critical");
    });

    it("should assign high priority to direct dependents", () => {
      const plan = planner.createPlan(
        "Test change",
        "arch_design",
        "summary",
        "New summary"
      );

      const directDependent = plan.updates.find(u => 
        u.artifactType !== "arch_design" && u.priority === "high"
      );
      // Direct dependents should have high priority
      expect(directDependent?.priority).toBe("high");
    });

    it("should assign medium/low priority to transitive dependents", () => {
      const plan = planner.createPlan(
        "Test change",
        "pm_spec",
        "summary",
        "New summary"
      );

      const transitiveDependent = plan.updates.find(u => 
        u.artifactType !== "pm_spec" && u.priority !== "critical"
      );
      if (transitiveDependent) {
        expect(["medium", "low"]).toContain(transitiveDependent.priority);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle single artifact", async () => {
      const singleArtifact = {
        pm_spec: {
          content: {
            summary: "Test",
          },
        },
      };

      const singleGraph = new SchemaKnowledgeGraph();
      mockGenerateWithLLM.mockResolvedValue("[]");
      await singleGraph.build(singleArtifact);

      const singlePlanner = new RefinementPlanner(singleGraph);
      const plan = singlePlanner.createPlan(
        "Change summary",
        "pm_spec",
        "summary",
        "New summary"
      );

      expect(plan.updates.length).toBe(1);
      expect(plan.unaffectedArtifacts).toHaveLength(0);
    });

    it("should handle empty dependency graph", async () => {
      const emptyGraph = new SchemaKnowledgeGraph();
      mockGenerateWithLLM.mockResolvedValue("[]");
      await emptyGraph.build({
        pm_spec: { content: { summary: "Test" } },
      });

      const emptyPlanner = new RefinementPlanner(emptyGraph);
      const plan = emptyPlanner.createPlan(
        "Change",
        "pm_spec",
        "summary",
        "New"
      );

      expect(plan.updates.length).toBeGreaterThan(0);
    });

    it("should handle very long intent strings", () => {
      const longIntent = "Change ".repeat(100);
      
      const plan = planner.createPlan(
        longIntent,
        "arch_design",
        "summary",
        "New"
      );

      expect(plan.originalIntent).toBe(longIntent);
    });

    it("should handle special characters in values", () => {
      const specialValue = "Path with /special-chars_and.stuff";
      
      const plan = planner.createPlan(
        "Update path",
        "arch_design",
        "apis[0].path",
        specialValue
      );

      expect(plan.newValue).toBe(specialValue);
    });
  });
});
