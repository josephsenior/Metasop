
import fs from 'fs';
import path from 'path';

async function runBenchmark(modelName: string, modelId: string) {
    console.log(`\n🚀 Starting Benchmark for: ${modelName} (${modelId})`);
    console.log('================================================');

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
        const response = await fetch('http://localhost:3000/api/diagrams/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt,
                options: {
                    includeStateManagement: true,
                    includeAPIs: true,
                    includeDatabase: true,
                    model: modelId // Pass model to override
                }
            }),
            signal: AbortSignal.timeout(900000) // 15 min timeout
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Request Failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const responseJson = await response.json();
        const streamUrl = responseJson?.data?.streamUrl;
        if (!streamUrl) {
            throw new Error("Missing stream URL from generation response");
        }

        const streamResponse = await fetch(`http://localhost:3000${streamUrl}`);
        if (!streamResponse.ok) {
            const errorText = await streamResponse.text();
            throw new Error(`Stream Request Failed: ${streamResponse.status} ${streamResponse.statusText} - ${errorText}`);
        }

        const reader = streamResponse.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let finalData: any = {};
        let artifactCount = 0;

        if (reader) {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                let splitIndex = buffer.indexOf('\n\n');
                while (splitIndex !== -1) {
                    const chunk = buffer.slice(0, splitIndex);
                    buffer = buffer.slice(splitIndex + 2);

                    const dataLines = chunk.split('\n').filter(line => line.startsWith('data:'));
                    if (dataLines.length > 0) {
                        const payload = dataLines.map(line => line.replace(/^data:\s?/, '')).join('\n');
                        if (payload && payload !== '[DONE]') {
                            try {
                                const event = JSON.parse(payload);

                                if (event.type === 'orchestration_complete') {
                                    finalData = event;
                                    const orchestration = event.diagram?.metadata?.metasop_artifacts || {};
                                    artifactCount = Object.keys(orchestration).length;
                                } else if (event.type === 'step_complete') {
                                    process.stdout.write('.');
                                } else if (event.type === 'orchestration_failed' || event.type === 'step_failed') {
                                    console.error(`\n❌ Failed: ${event.error}`);
                                }
                            } catch (e: any) {
                                if (process.env.DEBUG) console.log(`[Parse Error] ${e.message}`);
                            }
                        }
                    }

                    splitIndex = buffer.indexOf('\n\n');
                }
            }
        }

        console.log(''); // Newline after progress dots

        const duration = (Date.now() - startTime) / 1000;
        console.log(`✅ ${modelName} completed in ${duration.toFixed(2)}s`);
        console.log(`📊 Generated ${artifactCount} artifacts.`);

        // Save results
        const outputDir = path.join(process.cwd(), 'test_results', 'benchmark', modelName.replace(/\s+/g, '_').toLowerCase());
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(
            path.join(outputDir, 'blueprint.json'),
            JSON.stringify(finalData, null, 2)
        );

        if (artifactCount === 0 && !finalData.success) {
            throw new Error("Pipeline finished but reported failure or 0 artifacts.");
        }

        return {
            model: modelName,
            id: modelId,
            duration,
            artifactsCount: artifactCount,
            success: true
        };

    } catch (error: any) {
        console.error(`❌ ${modelName} Benchmark Failed:`, error.message);
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
    // Ensure benchmark directory exists
    const benchmarkBase = path.join(process.cwd(), 'test_results', 'benchmark');
    if (!fs.existsSync(benchmarkBase)) {
        fs.mkdirSync(benchmarkBase, { recursive: true });
    }

    const results = [];

    // Run Gemini 3 Flash
    results.push(await runBenchmark("Gemini 3 Flash", "gemini-3-flash-preview"));

    // Add a cool-down/separator
    console.log("\nWaiting 10 seconds before next run...\n");
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Run Gemini 3 Pro
    results.push(await runBenchmark("Gemini 3 Pro", "gemini-3-pro-preview"));

    // Generate Report
    console.log("\n\n📋 BENCHMARK REPORT");
    console.log("===================");
    console.table(results);

    const reportPath = path.join(benchmarkBase, 'summary.md');
    let reportMd = `# Gemini Model Benchmark Report\n\nDate: ${new Date().toISOString()}\n\n`;
    reportMd += `| Model | Duration (s) | Artifacts | Success | Error |\n`;
    reportMd += `|-------|--------------|-----------|---------|-------|\n`;

    results.forEach(r => {
        reportMd += `| ${r.model} | ${r.duration.toFixed(2)} | ${r.artifactsCount} | ${r.success ? '✅' : '❌'} | ${r.error || '-'} |\n`;
    });

    fs.writeFileSync(reportPath, reportMd);
    console.log(`\nReport saved to: ${reportPath}`);
}

main().catch(console.error);
