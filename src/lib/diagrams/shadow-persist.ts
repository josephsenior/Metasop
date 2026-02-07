import fs from "fs";
import path from "path";
import type { Diagram } from "@/types/diagram";

export function persistDiagramShadow(diagram: Diagram): void {
  try {
    const saveDir = path.join(process.cwd(), ".saved_diagrams");
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(saveDir, `${diagram.id}.json`),
      JSON.stringify(diagram, null, 2)
    );
  } catch (error) {
    console.error("Failed to save local backup:", error);
  }
}
