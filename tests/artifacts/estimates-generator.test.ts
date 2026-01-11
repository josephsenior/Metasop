import { describe, it, expect } from "vitest";
import { EstimatesGenerator } from "@/lib/artifacts/estimates-generator";
import type { Diagram } from "@/types/diagram";

const mockDiagram: Diagram = {
  id: "test-1",
  user_id: "user-1",
  title: "Test Project",
  description: "A test project",
  nodes: [
    { id: "1", label: "Component1", type: "component" },
    { id: "2", label: "Component2", type: "component" },
    { id: "3", label: "Service1", type: "service" },
    { id: "4", label: "Database1", type: "database" },
  ],
  edges: [],
  status: "completed",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  metadata: {
    metasop_artifacts: {
      pm_spec: { content: {} },
      arch_design: { content: {} },
      ui_design: { content: {} },
      qa_verification: { content: {} },
    },
  },
};

describe("EstimatesGenerator", () => {
  describe("calculateDevelopmentEstimate", () => {
    it("should calculate development estimates", () => {
      const generator = new EstimatesGenerator(mockDiagram);
      const estimate = generator.calculateDevelopmentEstimate();

      expect(estimate).toHaveProperty("totalHours");
      expect(estimate).toHaveProperty("totalDays");
      expect(estimate).toHaveProperty("timeline");
      expect(estimate).toHaveProperty("recommendedTeamSize");
      expect(estimate).toHaveProperty("breakdown");
    });

    it("should have positive values", () => {
      const generator = new EstimatesGenerator(mockDiagram);
      const estimate = generator.calculateDevelopmentEstimate();

      expect(estimate.totalHours).toBeGreaterThan(0);
      expect(estimate.totalDays).toBeGreaterThan(0);
      expect(estimate.timeline).toBeGreaterThan(0);
      expect(estimate.recommendedTeamSize).toBeGreaterThan(0);
    });
  });

  describe("calculateCostEstimate", () => {
    it("should calculate cost estimates", () => {
      const generator = new EstimatesGenerator(mockDiagram);
      const devEstimate = generator.calculateDevelopmentEstimate();
      const costEstimate = generator.calculateCostEstimate(devEstimate);

      expect(costEstimate).toHaveProperty("infrastructure");
      expect(costEstimate).toHaveProperty("development");
      expect(costEstimate).toHaveProperty("totalFirstYear");
    });
  });

  describe("calculateComplexity", () => {
    it("should calculate complexity score", () => {
      const generator = new EstimatesGenerator(mockDiagram);
      const complexity = generator.calculateComplexity();

      expect(complexity).toHaveProperty("score");
      expect(complexity).toHaveProperty("level");
      expect(complexity).toHaveProperty("factors");
      expect(complexity.score).toBeGreaterThanOrEqual(1);
      expect(complexity.score).toBeLessThanOrEqual(10);
    });
  });
});

