# LangGraph Complete Guide for MonoPilot

**Purpose**: Build automated multi-agent workflows for 7-phase story implementation
**Alternative to**: n8n (code-first, Git-friendly, no server needed)
**Framework**: LangGraph (TypeScript/JavaScript version)

---

## 🎯 What is LangGraph?

**LangGraph** is a framework for building **stateful, multi-actor applications with LLMs**.

### Key Concepts

```
Traditional Flow:
  Input → LLM → Output
  ❌ No state
  ❌ No loops
  ❌ Single agent

LangGraph Flow:
  Input → Graph → {
    Node 1 (Claude UX) → State
    Node 2 (GLM Tests) → State
    Node 3 (GLM Code) → State
    Node 4 (Claude Review) → State → [if bugs] → back to Node 3
    Node 5 (Claude QA) → Output
  }
  ✅ State persistence
  ✅ Conditional loops
  ✅ Multi-agent coordination
```

---

## 📦 Installation

### TypeScript/JavaScript Version

```bash
# Create orchestrator app
cd apps/
mkdir orchestrator
cd orchestrator

# Initialize
pnpm init

# Install LangGraph
pnpm add @langchain/langgraph @langchain/core @langchain/anthropic

# TypeScript support
pnpm add -D typescript @types/node tsx

# Other dependencies
pnpm add zod dotenv

# Model integrations
pnpm add @anthropic-ai/sdk  # Claude
# GLM and DeepSeek - we'll use fetch (custom clients)
```

### Project Structure

```
apps/orchestrator/
├── package.json
├── tsconfig.json
├── .env
├── src/
│   ├── index.ts              # Entry point
│   ├── graph.ts              # Main workflow definition
│   ├── state.ts              # State schema
│   ├── nodes/
│   │   ├── p1-ux-designer.ts
│   │   ├── p2-test-writer.ts
│   │   ├── p3-code-generator.ts
│   │   ├── p5-code-reviewer.ts
│   │   ├── p6-qa-tester.ts
│   │   └── p7-doc-writer.ts
│   ├── clients/
│   │   ├── claude-client.ts
│   │   ├── glm-client.ts
│   │   └── deepseek-client.ts
│   ├── routing/
│   │   └── conditional-routing.ts
│   └── checkpoints/
│       └── checkpoint-saver.ts
└── tests/
    └── graph.test.ts
```

---

## 🏗️ Basic LangGraph Example

### 1. Define State

State is the **data flowing through your graph**.

```typescript
// src/state.ts
import { StateGraph, Annotation } from "@langchain/langgraph";

// Define the shape of state
const StateAnnotation = Annotation.Root({
  // Story inputs
  story_id: Annotation<string>,
  story_title: Annotation<string>,
  story_description: Annotation<string>,
  acceptance_criteria: Annotation<string[]>,

  // Phase outputs
  ux_design: Annotation<string | null>,
  tests: Annotation<string | null>,
  code: Annotation<string | null>,
  review: Annotation<{
    status: 'APPROVED' | 'REQUEST_CHANGES';
    bugs: Array<{ severity: string; description: string }>;
    iteration: number;
  } | null>,
  qa_report: Annotation<string | null>,
  documentation: Annotation<string | null>,

  // Metadata
  current_iteration: Annotation<number>,
  total_tokens: Annotation<number>,
  total_cost: Annotation<number>,

  // Messages for LLM context
  messages: Annotation<Array<{ role: string; content: string }>>({
    reducer: (current, update) => [...current, ...update],
  }),
});

export type WorkflowState = typeof StateAnnotation.State;
```

---

### 2. Create Nodes (Functions)

Each node is a **function that processes state**.

```typescript
// src/nodes/p1-ux-designer.ts
import { RunnableConfig } from "@langchain/core/runnables";
import { WorkflowState } from "../state";
import { createClaudeClient } from "../clients/claude-client";

export async function p1UXDesigner(
  state: WorkflowState,
  config?: RunnableConfig
): Promise<Partial<WorkflowState>> {
  console.log("🎨 P1: Designing UX...");

  const claude = createClaudeClient();

  const prompt = `
You are a UX designer for MonoPilot, a food manufacturing MES system.

Story: ${state.story_title}
Description: ${state.story_description}
Acceptance Criteria:
${state.acceptance_criteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')}

Design the UX for this feature. Include:
1. Wireframe descriptions
2. User flows
3. Component breakdown
4. State management approach

Format: Markdown
  `.trim();

  const response = await claude.messages.create({
    model: "claude-opus-4",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const ux_design = response.content[0].type === 'text'
    ? response.content[0].text
    : '';

  const tokens_used = response.usage.input_tokens + response.usage.output_tokens;
  const cost = (response.usage.input_tokens * 3 + response.usage.output_tokens * 15) / 1_000_000;

  return {
    ux_design,
    total_tokens: state.total_tokens + tokens_used,
    total_cost: state.total_cost + cost,
    messages: [{ role: "assistant", content: `UX Design:\n${ux_design}` }],
  };
}
```

```typescript
// src/nodes/p3-code-generator.ts
import { WorkflowState } from "../state";
import { createGLMClient } from "../clients/glm-client";

export async function p3CodeGenerator(
  state: WorkflowState
): Promise<Partial<WorkflowState>> {
  console.log("💻 P3: Generating code...");

  const glm = createGLMClient();

  // Build prompt with UX design + tests + previous review feedback
  let prompt = `
You are a TypeScript developer implementing a feature for MonoPilot.

UX Design:
${state.ux_design}

Tests (make these pass):
${state.tests}
  `.trim();

  // If this is a re-iteration, include review feedback
  if (state.review && state.review.bugs.length > 0) {
    prompt += `\n\nPREVIOUS REVIEW FEEDBACK (FIX THESE BUGS):\n`;
    state.review.bugs.forEach((bug, i) => {
      prompt += `${i + 1}. [${bug.severity}] ${bug.description}\n`;
    });
  }

  prompt += `\n\nImplement the code. Include:\n1. Service layer\n2. API routes\n3. Validation schemas\n4. React components\n\nFormat: Full TypeScript code files`;

  const response = await glm.chat({
    model: "glm-4-plus",
    messages: [{ role: "user", content: prompt }],
  });

  const code = response.choices[0].message.content;
  const tokens_used = response.usage.total_tokens;
  const cost = tokens_used * 0.0007 / 1000; // GLM-4-Plus pricing

  return {
    code,
    total_tokens: state.total_tokens + tokens_used,
    total_cost: state.total_cost + cost,
    current_iteration: state.current_iteration + 1,
  };
}
```

```typescript
// src/nodes/p5-code-reviewer.ts
import { WorkflowState } from "../state";
import { createClaudeClient } from "../clients/claude-client";

export async function p5CodeReviewer(
  state: WorkflowState
): Promise<Partial<WorkflowState>> {
  console.log("🔍 P5: Reviewing code...");

  const claude = createClaudeClient();

  const prompt = `
You are a code reviewer for MonoPilot. Review this implementation for production readiness.

Original Requirements:
${state.story_description}

UX Design:
${state.ux_design}

Tests:
${state.tests}

Implementation:
${state.code}

Review for:
1. Correctness vs requirements
2. TypeScript type safety
3. Error handling
4. Security (RLS, validation)
5. Performance
6. Missing features

Respond in JSON:
{
  "status": "APPROVED" | "REQUEST_CHANGES",
  "bugs": [
    { "severity": "CRITICAL|HIGH|MEDIUM|LOW", "description": "..." }
  ],
  "summary": "..."
}
  `.trim();

  const response = await claude.messages.create({
    model: "claude-opus-4",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const reviewText = response.content[0].type === 'text'
    ? response.content[0].text
    : '';

  // Parse JSON from response
  const jsonMatch = reviewText.match(/\{[\s\S]*\}/);
  const review = jsonMatch ? JSON.parse(jsonMatch[0]) : {
    status: 'REQUEST_CHANGES',
    bugs: [{ severity: 'HIGH', description: 'Failed to parse review' }],
    summary: 'Review parsing error',
  };

  const tokens_used = response.usage.input_tokens + response.usage.output_tokens;
  const cost = (response.usage.input_tokens * 3 + response.usage.output_tokens * 15) / 1_000_000;

  return {
    review: {
      ...review,
      iteration: state.current_iteration,
    },
    total_tokens: state.total_tokens + tokens_used,
    total_cost: state.total_cost + cost,
  };
}
```

---

### 3. Build the Graph

```typescript
// src/graph.ts
import { StateGraph, START, END } from "@langchain/langgraph";
import { StateAnnotation } from "./state";
import { p1UXDesigner } from "./nodes/p1-ux-designer";
import { p2TestWriter } from "./nodes/p2-test-writer";
import { p3CodeGenerator } from "./nodes/p3-code-generator";
import { p5CodeReviewer } from "./nodes/p5-code-reviewer";
import { p6QATester } from "./nodes/p6-qa-tester";
import { p7DocWriter } from "./nodes/p7-doc-writer";

export function createWorkflow() {
  const workflow = new StateGraph(StateAnnotation);

  // Add nodes
  workflow.addNode("p1_ux_designer", p1UXDesigner);
  workflow.addNode("p2_test_writer", p2TestWriter);
  workflow.addNode("p3_code_generator", p3CodeGenerator);
  workflow.addNode("p5_code_reviewer", p5CodeReviewer);
  workflow.addNode("p6_qa_tester", p6QATester);
  workflow.addNode("p7_doc_writer", p7DocWriter);

  // Define edges (execution flow)
  workflow.addEdge(START, "p1_ux_designer");
  workflow.addEdge("p1_ux_designer", "p2_test_writer");
  workflow.addEdge("p2_test_writer", "p3_code_generator");
  workflow.addEdge("p3_code_generator", "p5_code_reviewer");

  // Conditional edge: P5 → P3 (if bugs) OR P5 → P6 (if approved)
  workflow.addConditionalEdges(
    "p5_code_reviewer",
    (state) => {
      if (!state.review) return "end";

      // If bugs found and not too many iterations, go back to P3
      if (state.review.bugs.length > 0 && state.current_iteration < 5) {
        return "p3_code_generator";
      }

      // If approved, continue to P6
      if (state.review.status === "APPROVED") {
        return "p6_qa_tester";
      }

      // Max iterations reached, abort
      return "end";
    }
  );

  workflow.addEdge("p6_qa_tester", "p7_doc_writer");
  workflow.addEdge("p7_doc_writer", END);

  return workflow.compile();
}
```

---

### 4. Run the Workflow

```typescript
// src/index.ts
import { createWorkflow } from "./graph";

async function main() {
  const app = createWorkflow();

  const initialState = {
    story_id: "03.2",
    story_title: "Supplier-Product Assignments",
    story_description: "Allow assigning products to suppliers with pricing...",
    acceptance_criteria: [
      "User can view all products assigned to a supplier",
      "User can assign a new product with unit price",
      "User can edit existing product assignment",
      "User can remove product assignment",
    ],

    // Initialize empty state
    ux_design: null,
    tests: null,
    code: null,
    review: null,
    qa_report: null,
    documentation: null,

    current_iteration: 0,
    total_tokens: 0,
    total_cost: 0,
    messages: [],
  };

  console.log("🚀 Starting 7-phase workflow for Story 03.2...\n");

  // Execute workflow
  const result = await app.invoke(initialState);

  console.log("\n✅ Workflow completed!");
  console.log(`📊 Total tokens: ${result.total_tokens}`);
  console.log(`💰 Total cost: $${result.total_cost.toFixed(4)}`);
  console.log(`🔄 Iterations: ${result.current_iteration}`);
  console.log(`✅ Review status: ${result.review?.status}`);

  // Save results
  await saveResults(result);
}

main().catch(console.error);
```

---

## 🔄 Advanced: Streaming & Checkpoints

### Streaming (Real-time Updates)

```typescript
// Stream events as they happen
for await (const event of await app.stream(initialState)) {
  console.log("Event:", event);
}

// Or stream with specific output
for await (const chunk of await app.stream(initialState, {
  streamMode: "values", // Get full state updates
})) {
  console.log("Current iteration:", chunk.current_iteration);
  console.log("Current phase:", getCurrentPhase(chunk));
}
```

### Checkpointing (Save/Resume)

```typescript
import { MemorySaver } from "@langchain/langgraph";

const checkpointer = new MemorySaver();

const app = workflow.compile({ checkpointer });

// Run with checkpointing
const config = { configurable: { thread_id: "story-03.2" } };
const result = await app.invoke(initialState, config);

// Later, resume from checkpoint
const resumed = await app.invoke(
  { /* can provide partial state update */ },
  config // Same thread_id = resume from checkpoint
);
```

**Use case**: If P3 fails (API timeout), resume from last successful phase instead of restarting.

---

## 🎯 MonoPilot-Specific Workflow

### Complete 7-Phase Graph

```typescript
// Enhanced graph with all optimizations
export function createMonoPilotWorkflow() {
  const workflow = new StateGraph(StateAnnotation);

  // Phase 1: UX Design (Claude)
  workflow.addNode("p1_ux", p1UXDesigner);

  // Phase 2: Test Writing (DeepSeek with GLM fallback)
  workflow.addNode("p2_tests", async (state) => {
    try {
      return await p2TestWriterDeepSeek(state);
    } catch (error) {
      console.warn("DeepSeek failed, falling back to GLM");
      return await p2TestWriterGLM(state);
    }
  });

  // Phase 3: Code Generation (Semantic routing)
  workflow.addNode("p3_code", async (state) => {
    const complexity = analyzeComplexity(state);

    if (complexity < 0.3) {
      // Simple CRUD → Template-based generation
      return await p3TemplateGenerator(state);
    } else if (complexity < 0.7) {
      // Medium complexity → GLM-4-Plus
      return await p3GLMCodeGenerator(state);
    } else {
      // High complexity → Claude
      return await p3ClaudeCodeGenerator(state);
    }
  });

  // Phase 4: Refactor (Optional, only if needed)
  workflow.addNode("p4_refactor", p4Refactor);

  // Phase 5: Code Review (Claude - MANDATORY)
  workflow.addNode("p5_review", p5CodeReviewer);

  // Phase 6: QA Testing (Claude)
  workflow.addNode("p6_qa", p6QATester);

  // Phase 7: Documentation (DeepSeek)
  workflow.addNode("p7_docs", p7DocWriter);

  // Flow
  workflow.addEdge(START, "p1_ux");
  workflow.addEdge("p1_ux", "p2_tests");
  workflow.addEdge("p2_tests", "p3_code");
  workflow.addEdge("p3_code", "p5_review");

  // Conditional: Review → Re-iterate or Continue
  workflow.addConditionalEdges("p5_review", (state) => {
    const { review, current_iteration } = state;

    // Too many iterations, abort
    if (current_iteration >= 5) {
      console.error("❌ Max iterations reached!");
      return END;
    }

    // Bugs found, go back to P3
    if (review && review.bugs.length > 0) {
      console.log(`🔄 Found ${review.bugs.length} bugs, re-iterating...`);
      return "p3_code";
    }

    // Approved, check if refactor needed
    if (review && review.status === "APPROVED") {
      if (needsRefactor(state)) {
        return "p4_refactor";
      }
      return "p6_qa";
    }

    return END;
  });

  workflow.addEdge("p4_refactor", "p6_qa");
  workflow.addEdge("p6_qa", "p7_docs");
  workflow.addEdge("p7_docs", END);

  return workflow.compile({
    checkpointer: new MemorySaver(), // Enable checkpointing
  });
}
```

---

## 📊 Monitoring & Metrics

### Track Metrics in State

```typescript
// Enhanced state with metrics
const MetricsAnnotation = Annotation.Root({
  ...StateAnnotation.spec, // Inherit base state

  metrics: Annotation<{
    phase_times: Record<string, number>;
    phase_tokens: Record<string, number>;
    phase_costs: Record<string, number>;
    model_usage: Record<string, number>;
  }>({
    reducer: (current, update) => ({
      phase_times: { ...current.phase_times, ...update.phase_times },
      phase_tokens: { ...current.phase_tokens, ...update.phase_tokens },
      phase_costs: { ...current.phase_costs, ...update.phase_costs },
      model_usage: { ...current.model_usage, ...update.model_usage },
    }),
  }),
});

// In each node, track metrics
export async function p1UXDesigner(state) {
  const startTime = Date.now();

  // ... existing code ...

  const duration = Date.now() - startTime;

  return {
    ux_design,
    metrics: {
      phase_times: { P1: duration },
      phase_tokens: { P1: tokens_used },
      phase_costs: { P1: cost },
      model_usage: { claude: tokens_used },
    },
  };
}
```

---

## 🐛 Error Handling

```typescript
// Wrap nodes with error handling
function withErrorHandling<T extends (...args: any[]) => any>(
  nodeFn: T,
  nodeName: string
): T {
  return (async (...args: any[]) => {
    try {
      return await nodeFn(...args);
    } catch (error) {
      console.error(`❌ Error in ${nodeName}:`, error);

      // Log to monitoring
      await logError(nodeName, error);

      // Return partial state with error
      return {
        error: {
          phase: nodeName,
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }) as T;
}

// Use in graph
workflow.addNode("p1_ux", withErrorHandling(p1UXDesigner, "P1"));
```

---

## 🧪 Testing

```typescript
// tests/graph.test.ts
import { describe, it, expect } from 'vitest';
import { createMonoPilotWorkflow } from '../src/graph';

describe('MonoPilot Workflow', () => {
  it('should complete 7-phase flow for simple story', async () => {
    const app = createMonoPilotWorkflow();

    const initialState = {
      story_id: "TEST-1",
      story_title: "Test Feature",
      story_description: "Simple CRUD feature",
      acceptance_criteria: ["User can create item"],
      // ... rest of state
    };

    const result = await app.invoke(initialState);

    expect(result.review?.status).toBe("APPROVED");
    expect(result.total_cost).toBeLessThan(0.50); // Cost threshold
    expect(result.current_iteration).toBeLessThanOrEqual(3);
  });

  it('should re-iterate when bugs found', async () => {
    // Mock P5 to return bugs on first iteration
    // ... test logic
  });
});
```

---

## 📚 Resources

### Official Docs
- **LangGraph Concepts**: https://langchain-ai.github.io/langgraph/concepts/
- **TypeScript Guide**: https://langchain-ai.github.io/langgraphjs/
- **Tutorials**: https://langchain-ai.github.io/langgraph/tutorials/

### Examples
- **Multi-agent**: https://github.com/langchain-ai/langgraphjs/tree/main/examples
- **Checkpointing**: https://langchain-ai.github.io/langgraphjs/how-tos/persistence/

---

## ✅ Summary

**LangGraph for MonoPilot gives you**:
- ✅ **Stateful workflows** (save progress, resume on failure)
- ✅ **Conditional routing** (P5 → P3 iteration loop)
- ✅ **Multi-agent coordination** (Claude + GLM + DeepSeek)
- ✅ **Monitoring** (track tokens, cost, time per phase)
- ✅ **Code-first** (Git-friendly, testable, no UI needed)

**vs n8n**:
- n8n: Visual, good for non-developers, requires server
- LangGraph: Code, good for developers, no server

**For MonoPilot**: **LangGraph is the better choice** (code-heavy, developer team, Git workflow).

---

**Next**: See `DEEPSEEK_API_GUIDE.md` for DeepSeek integration details.
