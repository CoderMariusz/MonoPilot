# Story Checklist: {N}.{M}

> **Story:** {tytuł}
> **Epic:** Epic {N}
> **Reviewer:** PRODUCT-OWNER (Elena)

---

## Quick Check

| Aspekt | Status |
|--------|--------|
| Ma tytuł As a... I want... So that...? | ☐ |
| Ma AC w Given/When/Then? | ☐ |
| Complexity określone (S/M/L)? | ☐ |
| Dependencies zdefiniowane? | ☐ |

---

## INVEST Criteria

### I — Independent

- [ ] Może być rozwijana bez innych stories w toku
- [ ] Brak circular dependencies
- [ ] Jeśli dependency istnieje — jest explicit i sekwencyjna

**Status:** ☐ Pass / ☐ Fail

**Jeśli Fail:** {co trzeba zmienić}

---

### N — Negotiable

- [ ] HOW jest elastyczne (brak narzuconej implementacji)
- [ ] WHAT jest jasne (outcome zdefiniowany)
- [ ] Brak mandated technology (chyba że constraint architektoniczny)

**Status:** ☐ Pass / ☐ Fail

**Red flags:**
- ❌ "Must use React Query with exact caching config..."
- ❌ "Implement using singleton pattern..."

---

### V — Valuable

- [ ] Dostarcza wartość USER lub BUSINESS
- [ ] Wartość jest explicitly stated
- [ ] Nie jest czysto technicznym taskiem

**Status:** ☐ Pass / ☐ Fail

**Red flags:**
- ❌ "Refactor database layer" (brak wartości dla usera)
- ✅ "As a user, I see my data faster because we optimized queries"

---

### E — Estimable

- [ ] Zespół może oszacować complexity (S/M/L)
- [ ] Brak major unknowns blokujących estymację
- [ ] Scope jest bounded

**Status:** ☐ Pass / ☐ Fail

**Jeśli Fail:** Jakie unknowns trzeba rozwiązać?
- {unknown 1}
- {unknown 2}

---

### S — Small

- [ ] Możliwe do ukończenia w 1-3 sesje
- [ ] Nie jest epic udający story
- [ ] Można zrobić code review w jednym posiedzeniu
- [ ] Max 5-7 AC

**Status:** ☐ Pass / ☐ Fail

**Jeśli Fail:** Jak podzielić?
- Story A: {zakres}
- Story B: {zakres}

---

### T — Testable

- [ ] WSZYSTKIE AC są weryfikowalne
- [ ] Format Given/When/Then użyty
- [ ] Brak vague words
- [ ] Edge cases określone

**Status:** ☐ Pass / ☐ Fail

**Vague words check:**

| Słowo | Znalezione? | Gdzie |
|-------|-------------|-------|
| "properly" | ☐ | |
| "correctly" | ☐ | |
| "appropriate" | ☐ | |
| "should work" | ☐ | |
| "handles well" | ☐ | |
| "user-friendly" | ☐ | |

---

## Acceptance Criteria Review

### AC Completeness

| AC # | Happy path? | Error path? | Edge case? | Status |
|------|-------------|-------------|------------|--------|
| 1 | ☐ | ☐ | ☐ | |
| 2 | ☐ | ☐ | ☐ | |
| 3 | ☐ | ☐ | ☐ | |

### AC Testability

Dla każdego AC: "Czy QA może napisać test case z tego?"

| AC # | Testable? | Problem |
|------|-----------|---------|
| 1 | ☐ Yes / ☐ No | |
| 2 | ☐ Yes / ☐ No | |
| 3 | ☐ Yes / ☐ No | |

---

## PRD Traceability

| Story implementuje | PRD Requirement |
|--------------------|-----------------|
| {ta story} | {FR-XX / NFR-XX} |

- [ ] Requirement istnieje w PRD
- [ ] Story w pełni pokrywa requirement
- [ ] Priorytet story zgadza się z priorytetem requirement

---

## Final Verdict

- [ ] ✅ **APPROVED** — Ready for sprint
- [ ] ⚠️ **MINOR CHANGES** — Small fixes needed
- [ ] ❌ **NEEDS REWORK** — Return to ARCHITECT

### Required Changes (if not approved)

1. {zmiana 1}
2. {zmiana 2}

---

**Reviewer:** {imię}
**Date:** {data}
