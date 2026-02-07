/**
 * Layer 2: Batch Updater
 * 
 * Applies changes from the EditPlan in a single atomic LLM call.
 * Uses strict JSON schema enforcement to prevent hallucination.
 */

import { generateWithLLM } from "../utils/llm-helper";
import { EditPlan, RefinementOutput } from "./types";

const BATCH_UPDATER_PROMPT = `You are a precise software artifact editor. Apply the requested changes to the artifacts.

## EDIT PLAN
{edit_plan}

## CURRENT ARTIFACTS
{current_artifacts}

## INSTRUCTIONS
1. Apply ONLY the changes specified in the Edit Plan
2. For each edit, identify the exact field_path and provide the minimal delta update (patch)
3. Generate a changelog entry for each change you make

## OUTPUT FORMAT
Return a JSON object with:
{
  "patches": {
    "<artifact_name>": [
      { "path": "dot.notation.path", "value": <new_data>, "op": "set" | "add" | "remove" }
    ]
  },
  "changelog": [
    { "artifact": "name", "field": "path", "change": "human-readable description" }
  ]
}

## PATCH RULES
- path: Use dot notation for nested objects (e.g., "database_schema.tables[0].columns")
- op: "set" to update/replace value, "add" to append to array, "remove" to delete from array
- value: The new value for the field. For "remove", value is index or null.

IMPORTANT: Respond ONLY with valid JSON. Use minimal patches to save tokens. Do NOT return the full artifact.`;

/**
 * Normalizes artifact keys for consistent naming
 */
function normalizeArtifactKey(key: string): string {
    const mapping: Record<string, string> = {
        "pm_spec": "product_manager",
        "arch_design": "architect",
        "ui_design": "ui_designer",
        "security_architecture": "security",
        "devops_infrastructure": "devops",
        "qa_verification": "qa",
        "engineer_impl": "engineer"
    };
    return mapping[key] || key;
}

/**
 * Denormalizes artifact keys back to backend format
 */
function denormalizeArtifactKey(key: string): string {
    const mapping: Record<string, string> = {
        "product_manager": "pm_spec",
        "architect": "arch_design",
        "ui_designer": "ui_design",
        "security": "security_architecture",
        "devops": "devops_infrastructure",
        "qa": "qa_verification",
        "engineer": "engineer_impl"
    };
    return mapping[key] || key;
}

/**
 * Deeply applies a patch to an object using dot/bracket notation
 */
function applyPatch(obj: any, path: string, value: any, op: "set" | "add" | "remove"): void {
    const parts = path.split(/[.\[\]]+/).filter(Boolean);
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        const nextPart = parts[i + 1];
        
        // If next part is a number, current part should be an array
        const isNextArray = !isNaN(Number(nextPart));

        if (!(part in current)) {
            current[part] = isNextArray ? [] : {};
        }
        current = current[part];
    }

    const lastPart = parts[parts.length - 1];

    if (op === "set") {
        current[lastPart] = value;
    } else if (op === "add") {
        if (!Array.isArray(current[lastPart])) {
            current[lastPart] = [];
        }
        current[lastPart].push(value);
    } else if (op === "remove") {
        if (Array.isArray(current)) {
            current.splice(Number(lastPart), 1);
        } else if (current[lastPart] && Array.isArray(current[lastPart])) {
             const idx = typeof value === 'number' ? value : 0;
             current[lastPart].splice(idx, 1);
        } else {
            delete current[lastPart];
        }
    }
}

/**
 * Layer 2: Apply batch updates based on EditPlan
 */
export async function applyBatchUpdate(
    editPlan: EditPlan,
    currentArtifacts: Record<string, any>
): Promise<RefinementOutput> {
    // Normalize artifact keys for LLM
    const normalizedArtifacts: Record<string, any> = {};
    for (const [key, value] of Object.entries(currentArtifacts)) {
        if (value) {
            normalizedArtifacts[normalizeArtifactKey(key)] = value;
        }
    }

    const prompt = BATCH_UPDATER_PROMPT
        .replace("{edit_plan}", JSON.stringify(editPlan, null, 2))
        .replace("{current_artifacts}", JSON.stringify(normalizedArtifacts, null, 2));

    const response = await generateWithLLM(prompt, {
        temperature: 0.1, // Very low for precise execution
        role: "Batch Updater",
        model: "gemini-3-flash-preview", // Use Flash for efficiency and speed
    });

    try {
        // Clean up response
        let cleanResponse = response.trim();
        if (cleanResponse.startsWith("```json")) {
            cleanResponse = cleanResponse.slice(7);
        }
        if (cleanResponse.startsWith("```")) {
            cleanResponse = cleanResponse.slice(3);
        }
        if (cleanResponse.endsWith("```")) {
            cleanResponse = cleanResponse.slice(0, -3);
        }

        const output: RefinementOutput = JSON.parse(cleanResponse.trim());

        // Validate structure - support both old and new format for transition
        if (!output.changelog || (!output.updated_artifacts && !output.patches)) {
            throw new Error("Invalid output structure: missing updates/patches or changelog");
        }

        const updatedArtifacts: Record<string, any> = {};

        // 1. Process legacy "full replacement" if present
        if (output.updated_artifacts) {
            for (const [key, value] of Object.entries(output.updated_artifacts)) {
                updatedArtifacts[denormalizeArtifactKey(key)] = value;
            }
        }

        // 2. Process modern "delta patches" (Highly Preferred)
        if (output.patches) {
            for (const [key, patches] of Object.entries(output.patches)) {
                const backendKey = denormalizeArtifactKey(key);
                // Create a deep clone to avoid mutating original context until merged
                const artifact = JSON.parse(JSON.stringify(currentArtifacts[backendKey] || {}));
                
                for (const patch of patches) {
                    try {
                        applyPatch(artifact, patch.path, patch.value, patch.op);
                    } catch (e) {
                        console.warn(`[Batch Updater] Failed to apply patch to ${key}: ${patch.path}`, e);
                    }
                }
                updatedArtifacts[backendKey] = artifact;
            }
        }

        return {
            updated_artifacts: updatedArtifacts,
            changelog: output.changelog
        };
    } catch (error: any) {
        console.error("[Batch Updater] Failed to parse output:", error.message);
        console.error("[Batch Updater] Raw response:", response);

        // Return empty result on failure
        return {
            updated_artifacts: {},
            changelog: [{
                artifact: "error",
                field: "parsing",
                change: `Failed to apply changes: ${error.message}`
            }]
        };
    }
}

/**
 * Merges updated artifacts with original artifacts
 * Only updates fields that were returned, preserves others
 */
export function mergeArtifacts(
    original: Record<string, any>,
    updates: Record<string, any>
): Record<string, any> {
    const merged = { ...original };

    for (const [key, updatedArtifact] of Object.entries(updates)) {
        if (merged[key]) {
            // Deep merge: updated artifact takes precedence
            merged[key] = {
                ...merged[key],
                ...updatedArtifact
            };
        } else {
            // New artifact
            merged[key] = updatedArtifact;
        }
    }

    return merged;
}
