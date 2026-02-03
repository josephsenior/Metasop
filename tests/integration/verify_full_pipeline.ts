
import 'dotenv/config';
import { productManagerAgent } from '../../lib/metasop/agents/product-manager';
import { architectAgent } from '../../lib/metasop/agents/architect';
import { engineerAgent } from '../../lib/metasop/agents/engineer';
import { devopsAgent } from '../../lib/metasop/agents/devops';
import { securityAgent } from '../../lib/metasop/agents/security';
import { uiDesignerAgent } from '../../lib/metasop/agents/ui-designer';
import { qaAgent } from '../../lib/metasop/agents/qa';
import { AgentContext } from '../../lib/metasop/types';
import type {
    ArchitectBackendArtifact,
    DevOpsBackendArtifact,
    EngineerBackendArtifact,
    ProductManagerBackendArtifact,
    QABackendArtifact,
    SecurityBackendArtifact,
    UIDesignerBackendArtifact,
} from '../../lib/metasop/types';

async function runFullVerification() {
    console.log("🚀 Starting Full Agent Pipeline Verification...\n");

    const startTime = Date.now();
    const context: AgentContext = {
        user_request: "Build a modern Portfolio website for a Freelance Developer with a blog and contact form. Use Next.js and Tailwind CSS.",
        previous_artifacts: {},
    };

    try {
        // 1. PM Agent
        console.log("📝 Running Product Manager Agent...");
        const pmResult = await productManagerAgent(context);
        context.previous_artifacts.pm_spec = pmResult;
        const pmContent = pmResult.content as ProductManagerBackendArtifact;
        console.log(` ✅ PM Spec: ${pmContent.user_stories?.length} user stories.\n`);

        // 2. Architect Agent
        console.log("🏗️ Running Architect Agent...");
        const archResult = await architectAgent(context);
        context.previous_artifacts.arch_design = archResult;
        const archContent = archResult.content as ArchitectBackendArtifact;
        console.log(` ✅ Arch Design: ${archContent.apis?.length} APIs, ${archContent.database_schema?.tables?.length} tables.\n`);

        // 3. DevOps Agent
        console.log("♾️ Running DevOps Agent...");
        const devopsResult = await devopsAgent(context);
        context.previous_artifacts.devops_infrastructure = devopsResult;
        const devopsContent = devopsResult.content as DevOpsBackendArtifact;
        console.log(` ✅ DevOps: ${devopsContent.infrastructure ? 'Generated' : 'Missing'}.\n`);

        // 4. Security Agent
        console.log("🛡️ Running Security Agent...");
        const securityResult = await securityAgent(context);
        context.previous_artifacts.security_architecture = securityResult;
        const securityContent = securityResult.content as SecurityBackendArtifact;
        console.log(` ✅ Security: ${securityContent.threat_model?.length} threats identified.\n`);

        // 5. UI Designer Agent
        console.log("🎨 Running UI Designer Agent...");
        const uiResult = await uiDesignerAgent(context);
        context.previous_artifacts.ui_design = uiResult;
        const uiContent = uiResult.content as UIDesignerBackendArtifact;
        console.log(` ✅ UI Designer: ${uiContent.component_hierarchy ? 'Generated' : 'Missing'}.\n`);

        // 6. Engineer Agent
        console.log("⚙️ Running Engineer Agent...");
        const engineerResult = await engineerAgent(context);
        context.previous_artifacts.engineer_impl = engineerResult;
        const engineerContent = engineerResult.content as EngineerBackendArtifact;
        console.log(` ✅ Engineer: ${engineerContent.dependencies?.length} dependencies.\n`);

        // 7. QA Agent
        console.log("🧪 Running QA Agent...");
        const qaResult = await qaAgent(context);
        context.previous_artifacts.qa_verification = qaResult;
        const qaContent = qaResult.content as QABackendArtifact;
        console.log(` ✅ QA: ${qaContent.test_cases?.length} test cases planned.\n`);

        console.log("=".repeat(80));
        console.log("🏆 FULL PIPELINE VERIFICATION SUCCESSFUL!");
        console.log(`Total duration: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
        console.log("=".repeat(80));

    } catch (error: any) {
        console.error("\n" + "=".repeat(80));
        console.error("🔥 PIPELINE FAILED!");
        console.error("Error Message:", error.message);
        if (error.stack) console.error("Stack:", error.stack);
        console.error("=".repeat(80));
        process.exit(1);
    }
}

runFullVerification();
