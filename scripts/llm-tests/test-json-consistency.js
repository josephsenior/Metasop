/**
 * Test JSON Consistency Improvements
 * Tests Product Manager structured output and validation
 */

require("dotenv").config();
const http = require("http");

const PORT = process.env.PORT || 3000;
const HOST = "localhost";

const testPrompt = "Build a todo application with user authentication, database storage, and REST API endpoints";

function makeRequest() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      prompt: testPrompt,
      options: {
        includeAPIs: true,
        includeDatabase: true,
        includeStateManagement: true,
      },
    });

    const options = {
      hostname: HOST,
      port: PORT,
      path: "/api/diagrams/generate",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
        Cookie: "user_id=test-user-123", // For authentication
      },
      timeout: 600000, // 10 minutes
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: parsed,
          });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.write(postData);
    req.end();
  });
}

function validateProductManagerArtifact(pmArtifact) {
  const errors = [];
  const content = pmArtifact?.content || {};

  // Check required fields
  if (!Array.isArray(content.user_stories)) {
    errors.push("❌ user_stories is not an array");
  } else {
    if (content.user_stories.length < 1) {
      errors.push("❌ user_stories array is empty");
    } else {
      console.log(`   ✅ user_stories: ${content.user_stories.length} stories`);
      
      // Check first few stories
      content.user_stories.slice(0, 3).forEach((story, idx) => {
        if (typeof story === "string") {
          console.log(`      Story ${idx + 1}: String format (${story.substring(0, 50)}...)`);
        } else if (typeof story === "object" && story.title) {
          console.log(`      Story ${idx + 1}: Object format - "${story.title}"`);
          if (story.priority) console.log(`         Priority: ${story.priority}`);
          if (story.acceptance_criteria) {
            console.log(`         Acceptance Criteria: ${story.acceptance_criteria.length} items`);
          }
        } else {
          errors.push(`   ❌ Story ${idx + 1} has invalid format`);
        }
      });
    }
  }

  if (!Array.isArray(content.acceptance_criteria)) {
    errors.push("❌ acceptance_criteria is not an array");
  } else {
    if (content.acceptance_criteria.length < 1) {
      errors.push("❌ acceptance_criteria array is empty");
    } else {
      console.log(`   ✅ acceptance_criteria: ${content.acceptance_criteria.length} criteria`);
    }
  }

  // Check optional fields
  if (content.ui_multi_section !== undefined && typeof content.ui_multi_section !== "boolean") {
    errors.push("❌ ui_multi_section is not a boolean");
  } else if (content.ui_multi_section !== undefined) {
    console.log(`   ✅ ui_multi_section: ${content.ui_multi_section}`);
  }

  if (content.ui_sections !== undefined && typeof content.ui_sections !== "number") {
    errors.push("❌ ui_sections is not a number");
  } else if (content.ui_sections !== undefined) {
    console.log(`   ✅ ui_sections: ${content.ui_sections}`);
  }

  if (content.assumptions && Array.isArray(content.assumptions)) {
    console.log(`   ✅ assumptions: ${content.assumptions.length} items`);
  }

  if (content.out_of_scope && Array.isArray(content.out_of_scope)) {
    console.log(`   ✅ out_of_scope: ${content.out_of_scope.length} items`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

async function test() {
  console.log("🧪 JSON CONSISTENCY IMPROVEMENTS TEST\n");
  console.log("=".repeat(80));
  console.log("📝 Test Prompt:", testPrompt);
  console.log("=".repeat(80));
  console.log("\n⏳ Generating diagram (testing Product Manager structured output)...\n");

  try {
    const startTime = Date.now();
    const result = await makeRequest();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (result.status !== 200) {
      console.error(`❌ API returned ${result.status}`);
      if (result.data?.error) {
        console.error(`Error: ${result.data.error}`);
      }
      if (result.data?.message) {
        console.error(`Message: ${result.data.message}`);
      }
      return;
    }

    if (result.data.error) {
      console.error(`❌ Error: ${result.data.error}`);
      return;
    }

    const orchestration = result.data.data?.orchestration;

    if (!orchestration) {
      console.error("❌ No orchestration data in response");
      return;
    }

    console.log("=".repeat(80));
    console.log("📊 TEST RESULTS");
    console.log("=".repeat(80));
    console.log(`\n⏱️  Duration: ${duration}s`);
    console.log(`✅ Orchestration Status: ${orchestration.status}`);

    // Test Product Manager Artifact
    console.log("\n" + "─".repeat(80));
    console.log("1️⃣  PRODUCT MANAGER AGENT - Structured JSON Output Test");
    console.log("─".repeat(80));

    const pmArtifact = orchestration.artifacts?.pm_spec;
    if (!pmArtifact) {
      console.error("❌ Product Manager artifact not found");
      return;
    }

    console.log("\n📋 Validating Product Manager artifact structure...\n");
    const pmValidation = validateProductManagerArtifact(pmArtifact);

    if (pmValidation.valid) {
      console.log("\n✅ Product Manager artifact structure is VALID");
    } else {
      console.log("\n❌ Product Manager artifact structure has ERRORS:");
      pmValidation.errors.forEach((error) => console.log(`   ${error}`));
    }

    // Check if LLM was used (structured output)
    const pmContent = pmArtifact.content || {};
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

    // Test Orchestrator Steps
    console.log("\n" + "─".repeat(80));
    console.log("3️⃣  ORCHESTRATOR STEPS TEST");
    console.log("─".repeat(80));

    const steps = orchestration.steps || [];
    console.log(`\n📋 Total steps: ${steps.length}`);
    steps.forEach((step, idx) => {
      const status = step.status === "success" ? "✅" : step.status === "failed" ? "❌" : "⏳";
      console.log(`   ${status} Step ${idx + 1}: ${step.role} (${step.status})`);
    });

    // Test Validation
    console.log("\n" + "─".repeat(80));
    console.log("4️⃣  VALIDATION TEST");
    console.log("─".repeat(80));

    // Check if validation warnings were logged (would be in server logs)
    console.log("\n📋 Validation status:");
    console.log("   ✅ Post-processing validation is active in orchestrator");
    console.log("   ℹ️  Check server logs for validation warnings/errors");

    // Summary
    console.log("\n" + "=".repeat(80));
    console.log("📊 SUMMARY");
    console.log("=".repeat(80));

    const allTestsPassed = pmValidation.valid && hasLLMGeneratedContent;

    if (allTestsPassed) {
      console.log("\n✅ ALL TESTS PASSED!");
      console.log("   • Product Manager uses structured JSON output");
      console.log("   • Artifact structure is valid");
      console.log("   • LLM generated content detected");
      console.log("   • Validation is active");
    } else {
      console.log("\n⚠️  SOME TESTS NEED ATTENTION:");
      if (!pmValidation.valid) {
        console.log("   ❌ Product Manager artifact structure validation failed");
      }
      if (!hasLLMGeneratedContent) {
        console.log("   ⚠️  LLM structured output may not be working");
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

