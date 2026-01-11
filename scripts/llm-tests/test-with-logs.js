/**
 * Test API with detailed logging to capture server errors
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
      timeout: 600000, // 600 seconds (10 minutes) - matches agent timeouts (PM: 120s + Architect: 300s + Engineer: 60s + UI: 60s + buffer)
    };

    console.log("⏳ Making API request...");
    const startTime = Date.now();
    
    const req = http.request(options, (res) => {
      let data = '';
      console.log(`📡 Response status: ${res.statusCode}`);
      console.log(`📡 Response headers:`, res.headers);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const duration = Date.now() - startTime;
        console.log(`⏱️  Request completed in ${duration}ms`);
        
        try {
          const result = JSON.parse(data);
          
          if (res.statusCode !== 200) {
            console.error(`❌ API Error (${res.statusCode}):`, result.error || result.message || JSON.stringify(result).substring(0, 500));
            reject(new Error(`API returned ${res.statusCode}: ${result.error || result.message}`));
            return;
          }
          
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
      reject(new Error("Request timeout after 10 minutes"));
    });

    req.write(postData);
    req.end();
  });
}

async function test() {
  console.log("=".repeat(80));
  console.log("🧪 TESTING API WITH DETAILED LOGGING");
  console.log("=".repeat(80));
  console.log(`\n📝 Test Prompt: ${testPrompt}\n`);
  
  try {
    const result = await makeRequest();
    
    console.log("\n" + "=".repeat(80));
    console.log("📊 RESPONSE ANALYSIS");
    console.log("=".repeat(80));
    
    const orchestration = result.data?.orchestration || {};
    const artifacts = orchestration.artifacts || {};
    const steps = orchestration.steps || [];
    
    console.log(`\n✅ Status: ${orchestration.status || 'unknown'}`);
    console.log(`📦 Artifacts keys: ${Object.keys(artifacts).join(', ') || 'NONE'}`);
    console.log(`📋 Steps: ${steps.length}`);
    
    if (steps.length > 0) {
      console.log("\n📋 Step Details:");
      steps.forEach((step, idx) => {
        console.log(`  ${idx + 1}. ${step.step_id || step.id} (${step.role}): ${step.status}`);
        if (step.error) {
          console.log(`     ❌ Error: ${step.error}`);
        }
        if (step.timestamp) {
          console.log(`     ⏰ Time: ${step.timestamp}`);
        }
      });
    }
    
    if (Object.keys(artifacts).length === 0) {
      console.log("\n⚠️  WARNING: No artifacts generated!");
      console.log("   This suggests the agents failed or timed out.");
      console.log("   Check server console logs for detailed error messages.");
    } else {
      console.log("\n✅ Artifacts generated:");
      Object.keys(artifacts).forEach(key => {
        const artifact = artifacts[key];
        console.log(`  - ${key}: ${artifact ? 'Present' : 'Missing'}`);
        if (artifact?.content) {
          const contentKeys = Object.keys(artifact.content);
          console.log(`    Content keys: ${contentKeys.join(', ')}`);
        }
      });
    }
    
    console.log("\n" + "=".repeat(80));
    
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    if (error.message.includes("ECONNREFUSED")) {
      console.error("\n💡 Server is not running. Start it with: npm run dev");
    } else if (error.message.includes("timeout")) {
      console.error("\n💡 Request timed out. The agents might be taking too long or hanging.");
      console.error("   Check server console for detailed logs.");
    }
  }
}

test();

