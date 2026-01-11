
import { productManagerAgent } from "../lib/metasop/agents/product-manager";
import { AgentContext } from "../lib/metasop/types";

async function testPM() {
    console.log("🚀 Testing Product Manager Agent directly...");

    const context: AgentContext = {
        user_request: "Build a scalable E-commerce Platform with user authentication, product catalog, shopping cart, and payment gateway integration.",
        options: {
            includeAPIs: true,
            includeDatabase: true
        },
        previous_artifacts: {}
    };

    try {
        const artifact = await productManagerAgent(context);
        console.log("✅ PM Artifact Generated Successfully:");
        console.log(JSON.stringify(artifact, null, 2));
    } catch (error: any) {
        console.error("❌ PM Agent FAILED:", error.message);
        if (error.stack) console.error(error.stack);
    }
}

testPM();
