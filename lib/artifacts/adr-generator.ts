import type { Diagram } from "@/types/diagram"

export class ADRGenerator {
  private diagram: Diagram
  private artifacts: any

  constructor(diagram: Diagram) {
    this.diagram = diagram
    this.artifacts = diagram.metadata?.metasop_artifacts || {}
  }

  /**
   * Generate Architecture Decision Records
   */
  generateADRs(): string {
    const archContent = this.artifacts.arch_design?.content || {}
    const engineerArtifact = this.artifacts.engineer_impl?.content || {}
    const decisions = archContent.decisions || []
    const technicalDecisions = engineerArtifact.technical_decisions || []
    const allDecisions = [
      ...(Array.isArray(decisions) ? decisions : []),
      ...(Array.isArray(technicalDecisions) ? technicalDecisions : []),
    ]

    if (allDecisions.length === 0) {
      return this.generateDefaultADR()
    }

    let adrs = `# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for ${this.diagram.title}.

## What is an ADR?

An Architecture Decision Record is a document that captures an important architectural decision made along with its context and consequences.

## ADR Index

`

    allDecisions.forEach((decision: any, idx: number) => {
      const title = decision.decision || decision.title || `Decision ${idx + 1}`
      const adrNumber = String(idx + 1).padStart(4, "0")
      adrs += `- [ADR-${adrNumber}](./adr-${adrNumber}.md) - ${title}\n`
    })

    adrs += `\n---\n\n`

    // Generate individual ADR files
    allDecisions.forEach((decision: any, idx: number) => {
      const adrNumber = String(idx + 1).padStart(4, "0")
      adrs += this.generateSingleADR(decision, adrNumber, idx)
      adrs += `\n---\n\n`
    })

    return adrs
  }

  private generateSingleADR(decision: any, number: string, index: number): string {
    const title = decision.decision || decision.title || `Decision ${index + 1}`
    const status = decision.status || "Accepted"
    const date = new Date().toISOString().split("T")[0]

    return `## ADR-${number}: ${title}

**Status:** ${status}  
**Date:** ${date}  
**Deciders:** Architecture Team

### Context

${decision.reason || decision.rationale || decision.context || "This decision was made to address specific architectural requirements."}

### Decision

${title}

${decision.description || decision.details || ""}

### Consequences

**Positive:**
${decision.consequences?.positive || decision.tradeoffs?.split(",").filter((t: string) => !t.includes("negative")).join("\n") || "- Improved system architecture"}

**Negative:**
${decision.consequences?.negative || decision.tradeoffs?.split(",").filter((t: string) => t.includes("negative") || t.includes("cost")).join("\n") || "- Additional complexity"}

${decision.alternatives ? `### Alternatives Considered

${typeof decision.alternatives === "string" ? decision.alternatives : decision.alternatives.join("\n- ")}

` : ""}### Notes

${decision.notes || "No additional notes."}

`
  }

  private generateDefaultADR(): string {
    return `# Architecture Decision Records (ADRs)

## ADR-0001: Technology Stack Selection

**Status:** Accepted  
**Date:** ${new Date().toISOString().split("T")[0]}  
**Deciders:** Architecture Team

### Context

This project requires a modern, scalable technology stack that supports rapid development and deployment.

### Decision

We have selected the following technology stack based on the architecture diagram:
- Next.js for the frontend framework
- TypeScript for type safety
- PostgreSQL for data persistence
- React for UI components

### Consequences

**Positive:**
- Strong type safety with TypeScript
- Excellent developer experience
- Large ecosystem and community support
- Good performance characteristics

**Negative:**
- Learning curve for team members new to the stack
- Initial setup complexity

### Alternatives Considered

- Vue.js instead of React
- MongoDB instead of PostgreSQL
- Python/Django instead of Node.js/Next.js

### Notes

This decision aligns with the overall architecture and team expertise.
`
  }
}

