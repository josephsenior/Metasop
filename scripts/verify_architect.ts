
import 'dotenv/config'; // Loads .env file
import { architectAgent } from '../lib/metasop/agents/architect';
import { AgentContext } from '../lib/metasop/types';

async function run() {
    console.log("🚀 Starting Architect Agent Verification (Simple Mode)...");

    // Use a simpler prompt for speed
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

        console.log("\n✅ Agent Execution Completed.");
        console.log("----------------------------------------");
        console.log(`Design Doc Length: ${content.design_doc?.length || 0} chars`);
        console.log(`APIs Generated: ${content.apis?.length || 0}`);
        console.log(`Tables Generated: ${content.database_schema?.tables?.length || 0}`);
        console.log("----------------------------------------");

        // --- QUALITY CHECKS ---
        let errors = 0;

        // Check 1: No Diagrams
        if (content.nodes && content.nodes.length > 0) {
            console.warn("⚠️  WARNING: 'nodes' field is present and not empty. Diagram generation wasn't disabled?");
        } else {
            console.log("✅ Check: No Diagram Nodes (Correct)");
        }

        // Check 2: API Schemas
        let missingSchemas = 0;
        if (content.apis) {
            content.apis.forEach((api: any) => {
                if (!api.request_schema && (api.method === 'POST' || api.method === 'PUT')) {
                    console.error(`❌ ERROR: API ${api.method} ${api.path} is missing 'request_schema'`);
                    missingSchemas++;
                }
                if (!api.response_schema) {
                    console.error(`❌ ERROR: API ${api.method} ${api.path} is missing 'response_schema'`);
                    missingSchemas++;
                }
            });
        }
        if (missingSchemas === 0 && content.apis?.length > 0) console.log("✅ Check: All APIs have Schemas");

        // Check 3: DB Columns
        let missingColumns = 0;
        if (content.database_schema?.tables) {
            content.database_schema.tables.forEach((table: any) => {
                if (!table.columns || table.columns.length === 0) {
                    console.error(`❌ ERROR: Table '${table.name}' has 0 columns! Runtime Guard failed?`);
                    missingColumns++;
                }
            });
        }
        if (missingColumns === 0 && content.database_schema?.tables?.length > 0) console.log("✅ Check: All Tables have Columns");

        if (errors === 0 && missingSchemas === 0 && missingColumns === 0) {
            console.log("\n🏆 VERIFICATION PASSED: Content Quality meets standards.");
        } else {
            console.error("\n❌ VERIFICATION FAILED: Issues detected.");
        }

    } catch (error) {
        console.error("🔥 FATAL ERROR:", error);
    }
}

run();
