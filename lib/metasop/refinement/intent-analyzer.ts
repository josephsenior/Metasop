/**
 * Layer 1: Intent Analyzer
 * 
 * Analyzes user refinement requests and produces a structured EditPlan
 * with field-level changes and cascading effects.
 * 
 * The LLM acts as the "knowledge graph" - understanding semantic relationships
 * between artifact fields dynamically rather than using a static dependency graph.
 */

import { generateWithLLM } from "../utils/llm-helper";
import { EditPlan, RefinementContext } from "./types";

const INTENT_ANALYZER_PROMPT = `You are an expert software architect analyzing a user's refinement request.

## YOUR TASK
Analyze the user's request and produce a precise EditPlan that specifies:
1. Which artifact fields need to change
2. What the changes should be
3. Which other fields are affected by these changes (cascading effects)

## ARTIFACTS CONTEXT
The project has these artifact types:
- product_manager: User stories, acceptance criteria, SWOT analysis
- architect: APIs, database schema, tech stack, ADRs (decisions)
- ui_designer: Design tokens, components, layouts, accessibility
- security: Threat model, authentication, encryption, compliance
- devops: Infrastructure, CI/CD, deployment, monitoring
- qa: Test strategies, test cases, coverage metrics
- engineer: Implementation plan, dependencies, file structure

## RULES
1. Be PRECISE with field_path. Use dot notation and array indices (e.g., "apis[0].auth_required")
2. Only include fields that ACTUALLY need to change
3. For cascading_effects, only include fields that are SEMANTICALLY dependent on the primary edit
4. Do NOT cascade to unrelated fields just because they're in the same artifact
5. Provide clear reasoning for why each change is needed

## CURRENT ARTIFACTS (Summarized)
{artifacts_summary}

## CHAT HISTORY (if any)
{chat_history}

## USER REQUEST
"{intent}"

## OUTPUT FORMAT
Return a JSON object with this exact structure:
{
  "reasoning": "Explain your understanding of what the user wants and why these changes are needed",
  "edits": [
    {
      "artifact": "artifact_name",
      "field_path": "path.to.field",
      "action": "add" | "update" | "remove",
      "new_value": <optional: the new value if known>,
      "cascading_effects": [
        {
          "artifact": "affected_artifact",
          "field_path": "path.to.affected.field",
          "action": "update" | "validate",
          "reason": "Why this field is affected"
        }
      ]
    }
  ]
}

Respond ONLY with valid JSON, no markdown code blocks.`;

/**
 * Generates a concise summary of artifacts for the prompt.
 * Avoids sending full JSON to save tokens.
 */
function summarizeArtifacts(artifacts: Record<string, any>): string {
    const summaries: string[] = [];

    for (const [name, artifact] of Object.entries(artifacts)) {
        if (!artifact) continue;

        const summary: string[] = [`### ${name}`];

        // Extract key info based on artifact type
        if (name === "product_manager" || name === "pm_spec") {
            const pm = artifact;
            summary.push(`- User Stories: ${pm.user_stories?.length || 0}`);
            summary.push(`- Acceptance Criteria: ${pm.acceptance_criteria?.length || 0}`);
            if (pm.user_stories?.slice?.(0, 3)) {
                summary.push(`- Stories: ${pm.user_stories.slice(0, 3).map((s: any) => s.title || s.story || "Untitled").join(", ")}`);
            }
        }

        if (name === "architect" || name === "arch_design") {
            const arch = artifact;
            summary.push(`- APIs: ${arch.apis?.length || 0}`);
            summary.push(`- DB Tables: ${arch.database_schema?.tables?.length || 0}`);
            summary.push(`- Decisions: ${arch.decisions?.length || 0}`);
            if (arch.apis?.slice?.(0, 3)) {
                summary.push(`- Endpoints: ${arch.apis.slice(0, 3).map((a: any) => `${a.method || "GET"} ${a.path || a.endpoint}`).join(", ")}`);
            }
        }

        if (name === "security" || name === "security_architecture") {
            const sec = artifact;
            summary.push(`- Threats: ${sec.threat_model?.length || 0}`);
            summary.push(`- Auth Methods: ${sec.authentication?.methods?.join?.(", ") || "N/A"}`);
        }

        if (name === "devops" || name === "devops_infrastructure") {
            const devops = artifact;
            summary.push(`- Services: ${devops.infrastructure?.services?.length || 0}`);
            summary.push(`- Pipeline Stages: ${devops.cicd?.pipeline_stages?.length || 0}`);
            summary.push(`- Environments: ${devops.deployment?.environments?.length || 0}`);
        }

        if (name === "qa" || name === "qa_verification") {
            const qa = artifact;
            summary.push(`- Test Cases: ${qa.test_cases?.length || 0}`);
            summary.push(`- Strategies: ${qa.test_strategy ? Object.keys(qa.test_strategy).length : 0}`);
        }

        if (name === "ui_designer" || name === "ui_design") {
            const ui = artifact;
            summary.push(`- Components: ${ui.component_specs?.length || 0}`);
            summary.push(`- Pages: ${ui.website_layout?.pages?.length || 0}`);
            summary.push(`- Tokens: ${ui.design_tokens ? "defined" : "N/A"}`);
        }

        if (name === "engineer" || name === "engineer_impl") {
            const eng = artifact;
            summary.push(`- Implementation Steps: ${eng.implementation_plan?.length || 0}`);
            summary.push(`- Dependencies: ${eng.dependencies?.length || 0}`);
        }

        summaries.push(summary.join("\n"));
    }

    return summaries.join("\n\n");
}

/**
 * Layer 1: Analyze user intent and produce EditPlan
 */
export async function analyzeIntent(context: RefinementContext): Promise<EditPlan> {
    const artifactsSummary = summarizeArtifacts(context.artifacts);

    const prompt = INTENT_ANALYZER_PROMPT
        .replace("{artifacts_summary}", artifactsSummary)
        .replace("{chat_history}", context.chatHistory || "No previous conversation.")
        .replace("{intent}", context.intent);

    const response = await generateWithLLM(prompt, {
        temperature: 0.3, // Balanced: some creativity for reasoning, but structured output
        role: "Intent Analyzer",
        model: "gemini-3-pro-preview", // Use Pro for better reasoning
    });

    // Parse the JSON response
    try {
        // Clean up response if it has markdown code blocks
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

        const editPlan: EditPlan = JSON.parse(cleanResponse.trim());

        // Validate structure
        if (!editPlan.reasoning || !Array.isArray(editPlan.edits)) {
            throw new Error("Invalid EditPlan structure: missing reasoning or edits array");
        }

        return editPlan;
    } catch (error: any) {
        console.error("[Intent Analyzer] Failed to parse EditPlan:", error.message);
        console.error("[Intent Analyzer] Raw response:", response);

        // Return a fallback plan that the batch updater can work with
        return {
            reasoning: `Failed to parse structured plan. User request: "${context.intent}"`,
            edits: [{
                artifact: "unknown",
                field_path: "unknown",
                action: "update",
                cascading_effects: []
            }]
        };
    }
}
