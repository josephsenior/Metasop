
import { MetaSOPOrchestrator } from "./lib/metasop/orchestrator";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
if (fs.existsSync(".env.local")) {
  dotenv.config({ path: ".env.local" });
} else {
  dotenv.config({ path: ".env" });
}

async function runTest() {
  console.log("Starting full MetaSOP orchestration test...");
  console.log("Provider: Gemini");
  console.log("Model: gemini-3-flash-preview");
  console.log("--------------------------------------------------");

  const orchestrator = new MetaSOPOrchestrator();
  const prompt = "Create a modern fitness tracking application with workout plans, social features, and progress analytics.";

  try {
    const result = await orchestrator.run(prompt, {
      includeAPIs: true,
      includeDatabase: true,
      includeStateManagement: true,
    }, (event) => {
      console.log(`[${new Date().toISOString()}] Event: ${event.type} - ${event.step_id || event.role || ""}`);
    });

    console.log("--------------------------------------------------");
    console.log("Orchestration Completed!");
    console.log(`Success: ${result.success}`);
    console.log(`Steps executed: ${result.steps.length}`);
    console.log(`Artifacts generated: ${Object.keys(result.artifacts).join(", ")}`);

    // Save result to a file for inspection
    const outputPath = path.join(process.cwd(), "orchestration-result.json");
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`Full result saved to: ${outputPath}`);

    if (result.success) {
      console.log("\nVerifying artifacts for dummy data...");
      const artifacts = result.artifacts;
      
      // PM Spec verification
      if (artifacts.pm_spec) {
        const pm = artifacts.pm_spec.content;
        console.log(`- PM Spec: ${(pm as any).user_stories?.length || 0} user stories`);
        if (!(pm as any).swot) console.log("  [OK] SWOT is undefined (no dummy data)");
        if (!(pm as any).stakeholders) console.log("  [OK] Stakeholders is undefined (no dummy data)");
      }

      // Architect verification
      if (artifacts.arch_design) {
        const arch = artifacts.arch_design.content;
        console.log(`- Architect: ${(arch as any).apis?.length || 0} APIs`);
        if ((arch as any).decisions?.[0]?.status === undefined) console.log("  [OK] Decision status is undefined (no dummy data)");
      }

      // Engineer verification
      if (artifacts.engineer_impl) {
        const eng = artifacts.engineer_impl.content;
        console.log(`- Engineer: ${Object.keys((eng as any).file_structure || {}).length} root files/folders`);
        if (!(eng as any).technical_patterns) console.log("  [OK] Technical patterns is undefined (no dummy data)");
      }
    }

  } catch (error: any) {
    console.error("Orchestration failed:", error.message);
    if (error.stack) console.error(error.stack);
  }
}

runTest();
