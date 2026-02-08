import type { Diagram } from "@/types/diagram"
import { getArtifactContent, stringifyArtifact } from "@/lib/generators/artifact-serialization"

export class OpenAPIGenerator {
  private diagram: Diagram

  constructor(diagram: Diagram) {
    this.diagram = diagram
  }

  /**
   * Generate OpenAPI 3.0 specification
   */
  generateOpenAPISpec(): string {
    const content = getArtifactContent(this.diagram, "arch_design")
    return stringifyArtifact(content)
  }
}

