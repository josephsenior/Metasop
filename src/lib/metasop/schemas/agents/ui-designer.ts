import { z } from "zod";

const A2UINodeSchema: z.ZodType<any> = z.lazy(() =>
    z.object({
        type: z.enum(["View", "Container", "ScrollView", "Stack", "Grid", "Card", "Button", "TextInput", "Text", "Image", "Icon", "Divider", "List"]),
        props: z.record(z.string(), z.any()).optional(),
        children: z.array(z.lazy(() => A2UINodeSchema)).optional(),
    })
);

const WebsiteLayoutSchema = z.object({
    pages: z.array(z.object({
        name: z.string(),
        route: z.string(),
        sections: z.array(z.union([
            z.string(), // Simple string section name
            z.object({
                name: z.string(),
                components: z.array(z.string()),
            })
        ])).optional(),
    })).min(1, "At least one page is required"),
});

const ComponentHierarchySchema = z.object({
    root: z.string(),
    children: z.array(z.object({
        name: z.string(),
        props: z.array(z.string()).optional(),
        children: z.array(z.any()).optional(),
        description: z.string().optional(),
    })),
});

const DesignTokensSchema = z.object({
    colors: z.object({
        primary: z.string(),
        secondary: z.string(),
        background: z.string(),
        text: z.string(), // Required (aligned with JSON schema)
        accent: z.string().optional(),
        error: z.string().optional(),
        success: z.string().optional(),
        warning: z.string().optional(),
    }),
    spacing: z.record(z.string(), z.string()),
    typography: z.object({
        fontFamily: z.string(),
        fontSize: z.record(z.string(), z.string()),
        fontWeight: z.record(z.string(), z.string()).optional(),
        lineHeight: z.record(z.string(), z.string()).optional(),
    }),
    borderRadius: z.record(z.string(), z.string()).optional(),
    shadows: z.record(z.string(), z.string()).optional(),
});

const ComponentSpecSchema = z.object({
    name: z.string(),
    description: z.string(),
    category: z.enum(["atom", "molecule", "organism", "template"]).optional(),
    props: z.array(z.object({
        name: z.string(),
        type: z.string(),
        required: z.boolean().optional(),
        description: z.string().optional(),
        default: z.string().optional(),
    })).optional().or(z.record(z.any()).transform(obj => {
        // If we get an object instead of array, convert it
        return Object.entries(obj).map(([name, type]) => ({ name, type: String(type) }));
    })),
    variants: z.array(z.string()).optional(),
    states: z.array(z.string()).optional(),
});

export const UIDesignerArtifactSchema = z.object({
    schema_version: z.string().optional(),
    a2ui_manifest: z.object({
        root: A2UINodeSchema,
    }).optional(),
    component_hierarchy: ComponentHierarchySchema,
    design_tokens: DesignTokensSchema,
    ui_patterns: z.array(z.string()),
    component_specs: z.array(ComponentSpecSchema),
    layout_breakpoints: z.record(z.string(), z.string()),
    atomic_structure: z.object({
        atoms: z.array(z.string()),
        molecules: z.array(z.string()),
        organisms: z.array(z.string()),
    }),
    accessibility: z.object({
        aria_labels: z.boolean().optional(),
        keyboard_navigation: z.boolean().optional(),
        screen_reader_support: z.boolean().optional(),
        color_contrast: z.string().optional(),
        focus_indicators: z.boolean().optional(),
        wcag_level: z.enum(["A", "AA", "AAA"]).optional(),
    }),
    website_layout: WebsiteLayoutSchema,
    summary: z.string(),
    description: z.string(),
});

export function validateUIDesignerArtifact(data: unknown) {
    return UIDesignerArtifactSchema.parse(data);
}

export function safeValidateUIDesignerArtifact(data: unknown) {
    return UIDesignerArtifactSchema.safeParse(data);
}
