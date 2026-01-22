import type { AgentContext } from "../types";
import { logger } from "./logger";

/**
 * Maximum token budget for context (approximate, 1 token ≈ 4 chars)
 */
const MAX_CONTEXT_CHARS = 12000; // ~3000 tokens for related artifacts
const MAX_CURRENT_ARTIFACT_CHARS = 8000; // ~2000 tokens for current artifact

/**
 * Build a refinement prompt that includes:
 * 1. The current artifact content being refined (smart-compressed)
 * 2. Related artifacts for context (projections, not full dumps)
 * 3. The refinement instruction
 * 4. For cascading: diff summary of what changed upstream
 */
export function buildRefinementPrompt(
    context: AgentContext,
    role: string,
    basePromptGuidelines: string
): string {
    const { refinement, previous_artifacts } = context;

    if (!refinement) {
        throw new Error("buildRefinementPrompt called without refinement context");
    }

    const isCascading = refinement.instruction.includes("upstream artifact") || 
                        refinement.instruction.includes("alignment") ||
                        refinement.instruction.includes("synchronized");

    logger.info(`Building refinement prompt for ${role}`, {
        targetStepId: refinement.target_step_id,
        instruction: refinement.instruction.substring(0, 100),
        isCascading,
    });

    // For cascading refinements, extract what changed from the instruction
    let changesSummary = "";
    if (isCascading) {
        changesSummary = extractChangeSummary(refinement.instruction, previous_artifacts);
    }

    // Get PROJECTED related artifacts (not full dumps)
    const relatedContext = buildProjectedContext(
        refinement.target_step_id,
        previous_artifacts,
        isCascading
    );

    // Smart-compress the current artifact
    const currentArtifactContext = compressArtifactForRefinement(
        refinement.target_step_id,
        refinement.previous_artifact_content
    );

    const prompt = `You are a ${role} performing a REFINEMENT of an existing artifact.

=== REFINEMENT TYPE ===
${isCascading ? "CASCADING ALIGNMENT (Upstream changes detected)" : "DIRECT USER INSTRUCTION"}

=== REFINEMENT INSTRUCTION ===
${refinement.instruction}
${changesSummary ? `\n=== UPSTREAM CHANGES SUMMARY ===\n${changesSummary}` : ""}

=== CURRENT ARTIFACT (Your Starting Point) ===
${currentArtifactContext}

${relatedContext ? `=== RELATED CONTEXT (Reference Only) ===\n${relatedContext}` : ""}

=== REFINEMENT GUIDELINES ===
${basePromptGuidelines}

CRITICAL REFINEMENT RULES:
1. **START WITH EXISTING**: Your output MUST be based on the current artifact above. Do NOT regenerate from scratch.
2. **SURGICAL CHANGES**: Make only the changes required by the instruction. Preserve everything else.
3. ${isCascading 
    ? "**SYNC FOCUS**: Update ONLY the parts affected by upstream changes (references, names, types, APIs). Don't touch unrelated sections." 
    : "**EVOLVE**: Implement the requested changes while preserving existing quality."}
4. **PRESERVE UNCHANGED**: If a section isn't mentioned in the instruction, keep it EXACTLY as-is.
5. **COMPLETE OUTPUT**: Return the FULL refined artifact in valid JSON format.

Your goal: Apply minimal, targeted changes to produce a consistent artifact.`;

    return prompt;
}

/**
 * Extract a summary of what changed from the cascading instruction
 */
function extractChangeSummary(instruction: string, artifacts: Record<string, any>): string {
    // Try to identify the source artifact from the instruction
    const sourceMatch = instruction.match(/(?:refined|updated|changed)\s+(?:the\s+)?['"]?(\w+)['"]?/i) ||
                        instruction.match(/['"](\w+)['"]\s+(?:was|has been)/i);
    
    if (!sourceMatch) return "";

    const sourceStepId = sourceMatch[1];
    const sourceArtifact = artifacts[sourceStepId];
    
    if (!sourceArtifact?.content) return "";

    // Generate a brief summary of the source artifact's key elements
    const content = sourceArtifact.content;
    const summaryParts: string[] = [];

    // Extract key identifiable elements that downstream artifacts reference
    if (content.summary) summaryParts.push(`Summary: "${content.summary.substring(0, 100)}..."`);
    if (content.user_stories?.length) {
        const titles = content.user_stories.slice(0, 3).map((s: any) => s.title).join(", ");
        summaryParts.push(`User Stories: ${titles}${content.user_stories.length > 3 ? ` (+${content.user_stories.length - 3} more)` : ""}`);
    }
    if (content.apis?.length) {
        const endpoints = content.apis.slice(0, 3).map((a: any) => `${a.method} ${a.path}`).join(", ");
        summaryParts.push(`APIs: ${endpoints}${content.apis.length > 3 ? ` (+${content.apis.length - 3} more)` : ""}`);
    }
    if (content.database_schema?.tables?.length) {
        const tables = content.database_schema.tables.map((t: any) => t.name).join(", ");
        summaryParts.push(`Tables: ${tables}`);
    }
    if (content.technology_stack) {
        const stack = Object.values(content.technology_stack).flat().slice(0, 5).join(", ");
        summaryParts.push(`Tech: ${stack}`);
    }

    return summaryParts.length > 0 
        ? `Source artifact (${sourceStepId}) now contains:\n${summaryParts.map(p => `- ${p}`).join("\n")}`
        : "";
}

/**
 * Build projected context - only include what the target artifact actually needs
 */
function buildProjectedContext(
    targetStepId: string,
    allArtifacts: Record<string, any>,
    isCascading: boolean
): string {
    // Define what each artifact type ACTUALLY needs from its dependencies
    const projections: Record<string, Record<string, (content: any) => string>> = {
        arch_design: {
            pm_spec: (c) => `Requirements: ${c.summary || "N/A"}\nKey Stories: ${c.user_stories?.slice(0, 3).map((s: any) => s.title).join(", ") || "N/A"}`
        },
        security_architecture: {
            pm_spec: (c) => `Project: ${c.summary || "N/A"}`,
            arch_design: (c) => `APIs: ${c.apis?.slice(0, 5).map((a: any) => `${a.method} ${a.path}`).join(", ") || "N/A"}\nTables: ${c.database_schema?.tables?.map((t: any) => t.name).join(", ") || "N/A"}\nStack: ${Object.values(c.technology_stack || {}).flat().slice(0, 6).join(", ")}`
        },
        devops_infrastructure: {
            pm_spec: (c) => `Project: ${c.summary || "N/A"}`,
            arch_design: (c) => `Stack: ${Object.values(c.technology_stack || {}).flat().join(", ")}\nScalability: ${c.scalability_approach?.horizontal_scaling || "N/A"}`,
            security_architecture: (c) => `Auth: ${c.security_architecture?.authentication?.method || "JWT"}\nEncryption: ${c.security_architecture?.encryption?.at_rest || "AES-256"}\nCompliance: ${c.compliance?.frameworks?.join(", ") || "Standard"}`
        },
        ui_design: {
            pm_spec: (c) => `Project: ${c.summary || "N/A"}\nStories: ${c.user_stories?.slice(0, 4).map((s: any) => s.title).join(", ") || "N/A"}`,
            arch_design: (c) => `Stack: ${c.technology_stack?.frontend?.join(", ") || "React"}`
        },
        engineer_impl: {
            pm_spec: (c) => `Project: ${c.summary || "N/A"}`,
            arch_design: (c) => `Stack: ${Object.values(c.technology_stack || {}).flat().join(", ")}\nAPIs: ${c.apis?.length || 0} endpoints\nTables: ${c.database_schema?.tables?.length || 0}`,
            security_architecture: (c) => `Auth: ${c.security_architecture?.authentication?.method || "JWT"}`,
            devops_infrastructure: (c) => `Cloud: ${c.cloud_provider || "AWS"}\nDeploy: ${c.deployment?.strategy || "Blue/Green"}`,
            ui_design: (c) => `Components: ${c.component_hierarchy?.organisms?.slice(0, 5).join(", ") || "N/A"}`
        },
        qa_verification: {
            pm_spec: (c) => `Stories: ${c.user_stories?.map((s: any) => s.title).join(", ") || "N/A"}\nAcceptance: ${c.acceptance_criteria?.length || 0} criteria`,
            arch_design: (c) => `APIs: ${c.apis?.map((a: any) => `${a.method} ${a.path}`).join(", ") || "N/A"}`,
            engineer_impl: (c) => `Commands: ${c.run_results?.map((r: any) => r.command).join(", ") || "N/A"}`,
            security_architecture: (c) => `Threats: ${c.threat_model?.slice(0, 3).map((t: any) => t.threat).join(", ") || "N/A"}`,
            ui_design: (c) => `Components: ${c.component_hierarchy?.organisms?.slice(0, 5).join(", ") || "N/A"}`
        }
    };

    const targetProjections = projections[targetStepId] || {};
    const contextParts: string[] = [];
    let totalChars = 0;

    for (const [depId, projector] of Object.entries(targetProjections)) {
        if (totalChars >= MAX_CONTEXT_CHARS) break;

        const artifact = allArtifacts[depId];
        if (!artifact?.content) continue;

        try {
            const projected = projector(artifact.content);
            if (projected && projected.length > 0) {
                const entry = `[${depId.toUpperCase()}]\n${projected}`;
                if (totalChars + entry.length <= MAX_CONTEXT_CHARS) {
                    contextParts.push(entry);
                    totalChars += entry.length;
                }
            }
        } catch (e) {
            logger.warn(`Failed to project ${depId} for ${targetStepId}`, { error: (e as Error).message });
        }
    }

    return contextParts.join("\n\n");
}

/**
 * Compress the current artifact for refinement context
 * Keep structure but trim verbose fields
 */
function compressArtifactForRefinement(stepId: string, content: any): string {
    if (!content) return "{}";

    const compressed = JSON.parse(JSON.stringify(content));

    // Step-specific compression
    switch (stepId) {
        case "pm_spec":
            // User stories: keep titles and IDs, trim descriptions
            if (compressed.user_stories?.length > 5) {
                compressed.user_stories = compressed.user_stories.map((s: any, i: number) => ({
                    ...s,
                    description: i < 3 ? s.description : `[${s.description?.substring(0, 50)}...]`,
                    acceptance_criteria: i < 3 ? s.acceptance_criteria : [`[${s.acceptance_criteria?.length || 0} criteria]`]
                }));
            }
            break;

        case "arch_design":
            // APIs: keep method/path, trim schemas for most
            if (compressed.apis?.length > 5) {
                compressed.apis = compressed.apis.map((a: any, i: number) => ({
                    ...a,
                    request_schema: i < 3 ? a.request_schema : "[schema omitted]",
                    response_schema: i < 3 ? a.response_schema : "[schema omitted]"
                }));
            }
            // Design doc: truncate if very long
            if (compressed.design_doc?.length > 1500) {
                compressed.design_doc = compressed.design_doc.substring(0, 1500) + "\n[... truncated for context ...]";
            }
            break;

        case "engineer_impl":
            // Implementation plan: truncate
            if (compressed.implementation_plan?.length > 1000) {
                compressed.implementation_plan = compressed.implementation_plan.substring(0, 1000) + "\n[... truncated ...]";
            }
            // File structure: keep top-level only
            if (compressed.file_structure && typeof compressed.file_structure === "object") {
                const keys = Object.keys(compressed.file_structure);
                if (keys.length > 10) {
                    compressed.file_structure = { _note: `[${keys.length} directories - showing top 10]`, ...Object.fromEntries(keys.slice(0, 10).map(k => [k, compressed.file_structure[k]])) };
                }
            }
            break;

        case "qa_verification":
            // Test cases: keep IDs and titles, trim gherkin for most
            if (compressed.test_cases?.length > 8) {
                compressed.test_cases = compressed.test_cases.map((t: any, i: number) => ({
                    ...t,
                    gherkin: i < 4 ? t.gherkin : "[gherkin omitted]",
                    preconditions: i < 4 ? t.preconditions : "[omitted]"
                }));
            }
            break;

        case "security_architecture":
            // Threat model: keep first 5 full, summarize rest
            if (compressed.threat_model?.length > 5) {
                compressed.threat_model = [
                    ...compressed.threat_model.slice(0, 5),
                    { _note: `[+${compressed.threat_model.length - 5} more threats]` }
                ];
            }
            break;

        case "ui_design":
            // Component specs: keep first 5 detailed
            if (compressed.component_specs?.length > 5) {
                compressed.component_specs = [
                    ...compressed.component_specs.slice(0, 5),
                    { _note: `[+${compressed.component_specs.length - 5} more components]` }
                ];
            }
            break;
    }

    const result = JSON.stringify(compressed, null, 2);
    
    // Final safety check
    if (result.length > MAX_CURRENT_ARTIFACT_CHARS) {
        logger.warn(`Artifact ${stepId} still too large after compression (${result.length} chars), hard truncating`);
        return result.substring(0, MAX_CURRENT_ARTIFACT_CHARS) + "\n... [truncated for context - full artifact will be preserved in output]";
    }

    return result;
}

/**
 * Dependency graph (what each artifact depends on)
 * Used for cascading refinement and context building
 */
export const ARTIFACT_DEPENDENCIES: Record<string, string[]> = {
    pm_spec: [], // PM spec is the root, no dependencies
    arch_design: ["pm_spec"],
    security_architecture: ["arch_design", "pm_spec"],
    devops_infrastructure: ["arch_design", "pm_spec", "security_architecture"],
    ui_design: ["arch_design", "pm_spec"],
    engineer_impl: ["arch_design", "pm_spec", "ui_design", "security_architecture", "devops_infrastructure"],
    qa_verification: ["engineer_impl", "arch_design", "pm_spec", "ui_design", "security_architecture", "devops_infrastructure"],
};

/**
 * Get artifacts that are related to the target artifact based on dependencies
 * @deprecated Use buildProjectedContext for refinement prompts instead
 */
function getRelatedArtifacts(
    targetStepId: string,
    allArtifacts: Record<string, any>,
    instruction?: string
): Record<string, any> {
    const related: Record<string, any> = {};
    const deps = [...(ARTIFACT_DEPENDENCIES[targetStepId] || [])];

    // If this is a synchronization/alignment request, add the source of the alignment to context
    if (instruction && (instruction.includes("refined with") || instruction.includes("alignment"))) {
        const match = instruction.match(/'([^']+)'/);
        if (match && match[1] && allArtifacts[match[1]]) {
            deps.push(match[1]);
        }
    }

    for (const depId of deps) {
        if (allArtifacts[depId]) {
            related[depId] = sanitizeArtifactForContext(depId, allArtifacts[depId]);
        }
    }

    return related;
}

/**
 * Applies an atomic action to a JSON object
 */
export function applyAtomicAction(content: any, action: string, params: any): any {
    const newContent = JSON.parse(JSON.stringify(content)); // Deep clone
    const path = params.path;

    // Helper to resolve nested path
    const resolvePath = (obj: any, path: string) => {
        const parts = path.split('.');
        let current = obj;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!(part in current)) {
                current[part] = isNaN(Number(parts[i+1])) ? {} : [];
            }
            current = current[part];
        }
        return { parent: current, lastKey: parts[parts.length - 1] };
    };

    try {
        const { parent, lastKey } = resolvePath(newContent, path);

        switch (action) {
            case "upsert_node":
                parent[lastKey] = params.content;
                break;
            case "append_to_list":
                if (!Array.isArray(parent[lastKey])) {
                    parent[lastKey] = [];
                }
                parent[lastKey].push(params.item);
                break;
            case "delete_node":
                if (Array.isArray(parent)) {
                    parent.splice(Number(lastKey), 1);
                } else {
                    delete parent[lastKey];
                }
                break;
        }
        return newContent;
    } catch (error: any) {
        logger.error(`Failed to apply atomic action ${action} at ${path}: ${error.message}`);
        return content; // Return original on failure
    }
}

/**
 * Orchestrates refinement using atomic actions for maximum reliability
 */
export async function refineWithAtomicActions<T>(
    context: AgentContext,
    role: string,
    schema: any,
    options?: { temperature?: number; cacheId?: string; model?: string }
): Promise<T> {
    const { refinement } = context;
    if (!refinement) throw new Error("Refinement context missing");

    const { generateStructuredWithLLM } = await import("./llm-helper");

    const actionPrompt = `
You are a ${role} refining a JSON artifact.
Instead of rewriting the whole file, you must provide a sequence of ATOMIC ACTIONS to apply the changes.
This ensures 100% reliability and prevents data loss.

USER INSTRUCTION: "${refinement.instruction}"

CURRENT ARTIFACT CONTENT (PREVIEW):
${JSON.stringify(refinement.previous_artifact_content, null, 2).substring(0, 2000)}${JSON.stringify(refinement.previous_artifact_content).length > 2000 ? "... (truncated for prompt)" : ""}

AVAILABLE ACTIONS:
1. **upsert_node**: Update/insert an object at a path (e.g., "user_stories.0")
2. **append_to_list**: Add a new item to an array (e.g., "apis")
3. **delete_node**: Remove a node at a path

TASK:
Analyze the instruction and determine the minimum set of actions needed to implement the change.
Return a list of actions and a summary.
`.trim();

    const ActionSchema = {
        type: "object",
        properties: {
            actions: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        action: { type: "string", enum: ["upsert_node", "append_to_list", "delete_node"] },
                        parameters: { type: "object" }
                    },
                    required: ["action", "parameters"]
                }
            },
            summary: { type: "string" }
        },
        required: ["actions", "summary"]
    };

    const response = await generateStructuredWithLLM<{ actions: any[]; summary: string }>(
        actionPrompt,
        ActionSchema,
        {
            temperature: options?.temperature ?? 0.2,
            cacheId: options?.cacheId,
            role: `${role} Refiner`,
            model: options?.model
        }
    );

    let refinedContent = JSON.parse(JSON.stringify(refinement.previous_artifact_content));
    
    for (const actionItem of response.actions) {
        logger.info(`Applying atomic action: ${actionItem.action}`, { path: actionItem.parameters.path });
        refinedContent = applyAtomicAction(refinedContent, actionItem.action, actionItem.parameters);
    }

    return refinedContent as T;
}

/**
 * Sanitize artifacts to prevent token exhaustion while preserving critical architectural context
 * This is a LEGACY function - prefer buildProjectedContext for refinement
 */
function sanitizeArtifactForContext(stepId: string, artifact: any): any {
    if (!artifact || !artifact.content) return artifact;

    const sanitized = JSON.parse(JSON.stringify(artifact.content));

    // Aggressive step-specific sanitization
    switch (stepId) {
        case "pm_spec":
            // Keep summary, trim user stories to essentials
            if (sanitized.user_stories?.length > 5) {
                sanitized.user_stories = sanitized.user_stories.slice(0, 5).map((s: any) => ({
                    title: s.title,
                    story: s.story,
                    priority: s.priority
                }));
                sanitized._user_stories_note = `[Showing 5 of ${artifact.content.user_stories.length}]`;
            }
            // Remove verbose sections
            delete sanitized.invest_analysis;
            delete sanitized.stakeholders;
            break;

        case "arch_design":
            // Keep APIs summary, trim schemas
            if (sanitized.apis?.length > 5) {
                sanitized.apis = sanitized.apis.slice(0, 5).map((a: any) => ({
                    method: a.method,
                    path: a.path,
                    description: a.description?.substring(0, 100)
                }));
                sanitized._apis_note = `[Showing 5 of ${artifact.content.apis.length}]`;
            }
            // Trim design doc
            if (sanitized.design_doc?.length > 500) {
                sanitized.design_doc = sanitized.design_doc.substring(0, 500) + "...";
            }
            // Keep database table names only
            if (sanitized.database_schema?.tables) {
                sanitized.database_schema.tables = sanitized.database_schema.tables.map((t: any) => ({
                    name: t.name,
                    _columns: `[${t.columns?.length || 0} columns]`
                }));
            }
            break;

        case "engineer_impl":
            // Remove full file contents but keep structure
            if (sanitized.file_contents) {
                const files = Object.keys(sanitized.file_contents);
                sanitized._file_contents_summary = `[${files.length} files: ${files.slice(0, 5).join(", ")}${files.length > 5 ? "..." : ""}]`;
                delete sanitized.file_contents;
            }
            // Trim implementation plan
            if (sanitized.implementation_plan?.length > 500) {
                sanitized.implementation_plan = sanitized.implementation_plan.substring(0, 500) + "...";
            }
            break;
            
        case "ui_design":
            // Keep component names only
            if (sanitized.component_specs?.length > 5) {
                sanitized.component_specs = sanitized.component_specs.slice(0, 5).map((c: any) => ({
                    name: c.name,
                    category: c.category
                }));
                sanitized._components_note = `[Showing 5 of ${artifact.content.component_specs.length}]`;
            }
            break;

        case "security_architecture":
            // Keep threat titles only
            if (sanitized.threat_model?.length > 5) {
                sanitized.threat_model = sanitized.threat_model.slice(0, 5).map((t: any) => ({
                    threat: t.threat,
                    category: t.category,
                    severity: t.severity
                }));
                sanitized._threats_note = `[Showing 5 of ${artifact.content.threat_model.length}]`;
            }
            break;

        case "devops_infrastructure":
            // Keep high-level config
            delete sanitized.iac_templates;
            delete sanitized.pipeline_yaml;
            break;

        case "qa_verification":
            // Keep test case titles only
            if (sanitized.test_cases?.length > 5) {
                sanitized.test_cases = sanitized.test_cases.slice(0, 5).map((t: any) => ({
                    id: t.id,
                    title: t.title,
                    type: t.type
                }));
                sanitized._test_cases_note = `[Showing 5 of ${artifact.content.test_cases.length}]`;
            }
            break;
    }

    return {
        ...artifact,
        content: sanitized
    };
}

/**
 * Determine if the agent should use refinement logic
 */
export function shouldUseRefinement(context: AgentContext): boolean {
    return !!context.refinement;
}

/**
 * Definitions for Atomic JSON Editing Tools
 * These guarantee 100% reliability by moving the logic from LLM to Code
 */
export const ArtifactEditingTools = [
    {
        name: "upsert_node",
        description: "Updates or inserts a specific object at a JSON path. Use this for modifying existing stories, APIs, or settings.",
        parameters: {
            type: "object",
            properties: {
                path: { type: "string", description: "The dot-notation path (e.g., 'user_stories.0')" },
                content: { type: "object", description: "The new data to place at this path" }
            },
            required: ["path", "content"]
        }
    },
    {
        name: "append_to_list",
        description: "Appends a new item to an existing array. Use this for adding new user stories, components, or tasks.",
        parameters: {
            type: "object",
            properties: {
                path: { type: "string", description: "The path to the array (e.g., 'apis')" },
                item: { type: "object", description: "The new item to add" }
            },
            required: ["path", "item"]
        }
    },
    {
        name: "delete_node",
        description: "Removes a specific node or item from the artifact.",
        parameters: {
            type: "object",
            properties: {
                path: { type: "string", description: "The path to delete" }
            },
            required: ["path"]
        }
    }
];
