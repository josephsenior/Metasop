
const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || "AIzaSyDXU-tjxq_D1bLT0RTmSlOQMoCJy2n8tks";

async function testModel(modelName: string) {
    console.log(`\nTesting ${modelName}...`);
    const url = `https://generativelanguage.googleapis.com/v1alpha/models/${modelName}:generateContent?key=${apiKey}`;

    const body = {
        contents: [{ parts: [{ text: "Hello, are you working?" }] }],
        generationConfig: {
            temperature: 0.7
        }
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            console.error(`❌ FAILED: ${response.status} ${response.statusText}`);
            console.error("Error Details:", JSON.stringify(err, null, 2));
            return false;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
            console.log("✅ SUCCESS! Response:", text.substring(0, 50) + "...");
            return true;
        } else {
            console.log("⚠️  Response structure unexpected:", JSON.stringify(data).substring(0, 100));
            return false;
        }

    } catch (error: any) {
        console.error(`❌ EXCEPTION: ${error.message}`);
        return false;
    }
}

async function run() {
    console.log("🔎 Verifying Access to Gemini 3 Models");

    // Test 1: Gemini 3 Flash Preview (User claims this works)
    await testModel("gemini-3-flash-preview");

    // Test 2: Gemini 3 Pro Preview (Target)
    await testModel("gemini-3-pro-preview");
}

run();
