import { describe, it, expect } from "vitest";
import { DeploymentGenerator } from "@/lib/artifacts/deployment-generator";
import type { Diagram } from "@/types/diagram";

const mockDiagram: Diagram = {
  id: "test-1",
  user_id: "user-1",
  title: "Test App",
  description: "A test application",
  nodes: [],
  edges: [],
  status: "completed",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  metadata: {
    metasop_artifacts: {
      arch_design: {
        content: {
          database_schema: {
            tables: [{ table_name: "users" }],
          },
        },
      },
    },
  },
};

describe("DeploymentGenerator", () => {
  describe("generateDeploymentGuide", () => {
    it("should generate deployment guide", () => {
      const generator = new DeploymentGenerator(mockDiagram);
      const guide = generator.generateDeploymentGuide();

      expect(guide).toContain("# Deployment Guide");
      expect(guide).toContain("Test App");
    });

    it("should include prerequisites", () => {
      const generator = new DeploymentGenerator(mockDiagram);
      const guide = generator.generateDeploymentGuide();

      expect(guide).toContain("Prerequisites");
      expect(guide).toContain("Node.js");
    });

    it("should include database setup if database exists", () => {
      const generator = new DeploymentGenerator(mockDiagram);
      const guide = generator.generateDeploymentGuide();

      expect(guide).toContain("Database Setup");
    });
  });
});

