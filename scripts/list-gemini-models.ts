
// Make this file a module to avoid global variable conflicts
export { };

const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || "AIzaSyDXU-tjxq_D1bLT0RTmSlOQMoCJy2n8tks";
const url = `https://generativelanguage.googleapis.com/v1alpha/models?key=${apiKey}`;

async function listModels() {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log("AVAILABLE MODELS:");
        data.models?.forEach((m: any) => {
            console.log(`- ${m.name.replace('models/', '')}: ${m.displayName}`);
        });
    } catch (error) {
        console.error("Failed to list models:", error);
    }
}

listModels();
