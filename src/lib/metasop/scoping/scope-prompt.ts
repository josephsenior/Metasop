/**
 * Scoping: decide whether to proceed with generation or ask the user
 * clarification questions. The LLM sees the prompt and returns either
 * proceed or a list of questions (id, label, options) for the user to select.
 */

import { generateStructuredWithLLM } from "@/lib/metasop/utils/llm-helper";
import { z } from "zod";

const ScopeQuestionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  options: z.array(z.string()).min(1),
});

const ScopeResponseSchema = z.discriminatedUnion("proceed", [
  z.object({ proceed: z.literal(true) }),
  z.object({
    proceed: z.literal(false),
    needClarification: z.literal(true),
    questions: z.array(ScopeQuestionSchema).min(1).max(5),
  }),
]);

/** JSON schema for LLM structured output (Gemini/Vercel adapters). */
const scopeResponseJsonSchema = {
  type: "object",
  required: ["proceed"],
  properties: {
    proceed: { type: "boolean", description: "True if no clarification needed, false if questions should be asked" },
    needClarification: { type: "boolean", description: "If proceed is false, set to true" },
    questions: {
      type: "array",
      description: "List of clarification questions (id, label, options). Only when proceed is false",
      maxItems: 5,
      items: {
        type: "object",
        required: ["id", "label", "options"],
        properties: {
          id: { type: "string", description: "Unique id for the question (e.g. domain, scale)" },
          label: { type: "string", description: "User-facing question text" },
          options: {
            type: "array",
            description: "List of selectable options (strings)",
            items: { type: "string" },
            minItems: 2,
          },
        },
      },
    },
  },
};

/** Deduplicate and limit options in a question to max 4 items. */
function cleanQuestion(question: ScopeQuestion): ScopeQuestion {
  // Deduplicate: fuzzy match similar strings (case-insensitive)
  const seen = new Set<string>()
  const uniqueOptions = question.options.filter(opt => {
    const normalized = opt.toLowerCase().trim()
    if (seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })

  // Limit to 4 options max (better for scanning)
  const limitedOptions = uniqueOptions.slice(0, 4)

  return {
    ...question,
    options: limitedOptions.length > 0 ? limitedOptions : uniqueOptions,
  }
}

/** Reduce questions array to max 5 and clean each one. */
function cleanQuestions(questions: ScopeQuestion[]): ScopeQuestion[] {
  // Limit total questions to 5 for brevity
  return questions.slice(0, 5).map(cleanQuestion)
}

function buildScopePrompt(prompt: string): string {
  return `You are a product scoping assistant. Given a user's request to generate an architecture diagram or product spec, decide whether you have enough information to proceed, or whether you need to ask a few clarifying questions.

USER REQUEST:
"${prompt}"

RULES:
1. If the request is specific enough (clear domain, scope, tech hints, or product type), respond with { "proceed": true }.
2. If the request is vague or missing key choices (e.g. "build an app", "help me with a project"), respond with { "proceed": false, "needClarification": true, "questions": [...] }.
3. Ask SHORT, focused questions. Each question has: id (snake_case, e.g. "domain"), label (user-facing text, 5-12 words), options (array of selectable strings).
4. Good question ids: domain, scale, platform, priority, tech_preference. Keep options concise (e.g. "E-commerce", "SaaS", "Internal tool").
5. Do NOT ask overlapping questions (avoid "scale" AND "team_size"). Do NOT ask for full spec — only high-level choices that disambiguate.
6. Provide exactly 3-4 options per question, max 5. Options should be distinct and avoid redundancy (don't say "Web App" and "Web Application").

Respond with ONLY a JSON object: either { "proceed": true } or { "proceed": false, "needClarification": true, "questions": [ { "id": "...", "label": "...", "options": ["...", "..."] } ] }.`;
}

export type ScopeQuestion = z.infer<typeof ScopeQuestionSchema>;

export type ScopeResult =
  | { proceed: true }
  | { proceed: false; needClarification: true; questions: ScopeQuestion[] };

/**
 * Decide whether to proceed or return clarification questions for the given prompt.
 */
export async function scopePrompt(prompt: string): Promise<ScopeResult> {
  const raw = await generateStructuredWithLLM<{ proceed: boolean; needClarification?: boolean; questions?: unknown }>(
    buildScopePrompt(prompt),
    scopeResponseJsonSchema,
    { temperature: 0.2, maxTokens: 1024 }
  );

  const parsed = ScopeResponseSchema.safeParse(raw);
  if (!parsed.success) {
    return { proceed: true };
  }

  if (parsed.data.proceed) {
    return { proceed: true };
  }

  const withClarification = parsed.data as { proceed: false; needClarification: true; questions: z.infer<typeof ScopeQuestionSchema>[] };
  const cleanedQuestions = cleanQuestions(withClarification.questions);
  return {
    proceed: false,
    needClarification: true,
    questions: cleanedQuestions,
  };
}
