
import { getLLMProvider, resetLLMProvider } from "../lib/metasop/utils/llm-helper";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testLLM() {
    console.log("Testing Gemini Connection via Google AI Studio...");
    try {
        resetLLMProvider();
        const provider = getLLMProvider();
        console.log("Provider initialized.");

        const response = await provider.generate("Hello, just say 'Connected' if you can hear me.");
        console.log("Response:", response);

        if (response.toLowerCase().includes("connected")) {
            console.log("SUCCESS: Gemini Connection Verified.");
        } else {
            console.log("WARNING: Response received but didn't match expected output.");
        }
    } catch (error) {
        console.error("ERROR: Gemini Connection failed:", error);
    }
}

testLLM();
