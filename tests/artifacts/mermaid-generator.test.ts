import { describe, it, expect } from "vitest";
import { MermaidGenerator } from "@/lib/artifacts/mermaid-generator";
import type { Diagram } from "@/types/diagram";

const mockDiagram: Diagram = {
  id: "test-1",
  user_id: "user-1",
  title: "Test Diagram",
  description: "A test diagram",
  nodes: [
    { id: "1", label: "Component1", type: "component" },
    { id: "2", label: "Service1", type: "service" },
    { id: "3", label: "Database1", type: "database" },
  ],
  edges: [
    { id: "e1", from: "1", to: "2", label: "calls" },
    { id: "e2", from: "2", to: "3", label: "queries" },
  ],
  status: "completed",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  metadata: {},
};

describe("MermaidGenerator", () => {
  describe("generateMermaidDiagram", () => {
    it("should generate Mermaid flowchart", () => {
      const generator = new MermaidGenerator(mockDiagram);
      const mermaid = generator.generateMermaidDiagram();

      expect(mermaid).toContain("flowchart TD");
      expect(mermaid).toContain("Component1");
      expect(mermaid).toContain("Service1");
    });

    it("should include edges", () => {
      const generator = new MermaidGenerator(mockDiagram);
      const mermaid = generator.generateMermaidDiagram();

      expect(mermaid).toContain("-->");
    });

    it("should include styling", () => {
      const generator = new MermaidGenerator(mockDiagram);
      const mermaid = generator.generateMermaidDiagram();

      expect(mermaid).toContain("classDef");
    });
  });

  describe("generateSequenceDiagram", () => {
    it("should generate sequence diagram", () => {
      const generator = new MermaidGenerator(mockDiagram);
      const sequence = generator.generateSequenceDiagram();

      expect(sequence).toContain("sequenceDiagram");
    });
  });
});

