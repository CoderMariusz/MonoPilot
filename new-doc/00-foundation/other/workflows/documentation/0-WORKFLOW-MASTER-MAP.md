# Workflow Master Map

> **Version:** 2.0
> **Updated:** 2025-12-15
> **Purpose:** Central integration guide for all MonoPilot workflows

---

## Overview

MonoPilot uses a **4-level hierarchical workflow system**. Each level has a specific scope and delegates to the level below.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WORKFLOW HIERARCHY (4 LEVELS)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  LEVEL 0: PROJECT                                                   │
│  └── 0-NEW-PROJECT-FLOW.md (once per project)                       │
│       Purpose: Initialize project from idea to sprint-ready         │
│       Duration: Days/weeks                                          │
│                                                                      │
│  LEVEL 1: EPIC                                                      │
│  └── 1-EPIC-DELIVERY.md (per epic)                                  │
│       Purpose: Deliver a complete epic from stories to done         │
│       Duration: 1-4 weeks                                           │
│                                                                      │
│  LEVEL 2: SPRINT                                                    │
│  └── 2-SPRINT-WORKFLOW.md (per sprint)                              │
│       Purpose: Time-boxed execution container                       │
│       Duration: 1-2 weeks                                           │
│                                                                      │
│  LEVEL 3: STORY                                                     │
│  └── 3-STORY-DELIVERY.md (per story)                                │
│       Purpose: Atomic unit of work using TDD                        │
│       Duration: Hours/days                                          │
│                                                                      │
│  EXTRAS (Special Workflows):                                        │
│  └── FEATURE-FLOW.md (mid-sprint features)                        │
│  └── BUG-WORKFLOW.md (hotfixes)                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Decision Tree

Use this tree to determine which workflow to invoke:

```
START
  │
  ├─► New project from scratch?
  │   │
  │   ├─► YES ──────────────────────────────────────────────┐
  │   │                                                      │
  │   │   ┌────────────────────────────────────────────┐    │
  │   │   │  0-NEW-PROJECT-FLOW                        │    │
  │   │   │  ─────────────────────                     │    │
  │   │   │  8 Phases: Discovery → PRD → Architecture  │    │
  │   │   │           → UX → Epics → Stories → Sprint  │    │
  │   │   │                                            │    │
  │   │   │  Output: Sprint 1 Ready                    │    │
  │   │   └────────────────────────────────────────────┘    │
  │   │                     │                               │
  │   │                     ▼                               │
  │   │   ┌────────────────────────────────────────────┐    │
  │   │   │  Decision: How many epics?                 │    │
  │   │   │                                            │    │
  │   │   │  1 Epic     → Go directly to SPRINT        │    │
  │   │   │  Multiple   → Use EPIC-DELIVERY for each   │    │
  │   │   └────────────────────────────────────────────┘    │
  │   │                                                      │
  │   └─► NO (Existing project)
  │       │
  │       ├─► Adding new Epic?
  │       │   │
  │       │   └─► YES ──────────────────────────────────────┐
  │       │                                                  │
  │       │       ┌────────────────────────────────────┐    │
  │       │       │  1-EPIC-DELIVERY                   │    │
  │       │       │  ─────────────────                 │    │
  │       │       │  5 Phases: Planning → Implement    │    │
  │       │       │           → Quality → Docs → Deploy│    │
  │       │       │                                    │    │
  │       │       │  Uses existing PRD (no Discovery)  │    │
  │       │       └────────────────────────────────────┘    │
  │       │                                                  │
  │       ├─► Starting next Sprint?
  │       │   │
  │       │   └─► YES ──────────────────────────────────────┐
  │       │                                                  │
  │       │       ┌────────────────────────────────────┐    │
  │       │       │  2-SPRINT-WORKFLOW                 │    │
  │       │       │  ────────────────────              │    │
  │       │       │  3 Groups: Start → Daily → End    │    │
  │       │       │                                    │    │
  │       │       │  Executes stories from backlog     │    │
  │       │       └────────────────────────────────────┘    │
  │       │                                                  │
  │       ├─► Small feature (< 1 day)?
  │       │   │
  │       │   └─► YES → FEATURE-FLOW
  │       │
  │       └─► Bug fix?
  │           │
  │           └─► YES → BUG-WORKFLOW
  │
  └─► END
```

---

## Flow Integration Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         PROJECT LIFECYCLE FLOW                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                    0-NEW-PROJECT-FLOW (Once)                         │     │
│  │  ┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐      │     │
│  │  │Discovery│   PRD   │  Arch   │   UX    │  Epic   │ Sprint  │      │     │
│  │  │ Agent   │ PM-Agent│Architect│UX-Design│Breakdown│Planning │      │     │
│  │  └────┬────┴────┬────┴────┬────┴────┬────┴────┬────┴────┬────┘      │     │
│  │       ▼         ▼         ▼         ▼         ▼         ▼           │     │
│  │  [Research] [PRD.md] [ADRs] [Wireframes] [Epics] [Sprint Plan]      │     │
│  └─────────────────────────────────────┬───────────────────────────────┘     │
│                                        │                                      │
│                                        ▼                                      │
│           ┌────────────────────────────────────────────────────┐             │
│           │              HANDOFF TO EXECUTION                   │             │
│           │  Single Epic? → Go to 2-SPRINT-WORKFLOW directly    │             │
│           │  Multiple?    → Use 1-EPIC-DELIVERY for each epic  │             │
│           └───────────────────────┬────────────────────────────┘             │
│                                   │                                           │
│        ┌──────────────────────────┴──────────────────────────┐               │
│        ▼                                                      ▼               │
│  ┌──────────────────────┐                        ┌──────────────────────┐    │
│  │  1-EPIC-DELIVERY     │                        │  2-SPRINT-WORKFLOW   │    │
│  │  (per NOW epic)      │                        │  (if single epic)    │    │
│  │                      │                        │                      │    │
│  │  ┌─────────────────┐ │                        │  ┌─────────────────┐ │    │
│  │  │ 1. Planning     │ │                        │  │ Sprint Start    │ │    │
│  │  │ 2. Implement    │─┼─ calls ───────────────▶│  │ Daily Cycle     │ │    │
│  │  │ 3. Quality      │ │                        │  │ Sprint End      │ │    │
│  │  │ 4. Docs         │ │                        │  └────────┬────────┘ │    │
│  │  │ 5. Deploy       │ │                        │           │          │    │
│  │  └─────────────────┘ │                        │           │          │    │
│  └──────────────────────┘                        └───────────┼──────────┘    │
│                                                              │                │
│                                                              ▼                │
│                                              ┌──────────────────────────┐    │
│                                              │  3-STORY-DELIVERY        │    │
│                                              │  (for each story)        │    │
│                                              │                          │    │
│                                              │  ┌────────────────────┐  │    │
│                                              │  │ 1. UX (optional)   │  │    │
│                                              │  │ 2. RED (tests)     │  │    │
│                                              │  │ 3. GREEN (impl)    │  │    │
│                                              │  │ 4. REFACTOR        │  │    │
│                                              │  │ 5. Code Review     │  │    │
│                                              │  │ 6. QA              │  │    │
│                                              │  │ 7. Documentation   │  │    │
│                                              │  └────────────────────┘  │    │
│                                              │                          │    │
│                                              │  Output: Done Story ✅   │    │
│                                              └──────────────────────────┘    │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                      EXTRAS (Mid-Project)                             │    │
│  │                                                                       │    │
│  │  ┌─────────────────┐         ┌─────────────────┐                     │    │
│  │  │ FEATURE-FLOW  │         │ BUG-WORKFLOW  │                     │    │
│  │  │ (small feature) │         │ (hotfix)        │                     │    │
│  │  │ < 1 day effort  │         │ Critical bugs   │                     │    │
│  │  └─────────────────┘         └─────────────────┘                     │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Unified Naming Convention

All workflows use the **same hierarchical naming pattern**:

```
Pattern: {XX}.{N}.{M}.{slug}

Components:
  XX   = Epic number (2 digits, zero-padded): 01, 02, 03...
  N    = Story number within epic: 1, 2, 3...
  M    = Subtask number (optional): 1, 2, 3...
  slug = Short kebab-case description

Special Values:
  XX.0.*  = Epic-level documents (overview, clarifications, test-strategy)
```

### Examples

| ID | Type | File Location |
|----|------|---------------|
| `01.0.epic-overview` | Epic overview | `docs/2-MANAGEMENT/epics/01-auth/01.0.epic-overview.md` |
| `01.0.clarifications` | Business logic | `docs/2-MANAGEMENT/epics/01-auth/01.0.clarifications.md` |
| `01.0.test-strategy` | Test strategy | `docs/2-MANAGEMENT/epics/01-auth/01.0.test-strategy.md` |
| `01.1.db-schema` | Story 1 | `docs/2-MANAGEMENT/epics/01-auth/01.1.db-schema.md` |
| `01.2.login-api` | Story 2 | `docs/2-MANAGEMENT/epics/01-auth/01.2.login-api.md` |
| `01.2.1.validation` | Subtask | `docs/2-MANAGEMENT/epics/01-auth/01.2.1.validation.md` |

### Test Files (Mirror Doc Structure)

```
tests/{XX}-{epic-slug}/
  {XX}.{N}.{story-slug}.test.ts              # Unit test
  {XX}.{N}.{story-slug}.integration.test.ts  # Integration test
  {XX}.0.{epic-slug}.e2e.test.ts             # E2E test
```

---

## Workflow Prerequisites & Outputs

| Workflow | Prerequisites | Produces | Next Workflow |
|----------|---------------|----------|---------------|
| **0-NEW-PROJECT** | User requirements, business idea | PRD, Architecture, UX, Epics, Stories, Sprint Plan | 1-EPIC-DELIVERY or 2-SPRINT |
| **1-EPIC-DELIVERY** | PRD exists, Stories defined | Done Epic, Updated docs, Deployed feature | 2-SPRINT (next sprint) |
| **2-SPRINT-WORKFLOW** | Sprint plan, Story backlog | Done stories, Velocity metrics | Loop or 1-EPIC-DELIVERY (new epic) |
| **3-STORY-DELIVERY** | Story definition, AC, Tests designed | Done story, Reviewed code, Updated docs | 2-SPRINT (next story) |
| **FEATURE-FLOW** | Feature request, PRD reference | Done feature | 2-SPRINT (continue) |
| **BUG-WORKFLOW** | Bug report, Reproduction steps | Fixed bug, Root cause documented | 2-SPRINT (continue) |

---

## Quality Gates Summary

Each workflow has mandatory quality gates. **No workflow can proceed without passing its gates.**

### 0-NEW-PROJECT-FLOW Gates

| Gate | Phase | Enforcer | Blocking |
|------|-------|----------|----------|
| DISCOVERY_COMPLETE | 1 → 2 | DISCOVERY-AGENT | Yes |
| PRD_APPROVED | 2 → 3 | PM-AGENT + USER | Yes |
| ARCHITECTURE_APPROVED | 3 → 4 | ARCHITECT-AGENT | Yes |
| UX_APPROVED | 4 → 5 | UX-DESIGNER + USER | Yes |
| EPICS_DEFINED | 5 → 6 | ARCHITECT + TEST-ENGINEER | Yes |
| STORIES_CREATED | 6 → 7 | ARCHITECT-AGENT | Yes |
| STORIES_READY | 7 → 8 | PRODUCT-OWNER | Yes |
| SPRINT_PLANNED | 8 → Done | SCRUM-MASTER | Yes |

### 1-EPIC-DELIVERY Gates

| Gate | Phase | Enforcer | Blocking |
|------|-------|----------|----------|
| PLANNING_COMPLETE | 1 → 2 | PRODUCT-OWNER | Yes |
| IMPLEMENTATION_DONE | 2 → 3 | CODE-REVIEWER | Yes |
| QUALITY_APPROVED | 3 → 4 | QA-AGENT | Yes |
| DOCS_COMPLETE | 4 → 5 | TECH-WRITER | Yes |
| DEPLOYMENT_VERIFIED | 5 → Done | DEVOPS-AGENT | Yes |

### 2-SPRINT-WORKFLOW Gates

| Gate | Phase | Enforcer | Blocking |
|------|-------|----------|----------|
| SPRINT_STARTED | Start → Daily | SCRUM-MASTER | Yes |
| DAILY_COMPLETE | Daily cycle | ORCHESTRATOR | No (repeats) |
| SPRINT_REVIEW_DONE | End | PRODUCT-OWNER | Yes |

### 3-STORY-DELIVERY Gates

| Gate | Phase | Enforcer | Blocking |
|------|-------|----------|----------|
| UX_READY | 1 → 2 | UX-DESIGNER | No (optional) |
| TESTS_READY | 2 → 3 | TEST-WRITER | Yes |
| TESTS_PASS | 3 → 4 | DEV | Yes |
| CODE_CLEAN | 4 → 5 | SENIOR-DEV | Yes |
| REVIEW_APPROVED | 5 → 6 | CODE-REVIEWER | Yes |
| QA_PASSED | 6 → 7 | QA-AGENT | Yes |
| DOCS_DONE | 7 → Done | TECH-WRITER | Yes |

---

## Agent Responsibilities by Workflow

### Level 0: NEW-PROJECT-FLOW

| Phase | Agent | Model | Role |
|-------|-------|-------|------|
| Discovery | DISCOVERY-AGENT | Sonnet | Interview, requirements |
| PRD | PM-AGENT | Sonnet | Create PRD |
| Architecture | ARCHITECT-AGENT | Opus | System design, ADRs |
| UX | UX-DESIGNER | Sonnet | Wireframes, flows |
| Epic Breakdown | ARCHITECT-AGENT + TEST-ENGINEER | Opus + Sonnet | Parallel: structure + test strategy |
| Story Breakdown | ARCHITECT-AGENT | Opus | INVEST stories |
| Scope Validation | PRODUCT-OWNER | Sonnet | Validate INVEST |
| Sprint Planning | SCRUM-MASTER | Sonnet | Plan sprint 1 |

### Level 1: EPIC-DELIVERY

| Phase | Agent | Model | Role |
|-------|-------|-------|------|
| Planning | PRODUCT-OWNER + SCRUM-MASTER | Sonnet | Validate, plan |
| Implementation | ORCHESTRATOR → DEVs | Opus → Sonnet | Coordinate stories |
| Quality | QA-AGENT | Sonnet | E2E, regression |
| Documentation | TECH-WRITER | Sonnet | API docs, guides |
| Deployment | DEVOPS-AGENT | Sonnet | CI/CD, release |

### Level 2: SPRINT-WORKFLOW

| Phase | Agent | Model | Role |
|-------|-------|-------|------|
| Sprint Start | SCRUM-MASTER + DOC-AUDITOR | Sonnet | Planning, drift check |
| Daily Cycle | ORCHESTRATOR | Opus | Coordinate stories |
| Sprint End | SCRUM-MASTER + PRODUCT-OWNER | Sonnet | Review, retro |

### Level 3: STORY-DELIVERY

| Phase | Agent | Model | Role |
|-------|-------|-------|------|
| UX Design | UX-DESIGNER | Sonnet | Component design |
| RED | TEST-ENGINEER → TEST-WRITER | Sonnet | Write failing tests |
| GREEN | BACKEND-DEV / FRONTEND-DEV | Sonnet | Implement |
| REFACTOR | SENIOR-DEV | Opus | Clean code |
| Code Review | CODE-REVIEWER | Sonnet | Review |
| QA | QA-AGENT | Sonnet | Validate AC |
| Documentation | TECH-WRITER | Sonnet | Update docs |

---

## Error Recovery Paths

| Situation | Recovery Path |
|-----------|---------------|
| Discovery incomplete | → Return to DISCOVERY-AGENT |
| PRD rejected | → Return to discovery, clarify requirements |
| Architecture infeasible | → Create ADR with alternatives, escalate to SENIOR-DEV |
| UX rejected | → Iterate (max 3x), then return to architecture |
| Epic structure invalid | → Return to UX, re-scope |
| Stories not INVEST | → Return to epic breakdown |
| Tests failing | → Fix implementation, re-run |
| Code review rejected | → Address feedback, resubmit |
| QA failed | → Create bug tickets, prioritize fixes |
| Deployment failed | → Rollback, investigate, retry |

---

## Related Documentation

| File | Purpose |
|------|---------|
| `0-NEW-PROJECT-FLOW.md` | Project initialization (8 phases) |
| `1-EPIC-DELIVERY.md` | Epic delivery (5 phases) |
| `2-SPRINT-WORKFLOW.md` | Sprint execution (3 groups) |
| `3-STORY-DELIVERY.md` | Story TDD (7 phases) |
| `FEATURE-FLOW.md` | Mid-sprint features |
| `BUG-WORKFLOW.md` | Bug fixes |
| `NAMING-CONVENTIONS.md` | Detailed naming rules |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2025-12-15 | Created unified master map, 4-level hierarchy |
| 1.0 | 2025-12-10 | Initial workflow documentation |
