# Handoff Files

This directory contains structured prompt files for multi-AI handoffs.

## How It Works

After P2 (tests written), the tester agent generates two handoff files per story:

- `{STORY_ID}-frontend.md` - For Kimi K2.5 via KiloCode (frontend implementation)
- `{STORY_ID}-backend.md` - For Codex CLI / Cursor (backend implementation)

## Flow

```
Tester (P2) generates handoffs
       |
       +-> Kimi reads {STORY_ID}-frontend.md via KiloCode
       |   Kimi appends "Components Created" section when done
       |
       +-> Codex reads {STORY_ID}-backend.md + Kimi's frontend output
       |   Codex implements backend to match frontend expectations
       |
       +-> Quality agent reads both handoffs for review (P5) and QA (P6)
```

## File Format

Both files use markdown with YAML frontmatter:

```yaml
---
task_id: "{STORY_ID}-P3a"
target: "kimi"          # or "codex"
tool: "kilocode"        # or "codex-exec"
task_type: "frontend-implementation"  # or "backend-implementation"
story: "{STORY_ID}"
phase: "P3a"            # or "P3b"
---
```

## Rules

1. Tester MUST generate both files after P2
2. Kimi MUST append "Components Created" section when finished
3. Codex receives both files (backend + frontend output) for context
4. Quality agent reads both files during review
5. Never delete handoff files until story is marked DONE in P7
