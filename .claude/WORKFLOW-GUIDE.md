# Multi-Model Workflow Guide

## 🎯 Setup: 3 Okna Claude Code

### Window 1: HAIKU (Dokumentacja & Review)
```bash
# Terminal 1
cd C:\Users\Mariusz K\Documents\Programowanie\MonoPilot
# Ustaw model na Haiku w settings tego okna
```

**Używaj do:**
- `/bmad:bmm:workflows:code-review` - code review
- `/bmad:bmm:workflows:document-project` - dokumentacja
- Pisanie README, komentarzy
- Proste refactory (rename, formatting)
- Generowanie testów
- Review TypeScript errors

**Prompt template:**
```
[HAIKU MODE]
Zadanie: [opisz co ma zrobić]
Context: Minimal - użyj tylko wzorców z CLAUDE.md
Output: Konkretny kod, bez wyjaśnień
```

---

### Window 2: SONNET (Główny Development)
```bash
# Terminal 2
cd C:\Users\Mariusz K\Documents\Programowanie\MonoPilot
# Domyślny model Sonnet
```

**Używaj do:**
- Implementacja features
- API endpoints
- React components
- Database migrations (standardowe)
- Bug fixes (proste/średnie)
- CRUD operations

**Prompt template:**
```
[SONNET MODE]
Implementuj: [feature/fix]
Nie czytaj niepotrzebnych plików - pytaj o lokalizację
```

---

### Window 3: OPUS (Reserved - tylko gdy potrzeba)
```bash
# Terminal 3 (rzadko używane)
cd C:\Users\Mariusz K\Documents\Programowanie\MonoPilot
# Ustaw model na Opus tylko gdy naprawdę potrzebne
```

**Używaj TYLKO do:**
- Architektura nowych modułów
- Bardzo złożone bugi
- Performance optimization
- Security audit

**Prompt template:**
```
[OPUS MODE - COMPLEX TASK]
Problem: [szczegółowy opis]
Tried: [co już próbowałeś]
Need: [głęboka analiza/rozwiązanie]
```

---

## 📊 Decision Tree: Który Model?

```
START
  │
  ├─ Czy to dokumentacja/review/testy?
  │  └─ YES → HAIKU
  │
  ├─ Czy to standard CRUD/component/API?
  │  └─ YES → SONNET
  │
  ├─ Czy to złożony problem (>30min debugging)?
  │  └─ YES → OPUS
  │
  └─ Default → SONNET
```

---

## 💡 Pro Tips

### 1. Context Switching
Gdy przełączasz między oknami, **NIE kopiuj całego kontekstu**:

❌ BAD:
```
[Window 2 - Sonnet]
"Oto cała historia z Haiku window, proszę kontynuuj..."
[wklejasz 50k tokenów]
```

✅ GOOD:
```
[Window 2 - Sonnet]
"Haiku window napisało testy w __tests__/api/products.test.ts
Teraz zaimplementuj endpoint /api/products według testu"
```

### 2. File Handoff Pattern
```
HAIKU → Pisze test
   ↓
SONNET → Implementuje feature
   ↓
HAIKU → Code review
   ↓
SONNET → Fixuje issues
   ↓
HAIKU → Final docs update
```

### 3. BMAD Workflows - Model Override
W każdym workflow możesz dodać:
```yaml
model: haiku  # lub sonnet, opus
```

Przykład - Code review ZAWSZE na Haiku:
`.claude/commands/bmad/bmm/workflows/code-review.md`:
```markdown
---
model: haiku
---
# Code Review Workflow
...
```

---

## 📈 Tracking Savings

### Before Multi-Model:
```
100k tokens × $3/1M = $0.30
(wszystko na Sonnet)
```

### After Multi-Model:
```
30k tokens × $0.25/1M = $0.0075  (Haiku - 30%)
60k tokens × $3/1M = $0.18      (Sonnet - 60%)
10k tokens × $15/1M = $0.15     (Opus - 10%)
Total: $0.3375
```

**Wait... to jest DROŻEJ?** 🤔

NIE! Bo:
- Haiku tasks wcześniej też były na Sonnet
- Redystrybucja: 70% → Haiku, 25% → Sonnet, 5% → Opus

### Real Calculation:
```
70k tokens × $0.25/1M = $0.0175  (Haiku)
25k tokens × $3/1M = $0.075      (Sonnet)
5k tokens × $15/1M = $0.075      (Opus)
Total: $0.1675

Savings: 44% vs all-Sonnet!
```

---

## 🎬 Quick Start

1. **Otwórz 2 terminale** (zacznij od 2, dodaj 3. gdy potrzeba)
2. **Terminal 1 → Haiku** dla review/docs
3. **Terminal 2 → Sonnet** dla coding
4. **Komunikuj między nimi** poprzez file paths, nie context copy

**Example Flow:**
```bash
# Terminal 1 (Haiku)
You: "Review ostatnie zmiany w PR"
Haiku: [czyta diff, daje feedback] → zapisuje do review.md

# Terminal 2 (Sonnet)
You: "Fix issues z review.md"
Sonnet: [czyta review.md, implementuje fixes]

# Terminal 1 (Haiku)
You: "Update CHANGELOG.md z tymi zmianami"
Haiku: [update docs]
```

---

**Oszczędność: 40-60% kosztów!** 💰
