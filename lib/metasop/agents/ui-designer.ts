import type { AgentContext, MetaSOPArtifact } from "../types";
import type { UIDesignerBackendArtifact } from "../artifacts/ui-designer/types";
import { uiDesignerSchema as uiSchema } from "../artifacts/ui-designer/schema";
import { generateStructuredWithLLM } from "../utils/llm-helper";
import { logger } from "../utils/logger";
import { buildRefinementPrompt, shouldUseRefinement } from "../utils/refinement-helper";

/**
 * UI Designer Agent
 * Generates UI component hierarchy and design tokens
 */
export async function uiDesignerAgent(context: AgentContext): Promise<MetaSOPArtifact> {
  const { user_request } = context;

  logger.info("UI Designer agent starting", { user_request: user_request.substring(0, 100) });

  try {
    let uiPrompt: string;

    if (shouldUseRefinement(context)) {
      logger.info("UI Designer agent in REFINEMENT mode");
      const guidelines = `
1. **Component Specs**: Add new components or enhance existing ones
2. **Design Tokens**: Update colors, typography, or spacing
3. **Accessibility**: Enhance WCAG compliance or screen reader support
4. **Responsive Design**: Update breakpoints or layout strategies`;
      uiPrompt = buildRefinementPrompt(context, "UI Designer", guidelines);
    } else {
      const hasCache = !!context.cacheId;

      uiPrompt = hasCache
        ? `As a Principal UI/UX Designer, refine the design system and component hierarchy. Focus on the core 'Patient Portal' and 'Vitals Monitoring' modules.

CRITICAL GOALS:
1. **Essential Atomic Design**: Define core Atoms (Buttons, Info Cards) and Organisms (Consultation View, Vital Dashboard).
2. **Design Token Mastery**: Develop an elite design system (Primary #2A66FF, Surface-Dark #0F172A, Typography: Outfit/Inter).
3. **WCAG Accessibility**: Target **WCAG 2.1 AA**.
4. **Focused A2UI Manifest**: Provide a high-fidelity visual manifest for the **Vital Signs Dashboard** ONLY.

Keep the response concise and focused on high-impact components to ensure systemic clarity.`
        : `As a Principal UI/UX Designer, create a premium design system and UI architecture for 'HealthTrack'.

User Request: ${user_request}

CRITICAL GOALS:
1. **Design System Baseline**: Establish Colors, Typography, Spacing, and Shadows.
2. **Core Atomic Hierarchy**: Map essential components to Atoms, Molecules, and Organisms.
3. **Primary Screen Manifest**: Generate an **A2UI Manifest** for the **Real-Time Patient Consultation Portal**.
4. **Accessibility Strategy**: Define standards, guidelines, and a verification checklist (WCAG 2.1 AA).
5. **Executive Summary**: Provide a high-level summary and detailed description of the design language and UX strategy.

Focus on creating a definitive design language. Quality and precision are prioritized over exhaustive component counts.

RESPOND WITH ONLY THE JSON OBJECT - NO PREAMBLE OR EXPLANATION.`;
    }

    let llmUIDesign: any = null;

    try {
      llmUIDesign = await generateStructuredWithLLM<any>(
        uiPrompt,
        uiSchema,
        { reasoning: true, temperature: 0.7, cacheId: context.cacheId, role: "UI Designer" }
      );
    } catch (error: any) {
      logger.error("UI Designer agent LLM call failed", { error: error.message });
      throw error;
    }

    if (!llmUIDesign) {
      throw new Error("UI Designer agent failed: No structured data received from LLM");
    }

    const content: UIDesignerBackendArtifact = {
      summary: llmUIDesign.summary,
      description: llmUIDesign.description,
      schema_version: "0.8",
      a2ui_manifest: llmUIDesign.a2ui_manifest,
      component_hierarchy: llmUIDesign.component_hierarchy,
      design_tokens: llmUIDesign.design_tokens,
      ui_patterns: llmUIDesign.ui_patterns,
      component_specs: llmUIDesign.component_specs,
      layout_breakpoints: llmUIDesign.layout_breakpoints,
      accessibility: llmUIDesign.accessibility,
      atomic_structure: llmUIDesign.atomic_structure
    };

    if (content.component_hierarchy) {
      if (typeof content.component_hierarchy.root !== "string") {
        content.component_hierarchy.root = "App";
      } else if (content.component_hierarchy.root.length === 0) {
        content.component_hierarchy.root = "App";
      }
      if (!Array.isArray((content.component_hierarchy as any).children)) {
        (content.component_hierarchy as any).children = [];
      }
    }

    // Validation check
    if (!content.component_hierarchy || !content.design_tokens) {
      throw new Error("UI Designer agent failed: Component hierarchy or design tokens are missing");
    }

    logger.info("UI Designer agent completed");

    return {
      step_id: "ui_design",
      role: "UI Designer",
      content,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error("UI Designer agent failed", { error: error.message });
    throw error;
  }
}
