# WRAPPER TEST PROMPT V4 - GLM-4.7 + P3 Parallel

## Zmiany V4:
1. **P3 GREEN = 4 agentow rownolegle**:
   - P3a: Services (backend-dev)
   - P3b: Routes (backend-dev)
   - P3c: Components (frontend-dev)
   - P3d: Pages/Hooks (frontend-dev)
2. GLM-4.7 dla wszystkich P3 sub-tasks
3. max_tokens: 16000
4. Fallback: GLM -> Haiku

---

## FULL FLOW (8 faz):

```
P1 UX ──► P2 Tests ──► P3 GREEN (4 parallel) ──► P4 Refactor ──► P5 Review ──► P6 QA ──► P7 Docs
                              │
               ┌──────────────┼──────────────┐
               │              │              │
              P3a            P3b           P3c           P3d
           Services        Routes      Components    Pages/Hooks
           (GLM-4.7)      (GLM-4.7)    (GLM-4.7)     (GLM-4.7)
               │              │              │              │
               └──────────────┼──────────────┘
                              │
                         [wait all]
                              │
                              ▼
                         P4 Refactor
```

---

## MODEL ROUTING:

| Faza | Agent | Model | Fallback |
|------|-------|-------|----------|
| P1 UX | ux-designer | Claude Sonnet | Opus |
| P2 Tests | test-writer | GLM-4.7 | Haiku |
| P3a Services | backend-dev | GLM-4.7 | Haiku |
| P3b Routes | backend-dev | GLM-4.7 | Haiku |
| P3c Components | frontend-dev | GLM-4.7 | Haiku |
| P3d Pages | frontend-dev | GLM-4.7 | Haiku |
| P4 Refactor | senior-dev | GLM-4.7 | Haiku |
| P5 Review | code-reviewer | Claude Sonnet | Opus |
| P6 QA | qa-agent | Claude Sonnet | Opus |
| P7 Docs | tech-writer | GLM-4-flash | Haiku |

---

## P3 PARALLEL COMMANDS:

### Sequential (P3a first, then rest parallel):

```bash
# Krok 1: P3a Services (musi byc pierwszy - Routes od niego zaleza)
python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task implement-services \
  --story 01.2 \
  --context "apps/frontend/__tests__/01-settings/01.2.test.ts,docs/2-MANAGEMENT/epics/current/01-settings/context/01.2.context.yaml" \
  --output-json

# Krok 2: P3b + P3c + P3d PARALLEL (po zakonczeniu P3a)
# Terminal 1:
python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task implement-routes \
  --story 01.2 \
  --context "apps/frontend/__tests__/01-settings/01.2.test.ts,apps/frontend/lib/services/user-roles-service.ts" \
  --output-json

# Terminal 2:
python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task implement-components \
  --story 01.2 \
  --context "apps/frontend/__tests__/01-settings/01.2.test.ts,.experiments/claude-glm-test/outputs/01.2/p1-ux.md" \
  --output-json

# Terminal 3:
python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task implement-pages \
  --story 01.2 \
  --context "apps/frontend/__tests__/01-settings/01.2.test.ts,.experiments/claude-glm-test/outputs/01.2/p1-ux.md" \
  --output-json
```

### All Parallel (bash background):

```bash
cd "C:/Users/Mariusz K/Documents/Programowanie/MonoPilot"

# P3a first (dependency)
python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task implement-services --story 01.2 \
  --context "tests/01.2.test.ts,context/01.2.yaml" \
  --output-json > .experiments/claude-glm-test/outputs/01.2/p3a.json

# Then parallel
python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task implement-routes --story 01.2 \
  --context "tests/01.2.test.ts,services/01.2-service.ts" \
  --output-json > .experiments/claude-glm-test/outputs/01.2/p3b.json &

python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task implement-components --story 01.2 \
  --context "tests/01.2.test.ts,ux/01.2-ux.md" \
  --output-json > .experiments/claude-glm-test/outputs/01.2/p3c.json &

python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task implement-pages --story 01.2 \
  --context "tests/01.2.test.ts,ux/01.2-ux.md" \
  --output-json > .experiments/claude-glm-test/outputs/01.2/p3d.json &

wait
echo "P3 complete!"
```

---

## FILE RESPONSIBILITIES:

### P3a: Services
```
apps/frontend/lib/services/user-roles-service.ts
apps/frontend/lib/types/user-roles.ts
apps/frontend/lib/validation/user-roles-schema.ts
```

### P3b: Routes
```
apps/frontend/app/api/settings/user-roles/route.ts
apps/frontend/app/api/settings/user-roles/[id]/route.ts
```

### P3c: Components
```
apps/frontend/components/settings/UserRolesTable.tsx
apps/frontend/components/settings/UserRoleForm.tsx
apps/frontend/components/settings/UserRoleModal.tsx
```

### P3d: Pages/Hooks
```
apps/frontend/app/(authenticated)/settings/user-roles/page.tsx
apps/frontend/lib/hooks/use-user-roles.ts
```

---

## FULL FLOW COMMANDS:

### P1: UX Design (Claude)
```
Task tool: subagent_type="ux-designer"
```

### P2: Tests RED (GLM-4.7)
```bash
python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task write-tests --story 01.2 \
  --context "context/01.2.yaml" --output-json
```

### P3: GREEN (4 parallel - see above)

### P4: Refactor (GLM-4.7)
```bash
python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task refactor --story 01.2 \
  --context "all-p3-files.ts" --output-json
```

### P5: Code Review (Claude)
```
Task tool: subagent_type="code-reviewer"
```

### P6: QA (Claude)
```
Task tool: subagent_type="qa-agent"
```

### P7: Docs (GLM-4-flash)
```bash
python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task document --story 01.2 \
  --context "all-implementation-files" --output-json
```

---

## TIMING ESTIMATE:

| Phase | Sequential | Parallel |
|-------|------------|----------|
| P3 (all) | ~180s | ~75s |
| Full flow | ~420s | ~315s |

**Speedup: ~25% faster**

---

## START:

1. Utworz folder outputs: `mkdir -p .experiments/claude-glm-test/outputs/01.2`
2. Zacznij od P1 UX
3. Po P2 uruchom P3 parallel
4. Kontynuuj P4-P7

Powiedz **"START"** zeby rozpoczac!
