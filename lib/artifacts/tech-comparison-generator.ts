import type { Diagram } from "@/types/diagram"

export interface TechnologyOption {
  name: string
  category: string
  pros: string[]
  cons: string[]
  bestFor: string[]
  performance: "high" | "medium" | "low"
  learningCurve: "easy" | "medium" | "hard"
  community: "large" | "medium" | "small"
  cost: "free" | "low" | "medium" | "high"
}

export class TechComparisonGenerator {
  private diagram: Diagram
  private artifacts: any

  constructor(diagram: Diagram) {
    this.diagram = diagram
    this.artifacts = diagram.metadata?.metasop_artifacts || {}
  }

  /**
   * Generate technology comparison matrix
   */
  generateComparisonMatrix(): {
    frontend?: TechnologyOption[]
    backend?: TechnologyOption[]
    database?: TechnologyOption[]
    deployment?: TechnologyOption[]
  } {


    const comparisons: {
      frontend?: TechnologyOption[]
      backend?: TechnologyOption[]
      database?: TechnologyOption[]
      deployment?: TechnologyOption[]
    } = {}

    // Detect frontend technologies
    const frontendTechs = this.detectFrontendTechnologies()
    if (frontendTechs.length > 0) {
      comparisons.frontend = frontendTechs
    }

    // Detect backend technologies
    const backendTechs = this.detectBackendTechnologies()
    if (backendTechs.length > 0) {
      comparisons.backend = backendTechs
    }

    // Detect database technologies
    const dbTechs = this.detectDatabaseTechnologies()
    if (dbTechs.length > 0) {
      comparisons.database = dbTechs
    }

    // Detect deployment options
    const deploymentTechs = this.detectDeploymentTechnologies()
    if (deploymentTechs.length > 0) {
      comparisons.deployment = deploymentTechs
    }

    return comparisons
  }

  /**
   * Generate markdown comparison document
   */
  generateMarkdownComparison(): string {
    const comparisons = this.generateComparisonMatrix()

    let markdown = `# Technology Comparison Matrix\n\n`
    markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`
    markdown += `## Project: ${this.diagram.title}\n\n`
    markdown += `${this.diagram.description}\n\n`
    markdown += `---\n\n`

    if (comparisons.frontend) {
      markdown += this.formatCategoryComparison("Frontend Frameworks", comparisons.frontend)
    }

    if (comparisons.backend) {
      markdown += this.formatCategoryComparison("Backend Technologies", comparisons.backend)
    }

    if (comparisons.database) {
      markdown += this.formatCategoryComparison("Database Options", comparisons.database)
    }

    if (comparisons.deployment) {
      markdown += this.formatCategoryComparison("Deployment Platforms", comparisons.deployment)
    }

    if (Object.keys(comparisons).length === 0) {
      markdown += `No technology decisions detected in this diagram.\n`
    }

    return markdown
  }

  private formatCategoryComparison(title: string, options: TechnologyOption[]): string {
    let markdown = `## ${title}\n\n`

    options.forEach((option, idx) => {
      markdown += `### ${idx + 1}. ${option.name}\n\n`

      markdown += `**Category:** ${option.category}\n\n`

      markdown += `**Performance:** ${this.formatRating(option.performance)}\n`
      markdown += `**Learning Curve:** ${this.formatRating(option.learningCurve)}\n`
      markdown += `**Community:** ${this.formatRating(option.community)}\n`
      markdown += `**Cost:** ${option.cost}\n\n`

      markdown += `#### Pros\n`
      option.pros.forEach(pro => {
        markdown += `- ${pro}\n`
      })
      markdown += `\n`

      markdown += `#### Cons\n`
      option.cons.forEach(con => {
        markdown += `- ${con}\n`
      })
      markdown += `\n`

      markdown += `#### Best For\n`
      option.bestFor.forEach(useCase => {
        markdown += `- ${useCase}\n`
      })
      markdown += `\n---\n\n`
    })

    return markdown
  }

  private formatRating(rating: string): string {
    const ratings: Record<string, string> = {
      high: "⭐⭐⭐ High",
      medium: "⭐⭐ Medium",
      low: "⭐ Low",
      easy: "✅ Easy",
      hard: "❌ Hard",
      large: "👥 Large",
      small: "👤 Small",
    }
    return ratings[rating] || rating
  }

  private detectFrontendTechnologies(): TechnologyOption[] {
    const nodes = this.diagram.nodes || []
    const frontendNodes = nodes.filter(n => n.type === "component")
    const techs: TechnologyOption[] = []

    // Check for React
    if (this.diagram.description.toLowerCase().includes("react") ||
      frontendNodes.some(n => n.label.toLowerCase().includes("react"))) {
      techs.push({
        name: "React",
        category: "Frontend Framework",
        pros: [
          "Large ecosystem and community",
          "Component-based architecture",
          "Strong TypeScript support",
          "Excellent developer tools",
          "Virtual DOM for performance"
        ],
        cons: [
          "Steeper learning curve",
          "Requires additional libraries for routing/state",
          "Frequent updates can be overwhelming"
        ],
        bestFor: [
          "Complex interactive UIs",
          "Large-scale applications",
          "Teams familiar with JavaScript/TypeScript"
        ],
        performance: "high",
        learningCurve: "medium",
        community: "large",
        cost: "free"
      })
    }

    // Check for Vue
    if (this.diagram.description.toLowerCase().includes("vue")) {
      techs.push({
        name: "Vue.js",
        category: "Frontend Framework",
        pros: [
          "Easy to learn",
          "Great documentation",
          "Progressive framework",
          "Small bundle size",
          "Flexible and versatile"
        ],
        cons: [
          "Smaller ecosystem than React",
          "Less corporate backing",
          "Fewer job opportunities"
        ],
        bestFor: [
          "Rapid prototyping",
          "Small to medium applications",
          "Teams new to modern frameworks"
        ],
        performance: "high",
        learningCurve: "easy",
        community: "medium",
        cost: "free"
      })
    }

    // Check for Next.js
    if (this.diagram.description.toLowerCase().includes("next")) {
      techs.push({
        name: "Next.js",
        category: "Full-Stack Framework",
        pros: [
          "Server-side rendering (SSR)",
          "Static site generation (SSG)",
          "Built-in routing",
          "API routes included",
          "Excellent performance",
          "Great SEO support"
        ],
        cons: [
          "Opinionated structure",
          "Can be complex for simple apps",
          "Vercel-specific optimizations"
        ],
        bestFor: [
          "SEO-critical applications",
          "Content-heavy sites",
          "Full-stack applications",
          "Production-ready apps"
        ],
        performance: "high",
        learningCurve: "medium",
        community: "large",
        cost: "free"
      })
    }

    return techs.length > 0 ? techs : [
      {
        name: "React (Recommended)",
        category: "Frontend Framework",
        pros: ["Large ecosystem", "Component-based", "Strong TypeScript support"],
        cons: ["Learning curve", "Requires additional libraries"],
        bestFor: ["Complex UIs", "Large applications"],
        performance: "high",
        learningCurve: "medium",
        community: "large",
        cost: "free"
      }
    ]
  }

  private detectBackendTechnologies(): TechnologyOption[] {

    const techs: TechnologyOption[] = []

    // Node.js/Express is common
    techs.push({
      name: "Node.js + Express",
      category: "Backend Runtime",
      pros: [
        "JavaScript everywhere",
        "Fast development",
        "Large package ecosystem (npm)",
        "Great for real-time applications",
        "Easy to deploy"
      ],
      cons: [
        "Single-threaded (can be limiting)",
        "Callback hell (mitigated with async/await)",
        "Less suitable for CPU-intensive tasks"
      ],
      bestFor: [
        "Real-time applications",
        "APIs and microservices",
        "Full-stack JavaScript teams"
      ],
      performance: "high",
      learningCurve: "easy",
      community: "large",
      cost: "free"
    })

    return techs
  }

  private detectDatabaseTechnologies(): TechnologyOption[] {
    const nodes = this.diagram.nodes || []
    const dbNodes = nodes.filter(n => n.type === "database")
    const techs: TechnologyOption[] = []

    // PostgreSQL
    if (dbNodes.some(n => n.label.toLowerCase().includes("postgres")) ||
      this.diagram.description.toLowerCase().includes("postgres")) {
      techs.push({
        name: "PostgreSQL",
        category: "Relational Database",
        pros: [
          "ACID compliant",
          "Advanced features (JSON, arrays, etc.)",
          "Excellent performance",
          "Strong data integrity",
          "Open source"
        ],
        cons: [
          "Requires more setup than SQLite",
          "Vertical scaling limitations",
          "Complex for simple use cases"
        ],
        bestFor: [
          "Complex queries",
          "Data integrity critical",
          "Production applications",
          "Relational data"
        ],
        performance: "high",
        learningCurve: "medium",
        community: "large",
        cost: "free"
      })
    }

    // MongoDB
    if (dbNodes.some(n => n.label.toLowerCase().includes("mongo")) ||
      this.diagram.description.toLowerCase().includes("mongo")) {
      techs.push({
        name: "MongoDB",
        category: "NoSQL Database",
        pros: [
          "Flexible schema",
          "Horizontal scaling",
          "Fast for read-heavy workloads",
          "JSON-like documents",
          "Easy to start with"
        ],
        cons: [
          "No joins",
          "Less mature than SQL",
          "Can be memory intensive",
          "Schema flexibility can lead to issues"
        ],
        bestFor: [
          "Rapid prototyping",
          "Unstructured data",
          "High read workloads",
          "Scalable applications"
        ],
        performance: "high",
        learningCurve: "easy",
        community: "large",
        cost: "free"
      })
    }

    return techs.length > 0 ? techs : [
      {
        name: "PostgreSQL (Recommended)",
        category: "Relational Database",
        pros: ["ACID compliant", "Advanced features", "Strong data integrity"],
        cons: ["More setup required", "Vertical scaling limits"],
        bestFor: ["Production apps", "Complex queries", "Data integrity critical"],
        performance: "high",
        learningCurve: "medium",
        community: "large",
        cost: "free"
      }
    ]
  }

  private detectDeploymentTechnologies(): TechnologyOption[] {
    const techs: TechnologyOption[] = []

    techs.push({
      name: "Vercel",
      category: "Platform as a Service",
      pros: [
        "Zero-config deployment",
        "Automatic HTTPS",
        "Global CDN",
        "Serverless functions",
        "Great Next.js integration"
      ],
      cons: [
        "Vendor lock-in",
        "Can be expensive at scale",
        "Limited server control"
      ],
      bestFor: [
        "Next.js applications",
        "Static sites",
        "Serverless functions",
        "Quick deployments"
      ],
      performance: "high",
      learningCurve: "easy",
      community: "large",
      cost: "low"
    })

    techs.push({
      name: "AWS (EC2/ECS)",
      category: "Infrastructure as a Service",
      pros: [
        "Full control",
        "Scalable",
        "Mature ecosystem",
        "Enterprise features",
        "Pay for what you use"
      ],
      cons: [
        "Complex setup",
        "Requires DevOps knowledge",
        "Can be expensive",
        "Steep learning curve"
      ],
      bestFor: [
        "Enterprise applications",
        "Complex infrastructure",
        "Full control needed",
        "Large scale"
      ],
      performance: "high",
      learningCurve: "hard",
      community: "large",
      cost: "medium"
    })

    return techs
  }
}

