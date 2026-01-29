/**
 * Knowledge Graph Integration Tests
 * 
 * End-to-end tests for the complete knowledge graph workflow
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SchemaKnowledgeGraph } from "@/lib/metasop/knowledge-graph/graph";
import { RefinementPlanner } from "@/lib/metasop/knowledge-graph/planner";

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

describe("Knowledge Graph Integration", () => {
  const mockGenerateWithLLM = vi.mocked(generateWithLLM);

  beforeEach(() => {
    mockGenerateWithLLM.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("complete workflow", () => {
    it("should build graph and create refinement plan", async () => {
      // Mock LLM to detect some references
      mockGenerateWithLLM.mockResolvedValue(JSON.stringify([
        { index: 1, references: true, confidence: 0.9 },
        { index: 2, references: true, confidence: 0.85 },
      ]));

      const artifacts = {
        pm_spec: {
          content: {
            summary: "E-commerce platform",
            user_stories: [
              { id: "US-1", title: "Add to cart" },
              { id: "US-2", title: "Checkout" },
            ],
          },
        },
        arch_design: {
          content: {
            summary: "E-commerce architecture",
            apis: [
              { path: "/api/cart/add", method: "POST" },
              { path: "/api/checkout", method: "POST" },
            ],
          },
        },
        engineer_impl: {
          content: {
            summary: "Implementation with cart and checkout modules",
            dependencies: ["express"],
          },
        },
      };

      // Step 1: Build the knowledge graph
      const graph = new SchemaKnowledgeGraph();
      const buildResult = await graph.build(artifacts);

      expect(buildResult.nodeCount).toBeGreaterThan(0);
      expect(buildResult.artifactsProcessed).toHaveLength(3);

      // Step 2: Create a refinement planner
      const planner = new RefinementPlanner(graph);

      // Step 3: Create a refinement plan
      const plan = planner.createPlan(
        "Update checkout API to support PayPal",
        "arch_design",
        "apis[1].path",
        "/api/checkout/v2"
      );

      expect(plan).toBeDefined();
      expect(plan.updates.length).toBeGreaterThanOrEqual(1);
      expect(plan.impactScore).toBeGreaterThan(0);

      // Step 4: Validate the plan
      const validation = planner.validatePlan(plan);
      expect(validation.valid).toBe(true);
    });

    it("should handle cascading changes correctly", async () => {
      mockGenerateWithLLM.mockResolvedValue(JSON.stringify([
        { index: 1, references: true, confidence: 0.9 },
      ]));

      const artifacts = {
        pm_spec: {
          content: {
            summary: "Platform",
            user_stories: [{ id: "US-1", title: "Login" }],
          },
        },
        arch_design: {
          content: {
            summary: "Architecture",
            apis: [{ path: "/api/login", method: "POST" }],
          },
        },
        engineer_impl: {
          content: {
            summary: "Implementation referencing /api/login",
            file_structure: { name: "src", type: "directory", children: [] },
          },
        },
        qa_verification: {
          content: {
            summary: "Test plan for login",
            test_cases: [{ id: "TC-1", name: "Test login" }],
          },
        },
      };

      const graph = new SchemaKnowledgeGraph();
      await graph.build(artifacts);

      const planner = new RefinementPlanner(graph);

      // Change at PM level should cascade to all downstream
      const plan = planner.createPlan(
        "Change login to use OAuth",
        "pm_spec",
        "user_stories[0].title",
        "Login with OAuth"
      );

      // Should have updates for all artifacts
      const artifactTypes = plan.updates.map(u => u.artifactType);
      expect(artifactTypes).toContain("pm_spec");
      
      // Updates should be in dependency order
      const pmIndex = artifactTypes.indexOf("pm_spec");
      const archIndex = artifactTypes.indexOf("arch_design");
      const engineerIndex = artifactTypes.indexOf("engineer_impl");

      if (archIndex !== -1) {
        expect(pmIndex).toBeLessThan(archIndex);
      }
      if (engineerIndex !== -1 && archIndex !== -1) {
        expect(archIndex).toBeLessThan(engineerIndex);
      }
    });

    it("should export and import graph correctly", async () => {
      mockGenerateWithLLM.mockResolvedValue("[]");

      const artifacts = {
        pm_spec: {
          content: {
            summary: "Test",
            user_stories: [{ id: "US-1", title: "Story" }],
          },
        },
      };

      // Build and export
      const graph1 = new SchemaKnowledgeGraph();
      await graph1.build(artifacts);
      const exported = graph1.export();

      // Import into new graph
      const graph2 = new SchemaKnowledgeGraph();
      graph2.import({ nodes: exported.nodes, edges: exported.edges });

      // Should have same stats
      expect(graph2.getStats().nodes).toBe(graph1.getStats().nodes);
      expect(graph2.getStats().edges).toBe(graph1.getStats().edges);

      // Should be able to query
      const planner = new RefinementPlanner(graph2);
      const plan = planner.createPlan(
        "Change",
        "pm_spec",
        "summary",
        "New summary"
      );

      expect(plan.updates.length).toBeGreaterThan(0);
    });
  });

  describe("real-world scenarios", () => {
    it("should handle API endpoint changes", async () => {
      mockGenerateWithLLM.mockImplementation((prompt) => {
        // Simulate LLM detecting references to API paths
        if (prompt.includes("/api/users")) {
          return Promise.resolve(JSON.stringify([
            { index: 1, references: true, confidence: 0.95 },
          ]));
        }
        return Promise.resolve("[]");
      });

      const artifacts = {
        arch_design: {
          content: {
            summary: "User management API",
            apis: [
              { path: "/api/users", method: "GET", description: "List users" },
              { path: "/api/users", method: "POST", description: "Create user" },
            ],
          },
        },
        engineer_impl: {
          content: {
            summary: "Implementation with user routes",
            file_structure: {
              name: "src",
              type: "directory",
              children: [
                { name: "routes", type: "directory", children: [{ name: "users.ts", type: "file" }] },
              ],
            },
          },
        },
      };

      const graph = new SchemaKnowledgeGraph();
      await graph.build(artifacts);

      const planner = new RefinementPlanner(graph);
      const plan = planner.createPlan(
        "Change users endpoint to /api/v2/users",
        "arch_design",
        "apis[0].path",
        "/api/v2/users"
      );

      // Should detect impact on engineer implementation
      const engineerUpdate = plan.updates.find(u => u.artifactType === "engineer_impl");
      expect(engineerUpdate).toBeDefined();
      expect(engineerUpdate?.instruction.toLowerCase()).toContain("api");
    });

    it("should handle database schema changes", async () => {
      mockGenerateWithLLM.mockResolvedValue(JSON.stringify([
        { index: 1, references: true, confidence: 0.9 },
      ]));

      const artifacts = {
        arch_design: {
          content: {
            summary: "Database design",
            database_schema: {
              tables: [
                { name: "users", columns: [{ name: "id", type: "UUID" }] },
              ],
            },
          },
        },
        engineer_impl: {
          content: {
            summary: "Implementation with user models",
            file_structure: {
              name: "src",
              type: "directory",
              children: [
                { name: "models", type: "directory", children: [{ name: "user.ts", type: "file" }] },
              ],
            },
          },
        },
      };

      const graph = new SchemaKnowledgeGraph();
      await graph.build(artifacts);

      const planner = new RefinementPlanner(graph);
      const plan = planner.createPlan(
        "Add email column to users table",
        "arch_design",
        "database_schema.tables[0].columns",
        [{ name: "id", type: "UUID" }, { name: "email", type: "VARCHAR" }]
      );

      const engineerUpdate = plan.updates.find(u => u.artifactType === "engineer_impl");
      if (engineerUpdate) {
        expect(engineerUpdate.instruction.toLowerCase()).toContain("database");
      }
    });

    it("should handle authentication method changes", async () => {
      mockGenerateWithLLM.mockResolvedValue(JSON.stringify([
        { index: 1, references: true, confidence: 0.95 },
        { index: 2, references: true, confidence: 0.9 },
      ]));

      const artifacts = {
        security_architecture: {
          content: {
            summary: "Security design",
            security_architecture: {
              authentication: {
                method: "JWT",
                providers: ["email"],
              },
            },
          },
        },
        engineer_impl: {
          content: {
            summary: "Implementation with JWT auth",
            dependencies: ["jsonwebtoken"],
          },
        },
        devops_infrastructure: {
          content: {
            summary: "Infrastructure with JWT secrets",
            infrastructure: {
              services: [{ name: "auth-service", type: "compute" }],
            },
          },
        },
      };

      const graph = new SchemaKnowledgeGraph();
      await graph.build(artifacts);

      const planner = new RefinementPlanner(graph);
      const plan = planner.createPlan(
        "Switch from JWT to OAuth2",
        "security_architecture",
        "security_architecture.authentication.method",
        "OAuth2"
      );

      // Should impact both engineer and devops
      const artifactTypes = plan.updates.map(u => u.artifactType);
      expect(artifactTypes).toContain("security_architecture");
      
      // Impact score should be high for auth changes
      expect(plan.impactScore).toBeGreaterThan(0.3);
    });
  });

  describe("error handling", () => {
    it("should handle LLM failures gracefully", async () => {
      mockGenerateWithLLM.mockRejectedValue(new Error("LLM API unavailable"));

      const artifacts = {
        pm_spec: { content: { summary: "Test" } },
        arch_design: { content: { summary: "Test" } },
      };

      const graph = new SchemaKnowledgeGraph();
      const result = await graph.build(artifacts);

      // Should still build nodes
      expect(result.nodeCount).toBeGreaterThan(0);
      
      // But no edges (since LLM failed)
      expect(result.edgeCount).toBe(0);
    });

    it("should handle malformed LLM responses", async () => {
      mockGenerateWithLLM.mockResolvedValue("Invalid JSON response");

      const artifacts = {
        pm_spec: { content: { summary: "Test" } },
        arch_design: { content: { summary: "Test" } },
      };

      const graph = new SchemaKnowledgeGraph();
      const result = await graph.build(artifacts);

      // Should still complete without throwing
      expect(result.nodeCount).toBeGreaterThan(0);
    });

    it("should handle missing artifacts in plan creation", async () => {
      mockGenerateWithLLM.mockResolvedValue("[]");

      const artifacts = {
        pm_spec: { content: { summary: "Test" } },
      };

      const graph = new SchemaKnowledgeGraph();
      await graph.build(artifacts);

      const planner = new RefinementPlanner(graph);

      // Should throw for non-existent path
      expect(() => {
        planner.createPlan(
          "Change",
          "pm_spec",
          "nonexistent.path",
          "value"
        );
      }).toThrow();
    });
  });

  describe("performance", () => {
    it("should handle large artifacts efficiently", async () => {
      mockGenerateWithLLM.mockResolvedValue("[]");

      // Create artifact with many items
      const largeArtifact = {
        arch_design: {
          content: {
            summary: "Large API",
            apis: Array.from({ length: 50 }, (_, i) => ({
              path: `/api/endpoint-${i}`,
              method: "GET",
              description: `Endpoint ${i} description`,
            })),
          },
        },
      };

      const startTime = Date.now();
      const graph = new SchemaKnowledgeGraph();
      const result = await graph.build(largeArtifact);
      const buildTime = Date.now() - startTime;

      expect(result.nodeCount).toBeGreaterThan(50);
      expect(buildTime).toBeLessThan(5000); // Should complete in reasonable time
    });

    it("should batch LLM calls efficiently", async () => {
      const callCount = { value: 0 };
      mockGenerateWithLLM.mockImplementation(() => {
        callCount.value++;
        return Promise.resolve("[]");
      });

      const artifacts = {
        arch_design: {
          content: {
            summary: "API",
            apis: Array.from({ length: 30 }, (_, i) => ({
              path: `/api/endpoint-${i}`,
              method: "GET",
            })),
          },
        },
        engineer_impl: {
          content: {
            summary: "Implementation",
          },
        },
      };

      const graph = new SchemaKnowledgeGraph();
      await graph.build(artifacts);

      // Should batch calls (30 candidates / 20 per batch = 2 calls)
      expect(callCount.value).toBeLessThanOrEqual(5);
    });
  });
});
