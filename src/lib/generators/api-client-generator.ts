import type { Diagram } from "@/types/diagram"
import { getArtifactContent, stringifyArtifact } from "@/lib/generators/artifact-serialization"

export class APIClientGenerator {
  private diagram: Diagram

  constructor(diagram: Diagram) {
    this.diagram = diagram
  }

  /**
   * Data-only output: returns the architecture artifact content as JSON.
   */
  generateTypeScriptSDK(): string {
    const content = getArtifactContent(this.diagram, "arch_design")
    return stringifyArtifact(content)
  }

  /**
   * Data-only output: returns the architecture artifact content as JSON.
   */
  generatePythonSDK(): string {
    const content = getArtifactContent(this.diagram, "arch_design")
    return stringifyArtifact(content)
  }

  /**
   * Data-only output: returns the architecture artifact content as JSON.
   */
  generateCurlExamples(): string {
    const content = getArtifactContent(this.diagram, "arch_design")
    return stringifyArtifact(content)
  }
}
