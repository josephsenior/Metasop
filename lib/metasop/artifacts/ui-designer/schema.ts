
export const uiDesignerSchema = {
    type: "object",
    required: ["component_hierarchy", "design_tokens", "summary", "description", "ui_patterns", "component_specs", "layout_breakpoints", "accessibility", "atomic_structure", "website_layout"],
    properties: {
        summary: { type: "string", maxLength: 200, description: "A technical, 1-sentence summary of the UI strategy. No conversational filler." },
        description: { type: "string", description: "Detailed visual design philosophy and brand alignment." },
        component_hierarchy: {
            type: "object",
            required: ["root"],
            properties: {
                root: { type: "string", maxLength: 40, description: "Root component name (e.g., 'App')." },
                children: {
                    type: "array",
                    items: {
                        type: "object",
                        required: ["name"],
                        properties: {
                            name: { type: "string", maxLength: 40, description: "Component name." },
                            props: {
                                type: "array",
                                items: { type: "string", maxLength: 30 },
                                description: "Key component props (e.g., 'title: string').",
                            },
                            children: {
                                type: "array",
                                description: "Child components (recursive).",
                                items: {
                                    type: "object",
                                    properties: {
                                        name: { type: "string", maxLength: 20 },
                                        props: { type: "array", items: { type: "string", maxLength: 30 } },
                                        children: {
                                            type: "array",
                                            description: "Child components (recursive)",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    name: { type: "string", maxLength: 20 },
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
                    description: "Color palette. Use ONLY 6-digit hex codes (e.g., #FFFFFF).",
                    properties: {
                        primary: { type: "string", minLength: 7, maxLength: 7, pattern: "^#[0-9A-Fa-f]{6}$", description: "Primary brand color (6-digit hex, e.g. #0F4C81)" },
                        secondary: { type: "string", minLength: 7, maxLength: 7, pattern: "^#[0-9A-Fa-f]{6}$", description: "Secondary brand color (6-digit hex)" },
                        background: { type: "string", minLength: 7, maxLength: 7, pattern: "^#[0-9A-Fa-f]{6}$", description: "Main background color (6-digit hex)" },
                        text: { type: "string", minLength: 7, maxLength: 7, pattern: "^#[0-9A-Fa-f]{6}$", description: "Primary text color (6-digit hex)" },
                        accent: { type: "string", minLength: 7, maxLength: 7, pattern: "^#[0-9A-Fa-f]{6}$", description: "Accent/Call-to-action color (6-digit hex)" },
                        error: { type: "string", minLength: 7, maxLength: 7, pattern: "^#[0-9A-Fa-f]{6}$", description: "Error state color (6-digit hex)" },
                        success: { type: "string", minLength: 7, maxLength: 7, pattern: "^#[0-9A-Fa-f]{6}$", description: "Success state color (6-digit hex)" },
                        warning: { type: "string", minLength: 7, maxLength: 7, pattern: "^#[0-9A-Fa-f]{6}$", description: "Warning state color (6-digit hex)" },
                        surface: { type: "string", minLength: 7, maxLength: 7, pattern: "^#[0-9A-Fa-f]{6}$", description: "Surface/Card color (6-digit hex)" },
                    },
                },
                spacing: {
                    type: "object",
                    description: "Spacing scale. Use ONLY raw CSS values (e.g., '0.5rem'). No descriptions.",
                    properties: {
                        xs: { type: "string", maxLength: 10 },
                        sm: { type: "string", maxLength: 10 },
                        md: { type: "string", maxLength: 10 },
                        lg: { type: "string", maxLength: 10 },
                        xl: { type: "string", maxLength: 10 },
                        "2xl": { type: "string", maxLength: 10 },
                    },
                },
                typography: {
                    type: "object",
                    description: "Typography system. Use raw CSS values only.",
                    properties: {
                        fontFamily: { type: "string", maxLength: 100, description: "Primary font family (e.g., 'Inter')." },
                        headingFont: { type: "string", maxLength: 100, description: "Heading font family." },
                        fontSize: {
                            type: "object",
                            description: "Font size scale (e.g., '0.875rem').",
                            properties: {
                                xs: { type: "string", maxLength: 10 },
                                sm: { type: "string", maxLength: 10 },
                                base: { type: "string", maxLength: 10 },
                                lg: { type: "string", maxLength: 10 },
                                xl: { type: "string", maxLength: 10 },
                                "2xl": { type: "string", maxLength: 10 },
                            },
                        },
                        fontWeight: {
                            type: "object",
                            description: "Font weights (e.g., '400').",
                            properties: {
                                light: { type: "string", maxLength: 10 },
                                normal: { type: "string", maxLength: 10 },
                                medium: { type: "string", maxLength: 10 },
                                semibold: { type: "string", maxLength: 10 },
                                bold: { type: "string", maxLength: 10 },
                            }
                        }
                    },
                },
                borderRadius: {
                    type: "object",
                    properties: {
                        none: { type: "string", maxLength: 10 },
                        sm: { type: "string", maxLength: 10 },
                        md: { type: "string", maxLength: 10 },
                        lg: { type: "string", maxLength: 10 },
                        full: { type: "string", maxLength: 20 },
                    }
                },
                shadows: {
                    type: "object",
                    properties: {
                        sm: { type: "string", maxLength: 100 },
                        md: { type: "string", maxLength: 100 },
                        lg: { type: "string", maxLength: 150 },
                        inner: { type: "string", maxLength: 100 },
                    }
                }
            },
        },
        ui_patterns: {
            type: "array",
            items: { type: "string", maxLength: 100 },
        },
        component_specs: {
            type: "array",
            items: {
                type: "object",
                required: ["name", "description"],
                properties: {
                    name: { type: "string", maxLength: 50 },
                    description: { type: "string", maxLength: 500 },
                    props: {
                        type: "object",
                        additionalProperties: { type: "string", maxLength: 100 },
                        description: "Component props mapping name to type"
                    },
                    variants: { type: "array", items: { type: "string", maxLength: 50 } },
                    states: { type: "array", items: { type: "string", maxLength: 50 } },
                },
            },
        },
        layout_breakpoints: {
            type: "object",
            properties: {
                sm: { type: "string", maxLength: 15, description: "Small breakpoint (e.g., '640px')" },
                md: { type: "string", maxLength: 15, description: "Medium breakpoint (e.g., '768px')" },
                lg: { type: "string", maxLength: 15, description: "Large breakpoint (e.g., '1024px')" },
                xl: { type: "string", maxLength: 15, description: "Extra large breakpoint (e.g., '1280px')" },
                "2xl": { type: "string", maxLength: 15, description: "2X large breakpoint (e.g., '1536px')" },
            },
            description: "Responsive breakpoints",
        },
        accessibility: {
            type: "object",
            properties: {
                standard: { type: "string", maxLength: 50 },
                guidelines: { type: "array", items: { type: "string", maxLength: 200 } },
                checklist: { type: "array", items: { type: "string", maxLength: 200 } },
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
                            name: { type: "string", maxLength: 50, description: "Page name (e.g., 'Dashboard')." },
                            route: { type: "string", maxLength: 100, description: "URL route (e.g., '/dashboard')." },
                            sections: {
                                type: "array",
                                items: {
                                    type: "object",
                                    required: ["name", "components"],
                                    properties: {
                                        name: { type: "string", maxLength: 50, description: "Section name (e.g., 'Hero')." },
                                        components: { type: "array", items: { type: "string", maxLength: 50 } },
                                    }
                                }
                            }
                        }
                    }
                }
            },
            description: "Information architecture/Sitemap for the application."
        },
        layout_strategy: { type: "string" },
        visual_philosophy: { type: "string" },
        information_architecture: { type: "string" },
        responsive_strategy: { type: "string" }
    },
};
