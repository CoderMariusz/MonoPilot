# Quick Start Guide

Szybki start testowania Claude + GLM multi-agent systemu.

## 🚀 Setup (5 minut)

### 1. Zainstaluj Python dependencies

```bash
pip install requests tiktoken
```

### 2. Zdobądź klucz API ZhipuAI

```bash
# Otwórz w przeglądarce:
https://open.bigmodel.cn/usercenter/apikeys

# Lub szybka rejestracja:
# 1. Wejdź na https://open.bigmodel.cn/
# 2. Sign up (może być przez WeChat/email)
# 3. Dashboard → API Keys → Create
# 4. Kopiuj klucz
```

### 3. Konfiguracja

```bash
cd .experiments/claude-glm-test

# Edytuj config.json - wklej swój API key:
nano config.json  # lub notepad config.json na Windows
```

```json
{
  "zhipu_api_key": "wklej_tutaj_swój_klucz"
}
```

## ✅ Test instalacji

Sprawdź czy GLM API działa:

```bash
python scripts/glm_call.py \
  --prompt "Hello, write a simple Python function that adds two numbers" \
  --model glm-4-flash
```

Jeśli zobaczysz kod funkcji - działa! ✓

## 🧪 Pierwszy test porównawczy

### Krok 1: Wybierz story do testu

Wybierz jedno story z Epic 05 Warehouse (średniej złożoności):

```bash
# Przykład: Story 05.1 - Warehouse Settings CRUD
# lub: Story 05.2 - License Plate Search
```

### Krok 2: Przygotuj pliki

```bash
cd test_scenarios/scenario_a_claude_only

# Skopiuj:
# 1. Story description → input_story.md
# 2. Testy → context_files/tests.test.ts
# 3. UX spec → context_files/wireframe.md
# 4. Patterns → context_files/patterns.md
```

**WAŻNE**: Skopiuj DOKŁADNIE TE SAME pliki do `scenario_b_claude_glm/`!

```bash
cd ../scenario_b_claude_glm

# Kopiuj te same pliki co w scenario A
cp ../scenario_a_claude_only/input_story.md .
cp -r ../scenario_a_claude_only/context_files/* context_files/
```

### Krok 3: TEST A - Claude Only

W Claude (Antigravity):

```
Zaimplementuj story z pliku:
.experiments/claude-glm-test/test_scenarios/scenario_a_claude_only/input_story.md

Użyj kontekstu z: context_files/
Zapisz wynik w: output_code.ts
```

Po zakończeniu, policz tokeny:

```bash
cd .experiments/claude-glm-test

# Input
python scripts/count_tokens.py \
  test_scenarios/scenario_a_claude_only/input_story.md \
  test_scenarios/scenario_a_claude_only/context_files/*

# Output
python scripts/count_tokens.py \
  test_scenarios/scenario_a_claude_only/output_code.ts
```

Zapisz w `metrics.json`:
```json
{
  "scenario": "claude_only",
  "total_tokens": 8500,        // suma input + output
  "claude_tokens": 8500,
  "input_tokens": 5200,
  "output_tokens": 3300,
  "cost_usd": 0.0651,         // (5200 * 3 + 3300 * 15) / 1000000
  "iterations": 2
}
```

### Krok 4: TEST B - Claude + GLM

**Faza 1: Claude projektuje prompt**

W Claude:

```
Zaprojektuj prompt dla GLM-4-Plus do implementacji story:
.experiments/claude-glm-test/test_scenarios/scenario_b_claude_glm/input_story.md

Uwzględnij cały kontekst z: context_files/
Zapisz w: claude_prompt_for_glm.md
```

Policz tokeny Claude (planning):
```bash
python scripts/count_tokens.py \
  test_scenarios/scenario_b_claude_glm/claude_prompt_for_glm.md
```

**Faza 2: GLM generuje kod**

Opcja A - przez skrypt:
```bash
python scripts/glm_call.py \
  --prompt "$(cat test_scenarios/scenario_b_claude_glm/claude_prompt_for_glm.md)" \
  --model glm-4-plus \
  --output test_scenarios/scenario_b_claude_glm/glm_output_code.ts \
  --json > glm_response.json
```

Opcja B - ręcznie:
1. Wklej prompt do https://chatglm.cn/
2. Skopiuj kod do `glm_output_code.ts`

**Faza 3: Claude review**

W Claude:

```
Zrób code review kodu z GLM:
.experiments/claude-glm-test/test_scenarios/scenario_b_claude_glm/glm_output_code.ts

Względem story: input_story.md
Zapisz w: claude_review.md
```

Policz tokeny:
```bash
# Claude review phase
python scripts/count_tokens.py \
  test_scenarios/scenario_b_claude_glm/glm_output_code.ts \
  test_scenarios/scenario_b_claude_glm/claude_review.md
```

Zapisz w `metrics.json`:
```json
{
  "scenario": "claude_glm",
  "total_tokens": 12500,
  "claude_tokens": 2800,       // planning (800) + review (2000)
  "glm_tokens": 9700,
  "cost_usd": 0.0423,          // Claude + GLM
  "iterations": 2,
  "glm_iterations": 1
}
```

### Krok 5: Porównaj

```bash
python scripts/compare_results.py
```

## 📊 Interpretacja wyników

### Scenariusz SUCCESS (Claude + GLM wygrywa):

```
💰 SAVINGS (Scenario B vs A)
   Claude Tokens:   -5,700 (-67.1%)  ✓ Świetnie!
   Cost:            -$0.0228 (-35%)  ✓ Oszczędność!

🏆 WINNER: Claude + GLM
```

➡️ **Warto kontynuować**: Zbuduj automatyzację orkiestratora.

### Scenariusz FAIL (Claude Only lepszy):

```
💰 SAVINGS (Scenario B vs A)
   Claude Tokens:   -2,100 (-24.7%)  ⚠️ Mała oszczędność
   Cost:            +$0.0050 (+7.7%)  ❌ Drożej!

🏆 WINNER: Claude Only
```

➡️ **Przemyśl podział**: Może GLM tylko do prostych tasków (generowanie testów)?

## 🎯 Następne kroki

Jeśli test pozytywny:

1. **Więcej story**: Testuj na 3-5 różnych story (różne complexity)
2. **Różne modele GLM**: Porównaj glm-4-plus vs glm-4-long
3. **Automatyzacja**: Napisz orkiestrator łączący Claude + GLM
4. **Integracja**: Dodaj do MonoPilot 7-phase workflow

## 🐛 Troubleshooting

### Błąd: "ZHIPU_API_KEY not found"
```bash
# Ustaw w config.json lub export:
export ZHIPU_API_KEY="twój_klucz"
```

### Błąd: "tiktoken not installed"
```bash
pip install tiktoken
# Lub skrypt użyje prostego licznika słów * 1.3
```

### GLM zwraca błąd 401
- Sprawdź klucz API w config.json
- Sprawdź czy masz tokeny na koncie (https://open.bigmodel.cn/usercenter/apikeys)

### Wyniki nie mają sensu
- Upewnij się że oba scenariusze używają DOKŁADNIE tych samych plików kontekstowych
- Policz wszystkie iteracje (nie tylko pierwszą)

## 📚 Pełna dokumentacja

Zobacz `README.md` dla szczegółów.
