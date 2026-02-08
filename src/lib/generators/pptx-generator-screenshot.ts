import type { Diagram } from "@/types/diagram"
import { getAllArtifactsContent, stringifyArtifact } from "@/lib/generators/artifact-serialization"

/**
 * Data-only PPTX generator (keeps legacy class name).
 */
export class PPTXGeneratorScreenshot {
  private diagram: Diagram

  constructor(diagram: Diagram) {
    this.diagram = diagram
  }

  async generate(): Promise<Buffer> {
    const PptxGenJS = (await import("pptxgenjs")).default
    const pptx = new PptxGenJS()

    const slide = pptx.addSlide()
    const text = stringifyArtifact(getAllArtifactsContent(this.diagram))

    slide.addText(text, {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 5,
      fontSize: 8,
    })

    return (await pptx.write({ outputType: "nodebuffer" })) as Buffer
  }
}
