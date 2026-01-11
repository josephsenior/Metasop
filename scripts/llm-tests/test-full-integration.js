/**
 * Full integration test - Tests the complete diagram generation flow
 */

const http = require('http');

const testPrompt = "Create a todo app with user authentication, task CRUD operations, and real-time updates";

function makeRequest() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      prompt: testPrompt,
      options: {
        includeStateManagement: true,
        includeAPIs: true,
        includeDatabase: true,
      },
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/diagrams/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 600000, // 600 seconds (10 minutes) - matches agent timeouts
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}, Response: ${data.substring(0, 500)}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      console.error("❌ Request timeout after 10 minutes");
      req.destroy();
      reject(new Error("Request timeout after 10 minutes"));
    });
    req.write(postData);
    req.end();
  });
}

async function test() {
  console.log('🧪 FULL INTEGRATION TEST - Real LLM Provider\n');
  console.log('='.repeat(80));
  console.log('📝 Test Prompt:', testPrompt);
  console.log('='.repeat(80));
  console.log('\n⏳ Generating diagram (this may take 5-10 minutes for all agents)...\n');
  
  try {
    const startTime = Date.now();
    const result = await makeRequest();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (result.status !== 200) {
      console.error(`❌ API returned ${result.status}`);
      if (result.data?.error) {
        console.error(`Error: ${result.data.error}`);
      }
      if (result.data?.message) {
        console.error(`Message: ${result.data.message}`);
      }
      return;
    }
    
    if (result.data.error) {
      console.error(`❌ Error: ${result.data.error}`);
      return;
    }
    
    const diagram = result.data.data.diagram;
    const orchestration = result.data.data.orchestration;
    
    // Debug: Check orchestration artifacts
    console.log('='.repeat(80));
    console.log('🔍 DEBUG: Orchestration Artifacts');
    console.log('='.repeat(80));
    if (orchestration && orchestration.artifacts) {
      console.log('Artifact keys:', Object.keys(orchestration.artifacts));
      if (orchestration.artifacts.pm_spec) {
        const pmContent = orchestration.artifacts.pm_spec.content || {};
        console.log('PM Spec content keys:', Object.keys(pmContent));
        console.log('PM user_stories:', Array.isArray(pmContent.user_stories) ? pmContent.user_stories.length : 'not array');
      }
      if (orchestration.artifacts.arch_design) {
        const archContent = orchestration.artifacts.arch_design.content || {};
        console.log('Architect content keys:', Object.keys(archContent));
        console.log('Architect apis:', Array.isArray(archContent.apis) ? archContent.apis.length : 'not array');
        console.log('Architect decisions:', Array.isArray(archContent.decisions) ? archContent.decisions.length : 'not array');
      }
    }
    console.log('');
    
    // Debug: Log all node IDs
    console.log('='.repeat(80));
    console.log('🔍 DEBUG: Diagram Structure');
    console.log('='.repeat(80));
    console.log(`Total Nodes: ${diagram.nodes?.length || 0}`);
    if (diagram.nodes && diagram.nodes.length > 0) {
      diagram.nodes.forEach((node, idx) => {
        console.log(`  Node ${idx + 1}: ${node.id} (${node.label || node.type})`);
        if (node.data) {
          const dataKeys = Object.keys(node.data);
          console.log(`    Data keys: ${dataKeys.join(', ')}`);
          // Check if full artifact is present
          if (node.data.pm_spec) {
            console.log(`    ✅ PM Spec artifact present with ${Object.keys(node.data.pm_spec).length} keys`);
          }
          if (node.data.arch_design) {
            console.log(`    ✅ Architect artifact present with ${Object.keys(node.data.arch_design).length} keys`);
          }
        }
      });
    }
    console.log('');
    
    const pmNode = diagram.nodes?.find(n => n.id === 'agent-pm');
    const archNode = diagram.nodes?.find(n => n.id === 'agent-architect');
    
    if (!pmNode) {
      console.error('❌ PM node not found!');
    }
    if (!archNode) {
      console.error('❌ Architect node not found!');
    }
    
    console.log('='.repeat(80));
    console.log('📊 COMPREHENSIVE OUTPUT EVALUATION');
    console.log('='.repeat(80));
    console.log(`\n⏱️  Total Generation Time: ${duration}s\n`);
    
    // Product Manager Evaluation
    console.log('📋 PRODUCT MANAGER AGENT:');
    console.log('-'.repeat(80));
    const pmStories = pmNode?.data?.user_stories?.length || 0;
    const pmAcceptance = pmNode?.data?.acceptance_criteria?.length || 0;
    
    const pmScore = (pmStories >= 5 ? 1 : pmStories / 5) * 0.5 + (pmAcceptance >= 10 ? 1 : pmAcceptance / 10) * 0.5;
    
    console.log(`   User Stories: ${pmStories} ${pmStories >= 5 ? '✅ EXCELLENT' : pmStories >= 3 ? '⚠️  GOOD' : '❌ POOR'} (target: 5-10)`);
    console.log(`   Acceptance Criteria: ${pmAcceptance} ${pmAcceptance >= 10 ? '✅ EXCELLENT' : pmAcceptance >= 5 ? '⚠️  GOOD' : '❌ POOR'} (target: 10-15)`);
    console.log(`   Quality Score: ${(pmScore * 100).toFixed(1)}%`);
    
    if (pmStories > 0) {
      console.log('\n   Sample User Stories:');
      pmNode.data.user_stories.slice(0, 3).forEach((story, idx) => {
        const title = story.title || story.story || story;
        const criteria = story.acceptance_criteria?.length || 0;
        const priority = story.priority || 'N/A';
        console.log(`   ${idx + 1}. [${priority}] ${title.substring(0, 70)}...`);
        console.log(`      Acceptance Criteria: ${criteria} items`);
      });
    }
    
    // Architect Evaluation
    console.log('\n🏗️  ARCHITECT AGENT:');
    console.log('-'.repeat(80));
    const archApis = archNode?.data?.apis?.length || 0;
    const archDecisions = archNode?.data?.decisions?.length || 0;
    const archTables = archNode?.data?.database_schema?.tables?.length || 0;
    const designDocLength = archNode?.data?.design_doc?.length || 0;
    
    // Debug: Log actual data structure
    if (archNode) {
      console.log('\n🔍 DEBUG: Architect Node Data Structure:');
      console.log(`  Has data object: ${!!archNode.data}`);
      if (archNode.data) {
        console.log(`  Data keys: ${Object.keys(archNode.data).join(', ')}`);
        console.log(`  APIs type: ${Array.isArray(archNode.data.apis) ? 'array' : typeof archNode.data.apis}`);
        console.log(`  APIs value: ${JSON.stringify(archNode.data.apis?.slice(0, 2) || 'null')}`);
        console.log(`  Decisions type: ${Array.isArray(archNode.data.decisions) ? 'array' : typeof archNode.data.decisions}`);
        console.log(`  Design doc type: ${typeof archNode.data.design_doc}`);
        console.log(`  Design doc length: ${archNode.data.design_doc?.length || 0}`);
      }
    }
    
    const archScore = 
      (archApis >= 8 ? 1 : archApis / 8) * 0.35 +
      (archDecisions >= 5 ? 1 : archDecisions / 5) * 0.25 +
      (archTables >= 5 ? 1 : archTables / 5) * 0.25 +
      (designDocLength >= 2000 ? 1 : designDocLength / 2000) * 0.15;
    
    console.log(`   APIs: ${archApis} ${archApis >= 8 ? '✅ EXCELLENT' : archApis >= 5 ? '⚠️  GOOD' : '❌ POOR'} (target: 8-15)`);
    console.log(`   Decisions: ${archDecisions} ${archDecisions >= 5 ? '✅ EXCELLENT' : archDecisions >= 3 ? '⚠️  GOOD' : '❌ POOR'} (target: 5-10)`);
    console.log(`   Database Tables: ${archTables} ${archTables >= 5 ? '✅ EXCELLENT' : archTables >= 3 ? '⚠️  GOOD' : '❌ POOR'} (target: 5-10)`);
    console.log(`   Design Doc: ${designDocLength} chars ${designDocLength >= 2000 ? '✅ EXCELLENT' : designDocLength >= 1000 ? '⚠️  GOOD' : '❌ POOR'} (target: 2000+)`);
    console.log(`   Quality Score: ${(archScore * 100).toFixed(1)}%`);
    
    if (archApis > 0) {
      console.log('\n   Sample APIs:');
      archNode.data.apis.slice(0, 5).forEach((api, idx) => {
        const auth = api.auth_required ? '🔒' : '🔓';
        console.log(`   ${idx + 1}. ${auth} ${api.method} ${api.path}`);
        console.log(`      ${api.description?.substring(0, 70)}...`);
      });
      if (archApis > 5) {
        console.log(`   ... and ${archApis - 5} more APIs`);
      }
    }
    
    if (archDecisions > 0) {
      console.log('\n   Sample Decisions:');
      archNode.data.decisions.slice(0, 3).forEach((decision, idx) => {
        console.log(`   ${idx + 1}. ${decision.decision?.substring(0, 70)}...`);
        console.log(`      Reason: ${decision.reason?.substring(0, 60)}...`);
      });
    }
    
    if (archTables > 0) {
      console.log('\n   Database Tables:');
      archNode.data.database_schema.tables.forEach((table, idx) => {
        const colCount = table.columns?.length || 0;
        console.log(`   ${idx + 1}. ${table.name} (${colCount} columns)`);
      });
    }
    
    // Overall Quality Score
    const overallScore = (pmScore * 0.3) + (archScore * 0.7);
    
    console.log('\n' + '='.repeat(80));
    console.log(`🎯 OVERALL QUALITY SCORE: ${(overallScore * 100).toFixed(1)}%`);
    console.log('='.repeat(80));
    
    if (overallScore >= 0.8) {
      console.log('\n✅ EXCELLENT - Llama 3.3 70B Instruct is producing high-quality, detailed outputs!');
      console.log('   The model is generating comprehensive diagrams with all required details.');
    } else if (overallScore >= 0.6) {
      console.log('\n⚠️  GOOD - Better than before but could be more detailed');
      console.log('   Consider: Better prompts, higher max_tokens, or model fine-tuning');
    } else {
      console.log('\n❌ POOR - Output is still minimal');
      console.log('   Issues: Model may not be following instructions, or validation is too strict');
    }
    
    // Comparison with previous results
    console.log('\n📊 COMPARISON WITH PREVIOUS RESULTS:');
    console.log('-'.repeat(80));
    console.log('   Previous (Free Models):');
    console.log('     - PM Stories: 1, APIs: 3, Decisions: 1, Tables: 2');
    console.log('   Current (Llama 3.3 70B):');
    console.log(`     - PM Stories: ${pmStories}, APIs: ${archApis}, Decisions: ${archDecisions}, Tables: ${archTables}`);
    
    const improvement = 
      ((pmStories - 1) / 1 * 100).toFixed(0) + '%' + ' / ' +
      ((archApis - 3) / 3 * 100).toFixed(0) + '%' + ' / ' +
      ((archDecisions - 1) / 1 * 100).toFixed(0) + '%' + ' / ' +
      ((archTables - 2) / 2 * 100).toFixed(0) + '%';
    
    console.log(`   Improvement: ${improvement}`);
    
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('500')) {
      console.error('\n💡 Tip: Make sure your dev server is running and has been restarted');
      console.error('   The server needs to pick up the new METASOP_LLM_MODEL environment variable');
    }
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Tip: Start your dev server with: npm run dev');
    }
  }
}

test();

