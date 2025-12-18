## 8. Agent Workspace Setup

### What are Workspaces?

**Agent workspaces** are the state files that agents use to coordinate work:

- **AGENT-STATE.md** - Which agents are doing what
- **TASK-QUEUE.md** - Prioritized task list
- **HANDOFFS.md** - Agent-to-agent transitions
- **DEPENDENCIES.md** - Task dependencies
- **DECISION-LOG.md** - Architectural decisions
- **AGENT-MEMORY.md** - Context and history
- **METRICS.md** - Progress tracking

### How They Help

**Without workspaces:**
- 😞 No visibility into what's happening
- 😞 Duplicate work
- 😞 Lost context between sessions
- 😞 No coordination

**With workspaces:**
- 😊 Clear task ownership
- 😊 Visible progress
- 😊 Persistent memory
- 😊 Smooth handoffs

### Initial Setup

**Step 1: Create State Directory**

This section describes how to set up agent workspace files for coordination.

```bash
mkdir -p .claude/state
cd .claude/state
```

**Step 2: Create Core State Files**

**AGENT-STATE.md:**

```markdown
# Agent State

**Last Updated:** [Date Time]
**Updated By:** [Human / Agent Name]

## Active Agents

| Agent | Task | Story | Started | ETA | Status |
|-------|------|-------|---------|-----|--------|
| - | - | - | - | - | - |

_No active agents yet - migration in progress_

## Available Agents

All agents available:
- Planning: RESEARCH, PM, UX, ARCHITECT, PRODUCT-OWNER, SCRUM-MASTER
- Development: TEST-ENGINEER, BACKEND-DEV, FRONTEND-DEV, SENIOR-DEV
- Quality: QA-AGENT, CODE-REVIEWER, TECH-WRITER

## Agent History

| Date | Agent | Task | Duration | Outcome |
|------|-------|------|----------|---------|
| [Date] | Human | Project migration | - | In progress |

## Notes

Documentation structure organized on [Date].
Ready to begin agent-based development.

---
```

**TASK-QUEUE.md:**

```markdown
# Task Queue

**Last Updated:** [Date Time]
**Managed By:** ORCHESTRATOR / SCRUM-MASTER

## Active Tasks

| Priority | Agent | Task | Story | Status | Blocking | ETA |
|----------|-------|------|-------|--------|----------|-----|
| - | - | - | - | - | - | - |

_No active tasks - add tasks as work begins_

## Queued Tasks

| Priority | Task | Story | Assigned To | Dependencies | Wait Reason |
|----------|------|-------|-------------|--------------|-------------|
| P0 | Complete migration validation | - | Human | None | - |
| P1 | Document current features as epics | - | PM-AGENT | Migration complete | - |
| P2 | Set up first sprint | - | SCRUM-MASTER | Epics documented | - |

## Blocked Tasks

| Task | Story | Agent | Blocked By | Since | Resolution Plan |
|------|-------|-------|------------|-------|-----------------|
| - | - | - | - | - | - |

_No blocked tasks_

## Completed Today

| Task | Agent | Completed | Duration |
|------|-------|-----------|----------|
| - | - | - | - |

## Task Priorities

- **P0 (Critical):** Must complete today, blocking other work
- **P1 (High):** Current sprint, important
- **P2 (Medium):** Current sprint, nice-to-have
- **P3 (Low):** Backlog, future work

---
```

**HANDOFFS.md:**

```markdown
# Handoffs

Tracks work handoffs between agents.

**Last Updated:** [Date]

## Pending Handoffs

| From | To | Artifact | Context | Scheduled | Status |
|------|----| ---------|---------|-----------|--------|
| - | - | - | - | - | - |

_No pending handoffs_

## Recent Handoffs

| Date | From | To | Artifact | Success |
|------|------|----|-----------| --------|
| [Date] | Human | System | Migration | ✅ In Progress |

## Handoff Template

```markdown
### Handoff: [From Agent] → [To Agent]

**Date:** [Date Time]
**Artifact:** [What is being handed off]

**Context:**
[Summary of work completed]

**Next Steps for [To Agent]:**
1. [Step 1]
2. [Step 2]

**Files:**
- [File 1]
- [File 2]

**Status:** [Pending / Complete / Blocked]
```

---
```

**DEPENDENCIES.md:**

```markdown
# Task Dependencies

Maps dependencies between tasks and stories.

**Last Updated:** [Date]

## Dependency Graph

```
[To be populated as work begins]
```

## Blocked Items

| Item | Blocked By | Impact | Owner | Resolution ETA |
|------|------------|--------|-------|----------------|
| - | - | - | - | - |

_No blocked items_

## Dependency Rules

1. **Story dependencies:**
   - Technical: Story A must complete before Story B can start
   - Business: Priority order defined by Product Owner

2. **Task dependencies:**
   - Sequential: Tests before implementation (TDD)
   - Parallel: Independent tasks can run simultaneously

3. **Epic dependencies:**
   - Foundation epics before feature epics
   - Infrastructure before applications

---
```

**DECISION-LOG.md:**

```markdown
# Decision Log

Architectural and technical decisions made during development.

**Last Updated:** [Date]

## Active Decisions

| ID | Date | Decision | Rationale | Owner | Status |
|----|------|----------|-----------|-------|--------|
| D-001 | [Date] | Adopt Agent Methodology Pack | Improve dev workflow | Team | ✅ Approved |

## Decision Details

### D-001: Adopt Agent Methodology Pack

**Date:** [Date]
**Status:** Approved ✅
**Owner:** [Your Name]

**Context:**
Project needs better organization and workflow management.

**Decision:**
Migrate to Agent Methodology Pack for multi-agent development.

**Rationale:**
- Organized documentation structure
- Clear agent workflows
- Better state management
- Token budget optimization

**Alternatives Considered:**
1. Continue with current structure (rejected - disorganized)
2. Custom workflow (rejected - too much effort)

**Consequences:**
- Positive: Better organization, clearer workflows
- Negative: Initial migration time investment

**Related Decisions:**
None

---

## Decision Template

```markdown
### D-XXX: [Decision Title]

**Date:** [Date]
**Status:** [Proposed / Approved / Rejected / Superseded]
**Owner:** [Name]

**Context:**
[What problem are we solving?]

**Decision:**
[What did we decide?]

**Rationale:**
[Why did we decide this?]

**Alternatives Considered:**
1. [Alternative 1] - [Why rejected]
2. [Alternative 2] - [Why rejected]

**Consequences:**
- **Positive:** [Benefits]
- **Negative:** [Drawbacks]

**Related Decisions:**
[Link to related decisions]
```

---
```

**AGENT-MEMORY.md:**

```markdown
# Agent Memory

Persistent context and memory across agent sessions.

**Last Updated:** [Date]

## Project Context

**Project Name:** [Your Project]
**Project Type:** [Type]
**Tech Stack:** [Stack]
**Current Phase:** Migration to Agent Methodology Pack

## Key Facts

- Migration started: [Date]
- Team size: [N people]
- Current sprint: [Sprint N or "Not started"]
- Active epics: [N or "None yet"]

## Important Patterns

_To be populated as development begins_

## Learnings

### Migration Phase

- Successfully migrated to Agent Methodology Pack
- Documentation structure implemented
- State files initialized

## Context Budget

**Session Token Usage:**
- Reserved: ~1,500 tokens (CLAUDE.md, PROJECT-STATE.md, agent def)
- Available: ~198,500 tokens (for 200K context window)

**High-Value Context:**
- @CLAUDE.md - Always load
- @PROJECT-STATE.md - Always load
- @docs/2-MANAGEMENT/epics/current/ - Load for active work

## Notes

[Any additional notes or reminders for agents]

---
```

**METRICS.md:**

```markdown
# Metrics

Tracks project progress and performance.

**Last Updated:** [Date]

## Sprint Metrics

| Sprint | Start | End | Stories | Points | Velocity | Completion |
|--------|-------|-----|---------|--------|----------|------------|
| - | - | - | - | - | - | - |

_Metrics will populate as sprints begin_

## Quality Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Test Coverage | [%] | 80% | [Status] |
| Bug Count | [N] | <10 | [Status] |
| Code Review Time | [hours] | <24h | [Status] |

## Agent Metrics

| Agent | Tasks Completed | Avg Duration | Success Rate |
|-------|-----------------|--------------|--------------|
| - | - | - | - |

_Agent metrics tracked automatically_

## Trends

[Charts and trend analysis to be added]

---
```

### Customizing Per Project

**Small project customization:**

```markdown
# Simplified AGENT-STATE.md for small projects

## Current Work
- [ ] Task 1
- [ ] Task 2
- [x] Task 3 (completed)

## Next Up
- Task 4
- Task 5

Simple and lightweight.
```

**Enterprise project customization:**

```markdown
# Detailed AGENT-STATE.md for enterprise

## Active Agents by Team

### Team A (Frontend)
| Agent | Task | Story | Started | ETA |
|-------|------|-------|---------|-----|
| FRONTEND-DEV | Login UI | 1.2 | 12/05 | 12/06 |

### Team B (Backend)
| Agent | Task | Story | Started | ETA |
|-------|------|-------|---------|-----|
| BACKEND-DEV | Auth API | 1.1 | 12/04 | 12/05 |

## Capacity Planning

- Team A: 40 hours/week available, 32 allocated
- Team B: 40 hours/week available, 38 allocated

Complex coordination.
```

**Recommended customizations by project type:**

| Project Type | Customize | How |
|--------------|-----------|-----|
| Solo project | TASK-QUEUE | Simplify to personal todo list |
| Team project | HANDOFFS | Add team member names |
| Open source | DECISION-LOG | Public-facing ADRs |
| Enterprise | METRICS | Add SLA tracking |
| Startup | TASK-QUEUE | Add business metrics |

---

