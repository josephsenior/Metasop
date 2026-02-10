# LLM Configuration

Blueprinta uses **Google Gemini** as its LLM provider. This guide covers configuration, model selection, and optimization.

---

## Quick Setup

Add your Gemini API key to `.env`:

```env
GOOGLE_AI_API_KEY=your-gemini-api-key
METASOP_LLM_PROVIDER=gemini
METASOP_LLM_MODEL=gemini-3-flash-preview
```

Get a free API key at **[Google AI Studio](https://aistudio.google.com/apikey)**.

---

## Available Models

| Model | Speed | Quality | Context | Notes |
|-------|-------|---------|---------|-------|
| `gemini-3-flash-preview` | ⚡ Fast | Good | 1M tokens | **Default** — best balance of speed and cost |
| `gemini-3-pro-preview` | Medium | Excellent | 1M tokens | Higher quality, slower |
| `gemini-2.5-flash-preview-05-20` | ⚡ Fast | Good | 1M tokens | Stable release |

### Switching Models

```env
# Use a more capable model for higher quality output
METASOP_LLM_MODEL=gemini-3-pro-preview
```

Or pass it per-run for integration tests:

```bash
METASOP_LLM_MODEL=gemini-3-pro-preview npx tsx tests/integration/verify_full_pipeline.ts
```

---

## Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GOOGLE_AI_API_KEY` | *(required)* | Your Gemini API key |
| `METASOP_LLM_PROVIDER` | `gemini` | Provider selection (`gemini` or `mock`) |
| `METASOP_LLM_MODEL` | `gemini-3-flash-preview` | Model to use |
| `METASOP_AGENT_TIMEOUT` | `180000` | Agent timeout in ms (3 minutes) |
| `METASOP_AGENT_RETRIES` | `0` | Number of retries on failure |

### Programmatic Configuration

```typescript
// lib/metasop/config.ts
llm: {
  maxTokens: 16000,    // Default: 8000. Increase for more detailed outputs.
  temperature: 0.7,    // Lower = more deterministic, higher = more creative.
}
```

---

## Gemini Features

- **Context caching** — Reduces latency and token consumption on repeated prompts
- **Structured JSON output** — Reliable schema-validated responses
- **Large context window** — Up to 1M tokens
- **Free tier** — 15 RPM, 1M tokens/minute

---

## Mock Provider (Offline / CI)

Use the mock provider for deterministic results without any API calls. Ideal for unit tests and CI pipelines.

```env
METASOP_LLM_PROVIDER=mock
```

```bash
# Run tests without needing an API key
METASOP_LLM_PROVIDER=mock pnpm test
```

The mock provider returns predefined responses for all agents, allowing fast, reproducible test runs.

---

## Quality Tips

1. **Use `gemini-3-pro-preview`** for the best output quality
2. **Increase `maxTokens`** to 16000+ to avoid truncation in complex diagrams
3. **Lower temperature** (0.3–0.5) for more consistent, deterministic outputs
4. **Use mock for CI** — Keep real API calls for development and production only

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Invalid API key" | Verify the key in `.env`; restart `pnpm dev` after changes |
| Low quality output | Try `gemini-3-pro-preview` or increase `maxTokens` |
| Slow responses | Use `gemini-3-flash-preview` (default) for speed |
| Rate limit errors | Free tier: 15 RPM. Wait or upgrade your API plan |
| Generation timeout | Increase `METASOP_AGENT_TIMEOUT` beyond 180000 |
