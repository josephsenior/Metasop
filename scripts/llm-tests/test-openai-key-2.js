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
        messages: [{ role: 'user', content: prompt }],
        max_completion_tokens: 50,
        temperature: 0.2
      })
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.log('ERR', res.status, res.statusText, text.substring(0, 1000));
      process.exit(0);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || data.choices?.[0]?.text;
    console.log('OK', content?.trim?.());
  } catch (e) {
    console.log('ERR', e && e.message ? e.message : String(e));
  }
})();
