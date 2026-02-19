# DeepSeek API Integration Guide

**Purpose**: Use DeepSeek Coder V2 for test generation (P2) and documentation (P7)
**Cost**: $0.14/1M tokens (10x cheaper than Claude, 5x cheaper than GLM-4-Plus)
**Specialization**: Code generation, especially boilerplate and tests

---

## 🎯 Why DeepSeek for MonoPilot?

### DeepSeek Coder V2 Strengths
1. **Specialized for code** - Trained specifically on code, better at:
   - Test generation (unit, integration, e2e)
   - Code documentation
   - Boilerplate generation
   - Pattern following

2. **Extremely cost-effective**
   - $0.14/1M tokens (input AND output)
   - vs GLM-4-Plus: $0.70/1M
   - vs Claude: $15/1M output

3. **Good quality for structured tasks**
   - Test cases (given spec → generate tests)
   - API documentation (given code → generate docs)
   - Follows patterns well

### Where to Use DeepSeek
| Phase | Task | Why DeepSeek |
|-------|------|--------------|
| **P2** | Test Writing | Excellent at generating test boilerplate from specs |
| **P7** | Documentation | Great at writing API docs, JSDoc comments |
| **Templates** | Fill boilerplate | Perfect for CRUD test generation |

### Where NOT to Use DeepSeek
- ❌ **P1** (UX Design) - Needs strategic thinking → Claude
- ❌ **P3** (Complex Code) - Business logic → GLM or Claude
- ❌ **P5** (Code Review) - Quality gate → Claude (MANDATORY)
- ❌ **P6** (QA) - Acceptance validation → Claude

---

## 🔑 API Setup

### 1. Get API Key

**Sign up**: https://platform.deepseek.com/signup

Free tier includes:
- $5 free credits (≈35M tokens!)
- No credit card required initially

**Get API key**:
1. Go to https://platform.deepseek.com/api_keys
2. Click "Create API Key"
3. Copy key (starts with `sk-`)

### 2. Environment Variables

```bash
# .env
DEEPSEEK_API_KEY=sk-your-key-here
```

---

## 📡 API Reference

### Endpoint
```
POST https://api.deepseek.com/v1/chat/completions
```

### Authentication
```
Authorization: Bearer sk-your-key-here
```

### Request Format (OpenAI-compatible)

```typescript
interface DeepSeekRequest {
  model: string;  // "deepseek-coder"
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  temperature?: number;     // 0.0 - 2.0, default 1.0
  max_tokens?: number;      // Max response tokens
  top_p?: number;           // 0.0 - 1.0, default 1.0
  frequency_penalty?: number; // -2.0 - 2.0, default 0.0
  presence_penalty?: number;  // -2.0 - 2.0, default 0.0
  stop?: string | string[];   // Stop sequences
  stream?: boolean;           // Stream response
}
```

### Response Format

```typescript
interface DeepSeekResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: "assistant";
      content: string;
    };
    finish_reason: "stop" | "length" | "content_filter";
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

---

## 🔧 TypeScript Client Implementation

### Basic Client

```typescript
// apps/orchestrator/src/clients/deepseek-client.ts
import 'dotenv/config';

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export class DeepSeekClient {
  private apiKey: string;
  private baseURL = 'https://api.deepseek.com/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.DEEPSEEK_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('DEEPSEEK_API_KEY environment variable is required');
    }
  }

  async chat(
    messages: DeepSeekMessage[],
    options: DeepSeekOptions = {}
  ): Promise<{
    content: string;
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  }> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || 'deepseek-coder',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 4096,
        stream: options.stream ?? false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} ${error}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0].message.content,
      usage: data.usage,
    };
  }

  // Helper: Calculate cost
  calculateCost(tokens: number): number {
    return (tokens * 0.14) / 1_000_000;
  }
}

// Factory function
export function createDeepSeekClient(apiKey?: string): DeepSeekClient {
  return new DeepSeekClient(apiKey);
}
```

---

## 🧪 Usage Examples

### Example 1: P2 Test Generation

```typescript
// apps/orchestrator/src/nodes/p2-test-writer-deepseek.ts
import { WorkflowState } from "../state";
import { createDeepSeekClient } from "../clients/deepseek-client";

export async function p2TestWriterDeepSeek(
  state: WorkflowState
): Promise<Partial<WorkflowState>> {
  console.log("🧪 P2: Generating tests with DeepSeek...");

  const deepseek = createDeepSeekClient();

  const systemPrompt = `You are a test engineer for MonoPilot, a TypeScript/Next.js application.

Tech Stack:
- Framework: Next.js 16, React 19
- Testing: Vitest for unit/integration, Playwright for E2E
- Backend: Supabase (PostgreSQL + RLS)
- Validation: Zod schemas

Follow TDD RED phase:
- Write FAILING tests BEFORE implementation
- Cover all acceptance criteria
- Include edge cases and error scenarios
- Use Arrange-Act-Assert pattern
`;

  const userPrompt = `
Story: ${state.story_title}
Description: ${state.story_description}

Acceptance Criteria:
${state.acceptance_criteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')}

UX Design:
${state.ux_design}

Generate comprehensive tests for this story:
1. **Service Layer Tests** (apps/frontend/lib/services/__tests__/*.test.ts)
   - Unit tests for all CRUD operations
   - Error handling tests
   - Edge case tests

2. **API Route Tests** (apps/frontend/app/api/**/__tests__/route.test.ts)
   - Integration tests for all endpoints
   - Validation tests
   - Authentication tests

3. **Component Tests** (apps/frontend/components/**/__tests__/*.test.tsx)
   - Render tests
   - User interaction tests
   - State management tests

Format each test file as:
\`\`\`typescript:path/to/file.test.ts
// Test code here
\`\`\`

ALL TESTS MUST FAIL (RED phase) - we haven't implemented the code yet!
  `.trim();

  const response = await deepseek.chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], {
    model: 'deepseek-coder',
    temperature: 0.3, // Lower temp for more consistent test generation
    max_tokens: 8192,
  });

  const tests = response.content;
  const cost = deepseek.calculateCost(response.usage.total_tokens);

  return {
    tests,
    total_tokens: state.total_tokens + response.usage.total_tokens,
    total_cost: state.total_cost + cost,
    messages: [
      { role: "assistant", content: `Tests generated:\n${tests.substring(0, 500)}...` }
    ],
  };
}
```

### Example 2: P7 Documentation Generation

```typescript
// apps/orchestrator/src/nodes/p7-doc-writer-deepseek.ts
import { WorkflowState } from "../state";
import { createDeepSeekClient } from "../clients/deepseek-client";

export async function p7DocWriterDeepSeek(
  state: WorkflowState
): Promise<Partial<WorkflowState>> {
  console.log("📝 P7: Generating documentation with DeepSeek...");

  const deepseek = createDeepSeekClient();

  const systemPrompt = `You are a technical writer for MonoPilot API documentation.

Documentation Standards:
- Clear, concise descriptions
- Complete request/response examples
- All possible error codes
- cURL and TypeScript examples
- OpenAPI 3.0 compatible format
`;

  const userPrompt = `
Feature: ${state.story_title}

Implementation:
${state.code}

Generate complete API documentation including:

1. **API Endpoint Documentation**
   - HTTP method and path
   - Authentication requirements
   - Request parameters (path, query, body)
   - Response format
   - Error responses
   - Examples (cURL + TypeScript)

2. **Service Documentation**
   - Public methods
   - Parameters and return types
   - Error handling
   - Usage examples

3. **Component Documentation**
   - Props interface
   - Usage examples
   - States (loading, error, success)

Format: Markdown with code blocks
  `.trim();

  const response = await deepseek.chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], {
    model: 'deepseek-coder',
    temperature: 0.5,
    max_tokens: 6144,
  });

  const documentation = response.content;
  const cost = deepseek.calculateCost(response.usage.total_tokens);

  return {
    documentation,
    total_tokens: state.total_tokens + response.usage.total_tokens,
    total_cost: state.total_cost + cost,
  };
}
```

---

## 🔄 Fallback Strategy

**Problem**: What if DeepSeek API is down or rate-limited?

**Solution**: Fallback to GLM

```typescript
// apps/orchestrator/src/nodes/p2-test-writer.ts
import { WorkflowState } from "../state";
import { p2TestWriterDeepSeek } from "./p2-test-writer-deepseek";
import { p2TestWriterGLM } from "./p2-test-writer-glm";

export async function p2TestWriter(
  state: WorkflowState
): Promise<Partial<WorkflowState>> {
  console.log("🧪 P2: Writing tests...");

  try {
    // Try DeepSeek first (cheaper)
    return await p2TestWriterDeepSeek(state);
  } catch (error) {
    console.warn("⚠️ DeepSeek failed, falling back to GLM:", error.message);

    try {
      // Fallback to GLM
      return await p2TestWriterGLM(state);
    } catch (fallbackError) {
      console.error("❌ Both DeepSeek and GLM failed!");

      // Final fallback: Claude (most expensive but most reliable)
      console.warn("⚠️ Falling back to Claude as last resort");
      return await p2TestWriterClaude(state);
    }
  }
}
```

---

## 📊 Cost Comparison

### P2 Test Generation (Typical Story)

| Model | Tokens | Cost/1M | Total Cost | Notes |
|-------|--------|---------|------------|-------|
| **Claude Opus** | 3,500 | $15 | $0.0525 | Highest quality |
| **GLM-4-Plus** | 3,200 | $0.70 | $0.0022 | Good balance |
| **DeepSeek Coder** | 3,000 | $0.14 | **$0.0004** | **Best value** |

**Savings**: DeepSeek = **93% cheaper than Claude**, **84% cheaper than GLM**

### P7 Documentation (Typical Story)

| Model | Tokens | Cost/1M | Total Cost | Notes |
|-------|--------|---------|------------|-------|
| **Claude Opus** | 2,800 | $15 | $0.0420 | Most detailed |
| **GLM-4-Plus** | 2,500 | $0.70 | $0.0018 | Good quality |
| **DeepSeek Coder** | 2,400 | $0.14 | **$0.0003** | **Best value** |

**Savings**: DeepSeek = **99% cheaper than Claude**, **83% cheaper than GLM**

---

## 🎯 Best Practices

### 1. Use System Prompts
```typescript
const systemPrompt = `You are a test engineer for MonoPilot.

Tech Stack:
- Next.js 16, React 19, TypeScript
- Testing: Vitest (unit), Playwright (e2e)
- Backend: Supabase (PostgreSQL + RLS)

Patterns:
- TDD RED phase (tests fail before implementation)
- Arrange-Act-Assert structure
- Use factory functions for test data
`;

// Reuse system prompt across tests (cacheable!)
```

### 2. Lower Temperature for Tests
```typescript
// Tests should be deterministic
const response = await deepseek.chat(messages, {
  temperature: 0.3, // vs 0.7 default
});
```

### 3. Specific Examples in Prompts
```typescript
const userPrompt = `
Generate tests like this example:

\`\`\`typescript
describe('SupplierProductService', () => {
  it('should fetch products for supplier', async () => {
    // Arrange
    const supplierId = 'test-id';
    mockSupabase.from.mockReturnValueOnce({
      select: () => ({ data: [{ id: '1' }], error: null }),
    });

    // Act
    const result = await getSupplierProducts(supplierId);

    // Assert
    expect(result).toHaveLength(1);
  });
});
\`\`\`

Now generate tests for: ${story_description}
`;
```

### 4. Validate Output
```typescript
// Always validate DeepSeek output before using
const response = await deepseek.chat(messages);

// Check for common issues
if (!response.content.includes('```typescript')) {
  throw new Error('DeepSeek did not return properly formatted code');
}

// Parse and validate syntax
const codeBlocks = extractCodeBlocks(response.content);
for (const block of codeBlocks) {
  validateTypeScriptSyntax(block.code);
}
```

---

## 🐛 Error Handling

### Common Errors

#### 1. Rate Limit (429)
```typescript
async function chatWithRetry(messages, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await deepseek.chat(messages, options);
    } catch (error) {
      if (error.message.includes('429') && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        console.log(`Rate limited, retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
}
```

#### 2. Invalid API Key (401)
```typescript
if (!process.env.DEEPSEEK_API_KEY) {
  throw new Error(
    'DEEPSEEK_API_KEY not set. Get one at https://platform.deepseek.com/api_keys'
  );
}
```

#### 3. Network Timeout
```typescript
const response = await fetch(url, {
  ...options,
  signal: AbortSignal.timeout(30000), // 30s timeout
});
```

---

## 📈 Monitoring

### Track DeepSeek Usage

```typescript
// apps/orchestrator/src/metrics/deepseek-tracker.ts
export class DeepSeekMetrics {
  private static usage = {
    total_requests: 0,
    total_tokens: 0,
    total_cost: 0,
    by_phase: {} as Record<string, { tokens: number; cost: number }>,
  };

  static track(phase: string, tokens: number, cost: number) {
    this.usage.total_requests++;
    this.usage.total_tokens += tokens;
    this.usage.total_cost += cost;

    if (!this.usage.by_phase[phase]) {
      this.usage.by_phase[phase] = { tokens: 0, cost: 0 };
    }
    this.usage.by_phase[phase].tokens += tokens;
    this.usage.by_phase[phase].cost += cost;
  }

  static getReport() {
    return {
      ...this.usage,
      avg_cost_per_request: this.usage.total_cost / this.usage.total_requests,
      avg_tokens_per_request: this.usage.total_tokens / this.usage.total_requests,
    };
  }
}

// Use in nodes
export async function p2TestWriterDeepSeek(state) {
  // ... existing code ...
  const response = await deepseek.chat(messages);

  DeepSeekMetrics.track('P2', response.usage.total_tokens, cost);

  return { tests, total_cost: state.total_cost + cost };
}
```

---

## ✅ Testing the Integration

```typescript
// tests/deepseek-client.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { DeepSeekClient } from '../src/clients/deepseek-client';

describe('DeepSeekClient', () => {
  let client: DeepSeekClient;

  beforeAll(() => {
    client = new DeepSeekClient();
  });

  it('should generate test code', async () => {
    const response = await client.chat([
      { role: 'system', content: 'You are a TypeScript test engineer.' },
      {
        role: 'user',
        content: 'Write a simple Vitest test for a function that adds two numbers.',
      },
    ], {
      model: 'deepseek-coder',
      temperature: 0.3,
      max_tokens: 1024,
    });

    expect(response.content).toContain('describe');
    expect(response.content).toContain('it(');
    expect(response.content).toContain('expect(');
    expect(response.usage.total_tokens).toBeGreaterThan(0);
  });

  it('should calculate cost correctly', () => {
    const cost = client.calculateCost(10000); // 10K tokens
    expect(cost).toBeCloseTo(0.0014, 4); // $0.0014
  });
});
```

---

## 📚 Resources

### Official Documentation
- **DeepSeek API Docs**: https://api-docs.deepseek.com/
- **Pricing**: https://platform.deepseek.com/pricing
- **Model Card**: https://github.com/deepseek-ai/DeepSeek-Coder-V2

### Community
- **Discord**: https://discord.gg/deepseek
- **GitHub**: https://github.com/deepseek-ai

---

## 🎯 Summary

**DeepSeek for MonoPilot**:
- ✅ Use for **P2 (tests)** and **P7 (docs)**
- ✅ **93% cheaper** than Claude for same tasks
- ✅ **Excellent quality** for structured code generation
- ✅ **OpenAI-compatible API** (easy to integrate)
- ✅ **Fast responses** (<3s typical)

**Integration Checklist**:
- [ ] Get API key from https://platform.deepseek.com
- [ ] Add `DEEPSEEK_API_KEY` to `.env`
- [ ] Create `deepseek-client.ts`
- [ ] Implement `p2-test-writer-deepseek.ts`
- [ ] Implement `p7-doc-writer-deepseek.ts`
- [ ] Add fallback to GLM
- [ ] Test on 2-3 stories
- [ ] Monitor quality and cost

**Expected Savings**: +5-10% total cost reduction by using DeepSeek for P2/P7.

---

**Next**: See `TEMPLATE_SYSTEM_GUIDE.md` for template-based code generation.
