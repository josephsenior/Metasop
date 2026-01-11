// Using Node.js built-in fetch

async function testRateLimitBackoff() {
  const url = 'http://localhost:3000/api/diagrams/generate';

  const payload = {
    prompt: "Create a comprehensive social media platform with user profiles, posts, comments, likes, and real-time notifications",
    options: {
      includeStateManagement: true,
      includeAPIs: true,
      includeDatabase: true
    }
  };

  console.log('🧪 Testing diagram generation with exponential backoff for rate limits...');
  console.log('🤖 Model: GPT-4o-mini with enhanced retry logic');
  console.log('⏱️  Expecting longer delays between retries for rate limits');
  console.log('📤 Sending request to:', url);
  console.log('');

  const startTime = Date.now();

  try {
    console.log('🔗 Making request to:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      // Add timeout
      signal: AbortSignal.timeout(600000) // 10 minutes timeout
    });

    const totalTime = Date.now() - startTime;
    console.log(`⏱️  Total request time: ${(totalTime / 1000).toFixed(1)}s`);

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Success! Response structure:');
    console.log('Status:', result.status);
    console.log('Message:', result.message);

    if (result.data) {
      console.log('');
      console.log('📊 Diagram data:');
      console.log('- Diagram ID:', result.data.diagram?.id);
      console.log('- Title:', result.data.diagram?.title);
      console.log('- Status:', result.data.diagram?.status);
      console.log('- Nodes count:', result.data.diagram?.nodes?.length || 0);
      console.log('- Edges count:', result.data.diagram?.edges?.length || 0);

      if (result.data.orchestration) {
        console.log('');
        console.log('🤖 MetaSOP Orchestration:');
        console.log('- Status:', result.data.orchestration.status);

        // Show artifacts
        const artifacts = result.data.orchestration.artifacts || {};
        console.log('- Artifacts generated:', Object.keys(artifacts).length);

        // Show orchestration steps with timing
        if (result.data.orchestration.steps) {
          console.log('- Steps with timing:');
          result.data.orchestration.steps.forEach((step, index) => {
            const status = step.status || 'unknown';
            const duration = step.duration ? `${(step.duration / 1000).toFixed(1)}s` : 'unknown';
            console.log(`    ${index + 1}. ${step.step_id || 'unknown'} - ${status} (${duration})`);
          });
        }

        // Show events with rate limit retry information
        if (result.data.orchestration.report?.events) {
          console.log('');
          console.log('📈 Rate Limit Analysis:');
          let rateLimitRetries = 0;
          let totalRetries = 0;

          result.data.orchestration.report.events.forEach((event, index) => {
            if (event.status === 'running') {
              console.log(`  ${index + 1}. ${event.step_id} started at ${new Date(event.timestamp).toLocaleTimeString()}`);
            } else if (event.status === 'success') {
              console.log(`  ✅ ${event.step_id} completed at ${new Date(event.timestamp).toLocaleTimeString()}`);
            } else if (event.status === 'failed') {
              console.log(`  ❌ ${event.step_id} failed at ${new Date(event.timestamp).toLocaleTimeString()}`);
              totalRetries++;
            }
          });

          console.log('');
          console.log('📊 Retry Statistics:');
          console.log('- Total failed attempts:', totalRetries);
          console.log('- Rate limit retries detected:', rateLimitRetries > 0 ? 'Yes' : 'None detected');
        }
      }

      if (result.data.guest) {
        console.log('');
        console.log('👤 Guest mode:', result.data.guest.message);
      }

      // Show node details
      if (result.data.diagram?.nodes && result.data.diagram.nodes.length > 0) {
        console.log('');
        console.log('🔍 Agent Nodes:');
        result.data.diagram.nodes.forEach((node, index) => {
          console.log(`${index + 1}. ${node.label} (${node.type}) - ${node.data?.agent_role}`);
        });

        // Show completion status
        const totalAgents = 6; // PM, Architect, DevOps, Security, Engineer, UI, QA
        const completedAgents = result.data.diagram.nodes.length;
        const completionRate = ((completedAgents / totalAgents) * 100).toFixed(1);

        console.log('');
        console.log('📈 Completion Status:');
        console.log(`- Agents completed: ${completedAgents}/${totalAgents} (${completionRate}%)`);

        if (completedAgents === totalAgents) {
          console.log('🎉 FULL ORCHESTRATION SUCCESS! All agents completed.');
        } else if (completedAgents >= 4) {
          console.log('✅ MOSTLY SUCCESS! Core agents completed.');
        } else if (completedAgents >= 2) {
          console.log('⚠️ PARTIAL SUCCESS! Basic agents completed.');
        } else {
          console.log('❌ LIMITED SUCCESS! Very few agents completed.');
        }

        // Check if rate limit backoff worked
        if (totalTime > 120000) { // More than 2 minutes
          console.log('⏰ LONG EXECUTION TIME: Suggests rate limit backoff is working!');
        }
      }
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Wait longer for server to be fully ready
setTimeout(testRateLimitBackoff, 15000);