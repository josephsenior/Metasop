(async () => {
  try {
    const apiKey = process.env.OPENAI_API_KEY || process.env.METASOP_LLM_API_KEY;
    if (!apiKey) {
      console.log('NO_KEY');
      process.exit(0);
    }

    const model = process.env.METASOP_LLM_MODEL || 'gpt-4o-mini';
    const prompt = 'Say hello from OpenAI';

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const text = await res.text();
    if (!res.ok) {
      console.log('ERR', res.status, res.statusText, text.substring(0, 1000));
      process.exit(0);
    }

    try {
      const data = JSON.parse(text);
      console.log('OK model:', data.model || '(not provided)');
      console.log('OK response preview:', (data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '').trim());
    } catch {
      console.log('OK response (raw):', text.substring(0, 1000));
    }
  } catch (error) {
    console.log('ERR', error && error.message ? error.message : String(error));
  }
})();
