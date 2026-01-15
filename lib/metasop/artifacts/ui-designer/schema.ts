
export const uiDesignerSchema = {
    type: "object",
    required: ["component_hierarchy", "design_tokens", "summary", "description", "ui_patterns", "component_specs", "layout_breakpoints", "accessibility", "atomic_structure", "website_layout"],
    properties: {
        summary: { type: "string" },
        description: { type: "string" },
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
                                maxItems: 10,
                                description: "Key component props (max 10)",
                            },
                            children: {
                                type: "array",
                                maxItems: 5,
                                description: "Child components (recursive - can contain same structure)",
                                items: {
                                    type: "object",
                                    properties: {
                                        name: { type: "string" },
                                        props: { type: "array", items: { type: "string" }, maxItems: 10 },
                                        children: {
                                            type: "array",
                                            maxItems: 3,
                                            description: "Nested children (recursive)",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    name: { type: "string" },
                                                }
                                            },
                                        },
                                    },
                                },
                            },
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
                        surface: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$", description: "Surface/Card background color" },
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
                        "2xl": { type: "string" },
                    },
                },
                typography: {
                    type: "object",
                    properties: {
                        fontFamily: { type: "string" },
                        headingFont: { type: "string" },
                        fontSize: {
                            type: "object",
                            properties: {
                                xs: { type: "string" },
                                sm: { type: "string" },
                                base: { type: "string" },
                                lg: { type: "string" },
                                xl: { type: "string" },
                                "2xl": { type: "string" },
                            },
                        },
                        fontWeight: {
                            type: "object",
                            properties: {
                                light: { type: "string" },
                                normal: { type: "string" },
                                medium: { type: "string" },
                                semibold: { type: "string" },
                                bold: { type: "string" },
                            }
                        }
                    },
                },
                borderRadius: {
                    type: "object",
                    properties: {
                        none: { type: "string" },
                        sm: { type: "string" },
                        md: { type: "string" },
                        lg: { type: "string" },
                        full: { type: "string" },
                    }
                },
                shadows: {
                    type: "object",
                    properties: {
                        sm: { type: "string" },
                        md: { type: "string" },
                        lg: { type: "string" },
                        inner: { type: "string" },
                    }
                }
            },
        },
        ui_patterns: {
            type: "array",
            maxItems: 8,
            items: { type: "string" },
        },
        component_specs: {
            type: "array",
            maxItems: 10,
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
                    variants: { type: "array", items: { type: "string" } },
                    states: { type: "array", items: { type: "string" } },
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
                wcag_level: { type: "string", enum: ["A", "AA", "AAA"] },
                focus_indicators: { type: "boolean", description: "Visible focus indicators" },
            },
            description: "Accessibility requirements",
        },
        atomic_structure: {
            type: "object",
            properties: {
                atoms: { type: "array", items: { type: "string" } },
                molecules: { type: "array", items: { type: "string" } },
                organisms: { type: "array", items: { type: "string" } },
            }
        },
        website_layout: {
            type: "object",
            required: ["pages"],
            properties: {
                pages: {
                    type: "array",
                    minItems: 1,
                    items: {
                        type: "object",
                        required: ["name", "route", "sections"],
                        properties: {
                            name: { type: "string", description: "Page display name" },
                            route: { type: "string", description: "URL route path (e.g. '/dashboard')" },
                            sections: {
                                type: "array",
                                items: { type: "string" },
                                description: "Key page sections (e.g. Hero, Stats, Grid)"
                            },
                        }
                    }
                }
            },
            description: "Information architecture/Sitemap for the application."
        }
    },
};
