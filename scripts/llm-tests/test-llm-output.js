/**
 * Test script to check what the LLM is actually generating
 */

// Use built-in fetch in Node.js 18+
const fetch = globalThis.fetch || require('node-fetch');

async function testLLMOutput() {
  console.log('🧪 Testing LLM Output Quality\n');
  console.log('='.repeat(80));
  
  const testPrompt = "Create a todo app with user authentication, task CRUD operations, and real-time updates";
  
  console.log(`📝 Test Prompt: "${testPrompt}"\n`);
  console.log('⏳ Calling diagram generation API...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/diagrams/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: testPrompt,
        options: {
          includeAPIs: true,
          includeDatabase: true,
          includeStateManagement: true,
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    const diagram = data.data.diagram;
    
    console.log('='.repeat(80));
    console.log('📊 DETAILED OUTPUT ANALYSIS\n');
    console.log('='.repeat(80));
    
    // Analyze Product Manager output
    const pmNode = diagram.nodes.find(n => n.id === 'agent-pm');
    if (pmNode) {
      console.log('\n📋 PRODUCT MANAGER:');
      console.log(`   User Stories: ${pmNode.data.user_stories?.length || 0}`);
      if (pmNode.data.user_stories && pmNode.data.user_stories.length > 0) {
        pmNode.data.user_stories.forEach((story, idx) => {
          console.log(`   Story ${idx + 1}: ${story.title || story.story || story}`);
          if (story.acceptance_criteria) {
            console.log(`      Acceptance Criteria: ${story.acceptance_criteria.length}`);
          }
        });
      }
      console.log(`   Acceptance Criteria: ${pmNode.data.acceptance_criteria?.length || 0}`);
    }
    
    // Analyze Architect output
    const archNode = diagram.nodes.find(n => n.id === 'agent-architect');
    if (archNode) {
      console.log('\n🏗️  ARCHITECT:');
      console.log(`   APIs: ${archNode.data.apis?.length || 0}`);
      if (archNode.data.apis && archNode.data.apis.length > 0) {
        archNode.data.apis.slice(0, 5).forEach((api, idx) => {
          console.log(`   API ${idx + 1}: ${api.method} ${api.path}`);
        });
        if (archNode.data.apis.length > 5) {
          console.log(`   ... and ${archNode.data.apis.length - 5} more`);
        }
      }
      console.log(`   Decisions: ${archNode.data.decisions?.length || 0}`);
      if (archNode.data.decisions && archNode.data.decisions.length > 0) {
        archNode.data.decisions.forEach((decision, idx) => {
          console.log(`   Decision ${idx + 1}: ${decision.decision?.substring(0, 60)}...`);
        });
      }
      console.log(`   Database Tables: ${archNode.data.tables?.length || archNode.data.database_schema?.tables?.length || 0}`);
      if (archNode.data.database_schema?.tables) {
        archNode.data.database_schema.tables.forEach((table, idx) => {
          console.log(`   Table ${idx + 1}: ${table.name} (${table.columns?.length || 0} columns)`);
        });
      }
      console.log(`   Design Doc Length: ${archNode.data.design_doc?.length || 0} chars`);
    }
    
    // Check metadata for LLM usage
    console.log('\n🔍 METADATA ANALYSIS:');
    if (diagram.metadata?.metasop_artifacts) {
      console.log('   MetaSOP Artifacts Present: ✅');
      console.log(`   Artifact Keys: ${Object.keys(diagram.metadata.metasop_artifacts).join(', ')}`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Test Complete!\n');
    
    // Summary
    console.log('📊 SUMMARY:');
    console.log(`   PM User Stories: ${pmNode?.data.user_stories?.length || 0} (target: 5-10)`);
    console.log(`   Architect APIs: ${archNode?.data.apis?.length || 0} (target: 8-15)`);
    console.log(`   Architect Decisions: ${archNode?.data.decisions?.length || 0} (target: 5-10)`);
    console.log(`   Database Tables: ${archNode?.data.database_schema?.tables?.length || 0} (target: 5-10)`);
    
    const needsImprovement = 
      (pmNode?.data.user_stories?.length || 0) < 5 ||
      (archNode?.data.apis?.length || 0) < 8 ||
      (archNode?.data.decisions?.length || 0) < 5 ||
      (archNode?.data.database_schema?.tables?.length || 0) < 5;
    
    if (needsImprovement) {
      console.log('\n⚠️  Output is still minimal. Consider:');
      console.log('   1. Switching to a better LLM model (Claude 3.5 Sonnet, GPT-4 Turbo)');
      console.log('   2. Checking if agents are using LLM responses or falling back to templates');
    } else {
      console.log('\n✅ Output quality looks good!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLLMOutput();

