import { describe, it, expect, vi } from "vitest";
import type { Diagram } from "@/types/diagram";

// Mock JSZip before importing CodeGenerator
const mockFile = vi.fn().mockReturnThis();
const mockGenerateAsync = vi.fn().mockResolvedValue(new Blob(["test"], { type: "application/zip" }));

class MockJSZip {
  file = mockFile;
  generateAsync = mockGenerateAsync;
}

vi.mock("jszip", () => ({
  __esModule: true,
  default: MockJSZip,
}));

// Import after mock
import { CodeGenerator } from "@/lib/artifacts/code-generator";

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
      engineer_impl: {
        content: {
          dependencies: ["react", "next"],
          file_structure: {
            name: "src",
            type: "folder",
            children: [
              { name: "components", type: "folder" },
              { name: "app.tsx", type: "file" },
            ],
          },
        },
      },
      arch_design: {
        content: {
          apis: [{ method: "GET", path: "/api/users" }],
          database_schema: {
            tables: [{ table_name: "users", columns: [] }],
          },
        },
      },
      ui_design: {
        content: {
          component_hierarchy: { name: "App", root: "App" },
        },
      },
    },
  },
};

describe("CodeGenerator", () => {
  describe("generateProjectScaffold", () => {
    it("should generate project scaffold ZIP", async () => {
      const generator = new CodeGenerator(mockDiagram);
      const zip = await generator.generateProjectScaffold();

      expect(zip).toBeInstanceOf(Blob);
      expect(zip.type).toBe("application/zip");
      expect(mockGenerateAsync).toHaveBeenCalled();
    });
  });
});

