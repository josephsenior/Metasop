import type { Diagram } from "@/types/diagram"

export class MermaidGenerator {
  private diagram: Diagram
  private artifacts: any

  constructor(diagram: Diagram) {
    this.diagram = diagram
    this.artifacts = diagram.metadata?.metasop_artifacts || {}
  }

  /**
   * Generate Mermaid flowchart from diagram
   */
  generateMermaidDiagram(): string {
    const nodes = this.diagram.nodes || []
    const edges = this.diagram.edges || []

    if (nodes.length === 0) {
      return `flowchart TD
    Start[Start] --> End[End]
`
    }

    let mermaid = `flowchart TD\n`

    // Generate node definitions
    nodes.forEach((node) => {
      const nodeId = this.sanitizeId(node.id)
      const label = this.escapeLabel(node.label)
      const shape = this.getNodeShape(node.type)
      
      mermaid += `    ${nodeId}${shape}${label}${shape}\n`
    })

    mermaid += `\n`

    // Generate edges
    edges.forEach((edge) => {
      const fromId = this.sanitizeId(edge.from)
      const toId = this.sanitizeId(edge.to)
      const label = edge.label ? `|"${this.escapeLabel(edge.label)}"|` : ""
      
      // Check if nodes exist
      const fromNode = nodes.find(n => n.id === edge.from)
      const toNode = nodes.find(n => n.id === edge.to)
      
      if (fromNode && toNode) {
        mermaid += `    ${fromId} -->${label} ${toId}\n`
      }
    })

    // Add styling based on node types
    mermaid += `\n    %% Styling\n`
    const typeStyles: Record<string, string[]> = {}
    
    nodes.forEach((node) => {
      if (!typeStyles[node.type]) {
        typeStyles[node.type] = []
      }
      typeStyles[node.type].push(this.sanitizeId(node.id))
    })

    Object.entries(typeStyles).forEach(([type, nodeIds]) => {
      const style = this.getTypeStyle(type)
      if (style) {
        mermaid += `    classDef ${type}Style ${style}\n`
        nodeIds.forEach(id => {
          mermaid += `    class ${id} ${type}Style\n`
        })
      }
    })

    return mermaid
  }

  /**
   * Generate Mermaid sequence diagram
   */
  generateSequenceDiagram(): string {
    const archContent = this.artifacts.arch_design?.content || {}
    const apis = archContent.apis || []
    const apiArray = Array.isArray(apis) ? apis : []
    const nodes = this.diagram.nodes || []

    if (apiArray.length === 0) {
      return `sequenceDiagram
    participant User
    participant System
    User->>System: Request
    System-->>User: Response
`
    }

    let mermaid = `sequenceDiagram\n`

    // Identify participants (frontend, backend, database)
    const frontendNodes = nodes.filter(n => n.type === "component")
    const backendNodes = nodes.filter(n => n.type === "service" || n.type === "api")
    const dbNodes = nodes.filter(n => n.type === "database")

    const participants: string[] = []
    if (frontendNodes.length > 0) participants.push("Frontend")
    if (backendNodes.length > 0) participants.push("Backend")
    if (dbNodes.length > 0) participants.push("Database")

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

  private sanitizeId(id: string): string {
    // Mermaid IDs must be alphanumeric, can include underscores and hyphens
    return id.replace(/[^a-zA-Z0-9_-]/g, "_")
  }

  private escapeLabel(label: string): string {
    // Escape special characters in Mermaid labels
    return label
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\n/g, '<br>')
  }

  private getNodeShape(type: string): string {
    // Return Mermaid node shape based on type
    switch (type) {
      case "database":
        return "[(" // Cylinder shape
      case "service":
        return "{{" // Hexagon shape
      case "api":
        return "[/" // Parallelogram shape
      case "component":
        return "[" // Rectangle
      default:
        return "[" // Default rectangle
    }
  }

  private getTypeStyle(type: string): string {
    // Return Mermaid style based on node type
    switch (type) {
      case "database":
        return `fill:#22c55e,stroke:#16a34a,stroke-width:2px,color:#fff`
      case "service":
        return `fill:#9333ea,stroke:#7e22ce,stroke-width:2px,color:#fff`
      case "api":
        return `fill:#0891b2,stroke:#0e7490,stroke-width:2px,color:#fff`
      case "component":
        return `fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff`
      default:
        return `fill:#64748b,stroke:#475569,stroke-width:2px,color:#fff`
    }
  }
}

