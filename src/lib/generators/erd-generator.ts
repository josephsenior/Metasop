import type { Diagram } from "@/types/diagram"
import { getArtifactContent, stringifyArtifact } from "@/lib/generators/artifact-serialization"

export class ERDGenerator {
  private diagram: Diagram

  constructor(diagram: Diagram) {
    this.diagram = diagram
  }

  generateMermaidERD(): string {
    const arch = (getArtifactContent(this.diagram, "arch_design") as any) || {}
    const content = arch.database_schema ?? arch
    return stringifyArtifact(content)
  }

  generatePlantUMLERD(): string {
    const arch = (getArtifactContent(this.diagram, "arch_design") as any) || {}
    const content = arch.database_schema ?? arch
    return stringifyArtifact(content)
  }

  generateMarkdownERD(): string {
    const arch = (getArtifactContent(this.diagram, "arch_design") as any) || {}
    const content = arch.database_schema ?? arch
    return stringifyArtifact(content)
  }
}
