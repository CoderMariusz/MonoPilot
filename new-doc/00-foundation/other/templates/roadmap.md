# Roadmap: {PROJECT_NAME}

> **Źródło:** @docs/2-MANAGEMENT/epics/prioritized-backlog.md
> **Autor:** PRODUCT-OWNER
> **Data:** {DATA}
> **Wersja:** 1.0

---

## Executive Summary

**Cel projektu:** {one-liner opisujący cel}

**Kluczowe metryki sukcesu:**
- {metryka 1}
- {metryka 2}
- {metryka 3}

**Estimated Timeline:** {N} sprints

---

## Visual Roadmap

```
                          NOW                    NEXT                   LATER
                    (Sprint 1-2)            (Sprint 3-5)           (Sprint 6+)
                 ─────────────────────────────────────────────────────────────────►

    ┌─────────────────────┐
    │      EPIC-001       │
    │   {tytuł krótki}    │──────────────────┐
    │   [Must, L, 5 st.]  │                  │
    └─────────────────────┘                  │
                                             │
    ┌─────────────────────┐                  │   ┌─────────────────────┐
    │      EPIC-002       │                  │   │      EPIC-004       │
    │   {tytuł krótki}    │──────────────────┼──►│   {tytuł krótki}    │
    │   [Must, M, 4 st.]  │                  │   │   [Should, L, 6 st.]│
    └─────────────────────┘                  │   └─────────────────────┘
                                             │
                          ┌─────────────────────┐
                          │      EPIC-003       │
                          │   {tytuł krótki}    │
                          │   [Should, M, 4 st.]│
                          └─────────────────────┘

                                                               ┌─────────────────────┐
                                                               │      EPIC-005       │
                                                               │   {tytuł krótki}    │
                                                               │   [Could, S, 3 st.] │
                                                               └─────────────────────┘

    ═════════════════════════════════════════════════════════════════════════════════
    Milestone 1: MVP         Milestone 2: Beta               Milestone 3: Release
    ─────────────────────────────────────────────────────────────────────────────────
```

---

## NOW (Current Focus)

> **Sprint Range:** 1-2
> **Goal:** {cel tej fazy}

### Epic Lineup

| # | Epic | Priority | Stories | Risk | Status |
|---|------|----------|---------|------|--------|
| 1 | EPIC-001: {tytuł} | Must | 5 | 🔴 High | 🔵 Planning |
| 2 | EPIC-002: {tytuł} | Must | 4 | 🟡 Low | ⚪ Backlog |

### EPIC-001: {Pełny Tytuł}

**Dlaczego NOW:**
- {powód 1 - biznesowy}
- {powód 2 - zależności}

**Deliverables:**
- [ ] {deliverable 1}
- [ ] {deliverable 2}
- [ ] {deliverable 3}

**Dependencies:** None (foundational)

**Key Risks:**
- R1: {ryzyko} → Mitigation: {plan}

**Stories Preview:**

| # | Story | Complexity | Sprint |
|---|-------|------------|--------|
| 1.1 | {tytuł} | S | 1 |
| 1.2 | {tytuł} | M | 1 |
| 1.3 | {tytuł} | M | 1-2 |
| 1.4 | {tytuł} | S | 2 |
| 1.5 | {tytuł} | L | 2 |

### EPIC-002: {Pełny Tytuł}

**Dlaczego NOW:**
- {powód}

**Deliverables:**
- [ ] {deliverable}

**Dependencies:** EPIC-001 (partial)

**Key Risks:**
- R2: {ryzyko} → Mitigation: {plan}

---

## NEXT (Upcoming)

> **Sprint Range:** 3-5
> **Goal:** {cel tej fazy}

### Epic Lineup

| # | Epic | Priority | Stories | Dependencies | Ready When |
|---|------|----------|---------|--------------|------------|
| 3 | EPIC-003: {tytuł} | Should | ~4 | EPIC-001 | Sprint 3 |
| 4 | EPIC-004: {tytuł} | Should | ~6 | EPIC-002 | Sprint 4 |

### EPIC-003: {Pełny Tytuł}

**Value proposition:** {co dostarcza}

**Prerequisites:**
- [ ] EPIC-001 complete
- [ ] {inny warunek}

**Estimated scope:**
- {funkcjonalność 1}
- {funkcjonalność 2}

**Uncertainties:**
- {co jeszcze nie wiemy}

### EPIC-004: {Pełny Tytuł}

**Value proposition:** {co dostarcza}

**Prerequisites:**
- [ ] EPIC-002 complete

**Estimated scope:**
- {funkcjonalność}

---

## LATER (Backlog)

> **Sprint Range:** 6+
> **Goal:** {cel tej fazy}

### Epic Lineup

| # | Epic | Priority | Why Later |
|---|------|----------|-----------|
| 5 | EPIC-005: {tytuł} | Could | {powód przesunięcia} |
| 6 | EPIC-006: {tytuł} | Could | {powód} |

### Notes on LATER Items

**EPIC-005:** {krótki opis i dlaczego może poczekać}

**EPIC-006:** {opis}

---

## Milestones

### Milestone 1: MVP

**Target:** End of Sprint 2

**Definition:**
- [ ] EPIC-001 complete
- [ ] EPIC-002 complete
- [ ] Core functionality working

**Success Criteria:**
- {kryterium 1}
- {kryterium 2}

**Demo/Review:** {data lub "TBD"}

### Milestone 2: Beta

**Target:** End of Sprint 4

**Definition:**
- [ ] MVP complete
- [ ] EPIC-003 complete
- [ ] Initial EPIC-004 progress

**Success Criteria:**
- {kryterium}

### Milestone 3: Release

**Target:** End of Sprint 6

**Definition:**
- [ ] All Must/Should epics complete
- [ ] QA passed
- [ ] Documentation ready

**Success Criteria:**
- {kryterium}

---

## Capacity Planning

### Sprint Capacity (Example)

| Sprint | NOW | NEXT | Buffer | Total |
|--------|-----|------|--------|-------|
| 1 | 3 stories | - | 1 | 4 |
| 2 | 3 stories | - | 1 | 4 |
| 3 | 1 story | 2 stories | 1 | 4 |
| 4 | - | 4 stories | - | 4 |

### Resource Assumptions

- {assumption 1: np. 1 developer, 4-5 stories/sprint}
- {assumption 2}

---

## Priority Justification

### Value Scoring Summary

| Epic | Business Value | User Impact | Risk (inv) | Dependency | Total Score |
|------|---------------|-------------|------------|------------|-------------|
| EPIC-001 | 5 | 4 | 3 | 5 | 4.2 |
| EPIC-002 | 5 | 5 | 4 | 4 | 4.5 |
| EPIC-003 | 4 | 4 | 4 | 3 | 3.8 |
| EPIC-004 | 3 | 4 | 3 | 2 | 3.1 |
| EPIC-005 | 2 | 3 | 5 | 5 | 3.5 |

**Scoring Formula:**
```
Score = (BV × 0.30) + (UI × 0.25) + ((6-Risk) × 0.20) + ((6-Dep) × 0.15) + (SA × 0.10)
```

### Why This Order?

1. **EPIC-001 first:** {uzasadnienie}
2. **EPIC-002 parallel:** {uzasadnienie}
3. **EPIC-003 before EPIC-004:** {uzasadnienie}

---

## Risks to Roadmap

| Risk | Impact on Roadmap | Mitigation |
|------|-------------------|------------|
| EPIC-001 delay | Shifts everything +1-2 sprints | {plan} |
| Resource unavailable | May need to cut scope | {plan} |
| Tech unknown in EPIC-004 | Could expand LATER | Research spike in Sprint 3 |

---

## Change Log

| Data | Zmiana | Autor | Powód |
|------|--------|-------|-------|
| {data} | Initial roadmap | PRODUCT-OWNER | Planning complete |
| {data} | {zmiana} | {kto} | {powód} |

---

## Review Schedule

| Review Type | Frequency | Next |
|-------------|-----------|------|
| Sprint Review | Every sprint | Sprint 1 end |
| Roadmap Review | Every 2 sprints | Sprint 2 end |
| Major Replanning | Per milestone | After MVP |

---

## Stakeholder Approval

| Stakeholder | Status | Date |
|-------------|--------|------|
| {User/PO} | ⬜ Pending | - |
| {Tech Lead} | ⬜ Pending | - |

---

**Powiązane dokumenty:**
- @docs/2-MANAGEMENT/epics/epic-catalog.md
- @docs/2-MANAGEMENT/epics/dependency-graph.md
- @docs/2-MANAGEMENT/risks/risk-registry.md
- @docs/1-BASELINE/product/prd.md
