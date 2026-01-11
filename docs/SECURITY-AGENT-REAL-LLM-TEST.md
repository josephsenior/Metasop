# Security Agent Real LLM Test Guide

## Quick Setup

You have `OPENROUTER_API_KEY` configured! To test the Security Agent with a real LLM, you need to set the provider in `.env.local`:

### Option 1: OpenRouter with Free Model (Recommended)

Add to `.env.local`:

```bash
METASOP_LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your-existing-key
METASOP_LLM_MODEL=meta-llama/llama-3.3-70b-instruct:free
```

**Free models available:**
- `meta-llama/llama-3.3-70b-instruct:free` - Best quality (recommended)
- `qwen/qwen-2.5-72b-instruct:free` - Excellent for structured output
- `deepseek/deepseek-chat:free` - Fast and reliable
- `google/gemini-flash-1.5:free` - Good quality

### Option 2: OpenRouter Router (Automatic Model Selection)

```bash
METASOP_LLM_PROVIDER=openrouter-router
OPENROUTER_API_KEY=your-existing-key
```

This automatically selects the best free model based on performance.

### Option 3: Other Providers

**Groq (Free, Fast):**
```bash
METASOP_LLM_PROVIDER=groq
GROQ_API_KEY=your-groq-key
GROQ_MODEL=llama-3.1-70b-versatile
```

**OpenAI (Paid, Best Quality):**
```bash
METASOP_LLM_PROVIDER=openai
OPENAI_API_KEY=your-openai-key
METASOP_LLM_MODEL=gpt-4o-mini
```

**Gemini (Free tier available):**
```bash
METASOP_LLM_PROVIDER=gemini
GOOGLE_AI_API_KEY=your-google-key
METASOP_LLM_MODEL=gemini-2.0-flash-exp
```

## Running the Test

After setting up `.env.local`, run:

```bash
npx tsx scripts/test-security-agent-real-llm.js
```

## Expected Results

With a real LLM provider, you should see:

✅ **More detailed threats** - Context-specific to the application
✅ **More security controls** - Tailored to the architecture
✅ **Better descriptions** - More detailed and specific
✅ **Context-aware content** - Based on the actual application requirements

## What to Look For

1. **Threat Model:**
   - Should have 3-8 threats
   - Threats should be specific to the application (todo app with auth)
   - Mitigations should be detailed and practical

2. **Security Controls:**
   - Should have 5-10 controls
   - Controls should be specific to the tech stack
   - Implementation details should be actionable

3. **Authentication/Authorization:**
   - Should match the application requirements
   - Should consider the architecture (REST API, database, etc.)

4. **Encryption:**
   - Should be appropriate for the data types
   - Key management should be practical

## Troubleshooting

**If you see "Using fallback template":**
- Check that `METASOP_LLM_PROVIDER` is set correctly
- Verify API key is valid
- Check network connectivity
- Try a different model

**If validation fails:**
- The LLM might not be following the schema exactly
- Check the error messages for specific field issues
- Try a different model with better structured output support

