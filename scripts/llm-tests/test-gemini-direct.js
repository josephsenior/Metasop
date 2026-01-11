/**
 * Direct test of Google Gemini 2.0 Flash API
 */

const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ GOOGLE_AI_API_KEY or GEMINI_API_KEY environment variable required");
  process.exit(1);
}

async function testGemini() {
  console.log("🧪 Testing Google Gemini 2.0 Flash API directly...\n");
  
  const testPrompt = `Generate a JSON object with this structure:
{
  "apis": [
    {"path": "/api/example", "method": "GET", "description": "Example endpoint"}
  ],
  "decisions": [
    {"decision": "Example decision", "reason": "Example reason", "tradeoffs": "Example tradeoffs"}
  ]
}

Generate 10 APIs and 7 decisions for a todo app with authentication. Return ONLY valid JSON.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: testPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000,
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                apis: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      path: { type: "string" },
                      method: { type: "string" },
                      description: { type: "string" },
                    },
                  },
                },
                decisions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      decision: { type: "string" },
                      reason: { type: "string" },
                      tradeoffs: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    console.log("✅ Gemini API Response Received!");
    console.log(`   Response length: ${content.length} chars\n`);
    
    // Try to parse JSON
    try {
      const parsed = JSON.parse(content);
      
      console.log("✅ JSON Parsed Successfully!\n");
      console.log("📊 Content Analysis:");
      console.log(`   APIs: ${parsed.apis?.length || 0} ${(parsed.apis?.length || 0) >= 10 ? '✅' : '⚠️'} (target: 10)`);
      console.log(`   Decisions: ${parsed.decisions?.length || 0} ${(parsed.decisions?.length || 0) >= 7 ? '✅' : '⚠️'} (target: 7)`);
      
      if (parsed.apis && parsed.apis.length > 0) {
        console.log("\n   Sample APIs:");
        parsed.apis.slice(0, 5).forEach((api, idx) => {
          console.log(`   ${idx + 1}. ${api.method} ${api.path} - ${api.description?.substring(0, 50)}...`);
        });
      }
      
      if (parsed.decisions && parsed.decisions.length > 0) {
        console.log("\n   Sample Decisions:");
        parsed.decisions.slice(0, 3).forEach((decision, idx) => {
          console.log(`   ${idx + 1}. ${decision.decision?.substring(0, 60)}...`);
        });
      }
      
      console.log("\n✅ Gemini 2.0 Flash is working and generating detailed outputs!");
      
    } catch (parseError) {
      console.log("⚠️  JSON parsing failed, but API call succeeded");
      console.log("   Response preview:", content.substring(0, 500));
      console.log("   Error:", parseError.message);
    }
    
  } catch (error) {
    console.error("❌ Gemini API Error:", error.message);
    if (error.message.includes("401") || error.message.includes("Unauthorized")) {
      console.error("\n💡 API key might be invalid");
    } else if (error.message.includes("404")) {
      console.error("\n💡 Model name might be incorrect. Try 'gemini-1.5-flash' instead");
    }
  }
}

testGemini();

