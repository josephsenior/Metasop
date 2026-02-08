import type { Diagram } from "@/types/diagram"
import { getArtifactContent, stringifyArtifact } from "@/lib/generators/artifact-serialization"

export class SQLGenerator {
  private diagram: Diagram

  constructor(diagram: Diagram) {
    this.diagram = diagram
  }

  /**
   * Data-only output: returns database-related architecture content as JSON.
   */
  generateMigration(): string {
    const arch = (getArtifactContent(this.diagram, "arch_design") as any) || {}
    const content = arch.database_schema ?? arch
    return stringifyArtifact(content)
  }

  /**
   * Data-only output: returns database-related architecture content as JSON.
   */
  generateSeedData(): string {
    const arch = (getArtifactContent(this.diagram, "arch_design") as any) || {}
    const content = arch.database_schema ?? arch
    return stringifyArtifact(content)
  }
}
