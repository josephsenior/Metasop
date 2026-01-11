import { describe, it, expect } from "vitest";
import { TechComparisonGenerator } from "@/lib/artifacts/tech-comparison-generator";
import type { Diagram } from "@/types/diagram";

const mockDiagram: Diagram = {
  id: "test-1",
  user_id: "user-1",
  title: "React App",
  description: "A React application with Next.js and PostgreSQL",
  nodes: [
    { id: "1", label: "React Component", type: "component" },
    { id: "2", label: "PostgreSQL", type: "database" },
  ],
  edges: [],
  status: "completed",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  metadata: {},
};

describe("TechComparisonGenerator", () => {
  describe("generateComparisonMatrix", () => {
    it("should generate comparison matrix", () => {
      const generator = new TechComparisonGenerator(mockDiagram);
      const comparison = generator.generateComparisonMatrix();

      expect(comparison).toHaveProperty("frontend");
      expect(comparison).toHaveProperty("database");
    });
  });

  describe("generateMarkdownComparison", () => {
    it("should generate markdown comparison", () => {
      const generator = new TechComparisonGenerator(mockDiagram);
      const markdown = generator.generateMarkdownComparison();

      expect(markdown).toContain("# Technology Comparison Matrix");
      expect(markdown).toContain("React App");
    });
  });
});

