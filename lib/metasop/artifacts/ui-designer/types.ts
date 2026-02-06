
export interface UIDesignerBackendArtifact {
    summary: string;
    description: string;
    design_tokens: {
        colors: {
            primary: string;
            primary_foreground: string;
            secondary: string;
            secondary_foreground: string;
            background: string;
            foreground: string;
            text?: string;
            muted: string;
            muted_foreground: string;
            card: string;
            card_foreground: string;
            popover: string;
            popover_foreground: string;
            border: string;
            input: string;
            ring: string;
            accent: string;
            accent_foreground: string;
            destructive: string;
            destructive_foreground: string;
        };
        spacing: Record<"xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl", string>;
        typography: {
            fontFamily: string;
            headingFont: string;
            monoFont: string;
            fontSize: Record<"xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl", string>;
            fontWeight: Record<"light" | "normal" | "medium" | "semibold" | "bold", string>;
            lineHeight: Record<"tight" | "normal" | "relaxed" | "loose", string>;
        };
        borderRadius: Record<"none" | "sm" | "md" | "lg" | "xl" | "full", string>;
        shadows: Record<"sm" | "md" | "lg" | "xl" | "inner" | "none", string>;
        animations: Record<"fast" | "normal" | "slow", string>;
    };
    component_hierarchy: {
        root: string;
        children: Array<{
            name: string;
            props: string[];
            children: Array<{
                name: string;
                props?: string[];
                children?: Array<{
                    name: string;
                }>;
            }>;
        }>;
    };
    ui_patterns: string[];
    component_specs: Array<{
        name: string;
        description: string;
        category: "atom" | "molecule" | "organism" | "template";
        props: Array<{
            name: string;
            type: string;
            default: string;
            description: string;
        }>;
        variants: string[];
        sizes: string[];
        states: string[];
        accessibility: {
            role: string;
            aria_label: string;
            keyboard: string;
        };
    }>;
    layout_breakpoints: {
        sm: string;
        md: string;
        lg: string;
        xl: string;
        "2xl": string;
    };
    accessibility: {
        standard: string;
        wcag_level: "A" | "AA" | "AAA";
        guidelines: string[];
        checklist: string[];
        aria_labels: boolean;
        keyboard_navigation: boolean;
        screen_reader_support: boolean;
        focus_indicators: boolean;
    };
    atomic_structure: {
        atoms: string[];
        molecules: string[];
        organisms: string[];
    };
    website_layout: {
        pages: Array<{
            name: string;
            route: string;
            sections: Array<{
                name: string;
                components: string[];
            }>;
        }>;
    };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isUIDesignerBackendArtifact(
    artifact: any
): artifact is UIDesignerBackendArtifact {
    return (
        artifact &&
        typeof artifact.summary === "string" &&
        typeof artifact.description === "string" &&
        typeof artifact.design_tokens === "object" &&
        typeof artifact.component_hierarchy === "object" &&
        Array.isArray(artifact.ui_patterns) &&
        Array.isArray(artifact.component_specs) &&
        typeof artifact.layout_breakpoints === "object" &&
        typeof artifact.accessibility === "object" &&
        typeof artifact.atomic_structure === "object" &&
        typeof artifact.website_layout === "object"
    );
}
