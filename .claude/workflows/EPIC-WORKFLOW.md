# Epic Workflow

## Overview

End-to-end process for delivering an epic from conception to completion. This workflow orchestrates multiple agents through discovery, design, planning, development, quality, and documentation phases.

## Phase Requirements Legend

| Marker | Meaning |
|--------|---------|
| `[MANDATORY]` | Cannot be skipped - phase MUST be completed |
| `[OPTIONAL]` | Can be skipped with documented reason |
| `[USER-CHOICE]` | User decides between provided options |

**IMPORTANT:** All phases in Epic Workflow are `[MANDATORY]` by default. User may request skip only with explicit reason and risk acknowledgment.

## ASCII Flow Diagram

```
                                    EPIC WORKFLOW
                                         |
                                         v
+=====================================================================================+
|                              PHASE 1: DISCOVERY                                     |
+=====================================================================================+
|                                                                                     |
|   +------------------+     +------------------+     +------------------+            |
|   | RESEARCH-AGENT   |---->| PM-AGENT         |---->| GATE: PRD        |            |
|   | (Opus/Sonnet)    |     | (Sonnet)         |     | Complete?        |            |
|   +------------------+     +------------------+     +--------+---------+            |
|   | - Market research|     | - Create PRD     |              |                      |
|   | - User interviews|     | - Define scope   |         YES  |  NO                  |
|   | - Tech analysis  |     | - User stories   |              |   |                  |
|   +------------------+     +------------------+              |   +---> Iterate      |
|                                                              |                      |
+=====================================================================================+
                                         |
                                         v
+=====================================================================================+
|                              PHASE 2: DESIGN (Parallel)                             |
+=====================================================================================+
|                                                                                     |
|   +--------------------+                    +--------------------+                  |
|   | ARCHITECT-AGENT    |                    | UX-DESIGNER        |                  |
|   | (Opus)             |                    | (Sonnet)           |                  |
|   +--------------------+                    +--------------------+                  |
|   | - System design    |                    | - User flows       |                  |
|   | - ADR creation     |                    | - Wireframes       |                  |
|   | - API design       |                    | - UI specs         |                  |
|   | - DB schema        |                    | - Accessibility    |                  |
|   +--------------------+                    +--------------------+                  |
|            |                                         |                              |
|            +-------------------+---------------------+                              |
|                                |                                                    |
|                                v                                                    |
|                    +---------------------------+                                    |
|                    | GATE: Design Complete?    |                                    |
|                    | - Architecture approved   |                                    |
|                    | - UX specs complete       |                                    |
|                    | - No blocking questions   |                                    |
|                    +-------------+-------------+                                    |
|                                  |                                                  |
+=====================================================================================+
                                   |
                                   v
+=====================================================================================+
|                              PHASE 3: PLANNING                                      |
+=====================================================================================+
|                                                                                     |
|   +------------------+     +------------------+     +------------------+            |
|   | PRODUCT-OWNER    |---->| SCRUM-MASTER     |---->| GATE: Sprint     |            |
|   | (Sonnet)         |     | (Sonnet)         |     | Ready?           |            |
|   +------------------+     +------------------+     +--------+---------+            |
|   | - Review stories |     | - Create sprint  |              |                      |
|   | - Prioritize     |     | - Assign tasks   |         YES  |  NO                  |
|   | - Refine backlog |     | - Set capacity   |              |   |                  |
|   +------------------+     +------------------+              |   +---> Refine       |
|                                                              |                      |
+=====================================================================================+
                                         |
                                         v
+=====================================================================================+
|                         PHASE 4: IMPLEMENTATION LOOP                                |
+=====================================================================================+
|                                                                                     |
|   +-----------------------------------------------------------------------+        |
|   |                         FOR EACH STORY                                 |        |
|   |                                                                        |        |
|   |   +---------+    +---------+    +---------+    +---------+            |        |
|   |   | TEST    |--->| DEV     |--->| DEV     |--->| QA      |            |        |
|   |   | (RED)   |    | (GREEN) |    | (REFAC) |    | AGENT   |            |        |
|   |   +---------+    +---------+    +---------+    +---------+            |        |
|   |        |              |              |              |                  |        |
|   |        v              v              v              v                  |        |
|   |   Write tests    Implement     Refactor      Validate                 |        |
|   |   first          to pass       & clean       quality                  |        |
|   |                                                                        |        |
|   +-----------------------------------------------------------------------+        |
|                            |                                                        |
|                            v                                                        |
|              +---------------------------+                                          |
|              | CODE-REVIEWER             |                                          |
|              | - Review changes          |                                          |
|              | - Approve or request fix  |                                          |
|              +-------------+-------------+                                          |
|                            |                                                        |
|                   APPROVED | CHANGES REQUESTED                                      |
|                            |         |                                              |
|                            v         +-----> Back to DEV                            |
+=====================================================================================+
                                         |
                                         v
+=====================================================================================+
|                              PHASE 5: QUALITY                                       |
+=====================================================================================+
|                                                                                     |
|   +------------------+     +------------------+                                     |
|   | QA-AGENT         |---->| GATE: Quality    |                                     |
|   | (Sonnet)         |     | Approved?        |                                     |
|   +------------------+     +--------+---------+                                     |
|   | - E2E testing    |              |                                               |
|   | - Regression     |         YES  |  NO                                           |
|   | - Performance    |              |   |                                           |
|   | - Security scan  |              |   +---> Back to DEV                           |
|   +------------------+              |                                               |
|                                     |                                               |
+=====================================================================================+
                                         |
                                         v
+=====================================================================================+
|                              PHASE 6: DOCUMENTATION                                 |
+=====================================================================================+
|                                                                                     |
|   +------------------+     +------------------+                                     |
|   | TECH-WRITER      |---->| GATE: Docs       |                                     |
|   | (Sonnet)         |     | Complete?        |                                     |
|   +------------------+     +--------+---------+                                     |
|   | - API docs       |              |                                               |
|   | - User guides    |         YES  |  NO                                           |
|   | - Change log     |              |   |                                           |
|   | - Release notes  |              |   +---> Iterate                               |
|   +------------------+              |                                               |
|                                     |                                               |
+=====================================================================================+
                                         |
                                         v
                            +---------------------------+
                            |      EPIC COMPLETE        |
                            | - Update PROJECT-STATE    |
                            | - Archive to completed/   |
                            | - Update METRICS          |
                            +---------------------------+
```

## Detailed Steps

---

### Phase 1: Discovery [MANDATORY]

#### Why This Phase Matters
| Aspect | Description |
|--------|-------------|
| **What it delivers** | Clear understanding of the problem, market context, and well-defined requirements |
| **If skipped** | Building wrong product, wasted development effort, unclear acceptance criteria |
| **Problems prevented** | Scope creep, misaligned expectations, building features nobody needs |

#### Step 1.1: Research (RESEARCH-AGENT) [MANDATORY]
**Model:** Opus or Sonnet (depending on complexity)
**Duration:** 0.5-1 day

1. Gather initial requirements from stakeholders
2. Research market context and competitors
3. Analyze existing technical constraints
4. Document unknowns and risks
5. Create research report

**Output:** `docs/1-BASELINE/research/research-report.md`

#### User Choice Point: Research Depth
**Options:**
1. **Deep Research** - Full market analysis, competitor review, user interviews (1-2 days)
2. **Quick Research** - Basic requirements gathering, known domain (0.5 day)

**Default:** Deep Research for new domains, Quick Research for familiar domains
**Decision Required:** Yes - User should confirm research depth before starting

#### Step 1.2: PRD Creation (PM-AGENT) [MANDATORY]
**Model:** Sonnet
**Duration:** 0.5-1 day

1. Review research report
2. Define product vision and goals
3. Create user personas
4. Define user stories with acceptance criteria
5. Identify success metrics
6. Document assumptions and constraints

**Output:** `docs/1-BASELINE/product/prd.md`

#### Quality Gate 1: PRD Review (MANDATORY - MUST PASS)

**Status:** BLOCKING - Cannot proceed to Phase 2 until passed

**Gate Requirements:**
- [ ] All user stories have acceptance criteria
- [ ] Success metrics are measurable
- [ ] Scope is clearly defined
- [ ] Dependencies identified
- [ ] Stakeholder approval received

**Gate Type:** APPROVAL_GATE
**Enforcer:** Product Owner / User
**Skip Policy:** User must explicitly request skip with documented reason and risk acknowledgment

**Why This Gate Matters:**
- Unclear requirements lead to wrong implementations
- Missing acceptance criteria make testing impossible
- Undefined scope causes scope creep and project delays
- Skipping causes 10x rework later in development

### Phase 1 Completion Checklist
- [ ] Research report created and reviewed
- [ ] PRD document complete with all sections
- [ ] All user stories have acceptance criteria
- [ ] Success metrics are measurable
- [ ] Gate 1 PASSED
- [ ] Handoff to Phase 2 confirmed

---

### Phase 2: Design (Parallel Execution) [MANDATORY]

#### Why This Phase Matters
| Aspect | Description |
|--------|-------------|
| **What it delivers** | System architecture, database schema, API contracts, UX specifications |
| **If skipped** | Architectural debt, inconsistent UI/UX, no clear technical direction |
| **Problems prevented** | Costly refactoring, integration issues, poor user experience |

#### Step 2.1: Architecture Design (ARCHITECT-AGENT) [MANDATORY]
**Model:** Opus
**Duration:** 1-2 days

1. Review PRD and technical requirements
2. Design system architecture
3. Create database schema
4. Define API contracts
5. Document architectural decisions (ADRs)
6. Identify technical risks

**Outputs:**
- `docs/1-BASELINE/architecture/architecture-overview.md`
- `docs/1-BASELINE/architecture/database-schema.md`
- `docs/1-BASELINE/architecture/api-spec.md`
- `docs/1-BASELINE/architecture/decisions/ADR-XXX-*.md`

#### User Choice Point: Architecture Depth
**Options:**
1. **Full Architecture** - Complete system design, all ADRs, detailed schemas (1-2 days)
2. **Lightweight Architecture** - High-level design, critical ADRs only (0.5-1 day)

**Default:** Full Architecture for new systems, Lightweight for extensions
**Decision Required:** Yes - User should confirm based on project scope

#### Step 2.2: UX Design (UX-DESIGNER) [OPTIONAL for backend-only epics]
**Model:** Sonnet
**Duration:** 1-2 days (parallel with architecture)

1. Create user flow diagrams
2. Design wireframes
3. Define UI specifications
4. Document accessibility requirements
5. Create component specifications

**Outputs:**
- `docs/1-BASELINE/ux/user-flows.md`
- `docs/1-BASELINE/ux/wireframes/`
- `docs/1-BASELINE/ux/ui-spec.md`

**Skip Condition:** May be skipped ONLY for pure backend/API epics with no UI component. User must confirm epic has no UI requirements.

#### Quality Gate 2: Design Review (MANDATORY - MUST PASS)

**Status:** BLOCKING - Cannot proceed to Phase 3 until passed

**Gate Requirements:**
- [ ] Architecture supports all PRD requirements
- [ ] ADRs documented for key decisions
- [ ] UX flows cover all user stories
- [ ] No blocking technical questions
- [ ] Design reviewed and approved

**Gate Type:** REVIEW_GATE + APPROVAL_GATE
**Enforcer:** Architect Agent (technical) + Product Owner (business)
**Skip Policy:** User must explicitly request skip with documented reason and risk acknowledgment

**Why This Gate Matters:**
- Architecture flaws are expensive to fix once code is written
- Missing ADRs lead to inconsistent future decisions
- UX gaps cause poor user experience and rework
- Skipping causes architectural debt and costly refactoring

### Phase 2 Completion Checklist
- [ ] Architecture overview document created
- [ ] Database schema defined
- [ ] API specifications documented
- [ ] ADRs created for key decisions
- [ ] UX flows complete (if applicable)
- [ ] UI specs and wireframes ready (if applicable)
- [ ] Gate 2 PASSED
- [ ] Handoff to Phase 3 confirmed

---

### Phase 3: Planning [MANDATORY]

#### Why This Phase Matters
| Aspect | Description |
|--------|-------------|
| **What it delivers** | Prioritized backlog, sprint plan, clear task assignments |
| **If skipped** | Chaotic development, unclear priorities, missed dependencies |
| **Problems prevented** | Scope creep, blocked developers, missed deadlines |

#### Step 3.1: Backlog Refinement (PRODUCT-OWNER) [MANDATORY]
**Model:** Sonnet
**Duration:** 0.25 day

1. Review epic breakdown from Architect
2. Prioritize stories using MoSCoW
3. Identify story dependencies
4. Assign complexity estimates
5. Create prioritized backlog

**Output:** `docs/2-MANAGEMENT/epics/current/epic-XX-*.md`

#### User Choice Point: Prioritization Method
**Options:**
1. **MoSCoW** - Must/Should/Could/Won't prioritization
2. **Value/Effort Matrix** - Prioritize by value vs effort
3. **WSJF** - Weighted Shortest Job First

**Default:** MoSCoW
**Decision Required:** No - Default is recommended, user may change if needed

#### Step 3.2: Sprint Planning (SCRUM-MASTER) [MANDATORY]
**Model:** Sonnet
**Duration:** 0.25 day

1. Calculate team capacity
2. Select stories for sprint
3. Create sprint backlog
4. Update task queue
5. Identify sprint risks

**Outputs:**
- `.claude/state/TASK-QUEUE.md` (updated)
- `docs/2-MANAGEMENT/sprints/sprint-XX.md`

#### Quality Gate 3: Sprint Ready (MANDATORY - MUST PASS)

**Status:** BLOCKING - Cannot proceed to Phase 4 until passed

**Gate Requirements:**
- [ ] Stories are INVEST compliant
- [ ] Dependencies resolved or planned
- [ ] Capacity matches commitment
- [ ] All stories have clear acceptance criteria
- [ ] Sprint goal defined

**Gate Type:** QUALITY_GATE + APPROVAL_GATE
**Enforcer:** Scrum Master (process) + Product Owner (priorities)
**Skip Policy:** User must explicitly request skip with documented reason and risk acknowledgment

**Why This Gate Matters:**
- Non-INVEST stories are hard to implement and estimate
- Unresolved dependencies cause blockers during sprint
- Overcapacity commitment leads to incomplete sprints
- Skipping leads to chaotic sprints and failed deliveries

### Phase 3 Completion Checklist
- [ ] All stories prioritized with MoSCoW/chosen method
- [ ] Story dependencies identified and documented
- [ ] Complexity estimates assigned (S/M/L)
- [ ] Sprint backlog created
- [ ] Task queue updated
- [ ] Sprint goal defined
- [ ] Gate 3 PASSED
- [ ] Handoff to Phase 4 confirmed

---

### Phase 4: Implementation Loop [MANDATORY]

#### Why This Phase Matters
| Aspect | Description |
|--------|-------------|
| **What it delivers** | Working, tested, reviewed code implementing user stories |
| **If skipped** | No product to deliver |
| **Problems prevented** | Untested code, unreviewed changes, inconsistent implementation |

#### Parallel Track Management

During implementation, ORCHESTRATOR detects opportunities for parallel work across multiple tracks.

**Track Assignment Rules:**
- Stories with no file/data dependencies can run on separate tracks
- Frontend and Backend stories typically run on different tracks
- Code review and testing stay on same track as implementation

**Track Detection Triggers:**
1. After sprint planning complete
2. When new story enters queue
3. After dependency resolution

**Parallel Safety Check Before Track Assignment:**
```
[PARALLEL SAFETY CHECK]

Task A: {task description}
Task B: {task description}

File Dependencies:
- Task A files: {list}
- Task B files: {list}
- Intersection: {NONE | list of shared files}

Data Dependencies:
- Task A needs output from: {NONE | list}
- Task B needs output from: {NONE | list}
- Circular: {YES | NO}

Agent Availability:
- Task A agent: {agent} - {AVAILABLE | BUSY}
- Task B agent: {agent} - {AVAILABLE | BUSY}

Result: {PARALLEL OK | SEQUENTIAL REQUIRED}
Track Assignment: {A, B, ... | SEQUENTIAL}
```

**Track Status Reporting:**
- Update TASK-QUEUE.md Track Assignments table after each change
- Report parallel progress in daily standups
- Alert when track merge point approaching

For each story in the sprint:

#### Step 4.1: UX Detail (UX-DESIGNER) [OPTIONAL - UI stories only]
**Model:** Sonnet
**Duration:** Varies

1. Create detailed component designs
2. Define interaction specifications
3. Provide assets and specifications

**Skip Condition:** Automatically skipped for backend-only stories

#### Step 4.2: Test First (TEST-ENGINEER) - RED Phase [MANDATORY]
**Model:** Sonnet
**Duration:** Varies by story size

1. Review story acceptance criteria
2. Design test strategy
3. Write failing tests
4. Document test coverage requirements

**Output:** Test files (failing)

#### Step 4.3: Implementation (DEV) - GREEN Phase [MANDATORY]
**Model:** Sonnet (SENIOR-DEV uses Opus for complex)
**Duration:** Varies by story size

1. Implement minimal code to pass tests
2. Follow coding standards
3. Handle errors appropriately
4. Ensure all tests pass

**Output:** Implementation code (tests passing)

#### User Choice Point: Developer Assignment
**Options:**
1. **BACKEND-DEV** - For backend/API work
2. **FRONTEND-DEV** - For UI/frontend work
3. **SENIOR-DEV** - For complex or full-stack work

**Default:** Based on story type
**Decision Required:** No - Orchestrator assigns based on story type

#### Step 4.4: Refactoring (DEV) - REFACTOR Phase [MANDATORY]
**Model:** Sonnet
**Duration:** 15-30% of implementation time

1. Clean up code
2. Remove duplication
3. Improve naming
4. Optimize if needed
5. Ensure tests still pass

**Output:** Clean, refactored code

#### Step 4.5: Quality Validation (QA-AGENT) [MANDATORY]
**Model:** Sonnet
**Duration:** Varies

1. Execute test suite
2. Perform manual testing
3. Validate acceptance criteria
4. Report any issues

#### Step 4.6: Code Review (CODE-REVIEWER) [MANDATORY]
**Model:** Sonnet (Haiku for simple fixes)
**Duration:** 0.5-2 hours per story

1. Review code changes
2. Check standards compliance
3. Assess security
4. Verify test coverage
5. Approve or request changes

**Output:** Review feedback, approval status

#### Quality Gate 4: Story Done (MANDATORY - MUST PASS)

**Status:** BLOCKING - Story cannot be marked as Done until passed

**Gate Requirements:**
- [ ] All tests pass (TEST_GATE)
- [ ] Code review approved (REVIEW_GATE)
- [ ] Acceptance criteria met (QUALITY_GATE)
- [ ] No critical issues (QUALITY_GATE)
- [ ] Documentation updated (QUALITY_GATE)

**Gate Type:** TEST_GATE + REVIEW_GATE + QUALITY_GATE
**Enforcer:** QA Agent (tests) + Code Reviewer (review) + Orchestrator (quality)
**Skip Policy:** User must explicitly request skip with documented reason and risk acknowledgment

**Why This Gate Matters:**
- Failing tests mean broken functionality
- Unreviewed code may contain bugs, security issues, or bad patterns
- Unmet acceptance criteria means incomplete feature
- Skipping creates technical debt and production bugs

### Phase 4 Completion Checklist (per story)
- [ ] Tests written (RED phase complete)
- [ ] Implementation complete (GREEN phase complete)
- [ ] Code refactored (REFACTOR phase complete)
- [ ] QA validation passed
- [ ] Code review approved
- [ ] Acceptance criteria met
- [ ] Gate 4 PASSED for all sprint stories
- [ ] Handoff to Phase 5 confirmed

---

### Phase 5: Quality Assurance [MANDATORY]

#### Why This Phase Matters
| Aspect | Description |
|--------|-------------|
| **What it delivers** | Validated, integrated, secure, performant system |
| **If skipped** | Broken integrations, security vulnerabilities, performance issues |
| **Problems prevented** | Production outages, data breaches, user churn |

#### Step 5.1: Integration Testing (QA-AGENT) [MANDATORY]
**Model:** Sonnet
**Duration:** 1-2 days

1. Execute E2E test suite
2. Perform regression testing
3. Validate cross-story integration
4. Performance testing
5. Security scanning

#### User Choice Point: Testing Scope
**Options:**
1. **Full QA** - Complete E2E, regression, performance, security (1-2 days)
2. **Essential QA** - E2E and critical regression only (0.5-1 day)
3. **Extended QA** - Full QA + load testing, penetration testing (2-3 days)

**Default:** Full QA
**Decision Required:** Yes for Extended QA, No for Full/Essential

#### Quality Gate 5: Quality Approved (MANDATORY - MUST PASS)

**Status:** BLOCKING - Cannot proceed to Phase 6 until passed

**Gate Requirements:**
- [ ] All E2E tests pass (TEST_GATE)
- [ ] No regression issues (QUALITY_GATE)
- [ ] Performance meets SLAs (QUALITY_GATE)
- [ ] Security scan passed (QUALITY_GATE)
- [ ] Accessibility validated (QUALITY_GATE)

**Gate Type:** TEST_GATE + QUALITY_GATE
**Enforcer:** QA Agent (primary) + Orchestrator (oversight)
**Skip Policy:** User must explicitly request skip with documented reason and risk acknowledgment

**Why This Gate Matters:**
- E2E failures mean broken user workflows
- Regressions break existing functionality
- Performance issues frustrate users and cause abandonment
- Security vulnerabilities expose user data and company liability
- Skipping risks production incidents and security breaches

### Phase 5 Completion Checklist
- [ ] All E2E tests pass
- [ ] Regression testing complete
- [ ] Performance benchmarks met
- [ ] Security scan passed
- [ ] Accessibility validated (if UI)
- [ ] Gate 5 PASSED
- [ ] Handoff to Phase 6 confirmed

---

### Phase 6: Documentation [MANDATORY]

#### Why This Phase Matters
| Aspect | Description |
|--------|-------------|
| **What it delivers** | API documentation, user guides, release notes, changelog |
| **If skipped** | Knowledge gaps, developer frustration, user confusion |
| **Problems prevented** | Support overhead, onboarding difficulties, deployment surprises |

#### Step 6.1: Documentation (TECH-WRITER) [MANDATORY]
**Model:** Sonnet
**Duration:** 0.5-1 day

1. Update API documentation
2. Create/update user guides
3. Write release notes
4. Update change log
5. Archive completed work

**Outputs:**
- `docs/3-IMPLEMENTATION/api/`
- `docs/4-RELEASE/release-notes.md`
- `docs/4-RELEASE/changelog.md`

#### User Choice Point: Documentation Scope
**Options:**
1. **Full Documentation** - API docs, user guides, release notes, internal docs
2. **Essential Documentation** - API docs and release notes only
3. **Internal Only** - Technical documentation only (for internal tools)

**Default:** Full Documentation
**Decision Required:** No - Default recommended, user may adjust for internal projects

#### Quality Gate 6: Documentation Complete (MANDATORY - MUST PASS)

**Status:** BLOCKING - Epic cannot be marked Complete until passed

**Gate Requirements:**
- [ ] API docs up to date (QUALITY_GATE)
- [ ] User guides accurate (QUALITY_GATE)
- [ ] Release notes written (QUALITY_GATE)
- [ ] All changes documented (QUALITY_GATE)

**Gate Type:** QUALITY_GATE + APPROVAL_GATE
**Enforcer:** Tech Writer (primary) + Product Owner (approval)
**Skip Policy:** User must explicitly request skip with documented reason and risk acknowledgment

**Why This Gate Matters:**
- Outdated API docs cause developer frustration and support tickets
- Inaccurate user guides lead to user confusion and churn
- Missing release notes create deployment surprises
- Skipping creates knowledge gaps and increased support burden

### Phase 6 Completion Checklist
- [ ] API documentation up to date
- [ ] User guides accurate and complete
- [ ] Release notes written
- [ ] Changelog updated
- [ ] All changes documented
- [ ] Gate 6 PASSED
- [ ] Epic marked as Complete
- [ ] Archived to completed/

---

## Parallel Work Opportunities

```
PHASE         PARALLEL OPPORTUNITIES
------        ----------------------
Discovery     Research can inform PM incrementally
Design        Architecture + UX can work in parallel
Planning      PO and SM work sequentially (fast)
Development   Multiple stories can run in parallel (see Tracks below)
              - Story A: TEST -> DEV -> REVIEW
              - Story B:        TEST -> DEV -> REVIEW
              - Story C:               TEST -> DEV
Quality       Can overlap with late development
Documentation Can start as stories complete
```

### Multi-Track Parallel Execution

When ORCHESTRATOR detects parallel opportunities, it assigns tasks to Tracks:

```
TRACK A (Backend)              TRACK B (Frontend)           MERGE POINT
----------------               -----------------            -----------
E1-S1.1 (Tests)                E1-S1.3 (UI Components)
    |                               |
    v                               v
E1-S1.2 (RLS)                  E1-S1.3 (continued)
    |                               |
    v                               v
E1-S1.2-R (Review)             E1-S1.3-R (Review)
    |                               |
    v                               v
E1-S1.4 (Middleware)           ----------------------> E1-S1.5 (Integration)
    |                                                       |
    +-------------------------------------------------->    |
                                                            v
                                                    E1-S1.6 (Docs)
                                                            |
                                                            v
                                                    E1-S1.7 (Perf Test)
```

### Parallel Work Detection Protocol

ORCHESTRATOR follows this protocol for parallel detection:

1. **Analyze Task Queue**
   - List all queued and active tasks
   - Map dependencies between tasks

2. **Identify Independent Groups**
   - Group tasks with no cross-dependencies
   - Check file overlap (must be none)
   - Check data flow (no output->input chains)

3. **Assign Tracks**
   - Track A, B, C for independent groups
   - Track "-" for sequential or waiting tasks

4. **Notify User**
   ```
   ## Parallel Work Opportunity Detected

   Track A: [Task 1, Task 2] - BACKEND-DEV
   Track B: [Task 3] - FRONTEND-DEV

   No conflicts detected. Proceed? [Y/n]
   ```

5. **Monitor Progress**
   - Update TASK-QUEUE.md Track Assignments
   - Alert on merge point approach
   - Handle conflicts if discovered mid-execution

### Conflict Resolution During Parallel Execution

If conflict discovered after parallel work started:

| Conflict Type | Detection | Resolution |
|--------------|-----------|------------|
| File conflict | Same file modified by both tracks | Pause later track, merge changes, continue |
| Data conflict | Output needed by other track | Wait for dependency, then continue |
| State conflict | Shared state modified | Sequential execution required |

```
[CONFLICT DETECTED - MID EXECUTION]

Conflict Type: File
Affected: src/api/auth.ts
Track A: Modified in E1-S1.2 (BACKEND-DEV)
Track B: Modified in E1-S1.3 (FRONTEND-DEV)

Resolution:
1. Pause Track B E1-S1.3
2. Complete Track A E1-S1.2
3. Merge changes into Track B branch
4. Resume Track B E1-S1.3

User action required: Confirm resolution
```

## Handoff Points

| From | To | Artifact | Handoff Record |
|------|-----|----------|----------------|
| RESEARCH-AGENT | PM-AGENT | Research report | HANDOFFS.md |
| PM-AGENT | ARCHITECT-AGENT | PRD | HANDOFFS.md |
| PM-AGENT | UX-DESIGNER | PRD | HANDOFFS.md |
| ARCHITECT-AGENT | PRODUCT-OWNER | Epic breakdown | HANDOFFS.md |
| UX-DESIGNER | PRODUCT-OWNER | UX specs | HANDOFFS.md |
| PRODUCT-OWNER | SCRUM-MASTER | Prioritized backlog | HANDOFFS.md |
| SCRUM-MASTER | TEST-ENGINEER | Sprint tasks | TASK-QUEUE.md |
| TEST-ENGINEER | DEV | Failing tests | HANDOFFS.md |
| DEV | CODE-REVIEWER | Implementation | HANDOFFS.md |
| CODE-REVIEWER | QA-AGENT | Approved code | HANDOFFS.md |
| QA-AGENT | TECH-WRITER | Validated feature | HANDOFFS.md |

## Error Handling

### Discovery Phase Errors
| Error | Recovery |
|-------|----------|
| Unclear requirements | RESEARCH-AGENT gathers more info |
| Scope creep detected | PM-AGENT defines boundaries, gets approval |
| Missing stakeholder input | Escalate to ORCHESTRATOR |

### Design Phase Errors
| Error | Recovery |
|-------|----------|
| Architecture conflict | ARCHITECT-AGENT creates ADR with alternatives |
| UX infeasible technically | Joint session: ARCHITECT + UX-DESIGNER |
| Missing PRD details | Return to PM-AGENT for clarification |

### Development Phase Errors
| Error | Recovery |
|-------|----------|
| Tests cannot be written | Clarify acceptance criteria with PO |
| Implementation blocked | Document in DEPENDENCIES.md, alert SCRUM-MASTER |
| Code review rejection | DEV addresses feedback, resubmit |
| Performance issues | SENIOR-DEV optimization review |

### Quality Phase Errors
| Error | Recovery |
|-------|----------|
| Critical bugs found | Create bug tickets, prioritize fix |
| Regression detected | Root cause analysis, fix and retest |
| Security vulnerability | Immediate fix, ARCHITECT review |

## Example Scenarios

### Scenario 1: New Feature Epic
```
Input: "Add user authentication"

Flow:
1. RESEARCH-AGENT: Analyze auth requirements, security standards
2. PM-AGENT: Create PRD with auth user stories
3. ARCHITECT-AGENT: Design auth architecture, choose OAuth provider
4. UX-DESIGNER: Create login/signup flows and screens
5. PRODUCT-OWNER: Prioritize stories (login first, then signup, then SSO)
6. SCRUM-MASTER: Plan Sprint 1 with login story
7. Implementation Loop for each story
8. QA validates complete auth flow
9. TECH-WRITER documents auth for users and developers
```

### Scenario 2: Technical Debt Epic
```
Input: "Refactor legacy payment module"

Flow:
1. RESEARCH-AGENT: Analyze current implementation, identify issues
2. PM-AGENT: Define refactoring scope and success criteria
3. ARCHITECT-AGENT: Design target architecture, migration strategy
4. UX-DESIGNER: (minimal involvement, internal changes)
5. PRODUCT-OWNER: Prioritize by risk and impact
6. SCRUM-MASTER: Plan incremental refactoring sprints
7. Implementation with extra focus on test coverage
8. QA extensive regression testing
9. TECH-WRITER updates internal documentation
```

## State Updates

Update the following at each phase transition:

```markdown
## PROJECT-STATE.md Updates

After Discovery:
- Phase: Design
- Last Activity: PRD completed
- Next: Architecture design

After Design:
- Phase: Planning
- Last Activity: Design complete
- Next: Sprint planning

After Planning:
- Phase: Development
- Current Sprint: Sprint N
- Next: Story implementation

After Development:
- Phase: Quality
- Stories Completed: X/Y
- Next: Final QA

After Quality:
- Phase: Documentation
- Quality Status: Approved
- Next: Release prep

After Documentation:
- Phase: Complete
- Epic Status: Done
- Archive to completed/
```

## Metrics Tracking

Track the following throughout the epic:

| Metric | When | Location |
|--------|------|----------|
| Discovery duration | Phase 1 complete | METRICS.md |
| Design duration | Phase 2 complete | METRICS.md |
| Stories completed | Each story done | METRICS.md |
| Bugs found | During QA | METRICS.md |
| Code review cycles | Each review | METRICS.md |
| Total epic duration | Epic complete | METRICS.md |

---

## Gate Enforcement Summary

### All Gates Are MANDATORY

| Gate | Phase | Type | Enforcer | Blocking |
|------|-------|------|----------|----------|
| Gate 1: PRD Review | Discovery -> Design | APPROVAL_GATE | Product Owner | Phase 2 |
| Gate 2: Design Review | Design -> Planning | REVIEW_GATE + APPROVAL_GATE | Architect + PO | Phase 3 |
| Gate 3: Sprint Ready | Planning -> Development | QUALITY_GATE + APPROVAL_GATE | Scrum Master + PO | Phase 4 |
| Gate 4: Story Done | Per Story | TEST_GATE + REVIEW_GATE + QUALITY_GATE | QA + Reviewer + Orchestrator | Next Story |
| Gate 5: Quality Approved | Development -> Documentation | TEST_GATE + QUALITY_GATE | QA Agent | Phase 6 |
| Gate 6: Docs Complete | Documentation -> Complete | QUALITY_GATE + APPROVAL_GATE | Tech Writer + PO | Epic Complete |

### Gate Skip Protocol (For All Gates)

**CRITICAL:** No gate can be skipped without explicit user authorization.

1. **User must request skip explicitly** - Agent cannot suggest or initiate skip
2. **User must provide documented reason**
3. **User must acknowledge specific risks**
4. **Orchestrator must log skip in GATE-OVERRIDES.md**
5. **User must confirm willingness to address gate later (if applicable)**

### Gate Check Template

Before each phase transition, Orchestrator validates:

```
[GATE CHECK - {Current Phase} to {Next Phase}]

Gate: {Gate Name}
Type: {Gate Types}
Status: {PASSED | FAILED | PENDING}

Checklist:
- [ ] Requirement 1: {status}
- [ ] Requirement 2: {status}
- [ ] Requirement 3: {status}

Result: {PROCEED | BLOCKED}
Blocking Reason: {if blocked, what's missing}
Recommended Action: {what to do to pass}
```

### Why Gate Enforcement Matters

| Skipped Gate | Immediate Impact | Long-term Cost |
|--------------|------------------|----------------|
| PRD Review | Wrong requirements | 10x rework cost |
| Design Review | Architectural flaws | Costly refactoring |
| Sprint Ready | Chaotic sprints | Failed deliveries |
| Story Done | Incomplete features | Production bugs |
| Quality Approved | Broken workflows | User churn, security risk |
| Docs Complete | Knowledge gaps | Support burden |

**Remember:** The cost of fixing issues grows exponentially the later they're discovered. Gates exist to catch issues early when they're cheap to fix.
