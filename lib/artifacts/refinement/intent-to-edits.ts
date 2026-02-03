/**
 * Intent-to-edit-ops: LLM layer that turns natural-language refinement intent
 * into structured EditOps. The artifact JSON is the source of truth (codebase role).
 */

import { generateStructuredWithLLM } from "@/lib/metasop/utils/llm-helper";
import { ARTIFACT_IDS, type ArtifactRecord, type EditOp } from "@/lib/artifacts/edit-tools";
import { z } from "zod";

const EditOpSchema = z.discriminatedUnion("tool", [
  z.object({ tool: z.literal("set_at_path"), artifactId: z.string(), path: z.string(), value: z.any() }),
  z.object({ tool: z.literal("delete_at_path"), artifactId: z.string(), path: z.string() }),
  z.object({ tool: z.literal("add_array_item"), artifactId: z.string(), path: z.string(), value: z.any() }),
  z.object({
    tool: z.literal("remove_array_item"),
    artifactId: z.string(),
    path: z.string(),
    index: z.number().int().min(0).optional(),
  }),
]);

const RefinementResponseSchema = z.object({
  edits: z.array(EditOpSchema),
});

/** JSON schema for LLM structured output (Gemini/Vercel adapters). */
const refinementResponseJsonSchema = {
  type: "object",
  required: ["edits"],
  properties: {
    edits: {
      type: "array",
      description: "List of edit operations to apply",
      items: {
        type: "object",
        required: ["tool", "artifactId", "path"],
        properties: {
          tool: {
            type: "string",
            enum: ["set_at_path", "delete_at_path", "add_array_item", "remove_array_item"],
            description: "Edit operation type",
          },
          artifactId: {
            type: "string",
            enum: [...ARTIFACT_IDS],
            description: "Target artifact id",
          },
          path: { type: "string", description: "Dot-notation path (e.g. user_stories.0.title)" },
          value: { description: "Value for set_at_path or add_array_item" },
          index: { type: "integer", minimum: 0, description: "Index for remove_array_item" },
        },
      },
    },
  },
};

function buildRefinementPrompt(intent: string, artifacts: Record<string, ArtifactRecord>): string {
  const artifactIds = ARTIFACT_IDS.join(", ");
  const artifactsJson = JSON.stringify(
    Object.fromEntries(
      Object.entries(artifacts).map(([id, rec]) => [id, { content: rec.content, step_id: rec.step_id, role: rec.role }])
    ),
    null,
    2
  );

  return `You are a refinement assistant. Your job is to turn the user's intent into a list of edit operations on the artifact JSON below.

ARTIFACT IDs (use exactly these for artifactId): ${artifactIds}

PATH FORMAT: Dot-notation for nested keys; array indices as numbers. Examples: "user_stories.0.title", "apis.1.path", "database_schema.tables.2.name".

ALLOWED OPERATIONS:
1. set_at_path — Set a value at path. Fields: tool, artifactId, path, value.
2. delete_at_path — Remove the key or element at path. Fields: tool, artifactId, path.
3. add_array_item — Append an item to the array at path. Fields: tool, artifactId, path, value (the item to add).
4. remove_array_item — Remove an item. Fields: tool, artifactId, path, and optionally index (number).

CURRENT ARTIFACTS (source of truth — use this to locate paths and values):
${artifactsJson}

USER REQUEST: "${intent}"

Respond with a JSON object containing a single key "edits": an array of edit operations. Use only the four operation types above. Use only the artifact IDs listed. Paths must exist or be valid parent paths for new keys/array items. If the request cannot be fulfilled with edits, return an empty "edits" array.`;
}

/**
 * Turn user intent into edit ops using the LLM. Artifacts are the source of truth (codebase role).
 */
export async function intentToEditOps(
  intent: string,
  artifacts: Record<string, ArtifactRecord>
): Promise<EditOp[]> {
  const prompt = buildRefinementPrompt(intent, artifacts);

  const raw = await generateStructuredWithLLM<{ edits: unknown }>(prompt, refinementResponseJsonSchema, {
    temperature: 0.2,
    maxTokens: 4096,
  });

  const parsed = RefinementResponseSchema.safeParse(raw);
  if (!parsed.success) {
    return [];
  }

  const valid: EditOp[] = [];
  for (const op of parsed.data.edits) {
    if (!ARTIFACT_IDS.includes(op.artifactId as (typeof ARTIFACT_IDS)[number])) continue;
    valid.push(op as EditOp);
  }
  return valid;
}
