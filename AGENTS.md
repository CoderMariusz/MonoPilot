# MonoPilot Agent Workflow (Codex CLI)

This repo includes a Claude-style “agent pack” under `.claude/agents/`. In Codex CLI these files are **not** executed as real multi-agents, but should be treated as the canonical **process + checklists** for how work is done here.

## How to Use `.claude/agents/*` in Codex CLI

- Use `.claude/agents/ORCHESTRATOR.md` as the routing table to choose a role for the current user request.
- Implement “delegation” by running the work in **explicit phases** (simulated roles) within one assistant:
  - `DISCOVERY-AGENT` → clarify unknowns (max 7 questions/round).
  - `PM-AGENT` → PRD/scope/KPIs when requirements are needed.
  - `TEST-ENGINEER`/`TEST-WRITER` → TDD RED (tests first).
  - `BACKEND-DEV`/`FRONTEND-DEV` → TDD GREEN (minimal code to pass tests).
  - `SENIOR-DEV` → REFACTOR (no behavior changes).
  - `CODE-REVIEWER` → approve/request changes with `file:line`.
  - `QA-AGENT` → AC-based manual validation, PASS/FAIL.

## Parallelism (Practical)

- You can parallelize **tool reads/searches** (e.g. multiple `rg`/`sed`/`ls`) when tasks are independent.
- Do **not** parallelize edits to the same files; keep code changes sequential.

## Quality Gates (Default)

Follow the gates from `.claude/agents/ORCHESTRATOR.md`:

- RED → GREEN: tests exist and fail
- GREEN → REVIEW: tests pass + build succeeds
- REVIEW → QA: `CODE-REVIEWER` approved
- QA → DONE: `QA-AGENT` pass

## Project Conventions Pointers

- Start here: `.claude/AGENT-QUICK-START-MONOPILOT.md`
- Patterns/checklists: `.claude/PATTERNS.md`, `.claude/checklists/*`, `.claude/skills/generic/*`
