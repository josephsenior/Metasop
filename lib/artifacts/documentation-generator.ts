import type { Diagram } from "@/types/diagram"

export interface DocumentationOptions {
  includeDiagrams?: boolean
  includeCode?: boolean
  includeDatabase?: boolean
  includeAPIs?: boolean
  includeEstimates?: boolean
}

export class DocumentationGenerator {
  private diagram: Diagram
  private options: DocumentationOptions

  constructor(diagram: Diagram, options: DocumentationOptions = {}) {
    this.diagram = diagram
    this.options = {
      includeDiagrams: true,
      includeCode: true,
      includeDatabase: true,
      includeAPIs: true,
      includeEstimates: true,
      ...options,
    }
  }

  /**
   * Generate Markdown documentation
   */
  generateMarkdown(): string {
    const artifacts = this.diagram.metadata?.metasop_artifacts || {}
    const pmSpec = artifacts.pm_spec?.content || {}
    const archContent = artifacts.arch_design?.content || {}
    const engineerArtifact = artifacts.engineer_impl?.content || {}
    const uiDesignerArtifact = artifacts.ui_design?.content || {}
    const qaArtifact = artifacts.qa_verification?.content || {}

    let markdown = `# ${this.diagram.title}\n\n`
    markdown += `**Generated:** ${new Date(this.diagram.createdAt).toLocaleString()}\n\n`
    markdown += `## Overview\n\n${this.diagram.description}\n\n`
    markdown += `---\n\n`

    // Product Manager Section
    if (pmSpec.user_stories || pmSpec.acceptance_criteria) {
      markdown += `## Product Requirements\n\n`
      
      if (pmSpec.user_stories) {
        markdown += `### User Stories\n\n`
        const stories = Array.isArray(pmSpec.user_stories) ? pmSpec.user_stories : []
        stories.forEach((story: any, idx: number) => {
          const title = typeof story === "string" ? story : story.title || story.story || `Story ${idx + 1}`
          const description = typeof story === "object" ? story.description : null
          markdown += `${idx + 1}. **${title}**\n`
          if (description) markdown += `   ${description}\n`
          markdown += `\n`
        })
      }

      if (pmSpec.acceptance_criteria) {
        markdown += `### Acceptance Criteria\n\n`
        const criteria = Array.isArray(pmSpec.acceptance_criteria) ? pmSpec.acceptance_criteria : []
        criteria.forEach((criterion: any, idx: number) => {
          const text = typeof criterion === "string" 
            ? criterion 
            : criterion.criteria || criterion.title || criterion.description || `Criterion ${idx + 1}`
          markdown += `- ${text}\n`
        })
        markdown += `\n`
      }
    }

    // Architect Section
    if (archContent.design_doc || archContent.decisions || archContent.apis) {
      markdown += `## Architecture Design\n\n`

      if (archContent.design_doc) {
        markdown += `### Design Document\n\n${archContent.design_doc}\n\n`
      }

      if (archContent.decisions) {
        markdown += `### Architectural Decisions\n\n`
        const decisions = Array.isArray(archContent.decisions) ? archContent.decisions : []
        decisions.forEach((decision: any, idx: number) => {
          markdown += `#### Decision ${idx + 1}: ${decision.decision || `Decision ${idx + 1}`}\n\n`
          if (decision.reason) markdown += `**Reason:** ${decision.reason}\n\n`
          if (decision.tradeoffs) markdown += `**Tradeoffs:** ${decision.tradeoffs}\n\n`
        })
      }

      if (this.options.includeAPIs && archContent.apis) {
        markdown += `### API Endpoints\n\n`
        const apis = Array.isArray(archContent.apis) ? archContent.apis : []
        apis.forEach((api: any) => {
          const method = api.method || "GET"
          const path = api.path || api.endpoint || "/api"
          markdown += `#### \`${method} ${path}\`\n\n`
          if (api.description) markdown += `${api.description}\n\n`
          if (api.auth_required) markdown += `**Authentication Required:** Yes\n\n`
        })
      }

      if (this.options.includeDatabase && archContent.database_schema) {
        markdown += `### Database Schema\n\n`
        const schema = archContent.database_schema
        if (schema.tables) {
          const tables = Array.isArray(schema.tables) ? schema.tables : []
          tables.forEach((table: any) => {
            const tableName = table.table_name || table.name || "Table"
            markdown += `#### Table: \`${tableName}\`\n\n`
            if (table.columns) {
              markdown += `| Column | Type | Constraints |\n`
              markdown += `|--------|------|-------------|\n`
              const columns = Array.isArray(table.columns) ? table.columns : []
              columns.forEach((col: any) => {
                const colName = typeof col === "object" ? col.name : col
                const colType = typeof col === "object" ? col.type || "varchar" : "varchar"
                const constraints = typeof col === "object" && col.constraints
                  ? (Array.isArray(col.constraints) ? col.constraints.join(", ") : col.constraints)
                  : ""
                markdown += `| ${colName} | ${colType} | ${constraints} |\n`
              })
              markdown += `\n`
            }
          })
        }
      }
    }

    // Engineer Section
    if (engineerArtifact.implementation_plan || engineerArtifact.file_structure || engineerArtifact.dependencies) {
      markdown += `## Implementation Plan\n\n`

      if (engineerArtifact.implementation_plan) {
        markdown += `${engineerArtifact.implementation_plan}\n\n`
      }

      if (engineerArtifact.file_structure) {
        markdown += `### File Structure\n\n`
        markdown += this.formatFileStructure(engineerArtifact.file_structure, 0)
        markdown += `\n`
      }

      if (engineerArtifact.dependencies) {
        markdown += `### Dependencies\n\n`
        const deps = Array.isArray(engineerArtifact.dependencies) ? engineerArtifact.dependencies : []
        deps.forEach((dep: string) => {
          markdown += `- \`${dep}\`\n`
        })
        markdown += `\n`
      }
    }

    // UI Designer Section
    if (uiDesignerArtifact.component_hierarchy || uiDesignerArtifact.design_tokens) {
      markdown += `## UI Design\n\n`

      if (uiDesignerArtifact.component_hierarchy) {
        markdown += `### Component Hierarchy\n\n`
        markdown += this.formatComponentHierarchy(uiDesignerArtifact.component_hierarchy, 0)
        markdown += `\n`
      }

      if (uiDesignerArtifact.design_tokens) {
        markdown += `### Design Tokens\n\n`
        const tokens = uiDesignerArtifact.design_tokens
        if (tokens.colors) {
          markdown += `#### Colors\n\n`
          Object.entries(tokens.colors).forEach(([key, value]) => {
            markdown += `- \`${key}\`: \`${value}\`\n`
          })
          markdown += `\n`
        }
      }
    }

    // QA Section
    if (qaArtifact.test_results || qaArtifact.coverage || qaArtifact.security_findings) {
      markdown += `## Quality Assurance\n\n`

      if (qaArtifact.coverage) {
        markdown += `### Test Coverage\n\n`
        const coverage = qaArtifact.coverage
        if (coverage.percentage !== undefined) {
          markdown += `- **Overall Coverage:** ${coverage.percentage}%\n`
        }
        if (coverage.lines !== undefined) {
          markdown += `- **Lines:** ${coverage.lines}%\n`
        }
        markdown += `\n`
      }

      if (qaArtifact.security_findings) {
        markdown += `### Security Findings\n\n`
        const findings = Array.isArray(qaArtifact.security_findings) ? qaArtifact.security_findings : []
        findings.forEach((finding: any) => {
          markdown += `#### ${finding.vulnerability || "Finding"}\n\n`
          markdown += `**Severity:** ${finding.severity || "Unknown"}\n\n`
          if (finding.description) markdown += `${finding.description}\n\n`
          if (finding.remediation) markdown += `**Remediation:** ${finding.remediation}\n\n`
        })
      }
    }

    // Estimates
    if (this.options.includeEstimates) {
      markdown += `---\n\n`
      markdown += `## Estimates\n\n`
      const estimates = this.calculateEstimates()
      markdown += `### Development Time\n\n`
      markdown += `- **Estimated Total:** ${estimates.totalHours} hours (${estimates.totalDays} days)\n`
      markdown += `- **Team Size Recommended:** ${estimates.recommendedTeamSize} developers\n`
      markdown += `- **Timeline:** ${estimates.timeline} weeks\n\n`
      
      if (estimates.costEstimate) {
        markdown += `### Cost Estimate\n\n`
        markdown += `- **Infrastructure (Monthly):** $${estimates.costEstimate.infrastructure}\n`
        markdown += `- **Development Cost:** $${estimates.costEstimate.development}\n`
        markdown += `- **Total First Year:** $${estimates.costEstimate.totalFirstYear}\n\n`
      }
    }

    return markdown
  }

  /**
   * Format file structure as markdown tree
   */
  private formatFileStructure(node: any, level: number): string {
    const indent = "  ".repeat(level)
    const name = node.name || node.file || "Unknown"
    const isFolder = node.type === "folder" || node.type === "directory" || node.children
    const icon = isFolder ? "📁" : "📄"
    let result = `${indent}${icon} ${name}\n`
    
    if (node.description) {
      result += `${indent}  ${node.description}\n`
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => {
        result += this.formatFileStructure(child, level + 1)
      })
    }

    return result
  }

  /**
   * Format component hierarchy as markdown tree
   */
  private formatComponentHierarchy(node: any, level: number): string {
    const indent = "  ".repeat(level)
    const name = node.name || node.root || "Component"
    let result = `${indent}📦 ${name}\n`
    
    if (node.props && Array.isArray(node.props) && node.props.length > 0) {
      result += `${indent}  Props: ${node.props.join(", ")}\n`
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => {
        result += this.formatComponentHierarchy(child, level + 1)
      })
    }

    return result
  }

  /**
   * Calculate development estimates
   */
  private calculateEstimates() {
    const artifacts = this.diagram.metadata?.metasop_artifacts || {}
    const archContent = artifacts.arch_design?.content || {}
    const apis = archContent.apis || []
    const tables = archContent.database_schema?.tables || []
    const apiCount = Array.isArray(apis) ? apis.length : 0
    const tableCount = Array.isArray(tables) ? tables.length : 0

    // Base estimates
    let totalHours = 0

    // Product Manager work
    if (artifacts.pm_spec) totalHours += 8

    // Architect work
    if (artifacts.arch_design) totalHours += 16

    // Engineer work - estimate from artifacts (APIs, DB tables)
    totalHours += apiCount * 8
    totalHours += tableCount * 12
    
    // UI Designer work
    if (artifacts.ui_design) totalHours += 12
    
    // QA work
    if (artifacts.qa_verification) totalHours += 8
    
    // Add 20% buffer
    totalHours = Math.ceil(totalHours * 1.2)
    
    const totalDays = Math.ceil(totalHours / 8)
    const timeline = Math.ceil(totalDays / 5) // 5 working days per week
    const recommendedTeamSize = totalDays > 20 ? 3 : totalDays > 10 ? 2 : 1

    // Cost estimates (rough)
    const hourlyRate = 100 // Average developer rate
    const developmentCost = totalHours * hourlyRate
    const infrastructure = 200 // Monthly cloud costs
    const totalFirstYear = developmentCost + (infrastructure * 12)

    return {
      totalHours,
      totalDays,
      timeline,
      recommendedTeamSize,
      costEstimate: {
        infrastructure,
        development: developmentCost,
        totalFirstYear,
      },
    }
  }
}

