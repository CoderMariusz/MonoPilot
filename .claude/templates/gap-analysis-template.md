# Gap Analysis: {ZAKRES}

> **Data:** {DATA}
> **Analityk:** DOC-AUDITOR (Viktor)
> **Porównanie:** {PRD vs Architecture | Architecture vs Stories | Stories vs Implementation}

---

## Podsumowanie

| Metryka | Wartość |
|---------|---------|
| Wymagań w źródle | {X} |
| Pokrytych w celu | {Y} |
| **Pokrycie** | **{Y/X * 100}%** |
| Luk krytycznych | {N} |
| Luk niekrytycznych | {M} |

```
POKRYCIE: {XX}%
████████████████░░░░░░░░░░░░░░░░

🟢 Pokryte: {Y}
🔴 Brakujące: {X-Y}
```

---

## Macierz Pokrycia

### Wymagania Funkcjonalne (FR)

| ID | Wymaganie | Pokryte w | Status | Uwagi |
|----|-----------|-----------|--------|-------|
| FR-01 | {opis} | Story 1.1, 1.2 | ✅ Full | |
| FR-02 | {opis} | Story 1.3 | ⚠️ Partial | Brak edge cases |
| FR-03 | {opis} | — | ❌ Gap | CRITICAL |
| FR-04 | {opis} | Story 2.1 | ✅ Full | |

### Wymagania Niefunkcjonalne (NFR)

| ID | Wymaganie | Pokryte w | Status | Uwagi |
|----|-----------|-----------|--------|-------|
| NFR-01 | {performance} | ADR-003 | ✅ Full | |
| NFR-02 | {security} | — | ❌ Gap | Wymaga ADR |
| NFR-03 | {scalability} | Architecture | ⚠️ Partial | Brak testów |

---

## Zidentyfikowane Luki

### 🔴 Luki Krytyczne

| # | Źródło | Brakujący element | Wpływ | Rekomendacja |
|---|--------|-------------------|-------|--------------|
| G1 | FR-03 | Brak story implementującej | MVP nie kompletne | Utworzyć story |
| G2 | NFR-02 | Brak strategii security | Ryzyko bezpieczeństwa | Utworzyć ADR |

### 🟡 Luki Niekrytyczne

| # | Źródło | Brakujący element | Wpływ | Rekomendacja |
|---|--------|-------------------|-------|--------------|
| G3 | FR-02 | Częściowe pokrycie edge cases | Możliwe bugi | Rozszerzyć AC |
| G4 | NFR-03 | Brak testów wydajnościowych | Nieznana wydajność | Zaplanować testy |

---

## Nadmiarowe Elementy (Scope Creep)

| # | Element | Gdzie znalezione | Czy w źródle? | Rekomendacja |
|---|---------|------------------|---------------|--------------|
| E1 | {feature X} | Story 3.4 | ❌ Nie | Usunąć lub dodać do PRD |
| E2 | {feature Y} | Architecture | ❌ Nie | Potwierdzić z PO |

---

## Plan Zamknięcia Luk

### Priorytet 1 (przed MVP)

| Luka | Akcja | Owner | Estymacja |
|------|-------|-------|-----------|
| G1 | Utworzyć story dla FR-03 | ARCHITECT | S |
| G2 | Napisać ADR dla security | ARCHITECT | M |

### Priorytet 2 (przed release)

| Luka | Akcja | Owner | Estymacja |
|------|-------|-------|-----------|
| G3 | Rozszerzyć AC w story | PO | S |
| G4 | Zaplanować testy perf | QA | M |

### Priorytet 3 (backlog)

| Luka | Akcja | Owner |
|------|-------|-------|
| {luka} | {akcja} | {owner} |

---

## Appendix: Pełna Macierz Śledzenia

```
PRD Requirements → Architecture → Stories → Tests

FR-01 → Auth Module → 1.1, 1.2 → auth.test.ts ✅
FR-02 → API Gateway → 1.3 → api.test.ts ⚠️ (partial)
FR-03 → ??? → ??? → ??? ❌ GAP
...
```

---

**Handoff do:** ARCHITECT-AGENT (zamknięcie luk) | PM-AGENT (scope creep)
