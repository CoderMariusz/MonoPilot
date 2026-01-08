# ORCHESTRATOR - Epic 06 Quality Module

## TARGET
```yaml
Epic: 06-quality
Stories: {{PASTE_STORY_IDS}}
Mode: Development Test (GLM Hybrid)
```

## 7-PHASE FLOW

| Phase | Agent | Model | Skip When |
|-------|-------|-------|-----------|
| P1 | ux-designer | Claude/GLM | Backend-only |
| P2 | test-writer | GLM-4.7 | Never |
| P3a | backend-dev (services) | GLM-4.7 | - |
| P3b | backend-dev (routes) | GLM-4.7 | - |
| P3c | frontend-dev (components) | GLM-4.7 | - |
| P3d | frontend-dev (pages) | GLM-4.7 | - |
| P4 | senior-dev | GLM-4.7 | Clean code |
| P5 | code-reviewer | Claude Sonnet | Never |
| P6 | qa-agent | Claude Sonnet | Never |
| P7 | tech-writer | GLM-4.5-Air | Never |

## CHECKPOINT SYSTEM

**Location:** `.claude/checkpoints/{STORY_ID}.yaml`

**Read → Route:**
```
P1✓ → P2 (test-writer)
P2✓ → P3a,b,c,d (parallel devs)
P3✓ → P4 (senior-dev) OR P5 (skip refactor)
P4✓ → P5 (code-reviewer)
P5✓ approved → P6 (qa-agent)
P5✗ rejected → P3 (fix)
P6✓ pass → P7 (tech-writer)
P6✗ fail → P3 (fix)
P7✓ → DONE
```

## CONTEXT PATHS

```yaml
context_base: docs/2-MANAGEMENT/epics/current/06-quality/context/
prd: docs/1-BASELINE/product/modules/epic-06-quality.md
architecture: docs/3-ARCHITECTURE/
patterns: apps/frontend/components/settings/  # Reference existing
```

## PARALLEL RULES

```yaml
✓ Parallel:
  - P3a + P3b + P3c + P3d (after P3a services done)
  - Different stories in P5, P6

✗ Sequential:
  - Same story phases
  - P3a must complete before P3b (routes need services)
```

## DELEGATION FORMAT

```
Task({agent}): {STORY_ID} P{N}
Do: {one-line objective}
Read: context/{story_id}.context.yaml
Exit: {completion condition}
```

## GLM WRAPPER (for P2, P3, P4, P7)

```bash
python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task {task_type} \
  --story {story_id} \
  --context "{context_files}" \
  --output-json
```

Task types:
- `write-tests` (P2)
- `implement-services` (P3a)
- `implement-routes` (P3b)
- `implement-components` (P3c)
- `implement-pages` (P3d)
- `refactor` (P4)
- `document` (P7)

## CRITICAL RULES

1. **Read checkpoints** - Don't re-run completed phases
2. **No reports until P7** - Agents work silently
3. **Max 4 parallel agents**
4. **Micro-handoff ≤50 tokens**
5. **GLM for implementation, Claude for review**

---

## START COMMAND

```
Execute Epic 06-quality.
Stories: {PASTE_IDS}
Start from: P1 (or resume from checkpoint)
Mode: GLM Hybrid

BEGIN. NO QUESTIONS. DELEGATE IMMEDIATELY.
```

---

## EXAMPLE USAGE

```
Execute Epic 06-quality.
Stories: 06.1, 06.2, 06.3
Start from: P1
Mode: GLM Hybrid

BEGIN. NO QUESTIONS. DELEGATE IMMEDIATELY.
```

Orchestrator will:
1. Check checkpoints for each story
2. Route to appropriate agent/phase
3. Use GLM wrapper for P2, P3, P4, P7
4. Use Claude Task for P1, P5, P6
5. Track progress in checkpoints
6. Report only at P7 completion
