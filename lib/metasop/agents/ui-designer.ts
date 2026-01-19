import type { AgentContext, MetaSOPArtifact, MetaSOPEvent } from "../types";
import type { UIDesignerBackendArtifact } from "../artifacts/ui-designer/types";
import { uiDesignerSchema as uiSchema } from "../artifacts/ui-designer/schema";
import { generateStreamingStructuredWithLLM } from "../utils/llm-helper";
import { logger } from "../utils/logger";
import { shouldUseRefinement, refineWithAtomicActions } from "../utils/refinement-helper";

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
    let content: UIDesignerBackendArtifact;

    if (shouldUseRefinement(context)) {
      logger.info("UI Designer agent in ATOMIC REFINEMENT mode");
      content = await refineWithAtomicActions<UIDesignerBackendArtifact>(
        context,
        "UI Designer",
        uiSchema,
        { 
          cacheId: context.cacheId,
          temperature: 0.2 
        }
      );
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

      const uiPrompt = `As a Principal UI/UX Designer, create a high-impact design system and UI architecture for '${user_request}'.

ADAPTIVE DEPTH GUIDELINE:
- For **simple web apps/utilities**: Prioritize a clean, minimal design system and straightforward component hierarchy.
- For **complex/enterprise systems**: Provide exhaustive design tokens and deep atomic hierarchy.

${projectContext}
${techContext}

MISSION OBJECTIVES:
1. **Design Language**: Establish Design Tokens (Colors, Spacing, Typography) as defined in the schema.
2. **Atomic Structure**: Map application real estate: Atoms, Molecules, Organisms.
3. **Primary Feature Manifest**: Generate an **A2UI Manifest** (v0.8) for critical workflows.
4. **Accessibility**: Design for inclusivity (WCAG 2.1) including ARIA and keyboard navigation.
5. **Component Blueprint**: Detail key components with technical specs: Props, Variants, States.
6. **Information Architecture**: Define website layout structure (pages, routes, layout sections).
7. **Visual Design Philosophy**: Define core aesthetic principles and brand alignment.

Respond with ONLY the structured JSON object.`;

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
            reasoning: context.options?.reasoning ?? false,
            temperature: 0.2, // Lowered for precision and strict schema compliance
            cacheId: context.cacheId,
            role: "UI Designer",
          }
        );
      } catch (error: any) {
        logger.error("UI Designer agent LLM call failed", { error: error.message });
        throw error;
      }

      if (!llmUIDesign) {
        throw new Error("UI Designer agent failed: No structured data received from LLM");
      }

      content = {
        summary: llmUIDesign.summary,
        description: llmUIDesign.description,
        schema_version: "0.8",
        design_tokens: llmUIDesign.design_tokens,
        atomic_structure: llmUIDesign.atomic_structure,
        primary_feature_manifest: llmUIDesign.primary_feature_manifest,
        accessibility: llmUIDesign.accessibility,
        component_blueprint: llmUIDesign.component_blueprint,
        layout_strategy: llmUIDesign.layout_strategy,
        visual_philosophy: llmUIDesign.visual_philosophy,
        information_architecture: llmUIDesign.information_architecture,
        responsive_strategy: llmUIDesign.responsive_strategy,
        ui_patterns: llmUIDesign.ui_patterns,
        component_hierarchy: llmUIDesign.component_hierarchy,
        website_layout: llmUIDesign.website_layout,
        component_specs: llmUIDesign.component_specs,
        layout_breakpoints: llmUIDesign.layout_breakpoints
      };
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
