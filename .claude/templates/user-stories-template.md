# User Stories: {FEATURE/EPIC}

> **Źródło:** @docs/1-BASELINE/product/prd.md
> **Autor:** PM-AGENT (John)
> **Data:** {DATA}
> **Wersja:** 1.0

---

## Personas

### Primary User: {Nazwa}

| Atrybut | Opis |
|---------|------|
| **Kim jest** | {rola, demografia} |
| **Cel** | {co chce osiągnąć} |
| **Pain points** | {obecne problemy} |
| **Tech savviness** | {Low / Medium / High} |

### Secondary User: {Nazwa}

| Atrybut | Opis |
|---------|------|
| **Kim jest** | {rola} |
| **Cel** | {cel} |
| **Różnice vs Primary** | {co inne} |

---

## User Stories

### US-01: {Tytuł}

**Priorytet:** Must Have | Should Have | Could Have

```
As a {persona}
I want {action/feature}
So that {benefit/value}
```

**Acceptance Criteria:**

```gherkin
Given {precondition}
When {action}
Then {expected result}

Given {precondition}
When {action with invalid data}
Then {error handling}
```

**Notes:**
- {Dodatkowe uwagi}
- {Ograniczenia}

**Traces to:** FR-{XX}

---

### US-02: {Tytuł}

**Priorytet:** Must Have | Should Have | Could Have

```
As a {persona}
I want {action/feature}
So that {benefit/value}
```

**Acceptance Criteria:**

```gherkin
Given {precondition}
When {action}
Then {expected result}
```

**Notes:**
- {uwagi}

**Traces to:** FR-{XX}

---

### US-03: {Tytuł}

**Priorytet:** Must Have | Should Have | Could Have

```
As a {persona}
I want {action/feature}
So that {benefit/value}
```

**Acceptance Criteria:**

```gherkin
Given {precondition}
When {action}
Then {expected result}
```

**Traces to:** FR-{XX}

---

## User Journeys

### Journey 1: {Nazwa journey}

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Step 1  │───►│ Step 2  │───►│ Step 3  │───►│ Success │
│ {opis}  │    │ {opis}  │    │ {opis}  │    │ {opis}  │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
                    │
                    ▼
              ┌─────────┐
              │ Error   │
              │ {opis}  │
              └─────────┘
```

**Stories w journey:** US-01 → US-02 → US-03

**Emotional journey:**
- Step 1: {emotion, np. "curious"}
- Step 2: {emotion, np. "engaged"}
- Step 3: {emotion, np. "satisfied"}

---

## Prioritization Matrix

| Story | Business Value | Complexity | Priority | Sprint |
|-------|---------------|------------|----------|--------|
| US-01 | High | Low | Must | 1 |
| US-02 | High | Medium | Must | 1 |
| US-03 | Medium | Low | Should | 2 |
| US-04 | Low | High | Could | Backlog |

---

## Traceability Matrix

| User Story | PRD Requirement | Epic | Technical Story |
|------------|-----------------|------|-----------------|
| US-01 | FR-01 | Epic 1 | Story 1.1 |
| US-02 | FR-02, FR-03 | Epic 1 | Story 1.2, 1.3 |
| US-03 | FR-04 | Epic 2 | Story 2.1 |

---

## Out of Scope (dla tego release)

| Potencjalna Story | Powód wykluczenia | Kiedy rozważyć |
|-------------------|-------------------|----------------|
| {story} | {powód} | {faza/sprint} |

---

## Open Questions

| # | Pytanie | Wpływ na stories | Owner | Status |
|---|---------|------------------|-------|--------|
| 1 | {pytanie} | US-02, US-03 | {PO} | Open |

---

**Handoff do:** ARCHITECT-AGENT (breakdown na technical stories)
