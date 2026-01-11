# Token Factory Provider

Token Factory provides free hosted Llama models via an OpenAI-compatible API.

## Overview

**Features:**
- ✅ **Free prototyping** - No API costs
- ✅ **Fast inference** - Hosted, no local setup needed
- ✅ **JSON mode support** - Reliable structured output
- ✅ **OpenAI-compatible** - Drop-in replacement
- ✅ **JSON Schema Mode** - Strict schema enforcement

## Setup

### Environment Variables

Add these to your `.env.local`:

```bash
# Token Factory API Configuration
TOKEN_FACTORY_API_KEY=your-api-key-here
TOKEN_FACTORY_BASE_URL=https://tokenfactory.esprit.tn/api
METASOP_LLM_MODEL=hosted_vllm/Llama-3.1-70B-Instruct

# MetaSOP Configuration
METASOP_LLM_PROVIDER=tokenfactory
```

### Available Models

- `hosted_vllm/Llama-3.1-70B-Instruct` (default) - High quality, 70B parameters
- `hosted_vllm/Llama-3.3-7B-Instruct` - Faster, 7B parameters (if available)

## Usage

### Basic Usage

The provider is automatically used when `METASOP_LLM_PROVIDER=tokenfactory` is set.

### Testing

Test the connection:

```bash
node scripts/test-tokenfactory.js
```

### In Code

```typescript
import { getLLMProvider } from "@/lib/metasop/utils/llm-helper";

const provider = getLLMProvider();
// Provider will use Token Factory if configured
```

## JSON Schema Mode

Token Factory supports **JSON Schema Mode** (strict), which provides:

- ✅ **Guaranteed Schema Compliance** - API enforces schema at generation time
- ✅ **Type Safety** - Strings are strings, numbers are numbers
- ✅ **Constraint Enforcement** - minItems, required fields, etc.
- ✅ **Better Quality** - Model is forced to follow the schema
- ✅ **Reduced Post-Processing** - No need to check if fields exist

The adapter automatically:
1. Tries JSON Schema Mode first (strictest, best results)
2. Falls back to JSON Mode if schema mode isn't supported
3. Converts schemas to OpenAI JSON Schema format automatically
4. Logs which mode was used for debugging

## Benefits

### Before (JSON Mode):
- Model might return 3 APIs instead of 8-15
- Model might skip required fields
- Model might add unexpected fields
- Need extensive validation after parsing

### After (JSON Schema Mode):
- ✅ **Guaranteed** 8-15 APIs (if minItems: 8, maxItems: 15)
- ✅ **Guaranteed** all required fields present
- ✅ **Guaranteed** no extra fields (if additionalProperties: false)
- ✅ **Minimal** validation needed

## Performance

- **No performance penalty** - validation happens at API level
- **Faster development** - less error handling needed
- **More reliable** - fewer edge cases to handle

## Testing

Run the test script:

```bash
node scripts/test-tokenfactory.js
```

Expected results:
```
✅ JSON Schema Mode: SUPPORTED
✅ Response: Valid JSON
✅ Schema Validation: PASSED
✅ All required fields present
✅ Correct data types
✅ Constraints enforced (minItems, etc.)
```

## Troubleshooting

### Connection Issues
- Verify `TOKEN_FACTORY_BASE_URL` is correct
- Check API key is valid
- Ensure network connectivity

### Schema Mode Not Working
- Check if model supports JSON Schema Mode
- Verify schema format is correct
- Check logs for fallback to JSON Mode

### Low Quality Outputs
- Try increasing maxTokens
- Verify schema constraints are appropriate
- Check prompt quality

## Related Documentation

- [LLM-SETUP.md](./LLM-SETUP.md) - General LLM setup guide
- [JSON-CONSISTENCY.md](./JSON-CONSISTENCY.md) - JSON validation details

