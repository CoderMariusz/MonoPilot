# ORCHESTRATOR - Hybrid GLM/Claude

## TARGET
```yaml
Epic: {{EPIC_ID}} {{EPIC_NAME}} 3-planning 04-production
Stories: {{STORY_IDS}} 03.13 04.6a
Mode: Hybrid (Claude Agents + GLM Implementation)
```

## 7-PHASE FLOW

| Phase | Agent | Method | Model | Skip When |
|-------|-------|--------|-------|-----------|
| P1 | ux-designer | Task tool | Claude | Backend-only |
| P2 | test-writer | glm_wrapper.py | GLM-4.7 | Never |
| P3a | backend-dev (services) | glm_wrapper.py | GLM-4.7 | Frontend-only |
| P3b | backend-dev (routes) | glm_wrapper.py | GLM-4.7 | Frontend-only |
| P3c | frontend-dev (components) | glm_wrapper.py | GLM-4.7 | Backend-only |
| P3d | frontend-dev (pages) | glm_wrapper.py | GLM-4.7 | Backend-only |
| P4 | senior-dev | glm_wrapper.py | GLM-4.7 | Clean code |
| P5 | code-reviewer | Task tool | Claude | Never |
| P6 | qa-agent | Task tool | Claude | Never |
| P7 | tech-writer | glm_wrapper.py | GLM-4-flash | Never |

**Claude = Quality Gates (P1, P5, P6) | GLM = Implementation (P2, P3, P4, P7)**

## PARALLEL RULES

```yaml
Parallel OK:
  - Independent stories (different modules)
  - P3: backend (a,b) + frontend (c,d) same story
  - P5/P6: different stories
  - Max 4 parallel agents

Sequential ONLY:
  - Same story: P1→P2→P3→P4→P5→P6→P7
  - Failed phase: fix → re-run → continue
```

## CHECKPOINT SYSTEM

**Location:** `.claude/checkpoints/{STORY_ID}.yaml`

**Format:**
```yaml
P1: ✓ ux-designer 14:23 wireframes:3
P2: ✓ test-writer 14:45 tests:12 files:3
P3: ✓ backend-dev 15:20 files:5 tests:12/12
P5: ✗ code-reviewer issues:3 decision:request_changes
```

**Flow:**
```
P1✓ → P2
P2✓ → P3a → wait → P3b,c,d parallel
P3✓ → P4 OR skip to P5
P4✓ → P5
P5✓ approved → P6
P5✗ rejected → P3 (fix)
P6✓ pass → P7
P6✗ fail → P3 (fix)
P7✓ → DONE
```

## GLM WRAPPER COMMANDS

### P2: Tests (test-writer role)
```bash
python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task write-tests --story {STORY_ID} \
  --context "docs/2-MANAGEMENT/epics/current/{EPIC}/context/{STORY_ID}.context.yaml" \
  --output-json
```

### P3a: Services (backend-dev role)
```bash
python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task implement-services --story {STORY_ID} \
  --context "{test_files},{context_yaml}" \
  --output-json
```

### P3b: Routes (backend-dev role)
```bash
python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task implement-routes --story {STORY_ID} \
  --context "{test_files},{service_files}" \
  --output-json
```

### P3c: Components (frontend-dev role)
```bash
python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task implement-components --story {STORY_ID} \
  --context "{test_files},{ux_wireframes}" \
  --output-json
```

### P3d: Pages/Hooks (frontend-dev role)
```bash
python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task implement-pages --story {STORY_ID} \
  --context "{test_files},{ux_wireframes}" \
  --output-json
```

### P4: Refactor (senior-dev role)
```bash
python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task refactor --story {STORY_ID} \
  --context "{all_implementation_files}" \
  --output-json
```

### P7: Documentation (tech-writer role)
```bash
python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task document --story {STORY_ID} \
  --context "{all_implementation_files}" \
  --output-json
```

## CLAUDE TASK DELEGATION

### P1: UX Design
```
Task(ux-designer): {STORY_ID} P1
Do: Create wireframes from context.yaml
Read: docs/2-MANAGEMENT/epics/current/{EPIC}/context/{STORY_ID}.context.yaml
Exit: wireframes created, checkpoint updated
```

### P5: Code Review
```
Task(code-reviewer): {STORY_ID} P5
Do: Review implementation against acceptance criteria
Read: .claude/checkpoints/{STORY_ID}.yaml, implementation files
Exit: APPROVE or REQUEST_CHANGES with specific issues
```

### P6: QA Validation
```
Task(qa-agent): {STORY_ID} P6
Do: Run tests, validate acceptance criteria
Read: .claude/checkpoints/{STORY_ID}.yaml, test results
Exit: PASS or FAIL with reproduction steps
```

## CRITICAL RULES

1. **Read checkpoints ONLY** - Orchestrator never reads full context
2. **Claude for quality gates** - P1, P5, P6 MUST use Task tool
3. **GLM for implementation** - P2, P3, P4, P7 use wrapper
4. **Parse GLM JSON output** - Write files from response
5. **Run tests after P3** - `pnpm test` before P4
6. **Max 4 parallel agents**
7. **Phase skip = orchestrator decision** (agents don't skip)
8. **Micro-handoff ≤150 tokens** from agents to orchestrator

## START

```
Execute Epic {{EPIC_ID}}.
Stories: {{STORY_IDS}}
Start from: P1

For GLM phases (P2, P3, P4, P7):
- Run glm_wrapper.py via Bash
- Parse JSON output
- Write files to codebase
- Update checkpoint

For Claude phases (P1, P5, P6):
- Use Task tool with agent type
- Wait for completion
- Read checkpoint for result

BEGIN. DELEGATE IMMEDIATELY.
```
