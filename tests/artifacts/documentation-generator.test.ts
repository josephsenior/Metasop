import { describe, it, expect } from "vitest";
import { DocumentationGenerator } from "@/lib/artifacts/documentation-generator";
import type { Diagram } from "@/types/diagram";

const mockDiagram: Diagram = {
  id: "test-1",
  user_id: "user-1",
  title: "Test Application",
  description: "A test application for testing",
  nodes: [],
  edges: [],
  status: "completed",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  metadata: {
    metasop_artifacts: {
      pm_spec: {
        content: {
          user_stories: [
            { title: "Story 1", story: "As a user, I want to test", priority: "high" },
          ],
          acceptance_criteria: ["Criterion 1", "Criterion 2"],
        },
      },
      arch_design: {
        content: {
          design_doc: "Architecture design document",
          decisions: [{ decision: "Use React", reason: "Popular framework" }],
          apis: [
            { method: "GET", path: "/api/users", description: "Get users" },
          ],
          database_schema: {
            tables: [
              {
                table_name: "users",
                columns: [
                  { name: "id", type: "INTEGER", constraints: ["PRIMARY KEY"] },
                  { name: "email", type: "VARCHAR(255)", constraints: ["NOT NULL"] },
                ],
              },
            ],
          },
        },
      },
      engineer_impl: {
        content: {
          implementation_plan: "Implementation plan",
          file_structure: { name: "src", type: "folder" },
          dependencies: ["react", "next"],
        },
      },
      ui_design: {
        content: {
          component_hierarchy: { name: "App", root: "App" },
          design_tokens: { colors: { primary: "#0000ff" } },
        },
      },
      qa_verification: {
        content: {
          coverage: { percentage: 80, lines: 75 },
          security_findings: [
            { vulnerability: "XSS", severity: "high", description: "Potential XSS" },
          ],
        },
      },
    },
  },
};

describe("DocumentationGenerator", () => {
  describe("generateMarkdown", () => {
    it("should generate markdown documentation", () => {
      const generator = new DocumentationGenerator(mockDiagram);
      const markdown = generator.generateMarkdown();

      expect(markdown).toContain("# Test Application");
      expect(markdown).toContain("Test Application");
      expect(markdown).toContain("A test application for testing");
    });

    it("should include user stories", () => {
      const generator = new DocumentationGenerator(mockDiagram);
      const markdown = generator.generateMarkdown();

      expect(markdown).toContain("User Stories");
      expect(markdown).toContain("Story 1");
    });

    it("should include API endpoints", () => {
      const generator = new DocumentationGenerator(mockDiagram);
      const markdown = generator.generateMarkdown();

      expect(markdown).toContain("API Endpoints");
      expect(markdown).toContain("GET /api/users");
    });

    it("should include database schema", () => {
      const generator = new DocumentationGenerator(mockDiagram);
      const markdown = generator.generateMarkdown();

      expect(markdown).toContain("Database Schema");
      expect(markdown).toContain("users");
    });
  });
});

