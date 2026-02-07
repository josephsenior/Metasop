import type { AgentContext, MetaSOPArtifact, MetaSOPEvent } from "../types";
import type { UIDesignerBackendArtifact } from "../artifacts/ui-designer/types";
import { uiDesignerSchema as uiSchema } from "../artifacts/ui-designer/schema";
import { generateStreamingStructuredWithLLM } from "../utils/llm-helper";
import { logger } from "../utils/logger";
import { FEW_SHOT_EXAMPLES, getDomainContext, getQualityCheckPrompt } from "../utils/prompt-standards";
import { getAgentTemperature, getAgentMaxTokens } from "../config";

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

function ensureDesignTokensColors(designTokens: any): void {
  if (!designTokens || typeof designTokens !== "object") return;

  const defaults: Record<string, string> = {
    primary: "#4F46E5",
    primary_foreground: "#FFFFFF",
    secondary: "#64748B",
    secondary_foreground: "#FFFFFF",
    background: "#0F172A",
    foreground: "#E2E8F0",
    text: "#E2E8F0",
    muted: "#1E293B",
    muted_foreground: "#94A3B8",
    card: "#111827",
    card_foreground: "#E5E7EB",
    popover: "#111827",
    popover_foreground: "#E5E7EB",
    border: "#334155",
    input: "#334155",
    ring: "#4F46E5",
    accent: "#22D3EE",
    accent_foreground: "#0F172A",
    destructive: "#EF4444",
    destructive_foreground: "#FFFFFF",
  };

  if (!designTokens.colors || typeof designTokens.colors !== "object" || Array.isArray(designTokens.colors)) {
    designTokens.colors = {};
  }

  const colors = designTokens.colors as Record<string, string>;
  for (const [key, fallback] of Object.entries(defaults)) {
    const current = colors[key];
    const sanitized = sanitizeColorValue(typeof current === "string" ? current : undefined);
    colors[key] = /^#[0-9A-Fa-f]{6}$/.test(sanitized) ? sanitized : fallback;
  }
}

const CSS_VALUE_PATTERN = /^[0-9.]*(rem|px|em|%)?$/;
const FONT_WEIGHT_PATTERN = /^[0-9]+$/;

/**
 * Sanitizes a spacing/typography CSS-like value. Strips instruction text (INVALID, FIX, REQUIRED, etc.) and returns only the value.
 */
function sanitizeCssLikeValue(value: string | undefined, fallback: string): string {
  if (value == null || typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (CSS_VALUE_PATTERN.test(trimmed)) return trimmed;
  const match = trimmed.match(/^([0-9.]*(?:rem|px|em|%)?)/);
  if (match?.[1]) return match[1];
  if (/INVALID|FIX|REQUIRED|FIXED_BELOW/i.test(trimmed)) return fallback;
  return trimmed.length <= 10 ? trimmed : fallback;
}

/**
 * Sanitizes a font weight value (digits only).
 */
function sanitizeFontWeightValue(value: string | undefined, fallback: string): string {
  if (value == null || typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (FONT_WEIGHT_PATTERN.test(trimmed)) return trimmed;
  const match = trimmed.match(/^([0-9]+)/);
  return match?.[1] ?? fallback;
}

/**
 * Sanitizes design_tokens.spacing, typography.fontSize, typography.fontWeight, and borderRadius so values contain only raw CSS (no INVALID/FIX/REQUIRED text).
 */
function sanitizeDesignTokensSpacingAndTypography(designTokens: any): void {
  if (!designTokens || typeof designTokens !== "object") return;

  const spacingDefaults: Record<string, string> = { xs: "0.25rem", sm: "0.5rem", md: "0.75rem", lg: "1rem", xl: "1.25rem", "2xl": "1.5rem" };
  if (designTokens.spacing && typeof designTokens.spacing === "object") {
    for (const [key, value] of Object.entries(designTokens.spacing)) {
      if (typeof value === "string") {
        designTokens.spacing[key] = sanitizeCssLikeValue(value, spacingDefaults[key as keyof typeof spacingDefaults] ?? "0.5rem");
      }
    }
  }

  if (designTokens.typography?.fontSize && typeof designTokens.typography.fontSize === "object") {
    const fontSizeDefaults: Record<string, string> = { xs: "0.75rem", sm: "0.875rem", base: "1rem", lg: "1.125rem", xl: "1.25rem", "2xl": "1.5rem" };
    for (const [key, value] of Object.entries(designTokens.typography.fontSize)) {
      if (typeof value === "string") {
        designTokens.typography.fontSize[key] = sanitizeCssLikeValue(value, fontSizeDefaults[key as keyof typeof fontSizeDefaults] ?? "1rem");
      }
    }
  }

  if (designTokens.typography?.fontWeight && typeof designTokens.typography.fontWeight === "object") {
    const weightDefaults: Record<string, string> = { light: "300", normal: "400", medium: "500", semibold: "600", bold: "700" };
    for (const [key, value] of Object.entries(designTokens.typography.fontWeight)) {
      if (typeof value === "string") {
        designTokens.typography.fontWeight[key] = sanitizeFontWeightValue(value, weightDefaults[key as keyof typeof weightDefaults] ?? "400");
      }
    }
  }

  if (designTokens.borderRadius && typeof designTokens.borderRadius === "object") {
    const radiusDefaults: Record<string, string> = { none: "0", sm: "0.125rem", md: "0.25rem", lg: "0.5rem", full: "9999px" };
    for (const [key, value] of Object.entries(designTokens.borderRadius)) {
      if (typeof value === "string") {
        designTokens.borderRadius[key] = sanitizeCssLikeValue(value, radiusDefaults[key as keyof typeof radiusDefaults] ?? "0.25rem");
      }
    }
  }
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

    const uiPrompt = `You are a Principal UI/UX Designer with 12+ years of experience in design systems, accessibility, and modern web interfaces. Create a design system and UI architecture for:

"${projectTitle}"

${projectContext}
${techContext}
${domainContext ? `\n${domainContext}\n` : ""}

=== OUTPUT RULES (follow exactly) ===
- **Output order** (so required fields survive truncation): Put summary, description, design_tokens, then component_hierarchy, then the rest. Within design_tokens always include colors, spacing, and typography (typography is required).
- **design_tokens.colors**: Required keys primary, secondary, background, text. Values exactly 7 chars: # plus 6 hex digits (e.g. "#4F46E5"). No extra text.
- **design_tokens.spacing**: Required. Use CSS values only, e.g. "xs": "0.25rem", "sm": "0.5rem", "md": "0.75rem", "lg": "1rem", "xl": "1.25rem", "2xl": "1.5rem".
- **design_tokens.typography**: Required. Include fontFamily (e.g. "Inter") and fontSize (e.g. "xs": "0.75rem", "sm": "0.875rem", "base": "1rem", "lg": "1.125rem"). Optionally fontWeight ("light": "300", "normal": "400", "medium": "500", "semibold": "600", "bold": "700"). CSS values only.
- **Other required top-level keys**: component_hierarchy, ui_patterns, component_specs, layout_breakpoints, accessibility, atomic_structure, website_layout. Keep each section short; one item per component/pattern.
- **Response**: Output only the JSON object. No markdown, no explanations.

=== MISSION ===
1. **Design tokens**: Colors (primary, secondary, background, text + semantic/surface as needed), typography (fontSize, fontWeight), spacing, borderRadius. Keep values to the format above.
2. **Atomic hierarchy**: Atoms (Button, Input, Label, Icon, etc.), molecules (Form Field, Search Bar, etc.), organisms (Navigation, Card, Modal, Table, etc.).
3. **Component specs**: For key components include props, variants, sizes, states, accessibility (ARIA, keyboard).
4. **Accessibility**: WCAG 2.1 AA—contrast 4.5:1, focus rings, keyboard access, ARIA roles/labels, prefers-reduced-motion.
5. **Responsive**: Breakpoints sm/md/lg/xl/2xl (640–1536px), mobile-first, touch targets ≥44px.

=== EXAMPLE COMPONENT SPEC ===
${FEW_SHOT_EXAMPLES.component}

${qualityCheck}

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
          maxTokens: getAgentMaxTokens("ui_design"),
          cacheId: context.cacheId,
          role: "UI Designer",
          model: context.options?.model,
        }
      );
    } catch (error: any) {
      logger.error("UI Designer agent LLM call failed", { error: error.message });
      throw error;
    }

    if (!llmUIDesign) {
      throw new Error("UI Designer agent failed: No structured data received from LLM");
    }

    // Ensure color palette is an object with required keys, then sanitize values
    ensureDesignTokensColors(llmUIDesign.design_tokens);
    if (llmUIDesign.design_tokens?.colors) {
      llmUIDesign.design_tokens.colors = sanitizeDesignTokensColors(llmUIDesign.design_tokens.colors);
    }
    // Sanitize spacing/typography so values are only raw CSS (no INVALID/FIX/REQUIRED text)
    sanitizeDesignTokensSpacingAndTypography(llmUIDesign.design_tokens);

    // Fallback: if typography missing (e.g. MAX_TOKENS truncation), inject minimal required fields to pass validation
    if (llmUIDesign.design_tokens && !llmUIDesign.design_tokens.typography) {
      llmUIDesign.design_tokens.typography = {
        fontFamily: "Inter",
        fontSize: { xs: "0.75rem", sm: "0.875rem", base: "1rem", lg: "1.125rem", xl: "1.25rem", "2xl": "1.5rem" },
        fontWeight: { light: "300", normal: "400", medium: "500", semibold: "600", bold: "700" },
      };
    } else if (llmUIDesign.design_tokens?.typography) {
      const t = llmUIDesign.design_tokens.typography as Record<string, unknown>;
      if (!t.fontFamily) t.fontFamily = "Inter";
      if (!t.fontSize || typeof t.fontSize !== "object") {
        t.fontSize = { xs: "0.75rem", sm: "0.875rem", base: "1rem", lg: "1.125rem" };
      }
    }

    // Map LLM output into the strict UIDesignerBackendArtifact shape.
    content = {
      summary: llmUIDesign.summary,
      description: llmUIDesign.description,
      design_tokens: llmUIDesign.design_tokens,
      component_hierarchy: llmUIDesign.component_hierarchy,
      ui_patterns: llmUIDesign.ui_patterns,
      component_specs: llmUIDesign.component_specs,
      layout_breakpoints: llmUIDesign.layout_breakpoints,
      accessibility: llmUIDesign.accessibility,
      atomic_structure: llmUIDesign.atomic_structure,
      website_layout: llmUIDesign.website_layout,
    } as UIDesignerBackendArtifact;

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
