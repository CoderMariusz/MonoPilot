# ORCHESTRATOR - Epic Audit & Completion

## 🎯 TARGET
```yaml
Epic: {{EPIC_ID}}        02-technical
Folder: {{EPIC_FOLDER}}  02-technical
Prefix: {{PREFIX}}       02
Mode: AUDIT   # AUDIT=tylko sprawdź, COMPLETE=dokończ stories
```

## 📋 7-PHASE FLOW (Reference)

| Phase | Agent | Skip When | Parallel |
|-------|-------|-----------|----------|
| P1 | ux-designer | Backend-only | No |
| P2 | test-writer | Never | No |
| P3 | backend/frontend-dev | - | ✓ Both tracks |
| P4 | senior-dev | Clean code | No |
| P5 | code-reviewer | Never | ✓ Multi-story |
| P6 | qa-agent | Never | ✓ Multi-story |
| P7 | tech-writer | Never | No |

---

## 🔄 PHASE 1: STATUS AUDIT (Orchestrator)

**Orchestrator reads (NO agents yet):**
```bash
# 1. List all checkpoints for epic
ls .claude/checkpoints/{{PREFIX}}*.yaml

# 2. List all stories
ls docs/2-MANAGEMENT/epics/current/{{EPIC_FOLDER}}/*.md | grep -E '^\d+\.\d+'

# 3. Read last 5 lines of each checkpoint
for f in .claude/checkpoints/{{PREFIX}}*.yaml; do tail -5 "$f"; done
```

**Output: Status Table**
```markdown
| Story | Checkpoint | Last Phase | Status | Action |
|-------|------------|------------|--------|--------|
| XX.1  | ✓          | P7 ✓       | DONE   | -      |
| XX.2  | ✓          | P5 ✓       | NEEDS  | P6→P7  |
| XX.3  | ✓          | P3 ✗       | BLOCK  | fix→P3 |
| XX.4  | ✗          | -          | MISS   | P1→P7  |
```

---

## 🚀 PHASE 2: DELEGATE TO AGENTS (Max 4 Parallel)

### Rule: Max 4 agents równolegle

**Grouping by action type:**

```yaml
Group A - Quick Completions (P6→P7 or P7 only):
  agent: qa-agent + tech-writer (sequential per story)
  stories: [stories needing P6→P7]
  parallel: up to 4 stories

Group B - Blocked Stories (need fix):
  agent: backend-dev or frontend-dev
  stories: [stories with P3/P5 failures]
  parallel: up to 2 stories

Group C - Missing Checkpoints (full audit):
  agent: Explore (read-only audit)
  stories: [stories without checkpoints]
  parallel: up to 4 stories
  output: create checkpoint file with findings
```

---

## 📤 DELEGATION PROMPTS

### Prompt A: Complete Story (P6→P7)
```
Task(qa-agent): {{STORY_ID}} P6
Do: Validate acceptance criteria, run tests
Read: .claude/checkpoints/{{STORY_ID}}.yaml
     docs/2-MANAGEMENT/epics/current/{{EPIC_FOLDER}}/{{STORY_FILE}}
Exit: Write P6 result to checkpoint, then spawn tech-writer for P7

---
Task(tech-writer): {{STORY_ID}} P7
Do: Create completion report
Read: .claude/checkpoints/{{STORY_ID}}.yaml
Exit: Write P7 result to checkpoint, mark COMPLETE
```

### Prompt B: Fix Blocked Story
```
Task(backend-dev): {{STORY_ID}} P3-FIX
Do: Fix issues from P5/P6 failure
Read: .claude/checkpoints/{{STORY_ID}}.yaml (last failure details)
Exit: Write fix result to checkpoint
Append: P3-FIX: ✓ backend-dev {{TIME}} fixes:N tests:X/Y
```

### Prompt C: Audit Missing Story (Create Checkpoint)
```
Task(Explore): {{STORY_ID}} AUDIT
Do: Analyze story status without checkpoint
Read: docs/2-MANAGEMENT/epics/current/{{EPIC_FOLDER}}/{{STORY_FILE}}
      apps/frontend/ (search for related code)
      supabase/migrations/ (search for related tables)
Check:
  - Does code exist? (services, API routes, components)
  - Do tests exist?
  - Is it deployed/working?
Exit: CREATE checkpoint file with findings

Output to .claude/checkpoints/{{STORY_ID}}.yaml:
---
# Story {{STORY_ID}} - {{STORY_NAME}}
# Type: {{backend|frontend|fullstack}}
# Epic: {{EPIC_ID}}
# Audit Date: {{DATE}}

audit:
  code_exists: true|false
  files_found:
    - path: "..."
      type: service|api|component|migration
  tests_exist: true|false
  test_files:
    - path: "..."
      count: N
  estimated_completion: 0-100%

status: DONE|PARTIAL|NOT_STARTED|BLOCKED

recommendation: |
  {{what needs to be done}}

next_phase: P1|P2|P3|P4|P5|P6|P7|NONE
---
```

---

## 🎯 EXECUTION FLOW

```
ORCHESTRATOR
    │
    ├─► [1] Read all checkpoints (self)
    ├─► [2] Build status table (self)
    ├─► [3] Group stories by action type
    │
    ├─► [4] PARALLEL WAVE 1 (max 4 agents)
    │       ├─► Explore: audit XX.1 (missing checkpoint)
    │       ├─► Explore: audit XX.2 (missing checkpoint)
    │       ├─► Explore: audit XX.3 (missing checkpoint)
    │       └─► Explore: audit XX.4 (missing checkpoint)
    │
    ├─► [5] PARALLEL WAVE 2 (max 4 agents)
    │       ├─► qa-agent: XX.5 P6 → tech-writer P7
    │       ├─► qa-agent: XX.6 P6 → tech-writer P7
    │       ├─► backend-dev: XX.7 P3-FIX
    │       └─► backend-dev: XX.8 P3-FIX
    │
    └─► [6] Final summary to PROJECT-STATE.md
```

---

## 📁 CHECKPOINT FORMAT (For Missing Stories)

**.claude/checkpoints/{{STORY_ID}}.yaml**
```yaml
# Story {{STORY_ID}} - {{STORY_NAME}}
# Type: {{type}}
# Epic: {{EPIC_ID}}
# Created: {{DATE}} by orchestrator-audit

audit_result:
  story_file: docs/2-MANAGEMENT/epics/current/{{EPIC_FOLDER}}/{{FILE}}
  code_status:
    services: [list of found service files]
    api_routes: [list of found API routes]
    components: [list of found components]
    migrations: [list of found migrations]
  test_status:
    unit_tests: N files, M tests
    integration_tests: N files, M tests
    passing: X/Y
  completion_estimate: N%

status: NOT_STARTED | PARTIAL | BLOCKED | NEEDS_REVIEW | DONE

blockers:
  - "blocker description if any"

next_action:
  phase: P1 | P2 | P3 | P4 | P5 | P6 | P7
  agent: ux-designer | test-writer | backend-dev | frontend-dev | senior-dev | code-reviewer | qa-agent | tech-writer
  reason: "why this phase is next"
```

---

## 🎯 CRITICAL RULES

1. **Max 4 parallel agents** - never spawn more
2. **Always write to checkpoint** - every finding goes to `.claude/checkpoints/`
3. **Explore agent for audits** - read-only, creates checkpoint files
4. **Sequential phases per story** - P1→P2→P3→P4→P5→P6→P7
5. **Orchestrator doesn't code** - only reads, routes, delegates
6. **Check context** - if running low, /compact or close agent before spawning new

---

## 📋 QUICK START

**Copy this, replace {{variables}}, paste to agent:**

```
# EPIC AUDIT: {{EPIC_ID}}

Epic: {{EPIC_ID}}
Folder: {{EPIC_FOLDER}}
Prefix: {{PREFIX}}
Mode: AUDIT

## Instructions
1. Read all checkpoints: .claude/checkpoints/{{PREFIX}}*.yaml
2. List all stories: docs/2-MANAGEMENT/epics/current/{{EPIC_FOLDER}}/
3. Build status table
4. For stories WITHOUT checkpoints: spawn Explore agents (max 4 parallel)
5. Each Explore agent creates checkpoint file with audit findings
6. Output final summary

## Output Required
- Status table (all stories)
- New checkpoint files created
- Recommendation for next actions
```

---

## 📋 EXAMPLES

### Example: Audit Epic 04 (Production)
```
# EPIC AUDIT: 04-production

Epic: 04-production
Folder: 04-production
Prefix: 04.
Mode: AUDIT

## Instructions
1. Read all checkpoints: .claude/checkpoints/04.*.yaml
2. List all stories: docs/2-MANAGEMENT/epics/current/04-production/
3. Build status table
4. For stories WITHOUT checkpoints: spawn Explore agents (max 4 parallel)
5. Each Explore agent creates checkpoint file with audit findings
6. Output final summary
```

### Example: Complete Epic 03 (Planning)
```
# EPIC COMPLETION: 03-planning

Epic: 03-planning
Folder: 03-planning
Prefix: 03.
Mode: COMPLETE

## Instructions
1. Read all checkpoints: .claude/checkpoints/03.*.yaml
2. Identify stories stuck at P5/P6 (need completion)
3. Spawn qa-agent + tech-writer for each (max 4 parallel)
4. For BLOCKED stories: spawn backend-dev/frontend-dev to fix
5. Update PROJECT-STATE.md with results
```

---

**START. NO QUESTIONS. AUDIT IMMEDIATELY.**
