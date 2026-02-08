import type { Diagram } from "@/types/diagram"
import { getArtifactContent, stringifyArtifact } from "@/lib/generators/artifact-serialization"

export class SecurityAuditGenerator {
  private diagram: Diagram

  constructor(diagram: Diagram) {
    this.diagram = diagram
  }

  /**
   * Data-only output: returns security-related MetaSOP artifact content as JSON.
   */
  generateSecurityAudit(): string {
    const security = getArtifactContent(this.diagram, "security_architecture")
    const qa = getArtifactContent(this.diagram, "qa_verification")

    if (security !== undefined) return stringifyArtifact(security)
    return stringifyArtifact(qa)
  }
}
