import type { Diagram } from "@/types/diagram"
import { getArtifactContent, stringifyArtifact } from "@/lib/generators/artifact-serialization"

export class ADRGenerator {
  private diagram: Diagram

  constructor(diagram: Diagram) {
    this.diagram = diagram
  }

  /**
   * Generate Architecture Decision Records
   */
  generateADRs(): string {
    const archContent = (getArtifactContent(this.diagram, "arch_design") as any) || {}
    const engineerContent = (getArtifactContent(this.diagram, "engineer_impl") as any) || {}

    const decisions = Array.isArray(archContent.decisions) ? archContent.decisions : []
    const technicalDecisions = Array.isArray(engineerContent.technical_decisions)
      ? engineerContent.technical_decisions
      : []

    return stringifyArtifact([...decisions, ...technicalDecisions])
  }
}

