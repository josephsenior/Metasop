

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // Try local first
dotenv.config(); // Fallback to .env

import { MetaSOPOrchestrator } from "../../lib/metasop/orchestrator";
import { resetLLMProvider } from "../../lib/metasop/utils/llm-helper";
import path from 'path';
import fs from 'fs';

// Force Gemini provider
process.env.METASOP_LLM_PROVIDER = "gemini";

async function runBenchmark(modelName: string, modelId: string) {
    console.log(`\n--------------------------------------------------`);
    console.log(`🚀 Starting DIRECT Benchmark for: ${modelName} (${modelId})`);
    console.log(`--------------------------------------------------`);

    // Override Model global env
    process.env.METASOP_LLM_MODEL = modelId;

    // Reset LLM Provider to pick up new config/model
    resetLLMProvider();

    const orchestrator = new MetaSOPOrchestrator();

    const prompt = `Design and architect 'HealthTrack', an enterprise-grade telemedicine and remote patient monitoring platform.

Core Features:
- Patient/Doctor portal with real-time encrypted video consultations.
- Integration with wearable devices for real-time vitals tracking (Heart rate, Blood pressure, SpO2) using MQTT.
- AI-driven symptom checker, automated triage, and risk assessment.
- HIPAA-compliant document management (Encrypted prescriptions, Lab results, Medical history).
- Automated appointment scheduling with timezone support and billing integration (Stripe/Insurance).
- Emergency alert system that notifies local EMS based on critical vital thresholds.

Technical Constraints:
- Zero-trust security architecture following NIST 800-207 and SOC-2 Type II standards.
- Highly scalable event-driven microservices architecture using Apache Kafka for data streaming.
- 99.99% availability with Multi-region Active-Active Disaster Recovery (RPO < 5 min, RTO < 10 min).
- Progressive Web App (PWA) and native mobile support using React Native.
- WCAG 2.1 AA accessibility compliance and multilingual support.
- 90% code coverage target for all services with strict TDD discipline.
- Automated CI/CD pipelines with Terraform for Infrastructure as Code.`;

    const startTime = Date.now();

    try {
        const result = await orchestrator.run(
            prompt,
            {
                includeStateManagement: true,
                includeAPIs: true,
                includeDatabase: true
            },
            (event: { type: string; step_id?: string }) => {
                if (event.type === 'step_start') {
                    process.stdout.write(`\nOriginal Step: [${event.step_id}] `);
                } else if (event.type === 'step_complete') {
                    process.stdout.write(`✅`);
                } else if (event.type === 'step_failed') {
                    process.stdout.write(`❌`);
                }
            }
        );

        console.log(''); // Newline

        const duration = (Date.now() - startTime) / 1000;
        const artifactCount = Object.keys(result.artifacts).length;

        console.log(`✅ ${modelName} completed in ${duration.toFixed(2)}s`);
        console.log(`📊 Generated ${artifactCount} artifacts.`);
        console.log(`🏁 Success: ${result.success}`);

        if (!result.success) {
            console.error(`❌ Errors:`, JSON.stringify(result.report.events.filter((e: { status?: string }) => e.status === 'failed'), null, 2));
        }

        // Save results
        const outputDir = path.join(process.cwd(), 'test_results', 'benchmark_direct', modelName.replace(/\s+/g, '_').toLowerCase());
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(
            path.join(outputDir, 'result.json'),
            JSON.stringify(result, null, 2)
        );

        return {
            model: modelName,
            id: modelId,
            duration,
            artifactsCount: artifactCount,
            success: result.success,
            error: result.success ? null : "Pipeline reported failure"
        };

    } catch (error: any) {
        console.error(`\n❌ ${modelName} Benchmark Threw Exception:`, error.message);
        return {
            model: modelName,
            id: modelId,
            duration: (Date.now() - startTime) / 1000,
            artifactsCount: 0,
            success: false,
            error: error.message
        };
    }
}

async function main() {
    const results = [];

    // Run Gemini 3 Flash
    results.push(await runBenchmark("Gemini 3 Flash", "gemini-3-flash-preview"));

    // Cool down
    console.log("\nwaiting 5s...");
    await new Promise(r => setTimeout(r, 5000));

    // Run Gemini 3 Pro
    results.push(await runBenchmark("Gemini 3 Pro", "gemini-3-pro-preview"));

    // Report
    console.log("\n\n📋 DIRECT BENCHMARK REPORT");
    console.log("===================");
    console.table(results);
}

main().catch(console.error);
