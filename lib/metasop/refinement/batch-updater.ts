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
2. Preserve ALL other fields exactly as they are
3. For each edit, update the specified field_path
4. For cascading_effects, ensure consistency with the primary edit
5. Generate a changelog entry for each change you make

## FIELD PATH NOTATION
- Dot notation for nested objects: "infrastructure.cloud_provider"
- Bracket notation for arrays: "apis[0].path"
- You can add to arrays: "apis[+]" means append
- You can remove from arrays: "apis[-2]" means remove index 2

## OUTPUT FORMAT
Return a JSON object with:
{
  "updated_artifacts": {
    "<artifact_name>": { ...full updated artifact... },
    // Only include artifacts that have changes
  },
  "changelog": [
    { "artifact": "name", "field": "path", "change": "human-readable description" }
  ]
}

IMPORTANT: Return the COMPLETE artifact objects for any artifact you modify.
Respond ONLY with valid JSON, no markdown code blocks.`;

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
        model: "gemini-3-pro-preview", // Use Pro for accurate JSON generation
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

        // Validate structure
        if (!output.updated_artifacts || !output.changelog) {
            throw new Error("Invalid output structure: missing updated_artifacts or changelog");
        }

        // Denormalize artifact keys back to backend format
        const denormalizedArtifacts: Record<string, any> = {};
        for (const [key, value] of Object.entries(output.updated_artifacts)) {
            denormalizedArtifacts[denormalizeArtifactKey(key)] = value;
        }

        return {
            updated_artifacts: denormalizedArtifacts,
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
