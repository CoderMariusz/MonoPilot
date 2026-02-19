# Multi-AI Coding Tool Integration Research Report

**Date**: 2026-02-10
**Depth**: Deep (25 sources)
**Categories**: TECH, COMP, USER
**Confidence**: High (majority Tier 1 sources -- official docs, GitHub repos)

---

## Table of Contents

1. [OpenAI Codex CLI -- Instructions, Skills, and Prompt Format](#1-openai-codex-cli)
2. [Multi-AI Orchestration Patterns](#2-multi-ai-orchestration-patterns)
3. [Kimi K2.5 Integration](#3-kimi-k25-integration)
4. [Token Optimization for Large Context](#4-token-optimization-for-large-context)
5. [Cross-AI Prompt Handoff Best Practices](#5-cross-ai-prompt-handoff-best-practices)
6. [Comparison Matrix](#6-comparison-matrix)
7. [Recommendation: Universal Prompt Package Format](#7-recommendation)
8. [Sources](#8-sources)

---

## 1. OpenAI Codex CLI

### 1.1 AGENTS.md -- The Instruction System

Codex uses `AGENTS.md` files as its primary instruction mechanism. Think of it as Claude's `CLAUDE.md` equivalent.

**Discovery hierarchy** (Codex reads in this order):

| Priority | Location | Purpose |
|----------|----------|---------|
| 1 (Global) | `~/.codex/AGENTS.override.md` | Personal overrides |
| 2 (Global) | `~/.codex/AGENTS.md` | Personal defaults |
| 3 (Project) | `$REPO_ROOT/AGENTS.override.md` | Project overrides |
| 4 (Project) | `$REPO_ROOT/AGENTS.md` | Project instructions |
| 5 (Subdir) | `services/payments/AGENTS.md` | Module-specific |

**Merge behavior**: Files concatenate root-down. Files closer to CWD appear later in prompt and override earlier guidance. Each directory contributes at most one file. Combined max size: **32 KiB** (configurable via `project_doc_max_bytes`).

**Source**: [OpenAI AGENTS.md Guide](https://developers.openai.com/codex/guides/agents-md/) (2026)

**Example AGENTS.md for MonoPilot**:

```markdown
# MonoPilot -- Agent Instructions

## Tech Stack
- Next.js 16, React 19, TypeScript, TailwindCSS, ShadCN UI
- Supabase (PostgreSQL + Auth + RLS)
- Zod validation, pnpm workspaces

## Conventions
- All tables have org_id; enforce RLS on every query
- API routes: /api/[module]/[resource]/[id]/[action]
- Services: lib/services/*-service.ts (class-based, static methods)
- Validation: Zod schemas in lib/validation/

## Testing
- Unit: Vitest -- run with `pnpm test`
- E2E: Playwright -- run with `pnpm e2e`

## Do NOT
- Use loose inventory quantities (LP-only system)
- Modify BOM snapshots after WO creation
- Skip org_id filtering in any query
```

### 1.2 Skills System -- Lazy-Loaded Instruction Bundles

Skills replace Codex's deprecated "custom prompts" system. They use **progressive disclosure**: only metadata (name + description) loads at startup; the full `SKILL.md` body loads on-demand when Codex decides a skill is relevant.

**Discovery locations (precedence order)**:

| Scope | Path | Use Case |
|-------|------|----------|
| Folder | `$CWD/.agents/skills/` | Directory-specific |
| Parent | `$CWD/../.agents/skills/` | Parent folder |
| Repo | `$REPO_ROOT/.agents/skills/` | Repository-wide |
| User | `$HOME/.agents/skills/` | Personal cross-repo |
| Admin | `/etc/codex/skills/` | System defaults |
| Built-in | (internal) | OpenAI-provided |

**SKILL.md format**:

```yaml
---
name: monopilot-api
description: Create REST API routes for MonoPilot MES modules with RLS, org_id filtering, and Zod validation
---

## Instructions

When creating an API route for MonoPilot:

1. Create file at `apps/frontend/app/api/[module]/[resource]/route.ts`
2. Import createRouteHandlerClient from @supabase/auth-helpers-nextjs
3. Always filter by org_id from session
4. Validate request body with Zod schema from lib/validation/
5. Return NextResponse.json() with appropriate status codes
6. Handle errors with try/catch, return 500 with error message

## Template

[... full template code here ...]
```

**Invocation**: `$monopilot-api create the warehouse receiving endpoint`

**Source**: [Codex Agent Skills](https://developers.openai.com/codex/skills) (2026), [feiskyer/codex-settings](https://github.com/feiskyer/codex-settings) (2026)

### 1.3 Non-Interactive Execution (codex exec)

The key command for automation and CI/CD integration:

```bash
# Basic execution
codex exec "Implement the warehouse receiving API endpoint"

# With structured JSON output
codex exec "Extract project metadata" \
  --output-schema ./schema.json \
  -o ./result.json

# Pipe prompt from stdin (useful for passing structured context)
cat task-context.md | codex exec -

# JSON Lines output for automation
codex exec --json "summarize repo structure" | jq

# Full auto with sandbox
codex exec --full-auto --sandbox workspace-write "Fix failing tests"

# Resume previous session
codex exec resume --last "Now fix the issues you found"
```

**Key flags**:

| Flag | Purpose |
|------|---------|
| `--full-auto` | Allow edits without approval |
| `--sandbox workspace-write` | Allow file writes in workspace |
| `--json` | JSON Lines output for parsing |
| `--output-schema <path>` | Enforce structured JSON response |
| `-o <path>` | Write final message to file |
| `-C <path>` | Set working directory |
| `-m <model>` | Override model (e.g., gpt-5) |
| `--ephemeral` | Don't persist session |
| `-i <path>` | Attach images |

**Source**: [Codex Non-Interactive Mode](https://developers.openai.com/codex/noninteractive/) (2026), [Codex CLI Reference](https://developers.openai.com/codex/cli/reference/) (2026)

### 1.4 Codex Prompting Best Practices

From the official Codex Prompting Guide:

- **Autonomous senior engineer**: Codex works best when treated as an autonomous agent that gathers context, plans, implements, tests, and refines without intermediate approvals
- **Bias to action**: Instruct it to implement with reasonable assumptions rather than asking clarifying questions
- **Tool hierarchy**: Prefer built-in tools (`apply_patch`, `rg`, `read_file`) over shell commands
- **Batch file reads**: Use parallel tool calls to read multiple files at once
- **DRY principle**: Instruct it to search for existing implementations before creating new ones
- **Compaction**: Use `/compact` to condense history for long sessions

**Source**: [Codex Prompting Guide](https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide/) (2026)

### 1.5 Configuration (config.toml)

```toml
# ~/.codex/config.toml
model = "gpt-5"
approval_policy = "on-request"
project_doc_max_bytes = 65536

[reasoning]
effort = "high"
summary = "detailed"

# Alternative providers
[profiles.azure]
model = "gpt-5"
provider = "azure"

[profiles.copilot]
model = "gpt-5"
provider = "github-copilot"
```

**Source**: [Codex Configuration Reference](https://developers.openai.com/codex/config-reference/) (2026)

---

## 2. Multi-AI Orchestration Patterns

### 2.1 GitHub Agent HQ (Feb 2026) -- Industry Standard Emerging

GitHub launched **Agent HQ** on February 4, 2026, allowing developers to run Claude Code, OpenAI Codex, and GitHub Copilot side-by-side within GitHub repos.

**Key capabilities**:
- Assign specific agents to specific tasks from github.com, Mobile, or VS Code
- Compare how different agents approach the same problem
- Each agent runs asynchronously; review results on your own time
- Available for Copilot Pro+ and Enterprise subscribers

**Agent personality differences**:
| Behavior | Claude | Codex | Copilot |
|----------|--------|-------|---------|
| Approach | Asks clarifying questions first | Starts immediately, minimal clarification | Balanced |
| Strength | Maintainability, reasoning | Speed, rapid prototyping | Daily coding, IDE integration |
| Style | Explains reasoning mid-task | Works rapidly in cloud sandboxes | Inline suggestions |

**Source**: [GitHub Blog - Agent HQ](https://github.blog/news-insights/company-news/pick-your-agent-use-claude-and-codex-on-agent-hq/) (Feb 2026)

### 2.2 Existing Multi-Agent Orchestration Tools

**myclaude** (github.com/cexll/myclaude):
- Claude Code as orchestrator, Codex/Gemini/OpenCode as executors
- Wrapper pattern abstracts backend differences
- Workflows: `/do` (5-phase dev), `/omo` (multi-agent routing), `/bmad-pilot` (6 agents)
- Backend abstraction via `codeagent-wrapper`

**Claude Flow** (github.com/ruvnet/claude-flow):
- Multi-agent swarms with native Claude Code support
- MCP protocol for agent communication
- Distributed task coordination

**Claude Squad**:
- Terminal app managing multiple AI agents simultaneously
- Each agent gets its own Git worktree isolation
- Supports Claude Code, Aider, Codex, OpenCode, Amp

**Conductor** (macOS):
- Run multiple Claude Code and Codex agents in parallel
- Each in isolated Git worktree to prevent conflicts

**Source**: [github.com/cexll/myclaude](https://github.com/cexll/myclaude) (2026), [github.com/ruvnet/claude-flow](https://github.com/ruvnet/claude-flow) (2025)

### 2.3 Claude Code Native Multi-Agent

**Subagents** (production-ready, v1.0.60+):
- Run `/agents` command to create specialized agents
- Each gets isolated context window (200K tokens)
- Defined in Markdown with YAML frontmatter
- Max 10 concurrent subagents
- Single-level only (subagents cannot spawn sub-subagents)

**Task Tool**:
- Spawns ephemeral Claude workers for focused subtasks
- Each gets its own 200K context window, completely isolated
- Parallel execution for dramatic speedup

**Swarms** (experimental, feature-flagged):
- Team lead plans and delegates to specialist background agents
- Shared task board with dependency tracking
- Inter-agent @mention messaging

**Source**: [Claude Code Subagents Docs](https://code.claude.com/docs/en/sub-agents) (2026), [eesel.ai Multi-Agent Guide](https://www.eesel.ai/blog/claude-code-multiple-agent-systems-complete-2026-guide) (2026)

### 2.4 Recommended Task Routing Matrix

Based on agent strengths, route tasks as follows:

| Task Type | Best Agent | Reason |
|-----------|------------|--------|
| Architecture design | Claude Code | Superior reasoning, asks clarifying questions |
| Database migrations | Claude Code | Complex multi-table RLS logic |
| Rapid UI prototyping | Codex or Kimi K2.5 | Speed-first, visual coding |
| API endpoint bulk creation | Codex exec | Non-interactive batch execution |
| Screenshot-to-code | Kimi K2.5 | Native multimodal, visual coding |
| Code review | Claude Code subagent | Deep reasoning, isolated context |
| Test generation | Codex exec | Fast, pattern-matching |
| Bug triage/fix | Claude Code | Methodical analysis |
| Documentation | Claude Code | Thorough, structured output |
| Refactoring | Claude Code | Understands intent and architecture |

---

## 3. Kimi K2.5 Integration

### 3.1 Capabilities Overview

Kimi K2.5 (released January 2026 by Moonshot AI) is a native multimodal model with 1T parameters (32B active), excelling at visual coding and agent swarms.

**Key strengths**:
- **Visual coding**: Screenshot-to-code, video-to-UI replication
- **Frontend excellence**: Strongest open-source model for front-end development
- **Agent swarms**: Self-directs up to 100 sub-agents in parallel (4.5x speedup)
- **Cost**: $0.60/M input tokens (vs $5.00 for Claude Opus 4.5)
- **Context**: 128K-256K depending on variant

**Source**: [Kimi K2.5 Tech Blog](https://www.kimi.com/blog/kimi-k2-5.html) (Jan 2026), [Kimi K2.5 Model Page](https://www.kimi.com/ai-models/kimi-k2-5) (2026)

### 3.2 API Format (OpenAI-Compatible)

Kimi K2.5 supports both OpenAI and Anthropic message formats:

```python
# OpenAI-compatible format
import openai

client = openai.OpenAI(
    base_url="https://api.moonshot.ai/v1",  # or Together AI, OpenRouter
    api_key="your-key"
)

response = client.chat.completions.create(
    model="kimi-k2.5",
    messages=[
        {"role": "system", "content": "You are a frontend developer..."},
        {"role": "user", "content": "Build a production dashboard..."}
    ],
    temperature=0.7,
    max_tokens=4096
)
```

**Available via**: OpenRouter (`moonshotai/kimi-k2.5`), Together AI, Moonshot AI direct, NVIDIA NIM

**Source**: [Kimi K2 API Docs](https://kimi-k2.ai/api-docs) (2026), [OpenRouter Kimi K2.5](https://openrouter.ai/moonshotai/kimi-k2.5) (2026)

### 3.3 Practical Use for MonoPilot

Best suited for:
- Converting UX wireframes (SET-001 to SET-029) into React/ShadCN components
- Rapid UI prototyping from mockup screenshots
- Generating interactive dashboard layouts
- Creating form components with validation displays

Pass structured context via system prompt with the same markdown format used for other agents.

---

## 4. Token Optimization for Large Context

### 4.1 Claude Code Specific Strategies

| Technique | Token Savings | How |
|-----------|--------------|-----|
| `/compact` command | ~50% | Auto-triggers at 70% usage; preserves CLAUDE.md, recent results, critical decisions |
| Query specificity (WHAT/WHERE/HOW) | ~90% | `"Check login() in auth.ts:45-60"` vs `"Check auth.ts"` |
| MCP Tool Search (`ENABLE_TOOL_SEARCH`) | ~85% | Lazy-load tools on-demand instead of all upfront |
| RTK output filtering | 70-90% | Filter command output before ingestion |
| Local execution bridge | ~92% | Generate plan (2K tokens) + summary (500) instead of 50 tool calls (30K) |
| Batching operations | ~40% | Combine multiple file reads into single requests |
| Context editing (auto) | ~84% | Auto-clears stale tool calls while preserving conversation flow |

**Source**: [Token Optimization Techniques - DeepWiki](https://deepwiki.com/FlorianBruniaux/claude-code-ultimate-guide/10.4-token-optimization-techniques) (2026), [Claude Code Context Management](https://claudefa.st/blog/guide/mechanics/context-management) (2026)

### 4.2 Large YAML/Roadmap File Strategies

For MonoPilot's context YAML files and roadmap documents:

**Strategy 1: Progressive Context Loading**
```
Level 1 (always loaded): CLAUDE.md -- key conventions, 2-3 KB
Level 2 (on-demand): .claude/rules/*.md -- path-scoped rules
Level 3 (agent-triggered): Story context YAML -- loaded when agent reads story dir
Level 4 (explicit): PRD sections -- loaded only when referenced by FR-XXX codes
```

**Strategy 2: Context Distillation**
Create condensed "index" files that reference full documents:
```markdown
# Story Index (loaded by default)
| ID | Name | Status | Context File |
|----|------|--------|-------------|
| 01.1 | Settings CRUD | Done | context/01.1.context.yaml |
| 03.4 | Planning BOM | Active | context/03.4.context.yaml |
```
Agent loads full YAML only when working on that specific story.

**Strategy 3: Artifact Pattern**
Treat large files as named artifacts. Agents see only lightweight references:
```yaml
# In CLAUDE.md (always loaded, ~50 tokens)
roadmap: docs/2-MANAGEMENT/roadmap.yaml  # 2000 lines, load on demand
prd_index: docs/1-BASELINE/product/prd.md  # reference only
```

**Strategy 4: Chunked Context Delivery**
For Codex exec automation, pre-extract only relevant sections:
```bash
# Extract only the relevant story context before passing to Codex
yq '.story | pick(["id","name","files_to_create","acceptance_checklist"])' \
  context/03.4.context.yaml | codex exec -
```

**Source**: [Martin Fowler - Context Engineering for Coding Agents](https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html) (2026), [getmaxim.ai Context Window Management](https://www.getmaxim.ai/articles/context-window-management-strategies-for-long-context-ai-agents-and-chatbots/) (2026)

### 4.3 Claude Code Path-Scoped Rules

Use `.claude/rules/` with path-based scoping to load instructions only when relevant:

```yaml
# .claude/rules/api-routes.md
---
paths:
  - "apps/frontend/app/api/**"
---

## API Route Conventions
- Always filter by org_id from session
- Use Zod validation from lib/validation/
- Return NextResponse.json()
- Handle errors with try/catch
```

```yaml
# .claude/rules/database.md
---
paths:
  - "supabase/migrations/**"
---

## Migration Conventions
- Always add RLS policies for new tables
- Include org_id column
- Add indexes for frequently queried columns
```

This loads API conventions only when working on API files, database conventions only for migrations -- never both simultaneously.

**Source**: [Claude Code Rules Directory](https://claudefa.st/blog/guide/mechanics/rules-directory) (2026), [Claude Code Memory Docs](https://code.claude.com/docs/en/memory) (2026)

---

## 5. Cross-AI Prompt Handoff Best Practices

### 5.1 The Universal Prompt Package Format

No single standard exists yet (as of Feb 2026), but a practical format emerges from combining patterns across Claude, Codex, and Kimi. The key insight: **Markdown with YAML frontmatter** is the most portable format -- understood by all major AI coding tools.

**Recommended "Prompt Package" structure**:

```markdown
---
# YAML Frontmatter -- machine-parseable metadata
task_id: "03.4-P2"
agent_target: "any"          # claude | codex | kimi | any
task_type: "implementation"   # research | implementation | review | test
priority: "high"
complexity: "M"
estimate_hours: 4
requires:
  - "supabase access"
  - "apps/frontend/ write access"
output_format: "code"         # code | json | markdown | structured
---

# Task: Implement Warehouse Receiving API

## Context
MonoPilot MES system. Multi-tenant SaaS with org_id RLS on all tables.
Stack: Next.js 16, Supabase, TypeScript, Zod.

## Objective
Create the warehouse receiving endpoint that records incoming inventory
as License Plates (LPs) with full lot traceability.

## Files to Read
- `apps/frontend/app/api/production/work-orders/route.ts` (pattern reference)
- `apps/frontend/lib/validation/warehouse-schemas.ts` (validation)
- `supabase/migrations/025_warehouse_tables.sql` (schema)

## Files to Create
1. `apps/frontend/app/api/warehouse/receiving/route.ts` -- POST, GET
2. `apps/frontend/lib/services/receiving-service.ts` -- business logic

## Acceptance Criteria
- [ ] POST creates LP record with org_id, lot_number, expiry_date
- [ ] GET returns paginated list filtered by org_id
- [ ] Zod validation on all inputs
- [ ] RLS policy prevents cross-tenant access
- [ ] Returns 201 on success, 400 on validation error, 500 on server error

## Constraints
- Do NOT use loose quantity -- everything is LP-based
- Do NOT modify existing migration files
- Follow existing API route patterns exactly
```

### 5.2 Format Compatibility Across AIs

| Feature | Claude Code | Codex CLI | Kimi K2.5 |
|---------|-------------|-----------|-----------|
| Reads markdown natively | Yes (CLAUDE.md) | Yes (AGENTS.md) | Yes (system prompt) |
| YAML frontmatter | Yes (rules files) | Yes (SKILL.md) | Yes (standard) |
| Progressive loading | Yes (rules + subagents) | Yes (skills) | No (full context) |
| Path-scoped instructions | Yes (.claude/rules/) | Yes (nested AGENTS.md) | No |
| Structured JSON output | Yes (tool results) | Yes (--output-schema) | Yes (API response) |
| Image input | Yes (-i flag) | Yes (-i flag) | Yes (native multimodal) |
| Non-interactive execution | Yes (claude -p) | Yes (codex exec) | Yes (API only) |
| stdin piping | Yes (cat | claude -p) | Yes (cat | codex exec -) | N/A (API) |

### 5.3 Handoff Pipeline Pattern

```
[Orchestrator: Claude Code]
        |
        |-- "Architecture & Planning" --> Claude Code subagent
        |       |
        |       v
        |   [context.yaml generated]
        |
        |-- "Bulk API Generation" --> codex exec (via shell)
        |       |
        |       v
        |   cat context.yaml | codex exec --full-auto -
        |
        |-- "UI from Wireframes" --> Kimi K2.5 (via API)
        |       |
        |       v
        |   curl -X POST moonshot-api -d '{"messages":[...]}'
        |
        |-- "Code Review" --> Claude Code subagent
        |-- "Test Generation" --> codex exec
        |-- "QA Verification" --> Claude Code subagent
```

### 5.4 Concrete Handoff Script Example

```bash
#!/bin/bash
# multi-agent-pipeline.sh -- Route tasks to optimal AI agent

STORY_ID=$1
CONTEXT_FILE="docs/2-MANAGEMENT/epics/current/context/${STORY_ID}.context.yaml"

# Phase 1: Claude Code plans architecture
claude -p "Read ${CONTEXT_FILE} and create implementation plan. \
Output as markdown to /tmp/plan-${STORY_ID}.md" \
  --output-format text > /tmp/plan-${STORY_ID}.md

# Phase 2: Codex generates boilerplate
cat /tmp/plan-${STORY_ID}.md | \
  codex exec --full-auto --sandbox workspace-write -C /workspaces/MonoPilot -

# Phase 3: Claude Code reviews
claude -p "Review all files modified in the last commit. \
Check for: RLS compliance, org_id filtering, Zod validation, \
error handling. Report issues." \
  --output-format text > /tmp/review-${STORY_ID}.md

# Phase 4: Codex fixes issues
cat /tmp/review-${STORY_ID}.md | \
  codex exec --full-auto --sandbox workspace-write -

# Phase 5: Claude Code runs final QA
claude -p "Run 'pnpm test' and verify all acceptance criteria from \
${CONTEXT_FILE}. Report pass/fail."
```

### 5.5 MCP as the Universal Bridge

The **Model Context Protocol (MCP)** is emerging as the standard for AI-to-tool integration (adopted by OpenAI, Anthropic, Google, Microsoft as of 2025-2026). For cross-AI handoffs:

- Codex can be exposed as an **MCP server** within the Agents SDK
- Claude Code natively supports MCP servers for tool extension
- MCP provides structured, typed communication between agents

```bash
# Codex as MCP server (from Agents SDK guide)
codex mcp add my-codex-server
```

**Source**: [Codex + Agents SDK Guide](https://developers.openai.com/codex/guides/agents-sdk/) (2026), [Why MCP Won - The New Stack](https://thenewstack.io/why-the-model-context-protocol-won/) (2026)

---

## 6. Comparison Matrix

### 6.1 AI Coding Agents Comparison

| Criterion | Claude Code | Codex CLI | Kimi K2.5 | Weight |
|-----------|-------------|-----------|-----------|--------|
| Architecture/reasoning | 5/5 | 3/5 | 3/5 | High |
| Speed of execution | 3/5 | 5/5 | 4/5 | Medium |
| Visual/UI coding | 3/5 | 3/5 | 5/5 | Medium |
| Non-interactive automation | 4/5 | 5/5 | 4/5 | High |
| Multi-agent native | 5/5 (subagents) | 3/5 (MCP) | 4/5 (swarms) | High |
| Context window | 5/5 (1M tokens) | 4/5 | 3/5 (256K) | Medium |
| Cost efficiency | 2/5 ($5/M Opus) | 3/5 | 5/5 ($0.60/M) | Medium |
| Instruction system | 5/5 (CLAUDE.md + rules) | 5/5 (AGENTS.md + skills) | 2/5 (system prompt) | High |
| Ecosystem maturity | 5/5 | 4/5 | 2/5 | Medium |
| Open source model | No | No | Yes (weights) | Low |

### 6.2 Orchestration Tool Comparison

| Criterion | GitHub Agent HQ | myclaude | Claude Squad | Custom Script | Weight |
|-----------|----------------|----------|--------------|---------------|--------|
| Multi-AI support | 5/5 (Claude+Codex+Copilot) | 5/5 (Claude+Codex+Gemini) | 4/5 (multiple CLIs) | 5/5 (any) | High |
| Setup complexity | 1/5 (managed) | 3/5 | 2/5 | 4/5 | Medium |
| Git isolation | Yes (worktrees) | Yes | Yes (worktrees) | Manual | High |
| CI/CD integration | Native GitHub | Script-based | No | Full control | Medium |
| Cost | Pro+/Enterprise | Free | Free | Free | Medium |
| Customization | Low | High | Medium | Full | Medium |

### 6.3 Token Optimization Comparison

| Technique | Savings | Complexity | Applicable To | Weight |
|-----------|---------|------------|---------------|--------|
| Path-scoped rules | 60-80% | Low | Claude Code | High |
| Skills (progressive) | 60-85% | Medium | Codex | High |
| /compact | ~50% | None | Claude Code | High |
| Context distillation | 70-90% | Medium | All agents | High |
| Artifact pattern | 80-95% | Medium | All agents | Medium |
| Pre-extraction (yq/jq) | 90%+ | Low | Codex exec | High |
| MCP tool search | ~85% | Low | Claude Code | Medium |

---

## 7. Recommendation

### Primary Recommendation: Hybrid Claude + Codex Pipeline

**Confidence**: High (Tier 1 sources -- official documentation from both vendors)

For MonoPilot, adopt a **Claude Code as orchestrator, Codex as executor** pattern:

1. **Keep Claude Code as primary** for architecture, planning, code review, and complex logic (RLS policies, multi-tenant queries, BOM snapshots)

2. **Add Codex exec for batch generation** -- use it for repetitive API endpoint creation, test scaffolding, and boilerplate generation where speed matters more than deep reasoning

3. **Add Kimi K2.5 for UI work** -- when converting wireframes (SET-001 to SET-029) to React/ShadCN components, Kimi's visual coding capabilities and low cost ($0.60/M tokens) make it ideal

4. **Use the Universal Prompt Package format** (Section 5.1) as the interchange format -- markdown with YAML frontmatter works natively across all three tools

5. **Implement path-scoped rules** in `.claude/rules/` immediately -- this gives the highest ROI for token savings with minimal effort

6. **Mirror instruction structure** across tools:
   - `.claude/CLAUDE.md` <-> `AGENTS.md` (same content, adapted format)
   - `.claude/rules/*.md` <-> `.agents/skills/*/SKILL.md` (same conventions)
   - `context/*.context.yaml` <-> stdin piping to `codex exec` (same data)

### Implementation Priority

| Step | Action | Effort | Impact |
|------|--------|--------|--------|
| 1 | Create AGENTS.md mirroring CLAUDE.md conventions | 1 hour | High |
| 2 | Add path-scoped .claude/rules/ files | 2 hours | High |
| 3 | Create 3-4 Codex skills for MonoPilot patterns | 3 hours | High |
| 4 | Write multi-agent-pipeline.sh script | 2 hours | Medium |
| 5 | Set up Kimi K2.5 API for UI generation | 1 hour | Medium |
| 6 | Evaluate GitHub Agent HQ when available | 0 (wait) | Future |

---

## 8. Sources

### Tier 1 (Official Documentation)
1. [OpenAI - Custom Instructions with AGENTS.md](https://developers.openai.com/codex/guides/agents-md/) (2026)
2. [OpenAI - Agent Skills](https://developers.openai.com/codex/skills) (2026)
3. [OpenAI - Codex CLI Reference](https://developers.openai.com/codex/cli/reference/) (2026)
4. [OpenAI - Non-Interactive Mode](https://developers.openai.com/codex/noninteractive/) (2026)
5. [OpenAI - Codex Prompting Guide](https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide/) (2026)
6. [OpenAI - Codex Configuration Reference](https://developers.openai.com/codex/config-reference/) (2026)
7. [OpenAI - Custom Prompts (deprecated)](https://developers.openai.com/codex/custom-prompts/) (2026)
8. [OpenAI - Codex + Agents SDK](https://developers.openai.com/codex/guides/agents-sdk/) (2026)
9. [Anthropic - Claude Code Subagents](https://code.claude.com/docs/en/sub-agents) (2026)
10. [Anthropic - Claude Code Memory/Rules](https://code.claude.com/docs/en/memory) (2026)
11. [Anthropic - Claude Code Cost Management](https://code.claude.com/docs/en/costs) (2026)
12. [Kimi K2.5 Tech Blog](https://www.kimi.com/blog/kimi-k2-5.html) (Jan 2026)
13. [Kimi K2.5 Model Page](https://www.kimi.com/ai-models/kimi-k2-5) (2026)
14. [GitHub Blog - Agent HQ](https://github.blog/news-insights/company-news/pick-your-agent-use-claude-and-codex-on-agent-hq/) (Feb 4, 2026)
15. [GitHub Changelog - Claude and Codex on GitHub](https://github.blog/changelog/2026-02-04-claude-and-codex-are-now-available-in-public-preview-on-github/) (Feb 4, 2026)

### Tier 2 (Expert Analysis and Guides)
16. [Martin Fowler - Context Engineering for Coding Agents](https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html) (2026)
17. [eesel.ai - Claude Code Multiple Agent Systems 2026 Guide](https://www.eesel.ai/blog/claude-code-multiple-agent-systems-complete-2026-guide) (2026)
18. [DeepWiki - Token Optimization Techniques](https://deepwiki.com/FlorianBruniaux/claude-code-ultimate-guide/10.4-token-optimization-techniques) (2026)
19. [claudefa.st - Claude Code Rules Directory](https://claudefa.st/blog/guide/mechanics/rules-directory) (2026)
20. [claudefa.st - Context Management](https://claudefa.st/blog/guide/mechanics/context-management) (2026)
21. [The New Stack - Why MCP Won](https://thenewstack.io/why-the-model-context-protocol-won/) (2026)
22. [Addy Osmani - Future of Agentic Coding](https://addyosmani.com/blog/future-agentic-coding/) (2026)

### Tier 2 (Tools and Repositories)
23. [github.com/cexll/myclaude](https://github.com/cexll/myclaude) (2026)
24. [github.com/feiskyer/codex-settings](https://github.com/feiskyer/codex-settings) (2026)
25. [github.com/ruvnet/claude-flow](https://github.com/ruvnet/claude-flow) (2025)

### Tier 3 (Community/Aggregators)
26. [Kimi K2 API Docs (community)](https://kimi-k2.ai/api-docs) (2026)
27. [OpenRouter - Kimi K2.5](https://openrouter.ai/moonshotai/kimi-k2.5) (2026)
28. [Simon Willison - Kimi K2.5](https://simonwillison.net/2026/Jan/27/kimi-k25/) (Jan 2026)
