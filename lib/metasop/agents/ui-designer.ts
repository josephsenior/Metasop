import type { AgentContext, MetaSOPArtifact, MetaSOPEvent } from "../types";
import type { UIDesignerBackendArtifact } from "../artifacts/ui-designer/types";
import { uiDesignerSchema as uiSchema } from "../artifacts/ui-designer/schema";
import { generateStreamingStructuredWithLLM } from "../utils/llm-helper";
import { logger } from "../utils/logger";
import { shouldUseRefinement, refineWithAtomicActions } from "../utils/refinement-helper";
import { FEW_SHOT_EXAMPLES, getDomainContext, getQualityCheckPrompt } from "../utils/prompt-standards";
import { getAgentTemperature } from "../config";

/**
 * Sanitizes a color value to ensure it's a valid hex code.
 * Extracts the first valid hex code from malformed strings.
 */
function sanitizeColorValue(colorValue: string | undefined): string {
  if (!colorValue || typeof colorValue !== "string") {
    return colorValue || "";
  }

  // If already valid hex code, return it
  const hexPattern = /^#[0-9A-Fa-f]{6}$/;
  if (hexPattern.test(colorValue)) {
    return colorValue;
  }

  // Try to extract a valid hex code from the string
  const hexMatch = colorValue.match(/#[0-9A-Fa-f]{6}/i);
  if (hexMatch) {
    return hexMatch[0].toUpperCase();
  }

  // Return original value if no valid hex found
  return colorValue;
}

/**
 * Sanitizes all color values in design_tokens.colors
 */
function sanitizeDesignTokensColors(colors: any): any {
  if (!colors || typeof colors !== "object") {
    return colors;
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(colors)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeColorValue(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

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
          temperature: getAgentTemperature("ui_design")
        }
      );
      
      // Sanitize color values after refinement
      if (content?.design_tokens?.colors) {
        content.design_tokens.colors = sanitizeDesignTokensColors(content.design_tokens.colors);
      }
    } else {
      const pmArtifact = context.previous_artifacts?.pm_spec?.content as any;
      const archArtifact = context.previous_artifacts?.arch_design?.content as any;
      const projectTitle = pmArtifact?.summary?.substring(0, 50) || "Project";

      const domainContext = getDomainContext(user_request);
      const qualityCheck = getQualityCheckPrompt("ui");

      const projectContext = pmArtifact
        ? `
Project Context:
- Summary: ${pmArtifact.summary}
- Key User Stories: ${pmArtifact.user_stories?.slice(0, 4).map((s: any) => s.title).join(", ") || "N/A"}
- Target Users: ${pmArtifact.stakeholders?.find((s: any) => s.role?.toLowerCase().includes("user"))?.interest || "End users"}`
        : `User Request: ${user_request}`;

      const techContext = archArtifact
        ? `
Technical Context:
- Frontend Stack: ${archArtifact.technology_stack?.frontend?.join(", ") || "React/Next.js"}
- Key APIs: ${archArtifact.apis?.slice(0, 4).map((a: any) => a.path).join(", ") || "N/A"}
- Database Entities: ${archArtifact.database_schema?.tables?.slice(0, 5).map((t: any) => t.name).join(", ") || "N/A"}`
        : "";

      const uiPrompt = `You are a Principal UI/UX Designer with 12+ years of experience in design systems, accessibility, and modern web interfaces. Create a comprehensive design system and UI architecture for:

"${projectTitle}"

${projectContext}
${techContext}
${domainContext ? `\n${domainContext}\n` : ""}

=== CRITICAL OUTPUT CONSTRAINTS ===
1. **BE CONCISE**: Generate only what's necessary. Avoid exhaustive lists.
2. **component_specs**: Maximum 10-15 components. Focus on unique, essential components only.
3. **website_layout.pages**: Maximum 5-8 pages. One entry per distinct page.
4. **ui_patterns**: Maximum 8-10 patterns.
5. **DO NOT REPEAT**: Each component/page/pattern should be unique. Never duplicate entries.
6. **STOP WHEN DONE**: After covering the essentials, stop. Don't keep adding more.

=== COLOR FORMAT - CRITICAL ===
**ALL color values MUST be exactly 7 characters: a '#' followed by 6 hex digits (0-9, A-F).**
- ✅ CORRECT: "#4F46E5", "#0EA5E9", "#F59E0B", "#D97706"
- ❌ WRONG: "#F59E0B_INVALID_HEX", "#D97706_IS_VALID_HEX", any text after hex code
- **DO NOT** include reasoning, validation, or any text in color fields
- **DO NOT** repeat hex codes or add explanations
- Output ONLY the hex code itself (e.g., "#D97706" - nothing else)

=== ADAPTIVE DEPTH GUIDELINE ===
- **Simple apps (MVP, utilities)**: Minimal design tokens, 10-15 components, focus on usability
- **Medium apps (SaaS, dashboards)**: Full design system, 20-30 components, responsive patterns
- **Complex apps (enterprise)**: Exhaustive tokens, 40+ components, theming support, advanced patterns

=== MISSION OBJECTIVES ===

1. **Design Tokens (Foundation)**
   - **Colors**: Define semantic color system
     * Primary: Main brand color + variants (50-900 scale)
     * Secondary: Accent color for highlights
     * Neutral: Gray scale for text, backgrounds, borders
     * Semantic: Success (green), Warning (amber), Error (red), Info (blue)
     * Surface: Background, card, input, overlay colors
   - **Typography**: Font family, sizes, weights, line heights
     * Font families: Sans (UI), Mono (code), Serif (optional)
     * Scale: xs (12px), sm (14px), base (16px), lg (18px), xl (20px), 2xl (24px), 3xl (30px), 4xl (36px)
     * Weights: normal (400), medium (500), semibold (600), bold (700)
   - **Spacing**: Consistent spacing scale (4px base)
     * Scale: 0, 1 (4px), 2 (8px), 3 (12px), 4 (16px), 5 (20px), 6 (24px), 8 (32px), 10 (40px), 12 (48px)
   - **Shadows**: Elevation system (sm, md, lg, xl)
   - **Border Radius**: none (0), sm (2px), md (4px), lg (8px), xl (12px), full (9999px)

2. **Atomic Design Hierarchy**
   - **Atoms**: Basic building blocks
     * Button, Input, Label, Icon, Avatar, Badge, Checkbox, Radio, Switch, Spinner
   - **Molecules**: Combinations of atoms
     * Form Field (Label + Input + Error), Search Bar, Card Header, Nav Item, Dropdown
   - **Organisms**: Complex, reusable sections
     * Navigation (Header, Sidebar, Footer), Card, Modal, Table, Form, Dashboard Widget
   - **Templates**: Page-level layouts
     * Auth Layout, Dashboard Layout, Marketing Layout, Settings Layout
   - **Pages**: Specific implementations
     * Login, Dashboard, Profile, Settings, etc.

3. **Component Specifications**
   - For each key component, define:
     * Props with types and defaults
     * Variants (primary, secondary, ghost, destructive)
     * Sizes (sm, md, lg)
     * States (default, hover, active, focus, disabled, loading)
     * Accessibility requirements (ARIA attributes, keyboard behavior)

4. **Accessibility (WCAG 2.1 AA Compliance)**
   - Color contrast: Minimum 4.5:1 for normal text, 3:1 for large text
   - Focus indicators: Visible focus rings on all interactive elements
   - Keyboard navigation: All functionality accessible via keyboard
   - ARIA: Proper roles, labels, and live regions
   - Screen reader: Semantic HTML, skip links, alternative text
   - Motion: Respect prefers-reduced-motion

5. **Responsive Strategy**
   - Breakpoints:
     * sm: 640px (mobile landscape)
     * md: 768px (tablet)
     * lg: 1024px (laptop)
     * xl: 1280px (desktop)
     * 2xl: 1536px (large desktop)
   - Mobile-first approach
   - Touch-friendly targets (min 44x44px)
   - Container widths and padding per breakpoint

6. **Layout & Information Architecture**
   - Define page structure and navigation hierarchy
   - Map user flows to page layouts
   - Specify header, sidebar, content, footer patterns
   - Define grid system (12-column)

7. **Visual Philosophy & Brand**
   - Define design principles (clean, modern, accessible, etc.)
   - Establish visual hierarchy rules
   - Animation and transition guidelines (duration, easing)
   - Iconography style and library (Lucide, Heroicons, etc.)

8. **UI Patterns Library**
   - Loading states: Skeletons, spinners, progress bars
   - Empty states: Illustrations, call-to-action
   - Error states: Inline errors, toast notifications, error pages
   - Success states: Confirmation messages, celebrations
   - Data display: Tables, lists, cards, charts

=== EXAMPLE COMPONENT SPEC (Follow this depth) ===
${FEW_SHOT_EXAMPLES.component}

${qualityCheck}

=== FINAL REMINDER ===
- Keep component_specs to 10-15 unique components max
- Keep website_layout.pages to 5-8 pages max  
- Keep ui_patterns to 8-10 items max
- BE CONCISE. Quality over quantity.

Respond with ONLY the structured JSON object matching the schema. No explanations or markdown.`;

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
            temperature: getAgentTemperature("ui_design"),
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

      // Sanitize color values to prevent malformed hex codes
      if (llmUIDesign.design_tokens?.colors) {
        llmUIDesign.design_tokens.colors = sanitizeDesignTokensColors(llmUIDesign.design_tokens.colors);
      }

      content = {
        summary: llmUIDesign.summary,
        description: llmUIDesign.description,
        schema_version: "0.8",
        design_tokens: llmUIDesign.design_tokens,
        atomic_structure: llmUIDesign.atomic_structure,
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
