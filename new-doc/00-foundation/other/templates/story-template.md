# Story {Epic}.{Id}: {Tytuł}

> **Epic:** @docs/2-MANAGEMENT/epics/epic-{N}-{nazwa}.md
> **Autor:** ARCHITECT-AGENT
> **Data:** {DATA}
> **Wersja:** 1.0

---

## Metadata

| Atrybut | Wartość |
|---------|---------|
| **ID** | {Epic}.{Id} |
| **Complexity** | S / M / L |
| **Type** | Backend / Frontend / Full-stack / Infra / Research |
| **Priority** | Must / Should / Could |
| **Sprint** | {N} lub Backlog |

---

## User Story

```
As a {user/persona}
I want {action/capability}
So that {benefit/value}
```

---

## Acceptance Criteria

### AC1: {Tytuł kryterium}

```gherkin
Given {precondition - stan początkowy}
  And {dodatkowy warunek jeśli potrzebny}
When {action - co user robi}
Then {result - co powinno się stać}
  And {dodatkowy rezultat jeśli potrzebny}
```

### AC2: {Tytuł kryterium}

```gherkin
Given {precondition}
When {action}
Then {result}
```

### AC3: Error Handling

```gherkin
Given {precondition}
When {action with invalid input}
Then {error message/behavior}
```

### AC4: Edge Case

```gherkin
Given {edge case condition}
When {action}
Then {expected behavior}
```

---

## Technical Notes

### Implementation Hints

- {Sugestia implementacji 1}
- {Sugestia implementacji 2}
- {Pattern do użycia}

### Database Changes

- [ ] Nowa tabela: {nazwa}
- [ ] Nowe pole: {tabela.pole}
- [ ] Migracja danych: {opis}
- [ ] Brak zmian w DB

### API Changes

- [ ] Nowy endpoint: `{METHOD} {path}`
- [ ] Zmiana istniejącego: `{endpoint}`
- [ ] Brak zmian API

### UI Components

- [ ] Nowy komponent: {nazwa}
- [ ] Modyfikacja: {komponent}
- [ ] Brak zmian UI

---

## Dependencies

### Blokowane przez (musi być ukończone wcześniej)

| Story | Tytuł | Status |
|-------|-------|--------|
| {X}.{Y} | {tytuł} | {status} |

### Blokuje (czeka na tę story)

| Story | Tytuł |
|-------|-------|
| {X}.{Y} | {tytuł} |

### External Dependencies

- [ ] API: {zewnętrzne API}
- [ ] Service: {zewnętrzny serwis}
- [ ] Brak zewnętrznych zależności

---

## Risks

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
|--------|-------------------|-------|-----------|
| {ryzyko} | Low/Med/High | Low/Med/High | {plan} |

---

## Definition of Done

- [ ] Kod napisany i pushowany
- [ ] Wszystkie AC spełnione
- [ ] Testy jednostkowe napisane i passing
- [ ] Testy integracyjne (jeśli applicable)
- [ ] Code review APPROVED
- [ ] QA PASSED
- [ ] Dokumentacja zaktualizowana (jeśli applicable)
- [ ] Merge do main branch

---

## Traceability

| Traces To | ID |
|-----------|-----|
| PRD Requirement | FR-{XX} / NFR-{XX} |
| User Story | US-{XX} |
| ADR | ADR-{XXX} (jeśli applicable) |

---

## Notes

{Dodatkowe uwagi, kontekst, decyzje}

---

## History

| Data | Zmiana | Autor |
|------|--------|-------|
| {data} | Created | ARCHITECT |
| {data} | {zmiana} | {kto} |
