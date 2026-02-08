import type { Diagram } from "@/types/diagram"
import { getAllArtifacts, getAllArtifactsContent, stringifyArtifact } from "@/lib/generators/artifact-serialization"

export class CodeGenerator {
  private diagram: Diagram

  constructor(diagram: Diagram) {
    this.diagram = diagram
  }

  /**
   * Data-only output: packages MetaSOP artifacts into a ZIP.
   * No scaffold/templates are generated.
   */
  async generateProjectScaffold(): Promise<Blob> {
    const JSZip = (await import("jszip")).default
    const zip = new JSZip()

    zip.file("metasop_artifacts_content.json", stringifyArtifact(getAllArtifactsContent(this.diagram)))
    zip.file("metasop_artifacts_raw.json", stringifyArtifact(getAllArtifacts(this.diagram)))

    return await zip.generateAsync({ type: "blob" })
  }
}
