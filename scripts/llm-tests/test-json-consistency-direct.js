/**
 * Test JSON Consistency Improvements - Direct Orchestrator Test
 * Tests Product Manager structured output and validation without needing the server
 */

import "dotenv/config";
import { runMetaSOPOrchestration } from "../lib/metasop/orchestrator";
import {
  safeValidateProductManagerArtifact,
  safeValidateArchitectArtifact,
} from "../lib/metasop/schemas/artifact-validation";

const testPrompt = "Build a todo application with user authentication, database storage, and REST API endpoints";

async function test() {
  console.log("🧪 JSON CONSISTENCY IMPROVEMENTS TEST (Direct)\n");
  console.log("=".repeat(80));
  console.log("📝 Test Prompt:", testPrompt);
  console.log("=".repeat(80));
  console.log("\n⏳ Running MetaSOP orchestration...\n");

  try {
    const startTime = Date.now();
    const result = await runMetaSOPOrchestration(testPrompt, {
      includeAPIs: true,
      includeDatabase: true,
      includeStateManagement: true,
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log("=".repeat(80));
    console.log("📊 TEST RESULTS");
    console.log("=".repeat(80));
    console.log(`\n⏱️  Duration: ${duration}s`);
    console.log(`✅ Orchestration Status: ${result.success ? "SUCCESS" : "FAILED"}`);

    // Test Product Manager Artifact
    console.log("\n" + "─".repeat(80));
    console.log("1️⃣  PRODUCT MANAGER AGENT - Structured JSON Output Test");
    console.log("─".repeat(80));

    const pmArtifact = result.artifacts?.pm_spec;
    if (!pmArtifact) {
      console.error("\n❌ Product Manager artifact not found");
      return;
    }

    const pmContent = pmArtifact.content || {};
    console.log("\n📋 Product Manager Artifact Content:");
    console.log(`   • User stories: ${Array.isArray(pmContent.user_stories) ? pmContent.user_stories.length : "N/A"}`);
    console.log(`   • Acceptance criteria: ${Array.isArray(pmContent.acceptance_criteria) ? pmContent.acceptance_criteria.length : "N/A"}`);
    console.log(`   • UI multi-section: ${pmContent.ui_multi_section}`);
    console.log(`   • UI sections: ${pmContent.ui_sections}`);
    console.log(`   • Assumptions: ${Array.isArray(pmContent.assumptions) ? pmContent.assumptions.length : "N/A"}`);
    console.log(`   • Out of scope: ${Array.isArray(pmContent.out_of_scope) ? pmContent.out_of_scope.length : "N/A"}`);

    // Validate with Zod schema
    console.log("\n📋 Validating with Zod schema...");
    const pmValidation = safeValidateProductManagerArtifact(pmContent);

    if (pmValidation.success) {
      console.log("   ✅ Zod validation PASSED");
    } else {
      console.log("   ❌ Zod validation FAILED:");
      pmValidation.error.errors.forEach((error) => {
        console.log(`      • ${error.path.join(".")}: ${error.message}`);
      });
    }

    // Check if LLM was used (structured output)
    const hasLLMGeneratedContent =
      (Array.isArray(pmContent.user_stories) && pmContent.user_stories.length >= 8) ||
      (Array.isArray(pmContent.acceptance_criteria) && pmContent.acceptance_criteria.length >= 12);

    console.log("\n" + "─".repeat(80));
    console.log("2️⃣  LLM STRUCTURED OUTPUT TEST");
    console.log("─".repeat(80));

    if (hasLLMGeneratedContent) {
      console.log("\n✅ LLM structured output detected:");
      console.log(`   • User stories: ${pmContent.user_stories?.length || 0} (expected: 8-12)`);
      console.log(`   • Acceptance criteria: ${pmContent.acceptance_criteria?.length || 0} (expected: 12-18)`);
      console.log("\n   ✅ Product Manager is using structured JSON output!");
    } else {
      console.log("\n⚠️  LLM structured output may not have been used:");
      console.log(`   • User stories: ${pmContent.user_stories?.length || 0} (expected: 8-12)`);
      console.log(`   • Acceptance criteria: ${pmContent.acceptance_criteria?.length || 0} (expected: 12-18)`);
      console.log("\n   ⚠️  May be using fallback template instead of LLM output");
    }

    // Show sample user stories
    if (Array.isArray(pmContent.user_stories) && pmContent.user_stories.length > 0) {
      console.log("\n📋 Sample User Stories:");
      pmContent.user_stories.slice(0, 3).forEach((story, idx) => {
        if (typeof story === "string") {
          console.log(`   ${idx + 1}. "${story.substring(0, 80)}..."`);
        } else if (typeof story === "object" && story.title) {
          console.log(`   ${idx + 1}. "${story.title}"`);
          if (story.priority) console.log(`      Priority: ${story.priority}`);
          if (story.acceptance_criteria) {
            console.log(`      Acceptance Criteria: ${story.acceptance_criteria.length} items`);
          }
        }
      });
    }

    // Test Architect Artifact Validation
    console.log("\n" + "─".repeat(80));
    console.log("3️⃣  ARCHITECT AGENT - Validation Test");
    console.log("─".repeat(80));

    const archArtifact = result.artifacts?.arch_design;
    if (archArtifact) {
      const archContent = archArtifact.content || {};
      console.log("\n📋 Architect Artifact Content:");
      console.log(`   • APIs: ${Array.isArray(archContent.apis) ? archContent.apis.length : "N/A"}`);
      console.log(`   • Decisions: ${Array.isArray(archContent.decisions) ? archContent.decisions.length : "N/A"}`);
      console.log(`   • Database tables: ${archContent.database_schema?.tables?.length || 0}`);

      const archValidation = safeValidateArchitectArtifact(archContent);
      if (archValidation.success) {
        console.log("\n   ✅ Zod validation PASSED");
      } else {
        console.log("\n   ❌ Zod validation FAILED:");
        archValidation.error.errors.slice(0, 5).forEach((error) => {
          console.log(`      • ${error.path.join(".")}: ${error.message}`);
        });
      }
    } else {
      console.log("\n⚠️  Architect artifact not found");
    }

    // Test Orchestrator Steps
    console.log("\n" + "─".repeat(80));
    console.log("4️⃣  ORCHESTRATOR STEPS TEST");
    console.log("─".repeat(80));

    const steps = result.steps || [];
    console.log(`\n📋 Total steps: ${steps.length}`);
    steps.forEach((step, idx) => {
      const status = step.status === "success" ? "✅" : step.status === "failed" ? "❌" : "⏳";
      console.log(`   ${status} Step ${idx + 1}: ${step.role} (${step.status})`);
      if (step.error) {
        console.log(`      Error: ${step.error}`);
      }
    });

    // Summary
    console.log("\n" + "=".repeat(80));
    console.log("📊 SUMMARY");
    console.log("=".repeat(80));

    const allTestsPassed =
      pmValidation.success &&
      hasLLMGeneratedContent &&
      result.success &&
      steps.every((s) => s.status === "success");

    if (allTestsPassed) {
      console.log("\n✅ ALL TESTS PASSED!");
      console.log("   • Product Manager uses structured JSON output");
      console.log("   • Artifact structure is valid (Zod validation)");
      console.log("   • LLM generated content detected");
      console.log("   • All orchestration steps succeeded");
    } else {
      console.log("\n⚠️  SOME TESTS NEED ATTENTION:");
      if (!pmValidation.success) {
        console.log("   ❌ Product Manager artifact Zod validation failed");
      }
      if (!hasLLMGeneratedContent) {
        console.log("   ⚠️  LLM structured output may not be working");
      }
      if (!result.success) {
        console.log("   ❌ Orchestration failed");
      }
      const failedSteps = steps.filter((s) => s.status !== "success");
      if (failedSteps.length > 0) {
        console.log(`   ❌ ${failedSteps.length} step(s) failed`);
      }
    }

    console.log("\n" + "=".repeat(80));
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    if (error.stack) {
      console.error("\nStack trace:", error.stack);
    }
  }
}

// Run test
test().catch(console.error);

