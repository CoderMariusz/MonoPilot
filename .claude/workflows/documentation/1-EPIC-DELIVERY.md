# Epic Delivery

> **Version:** 2.0
> **Definition:** @.claude/workflows/definitions/engineering/epic-delivery.yaml
> **Updated:** 2025-12-15
> **Parent Workflow:** 0-WORKFLOW-MASTER-MAP.md

---

## Overview

End-to-end process for delivering an epic from validated stories to production deployment. This workflow orchestrates multiple agents through planning, implementation, quality assurance, documentation, and deployment phases.

**IMPORTANT:** This workflow assumes the PRD already exists from NEW-PROJECT-FLOW or backlog refinement. There is NO discovery phase - we start with validated user stories and existing architecture/UX specifications.

## Phase Requirements Legend

| Marker | Meaning |
|--------|---------|
| `[MANDATORY]` | Cannot be skipped - phase MUST be completed |
| `[OPTIONAL]` | Can be skipped with documented reason |
| `[USER-CHOICE]` | User decides between provided options |

**IMPORTANT:** All phases in Epic Delivery are `[MANDATORY]` by default. User may request skip only with explicit reason and risk acknowledgment.

## Naming Convention

All epic artifacts follow the unified naming pattern:

```
Pattern: {XX}.{N}.{slug}

Components:
  XX   = Epic number (2 digits, zero-padded): 01, 02, 03...
  N    = Story number within epic: 1, 2, 3...
  slug = Short kebab-case description

Special Values:
  XX.0.*  = Epic-level documents (overview, clarifications, test-strategy)

Examples:
  01.0.epic-overview      → Epic overview document
  01.0.test-strategy      → Epic test strategy
  01.1.db-schema          → Story 1
  01.2.login-api          → Story 2
```

See `0-WORKFLOW-MASTER-MAP.md` for complete naming conventions.

## ASCII Flow Diagram

```
                                  EPIC DELIVERY
                                       |
                         (PRD + Stories Already Exist)
                                       |
                                       v
+=====================================================================================+
|                              PHASE 1: PLANNING                                      |
+=====================================================================================+
|                                                                                     |
|   +------------------+     +------------------+     +------------------+            |
|   | PRODUCT-OWNER    |---->| SCRUM-MASTER     |---->| GATE: Planning   |            |
|   | (Sonnet)         |     | (Sonnet)         |     | Complete?        |            |
|   +------------------+     +------------------+     +--------+---------+            |
|   | - Validate scope |     | - Validate ready |              |                      |
|   | - Prioritize     |     | - Assign sprints |         YES  |  NO                  |
|   | - Review stories |     | - Update queue   |              |   |                  |
|   +------------------+     +------------------+              |   +---> Refine       |
|                                                              |                      |
+=====================================================================================+
                                         |
                                         v
+=====================================================================================+
|                         PHASE 2: IMPLEMENTATION LOOP                                |
+=====================================================================================+
|                                                                                     |
|   +-----------------------------------------------------------------------+        |
|   |                   FOR EACH STORY IN EPIC                               |        |
|   |                                                                        |        |
|   |   ┌────────────────────────────────────────────────────────┐          |        |
|   |   │  3-STORY-DELIVERY.md (invoked per story)               │          |        |
|   |   │                                                        │          |        |
|   |   │  +---------+  +---------+  +---------+  +---------+   │          |        |
|   |   │  | UX      |->| RED     |->| GREEN   |->| REFACTOR|   │          |        |
|   |   │  | (opt)   |  | (tests) |  | (impl)  |  | (clean) |   │          |        |
|   |   │  +---------+  +---------+  +---------+  +---------+   │          |        |
|   |   │       |            |            |            |         │          |        |
|   |   │       v            v            v            v         │          |        |
|   |   │  +---------+  +---------+  +---------+  +---------+   │          |        |
|   |   │  | REVIEW  |->| QA      |->| DOCS    |->| DONE ✅ |   │          |        |
|   |   │  +---------+  +---------+  +---------+  +---------+   │          |        |
|   |   └────────────────────────────────────────────────────────┘          |        |
|   |                                                                        |        |
|   +-----------------------------------------------------------------------+        |
|                            |                                                        |
|                            v                                                        |
|              +---------------------------+                                          |
|              | Parallel Track Detection  |                                          |
|              | - Independent stories run |                                          |
|              | - No file conflicts       |                                          |
|              | - Update TASK-QUEUE.md    |                                          |
|              +-------------+-------------+                                          |
|                            |                                                        |
+=====================================================================================+
                                         |
                                         v
+=====================================================================================+
|                              PHASE 3: QUALITY ASSURANCE                             |
+=====================================================================================+
|                                                                                     |
|   +------------------+     +------------------+                                     |
|   | QA-AGENT         |---->| GATE: Quality    |                                     |
|   | (Sonnet)         |     | Approved?        |                                     |
|   +------------------+     +--------+---------+                                     |
|   | - Integration    |              |                                               |
|   | - E2E testing    |         YES  |  NO                                           |
|   | - Regression     |              |   |                                           |
|   | - Performance    |              |   +---> Back to Implementation                |
|   | - Security scan  |              |                                               |
|   +------------------+              |                                               |
|                                     |                                               |
+=====================================================================================+
                                         |
                                         v
+=====================================================================================+
|                              PHASE 4: DOCUMENTATION                                 |
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
+=====================================================================================+
|                              PHASE 5: DEPLOYMENT [OPTIONAL]                         |
+=====================================================================================+
|                                                                                     |
|   +------------------+     +------------------+                                     |
|   | DEVOPS-AGENT     |---->| GATE: Deploy     |                                     |
|   | (Sonnet)         |     | Verified?        |                                     |
|   +------------------+     +--------+---------+                                     |
|   | - Staging deploy |              |                                               |
|   | - Prod deploy    |         YES  |  NO                                           |
|   | - Rollback plan  |              |   |                                           |
|   | - Health check   |              |   +---> Rollback                              |
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

### Phase 1: Planning [MANDATORY]

#### Why This Phase Matters
| Aspect | Description |
|--------|-------------|
| **What it delivers** | Validated scope, sprint assignments, ready-to-implement stories |
| **If skipped** | Chaotic development, unclear priorities, scope drift |
| **Problems prevented** | Wasted effort, blocked developers, missed dependencies |

#### Step 1.1: Scope Validation (PRODUCT-OWNER) [MANDATORY]
**Model:** Sonnet
**Duration:** 0.25-0.5 day

**Input:** Epic overview from PRD + user stories from backlog

1. Review epic scope against current PRD
2. Validate all stories are still relevant
3. Confirm stories are INVEST compliant
4. Identify story dependencies
5. Review existing architecture/UX docs (NO new creation)

**Reference Documents:**
- `docs/1-BASELINE/product/prd.md` - Existing PRD
- `docs/1-BASELINE/architecture/` - Existing architecture specs
- `docs/1-BASELINE/ux/` - Existing UX wireframes
- `docs/2-MANAGEMENT/epics/current/epic-XX-*.md` - Epic breakdown

**Output:** Validated epic scope with current stories

#### User Choice Point: Story Adjustment
**Options:**
1. **As-Is** - Stories are current, no changes needed
2. **Refinement** - Minor adjustments to acceptance criteria
3. **Major Change** - Return to PRD, significant scope change (escalate)

**Default:** As-Is
**Decision Required:** Yes if Refinement/Major Change detected

#### Step 1.2: Sprint Assignment (SCRUM-MASTER) [MANDATORY]
**Model:** Sonnet
**Duration:** 0.25 day

1. Review validated stories
2. Estimate story complexity (S/M/L)
3. Assign stories to sprint(s)
4. Update task queue
5. Identify risks and dependencies

**Outputs:**
- `.claude/state/TASK-QUEUE.md` (updated)
- `docs/2-MANAGEMENT/sprints/sprint-XX.md` (if multi-sprint epic)

#### Quality Gate 1: Planning Complete (MANDATORY - MUST PASS)

**Status:** BLOCKING - Cannot proceed to Phase 2 until passed

**Gate Requirements:**
- [ ] All stories validated against PRD
- [ ] Stories are INVEST compliant
- [ ] Dependencies identified and resolved/planned
- [ ] Sprint assignments confirmed
- [ ] Architecture/UX specs reviewed (existing)
- [ ] Task queue updated

**Gate Type:** QUALITY_GATE + APPROVAL_GATE
**Enforcer:** Scrum Master (process) + Product Owner (scope)
**Skip Policy:** User must explicitly request skip with documented reason and risk acknowledgment

**Why This Gate Matters:**
- Unvalidated stories may be outdated or irrelevant
- Non-INVEST stories are hard to implement and estimate
- Unresolved dependencies cause blockers during implementation
- Skipping leads to scope drift and failed deliveries

### Phase 1 Completion Checklist
- [ ] Epic scope validated against current PRD
- [ ] All stories reviewed and confirmed current
- [ ] Story dependencies identified and documented
- [ ] Sprint assignments complete
- [ ] Task queue updated with epic stories
- [ ] Gate 1 PASSED
- [ ] Handoff to Phase 2 confirmed

---

### Phase 2: Implementation Loop [MANDATORY]

#### Why This Phase Matters
| Aspect | Description |
|--------|-------------|
| **What it delivers** | Working, tested, reviewed code implementing user stories |
| **If skipped** | No product to deliver |
| **Problems prevented** | Untested code, unreviewed changes, inconsistent implementation |

#### Story Execution: Invoke 3-STORY-DELIVERY.md

For each story in the epic, **invoke the 3-STORY-DELIVERY workflow**:

```
→ 3-STORY-DELIVERY.md
  Input: Story ID (XX.N), Acceptance Criteria, Test Strategy
  Output: Done story (tested, reviewed, documented)
```

The 3-STORY-DELIVERY workflow handles:
1. UX Detail (optional, UI stories only)
2. Test First (RED phase)
3. Implementation (GREEN phase)
4. Refactoring (REFACTOR phase)
5. Code Review (REVIEW gate)
6. QA Validation (QA gate)
7. Documentation update

**Reference:** See `3-STORY-DELIVERY.md` for complete TDD workflow

#### Parallel Track Management

During implementation, ORCHESTRATOR detects opportunities for parallel work across multiple tracks.

**Track Assignment Rules:**
- Stories with no file/data dependencies can run on separate tracks
- Frontend and Backend stories typically run on different tracks
- Code review and testing stay on same track as implementation

**Track Detection Triggers:**
1. After planning complete
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

#### Quality Gate 2: Implementation Done (MANDATORY - MUST PASS)

**Status:** BLOCKING - Epic cannot proceed to QA until all stories pass

**Gate Requirements:**
- [ ] All stories in epic marked as Done
- [ ] All tests passing (per-story TEST_GATE)
- [ ] All code reviews approved (per-story REVIEW_GATE)
- [ ] All acceptance criteria met (per-story QUALITY_GATE)
- [ ] No critical issues outstanding
- [ ] Story documentation updated

**Gate Type:** TEST_GATE + REVIEW_GATE + QUALITY_GATE
**Enforcer:** Orchestrator (aggregates per-story gates)
**Skip Policy:** User must explicitly request skip with documented reason and risk acknowledgment

**Why This Gate Matters:**
- Incomplete stories mean incomplete epic
- Failing tests mean broken functionality
- Unreviewed code may contain bugs or security issues
- Skipping creates technical debt and production bugs

### Phase 2 Completion Checklist
- [ ] All epic stories implemented via 3-STORY-DELIVERY
- [ ] All tests passing
- [ ] All code reviews approved
- [ ] All acceptance criteria met
- [ ] Parallel tracks merged successfully
- [ ] Gate 2 PASSED
- [ ] Handoff to Phase 3 confirmed

---

### Phase 3: Quality Assurance [MANDATORY]

#### Why This Phase Matters
| Aspect | Description |
|--------|-------------|
| **What it delivers** | Validated, integrated, secure, performant system |
| **If skipped** | Broken integrations, security vulnerabilities, performance issues |
| **Problems prevented** | Production outages, data breaches, user churn |

#### Step 3.1: Integration Testing (QA-AGENT) [MANDATORY]
**Model:** Sonnet
**Duration:** 1-2 days

1. Execute E2E test suite for epic
2. Perform regression testing
3. Validate cross-story integration
4. Performance testing
5. Security scanning
6. Accessibility validation (if UI)

**Test Focus:**
- Integration between stories in this epic
- Regression against existing functionality
- Performance benchmarks met
- Security vulnerabilities addressed

#### User Choice Point: Testing Scope
**Options:**
1. **Full QA** - Complete E2E, regression, performance, security (1-2 days)
2. **Essential QA** - E2E and critical regression only (0.5-1 day)
3. **Extended QA** - Full QA + load testing, penetration testing (2-3 days)

**Default:** Full QA
**Decision Required:** Yes for Extended QA, No for Full/Essential

#### Quality Gate 3: Quality Approved (MANDATORY - MUST PASS)

**Status:** BLOCKING - Cannot proceed to Phase 4 until passed

**Gate Requirements:**
- [ ] All E2E tests pass (TEST_GATE)
- [ ] No regression issues (QUALITY_GATE)
- [ ] Performance meets SLAs (QUALITY_GATE)
- [ ] Security scan passed (QUALITY_GATE)
- [ ] Accessibility validated (QUALITY_GATE - if UI)
- [ ] Integration with existing features validated

**Gate Type:** TEST_GATE + QUALITY_GATE
**Enforcer:** QA Agent (primary) + Orchestrator (oversight)
**Skip Policy:** User must explicitly request skip with documented reason and risk acknowledgment

**Why This Gate Matters:**
- E2E failures mean broken user workflows
- Regressions break existing functionality
- Performance issues frustrate users and cause abandonment
- Security vulnerabilities expose user data and company liability
- Skipping risks production incidents and security breaches

### Phase 3 Completion Checklist
- [ ] All E2E tests pass
- [ ] Regression testing complete
- [ ] Performance benchmarks met
- [ ] Security scan passed
- [ ] Accessibility validated (if UI)
- [ ] Integration validated
- [ ] Gate 3 PASSED
- [ ] Handoff to Phase 4 confirmed

---

### Phase 4: Documentation [MANDATORY]

#### Why This Phase Matters
| Aspect | Description |
|--------|-------------|
| **What it delivers** | API documentation, user guides, release notes, changelog |
| **If skipped** | Knowledge gaps, developer frustration, user confusion |
| **Problems prevented** | Support overhead, onboarding difficulties, deployment surprises |

#### Step 4.1: Documentation (TECH-WRITER) [MANDATORY]
**Model:** Sonnet
**Duration:** 0.5-1 day

1. Update API documentation
2. Create/update user guides
3. Write release notes
4. Update change log
5. Update epic overview with outcomes
6. Archive completed work

**Outputs:**
- `docs/3-IMPLEMENTATION/api/` (updated)
- `docs/4-RELEASE/release-notes.md` (updated)
- `docs/4-RELEASE/changelog.md` (updated)
- `docs/2-MANAGEMENT/epics/completed/epic-XX-*.md` (archived)

#### User Choice Point: Documentation Scope
**Options:**
1. **Full Documentation** - API docs, user guides, release notes, internal docs
2. **Essential Documentation** - API docs and release notes only
3. **Internal Only** - Technical documentation only (for internal tools)

**Default:** Full Documentation
**Decision Required:** No - Default recommended, user may adjust for internal projects

#### Quality Gate 4: Documentation Complete (MANDATORY - MUST PASS)

**Status:** BLOCKING - Epic cannot be deployed until passed

**Gate Requirements:**
- [ ] API docs up to date (QUALITY_GATE)
- [ ] User guides accurate (QUALITY_GATE)
- [ ] Release notes written (QUALITY_GATE)
- [ ] All changes documented (QUALITY_GATE)
- [ ] Epic overview updated with outcomes

**Gate Type:** QUALITY_GATE + APPROVAL_GATE
**Enforcer:** Tech Writer (primary) + Product Owner (approval)
**Skip Policy:** User must explicitly request skip with documented reason and risk acknowledgment

**Why This Gate Matters:**
- Outdated API docs cause developer frustration and support tickets
- Inaccurate user guides lead to user confusion and churn
- Missing release notes create deployment surprises
- Skipping creates knowledge gaps and increased support burden

### Phase 4 Completion Checklist
- [ ] API documentation up to date
- [ ] User guides accurate and complete
- [ ] Release notes written
- [ ] Changelog updated
- [ ] All changes documented
- [ ] Gate 4 PASSED
- [ ] Handoff to Phase 5 confirmed (if deploying)

---

### Phase 5: Deployment [OPTIONAL]

#### Why This Phase Matters
| Aspect | Description |
|--------|-------------|
| **What it delivers** | Feature deployed to staging/production, verified working |
| **If skipped** | Feature not available to users (valid for internal/dev features) |
| **Problems prevented** | Deployment surprises, production failures, incomplete rollouts |

**Skip Condition:** May be skipped for:
- Internal development features
- Features held for coordinated release
- Features requiring additional business approval

#### Step 5.1: Staging Deployment (DEVOPS-AGENT) [OPTIONAL]
**Model:** Sonnet
**Duration:** 0.25-0.5 day

1. Deploy to staging environment
2. Run smoke tests
3. Validate configuration
4. Document deployment steps
5. Prepare rollback plan

#### Step 5.2: Production Deployment (DEVOPS-AGENT) [OPTIONAL]
**Model:** Sonnet
**Duration:** 0.25-0.5 day

1. Deploy to production
2. Run health checks
3. Monitor error rates
4. Verify feature flags (if applicable)
5. Document release

**Deployment Strategy Options:**
- Blue/Green deployment
- Rolling deployment
- Canary deployment (gradual rollout)

#### Quality Gate 5: Deployment Verified (OPTIONAL - if deploying)

**Status:** BLOCKING - Epic not complete until deployment verified

**Gate Requirements:**
- [ ] Staging deployment successful (if used)
- [ ] Production deployment successful
- [ ] Health checks passing
- [ ] No error spikes detected
- [ ] Rollback plan documented
- [ ] Monitoring configured

**Gate Type:** TEST_GATE + QUALITY_GATE
**Enforcer:** DevOps Agent + Orchestrator
**Skip Policy:** Entire phase skipped if deployment not required

**Why This Gate Matters:**
- Failed deployments break production
- Missing health checks hide problems
- No rollback plan means extended outages
- Skipping (when required) leaves feature unavailable

### Phase 5 Completion Checklist
- [ ] Staging deployment successful (if used)
- [ ] Production deployment successful
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Rollback plan documented
- [ ] Gate 5 PASSED (if deploying)
- [ ] Epic marked as Complete

---

## Parallel Work Opportunities

```
PHASE         PARALLEL OPPORTUNITIES
------        ----------------------
Planning      PO and SM work sequentially (fast)
Implementation Multiple stories can run in parallel (see Tracks below)
              - Story A: UX → TEST → DEV → REVIEW → QA
              - Story B:        TEST → DEV → REVIEW → QA
              - Story C:               TEST → DEV → REVIEW
Quality       Can overlap with late implementation
Documentation Can start as stories complete
Deployment    Staging and production prep can overlap
```

### Multi-Track Parallel Execution

When ORCHESTRATOR detects parallel opportunities, it assigns tasks to Tracks:

```
TRACK A (Backend)              TRACK B (Frontend)           MERGE POINT
----------------               -----------------            -----------
01.1 (DB Schema)               01.3 (UI Components)
    |                               |
    v                               v
01.2 (API Endpoints)           01.4 (Forms)
    |                               |
    v                               v
01.2-R (Review)                01.4-R (Review)
    |                               |
    v                               v
01.5 (Integration)   <---------+   |
    |                               |
    v                               v
01.6 (E2E Tests)     ------------> Integration Complete
    |
    v
Documentation
```

### Parallel Work Detection Protocol

ORCHESTRATOR follows this protocol for parallel detection:

1. **Analyze Task Queue**
   - List all queued and active tasks
   - Map dependencies between tasks

2. **Identify Independent Groups**
   - Group tasks with no cross-dependencies
   - Check file overlap (must be none)
   - Check data flow (no output→input chains)

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
Track A: Modified in 01.2 (BACKEND-DEV)
Track B: Modified in 01.3 (FRONTEND-DEV)

Resolution:
1. Pause Track B 01.3
2. Complete Track A 01.2
3. Merge changes into Track B branch
4. Resume Track B 01.3

User action required: Confirm resolution
```

## Handoff Points

| From | To | Artifact | Handoff Record |
|------|-----|----------|----------------|
| PRODUCT-OWNER | SCRUM-MASTER | Validated scope | HANDOFFS.md |
| SCRUM-MASTER | ORCHESTRATOR | Sprint plan | TASK-QUEUE.md |
| ORCHESTRATOR | 3-STORY-DELIVERY | Story assignment | Per-story invocation |
| 3-STORY-DELIVERY | ORCHESTRATOR | Done story | Story completion |
| ORCHESTRATOR | QA-AGENT | All stories done | HANDOFFS.md |
| QA-AGENT | TECH-WRITER | Quality approved | HANDOFFS.md |
| TECH-WRITER | DEVOPS-AGENT | Docs complete | HANDOFFS.md |
| DEVOPS-AGENT | ORCHESTRATOR | Deployment verified | HANDOFFS.md |

## Error Handling

### Planning Phase Errors
| Error | Recovery |
|-------|----------|
| Stories outdated | Return to PRD, update stories |
| Scope drift detected | Escalate to Product Owner, validate change |
| Dependencies unresolved | Document in DEPENDENCIES.md, plan sequentially |

### Implementation Phase Errors
| Error | Recovery |
|-------|----------|
| Story blocked | Document blocker, skip to next story, resolve later |
| Test failure | Fix implementation, re-run tests |
| Code review rejection | Address feedback via DEV, resubmit |
| Parallel conflict | Pause conflicting track, merge, continue |

### Quality Phase Errors
| Error | Recovery |
|-------|----------|
| Critical bugs found | Create bug tickets, return to Implementation |
| Regression detected | Root cause analysis, fix and retest |
| Security vulnerability | Immediate fix, ARCHITECT review, retest |
| Performance SLA missed | SENIOR-DEV optimization, retest |

### Documentation Phase Errors
| Error | Recovery |
|-------|----------|
| API docs incomplete | Return to TECH-WRITER, complete docs |
| User guide inaccurate | Review with Product Owner, fix |
| Release notes missing | Document changes, complete notes |

### Deployment Phase Errors
| Error | Recovery |
|-------|----------|
| Staging deploy failed | Review logs, fix config, retry |
| Health checks failed | Rollback, investigate, fix, redeploy |
| Production issues | Execute rollback plan, create incident ticket |

## Example Scenarios

### Scenario 1: Single Epic Feature
```
Input: Epic 5 - Warehouse Module (from PRD)

Flow:
1. PRODUCT-OWNER: Validate 13 warehouse stories against PRD
2. SCRUM-MASTER: Assign to Sprint 8-9 (2 sprints)
3. ORCHESTRATOR: Detect 2 parallel tracks (backend + frontend)
4. Implementation Loop:
   - Track A: 05.1 → 05.2 → 05.3 (receiving, storage, picking)
   - Track B: 05.4 → 05.5 (UI components, dashboards)
5. QA validates warehouse workflows
6. TECH-WRITER documents warehouse API and user guide
7. DEVOPS deploys to staging, then production
```

### Scenario 2: Multi-Sprint Epic
```
Input: Epic 6 - Quality Module (21 stories from PRD)

Flow:
1. PRODUCT-OWNER: Validate scope, confirm all 21 stories current
2. SCRUM-MASTER: Split across 3 sprints (7 stories each)
3. Sprint 10: Core inspection workflows (06.1-06.7)
   - Implement via 3-STORY-DELIVERY
   - QA integration after sprint
4. Sprint 11: NCR and CAPA workflows (06.8-06.14)
   - Implement via 3-STORY-DELIVERY
   - QA integration after sprint
5. Sprint 12: Auditing and compliance (06.15-06.21)
   - Implement via 3-STORY-DELIVERY
   - Final epic QA (all 21 stories)
6. TECH-WRITER: Complete epic documentation
7. DEVOPS: Deploy complete Quality Module
```

### Scenario 3: Epic with Existing Architecture
```
Input: Epic 7 - Shipping Module (PRD + Architecture + UX already exist)

Flow:
1. PRODUCT-OWNER: Review existing docs, validate stories
   - Reference: docs/1-BASELINE/architecture/shipping-design.md
   - Reference: docs/1-BASELINE/ux/wireframes/SHP-*.md
   - NO new architecture or UX creation
2. SCRUM-MASTER: Assign to Sprint 13-14
3. Implementation uses existing specs
4. QA, Docs, Deploy as normal
```

## State Updates

Update the following at each phase transition:

```markdown
## PROJECT-STATE.md Updates

After Planning:
- Phase: Implementation
- Current Epic: Epic XX
- Stories Planned: X stories in Y sprint(s)
- Next: Story implementation

After Implementation:
- Phase: Quality Assurance
- Stories Completed: X/Y
- Next: Integration testing

After Quality:
- Phase: Documentation
- Quality Status: Approved
- Next: Documentation update

After Documentation:
- Phase: Deployment (or Complete if skipping deploy)
- Docs Status: Complete
- Next: Deployment (or Archive)

After Deployment:
- Phase: Complete
- Epic Status: Done
- Deployed: Staging + Production
- Archive to completed/
```

## Metrics Tracking

Track the following throughout the epic:

| Metric | When | Location |
|--------|------|----------|
| Planning duration | Phase 1 complete | METRICS.md |
| Stories completed | Each story done | METRICS.md |
| Parallel tracks used | During implementation | METRICS.md |
| Bugs found | During QA | METRICS.md |
| Code review cycles | Each review | METRICS.md |
| Deployment success rate | After deployment | METRICS.md |
| Total epic duration | Epic complete | METRICS.md |

---

## Gate Enforcement Summary

### All Gates Are MANDATORY (except Phase 5 if skipped)

| Gate | Phase | Type | Enforcer | Blocking |
|------|-------|------|----------|----------|
| Gate 1: Planning Complete | Planning → Implementation | QUALITY_GATE + APPROVAL_GATE | Scrum Master + PO | Phase 2 |
| Gate 2: Implementation Done | Implementation → Quality | TEST_GATE + REVIEW_GATE + QUALITY_GATE | Orchestrator | Phase 3 |
| Gate 3: Quality Approved | Quality → Documentation | TEST_GATE + QUALITY_GATE | QA Agent | Phase 4 |
| Gate 4: Docs Complete | Documentation → Deployment | QUALITY_GATE + APPROVAL_GATE | Tech Writer + PO | Phase 5 |
| Gate 5: Deployment Verified | Deployment → Complete | TEST_GATE + QUALITY_GATE | DevOps + Orchestrator | Epic Complete |

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
| Planning Complete | Unclear scope | Scope drift, wasted effort |
| Implementation Done | Incomplete features | Production bugs, user complaints |
| Quality Approved | Broken workflows | User churn, security risk |
| Docs Complete | Knowledge gaps | Support burden, confusion |
| Deployment Verified | Broken production | Outages, data loss |

**Remember:** The cost of fixing issues grows exponentially the later they're discovered. Gates exist to catch issues early when they're cheap to fix.

---

## Related Workflows

| Workflow | When to Use |
|----------|-------------|
| `0-NEW-PROJECT-FLOW.md` | Starting new project from scratch |
| `2-SPRINT-WORKFLOW.md` | Executing time-boxed sprints |
| `3-STORY-DELIVERY.md` | Implementing individual stories (TDD) |
| `0-WORKFLOW-MASTER-MAP.md` | Understanding workflow hierarchy |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2025-12-15 | Restructured as Epic Delivery (5 phases, no Discovery) |
| 1.0 | 2025-12-10 | Initial Epic Workflow (6 phases with Discovery) |
