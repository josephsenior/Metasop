import type { Diagram } from "@/types/diagram"
import type PptxGenJS from "pptxgenjs"
import { getScreenshotRenderer, closeScreenshotRenderer } from "./screenshot-renderer"
import * as templates from "./html-templates"

const SLIDE_WIDTH = 10 // inches
const SLIDE_HEIGHT = 5.625 // inches (16:9 aspect ratio)
const IMAGE_WIDTH = 1920 // pixels
const IMAGE_HEIGHT = 1080 // pixels

/**
 * Generate a PowerPoint (.pptx) presentation from a diagram's MetaSOP artifacts
 * using screenshot-based rendering for pixel-perfect UI representation.
 */
export class PPTXGeneratorScreenshot {
  private diagram: Diagram

  constructor(diagram: Diagram) {
    this.diagram = diagram
  }

  async generate(): Promise<Buffer> {
    const PptxGenJS = (await import("pptxgenjs")).default
    const pptx = new PptxGenJS() as PptxGenJS
    pptx.layout = "LAYOUT_16x9"
    pptx.title = this.diagram.title
    pptx.author = "MetaSOP"
    pptx.subject = this.diagram.description

    const renderer = await getScreenshotRenderer()

    try {
      const artifacts = this.diagram.metadata?.metasop_artifacts || {}
      const pm = (artifacts.pm_spec?.content || {}) as Record<string, unknown>
      const arch = (artifacts.arch_design?.content || {}) as Record<string, unknown>
      const security = (artifacts.security_architecture?.content || {}) as Record<string, unknown>
      const devops = (artifacts.devops_infrastructure?.content || {}) as Record<string, unknown>
      const ui = (artifacts.ui_design?.content || {}) as Record<string, unknown>
      const engineer = (artifacts.engineer_impl?.content || {}) as Record<string, unknown>
      const qa = (artifacts.qa_verification?.content || {}) as Record<string, unknown>

      // Title Slide
      await this.addTitleSlide(pptx, renderer)

      // PM Spec Slides
      if (Object.keys(pm).length > 0) {
        await this.addPMSlides(pptx, renderer, pm)
      }

      // Architecture Slides
      if (Object.keys(arch).length > 0) {
        await this.addArchitectureSlides(pptx, renderer, arch)
      }

      // Security Slides
      if (Object.keys(security).length > 0) {
        await this.addSecuritySlides(pptx, renderer, security)
      }

      // DevOps Slides
      if (Object.keys(devops).length > 0) {
        await this.addDevOpsSlides(pptx, renderer, devops)
      }

      // UI Design Slides
      if (Object.keys(ui).length > 0) {
        await this.addUIDesignSlides(pptx, renderer, ui)
      }

      // Engineer Slides
      if (Object.keys(engineer).length > 0) {
        await this.addEngineerSlides(pptx, renderer, engineer)
      }

      // QA Slides
      if (Object.keys(qa).length > 0) {
        await this.addQASlides(pptx, renderer, qa)
      }

      // Generate and return the PPTX buffer
      const buffer = await pptx.write({ outputType: "nodebuffer" }) as Buffer
      return buffer
    } finally {
      // Clean up renderer
      await closeScreenshotRenderer()
    }
  }

  private async addImageSlide(pptx: PptxGenJS, renderer: any, html: string): Promise<void> {
    const imageBuffer = await renderer.renderHTMLToImage(html, IMAGE_WIDTH, IMAGE_HEIGHT)
    const slide = pptx.addSlide()
    
    // Convert buffer to base64 data URL
    const base64Image = imageBuffer.toString('base64')
    const dataUrl = `data:image/png;base64,${base64Image}`
    
    slide.addImage({
      data: dataUrl,
      x: 0,
      y: 0,
      w: SLIDE_WIDTH,
      h: SLIDE_HEIGHT
    })
  }

  private async addTitleSlide(pptx: PptxGenJS, renderer: any): Promise<void> {
    const html = templates.wrapInHTML('Title', `
      <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 80vh; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 1rem;">
        <h1 style="font-size: 3.5rem; font-weight: 800; margin-bottom: 1rem;">${this.diagram.title}</h1>
        <p style="font-size: 1.5rem; margin-bottom: 2rem; max-width: 80%;">${this.diagram.description}</p>
        <p style="font-size: 1rem; opacity: 0.8;">Generated: ${new Date(this.diagram.createdAt).toLocaleString()}</p>
      </div>
    `)
    await this.addImageSlide(pptx, renderer, html)
  }

  private async addPMSlides(pptx: PptxGenJS, renderer: any, pm: Record<string, unknown>): Promise<void> {
    // Section divider
    const dividerHTML = templates.createSectionDivider("Product Specification", "PM Agent")
    await this.addImageSlide(pptx, renderer, dividerHTML)

    // Overview
    const overviewHTML = templates.createOverviewSlide({
      summary: pm.summary,
      description: pm.description,
      ui_multi_section: pm.ui_multi_section
    })
    await this.addImageSlide(pptx, renderer, overviewHTML)

    // User Stories
    const userStories = pm.user_stories as any[] || []
    if (userStories.length > 0) {
      const storiesHTML = templates.createUserStoriesSlide(userStories)
      await this.addImageSlide(pptx, renderer, storiesHTML)
    }

    // Acceptance Criteria
    const acceptanceCriteria = pm.acceptance_criteria as any[] || []
    if (acceptanceCriteria.length > 0) {
      const criteriaHTML = templates.createListSlide(
        "Acceptance Criteria",
        acceptanceCriteria,
        (item, _idx) => `
          <div class="list-item">
            <div class="list-item-title">
              <span class="badge badge-green">AC-${_idx + 1}</span>
              ${item.criteria || item.title || item}
            </div>
            ${item.description ? `<div class="list-item-description">${item.description}</div>` : ''}
          </div>
        `
      )
      await this.addImageSlide(pptx, renderer, criteriaHTML)
    }

    // INVEST Analysis
    if (pm.invest_analysis) {
      const investHTML = templates.createKeyValueSlide("INVEST Analysis", pm.invest_analysis as Record<string, any>)
      await this.addImageSlide(pptx, renderer, investHTML)
    }

    // Assumptions
    const assumptions = pm.assumptions as string[] || []
    if (assumptions.length > 0) {
      const assumptionsHTML = templates.createTextContentSlide("Assumptions", assumptions)
      await this.addImageSlide(pptx, renderer, assumptionsHTML)
    }

    // Out of Scope
    const outOfScope = pm.out_of_scope as string[] || []
    if (outOfScope.length > 0) {
      const outOfScopeHTML = templates.createTextContentSlide("Out of Scope", outOfScope)
      await this.addImageSlide(pptx, renderer, outOfScopeHTML)
    }

    // SWOT Analysis
    if (pm.swot) {
      const swotHTML = templates.createSWOTSlide(pm.swot)
      await this.addImageSlide(pptx, renderer, swotHTML)
    }

    // Gaps
    const gaps = pm.gaps as string[] || []
    if (gaps.length > 0) {
      const gapsHTML = templates.createTextContentSlide("Gaps", gaps)
      await this.addImageSlide(pptx, renderer, gapsHTML)
    }

    // Opportunities
    const opportunities = pm.opportunities as string[] || []
    if (opportunities.length > 0) {
      const opportunitiesHTML = templates.createTextContentSlide("Opportunities", opportunities)
      await this.addImageSlide(pptx, renderer, opportunitiesHTML)
    }

    // Stakeholders
    const stakeholders = pm.stakeholders as any[] || []
    if (stakeholders.length > 0) {
      const stakeholdersHTML = templates.createListSlide(
        "Stakeholders",
        stakeholders,
        (item, _idx) => `
          <div class="list-item">
            <div class="list-item-title">${item.name || item.role || item}</div>
            ${item.role && item.name !== item.role ? `<div class="list-item-description">Role: ${item.role}</div>` : ''}
            ${item.responsibilities ? `<div class="list-item-description">${item.responsibilities}</div>` : ''}
          </div>
        `
      )
      await this.addImageSlide(pptx, renderer, stakeholdersHTML)
    }
  }

  private async addArchitectureSlides(pptx: PptxGenJS, renderer: any, arch: Record<string, unknown>): Promise<void> {
    // Section divider
    const dividerHTML = templates.createSectionDivider("Architecture Design", "Architect Agent")
    await this.addImageSlide(pptx, renderer, dividerHTML)

    // Overview
    if (arch.overview || arch.description) {
      const overviewHTML = templates.createTextContentSlide("Architecture Overview", arch.overview as string || arch.description as string)
      await this.addImageSlide(pptx, renderer, overviewHTML)
    }

    // API Endpoints
    const apiEndpoints = arch.api_endpoints as any[] || []
    if (apiEndpoints.length > 0) {
      const apiHTML = templates.createListSlide(
        "API Endpoints",
        apiEndpoints,
        (item, _idx) => `
          <div class="list-item">
            <div class="list-item-title">
              <span class="badge badge-blue">${item.method || 'GET'}</span>
              ${item.endpoint || item.path || item}
            </div>
            ${item.description ? `<div class="list-item-description">${item.description}</div>` : ''}
          </div>
        `
      )
      await this.addImageSlide(pptx, renderer, apiHTML)
    }

    // Architecture Decisions
    const decisions = arch.architecture_decisions as any[] || []
    if (decisions.length > 0) {
      const decisionsHTML = templates.createListSlide(
        "Architecture Decisions",
        decisions,
        (item, _idx) => `
          <div class="list-item">
            <div class="list-item-title">${item.decision || item.title || item}</div>
            ${item.rationale ? `<div class="list-item-description">${item.rationale}</div>` : ''}
          </div>
        `
      )
      await this.addImageSlide(pptx, renderer, decisionsHTML)
    }

    // Database Schema
    const database = arch.database_schema as any[] || []
    if (database.length > 0) {
      const dbHTML = templates.createListSlide(
        "Database Schema",
        database,
        (item, _idx) => `
          <div class="list-item">
            <div class="list-item-title">
              <span class="badge badge-purple">${item.name || item.table || item}</span>
            </div>
            ${item.description ? `<div class="list-item-description">${item.description}</div>` : ''}
            ${item.fields ? `<div class="list-item-description">Fields: ${item.fields.length}</div>` : ''}
          </div>
        `
      )
      await this.addImageSlide(pptx, renderer, dbHTML)
    }

    // Tech Stack
    if (arch.tech_stack) {
      const techStackHTML = templates.createKeyValueSlide("Tech Stack", arch.tech_stack as Record<string, any>)
      await this.addImageSlide(pptx, renderer, techStackHTML)
    }

    // Integrations
    const integrations = arch.integrations as any[] || []
    if (integrations.length > 0) {
      const integrationsHTML = templates.createListSlide(
        "Integrations",
        integrations,
        (item, _idx) => `
          <div class="list-item">
            <div class="list-item-title">${item.name || item.service || item}</div>
            ${item.purpose ? `<div class="list-item-description">${item.purpose}</div>` : ''}
          </div>
        `
      )
      await this.addImageSlide(pptx, renderer, integrationsHTML)
    }

    // Security Considerations
    const securityConsiderations = arch.security_considerations as string[] || []
    if (securityConsiderations.length > 0) {
      const securityHTML = templates.createTextContentSlide("Security Considerations", securityConsiderations)
      await this.addImageSlide(pptx, renderer, securityHTML)
    }

    // Scalability
    const scalability = arch.scalability as string[] || []
    if (scalability.length > 0) {
      const scalabilityHTML = templates.createTextContentSlide("Scalability", scalability)
      await this.addImageSlide(pptx, renderer, scalabilityHTML)
    }
  }

  private async addSecuritySlides(pptx: PptxGenJS, renderer: any, security: Record<string, unknown>): Promise<void> {
    // Section divider
    const dividerHTML = templates.createSectionDivider("Security Architecture", "Security Agent")
    await this.addImageSlide(pptx, renderer, dividerHTML)

    // Security Architecture
    if (security.architecture || security.overview) {
      const archHTML = templates.createTextContentSlide("Security Architecture", security.architecture as string || security.overview as string)
      await this.addImageSlide(pptx, renderer, archHTML)
    }

    // Threat Model
    const threats = security.threat_model as any[] || []
    if (threats.length > 0) {
      const threatsHTML = templates.createListSlide(
        "Threat Model",
        threats,
        (item, _idx) => `
          <div class="list-item">
            <div class="list-item-title">
              <span class="badge badge-red">T-${_idx + 1}</span>
              ${item.threat || item.title || item}
            </div>
            ${item.mitigation ? `<div class="list-item-description">Mitigation: ${item.mitigation}</div>` : ''}
          </div>
        `
      )
      await this.addImageSlide(pptx, renderer, threatsHTML)
    }

    // Encryption
    if (security.encryption) {
      const encryptionHTML = templates.createKeyValueSlide("Encryption", security.encryption as Record<string, any>)
      await this.addImageSlide(pptx, renderer, encryptionHTML)
    }

    // Compliance
    const compliance = security.compliance as string[] || []
    if (compliance.length > 0) {
      const complianceHTML = templates.createTextContentSlide("Compliance", compliance)
      await this.addImageSlide(pptx, renderer, complianceHTML)
    }
  }

  private async addDevOpsSlides(pptx: PptxGenJS, renderer: any, devops: Record<string, unknown>): Promise<void> {
    // Section divider
    const dividerHTML = templates.createSectionDivider("DevOps Infrastructure", "DevOps Agent")
    await this.addImageSlide(pptx, renderer, dividerHTML)

    // Infrastructure
    if (devops.infrastructure) {
      const infraHTML = templates.createKeyValueSlide("Infrastructure", devops.infrastructure as Record<string, any>)
      await this.addImageSlide(pptx, renderer, infraHTML)
    }

    // CI/CD Pipeline
    const cicd = devops.cicd_pipeline as any[] || []
    if (cicd.length > 0) {
      const cicdHTML = templates.createListSlide(
        "CI/CD Pipeline",
        cicd,
        (item) => `
          <div class="list-item">
            <div class="list-item-title">${item.stage || item.name || item}</div>
            ${item.description ? `<div class="list-item-description">${item.description}</div>` : ''}
          </div>
        `
      )
      await this.addImageSlide(pptx, renderer, cicdHTML)
    }

    // Containerization
    if (devops.containerization) {
      const containerHTML = templates.createKeyValueSlide("Containerization", devops.containerization as Record<string, any>)
      await this.addImageSlide(pptx, renderer, containerHTML)
    }

    // Deployment Strategy
    if (devops.deployment_strategy) {
      const deploymentHTML = templates.createTextContentSlide("Deployment Strategy", devops.deployment_strategy as string)
      await this.addImageSlide(pptx, renderer, deploymentHTML)
    }

    // Monitoring
    if (devops.monitoring) {
      const monitoringHTML = templates.createKeyValueSlide("Monitoring", devops.monitoring as Record<string, any>)
      await this.addImageSlide(pptx, renderer, monitoringHTML)
    }
  }

  private async addUIDesignSlides(pptx: PptxGenJS, renderer: any, ui: Record<string, unknown>): Promise<void> {
    // Section divider
    const dividerHTML = templates.createSectionDivider("UI Design", "UI Designer Agent")
    await this.addImageSlide(pptx, renderer, dividerHTML)

    // Design Tokens
    if (ui.design_tokens) {
      const tokensHTML = templates.createKeyValueSlide("Design Tokens", ui.design_tokens as Record<string, any>)
      await this.addImageSlide(pptx, renderer, tokensHTML)
    }

    // Design Strategy
    if (ui.design_strategy || ui.strategy) {
      const strategyHTML = templates.createTextContentSlide("Design Strategy", ui.design_strategy as string || ui.strategy as string)
      await this.addImageSlide(pptx, renderer, strategyHTML)
    }

    // Sitemap
    const sitemap = ui.sitemap as any[] || []
    if (sitemap.length > 0) {
      const sitemapHTML = templates.createListSlide(
        "Sitemap",
        sitemap,
        (item) => `
          <div class="list-item">
            <div class="list-item-title">${item.page || item.name || item}</div>
            ${item.description ? `<div class="list-item-description">${item.description}</div>` : ''}
          </div>
        `
      )
      await this.addImageSlide(pptx, renderer, sitemapHTML)
    }

    // Component Library
    const components = ui.component_library as any[] || []
    if (components.length > 0) {
      const componentsHTML = templates.createListSlide(
        "Component Library",
        components,
        (item) => `
          <div class="list-item">
            <div class="list-item-title">${item.name || item.component || item}</div>
            ${item.description ? `<div class="list-item-description">${item.description}</div>` : ''}
          </div>
        `
      )
      await this.addImageSlide(pptx, renderer, componentsHTML)
    }

    // Atomic Design
    if (ui.atomic_design) {
      const atomicHTML = templates.createKeyValueSlide("Atomic Design", ui.atomic_design as Record<string, any>)
      await this.addImageSlide(pptx, renderer, atomicHTML)
    }

    // Blueprint
    const blueprint = ui.blueprint as any[] || []
    if (blueprint.length > 0) {
      const blueprintHTML = templates.createListSlide(
        "Blueprint",
        blueprint,
        (item) => `
          <div class="list-item">
            <div class="list-item-title">${item.screen || item.name || item}</div>
            ${item.description ? `<div class="list-item-description">${item.description}</div>` : ''}
          </div>
        `
      )
      await this.addImageSlide(pptx, renderer, blueprintHTML)
    }

    // Accessibility
    const accessibility = ui.accessibility as string[] || []
    if (accessibility.length > 0) {
      const accessibilityHTML = templates.createTextContentSlide("Accessibility", accessibility)
      await this.addImageSlide(pptx, renderer, accessibilityHTML)
    }
  }

  private async addEngineerSlides(pptx: PptxGenJS, renderer: any, engineer: Record<string, unknown>): Promise<void> {
    // Section divider
    const dividerHTML = templates.createSectionDivider("Implementation Plan", "Engineer Agent")
    await this.addImageSlide(pptx, renderer, dividerHTML)

    // Implementation Plan
    if (engineer.implementation_plan || engineer.overview) {
      const planHTML = templates.createTextContentSlide("Implementation Plan", engineer.implementation_plan as string || engineer.overview as string)
      await this.addImageSlide(pptx, renderer, planHTML)
    }

    // Implementation Phases
    const phases = engineer.implementation_phases as any[] || []
    if (phases.length > 0) {
      const phasesHTML = templates.createListSlide(
        "Implementation Phases",
        phases,
        (item, _idx) => `
          <div class="list-item">
            <div class="list-item-title">
              <span class="badge badge-blue">Phase ${_idx + 1}</span>
              ${item.phase || item.name || item}
            </div>
            ${item.description ? `<div class="list-item-description">${item.description}</div>` : ''}
          </div>
        `
      )
      await this.addImageSlide(pptx, renderer, phasesHTML)
    }

    // Technical Decisions
    const decisions = engineer.technical_decisions as any[] || []
    if (decisions.length > 0) {
      const decisionsHTML = templates.createListSlide(
        "Technical Decisions",
        decisions,
        (item) => `
          <div class="list-item">
            <div class="list-item-title">${item.decision || item.title || item}</div>
            ${item.rationale ? `<div class="list-item-description">${item.rationale}</div>` : ''}
          </div>
        `
      )
      await this.addImageSlide(pptx, renderer, decisionsHTML)
    }

    // Dependencies
    const dependencies = engineer.dependencies as string[] || []
    if (dependencies.length > 0) {
      const dependenciesHTML = templates.createTextContentSlide("Dependencies", dependencies)
      await this.addImageSlide(pptx, renderer, dependenciesHTML)
    }

    // File Structure
    if (engineer.file_structure || engineer.project_structure) {
      const structureHTML = templates.createTextContentSlide("File Structure", engineer.file_structure as string || engineer.project_structure as string)
      await this.addImageSlide(pptx, renderer, structureHTML)
    }

    // Environment Variables
    if (engineer.environment_variables) {
      const envHTML = templates.createKeyValueSlide("Environment Variables", engineer.environment_variables as Record<string, any>)
      await this.addImageSlide(pptx, renderer, envHTML)
    }
  }

  private async addQASlides(pptx: PptxGenJS, renderer: any, qa: Record<string, unknown>): Promise<void> {
    // Section divider
    const dividerHTML = templates.createSectionDivider("QA Verification", "QA Agent")
    await this.addImageSlide(pptx, renderer, dividerHTML)

    // Test Strategy
    if (qa.test_strategy || qa.strategy) {
      const strategyHTML = templates.createTextContentSlide("Test Strategy", qa.test_strategy as string || qa.strategy as string)
      await this.addImageSlide(pptx, renderer, strategyHTML)
    }

    // Test Cases
    const testCases = qa.test_cases as any[] || []
    if (testCases.length > 0) {
      const testCasesHTML = templates.createListSlide(
        "Test Cases",
        testCases,
        (item, _idx) => `
          <div class="list-item">
            <div class="list-item-title">
              <span class="badge badge-green">TC-${_idx + 1}</span>
              ${item.test || item.title || item}
            </div>
            ${item.expected ? `<div class="list-item-description">Expected: ${item.expected}</div>` : ''}
          </div>
        `
      )
      await this.addImageSlide(pptx, renderer, testCasesHTML)
    }

    // Security Testing
    if (qa.security_testing || qa.security_plan) {
      const securityHTML = templates.createTextContentSlide("Security Testing", qa.security_testing as string || qa.security_plan as string)
      await this.addImageSlide(pptx, renderer, securityHTML)
    }

    // Risk Analysis
    const risks = qa.risk_analysis as any[] || []
    if (risks.length > 0) {
      const risksHTML = templates.createListSlide(
        "Risk Analysis",
        risks,
        (item, _idx) => `
          <div class="list-item">
            <div class="list-item-title">
              <span class="badge badge-red">R-${_idx + 1}</span>
              ${item.risk || item.title || item}
            </div>
            ${item.mitigation ? `<div class="list-item-description">Mitigation: ${item.mitigation}</div>` : ''}
          </div>
        `
      )
      await this.addImageSlide(pptx, renderer, risksHTML)
    }

    // Accessibility Testing
    const accessibility = qa.accessibility_testing as string[] || []
    if (accessibility.length > 0) {
      const accessibilityHTML = templates.createTextContentSlide("Accessibility Testing", accessibility)
      await this.addImageSlide(pptx, renderer, accessibilityHTML)
    }

    // Performance Testing
    if (qa.performance_testing) {
      const performanceHTML = templates.createKeyValueSlide("Performance Testing", qa.performance_testing as Record<string, any>)
      await this.addImageSlide(pptx, renderer, performanceHTML)
    }
  }
}
