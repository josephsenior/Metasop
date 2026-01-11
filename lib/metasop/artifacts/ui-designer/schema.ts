
export const uiDesignerSchema = {
    type: "object",
    required: ["schema_version", "a2ui_manifest", "component_hierarchy", "design_tokens"],
    properties: {
        summary: { type: "string" },
        description: { type: "string" },
        schema_version: { type: "string", enum: ["0.8"], description: "A2UI Protocol version" },
        a2ui_manifest: {
            type: "object",
            required: ["root"],
            properties: {
                root: {
                    type: "object",
                    required: ["type", "props"],
                    properties: {
                        type: {
                            type: "string",
                            enum: ["View", "Container", "ScrollView", "Stack", "Grid", "Card", "Button", "TextInput", "Text", "Image", "Icon", "Divider", "List"],
                            description: "Standard A2UI component type"
                        },
                        props: {
                            type: "object",
                            properties: {
                                label: { type: "string" },
                                value: { type: "string" },
                                placeholder: { type: "string" },
                                variant: { type: "string", enum: ["primary", "secondary", "outline", "ghost", "link"] },
                                size: { type: "string", enum: ["sm", "md", "lg", "xl"] },
                                spacing: { type: "string" },
                                alignment: { type: "string", enum: ["start", "center", "end"] },
                                on_click: { type: "string", description: "Action identifier (e.g., 'submit', 'navigate_to_home')" },
                            }
                        },
                        children: {
                            type: "array",
                            maxItems: 8,
                            items: {
                                type: "object",
                                properties: {
                                    type: { type: "string" },
                                    props: { type: "object", properties: { label: { type: "string" } } }
                                }
                            },
                            description: "Recursive A2UI children"
                        }
                    }
                }
            },
            description: "Declarative UI manifest following A2UI v0.8 protocol"
        },
        component_hierarchy: {
            type: "object",
            required: ["root"],
            properties: {
                root: { type: "string", description: "Root component name (e.g., 'App', 'Application')" },
                children: {
                    type: "array",
                    maxItems: 10,
                    items: {
                        type: "object",
                        required: ["name"],
                        properties: {
                            name: { type: "string", description: "Component name" },
                            props: {
                                type: "array",
                                items: { type: "string" },
                                description: "Component props/attributes",
                            },
                            children: {
                                type: "array",
                                maxItems: 5,
                                description: "Child components (recursive - can contain same structure)",
                                items: {
                                    type: "object",
                                    properties: {
                                        name: { type: "string" },
                                        props: { type: "array", items: { type: "string" } },
                                        children: {
                                            type: "array",
                                            maxItems: 3,
                                            description: "Nested children (recursive)",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    name: { type: "string" },
                                                    description: { type: "string" }
                                                }
                                            },
                                        },
                                        description: { type: "string" },
                                    },
                                },
                            },
                            description: { type: "string", description: "Component description" },
                        },
                    },
                    description: "Child components in the hierarchy",
                },
            },
            description: "Legacy structural component hierarchy (used by internal engine)",
        },
        design_tokens: {
            type: "object",
            required: ["colors", "spacing", "typography"],
            properties: {
                colors: {
                    type: "object",
                    description: "Color palette",
                    properties: {
                        primary: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
                        secondary: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
                        background: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
                        text: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
                        accent: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
                        error: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
                        success: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
                        warning: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
                    },
                },
                spacing: {
                    type: "object",
                    properties: {
                        xs: { type: "string" },
                        sm: { type: "string" },
                        md: { type: "string" },
                        lg: { type: "string" },
                        xl: { type: "string" },
                    },
                },
                typography: {
                    type: "object",
                    properties: {
                        fontFamily: { type: "string" },
                        fontSize: {
                            type: "object",
                            properties: {
                                sm: { type: "string" },
                                base: { type: "string" },
                                lg: { type: "string" },
                                xl: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
        ui_patterns: {
            type: "array",
            maxItems: 5,
            items: { type: "string" },
        },
        component_specs: {
            type: "array",
            maxItems: 5,
            items: {
                type: "object",
                required: ["name", "description"],
                properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    props: {
                        type: "object",
                        additionalProperties: { type: "string" },
                        description: "Component props mapping name to type"
                    },
                },
            },
        },
        layout_breakpoints: {
            type: "object",
            properties: {
                sm: { type: "string", description: "Small breakpoint (e.g., '640px')" },
                md: { type: "string", description: "Medium breakpoint (e.g., '768px')" },
                lg: { type: "string", description: "Large breakpoint (e.g., '1024px')" },
                xl: { type: "string", description: "Extra large breakpoint (e.g., '1280px')" },
                "2xl": { type: "string", description: "2X large breakpoint (e.g., '1536px')" },
            },
            description: "Responsive breakpoints",
        },
        accessibility: {
            type: "object",
            properties: {
                standard: { type: "string" },
                guidelines: { type: "array", items: { type: "string" } },
                checklist: { type: "array", items: { type: "string" } },
                aria_labels: { type: "boolean", description: "Use ARIA labels" },
                keyboard_navigation: { type: "boolean", description: "Support keyboard navigation" },
                screen_reader_support: { type: "boolean", description: "Screen reader support" },
                color_contrast: { type: "string", description: "Color contrast requirements (e.g., 'WCAG AA')" },
                focus_indicators: { type: "boolean", description: "Visible focus indicators" },
            },
            description: "Accessibility requirements",
        },
    },
};
