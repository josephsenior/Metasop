import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const PROMPT_HEALTHTRACK = `Design and architect 'HealthTrack', an enterprise-grade telemedicine and remote patient monitoring platform.

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

async function testFullPipeline() {
    console.log('\n🏥 Starting Full Pipeline Verification: HealthTrack Enterprise Project\n');
    console.log('Target API: http://localhost:3000/api/diagrams/generate\n');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 900000); // 15 minutes

    try {
        const response = await fetch('http://localhost:3000/api/diagrams/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: PROMPT_HEALTHTRACK,
                options: {
                    useThinking: false // Using standard mode for reliable JSON output
                }
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', errorText);
            return;
        }

        const data = await response.json();
        console.log('✅ Orchestration Complete!\n');

        const artifactsMap = data.data?.orchestration?.artifacts || data.artifacts || {};
        const finalArtifacts = Object.values(artifactsMap);

        console.log(`Received ${finalArtifacts.length} artifacts.\n`);

        // Save results for manual inspection
        const outputDir = path.join(process.cwd(), 'test_results', 'healthtrack');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(
            path.join(outputDir, 'complete_blueprint.json'),
            JSON.stringify(data, null, 2)
        );

        console.log(`📊 Artifact Summary:`);
        finalArtifacts.forEach((art: any) => {
            console.log(`\n--- [${art.role.toUpperCase()}] (${art.step_id}) ---`);

            // Check for elite framework indicators
            if (art.step_id === 'pm_spec') {
                console.log(`  - SWOT: ${art.content.swot ? '✅ Present' : '❌ Missing'}`);
                console.log(`  - INVEST Analysis: ${art.content.invest_analysis ? '✅ Present' : '❌ Missing'}`);
                console.log(`  - Stakeholders: ${art.content.stakeholders?.length || 0} found`);
            }
            if (art.step_id === 'arch_design') {
                console.log(`  - ADRs: ${art.content.decisions?.length || 0} found`);
                const hasStatus = art.content.decisions?.every((d: any) => d.status && d.consequences);
                console.log(`  - ADR Compliance: ${hasStatus ? '✅ Valid' : '❌ Missing Status/Consequences'}`);
            }
            if (art.step_id === 'devops_infrastructure') {
                console.log(`  - IaC: ${art.content.infrastructure?.iac || '❌ Missing'}`);
                console.log(`  - DR Strategy: ${art.content.disaster_recovery?.backup_strategy ? '✅ Present' : '❌ Missing'}`);
            }
            if (art.step_id === 'security_architecture') {
                console.log(`  - Standards: ${art.content.compliance_standards?.join(', ') || '❌ Missing'}`);
                console.log(`  - Encryption: ${art.content.encryption?.envelope_encryption ? '✅ Envelope Enabled' : '❌ Basic Only'}`);
            }
            if (art.step_id === 'ui_design') {
                console.log(`  - Atomic Structure: ${art.content.atomic_structure ? '✅ Present' : '❌ Missing'}`);
                console.log(`  - WCAG Level: ${art.content.wcag_level || '❌ Missing'}`);
            }
            if (art.step_id === 'qa_verification') {
                const hasGherkin = art.content.test_cases?.every((t: any) => t.gherkin);
                console.log(`  - Gherkin Steps: ${hasGherkin ? '✅ Present' : '❌ Missing'}`);
                console.log(`  - Planned Test Cases: ${art.content.test_cases?.length || 0}`);
            }
        });

        console.log(`\n📁 Full results saved to: ${outputDir}`);

    } catch (error: any) {
        console.error('❌ Request failed:', error.message);
    }
}

testFullPipeline();
