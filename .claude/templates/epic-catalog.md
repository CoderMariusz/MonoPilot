# Epic Catalog: {PROJECT_NAME}

> **Źródło:** @docs/1-BASELINE/product/prd.md
> **Autor:** ARCHITECT-AGENT
> **Data:** {DATA}
> **Wersja:** 1.0

---

## Przegląd Epików

| # | Epic | Priorytet | Complexity | Stories | Status |
|---|------|-----------|------------|---------|--------|
| 1 | {Epic-1} | Must | L | {N} | 🔵 Planning |
| 2 | {Epic-2} | Must | M | {N} | ⚪ Backlog |
| 3 | {Epic-3} | Should | M | {N} | ⚪ Backlog |
| 4 | {Epic-4} | Should | S | {N} | ⚪ Backlog |
| 5 | {Epic-5} | Could | L | {N} | ⚪ Backlog |

**Legenda statusów:**
- 🔵 Planning - w trakcie planowania
- ⚪ Backlog - w backlogu
- 🟡 In Progress - w realizacji
- 🟢 Done - ukończony
- 🔴 Blocked - zablokowany

---

## Epic 1: {Tytuł}

### Metadata

| Atrybut | Wartość |
|---------|---------|
| **ID** | EPIC-001 |
| **Priorytet** | Must / Should / Could |
| **Complexity** | S / M / L |
| **Estimated Stories** | {N} |
| **Dependencies** | {lista lub "None"} |

### Opis

{Krótki opis celu epiku i wartości biznesowej}

### Scope

**In Scope:**
- {funkcjonalność 1}
- {funkcjonalność 2}
- {funkcjonalność 3}

**Out of Scope:**
- {co NIE wchodzi}

### PRD Traceability

| PRD Requirement | Priorytet |
|-----------------|-----------|
| FR-{XX}: {nazwa} | Must |
| FR-{YY}: {nazwa} | Should |
| NFR-{ZZ}: {nazwa} | Must |

### Success Criteria

- [ ] {kryterium sukcesu 1}
- [ ] {kryterium sukcesu 2}
- [ ] {kryterium sukcesu 3}

### Technical Notes

- {uwaga techniczna 1}
- {sugerowany pattern/approach}
- {potencjalne wyzwania}

### Risks

| Ryzyko | Prob. | Impact | Mitygacja |
|--------|-------|--------|-----------|
| {ryzyko} | L/M/H | L/M/H | {plan} |

---

## Epic 2: {Tytuł}

### Metadata

| Atrybut | Wartość |
|---------|---------|
| **ID** | EPIC-002 |
| **Priorytet** | Must / Should / Could |
| **Complexity** | S / M / L |
| **Estimated Stories** | {N} |
| **Dependencies** | EPIC-001 |

### Opis

{Opis}

### Scope

**In Scope:**
- {funkcjonalność}

**Out of Scope:**
- {co nie wchodzi}

### PRD Traceability

| PRD Requirement | Priorytet |
|-----------------|-----------|
| FR-{XX} | {priorytet} |

### Success Criteria

- [ ] {kryterium}

### Technical Notes

- {uwaga}

### Risks

| Ryzyko | Prob. | Impact | Mitygacja |
|--------|-------|--------|-----------|
| {ryzyko} | L/M/H | L/M/H | {plan} |

---

## Epic 3: {Tytuł}

{Powtórz strukturę jak wyżej}

---

## Podsumowanie

### Coverage PRD

| Kategoria | Total | Mapped | Unmapped |
|-----------|-------|--------|----------|
| Must Have | {N} | {M} | {N-M} |
| Should Have | {N} | {M} | {N-M} |
| Could Have | {N} | {M} | {N-M} |

### Unmapped Requirements (jeśli są)

| Requirement | Powód |
|-------------|-------|
| FR-{XX} | {dlaczego nie zmapowane} |

### Complexity Distribution

```
Large:   ████░░░░░░ 2 epiki
Medium:  ██████░░░░ 3 epiki
Small:   ████░░░░░░ 2 epiki
```

---

## Quick Reference

### Epic Dependency Chain

```
EPIC-001 ──► EPIC-002 ──► EPIC-004
    │
    └──────► EPIC-003

EPIC-005 (independent)
```

### Recommended Sequence

1. EPIC-001 (foundational)
2. EPIC-002 lub EPIC-003 (parallel possible)
3. EPIC-004 (requires EPIC-002)
4. EPIC-005 (anytime)

---

## Notes

{Dodatkowe uwagi, kontekst, decyzje}

---

## History

| Data | Zmiana | Autor |
|------|--------|-------|
| {data} | Created | ARCHITECT-AGENT |
| {data} | {zmiana} | {kto} |

---

**Następny krok:** @.claude/templates/epic-dependency-graph.md
