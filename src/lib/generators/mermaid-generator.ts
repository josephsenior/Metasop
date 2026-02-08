import type { Diagram } from "@/types/diagram"
import { getArtifactContent, stringifyArtifact } from "@/lib/generators/artifact-serialization"

export class MermaidGenerator {
  private diagram: Diagram

  constructor(diagram: Diagram) {
    this.diagram = diagram
  }

  /**
   * Generate Mermaid flowchart from diagram (artifact-centric; no graph nodes/edges).
   */
  generateMermaidDiagram(): string {
    const content = getArtifactContent(this.diagram, "arch_design")
    return stringifyArtifact(content)
  }

  /**
   * Generate Mermaid sequence diagram from arch artifacts (APIs).
   */
  generateSequenceDiagram(): string {
    const content = getArtifactContent(this.diagram, "arch_design")
    return stringifyArtifact(content)
  }
}

