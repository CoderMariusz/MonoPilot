# WRAPPER TEST PROMPT - Wczytaj to w Claude Code

## Cel testu

Testujesz **GLM Wrapper** - Claude Code orchestruje, ale ciężka praca (testy, kod, docs) idzie do GLM-4.7.

**Stories**: 01.2 (User Roles), 01.6 (Permissions), 01.4 (Org Profile)

---

## ROUTING - Kto robi co:

| Faza | Agent | Model | Metoda |
|------|-------|-------|--------|
| P1 UX | ux-designer | **Claude** | Task tool |
| P2 Tests | test-writer | **GLM-4.7** | glm_wrapper.py |
| P3 Code | backend-dev | **GLM-4.7** | glm_wrapper.py |
| P4 Refactor | senior-dev | **GLM-4.7** | glm_wrapper.py |
| P5 Review | code-reviewer | **Claude** | Task tool |
| P6 QA | qa-agent | **Claude** | Task tool |
| P7 Docs | tech-writer | **GLM-4.5** | glm_wrapper.py |

---

## JAK UŻYWAĆ GLM WRAPPER:

### Składnia:

```bash
python .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --agent test-writer \
  --story 01.2 \
  --context "docs/2-MANAGEMENT/epics/current/01-settings/context/01.2.context.yaml,docs/1-BASELINE/product/modules/epic-01-settings.md"
```

### Agenci dostępni:
- `test-writer` → P2 (write-tests, glm-4-plus)
- `backend-dev` → P3 (implement, glm-4-plus)
- `senior-dev` → P4 (refactor, glm-4-plus)
- `tech-writer` → P7 (document, glm-4-air)

### Output:
Wrapper zwraca JSON z plikami do zapisania:
```json
{
  "success": true,
  "data": {
    "files": [
      {"path": "apps/frontend/__tests__/...", "content": "..."}
    ],
    "summary": "Created 3 test files"
  },
  "tokens": 5200,
  "model": "glm-4-plus"
}
```

Po otrzymaniu wyniku, użyj Write tool żeby zapisać pliki.

---

## FLOW KROK PO KROKU:

### KROK 1: P1 UX Design (Claude)

Dla story 01.2:
```
Użyj Task tool:
- subagent_type: "ux-designer"
- prompt: "Design UX for Story 01.2 User Roles. Read docs/2-MANAGEMENT/epics/current/01-settings/context/01.2.context.yaml"
```

Zapisz wynik do: `.experiments/claude-glm-test/outputs/01.2/p1-ux.md`

### KROK 2: P2 Tests RED (GLM via Wrapper)

```bash
python .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --agent test-writer \
  --story 01.2 \
  --context "docs/2-MANAGEMENT/epics/current/01-settings/context/01.2.context.yaml,.experiments/claude-glm-test/outputs/01.2/p1-ux.md" \
  --output-json
```

Zapisz pliki z response do odpowiednich lokalizacji.

### KROK 3: P3 Code GREEN (GLM via Wrapper)

```bash
python .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --agent backend-dev \
  --story 01.2 \
  --context "apps/frontend/__tests__/01-settings/01.2.test.ts,docs/2-MANAGEMENT/epics/current/01-settings/context/01.2.context.yaml" \
  --output-json
```

### KROK 4: P4 Refactor (GLM via Wrapper)

```bash
python .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --agent senior-dev \
  --story 01.2 \
  --context "apps/frontend/components/settings/UserRoles.tsx,apps/frontend/__tests__/01-settings/01.2.test.ts" \
  --output-json
```

### KROK 5: P5 Code Review (Claude)

```
Użyj Task tool:
- subagent_type: "code-reviewer"
- prompt: "Review implementation for Story 01.2. Check apps/frontend/components/settings/UserRoles.tsx"
```

Jeśli REQUEST_CHANGES → wróć do P3.

### KROK 6: P6 QA (Claude)

```
Użyj Task tool:
- subagent_type: "qa-agent"
- prompt: "QA validation for Story 01.2. Run tests, verify acceptance criteria."
```

### KROK 7: P7 Docs (GLM via Wrapper)

```bash
python .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --agent tech-writer \
  --story 01.2 \
  --context "apps/frontend/components/settings/UserRoles.tsx,docs/2-MANAGEMENT/epics/current/01-settings/context/01.2.context.yaml" \
  --output-json
```

---

## TRACKING:

Po każdej fazie zapisz do `.experiments/claude-glm-test/wrapper_test_log.md`:

```markdown
## Story 01.2

### P1 UX Design
- Model: Claude Sonnet
- Tokens: ~8,000 (estimate)
- Time: 45s
- Status: DONE

### P2 Tests RED
- Model: GLM-4-plus
- Tokens: 5,200
- Time: 32s
- Status: DONE
- Files: 3 test files created
```

---

## START:

1. Utwórz folder: `mkdir -p .experiments/claude-glm-test/outputs/01.2`
2. Zacznij od P1 dla story 01.2
3. Używaj TodoWrite do trackingu postępu
4. Po każdym kroku raportuj wyniki

Powiedz **"START"** i zaczynam od P1 UX Design dla Story 01.2.
