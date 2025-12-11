# Agent Slimming Master Plan

Data: 2025-01-10
Wersja: 2.0

---

## 1. Final Review: SKILL-CREATOR & SKILL-VALIDATOR

### SKILL-CREATOR

| Kategoria | Element | Status | Uwagi |
|-----------|---------|--------|-------|
| **MUST HAVE** | | | |
| ✅ | Identity | DONE | Krótkie, jasne |
| ✅ | Workflow (4 kroki) | DONE | Research→Draft→Size→Register |
| ✅ | Skill template | DONE | Output format |
| ✅ | Quality gates | DONE | Checklist |
| ✅ | Handoff format | DONE | YAML do VALIDATOR |
| ✅ | Skills declaration | DONE | required + optional |
| ✅ | Skill types | DONE | generic/domain/project |
| ✅ | Error recovery | DONE | Tabela scenariuszy |
| **NICE TO HAVE** | | | |
| ⬜ | Batch creation | NOT DONE | Tworzenie wielu skills naraz |
| ⬜ | Auto-split | NOT DONE | Automatyczne dzielenie >1500 tok |
| ⬜ | Domain detection | NOT DONE | Rozpoznawanie typu skill |

**Verdict: COMPLETE** ✅ - wszystkie MUST HAVE zrobione

### SKILL-VALIDATOR

| Kategoria | Element | Status | Uwagi |
|-----------|---------|--------|-------|
| **MUST HAVE** | | | |
| ✅ | Identity | DONE | Krótkie, jasne |
| ✅ | Workflow (4 kroki) | DONE | Source→Freshness→Quality→Verdict |
| ✅ | Verdict types (5) | DONE | VALID/MINOR/MAJOR/DEPRECATED/INVALID |
| ✅ | Validation checklist | DONE | Sources/Freshness/Quality |
| ✅ | Output format | DONE | Validation Report |
| ✅ | Review cycle | DONE | Kiedy walidować |
| ✅ | Skills declaration | DONE | required + optional |
| ✅ | Handoff per verdict | DONE | Tabela routingu |
| ✅ | Project onboarding | DONE | Nowy projekt scan |
| **NICE TO HAVE** | | | |
| ⬜ | Batch validation | NOT DONE | Walidacja wielu skills |
| ⬜ | Auto-schedule | NOT DONE | Automatyczne kolejkowanie |
| ⬜ | Diff reporting | NOT DONE | Co się zmieniło od ostatniej walidacji |

**Verdict: COMPLETE** ✅ - wszystkie MUST HAVE zrobione

---

## 2. Stan Skills - Co Mamy vs Co Brakuje

### ✅ Skills Już Stworzone (45)

```
SUPABASE (6):        ✅ rls, queries, realtime, auth, storage, edge-functions
REACT (4):           ✅ hooks, performance, forms, state-management
NEXTJS (3):          ✅ app-router, data-fetching, api-routes
TAILWIND (1):        ✅ tailwind-patterns
TYPESCRIPT (4):      ✅ patterns, generics, zod, api-types
TESTING (5):         ✅ tdd-workflow, jest, react-testing-lib, playwright, msw
API (4):             ✅ rest-design, error-handling, validation, authentication
CODE QUALITY (5):    ✅ code-review-checklist, git-workflow, conventional-commits,
                        documentation-patterns, refactoring-patterns
DEVOPS (3):          ✅ ci-github-actions, docker-basics, env-configuration
UX & SECURITY (3):   ✅ accessibility-checklist, security-backend-checklist, ui-ux-patterns
PLANNING (4):        ✅ invest-stories, discovery-interview-patterns, prd-structure, architecture-adr
SKILLS META (3):     ✅ research-source-evaluation, version-changelog-patterns, skill-quality-standards
```

### ⬜ Skills Brakujące (z deep review)

| Skill | Źródło | Priority | Tokeny |
|-------|--------|----------|--------|
| `requirements-clarity-scoring` | DISCOVERY-AGENT | HIGH | ~400 |
| `qa-bug-reporting` | QA-AGENT | MEDIUM | ~400 |
| `agile-retrospective` | SCRUM-MASTER | LOW | ~300 |

**Tylko 3 brakujące!** Większość już mamy.

---

## 3. Plan Przebudowy Agentów

### Strategia

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT SLIMMING PROCESS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DLA KAŻDEGO AGENTA:                                             │
│                                                                  │
│  1. DODAJ skills.required/optional                               │
│     └─ Sprawdź jakie skills pasują do tego agenta                │
│     └─ Dodaj do frontmatter                                      │
│                                                                  │
│  2. USUŃ zduplikowaną wiedzę                                     │
│     └─ Jeśli pattern jest w skill → usuń z agenta                │
│     └─ Zostaw referencję: "See: skill-name"                      │
│                                                                  │
│  3. ZOSTAW tylko:                                                │
│     └─ Identity (krótkie)                                        │
│     └─ Workflow (JAK pracuje)                                    │
│     └─ Decision Logic (KIEDY co robić)                           │
│     └─ Output Format (CO produkuje)                              │
│     └─ Handoff (KOMU przekazuje)                                 │
│                                                                  │
│  4. ZWERYFIKUJ rozmiar                                           │
│     └─ Target: 400-600 tokenów                                   │
│     └─ Max: 800 tokenów                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Kolejność Przebudowy (Priority)

#### Faza 1: Quick Wins (Skills już istnieją!)

| # | Agent | Skills do dodania | Est. redukcja | Priority |
|---|-------|-------------------|---------------|----------|
| 1 | TEST-ENGINEER | testing-tdd-workflow, testing-* | -600 tok | HIGH |
| 2 | BACKEND-DEV | api-*, supabase-*, security-* | -800 tok | HIGH |
| 3 | FRONTEND-DEV | react-*, tailwind, accessibility | -800 tok | HIGH |
| 4 | SENIOR-DEV | refactoring-patterns, typescript | -600 tok | HIGH |
| 5 | CODE-REVIEWER | code-review-checklist | -700 tok | HIGH |
| 6 | TECH-WRITER | documentation-patterns | -800 tok | HIGH |
| 7 | DEVOPS-AGENT | ci-*, docker-*, env-* | -1,200 tok | HIGH |

**Suma Faza 1: -5,500 tokenów**

#### Faza 2: Mniejsze Agenty (Łatwe)

| # | Agent | Skills do dodania | Est. redukcja | Priority |
|---|-------|-------------------|---------------|----------|
| 8 | UX-DESIGNER | accessibility, ui-ux-patterns | -500 tok | MEDIUM |
| 9 | QA-AGENT | testing-tdd-workflow | -500 tok | MEDIUM |
| 10 | SCRUM-MASTER | (już mały) | -300 tok | LOW |

**Suma Faza 2: -1,300 tokenów**

#### Faza 3: Duże Agenty (Wymagają więcej pracy)

| # | Agent | Akcja | Est. redukcja | Priority |
|---|-------|-------|---------------|----------|
| 11 | DISCOVERY-AGENT | Użyj discovery-interview-patterns, stwórz clarity-scoring | -3,000 tok | HIGH |
| 12 | RESEARCH-AGENT | Użyj research-source-evaluation | -1,200 tok | MEDIUM |
| 13 | PM-AGENT | Użyj prd-structure, invest-stories | -1,200 tok | MEDIUM |
| 14 | PRODUCT-OWNER | Usuń duplikat INVEST, użyj invest-stories | -1,500 tok | HIGH |
| 15 | ARCHITECT-AGENT | Użyj architecture-adr, invest-stories | -800 tok | MEDIUM |
| 16 | DOC-AUDITOR | Użyj documentation-patterns | -1,000 tok | MEDIUM |

**Suma Faza 3: -8,700 tokenów**

### Łączna Redukcja

| Faza | Agentów | Redukcja |
|------|---------|----------|
| Faza 1 | 7 | -5,500 tok |
| Faza 2 | 3 | -1,300 tok |
| Faza 3 | 6 | -8,700 tok |
| **RAZEM** | **16** | **-15,500 tok** |

```
Przed:  ~46,000 tokenów
Po:     ~30,500 tokenów
Redukcja: ~34%
```

---

## 4. Template Przebudowy Agenta

### Szablon do kopiowania:

```yaml
---
name: agent-name
description: One line description
type: Development|Planning|Quality|Skills|Operations
trigger: When X happens
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
behavior: Key behavior in one line
skills:
  required:
    - skill-1
    - skill-2
  optional:
    - skill-3
---

# AGENT-NAME

## Identity
[1-2 sentences - who you are, core mission]

## Workflow
[ASCII diagram or numbered steps]
[Reference skills: "Load: skill-name"]

## [Core Decision Logic]
[Table or list - WHEN to do WHAT]

## Output Format
[What this agent produces]

## Quality Gates
[Checklist before handoff]

## Handoff
[To whom, with what payload]
```

### Zasady Slimming:

1. **Identity**: Max 2 zdania
2. **Workflow**: Max 10 kroków, referencje do skills
3. **Knowledge**: ZERO - wszystko w skills
4. **Output**: Template lub example
5. **Total**: 400-600 tokenów (max 800)

---

## 5. Przykład Przebudowy: BACKEND-DEV

### PRZED (~1,810 tok):
```markdown
- Szczegółowe API patterns
- Szczegółowe database patterns
- Szczegółowe error handling
- Szczegółowe input validation
- Szczegółowe security considerations
- GREEN phase rules
```

### PO (~400 tok):
```yaml
---
name: backend-dev
skills:
  required: [api-rest-design, api-error-handling, typescript-patterns]
  optional: [supabase-queries, supabase-rls, api-validation, api-authentication, security-backend-checklist]
---

# BACKEND-DEV

## Identity
You implement backend APIs and services. GREEN phase of TDD - make tests pass with minimal code.

## Workflow
1. Read failing tests
2. Load: api-rest-design, api-error-handling
3. Implement minimal code to pass tests
4. Load: security-backend-checklist → verify security
5. Run tests → all must pass
6. Handoff to SENIOR-DEV for refactor

## GREEN Phase Rules
- NO new features beyond failing tests
- NO refactoring (that's SENIOR-DEV's job)
- Minimal code to pass

## Output
- Implementation files
- All tests passing

## Handoff
→ SENIOR-DEV (REFACTOR phase)
```

**Redukcja: 1,810 → 400 = -78%!**

---

## 6. Action Plan

### Natychmiast (dziś):
1. [ ] Stworzyć brakujący skill: `requirements-clarity-scoring`
2. [ ] Rozpocząć Fazę 1: 7 development/quality agents

### Krótkoterminowo:
3. [ ] Dokończyć Fazę 1
4. [ ] Faza 2: mniejsze agents
5. [ ] Commit & push

### Średnioterminowo:
6. [ ] Faza 3: duże agents (DISCOVERY, RESEARCH, PM)
7. [ ] Final validation wszystkich agents
8. [ ] Update AGENT-DEEP-REVIEW.md z nowymi statystykami

---

## 7. Metryki Sukcesu

| Metryka | Przed | Cel |
|---------|-------|-----|
| Średni rozmiar agenta | ~2,500 tok | 500-600 tok |
| Max rozmiar agenta | ~6,500 tok | 800 tok |
| Łączne tokeny | ~46,000 | ~30,000 |
| Skills wykorzystane | 0 | 45 |
| Duplikaty między agentami | 5+ | 0 |

---

## 8. Decyzja

**Pytanie:** Jak chcesz kontynuować?

**Opcja A:** Zacznij od Fazy 1 (7 agentów development/quality)
- Najszybsze rezultaty
- Skills już istnieją
- -5,500 tokenów

**Opcja B:** Najpierw stwórz brakujące skills, potem wszystkie fazy
- Bardziej kompletne
- Więcej pracy upfront

**Opcja C:** Zacznij od największych (DISCOVERY-AGENT ~6,500 tok)
- Największy impact per agent
- Może wymagać nowych skills

**Rekomendacja:** Opcja A - szybkie wygrane, udowodnij że działa, potem reszta
