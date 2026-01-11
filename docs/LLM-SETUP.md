# LLM Setup and Configuration Guide

This guide covers all aspects of setting up and configuring LLM providers for the MetaSOP system.

## Quick Start

### Recommended: OpenRouter Router (Free Models)

The easiest way to get started with high-quality free models:

```bash
# Add to .env.local
METASOP_LLM_PROVIDER=openrouter-router
OPENROUTER_API_KEY=your-api-key-here
```

**Benefits:**
- ✅ Free to use
- ✅ Automatic model selection based on performance
- ✅ Fallback to multiple models if one fails
- ✅ Good quality from models like DeepSeek, Qwen, Llama

## LLM Providers

### 1. OpenRouter Router (Recommended - Free)

Intelligent routing across multiple free models with automatic fallback.

**Setup:**
```bash
METASOP_LLM_PROVIDER=openrouter-router
OPENROUTER_API_KEY=your-api-key-here
```

**Features:**
- Performance-based routing
- Automatic fallback
- Performance tracking
- Free models only

**Default Models:**
- Top Tier: Grok 2, DeepSeek Chat/R1, Gemini Flash 1.5
- High Quality: Qwen 2.5 (72B, 32B, 14B, 7B), Llama 3.1 70B/8B
- Additional: GLM-4, Mistral, Zephyr, OpenChat, Yi

See [LLM-ROUTER.md](./LLM-ROUTER.md) for detailed router documentation.

### 2. OpenRouter with Specific Model

Use a specific high-quality model from OpenRouter.

**Setup:**
```bash
METASOP_LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your-api-key-here
METASOP_LLM_MODEL=anthropic/claude-3.5-sonnet
```

**Recommended Models (best to good):**
1. `anthropic/claude-3.5-sonnet` - Best quality, detailed outputs
2. `openai/gpt-4-turbo` - Excellent quality
3. `google/gemini-pro-1.5` - Great quality, good value
4. `anthropic/claude-3-opus` - Very detailed outputs
5. `openai/gpt-4` - Reliable quality

### 3. Groq API (Free, Fast)

**Why it's great:**
- ✅ 100% FREE - No credit card required
- ✅ Very fast - Up to 800 tokens/sec
- ✅ JSON mode support - Reliable structured output
- ✅ High-quality models - Llama 3.1 70B, Mixtral 8x7B
- ✅ 30 requests/minute

**Setup:**
```bash
GROQ_API_KEY=your-groq-api-key-here
METASOP_LLM_PROVIDER=groq
GROQ_MODEL=llama-3.1-70b-versatile
```

**Models:**
- `llama-3.1-70b-versatile` - Best quality (recommended)
- `mixtral-8x7b-32768` - Fast and good quality
- `gemma-7b-it` - Smaller, faster

### 4. Together AI (Free Credits)

**Why it's good:**
- ✅ $25 free credits - Enough for thousands of requests
- ✅ No credit card required for free tier
- ✅ High-quality models - Llama 3.1 70B, Mixtral, Qwen
- ✅ Good structured output

**Setup:**
```bash
TOGETHER_API_KEY=your-together-api-key-here
METASOP_LLM_PROVIDER=together
TOGETHER_MODEL=meta-llama/Llama-3.1-70B-Instruct-Turbo
```

**Models:**
- `meta-llama/Llama-3.1-70B-Instruct-Turbo` - Best quality
- `mistralai/Mixtral-8x7B-Instruct-v0.1` - Fast and good
- `Qwen/Qwen2.5-72B-Instruct` - Excellent for structured output

### 5. OpenAI Direct

**Setup:**
```bash
METASOP_LLM_PROVIDER=openai
OPENAI_API_KEY=your-openai-api-key
METASOP_LLM_MODEL=gpt-4-turbo-preview
```

**GPT-4o-mini Free Tier:**
- ✅ Available in OpenAI's free tier
- ✅ 3 requests/minute, 200 requests/day
- ✅ 40,000 tokens per minute
- ✅ Same quality as paid tier
- ✅ Perfect for development and small production deployments

**Setup for free tier:**
```bash
METASOP_LLM_PROVIDER=openai
OPENAI_API_KEY=your-free-tier-key
METASOP_LLM_MODEL=gpt-4o-mini
```

### 6. Google Gemini (Free Tier Available)

**Why it's good:**
- ✅ Free tier available (generous limits)
- ✅ Fast inference
- ✅ Structured output support via `responseSchema`
- ✅ Cost-effective

**Setup:**
```bash
METASOP_LLM_PROVIDER=gemini
GOOGLE_AI_API_KEY=your-key
METASOP_LLM_MODEL=gemini-1.5-flash  # or gemini-2.0-flash-exp
```

**Free Tier Limits:**
- Gemini 1.5 Flash: 500 requests/day, 10-15 RPM, 250k TPM
- Gemini 2.0 Flash: 200 requests/day, 15 RPM, 1M TPM

**Note:** May require billing account linked (even for free tier). See troubleshooting section if you encounter quota issues.

### 7. Token Factory (Free Hosted Llama)

**Setup:**
```bash
TOKEN_FACTORY_API_KEY=your-key
TOKEN_FACTORY_BASE_URL=https://tokenfactory.esprit.tn/api
METASOP_LLM_PROVIDER=tokenfactory
METASOP_LLM_MODEL=hosted_vllm/Llama-3.1-70B-Instruct
```

**Features:**
- ✅ Free hosted Llama models
- ✅ OpenAI-compatible API
- ✅ JSON mode support

## Configuration

### Environment Variables

```bash
# Provider selection
METASOP_LLM_PROVIDER=openrouter-router  # or openrouter, groq, together, openai, tokenfactory

# API Keys (provider-specific)
OPENROUTER_API_KEY=your-key
GROQ_API_KEY=your-key
TOGETHER_API_KEY=your-key
OPENAI_API_KEY=your-key
TOKEN_FACTORY_API_KEY=your-key

# Model selection (if not using router)
METASOP_LLM_MODEL=anthropic/claude-3.5-sonnet

# Custom model list for router (optional)
METASOP_LLM_MODELS=x-ai/grok-2-1212:free,google/gemini-flash-1.5:free
```

### Token Limits

Default: 8000 tokens (allows for detailed outputs)

To increase:
```typescript
// lib/metasop/config.ts
llm: {
  maxTokens: 16000, // Increased for comprehensive outputs
}
```

## Quality Expectations

### With Free Models (OpenRouter Router, Groq, Together)
- **PM User Stories:** 5-10 detailed stories
- **PM Acceptance Criteria:** 10-15 criteria
- **Architect APIs:** 8-15 endpoints
- **Architect Decisions:** 5-10 decisions
- **Database Tables:** 5-10 tables
- **Design Doc:** 2000+ characters

### With Premium Models (Claude 3.5 Sonnet, GPT-4 Turbo)
- **PM User Stories:** 8-12 detailed stories
- **PM Acceptance Criteria:** 12-18 criteria
- **Architect APIs:** 10-15 endpoints
- **Architect Decisions:** 6-10 decisions
- **Database Tables:** 5-10 tables
- **Design Doc:** 2000-3000 characters

## Cost Considerations

### Free Options
- **OpenRouter Router:** $0 (free models)
- **Groq:** $0 (completely free)
- **Together AI:** $0 (free credits, then pay-as-you-go)
- **Token Factory:** $0 (free hosted models)

### Paid Options
- **Claude 3.5 Sonnet:** ~$3-5 per diagram
- **GPT-4 Turbo:** ~$2-4 per diagram
- **Gemini Pro:** ~$1-2 per diagram
- **GPT-4o-mini:** ~$0.005-0.015 per diagram (has free tier: 3 req/min, 200 req/day)

## Troubleshooting

### All Models Failing
1. Check your API key
2. Verify models are still available
3. Check network connectivity
4. Review error messages in logs

### Low Quality Outputs
1. Try a premium model (Claude 3.5 Sonnet, GPT-4 Turbo)
2. Increase maxTokens to 16000
3. Check prompt quality
4. Verify JSON schema mode is enabled

### Rate Limiting
- Free tiers have rate limits
- Consider upgrading or using multiple providers
- Implement request queuing if needed

## Best Practices

1. **Start with Free Models:** Use OpenRouter Router or Groq for development
2. **Upgrade for Production:** Use premium models (Claude 3.5 Sonnet) for production
3. **Monitor Performance:** Check router stats to see which models work best
4. **Handle Errors:** Always wrap LLM calls in try-catch
5. **Use Structured Output:** Enable JSON schema mode for reliable outputs

## Related Documentation

- [LLM-ROUTER.md](./LLM-ROUTER.md) - Detailed router documentation
- [PRODUCTION-QUALITY-GUIDE.md](./PRODUCTION-QUALITY-GUIDE.md) - Quality improvement strategies
- [TESTING.md](./TESTING.md) - Testing LLM outputs

