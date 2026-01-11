/**
 * Test script to verify agent output completeness
 * This script makes a test API call to generate a diagram and checks the output
 */

import fetch from 'node-fetch';

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testAgentOutput() {
  console.log('🧪 Testing Agent Output Completeness\n');
  console.log('='.repeat(80));
  
  try {
    const testPrompt = "Create a todo app with user authentication, task CRUD operations, and real-time updates";
    
    console.log(`📝 Test Prompt: "${testPrompt}"\n`);
    console.log('⏳ Generating diagram...\n');
    
    const response = await fetch(`${API_URL}/api/diagrams/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: testPrompt,
        options: {
          includeStateManagement: true,
          includeAPIs: true,
          includeDatabase: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const result: any = await response.json();
    
    console.log('✅ Diagram Generated Successfully!\n');
    console.log('='.repeat(80));
    console.log('📊 DIAGRAM STRUCTURE ANALYSIS\n');
    console.log('='.repeat(80));
    
    const diagram = result.data?.diagram || result.diagram;
    
    if (!diagram) {
      console.error('❌ No diagram in response!');
      console.log('Response:', JSON.stringify(result, null, 2));
      return;
    }
    
    // Check nodes
    console.log(`\n📦 Nodes: ${diagram.nodes?.length || 0}`);
    if (diagram.nodes && diagram.nodes.length > 0) {
      diagram.nodes.forEach((node: any, index: number) => {
        console.log(`\n  Node ${index + 1}: ${node.id} (${node.label})`);
        console.log(`    Type: ${node.type}`);
        console.log(`    Position: (${node.position?.x}, ${node.position?.y})`);
        
        // Check data completeness
        if (node.data) {
          const dataKeys = Object.keys(node.data);
          console.log(`    Data Keys (${dataKeys.length}):`, dataKeys.join(', '));
          
          // Check for full artifact
          const artifactKey = node.data.agent_role === "Product Manager" ? "pm_spec" :
                             node.data.agent_role === "Architect" ? "arch_design" :
                             node.data.agent_role === "Engineer" ? "engineer_impl" :
                             node.data.agent_role === "UI Designer" ? "ui_design" :
                             node.data.agent_role === "QA" ? "qa_verification" : null;
          
          if (artifactKey) {
            if (node.data[artifactKey]) {
              const artifactKeys = Object.keys(node.data[artifactKey]);
              console.log(`    ✅ Full artifact (${artifactKey}) present with ${artifactKeys.length} keys`);
              console.log(`       Artifact keys:`, artifactKeys.join(', '));
            } else {
              console.log(`    ⚠️  WARNING: Full artifact (${artifactKey}) missing!`);
            }
          }
          
          // Check specific fields based on agent role
          if (node.data.agent_role === "Product Manager") {
            console.log(`    - User Stories: ${Array.isArray(node.data.user_stories) ? node.data.user_stories.length : 'missing'}`);
            console.log(`    - Acceptance Criteria: ${Array.isArray(node.data.acceptance_criteria) ? node.data.acceptance_criteria.length : 'missing'}`);
          } else if (node.data.agent_role === "Architect") {
            console.log(`    - APIs: ${Array.isArray(node.data.apis) ? node.data.apis.length : 'missing'}`);
            console.log(`    - Decisions: ${Array.isArray(node.data.decisions) ? node.data.decisions.length : 'missing'}`);
            console.log(`    - Database Tables: ${Array.isArray(node.data.tables) ? node.data.tables.length : 'missing'}`);
          } else if (node.data.agent_role === "Engineer") {
            console.log(`    - File Structure: ${node.data.file_structure ? 'present' : 'missing'}`);
            console.log(`    - Dependencies: ${Array.isArray(node.data.dependencies) ? node.data.dependencies.length : 'missing'}`);
            console.log(`    - Implementation Plan: ${node.data.implementation_plan ? 'present' : 'missing'}`);
          } else if (node.data.agent_role === "UI Designer") {
            console.log(`    - Component Hierarchy: ${node.data.component_hierarchy ? 'present' : 'missing'}`);
            console.log(`    - Design Tokens: ${node.data.design_tokens ? 'present' : 'missing'}`);
            console.log(`    - UI Patterns: ${Array.isArray(node.data.ui_patterns) ? node.data.ui_patterns.length : 'missing'}`);
          } else if (node.data.agent_role === "QA") {
            console.log(`    - Tests: ${node.data.tests ? 'present' : 'missing'}`);
            console.log(`    - Coverage: ${node.data.coverage ? 'present' : 'missing'}`);
            console.log(`    - Security Findings: ${Array.isArray(node.data.security_findings) ? node.data.security_findings.length : 'missing'}`);
          }
        } else {
          console.log(`    ⚠️  WARNING: No data object!`);
        }
      });
    } else {
      console.log('  ⚠️  No nodes found!');
    }
    
    // Check edges
    console.log(`\n🔗 Edges: ${diagram.edges?.length || 0}`);
    if (diagram.edges && diagram.edges.length > 0) {
      diagram.edges.forEach((edge: any, index: number) => {
        console.log(`  Edge ${index + 1}: ${edge.from} → ${edge.to}`);
      });
    }
    
    // Check metadata
    console.log(`\n📋 Metadata:`);
    if (diagram.metadata) {
      const metadataKeys = Object.keys(diagram.metadata);
      console.log(`  Keys: ${metadataKeys.join(', ')}`);
      
      if (diagram.metadata.metasop_artifacts) {
        const artifactKeys = Object.keys(diagram.metadata.metasop_artifacts);
        console.log(`  ✅ MetaSOP Artifacts: ${artifactKeys.length} artifacts`);
        artifactKeys.forEach(key => {
          console.log(`     - ${key}: ${diagram.metadata.metasop_artifacts[key] ? 'present' : 'missing'}`);
        });
      }
      
      if (diagram.metadata.metasop_steps) {
        console.log(`  ✅ MetaSOP Steps: ${diagram.metadata.metasop_steps.length} steps`);
      }
      
      if (diagram.metadata.metasop_report) {
        console.log(`  ✅ MetaSOP Report: present`);
      }
    } else {
      console.log('  ⚠️  No metadata found!');
    }
    
    // Check orchestration data
    console.log(`\n🎯 Orchestration Data:`);
    const orchestration = result.data?.orchestration || result.orchestration;
    if (orchestration) {
      console.log(`  Status: ${orchestration.status}`);
      if (orchestration.artifacts) {
        const artifactKeys = Object.keys(orchestration.artifacts);
        console.log(`  Artifacts: ${artifactKeys.join(', ')}`);
      }
      if (orchestration.steps) {
        console.log(`  Steps: ${orchestration.steps.length}`);
        orchestration.steps.forEach((step: any, index: number) => {
          console.log(`    Step ${index + 1}: ${step.step_id} (${step.role}) - ${step.status}`);
        });
      }
    }
    
    // Save full JSON for inspection
    const fs = require('fs');
    const outputPath = 'test-agent-output.json';
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`\n💾 Full response saved to: ${outputPath}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Test Complete!\n');
    
  } catch (error: any) {
    console.error('\n❌ Test Failed!');
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testAgentOutput();

