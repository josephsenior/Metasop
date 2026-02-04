
export const uiDesignerSchema = {
    type: "object",
    required: ["component_hierarchy", "design_tokens", "summary", "description", "ui_patterns", "component_specs", "layout_breakpoints", "accessibility", "atomic_structure", "website_layout"],
    propertyOrdering: ["summary", "description", "website_layout", "accessibility", "ui_patterns", "layout_breakpoints", "component_specs", "atomic_structure", "design_tokens", "component_hierarchy"],
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
                            name: { type: "string", maxLength: 40, description: "Component name (e.g., 'Button')." },
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
                                                    name: { type: "string", maxLength: 20, description: "Nested child component name." },
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
                    required: ["primary", "secondary", "background", "text"], // REQUIRED: These fields must always be present
                    description: "Color palette. Use ONLY 6-digit hex codes (e.g., #FFFFFF). REQUIRED fields: primary, secondary, background, text.",
                    properties: {
                        primary: { type: "string", minLength: 7, maxLength: 7, pattern: "^#[0-9A-Fa-f]{6}$", description: "REQUIRED: Primary brand color (6-digit hex, e.g. #0F4C81)" },
                        secondary: { type: "string", minLength: 7, maxLength: 7, pattern: "^#[0-9A-Fa-f]{6}$", description: "REQUIRED: Secondary brand color (6-digit hex)" },
                        background: { type: "string", minLength: 7, maxLength: 7, pattern: "^#[0-9A-Fa-f]{6}$", description: "REQUIRED: Main background color (6-digit hex)" },
                        text: { type: "string", minLength: 7, maxLength: 7, pattern: "^#[0-9A-Fa-f]{6}$", description: "REQUIRED: Primary text color (6-digit hex)" },
                        accent: { type: "string", minLength: 7, maxLength: 7, pattern: "^#[0-9A-Fa-f]{6}$", description: "Accent/Call-to-action color (6-digit hex)" },
                        error: { type: "string", minLength: 7, maxLength: 7, pattern: "^#[0-9A-Fa-f]{6}$", description: "Error state color (6-digit hex)" },
                        success: { type: "string", minLength: 7, maxLength: 7, pattern: "^#[0-9A-Fa-f]{6}$", description: "Success state color (6-digit hex)" },
                        warning: { type: "string", minLength: 7, maxLength: 7, pattern: "^#[0-9A-Fa-f]{6}$", description: "Warning state color (6-digit hex)" },
                        surface: { type: "string", minLength: 7, maxLength: 7, pattern: "^#[0-9A-Fa-f]{6}$", description: "Surface/Card color (6-digit hex)" },
                    },
                },
                spacing: {
                    type: "object",
                    description: "Spacing scale. CSS length per key, e.g. 0.25rem.",
                    required: ["xs", "sm", "md", "lg", "xl", "2xl"],
                    properties: {
                        xs: { type: "string", maxLength: 12, pattern: "^[0-9.]+[a-z%]+$", description: "Extra small spacing (e.g., '0.25rem')." },
                        sm: { type: "string", maxLength: 12, pattern: "^[0-9.]+[a-z%]+$", description: "Small spacing (e.g., '0.5rem')." },
                        md: { type: "string", maxLength: 12, pattern: "^[0-9.]+[a-z%]+$", description: "Medium spacing (e.g., '1rem')." },
                        lg: { type: "string", maxLength: 12, pattern: "^[0-9.]+[a-z%]+$", description: "Large spacing (e.g., '1.5rem')." },
                        xl: { type: "string", maxLength: 12, pattern: "^[0-9.]+[a-z%]+$", description: "Extra large spacing (e.g., '2rem')." },
                        "2xl": { type: "string", maxLength: 12, pattern: "^[0-9.]+[a-z%]+$", description: "2X large spacing (e.g., '3rem')." },
                    },
                },
                typography: {
                    type: "object",
                    required: ["fontFamily", "fontSize"],
                    description: "Typography settings.",
                    properties: {
                        fontFamily: { type: "string", maxLength: 100, description: "Primary font family, e.g. Inter." },
                        headingFont: { type: "string", maxLength: 100, description: "Heading font family." },
                        fontSize: {
                            type: "object",
                            description: "Font size scale. CSS length per key, e.g. 0.875rem.",
                            required: ["xs", "sm", "base", "lg", "xl", "2xl"],
                            properties: {
                                xs: { type: "string", maxLength: 12, pattern: "^[0-9.]+[a-z%]+$", description: "Extra small font size (e.g., '0.75rem')." },
                                sm: { type: "string", maxLength: 12, pattern: "^[0-9.]+[a-z%]+$", description: "Small font size (e.g., '0.875rem')." },
                                base: { type: "string", maxLength: 12, pattern: "^[0-9.]+[a-z%]+$", description: "Base font size (e.g., '1rem')." },
                                lg: { type: "string", maxLength: 12, pattern: "^[0-9.]+[a-z%]+$", description: "Large font size (e.g., '1.125rem')." },
                                xl: { type: "string", maxLength: 12, pattern: "^[0-9.]+[a-z%]+$", description: "Extra large font size (e.g., '1.25rem')." },
                                "2xl": { type: "string", maxLength: 12, pattern: "^[0-9.]+[a-z%]+$", description: "2X large font size (e.g., '1.5rem')." },
                            },
                        },
                        fontWeight: {
                            type: "object",
                            description: "Font weights (e.g., '400').",
                            required: ["light", "normal", "medium", "semibold", "bold"],
                            properties: {
                                light: { type: "string", maxLength: 10, pattern: "^[0-9]+$", description: "Light font weight (e.g. '300')." },
                                normal: { type: "string", maxLength: 10, pattern: "^[0-9]+$", description: "Normal font weight (e.g. '400')." },
                                medium: { type: "string", maxLength: 10, pattern: "^[0-9]+$", description: "Medium font weight (e.g. '500')." },
                                semibold: { type: "string", maxLength: 10, pattern: "^[0-9]+$", description: "Semibold font weight (e.g. '600')." },
                                bold: { type: "string", maxLength: 10, pattern: "^[0-9]+$", description: "Bold font weight (e.g. '700')." },
                            }
                        }
                    },
                },
                borderRadius: {
                    type: "object",
                    required: ["none", "sm", "md", "lg", "full"],
                    properties: {
                        none: { type: "string", maxLength: 10, pattern: "^[0-9.]+[a-z%]+$", description: "No border radius (e.g., '0')." },
                        sm: { type: "string", maxLength: 10, pattern: "^[0-9.]+[a-z%]+$", description: "Small border radius (e.g., '0.125rem')." },
                        md: { type: "string", maxLength: 10, pattern: "^[0-9.]+[a-z%]+$", description: "Medium border radius (e.g., '0.375rem')." },
                        lg: { type: "string", maxLength: 10, pattern: "^[0-9.]+[a-z%]+$", description: "Large border radius (e.g., '0.5rem')." },
                        full: { type: "string", maxLength: 20, pattern: "^[0-9.]+[a-z%]+$", description: "Full boolean radius (e.g., '9999px')." },
                    }
                },
                shadows: {
                    type: "object",
                    required: ["sm", "md", "lg", "inner"],
                    properties: {
                        sm: { type: "string", maxLength: 100, description: "Small shadow CSS value." },
                        md: { type: "string", maxLength: 100, description: "Medium shadow CSS value." },
                        lg: { type: "string", maxLength: 150, description: "Large shadow CSS value." },
                        inner: { type: "string", maxLength: 100, description: "Inner shadow CSS value." },
                    }
                }
            },
        },
        ui_patterns: {
            type: "array",
            items: { type: "string", maxLength: 100, description: "UI design pattern name." },
        },
        component_specs: {
            type: "array",
            items: {
                type: "object",
                required: ["name", "description"],
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
                standard: { type: "string", maxLength: 50, description: "Accessibility standard used (e.g., 'WCAG 2.1')." },
                guidelines: { type: "array", items: { type: "string", maxLength: 200 }, description: "List of key accessibility guidelines." },
                checklist: { type: "array", items: { type: "string", maxLength: 200 }, description: "Checklist of accessibility tasks." },
                aria_labels: { type: "boolean", description: "Use ARIA labels" },
                keyboard_navigation: { type: "boolean", description: "Support keyboard navigation" },
                screen_reader_support: { type: "boolean", description: "Support screen readers" },
                wcag_level: { type: "string", enum: ["A", "AA", "AAA"], description: "WCAG compliance level target." },
                focus_indicators: { type: "boolean", description: "Visible focus indicators" },
            },
            description: "Accessibility requirements",
        },
        atomic_structure: {
            type: "object",
            required: ["atoms", "molecules", "organisms"],
            properties: {
                atoms: { type: "array", items: { type: "string", maxLength: 50 }, description: "Basic building blocks (e.g. Buttons, Inputs)." },
                molecules: { type: "array", items: { type: "string", maxLength: 50 }, description: "Groups of atoms (e.g. SearchBar)." },
                organisms: { type: "array", items: { type: "string", maxLength: 50 }, description: "Complex UI components (e.g. Header)." },
            }
        },
        website_layout: {
            type: "object",
            required: ["pages"],
            properties: {
                pages: {
                    type: "array",
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
                                    required: ["name"],
                                    properties: {
                                        name: { type: "string", maxLength: 50, description: "Section name (e.g., 'Hero')." },
                                        components: { type: "array", items: { type: "string", maxLength: 50 }, description: "List of components in this section." },
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
