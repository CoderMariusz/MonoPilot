# Epic Dependency Graph: {PROJECT_NAME}

> **Źródło:** @docs/2-MANAGEMENT/epics/epic-catalog.md
> **Autor:** ARCHITECT-AGENT
> **Data:** {DATA}
> **Wersja:** 1.0

---

## Visual Dependency Map

```
                                    ┌─────────────┐
                                    │  EPIC-001   │
                                    │ {tytuł}     │
                                    │ [Must, L]   │
                                    └──────┬──────┘
                                           │
                       ┌───────────────────┼───────────────────┐
                       │                   │                   │
                       ▼                   ▼                   ▼
               ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
               │  EPIC-002   │     │  EPIC-003   │     │  EPIC-005   │
               │ {tytuł}     │     │ {tytuł}     │     │ {tytuł}     │
               │ [Must, M]   │     │ [Should, M] │     │ [Could, S]  │
               └──────┬──────┘     └─────────────┘     └─────────────┘
                      │
                      ▼
               ┌─────────────┐
               │  EPIC-004   │
               │ {tytuł}     │
               │ [Should, L] │
               └─────────────┘

Legenda:
───────►  BLOCKS (musi być przed)
- - - -►  ENHANCES (lepiej działa z, ale nie wymaga)
════════  CONFLICTS (nie mogą być równolegle)
```

---

## Dependency Matrix

|  | EPIC-001 | EPIC-002 | EPIC-003 | EPIC-004 | EPIC-005 |
|--|----------|----------|----------|----------|----------|
| **EPIC-001** | - | BLOCKS | BLOCKS | - | BLOCKS |
| **EPIC-002** | - | - | - | BLOCKS | - |
| **EPIC-003** | - | - | - | ENHANCES | - |
| **EPIC-004** | - | - | - | - | - |
| **EPIC-005** | - | - | - | - | - |

**Jak czytać:** Wiersz BLOCKS kolumna (EPIC-001 BLOCKS EPIC-002)

---

## Dependency Details

### EPIC-001 → EPIC-002

| Atrybut | Wartość |
|---------|---------|
| **Typ** | BLOCKS |
| **Siła** | Hard (absolutnie wymagane) |
| **Powód** | {dlaczego ta zależność istnieje} |

**Co musi być gotowe z EPIC-001:**
- [ ] {komponent/feature 1}
- [ ] {komponent/feature 2}
- [ ] {API/interface}

**Implikacje:**
- EPIC-002 nie może rozpocząć się przed ukończeniem EPIC-001
- Opóźnienie EPIC-001 opóźnia cały łańcuch

---

### EPIC-001 → EPIC-003

| Atrybut | Wartość |
|---------|---------|
| **Typ** | BLOCKS |
| **Siła** | Hard |
| **Powód** | {powód} |

**Co musi być gotowe:**
- [ ] {element}

---

### EPIC-002 → EPIC-004

| Atrybut | Wartość |
|---------|---------|
| **Typ** | BLOCKS |
| **Siła** | Hard |
| **Powód** | {powód} |

**Co musi być gotowe:**
- [ ] {element}

---

### EPIC-003 → EPIC-004

| Atrybut | Wartość |
|---------|---------|
| **Typ** | ENHANCES |
| **Siła** | Soft (polepsza, ale nie blokuje) |
| **Powód** | {powód} |

**Korzyści z sekwencji:**
- {korzyść 1}
- {korzyść 2}

**Alternatywa bez EPIC-003:**
- {co można zrobić bez tej zależności}

---

## Critical Path Analysis

### Primary Critical Path

```
EPIC-001 ──► EPIC-002 ──► EPIC-004
   L            M            L
   │            │            │
   ▼            ▼            ▼
 ~5 stories   ~4 stories   ~6 stories
```

**Total Stories on Critical Path:** ~15
**Estimated Duration:** {X} sprints

### Bottlenecks

| Epic | Blocked By | Blocks | Risk Level |
|------|-----------|--------|------------|
| EPIC-001 | None | 3 epics | 🔴 High |
| EPIC-002 | EPIC-001 | 1 epic | 🟡 Medium |
| EPIC-004 | EPIC-002 | None | 🟢 Low |

**Rekomendacje:**
1. **EPIC-001 jest krytyczny** - każde opóźnienie wpływa na 3 inne epiki
2. Rozważ rozbicie EPIC-001 na mniejsze części
3. Zidentyfikuj co z EPIC-001 może być dostarczone wcześniej

---

## Parallel Execution Opportunities

### Możliwe równoległe prace

| Grupa | Epiki | Warunek |
|-------|-------|---------|
| After EPIC-001 | EPIC-002, EPIC-003 | EPIC-001 complete |
| Independent | EPIC-005 | Anytime |

### Diagram równoległości

```
Sprint 1-2:     [═══════ EPIC-001 ═══════]

Sprint 3-4:     [═══ EPIC-002 ═══]  [═══ EPIC-003 ═══]

Sprint 5-6:                        [═══════ EPIC-004 ═══════]

Anytime:        [═══════════════ EPIC-005 ═══════════════]
                         (może być dowolnie)
```

---

## Dependency Types Reference

### BLOCKS (Hard Dependency)

```
A ──────► B
```

- B **nie może** rozpocząć się przed ukończeniem A
- Opóźnienie A = opóźnienie B
- Wymaga careful sequencing

**Przykłady:**
- Database schema przed API endpoints
- Auth system przed protected features
- Core library przed dependent modules

### ENHANCES (Soft Dependency)

```
A - - - -► B
```

- B **może** rozpocząć się bez A
- A sprawia, że B jest łatwiejsze/lepsze
- Preferowane, ale nie wymagane

**Przykłady:**
- Design system przed UI features (można użyć basic styles)
- Logging przed complex features (można dodać później)

### CONFLICTS (Mutual Exclusion)

```
A ════════ B
```

- A i B **nie mogą** być rozwijane równolegle
- Wspólne zasoby lub conflicting changes
- Wymaga explicit sequencing

**Przykłady:**
- Dwa epiki modyfikujące ten sam moduł
- Database migration conflicting changes
- Shared resource contention

---

## Circular Dependency Check

✅ **PASSED** - Brak circular dependencies

lub

❌ **FAILED** - Wykryto circular dependency:

```
EPIC-X ──► EPIC-Y ──► EPIC-Z ──► EPIC-X
```

**Rozwiązanie:**
- {jak rozwiązać circular dependency}

---

## Impact Analysis

### Jeśli EPIC-001 się opóźni

| Epic | Wpływ | Opóźnienie |
|------|-------|------------|
| EPIC-002 | Direct | +{N} sprints |
| EPIC-003 | Direct | +{N} sprints |
| EPIC-004 | Indirect | +{N} sprints |
| EPIC-005 | None | 0 |

**Total Project Impact:** +{N} sprints

### Jeśli EPIC-001 zostanie przyspieszony

- EPIC-002, EPIC-003 mogą rozpocząć wcześniej
- Potencjalny early delivery całego projektu

---

## Recommendations

### Zmniejszenie ryzyka dependency

1. **Podziel EPIC-001** na mniejsze deliverables
   - Core functionality → Release early
   - Extended features → Release later

2. **Zdefiniuj interface contracts wcześnie**
   - API contracts dla EPIC-002
   - Data schemas dla EPIC-003

3. **Rozważ feature flags**
   - Włączenie partial functionality
   - Niezależny deployment

### Optymalizacja sequencing

```
Current:    EPIC-001 → EPIC-002 → EPIC-004 (sequential)
Optimized:  EPIC-001 → [EPIC-002 || EPIC-003] → EPIC-004 (parallel where possible)
```

---

## Notes

{Dodatkowe uwagi o zależnościach}

---

## History

| Data | Zmiana | Autor |
|------|--------|-------|
| {data} | Created | ARCHITECT-AGENT |
| {data} | {zmiana} | {kto} |

---

**Następny krok:** @.claude/templates/risk-registry.md
