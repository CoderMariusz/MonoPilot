# Epic Flow - Quick Reference Card

## Overview

Condensed epic workflow from conception to completion. Complete lifecycle across all six phases.

## Epic Lifecycle

```
1. DISCOVERY → 2. DESIGN → 3. PLANNING → 4. IMPLEMENTATION → 5. QUALITY → 6. DOCS
```

## Complete Flow Diagram

```
                          EPIC WORKFLOW

+=====================+
| 1. DISCOVERY        |
| 2-4 days            |
+=====================+
| RESEARCH-AGENT      |---> Research Report
| PM-AGENT            |---> PRD
+----------+----------+
           |
      [PRD OK?]
           |
+=====================+
| 2. DESIGN           |
| 2-4 days (parallel) |
+=====================+
| ARCHITECT-AGENT     |---> Architecture, ADRs, DB, API
| UX-DESIGNER         |---> User Flows, Wireframes, UI
+----------+----------+
           |
   [Design OK?]
           |
+=====================+
| 3. PLANNING         |
| 0.5-1 day           |
+=====================+
| PRODUCT-OWNER       |---> Prioritized Backlog
| SCRUM-MASTER        |---> Sprint Plan
+----------+----------+
           |
    [Sprint Ready?]
           |
+=====================+
| 4. IMPLEMENTATION   |
| 1-3 weeks           |
+=====================+
| FOR EACH STORY:     |
| UX-DESIGNER (if UI) |
| TEST-ENGINEER       |---> RED
| DEV-AGENT           |---> GREEN
| DEV-AGENT           |---> REFACTOR
| QA-AGENT            |---> Validate
| CODE-REVIEWER       |---> Review
+----------+----------+
           |
   [All Stories Done?]
           |
+=====================+
| 5. QUALITY          |
| 1-2 days            |
+=====================+
| QA-AGENT            |
| - E2E testing       |
| - Regression        |
| - Performance       |
| - Security scan     |
+----------+----------+
           |
    [Quality OK?]
           |
+=====================+
| 6. DOCUMENTATION    |
| 0.5-1 day           |
+=====================+
| TECH-WRITER         |
| - API docs          |
| - User guides       |
| - Release notes     |
| - Changelog         |
+----------+----------+
           |
           v
    EPIC COMPLETE
    - Update PROJECT-STATE
    - Archive to completed/
    - Update METRICS
```

## Quality Gates

| Phase | Gate | Must Have |
|-------|------|-----------|
| 1 | PRD Complete | All stories have AC, metrics measurable, scope defined |
| 2 | Design Complete | Architecture approved, UX specs done, no blockers |
| 3 | Sprint Ready | INVEST stories, dependencies clear, capacity matched |
| 4 | Story Done | Tests pass, code reviewed, AC met, docs updated |
| 5 | Quality Approved | E2E pass, no regressions, perf/security OK |
| 6 | Docs Complete | API docs, user guides, release notes all updated |

## Agent Flow & Handoffs

```
RESEARCH-AGENT (0.5-1d)
    ↓ [Research Report]
PM-AGENT (0.5-1d)
    ↓ [PRD]
    ├──→ ARCHITECT-AGENT (1-2d) ──→ [Architecture]
    └──→ UX-DESIGNER (1-2d) ──────→ [UX Specs]
         ↓                  ↓
         └──────┬───────────┘
                ↓ [Design Docs]
    PRODUCT-OWNER (0.25d)
                ↓ [Prioritized Backlog]
    SCRUM-MASTER (0.25d)
                ↓ [Sprint Plan]
    ╔═══════════════════════╗
    ║ IMPLEMENTATION LOOP   ║
    ║ (per story)           ║
    ║                       ║
    ║ UX-DESIGNER (if UI)   ║
    ║     ↓                 ║
    ║ TEST-ENGINEER (RED)   ║
    ║     ↓                 ║
    ║ DEV-AGENT (GREEN)     ║
    ║     ↓                 ║
    ║ DEV-AGENT (REFACTOR)  ║
    ║     ↓                 ║
    ║ QA-AGENT              ║
    ║     ↓                 ║
    ║ CODE-REVIEWER         ║
    ╚═══════════════════════╝
                ↓ [All Stories Done]
    QA-AGENT (Integration)
                ↓ [Quality Approved]
    TECH-WRITER
                ↓
           COMPLETE
```

## Model Selection Guide

| Agent | Model | When |
|-------|-------|------|
| RESEARCH-AGENT | Opus | Complex/new domain |
| RESEARCH-AGENT | Sonnet | Standard research |
| PM-AGENT | Sonnet | Always |
| ARCHITECT-AGENT | Opus | Always |
| UX-DESIGNER | Sonnet | Always |
| PRODUCT-OWNER | Sonnet | Always |
| SCRUM-MASTER | Sonnet | Always |
| TEST-ENGINEER | Sonnet | Always |
| BACKEND-DEV | Sonnet | Standard work |
| FRONTEND-DEV | Sonnet | Standard work |
| SENIOR-DEV | Opus | Complex/architectural |
| QA-AGENT | Sonnet | Always |
| CODE-REVIEWER | Sonnet | Standard review |
| CODE-REVIEWER | Haiku | Simple fixes |
| TECH-WRITER | Sonnet | Always |

## Typical Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Discovery | 1-2 days | 1-2 days |
| Design | 2-4 days | 3-6 days |
| Planning | 0.5-1 day | 3.5-7 days |
| Sprint 1 | 1-2 weeks | 2.5-4 weeks |
| Sprint 2 | 1-2 weeks | 4-7 weeks |
| Quality | 1-2 days | 4-7.5 weeks |
| Documentation | 0.5-1 day | 4-8 weeks |

**Small Epic:** 1-2 weeks
**Medium Epic:** 3-5 weeks
**Large Epic:** 6-8 weeks

## Parallel Work Opportunities

| Phase | Can Parallelize? | How |
|-------|------------------|-----|
| Discovery | Partial | Research informs PM incrementally |
| Design | Yes | Architecture + UX work independently |
| Planning | No | Sequential (PO → SM) but fast |
| Implementation | Yes | Multiple stories at different TDD phases |
| Quality | Partial | Can overlap with late development |
| Documentation | Partial | Can start as stories complete |

## Success Criteria

**Epic is complete when:**
- [ ] All stories in scope are DONE
- [ ] All quality gates passed
- [ ] Integration testing complete
- [ ] Documentation published
- [ ] PROJECT-STATE.md updated
- [ ] Work archived to completed/
- [ ] METRICS.md updated
- [ ] Stakeholders notified

## Common Issues & Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| Scope creep | PM-AGENT defines boundaries, get approval |
| Architecture conflict | ARCHITECT creates ADR with options |
| UX vs Tech conflict | Joint ARCHITECT + UX session |
| Tests can't be written | Clarify AC with PRODUCT-OWNER |
| Implementation blocked | Document in DEPENDENCIES, alert SCRUM-MASTER |
| Code review rejection | DEV addresses feedback, resubmit |
| Critical bugs in QA | Create tickets, prioritize, fix |
| Performance issues | SENIOR-DEV optimization review |

## File Locations

```
docs/
├── 1-BASELINE/
│   ├── research/research-report.md
│   ├── product/prd.md
│   ├── architecture/
│   │   ├── architecture-overview.md
│   │   ├── database-schema.md
│   │   ├── api-spec.md
│   │   └── decisions/ADR-*.md
│   └── ux/
│       ├── user-flows.md
│       ├── wireframes/
│       └── ui-spec.md
├── 2-MANAGEMENT/
│   ├── epics/current/epic-XX-*.md
│   └── sprints/sprint-XX.md
└── 4-RELEASE/
    ├── release-notes.md
    └── changelog.md

.claude/state/
├── TASK-QUEUE.md
├── HANDOFFS.md
├── DEPENDENCIES.md
├── METRICS.md
└── AGENT-STATE.md
```

## Quick Start Checklist

Starting a new epic:

1. [ ] RESEARCH-AGENT: Create research report
2. [ ] PM-AGENT: Create PRD with user stories
3. [ ] ARCHITECT-AGENT: Design architecture, write ADRs
4. [ ] UX-DESIGNER: Create user flows and wireframes
5. [ ] PRODUCT-OWNER: Prioritize stories, create epic doc
6. [ ] SCRUM-MASTER: Plan first sprint, assign tasks
7. [ ] Start TDD cycle for first story
