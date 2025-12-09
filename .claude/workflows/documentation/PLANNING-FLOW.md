# PLANNING-FLOW

> **Wersja:** 1.0
> **Definicja:** @.claude/workflows/definitions/product/planning-flow.yaml
> **Autor:** ORCHESTRATOR
> **Aktualizacja:** 2025-12-08

---

## Cel Workflow

PLANNING-FLOW łączy output z DISCOVERY-FLOW z wejściem do EPIC-WORKFLOW. Odpowiada za:

1. **Konsolidację inputów** z discovery i research
2. **Tworzenie/aktualizację PRD** z mierzalnymi outcomes
3. **Identyfikację epików** i mapowanie zależności
4. **Priorytetyzację** i tworzenie roadmapy NOW/NEXT/LATER
5. **Przygotowanie stories** do sprint intake

---

## Kiedy Używać

| Tryb | Trigger | Fazy | Przykład |
|------|---------|------|----------|
| **PORTFOLIO** | Nowy projekt, duży pivot | Wszystkie 6 | Greenfield project |
| **EPIC-SCOPED** | Nowa funkcjonalność | Skip: outcomes | Dodanie modułu płatności |
| **ADJUSTMENT** | Zmiana priorytetów | Tylko: context, prioritization, confirmation | Mid-sprint reprioritization |

---

## Diagram Przepływu

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │                     PLANNING-FLOW                            │
                    └─────────────────────────────────────────────────────────────┘
                                              │
        ┌─────────────────────────────────────┼─────────────────────────────────────┐
        │                                     │                                     │
        ▼                                     ▼                                     ▼
   ┌─────────┐                          ┌─────────┐                           ┌─────────┐
   │PORTFOLIO│                          │  EPIC   │                           │ADJUSTMENT│
   │  MODE   │                          │ SCOPED  │                           │  MODE   │
   └────┬────┘                          └────┬────┘                           └────┬────┘
        │                                    │                                     │
        ▼                                    ▼                                     ▼
┌───────────────┐                    ┌───────────────┐                     ┌───────────────┐
│ 1. CONTEXT    │                    │ 1. CONTEXT    │                     │ 1. CONTEXT    │
│   Gathering   │                    │   Gathering   │                     │   Gathering   │
└───────┬───────┘                    └───────┬───────┘                     └───────┬───────┘
        │                                    │                                     │
        ▼                                    │                                     │
┌───────────────┐                            │                                     │
│ 2. OUTCOMES   │                            │                                     │
│   & PRD       │                            │                                     │
└───────┬───────┘                            │                                     │
        │                                    │                                     │
        ▼                                    ▼                                     │
┌───────────────┐                    ┌───────────────┐                             │
│ 3. EPIC       │                    │ 3. EPIC       │                             │
│  DISCOVERY    │                    │  DISCOVERY    │                             │
└───────┬───────┘                    └───────┬───────┘                             │
        │                                    │                                     │
        ▼                                    ▼                                     ▼
┌───────────────┐                    ┌───────────────┐                     ┌───────────────┐
│ 4. PRIORITI-  │                    │ 4. PRIORITI-  │                     │ 4. PRIORITI-  │
│    ZATION     │                    │    ZATION     │                     │    ZATION     │
└───────┬───────┘                    └───────┬───────┘                     └───────┬───────┘
        │                                    │                                     │
        ▼                                    │                                     │
┌───────────────┐                            │                                     │
│ 5. SPRINT     │                            │                                     │
│   INTAKE      │                            │                                     │
└───────┬───────┘                            │                                     │
        │                                    │                                     │
        ▼                                    ▼                                     ▼
┌───────────────┐                    ┌───────────────┐                     ┌───────────────┐
│ 6. CONFIR-    │                    │ 6. CONFIR-    │                     │ 6. CONFIR-    │
│   MATION      │                    │   MATION      │                     │   MATION      │
└───────┬───────┘                    └───────┬───────┘                     └───────┬───────┘
        │                                    │                                     │
        └────────────────────────────────────┼─────────────────────────────────────┘
                                             │
                                             ▼
                                    ┌───────────────┐
                                    │ EPIC-WORKFLOW │
                                    │  (Phase 2+)   │
                                    └───────────────┘
```

---

## Fazy Szczegółowo

### Faza 1: CONTEXT GATHERING

**Agent:** ORCHESTRATOR

**Cel:** Zebranie i walidacja wszystkich inputów potrzebnych do planowania.

**Inputy:**

| Źródło | Ścieżka | Wymagane |
|--------|---------|----------|
| Discovery Output | `docs/0-DISCOVERY/PROJECT-UNDERSTANDING.md` | Tak |
| Research | `docs/0-DISCOVERY/research/*.md` | Opcjonalne |
| Existing PRD | `docs/1-BASELINE/product/prd.md` | Opcjonalne |
| User Context | {user provided} | Opcjonalne |

**Aktywności:**

1. Walidacja completeness discovery outputs
2. Identyfikacja luk informacyjnych
3. Trigger research agents jeśli potrzebne (parallel)
4. Konsolidacja wszystkich inputów

**Research Triggers:**

```yaml
parallel_research:
  - trigger: technology_unknown
    agent: research-agent
    type: tech_evaluation

  - trigger: market_gap
    agent: research-agent
    type: market_analysis

  - trigger: competitor_analysis_needed
    agent: research-agent
    type: competitor_research
```

**Output:** `docs/0-DISCOVERY/planning-context.md`

**Quality Gate:**

- [ ] Clarity score >= 60%
- [ ] Wszystkie wymagane inputy dostępne
- [ ] Brak krytycznych unknowns blokujących

---

### Faza 2: OUTCOMES & PRD

**Agent:** PM-AGENT

**Cel:** Zdefiniowanie mierzalnych outcomes i stworzenie/aktualizacja PRD.

**Aktywności:**

1. **Define SMART Success Metrics**
   - Specific: Co konkretnie mierzymy?
   - Measurable: Jak mierzymy? Jaka baseline?
   - Achievable: Czy realistyczne?
   - Relevant: Czy aligned z business goal?
   - Time-bound: Do kiedy?

2. **Create/Update PRD**
   - Functional Requirements (FR)
   - Non-Functional Requirements (NFR)
   - Constraints
   - Assumptions

3. **Apply MoSCoW Prioritization**
   - **Must:** Bez tego project nie ma sensu
   - **Should:** Ważne, ale można obejść
   - **Could:** Nice to have
   - **Won't:** Explicit out of scope (ważne!)

4. **Define Scope Boundaries**
   - IN SCOPE: Co robimy
   - OUT OF SCOPE: Czego NIE robimy
   - FUTURE: Co rozważymy później

**Template:** `@.claude/templates/prd-template.md`

**Output:**
- `docs/1-BASELINE/product/prd.md`
- `docs/1-BASELINE/product/success-metrics.md`

**Quality Gate:**

- [ ] Wszystkie requirements mają priorytet MoSCoW
- [ ] Success metrics są SMART
- [ ] Scope explicitly defined (IN/OUT/FUTURE)
- [ ] Min. 3 MUST requirements

---

### Faza 3: EPIC DISCOVERY

**Agent:** ARCHITECT-AGENT

**Cel:** Identyfikacja epików, mapowanie zależności, ocena ryzyka.

#### 3.1 Epic Identification

**Aktywności:**

1. Mapowanie PRD requirements → Epics
2. Definiowanie granic każdego epicu
3. Walidacja INVEST na poziomie epicu

**Template:** `@.claude/templates/epic-template.md`

**Output:** `docs/2-MANAGEMENT/epics/epic-catalog.md`

**Checkpoints:**

- [ ] Każdy PRD requirement zmapowany do epicu
- [ ] Granice epiców są jasne
- [ ] Brak orphan requirements

#### 3.2 Dependency Mapping

**Aktywności:**

1. Identyfikacja zależności technicznych
2. Identyfikacja zależności biznesowych
3. Stworzenie dependency graph
4. Identyfikacja critical path

**Template:** `@.claude/templates/epic-dependency-graph.md`

**Output:** `docs/2-MANAGEMENT/epics/dependency-graph.md`

```
Dependency Types:
- BLOCKS: A musi być przed B
- ENHANCES: A lepiej działa z B, ale nie wymaga
- CONFLICTS: A i B nie mogą być równolegle
```

**Checkpoints:**

- [ ] Wszystkie zależności explicit
- [ ] Brak circular dependencies
- [ ] Critical path zidentyfikowany

#### 3.3 Risk Assessment

**Aktywności:**

1. Identyfikacja ryzyk technicznych
2. Identyfikacja ryzyk biznesowych
3. Propozycje mitygacji
4. Flagowanie unknowns wymagających research

**Template:** `@.claude/templates/risk-registry.md`

**Output:** `docs/2-MANAGEMENT/risks/risk-registry.md`

**Risk Matrix:**

| Prawdopodobieństwo \ Wpływ | Low | Medium | High |
|---------------------------|-----|--------|------|
| **High** | 🟡 | 🟠 | 🔴 |
| **Medium** | 🟢 | 🟡 | 🟠 |
| **Low** | 🟢 | 🟢 | 🟡 |

---

### Faza 4: PRIORITIZATION

**Agent:** PRODUCT-OWNER

**Cel:** Priorytetyzacja epików i stworzenie roadmapy.

#### 4.1 Value Scoring

**Scoring Framework:**

| Kryterium | Waga | Skala |
|-----------|------|-------|
| Business Value | 30% | 1-5 |
| User Impact | 25% | 1-5 |
| Technical Risk | 20% | 1-5 (inverse) |
| Dependency Weight | 15% | 0-3 |
| Strategic Alignment | 10% | 1-5 |

**Formula:**

```
Score = (BV * 0.30) + (UI * 0.25) + ((6-TR) * 0.20) + ((4-DW) * 0.15) + (SA * 0.10)
```

**Output:** `docs/2-MANAGEMENT/epics/prioritized-backlog.md`

#### 4.2 Roadmap Creation

**NOW / NEXT / LATER Framework:**

| Bucket | Horizon | Max Epics | Criteria |
|--------|---------|-----------|----------|
| **NOW** | Current sprint cycle | 2-3 | Highest score, dependencies met |
| **NEXT** | Next 2-3 sprints | 3-5 | High score, some dependencies |
| **LATER** | Backlog | Unlimited | Lower score or blocked |

**Template:** `@.claude/templates/roadmap.md`

**Output:** `docs/2-MANAGEMENT/roadmap.md`

**Checkpoints:**

- [ ] NOW bucket ma max 2-3 epiki
- [ ] Zależności respektowane w sequencing
- [ ] Jasne milestone definitions

---

### Faza 5: SPRINT INTAKE

**Agents:** ARCHITECT-AGENT + PRODUCT-OWNER

**Cel:** Przygotowanie pierwszych epików do sprint planning.

#### 5.1 Story Breakdown (ARCHITECT-AGENT)

**Aktywności:**

1. Rozbicie epiku na stories
2. Zastosowanie INVEST
3. Zdefiniowanie AC w Given/When/Then
4. Estymacja complexity (S/M/L)

**Template:** `@.claude/templates/story-template.md`

**Output:** `docs/2-MANAGEMENT/epics/epic-{N}-stories.md`

#### 5.2 INVEST Validation (PRODUCT-OWNER)

**INVEST Criteria:**

| Litera | Kryterium | Pytanie kontrolne |
|--------|-----------|-------------------|
| **I** | Independent | Czy można rozwijać bez innych stories? |
| **N** | Negotiable | Czy HOW jest elastyczne? |
| **V** | Valuable | Czy dostarcza wartość userowi/biznesowi? |
| **E** | Estimable | Czy można oszacować? |
| **S** | Small | Czy mieści się w 1-3 sesjach? |
| **T** | Testable | Czy AC są weryfikowalne? |

**Template:** `@.claude/templates/story-checklist-template.md`

**Output:** `docs/2-MANAGEMENT/reviews/invest-review-epic-{N}.md`

**Decision:**
- ✅ APPROVED → Confirmation
- ⚠️ NEEDS_REVISION → Return to Story Breakdown (max 2 iterations)

---

### Faza 6: CONFIRMATION

**Agent:** ORCHESTRATOR

**Cel:** Finalna weryfikacja i handoff do EPIC-WORKFLOW.

**Aktywności:**

1. Weryfikacja wszystkich artefaktów
2. Potwierdzenie alignment ze stakeholderami
3. Przygotowanie handoff

**Output:** `docs/2-MANAGEMENT/planning-summary.md`

**Planning Summary zawiera:**

```markdown
## Planning Summary

### Roadmap Overview
- NOW: [Epic-1, Epic-2]
- NEXT: [Epic-3, Epic-4, Epic-5]
- LATER: [Epic-6, ...]

### First Sprint Candidates
| Story | Epic | Complexity | Dependencies |
|-------|------|------------|--------------|
| 1.1 | Epic-1 | S | None |
| 1.2 | Epic-1 | M | 1.1 |

### Key Risks
1. [Risk 1] - Mitigation: [plan]
2. [Risk 2] - Mitigation: [plan]

### Open Questions
- [ ] [Question for user]
```

**Next Workflow:**
- → EPIC-WORKFLOW (Phase 2: Story Breakdown) dla implementacji
- lub → new-project.yaml (scope_validation) dla full validation

---

## Quality Gates Między Fazami

```
CONTEXT ──────────────────────► OUTCOMES
         ├─ clarity_score >= 60
         └─ no_critical_unknowns

OUTCOMES ─────────────────────► EPIC DISCOVERY
         ├─ prd_complete
         ├─ requirements_prioritized
         └─ scope_defined

EPIC DISCOVERY ───────────────► PRIORITIZATION
         ├─ epics_identified
         ├─ dependencies_mapped
         └─ risks_assessed

PRIORITIZATION ───────────────► SPRINT INTAKE
         ├─ roadmap_created
         └─ now_bucket_defined

SPRINT INTAKE ────────────────► CONFIRMATION
         ├─ stories_invest_compliant
         └─ ac_testable
```

---

## Artefakty

| Artefakt | Ścieżka | Faza |
|----------|---------|------|
| Planning Context | `docs/0-DISCOVERY/planning-context.md` | Context |
| PRD | `docs/1-BASELINE/product/prd.md` | Outcomes |
| Success Metrics | `docs/1-BASELINE/product/success-metrics.md` | Outcomes |
| Epic Catalog | `docs/2-MANAGEMENT/epics/epic-catalog.md` | Epic Discovery |
| Dependency Graph | `docs/2-MANAGEMENT/epics/dependency-graph.md` | Epic Discovery |
| Risk Registry | `docs/2-MANAGEMENT/risks/risk-registry.md` | Epic Discovery |
| Prioritized Backlog | `docs/2-MANAGEMENT/epics/prioritized-backlog.md` | Prioritization |
| Roadmap | `docs/2-MANAGEMENT/roadmap.md` | Prioritization |
| Stories | `docs/2-MANAGEMENT/epics/epic-{N}-stories.md` | Sprint Intake |
| INVEST Review | `docs/2-MANAGEMENT/reviews/invest-review-epic-{N}.md` | Sprint Intake |
| Planning Summary | `docs/2-MANAGEMENT/planning-summary.md` | Confirmation |

---

## Error Recovery

| Błąd | Akcja | Komunikat |
|------|-------|-----------|
| Clarity za niska | Return to DISCOVERY | "Potrzeba więcej informacji" |
| Circular dependency | Escalate to user | "Wykryto cykliczną zależność" |
| Scope creep | Pause | "Wykryto rozszerzenie scope - potwierdzenie wymagane" |
| INVEST fail x2 | Escalate | "Stories nie spełniają INVEST po 2 iteracjach" |

---

## Połączenie z Innymi Workflows

### Input: DISCOVERY-FLOW

```
DISCOVERY-FLOW
    │
    ▼
PROJECT-UNDERSTANDING.md ─────► PLANNING-FLOW (Context)
```

### Output: EPIC-WORKFLOW

```
PLANNING-FLOW (Confirmation)
    │
    ▼
epic-{N}-stories.md ──────────► EPIC-WORKFLOW (Phase 2+)
```

---

## Przykład Użycia

### Tryb PORTFOLIO (Nowy Projekt)

```bash
# Start
ORCHESTRATOR: "Starting PLANNING-FLOW in PORTFOLIO mode"

# Phase 1
→ Check docs/0-DISCOVERY/PROJECT-UNDERSTANDING.md
→ Trigger research-agent for technology evaluation
→ Create planning-context.md

# Phase 2
→ PM-AGENT creates PRD with MoSCoW priorities
→ Define SMART success metrics

# Phase 3
→ ARCHITECT-AGENT identifies 5 epics
→ Maps dependencies (Epic-2 blocks Epic-4)
→ Assesses risks (High: third-party API integration)

# Phase 4
→ PRODUCT-OWNER scores epics
→ Creates roadmap: NOW=[Epic-1, Epic-2], NEXT=[Epic-3, Epic-5], LATER=[Epic-4]

# Phase 5
→ ARCHITECT-AGENT breaks Epic-1 into 6 stories
→ PRODUCT-OWNER validates INVEST

# Phase 6
→ Planning summary created
→ Handoff to EPIC-WORKFLOW
```

---

**Powiązane:**
- @.claude/workflows/documentation/DISCOVERY-FLOW.md
- @.claude/workflows/documentation/EPIC-WORKFLOW.md
- @.claude/agents/PM-AGENT.md
- @.claude/agents/ARCHITECT-AGENT.md
- @.claude/agents/PRODUCT-OWNER.md
