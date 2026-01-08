# ORCHESTRATOR - GLM Hybrid (Subscription Mode)

## TARGET
```yaml
Epic: {{EPIC_ID}}
Stories: {{STORY_IDS}}
Mode: Subscription + GLM Wrapper
```

## ROUTING

| Phase | Method | Model |
|-------|--------|-------|
| P1 UX | Task(ux-designer) | Claude (subscription) |
| P2 Tests | glm_wrapper.py | GLM-4.7 |
| P3a Services | glm_wrapper.py | GLM-4.7 |
| P3b Routes | glm_wrapper.py | GLM-4.7 |
| P3c Components | glm_wrapper.py | GLM-4.7 |
| P3d Pages | glm_wrapper.py | GLM-4.7 |
| P4 Refactor | glm_wrapper.py | GLM-4.7 |
| P5 Review | Task(code-reviewer) | Claude (subscription) |
| P6 QA | Task(qa-agent) | Claude (subscription) |
| P7 Docs | glm_wrapper.py | GLM-4-flash |

## GLM WRAPPER COMMANDS

### P2: Tests
```bash
python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task write-tests --story {STORY_ID} \
  --context "docs/2-MANAGEMENT/epics/current/{EPIC}/context/{STORY_ID}.context.yaml" \
  --output-json
```

### P3a: Services
```bash
python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task implement-services --story {STORY_ID} \
  --context "{test_files},{context_yaml}" \
  --output-json
```

### P3b: Routes
```bash
python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task implement-routes --story {STORY_ID} \
  --context "{test_files},{service_files}" \
  --output-json
```

### P3c: Components
```bash
python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task implement-components --story {STORY_ID} \
  --context "{test_files},{ux_wireframes}" \
  --output-json
```

### P3d: Pages/Hooks
```bash
python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task implement-pages --story {STORY_ID} \
  --context "{test_files},{ux_wireframes}" \
  --output-json
```

### P4: Refactor
```bash
python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task refactor --story {STORY_ID} \
  --context "{all_implementation_files}" \
  --output-json
```

### P7: Documentation
```bash
python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task document --story {STORY_ID} \
  --context "{all_implementation_files}" \
  --output-json
```

## CHECKPOINT FLOW

```
P1✓ (Claude) → P2 (GLM)
P2✓ (GLM)    → P3a (GLM) → wait → P3b,c,d parallel (GLM)
P3✓ (GLM)    → P4 (GLM) OR skip to P5
P4✓ (GLM)    → P5 (Claude)
P5✓ approved → P6 (Claude)
P5✗ rejected → P3 (GLM fix)
P6✓ pass     → P7 (GLM)
P6✗ fail     → P3 (GLM fix)
P7✓          → DONE
```

## CRITICAL RULES

1. **Claude for quality gates** - P1, P5, P6 MUST use Task tool
2. **GLM for implementation** - P2, P3, P4, P7 use wrapper
3. **Parse GLM JSON output** - Write files from response
4. **Check tests after P3** - Run `pnpm test` before P4
5. **Checkpoint tracking** - Update .claude/checkpoints/

## TOKEN SAVINGS

| Phase | Without GLM | With GLM | Savings |
|-------|-------------|----------|---------|
| P2 Tests | ~15K Claude | ~15K GLM | 100% |
| P3 Code | ~40K Claude | ~40K GLM | 100% |
| P4 Refactor | ~10K Claude | ~10K GLM | 100% |
| P7 Docs | ~8K Claude | ~8K GLM | 100% |
| **Total saved** | | | **~73K Claude tokens/story** |

## START

```
Execute Epic {EPIC_ID}.
Stories: {STORY_IDS}
Start from: P1
Mode: Subscription + GLM Wrapper

For GLM phases (P2, P3, P4, P7):
- Use Bash tool with glm_wrapper.py
- Parse JSON output
- Write files to codebase

For Claude phases (P1, P5, P6):
- Use Task tool with appropriate agent

BEGIN. DELEGATE IMMEDIATELY.
```
