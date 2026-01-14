
export interface A2UINode {
    type: "View" | "Container" | "ScrollView" | "Stack" | "Grid" | "Card" | "Button" | "TextInput" | "Text" | "Image" | "Icon" | "Divider" | "List";
    props?: {
        label?: string;
        value?: string;
        placeholder?: string;
        variant?: "primary" | "secondary" | "outline" | "ghost" | "link";
        size?: "sm" | "md" | "lg" | "xl";
        spacing?: string;
        alignment?: "start" | "center" | "end";
        on_click?: string;
        [key: string]: any;
    };
    children?: A2UINode[];
}

export interface UIDesignerBackendArtifact {
    summary?: string;
    description?: string;
    schema_version?: "0.8";
    a2ui_manifest?: {
        root: A2UINode;
    };
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
        spacing: Record<string, string>;
        typography: {
            fontFamily: string;
            headingFont?: string;
            fontSize: Record<string, string>;
            fontWeight?: Record<string, string>;
            lineHeight?: Record<string, string>;
        };
        borderRadius?: Record<string, string>;
        shadows?: Record<string, string>;
    };
    ui_patterns?: string[];
    component_specs?: Array<{
        name: string;
        description: string;
        props?: Record<string, string>; // UI expects record
        variants?: string[];
        states?: string[];
    }>;
    layout_breakpoints?: Record<string, string>;
    atomic_structure?: {
        atoms: string[];
        molecules: string[];
        organisms: string[];
    };
    accessibility?: {
        standard?: string;
        guidelines?: string[];
        checklist?: string[];
        aria_labels?: boolean;
        keyboard_navigation?: boolean;
        screen_reader_support?: boolean;
        wcag_level?: "A" | "AA" | "AAA";
        focus_indicators?: boolean;
    };
    website_layout?: {
        pages: Array<{
            name: string;
            route: string;
            sections: string[];
        }>;
    };
}
