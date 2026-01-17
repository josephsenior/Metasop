import type { AgentContext } from "../types";
import { logger } from "./logger";

/**
 * Build a refinement prompt that includes:
 * 1. The current artifact content being refined
 * 2. Related artifacts for context
 * 3. The refinement instruction
 * 4. Guidance to modify existing content rather than regenerate
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

    logger.info(`Building refinement prompt for ${role}`, {
        targetStepId: refinement.target_step_id,
        instruction: refinement.instruction.substring(0, 100),
    });

    // Get related artifacts based on knowledge graph dependencies
    // During synchronization/alignment, we also include the target of the alignment
    const relatedArtifacts = getRelatedArtifacts(
        refinement.target_step_id,
        previous_artifacts,
        refinement.instruction
    );

    // Build context section with related artifacts
    let contextSection = "";
    if (Object.keys(relatedArtifacts).length > 0) {
        contextSection = `\n=== RELATED ARTIFACTS FOR CONTEXT ===\n`;
        for (const [stepId, artifact] of Object.entries(relatedArtifacts)) {
            contextSection += `\n--- ${stepId.toUpperCase()} ---\n`;
            contextSection += JSON.stringify(artifact.content, null, 2);
            contextSection += `\n`;
        }
    }

    const isCascading = refinement.instruction.includes("upstream artifact") || refinement.instruction.includes("alignment");

    const prompt = `You are a ${role} performing a REFINEMENT of an existing artifact.

=== REFINEMENT TYPE ===
${isCascading ? "CASCADING ALIGNMENT (Upstream changes detected)" : "DIRECT USER INSTRUCTION"}

=== REFINEMENT INSTRUCTION ===
${refinement.instruction}

=== CURRENT ARTIFACT CONTENT ===
${JSON.stringify(refinement.previous_artifact_content, null, 2)}
${contextSection}
=== REFINEMENT GUIDELINES ===
${basePromptGuidelines}

CRITICAL REFINEMENT RULES:
1. **START WITH EXISTING**: Begin with the current artifact content shown above. Do NOT start from scratch.
2. **INCREMENTAL CHANGES**: Make targeted modifications based on the refinement instruction.
3. ${isCascading ? "**SYNCHRONIZE**: This is a ripple-effect update. Focus on updating references, schemas, APIs, or logic that must change to stay in sync with the updated upstream artifacts. Ensure cross-artifact consistency." : "**EVOLVE**: Implement the new features or changes requested by the user while maintaining consistency with the overall project vision."}
4. **PRESERVE QUALITY**: Do NOT delete existing high-quality sections unless they are directly contradicted by the new requirements or architectural changes.
5. **TECHNICAL COHERENCE**: Ensure the refined artifact is technically sound and aligns perfectly with the related artifacts provided in the context.
6. **COMPLETE OUTPUT**: Return the FULL refined artifact in valid JSON format, matching the expected schema perfectly.

Your goal is to produce a refined, consistent, and high-quality version of the existing artifact.`;

    return prompt;
}

/**
 * Get artifacts that are related to the target artifact based on dependencies
 */
function getRelatedArtifacts(
    targetStepId: string,
    allArtifacts: Record<string, any>,
    instruction?: string
): Record<string, any> {
    // Define dependency graph (what each artifact depends on)
    const dependencies: Record<string, string[]> = {
        arch_design: ["pm_spec"],
        devops_infrastructure: ["arch_design", "pm_spec", "security_architecture"],
        security_architecture: ["arch_design", "pm_spec"],
        engineer_impl: ["arch_design", "pm_spec", "ui_design", "security_architecture", "devops_infrastructure"],
        ui_design: ["arch_design", "pm_spec"],
        qa_verification: ["engineer_impl", "arch_design", "pm_spec", "ui_design", "security_architecture", "devops_infrastructure"],
        pm_spec: [], // PM spec is the root, no dependencies
    };

    const related: Record<string, any> = {};
    const deps = [...(dependencies[targetStepId] || [])];

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
    options?: { temperature?: number; cacheId?: string }
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
            role: `${role} Refiner`
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
 */
function sanitizeArtifactForContext(stepId: string, artifact: any): any {
    if (!artifact || !artifact.content) return artifact;

    const sanitized = { ...artifact.content };

    // Step-specific sanitization
    switch (stepId) {
        case "engineer_impl":
            // Remove full file contents but keep structure and high-level logic
            if (sanitized.file_contents) {
                const files = Object.keys(sanitized.file_contents);
                sanitized.file_contents_summary = `[${files.length} files generated: ${files.slice(0, 5).join(", ")}${files.length > 5 ? "..." : ""}]`;
                delete sanitized.file_contents;
            }
            break;
            
        case "ui_design":
            // Keep layout and components, but maybe trim very large CSS/styling details if they exist
            if (sanitized.components && Array.isArray(sanitized.components) && sanitized.components.length > 10) {
                sanitized.components = sanitized.components.slice(0, 10);
                sanitized.components_note = `[Truncated for context: showing 10 of ${artifact.content.components.length} components]`;
            }
            break;

        case "pm_spec":
            // Keep everything, usually small enough
            break;

        default:
            // For others, we might want to limit depth or size if they grow too large
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
