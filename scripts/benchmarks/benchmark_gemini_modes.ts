import { createLLMProvider } from "../../lib/metasop/adapters/llm-adapter";
import { architectSchema } from "../../lib/metasop/artifacts/architect/schema";

async function benchmark() {
    const prompt = "Design a high-scale real-time notification system. Include global distribution, low latency push (WebSockets), and cross-platform delivery (mobile, web, email). Use PostgreSQL for persistent state and Redis for real-time routing.";

    const gemini = createLLMProvider("gemini");

    console.log("🚀 Starting Gemini 3 Pro Benchmarks...\n");

    // 1. Standard Mode
    console.log("📦 Mode: STANDARD");
    try {
        const standardResult = await gemini.generateStructured(prompt, architectSchema, {
            reasoning: false
        });
        console.log("✅ Standard Mode Complete.");
        console.log("Sample Data Quality:", (standardResult as any).infrastructure_services?.length || 0, "services");
    } catch (e) {
        console.error("❌ Standard Mode Failed:", e);
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // 2. High Thinking Mode
    console.log("🧠 Mode: HIGH THINKING");
    try {
        const thinkingResult = await gemini.generateStructured(prompt, architectSchema, {
            reasoning: true
        });
        console.log("✅ High Thinking Mode Complete.");
        console.log("Sample Data Quality:", (thinkingResult as any).infrastructure_services?.length || 0, "services");
    } catch (error) {
        console.error("❌ High Thinking Mode Failed:", error);
    }

    console.log("\n🎯 Benchmark finished. Check the logs above for Cost (Tokens), Speed (Latency), and Thought traces.");
}

benchmark().catch(console.error);
