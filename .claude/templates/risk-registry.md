# Risk Registry: {PROJECT_NAME}

> **Źródło:** @docs/2-MANAGEMENT/epics/epic-catalog.md
> **Autor:** ARCHITECT-AGENT
> **Data:** {DATA}
> **Wersja:** 1.0

---

## Risk Dashboard

### Summary

| Kategoria | 🔴 High | 🟠 Medium | 🟡 Low | Total |
|-----------|---------|-----------|--------|-------|
| Technical | {N} | {N} | {N} | {N} |
| Business | {N} | {N} | {N} | {N} |
| External | {N} | {N} | {N} | {N} |
| **Total** | **{N}** | **{N}** | **{N}** | **{N}** |

### Risk Heat Map

```
              IMPACT
           Low    Med    High
        ┌───────┬───────┬───────┐
  High  │ 🟡 R5 │ 🟠 R3 │ 🔴 R1 │
        │       │       │ 🔴 R2 │
PROB.   ├───────┼───────┼───────┤
  Med   │ 🟢    │ 🟡 R6 │ 🟠 R4 │
        │       │       │       │
        ├───────┼───────┼───────┤
  Low   │ 🟢    │ 🟢    │ 🟡 R7 │
        │       │       │       │
        └───────┴───────┴───────┘
```

### Top 3 Risks (Wymagające Natychmiastowej Uwagi)

| # | Ryzyko | Score | Epic | Status |
|---|--------|-------|------|--------|
| R1 | {tytuł} | 25 | EPIC-001 | 🔴 Open |
| R2 | {tytuł} | 20 | EPIC-002 | 🟡 Mitigating |
| R3 | {tytuł} | 15 | EPIC-001 | 🟡 Mitigating |

---

## Risk Matrix - Scoring

### Probability Scale

| Score | Level | Opis |
|-------|-------|------|
| 5 | Very High | >80% szans wystąpienia |
| 4 | High | 60-80% szans |
| 3 | Medium | 40-60% szans |
| 2 | Low | 20-40% szans |
| 1 | Very Low | <20% szans |

### Impact Scale

| Score | Level | Opis |
|-------|-------|------|
| 5 | Critical | Project failure, major delays (>2 sprints) |
| 4 | High | Significant impact, 1-2 sprint delay |
| 3 | Medium | Moderate impact, <1 sprint delay |
| 2 | Low | Minor impact, workarounds available |
| 1 | Minimal | Negligible impact |

### Risk Score = Probability × Impact

| Score | Level | Action |
|-------|-------|--------|
| 15-25 | 🔴 High | Immediate action required |
| 8-14 | 🟠 Medium | Plan mitigation, monitor closely |
| 1-7 | 🟡 Low | Monitor, accept if cost of mitigation > impact |

---

## Detailed Risk Register

### R1: {Tytuł Ryzyka}

| Atrybut | Wartość |
|---------|---------|
| **ID** | R1 |
| **Kategoria** | Technical / Business / External |
| **Epic** | EPIC-{N} |
| **Probability** | {1-5} - {level} |
| **Impact** | {1-5} - {level} |
| **Score** | {P×I} |
| **Status** | 🔴 Open / 🟡 Mitigating / 🟢 Closed |
| **Owner** | {agent/osoba} |

**Opis:**

{Szczegółowy opis ryzyka - co może pójść nie tak}

**Przyczyny:**

- {przyczyna 1}
- {przyczyna 2}

**Skutki jeśli wystąpi:**

- {skutek 1}
- {skutek 2}

**Triggers (sygnały ostrzegawcze):**

- [ ] {trigger 1}
- [ ] {trigger 2}

**Mitigation Strategy:**

| Strategia | Akcja | Owner | Deadline |
|-----------|-------|-------|----------|
| Prevent | {akcja zapobiegawcza} | {kto} | {kiedy} |
| Reduce | {akcja redukująca impact} | {kto} | {kiedy} |
| Transfer | {przeniesienie ryzyka} | {kto} | {kiedy} |
| Accept | {plan akceptacji} | {kto} | {kiedy} |

**Contingency Plan (jeśli wystąpi):**

1. {krok 1}
2. {krok 2}
3. {krok 3}

**Research Spike Required:** ☐ Yes / ☐ No

Jeśli Yes: {opis spike'a potrzebnego do lepszego zrozumienia}

---

### R2: {Tytuł Ryzyka}

| Atrybut | Wartość |
|---------|---------|
| **ID** | R2 |
| **Kategoria** | {kategoria} |
| **Epic** | EPIC-{N} |
| **Probability** | {1-5} |
| **Impact** | {1-5} |
| **Score** | {P×I} |
| **Status** | {status} |
| **Owner** | {owner} |

**Opis:**

{opis}

**Mitigation Strategy:**

| Strategia | Akcja | Owner | Deadline |
|-----------|-------|-------|----------|
| {strategia} | {akcja} | {kto} | {kiedy} |

**Contingency Plan:**

1. {krok}

---

### R3: {Tytuł Ryzyka}

{Powtórz strukturę}

---

## Risk Categories

### Technical Risks

| ID | Risk | Epic | Score | Status |
|----|------|------|-------|--------|
| R1 | {ryzyko tech} | EPIC-{N} | {score} | {status} |
| R4 | {ryzyko tech} | EPIC-{N} | {score} | {status} |

**Common Technical Risks:**
- Integration complexity
- Performance bottlenecks
- Security vulnerabilities
- Technology unknowns
- Technical debt accumulation

### Business Risks

| ID | Risk | Epic | Score | Status |
|----|------|------|-------|--------|
| R2 | {ryzyko biz} | EPIC-{N} | {score} | {status} |

**Common Business Risks:**
- Scope creep
- Changing requirements
- Resource availability
- Stakeholder misalignment
- Budget constraints

### External Risks

| ID | Risk | Epic | Score | Status |
|----|------|------|-------|--------|
| R3 | {ryzyko ext} | EPIC-{N} | {score} | {status} |

**Common External Risks:**
- Third-party API changes
- Vendor reliability
- Regulatory changes
- Market shifts
- Dependencies on external teams

---

## Risk by Epic

### EPIC-001

| Risk | Score | Mitigation Status |
|------|-------|-------------------|
| R1 | 25 | 🟡 In Progress |
| R3 | 15 | 🔴 Not Started |

**Epic Risk Level:** 🔴 High

**Recommendation:** {rekomendacja dla tego epiku}

### EPIC-002

| Risk | Score | Mitigation Status |
|------|-------|-------------------|
| R2 | 20 | 🟡 In Progress |

**Epic Risk Level:** 🟠 Medium

### EPIC-003

| Risk | Score | Mitigation Status |
|------|-------|-------------------|
| {none or risks} | - | - |

**Epic Risk Level:** 🟢 Low

---

## Research Spikes Required

| Spike | Related Risk | Epic | Priority | Status |
|-------|--------------|------|----------|--------|
| {spike 1} | R1 | EPIC-001 | High | ⚪ Not Started |
| {spike 2} | R4 | EPIC-002 | Medium | 🟡 In Progress |

### Spike: {Tytuł}

**Cel:** {co chcemy się dowiedzieć}

**Questions to Answer:**
- [ ] {pytanie 1}
- [ ] {pytanie 2}

**Timebox:** {czas max}

**Agent:** RESEARCH-AGENT

---

## Risk Monitoring Schedule

| Częstotliwość | Akcja |
|---------------|-------|
| Każdy sprint | Review top 5 risks |
| Bi-weekly | Full risk registry review |
| Monthly | Risk trend analysis |
| Per milestone | Risk retrospective |

### Risk Trend

```
Sprint 1:  🔴🔴🔴 🟠🟠 🟡🟡🟡
Sprint 2:  🔴🔴  🟠🟠🟠 🟡🟡  (improved)
Sprint 3:  🔴    🟠🟠  🟡🟡🟡🟡 (target)
```

---

## Notes

{Dodatkowe uwagi o ryzykach}

---

## History

| Data | Zmiana | Autor |
|------|--------|-------|
| {data} | Created | ARCHITECT-AGENT |
| {data} | R1 mitigation started | {kto} |
| {data} | R5 closed | {kto} |

---

**Następny krok:** @.claude/templates/roadmap.md
