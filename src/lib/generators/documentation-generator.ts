import type { Diagram } from "@/types/diagram"
import { getAllArtifactsContent, stringifyArtifact } from "@/lib/generators/artifact-serialization"

interface DocumentationOptions {
  includeDiagrams?: boolean
  includeCode?: boolean
  includeDatabase?: boolean
  includeAPIs?: boolean
  includeEstimates?: boolean
}

export class DocumentationGenerator {
  private diagram: Diagram
  // Options retained for compatibility, but content is data-only.
  private options: DocumentationOptions

  constructor(diagram: Diagram, options: DocumentationOptions = {}) {
    this.diagram = diagram
    this.options = options
  }

  /**
   * Data-only output: returns MetaSOP artifacts content as JSON.
   */
  generateMarkdown(): string {
    const content = getAllArtifactsContent(this.diagram)
    return stringifyArtifact(content)
  }
}
