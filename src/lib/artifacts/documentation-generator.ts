import type { Diagram } from "@/types/diagram"
import { EstimatesGenerator } from "./estimates-generator"
import type {
  ArchitectBackendArtifact,
  DevOpsBackendArtifact,
  EngineerBackendArtifact,
  ProductManagerBackendArtifact,
  QABackendArtifact,
  SecurityBackendArtifact,
  UIDesignerBackendArtifact,
} from "@/lib/metasop/types"

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
    const { title, createdAt, description, metadata } = this.diagram
    const artifacts = metadata?.metasop_artifacts

    const pmSpec = artifacts?.pm_spec?.content as ProductManagerBackendArtifact | undefined
    const archContent = artifacts?.arch_design?.content as ArchitectBackendArtifact | undefined
    const devOpsArtifact = artifacts?.devops_infrastructure?.content as DevOpsBackendArtifact | undefined
    const securityArtifact = artifacts?.security_architecture?.content as SecurityBackendArtifact | undefined
    const engineerArtifact = artifacts?.engineer_impl?.content as EngineerBackendArtifact | undefined
    const uiDesignerArtifact = artifacts?.ui_design?.content as UIDesignerBackendArtifact | undefined
    const qaArtifact = artifacts?.qa_verification?.content as QABackendArtifact | undefined

    let markdown = `# ${title}\n\n`
    markdown += `**Generated:** ${new Date(createdAt).toLocaleString()}\n\n`
    markdown += `## Overview\n\n${description}\n\n`
    markdown += `---\n\n`

    // Product Manager Section
    if (pmSpec) {
      markdown += `## Product Requirements\n\n`

      markdown += `### User Stories\n\n`
      pmSpec.user_stories.forEach((story, idx) => {
        markdown += `${idx + 1}. **${story.title}**\n`
        markdown += `   ${story.story}\n`
        if (story.description) markdown += `   ${story.description}\n`
        markdown += `\n`
      })

      markdown += `### Acceptance Criteria\n\n`
      pmSpec.acceptance_criteria.forEach((criterion) => {
        markdown += `- ${criterion.criteria}\n`
      })
      markdown += `\n`
    }

    // Architect Section
    if (archContent) {
      markdown += `## Architecture Design\n\n`

      markdown += `### Design Document\n\n${archContent.design_doc}\n\n`

      markdown += `### Architectural Decisions\n\n`
      archContent.decisions.forEach((decision, idx) => {
        markdown += `#### Decision ${idx + 1}: ${decision.decision}\n\n`
        markdown += `**Status:** ${decision.status}\n\n`
        markdown += `**Reason:** ${decision.reason}\n\n`
        markdown += `**Tradeoffs:** ${decision.tradeoffs}\n\n`
        markdown += `**Consequences:** ${decision.consequences}\n\n`
      })

      if (this.options.includeAPIs) {
        markdown += `### API Endpoints\n\n`
        archContent.apis.forEach((api) => {
          markdown += `#### \`${api.method} ${api.path}\`\n\n`
          markdown += `${api.description}\n\n`
          if (api.auth_required) markdown += `**Authentication Required:** Yes\n\n`
        })
      }

      if (this.options.includeDatabase) {
        markdown += `### Database Schema\n\n`
        const tables = archContent.database_schema.tables ?? []

        if (tables.length === 0) {
          markdown += `No database tables defined.\n\n`
        } else {
          tables.forEach((table) => {
            markdown += `#### Table: \`${table.name}\`\n\n`
            markdown += `| Column | Type | Constraints |\n`
            markdown += `|--------|------|-------------|\n`
            table.columns.forEach((col) => {
              const constraints = col.constraints ? col.constraints.join(", ") : ""
              markdown += `| ${col.name} | ${col.type} | ${constraints} |\n`
            })
            markdown += `\n`
          })
        }
      }
    }

    // DevOps Section
    if (devOpsArtifact) {
      markdown += `## DevOps & Infrastructure\n\n`

      markdown += `### Infrastructure Components\n\n`
      const { infrastructure: infra, cicd } = devOpsArtifact
      const { cloud_provider, regions, services } = infra
      markdown += `- **Cloud Provider:** ${cloud_provider}\n`
      if (regions && regions.length > 0) {
        markdown += `- **Regions:** ${regions.join(", ")}\n`
      }
      markdown += `\n**Services:**\n`
      services.forEach((service) => {
        markdown += `- ${service.name} (${service.type})\n`
      })
      markdown += `\n`

      markdown += `### CI/CD Pipeline\n\n`
      cicd.pipeline_stages.forEach((stage, idx) => {
        markdown += `${idx + 1}. **${stage.name}**\n`
        stage.steps.forEach((step) => {
          markdown += `   - ${step}\n`
        })
        if (stage.goal) markdown += `   Goal: ${stage.goal}\n`
      })
      markdown += `\n`
    }

    // Security Section
    if (securityArtifact) {
      markdown += `## Security Architecture\n\n`

      markdown += `### Threat Model\n\n`
      securityArtifact.threat_model.forEach((threat) => {
        markdown += `- **${threat.threat}** (${threat.severity}): ${threat.mitigation}\n`
      })
      markdown += `\n`

      markdown += `### Security Controls\n\n`
      securityArtifact.security_controls.forEach((control) => {
        markdown += `- **${control.control}**: ${control.implementation}\n`
      })
      markdown += `\n`
    }

    // Engineer Section
    if (engineerArtifact) {
      markdown += `## Implementation Roadmap\n\n`

      engineerArtifact.implementation_plan_phases.forEach((phase, index) => {
        markdown += `### Phase ${index + 1}: ${phase.name}\n\n`
        markdown += `${phase.description}\n\n`
        phase.tasks.forEach((task) => {
          markdown += `- ${task}\n`
        })
        markdown += `\n`
      })

      markdown += `### File Structure\n\n`
      markdown += this.formatFileStructure(engineerArtifact.file_structure, 0)
      markdown += `\n`

      markdown += `### Dependencies\n\n`
      engineerArtifact.dependencies.forEach((dep) => {
        markdown += `- \`${dep}\`\n`
      })
      markdown += `\n`
    }

    // UI Designer Section
    if (uiDesignerArtifact) {
      markdown += `## UI Design\n\n`

      markdown += `### Component Hierarchy\n\n`
      markdown += this.formatComponentHierarchy(uiDesignerArtifact.component_hierarchy, 0)
      markdown += `\n`

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

    // QA Section
    if (qaArtifact) {
      markdown += `## Quality Assurance\n\n`

      markdown += `### Test Coverage\n\n`
      const { coverage } = qaArtifact
      markdown += `- **Overall Coverage:** ${coverage.percentage}% (threshold ${coverage.threshold}%)\n`
      markdown += `- **Lines:** ${coverage.lines}%, **Statements:** ${coverage.statements}%, **Functions:** ${coverage.functions}%, **Branches:** ${coverage.branches}%\n\n`

      markdown += `### Risk Analysis\n\n`
      qaArtifact.risk_analysis.forEach((risk) => {
        markdown += `- **${risk.risk}** (${risk.impact}): ${risk.mitigation}\n`
      })
      markdown += `\n`
    }

    // Estimates
    if (this.options.includeEstimates) {
      markdown += `---\n\n`
      markdown += `## Estimates\n\n`
      
      const estimatesGen = new EstimatesGenerator(this.diagram)
      const devEstimate = estimatesGen.calculateDevelopmentEstimate()
      const costEstimate = estimatesGen.calculateCostEstimate(devEstimate)

      markdown += `### Development Time\n\n`
      markdown += `- **Estimated Total:** ${devEstimate.totalHours} hours (${devEstimate.totalDays} days)\n`
      markdown += `- **Team Size Recommended:** ${devEstimate.recommendedTeamSize} developers\n`
      markdown += `- **Timeline:** ${devEstimate.timeline} weeks\n\n`
      
      if (costEstimate) {
        markdown += `### Cost Estimate\n\n`
        markdown += `- **Infrastructure (Monthly):** $${costEstimate.infrastructure.monthly}\n`
        markdown += `- **Development Cost:** $${costEstimate.development.total.toLocaleString()}\n`
        markdown += `- **Total First Year:** $${costEstimate.totalFirstYear.toLocaleString()}\n\n`
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
}

