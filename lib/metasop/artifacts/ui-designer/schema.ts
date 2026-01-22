
export const uiDesignerSchema = {
    type: "object",
    required: ["component_hierarchy", "design_tokens", "summary", "description", "ui_patterns", "component_specs", "layout_breakpoints", "accessibility", "atomic_structure", "website_layout"],
    properties: {
        summary: { type: "string", maxLength: 300, description: "A technical, 1-2 sentence summary of the UI strategy and design system approach. No conversational filler." },
        description: { type: "string", maxLength: 600, description: "Detailed visual design philosophy, brand alignment, and design principles." },
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
                required: ["name", "description", "category"],
                properties: {
                    name: { type: "string", maxLength: 50, description: "Component name (e.g., 'Button', 'Modal')." },
                    category: { type: "string", enum: ["atom", "molecule", "organism", "template"], description: "Atomic design category." },
                    description: { type: "string", maxLength: 200, description: "Component purpose and usage guidelines." },
                    props: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string", maxLength: 30 },
                                type: { type: "string", maxLength: 50 },
                                default: { type: "string", maxLength: 30 },
                                description: { type: "string", maxLength: 100 }
                            }
                        },
                        description: "Component props with types and defaults."
                    },
                    variants: { type: "array", items: { type: "string", maxLength: 30 }, description: "Visual variants (primary, secondary, ghost)." },
                    sizes: { type: "array", items: { type: "string", maxLength: 10 }, description: "Size variants (sm, md, lg)." },
                    states: { type: "array", items: { type: "string", maxLength: 20 }, description: "Interactive states (hover, active, disabled, loading)." },
                    accessibility: {
                        type: "object",
                        properties: {
                            role: { type: "string", maxLength: 30 },
                            aria_label: { type: "string", maxLength: 100 },
                            keyboard: { type: "string", maxLength: 100 }
                        },
                        description: "Accessibility requirements for this component."
                    }
                },
            },
            description: "Key component specifications with props, variants, states, and accessibility. Scale to project needs."
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
                atoms: { type: "array", items: { type: "string", maxLength: 50 } },
                molecules: { type: "array", items: { type: "string", maxLength: 50 } },
                organisms: { type: "array", items: { type: "string", maxLength: 50 } },
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
        layout_strategy: { type: "string", maxLength: 400, description: "Grid system, container widths, and layout patterns." },
        visual_philosophy: { type: "string", maxLength: 400, description: "Core design principles, aesthetic direction, and brand alignment." },
        information_architecture: { type: "string", maxLength: 400, description: "Navigation hierarchy, user flows, and content organization." },
        responsive_strategy: { type: "string", maxLength: 400, description: "Mobile-first approach, breakpoint behavior, and adaptive patterns." }
    },
};
