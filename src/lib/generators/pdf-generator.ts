import type { Diagram } from "@/types/diagram"
import { getAllArtifactsContent, stringifyArtifact } from "@/lib/generators/artifact-serialization"

export class PDFGenerator {
  private diagram: Diagram

  constructor(diagram: Diagram) {
    this.diagram = diagram
  }

  /**
   * Data-only output: a PDF containing only the serialized MetaSOP artifacts.
   */
  async generatePDF(): Promise<Blob> {
    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    const maxWidth = pageWidth - 2 * margin

    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")

    const text = stringifyArtifact(getAllArtifactsContent(this.diagram))
    const lines = doc.splitTextToSize(text, maxWidth)

    let y = margin
    for (const line of lines) {
      if (y > pageHeight - margin) {
        doc.addPage()
        y = margin
      }
      doc.text(String(line), margin, y)
      y += 4
    }

    return doc.output("blob")
  }
}
