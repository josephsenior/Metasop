import { describe, it, expect } from "vitest";
import { ADRGenerator } from "@/lib/artifacts/adr-generator";
import type { Diagram } from "@/types/diagram";

const mockDiagram: Diagram = {
  id: "test-1",
  user_id: "user-1",
  title: "Test Project",
  description: "A test project",
  nodes: [],
  edges: [],
  status: "completed",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  metadata: {
    metasop_artifacts: {
      arch_design: {
        content: {
          decisions: [
            {
              decision: "Use React",
              reason: "Popular framework",
              tradeoffs: "Large bundle size",
            },
          ],
        },
      },
      engineer_impl: {
        content: {
          technical_decisions: [
            {
              decision: "Use TypeScript",
              reason: "Type safety",
            },
          ],
        },
      },
    },
  },
};

describe("ADRGenerator", () => {
  describe("generateADRs", () => {
    it("should generate ADRs", () => {
      const generator = new ADRGenerator(mockDiagram);
      const adrs = generator.generateADRs();

      expect(adrs).toContain("# Architecture Decision Records");
      expect(adrs).toContain("Test Project");
    });

    it("should include decisions from artifacts", () => {
      const generator = new ADRGenerator(mockDiagram);
      const adrs = generator.generateADRs();

      expect(adrs).toContain("Use React");
      expect(adrs).toContain("Use TypeScript");
    });

    it("should generate default ADR if no decisions", () => {
      const diagramWithoutDecisions: Diagram = {
        ...mockDiagram,
        metadata: { metasop_artifacts: {} },
      };
      const generator = new ADRGenerator(diagramWithoutDecisions);
      const adrs = generator.generateADRs();

      expect(adrs).toContain("ADR-0001");
      expect(adrs).toContain("Technology Stack Selection");
    });
  });
});

