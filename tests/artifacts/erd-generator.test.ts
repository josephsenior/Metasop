import { describe, it, expect } from "vitest";
import { ERDGenerator } from "@/lib/artifacts/erd-generator";
import type { Diagram } from "@/types/diagram";

const mockDiagram: Diagram = {
  id: "test-1",
  user_id: "user-1",
  title: "Test Database",
  description: "A test database",
  nodes: [
    { id: "1", label: "Users", type: "database" },
    { id: "2", label: "Posts", type: "database" },
  ],
  edges: [
    { id: "e1", from: "1", to: "2", label: "has many" },
  ],
  status: "completed",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  metadata: {
    metasop_artifacts: {
      arch_design: {
        content: {
          database_schema: {
            tables: [
              {
                table_name: "users",
                columns: [
                  { name: "id", type: "INTEGER", constraints: ["PRIMARY KEY"] },
                  { name: "email", type: "VARCHAR(255)" },
                ],
              },
            ],
          },
        },
      },
    },
  },
};

describe("ERDGenerator", () => {
  describe("generateMermaidERD", () => {
    it("should generate Mermaid ERD", () => {
      const generator = new ERDGenerator(mockDiagram);
      const erd = generator.generateMermaidERD();

      expect(erd).toContain("erDiagram");
      expect(erd).toContain("users");
    });
  });

  describe("generatePlantUMLERD", () => {
    it("should generate PlantUML ERD", () => {
      const generator = new ERDGenerator(mockDiagram);
      const erd = generator.generatePlantUMLERD();

      expect(erd).toContain("@startuml");
      expect(erd).toContain("entity");
      expect(erd).toContain("@enduml");
    });
  });

  describe("generateMarkdownERD", () => {
    it("should generate Markdown ERD", () => {
      const generator = new ERDGenerator(mockDiagram);
      const erd = generator.generateMarkdownERD();

      expect(erd).toContain("# Entity Relationship Diagram");
      expect(erd).toContain("users");
    });
  });
});

