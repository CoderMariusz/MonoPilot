# Claude Code Skills & Agent Architecture: Comprehensive Research Report

**Date**: 2026-02-10
**Depth**: Deep (25+ sources)
**Confidence**: High (Tier 1 official docs + Tier 2 expert analysis)

---

## TABLE OF CONTENTS

1. [Claude Code Skills System](#1-claude-code-skills-system)
2. [Agent vs Skill: When to Use Which](#2-agent-vs-skill-when-to-use-which)
3. [Orchestration Patterns](#3-orchestration-patterns)
4. [Real-World Examples & Implementations](#4-real-world-examples)
5. [Comparison Matrix: Your Current Setup vs Best Practices](#5-comparison-matrix)
6. [Concrete Recommendations for MonoPilot](#6-recommendations)

---

## 1. CLAUDE CODE SKILLS SYSTEM

### 1.1 What Skills Are (Official Definition)

Skills are **modular capability packages** stored as directories containing a `SKILL.md` file with optional supporting files. They follow the [Agent Skills open standard](https://agentskills.io) and work identically across Claude.ai, Claude Code, and the API.

**Source**: [Anthropic Official Docs](https://code.claude.com/docs/en/skills) (2026)

### 1.2 Directory Structure

```
skill-name/
├── SKILL.md           # Required: YAML frontmatter + markdown instructions
├── templates/         # Optional: templates Claude fills in
├── examples/          # Optional: example outputs
├── reference/         # Optional: detailed docs loaded on-demand
└── scripts/           # Optional: executable scripts
```

**Where skills live** (priority order):

| Location | Path | Scope | Priority |
|----------|------|-------|----------|
| Enterprise | Managed settings | All org users | Highest |
| Personal | `~/.claude/skills/<name>/SKILL.md` | All your projects | High |
| Project | `.claude/skills/<name>/SKILL.md` | This project only | Medium |
| Plugin | `<plugin>/skills/<name>/SKILL.md` | Where plugin enabled | Lowest |

**Source**: [Claude Code Skills Docs](https://code.claude.com/docs/en/skills) (2026)

### 1.3 SKILL.md Frontmatter Format (Complete Reference)

```yaml
---
name: my-skill-name              # Max 64 chars, lowercase/numbers/hyphens only
description: >-                   # Max 1024 chars, REQUIRED for discovery
  What this skill does and when to use it.
  Write in third person. Include trigger words.
argument-hint: "[filename] [format]"   # Shown in autocomplete
disable-model-invocation: false   # true = only user can invoke via /name
user-invocable: true              # false = hidden from / menu, Claude-only
allowed-tools: Read, Grep, Glob   # Tools allowed without permission prompts
model: sonnet                     # Model override (sonnet/opus/haiku/inherit)
context: fork                     # Run in isolated subagent context
agent: Explore                    # Which subagent type when context: fork
hooks: {}                         # Lifecycle hooks scoped to this skill
---

Your markdown instructions here...
```

**Source**: [Claude Code Skills Docs - Frontmatter Reference](https://code.claude.com/docs/en/skills) (2026)

### 1.4 Progressive Disclosure Architecture

Skills implement a three-tier loading strategy to conserve tokens:

| Tier | What Loads | When | Token Cost |
|------|-----------|------|------------|
| **Tier 1: Metadata** | name + description from all skills | Session startup | ~100 tokens/skill |
| **Tier 2: SKILL.md** | Full markdown body | When Claude determines skill is relevant | <5,000 tokens |
| **Tier 3: Supporting files** | reference.md, scripts, templates | Only when explicitly needed | Variable |

**Critical constraint**: All skill descriptions share a budget of **2% of context window** (fallback: 16,000 characters). With 52 skills at ~200 chars each, you're using ~10,400 chars -- within budget but approaching limits. Check with `/context` for warnings.

**Source**: [Anthropic Engineering Blog - Agent Skills Architecture](https://claude.com/blog/equipping-agents-for-the-real-world-with-agent-skills) (2025), [Claude Code Skills Docs](https://code.claude.com/docs/en/skills) (2026)

### 1.5 How Skill Discovery Works Internally

The discovery mechanism is **purely language-model based** -- no embeddings, classifiers, or algorithmic routing:

1. At startup, all skill names+descriptions are formatted into `<available_skills>` section of the Skill tool's prompt
2. When user sends a message, Claude reads the available skills list
3. Claude's language understanding matches user intent to skill descriptions
4. If a match is found, Claude invokes the `Skill` tool with the skill name
5. The system loads SKILL.md content and injects it as a hidden user message
6. Claude then follows the skill's instructions

**Key insight**: Description quality is the single most important factor for discovery accuracy.

**Source**: [Lee Han Chung - Skills Deep Dive](https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/) (2025), [Mikhail Shilkov - Inside Claude Code Skills](https://mikhail.io/2025/10/claude-code-skills/) (2025)

### 1.6 Skills vs Old Slash Commands

Slash commands have been **merged into skills** as of January 2026. Key differences:

| Feature | Old Commands (`.claude/commands/`) | Skills (`.claude/skills/`) |
|---------|-----------------------------------|---------------------------|
| Invocation | `/command-name` only | `/skill-name` OR auto-invoked |
| Structure | Single .md file | Directory with supporting files |
| Auto-discovery | No | Yes, via description matching |
| Frontmatter | Same format supported | Same format + extra fields |
| Status | Still works (backward compat) | Recommended going forward |

**If both exist with same name, the skill takes precedence.**

**Source**: [Claude Code Skills Docs](https://code.claude.com/docs/en/skills) (2026), [Medium - Claude Code Merges Slash Commands Into Skills](https://medium.com/@joe.njenga/claude-code-merges-slash-commands-into-skills-dont-miss-your-update-8296f3989697) (2026)

### 1.7 String Substitutions in Skills

Skills support dynamic value injection:

| Variable | Description |
|----------|-------------|
| `$ARGUMENTS` | All arguments passed when invoking |
| `$ARGUMENTS[N]` or `$N` | Specific argument by 0-based index |
| `${CLAUDE_SESSION_ID}` | Current session ID |
| `` !`command` `` | Shell command output (preprocessed before Claude sees it) |

### 1.8 Best Practices for Writing Skills (Official)

From [Anthropic's Skill Authoring Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) (2026):

**Naming**: Use gerund form (e.g., `processing-pdfs`, `testing-code`, `managing-databases`)

**Description**: Write in third person. Include WHAT it does AND WHEN to use it:
```yaml
# GOOD
description: "Extracts text and tables from PDF files. Use when working with PDF files or document extraction."

# BAD
description: "Helps with documents"
```

**Size**: Keep SKILL.md body **under 500 lines**. Move detailed reference to separate files.

**Degrees of freedom**: Match specificity to fragility:
- High freedom (text instructions) for context-dependent work like code review
- Low freedom (exact scripts) for fragile operations like database migrations

**Conciseness**: Claude is already very smart. Only add context it doesn't already have. Challenge each paragraph: "Does this justify its token cost?"

**Testing**: Test with all models you plan to use (Haiku needs more detail, Opus needs less)

**Avoid**:
- Deeply nested file references (keep one level deep from SKILL.md)
- Time-sensitive information
- Inconsistent terminology
- Windows-style paths
- Too many options without a default

---

## 2. AGENT vs SKILL: WHEN TO USE WHICH

### 2.1 The Four-Layer Customization Model

Claude Code has four distinct mechanisms, each serving a different purpose:

| Mechanism | Best For | Loaded | Token Cost | Isolation |
|-----------|----------|--------|------------|-----------|
| **CLAUDE.md** | Always-true project rules | Every session | Permanent (keep <150 lines) | None (shared context) |
| **Skills** | On-demand knowledge & workflows | When relevant | Temporary (progressive disclosure) | None (inline) or fork |
| **Subagents** | Isolated task delegation | When spawned | Own context window | Full |
| **Agent Teams** | Parallel multi-session work | When created | Separate instances | Full + messaging |

**Source**: [alexop.dev - Customization Guide](https://alexop.dev/posts/claude-code-customization-guide-claudemd-skills-subagents/) (2025), [Young Leaders Tech - Skills vs Commands vs Subagents](https://www.youngleaders.tech/p/claude-skills-commands-subagents-plugins) (2025)

### 2.2 Decision Framework

```
Need this instruction EVERY conversation? → CLAUDE.md
Need it for SPECIFIC task types?          → Skill (auto-invoked)
Need a USER-TRIGGERED workflow?           → Skill (disable-model-invocation: true)
Need ISOLATED context for heavy work?     → Subagent
Need PARALLEL workers that COMMUNICATE?   → Agent Team
```

### 2.3 Agent-to-Skill Relationship Pattern

The community consensus is: **Fewer agents + more skills = better results**

**Why?** Each subagent invocation costs ~20K tokens baseline overhead. If you have 20 specialized agents, you're paying that overhead each time one is spawned. Skills load incrementally (description ~100 tokens, full body <5K tokens) and run inline.

**The recommended pattern**:

```
BEFORE (many specialized agents):
  orchestrator → backend-dev (20K overhead)
  orchestrator → frontend-dev (20K overhead)
  orchestrator → code-reviewer (20K overhead)
  = 60K+ tokens in overhead alone

AFTER (fewer agents + skill libraries):
  orchestrator → general-dev-agent (20K overhead, preloaded with skills)
    Skills auto-loaded: api-conventions, typescript-patterns, supabase-rls
  = 20K overhead + ~2K skill content
```

**Source**: [PubNub - Best Practices for Claude Code Subagents](https://www.pubnub.com/blog/best-practices-for-claude-code-sub-agents/) (2026), [Amit Kothari - Task Tool vs Subagents](https://amitkoth.com/claude-code-task-tool-vs-subagents/) (2025)

### 2.4 Subagent Configuration (Official Format)

Subagents are defined as Markdown files in `.claude/agents/`:

```markdown
---
name: code-reviewer
description: Reviews code for quality and best practices. Use proactively after code changes.
tools: Read, Grep, Glob, Bash
model: sonnet
permissionMode: default           # default|acceptEdits|dontAsk|delegate|bypassPermissions|plan
maxTurns: 25                      # Max agentic turns
skills:                           # Preloaded skill content (injected at startup)
  - api-conventions
  - error-handling-patterns
memory: user                      # Persistent memory: user|project|local
hooks: {}                         # Lifecycle hooks
---

You are a code reviewer. When invoked, analyze the code and provide
specific, actionable feedback on quality, security, and best practices.
```

**Key fields**:
- `skills`: Preloads full skill content into subagent's context at startup
- `memory`: Enables persistent learning across sessions
- `permissionMode`: Controls approval behavior
- `model`: sonnet/opus/haiku/inherit

**Source**: [Claude Code Subagents Docs](https://code.claude.com/docs/en/sub-agents) (2026)

### 2.5 When Subagents Cannot Spawn Sub-subagents

**Subagents cannot spawn other subagents.** This is a hard constraint. If your workflow requires nested delegation, either:
1. Use Skills within the subagent (via `skills` field)
2. Chain subagents from the main conversation
3. Use Agent Teams for true parallel work

**Source**: [Claude Code Subagents Docs](https://code.claude.com/docs/en/sub-agents) (2026)

---

## 3. ORCHESTRATION PATTERNS

### 3.1 Pattern Comparison Matrix

| Pattern | Parallelism | Communication | Token Cost | Best For |
|---------|------------|---------------|------------|----------|
| **Sequential Skills** | None | Shared context | Low | Simple workflows |
| **Subagent Chain** | Sequential | Via main thread | Medium | Multi-step pipelines |
| **Parallel Subagents** | Yes | Report to main only | Medium-High | Independent research |
| **Agent Teams** | Yes | Direct messaging | High | Complex collaborative work |

### 3.2 Pattern 1: Orchestrator with Subagent Delegation

The most common pattern. One main session routes tasks to specialized subagents:

```
User → Orchestrator (main thread)
         ├── Task("backend-dev", "Implement API endpoint for...")
         ├── Task("frontend-dev", "Create form component for...")
         └── Task("code-reviewer", "Review changes in...")
```

**Token optimization**: Use `Task(agent_type)` in the orchestrator's `tools` field to restrict which subagents it can spawn:

```yaml
---
name: orchestrator
tools: Task(backend-dev, frontend-dev, code-reviewer), Read, Grep
---
```

### 3.3 Pattern 2: Skills-First with Selective Subagents

Instead of always delegating to subagents, load skills inline for most work and only delegate when isolation is needed:

```
User → Main Claude (with skills auto-loaded)
         ├── Skill: api-conventions (inline, ~500 tokens)
         ├── Skill: typescript-patterns (inline, ~600 tokens)
         ├── Task("Explore", "Research the auth module...") (only when isolation needed)
         └── Direct implementation (no delegation overhead)
```

This saves 37% tokens on complex tasks vs always-delegate approach.

**Source**: [Sankalp Blog - Claude Code 2.0 Experience](https://sankalp.bearblog.dev/my-experience-with-claude-code-20-and-how-to-get-better-at-using-coding-agents/) (2025)

### 3.4 Pattern 3: Agent Teams for Parallel Work

For genuinely parallel tasks (e.g., implementing frontend + backend + tests simultaneously):

```
Lead (delegate mode) → Team
   ├── Teammate: backend (implements API)
   ├── Teammate: frontend (implements UI)
   └── Teammate: tests (writes integration tests)

Shared: task list, mailbox messaging
```

**Enable**: Set `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in settings.

**Best use cases**:
- Research with competing hypotheses
- Cross-layer coordination (frontend/backend/tests)
- New modules where workers don't touch same files
- Parallel code review with different focus areas

**Source**: [Claude Code Agent Teams Docs](https://code.claude.com/docs/en/agent-teams) (2026)

### 3.5 Pattern 4: Model-Tiered Agent System

From the wshobson/agents repository (112 agents, 146 skills):

| Tier | Model | Use For | Token Cost |
|------|-------|---------|------------|
| 1 | Opus | Critical: architecture, security, code review | Highest |
| 2 | Inherit | Complex: user-selected model | Variable |
| 3 | Sonnet | Support: docs, testing, debugging | Medium |
| 4 | Haiku | Operations: fast, cost-effective tasks | Lowest |

**Key insight**: Route exploration to Haiku (fast, cheap), implementation to Sonnet (balanced), critical decisions to Opus (highest quality).

**Source**: [wshobson/agents GitHub](https://github.com/wshobson/agents) (2026)

### 3.6 Token Optimization Strategies

| Strategy | Savings | How |
|----------|---------|-----|
| Use Explore subagent for research | ~37% | Haiku model, read-only, results summarized |
| Skills instead of always-delegate | ~60% | No 20K subagent overhead per skill load |
| Progressive disclosure in skills | ~80% | Only load reference files when needed |
| Background subagents | Variable | Continue working while agent runs |
| Model tiering | 50-80% | Route routine work to cheaper models |
| `maxTurns` on subagents | Caps cost | Prevent runaway token consumption |

**Source**: [ClaudeLog - Task Agent Tools](https://claudelog.com/mechanics/task-agent-tools/) (2025), [PubNub - Subagent Best Practices](https://www.pubnub.com/blog/best-practices-for-claude-code-sub-agents/) (2026)

---

## 4. REAL-WORLD EXAMPLES

### 4.1 Anthropic's Official Skills Repository

[github.com/anthropics/skills](https://github.com/anthropics/skills) - 67K stars

**Categories**:
- Creative & Design (art, music, design)
- Development & Technical (testing, MCP servers)
- Enterprise & Communication (business workflows)
- Document Skills (docx, pdf, pptx, xlsx - production-grade)

**Installation**:
```bash
/plugin marketplace add anthropics/skills
/plugin install document-skills@anthropic-agent-skills
```

### 4.2 wshobson/agents - Full Orchestration System

[github.com/wshobson/agents](https://github.com/wshobson/agents) - 73 plugins, 112 agents, 146 skills

**Architecture**: Three-tier hierarchy (Plugin → Agent → Skill) where each plugin loads only its specific components into context. Uses model-based tiering for cost optimization.

### 4.3 Community Skill Libraries

| Repository | Focus | Stars |
|-----------|-------|-------|
| [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) | 300+ skills, cross-platform | High |
| [travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills) | Curated Claude Code skills | High |
| [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) | Claude AI workflows | High |

### 4.4 Example: Well-Designed Skill (Explain Code)

```yaml
---
name: explain-code
description: >-
  Explains code with visual diagrams and analogies. Use when explaining
  how code works, teaching about a codebase, or when the user asks
  "how does this work?"
---

When explaining code, always include:

1. **Start with an analogy**: Compare the code to something from everyday life
2. **Draw a diagram**: Use ASCII art to show the flow, structure, or relationships
3. **Walk through the code**: Explain step-by-step what happens
4. **Highlight a gotcha**: What's a common mistake or misconception?

Keep explanations conversational. For complex concepts, use multiple analogies.
```

### 4.5 Example: Skill with Subagent Fork

```yaml
---
name: deep-research
description: Research a topic thoroughly using codebase exploration
context: fork
agent: Explore
allowed-tools: Read, Grep, Glob
---

Research $ARGUMENTS thoroughly:

1. Find relevant files using Glob and Grep
2. Read and analyze the code
3. Summarize findings with specific file references
```

### 4.6 Example: Subagent with Preloaded Skills

```markdown
---
name: api-developer
description: Implement API endpoints following team conventions
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
skills:
  - api-conventions
  - error-handling-patterns
  - typescript-patterns
memory: project
---

Implement API endpoints. Follow the conventions and patterns
from the preloaded skills. After implementation, update your
agent memory with patterns discovered in this codebase.
```

### 4.7 Example: Deploy Skill (Manual-Only)

```yaml
---
name: deploy
description: Deploy the application to production
context: fork
disable-model-invocation: true
allowed-tools: Bash(git *), Bash(pnpm *)
---

Deploy $ARGUMENTS to production:

1. Run the test suite: `pnpm test`
2. Build the application: `pnpm build`
3. Push to the deployment target
4. Verify the deployment succeeded
```

---

## 5. COMPARISON MATRIX: YOUR CURRENT SETUP vs BEST PRACTICES

### 5.1 Current MonoPilot Setup Analysis

**Current state**: 52 skills + 20+ agents in `.claude/agents/`

| Aspect | Current State | Best Practice | Gap |
|--------|--------------|---------------|-----|
| **Skill count** | 52 skills | Reasonable (budget ~10K chars) | OK but monitor with `/context` |
| **Skill format** | Has extra fields (version, tokens, confidence, tags) | Only `name` and `description` recognized by Claude Code | MISMATCH - extra fields ignored |
| **Agent format** | Custom YAML frontmatter (type, trigger, behavior, skills.required) | Official frontmatter (tools, model, permissionMode, skills, memory) | MISMATCH - non-standard fields |
| **Agent count** | 20+ specialized agents | Fewer agents + more skills recommended | OVER-SPECIALIZED |
| **Orchestrator** | Manual routing table in ORCHESTRATOR.md | Native subagent delegation via description matching | OVER-ENGINEERED |
| **Skill descriptions** | Mix of styles | Third-person, WHAT + WHEN format | INCONSISTENT |
| **Agent storage** | Nested dirs (.claude/agents/planning/, development/) | Flat `.claude/agents/` directory | Non-standard nesting |
| **CLAUDE.md** | ~150 lines (dense) | <150 lines recommended | AT LIMIT |

### 5.2 Critical Issues Found

**Issue 1: Non-Standard Frontmatter in Agents**

Your agent files use custom fields that Claude Code does not recognize:
```yaml
# CURRENT (non-standard)
type: Development
trigger: RED phase complete
behavior: Minimal code to pass tests
skills:
  required: [api-rest-design, ...]
  optional: [supabase-queries, ...]
```

```yaml
# OFFICIAL FORMAT
tools: Read, Write, Edit, Bash, Grep, Glob
model: opus
permissionMode: default
skills:
  - api-rest-design
  - api-error-handling
memory: project
```

**Issue 2: Non-Standard Frontmatter in Skills**

Your skills include fields Claude Code ignores:
```yaml
# CURRENT (non-standard)
version: 1.0.0
tokens: ~650
confidence: high
sources: [...]
last_validated: 2025-01-10
next_review: 2025-01-24
tags: [supabase, security, database, rls]
```

Only `name`, `description`, `argument-hint`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, `model`, `context`, `agent`, and `hooks` are recognized. The rest is silently ignored.

**Issue 3: Too Many Agents = Too Much Token Overhead**

With 20+ agents, each spawned via Task() costs ~20K tokens. Many of these agents could be replaced by skills preloaded into fewer generalist agents.

### 5.3 Recommended Consolidation

| Current Agents | Recommended | Rationale |
|---------------|-------------|-----------|
| backend-dev + frontend-dev + senior-dev | `developer` agent with skills | Same tools, different skill preloads |
| unit-test-writer + test-engineer | `test-writer` agent with skills | Combine into one with TDD skills |
| code-reviewer + qa-agent | `quality` agent with skills | Both read-only, different focus |
| architect-agent + pm-agent + product-owner | `planner` agent with skills | All planning-phase work |
| discovery-agent + research-agent | `researcher` agent (Explore) | Both read-only research |
| tech-writer + doc-auditor | `documenter` agent with skills | Both doc-focused |
| devops-agent | Keep as-is | Unique toolchain |
| orchestrator | Main thread with routing | No need for separate agent |

**Result**: 20+ agents -> 6 agents + skill library

---

## 6. CONCRETE RECOMMENDATIONS FOR MONOPILOT

### 6.1 Priority 1: Fix Frontmatter Format (HIGH)

Migrate all agent files to official Claude Code subagent format:

```markdown
---
name: developer
description: >-
  Full-stack developer for API endpoints, services, and UI components.
  Use proactively for any implementation task including backend APIs,
  frontend components, and database operations.
tools: Read, Write, Edit, Bash, Grep, Glob
model: opus
skills:
  - api-rest-design
  - api-error-handling
  - typescript-patterns
  - typescript-zod
  - supabase-queries
  - supabase-rls
memory: project
---

You implement features following TDD principles. When given a task:

1. Read existing tests (if any)
2. Implement minimal code to satisfy requirements
3. Run tests to verify
4. Commit with conventional commit message

Security is mandatory: validate all input, use parameterized queries,
never hardcode secrets.
```

### 6.2 Priority 2: Consolidate Agents (HIGH)

Reduce from 20+ to 6-7 agents, using skills for specialization:

| Agent | Model | Skills Preloaded | Purpose |
|-------|-------|-----------------|---------|
| `developer` | opus | api-*, typescript-*, supabase-*, react-* | All implementation |
| `test-writer` | opus | testing-*, api-validation | TDD RED + E2E |
| `quality` | sonnet | code-review-checklist, security-*, accessibility-* | Review + QA |
| `planner` | opus | architecture-adr, prd-structure, invest-stories | Architecture + planning |
| `researcher` | haiku | research-source-evaluation, discovery-* | Read-only exploration |
| `documenter` | sonnet | documentation-patterns, version-changelog-* | Docs + changelog |
| `devops` | sonnet | ci-github-actions, docker-basics, env-configuration | CI/CD + deploy |

### 6.3 Priority 3: Clean Up Skill Descriptions (MEDIUM)

Standardize all 52 skills to official format:

```yaml
# BEFORE
---
name: supabase-rls
description: Apply when implementing multi-tenant data isolation...
version: 1.0.0
tokens: ~650
confidence: high
sources: [...]
last_validated: 2025-01-10
tags: [supabase, security, database, rls]
---

# AFTER
---
name: supabase-rls
description: >-
  Implements row-level security policies for multi-tenant data isolation
  in Supabase. Use when creating RLS policies, securing tables with
  org_id filtering, or implementing role-based access control.
---
```

### 6.4 Priority 4: Move Agent Instructions to CLAUDE.md (MEDIUM)

The orchestrator routing logic currently in ORCHESTRATOR.md should be simplified. Instead of a manual routing table, rely on Claude's native description-matching:

- Remove the manual routing table
- Write clear, keyword-rich descriptions for each agent
- Let Claude match tasks to agents automatically
- Keep CLAUDE.md under 150 lines -- move overflow to skills

### 6.5 Priority 5: Enable Agent Memory (LOW)

Add `memory: project` to key agents so they learn codebase patterns across sessions:

```yaml
---
name: developer
memory: project
---
```

This creates `.claude/agent-memory/developer/MEMORY.md` that persists learnings.

### 6.6 Priority 6: Consider Agent Teams for Epic-Level Work (LOW)

For implementing entire epics (e.g., Warehouse module with 10+ stories), Agent Teams could parallelize:

```
Lead (delegate mode)
  ├── Teammate: backend (API routes + services)
  ├── Teammate: frontend (pages + components)
  └── Teammate: tests (unit + integration tests)
```

But wait until the feature is stable (currently experimental).

---

## APPENDIX A: FULL SKILL FORMAT REFERENCE

```yaml
---
# RECOGNIZED FIELDS (Claude Code 2026)
name: skill-name                    # Required if differs from directory name
description: "What + When"          # Recommended, max 1024 chars
argument-hint: "[arg1] [arg2]"      # Autocomplete hint
disable-model-invocation: false     # true = manual /name only
user-invocable: true                # false = Claude-only (hidden from menu)
allowed-tools: Read, Grep           # Tool allowlist during skill execution
model: sonnet                       # Model override
context: fork                       # Run in isolated subagent
agent: Explore                      # Subagent type when context: fork
hooks: {}                           # Lifecycle hooks
---

## Instructions

Keep under 500 lines. Reference supporting files:
- See [reference.md](reference.md) for detailed API docs
- See [examples.md](examples.md) for usage patterns
```

## APPENDIX B: FULL SUBAGENT FORMAT REFERENCE

```markdown
---
# RECOGNIZED FIELDS (Claude Code 2026)
name: agent-name                    # Required, lowercase + hyphens
description: "When to delegate"     # Required, keyword-rich
tools: Read, Write, Edit, Bash      # Tool allowlist (inherits all if omitted)
disallowedTools: Write, Edit        # Tool denylist
model: sonnet                       # sonnet/opus/haiku/inherit
permissionMode: default             # default/acceptEdits/dontAsk/delegate/bypassPermissions/plan
maxTurns: 25                        # Max agentic turns
skills:                             # Preloaded skill content
  - skill-name-1
  - skill-name-2
mcpServers: []                      # MCP servers available
hooks: {}                           # Lifecycle hooks
memory: project                     # user/project/local
---

System prompt in markdown. This becomes the subagent's system prompt.
Claude only sees this + environment details, NOT the full Claude Code prompt.
```

## APPENDIX C: INVOCATION CONTROL MATRIX

| Configuration | User Can Invoke | Claude Can Invoke | Loaded Into Context |
|---------------|----------------|-------------------|-------------------|
| Default (no flags) | Yes via `/name` | Yes automatically | Description always, full on invoke |
| `disable-model-invocation: true` | Yes via `/name` | No | Description NOT in context |
| `user-invocable: false` | No | Yes automatically | Description always, full on invoke |

## APPENDIX D: SOURCES

### Tier 1 (Official Documentation)
- [Claude Code Skills Docs](https://code.claude.com/docs/en/skills) (2026)
- [Claude Code Subagents Docs](https://code.claude.com/docs/en/sub-agents) (2026)
- [Claude Code Agent Teams Docs](https://code.claude.com/docs/en/agent-teams) (2026)
- [Skill Authoring Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) (2026)
- [Agent Skills Overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) (2026)
- [Anthropic Skills Repository](https://github.com/anthropics/skills) (2026)
- [Anthropic Engineering Blog - Agent Skills](https://claude.com/blog/equipping-agents-for-the-real-world-with-agent-skills) (2025)

### Tier 2 (Expert Analysis)
- [Lee Han Chung - Skills Deep Dive](https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/) (2025)
- [Mikhail Shilkov - Inside Claude Code Skills](https://mikhail.io/2025/10/claude-code-skills/) (2025)
- [alexop.dev - Customization Guide](https://alexop.dev/posts/claude-code-customization-guide-claudemd-skills-subagents/) (2025)
- [Young Leaders Tech - Skills vs Commands vs Subagents](https://www.youngleaders.tech/p/claude-skills-commands-subagents-plugins) (2025)
- [wshobson/agents Repository](https://github.com/wshobson/agents) (2026)
- [PubNub - Subagent Best Practices](https://www.pubnub.com/blog/best-practices-for-claude-code-sub-agents/) (2026)
- [Amit Kothari - Task Tool vs Subagents](https://amitkoth.com/claude-code-task-tool-vs-subagents/) (2025)
- [Gend.co - Claude Skills Guide for Teams](https://www.gend.co/blog/claude-skills-claude-md-guide) (2026)
- [eesel.ai - Claude Code Multiple Agent Systems](https://www.eesel.ai/blog/claude-code-multiple-agent-systems-complete-2026-guide) (2026)
- [Addy Osmani - Claude Code Swarms](https://addyosmani.com/blog/claude-code-agent-teams/) (2026)

### Tier 3 (Community)
- [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) (2026)
- [travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills) (2026)
- [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) (2025)
- [kieranklaassen - Swarm Orchestration Gist](https://gist.github.com/kieranklaassen/4f2aba89594a4aea4ad64d753984b2ea) (2026)
- [Medium - Slash Commands Merged Into Skills](https://medium.com/@joe.njenga/claude-code-merges-slash-commands-into-skills-dont-miss-your-update-8296f3989697) (2026)
