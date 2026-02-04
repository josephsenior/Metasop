
export interface UIDesignerBackendArtifact {
    summary: string;
    description: string;
    schema_version?: "0.8";
    component_hierarchy: {
        root: string;
        children: Array<{
            name: string;
            props?: string[];
            children?: any[];
            description?: string;
        }>;
    };
    design_tokens: {
        colors: {
            primary: string;
            secondary: string;
            background: string;
            text: string;
            accent?: string;
            error?: string;
            success?: string;
            warning?: string;
            surface?: string;
        };
        spacing: Record<"xs" | "sm" | "md" | "lg" | "xl" | "2xl", string>;
        typography: {
            fontFamily: string;
            headingFont?: string;
            fontSize: Record<"xs" | "sm" | "base" | "lg" | "xl" | "2xl", string>;
            fontWeight: Record<"light" | "normal" | "medium" | "semibold" | "bold", string>;
            lineHeight?: Record<string, string>;
        };
        borderRadius: Record<"none" | "sm" | "md" | "lg" | "full", string>;
        shadows: Record<"sm" | "md" | "lg" | "inner", string>;
    };
    ui_patterns: string[];
    component_specs: Array<{
        name: string;
        description: string;
        props?: Record<string, string>; // UI expects record
        variants?: string[];
        states?: string[];
    }>;
    layout_breakpoints: Record<string, string>;
    atomic_structure: {
        atoms: string[];
        molecules: string[];
        organisms: string[];
    };
    accessibility: {
        standard?: string;
        guidelines?: string[];
        checklist?: string[];
        aria_labels?: boolean;
        keyboard_navigation?: boolean;
        screen_reader_support?: boolean;
        wcag_level?: "A" | "AA" | "AAA";
        focus_indicators?: boolean;
    };
    website_layout: {
        pages: Array<{
            name: string;
            route: string;
            sections: Array<string | {
                name: string;
                components: string[];
            }>;
        }>;
    };
    layout_strategy?: string;
    visual_philosophy?: string;
    information_architecture?: string;
    responsive_strategy?: string;
    component_blueprint?: any;
}
