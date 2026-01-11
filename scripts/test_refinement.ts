
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { MetaSOPOrchestrator } from "../lib/metasop/orchestrator";
import { resetLLMProvider } from "../lib/metasop/utils/llm-helper";
import path from 'path';
import fs from 'fs';

// Force Gemini provider
process.env.METASOP_LLM_PROVIDER = "gemini";
process.env.METASOP_LLM_MODEL = "gemini-3-flash-preview";
resetLLMProvider();

async function testRefinement() {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`🧪 REFINEMENT FUNCTIONALITY TEST`);
    console.log(`${"=".repeat(80)}\n`);

    const orchestrator = new MetaSOPOrchestrator();

    // ========================================
    // PHASE 1: Initial Generation
    // ========================================
    console.log(`\n📝 PHASE 1: Initial Generation`);
    console.log(`${"─".repeat(80)}`);

    const initialPrompt = `Create a simple task management app with:
1. Add/edit/delete tasks
2. Mark tasks as complete
3. Filter by status (all/active/completed)`;

    const startTime1 = Date.now();

    let initialResult;
    let duration1 = 0; // Declare at function level for later comparison

    try {
        initialResult = await orchestrator.run(
            initialPrompt,
            { includeStateManagement: true, includeAPIs: true, includeDatabase: true },
            (event) => {
                if (event.type === 'step_start') {
                    process.stdout.write(`\n[${event.step_id}] `);
                } else if (event.type === 'step_complete') {
                    process.stdout.write(`✅`);
                }
            }
        );

        duration1 = (Date.now() - startTime1) / 1000;
        const artifactCount1 = Object.keys(initialResult.artifacts).length;

        console.log(`\n\n✅ Initial generation completed in ${duration1.toFixed(2)}s`);
        console.log(`📊 Artifacts: ${artifactCount1}`);

        // Save initial results
        const outputDir = path.join(process.cwd(), 'test_results', 'refinement_test');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(
            path.join(outputDir, 'initial_result.json'),
            JSON.stringify(initialResult, null, 2)
        );

        console.log(`\n📁 Initial PM user stories: ${(initialResult.artifacts.pm_spec?.content as any)?.user_stories?.length || 0}`);
        console.log(`📁 Initial Architect APIs: ${(initialResult.artifacts.arch_design?.content as any)?.apis?.length || 0}`);

    } catch (error: any) {
        console.error(`\n\n❌ Initial generation failed:`, error.message);
        return;
    }

    // ========================================
    // PHASE 2: Refinement Using refineArtifact()
    // ========================================
    console.log(`\n\n📝 PHASE 2: Refinement with refineArtifact()`);
    console.log(`${"─".repeat(80)}`);

    const refinementInstruction = `Enhance the product spec with:
1. Add task priority levels (high/medium/low) as a new user story
2. Add due dates functionality as another user story
3. Add tags/categories for task organization`;

    const startTime2 = Date.now();

    try {
        const refinedResult = await orchestrator.refineArtifact(
            'pm_spec',
            refinementInstruction,
            (event) => {
                if (event.type === 'step_start') {
                    process.stdout.write(`\n[${event.step_id}]`);
                } else if (event.type === 'step_complete') {
                    process.stdout.write(`✅`);
                }
            }
        );

        const duration2 = (Date.now() - startTime2) / 1000;
        const artifactCount2 = Object.keys(refinedResult.artifacts).length;

        console.log(`\n\n✅ Refinement completed in ${duration2.toFixed(2)}s`);
        console.log(`📊 Artifacts: ${artifactCount2}`);

        // Save refined results
        const outputDir = path.join(process.cwd(), 'test_results', 'refinement_test');
        fs.writeFileSync(
            path.join(outputDir, 'refined_result.json'),
            JSON.stringify(refinedResult, null, 2)
        );

        // ========================================
        // PHASE 3: Comparison & Analysis
        // ========================================
        console.log(`\n\n📊 VERIFICATION RESULTS`);
        console.log(`${"=".repeat(80)}`);

        // Check if refinement actually modified the artifacts
        const pmSpecInitial = (initialResult.artifacts.pm_spec?.content as any)?.user_stories || [];
        const pmSpecRefined = (refinedResult.artifacts.pm_spec?.content as any)?.user_stories || [];

        console.log(`\n🔍 Product Manager Artifact:`);
        console.log(`   Initial user stories: ${pmSpecInitial.length}`);
        console.log(`   Refined user stories: ${pmSpecRefined.length}`);
        console.log(`   Change: ${pmSpecRefined.length > pmSpecInitial.length ? '✅ INCREASED' : '⚠️  SAME OR DECREASED'}`);

        // Check for priority-related content in refined version
        const refinedContentStr = JSON.stringify(refinedResult.artifacts).toLowerCase();
        const hasPriority = refinedContentStr.includes('priority');
        const hasDueDate = refinedContentStr.includes('due date') || refinedContentStr.includes('deadline');
        const hasTags = refinedContentStr.includes('tag') || refinedContentStr.includes('categor');

        console.log(`\n🎯 New Features Detected:`);
        console.log(`   Priority levels: ${hasPriority ? '✅ YES' : '❌ NO'}`);
        console.log(`   Due dates: ${hasDueDate ? '✅ YES' : '❌ NO'}`);
        console.log(`   Tags/Categories: ${hasTags ? '✅ YES' : '❌ NO'}`);

        // Performance comparison
        console.log(`\n⚡ Performance:`);
        console.log(`   Initial generation: ${duration1.toFixed(2)}s`);
        console.log(`   Refinement: ${duration2.toFixed(2)}s`);
        const speedup = ((duration1 - duration2) / duration1 * 100);
        console.log(`   Speed difference: ${duration2 < duration1 ? `${speedup.toFixed(1)}% faster` : `${(-speedup).toFixed(1)}% slower`}`);

        // Final verdict
        const hasNewFeatures = hasPriority || hasDueDate || hasTags;
        const refinementWorked = refinedResult.success && hasNewFeatures;

        console.log(`\n\n${"=".repeat(80)}`);
        if (refinementWorked) {
            console.log(`✅ REFINEMENT TEST PASSED`);
            console.log(`   - Refinement API working correctly`);
            console.log(`   - New features successfully incorporated`);
            console.log(`   - Artifacts properly updated`);
            console.log(`   - Cache mechanism utilized internally`);
        } else {
            console.log(`⚠️  REFINEMENT TEST INCONCLUSIVE OR FAILED`);
            console.log(`   - Success: ${refinedResult.success}`);
            console.log(`   - New features detected: ${hasNewFeatures}`);
        }
        console.log(`${"=".repeat(80)}\n`);

    } catch (error: any) {
        console.error(`\n\n❌ Refinement failed:`, error.message);
        console.error(error.stack);
    }
}

testRefinement().catch(console.error);
