
import 'dotenv/config';
import { engineerAgent } from '../lib/metasop/agents/engineer';
import { AgentContext } from '../lib/metasop/types';

async function testEngineer() {
    console.log("🚀 Testing Engineer Agent...");

    const context: AgentContext = {
        user_request: "Build a simple ToDo app.",
        previous_artifacts: {
            pm_spec: {
                step_id: "pm_spec",
                role: "Product Manager",
                timestamp: new Date().toISOString(),
                content: {
                    user_stories: [{ story: "As a user I want to add tasks", priority: "high" }],
                    acceptance_criteria: ["Task is added to list"]
                } as any
            },
            arch_design: {
                step_id: "arch_design",
                role: "Architect",
                timestamp: new Date().toISOString(),
                content: {
                    design_doc: "Simple architecture",
                    apis: [{ path: "/tasks", method: "POST", description: "Create task", request_schema: {}, response_schema: {} }],
                    database_schema: { tables: [{ name: "tasks", columns: [{ name: "id", type: "INT" }] }] }
                } as any
            }
        }
    };

    try {
        const result = await engineerAgent(context);
        console.log("✅ Engineer Result:", JSON.stringify(result.content, null, 2));
    } catch (error: any) {
        console.error("❌ Engineer Failed:", error.message);
        if (error.stack) console.error(error.stack);
    }
}

testEngineer();
