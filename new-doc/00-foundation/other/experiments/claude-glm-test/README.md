# Claude + GLM Multi-Agent Test Framework

Framework do testowania i porównywania wydajności:
- **Scenario A**: Claude Only (pełny workflow w Claude)
- **Scenario B**: Claude + GLM (Claude planuje/review, GLM pisze kod)

## 🎯 Cel

Zmierzyć:
1. **Oszczędność tokenów Claude** - czy podział zadań z GLM redukuje użycie Claude?
2. **Oszczędność kosztów** - czy tańszy GLM kompensuje dodatkową komunikację?
3. **Jakość outputu** - czy kod z GLM jest porównywalny do Claude?

## 📁 Struktura

```
.experiments/claude-glm-test/
├── test_scenarios/
│   ├── scenario_a_claude_only/
│   │   ├── input_story.md          # Story do implementacji
│   │   ├── context_files/          # Pliki kontekstowe (testy, spec)
│   │   ├── output_code.ts          # Kod wygenerowany przez Claude
│   │   └── metrics.json            # Metryki (tokeny, koszt)
│   └── scenario_b_claude_glm/
│       ├── input_story.md          # To samo story
│       ├── context_files/          # Te same pliki kontekstowe
│       ├── claude_prompt_for_glm.md # Prompt zaprojektowany przez Claude
│       ├── glm_output_code.ts      # Kod wygenerowany przez GLM
│       ├── claude_review.md        # Review Claude
│       └── metrics.json            # Metryki
├── scripts/
│   ├── glm_call.py                 # Wrapper na ZhipuAI API
│   ├── count_tokens.py             # Licznik tokenów
│   └── compare_results.py          # Porównanie wyników
├── config.json                     # API keys, ustawienia
└── README.md                       # Ten plik
```

## 🔧 Setup

### 1. Zainstaluj zależności Python

```bash
pip install requests tiktoken
```

### 2. Zdobądź klucz API ZhipuAI

1. Rejestracja: https://open.bigmodel.cn/
2. Darmowe tokeny na start: ~10M tokenów
3. Dashboard → API Keys → Create Key
4. Wklej do `config.json`:

```json
{
  "zhipu_api_key": "twój_klucz_tutaj"
}
```

### 3. Przygotuj story do testu

Wybierz story średniej złożoności z Epic 05 Warehouse (lub innego). Skopiuj:
- Story description → `input_story.md`
- Pliki kontekstowe (testy, UX spec) → `context_files/`

## 🧪 Jak przeprowadzić test

### TEST A: Claude Only

1. **Przekaż story Claude** w Antigravity:
   ```
   Zaimplementuj story z .experiments/claude-glm-test/test_scenarios/scenario_a_claude_only/input_story.md

   Kontekst w: context_files/
   Zapisz wynik w: output_code.ts
   ```

2. **Policz tokeny**:
   ```bash
   cd .experiments/claude-glm-test

   # Input tokens (story + kontekst)
   python scripts/count_tokens.py \
     test_scenarios/scenario_a_claude_only/input_story.md \
     test_scenarios/scenario_a_claude_only/context_files/*

   # Output tokens (kod)
   python scripts/count_tokens.py \
     test_scenarios/scenario_a_claude_only/output_code.ts
   ```

3. **Zapisz metryki** w `metrics.json`:
   ```json
   {
     "scenario": "claude_only",
     "total_tokens": 9300,
     "claude_tokens": 9300,
     "glm_tokens": 0,
     "input_tokens": 5800,
     "output_tokens": 3500,
     "cost_usd": 0.0699,
     "iterations": 3,
     "notes": "3 iteracje: initial + 2 poprawki"
   }
   ```

### TEST B: Claude + GLM

1. **Claude projektuje prompt**:
   ```
   Zaprojektuj prompt dla GLM-4-Plus do implementacji story:
   .experiments/claude-glm-test/test_scenarios/scenario_b_claude_glm/input_story.md

   Uwzględnij kontekst z: context_files/
   Zapisz prompt w: claude_prompt_for_glm.md
   ```

2. **Wywołaj GLM** (opcja A - ręcznie):
   - Wklej prompt do https://chatglm.cn/
   - Skopiuj odpowiedź do `glm_output_code.ts`

   **Lub** (opcja B - przez skrypt):
   ```bash
   python scripts/glm_call.py \
     --prompt "$(cat test_scenarios/scenario_b_claude_glm/claude_prompt_for_glm.md)" \
     --context test_scenarios/scenario_b_claude_glm/context_files/* \
     --model glm-4-plus \
     --output test_scenarios/scenario_b_claude_glm/glm_output_code.ts \
     --json
   ```

3. **Claude robi review**:
   ```
   Zrób code review dla kodu wygenerowanego przez GLM:
   .experiments/claude-glm-test/test_scenarios/scenario_b_claude_glm/glm_output_code.ts

   Względem spec: input_story.md
   Zapisz review w: claude_review.md
   ```

4. **Zapisz metryki** w `metrics.json`:
   ```json
   {
     "scenario": "claude_glm",
     "total_tokens": 13400,
     "claude_tokens": 2600,
     "glm_tokens": 10800,
     "claude_phases": {
       "planning": 800,
       "review": 1800
     },
     "glm_iterations": 3,
     "cost_usd": 0.0467,
     "notes": "GLM - 3 iteracje poprawek, Claude - tylko planning + review"
   }
   ```

### Porównaj wyniki

```bash
python scripts/compare_results.py
```

Output:
```
======================================================================
  SCENARIO COMPARISON: Claude Only vs Claude + GLM
======================================================================

📊 SCENARIO A: Claude Only
   Total Tokens:    9,300
   Claude Tokens:   9,300
   Cost (USD):      $0.0699
   Iterations:      3

📊 SCENARIO B: Claude + GLM
   Total Tokens:    13,400
   Claude Tokens:   2,600
   GLM Tokens:      10,800
   Cost (USD):      $0.0467
   Iterations:      3

💰 SAVINGS (Scenario B vs A)
   Claude Tokens:   -6,700 (-72.0%)
   Cost:            -$0.0232 (-33.2%)

🏆 WINNER: Claude + GLM
======================================================================
```

## 📊 Przykładowe metryki (hipotetyczne)

| Metryka | Claude Only | Claude + GLM | Savings |
|---------|-------------|--------------|---------|
| Claude Tokens | 9,300 | 2,600 | **-72%** |
| Total Tokens | 9,300 | 13,400 | +44% |
| Cost (USD) | $0.0699 | $0.0467 | **-33%** |
| Time | 5 min | 7 min | -40% |

## 🎓 Wnioski z testów

Po przeprowadzeniu testów, udokumentuj:

1. **Token Efficiency**: Czy podział z GLM faktycznie redukuje tokeny Claude?
2. **Cost Savings**: Czy niższa cena GLM kompensuje więcej total tokenów?
3. **Quality**: Czy kod z GLM wymaga więcej poprawek Claude?
4. **Speed**: Który scenariusz jest szybszy end-to-end?

## 🚀 Następne kroki

Jeśli test wyjdzie pozytywnie:

1. **Automatyzacja**: Skrypt orkiestratora łączący Claude + GLM
2. **Integracja z MonoPilot**: Dodanie GLM jako executor do 7-phase workflow
3. **Optymalizacja**: Fine-tuning podziału zadań między modele
4. **Scaling**: Test na więcej story z różnych epics

## 📝 Notatki

- GLM-4-Plus: Najlepszy balans jakości/ceny
- GLM-4-Long: Użyj gdy kontekst > 100K tokenów
- GLM-4-Flash: Dla prostych tasków (generowanie testów?)
- Claude: Zawsze do planowania, architectural decisions, QA

## 🔗 Linki

- ZhipuAI Docs: https://open.bigmodel.cn/dev/api
- GLM Pricing: https://open.bigmodel.cn/pricing
- Model Comparison: https://open.bigmodel.cn/models
