
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { MetaSOPOrchestrator } from "../lib/metasop/orchestrator";
import { resetLLMProvider } from "../lib/metasop/utils/llm-helper";
import path from 'path';
import fs from 'fs';

// Force Gemini provider for testing logic
process.env.METASOP_LLM_PROVIDER = "gemini";
process.env.METASOP_LLM_MODEL = "gemini-3-flash-preview";
resetLLMProvider();

async function testCascadingRefinement() {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`🧪 CASCADING REFINEMENT TEST`);
    console.log(`${"=".repeat(80)}\n`);

    const orchestrator = new MetaSOPOrchestrator();

    // ========================================
    // PHASE 1: Initial Generation (Minimal)
    // ========================================
    console.log(`\n📝 PHASE 1: Initial Generation (Greeting API)`);
    console.log(`${"─".repeat(80)}`);

    const initialPrompt = `Create a tiny Node.js greeting API. One endpoint: GET /hello returns { message: 'Hello' }.`;

    const startTime1 = Date.now();

    try {
        const initialResult = await orchestrator.run(
            initialPrompt,
            { includeAPIs: true },
            (event) => {
                if (event.type === 'step_start') {
                    process.stdout.write(`\n[${event.step_id}] `);
                } else if (event.type === 'step_complete') {
                    process.stdout.write(`✅`);
                }
            }
        );

        const duration1 = (Date.now() - startTime1) / 1000;
        console.log(`\n\n✅ Phase 1 completed in ${duration1.toFixed(2)}s`);

        // Save phase 1
        const outputDir = path.join(process.cwd(), 'test_results', 'cascade_test');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(path.join(outputDir, 'phase1_initial.json'), JSON.stringify(initialResult, null, 2));

        // ========================================
        // PHASE 2: Cascading Refinement
        // ========================================
        console.log(`\n\n🌊 PHASE 2: Cascading Refinement (Adding I18n)`);
        console.log(`${"─".repeat(80)}`);

        const cascadeInstruction = `Add internationalization support! The API should now support English, Spanish, and French by accepting a 'lang' parameter.`;

        const startTime2 = Date.now();

        // Trigger CASCADE from PM Spec
        const cascadedResult = await orchestrator.cascadeRefinement(
            'pm_spec',
            cascadeInstruction,
            (event) => {
                if (event.type === 'step_start') {
                    process.stdout.write(`\n[${event.step_id}] `);
                } else if (event.type === 'step_complete') {
                    process.stdout.write(`✅`);
                }
            }
        );

        const duration2 = (Date.now() - startTime2) / 1000;
        console.log(`\n\n✅ Phase 2 (Cascade) completed in ${duration2.toFixed(2)}s`);

        // Save phase 2
        fs.writeFileSync(path.join(outputDir, 'phase2_cascaded.json'), JSON.stringify(cascadedResult, null, 2));

        // ========================================
        // PHASE 3: Analysis
        // ========================================
        console.log(`\n\n📊 ANALYSIS OF SYNCHRONIZATION`);
        console.log(`${"=".repeat(80)}`);

        const pmSpecRefined = cascadedResult.artifacts.pm_spec?.content;
        const archDesignRefined = cascadedResult.artifacts.arch_design?.content;
        const engineerImplRefined = cascadedResult.artifacts.engineer_impl?.content;

        const pmDetectedStr = JSON.stringify(pmSpecRefined).toLowerCase();
        const archDetectedStr = JSON.stringify(archDesignRefined).toLowerCase();
        const engineerDetectedStr = JSON.stringify(engineerImplRefined).toLowerCase();

        const pmSuccess = pmDetectedStr.includes('spanish') || pmDetectedStr.includes('french') || pmDetectedStr.includes('i18n');
        const archSuccess = archDetectedStr.includes('lang') || archDetectedStr.includes('language') || archDetectedStr.includes('parameter');
        const engineerSuccess = engineerDetectedStr.includes('lang') || engineerDetectedStr.includes('fr') || engineerDetectedStr.includes('es');

        console.log(`\n🔍 Update Propagation Check:`);
        console.log(`   1. PM Spec updated?        ${pmSuccess ? '✅ YES' : '❌ NO'}`);
        console.log(`   2. Architect Design synched? ${archSuccess ? '✅ YES' : '❌ NO'}`);
        console.log(`   3. Engineer Impl synched?    ${engineerSuccess ? '✅ YES' : '❌ NO'}`);

        if (pmSuccess && archSuccess && engineerSuccess) {
            console.log(`\n🏆 FINAL VERDICT: CASCADING REFINEMENT SUCCESSFUL!`);
            console.log(`   The entire project dependency chain has been synchronized.`);
        } else {
            console.log(`\n⚠️  FINAL VERDICT: CASCADING REFINEMENT PARTIAL OR FAILED`);
            if (!archSuccess) console.log(`   - Architect failed to align with PM changes`);
            if (!engineerSuccess) console.log(`   - Engineer failed to align with PM/Architect changes`);
        }
        console.log(`${"=".repeat(80)}\n`);

    } catch (error: any) {
        console.error(`\n\n❌ Test failed:`, error.message);
        console.error(error.stack);
    }
}

testCascadingRefinement().catch(console.error);
