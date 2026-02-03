import { prisma } from "../../lib/database/prisma";

async function inspect() {
    console.log("🔍 Inspecting latest diagram artifacts...");

    const lastDiagram = await prisma.diagram.findFirst({
        orderBy: { createdAt: "desc" },
    });

    if (!lastDiagram) {
        console.log("❌ No diagrams found in database.");
        return;
    }

    console.log(`✅ Found Diagram: ${lastDiagram.title} (ID: ${lastDiagram.id})`);
    console.log(`Status: ${lastDiagram.status}`);

    const metadata = lastDiagram.metadata as any;
    const artifacts = metadata?.metasop_artifacts || {};

    console.log("\n📦 ARTIFACTS OVERVIEW:");
    Object.keys(artifacts).forEach(key => {
        console.log(`- ${key}: ${artifacts[key]?.content ? "PRESENT" : "MISSING"}`);
    });

    if (artifacts.pm_spec) {
        console.log("\n📋 PRODUCT SPECIFICATION (Sample):");
        const stories = artifacts.pm_spec.content.user_stories || [];
        console.log(`- User Stories: ${stories.length}`);
        stories.slice(0, 2).forEach((s: any, i: number) => {
            console.log(`  ${i + 1}. ${s.title}: ${s.description || s.action}`);
        });
    }

    if (artifacts.arch_design) {
        console.log("\n📐 ARCHITECTURE DESIGN (Sample):");
        const design = artifacts.arch_design.content;
        console.log(`- Database Schema: ${design.database_schema?.length || 0} tables`);
        console.log(`- APIs: ${design.apis?.length || 0} endpoints`);
    }

    if (artifacts.engineer_impl) {
        console.log("\n🛠️ ENGINEER IMPLEMENTATION (Sample):");
        const impl = artifacts.engineer_impl.content;
        console.log(`- Phases: ${impl.phases?.length || 0}`);
        console.log(`- File Structure: ${impl.file_structure ? "PRESENT" : "MISSING"}`);
        if (impl.implementation_plan) {
            console.log(`- Plan Snippet: ${impl.implementation_plan.substring(0, 100)}...`);
        }
    }
}

inspect().catch(console.error);
