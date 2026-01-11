import { describe, it, expect } from "vitest";
import { OpenAPIGenerator } from "@/lib/artifacts/openapi-generator";
import type { Diagram } from "@/types/diagram";

const mockDiagram: Diagram = {
  id: "test-1",
  user_id: "user-1",
  title: "Test API",
  description: "A test API",
  nodes: [],
  edges: [],
  status: "completed",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  metadata: {
    metasop_artifacts: {
      arch_design: {
        content: {
          apis: [
            {
              method: "GET",
              path: "/api/users",
              description: "Get all users",
              auth_required: true,
            },
            {
              method: "POST",
              path: "/api/users",
              description: "Create user",
            },
          ],
        },
      },
    },
  },
};

describe("OpenAPIGenerator", () => {
  describe("generateOpenAPISpec", () => {
    it("should generate OpenAPI 3.0 spec", () => {
      const generator = new OpenAPIGenerator(mockDiagram);
      const spec = generator.generateOpenAPISpec();

      expect(spec).toContain('"openapi": "3.0.0"');
      expect(spec).toContain("Test API");
    });

    it("should include API paths", () => {
      const generator = new OpenAPIGenerator(mockDiagram);
      const spec = JSON.parse(generator.generateOpenAPISpec());

      expect(spec.paths).toBeDefined();
      expect(spec.paths["/api/users"]).toBeDefined();
    });

    it("should include authentication", () => {
      const generator = new OpenAPIGenerator(mockDiagram);
      const spec = JSON.parse(generator.generateOpenAPISpec());

      expect(spec.components.securitySchemes).toBeDefined();
      expect(spec.components.securitySchemes.bearerAuth).toBeDefined();
    });
  });
});

