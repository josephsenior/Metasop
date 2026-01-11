
import { runMetaSOPOrchestration } from "../lib/metasop/orchestrator";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testOrchestration() {
    console.log("Starting Orchestration Test...");
    const prompt = "Design a simple To-Do List application with a React frontend and Node.js backend using MongoDB.";

    try {
        console.log("Prompt:", prompt);
        const result = await runMetaSOPOrchestration(
            prompt,
            {
                includeStateManagement: true,
                includeAPIs: true,
                includeDatabase: true
            },
            (event) => {
                const now = new Date().toLocaleTimeString();
                if (event.type === 'step_start') {
                    (event as any).startTime = Date.now();
                    console.log(`[${now}] 🚀 STARTING ${event.role}...`);
                } else if (event.type === 'step_complete') {
                    const duration = ((Date.now() - (event as any).startTime) / 1000).toFixed(1);
                    console.log(`[${now}] ✅ COMPLETED ${event.role} (${duration}s)`);
                } else if (event.type === 'step_failed') {
                    console.log(`[${now}] ❌ FAILED ${event.role}: ${event.error}`);
                }
            }
        );

        console.log("\n-----------------------------------");
        console.log("Orchestration Completed Successfully!");

        const archArtifact = result.artifacts.arch_design;
        const diagram = archArtifact?.content as any;

        if (diagram) {
            console.log("Diagram Nodes:", diagram.nodes?.length || 0);
            console.log("Diagram Edges:", diagram.edges?.length || 0);
            console.log("✅ Diagram has been generated.");
        } else {
            console.error("❌ Architecture Design artifact is missing!");
        }
        console.log("-----------------------------------\n");

    } catch (error) {
        console.error("❌ Orchestration Failed:", error);
    }
}

testOrchestration();
