# Scope Review: Epic {N}

> **Data:** {DATA}
> **Reviewer:** PRODUCT-OWNER (Elena)
> **PRD:** @docs/1-BASELINE/product/prd.md
> **Epic:** @docs/2-MANAGEMENT/epics/epic-{N}-{nazwa}.md

---

## Podsumowanie Decyzji

```
STATUS: {APPROVED | APPROVED WITH NOTES | NEEDS REVISION}
```

| Metryka | Wartość |
|---------|---------|
| PRD Requirements | {X} |
| Pokryte w stories | {Y} |
| **Pokrycie PRD** | **{Y/X * 100}%** |
| Scope creep items | {N} |
| INVEST failures | {M} |
| Weak AC | {K} |

---

## 1. PRD Coverage Matrix

### Wymagania Funkcjonalne

| FR ID | Opis | Story | Pokrycie | Uwagi |
|-------|------|-------|----------|-------|
| FR-01 | {opis} | 1.1, 1.2 | ✅ Full | |
| FR-02 | {opis} | 1.3 | ⚠️ Partial | Brak error handling |
| FR-03 | {opis} | — | ❌ Missing | **BLOCKER** |

### Wymagania Niefunkcjonalne

| NFR ID | Opis | Gdzie adresowane | Status |
|--------|------|------------------|--------|
| NFR-01 | {performance} | Story 2.1 AC | ✅ |
| NFR-02 | {security} | ADR-002 | ✅ |
| NFR-03 | {scalability} | — | ⚠️ |

### Brakujące Wymagania

| ID | Wymaganie | Priorytet w PRD | Akcja |
|----|-----------|-----------------|-------|
| FR-03 | {opis} | Must Have | Dodać story |
| NFR-03 | {opis} | Should Have | Rozważyć w Fazie 2 |

---

## 2. Scope Creep Detection

### Elementy spoza PRD

| Story | Element | W PRD? | Decyzja |
|-------|---------|--------|---------|
| 2.3 | Export do PDF | ❌ Nie | 🔴 Usunąć |
| 3.1 | Dark mode | ❌ Nie | 🟡 Przenieść do backlog |
| 1.4 | Audit logging | ⚠️ Implicit | 🟢 OK (security) |

### Rekomendacje

| Element | Rekomendacja | Uzasadnienie |
|---------|--------------|--------------|
| Export do PDF | Usunąć z MVP | Nie w PRD, nie blokuje |
| Dark mode | Backlog | Nice-to-have |

---

## 3. INVEST Compliance

### Story-by-Story Review

#### Story {N}.1: {tytuł}

| Kryterium | Status | Uwagi |
|-----------|--------|-------|
| **I**ndependent | ✅ | Brak zależności |
| **N**egotiable | ✅ | Implementacja elastyczna |
| **V**aluable | ✅ | Jasna wartość dla usera |
| **E**stimable | ✅ | Zespół może oszacować |
| **S**mall | ✅ | 1-2 sesje |
| **T**estable | ⚠️ | AC #3 zbyt ogólne |

**Verdict:** ⚠️ PASS WITH NOTES

#### Story {N}.2: {tytuł}

| Kryterium | Status | Uwagi |
|-----------|--------|-------|
| **I**ndependent | ❌ | Circular dep z {N}.3 |
| **N**egotiable | ✅ | |
| **V**aluable | ❌ | Tylko wartość techniczna |
| **E**stimable | ✅ | |
| **S**mall | ❌ | 10+ AC, zbyt duże |
| **T**estable | ✅ | |

**Verdict:** ❌ NEEDS REVISION

---

## 4. Acceptance Criteria Quality

### Red Flags Found

| Story | AC # | Problem | Przykład | Fix |
|-------|------|---------|----------|-----|
| 1.1 | 3 | Vague | "działa poprawnie" | Określić konkretny wynik |
| 2.1 | 1 | Missing error | Brak obsługi błędu | Dodać Given invalid... |
| 2.3 | 2 | Untestable | "szybko się ładuje" | Dodać metrykę (<200ms) |

### AC Rewrite Suggestions

**Story 1.1, AC #3:**
```diff
- System działa poprawnie
+ Given valid input, When user submits, Then success message "Saved" displays within 2s
```

**Story 2.1, AC #1:**
```diff
- User can create order
+ Given user is logged in, When user creates order with valid data, Then order is saved with status DRAFT
+ Given user is logged in, When user creates order with invalid data, Then error message displays
```

---

## 5. Dependencies Review

### Dependency Map

```
Story 1.1 ──────► Story 1.2 ──────► Story 1.3
                     │
                     ▼
                 Story 2.1 ◄────── Story 2.2
                                       │
                                       ▼
                                   Story 3.1
```

### Problemy z Zależnościami

| Problem | Stories | Rozwiązanie |
|---------|---------|-------------|
| Circular dependency | 2.1 ↔ 2.3 | Wydzielić shared component |
| Missing dependency | 3.1 → ??? | Dodać dependency na 2.1 |

---

## 6. Priority Alignment

### MoSCoW Check

| Story | Priorytet Story | Requirement Priority | Aligned? |
|-------|-----------------|---------------------|----------|
| 1.1 | Must | FR-01 (Must) | ✅ |
| 2.3 | Must | FR-05 (Should) | ⚠️ Over-prioritized |
| 3.1 | Could | FR-02 (Must) | ❌ Under-prioritized |

### Priority Adjustments Needed

| Story | Current | Recommended | Reason |
|-------|---------|-------------|--------|
| 2.3 | Must | Should | FR-05 is Should Have |
| 3.1 | Could | Must | Implements Must Have FR-02 |

---

## Decyzja Końcowa

### ✅ APPROVED

Wszystkie kryteria spełnione:
- [ ] 100% PRD coverage
- [ ] Zero scope creep (lub uzasadnione)
- [ ] All stories pass INVEST
- [ ] All AC testable
- [ ] No circular dependencies

### ⚠️ APPROVED WITH NOTES

Drobne problemy do monitorowania:
- {Problem 1}
- {Problem 2}

### ❌ NEEDS REVISION

Wymagane zmiany przed akceptacją:

| # | Zmiana | Owner | Deadline |
|---|--------|-------|----------|
| 1 | {zmiana} | ARCHITECT | {data} |
| 2 | {zmiana} | ARCHITECT | {data} |

---

**Handoff do:**
- SCRUM-MASTER (jeśli APPROVED)
- ARCHITECT-AGENT (jeśli NEEDS REVISION)
