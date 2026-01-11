/**
 * Direct test of LLM provider to verify it's working
 */

require('dotenv').config({ path: '.env.local' });

async function testLLM() {
  console.log("🧪 Testing LLM Provider Directly...\n");
  console.log("Environment Variables:");
  console.log(`  METASOP_LLM_PROVIDER: ${process.env.METASOP_LLM_PROVIDER || 'NOT SET'}`);
  console.log(`  METASOP_LLM_MODEL: ${process.env.METASOP_LLM_MODEL || 'NOT SET'}`);
  console.log(`  GEMINI_API_KEY: ${process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY ? 'SET (hidden)' : 'NOT SET'}`);
  console.log(`  OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'SET (hidden)' : 'NOT SET'}\n`);
  
  try {
    // Import the LLM helper
    const { getLLMProvider } = require('../lib/metasop/utils/llm-helper');
    
    console.log("📦 Getting LLM provider...");
    const provider = getLLMProvider();
    console.log(`✅ Provider initialized: ${provider.constructor.name}\n`);
    
    // Test simple generation
    console.log("📝 Testing simple text generation...");
    const simpleResult = await provider.generate("Say 'Hello, World!' in JSON format: {\"message\": \"...\"}", {
      maxTokens: 100,
    });
    console.log(`✅ Simple generation result: ${simpleResult.substring(0, 200)}...\n`);
    
    // Test structured generation
    console.log("📋 Testing structured JSON generation...");
    const schema = {
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
      },
    };
    
    const structuredResult = await provider.generateStructured(
      "Generate 3 API endpoints for a todo app. Return JSON with an 'apis' array.",
      schema,
      { maxTokens: 1000 }
    );
    
    console.log("✅ Structured generation result:");
    console.log(JSON.stringify(structuredResult, null, 2));
    console.log(`\n✅ APIs generated: ${structuredResult.apis?.length || 0}`);
    
    if (structuredResult.apis && structuredResult.apis.length > 0) {
      console.log("\n📊 Sample APIs:");
      structuredResult.apis.slice(0, 3).forEach((api, idx) => {
        console.log(`  ${idx + 1}. ${api.method} ${api.path} - ${api.description}`);
      });
    }
    
    console.log("\n✅ LLM Provider is working correctly!");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Stack:", error.stack);
  }
}

testLLM();

