# Agent Deep Review Report

Data: 2025-01-10
Cel: Identyfikacja wiedzy, która może zostać wyekstrahowana do skills

---

## Podsumowanie Wykonawcze

| Metryka | Wartość |
|---------|---------|
| Liczba agentów | 18 |
| Łączne tokeny (szacunkowo) | ~46,000 |
| Docelowe tokeny/agent | 500-800 |
| Potencjalna redukcja | ~60-70% |

---

## Analiza Agentów

### 1. ORCHESTRATOR
**Lokalizacja:** `.claude/agents/ORCHESTRATOR.md`
**Tokeny (szacunkowo):** ~2,600

#### Zawartość:
- Trigger words routing
- Agent registry
- Skills integration
- Routing decision tree
- Parallel execution rules
- Quality gates
- Workflow definitions
- Autonomy levels
- Auto-flow configuration
- Smart summaries

#### Co może iść do skills:
| Wiedza | Typ | Skill |
|--------|-----|-------|
| - | - | Agent jest meta-routerem, jego wiedza jest proceduralną logiką, nie domenową |

#### Rekomendowane skills:
```yaml
skills:
  required: []  # ORCHESTRATOR nie potrzebuje skills
  optional: []
```

#### Rekomendacja:
Agent OK - jego rola to routing, nie implementacja. Może pozostać w obecnej formie.

---

### 2. DISCOVERY-AGENT
**Lokalizacja:** `.claude/agents/planning/DISCOVERY-AGENT.md`
**Tokeny (szacunkowo):** ~6,500 (BARDZO DUŻY)

#### Zawartość:
- Interview protocols (structured interview)
- Question templates (po obszarach)
- Clarity scoring system
- Context extraction
- Problem definition templates
- Discovery flow diagrams
- Output formats

#### Co może iść do skills:
| Wiedza | Typ | Proponowany Skill |
|--------|-----|-------------------|
| Interview techniques | Generic | `discovery-interview-patterns` |
| Clarity scoring | Generic | `requirements-clarity-scoring` |
| Question templates | Generic | `requirements-questions` |

#### Rekomendowane skills:
```yaml
skills:
  required: [documentation-patterns]
  optional: []
```

#### Rekomendacja:
- **PODZIELIĆ** na mniejsze części
- Wyekstrahować: interview patterns, clarity scoring do osobnych skills
- Potencjalna redukcja: ~3,000 tokenów (46%)

---

### 3. PM-AGENT
**Lokalizacja:** `.claude/agents/planning/PM-AGENT.md`
**Tokeny (szacunkowo):** ~3,070

#### Zawartość:
- PRD creation workflow
- MoSCoW prioritization
- Functional/non-functional requirements
- User stories format
- PRD template sections
- Stakeholder analysis
- Success metrics

#### Co może iść do skills:
| Wiedza | Typ | Proponowany Skill |
|--------|-----|-------------------|
| MoSCoW prioritization | Generic | `pm-prioritization` |
| PRD structure | Generic | `prd-template` |
| User story format | Generic | `user-story-format` |
| Success metrics | Generic | `product-metrics` |

#### Rekomendowane skills:
```yaml
skills:
  required: [documentation-patterns]
  optional: []
```

#### Rekomendacja:
- Wyekstrahować PRD template do skill
- Wyekstrahować MoSCoW framework do skill
- Potencjalna redukcja: ~1,200 tokenów (39%)

---

### 4. ARCHITECT-AGENT
**Lokalizacja:** `.claude/agents/planning/ARCHITECT-AGENT.md`
**Tokeny (szacunkowo):** ~2,580

#### Zawartość:
- System design patterns
- ADR (Architecture Decision Records)
- Epic breakdown
- INVEST story criteria
- C4 model references
- Tech stack evaluation
- Dependency mapping

#### Co może iść do skills:
| Wiedza | Typ | Proponowany Skill |
|--------|-----|-------------------|
| ADR format | Generic | `architecture-adr` |
| INVEST criteria | Generic | `invest-stories` |
| C4 model | Generic | `architecture-c4-model` |
| System design | Generic | `system-design-patterns` |

#### Rekomendowane skills:
```yaml
skills:
  required: [api-rest-design]
  optional: [typescript-patterns]
```

#### Rekomendacja:
- Wyekstrahować ADR template do skill
- Wyekstrahować INVEST checklist (powtarza się w PRODUCT-OWNER)
- Potencjalna redukcja: ~800 tokenów (31%)

---

### 5. PRODUCT-OWNER
**Lokalizacja:** `.claude/agents/planning/PRODUCT-OWNER.md`
**Tokeny (szacunkowo):** ~4,850 (DUŻY)

#### Zawartość:
- Scope validation protocol
- INVEST validation (duplikat z ARCHITECT)
- AC quality checks
- PRD coverage matrix
- Scope creep detection
- Decision criteria
- Question generation

#### Co może iść do skills:
| Wiedza | Typ | Proponowany Skill |
|--------|-----|-------------------|
| INVEST validation | Generic | `invest-stories` (DUPLIKAT!) |
| AC quality checks | Generic | `acceptance-criteria-quality` |
| Scope validation | Generic | `scope-validation` |

#### Rekomendowane skills:
```yaml
skills:
  required: [documentation-patterns]
  optional: []
```

#### Rekomendacja:
- **USUNĄĆ DUPLIKAT** INVEST (jest też w ARCHITECT)
- Wyekstrahować AC quality checks do skill
- Potencjalna redukcja: ~1,500 tokenów (31%)

---

### 6. SCRUM-MASTER
**Lokalizacja:** `.claude/agents/planning/SCRUM-MASTER.md`
**Tokeny (szacunkowo):** ~1,150

#### Zawartość:
- Sprint planning
- Blocker classification
- Retrospective format (Start/Stop/Continue)
- Velocity tracking
- Capacity guidelines
- Handoff protocols

#### Co może iść do skills:
| Wiedza | Typ | Proponowany Skill |
|--------|-----|-------------------|
| Retrospective format | Generic | `agile-retrospective` |
| Sprint planning | Generic | `sprint-planning` |
| Blocker types | Generic | `blocker-resolution` |

#### Rekomendowane skills:
```yaml
skills:
  required: []
  optional: []
```

#### Rekomendacja:
- Agent jest już stosunkowo kompaktowy
- Retrospective format może zostać jako skill
- Potencjalna redukcja: ~300 tokenów (26%)

---

### 7. RESEARCH-AGENT
**Lokalizacja:** `.claude/agents/planning/RESEARCH-AGENT.md`
**Tokeny (szacunkowo):** ~4,200 (DUŻY)

#### Zawartość:
- Research categories (6 typów)
- Source tier classification
- Parallel research protocol
- Confidence scoring
- Research depth levels
- Output templates
- Comparison matrix format

#### Co może iść do skills:
| Wiedza | Typ | Proponowany Skill |
|--------|-----|-------------------|
| Source tier classification | Generic | `research-source-evaluation` |
| Research methodology | Generic | `research-methodology` |
| Comparison matrix | Generic | `research-comparison-matrix` |

#### Rekomendowane skills:
```yaml
skills:
  required: []
  optional: []
```

#### Rekomendacja:
- Wyekstrahować source evaluation do skill
- Research templates mogą zostać w agencie
- Potencjalna redukcja: ~1,200 tokenów (29%)

---

### 8. DOC-AUDITOR
**Lokalizacja:** `.claude/agents/planning/DOC-AUDITOR.md`
**Tokeny (szacunkowo):** ~3,900

#### Zawartość:
- Deep dive protocol (6 faz)
- Quality score calculation
- Cross-reference checks
- Severity levels
- Question generation
- Migration audit
- Large file detection

#### Co może iść do skills:
| Wiedza | Typ | Proponowany Skill |
|--------|-----|-------------------|
| Quality scoring | Generic | `documentation-quality-scoring` |
| Cross-reference checks | Generic | `documentation-cross-reference` |

#### Rekomendowane skills:
```yaml
skills:
  required: [documentation-patterns]
  optional: []
```

#### Rekomendacja:
- Wyekstrahować quality scoring formula do skill
- Cross-reference checklist do skill
- Potencjalna redukcja: ~1,000 tokenów (26%)

---

### 9. UX-DESIGNER
**Lokalizacja:** `.claude/agents/planning/UX-DESIGNER.md`
**Tokeny (szacunkowo):** ~1,430

#### Zawartość:
- 4 states pattern (loading, empty, error, success)
- Accessibility checklist
- Touch target requirements
- Contrast ratios
- Wireframe format (ASCII)
- Screen reader requirements
- Focus order specification

#### Co może iść do skills:
| Wiedza | Typ | Proponowany Skill |
|--------|-----|-------------------|
| 4 states pattern | Generic | `ux-state-patterns` |
| Accessibility checklist | Generic | `accessibility-checklist` |
| Touch targets | Generic | Część `accessibility-checklist` |
| Contrast ratios | Generic | Część `accessibility-checklist` |

#### Rekomendowane skills:
```yaml
skills:
  required: [tailwind-patterns]
  optional: []
```

#### Rekomendacja:
- **STWORZYĆ** `accessibility-checklist` skill
- **STWORZYĆ** `ux-state-patterns` skill
- Potencjalna redukcja: ~500 tokenów (35%)

---

### 10. TEST-ENGINEER
**Lokalizacja:** `.claude/agents/development/TEST-ENGINEER.md`
**Tokeny (szacunkowo):** ~1,810

#### Zawartość:
- Test strategy design
- Test pyramid
- Coverage targets
- Test naming conventions
- Given/When/Then format
- Mock strategy
- Integration vs unit decision

#### Co może iść do skills:
| Wiedza | Typ | Mamy skill? |
|--------|-----|-------------|
| Test pyramid | Generic | `testing-tdd-workflow` ✅ |
| Test naming | Generic | `testing-jest` ✅ |
| Given/When/Then | Generic | `testing-tdd-workflow` ✅ |
| Mock strategy | Generic | `testing-msw` ✅ |

#### Rekomendowane skills:
```yaml
skills:
  required: [testing-tdd-workflow]
  optional: [testing-jest, testing-react-testing-lib, testing-playwright, testing-msw]
```

#### Rekomendacja:
- Większość wiedzy już jest w skills!
- **ODCHUDZIĆ** agenta o ~600 tokenów
- Potencjalna redukcja: ~600 tokenów (33%)

---

### 11. TEST-WRITER
**Lokalizacja:** `.claude/agents/development/TEST-WRITER.md`
**Tokeny (szacunkowo):** ~700

#### Zawartość:
- RED phase implementation
- Failing test patterns
- Test file structure
- Assertion patterns

#### Co może iść do skills:
| Wiedza | Typ | Mamy skill? |
|--------|-----|-------------|
| Assertion patterns | Generic | `testing-jest` ✅ |
| Test structure | Generic | `testing-tdd-workflow` ✅ |

#### Rekomendowane skills:
```yaml
skills:
  required: [testing-tdd-workflow]
  optional: [testing-jest, testing-react-testing-lib, testing-playwright]
```

#### Rekomendacja:
- Agent jest już kompaktowy (OK)
- Skills dobrze zdefiniowane

---

### 12. BACKEND-DEV
**Lokalizacja:** `.claude/agents/development/BACKEND-DEV.md`
**Tokeny (szacunkowo):** ~1,810

#### Zawartość:
- API implementation patterns
- Database patterns
- Error handling
- Input validation
- Security considerations
- GREEN phase rules

#### Co może iść do skills:
| Wiedza | Typ | Mamy skill? |
|--------|-----|-------------|
| API patterns | Generic | `api-rest-design` ✅ |
| Error handling | Generic | `api-error-handling` ✅ |
| Input validation | Generic | `api-validation` ✅ |
| Security | Generic | `api-authentication` ✅ |
| Database patterns | Generic | `supabase-queries` ✅ |

#### Rekomendowane skills:
```yaml
skills:
  required: [api-rest-design, api-error-handling, typescript-patterns]
  optional: [supabase-queries, supabase-rls, api-validation, api-authentication]
```

#### Rekomendacja:
- Większość wiedzy w skills!
- **ODCHUDZIĆ** o ~800 tokenów
- Potencjalna redukcja: ~800 tokenów (44%)

---

### 13. FRONTEND-DEV
**Lokalizacja:** `.claude/agents/development/FRONTEND-DEV.md`
**Tokeny (szacunkowo):** ~1,820

#### Zawartość:
- React component patterns
- State management
- Form handling
- Accessibility requirements
- Responsive design
- GREEN phase rules

#### Co może iść do skills:
| Wiedza | Typ | Mamy skill? |
|--------|-----|-------------|
| React patterns | Generic | `react-hooks` ✅ |
| State management | Generic | `react-state-management` ✅ |
| Forms | Generic | `react-forms` ✅ |
| Accessibility | Generic | BRAK ❌ |
| Responsive | Generic | `tailwind-patterns` ✅ |
| Performance | Generic | `react-performance` ✅ |

#### Rekomendowane skills:
```yaml
skills:
  required: [react-hooks, typescript-patterns]
  optional: [react-forms, react-state-management, react-performance, tailwind-patterns, nextjs-app-router]
```

#### Rekomendacja:
- **STWORZYĆ** `accessibility-checklist` skill (brakuje!)
- **ODCHUDZIĆ** agenta o ~800 tokenów
- Potencjalna redukcja: ~800 tokenów (44%)

---

### 14. SENIOR-DEV
**Lokalizacja:** `.claude/agents/development/SENIOR-DEV.md`
**Tokeny (szacunkowo):** ~1,740

#### Zawartość:
- REFACTOR phase rules
- Code smell detection
- Design patterns
- Architecture decisions
- Complex implementation guidance
- Technical debt assessment

#### Co może iść do skills:
| Wiedza | Typ | Mamy skill? |
|--------|-----|-------------|
| Refactoring | Generic | `refactoring-patterns` ✅ |
| Design patterns | Generic | `typescript-patterns` ✅ |
| Code smells | Generic | Część `refactoring-patterns` ✅ |

#### Rekomendowane skills:
```yaml
skills:
  required: [refactoring-patterns, typescript-patterns]
  optional: [react-performance, api-rest-design]
```

#### Rekomendacja:
- **ODCHUDZIĆ** o refactoring patterns (jest w skill)
- Potencjalna redukcja: ~600 tokenów (34%)

---

### 15. CODE-REVIEWER
**Lokalizacja:** `.claude/agents/quality/CODE-REVIEWER.md`
**Tokeny (szacunkowo):** ~2,070

#### Zawartość:
- Review checklist
- Security review points
- Performance review
- Code quality criteria
- APPROVE/REQUEST_CHANGES decision
- Comment formatting

#### Co może iść do skills:
| Wiedza | Typ | Mamy skill? |
|--------|-----|-------------|
| Review checklist | Generic | `code-review-checklist` ✅ |
| Security review | Generic | Część `code-review-checklist` ✅ |
| Performance | Generic | `react-performance` ✅ |

#### Rekomendowane skills:
```yaml
skills:
  required: [code-review-checklist]
  optional: [typescript-patterns, react-performance, api-rest-design]
```

#### Rekomendacja:
- **ODCHUDZIĆ** o checklist (jest w skill)
- Potencjalna redukcja: ~700 tokenów (34%)

---

### 16. QA-AGENT
**Lokalizacja:** `.claude/agents/quality/QA-AGENT.md`
**Tokeny (szacunkowo):** ~1,910

#### Zawartość:
- Manual testing protocol
- Bug report format
- Test case execution
- PASS/FAIL criteria
- Regression testing
- UAT validation

#### Co może iść do skills:
| Wiedza | Typ | Proponowany Skill |
|--------|-----|-------------------|
| Bug report format | Generic | `qa-bug-reporting` |
| Test case format | Generic | `qa-test-cases` |

#### Rekomendowane skills:
```yaml
skills:
  required: [testing-tdd-workflow]
  optional: [testing-playwright]
```

#### Rekomendacja:
- **STWORZYĆ** `qa-bug-reporting` skill
- Potencjalna redukcja: ~500 tokenów (26%)

---

### 17. TECH-WRITER
**Lokalizacja:** `.claude/agents/quality/TECH-WRITER.md`
**Tokeny (szacunkowo):** ~2,230

#### Zawartość:
- Documentation types
- README structure
- API documentation
- Changelog format
- Code examples
- Style guide

#### Co może iść do skills:
| Wiedza | Typ | Mamy skill? |
|--------|-----|-------------|
| README structure | Generic | `documentation-patterns` ✅ |
| API docs | Generic | `documentation-patterns` ✅ |
| Code examples | Generic | `documentation-patterns` ✅ |

#### Rekomendowane skills:
```yaml
skills:
  required: [documentation-patterns]
  optional: [git-conventional-commits]
```

#### Rekomendacja:
- **ODCHUDZIĆ** o documentation patterns
- Potencjalna redukcja: ~800 tokenów (36%)

---

### 18. DEVOPS-AGENT
**Lokalizacja:** `.claude/agents/operations/DEVOPS-AGENT.md`
**Tokeny (szacunkowo):** ~2,600

#### Zawartość:
- CI/CD pipelines
- Docker patterns
- Deployment strategies
- Environment configuration
- Monitoring setup
- Rollback procedures

#### Co może iść do skills:
| Wiedza | Typ | Mamy skill? |
|--------|-----|-------------|
| CI/CD | Generic | `ci-github-actions` ✅ |
| Docker | Generic | `docker-basics` ✅ |
| Env config | Generic | `env-configuration` ✅ |

#### Rekomendowane skills:
```yaml
skills:
  required: [ci-github-actions, docker-basics]
  optional: [env-configuration, git-workflow]
```

#### Rekomendacja:
- **ODCHUDZIĆ** o CI/CD i Docker patterns
- Potencjalna redukcja: ~1,200 tokenów (46%)

---

## Skills Agents (nowe)

### 19. SKILL-CREATOR
**Lokalizacja:** `.claude/agents/skills/SKILL-CREATOR.md`
**Tokeny (szacunkowo):** ~1,500

#### Rekomendacja:
- Nowy agent - OK
- Dobrze zdefiniowany

### 20. SKILL-VALIDATOR
**Lokalizacja:** `.claude/agents/skills/SKILL-VALIDATOR.md`
**Tokeny (szacunkowo):** ~1,200

#### Rekomendacja:
- Nowy agent - OK
- Dobrze zdefiniowany

---

## Zidentyfikowane Duplikaty

| Wiedza | Gdzie występuje | Rozwiązanie |
|--------|-----------------|-------------|
| INVEST criteria | ARCHITECT, PRODUCT-OWNER | Wyekstrahować do `invest-stories` skill |
| Interview questions | DISCOVERY | Wyekstrahować do `discovery-interview-patterns` skill |
| Accessibility checklist | UX-DESIGNER, FRONTEND-DEV | Stworzyć `accessibility-checklist` skill |
| Documentation patterns | TECH-WRITER, DOC-AUDITOR, PM-AGENT | Już mamy `documentation-patterns` ✅ |

---

## Proponowane Nowe Skills

Na podstawie analizy, te skills powinny zostać stworzone:

### High Priority (wyekstrahować z agentów)
| Skill | Źródło | Tokens |
|-------|--------|--------|
| `accessibility-checklist` | UX-DESIGNER, FRONTEND-DEV | ~600 |
| `invest-stories` | ARCHITECT, PRODUCT-OWNER | ~400 |
| `discovery-interview-patterns` | DISCOVERY-AGENT | ~500 |
| `requirements-clarity-scoring` | DISCOVERY-AGENT | ~400 |

### Medium Priority (uporządkowanie)
| Skill | Źródło | Tokens |
|-------|--------|--------|
| `prd-template` | PM-AGENT | ~500 |
| `architecture-adr` | ARCHITECT-AGENT | ~400 |
| `qa-bug-reporting` | QA-AGENT | ~400 |
| `agile-retrospective` | SCRUM-MASTER | ~300 |

### Low Priority (nice to have)
| Skill | Źródło | Tokens |
|-------|--------|--------|
| `pm-prioritization` | PM-AGENT | ~300 |
| `research-source-evaluation` | RESEARCH-AGENT | ~400 |
| `documentation-quality-scoring` | DOC-AUDITOR | ~400 |

---

## Plan Redukcji Tokenów

### Faza 1: Quick Wins (skills już istnieją)
| Agent | Akcja | Redukcja |
|-------|-------|----------|
| TEST-ENGINEER | Dodaj skills, usuń duplikaty | -600 tok |
| BACKEND-DEV | Dodaj skills, usuń duplikaty | -800 tok |
| FRONTEND-DEV | Dodaj skills, usuń duplikaty | -800 tok |
| SENIOR-DEV | Dodaj skills, usuń duplikaty | -600 tok |
| CODE-REVIEWER | Dodaj skills, usuń duplikaty | -700 tok |
| TECH-WRITER | Dodaj skills, usuń duplikaty | -800 tok |
| DEVOPS-AGENT | Dodaj skills, usuń duplikaty | -1,200 tok |
| **Suma Faza 1** | | **-5,500 tok** |

### Faza 2: Nowe Skills + Ekstrakcja
| Agent | Akcja | Redukcja |
|-------|-------|----------|
| DISCOVERY-AGENT | Stworzyć 3 skills, odchudzić | -3,000 tok |
| PM-AGENT | Stworzyć 2 skills, odchudzić | -1,200 tok |
| ARCHITECT-AGENT | Stworzyć 2 skills, odchudzić | -800 tok |
| PRODUCT-OWNER | Usunąć duplikat INVEST | -1,500 tok |
| UX-DESIGNER | Stworzyć accessibility skill | -500 tok |
| **Suma Faza 2** | | **-7,000 tok** |

### Łączna Potencjalna Redukcja
| Metryka | Przed | Po |
|---------|-------|-----|
| Łączne tokeny | ~46,000 | ~33,500 |
| Redukcja | - | -12,500 tok |
| Procent redukcji | - | **~27%** |

---

## Rekomendacje Finalne

### Natychmiastowe (Faza 1)
1. Dodać deklaracje `skills.required` i `skills.optional` do wszystkich agentów
2. Usunąć zduplikowaną wiedzę z agentów, która jest już w skills

### Krótkoterminowe (Faza 2)
1. Stworzyć 4 high-priority skills
2. Wyekstrahować wiedzę z DISCOVERY-AGENT (najcięższy)
3. Usunąć duplikat INVEST z PRODUCT-OWNER

### Średnioterminowe
1. Stworzyć pozostałe medium-priority skills
2. Dalsze odchudzanie agentów
3. Walidacja, że agenci działają poprawnie z skills

---

## Następne Kroki

1. [ ] Zatwierdzić plan z userem
2. [ ] Stworzyć brakujące high-priority skills
3. [ ] Dodać frontmatter `skills:` do wszystkich agentów
4. [ ] Przetestować agentów z skills
5. [ ] Iteracyjnie usuwać duplikaty
