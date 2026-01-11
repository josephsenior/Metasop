import { describe, it, expect } from "vitest";
import { APIClientGenerator } from "@/lib/artifacts/api-client-generator";
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
            { method: "GET", path: "/api/users", description: "Get users", auth_required: true },
            { method: "POST", path: "/api/users", description: "Create user", auth_required: true },
            { method: "DELETE", path: "/api/users/{id}", description: "Delete user" },
          ],
        },
      },
    },
  },
};

describe("APIClientGenerator", () => {
  describe("generateTypeScriptSDK", () => {
    it("should generate TypeScript SDK", () => {
      const generator = new APIClientGenerator(mockDiagram);
      const sdk = generator.generateTypeScriptSDK();

      expect(sdk).toContain("ApiClient");
      expect(sdk).toContain("class ApiClient");
    });

    it("should include API methods", () => {
      const generator = new APIClientGenerator(mockDiagram);
      const sdk = generator.generateTypeScriptSDK();

      expect(sdk).toContain("getUsers");
      expect(sdk).toContain("createUsers");
      expect(sdk).toContain("deleteUsers");
    });

    it("should include authentication support", () => {
      const generator = new APIClientGenerator(mockDiagram);
      const sdk = generator.generateTypeScriptSDK();

      expect(sdk).toContain("Authorization");
      expect(sdk).toContain("Bearer");
    });
  });

  describe("generatePythonSDK", () => {
    it("should generate Python SDK", () => {
      const generator = new APIClientGenerator(mockDiagram);
      const sdk = generator.generatePythonSDK();

      expect(sdk).toContain("class ApiClient");
      expect(sdk).toContain("def ");
    });
  });

  describe("generateCurlExamples", () => {
    it("should generate cURL examples", () => {
      const generator = new APIClientGenerator(mockDiagram);
      const examples = generator.generateCurlExamples();

      expect(examples).toContain("cURL Examples");
      expect(examples).toContain("curl -X GET");
      expect(examples).toContain("/api/users");
    });
  });
});

