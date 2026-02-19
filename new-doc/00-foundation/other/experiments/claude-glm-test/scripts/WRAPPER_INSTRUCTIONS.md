# GLM Wrapper - Instrukcje dla Agentów

## Jak używać GLM Wrapper w agentach

### Backend-dev / Frontend-dev (P3 - Implementation)

W swoim promptcie, **zamiast** samodzielnie pisać kod:

```bash
# Wywołaj wrapper:
python .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task implement \
  --story 01.2 \
  --context "docs/2-MANAGEMENT/epics/current/01-settings/01.2.*.md,apps/frontend/__tests__/01-settings/01.2*.test.ts" \
  --output-json > /tmp/glm_result.json

# Parsuj wynik:
files=$(cat /tmp/glm_result.json | jq -r '.data.files')

# Zapisz pliki używając Write():
# (agent używa Write() dla każdego pliku z GLM response)
```

### Test-writer (P2 - Write Tests)

```bash
python .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task write-tests \
  --story 01.2 \
  --context "docs/2-MANAGEMENT/epics/current/01-settings/01.2.*.md,docs/3-ARCHITECTURE/ux/wireframes/SET-*.md" \
  --output-json > /tmp/glm_tests.json
```

### Tech-writer (P7 - Documentation)

```bash
python .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --task document \
  --story 01.2 \
  --context "apps/frontend/components/settings/*.tsx,apps/frontend/app/(authenticated)/settings/*.tsx" \
  --output-json > /tmp/glm_docs.json
```

## Response Format

GLM wrapper zwraca JSON:

```json
{
  "success": true,
  "data": {
    "files": [
      {
        "path": "apps/frontend/__tests__/01-settings/01.2.test.ts",
        "content": "import { describe, it, expect } from 'vitest'..."
      }
    ],
    "summary": "Created 5 test files with 47 test cases"
  },
  "tokens": 8542,
  "model": "glm-4-plus"
}
```

## Agent Workflow

1. **Czytasz** testy/wireframy/story
2. **Wywołujesz** GLM wrapper
3. **Parsuj** JSON response
4. **Zapisujesz** pliki używając Write() tool
5. **Raport** do orchestratora

## Token Tracking

Wrapper loguje do stderr:
```
[GLM WRAPPER] Task: implement | Story: 01.2 | Model: glm-4-plus
[GLM WRAPPER] Context files: 3
[DEBUG] Calling glm-4-plus with 12450 chars prompt
[DEBUG] Response status: 200
  Tokens: 8542
```

Te logi są monitorowane przez `track_tokens.py` dla savings report.
