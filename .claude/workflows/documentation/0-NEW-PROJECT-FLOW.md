# 0-NEW-PROJECT-FLOW

**Documentation for:** `.claude/workflows/definitions/product/new-project.yaml`

**Part of:** [0-WORKFLOW-MASTER-MAP.md](./0-WORKFLOW-MASTER-MAP.md) - Product Workflow Track

## Purpose

Complete workflow for new project initialization - from idea to sprint-ready state. Takes a project from initial concept through discovery, requirements, architecture, UX design, epic breakdown, and story creation until Sprint 1 is ready to begin.

## When to Use

Trigger this workflow when:
- `new_project` - Starting a completely new greenfield project
- `major_feature` - Adding a major feature that requires full analysis
- `greenfield` - Building something from scratch

## Duration & Parallelization

- **Expected Duration:** Multiple sessions across days/weeks
- **Parallelization:** Limited due to sequential dependencies (Architecture → UX → Epics → Stories)
- **Exception:** Step 5 (Epic Breakdown) runs ARCHITECT and TEST-ENGINEER in parallel

## Flow Overview (ASCII)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         NEW PROJECT WORKFLOW                         │
│                    (Sequential with 1 Parallel Step)                 │
└─────────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │   1. DISCOVERY   │  85% clarity threshold (raised from 70%)
    │  DISCOVERY-AGENT │  Deep business logic interview
    │                  │  Clarify entities, validations, workflows
    └────────┬─────────┘
             │ Gate: DISCOVERY_COMPLETE (clarity >= 85%)
             │ [commit: 🔍 discovery complete]
             ▼
    ┌──────────────────┐
    │  2. PRD CREATION │  Clarification loop with USER
    │    PM-AGENT      │  Verify assumptions, identify gaps
    │                  │  USER must confirm understanding
    └────────┬─────────┘
             │ Gate: PRD_APPROVED (USER confirmed)
             │ [commit: 📋 prd complete]
             ▼
    ┌──────────────────┐
    │ 3. ARCHITECTURE  │  Technical design only (no epics yet!)
    │ ARCHITECT-AGENT  │  System overview, tech stack, ADRs
    │                  │  Define technical constraints
    └────────┬─────────┘
             │ Gate: ARCHITECTURE_APPROVED
             │ [commit: 🏗️ architecture complete - N ADRs]
             ▼
    ┌──────────────────┐
    │  4. UX DESIGN    │  CRITICAL: USER APPROVAL REQUIRED
    │   UX-DESIGNER    │  User flows, wireframes, interactions
    │                  │  User must approve each screen OR opt for auto-approve
    └────────┬─────────┘
             │ Gate: UX_APPROVED (USER approval)
             │ [commit: 🎨 ux approved]
             ▼
    ┌──────────────────────────────────────────────────┐
    │         5. EPIC BREAKDOWN (PARALLEL)             │
    │  ┌──────────────────┐  ┌──────────────────┐     │
    │  │  5A. ARCHITECT   │  │ 5B. TEST-ENGINEER│     │
    │  │  Epic Structure  │  │  Test Strategy   │     │
    │  │  Clarifications  │  │  Scenarios       │     │
    │  │  Dependencies    │  │  Naming          │     │
    │  │  Risk Registry   │  │  File Structure  │     │
    │  └──────────────────┘  └──────────────────┘     │
    └──────────────────┬───────────────────────────────┘
             │ Gate: EPICS_DEFINED (structure + test strategy + clarifications)
             │ [commit: 📦 epics defined - N epics with test strategies]
             ▼
    ┌──────────────────┐
    │ 6. STORY BREAKDOWN│  Break NOW epics into INVEST stories
    │ ARCHITECT-AGENT  │  Hierarchical naming: {XX}.{N}.{slug}
    │                  │  Acceptance criteria in Given/When/Then
    └────────┬─────────┘
             │ Gate: STORIES_CREATED (INVEST compliant)
             │ [commit: 📝 stories ready - N stories INVEST validated]
             ▼
    ┌──────────────────┐
    │ 7. SCOPE VALIDATION│  PRODUCT-OWNER validates INVEST compliance
    │  PRODUCT-OWNER   │  No scope creep, testable AC
    │                  │  UX alignment verified
    └────────┬─────────┘
             │ Gate: STORIES_READY (all stories sprint-ready)
             │ [commit: ✅ scope validated]
             ▼
    ┌──────────────────┐
    │ 8. SPRINT PLANNING│  Plan first sprint
    │  SCRUM-MASTER    │  Respect capacity, dependencies
    │                  │  Define sprint goal
    └────────┬─────────┘
             │ Gate: SPRINT_PLANNED
             │ [commit: 🏃 sprint 1 planned - project ready]
             ▼
    ┌──────────────────┐
    │ 9. HANDOFF TO    │  MANDATORY: Determine execution path
    │    EXECUTION     │  Single vs Multi-Epic decision
    │  ORCHESTRATOR    │  Set next workflow
    └────────┬─────────┘
             │ Gate: HANDOFF_READY
             │ [commit: 🚀 handoff complete - ready for execution]
             ▼
    ┌──────────────────┐
    │     COMPLETE     │  Project ready for development
    │                  │
    │ Next Workflows:  │
    │ • 1-EPIC-DELIVERY (if multi-epic)
    │ • 2-SPRINT-WORKFLOW (if single epic)
    └──────────────────┘
```

## The 9 Phases

### Phase 1: DISCOVERY (DISCOVERY-AGENT)

**Purpose:** Gather requirements through structured interview with deep business logic exploration.

**Deliverable:** `docs/0-DISCOVERY/PROJECT-UNDERSTANDING.md`

**Clarity Target:** 85% (minimum 75% to proceed)

**Interview Phases (MANDATORY):**

1. **General Understanding**
   - What is the primary purpose of this project?
   - Who are the target users?
   - What problem does it solve?

2. **Business Logic Deep Dive** (CRITICAL)
   - How does {process} work step by step?
   - What triggers {workflow}?
   - How is {resource} transported/moved/consumed?
   - What validations are required for {entity}?
   - What happens when {edge_case} occurs?
   - How do you handle {exception_scenario}?

   Examples:
   - "How is stock consumed in production?"
   - "What happens when supplier delivery is late?"

3. **Entity Details**
   - What fields does {entity} have?
   - Which fields are required vs optional?
   - What are the validation rules?
   - What relationships exist with other entities?

4. **Assumptions Validation**
   - Present all assumptions to USER
   - Ask USER to confirm or correct each one

**Quality Gate: DISCOVERY_COMPLETE**
- Requirements clarity score >= 85%
- Business logic deep-dive completed
- Entity fields clarified
- All assumptions validated with USER
- Enforcer: DISCOVERY-AGENT
- On Fail: Ask user for clarification

**On Complete:**
- Update PROJECT-STATE.md (phase: discovery, status: completed)
- Auto-commit: `🔍 checkpoint: Complete discovery phase - clarity {clarity_score}%`

---

### Phase 2: PRD CREATION (PM-AGENT)

**Purpose:** Create Product Requirements Document with user clarification loop.

**Input:** `docs/0-DISCOVERY/PROJECT-UNDERSTANDING.md`

**Deliverable:** `docs/1-BASELINE/product/prd.md`

**Clarification Process (MANDATORY):**

1. **Draft PRD** - Create initial document
2. **Verify Understanding** - Present key requirements to user
   - "I understand that {requirement}. Is this correct?"
   - "The success metric for {feature} is {metric}. Correct?"
   - "This is IN scope: {in_scope}. This is OUT of scope: {out_scope}. Correct?"
3. **List Assumptions** - Output: `docs/1-BASELINE/product/prd-assumptions.md`
   - Present all assumptions for USER validation
4. **Identify Gaps** - Ask about any unclear areas
   - "I'm unclear about {gap}. Can you clarify?"
   - "What should happen when {edge_case}?"

**Checkpoint:**
- All requirements have MoSCoW priority
- Success metrics are SMART
- Scope is explicit (in/out/future)
- USER confirmed understanding is correct
- All assumptions validated

**Quality Gate: PRD_APPROVED**
- PRD document complete
- Requirements prioritized (MoSCoW)
- Scope validated (in/out/future explicit)
- USER confirmed requirements understanding
- All assumptions documented and validated
- Stakeholder sign-off obtained
- Enforcer: PM-AGENT + PRODUCT-OWNER
- On Fail: Return to discovery

**On Complete:**
- Update PROJECT-STATE.md (phase: prd, status: completed)
- Auto-commit: `📋 checkpoint: Complete PRD phase - requirements documented`

---

### Phase 3: ARCHITECTURE (ARCHITECT-AGENT)

**Purpose:** Design system architecture and make technical decisions. NO epic breakdown at this stage.

**Input:**
- `docs/1-BASELINE/product/prd.md`
- `docs/0-DISCOVERY/PROJECT-UNDERSTANDING.md`

**Deliverables:**
- `docs/1-BASELINE/architecture/system-overview.md`
- `docs/1-BASELINE/architecture/tech-stack.md`
- `docs/1-BASELINE/architecture/adrs/*.md`

**Checkpoint:**
- System architecture designed
- Tech stack decisions documented
- ADRs created for major decisions
- Technical constraints identified
- Integration points defined

**Quality Gate: ARCHITECTURE_APPROVED**
- System design complete
- Tech stack justified
- ADRs documented for major decisions
- Technical feasibility confirmed
- Security architecture defined
- Scalability approach documented
- Enforcer: ARCHITECT-AGENT
- On Fail: Return to PRD creation

**On Complete:**
- Update PROJECT-STATE.md (phase: architecture, status: completed)
- Auto-commit: `🏗️ checkpoint: Complete architecture phase - {adrs_count} ADRs created`

---

### Phase 4: UX DESIGN (UX-DESIGNER) - USER APPROVAL REQUIRED

**Purpose:** Design user experience with technical context. CRITICAL: User must approve wireframes.

**Input:**
- `docs/1-BASELINE/product/prd.md`
- `docs/0-DISCOVERY/PROJECT-UNDERSTANDING.md`
- `docs/1-BASELINE/architecture/system-overview.md`

**Deliverables:**
- `docs/3-ARCHITECTURE/ux/user-flows.md`
- `docs/3-ARCHITECTURE/ux/wireframes/*.md`
- `docs/3-ARCHITECTURE/ux/interaction-specs.md`
- `docs/3-ARCHITECTURE/ux/component-specs.md`

**User Approval Process (MANDATORY):**

1. **Check Approval Mode**
   - Ask: "Review and approve each screen OR auto-approve?"
   - Default: review_each (recommended for new projects)

2. **Present User Flows** - Get USER approval for flows before wireframes

3. **Present Wireframes** (if review_each mode)
   - Show each key screen wireframe
   - Include: ASCII wireframe, key elements, interactions
   - Ask: "Do you approve this screen? [Approve / Request Changes / Skip]"

4. **Collect Feedback** - If user requests changes, iterate (max 3 iterations)

**Checkpoint:**
- User flows documented
- Key screens wireframed
- Interaction patterns defined
- Technical constraints respected
- Accessibility requirements addressed
- **USER APPROVED wireframes** (or explicit auto-approve)

**Quality Gate: UX_APPROVED**
- User flows complete for all personas
- Wireframes for key screens
- Interaction specs defined
- Accessibility requirements documented
- Technical feasibility validated with architecture
- **USER explicitly approved OR opted for auto-approve**
- Enforcer: UX-DESIGNER + PRODUCT-OWNER + USER
- On Fail: Iterate (max 3 times), then return to architecture

**On Complete:**
- Update PROJECT-STATE.md (phase: ux_design, status: completed)
- Auto-commit: `🎨 checkpoint: Complete UX design phase - wireframes approved`

---

### Phase 5: EPIC BREAKDOWN (PARALLEL: ARCHITECT + TEST-ENGINEER)

**Purpose:** Break PRD into epics with dependencies AND create test strategy in parallel.

**Input:**
- `docs/1-BASELINE/product/prd.md`
- `docs/1-BASELINE/architecture/system-overview.md`
- `docs/3-ARCHITECTURE/ux/user-flows.md`

**Parallel Execution:**

#### 5A: Epic Structure (ARCHITECT-AGENT)

**Deliverables:**
- `docs/2-MANAGEMENT/epics/epic-catalog.md`
- `docs/2-MANAGEMENT/epics/dependency-graph.md`
- `docs/2-MANAGEMENT/risks/risk-registry.md`
- `docs/2-MANAGEMENT/roadmap.md`

**Per-Epic Folder Structure:**
```
docs/2-MANAGEMENT/epics/{XX}-{epic-slug}/
  {XX}.0.epic-overview.md       # Epic overview
  {XX}.0.clarifications.md      # Business logic clarifications
```

**Clarification Required:**
For each epic with entities/tables, ask:
- What fields does {entity} have?
- What validations are required?
- What are the business rules for {process}?
- How does {workflow} work step by step?
- What happens when {edge_case}?

Output: `docs/2-MANAGEMENT/epics/{XX}-{epic-slug}/{XX}.0.clarifications.md`

**Checkpoint:**
- All PRD requirements mapped to epics
- Epic boundaries clear
- Dependencies identified
- Critical path defined
- Risks assessed

#### 5B: Test Strategy (TEST-ENGINEER)

**Deliverables:**
- `docs/2-MANAGEMENT/epics/{XX}-{epic-slug}/{XX}.0.test-strategy.md`

**Strategy Includes:**
- Naming convention: `describe('{XX}_{N}_{feature}', () => { it('should_{action}_{expected}') })`
- File structure: `tests/{XX}-{epic-slug}/{XX}.{N}.{story-slug}.test.ts`
- Test types: unit, integration, e2e
- Scenarios per story: Given/When/Then mapped to test cases
- Mocks needed: External services, APIs
- Fixtures needed: Test data definitions

**Checkpoint:**
- Test scenarios defined per epic
- Test naming conventions established
- Test file structure defined
- Coverage requirements specified
- E2E scenarios identified

**Quality Gate: EPICS_DEFINED**
- Each PRD requirement mapped to epic
- Epic boundaries are clear (no overlap)
- No circular dependencies
- Critical path identified
- Risks documented with mitigations
- Roadmap (NOW/NEXT/LATER) created
- Test strategy defined for each epic
- Business logic clarified for each epic
- Enforcer: ARCHITECT-AGENT + PRODUCT-OWNER + TEST-ENGINEER
- On Fail: Iterate (max 2 times), then return to UX

**On Complete:**
- Update PROJECT-STATE.md (phase: epic, status: completed)
- Auto-commit: `📦 checkpoint: Complete epic breakdown - {epic_count} epics with test strategies`

---

### Phase 6: STORY BREAKDOWN (ARCHITECT-AGENT)

**Purpose:** Break NOW epics into INVEST-compliant stories with hierarchical naming.

**Input:**
- `docs/2-MANAGEMENT/epics/epic-catalog.md`
- `docs/2-MANAGEMENT/roadmap.md`
- `docs/3-ARCHITECTURE/ux/user-flows.md`
- `docs/2-MANAGEMENT/epics/{XX}-{epic-slug}/{XX}.0.clarifications.md`

**Output Pattern:**
```
docs/2-MANAGEMENT/epics/{XX}-{epic-slug}/
  {XX}.{N}.{story-slug}.md           # Story
  {XX}.{N}.{M}.{subtask-slug}.md     # Subtask (optional)
```

**Examples:**
- `docs/2-MANAGEMENT/epics/01-user-auth/01.1.db-schema-setup.md`
- `docs/2-MANAGEMENT/epics/01-user-auth/01.2.login-endpoint.md`
- `docs/2-MANAGEMENT/epics/01-user-auth/01.2.1.validation-logic.md` (subtask)
- `docs/2-MANAGEMENT/epics/01-user-auth/01.3.ux-login-form.md`
- `docs/2-MANAGEMENT/epics/02-supplier-mgmt/02.1.supplier-model.md`

**Checkpoint:**
- NOW bucket epics broken into stories
- Stories follow INVEST criteria
- Acceptance criteria in Given/When/Then
- Complexity estimated (S/M/L)
- Hierarchical naming convention followed (XX.N.slug)

**Quality Gate: STORIES_CREATED**
- All NOW epics have stories
- Stories are INVEST compliant
- AC in Given/When/Then format
- Complexity estimated
- Enforcer: ARCHITECT-AGENT
- On Fail: Iterate (max 2 times), then return to epic breakdown

**On Complete:**
- Update PROJECT-STATE.md (phase: stories, status: completed)
- Auto-commit: `📝 checkpoint: Complete story breakdown - {story_count} stories INVEST validated`

---

### Phase 7: SCOPE VALIDATION (PRODUCT-OWNER)

**Purpose:** Validate scope and INVEST compliance before sprint planning.

**Input:**
- `docs/1-BASELINE/product/prd.md`
- `docs/2-MANAGEMENT/epics/epic-01-stories.md`
- `docs/3-ARCHITECTURE/ux/user-flows.md`

**Deliverable:** `docs/2-MANAGEMENT/reviews/scope-review-epic-01.md`

**Checkpoint:**
- All stories pass INVEST
- No scope creep detected
- AC are testable
- UX alignment verified

**Quality Gate: STORIES_READY**
- All stories pass INVEST compliance
- Acceptance criteria defined for all stories
- No scope creep detected
- AC are testable
- Story estimates provided
- UX requirements reflected in stories
- Enforcer: PRODUCT-OWNER
- On Fail: Return to story breakdown

**On Complete:**
- Update PROJECT-STATE.md (phase: scope_validation, status: completed)
- Auto-commit: `✅ checkpoint: Scope validated - stories ready for sprint`

---

### Phase 8: SPRINT PLANNING (SCRUM-MASTER)

**Purpose:** Plan first sprint with capacity and dependency management.

**Input:**
- `docs/2-MANAGEMENT/epics/epic-01-stories.md`
- `docs/2-MANAGEMENT/reviews/scope-review-epic-01.md`
- `docs/2-MANAGEMENT/roadmap.md`

**Deliverable:** `docs/2-MANAGEMENT/sprints/sprint-01-plan.md`

**Checkpoint:**
- Capacity not exceeded
- Dependencies respected
- Stories have estimates

**Quality Gate: SPRINT_PLANNED**
- Sprint backlog defined
- Capacity allocated and not exceeded
- Dependencies respected in ordering
- All stories have estimates
- Sprint goal defined
- Enforcer: SCRUM-MASTER
- On Fail: Return to scope validation

**On Complete:**
- Update PROJECT-STATE.md (phase: sprint_planning, status: completed, active_sprint: 1)
- Auto-commit: `🏃 checkpoint: Sprint 1 planned - project ready for development`

---

### Phase 9: HANDOFF TO EXECUTION (ORCHESTRATOR) [MANDATORY]

**Purpose:** Determine execution path and prepare artifacts for development.

This phase determines how the project continues after initial setup.

#### Decision Point: Single vs Multiple Epics

```
After Sprint Planning Complete:
    │
    ├─► Project has SINGLE epic?
    │   └─► Go directly to 2-SPRINT-WORKFLOW
    │       - Execute Sprint 1 immediately
    │       - Skip EPIC-DELIVERY wrapper
    │
    └─► Project has MULTIPLE epics?
        └─► For each NOW bucket epic:
            └─► Run 1-EPIC-DELIVERY
                - Each epic gets its own delivery cycle
                - Epics can overlap across sprints
```

#### Handoff Artifacts

Ensure these artifacts are ready before handoff:

| Artifact | Location | Required By |
|----------|----------|-------------|
| PRD | docs/1-BASELINE/product/prd.md | All workflows |
| Architecture | docs/1-BASELINE/architecture/ | 1-EPIC-DELIVERY |
| UX Wireframes | docs/3-ARCHITECTURE/ux/wireframes/ | 3-STORY-DELIVERY |
| Epic Catalog | docs/2-MANAGEMENT/epics/epic-catalog.md | 1-EPIC-DELIVERY |
| Stories | docs/2-MANAGEMENT/epics/{XX}-{slug}/ | 2-SPRINT-WORKFLOW |
| Sprint Plan | docs/2-MANAGEMENT/sprints/sprint-01-plan.md | 2-SPRINT-WORKFLOW |

#### State Update

Update PROJECT-STATE.md:
```markdown
phase: execution
status: handoff_complete
active_sprint: 1
execution_mode: single_epic | multi_epic
next_workflow: 2-SPRINT-WORKFLOW | 1-EPIC-DELIVERY
```

#### Quality Gate 9: HANDOFF_READY (MANDATORY)

- [ ] All 8 previous gates passed
- [ ] Execution mode decided (single/multi epic)
- [ ] Next workflow identified
- [ ] PROJECT-STATE.md updated
- [ ] Enforcer: ORCHESTRATOR
- [ ] On Fail: Review sprint plan

**On Complete:**
- Update PROJECT-STATE.md (phase: execution, status: handoff_complete)
- Auto-commit: `🚀 checkpoint: Handoff complete - ready for execution`

---

## State Management & Auto-Commit

After EACH phase completion:

1. **Update PROJECT-STATE.md** in root directory
   - Set phase status to "completed"
   - Update current phase
   - Sync to root using `scripts/sync-state.sh --phase <phase>`

2. **Auto-commit** with descriptive message
   - Format: `{emoji} checkpoint: {message}`
   - Emojis: 🔍 discovery, 📋 prd, 🏗️ architecture, 🎨 ux, 📦 epic, 📝 stories, ✅ scope, 🏃 sprint, 🚀 handoff
   - Include metrics: clarity score, ADR count, epic count, story count

## Next Workflows (Integration)

After new-project completes, continue with:

### 1. FOR MULTI-EPIC PROJECTS: 1-EPIC-DELIVERY.md
**Purpose:** Manage delivery of individual epics from planning through release
- Each epic gets its own delivery cycle
- Epics can overlap across sprints
- Handles epic-level planning, implementation, and deployment
- **Trigger:** After Phase 9 handoff for projects with multiple epics

### 2. FOR SINGLE-EPIC PROJECTS: 2-SPRINT-WORKFLOW.md
**Purpose:** Plan implementation strategy for sprint
- Decide how many stories per sprint
- Create parallel tracks (frontend/backend/infra)
- Map dependencies between stories
- Build implementation roadmap
- Assign stories to tracks
- **Trigger:** After Phase 9 handoff for projects with single epic

### 3. PER STORY: 3-STORY-DELIVERY.md
**Purpose:** Implement each story using TDD (RED→GREEN→REFACTOR)
- **Trigger:** For each story in sprint backlog
- Called by both 1-EPIC-DELIVERY and 2-SPRINT-WORKFLOW

### 4. SUPPORTING:
- **epic-workflow.yaml** - Continue with next epic after current completes
- **feature-flow.yaml** - Add new features during development (mid-sprint)

## Quality Gates Summary

| Gate ID | Phase | Enforcer | Clarity Threshold | Key Criteria |
|---------|-------|----------|-------------------|--------------|
| DISCOVERY_COMPLETE | 1 | DISCOVERY-AGENT | **85%** (raised from 70%) | Business logic deep-dive, assumptions validated |
| PRD_APPROVED | 2 | PM-AGENT + PRODUCT-OWNER | - | USER confirmed understanding, assumptions documented |
| ARCHITECTURE_APPROVED | 3 | ARCHITECT-AGENT | - | System design complete, ADRs documented |
| UX_APPROVED | 4 | UX-DESIGNER + PRODUCT-OWNER + **USER** | - | **USER approved wireframes** OR opted for auto-approve |
| EPICS_DEFINED | 5 | ARCHITECT + PRODUCT-OWNER + **TEST-ENGINEER** | - | Test strategy defined, business logic clarified |
| STORIES_CREATED | 6 | ARCHITECT-AGENT | - | INVEST compliant, AC in Given/When/Then |
| STORIES_READY | 7 | PRODUCT-OWNER | - | No scope creep, testable AC, UX aligned |
| SPRINT_PLANNED | 8 | SCRUM-MASTER | - | Capacity respected, dependencies valid |
| HANDOFF_READY | 9 | ORCHESTRATOR | - | Execution mode decided, next workflow identified |

## Naming Conventions

### Hierarchical Pattern: {XX}.{N}.{M}.{slug}

**Components:**
- `XX` - Epic number (2 digits, zero-padded): 01, 02, 03...
- `N` - Story number within epic: 1, 2, 3...
- `M` - Subtask number within story (optional): 1, 2, 3...
- `slug` - Short kebab-case description: db-schema, login-endpoint, ux-form

**Special Values:**
- `XX.0.*` - Epic-level documents (overview, clarifications, test-strategy)

### Documentation Files

```
docs/2-MANAGEMENT/epics/{XX}-{epic-slug}/
  {XX}.0.epic-overview.md          # Epic overview
  {XX}.0.clarifications.md         # Business logic clarifications
  {XX}.0.test-strategy.md          # Test strategy from TEST-ENGINEER
  {XX}.{N}.{story-slug}.md         # Story
  {XX}.{N}.{M}.{subtask-slug}.md   # Subtask (optional)
```

### Test Files (Mirror Doc Structure)

```
tests/{XX}-{epic-slug}/
  {XX}.{N}.{story-slug}.test.ts                    # Unit test
  {XX}.{N}.{story-slug}.integration.test.ts        # Integration test
  {XX}.0.{epic-slug}.e2e.test.ts                   # E2E test
```

### Examples

**Docs:**
- `docs/2-MANAGEMENT/epics/01-user-auth/`
- `docs/2-MANAGEMENT/epics/01-user-auth/01.0.epic-overview.md`
- `docs/2-MANAGEMENT/epics/01-user-auth/01.0.clarifications.md`
- `docs/2-MANAGEMENT/epics/01-user-auth/01.0.test-strategy.md`
- `docs/2-MANAGEMENT/epics/01-user-auth/01.1.db-schema-setup.md`
- `docs/2-MANAGEMENT/epics/01-user-auth/01.2.login-endpoint.md`
- `docs/2-MANAGEMENT/epics/01-user-auth/01.2.1.input-validation.md` (subtask)
- `docs/2-MANAGEMENT/epics/01-user-auth/01.2.2.error-handling.md` (subtask)
- `docs/2-MANAGEMENT/epics/01-user-auth/01.3.ux-login-form.md`

**Tests:**
- `tests/01-user-auth/01.1.db-schema-setup.test.ts`
- `tests/01-user-auth/01.2.login-endpoint.test.ts`
- `tests/01-user-auth/01.0.user-auth.e2e.test.ts`

## Error Handling & Recovery

### Discovery Incomplete
- Request additional stakeholder input
- Clarify ambiguous requirements
- Document assumptions
- **Escalate to:** PRODUCT-OWNER

### PRD Rejected
- Review feedback from product-owner
- Revise PRD sections
- Clarify scope boundaries
- **Escalate to:** Return to discovery phase

### Architecture Infeasible
- Review technical constraints
- Propose alternative approaches
- Create ADR for decision
- **Escalate to:** SENIOR-DEV

### UX Rejected
- Review UX feedback
- Revise wireframes
- Validate technical constraints
- **Escalate to:** Joint session with architect, then PRODUCT-OWNER

### Epic Structure Invalid
- Review epic boundaries
- Resolve circular dependencies
- Validate PRD mapping
- **Escalate to:** Return to UX, then PRODUCT-OWNER

### Stories Not INVEST
- Refine story granularity
- Add missing acceptance criteria
- Validate testability
- **Escalate to:** Return to epic breakdown

### Capacity Exceeded
- Reprioritize sprint backlog
- Move stories to next sprint
- Adjust velocity assumptions
- **Escalate to:** PRODUCT-OWNER for prioritization

### Handoff Failed
- Review all quality gates
- Ensure all artifacts present
- Validate PROJECT-STATE.md
- **Escalate to:** ORCHESTRATOR

## Key Changes from Previous Version

1. **85% Clarity Threshold** - Raised from 70% at DISCOVERY phase
2. **Parallel Test Strategy** - TEST-ENGINEER runs parallel with ARCHITECT at EPIC BREAKDOWN
3. **USER Approval Gates** - USER must approve at UX phase (or opt for auto-approve)
4. **Mandatory Clarifications** - Business logic questions at Discovery AND Epic phases
5. **Hierarchical Naming** - {XX}.{N}.{M}.{slug} pattern for all stories/subtasks
6. **Auto-Commit After Each Phase** - Automatic state update + git commit
7. **Phase 9: Handoff to Execution** - NEW mandatory phase for execution path decision
8. **Next Workflows Section** - Clear handoff to 1-EPIC-DELIVERY or 2-SPRINT-WORKFLOW

## Success Criteria

Project is ready for development when:
- All 9 quality gates passed
- Sprint 1 backlog defined with capacity respected
- All stories INVEST compliant with testable AC
- Test strategy defined for all epics
- USER approved all UX designs
- Execution mode decided (single/multi epic)
- Next workflow identified
- PROJECT-STATE.md shows: phase=execution, status=handoff_complete, active_sprint=1
- Final commit: `🚀 checkpoint: Handoff complete - ready for execution`

---

**Related Documentation:**
- [0-WORKFLOW-MASTER-MAP.md](./0-WORKFLOW-MASTER-MAP.md) - Workflow navigation
- [1-EPIC-DELIVERY.md](./1-EPIC-DELIVERY.md) - Epic delivery workflow
- [2-SPRINT-WORKFLOW.md](./2-SPRINT-WORKFLOW.md) - Sprint workflow
- [3-STORY-DELIVERY.md](./3-STORY-DELIVERY.md) - Story delivery workflow
- `.claude/workflows/definitions/engineering/sprint-workflow.yaml`
- `.claude/workflows/definitions/engineering/story-delivery.yaml`
- `.claude/workflows/documentation/NAMING-CONVENTIONS.md`
