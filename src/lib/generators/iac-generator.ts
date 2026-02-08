import type { Diagram } from "@/types/diagram"
import { getArtifactContent, stringifyArtifact } from "@/lib/generators/artifact-serialization"

export class IaCGenerator {
  private diagram: Diagram

  constructor(diagram: Diagram) {
    this.diagram = diagram
  }

  /**
   * Data-only output: returns the DevOps artifact content as JSON.
   */
  generateDockerCompose(): string {
    const content = getArtifactContent(this.diagram, "devops_infrastructure")
    return stringifyArtifact(content)
  }

  /**
   * Data-only output: returns the DevOps artifact content as JSON.
   * Maintains return shape expected by callers.
   */
  generateKubernetesManifests(): { deployment: string; service: string; ingress?: string } {
    const content = getArtifactContent(this.diagram, "devops_infrastructure")
    const serialized = stringifyArtifact(content)
    return { deployment: serialized, service: serialized, ingress: serialized }
  }

  /**
   * Data-only output: returns the DevOps artifact content as JSON.
   */
  generateTerraformConfig(): string {
    const content = getArtifactContent(this.diagram, "devops_infrastructure")
    return stringifyArtifact(content)
  }

  generateTerraform(): string {
    return this.generateTerraformConfig()
  }
}
