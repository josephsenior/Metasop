

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { MetaSOPOrchestrator } from "../lib/metasop/orchestrator";
import { resetLLMProvider } from "../lib/metasop/utils/llm-helper";
import path from 'path';
import fs from 'fs';

// Force Gemini provider
process.env.METASOP_LLM_PROVIDER = "gemini";

async function runSimpleTest(modelName: string, modelId: string) {
    console.log(`\n--------------------------------------------------`);
    console.log(`🚀 Starting SIMPLE PROMPT Test: ${modelName}`);
    console.log(`--------------------------------------------------`);

    // Override Model global env
    process.env.METASOP_LLM_MODEL = modelId;
    resetLLMProvider();

    const orchestrator = new MetaSOPOrchestrator();

    // NON-TECHNICAL PROMPT
    const prompt = `I need a website for 'Purrfect Cuts', my mobile cat grooming service.
It should have:
1. A gallery of happy cats I've groomed
2. A price list (Basic Bath $50, Full Groom $80)
3. A contact form to book appointments
4. About Me section (I've been grooming cats for 10 years!)

Make it look cute and friendly with pink and white colors.`;

    const startTime = Date.now();

    try {
        const result = await orchestrator.run(
            prompt,
            { includeStateManagement: false, includeAPIs: false, includeDatabase: false },
            (event) => {
                if (event.type === 'step_start') {
                    process.stdout.write(`\nOriginal Step: [${event.step_id}] `);
                } else if (event.type === 'step_complete') {
                    process.stdout.write(`✅`);
                }
            }
        );

        console.log('');
        const duration = (Date.now() - startTime) / 1000;
        const artifactCount = Object.keys(result.artifacts).length;

        console.log(`✅ Completed in ${duration.toFixed(2)}s`);
        console.log(`📊 Artifacts: ${artifactCount}`);

        // Save results
        const outputDir = path.join(process.cwd(), 'test_results', 'simple_run');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(path.join(outputDir, 'result.json'), JSON.stringify(result, null, 2));

    } catch (error: any) {
        console.error(`\n❌ Failed:`, error.message);
    }
}

async function main() {
    await runSimpleTest("Gemini 3 Flash", "gemini-3-flash-preview");
}

main().catch(console.error);
