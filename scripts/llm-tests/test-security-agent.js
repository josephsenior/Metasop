/**
 * Test Security Agent - Direct Orchestrator Test
 * Tests Security agent structured output and validation
 */

import "dotenv/config";
import { runMetaSOPOrchestration } from "../lib/metasop/orchestrator";
import {
  safeValidateSecurityArtifact,
  safeValidateProductManagerArtifact,
  safeValidateArchitectArtifact,
  safeValidateDevOpsArtifact,
} from "../lib/metasop/schemas/artifact-validation";

const testPrompt = "Build a todo application with user authentication, database storage, and REST API endpoints";

async function test() {
  console.log("🧪 SECURITY AGENT TEST\n");
  console.log("=".repeat(80));
  console.log("📝 Test Prompt:", testPrompt);
  console.log("=".repeat(80));
  console.log("\n⏳ Running MetaSOP orchestration with Security agent...\n");

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

    // Test Security Artifact
    console.log("\n" + "─".repeat(80));
    console.log("1️⃣  SECURITY AGENT - Structured JSON Output Test");
    console.log("─".repeat(80));

    const securityArtifact = result.artifacts?.security_architecture;
    if (!securityArtifact) {
      console.error("\n❌ Security artifact not found!");
      console.log("Available artifacts:", Object.keys(result.artifacts || {}));
      return;
    }

    const securityContent = securityArtifact.content || {};
    console.log("\n📋 Security Artifact Content:");
    console.log(`   • Authentication Method: ${securityContent.security_architecture?.authentication?.method || "N/A"}`);
    console.log(`   • Authorization Model: ${securityContent.security_architecture?.authorization?.model || "N/A"}`);
    console.log(`   • Threats Identified: ${securityContent.threat_model?.length || 0}`);
    console.log(`   • Security Controls: ${securityContent.security_controls?.length || 0}`);
    console.log(`   • Data at Rest Encryption: ${securityContent.encryption?.data_at_rest?.method || "N/A"}`);
    console.log(`   • Data in Transit Encryption: ${securityContent.encryption?.data_in_transit?.method || "N/A"}`);
    console.log(`   • Compliance Standards: ${securityContent.compliance?.length || 0}`);
    console.log(`   • Has Vulnerability Management: ${!!securityContent.vulnerability_management}`);
    console.log(`   • Has Security Monitoring: ${!!securityContent.security_monitoring}`);

    // Validate with Zod schema
    console.log("\n📋 Validating with Zod schema...");
    const securityValidation = safeValidateSecurityArtifact(securityContent);

    if (securityValidation.success) {
      console.log("   ✅ Zod validation PASSED");
    } else {
      console.log("   ❌ Zod validation FAILED:");
      securityValidation.error.errors.slice(0, 10).forEach((error) => {
        console.log(`      • ${error.path.join(".")}: ${error.message}`);
      });
    }

    // Check if LLM was used (structured output)
    const hasLLMGeneratedContent =
      (securityContent.threat_model && securityContent.threat_model.length >= 3) ||
      (securityContent.security_controls && securityContent.security_controls.length >= 5) ||
      (securityContent.security_architecture?.authentication?.method) ||
      (securityContent.encryption?.data_at_rest?.method);

    console.log("\n" + "─".repeat(80));
    console.log("2️⃣  LLM STRUCTURED OUTPUT TEST");
    console.log("─".repeat(80));

    if (hasLLMGeneratedContent) {
      console.log("\n✅ LLM structured output detected:");
      console.log(`   • Threats: ${securityContent.threat_model?.length || 0} (expected: 3+)`);
      console.log(`   • Security Controls: ${securityContent.security_controls?.length || 0} (expected: 5+)`);
      console.log(`   • Authentication: ${securityContent.security_architecture?.authentication?.method || "N/A"}`);
      console.log(`   • Authorization: ${securityContent.security_architecture?.authorization?.model || "N/A"}`);
      console.log("\n   ✅ Security agent is using structured JSON output!");
    } else {
      console.log("\n⚠️  LLM structured output may not have been used:");
      console.log(`   • Threats: ${securityContent.threat_model?.length || 0} (expected: 3+)`);
      console.log(`   • Security Controls: ${securityContent.security_controls?.length || 0} (expected: 5+)`);
      console.log("\n   ⚠️  May be using fallback template instead of LLM output");
    }

    // Show authentication details
    if (securityContent.security_architecture?.authentication) {
      const auth = securityContent.security_architecture.authentication;
      console.log("\n📋 Authentication Configuration:");
      console.log(`   Method: ${auth.method}`);
      if (auth.providers && auth.providers.length > 0) {
        console.log(`   Providers: ${auth.providers.join(", ")}`);
      }
      if (auth.token_expiry) {
        console.log(`   Token Expiry: ${auth.token_expiry}`);
      }
      if (auth.refresh_tokens !== undefined) {
        console.log(`   Refresh Tokens: ${auth.refresh_tokens ? "Yes" : "No"}`);
      }
      if (auth.multi_factor_auth !== undefined) {
        console.log(`   Multi-Factor Auth: ${auth.multi_factor_auth ? "Yes" : "No"}`);
      }
    }

    // Show authorization details
    if (securityContent.security_architecture?.authorization) {
      const authz = securityContent.security_architecture.authorization;
      console.log("\n📋 Authorization Configuration:");
      console.log(`   Model: ${authz.model}`);
      if (authz.policies && authz.policies.length > 0) {
        console.log(`   Policies: ${authz.policies.length}`);
        authz.policies.slice(0, 3).forEach((policy, idx) => {
          console.log(`     ${idx + 1}. ${policy.resource} - ${policy.permissions.join(", ")}`);
        });
      }
    }

    // Show threat model
    if (securityContent.threat_model && securityContent.threat_model.length > 0) {
      console.log("\n📋 Threat Model:");
      securityContent.threat_model.forEach((threat, idx) => {
        console.log(`   ${idx + 1}. ${threat.threat} (${threat.severity})`);
        if (threat.likelihood) {
          console.log(`      Likelihood: ${threat.likelihood}`);
        }
        if (threat.impact) {
          console.log(`      Impact: ${threat.impact}`);
        }
        console.log(`      Mitigation: ${threat.mitigation.substring(0, 100)}...`);
      });
    }

    // Show security controls
    if (securityContent.security_controls && securityContent.security_controls.length > 0) {
      console.log("\n📋 Security Controls:");
      securityContent.security_controls.slice(0, 5).forEach((control, idx) => {
        console.log(`   ${idx + 1}. ${control.control} (${control.category || "N/A"})`);
        if (control.priority) {
          console.log(`      Priority: ${control.priority}`);
        }
        console.log(`      Implementation: ${control.implementation.substring(0, 80)}...`);
      });
      if (securityContent.security_controls.length > 5) {
        console.log(`   ... and ${securityContent.security_controls.length - 5} more controls`);
      }
    }

    // Show encryption details
    if (securityContent.encryption) {
      console.log("\n📋 Encryption Strategy:");
      if (securityContent.encryption.data_at_rest) {
        console.log(`   Data at Rest: ${securityContent.encryption.data_at_rest.method}`);
        console.log(`   Key Management: ${securityContent.encryption.data_at_rest.key_management}`);
      }
      if (securityContent.encryption.data_in_transit) {
        console.log(`   Data in Transit: ${securityContent.encryption.data_in_transit.method}`);
      }
      if (securityContent.encryption.key_management) {
        console.log(`   Key Management Strategy: ${securityContent.encryption.key_management.strategy}`);
        if (securityContent.encryption.key_management.rotation_policy) {
          console.log(`   Key Rotation: ${securityContent.encryption.key_management.rotation_policy}`);
        }
      }
    }

    // Show compliance
    if (securityContent.compliance && securityContent.compliance.length > 0) {
      console.log("\n📋 Compliance Standards:");
      securityContent.compliance.forEach((comp, idx) => {
        console.log(`   ${idx + 1}. ${comp.standard}`);
        if (comp.requirements && comp.requirements.length > 0) {
          console.log(`      Requirements: ${comp.requirements.length}`);
        }
        if (comp.implementation_status) {
          console.log(`      Status: ${comp.implementation_status}`);
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

    // Check if Security step is present
    const securityStep = steps.find((s) => s.id === "security_architecture" || s.role === "Security");
    if (securityStep) {
      console.log("\n✅ Security step found in orchestration");
      console.log(`   Status: ${securityStep.status}`);
    } else {
      console.log("\n⚠️  Security step not found in orchestration steps");
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

    const devopsArtifact = result.artifacts?.devops_infrastructure;
    if (devopsArtifact) {
      const devopsValidation = safeValidateDevOpsArtifact(devopsArtifact.content || {});
      console.log(`   DevOps: ${devopsValidation.success ? "✅ PASSED" : "❌ FAILED"}`);
    }

    // Summary
    console.log("\n" + "=".repeat(80));
    console.log("📊 SUMMARY");
    console.log("=".repeat(80));

    const allTestsPassed =
      securityValidation.success &&
      hasLLMGeneratedContent &&
      result.success &&
      steps.every((s) => s.status === "success") &&
      !!securityStep &&
      (securityContent.threat_model?.length || 0) >= 3 &&
      (securityContent.security_controls?.length || 0) >= 5;

    if (allTestsPassed) {
      console.log("\n✅ ALL TESTS PASSED!");
      console.log("   • Security agent uses structured JSON output");
      console.log("   • Artifact structure is valid (Zod validation)");
      console.log("   • LLM generated content detected");
      console.log("   • Security step executed successfully");
      console.log("   • All orchestration steps succeeded");
      console.log("   • Minimum 3 threats identified");
      console.log("   • Minimum 5 security controls defined");
    } else {
      console.log("\n⚠️  SOME TESTS NEED ATTENTION:");
      if (!securityValidation.success) {
        console.log("   ❌ Security artifact Zod validation failed");
      }
      if (!hasLLMGeneratedContent) {
        console.log("   ⚠️  LLM structured output may not be working");
      }
      if (!result.success) {
        console.log("   ❌ Orchestration failed");
      }
      if (!securityStep) {
        console.log("   ❌ Security step not found in orchestration");
      }
      const failedSteps = steps.filter((s) => s.status !== "success");
      if (failedSteps.length > 0) {
        console.log(`   ❌ ${failedSteps.length} step(s) failed`);
      }
      if ((securityContent.threat_model?.length || 0) < 3) {
        console.log(`   ⚠️  Only ${securityContent.threat_model?.length || 0} threats (expected: 3+)`);
      }
      if ((securityContent.security_controls?.length || 0) < 5) {
        console.log(`   ⚠️  Only ${securityContent.security_controls?.length || 0} controls (expected: 5+)`);
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

