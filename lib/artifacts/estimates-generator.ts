import type { Diagram } from "@/types/diagram"

export interface DevelopmentEstimate {
  totalHours: number
  totalDays: number
  timeline: number // weeks
  recommendedTeamSize: number
  breakdown: {
    planning: number
    architecture: number
    development: number
    uiDesign: number
    testing: number
    deployment: number
  }
}

export interface CostEstimate {
  infrastructure: {
    monthly: number
    yearly: number
  }
  development: {
    total: number
    hourlyRate: number
  }
  thirdParty: {
    monthly: number
    yearly: number
  }
  totalFirstYear: number
  breakdown: {
    aws?: number
    azure?: number
    gcp?: number
    other?: number
  }
}

export class EstimatesGenerator {
  private diagram: Diagram
  private artifacts: any

  constructor(diagram: Diagram) {
    this.diagram = diagram
    this.artifacts = diagram.metadata?.metasop_artifacts || {}
  }

  /**
   * Calculate development time estimates
   */
  calculateDevelopmentEstimate(): DevelopmentEstimate {
    const archContent = this.artifacts.arch_design?.content || {}
    const apis = archContent.apis || []
    const tables = archContent.database_schema?.tables || []
    const apiCount = Array.isArray(apis) ? apis.length : 0
    const dbCount = Array.isArray(tables) ? tables.length : 0
    const componentCount = 0
    const serviceCount = 0

    // Base estimates (in hours)
    let planning = 0
    let architecture = 0
    let development = 0
    let uiDesign = 0
    let testing = 0
    let deployment = 0

    // Planning phase
    if (this.artifacts.pm_spec) {
      planning = 8 // Product requirements and user stories
    }

    // Architecture phase
    if (this.artifacts.arch_design) {
      architecture = 16 // Architecture design and decisions
      if (apiCount > 0) architecture += apiCount * 2 // API design
      if (dbCount > 0) architecture += dbCount * 4 // Database design
    }

    // Development phase
    development = componentCount * 8 // 8 hours per component
    development += serviceCount * 16 // 16 hours per service
    development += dbCount * 12 // 12 hours per database setup
    development += apiCount * 6 // 6 hours per API endpoint

    // UI Design phase
    if (this.artifacts.ui_design) {
      uiDesign = 12 // Base UI design
      uiDesign += componentCount * 2 // Component design
    }

    // Testing phase
    if (this.artifacts.qa_verification) {
      testing = 8 // Base QA
      testing += componentCount * 2 // Component testing
      testing += serviceCount * 4 // Service testing
      testing += apiCount * 1 // API testing
    }

    // Deployment phase
    deployment = 8 // Base deployment setup
    if (dbCount > 0) deployment += 4 // Database deployment
    if (serviceCount > 0) deployment += serviceCount * 2 // Service deployment

    // Add 20% buffer for unexpected issues
    const buffer = 1.2
    planning = Math.ceil(planning * buffer)
    architecture = Math.ceil(architecture * buffer)
    development = Math.ceil(development * buffer)
    uiDesign = Math.ceil(uiDesign * buffer)
    testing = Math.ceil(testing * buffer)
    deployment = Math.ceil(deployment * buffer)

    const totalHours = planning + architecture + development + uiDesign + testing + deployment
    const totalDays = Math.ceil(totalHours / 8) // 8 hours per day
    const timeline = Math.ceil(totalDays / 5) // 5 working days per week

    // Recommended team size based on timeline
    let recommendedTeamSize = 1
    if (timeline > 20) recommendedTeamSize = 3
    else if (timeline > 10) recommendedTeamSize = 2

    return {
      totalHours,
      totalDays,
      timeline,
      recommendedTeamSize,
      breakdown: {
        planning,
        architecture,
        development,
        uiDesign,
        testing,
        deployment,
      },
    }
  }

  /**
   * Calculate cost estimates
   */
  calculateCostEstimate(devEstimate: DevelopmentEstimate): CostEstimate {
    const hourlyRate = 100 // Average developer rate ($/hour)
    const developmentTotal = devEstimate.totalHours * hourlyRate

    const archContent = this.artifacts.arch_design?.content || {}
    const tables = archContent.database_schema?.tables || []
    const serviceCount = 0
    const dbCount = Array.isArray(tables) ? tables.length : 0

    // Base infrastructure
    let infrastructureMonthly = 50 // Base hosting
    infrastructureMonthly += serviceCount * 25 // Per service
    infrastructureMonthly += dbCount * 30 // Per database

    // Cloud provider estimates
    const aws = infrastructureMonthly * 1.0 // AWS pricing
    const azure = infrastructureMonthly * 0.95 // Azure pricing (slightly cheaper)
    const gcp = infrastructureMonthly * 0.90 // GCP pricing

    // Third-party services (auth, payments, etc.)
    const thirdPartyMonthly = 50 // Base third-party services

    const infrastructureYearly = infrastructureMonthly * 12
    const thirdPartyYearly = thirdPartyMonthly * 12

    const totalFirstYear = developmentTotal + infrastructureYearly + thirdPartyYearly

    return {
      infrastructure: {
        monthly: Math.round(infrastructureMonthly),
        yearly: Math.round(infrastructureYearly),
      },
      development: {
        total: Math.round(developmentTotal),
        hourlyRate,
      },
      thirdParty: {
        monthly: thirdPartyMonthly,
        yearly: thirdPartyYearly,
      },
      totalFirstYear: Math.round(totalFirstYear),
      breakdown: {
        aws: Math.round(aws * 12),
        azure: Math.round(azure * 12),
        gcp: Math.round(gcp * 12),
      },
    }
  }

  /**
   * Generate complexity score
   */
  calculateComplexity(): {
    score: number // 1-10
    level: "simple" | "moderate" | "complex" | "very-complex"
    factors: string[]
  } {
    const archContent = this.artifacts.arch_design?.content || {}
    const apis = archContent.apis || []
    const tables = archContent.database_schema?.tables || []
    const apiCount = Array.isArray(apis) ? apis.length : 0
    const dbCount = Array.isArray(tables) ? tables.length : 0
    const componentCount = 0
    const serviceCount = 0
    let score = 0
    const factors: string[] = []

    // Component complexity
    if (componentCount > 20) {
      score += 3
      factors.push("High component count")
    } else if (componentCount > 10) {
      score += 2
      factors.push("Moderate component count")
    } else {
      score += 1
    }

    // Service complexity
    if (serviceCount > 5) {
      score += 3
      factors.push("Multiple microservices")
    } else if (serviceCount > 2) {
      score += 2
      factors.push("Several services")
    } else if (serviceCount > 0) {
      score += 1
    }

    // Database complexity
    if (dbCount > 3) {
      score += 2
      factors.push("Multiple databases")
    } else if (dbCount > 1) {
      score += 1
      factors.push("Multiple data stores")
    }

    // API complexity
    if (apiCount > 15) {
      score += 2
      factors.push("Extensive API surface")
    } else if (apiCount > 5) {
      score += 1
    }

    // Normalize to 1-10 scale
    score = Math.min(10, Math.max(1, score))

    let level: "simple" | "moderate" | "complex" | "very-complex"
    if (score <= 3) level = "simple"
    else if (score <= 5) level = "moderate"
    else if (score <= 7) level = "complex"
    else level = "very-complex"

    return { score, level, factors }
  }
}

