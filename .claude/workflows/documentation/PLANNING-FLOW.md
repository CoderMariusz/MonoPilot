# PLANNING-FLOW

> **Version:** 2.0
> **Definition:** @.claude/workflows/definitions/product/planning-flow.yaml
> **Author:** ORCHESTRATOR
> **Updated:** 2025-12-10

---

## Workflow Purpose

PLANNING-FLOW connects DISCOVERY-FLOW outputs to EPIC-WORKFLOW inputs. It handles:

1. **Input consolidation** from discovery and research
2. **PRD creation/update** with measurable outcomes
3. **Architecture design** (technical design only)
4. **UX design** with user flows and wireframes
5. **Epic identification** and dependency mapping
6. **Story preparation** with INVEST validation
7. **Sprint planning** for implementation

---

## When to Use

| Mode | Trigger | Phases | Example |
|------|---------|--------|---------|
| **PORTFOLIO** | New project, major pivot | All 7 phases | Greenfield project |
| **EPIC-SCOPED** | New functionality | Skip: outcomes | Adding payment module |
| **ADJUSTMENT** | Priority changes | Only: context, prioritization, confirmation | Mid-sprint reprioritization |

---

## Flow Diagram

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
│ 1. DISCOVERY  │                    │ 1. DISCOVERY  │                     │ 1. DISCOVERY  │
│   (Context)   │                    │   (Context)   │                     │   (Context)   │
└───────┬───────┘                    └───────┬───────┘                     └───────┬───────┘
        │                                    │                                     │
        ▼                                    │                                     │
┌───────────────┐                            │                                     │
│ 2. PRD        │                            │                                     │
│   (PM-AGENT)  │                            │                                     │
└───────┬───────┘                            │                                     │
        │                                    │                                     │
        ▼                                    ▼                                     │
┌───────────────┐                    ┌───────────────┐                             │
│ 3. ARCHITECTURE                    │ 3. ARCHITECTURE                             │
│ (ARCHITECT)   │                    │ (ARCHITECT)   │                             │
└───────┬───────┘                    └───────┬───────┘                             │
        │                                    │                                     │
        ▼                                    ▼                                     │
┌───────────────┐                    ┌───────────────┐                             │
│ 4. UX DESIGN  │                    │ 4. UX DESIGN  │                             │
│ (UX-DESIGNER) │                    │ (UX-DESIGNER) │                             │
└───────┬───────┘                    └───────┬───────┘                             │
        │                                    │                                     │
        ▼                                    ▼                                     │
┌───────────────┐                    ┌───────────────┐                             │
│ 5. EPIC       │                    │ 5. EPIC       │                             │
│   BREAKDOWN   │                    │   BREAKDOWN   │                             │
└───────┬───────┘                    └───────┬───────┘                             │
        │                                    │                                     │
        ▼                                    ▼                                     ▼
┌───────────────┐                    ┌───────────────┐                     ┌───────────────┐
│ 6. STORY      │                    │ 6. STORY      │                     │ 6. PRIORITI-  │
│   BREAKDOWN   │                    │   BREAKDOWN   │                     │    ZATION     │
└───────┬───────┘                    └───────┬───────┘                     └───────┬───────┘
        │                                    │                                     │
        ▼                                    ▼                                     ▼
┌───────────────┐                    ┌───────────────┐                     ┌───────────────┐
│ 7. SPRINT     │                    │ 7. SPRINT     │                     │ 7. SPRINT     │
│   PLANNING    │                    │   PLANNING    │                     │   PLANNING    │
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

## Phase Details

### Phase 1: DISCOVERY (Context Gathering)

**Agent:** orchestrator

**Purpose:** Collect and validate all inputs needed for planning.

**Inputs:**

| Source | Path | Required |
|--------|------|----------|
| Discovery Output | `docs/0-DISCOVERY/PROJECT-UNDERSTANDING.md` | Yes |
| Research | `docs/0-DISCOVERY/research/*.md` | Optional |
| Existing PRD | `docs/1-BASELINE/product/prd.md` | Optional |
| User Context | {user provided} | Optional |

**Activities:**

1. Validate discovery outputs completeness
2. Identify information gaps
3. Trigger research agents if needed (parallel)
4. Consolidate all inputs

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

**Quality Gate: CONTEXT_READY**

- [ ] Clarity score >= 60%
- [ ] All required inputs available
- [ ] No critical unknowns blocking

---

### Phase 2: PRD (Product Requirements)

**Agent:** pm-agent

**Purpose:** Define measurable outcomes and create/update PRD.

**Activities:**

1. **Define SMART Success Metrics**
   - Specific: What exactly are we measuring?
   - Measurable: How do we measure? What baseline?
   - Achievable: Is it realistic?
   - Relevant: Is it aligned with business goal?
   - Time-bound: By when?

2. **Create/Update PRD**
   - Functional Requirements (FR)
   - Non-Functional Requirements (NFR)
   - Constraints
   - Assumptions

3. **Apply MoSCoW Prioritization**
   - **Must:** Without this, project makes no sense
   - **Should:** Important but can be worked around
   - **Could:** Nice to have
   - **Won't:** Explicit out of scope (important!)

4. **Define Scope Boundaries**
   - IN SCOPE: What we do
   - OUT OF SCOPE: What we do NOT do
   - FUTURE: What we'll consider later

**Template:** `@.claude/templates/prd-template.md`

**Output:**
- `docs/1-BASELINE/product/prd.md`
- `docs/1-BASELINE/product/success-metrics.md`

**Quality Gate: PRD_APPROVED**

- [ ] All requirements have MoSCoW priority
- [ ] Success metrics are SMART
- [ ] Scope explicitly defined (IN/OUT/FUTURE)
- [ ] Min. 3 MUST requirements

---

### Phase 3: ARCHITECTURE (Technical Design Only)

**Agent:** architect-agent

**Purpose:** Create technical architecture and system design. This phase focuses ONLY on technical design decisions, NOT epic breakdown.

**Activities:**

1. **System Overview Design**
   - High-level architecture diagram
   - Component identification
   - Technology stack decisions
   - Integration points

2. **Technical Constraints Analysis**
   - Performance requirements
   - Scalability considerations
   - Security requirements
   - Infrastructure needs

3. **Architecture Decision Records (ADRs)**
   - Document significant technical decisions
   - Capture context, decision, and consequences
   - Track alternatives considered

4. **Technical Risk Assessment**
   - Identify technical risks
   - Propose mitigations
   - Flag unknowns requiring spikes

**Templates:**
- `@.claude/templates/system-overview-template.md`
- `@.claude/templates/adr-template.md`

**Output:**
- `docs/1-BASELINE/architecture/system-overview.md`
- `docs/1-BASELINE/architecture/decisions/ADR-*.md`
- `docs/1-BASELINE/architecture/tech-stack.md`

**Quality Gate: ARCHITECTURE_APPROVED**

- [ ] System overview complete
- [ ] All major technical decisions documented as ADRs
- [ ] Tech stack justified
- [ ] Technical risks identified
- [ ] NFRs addressed in design

---

### Phase 4: UX DESIGN

**Agent:** ux-designer

**Purpose:** Design user experience with full technical context from architecture phase.

**Why After Architecture:** UX design comes AFTER architecture to ensure:
- Technical constraints are understood
- Feasibility of UX proposals is validated
- Integration points are known
- Performance limitations are considered

**Activities:**

1. **User Flow Design**
   - Map user journeys
   - Identify key interactions
   - Define happy paths and error states
   - Align with technical capabilities

2. **Wireframe Creation**
   - Low-fidelity wireframes for key screens
   - Interaction patterns
   - Navigation structure
   - Responsive considerations

3. **Component Specification**
   - UI component library recommendations
   - Interaction patterns
   - Accessibility requirements (WCAG compliance)

4. **UX Validation**
   - Validate against technical constraints
   - Ensure feasibility with architecture
   - Identify UX-driven technical requirements

**Templates:**
- `@.claude/templates/user-flow-template.md`
- `@.claude/templates/wireframe-spec-template.md`

**Output:**
- `docs/1-BASELINE/ux/user-flows.md`
- `docs/1-BASELINE/ux/wireframes/`
- `docs/1-BASELINE/ux/component-spec.md`
- `docs/1-BASELINE/ux/accessibility-requirements.md`

**Quality Gate: UX_APPROVED**

- [ ] All key user flows documented
- [ ] Wireframes for critical screens
- [ ] Technical feasibility validated
- [ ] Accessibility requirements defined
- [ ] UX aligned with architecture constraints

---

### Phase 5: EPIC BREAKDOWN

**Agent:** architect-agent

**Purpose:** Break down requirements into epics with dependency mapping. This is SEPARATE from architecture design.

**Activities:**

#### 5.1 Epic Identification

1. Map PRD requirements to Epics
2. Incorporate UX flows into epic scope
3. Define boundaries for each epic
4. Validate INVEST at epic level

**Template:** `@.claude/templates/epic-template.md`

**Output:** `docs/2-MANAGEMENT/epics/epic-catalog.md`

**Checkpoints:**

- [ ] Each PRD requirement mapped to epic
- [ ] UX flows mapped to relevant epics
- [ ] Epic boundaries are clear
- [ ] No orphan requirements

#### 5.2 Dependency Mapping

1. Identify technical dependencies (from architecture)
2. Identify business dependencies (from PRD)
3. Identify UX dependencies (from user flows)
4. Create dependency graph
5. Identify critical path

**Template:** `@.claude/templates/epic-dependency-graph.md`

**Output:** `docs/2-MANAGEMENT/epics/dependency-graph.md`

```
Dependency Types:
- BLOCKS: A must be before B
- ENHANCES: A works better with B but doesn't require it
- CONFLICTS: A and B cannot run in parallel
```

**Checkpoints:**

- [ ] All dependencies explicit
- [ ] No circular dependencies
- [ ] Critical path identified

#### 5.3 Risk Assessment

1. Consolidate technical risks (from architecture)
2. Identify business risks
3. Identify UX risks
4. Propose mitigations
5. Flag unknowns requiring research

**Template:** `@.claude/templates/risk-registry.md`

**Output:** `docs/2-MANAGEMENT/risks/risk-registry.md`

**Risk Matrix:**

| Probability \ Impact | Low | Medium | High |
|---------------------|-----|--------|------|
| **High** | Medium | High | Critical |
| **Medium** | Low | Medium | High |
| **Low** | Low | Low | Medium |

**Quality Gate: EPICS_DEFINED**

- [ ] All epics identified and cataloged
- [ ] Dependencies mapped completely
- [ ] Risks assessed and mitigations proposed
- [ ] Critical path documented

---

### Phase 6: STORY BREAKDOWN

**Agents:** architect-agent + product-owner

**Purpose:** Break epics into stories with INVEST validation.

#### 6.1 Story Creation (architect-agent)

**Activities:**

1. Break epic into stories
2. Include technical tasks from architecture
3. Include UX implementation tasks
4. Define AC in Given/When/Then format
5. Estimate complexity (S/M/L)

**Template:** `@.claude/templates/story-template.md`

**Output:** `docs/2-MANAGEMENT/epics/epic-{N}-stories.md`

#### 6.2 INVEST Validation (product-owner)

**INVEST Criteria:**

| Letter | Criterion | Control Question |
|--------|-----------|------------------|
| **I** | Independent | Can it be developed without other stories? |
| **N** | Negotiable | Is the HOW flexible? |
| **V** | Valuable | Does it deliver value to user/business? |
| **E** | Estimable | Can it be estimated? |
| **S** | Small | Does it fit in 1-3 sessions? |
| **T** | Testable | Are AC verifiable? |

**Template:** `@.claude/templates/story-checklist-template.md`

**Output:** `docs/2-MANAGEMENT/reviews/invest-review-epic-{N}.md`

**Decision:**
- APPROVED -> Sprint Planning
- NEEDS_REVISION -> Return to Story Creation (max 2 iterations)

#### 6.3 Prioritization (product-owner)

**Scoring Framework:**

| Criterion | Weight | Scale |
|-----------|--------|-------|
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

**Quality Gate: STORIES_READY**

- [ ] Stories are INVEST compliant
- [ ] AC are testable (Given/When/Then)
- [ ] Stories prioritized
- [ ] Estimates assigned

---

### Phase 7: SPRINT PLANNING

**Agent:** orchestrator

**Purpose:** Create sprint plan and prepare for implementation.

#### 7.1 Roadmap Creation

**NOW / NEXT / LATER Framework:**

| Bucket | Horizon | Max Epics | Criteria |
|--------|---------|-----------|----------|
| **NOW** | Current sprint cycle | 2-3 | Highest score, dependencies met |
| **NEXT** | Next 2-3 sprints | 3-5 | High score, some dependencies |
| **LATER** | Backlog | Unlimited | Lower score or blocked |

**Template:** `@.claude/templates/roadmap.md`

**Output:** `docs/2-MANAGEMENT/roadmap.md`

#### 7.2 Sprint Plan

**Activities:**

1. Select stories for sprint
2. Verify capacity
3. Confirm dependencies met
4. Create sprint backlog

**Output:** `docs/2-MANAGEMENT/sprints/sprint-{N}-plan.md`

#### 7.3 Confirmation

**Activities:**

1. Verify all artifacts
2. Confirm stakeholder alignment
3. Prepare handoff to EPIC-WORKFLOW

**Output:** `docs/2-MANAGEMENT/planning-summary.md`

**Planning Summary includes:**

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

**Quality Gate: SPRINT_PLANNED**

- [ ] Sprint backlog defined
- [ ] Capacity verified
- [ ] All dependencies resolved for sprint stories
- [ ] Handoff package complete

**Next Workflow:**
- -> EPIC-WORKFLOW (Phase 2: Story Breakdown) for implementation
- or -> new-project.yaml (scope_validation) for full validation

---

## Quality Gates Summary

```
DISCOVERY ────────────────────────► PRD
         CONTEXT_READY
         ├─ clarity_score >= 60
         └─ no_critical_unknowns

PRD ──────────────────────────────► ARCHITECTURE
         PRD_APPROVED
         ├─ prd_complete
         ├─ requirements_prioritized
         └─ scope_defined

ARCHITECTURE ─────────────────────► UX DESIGN
         ARCHITECTURE_APPROVED
         ├─ system_overview_complete
         ├─ adrs_documented
         └─ tech_stack_justified

UX DESIGN ────────────────────────► EPIC BREAKDOWN
         UX_APPROVED
         ├─ user_flows_documented
         ├─ wireframes_complete
         └─ technical_feasibility_validated

EPIC BREAKDOWN ───────────────────► STORY BREAKDOWN
         EPICS_DEFINED
         ├─ epics_identified
         ├─ dependencies_mapped
         └─ risks_assessed

STORY BREAKDOWN ──────────────────► SPRINT PLANNING
         STORIES_READY
         ├─ stories_invest_compliant
         ├─ ac_testable
         └─ stories_prioritized

SPRINT PLANNING ──────────────────► EPIC-WORKFLOW
         SPRINT_PLANNED
         ├─ sprint_backlog_defined
         └─ handoff_complete
```

---

## Artifacts

| Artifact | Path | Phase |
|----------|------|-------|
| Planning Context | `docs/0-DISCOVERY/planning-context.md` | Discovery |
| PRD | `docs/1-BASELINE/product/prd.md` | PRD |
| Success Metrics | `docs/1-BASELINE/product/success-metrics.md` | PRD |
| System Overview | `docs/1-BASELINE/architecture/system-overview.md` | Architecture |
| ADRs | `docs/1-BASELINE/architecture/decisions/ADR-*.md` | Architecture |
| Tech Stack | `docs/1-BASELINE/architecture/tech-stack.md` | Architecture |
| User Flows | `docs/1-BASELINE/ux/user-flows.md` | UX Design |
| Wireframes | `docs/1-BASELINE/ux/wireframes/` | UX Design |
| Component Spec | `docs/1-BASELINE/ux/component-spec.md` | UX Design |
| Accessibility Reqs | `docs/1-BASELINE/ux/accessibility-requirements.md` | UX Design |
| Epic Catalog | `docs/2-MANAGEMENT/epics/epic-catalog.md` | Epic Breakdown |
| Dependency Graph | `docs/2-MANAGEMENT/epics/dependency-graph.md` | Epic Breakdown |
| Risk Registry | `docs/2-MANAGEMENT/risks/risk-registry.md` | Epic Breakdown |
| Stories | `docs/2-MANAGEMENT/epics/epic-{N}-stories.md` | Story Breakdown |
| INVEST Review | `docs/2-MANAGEMENT/reviews/invest-review-epic-{N}.md` | Story Breakdown |
| Prioritized Backlog | `docs/2-MANAGEMENT/epics/prioritized-backlog.md` | Story Breakdown |
| Roadmap | `docs/2-MANAGEMENT/roadmap.md` | Sprint Planning |
| Sprint Plan | `docs/2-MANAGEMENT/sprints/sprint-{N}-plan.md` | Sprint Planning |
| Planning Summary | `docs/2-MANAGEMENT/planning-summary.md` | Sprint Planning |

---

## Error Recovery

| Error | Action | Message |
|-------|--------|---------|
| Clarity too low | Return to DISCOVERY | "Need more information" |
| PRD incomplete | Return to PRD phase | "PRD missing required elements" |
| Architecture infeasible | Iterate architecture | "Technical constraints require redesign" |
| UX not feasible | Return to UX with architect | "UX proposal exceeds technical constraints" |
| Circular dependency | Escalate to user | "Circular dependency detected" |
| Scope creep | Pause | "Scope expansion detected - confirmation required" |
| INVEST fail x2 | Escalate | "Stories don't meet INVEST after 2 iterations" |

---

## Integration with Other Workflows

### Input: DISCOVERY-FLOW

```
DISCOVERY-FLOW
    │
    ▼
PROJECT-UNDERSTANDING.md ─────► PLANNING-FLOW (Discovery)
```

### Output: EPIC-WORKFLOW

```
PLANNING-FLOW (Sprint Planning)
    │
    ▼
epic-{N}-stories.md ──────────► EPIC-WORKFLOW (Phase 2+)
```

---

## Usage Example

### PORTFOLIO Mode (New Project)

```bash
# Start
ORCHESTRATOR: "Starting PLANNING-FLOW in PORTFOLIO mode"

# Phase 1: DISCOVERY
-> Check docs/0-DISCOVERY/PROJECT-UNDERSTANDING.md
-> Trigger research-agent for technology evaluation
-> Create planning-context.md
-> Gate: CONTEXT_READY

# Phase 2: PRD
-> pm-agent creates PRD with MoSCoW priorities
-> Define SMART success metrics
-> Gate: PRD_APPROVED

# Phase 3: ARCHITECTURE (Technical Design Only)
-> architect-agent creates system-overview.md
-> Documents ADRs for key technical decisions
-> Defines tech stack
-> Gate: ARCHITECTURE_APPROVED

# Phase 4: UX DESIGN (With Technical Context)
-> ux-designer creates user-flows.md
-> Creates wireframes for key screens
-> Validates UX against technical constraints
-> Gate: UX_APPROVED

# Phase 5: EPIC BREAKDOWN (Separate from Architecture)
-> architect-agent identifies 5 epics
-> Maps dependencies (Epic-2 blocks Epic-4)
-> Assesses risks (High: third-party API integration)
-> Gate: EPICS_DEFINED

# Phase 6: STORY BREAKDOWN
-> architect-agent breaks Epic-1 into 6 stories
-> product-owner validates INVEST
-> Prioritizes stories
-> Gate: STORIES_READY

# Phase 7: SPRINT PLANNING
-> Creates roadmap: NOW=[Epic-1, Epic-2], NEXT=[Epic-3, Epic-5], LATER=[Epic-4]
-> Planning summary created
-> Handoff to EPIC-WORKFLOW
-> Gate: SPRINT_PLANNED
```

---

**Related:**
- @.claude/workflows/documentation/DISCOVERY-FLOW.md
- @.claude/workflows/documentation/EPIC-WORKFLOW.md
- @.claude/agents/PM-AGENT.md
- @.claude/agents/ARCHITECT-AGENT.md
- @.claude/agents/UX-DESIGNER.md
- @.claude/agents/PRODUCT-OWNER.md
