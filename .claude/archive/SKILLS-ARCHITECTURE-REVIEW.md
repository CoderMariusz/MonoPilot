# Skills Architecture Review

Data: 2025-01-10

---

## 1. Analiza Istniejącej Infrastruktury

### Odkrycia: Templates vs Patterns vs Checklists vs Skills

```
┌─────────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE HIERARCHY                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TEMPLATES (31 plików)                                           │
│  └─ STRUCTURE: Jak formatować dokumenty                          │
│     └─ prd-template.md → format PRD                              │
│     └─ adr-template.md → format ADR                              │
│     └─ test-template.md → format test strategy                   │
│                                                                  │
│  PATTERNS (11 plików)                                            │
│  └─ PROCESSES: Jak wykonywać zadania                             │
│     └─ GIVEN-WHEN-THEN.md → BDD testing process                  │
│     └─ REACT-PATTERN.md → ReAct reasoning process                │
│     └─ UI-PATTERNS.md → UI design patterns (496 lines!)          │
│                                                                  │
│  CHECKLISTS (5 plików)                                           │
│  └─ VERIFICATION: Co sprawdzić przed oddaniem                    │
│     └─ accessibility.md → a11y checklist                         │
│     └─ security-backend.md → security checklist                  │
│     └─ test-coverage.md → coverage checklist                     │
│                                                                  │
│  SKILLS (35 plików) ← NOWE                                       │
│  └─ KNOWLEDGE: Jak dobrze coś zrobić                             │
│     └─ Patterns + Anti-patterns + Sources                        │
│     └─ Verification checklist                                    │
│     └─ Version + confidence                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Relacja między nimi:

| Typ | Cel | Przykład | Kiedy ładować |
|-----|-----|----------|---------------|
| Template | Format wyjścia | PRD template | Na koniec, przed zapisem |
| Pattern | Proces pracy | Given/When/Then | Na początku zadania |
| Checklist | Weryfikacja | Accessibility | Przed oddaniem |
| **Skill** | Domenowa wiedza | supabase-rls | Przez cały czas pracy |

### Duplikaty i nakładanie się:

| Istniejący plik | Nowy skill | Status |
|-----------------|------------|--------|
| `checklists/accessibility.md` | Brak! | **STWORZYĆ** `accessibility-checklist` skill |
| `checklists/security-backend.md` | Brak! | **STWORZYĆ** `security-backend` skill |
| `patterns/GIVEN-WHEN-THEN.md` | `testing-tdd-workflow` | ✅ Częściowo pokryty |
| `patterns/UI-PATTERNS.md` | Brak! | **STWORZYĆ** `ui-patterns` skill |

---

## 2. Code Review: Nowe Agenty

### 2.1 SKILL-CREATOR

**Lokalizacja:** `.claude/agents/skills/SKILL-CREATOR.md`
**Tokeny:** ~550

#### ✅ Co jest dobre:
- Jasny workflow (Research → Draft → Size Check → Register)
- Template struktury skill dobrze zdefiniowany
- Confidence levels wyjaśnione
- Quality gates przed zakończeniem

#### ⚠️ Issues do poprawy:

| Issue | Severity | Rekomendacja |
|-------|----------|--------------|
| Brak `skills:` w frontmatter | Medium | Dodać - czy powinien używać własnych skills? |
| Handoff do VALIDATOR niejasny | Medium | Dodać konkretny format handoff |
| Brak Error Recovery | Low | Dodać sekcję co robić gdy research nie daje wyników |
| Brak wsparcia dla Domain/Project skills | High | Dodać workflow dla różnych typów skills |

#### Sugerowane poprawki:

```yaml
# Dodać do frontmatter:
skills:
  required: []
  optional: [documentation-patterns]  # dla formatowania
```

```markdown
# Dodać sekcję:
## Skill Types

### Generic Skills
- Lokalizacja: `.claude/skills/generic/`
- Przykład: `typescript-patterns`, `api-rest-design`
- Trigger: Potrzebna wiedza techniczna niezależna od projektu

### Domain Skills
- Lokalizacja: `.claude/skills/domain/`
- Przykład: `fintech-compliance`, `healthcare-hipaa`
- Trigger: Potrzebna wiedza specyficzna dla branży

### Project Skills
- Lokalizacja: `.claude/skills/project/`
- Przykład: `project-auth-patterns`, `project-db-schema`
- Trigger: Potrzebna wiedza specyficzna dla tego projektu
- Źródło: Analiza kodu projektu, dokumentacja
```

---

### 2.2 SKILL-VALIDATOR

**Lokalizacja:** `.claude/agents/skills/SKILL-VALIDATOR.md`
**Tokeny:** ~630

#### ✅ Co jest dobre:
- Jasne verdict types (VALID, MINOR_UPDATE, etc.)
- Dobra validation checklist
- Output format z REGISTRY update
- Review cycle integration

#### ⚠️ Issues do poprawy:

| Issue | Severity | Rekomendacja |
|-------|----------|--------------|
| Brak `skills:` w frontmatter | Medium | Paradoks: waliduje skills ale nie ma własnych |
| Brak konkretnego triggera dla review cycle | High | Jak wykryć `next_review <= TODAY`? |
| Freshness check wymaga WebSearch | Medium | Upewnić się że ma dostęp |
| Brak wsparcia dla dokumentacji projektu | High | Dodać workflow dla project skills |

#### Nowa funkcjonalność do dodania:

```markdown
## Project Documentation Analysis

Gdy wgrywany do istniejącego projektu:

### Step 1: Scan Project
1. Glob for documentation files (*.md, README*, docs/)
2. Glob for architecture files (*.yaml, *.json configs)
3. Glob for code patterns (src/**/*)

### Step 2: Extract Knowledge Candidates
For each significant pattern found:
1. Identify pattern type (API, DB, UI, etc.)
2. Check if generic skill exists
3. If no → suggest as project skill candidate

### Step 3: Generate Skill Recommendations
Output:
- Suggested project skills
- Suggested domain skills
- Existing generic skills to use
```

---

### 2.3 TEST-WRITER

**Lokalizacja:** `.claude/agents/development/TEST-WRITER.md`
**Tokeny:** ~850

#### ✅ Co jest dobre:
- **Ma `skills:` w frontmatter!** ✅
- Jasna pozycja w TDD workflow
- Dobre templates (Unit, React, API)
- Quality gates przed handoff
- Clear output format

#### ⚠️ Issues do poprawy:

| Issue | Severity | Rekomendacja |
|-------|----------|--------------|
| Optional skills mogą nie istnieć | Low | Wszystkie istnieją ✅ |
| Brak wsparcia dla E2E/Playwright template | Medium | Jest w optional skills |
| Brak MSW template | Low | Jest w optional skills |

#### Verdict: **APPROVED** ✅

TEST-WRITER jest najlepiej zdefiniowany z trzech nowych agentów.

---

## 3. Schedule Review Plan

### Proponowany cykl review skills:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SKILL REVIEW CYCLE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DAILY: Automatic check                                          │
│  └─ Scan REGISTRY.yaml for next_review <= TODAY                  │
│  └─ Queue skills for validation                                  │
│                                                                  │
│  WEEKLY: Batch validation                                        │
│  └─ Validate queued skills                                       │
│  └─ Update REGISTRY with verdicts                                │
│  └─ Notify about MAJOR_UPDATE needs                              │
│                                                                  │
│  BI-WEEKLY (14 days): Default review cycle                       │
│  └─ Each skill reviewed every 14 days                            │
│  └─ Can extend to 30 days for stable skills                      │
│                                                                  │
│  ON DEMAND: Triggered events                                     │
│  └─ New skill created → immediate validation                     │
│  └─ Source URL changes detected                                  │
│  └─ User reports issue                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Review Schedule Implementation:

```yaml
# .claude/config/skill-review-schedule.yaml

review_cycles:
  default: 14  # days
  stable: 30   # for high-confidence skills
  new: 7       # for low-confidence skills

triggers:
  - type: date_check
    condition: "next_review <= TODAY"
    action: queue_for_validation

  - type: source_change
    condition: "WebFetch shows different content"
    action: immediate_validation

  - type: user_report
    condition: "User reports skill issue"
    action: immediate_validation

priority_order:
  1: INVALID skills (block immediately)
  2: DEPRECATED check
  3: MAJOR_UPDATE needed
  4: MINOR_UPDATE needed
  5: Regular review
```

---

## 4. Skills potrzebne dla SKILL-VALIDATOR

### Analiza:

SKILL-VALIDATOR obecnie nie ma żadnych skills, ale powinien mieć:

```yaml
# Rekomendowane:
skills:
  required:
    - documentation-patterns  # do oceny jakości skill docs
  optional:
    - typescript-patterns     # do walidacji TS code examples
    - api-rest-design         # do walidacji API patterns
    - react-hooks             # do walidacji React patterns
```

### Ale czy to ma sens?

**Paradoks:** SKILL-VALIDATOR waliduje skills, ale sam potrzebuje skills do walidacji.

**Rozwiązanie:** SKILL-VALIDATOR jest meta-agentem i:
1. Powinien mieć dostęp do WSZYSTKICH skills (read-only)
2. Nie deklaruje required skills - ładuje dynamicznie w zależności od walidowanego skill

```yaml
# Alternatywna propozycja:
skills:
  required: []
  dynamic: true  # nowy typ - ładuj skills potrzebne do walidacji aktualnego skill
```

---

## 5. SKILL-CREATOR vs SKILL-VALIDATOR Workflow

### Pytanie: Jak współpracują?

```
┌─────────────────────────────────────────────────────────────────┐
│                    SKILL LIFECYCLE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CREATION                                                     │
│  ┌────────────────────────────────────────┐                      │
│  │ SKILL-CREATOR                          │                      │
│  │ ├─ Research (WebSearch, WebFetch)      │                      │
│  │ ├─ Draft skill file                    │                      │
│  │ ├─ Add to REGISTRY (status: draft)     │                      │
│  │ └─ Request validation                  │                      │
│  └────────────────────────────────────────┘                      │
│                     │                                            │
│                     ▼                                            │
│  2. VALIDATION                                                   │
│  ┌────────────────────────────────────────┐                      │
│  │ SKILL-VALIDATOR                        │                      │
│  │ ├─ Verify sources                      │                      │
│  │ ├─ Check code examples                 │                      │
│  │ ├─ Audit size                          │                      │
│  │ └─ Issue verdict                       │                      │
│  └────────────────────────────────────────┘                      │
│                     │                                            │
│                     ▼                                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ VERDICT ROUTING                                              │ │
│  │                                                              │ │
│  │ VALID       → REGISTRY: status=active, schedule next review │ │
│  │ MINOR_UPDATE → SKILL-CREATOR: quick fix                     │ │
│  │ MAJOR_UPDATE → SKILL-CREATOR: rewrite                       │ │
│  │ DEPRECATED   → Archive, remove from active use              │ │
│  │ INVALID      → Block, notify user                           │ │
│  │                                                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Nowy Use Case: Project Onboarding

Gdy wgrywamy agentów do istniejącego projektu:

```
┌─────────────────────────────────────────────────────────────────┐
│                PROJECT ONBOARDING WORKFLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. DOC-AUDITOR (lub DISCOVERY-AGENT)                            │
│  └─ Skanuje projekt                                              │
│  └─ Identyfikuje dokumentację, architekturę, patterns           │
│  └─ Output: PROJECT-UNDERSTANDING.md                             │
│                                                                  │
│  2. SKILL-VALIDATOR (nowa funkcja!)                              │
│  └─ Analizuje PROJECT-UNDERSTANDING.md                           │
│  └─ Identyfikuje:                                                │
│     ├─ Które generic skills pasują                               │
│     ├─ Jakie domain skills potrzebne                             │
│     └─ Jakie project skills trzeba stworzyć                      │
│  └─ Output: SKILL-RECOMMENDATIONS.md                             │
│                                                                  │
│  3. SKILL-CREATOR (dla project skills)                           │
│  └─ Tworzy project-specific skills:                              │
│     ├─ project-auth-patterns.md                                  │
│     ├─ project-db-schema.md                                      │
│     └─ project-api-conventions.md                                │
│                                                                  │
│  4. Wynik                                                        │
│  └─ Projekt ma:                                                  │
│     ├─ Generic skills (reused)                                   │
│     ├─ Domain skills (if applicable)                             │
│     └─ Project skills (generated)                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Pytanie: 4 skills naraz vs mniejsze zadania?

### Analiza context window:

```
Założenia:
- Context window: ~200K tokens
- Skill: 400-1000 tokens (target)
- Max skill: 1500 tokens
- 4 skills: 4000-6000 tokens

Porównanie:
┌─────────────────────────────────────────────────────────────────┐
│ Komponent              │ Tokeny    │ % Context                  │
├─────────────────────────────────────────────────────────────────┤
│ Agent definition       │ ~1,500    │ 0.75%                      │
│ 4 skills (max)         │ ~6,000    │ 3.0%                       │
│ Code context           │ ~50,000   │ 25%                        │
│ Conversation history   │ ~100,000  │ 50%                        │
│ Pozostałe              │ ~42,500   │ 21.25%                     │
├─────────────────────────────────────────────────────────────────┤
│ RAZEM                  │ 200,000   │ 100%                       │
└─────────────────────────────────────────────────────────────────┘
```

### Wnioski:

**4 skills to OK** - zajmują tylko ~3% context window.

Ale:
1. **Więcej skills = więcej szumu** - agent może się "zgubić"
2. **Mniejsze zadania = lepsza jakość** - agent skupia się na jednym celu
3. **Skills powinny być ładowane ON DEMAND** - nie wszystkie naraz

### Rekomendacja:

```yaml
skill_loading_strategy:
  max_skills_per_task: 4
  loading_order:
    1: required skills (always)
    2: optional skills (on demand, as needed)

  task_size:
    small: "1-2 skills sufficient"
    medium: "2-3 skills optimal"
    large: "3-4 skills max, consider splitting task"
```

**Odpowiedź:** Lepiej robić mniejsze zadania z 2-3 skills niż duże z 4+. Nie chodzi o błędy techniczne, ale o jakość output - agent lepiej pracuje gdy jest sfokusowany.

---

## 7. Brakujące Skills do Stworzenia

### High Priority (z istniejących plików):

| Skill Name | Źródło | Typ |
|------------|--------|-----|
| `accessibility-checklist` | `checklists/accessibility.md` | Generic |
| `security-backend-checklist` | `checklists/security-backend.md` | Generic |
| `ui-ux-patterns` | `patterns/UI-PATTERNS.md` | Generic |

### Medium Priority (z deep review agentów):

| Skill Name | Źródło | Typ |
|------------|--------|-----|
| `invest-stories` | ARCHITECT, PRODUCT-OWNER | Generic |
| `discovery-interview-patterns` | DISCOVERY-AGENT | Generic |
| `prd-structure` | PM-AGENT | Generic |
| `architecture-adr` | ARCHITECT-AGENT | Generic |

### Low Priority:

| Skill Name | Źródło | Typ |
|------------|--------|-----|
| `qa-bug-reporting` | QA-AGENT | Generic |
| `agile-retrospective` | SCRUM-MASTER | Generic |
| `research-source-evaluation` | RESEARCH-AGENT | Generic |

---

## 8. Action Items

### Natychmiastowe:
1. [ ] Stworzyć `accessibility-checklist` skill z `checklists/accessibility.md`
2. [ ] Stworzyć `security-backend-checklist` skill z `checklists/security-backend.md`
3. [ ] Dodać Project Onboarding workflow do SKILL-VALIDATOR
4. [ ] Dodać Skill Types sekcję do SKILL-CREATOR

### Krótkoterminowe:
1. [ ] Stworzyć pozostałe high-priority skills
2. [ ] Dodać `skills:` frontmatter do wszystkich agentów
3. [ ] Stworzyć `.claude/config/skill-review-schedule.yaml`

### Długoterminowe:
1. [ ] Automatyczny review cycle (CI/CD)
2. [ ] Dashboard skills health
3. [ ] Skill usage analytics
