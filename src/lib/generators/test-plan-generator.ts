import type { Diagram } from "@/types/diagram"
import { getArtifactContent, stringifyArtifact } from "@/lib/generators/artifact-serialization"

export class TestPlanGenerator {
  private diagram: Diagram

  constructor(diagram: Diagram) {
    this.diagram = diagram
  }

  /**
   * Generate comprehensive test plan
   */
  generateTestPlan(): string {
    const content = getArtifactContent(this.diagram, "qa_verification")
    return stringifyArtifact(content)
  }
}

