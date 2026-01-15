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
    const relatedArtifacts = getRelatedArtifacts(
        refinement.target_step_id,
        previous_artifacts
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
1. **START WITH EXISTING**: Begin with the current artifact content shown above.
2. **INCREMENTAL CHANGES**: Make targeted modifications based on the refinement instruction.
3. ${isCascading ? "**SYNCHRONIZE**: Focus on updating references, schemas, or logic that must change to stay in sync with the upstream artifact." : "**EVOLVE**: Implement the new features or changes requested by the user while maintaining consistency."}
4. **PRESERVE QUALITY**: Do NOT delete existing high-quality sections unless they are directly contradicted by the new requirements.
5. **COMPLETE OUTPUT**: Return the FULL refined artifact in valid JSON format.

Your task is to enhance and refine the existing artifact, NOT to create it from scratch.`;

    return prompt;
}

/**
 * Get artifacts that are related to the target artifact based on dependencies
 */
function getRelatedArtifacts(
    targetStepId: string,
    allArtifacts: Record<string, any>
): Record<string, any> {
    // Define dependency graph (what each artifact depends on)
    const dependencies: Record<string, string[]> = {
        arch_design: ["pm_spec"],
        devops_infrastructure: ["arch_design", "pm_spec"],
        security_architecture: ["arch_design", "pm_spec"],
        engineer_impl: ["arch_design", "pm_spec"],
        ui_design: ["arch_design", "pm_spec"],
        qa_verification: ["engineer_impl", "arch_design", "pm_spec"],
        pm_spec: [], // PM spec is the root, no dependencies
    };

    const related: Record<string, any> = {};
    const deps = dependencies[targetStepId] || [];

    for (const depId of deps) {
        if (allArtifacts[depId]) {
            let artifactContent = allArtifacts[depId];

            // SANITIZATION: Strip heavy content from Engineer artifact to prevent token exhaustion
            if (depId === "engineer_impl") {
                logger.info("Sanitizing engineer_impl artifact for refinement context");
                const { ...sanitized } = artifactContent.content || artifactContent;
                // Note: file_contents and file_structure are intentionally excluded from sanitized context
                if ((sanitized as any).file_contents) delete (sanitized as any).file_contents;
                if ((sanitized as any).file_structure) delete (sanitized as any).file_structure;
                
                artifactContent = {
                    ...artifactContent,
                    content: sanitized
                };
            }

            related[depId] = artifactContent;
        }
    }

    return related;
}

/**
 * Determine if the agent should use refinement logic
 */
export function shouldUseRefinement(context: AgentContext): boolean {
    return !!context.refinement;
}
