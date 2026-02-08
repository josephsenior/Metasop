import type { Diagram } from "@/types/diagram"
import { getAllArtifactsContent, stringifyArtifact } from "@/lib/generators/artifact-serialization"

export class TechComparisonGenerator {
  private diagram: Diagram

  constructor(diagram: Diagram) {
    this.diagram = diagram
  }

  generateComparisonMatrix(): Record<string, unknown> | undefined {
    return getAllArtifactsContent(this.diagram)
  }

  generateMarkdownComparison(): string {
    const content = getAllArtifactsContent(this.diagram)
    return stringifyArtifact(content)
  }
}
