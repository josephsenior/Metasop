
import 'dotenv/config'; // Loads .env file
import { architectAgent } from '../lib/metasop/agents/architect';
import { AgentContext } from '../lib/metasop/types';

async function run() {
    console.log("🚀 Starting Architect Agent Verification with Raw Output...\n");

    const context: AgentContext = {
        user_request: "Build a simple ToDo app with Users and Tasks. Use SQLite.",
        previous_artifacts: {
            pm_spec: {
                step_id: "pm_spec",
                role: "Product Manager",
                timestamp: new Date().toISOString(),
                content: {
                    product_name: "SimpleDo",
                    description: "A minimal task manager",
                    requirements: ["auth", "tasks"]
                } as any
            }
        },
        options: {
            includeAPIs: true,
            includeDatabase: true
        }
    };

    try {
        const result = await architectAgent(context);
        const content = result.content as any;

        console.log("\n" + "=".repeat(80));
        console.log("📊 RAW ARCHITECT OUTPUT");
        console.log("=".repeat(80));
        console.log(JSON.stringify(content, null, 2));
        console.log("=".repeat(80) + "\n");

        console.log("\n--- SUMMARY ---");
        console.log(`Design Doc Length: ${content.design_doc?.length || 0} chars`);
        console.log(`APIs Generated: ${content.apis?.length || 0}`);
        console.log(`Database Schema Type: ${typeof content.database_schema}`);
        console.log(`Database Schema: ${JSON.stringify(content.database_schema, null, 2)}`);

        if (content.database_schema) {
            console.log(`Tables Array?: ${Array.isArray(content.database_schema.tables)}`);
            if (Array.isArray(content.database_schema.tables)) {
                console.log(`Tables Count: ${content.database_schema.tables.length}`);
                content.database_schema.tables.forEach((t: any, i: number) => {
                    console.log(`  Table ${i}: ${t.name}, Columns: ${t.columns?.length || 0}`);
                });
            } else if (Array.isArray(content.database_schema)) {
                console.log("⚠️  database_schema is array directly (not nested in .tables)");
                console.log(`Direct Tables Count: ${content.database_schema.length}`);
                content.database_schema.forEach((t: any, i: number) => {
                    console.log(`  Table ${i}: ${t.name}, Columns: ${t.columns?.length || 0}`);
                });
            }
        }

    } catch (error) {
        console.error("🔥 FATAL ERROR:", error);
    }
}

run();
