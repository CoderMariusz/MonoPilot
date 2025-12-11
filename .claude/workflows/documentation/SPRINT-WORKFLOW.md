# Sprint Workflow

> **Version:** 1.0
> **Definition:** @.claude/workflows/definitions/engineering/sprint-workflow.yaml
> **Updated:** 2025-12-10

---

## Overview

Sprint management workflow covering the complete sprint lifecycle from initialization to retrospective. The ORCHESTRATOR initializes each sprint, agents work through the daily cycle, and the sprint concludes with review, retrospective, and archival.

## ASCII Flow Diagram

```
                              SPRINT WORKFLOW
                                    |
                                    v
+===========================================================================+
|                         SPRINT START                                       |
+===========================================================================+
|                                                                           |
|   +-------------------------------------------------------------------+  |
|   | ORCHESTRATOR Initializes Sprint                                    |  |
|   +-------------------------------------------------------------------+  |
|   | 1. Create sprint folder                                            |  |
|   | 2. Set sprint goal                                                 |  |
|   | 3. Define capacity                                                 |  |
|   | 4. Initialize TASK-QUEUE.md                                        |  |
|   | 5. Update PROJECT-STATE.md                                         |  |
|   +-------------------------------------------------------------------+  |
|                                    |                                      |
|                                    v                                      |
|   +-------------------------------------------------------------------+  |
|   | SCRUM-MASTER: Sprint Planning                                      |  |
|   +-------------------------------------------------------------------+  |
|   | 1. Review prioritized backlog                                      |  |
|   | 2. Select stories for sprint                                       |  |
|   | 3. Break stories into tasks                                        |  |
|   | 4. Estimate and assign                                             |  |
|   | 5. Commit to sprint scope                                          |  |
|   +-------------------------------------------------------------------+  |
|                                    |                                      |
|                                    v                                      |
|   +-------------------------------------------------------------------+  |
|   | GATE: Sprint Ready                                                 |  |
|   | [ ] Goal defined                                                   |  |
|   | [ ] Capacity calculated                                            |  |
|   | [ ] Stories selected                                               |  |
|   | [ ] Tasks created                                                  |  |
|   | [ ] All assigned                                                   |  |
|   +-------------------------------------------------------------------+  |
|                                                                           |
+===========================================================================+
                                    |
                                    v
+===========================================================================+
|                         DAILY CYCLE                                        |
|                    (Repeats for Sprint Duration)                           |
+===========================================================================+
|                                                                           |
|   +===================================================================+  |
|   |                     MORNING STANDUP                                |  |
|   +===================================================================+  |
|   |                                                                    |  |
|   |   +------------------------------------------------------------+  |  |
|   |   | SCRUM-MASTER (Sonnet)                                       |  |  |
|   |   +------------------------------------------------------------+  |  |
|   |   | 1. Review AGENT-STATE.md                                    |  |  |
|   |   | 2. Check TASK-QUEUE.md progress                             |  |  |
|   |   | 3. Identify blockers                                        |  |  |
|   |   | 4. Update status report                                     |  |  |
|   |   +------------------------------------------------------------+  |  |
|   |                            |                                       |  |
|   |                            v                                       |  |
|   |   +------------------------------------------------------------+  |  |
|   |   | STANDUP REPORT                                              |  |  |
|   |   | - Completed yesterday                                       |  |  |
|   |   | - Planned for today                                         |  |  |
|   |   | - Blockers identified                                       |  |  |
|   |   | - Sprint health status                                      |  |  |
|   |   +------------------------------------------------------------+  |  |
|   |                                                                    |  |
|   +===================================================================+  |
|                                    |                                      |
|                                    v                                      |
|   +===================================================================+  |
|   |                     TASK QUEUE UPDATE                              |  |
|   +===================================================================+  |
|   |                                                                    |  |
|   |   +------------------------------------------------------------+  |  |
|   |   | ORCHESTRATOR                                                |  |  |
|   |   +------------------------------------------------------------+  |  |
|   |   | 1. Process completed tasks                                  |  |  |
|   |   | 2. Resolve dependencies                                     |  |  |
|   |   | 3. Assign ready tasks                                       |  |  |
|   |   | 4. Handle blocked items                                     |  |  |
|   |   | 5. Update priorities                                        |  |  |
|   |   +------------------------------------------------------------+  |  |
|   |                                                                    |  |
|   +===================================================================+  |
|                                    |                                      |
|                                    v                                      |
|   +===================================================================+  |
|   |                     AGENT WORK                                     |  |
|   |                  (Parallel Execution)                              |  |
|   +===================================================================+  |
|   |                                                                    |  |
|   |   +------------------+  +------------------+  +------------------+ |  |
|   |   | STORY A          |  | STORY B          |  | BUG FIXES        | |  |
|   |   | STORY-WORKFLOW   |  | STORY-WORKFLOW   |  | BUG-WORKFLOW     | |  |
|   |   +------------------+  +------------------+  +------------------+ |  |
|   |   |                  |  |                  |  |                  | |  |
|   |   | UX -> TEST ->    |  | TEST -> DEV ->   |  | TRIAGE ->        | |  |
|   |   | DEV -> QA ->     |  | QA -> REVIEW     |  | FIX -> VERIFY    | |  |
|   |   | REVIEW -> DONE   |  |                  |  |                  | |  |
|   |   +------------------+  +------------------+  +------------------+ |  |
|   |                                                                    |  |
|   +===================================================================+  |
|                                    |                                      |
|                                    v                                      |
|   +===================================================================+  |
|   |                     QUALITY GATES                                  |  |
|   +===================================================================+  |
|   |                                                                    |  |
|   |   +------------------------------------------------------------+  |  |
|   |   | Throughout the Day                                          |  |  |
|   |   +------------------------------------------------------------+  |  |
|   |   | [ ] Tests passing for completed work                        |  |  |
|   |   | [ ] Code reviews completed                                  |  |  |
|   |   | [ ] No critical bugs unaddressed                            |  |  |
|   |   | [ ] Documentation updated                                   |  |  |
|   |   +------------------------------------------------------------+  |  |
|   |                                                                    |  |
|   +===================================================================+  |
|                                    |                                      |
|                                    v                                      |
|   +===================================================================+  |
|   |                     END OF DAY                                     |  |
|   +===================================================================+  |
|   |                                                                    |  |
|   |   +------------------------------------------------------------+  |  |
|   |   | SCRUM-MASTER                                                |  |  |
|   |   +------------------------------------------------------------+  |  |
|   |   | 1. Update METRICS.md with burndown                          |  |  |
|   |   | 2. Record decisions in DECISION-LOG.md                      |  |  |
|   |   | 3. Update AGENT-STATE.md                                    |  |  |
|   |   | 4. Prepare next day priorities                              |  |  |
|   |   +------------------------------------------------------------+  |  |
|   |                                                                    |  |
|   +===================================================================+  |
|                                    |                                      |
|                          +--------+--------+                              |
|                          |                 |                              |
|                   More Days?          Last Day?                           |
|                          |                 |                              |
|                          v                 v                              |
|                   Loop to             Continue to                         |
|                   Morning             Sprint End                          |
|                                                                           |
+===========================================================================+
                                    |
                                    v
+===========================================================================+
|                         SPRINT END                                         |
+===========================================================================+
|                                                                           |
|   +===================================================================+  |
|   |                     SPRINT REVIEW                                  |  |
|   +===================================================================+  |
|   |                                                                    |  |
|   |   +------------------------------------------------------------+  |  |
|   |   | SCRUM-MASTER + PRODUCT-OWNER (Sonnet)                       |  |  |
|   |   +------------------------------------------------------------+  |  |
|   |   | 1. Demo completed stories                                   |  |  |
|   |   | 2. Review acceptance criteria                               |  |  |
|   |   | 3. Accept or reject stories                                 |  |  |
|   |   | 4. Gather feedback                                          |  |  |
|   |   | 5. Update backlog                                           |  |  |
|   |   +------------------------------------------------------------+  |  |
|   |                            |                                       |  |
|   |                            v                                       |  |
|   |   +------------------------------------------------------------+  |  |
|   |   | REVIEW REPORT                                               |  |  |
|   |   | - Stories completed: X/Y                                    |  |  |
|   |   | - Stories accepted: X                                       |  |  |
|   |   | - Carry-over: Y                                             |  |  |
|   |   | - Feedback summary                                          |  |  |
|   |   +------------------------------------------------------------+  |  |
|   |                                                                    |  |
|   +===================================================================+  |
|                                    |                                      |
|                                    v                                      |
|   +===================================================================+  |
|   |                     SPRINT RETROSPECTIVE                           |  |
|   +===================================================================+  |
|   |                                                                    |  |
|   |   +------------------------------------------------------------+  |  |
|   |   | SCRUM-MASTER (Sonnet)                                       |  |  |
|   |   +------------------------------------------------------------+  |  |
|   |   | 1. What went well?                                          |  |  |
|   |   | 2. What needs improvement?                                  |  |  |
|   |   | 3. Action items for next sprint                             |  |  |
|   |   | 4. Update process documentation                             |  |  |
|   |   +------------------------------------------------------------+  |  |
|   |                            |                                       |  |
|   |                            v                                       |  |
|   |   +------------------------------------------------------------+  |  |
|   |   | RETROSPECTIVE REPORT                                        |  |  |
|   |   | - Successes                                                 |  |  |
|   |   | - Improvements                                              |  |  |
|   |   | - Action items                                              |  |  |
|   |   +------------------------------------------------------------+  |  |
|   |                                                                    |  |
|   +===================================================================+  |
|                                    |                                      |
|                                    v                                      |
|   +===================================================================+  |
|   |                     VELOCITY TRACKING                              |  |
|   +===================================================================+  |
|   |                                                                    |  |
|   |   +------------------------------------------------------------+  |  |
|   |   | SCRUM-MASTER                                                |  |  |
|   |   +------------------------------------------------------------+  |  |
|   |   | 1. Calculate velocity (points completed)                    |  |  |
|   |   | 2. Update velocity history                                  |  |  |
|   |   | 3. Calculate moving average                                 |  |  |
|   |   | 4. Forecast future sprints                                  |  |  |
|   |   +------------------------------------------------------------+  |  |
|   |                                                                    |  |
|   +===================================================================+  |
|                                    |                                      |
|                                    v                                      |
|   +===================================================================+  |
|   |                     ARCHIVE & TRANSITION                           |  |
|   +===================================================================+  |
|   |                                                                    |  |
|   |   +------------------------------------------------------------+  |  |
|   |   | TECH-WRITER (Sonnet)                                        |  |  |
|   |   +------------------------------------------------------------+  |  |
|   |   | 1. Archive sprint documentation                             |  |  |
|   |   | 2. Update release notes                                     |  |  |
|   |   | 3. Update changelog                                         |  |  |
|   |   | 4. Archive completed stories                                |  |  |
|   |   +------------------------------------------------------------+  |  |
|   |                            |                                       |  |
|   |                            v                                       |  |
|   |   +------------------------------------------------------------+  |  |
|   |   | ORCHESTRATOR                                                |  |  |
|   |   +------------------------------------------------------------+  |  |
|   |   | 1. Reset TASK-QUEUE.md                                      |  |  |
|   |   | 2. Update PROJECT-STATE.md                                  |  |  |
|   |   | 3. Prepare for next sprint                                  |  |  |
|   |   +------------------------------------------------------------+  |  |
|   |                                                                    |  |
|   +===================================================================+  |
|                                                                           |
+===========================================================================+
                                    |
                                    v
                    +-------------------------------+
                    |       SPRINT COMPLETE         |
                    | -> Next Sprint Planning       |
                    | -> Or Release if milestone    |
                    +-------------------------------+
```

## Detailed Steps

### Sprint Start

#### Step 1: ORCHESTRATOR Initialization
**Model:** Sonnet
**Duration:** 15-30 minutes

1. **Create Sprint Structure**
   ```
   docs/2-MANAGEMENT/sprints/
   └── sprint-{N}/
       ├── sprint-plan.md
       ├── daily/
       │   ├── day-01.md
       │   ├── day-02.md
       │   └── ...
       └── retrospective.md
   ```

2. **Initialize Sprint Files**
   - Create `sprint-plan.md` with template
   - Update `PROJECT-STATE.md` with new sprint
   - Clear completed tasks from `TASK-QUEUE.md`

3. **Set Sprint Parameters**
   ```markdown
   ## Sprint {N} Configuration

   **Duration:** {X} days
   **Start Date:** YYYY-MM-DD
   **End Date:** YYYY-MM-DD
   **Capacity:** {X} story points / {Y} hours
   **Goal:** {sprint goal}
   ```

#### Step 1.5: Documentation Sync Check (DOC-AUDITOR)
**Model:** Sonnet
**Duration:** 30 minutes
**Trigger:** Every sprint start

**Purpose:** Catch documentation drift BEFORE sprint work begins

1. **Quick Drift Detection**
   ```markdown
   ## Sprint {N} Documentation Sync Check

   ### Changed Since Last Sprint
   | Area | Code Changes | Doc Status | Action |
   |------|--------------|------------|--------|
   | API endpoints | 3 new | Not documented | UPDATE |
   | Database schema | 2 modified | Outdated | UPDATE |
   | Config options | 1 new | Missing | CREATE |

   ### Drift Score: X%
   - 0-10%: GREEN - proceed with sprint
   - 11-25%: YELLOW - schedule doc updates this sprint
   - 26%+: RED - prioritize doc sync before new features
   ```

2. **Auto-detect Changes**
   - Compare git commits since last sprint
   - Identify API/schema/config changes
   - Cross-reference with docs/ folder
   - Flag undocumented changes

3. **Output**
   - If GREEN: Continue to planning
   - If YELLOW: Add doc tasks to sprint backlog
   - If RED: Alert SCRUM-MASTER, may need doc sprint

#### Step 2: Sprint Planning (SCRUM-MASTER)
**Model:** Sonnet
**Duration:** 1-2 hours

1. **Review Backlog**
   - Read prioritized backlog from PRODUCT-OWNER
   - **Review doc sync check results** (from Step 1.5)
   - Review story readiness
   - Check dependencies

2. **Select Stories**
   - Match capacity to story points
   - Consider dependencies
   - Balance types (frontend/backend/full-stack)

3. **Break Down Tasks**
   - Create tasks for each story
   - Estimate task hours
   - Identify parallel work

4. **Assign Work**
   - Match tasks to agent capabilities
   - Balance workload
   - Document assignments

**Sprint Planning Output:**
```markdown
## Sprint {N} Plan

### Sprint Goal
{Clear, achievable goal}

### Selected Stories
| ID | Story | Points | Priority | Status |
|----|-------|--------|----------|--------|
| S-1.1 | Story name | 5 | Must | Ready |
| S-1.2 | Story name | 3 | Should | Ready |

### Total Commitment
- Story Points: {total}
- Estimated Hours: {total}
- Capacity Used: {percentage}%

### Task Breakdown
| Task | Story | Agent | Estimate | Depends On |
|------|-------|-------|----------|------------|
| T-001 | S-1.1 | TEST-ENGINEER | 2h | - |
| T-002 | S-1.1 | BACKEND-DEV | 4h | T-001 |

### Risks
| Risk | Mitigation |
|------|------------|
| {risk} | {mitigation} |
```

#### Quality Gate: Sprint Ready
- [ ] Sprint goal is clear and achievable
- [ ] Capacity calculated accurately
- [ ] Stories selected and prioritized
- [ ] Tasks created with estimates
- [ ] All tasks assigned to agents
- [ ] Dependencies identified
- [ ] Risks documented

---

### Daily Cycle

#### Morning Standup (SCRUM-MASTER)
**Model:** Sonnet
**Duration:** 15-30 minutes
**Time:** Start of each day

1. **Review State Files**
   - Read `AGENT-STATE.md` for agent status
   - Read `TASK-QUEUE.md` for task progress
   - Read `DEPENDENCIES.md` for blockers

2. **Generate Standup Report**
   ```markdown
   ## Daily Standup: Sprint {N}, Day {X}

   **Date:** YYYY-MM-DD

   ### Completed Yesterday
   | Task | Agent | Story |
   |------|-------|-------|
   | T-001 | TEST-ENGINEER | S-1.1 |

   ### Planned Today
   | Task | Agent | Story | Priority |
   |------|-------|-------|----------|
   | T-002 | BACKEND-DEV | S-1.1 | High |

   ### Blockers
   | Task | Blocker | Owner | Action |
   |------|---------|-------|--------|
   | T-003 | Waiting for API spec | PM-AGENT | Escalate |

   ### Sprint Health
   - Stories In Progress: {X}
   - Stories Completed: {Y}
   - Burndown Status: On Track / Behind / Ahead
   - Risk Level: Low / Medium / High
   ```

3. **Resolve Blockers**
   - Escalate to appropriate agent
   - Update `DEPENDENCIES.md`
   - Notify affected parties

#### Task Queue Update (ORCHESTRATOR)
**Model:** Sonnet
**Duration:** 15-30 minutes
**Time:** After standup

1. **Process Completed Tasks**
   - Mark tasks as done
   - Update story progress
   - Trigger dependent tasks

2. **Resolve Dependencies**
   - Check `DEPENDENCIES.md`
   - Unblock ready tasks
   - Update dependency status

3. **Assign Ready Tasks**
   - Match tasks to available agents
   - Update `TASK-QUEUE.md`
   - Update `AGENT-STATE.md`

4. **Update TASK-QUEUE.md**
   ```markdown
   ## Task Queue: Sprint {N}, Day {X}

   ### Active Tasks
   | ID | Task | Agent | Story | Status | Start |
   |----|------|-------|-------|--------|-------|
   | T-002 | Implement API | BACKEND-DEV | S-1.1 | In Progress | 09:00 |

   ### Ready (Unassigned)
   | ID | Task | Story | Priority | Depends On |
   |----|------|-------|----------|------------|
   | T-004 | Write E2E tests | S-1.1 | High | T-002 |

   ### Blocked
   | ID | Task | Blocked By | Since |
   |----|------|------------|-------|
   | T-003 | API spec | PM-AGENT | Day 1 |

   ### Completed Today
   | ID | Task | Agent | Duration |
   |----|------|-------|----------|
   | T-001 | Unit tests | TEST-ENGINEER | 2h |
   ```

#### Agent Work (Parallel Execution)
**Duration:** Throughout the day

Multiple workflows execute in parallel:

1. **Story Workflows**
   - Each story follows STORY-WORKFLOW
   - Multiple stories can be in different phases
   - Handoffs recorded in `HANDOFFS.md`

2. **Bug Workflows**
   - Bugs follow BUG-WORKFLOW
   - Prioritized by severity
   - Integrated with sprint work

3. **Work Distribution**
   ```
   TIME     STORY A        STORY B        BUGS
   -----    --------       --------       ----
   09:00    TEST (RED)     -              -
   10:00    TEST (RED)     TEST (RED)     -
   11:00    DEV (GREEN)    TEST (RED)     BUG-042 (Simple)
   12:00    DEV (GREEN)    DEV (GREEN)    -
   13:00    DEV (GREEN)    DEV (GREEN)    BUG-043 (Medium)
   14:00    DEV (REFAC)    DEV (GREEN)    BUG-043 (Medium)
   15:00    QA             DEV (REFAC)    -
   16:00    REVIEW         QA             -
   17:00    DONE           REVIEW         BUG-043 CLOSED
   ```

#### Quality Gates (Throughout Day)
**Continuous monitoring**

| Gate | Frequency | Owner | Action on Fail |
|------|-----------|-------|----------------|
| Tests passing | On each commit | DEV | Fix before continue |
| Code review | On completion | CODE-REVIEWER | Request changes |
| Bug triage | On report | QA-AGENT | Prioritize and route |
| Documentation | On feature done | TECH-WRITER | Update before close |

#### End of Day (SCRUM-MASTER)
**Model:** Sonnet
**Duration:** 30 minutes
**Time:** End of each day

1. **Update Metrics**
   ```markdown
   ## Burndown: Sprint {N}, Day {X}

   ### Points
   | Day | Planned | Actual | Remaining |
   |-----|---------|--------|-----------|
   | 1 | 20 | 18 | 18 |
   | 2 | 16 | 15 | 15 |
   | 3 | 12 | 13 | 13 |  <- Today

   ### Burndown Chart
   Points
   20 |*
   18 | *-*
   16 |   '-*
   14 |      '-.
   12 |         '-.
   10 |            '-.
    8 |               '-.
    6 |                  '-.
    4 |                     '-.
    2 |                        '-.
    0 +---------------------------
      1  2  3  4  5  6  7  8  9  10
                 Days
   ```

2. **Record Decisions**
   - Update `DECISION-LOG.md` with daily decisions
   - Document any scope changes
   - Note risk changes

3. **Update Agent State**
   - Record end-of-day status
   - Note any carryover work
   - Prepare next day assignments

4. **Prepare Tomorrow**
   - Prioritize next day tasks
   - Pre-assign critical work
   - Note early meetings/dependencies

---

### Sprint End

#### Documentation Audit (DOC-AUDITOR) - Before Review
**Model:** Sonnet
**Duration:** 30 minutes - 1 hour

**Purpose:** Verify documentation quality before sprint closes

1. **Check Documentation Completeness**
   - All completed features documented
   - API changes reflected in docs
   - README updated if needed
   - Architecture docs current

2. **Audit Output**
   ```markdown
   ## Sprint {N} Documentation Audit

   ### Documentation Status
   | Story | Feature Docs | API Docs | README | Status |
   |-------|--------------|----------|--------|--------|
   | S-1.1 | ✓ | ✓ | N/A | OK |
   | S-1.2 | ✓ | Missing | N/A | NEEDS UPDATE |

   ### Required Updates
   - [ ] {doc that needs update}

   ### Recommendation
   - PASS: Docs complete
   - NEEDS WORK: {list items}
   ```

3. **Handoff**
   - If NEEDS WORK: Route to TECH-WRITER before review
   - If PASS: Continue to Sprint Review

#### Sprint Review (SCRUM-MASTER + PRODUCT-OWNER)
**Model:** Sonnet
**Duration:** 1-2 hours

1. **Demo Completed Work**
   - Walk through each completed story
   - Show working functionality
   - Demonstrate acceptance criteria met

2. **Accept or Reject Stories**
   ```markdown
   ## Sprint {N} Review

   ### Story Acceptance
   | Story | Demo | AC Met | Decision | Notes |
   |-------|------|--------|----------|-------|
   | S-1.1 | Yes | 5/5 | ACCEPTED | - |
   | S-1.2 | Yes | 4/5 | ACCEPTED* | Minor AC pending |
   | S-1.3 | No | 2/5 | REJECTED | Incomplete |

   ### Summary
   - Stories Committed: 5
   - Stories Completed: 4
   - Stories Accepted: 3
   - Carry-over: 2

   ### Feedback
   {Stakeholder feedback summary}
   ```

3. **Update Backlog**
   - Move rejected stories back
   - Add new stories from feedback
   - Reprioritize as needed

#### Sprint Retrospective (SCRUM-MASTER)
**Model:** Sonnet
**Duration:** 1 hour

1. **What Went Well**
   - Celebrate successes
   - Identify practices to continue
   - Note effective patterns

2. **What Needs Improvement**
   - Identify pain points
   - Analyze root causes
   - Propose solutions

3. **Action Items**
   - Specific, actionable improvements
   - Assign owners
   - Set deadlines

**Retrospective Template:**
```markdown
## Sprint {N} Retrospective

**Date:** YYYY-MM-DD

### What Went Well
- {success 1}
- {success 2}
- {success 3}

### What Needs Improvement
| Issue | Root Cause | Impact |
|-------|------------|--------|
| {issue} | {cause} | {impact} |

### Action Items
| Action | Owner | Deadline | Status |
|--------|-------|----------|--------|
| {action} | {agent} | YYYY-MM-DD | Open |

### Process Changes
- [ ] {change to implement next sprint}

### Team Health
- Morale: Good / Okay / Needs Attention
- Workload: Light / Balanced / Heavy
- Collaboration: Strong / Adequate / Needs Work
```

#### Velocity Tracking (SCRUM-MASTER)
**Model:** Sonnet
**Duration:** 15-30 minutes

1. **Calculate Velocity**
   - Count completed story points
   - Compare to commitment
   - Calculate completion rate

2. **Update History**
   ```markdown
   ## Velocity History

   | Sprint | Committed | Completed | Velocity | Notes |
   |--------|-----------|-----------|----------|-------|
   | 1 | 20 | 18 | 18 | Learning curve |
   | 2 | 18 | 20 | 20 | Momentum |
   | 3 | 22 | 19 | 19 | Bug spike |
   | 4 | 20 | 21 | 21 | <- Current |

   ### Metrics
   - Average Velocity: 19.5
   - Velocity Trend: Stable
   - Recommended Commitment: 19-20 points
   ```

3. **Forecast**
   - Use average velocity for planning
   - Adjust for known factors
   - Communicate with PRODUCT-OWNER

#### Archive & Transition

##### TECH-WRITER Archive
**Model:** Sonnet
**Duration:** 1-2 hours

1. **Archive Sprint Documentation**
   ```
   Move to: docs/archive/sprints/sprint-{N}/
   - sprint-plan.md
   - daily/*.md
   - retrospective.md
   ```

2. **Update Release Documentation**
   - Add completed features to release notes
   - Update changelog with all changes
   - Update user documentation

3. **Archive Completed Stories**
   ```
   Move to: docs/2-MANAGEMENT/epics/completed/
   - Stories marked DONE
   - With all related artifacts
   ```

##### ORCHESTRATOR Transition
**Model:** Sonnet
**Duration:** 15-30 minutes

1. **Reset Task Queue**
   - Clear completed tasks
   - Retain blocked/carry-over items
   - Prepare for next sprint

2. **Update Project State**
   ```markdown
   ## PROJECT-STATE.md Update

   ### Sprint Transition
   - Previous Sprint: {N} - COMPLETED
   - Current Sprint: {N+1} - PLANNING
   - Next Milestone: {milestone}

   ### Carry-over Items
   | Item | Reason | Priority |
   |------|--------|----------|
   | S-1.3 | Incomplete | High |
   | BUG-045 | Ongoing | Medium |
   ```

3. **Prepare Next Sprint**
   - Create sprint folder structure
   - Initialize empty sprint plan
   - Ready for planning session

---

## Quality Gates Summary

| Phase | Gate | Criteria |
|-------|------|----------|
| Start | Sprint Ready | Goal, capacity, stories, tasks, assignments |
| Daily | Standup | Report generated, blockers identified |
| Daily | Progress | Tasks moving, no stuck items |
| Daily | Quality | Tests passing, reviews complete |
| End | Doc Audit | DOC-AUDITOR verifies documentation complete |
| End | Review | Demo complete, stories accepted/rejected |
| End | Retro | Lessons captured, actions defined |
| End | Velocity | Metrics updated, forecast adjusted |
| End | Archive | Docs archived, state updated |

## Error Handling

### Blocker Cannot Be Resolved
```
1. SCRUM-MASTER documents in DECISION-LOG
2. Escalate to ORCHESTRATOR
3. Options:
   - Swap blocked story for another
   - Reduce sprint scope
   - Extend timeline (if critical)
4. Update all affected parties
```

### Sprint Goal At Risk
```
1. SCRUM-MASTER alerts early
2. Meet with PRODUCT-OWNER
3. Options:
   - Descope non-critical stories
   - Add resources (if available)
   - Accept partial completion
4. Document decision
5. Communicate to stakeholders
```

### Critical Bug During Sprint
```
1. Follow BUG-WORKFLOW with CRITICAL severity
2. SCRUM-MASTER adjusts sprint
3. Options:
   - Pause current work for fix
   - Bring in additional agent
   - Adjust sprint commitment
4. Track impact on velocity
```

### Agent Overloaded
```
1. Identify during standup
2. SCRUM-MASTER rebalances
3. Options:
   - Reassign tasks
   - Pair agents
   - Defer lower priority items
4. Update AGENT-STATE.md
```

## Example Scenarios

### Scenario 1: Normal Sprint Flow
```
Sprint 5: "User Profile Features"

Day 1 (Planning):
- ORCHESTRATOR initializes sprint
- SCRUM-MASTER plans: 3 stories, 18 points
- Tasks assigned to 4 agents

Days 2-4 (Execution):
- Story 5.1: Tests -> Dev -> Review -> DONE
- Story 5.2: Tests -> Dev (blocked by API)
- Story 5.3: Tests -> Dev -> Review

Day 5 (Mid-Sprint):
- Blocker resolved for Story 5.2
- Story 5.2: Continue Dev -> Review
- Story 5.3: QA -> DONE

Days 6-8 (Completion):
- Story 5.2: QA -> DONE
- All stories completed

Day 9 (Sprint End):
- Review: All 3 stories accepted
- Retro: "API dependencies need earlier resolution"
- Velocity: 18/18 = 100%
- Archive and transition
```

### Scenario 2: Sprint with Issues
```
Sprint 6: "Payment Integration"

Day 1 (Planning):
- 4 stories, 22 points committed

Day 3 (Issue):
- Critical bug BUG-050 reported
- Sprint scope adjusted: Story 6.4 deferred

Day 5 (Mid-Sprint):
- Bug fixed
- Story 6.3 blocked by external API
- SCRUM-MASTER escalates

Day 7 (Decision):
- External API won't be ready
- Story 6.3 moved to next sprint
- Focus on Stories 6.1, 6.2

Day 9 (Sprint End):
- Review: 2/4 stories accepted
- 2 stories carry over
- Retro: "External dependency management"
- Velocity: 12/22 = 55%
- Action: Better dependency tracking
```

## Metrics Tracking

### Sprint Metrics
| Metric | Calculation | Update Frequency |
|--------|-------------|------------------|
| Velocity | Points completed | End of sprint |
| Commitment Rate | Completed / Committed | End of sprint |
| Bug Rate | Bugs found / Stories | End of sprint |
| Blocker Time | Hours blocked | Daily |
| Cycle Time | Start to Done per story | Per story |

### Cumulative Metrics
| Metric | Calculation | Location |
|--------|-------------|----------|
| Average Velocity | Rolling 3-sprint avg | METRICS.md |
| Trend | Velocity change % | METRICS.md |
| Quality Score | Based on bugs, reviews | METRICS.md |
| Team Health | Retro feedback | Retrospective |

### Update in METRICS.md
```markdown
## Sprint {N} Metrics

### Velocity
- Committed: {X} points
- Completed: {Y} points
- Velocity: {Y}
- Commitment Rate: {Y/X * 100}%

### Quality
- Bugs Found: {count}
- Bug Rate: {bugs / stories}
- Review Cycles: {avg per story}
- Test Coverage: {%}

### Flow
- Avg Cycle Time: {days}
- Blocker Time: {hours}
- WIP Average: {items}

### Health
- Team Sentiment: {rating}
- Process Score: {rating}
```

## Integration with Other Workflows

| Workflow | Integration Point |
|----------|-------------------|
| EPIC-WORKFLOW | Epics broken into sprint stories |
| STORY-WORKFLOW | Stories executed during daily cycle |
| BUG-WORKFLOW | Bugs handled alongside stories |
