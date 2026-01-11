import { describe, it, expect } from "vitest";
import { IaCGenerator } from "@/lib/artifacts/iac-generator";
import type { Diagram } from "@/types/diagram";

const mockDiagram: Diagram = {
  id: "test-1",
  user_id: "user-1",
  title: "Test App",
  description: "A test application",
  nodes: [
    { id: "1", label: "Service1", type: "service" },
    { id: "2", label: "Database1", type: "database" },
  ],
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

describe("IaCGenerator", () => {
  describe("generateDockerCompose", () => {
    it("should generate Docker Compose file", () => {
      const generator = new IaCGenerator(mockDiagram);
      const compose = generator.generateDockerCompose();

      expect(compose).toContain("version:");
      expect(compose).toContain("services:");
      expect(compose).toContain("app:");
    });

    it("should include database service if database exists", () => {
      const generator = new IaCGenerator(mockDiagram);
      const compose = generator.generateDockerCompose();

      expect(compose).toContain("db:");
      expect(compose).toContain("postgres");
    });
  });

  describe("generateKubernetesManifests", () => {
    it("should generate Kubernetes manifests", () => {
      const generator = new IaCGenerator(mockDiagram);
      const manifests = generator.generateKubernetesManifests();

      expect(manifests).toHaveProperty("deployment");
      expect(manifests).toHaveProperty("service");
      expect(manifests.deployment).toContain("apiVersion: apps/v1");
      expect(manifests.service).toContain("apiVersion: v1");
    });
  });

  describe("generateTerraform", () => {
    it("should generate Terraform configuration", () => {
      const generator = new IaCGenerator(mockDiagram);
      const terraform = generator.generateTerraform();

      expect(terraform).toContain("terraform {");
      expect(terraform).toContain("provider \"aws\"");
      expect(terraform).toContain("resource \"aws_vpc\"");
    });
  });
});

