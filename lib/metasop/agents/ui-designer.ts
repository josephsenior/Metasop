import type { AgentContext, MetaSOPArtifact, MetaSOPEvent } from "../types";
import type { UIDesignerBackendArtifact } from "../artifacts/ui-designer/types";
import { uiDesignerSchema as uiSchema } from "../artifacts/ui-designer/schema";
import { generateStreamingStructuredWithLLM } from "../utils/llm-helper";
import { logger } from "../utils/logger";
import { buildRefinementPrompt, shouldUseRefinement } from "../utils/refinement-helper";

/**
 * UI Designer Agent
 * Generates UI component hierarchy and design tokens
 */
export async function uiDesignerAgent(
  context: AgentContext,
  onProgress?: (event: Partial<MetaSOPEvent>) => void
): Promise<MetaSOPArtifact> {
  const { user_request } = context;

  logger.info("UI Designer agent starting", { user_request: user_request.substring(0, 100) });

  try {
    let uiPrompt: string;

    if (shouldUseRefinement(context)) {
      logger.info("UI Designer agent in REFINEMENT mode");
      const previousUIContent = context.previous_artifacts?.ui_design?.content as UIDesignerBackendArtifact | undefined;
      const guidelines = `
1. **Component Specs**: Add new components or enhance existing ones
2. **Design Tokens**: Update colors (surface, primary, accent), typography (headingFont), or spacing
3. **Accessibility**: Enhance WCAG compliance (${previousUIContent?.accessibility?.wcag_level || 'AA'}) or screen reader support
4. **Atomic Design**: Elaborate on Atoms, Molecules, and Organisms
5. **Blueprint**: Provide detailed component specs with variants and states`;
      uiPrompt = buildRefinementPrompt(context, "UI Designer", guidelines);
    } else {
      const pmArtifact = context.previous_artifacts?.pm_spec?.content as any;
      const archArtifact = context.previous_artifacts?.arch_design?.content as any;

      const projectContext = pmArtifact
        ? `Project Goals: ${pmArtifact.summary}
Core User Stories: ${pmArtifact.user_stories?.slice(0, 3).map((s: any) => s.title).join(", ")}`
        : `User Request: ${user_request}`;

      const techContext = archArtifact
        ? `Tech Stack: ${Object.values(archArtifact.technology_stack || {}).flat().slice(0, 5).join(", ")}
Key APIs: ${archArtifact.apis?.slice(0, 3).map((a: any) => a.path).join(", ")}`
        : "";

      uiPrompt = `As a Principal UI/UX Designer, create a high-impact design system and UI architecture.

${projectContext}
${techContext}

MISSION OBJECTIVES:
1. **Definitve Design Language**: Establish elite Design Tokens. Include Colors, Spacing, Typography, and Border Radii.
2. **Atomic Structure**: Map the core screen real estate into atoms, molecules, and organisms (names only).
3. **Primary Feature Manifest**: Generate a high-fidelity **A2UI Manifest** (v0.8) for the most critical user workflow.
4. **WCAG AA+ Accessibility**: Design for inclusivity. Map out ARIA strategies, keyboard navigation, and focus indicators.
5. **Component Blueprint**: Detail at least 5 key components with their required Props, Variants, and States. Focus on technical specs over long descriptions.
6. **Responsive Strategy**: Define layout breakpoints (sm, md, lg, xl) and how the system adapts across devices.
7. **UI Patterns**: List the fundamental patterns used (e.g., Infinite Scroll, Skeleton Loading, Multi-step Form).
8. **Executive Summary**: Provide a high-level summary and detailed description of the visual strategy.

Important Guidelines:
- Focus on architectural clarity and visual consistency.
- Keep all textual fields professional and extremely concise (max 100 characters).
- Avoid repetitive phrasing and ensure every field provides unique value.

RESPOND WITH ONLY THE JSON OBJECT - NO PREAMBLE OR EXPLANATION.`;
    }

    let llmUIDesign: any = null;

    try {
      llmUIDesign = await generateStreamingStructuredWithLLM<any>(
        uiPrompt,
        uiSchema,
        (partialEvent) => {
          if (onProgress) {
            onProgress(partialEvent);
          }
        },
        {
          reasoning: true,
          temperature: 0.3,
          cacheId: context.cacheId,
          role: "UI Designer",
          maxTokens: 32000
        }
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
