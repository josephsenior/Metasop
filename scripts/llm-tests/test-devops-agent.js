/**
 * Test DevOps Agent - Direct Orchestrator Test
 * Tests DevOps agent structured output and validation
 */

import "dotenv/config";
import { runMetaSOPOrchestration } from "../lib/metasop/orchestrator";
import {
  safeValidateDevOpsArtifact,
  safeValidateProductManagerArtifact,
  safeValidateArchitectArtifact,
} from "../lib/metasop/schemas/artifact-validation";

const testPrompt = "Build a todo application with user authentication, database storage, and REST API endpoints";

async function test() {
  console.log("🧪 DEVOPS AGENT TEST\n");
  console.log("=".repeat(80));
  console.log("📝 Test Prompt:", testPrompt);
  console.log("=".repeat(80));
  console.log("\n⏳ Running MetaSOP orchestration with DevOps agent...\n");

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

    // Test DevOps Artifact
    console.log("\n" + "─".repeat(80));
    console.log("1️⃣  DEVOPS AGENT - Structured JSON Output Test");
    console.log("─".repeat(80));

    const devopsArtifact = result.artifacts?.devops_infrastructure;
    if (!devopsArtifact) {
      console.error("\n❌ DevOps artifact not found!");
      console.log("Available artifacts:", Object.keys(result.artifacts || {}));
      return;
    }

    const devopsContent = devopsArtifact.content || {};
    console.log("\n📋 DevOps Artifact Content:");
    console.log(`   • Cloud Provider: ${devopsContent.infrastructure?.cloud_provider || "N/A"}`);
    console.log(`   • Infrastructure Services: ${devopsContent.infrastructure?.services?.length || 0}`);
    console.log(`   • CI/CD Pipeline Stages: ${devopsContent.cicd?.pipeline_stages?.length || 0}`);
    console.log(`   • CI/CD Tools: ${devopsContent.cicd?.tools?.join(", ") || "N/A"}`);
    console.log(`   • Deployment Strategy: ${devopsContent.deployment?.strategy || "N/A"}`);
    console.log(`   • Deployment Environments: ${devopsContent.deployment?.environments?.length || 0}`);
    console.log(`   • Monitoring Tools: ${devopsContent.monitoring?.tools?.join(", ") || "N/A"}`);
    console.log(`   • Monitoring Metrics: ${devopsContent.monitoring?.metrics?.length || 0}`);
    console.log(`   • Has Containerization: ${!!devopsContent.containerization}`);
    console.log(`   • Has Scaling Config: ${!!devopsContent.scaling}`);

    // Validate with Zod schema
    console.log("\n📋 Validating with Zod schema...");
    const devopsValidation = safeValidateDevOpsArtifact(devopsContent);

    if (devopsValidation.success) {
      console.log("   ✅ Zod validation PASSED");
    } else {
      console.log("   ❌ Zod validation FAILED:");
      devopsValidation.error.errors.slice(0, 10).forEach((error) => {
        console.log(`      • ${error.path.join(".")}: ${error.message}`);
      });
    }

    // Check if LLM was used (structured output)
    const hasLLMGeneratedContent =
      (devopsContent.infrastructure?.services && devopsContent.infrastructure.services.length >= 3) ||
      (devopsContent.cicd?.pipeline_stages && devopsContent.cicd.pipeline_stages.length >= 3) ||
      (devopsContent.deployment?.environments && devopsContent.deployment.environments.length >= 1);

    console.log("\n" + "─".repeat(80));
    console.log("2️⃣  LLM STRUCTURED OUTPUT TEST");
    console.log("─".repeat(80));

    if (hasLLMGeneratedContent) {
      console.log("\n✅ LLM structured output detected:");
      console.log(`   • Infrastructure Services: ${devopsContent.infrastructure?.services?.length || 0} (expected: 3-8)`);
      console.log(`   • CI/CD Pipeline Stages: ${devopsContent.cicd?.pipeline_stages?.length || 0} (expected: 3-5)`);
      console.log(`   • Deployment Environments: ${devopsContent.deployment?.environments?.length || 0} (expected: 1+)`);
      console.log("\n   ✅ DevOps agent is using structured JSON output!");
    } else {
      console.log("\n⚠️  LLM structured output may not have been used:");
      console.log(`   • Infrastructure Services: ${devopsContent.infrastructure?.services?.length || 0} (expected: 3-8)`);
      console.log(`   • CI/CD Pipeline Stages: ${devopsContent.cicd?.pipeline_stages?.length || 0} (expected: 3-5)`);
      console.log("\n   ⚠️  May be using fallback template instead of LLM output");
    }

    // Show sample infrastructure services
    if (devopsContent.infrastructure?.services && devopsContent.infrastructure.services.length > 0) {
      console.log("\n📋 Infrastructure Services:");
      devopsContent.infrastructure.services.slice(0, 5).forEach((service, idx) => {
        console.log(`   ${idx + 1}. ${service.name} (${service.type})`);
        if (service.description) {
          console.log(`      ${service.description}`);
        }
      });
    }

    // Show CI/CD pipeline stages
    if (devopsContent.cicd?.pipeline_stages && devopsContent.cicd.pipeline_stages.length > 0) {
      console.log("\n📋 CI/CD Pipeline Stages:");
      devopsContent.cicd.pipeline_stages.forEach((stage, idx) => {
        console.log(`   ${idx + 1}. ${stage.name}`);
        if (stage.steps && stage.steps.length > 0) {
          stage.steps.slice(0, 3).forEach((step) => {
            console.log(`      - ${step}`);
          });
          if (stage.steps.length > 3) {
            console.log(`      ... and ${stage.steps.length - 3} more steps`);
          }
        }
      });
    }

    // Show deployment environments
    if (devopsContent.deployment?.environments && devopsContent.deployment.environments.length > 0) {
      console.log("\n📋 Deployment Environments:");
      devopsContent.deployment.environments.forEach((env, idx) => {
        console.log(`   ${idx + 1}. ${env.name}`);
        if (env.description) {
          console.log(`      ${env.description}`);
        }
      });
    }

    // Test Orchestrator Steps
    console.log("\n" + "─".repeat(80));
    console.log("3️⃣  ORCHESTRATOR STEPS TEST");
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

    // Check if DevOps step is present
    const devopsStep = steps.find((s) => s.id === "devops_infrastructure" || s.role === "DevOps");
    if (devopsStep) {
      console.log("\n✅ DevOps step found in orchestration");
      console.log(`   Status: ${devopsStep.status}`);
    } else {
      console.log("\n⚠️  DevOps step not found in orchestration steps");
    }

    // Test other agents for comparison
    console.log("\n" + "─".repeat(80));
    console.log("4️⃣  OTHER AGENTS VALIDATION");
    console.log("─".repeat(80));

    const pmArtifact = result.artifacts?.pm_spec;
    if (pmArtifact) {
      const pmValidation = safeValidateProductManagerArtifact(pmArtifact.content || {});
      console.log(`\n   Product Manager: ${pmValidation.success ? "✅ PASSED" : "❌ FAILED"}`);
    }

    const archArtifact = result.artifacts?.arch_design;
    if (archArtifact) {
      const archValidation = safeValidateArchitectArtifact(archArtifact.content || {});
      console.log(`   Architect: ${archValidation.success ? "✅ PASSED" : "❌ FAILED"}`);
    }

    // Summary
    console.log("\n" + "=".repeat(80));
    console.log("📊 SUMMARY");
    console.log("=".repeat(80));

    const allTestsPassed =
      devopsValidation.success &&
      hasLLMGeneratedContent &&
      result.success &&
      steps.every((s) => s.status === "success") &&
      !!devopsStep;

    if (allTestsPassed) {
      console.log("\n✅ ALL TESTS PASSED!");
      console.log("   • DevOps agent uses structured JSON output");
      console.log("   • Artifact structure is valid (Zod validation)");
      console.log("   • LLM generated content detected");
      console.log("   • DevOps step executed successfully");
      console.log("   • All orchestration steps succeeded");
    } else {
      console.log("\n⚠️  SOME TESTS NEED ATTENTION:");
      if (!devopsValidation.success) {
        console.log("   ❌ DevOps artifact Zod validation failed");
      }
      if (!hasLLMGeneratedContent) {
        console.log("   ⚠️  LLM structured output may not be working");
      }
      if (!result.success) {
        console.log("   ❌ Orchestration failed");
      }
      if (!devopsStep) {
        console.log("   ❌ DevOps step not found in orchestration");
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

