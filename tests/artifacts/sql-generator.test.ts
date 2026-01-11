import { describe, it, expect } from "vitest";
import { SQLGenerator } from "@/lib/artifacts/sql-generator";
import type { Diagram } from "@/types/diagram";

const mockDiagram: Diagram = {
  id: "test-1",
  user_id: "user-1",
  title: "Test Database",
  description: "A test database",
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
            tables: [
              {
                table_name: "users",
                columns: [
                  { name: "id", type: "INTEGER", constraints: ["PRIMARY KEY"] },
                  { name: "email", type: "VARCHAR(255)", constraints: ["NOT NULL", "UNIQUE"] },
                ],
              },
            ],
          },
        },
      },
    },
  },
};

describe("SQLGenerator", () => {
  describe("generateMigration", () => {
    it("should generate SQL migration", () => {
      const generator = new SQLGenerator(mockDiagram);
      const migration = generator.generateMigration();

      expect(migration).toContain("CREATE TABLE");
      expect(migration).toContain("users");
      expect(migration).toContain("BEGIN");
      expect(migration).toContain("COMMIT");
    });

    it("should include column definitions", () => {
      const generator = new SQLGenerator(mockDiagram);
      const migration = generator.generateMigration();

      expect(migration).toContain("id");
      expect(migration).toContain("email");
      expect(migration).toContain("PRIMARY KEY");
    });
  });

  describe("generateSeedData", () => {
    it("should generate seed data SQL", () => {
      const generator = new SQLGenerator(mockDiagram);
      const seed = generator.generateSeedData();

      expect(seed).toContain("Seed data");
      expect(seed).toContain("BEGIN");
      expect(seed).toContain("COMMIT");
    });
  });
});

