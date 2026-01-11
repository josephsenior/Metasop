/**
 * Test API response structure to see what's actually being returned
 */

const http = require('http');

const testPrompt = "Create a simple todo app with authentication";

function makeRequest() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      prompt: testPrompt,
      options: {
        includeAPIs: true,
        includeDatabase: true,
      },
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/diagrams/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 600000, // 10 minutes
    };

    console.log("⏳ Making API request...");
    const startTime = Date.now();
    
    const req = http.request(options, (res) => {
      let data = '';
      console.log(`📡 Response status: ${res.statusCode}`);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const duration = Date.now() - startTime;
        console.log(`⏱️  Request completed in ${duration}ms\n`);
        
        try {
          const result = JSON.parse(data);
          
          console.log("=".repeat(80));
          console.log("📋 FULL RESPONSE STRUCTURE");
          console.log("=".repeat(80));
          console.log("\nTop-level keys:", Object.keys(result));
          
          if (result.data) {
            console.log("\nresult.data keys:", Object.keys(result.data));
            
            if (result.data.diagram) {
              console.log("\nresult.data.diagram keys:", Object.keys(result.data.diagram));
            }
            
            if (result.data.orchestration) {
              console.log("\nresult.data.orchestration keys:", Object.keys(result.data.orchestration));
              console.log("orchestration.status:", result.data.orchestration.status);
              console.log("orchestration.artifacts keys:", Object.keys(result.data.orchestration.artifacts || {}));
              console.log("orchestration.steps:", result.data.orchestration.steps?.length || 0);
              
              if (result.data.orchestration.steps && result.data.orchestration.steps.length > 0) {
                console.log("\nSteps details:");
                result.data.orchestration.steps.forEach((step, idx) => {
                  console.log(`  ${idx + 1}. ${step.step_id || step.id} (${step.role}): ${step.status}`);
                  if (step.error) {
                    console.log(`     Error: ${step.error}`);
                  }
                });
              }
            }
          }
          
          // Show full response (truncated)
          console.log("\n" + "=".repeat(80));
          console.log("📄 Full Response (first 2000 chars):");
          console.log("=".repeat(80));
          console.log(JSON.stringify(result, null, 2).substring(0, 2000));
          
          resolve({ status: res.statusCode, data: result, duration });
        } catch (e) {
          console.error("❌ Parse error:", e.message);
          console.error("Response preview:", data.substring(0, 1000));
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error("❌ Request error:", error.message);
      reject(error);
    });
    
    req.on('timeout', () => {
      console.error("❌ Request timeout after 10 minutes");
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.write(postData);
    req.end();
  });
}

async function test() {
  console.log("=".repeat(80));
  console.log("🔍 TESTING API RESPONSE STRUCTURE");
  console.log("=".repeat(80));
  console.log(`\n📝 Test Prompt: ${testPrompt}\n`);
  
  try {
    await makeRequest();
    console.log("\n✅ Test completed successfully");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
  }
}

test();

