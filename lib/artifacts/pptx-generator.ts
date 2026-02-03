import type { Diagram } from "@/types/diagram"
import type PptxGenJS from "pptxgenjs"

const SLIDE_TITLE_FONT = 24
const SLIDE_BODY_FONT = 12
const MARGIN = 0.5
const W = 10

function truncate(text: string, maxLen: number): string {
  if (!text || typeof text !== "string") return ""
  return text.length <= maxLen ? text : text.slice(0, maxLen - 3) + "..."
}

function bulletLines(arr: unknown[], maxItems: number = 8): string[] {
  if (!Array.isArray(arr)) return []
  return arr.slice(0, maxItems).map((item: unknown) => {
    if (typeof item === "string") return `• ${truncate(item, 120)}`
    if (item && typeof item === "object" && "title" in item) return `• ${truncate((item as { title?: string }).title ?? "", 100)}`
    if (item && typeof item === "object" && "story" in item) return `• ${truncate((item as { story?: string }).story ?? "", 100)}`
    if (item && typeof item === "object" && "decision" in item) return `• ${truncate((item as { decision?: string }).decision ?? "", 100)}`
    if (item && typeof item === "object" && "threat" in item) return `• ${truncate((item as { threat?: string }).threat ?? "", 100)}`
    if (item && typeof item === "object" && "name" in item) return `• ${truncate((item as { name?: string }).name ?? "", 80)}`
    if (item && typeof item === "object" && "criteria" in item) return `• ${truncate((item as { criteria?: string }).criteria ?? "", 100)}`
    if (item && typeof item === "object" && "task" in item) return `• ${truncate((item as { task?: string }).task ?? "", 100)}`
    if (item && typeof item === "object" && "risk" in item) return `• ${truncate((item as { risk?: string }).risk ?? "", 100)}`
    return `• ${truncate(String(item), 80)}`
  })
}

function addSectionSlide(pptx: PptxGenJS, title: string, subtitle?: string): void {
  const slide = pptx.addSlide()
  slide.addText(title, { x: MARGIN, y: 2, w: W, h: 1, fontSize: 36, bold: true, align: "center" })
  if (subtitle) {
    slide.addText(subtitle, { x: MARGIN, y: 3.2, w: W, h: 0.5, fontSize: 18, align: "center", color: "666666" })
  }
}

/**
 * Generate a PowerPoint (.pptx) presentation from a diagram's MetaSOP artifacts.
 * Each artifact panel/tab becomes its own slide(s) for better readability.
 */
export class PPTXGenerator {
  private diagram: Diagram

  constructor(diagram: Diagram) {
    this.diagram = diagram
  }

  async generate(): Promise<Buffer> {
    const PptxGenJS = (await import("pptxgenjs")).default
    const pptx = new PptxGenJS() as PptxGenJS
    pptx.title = truncate(this.diagram.title, 100)
    pptx.author = "MetaSOP"
    pptx.subject = truncate(this.diagram.description, 200)

    const artifacts = this.diagram.metadata?.metasop_artifacts || {}
    const pm = (artifacts.pm_spec?.content || {}) as Record<string, unknown>
    const arch = (artifacts.arch_design?.content || {}) as Record<string, unknown>
    const security = (artifacts.security_architecture?.content || {}) as Record<string, unknown>
    const devops = (artifacts.devops_infrastructure?.content || {}) as Record<string, unknown>
    const ui = (artifacts.ui_design?.content || {}) as Record<string, unknown>
    const engineer = (artifacts.engineer_impl?.content || {}) as Record<string, unknown>
    const qa = (artifacts.qa_verification?.content || {}) as Record<string, unknown>

    // Slide 1: Title
    const slide1 = pptx.addSlide()
    slide1.addText(this.diagram.title, { x: MARGIN, y: 1.5, w: W, h: 1, fontSize: 28, bold: true })
    slide1.addText(truncate(this.diagram.description, 300), { x: MARGIN, y: 2.8, w: W, h: 1.2, fontSize: 14 })
    slide1.addText(`Generated: ${new Date(this.diagram.createdAt).toLocaleString()}`, { x: MARGIN, y: 4.2, w: W, h: 0.4, fontSize: 10, color: "666666" })

    // ==================== PM SPEC ====================
    if (Object.keys(pm).length > 0) {
      addSectionSlide(pptx, "Product Specification", "PM Agent")

      // PM Slide: Overview
      const pmOverviewSlide = pptx.addSlide()
      pmOverviewSlide.addText("PM: Overview", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })
      const pmSummary = (pm.summary as string) || (pm.description as string) || ""
      if (pmSummary) pmOverviewSlide.addText(truncate(pmSummary, 600), { x: MARGIN, y: 1, w: W, h: 2, fontSize: SLIDE_BODY_FONT })

      // Stats
      const stats = [
        `User Stories: ${(pm.user_stories as unknown[])?.length || 0}`,
        `Acceptance Criteria: ${(pm.acceptance_criteria as unknown[])?.length || 0}`,
        `Assumptions: ${(pm.assumptions as unknown[])?.length || 0}`,
        `Stakeholders: ${(pm.stakeholders as unknown[])?.length || 0}`,
        `Out of Scope: ${(pm.out_of_scope as unknown[])?.length || 0}`,
      ]
      pmOverviewSlide.addText("Statistics", { x: MARGIN, y: 3.2, w: W, h: 0.35, fontSize: 14, bold: true })
      pmOverviewSlide.addText(stats.join("\n"), { x: MARGIN, y: 3.6, w: W, h: 2, fontSize: 11 })

      // PM Slide: User Stories
      const stories = pm.user_stories as unknown[] || []
      if (stories.length > 0) {
        const pmStoriesSlide = pptx.addSlide()
        pmStoriesSlide.addText("PM: User Stories", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })
        const storyLines = stories.slice(0, 12).map((s: unknown, idx: number) => {
          if (typeof s === "string") return `${idx + 1}. ${truncate(s, 100)}`
          const story = s as { id?: string; title?: string; story?: string; priority?: string }
          const id = story.id || `US-${idx + 1}`
          const text = story.title || story.story || ""
          const priority = story.priority ? ` [${story.priority.toUpperCase()}]` : ""
          return `${id}. ${truncate(text, 90)}${priority}`
        })
        pmStoriesSlide.addText(storyLines.join("\n"), { x: MARGIN, y: 1, w: W, h: 4.5, fontSize: 10 })
      }

      // PM Slide: Acceptance Criteria
      const acceptance = pm.acceptance_criteria as unknown[] || []
      if (acceptance.length > 0) {
        const pmAcceptanceSlide = pptx.addSlide()
        pmAcceptanceSlide.addText("PM: Acceptance Criteria", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })
        const acceptanceLines = bulletLines(acceptance, 15)
        pmAcceptanceSlide.addText(acceptanceLines.join("\n"), { x: MARGIN, y: 1, w: W, h: 4.5, fontSize: 10 })
      }

      // PM Slide: INVEST Analysis
      const invest = pm.invest_analysis as unknown[] || []
      if (invest.length > 0) {
        const pmInvestSlide = pptx.addSlide()
        pmInvestSlide.addText("PM: INVEST Analysis", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })
        const investLines = invest.slice(0, 10).map((item: unknown) => {
          const i = item as { user_story_id?: string; score?: number; comments?: string }
          return `• ${i.user_story_id || "Story"}: Score ${i.score || 0}${i.comments ? ` - ${truncate(i.comments, 60)}` : ""}`
        })
        pmInvestSlide.addText(investLines.join("\n"), { x: MARGIN, y: 1, w: W, h: 4.5, fontSize: 10 })
      }

      // PM Slide: Assumptions
      const assumptions = pm.assumptions as string[] || []
      if (assumptions.length > 0) {
        const pmAssumptionsSlide = pptx.addSlide()
        pmAssumptionsSlide.addText("PM: Assumptions", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })
        pmAssumptionsSlide.addText(bulletLines(assumptions, 15).join("\n"), { x: MARGIN, y: 1, w: W, h: 4.5, fontSize: 10 })
      }

      // PM Slide: Out of Scope
      const outOfScope = pm.out_of_scope as string[] || []
      if (outOfScope.length > 0) {
        const pmOutOfScopeSlide = pptx.addSlide()
        pmOutOfScopeSlide.addText("PM: Out of Scope", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })
        pmOutOfScopeSlide.addText(bulletLines(outOfScope, 15).join("\n"), { x: MARGIN, y: 1, w: W, h: 4.5, fontSize: 10 })
      }

      // PM Slide: SWOT
      const swot = pm.swot as { strengths?: string[]; weaknesses?: string[]; opportunities?: string[]; threats?: string[] } | undefined
      if (swot && (swot.strengths?.length || swot.weaknesses?.length || swot.opportunities?.length || swot.threats?.length)) {
        const pmSwotSlide = pptx.addSlide()
        pmSwotSlide.addText("PM: SWOT Analysis", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })
        let yPos = 1
        if (swot.strengths?.length) {
          pmSwotSlide.addText("Strengths:", { x: MARGIN, y: yPos, w: 4.5, h: 0.3, fontSize: 12, bold: true, color: "008000" })
          pmSwotSlide.addText(bulletLines(swot.strengths, 4).join("\n"), { x: MARGIN, y: yPos + 0.35, w: 4.5, h: 1.5, fontSize: 9 })
        }
        if (swot.weaknesses?.length) {
          pmSwotSlide.addText("Weaknesses:", { x: MARGIN + 5, y: yPos, w: 4.5, h: 0.3, fontSize: 12, bold: true, color: "FF0000" })
          pmSwotSlide.addText(bulletLines(swot.weaknesses, 4).join("\n"), { x: MARGIN + 5, y: yPos + 0.35, w: 4.5, h: 1.5, fontSize: 9 })
        }
        yPos += 2
        if (swot.opportunities?.length) {
          pmSwotSlide.addText("Opportunities:", { x: MARGIN, y: yPos, w: 4.5, h: 0.3, fontSize: 12, bold: true, color: "0000FF" })
          pmSwotSlide.addText(bulletLines(swot.opportunities, 4).join("\n"), { x: MARGIN, y: yPos + 0.35, w: 4.5, h: 1.5, fontSize: 9 })
        }
        if (swot.threats?.length) {
          pmSwotSlide.addText("Threats:", { x: MARGIN + 5, y: yPos, w: 4.5, h: 0.3, fontSize: 12, bold: true, color: "FFA500" })
          pmSwotSlide.addText(bulletLines(swot.threats, 4).join("\n"), { x: MARGIN + 5, y: yPos + 0.35, w: 4.5, h: 1.5, fontSize: 9 })
        }
      }

      // PM Slide: Gaps
      const gaps = pm.gaps as unknown[] || []
      if (gaps.length > 0) {
        const pmGapsSlide = pptx.addSlide()
        pmGapsSlide.addText("PM: Gaps", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })
        const gapLines = gaps.slice(0, 10).map((g: unknown) => {
          const gap = g as { gap?: string; impact?: string; priority?: string }
          return `• ${truncate(gap.gap || "", 80)}${gap.priority ? ` [${gap.priority.toUpperCase()}]` : ""}`
        })
        pmGapsSlide.addText(gapLines.join("\n"), { x: MARGIN, y: 1, w: W, h: 4.5, fontSize: 10 })
      }

      // PM Slide: Opportunities
      const opportunities = pm.opportunities as unknown[] || []
      if (opportunities.length > 0) {
        const pmOpportunitiesSlide = pptx.addSlide()
        pmOpportunitiesSlide.addText("PM: Opportunities", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })
        const oppLines = opportunities.slice(0, 10).map((o: unknown) => {
          const opp = o as { opportunity?: string; value?: string; feasibility?: string }
          return `• ${truncate(opp.opportunity || "", 80)}${opp.feasibility ? ` [${opp.feasibility.toUpperCase()}]` : ""}`
        })
        pmOpportunitiesSlide.addText(oppLines.join("\n"), { x: MARGIN, y: 1, w: W, h: 4.5, fontSize: 10 })
      }

      // PM Slide: Stakeholders
      const stakeholders = pm.stakeholders as unknown[] || []
      if (stakeholders.length > 0) {
        const pmStakeholdersSlide = pptx.addSlide()
        pmStakeholdersSlide.addText("PM: Stakeholders", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })
        const stakeholderLines = stakeholders.slice(0, 12).map((s: unknown) => {
          const st = s as { role?: string; interest?: string; influence?: string }
          return `• ${st.role || "Unknown"}${st.influence ? ` [Influence: ${st.influence}]` : ""}${st.interest ? ` - ${truncate(st.interest, 50)}` : ""}`
        })
        pmStakeholdersSlide.addText(stakeholderLines.join("\n"), { x: MARGIN, y: 1, w: W, h: 4.5, fontSize: 10 })
      }
    }

    // ==================== ARCHITECTURE ====================
    if (Object.keys(arch).length > 0) {
      addSectionSlide(pptx, "Architecture", "Architect Agent")

      // Arch Slide: Overview
      const archOverviewSlide = pptx.addSlide()
      archOverviewSlide.addText("Architecture: Overview", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })
      const archSummary = (arch.summary as string) || (arch.design_doc as string) || ""
      if (archSummary) archOverviewSlide.addText(truncate(archSummary, 600), { x: MARGIN, y: 1, w: W, h: 3, fontSize: SLIDE_BODY_FONT })

      // Arch Slide: APIs
      const apis = arch.apis as unknown[] || []
      if (apis.length > 0) {
        const archApisSlide = pptx.addSlide()
        archApisSlide.addText("Architecture: APIs", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })
        const apiLines = apis.slice(0, 15).map((a: unknown, idx: number) => {
          const api = a as { method?: string; path?: string; description?: string }
          return `${idx + 1}. ${api.method || "GET"} ${api.path || ""}${api.description ? ` - ${truncate(api.description, 60)}` : ""}`
        })
        archApisSlide.addText(apiLines.join("\n"), { x: MARGIN, y: 1, w: W, h: 4.5, fontSize: 10 })
      }

      // Arch Slide: Decisions
      const decisions = arch.decisions as unknown[] || []
      if (decisions.length > 0) {
        const archDecisionsSlide = pptx.addSlide()
        archDecisionsSlide.addText("Architecture: Key Decisions", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })
        const decisionLines = decisions.slice(0, 10).map((d: unknown) => {
          const dec = d as { decision?: string; reason?: string; status?: string }
          return `• ${truncate(dec.decision || "", 80)}${dec.status ? ` [${dec.status.toUpperCase()}]` : ""}`
        })
        archDecisionsSlide.addText(decisionLines.join("\n"), { x: MARGIN, y: 1, w: W, h: 4.5, fontSize: 10 })
      }

      // Arch Slide: Database Schema
      const dbSchema = arch.database_schema as { tables?: unknown[] } | undefined
      if (dbSchema?.tables && dbSchema.tables.length > 0) {
        const archDbSlide = pptx.addSlide()
        archDbSlide.addText("Architecture: Database Schema", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })
        const tableLines = dbSchema.tables.slice(0, 12).map((t: unknown) => {
          const table = t as { name?: string; columns?: unknown[] }
          return `• ${table.name || "Unnamed"} (${table.columns?.length || 0} columns)`
        })
        archDbSlide.addText(tableLines.join("\n"), { x: MARGIN, y: 1, w: W, h: 4.5, fontSize: 10 })
      }

      // Arch Slide: Technology Stack
      const techStack = arch.technology_stack as Record<string, string[]> | undefined
      if (techStack && Object.keys(techStack).length > 0) {
        const archTechSlide = pptx.addSlide()
        archTechSlide.addText("Architecture: Technology Stack", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })
        let yPos = 1
        Object.entries(techStack).forEach(([category, technologies]) => {
          if (technologies?.length) {
            archTechSlide.addText(`${category.charAt(0).toUpperCase() + category.slice(1)}:`, { x: MARGIN, y: yPos, w: W, h: 0.3, fontSize: 12, bold: true })
            archTechSlide.addText(technologies.join(", "), { x: MARGIN, y: yPos + 0.35, w: W, h: 0.5, fontSize: 10 })
            yPos += 1
          }
        })
      }

      // Arch Slide: Integration Points
      const integrations = arch.integration_points as unknown[] || []
      if (integrations.length > 0) {
        const archIntSlide = pptx.addSlide()
        archIntSlide.addText("Architecture: Integration Points", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })
        const intLines = integrations.slice(0, 12).map((i: unknown) => {
          const int = i as { service?: string; purpose?: string }
          return `• ${int.service || "Unknown"}${int.purpose ? `: ${truncate(int.purpose, 70)}` : ""}`
        })
        archIntSlide.addText(intLines.join("\n"), { x: MARGIN, y: 1, w: W, h: 4.5, fontSize: 10 })
      }

      // Arch Slide: Security Considerations
      const securityConsiderations = arch.security_considerations as string[] || []
      if (securityConsiderations.length > 0) {
        const archSecSlide = pptx.addSlide()
        archSecSlide.addText("Architecture: Security Considerations", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })
        archSecSlide.addText(bulletLines(securityConsiderations, 15).join("\n"), { x: MARGIN, y: 1, w: W, h: 4.5, fontSize: 10 })
      }

      // Arch Slide: Scalability
      const scalability = arch.scalability_approach as Record<string, string> | undefined
      if (scalability && Object.keys(scalability).length > 0) {
        const archScaleSlide = pptx.addSlide()
        archScaleSlide.addText("Architecture: Scalability Approach", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })
        let yPos = 1
        Object.entries(scalability).forEach(([key, value]) => {
          if (value) {
            archScaleSlide.addText(`${key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}:`, { x: MARGIN, y: yPos, w: W, h: 0.3, fontSize: 12, bold: true })
            archScaleSlide.addText(truncate(value, 200), { x: MARGIN, y: yPos + 0.35, w: W, h: 0.8, fontSize: 10 })
            yPos += 1.3
          }
        })
      }
    }

    // ==================== SECURITY ====================
    if (Object.keys(security).length > 0) {
      addSectionSlide(pptx, "Security", "Security Agent")

      // Security Slide: Architecture
      const secArch = security.security_architecture as Record<string, unknown> | undefined
      if (secArch && Object.keys(secArch).length > 0) {
        const secArchSlide = pptx.addSlide()
        secArchSlide.addText("Security: Architecture", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })
        let yPos = 1

        const auth = secArch.authentication as Record<string, unknown> | undefined
        if (auth) {
          secArchSlide.addText("Authentication:", { x: MARGIN, y: yPos, w: W, h: 0.3, fontSize: 12, bold: true })
          const authMethod = auth.method as string
          const mfa = auth.multi_factor_auth || auth.mfa_enabled ? " (MFA enabled)" : ""
          secArchSlide.addText(`${authMethod}${mfa}`, { x: MARGIN, y: yPos + 0.35, w: W, h: 0.3, fontSize: 10 })
          yPos += 0.8
        }

        const authz = secArch.authorization as Record<string, unknown> | undefined
        if (authz) {
          secArchSlide.addText("Authorization:", { x: MARGIN, y: yPos, w: W, h: 0.3, fontSize: 12, bold: true })
          secArchSlide.addText(`${authz.model || "None"}`, { x: MARGIN, y: yPos + 0.35, w: W, h: 0.3, fontSize: 10 })
          yPos += 0.8
        }

        const session = secArch.session_management as Record<string, unknown> | undefined
        if (session) {
          secArchSlide.addText("Session Management:", { x: MARGIN, y: yPos, w: W, h: 0.3, fontSize: 12, bold: true })
          secArchSlide.addText(`Strategy: ${session.strategy || "Unknown"}`, { x: MARGIN, y: yPos + 0.35, w: W, h: 0.3, fontSize: 10 })
          yPos += 0.8
        }
      }

      // Security Slide: Threat Model
      const threats = security.threat_model as unknown[] || []
      if (threats.length > 0) {
        const secThreatsSlide = pptx.addSlide()
        secThreatsSlide.addText("Security: Threat Model", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })
        const threatLines = threats.slice(0, 12).map((t: unknown) => {
          const threat = t as { threat?: string; severity?: string; mitigation?: string }
          return `• ${truncate(threat.threat || "", 70)} [${threat.severity?.toUpperCase() || "UNKNOWN"}]`
        })
        secThreatsSlide.addText(threatLines.join("\n"), { x: MARGIN, y: 1, w: W, h: 4.5, fontSize: 10 })
      }

      // Security Slide: Encryption
      const encryption = security.encryption as Record<string, unknown> | undefined
      if (encryption && Object.keys(encryption).length > 0) {
        const secEncSlide = pptx.addSlide()
        secEncSlide.addText("Security: Encryption", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })
        let yPos = 1

        const dataAtRest = encryption.data_at_rest as Record<string, string> | undefined
        if (dataAtRest) {
          secEncSlide.addText("Data at Rest:", { x: MARGIN, y: yPos, w: W, h: 0.3, fontSize: 12, bold: true })
          secEncSlide.addText(`Method: ${dataAtRest.method || "Unknown"}`, { x: MARGIN, y: yPos + 0.35, w: W, h: 0.3, fontSize: 10 })
          yPos += 0.8
        }

        const dataInTransit = encryption.data_in_transit as Record<string, string> | undefined
        if (dataInTransit) {
          secEncSlide.addText("Data in Transit:", { x: MARGIN, y: yPos, w: W, h: 0.3, fontSize: 12, bold: true })
          secEncSlide.addText(`Method: ${dataInTransit.method || "Unknown"}`, { x: MARGIN, y: yPos + 0.35, w: W, h: 0.3, fontSize: 10 })
          yPos += 0.8
        }

        const keyMgmt = encryption.key_management as Record<string, string> | undefined
        if (keyMgmt) {
          secEncSlide.addText("Key Management:", { x: MARGIN, y: yPos, w: W, h: 0.3, fontSize: 12, bold: true })
          secEncSlide.addText(`Strategy: ${keyMgmt.strategy || "Unknown"}`, { x: MARGIN, y: yPos + 0.35, w: W, h: 0.3, fontSize: 10 })
        }
      }

      // Security Slide: Compliance
      const compliance = security.compliance as unknown[] || []
      if (compliance.length > 0) {
        const secCompSlide = pptx.addSlide()
        secCompSlide.addText("Security: Compliance", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })
        const compLines = compliance.slice(0, 12).map((c: unknown) => {
          const comp = c as { standard?: string; requirements?: string[] }
          return `• ${comp.standard || "Unknown"}${comp.requirements?.length ? ` (${comp.requirements.length} requirements)` : ""}`
        })
        secCompSlide.addText(compLines.join("\n"), { x: MARGIN, y: 1, w: W, h: 4.5, fontSize: 10 })
      }
    }

    // ==================== DEVOPS ====================
    if (Object.keys(devops).length > 0) {
      addSectionSlide(pptx, "DevOps & Infrastructure", "DevOps Agent")

      // DevOps Slide: Infrastructure
      const infrastructure = devops.infrastructure as Record<string, unknown> | undefined
      if (infrastructure && Object.keys(infrastructure).length > 0) {
        const devopsInfraSlide = pptx.addSlide()
        devopsInfraSlide.addText("DevOps: Infrastructure", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })

        const services = infrastructure.services as unknown[] || []
        if (services.length > 0) {
          const serviceLines = services.slice(0, 15).map((s: unknown) => {
            const svc = s as { name?: string; type?: string }
            return `• ${svc.name || "Unknown"}${svc.type ? ` (${svc.type})` : ""}`
          })
          devopsInfraSlide.addText(serviceLines.join("\n"), { x: MARGIN, y: 1, w: W, h: 4.5, fontSize: 10 })
        }
      }

      // DevOps Slide: CI/CD
      const cicd = devops.cicd as Record<string, unknown> | undefined
      if (cicd && Object.keys(cicd).length > 0) {
        const devopsCicdSlide = pptx.addSlide()
        devopsCicdSlide.addText("DevOps: CI/CD Pipeline", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })

        const stages = cicd.pipeline_stages as unknown[] || []
        if (stages.length > 0) {
          const stageLines = stages.slice(0, 12).map((s: unknown, idx: number) => {
            const stage = s as { name?: string; status?: string }
            return `${idx + 1}. ${stage.name || "Unnamed"}${stage.status ? ` [${stage.status}]` : ""}`
          })
          devopsCicdSlide.addText(stageLines.join("\n"), { x: MARGIN, y: 1, w: W, h: 4.5, fontSize: 10 })
        }

        const tools = cicd.tools as string[] || []
        if (tools.length > 0) {
          devopsCicdSlide.addText("Tools:", { x: MARGIN, y: 4, w: W, h: 0.3, fontSize: 12, bold: true })
          devopsCicdSlide.addText(tools.join(", "), { x: MARGIN, y: 4.35, w: W, h: 0.5, fontSize: 10 })
        }
      }

      // DevOps Slide: Containerization
      const containerization = devops.containerization as Record<string, unknown> | undefined
      if (containerization && Object.keys(containerization).length > 0) {
        const devopsContSlide = pptx.addSlide()
        devopsContSlide.addText("DevOps: Containerization", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })

        const k8s = containerization.kubernetes as Record<string, unknown> | undefined
        if (k8s) {
          const deployments = k8s.deployments as unknown[] || []
          if (deployments.length > 0) {
            const deployLines = deployments.slice(0, 10).map((d: unknown) => {
              const dep = d as { name?: string; replicas?: number }
              return `• ${dep.name || "Unnamed"}${dep.replicas ? ` (${dep.replicas} replicas)` : ""}`
            })
            devopsContSlide.addText("Kubernetes Deployments:", { x: MARGIN, y: 1, w: W, h: 0.3, fontSize: 12, bold: true })
            devopsContSlide.addText(deployLines.join("\n"), { x: MARGIN, y: 1.35, w: W, h: 2, fontSize: 10 })
          }
        }
      }

      // DevOps Slide: Deployment
      const deployment = devops.deployment as Record<string, unknown> | undefined
      if (deployment && Object.keys(deployment).length > 0) {
        const devopsDeploySlide = pptx.addSlide()
        devopsDeploySlide.addText("DevOps: Deployment", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })

        const strategy = deployment.strategy as string
        if (strategy) {
          devopsDeploySlide.addText("Strategy:", { x: MARGIN, y: 1, w: W, h: 0.3, fontSize: 12, bold: true })
          devopsDeploySlide.addText(strategy, { x: MARGIN, y: 1.35, w: W, h: 0.3, fontSize: 10 })
        }

        const environments = deployment.environments as unknown[] || []
        if (environments.length > 0) {
          const envLines = environments.slice(0, 10).map((e: unknown) => {
            const env = e as { name?: string }
            return `• ${env.name || "Unnamed"}`
          })
          devopsDeploySlide.addText("Environments:", { x: MARGIN, y: 2, w: W, h: 0.3, fontSize: 12, bold: true })
          devopsDeploySlide.addText(envLines.join("\n"), { x: MARGIN, y: 2.35, w: W, h: 2, fontSize: 10 })
        }
      }

      // DevOps Slide: Monitoring
      const monitoring = devops.monitoring as Record<string, unknown> | undefined
      if (monitoring && Object.keys(monitoring).length > 0) {
        const devopsMonSlide = pptx.addSlide()
        devopsMonSlide.addText("DevOps: Monitoring", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })

        const tools = monitoring.tools as string[] || []
        if (tools.length > 0) {
          devopsMonSlide.addText("Tools:", { x: MARGIN, y: 1, w: W, h: 0.3, fontSize: 12, bold: true })
          devopsMonSlide.addText(tools.join(", "), { x: MARGIN, y: 1.35, w: W, h: 0.5, fontSize: 10 })
        }

        const metrics = monitoring.metrics as unknown[] || []
        if (metrics.length > 0) {
          const metricLines = metrics.slice(0, 10).map((m: unknown) => {
            const metric = m as { name?: string; threshold?: string }
            return `• ${metric.name || "Unknown"}${metric.threshold ? ` (threshold: ${metric.threshold})` : ""}`
          })
          devopsMonSlide.addText("Metrics:", { x: MARGIN, y: 2.2, w: W, h: 0.3, fontSize: 12, bold: true })
          devopsMonSlide.addText(metricLines.join("\n"), { x: MARGIN, y: 2.55, w: W, h: 2.5, fontSize: 10 })
        }
      }
    }

    // ==================== UI DESIGN ====================
    if (Object.keys(ui).length > 0) {
      addSectionSlide(pptx, "UI Design", "UI Designer Agent")

      // UI Slide: Design Tokens
      const designTokens = ui.design_tokens as Record<string, unknown> | undefined
      if (designTokens && Object.keys(designTokens).length > 0) {
        const uiTokensSlide = pptx.addSlide()
        uiTokensSlide.addText("UI: Design Tokens", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })

        let yPos = 1
        const colors = designTokens.colors as Record<string, string> | undefined
        if (colors && Object.keys(colors).length > 0) {
          const colorLine = Object.entries(colors).slice(0, 8).map(([k, v]) => `${k}: ${v}`).join("  |  ")
          uiTokensSlide.addText("Colors:", { x: MARGIN, y: yPos, w: W, h: 0.3, fontSize: 12, bold: true })
          uiTokensSlide.addText(truncate(colorLine, 200), { x: MARGIN, y: yPos + 0.35, w: W, h: 0.5, fontSize: 9 })
          yPos += 1
        }

        const spacing = designTokens.spacing as Record<string, string> | undefined
        if (spacing && Object.keys(spacing).length > 0) {
          const spacingLine = Object.entries(spacing).slice(0, 6).map(([k, v]) => `${k}: ${v}`).join("  |  ")
          uiTokensSlide.addText("Spacing:", { x: MARGIN, y: yPos, w: W, h: 0.3, fontSize: 12, bold: true })
          uiTokensSlide.addText(truncate(spacingLine, 200), { x: MARGIN, y: yPos + 0.35, w: W, h: 0.5, fontSize: 9 })
          yPos += 1
        }

        const typography = designTokens.typography as Record<string, unknown> | undefined
        if (typography) {
          const fontFamily = typography.fontFamily as string
          if (fontFamily) {
            uiTokensSlide.addText("Typography:", { x: MARGIN, y: yPos, w: W, h: 0.3, fontSize: 12, bold: true })
            uiTokensSlide.addText(`Font: ${fontFamily}`, { x: MARGIN, y: yPos + 0.35, w: W, h: 0.3, fontSize: 10 })
          }
        }
      }

      // UI Slide: Strategy
      const strategies = [
        { key: "layout_strategy", label: "Layout Strategy" },
        { key: "visual_philosophy", label: "Visual Philosophy" },
        { key: "information_architecture", label: "Information Architecture" },
        { key: "responsive_strategy", label: "Responsive Strategy" },
      ]
      const hasStrategy = strategies.some(s => ui[s.key])
      if (hasStrategy) {
        const uiStrategySlide = pptx.addSlide()
        uiStrategySlide.addText("UI: Strategy", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })
        let yPos = 1
        for (const { key, label } of strategies) {
          const value = ui[key] as string
          if (value) {
            uiStrategySlide.addText(label + ":", { x: MARGIN, y: yPos, w: W, h: 0.3, fontSize: 12, bold: true })
            uiStrategySlide.addText(truncate(value, 200), { x: MARGIN, y: yPos + 0.35, w: W, h: 0.8, fontSize: 10 })
            yPos += 1.3
          }
        }
      }

      // UI Slide: Sitemap (Pages)
      const websiteLayout = ui.website_layout as { pages?: unknown[] } | undefined
      if (websiteLayout?.pages && websiteLayout.pages.length > 0) {
        const uiSitemapSlide = pptx.addSlide()
        uiSitemapSlide.addText("UI: Sitemap", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })

        const pageLines = websiteLayout.pages.slice(0, 12).map((p: unknown) => {
          const page = p as { name?: string; route?: string }
          const routeSuffix = page.route ? " (" + page.route + ")" : ""
          return "• " + (page.name || "Unnamed") + routeSuffix
        })
        uiSitemapSlide.addText(pageLines.join("\n"), { x: MARGIN, y: 1, w: W, h: 4.5, fontSize: 10 })
      }

      // UI Slide: Component Hierarchy
      const componentHierarchy = ui.component_hierarchy as { root?: string; children?: unknown[] } | undefined
      if (componentHierarchy?.root || componentHierarchy?.children?.length) {
        const uiHierarchySlide = pptx.addSlide()
        uiHierarchySlide.addText("UI: Component Hierarchy", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })

        const items = [componentHierarchy.root || "App", ...(componentHierarchy.children || []).map((c: unknown) => (c as { name?: string }).name)].filter(Boolean)
        const itemLines = items.slice(0, 15).map((n) => "• " + n).join("\n")
        uiHierarchySlide.addText(itemLines, { x: MARGIN, y: 1, w: W, h: 4.5, fontSize: 10 })
      }

      // UI Slide: Atomic Structure
      const atomicStructure = ui.atomic_structure as { atoms?: string[]; molecules?: string[]; organisms?: string[] } | undefined
      if (atomicStructure && (atomicStructure.atoms?.length || atomicStructure.molecules?.length || atomicStructure.organisms?.length)) {
        const uiAtomicSlide = pptx.addSlide()
        uiAtomicSlide.addText("UI: Atomic Structure", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })

        let yPos = 1
        if (atomicStructure.atoms?.length) {
          uiAtomicSlide.addText("Atoms:", { x: MARGIN, y: yPos, w: W, h: 0.3, fontSize: 12, bold: true })
          uiAtomicSlide.addText(atomicStructure.atoms.slice(0, 8).join(", "), { x: MARGIN, y: yPos + 0.35, w: W, h: 0.5, fontSize: 9 })
          yPos += 1
        }
        if (atomicStructure.molecules?.length) {
          uiAtomicSlide.addText("Molecules:", { x: MARGIN, y: yPos, w: W, h: 0.3, fontSize: 12, bold: true })
          uiAtomicSlide.addText(atomicStructure.molecules.slice(0, 8).join(", "), { x: MARGIN, y: yPos + 0.35, w: W, h: 0.5, fontSize: 9 })
          yPos += 1
        }
        if (atomicStructure.organisms?.length) {
          uiAtomicSlide.addText("Organisms:", { x: MARGIN, y: yPos, w: W, h: 0.3, fontSize: 12, bold: true })
          uiAtomicSlide.addText(atomicStructure.organisms.slice(0, 8).join(", "), { x: MARGIN, y: yPos + 0.35, w: W, h: 0.5, fontSize: 9 })
        }
      }

      // UI Slide: Component Specs (Blueprint)
      const componentSpecs = ui.component_specs as unknown[] || []
      if (componentSpecs.length > 0) {
        const uiSpecsSlide = pptx.addSlide()
        uiSpecsSlide.addText("UI: Component Blueprint", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })

        const specLines = componentSpecs.slice(0, 12).map((s: unknown) => {
          const spec = s as { name?: string; description?: string }
          const descSuffix = spec.description ? ": " + truncate(spec.description, 60) : ""
          return "• " + (spec.name || "Unnamed") + descSuffix
        })
        uiSpecsSlide.addText(specLines.join("\n"), { x: MARGIN, y: 1, w: W, h: 4.5, fontSize: 10 })
      }

      // UI Slide: Accessibility
      const accessibility = ui.accessibility as Record<string, unknown> | undefined
      if (accessibility && Object.keys(accessibility).length > 0) {
        const uiA11ySlide = pptx.addSlide()
        uiA11ySlide.addText("UI: Accessibility", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })

        let yPos = 1
        const standard = accessibility.standard as string
        if (standard) {
          uiA11ySlide.addText("Standard:", { x: MARGIN, y: yPos, w: W, h: 0.3, fontSize: 12, bold: true })
          uiA11ySlide.addText(standard, { x: MARGIN, y: yPos + 0.35, w: W, h: 0.3, fontSize: 10 })
          yPos += 0.8
        }

        const wcagLevel = accessibility.wcag_level as string
        if (wcagLevel) {
          uiA11ySlide.addText("WCAG Level:", { x: MARGIN, y: yPos, w: W, h: 0.3, fontSize: 12, bold: true })
          uiA11ySlide.addText(wcagLevel, { x: MARGIN, y: yPos + 0.35, w: W, h: 0.3, fontSize: 10 })
          yPos += 0.8
        }

        const checklist = accessibility.checklist as string[] || []
        if (checklist.length > 0) {
          uiA11ySlide.addText("Checklist:", { x: MARGIN, y: yPos, w: W, h: 0.3, fontSize: 12, bold: true })
          uiA11ySlide.addText(bulletLines(checklist, 6).join("\n"), { x: MARGIN, y: yPos + 0.35, w: W, h: 2, fontSize: 9 })
        }
      }
    }

    // ==================== ENGINEER ====================
    if (Object.keys(engineer).length > 0) {
      addSectionSlide(pptx, "Implementation", "Engineer Agent")

      // Engineer Slide: Implementation Plan
      const implPlan = (engineer.implementation_plan as string) || (engineer.plan as string) || (engineer.summary as string) || ""
      if (implPlan) {
        const engPlanSlide = pptx.addSlide()
        engPlanSlide.addText("Engineer: Implementation Plan", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })
        engPlanSlide.addText(truncate(implPlan, 800), { x: MARGIN, y: 1, w: W, h: 4.5, fontSize: 10 })
      }

      // Engineer Slide: Phases
      const phases = (engineer.phases as unknown[]) || (engineer.implementation_plan_phases as unknown[]) || []
      if (phases.length > 0) {
        const engPhasesSlide = pptx.addSlide()
        engPhasesSlide.addText("Engineer: Implementation Phases", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })

        const phaseLines = phases.slice(0, 10).map((p: unknown, idx: number) => {
          const phase = p as { name?: string; description?: string }
          const descSuffix = phase.description ? ": " + truncate(phase.description, 60) : ""
          return (idx + 1) + ". " + (phase.name || "Unnamed") + descSuffix
        })
        engPhasesSlide.addText(phaseLines.join("\n"), { x: MARGIN, y: 1, w: W, h: 4.5, fontSize: 10 })
      }

      // Engineer Slide: Technical Decisions
      const techDecisions = engineer.technical_decisions as unknown[] || []
      if (techDecisions.length > 0) {
        const engDecisionsSlide = pptx.addSlide()
        engDecisionsSlide.addText("Engineer: Technical Decisions", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })

        const decisionLines = techDecisions.slice(0, 10).map((d: unknown) => {
          const dec = d as { decision?: string; rationale?: string }
          const ratSuffix = dec.rationale ? " - " + truncate(dec.rationale, 40) : ""
          return "• " + truncate(dec.decision || "", 80) + ratSuffix
        })
        engDecisionsSlide.addText(decisionLines.join("\n"), { x: MARGIN, y: 1, w: W, h: 4.5, fontSize: 10 })
      }

      // Engineer Slide: Dependencies
      const dependencies = engineer.dependencies as string[] || []
      if (dependencies.length > 0) {
        const engDepsSlide = pptx.addSlide()
        engDepsSlide.addText("Engineer: Dependencies", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })
        engDepsSlide.addText(bulletLines(dependencies, 15).join("\n"), { x: MARGIN, y: 1, w: W, h: 4.5, fontSize: 10 })
      }

      // Engineer Slide: File Structure
      const fileStructure = engineer.file_structure as Record<string, unknown> | undefined
      if (fileStructure && Object.keys(fileStructure).length > 0) {
        const engStructSlide = pptx.addSlide()
        engStructSlide.addText("Engineer: File Structure", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })

        const rootName = fileStructure.name as string || "Project"
        engStructSlide.addText("Root: " + rootName, { x: MARGIN, y: 1, w: W, h: 0.3, fontSize: 12, bold: true })

        const children = fileStructure.children as unknown[] || []
        if (children.length > 0) {
          const childLines = children.slice(0, 15).map((c: unknown) => {
            const child = c as { name?: string; type?: string }
            const typeSuffix = child.type ? " (" + child.type + ")" : ""
            return "• " + (child.name || "Unnamed") + typeSuffix
          })
          engStructSlide.addText(childLines.join("\n"), { x: MARGIN, y: 1.5, w: W, h: 4, fontSize: 10 })
        }
      }

      // Engineer Slide: Environment Variables
      const envVars = engineer.environment_variables as unknown[] || []
      if (envVars.length > 0) {
        const engEnvSlide = pptx.addSlide()
        engEnvSlide.addText("Engineer: Environment Variables", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })

        const envLines = envVars.slice(0, 12).map((e: unknown) => {
          const env = e as { name?: string; description?: string }
          const descSuffix = env.description ? ": " + truncate(env.description, 60) : ""
          return "• " + (env.name || "Unnamed") + descSuffix
        })
        engEnvSlide.addText(envLines.join("\n"), { x: MARGIN, y: 1, w: W, h: 4.5, fontSize: 10 })
      }
    }

    // ==================== QA ====================
    if (Object.keys(qa).length > 0) {
      addSectionSlide(pptx, "Quality Assurance", "QA Agent")

      // QA Slide: Test Strategy
      const testStrategy = qa.test_strategy as Record<string, unknown> | undefined
      if (testStrategy && Object.keys(testStrategy).length > 0) {
        const qaStrategySlide = pptx.addSlide()
        qaStrategySlide.addText("QA: Test Strategy", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })

        let yPos = 1
        const approach = testStrategy.approach as string
        if (approach) {
          qaStrategySlide.addText("Approach:", { x: MARGIN, y: yPos, w: W, h: 0.3, fontSize: 12, bold: true })
          qaStrategySlide.addText(truncate(approach, 300), { x: MARGIN, y: yPos + 0.35, w: W, h: 1, fontSize: 10 })
          yPos += 1.5
        }

        const types = testStrategy.types as string[] || []
        if (types.length > 0) {
          qaStrategySlide.addText("Test Types:", { x: MARGIN, y: yPos, w: W, h: 0.3, fontSize: 12, bold: true })
          qaStrategySlide.addText(types.join(", "), { x: MARGIN, y: yPos + 0.35, w: W, h: 0.5, fontSize: 10 })
          yPos += 1
        }

        const tools = testStrategy.tools as string[] || []
        if (tools.length > 0) {
          qaStrategySlide.addText("Tools:", { x: MARGIN, y: yPos, w: W, h: 0.3, fontSize: 12, bold: true })
          qaStrategySlide.addText(tools.join(", "), { x: MARGIN, y: yPos + 0.35, w: W, h: 0.5, fontSize: 10 })
        }
      }

      // QA Slide: Test Cases
      const testCases = qa.test_cases as unknown[] || []
      if (testCases.length > 0) {
        const qaCasesSlide = pptx.addSlide()
        qaCasesSlide.addText("QA: Test Cases", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })

        const caseLines = testCases.slice(0, 12).map((tc: unknown) => {
          const testCase = tc as { id?: string; name?: string; priority?: string }
          const prioSuffix = testCase.priority ? " [" + testCase.priority.toUpperCase() + "]" : ""
          return "• " + (testCase.id || "TC") + ": " + truncate(testCase.name || "", 70) + prioSuffix
        })
        qaCasesSlide.addText(caseLines.join("\n"), { x: MARGIN, y: 1, w: W, h: 4.5, fontSize: 10 })
      }

      // QA Slide: Security Plan
      const securityPlan = qa.security_plan as Record<string, unknown> | undefined
      if (securityPlan && Object.keys(securityPlan).length > 0) {
        const qaSecSlide = pptx.addSlide()
        qaSecSlide.addText("QA: Security Plan", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })

        const authSteps = securityPlan.auth_verification_steps as string[] || []
        if (authSteps.length > 0) {
          qaSecSlide.addText("Auth Verification:", { x: MARGIN, y: 1, w: W, h: 0.3, fontSize: 12, bold: true })
          qaSecSlide.addText(bulletLines(authSteps, 6).join("\n"), { x: MARGIN, y: 1.35, w: W, h: 2, fontSize: 10 })
        }

        const vulnStrategy = securityPlan.vulnerability_scan_strategy as string
        if (vulnStrategy) {
          qaSecSlide.addText("Vulnerability Scan:", { x: MARGIN, y: 3.5, w: W, h: 0.3, fontSize: 12, bold: true })
          qaSecSlide.addText(truncate(vulnStrategy, 200), { x: MARGIN, y: 3.85, w: W, h: 1, fontSize: 10 })
        }
      }

      // QA Slide: Risk Analysis
      const riskAnalysis = qa.risk_analysis as unknown[] || []
      if (riskAnalysis.length > 0) {
        const qaRiskSlide = pptx.addSlide()
        qaRiskSlide.addText("QA: Risk Analysis", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })

        const riskLines = riskAnalysis.slice(0, 12).map((r: unknown) => {
          const risk = r as { risk?: string; impact?: string; mitigation?: string }
          return "• " + truncate(risk.risk || "", 60) + " [Impact: " + (risk.impact || "Unknown") + "]"
        })
        qaRiskSlide.addText(riskLines.join("\n"), { x: MARGIN, y: 1, w: W, h: 4.5, fontSize: 10 })
      }

      // QA Slide: Accessibility Plan
      const accessibilityPlan = qa.accessibility_plan as Record<string, unknown> | undefined
      if (accessibilityPlan && Object.keys(accessibilityPlan).length > 0) {
        const qaA11ySlide = pptx.addSlide()
        qaA11ySlide.addText("QA: Accessibility Plan", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })

        let yPos = 1
        const standard = accessibilityPlan.standard as string
        if (standard) {
          qaA11ySlide.addText("Standard:", { x: MARGIN, y: yPos, w: W, h: 0.3, fontSize: 12, bold: true })
          qaA11ySlide.addText(standard, { x: MARGIN, y: yPos + 0.35, w: W, h: 0.3, fontSize: 10 })
          yPos += 0.8
        }

        const automatedTools = accessibilityPlan.automated_tools as string[] || []
        if (automatedTools.length > 0) {
          qaA11ySlide.addText("Automated Tools:", { x: MARGIN, y: yPos, w: W, h: 0.3, fontSize: 12, bold: true })
          qaA11ySlide.addText(automatedTools.join(", "), { x: MARGIN, y: yPos + 0.35, w: W, h: 0.5, fontSize: 10 })
          yPos += 1
        }

        const manualChecks = accessibilityPlan.manual_checks as string[] || []
        if (manualChecks.length > 0) {
          qaA11ySlide.addText("Manual Checks:", { x: MARGIN, y: yPos, w: W, h: 0.3, fontSize: 12, bold: true })
          qaA11ySlide.addText(bulletLines(manualChecks, 6).join("\n"), { x: MARGIN, y: yPos + 0.35, w: W, h: 2, fontSize: 10 })
        }
      }

      // QA Slide: Performance Metrics
      const performanceMetrics = qa.performance_metrics as Record<string, string> | undefined
      if (performanceMetrics && Object.keys(performanceMetrics).length > 0) {
        const qaPerfSlide = pptx.addSlide()
        qaPerfSlide.addText("QA: Performance Metrics", { x: MARGIN, y: 0.3, w: W, h: 0.5, fontSize: SLIDE_TITLE_FONT, bold: true })

        const metricLines = Object.entries(performanceMetrics).slice(0, 10).map(([key, value]) => {
          return "• " + key.replace(/_/g, " ") + ": " + value
        })
        qaPerfSlide.addText(metricLines.join("\n"), { x: MARGIN, y: 1, w: W, h: 4.5, fontSize: 10 })
      }
    }

    const buffer = await pptx.write({ outputType: "nodebuffer" }) as Buffer
    return buffer
  }
}

