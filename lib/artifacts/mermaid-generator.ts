import type { Diagram } from "@/types/diagram"

export class MermaidGenerator {
  private diagram: Diagram
  private artifacts: any

  constructor(diagram: Diagram) {
    this.diagram = diagram
    this.artifacts = diagram.metadata?.metasop_artifacts || {}
  }

  /**
   * Generate Mermaid flowchart from diagram (artifact-centric; no graph nodes/edges).
   */
  generateMermaidDiagram(): string {
    return `flowchart TD
    Start[Start] --> End[End]
`
  }

  /**
   * Generate Mermaid sequence diagram from arch artifacts (APIs).
   */
  generateSequenceDiagram(): string {
    const archContent = this.artifacts.arch_design?.content || {}
    const apis = archContent.apis || []
    const apiArray = Array.isArray(apis) ? apis : []

    if (apiArray.length === 0) {
      return `sequenceDiagram
    participant User
    participant System
    User->>System: Request
    System-->>User: Response
`
    }

    let mermaid = `sequenceDiagram\n`

    const participants: string[] = ["Frontend", "Backend", "Database"]
    participants.forEach(participant => {
      mermaid += `    participant ${participant}\n`
    })

    mermaid += `\n`

    // Generate sequence for each API call
    apiArray.slice(0, 5).forEach((api: any) => {
      const method = api.method || "GET"
      const path = api.path || api.endpoint || "/api"
      
      if (participants.includes("Frontend") && participants.includes("Backend")) {
        mermaid += `    Frontend->>Backend: ${method} ${path}\n`
        if (participants.includes("Database") && (method === "POST" || method === "PUT" || method === "GET")) {
          mermaid += `    Backend->>Database: Query/Update\n`
          mermaid += `    Database-->>Backend: Data\n`
        }
        mermaid += `    Backend-->>Frontend: Response\n`
        mermaid += `\n`
      }
    })

    return mermaid
  }
}

