/**
 * Integration test: orchestration + tool-based refinement (Edit Artifacts API).
 * Refinement is done via predefined edit ops, not agent re-runs.
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { MetaSOPOrchestrator } from "../../lib/metasop/orchestrator";
import { applyEditOps, type ArtifactRecord } from "../../lib/artifacts/edit-tools";
import { resetLLMProvider } from "../../lib/metasop/utils/llm-helper";
import path from "path";
import fs from "fs";

process.env.METASOP_LLM_PROVIDER = "gemini";
process.env.METASOP_LLM_MODEL = "gemini-3-flash-preview";
resetLLMProvider();

async function testToolBasedRefinement() {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`🧪 TOOL-BASED REFINEMENT TEST`);
  console.log(`${"=".repeat(80)}\n`);

  const orchestrator = new MetaSOPOrchestrator();

  // PHASE 1: Initial generation
  console.log(`\n📝 PHASE 1: Initial Generation (Greeting API)`);
  console.log(`${"─".repeat(80)}`);

  const initialPrompt = `Create a tiny Node.js greeting API. One endpoint: GET /hello returns { message: 'Hello' }.`;

  const startTime1 = Date.now();
  const initialResult = await orchestrator.run(
    initialPrompt,
    { includeAPIs: true },
    (event) => {
      if (event.type === "step_start") process.stdout.write(`\n[${event.step_id}] `);
      else if (event.type === "step_complete") process.stdout.write(`✅`);
    }
  );
  const duration1 = (Date.now() - startTime1) / 1000;
  console.log(`\n\n✅ Phase 1 completed in ${duration1.toFixed(2)}s`);

  const outputDir = path.join(process.cwd(), "test_results", "cascade_test");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "phase1_initial.json"), JSON.stringify(initialResult, null, 2));

  // PHASE 2: Tool-based refinement (edit ops)
  console.log(`\n\n🔧 PHASE 2: Tool-based refinement (add_array_item)`);
  console.log(`${"─".repeat(80)}`);

  const previousArtifacts: Record<string, ArtifactRecord> = {};
  for (const [id, art] of Object.entries(initialResult.artifacts || {})) {
    const a = art as { content?: unknown; step_id?: string; role?: string; timestamp?: string };
    previousArtifacts[id] = {
      content: (a?.content && typeof a.content === "object" ? a.content : {}) as Record<string, unknown>,
      step_id: a?.step_id,
      role: a?.role,
      timestamp: a?.timestamp,
    };
  }

  const edits = [
    {
      tool: "add_array_item" as const,
      artifactId: "arch_design" as const,
      path: "apis",
      value: {
        path: "/api/i18n/hello",
        method: "GET",
        description: "I18n hello endpoint",
        request_schema: { lang: "string" },
        response_schema: { message: "string" },
      },
    },
  ];

  const startTime2 = Date.now();
  const editResult = applyEditOps(previousArtifacts, edits);
  const duration2 = (Date.now() - startTime2) / 1000;
  console.log(`\n✅ Phase 2 (tool-based edit) completed in ${duration2.toFixed(2)}s. Applied: ${editResult.applied}, errors: ${editResult.errors?.length ?? 0}`);

  fs.writeFileSync(path.join(outputDir, "phase2_edited.json"), JSON.stringify(editResult, null, 2));

  // PHASE 3: Verify
  console.log(`\n\n📊 VERIFICATION`);
  console.log(`${"=".repeat(80)}`);

  const archApis = (editResult.artifacts.arch_design?.content as Record<string, unknown>)?.apis;
  const hasNewApi = Array.isArray(archApis) && archApis.some((a: unknown) => String((a as { path?: string })?.path).includes("i18n"));

  console.log(`\n🔍 Edit propagation: ${hasNewApi ? "✅ New API added to arch_design" : "❌ Edit not applied"}`);
  console.log(`${"=".repeat(80)}\n`);
}

testToolBasedRefinement().catch(console.error);
