import { describe, it, expect } from "vitest";
import { TestPlanGenerator } from "@/lib/artifacts/test-plan-generator";
import type { Diagram } from "@/types/diagram";

const mockDiagram: Diagram = {
  id: "test-1",
  user_id: "user-1",
  title: "Test Application",
  description: "A test application",
  nodes: [
    { id: "1", label: "Component1", type: "component" },
    { id: "2", label: "Service1", type: "service" },
  ],
  edges: [],
  status: "completed",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  metadata: {
    metasop_artifacts: {
      pm_spec: {
        content: {
          user_stories: [{ title: "Story 1", story: "As a user..." }],
        },
      },
      arch_design: {
        content: {
          apis: [{ method: "GET", path: "/api/test" }],
          database_schema: {
            tables: [{ table_name: "users", columns: [] }],
          },
        },
      },
      qa_verification: {
        content: {
          coverage: { percentage: 80 },
        },
      },
    },
  },
};

describe("TestPlanGenerator", () => {
  describe("generateTestPlan", () => {
    it("should generate comprehensive test plan", () => {
      const generator = new TestPlanGenerator(mockDiagram);
      const plan = generator.generateTestPlan();

      expect(plan).toContain("# Test Plan");
      expect(plan).toContain("Test Application");
    });

    it("should include unit test cases", () => {
      const generator = new TestPlanGenerator(mockDiagram);
      const plan = generator.generateTestPlan();

      expect(plan).toContain("Unit Test Cases");
      expect(plan).toContain("Component1");
    });

    it("should include integration test cases", () => {
      const generator = new TestPlanGenerator(mockDiagram);
      const plan = generator.generateTestPlan();

      expect(plan).toContain("Integration Test Cases");
      expect(plan).toContain("API Endpoints");
    });

    it("should include security test cases", () => {
      const generator = new TestPlanGenerator(mockDiagram);
      const plan = generator.generateTestPlan();

      expect(plan).toContain("Security Test Cases");
      expect(plan).toContain("Authentication Testing");
    });
  });
});

