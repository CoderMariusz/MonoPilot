# Przykład: Agent Prompt z GLM Wrapper

## Jak będzie wyglądał prompt dla backend-dev agenta

### PRZED (Pure Claude Haiku):

```
Execute Phase P3 (Backend Implementation) for Story 01.2.

Task:
1. Read test files from P2
2. Read wireframes from P1
3. Implement code to make ALL tests pass
4. Follow Next.js patterns, TypeScript, Supabase RLS

Output: Implementation files making tests green
```

Agent: Claude Haiku samodzielnie generuje cały kod (8K tokens)

---

### PO (Z GLM Wrapper):

```
Execute Phase P3 (Backend Implementation) for Story 01.2.

**IMPORTANT**: Use GLM-4.7 for code generation to optimize costs.

Task:
1. Read test files from P2
2. Read wireframes from P1
3. **CALL GLM WRAPPER** to generate implementation:

   bash
   python .experiments/claude-glm-test/scripts/glm_wrapper.py \
     --task implement \
     --story 01.2 \
     --context "apps/frontend/__tests__/01-settings/01.2*.test.ts" \
     --output-json > /tmp/glm_impl.json


4. Parse GLM response and write files:

   bash
   # Agent code (pseudocode):
   glm_output = parse_json("/tmp/glm_impl.json")
   for file in glm_output["data"]["files"]:
       Write(file_path=file["path"], content=file["content"])


5. Run tests to verify implementation

Output: Files written based on GLM generation
```

Agent: Claude Haiku **deleguje** do GLM (2K tokens orchestration) + GLM generuje kod (8K tokens)

---

## Token Breakdown

### Pure Claude:
```
Agent Haiku: 8,000 tokens × $0.0005 = $0.004
```

### Wrapper:
```
Agent Haiku: 2,000 tokens × $0.0005 = $0.001  (wrapper orchestration)
GLM-4.7:     8,000 tokens × $0.00014 = $0.001  (code generation)
TOTAL: $0.002 (50% savings per agent call)
```

### Full Epic (21 agent calls):
```
Pure Claude:  21 × $0.004 = $0.084
Wrapper:      21 × $0.002 = $0.042
Savings:      $0.042 (50%)
```

**PLUS moja orchestracja (bez zmian):** $3.78

**Total z wrapper:** $3.78 + $0.042 = $3.82
**vs Pure Claude:** $3.78 + $0.084 = $3.86
**Realny saving:** $0.04 (1%)

## ⚠️ **WAŻNE ODKRYCIE**

Wrapper daje **MAŁE oszczędności** (1%) bo:
- Agent Haiku już jest tani ($0.0005/K)
- GLM jest tanio ($0.00014/K) ale różnica mała
- **82% kosztu to moja orchestracja**!

**Python Orchestrator eliminuje $3.78** = **98% savings**!

---

## ✅ **REKOMENDACJA: Od razu Python Orchestrator**

Skoro wrapper daje tylko 1% savings, lepiej od razu zrobić orchestrator (90% savings).

**Czy przejść od razu do Python Orchestrator?**

Będzie prostszy (brak wrapper complexity) i **50x większe savings** ($0.04 vs $4.16).
