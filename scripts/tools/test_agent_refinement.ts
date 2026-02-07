
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import fs from "fs";
import path from "path";
import { analyzeIntent } from "../../src/lib/metasop/refinement/intent-analyzer";
import { applyBatchUpdate } from "../../src/lib/metasop/refinement/batch-updater";
import { resetLLMProvider } from "../../src/lib/metasop/utils/llm-helper";
import type { ChangelogEntry, Edit, EditPlan } from "../../src/lib/metasop/refinement/types";

// Use Gemini 1.5 Pro for better reasoning in the test if available
process.env.METASOP_LLM_PROVIDER = "gemini";
process.env.METASOP_LLM_MODEL = "gemini-3-pro-preview";
resetLLMProvider();

async function runRefinementTest() {
    console.log("\n🚀 STARTING AGENT REFINEMENT TEST");
    console.log("================================================================================");

    // 1. Load sample artifacts
    const samplePath = path.join(process.cwd(), "saved_diagrams", "cmla160760002v9a4u9vfapwq.json");
    if (!fs.existsSync(samplePath)) {
        console.error("❌ Sample file not found:", samplePath);
        return;
    }

    const diagram = JSON.parse(fs.readFileSync(samplePath, "utf-8"));
    const artifacts = diagram.metadata?.metasop_artifacts || {};
    
    // Extract contents from wrappers
    const artifactContents: Record<string, any> = {};
    // Only include relevant artifacts to keep payload small for this test
    const relevantIds = ["pm_spec", "arch_design", "engineer_impl", "security_architecture"];
    for (const [id, art] of Object.entries(artifacts)) {
        if (relevantIds.includes(id)) {
            artifactContents[id] = (art as any).content || art;
        }
    }

    // 2. Define the refinement intent
    const intent = "Add 2 new user stories: 1. A story for allowing users to export their audit logs as CSV, 2. A story for team collaborations where users can invite others to their workspace. Also update the APIs and implementation plan accordingly.";
    
    console.log(`\n💬 Intent: "${intent}"`);
    console.log(`📦 Included Artifacts: ${Object.keys(artifactContents).join(", ")}`);

    const context = {
        intent,
        artifacts: artifactContents,
        chatHistory: "USER: I need to add some advanced features to the platform.",
        activeTab: "all"
    };

    // 3. Layer 1: Analysis
    console.log("\n🔍 LAYER 1: Analyzing Intent...");
    const startTime1 = Date.now();
    const editPlan = await analyzeIntent(context);
    const duration1 = (Date.now() - startTime1) / 1000;

    console.log(`\n✅ Edit Plan Generated (${duration1.toFixed(2)}s):`);
    console.log(`- Reasoning: ${editPlan.reasoning}`);
    console.log(`- Total Edits: ${editPlan.edits.length}`);
    
    editPlan.edits.forEach((edit: Edit, idx: number) => {
        console.log(`  ${idx + 1}. [${edit.artifact}] ${edit.action} ${edit.field_path}`);
        if (edit.cascading_effects) {
            edit.cascading_effects.forEach((ce) => {
                console.log(`     ↳ Affected: [${ce.artifact}] ${ce.field_path} (${ce.reason})`);
            });
        }
    });

    // 4. Layer 2: Execution
    console.log("\n⚡ LAYER 2: Applying Batch Updates...");
    const startTime2 = Date.now();
    const result = await applyBatchUpdate(editPlan as EditPlan, artifactContents);
    const duration2 = (Date.now() - startTime2) / 1000;

    console.log(`\n✅ Changes Applied (${duration2.toFixed(2)}s):`);
    console.log(`- Changelog (${result.changelog.length} items):`);
    result.changelog.forEach((entry: ChangelogEntry, idx: number) => {
        console.log(`  ${idx + 1}. [${entry.artifact}] ${entry.field}: ${entry.change}`);
    });

    // 5. Validation Check
    console.log("\n📊 VALIDATION:");
    
    // Check PM spec for new stories
    const pm = result.updated_artifacts["pm_spec"] || artifactContents["pm_spec"];
    const stories = pm.user_stories || [];
    console.log(`- User Stories: ${stories.length} (Original: ${artifactContents["pm_spec"]?.user_stories?.length || 0})`);
    
    stories.forEach((s: any, i: number) => {
        console.log(`  Story ${i+1}: ${s.title}`);
    });

    const hasCSV = stories.some((s: any) => 
        s.title?.toLowerCase().includes("csv") || 
        s.title?.toLowerCase().includes("export") ||
        s.story?.toLowerCase().includes("csv")
    );
    const hasInvite = stories.some((s: any) => 
        s.title?.toLowerCase().includes("invite") || 
        s.title?.toLowerCase().includes("collaboration") ||
        s.title?.toLowerCase().includes("team") ||
        s.story?.toLowerCase().includes("invite")
    );
    
    console.log(`  - CSV Story Found: ${hasCSV ? "✅" : "❌"}`);
    console.log(`  - Invite Story Found: ${hasInvite ? "✅" : "❌"}`);

    // Check Architect for new APIs
    const arch = result.updated_artifacts["arch_design"] || artifactContents["arch_design"];
    const apis = arch.apis || [];
    console.log(`- APIs: ${apis.length}`);
    apis.slice(-5).forEach((a: any) => {
        console.log(`  API: ${a.method} ${a.path}`);
    });

    const hasExportApi = apis.some((a: any) => 
        a.path?.toLowerCase().includes("export") || 
        a.path?.toLowerCase().includes("audit") ||
        a.description?.toLowerCase().includes("csv")
    );
    const hasInviteApi = apis.some((a: any) => 
        a.path?.toLowerCase().includes("invite") ||
        a.path?.toLowerCase().includes("team") ||
        a.path?.toLowerCase().includes("workspace")
    );
    
    console.log(`  - Export/CSV API: ${hasExportApi ? "✅" : "❌"}`);
    console.log(`  - Invite/Team API: ${hasInviteApi ? "✅" : "❌"}`);

    // Check DB Schema
    const tables = arch.database_schema?.tables || [];
    console.log(`- DB Tables: ${tables.length}`);
    const hasWorkspaces = tables.some((t: any) => t.name?.toLowerCase().includes("workspace"));
    console.log(`  - Workspaces Table: ${hasWorkspaces ? "✅" : "❌"}`);

    console.log("\n================================================================================");
    console.log("🏁 TEST COMPLETED");
}

runRefinementTest().catch(err => {
    console.error("\n❌ TEST FAILED:");
    console.error(err);
});
