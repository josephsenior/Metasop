/**
 * List available Gemini models for this API key
 */

const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ GOOGLE_AI_API_KEY or GEMINI_API_KEY environment variable required");
  process.exit(1);
}

async function listModels() {
  console.log("🔍 Listing available Gemini models...\n");
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const models = data.models || [];
    
    console.log(`✅ Found ${models.length} available models:\n`);
    
    // Filter for Flash models
    const flashModels = models.filter(m => 
      m.name && (
        m.name.includes('flash') || 
        m.name.includes('Flash') ||
        m.name.includes('gemini-1.5') ||
        m.name.includes('gemini-2.0')
      )
    );
    
    if (flashModels.length > 0) {
      console.log("📋 Flash Models (recommended):");
      flashModels.forEach(model => {
        const name = model.name.replace('models/', '');
        const supported = model.supportedGenerationMethods || [];
        const hasGenerate = supported.includes('generateContent');
        console.log(`  ${hasGenerate ? '✅' : '❌'} ${name}`);
        if (model.displayName) {
          console.log(`     Display: ${model.displayName}`);
        }
      });
      console.log();
    }
    
    // Show all models
    console.log("📋 All Available Models:");
    models.slice(0, 20).forEach(model => {
      const name = model.name.replace('models/', '');
      const supported = model.supportedGenerationMethods || [];
      const hasGenerate = supported.includes('generateContent');
      console.log(`  ${hasGenerate ? '✅' : '❌'} ${name}`);
    });
    
    if (models.length > 20) {
      console.log(`  ... and ${models.length - 20} more models`);
    }
    
    console.log("\n💡 Use a model name that shows ✅ for generateContent");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.message.includes("401") || error.message.includes("Unauthorized")) {
      console.error("\n💡 API key might be invalid");
    } else if (error.message.includes("403")) {
      console.error("\n💡 API might not be enabled. Enable 'Generative Language API' in Google Cloud Console");
    }
  }
}

listModels();

