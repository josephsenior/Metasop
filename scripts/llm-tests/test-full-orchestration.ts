/**
 * Test full MetaSOP orchestration with real LLM provider
 */

import "dotenv/config";

import { MetaSOPOrchestrator } from "../../lib/metasop/orchestrator";
import { getConfig } from "../../lib/metasop/config";
import type { ArchitectBackendArtifact, ProductManagerBackendArtifact, EngineerBackendArtifact, QABackendArtifact } from "../../lib/metasop/types-backend-schema";

async function testFullOrchestration() {
  console.log("🚀 Testing full MetaSOP orchestration...\n");

  const config = getConfig();
  console.log(`📋 Configuration:`);
  console.log(`   - LLM Provider: ${config.llm.provider}`);
  console.log(`   - Model: ${config.llm.model || "default"}`);
  console.log(`   - Enabled Agents: ${config.agents.enabled.join(", ")}\n`);

  const orchestrator = new MetaSOPOrchestrator();
  
  const testRequest = "Build a todo app with user authentication and database storage";
  
  console.log(`📝 User Request: "${testRequest}"\n`);
  console.log("⏳ Starting orchestration...\n");
  console.log("─".repeat(60));

  try {
    const startTime = Date.now();
    
    const result = await orchestrator.run(
      testRequest,
      {
        includeAPIs: true,
        includeDatabase: true,
        includeStateManagement: true,
      }
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("\n" + "─".repeat(60));
    console.log(`✅ Orchestration completed in ${duration}s\n`);

    // Display results
    console.log("📊 Results:\n");
    
    console.log("1️⃣  Product Manager:");
    const pmContent = result.artifacts.pm_spec?.content as ProductManagerBackendArtifact | undefined;
    console.log(`   - User Stories: ${pmContent?.user_stories?.length || 0}`);
    if (pmContent?.user_stories && pmContent.user_stories.length > 0) {
      const firstStory = pmContent.user_stories[0];
      if (typeof firstStory === "object" && firstStory !== null) {
        console.log(`   - First Story: ${firstStory.title}`);
      }
    }

    console.log("\n2️⃣  Architect:");
    const archContent = result.artifacts.arch_design?.content as ArchitectBackendArtifact | undefined;
    console.log(`   - Design Doc: ${archContent?.design_doc ? "✓" : "✗"}`);
    console.log(`   - API Endpoints: ${archContent?.apis?.length || 0}`);
    console.log(`   - Database Tables: ${archContent?.database_schema?.tables?.length || 0}`);
    console.log(`   - Decisions: ${archContent?.decisions?.length || 0}`);
    console.log(`   - Next Tasks: ${archContent?.next_tasks?.length || 0}`);

    console.log("\n3️⃣  Engineer:");
    const engContent = result.artifacts.engineer_impl?.content as EngineerBackendArtifact | undefined;
    console.log(`   - Implementation Plan: ${engContent?.implementation_plan ? "✓" : "✗"}`);
    console.log(`   - File Structure: ${engContent?.file_structure ? "✓" : "✗"}`);
    console.log(`   - Dependencies: ${engContent?.dependencies?.length || 0}`);
    if (engContent?.dependencies && engContent.dependencies.length > 0) {
      console.log(`   - Sample Dependencies: ${engContent.dependencies.slice(0, 3).join(", ")}`);
    }

    console.log("\n4️⃣  UI Designer:");
    const uiContent = result.artifacts.ui_design?.content as any;
    console.log(`   - Component Hierarchy: ${uiContent?.component_hierarchy ? "✓" : "✗"}`);
    console.log(`   - Design Tokens: ${uiContent?.design_tokens ? "✓" : "✗"}`);

    console.log("\n5️⃣  QA:");
    const qaContent = result.artifacts.qa_verification?.content as QABackendArtifact | undefined;
    console.log(`   - OK Status: ${qaContent?.ok ? "✓" : "✗"}`);
    console.log(`   - Planned Test Cases: ${qaContent?.test_cases?.length || 0}`);
    const hasGherkin = qaContent?.test_cases?.some((t) => typeof t.gherkin === "string" && t.gherkin.length > 0);
    console.log(`   - Gherkin Cases: ${hasGherkin ? "✓" : "✗"}`);

    console.log("\n📈 Report:");
    console.log(`   - Total Steps: ${result.report.events.length}`);
    console.log(`   - Successful: ${result.report.events.filter(e => e.status === "success").length}`);
    console.log(`   - Failed: ${result.report.events.filter(e => e.status === "error").length}`);
    console.log(`   - Duration: ${(result.report as any).durationMs || (result.report as any).duration_ms || "N/A"}ms`);

    console.log("\n🎉 Full orchestration test completed successfully!");
    console.log("\n💡 The system is ready to generate diagrams with real LLM-powered agents!");

  } catch (error: any) {
    console.error("\n❌ Orchestration failed:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

// Run the test
testFullOrchestration();
