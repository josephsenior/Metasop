/**
 * Knowledge Graph Types Tests
 * 
 * Tests for type definitions and constants
 */

import { describe, it, expect } from "vitest";
import {
  DEFAULT_KG_CONFIG,
  ARTIFACT_DEPENDENCY_MAP,
} from "@/lib/metasop/knowledge-graph/types";

describe("Knowledge Graph Types", () => {
  describe("DEFAULT_KG_CONFIG", () => {
    it("should have valid default configuration", () => {
      expect(DEFAULT_KG_CONFIG.minConfidence).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_KG_CONFIG.minConfidence).toBeLessThanOrEqual(1);
      expect(DEFAULT_KG_CONFIG.maxDepth).toBeGreaterThan(0);
      expect(typeof DEFAULT_KG_CONFIG.enableSemanticMatching).toBe("boolean");
      expect(Array.isArray(DEFAULT_KG_CONFIG.ignoredFields)).toBe(true);
      expect(Array.isArray(DEFAULT_KG_CONFIG.identifierFields)).toBe(true);
    });

    it("should have reasonable default values", () => {
      expect(DEFAULT_KG_CONFIG.minConfidence).toBe(0.7);
      expect(DEFAULT_KG_CONFIG.maxDepth).toBe(5);
      expect(DEFAULT_KG_CONFIG.enableSemanticMatching).toBe(true);
    });

    it("should have common identifier fields", () => {
      expect(DEFAULT_KG_CONFIG.identifierFields).toContain("id");
      expect(DEFAULT_KG_CONFIG.identifierFields).toContain("name");
      expect(DEFAULT_KG_CONFIG.identifierFields).toContain("path");
    });

    it("should have common ignored fields", () => {
      expect(DEFAULT_KG_CONFIG.ignoredFields).toContain("summary");
      expect(DEFAULT_KG_CONFIG.ignoredFields).toContain("description");
    });
  });

  describe("ARTIFACT_DEPENDENCY_MAP", () => {
    it("should define dependencies for all artifact types", () => {
      const expectedArtifacts = [
        "pm_spec",
        "arch_design",
        "security_architecture",
        "devops_infrastructure",
        "ui_design",
        "engineer_impl",
        "qa_verification",
      ];

      for (const artifact of expectedArtifacts) {
        expect(ARTIFACT_DEPENDENCY_MAP).toHaveProperty(artifact);
        expect(Array.isArray(ARTIFACT_DEPENDENCY_MAP[artifact])).toBe(true);
      }
    });

    it("should have pm_spec as root (no dependencies)", () => {
      expect(ARTIFACT_DEPENDENCY_MAP.pm_spec).toHaveLength(0);
    });

    it("should have architect depend on pm_spec", () => {
      expect(ARTIFACT_DEPENDENCY_MAP.arch_design).toContain("pm_spec");
    });

    it("should have security depend on architect and pm_spec", () => {
      expect(ARTIFACT_DEPENDENCY_MAP.security_architecture).toContain("arch_design");
      expect(ARTIFACT_DEPENDENCY_MAP.security_architecture).toContain("pm_spec");
    });

    it("should have engineer depend on multiple upstream artifacts", () => {
      const engineerDeps = ARTIFACT_DEPENDENCY_MAP.engineer_impl;
      expect(engineerDeps.length).toBeGreaterThanOrEqual(3);
      expect(engineerDeps).toContain("arch_design");
      expect(engineerDeps).toContain("pm_spec");
    });

    it("should have qa depend on all other artifacts", () => {
      const qaDeps = ARTIFACT_DEPENDENCY_MAP.qa_verification;
      expect(qaDeps.length).toBeGreaterThanOrEqual(5);
      expect(qaDeps).toContain("engineer_impl");
      expect(qaDeps).toContain("arch_design");
    });

    it("should not have circular dependencies", () => {
      const visited = new Set<string>();
      const stack = new Set<string>();

      function hasCircular(artifact: string): boolean {
        if (stack.has(artifact)) return true;
        if (visited.has(artifact)) return false;

        visited.add(artifact);
        stack.add(artifact);

        for (const dep of ARTIFACT_DEPENDENCY_MAP[artifact] || []) {
          if (hasCircular(dep)) return true;
        }

        stack.delete(artifact);
        return false;
      }

      for (const artifact of Object.keys(ARTIFACT_DEPENDENCY_MAP)) {
        visited.clear();
        stack.clear();
        expect(hasCircular(artifact)).toBe(false);
      }
    });

    it("should have dependencies in valid order", () => {
      // All dependencies should come before dependents in a valid pipeline
      const pipelineOrder = [
        "pm_spec",
        "arch_design",
        "security_architecture",
        "devops_infrastructure",
        "ui_design",
        "engineer_impl",
        "qa_verification",
      ];

      for (const [artifact, deps] of Object.entries(ARTIFACT_DEPENDENCY_MAP)) {
        const artifactIndex = pipelineOrder.indexOf(artifact);
        for (const dep of deps) {
          const depIndex = pipelineOrder.indexOf(dep);
          expect(depIndex).toBeLessThan(artifactIndex);
        }
      }
    });
  });
});
