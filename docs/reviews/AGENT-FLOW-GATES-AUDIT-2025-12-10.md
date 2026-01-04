# Agent Flow and Gates Audit Report

**Date:** 2025-12-10
**Auditor:** DOC-AUDITOR
**Files Audited:** 12 workflow definition files
**Quality Score:** See summary at end

---

## Table of Contents

1. [epic-workflow.yaml](#1-epic-workflow)
2. [story-delivery.yaml](#2-story-delivery)
3. [feature-flow.yaml](#3-feature-flow)
4. [sprint-workflow.yaml](#4-sprint-workflow)
5. [bug-workflow.yaml](#5-bug-workflow)
6. [ad-hoc-flow.yaml](#6-ad-hoc-flow)
7. [quick-fix.yaml](#7-quick-fix)
8. [migration-workflow.yaml](#8-migration-workflow)
9. [planning-flow.yaml](#9-planning-flow)
10. [discovery-flow.yaml](#10-discovery-flow)
11. [new-project.yaml](#11-new-project)
12. [skill-development-workflow.yaml](#12-skill-development-workflow)
13. [Cross-Reference Analysis](#cross-reference-analysis)
14. [Issue Summary](#issue-summary)
15. [Recommendations](#recommendations)

---

## 1. EPIC-WORKFLOW

**File:** `/workspaces/agent-methodology-pack/.claude/workflows/definitions/engineering/epic-workflow.yaml`
**Trigger:** `epic_implementation | new_feature | major_development`
**Duration:** 1-4 weeks

```
WORKFLOW: epic-workflow
===============================================================================

PHASE 1: Discovery [MANDATORY]
|
+-- Step 1.1: Doc Sync Check
|   +-- Agent: DOC-AUDITOR
|   +-- Tasks: Check existing documentation health, identify gaps
|   +-- Output: docs/reviews/epic-{N}-doc-baseline.md
|   +-- Decision:
|       +-- Green (0-10% drift): proceed to research
|       +-- Yellow (11-25% drift): proceed with doc tasks added
|       +-- Red (26%+ drift): escalate to product owner
|
+-- Step 1.2: Research
|   +-- Agent: RESEARCH-AGENT
|   +-- Tasks: Gather requirements, research market context
|   +-- Output: docs/1-BASELINE/research/research-report.md
|   +-- Checkpoint: Requirements documented, Risks identified
|
+-- Step 1.3: PRD Creation
|   +-- Agent: PM-AGENT
|   +-- Tasks: Create PRD with user stories and acceptance criteria
|   +-- Output: docs/1-BASELINE/product/prd.md
|   +-- Checkpoint: All user stories have AC, Success metrics defined
|
+-- GATE: PRD Review
    +-- Type: APPROVAL_GATE
    +-- Enforcer: product-owner
    +-- Criteria:
    |   [x] All user stories have acceptance criteria
    |   [x] Success metrics are measurable
    |   [x] Scope is clearly defined
    |   [x] Dependencies identified
    +-- Block message: [NOT SPECIFIED]
    +-- Next: design

-------------------------------------------------------------------------------

PHASE 2: Design [MANDATORY] (PARALLEL)
|
+-- Parallel Track A: Architecture
|   +-- Agent: ARCHITECT-AGENT
|   +-- Tasks: Design system architecture, database schema, API contracts
|   +-- Output: docs/1-BASELINE/architecture/*.md, ADR-*.md
|
+-- Parallel Track B: UX Design (CONDITIONAL)
|   +-- Agent: UX-DESIGNER
|   +-- Condition: epic.has_ui_component == true
|   +-- Tasks: Create user flows, wireframes, UI specifications
|   +-- Output: docs/1-BASELINE/ux/*.md
|
+-- GATE: Design Review
    +-- Type: REVIEW_GATE
    +-- Enforcer: architect-agent
    +-- Criteria:
    |   [x] Architecture supports all PRD requirements
    |   [x] ADRs documented for key decisions
    |   [x] UX flows cover all user stories
    |   [x] No blocking technical questions
    +-- Block message: [NOT SPECIFIED]
    +-- Next: planning

-------------------------------------------------------------------------------

PHASE 3: Planning [MANDATORY]
|
+-- Step 3.1: Backlog Refinement
|   +-- Agent: PRODUCT-OWNER
|   +-- Tasks: Review epic breakdown, prioritize stories using MoSCoW
|   +-- Output: docs/2-MANAGEMENT/epics/current/epic-{N}.md
|
+-- Step 3.2: Sprint Planning
|   +-- Agent: SCRUM-MASTER
|   +-- Tasks: Calculate capacity, select stories, create sprint backlog
|   +-- Output: .claude/state/TASK-QUEUE.md, sprint-{N}.md
|
+-- GATE: Sprint Ready
    +-- Type: QUALITY_GATE
    +-- Enforcer: scrum-master
    +-- Criteria:
    |   [x] Stories are INVEST compliant
    |   [x] Dependencies resolved or planned
    |   [x] Capacity matches commitment
    |   [x] Sprint goal defined
    +-- Block message: [NOT SPECIFIED]
    +-- Next: implementation

-------------------------------------------------------------------------------

PHASE 4: Implementation Loop [MANDATORY]
|
+-- Loop: for_each story in sprint.stories
|   +-- Sub-workflow: engineering/story-delivery.yaml
|   +-- Parallel tracks enabled (with safety checks)
|
+-- GATE: Story Done
    +-- Type: TEST_GATE
    +-- Enforcer: [NOT SPECIFIED]
    +-- Criteria:
    |   [x] All tests pass
    |   [x] Code review approved
    |   [x] Acceptance criteria met
    |   [x] Documentation updated
    +-- Block message: [NOT SPECIFIED]
    +-- Next: quality

-------------------------------------------------------------------------------

PHASE 5: Quality Assurance [MANDATORY]
|
+-- Step 5.1: Integration Testing
|   +-- Agent: QA-AGENT
|   +-- Tasks: Execute E2E test suite, regression, performance, security
|   +-- Checkpoint: All E2E pass, No regression, Performance meets SLAs
|
+-- GATE: Quality Approved
    +-- Type: QUALITY_GATE
    +-- Enforcer: qa-agent
    +-- Criteria:
    |   [x] All E2E tests pass
    |   [x] No regression issues
    |   [x] Performance meets SLAs
    |   [x] Security scan passed
    +-- Block message: [NOT SPECIFIED]
    +-- Next: documentation

-------------------------------------------------------------------------------

PHASE 6: Documentation [MANDATORY]
|
+-- Step 6.1: Tech Docs
|   +-- Agent: TECH-WRITER
|   +-- Tasks: Update API docs, user guides, release notes
|   +-- Output: docs/3-IMPLEMENTATION/api/, docs/4-RELEASE/*.md
|
+-- Step 6.2: Doc Audit
|   +-- Agent: DOC-AUDITOR
|   +-- Tasks: Validate all documentation is complete, consistent, accurate
|   +-- Output: docs/reviews/epic-{N}-doc-audit.md
|   +-- Decision:
|       +-- Pass (>=75%): deployment
|       +-- Pass with warnings (60-74%): deployment
|       +-- Fail (<60% or CRITICAL): route to tech-writer
|
+-- GATE: Documentation Complete
    +-- Type: APPROVAL_GATE
    +-- Enforcer: product-owner
    +-- Criteria:
    |   [x] API docs up to date
    |   [x] User guides accurate
    |   [x] Release notes written
    |   [x] All changes documented
    |   [x] DOC_AUDIT_PASSED
    +-- Block message: [NOT SPECIFIED]
    +-- Next: deployment

-------------------------------------------------------------------------------

PHASE 7: Deployment [MANDATORY]
|
+-- Step 7.1: CI/CD Setup
|   +-- Agent: DEVOPS-AGENT
|   +-- Tasks: Configure CI/CD pipeline, deployment configs, infrastructure
|   +-- Output: .github/workflows/, Dockerfile, deployment-guide.md
|   +-- Checkpoint: Pipeline stages configured, Tests passing, Security passed
|
+-- Step 7.2: Staging Deployment
|   +-- Agent: DEVOPS-AGENT
|   +-- Tasks: Deploy to staging environment and verify
|   +-- Checkpoint: Staging deployment successful, Smoke tests pass
|
+-- Step 7.3: Production Deployment
|   +-- Agent: DEVOPS-AGENT
|   +-- Condition: staging_verified == true
|   +-- Tasks: Deploy to production with monitoring
|   +-- Checkpoint: Production deployment successful, Health checks passing
|
+-- GATE: Deployment Complete
    +-- Type: QUALITY_GATE
    +-- Enforcer: devops-agent
    +-- Criteria:
    |   [x] CI/CD pipeline operational
    |   [x] Staging deployment verified
    |   [x] Production deployment successful
    |   [x] Rollback capability confirmed
    |   [x] Monitoring in place
    +-- Block message: [NOT SPECIFIED]

-------------------------------------------------------------------------------

COMPLETION:
+-- Actions: Update PROJECT-STATE.md, Mark epic as Done, Archive, Update METRICS
```

### ISSUES FOUND:

| Severity | Issue |
|----------|-------|
| MAJOR | No explicit block messages defined for any gate |
| MAJOR | Phase 4 (Implementation Loop) gate has no enforcer specified |
| MINOR | Error recovery paths defined but not linked to specific gates |

---

## 2. STORY-DELIVERY

**File:** `/workspaces/agent-methodology-pack/.claude/workflows/definitions/engineering/story-delivery.yaml`
**Trigger:** `story_implementation | feature_development`
**Duration:** 1-3 sessions per story

```
WORKFLOW: story-delivery
===============================================================================

PHASE 1: UX Design [CONDITIONAL]
|
+-- Agent: UX-DESIGNER
+-- Condition: story.has_ui_component == true
+-- Tasks: Design UI components
+-- Output: docs/3-ARCHITECTURE/ux/wireframes/wireframe-{feature}.md
+-- Checkpoint:
|   [x] All 4 states defined (loading, empty, error, success)
|   [x] Accessibility notes included
|   [x] Touch targets >= 48x48dp
+-- Next: red_phase
+-- GATE: [IMPLICIT - checkpoint must pass]
    +-- Block message: [NOT SPECIFIED]

-------------------------------------------------------------------------------

PHASE 2: RED Phase (Write Failing Tests)
|
+-- Agent: TEST-WRITER
+-- Tasks: Write failing tests for all acceptance criteria
+-- Output: tests/**/*-{feature}.test.{ext}
+-- Checkpoint:
|   [x] Tests cover all acceptance criteria
|   [x] Tests fail with expected errors
|   [x] No tests pass yet
+-- Next: green_phase
+-- GATE: [IMPLICIT - tests must fail as expected]
    +-- Block message: [NOT SPECIFIED]

-------------------------------------------------------------------------------

PHASE 3: GREEN Phase (Implementation) [PARALLEL]
|
+-- Parallel Track A: Backend
|   +-- Agent: BACKEND-DEV
|   +-- Condition: story.type in ['backend', 'full-stack']
|   +-- Tasks: Implement minimal code to make tests pass
|   +-- Checkpoint: Backend tests pass, No security vulns, API contracts match
|
+-- Parallel Track B: Frontend
|   +-- Agent: FRONTEND-DEV
|   +-- Condition: story.type in ['frontend', 'full-stack']
|   +-- Tasks: Implement minimal code to make tests pass
|   +-- Checkpoint: Frontend tests pass, Accessibility pass, Responsive verified
|
+-- GATE: [Inline - gate array]
    +-- Criteria:
    |   [x] All tests pass
    |   [x] Build succeeds
    +-- Block message: [NOT SPECIFIED]
    +-- Next: refactor_phase

-------------------------------------------------------------------------------

PHASE 4: REFACTOR Phase
|
+-- Agent: SENIOR-DEV
+-- Tasks: Improve code quality without changing behavior
+-- Output: Code quality improvements, Performance optimizations
+-- Checkpoint:
|   [x] All tests still pass
|   [x] No new functionality added
|   [x] Code follows patterns
+-- Next: code_review
+-- GATE: [IMPLICIT - tests must still pass]
    +-- Block message: [NOT SPECIFIED]

-------------------------------------------------------------------------------

PHASE 5: Code Review
|
+-- Agent: CODE-REVIEWER
+-- Tasks: Review code for quality, security, and best practices
+-- Checkpoint:
|   [x] Security checklist passed
|   [x] Code quality acceptable
|   [x] Tests adequate
+-- Decision:
|   +-- approved: qa_testing
|   +-- request_changes: return_to_green
+-- GATE: [Decision-based]
    +-- Block message: [NOT SPECIFIED]

-------------------------------------------------------------------------------

PHASE 6: QA Testing
|
+-- Agent: QA-AGENT
+-- Tasks: Verify story meets acceptance criteria
+-- Checkpoint:
|   [x] All AC verified
|   [x] Edge cases tested
|   [x] No regressions
+-- Decision:
|   +-- pass: complete
|   +-- fail: return_to_green
+-- GATE: [Decision-based]
    +-- Block message: [NOT SPECIFIED]

-------------------------------------------------------------------------------

COMPLETION:
+-- Actions: Update PROJECT-STATE.md, Mark story as Done, Notify scrum-master
```

### ISSUES FOUND:

| Severity | Issue |
|----------|-------|
| MAJOR | No explicit gate objects - only checkpoints and decisions |
| MAJOR | No gate enforcers specified anywhere |
| MAJOR | No block messages defined |
| MAJOR | UX Design phase has no explicit gate validation |
| MINOR | TDD rules defined but not enforced via gate mechanism |


---

## 3. FEATURE-FLOW

**File:** `/workspaces/agent-methodology-pack/.claude/workflows/definitions/engineering/feature-flow.yaml`
**Trigger:** `add_feature | implement | create | build | small_feature`
**Duration:** 1-4 hours

```
WORKFLOW: feature-flow
===============================================================================

PHASE 0: Intake & Routing
|
+-- Agent: ORCHESTRATOR
+-- Tasks: Receive request, Check phase, Validate alignment, Route
+-- Decision:
|   +-- aligned: clarification
|   +-- not_aligned: add_to_backlog_or_override
+-- GATE: [IMPLICIT]
    +-- Criteria: Feature aligns with current phase
    +-- Block message: [NOT SPECIFIED]

-------------------------------------------------------------------------------

PHASE 1: Quick Clarification [CONDITIONAL]
|
+-- Agent: DISCOVERY-AGENT
+-- Condition: request_is_unclear
+-- Config: depth=quick, max_questions=7, max_rounds=1
+-- Tasks: Clarify feature requirements
+-- Output: FEATURE-BRIEF.md
+-- Checkpoint:
|   [x] Requirements unambiguous
|   [x] Location identified
|   [x] Acceptance criteria clear
+-- Next: ux_check
+-- GATE: [IMPLICIT - checkpoint based]
    +-- Block message: [NOT SPECIFIED]

-------------------------------------------------------------------------------

PHASE 2: UX Quick Check [CONDITIONAL]
|
+-- Agent: UX-DESIGNER
+-- Condition: feature.has_ui_component == true
+-- Tasks: Quick wireframe/sketch
+-- Output: Wireframe, Key interactions, States (default, loading, error)
+-- Checkpoint:
|   [x] Dev can implement from spec
+-- Next: tdd
+-- GATE: [IMPLICIT - checkpoint based]
    +-- Block message: [NOT SPECIFIED]

-------------------------------------------------------------------------------

PHASE 3: Streamlined TDD
|
+-- Step 3.1: Tests
|   +-- Agent: TEST-WRITER
|   +-- Tasks: Write focused tests - happy path + key edge cases
|   +-- Checkpoint: Tests cover AC, Tests fail initially
|
+-- Step 3.2: Implement
|   +-- Agent: BACKEND-DEV | FRONTEND-DEV
|   +-- Tasks: Implement minimal code to pass tests
|   +-- Checkpoint: All tests pass, Build succeeds
|
+-- Step 3.3: Review
|   +-- Agent: CODE-REVIEWER
|   +-- Tasks: Quick review focused on security, bugs, AC
|   +-- Focus: Security issues, Obvious bugs, AC met
|   +-- Decision:
|       +-- approved: qa
|       +-- request_changes: implement
|   +-- Flag: doc_update_required
+-- GATE: Tests pass + Review approved
    +-- Block message: [NOT SPECIFIED]

-------------------------------------------------------------------------------

PHASE 4: Quick QA
|
+-- Agent: QA-AGENT
+-- Tasks: Test new feature thoroughly, Quick smoke test
+-- Checkpoint:
|   [x] Feature works as expected
|   [x] No obvious regressions
+-- Next: doc_sync
+-- GATE: [IMPLICIT - checkpoint based]
    +-- Block message: [NOT SPECIFIED]

-------------------------------------------------------------------------------

PHASE 5: Doc Sync [MANDATORY]
|
+-- Agent: TECH-WRITER
+-- Parallel Updates:
|   +-- PRD update (docs/1-BASELINE/product/prd.md)
|   +-- Architecture update (conditional)
|   +-- Feature docs (API docs, User guide)
+-- Checkpoint:
|   [x] PRD updated
|   [x] Architecture docs updated (if applicable)
|   [x] Feature documentation complete
+-- Next: tracking
+-- GATE: [IMPLICIT - checkpoint based]
    +-- Block message: [NOT SPECIFIED]

-------------------------------------------------------------------------------

PHASE 6: Phase Tracking
|
+-- Tasks: Mark feature DONE, Update phase completion %
+-- Update: PROJECT-STATE.md
+-- Phase completion check: Notify for phase transition

-------------------------------------------------------------------------------

COMPLETION:
+-- Actions: Update PROJECT-STATE.md, Notify user
```

### ISSUES FOUND:

| Severity | Issue |
|----------|-------|
| MAJOR | All gates are implicit (checkpoint-based) without explicit gate objects |
| MAJOR | No gate enforcers specified |
| MAJOR | No block messages defined anywhere |
| MINOR | quality_gates section exists but not linked to phase transitions |


---

## 4. SPRINT-WORKFLOW

**File:** `/workspaces/agent-methodology-pack/.claude/workflows/definitions/engineering/sprint-workflow.yaml`
**Trigger:** `sprint_start | sprint_planning | new_sprint`
**Duration:** 1-2 weeks per sprint

```
WORKFLOW: sprint-workflow
===============================================================================

PHASE 1: Sprint Start
|
+-- Step 1.1: Initialization
|   +-- Agent: ORCHESTRATOR
|   +-- Tasks: Create sprint folder, Set goal, Define capacity
|   +-- Output: docs/2-MANAGEMENT/sprints/sprint-{N}/sprint-plan.md
|
+-- Step 1.2: Doc Sync Check
|   +-- Agent: DOC-AUDITOR
|   +-- Tasks: Catch documentation drift before sprint
|   +-- Checkpoint: Changed files checked, API docs current
|   +-- Decision:
|       +-- Green (0-10%): planning
|       +-- Yellow (11-25%): add_doc_tasks
|       +-- Red (26%+): escalate_to_scrum_master
|
+-- Step 1.3: Planning
|   +-- Agent: SCRUM-MASTER
|   +-- Tasks: Review backlog, Select stories, Break down, Estimate, Commit
|   +-- Output: .claude/state/TASK-QUEUE.md
|   +-- Checkpoint:
|       [x] Stories selected within capacity
|       [x] Tasks created with estimates
|       [x] All tasks assigned
|
+-- GATE: Sprint Ready
    +-- Criteria:
    |   [x] Goal defined
    |   [x] Capacity calculated
    |   [x] Stories selected
    |   [x] Tasks created
    |   [x] All assigned
    +-- Enforcer: [NOT SPECIFIED]
    +-- Block message: [NOT SPECIFIED]
    +-- Next: daily_cycle

-------------------------------------------------------------------------------

PHASE 2: Daily Cycle [REPEATING]
|
+-- Step 2.1: Morning Standup
|   +-- Agent: SCRUM-MASTER
|   +-- Tasks: Review progress, Identify blockers, Update status
|   +-- Output: docs/2-MANAGEMENT/sprints/sprint-{N}/daily/day-{X}.md
|
+-- Step 2.2: Task Queue Update
|   +-- Agent: ORCHESTRATOR
|   +-- Tasks: Process completed, Resolve dependencies, Assign ready tasks
|
+-- Step 2.3: Agent Work [PARALLEL]
|   +-- Sub-workflows: story-delivery.yaml, bug-workflow.yaml
|   +-- For each: active_story, active_bug
|
+-- Step 2.4: Quality Gates [CONTINUOUS]
|   +-- Checks: Tests passing, Reviews completed, No critical bugs
|
+-- Step 2.5: End of Day
|   +-- Agent: SCRUM-MASTER
|   +-- Tasks: Update metrics, Record decisions, Prepare next day
|
+-- Decision:
    +-- more_days: daily_cycle
    +-- last_day: sprint_end

-------------------------------------------------------------------------------

PHASE 3: Sprint End
|
+-- Step 3.1: Doc Audit
|   +-- Agent: DOC-AUDITOR
|   +-- Tasks: Verify documentation quality
|   +-- Checkpoint: Features documented, API changes reflected
|   +-- Decision:
|       +-- pass: sprint_review
|       +-- needs_work: route_to_tech_writer
|
+-- Step 3.2: Sprint Review
|   +-- Agents: SCRUM-MASTER, PRODUCT-OWNER
|   +-- Tasks: Demo stories, Review AC, Accept/reject, Gather feedback
|   +-- Output: docs/2-MANAGEMENT/sprints/sprint-{N}/review-report.md
|
+-- Step 3.3: Retrospective
|   +-- Agent: SCRUM-MASTER
|   +-- Tasks: Reflect, Identify improvements, Create action items
|   +-- Output: docs/2-MANAGEMENT/sprints/sprint-{N}/retrospective.md
|
+-- Step 3.4: Velocity Tracking
|   +-- Agent: SCRUM-MASTER
|   +-- Tasks: Calculate velocity, Update history, Forecast
|
+-- Step 3.5: Deployment Release [CONDITIONAL]
|   +-- Agent: DEVOPS-AGENT
|   +-- Condition: sprint_has_deployable_changes == true
|   +-- Tasks: CI/CD pipeline, Deploy staging, Deploy production
|   +-- Output: docs/2-MANAGEMENT/sprints/sprint-{N}/deployment-report.md
|   +-- Checkpoint: Pipeline green, Staging verified, Rollback confirmed
|
+-- Step 3.6: Archive & Transition
|   +-- Agents: TECH-WRITER, ORCHESTRATOR
|   +-- Tasks: Archive docs, Update release notes, Reset for next sprint

-------------------------------------------------------------------------------

COMPLETION:
+-- Actions: Archive sprint folder, Update velocity, Transition
+-- Next workflow options: sprint-workflow.yaml OR release-workflow.yaml
```

### ISSUES FOUND:

| Severity | Issue |
|----------|-------|
| MAJOR | Sprint Ready gate has no explicit enforcer |
| MAJOR | No block messages defined for any gate |
| MAJOR | Daily Cycle has no formal gates - only continuous checks |
| MAJOR | Sprint End phases have no consolidated gate |
| MINOR | Deployment gates defined in quality_gates summary but not in phases |


---

## 5. BUG-WORKFLOW

**File:** `/workspaces/agent-methodology-pack/.claude/workflows/definitions/engineering/bug-workflow.yaml`
**Trigger:** `bug_report | defect | regression | incident`
**Duration:** Varies by complexity

```
WORKFLOW: bug-workflow (Complexity-Based Routing)
===============================================================================

PHASE 1: Intake [ALL PATHS]
|
+-- Agent: QA-AGENT (opus)
+-- Tasks: Receive/document bug, Verify completeness, Assign severity
+-- Output: Bug report (BUG-{ID})
+-- GATE: INTAKE_COMPLETE
    +-- Criteria:
    |   [x] Bug report template filled
    |   [x] Steps to reproduce documented
    |   [x] Environment captured
    |   [x] Initial severity assigned
    +-- on_fail: request_more_info
    +-- on_pass: severity_assessment
    +-- Block message: [IMPLICIT - request more info action]

-------------------------------------------------------------------------------

PHASE 2: Severity Assessment [ALL PATHS]
|
+-- Agent: QA-AGENT (opus)
+-- Tasks: Analyze impact, Check workarounds, Assess risk, Assign priority
+-- Output: Severity level, Priority, Impact analysis
+-- GATE: SEVERITY_ASSIGNED
    +-- Criteria:
    |   [x] Severity level assigned
    |   [x] Priority set
    |   [x] Justification documented
    +-- on_pass: complexity_routing
    +-- Block message: [NOT SPECIFIED]

-------------------------------------------------------------------------------

PHASE 3: Complexity Routing [ALL PATHS]
|
+-- Agent: QA-AGENT (opus)
+-- Tasks: Estimate scope, Count files, Determine investigation need
+-- Routing Decision:
|   +-- simple: simple_fix
|   +-- medium: medium_investigation
|   +-- complex: complex_research
+-- GATE: ROUTING_COMPLETE
    +-- Criteria:
    |   [x] Complexity assessed
    |   [x] Path selected
    |   [x] Justification documented
    +-- Block message: [NOT SPECIFIED]

===============================================================================
SIMPLE PATH (< 1 hour)
===============================================================================

PHASE S1: Simple Fix
|
+-- Agent: BACKEND-DEV | FRONTEND-DEV (haiku)
+-- Tasks: Locate issue, Implement fix (< 10 LOC), Run tests, Verify
+-- GATE: SIMPLE_FIX_COMPLETE
    +-- Criteria:
    |   [x] Fix is < 10 lines of code
    |   [x] All tests pass
    |   [x] No side effects introduced
    +-- on_fail: escalate_to_medium
    +-- on_pass: simple_review
    +-- Block message: [IN SUMMARY - "Cannot proceed to review"]

-------------------------------------------------------------------------------

PHASE S2: Simple Review
|
+-- Agent: CODE-REVIEWER (haiku)
+-- Checklist: Fix correct, No side effects, Tests pass, No security
+-- GATE: SIMPLE_REVIEW_APPROVED
    +-- Decision: approved -> simple_verify, rejected -> simple_fix
    +-- Criteria: Fix approved, No issues found
    +-- Block message: [IN SUMMARY - "Must fix and resubmit"]

-------------------------------------------------------------------------------

PHASE S3: Simple Verify
|
+-- Agent: QA-AGENT (haiku)
+-- Tasks: Verify bug fixed, Quick smoke test, Close bug
+-- GATE: SIMPLE_VERIFIED
    +-- Criteria:
    |   [x] Bug confirmed fixed
    |   [x] No new bugs introduced
    +-- on_pass: bug_closed
    +-- Block message: [IN SUMMARY - "Cannot close bug"]

===============================================================================
MEDIUM PATH (2-8 hours)
===============================================================================

PHASE M1: Medium Investigation
|
+-- Agent: BACKEND-DEV | FRONTEND-DEV (opus)
+-- Tasks: Reproduce, Debug, Document findings, Propose fix
+-- Output: Root cause analysis, Reproduction steps, Proposed fix
+-- GATE: ROOT_CAUSE_IDENTIFIED
    +-- Criteria:
    |   [x] Bug can be reproduced
    |   [x] Root cause identified
    |   [x] Fix approach documented
    +-- on_fail: escalate_to_complex
    +-- on_pass: medium_test_red
    +-- Block message: [IN SUMMARY - "Cannot write tests"]

-------------------------------------------------------------------------------

PHASE M2: Medium Test (RED)
|
+-- Agent: TEST-WRITER (opus)
+-- Tasks: Write reproduction test, Verify test FAILS, Add edge cases
+-- Output: Failing reproduction test, Edge case tests
+-- GATE: RED_TESTS_WRITTEN
    +-- Criteria:
    |   [x] Reproduction test exists
    |   [x] Test fails with current code
    |   [x] Edge cases covered
    +-- on_pass: medium_fix_green
    +-- Block message: [IN SUMMARY - "Cannot implement fix"]

-------------------------------------------------------------------------------

PHASE M3: Medium Fix (GREEN)
|
+-- Agent: BACKEND-DEV | FRONTEND-DEV (opus)
+-- Tasks: Implement fix, Make all tests pass, Run full suite
+-- GATE: GREEN_TESTS_PASS
    +-- Criteria:
    |   [x] All tests pass
    |   [x] No regressions
    |   [x] Build succeeds
    +-- on_fail: medium_fix_green (iterate)
    +-- on_pass: medium_review
    +-- Block message: [IN SUMMARY - "Cannot proceed to review"]

-------------------------------------------------------------------------------

PHASE M4: Medium Review
|
+-- Agent: CODE-REVIEWER (opus)
+-- Checklist: Root cause addressed, Fix minimal, Tests meaningful
+-- GATE: MEDIUM_REVIEW_APPROVED
    +-- Decision: approved -> medium_verify, request_changes -> medium_fix_green
    +-- Block message: [IN SUMMARY - "Must fix and retest"]

-------------------------------------------------------------------------------

PHASE M5: Medium Verify
|
+-- Agent: QA-AGENT (opus)
+-- Tasks: Verify fix, Regression tests, Test related functionality
+-- GATE: MEDIUM_VERIFIED
    +-- Decision: pass -> bug_closed, fail -> medium_investigation
    +-- Block message: [IN SUMMARY - "Cannot close bug"]

===============================================================================
COMPLEX PATH (1+ days)
===============================================================================

PHASE C1: Complex Research [OPTIONAL]
|
+-- Agent: RESEARCH-AGENT (opus)
+-- Condition: unknown_domain OR security_cve OR external_integration
+-- Tasks: Research technology, Search community, Document findings
+-- Output: Research document, Recommendations
+-- GATE: RESEARCH_COMPLETE
    +-- Criteria:
    |   [x] Technology context documented
    |   [x] Community solutions identified
    |   [x] Recommendations provided
    +-- on_pass: complex_architecture
    +-- Block message: [IN SUMMARY - "Cannot proceed to architecture review"]

-------------------------------------------------------------------------------

PHASE C2: Complex Architecture Review
|
+-- Agent: ARCHITECT-AGENT (opus)
+-- Tasks: Deep analysis, Identify root cause, Evaluate options, ADR if needed
+-- Output: Architecture analysis, Solution options, ADR
+-- Decision point:
|   +-- fix_in_workflow: complex_senior_fix
|   +-- convert_to_story: story_workflow_handoff
+-- GATE: ARCHITECTURE_APPROVED
    +-- Criteria:
    |   [x] System impact analyzed
    |   [x] Root cause category identified
    |   [x] Solution approach selected
    |   [x] ADR created (if needed)
    +-- Block message: [IN SUMMARY - "Cannot implement fix"]

-------------------------------------------------------------------------------

PHASE C3: Story Workflow Handoff [CONDITIONAL]
|
+-- Type: handoff to story-delivery.yaml
+-- Tasks: Create story, Link bug, Transfer analysis, Close bug
+-- Output: Story document, Bug status: Converted

-------------------------------------------------------------------------------

PHASE C4: Complex Senior Fix
|
+-- Agent: SENIOR-DEV (opus)
+-- Tasks: Implement architectural fix, Update components, Tests, Docs
+-- GATE: COMPLEX_FIX_COMPLETE
    +-- Criteria:
    |   [x] Fix implemented per architecture decision
    |   [x] All affected systems updated
    |   [x] Tests comprehensive
    |   [x] Documentation updated
    +-- on_pass: complex_full_review
    +-- Block message: [IN SUMMARY - "Cannot proceed to review"]

-------------------------------------------------------------------------------

PHASE C5: Complex Full Review [PARALLEL]
|
+-- Parallel Track A: CODE-REVIEWER (opus)
|   +-- Checklist: Implementation correct, Tests comprehensive, No regressions
|
+-- Parallel Track B: ARCHITECT-AGENT (opus)
|   +-- Checklist: Solution matches approach, No new tech debt, Docs updated
|
+-- Security Review: No new vulns, Best practices followed
+-- GATE: COMPLEX_REVIEW_APPROVED
    +-- Decision: approved -> complex_qa, request_changes -> complex_senior_fix
    +-- Block message: [IN SUMMARY - "Must fix and resubmit"]

-------------------------------------------------------------------------------

PHASE C6: Complex QA
|
+-- Agent: QA-AGENT (opus)
+-- Tasks: Full regression, Integration, Performance, Security validation
+-- GATE: COMPLEX_QA_PASSED
    +-- Decision: pass -> bug_closed, fail -> complex_senior_fix
    +-- Block message: [IN SUMMARY - "Cannot close bug"]

===============================================================================
COMPLETION: bug_closed
===============================================================================

+-- Tasks: Update status, Update PROJECT-STATE.md, Log metrics, Notify
```

### ISSUES FOUND:

| Severity | Issue |
|----------|-------|
| MINOR | Block messages only in quality_gates summary, not inline with phases |
| MINOR | Some gates lack explicit on_fail actions |
| GOOD | Most comprehensive gate definitions of all workflows |


---

## 6. AD-HOC-FLOW

**File:** `/workspaces/agent-methodology-pack/.claude/workflows/definitions/engineering/ad-hoc-flow.yaml`
**Trigger:** `quick_fix | refactor | small_task | direct_request`
**Duration:** Variable (typically short)

```
WORKFLOW: ad-hoc-flow
===============================================================================

PHASE 1: Implementation [MANDATORY]
|
+-- Agent Selection:
|   +-- api_database_logic: BACKEND-DEV
|   +-- ui_components_styles: FRONTEND-DEV
|   +-- complex_architectural: SENIOR-DEV
|   +-- full_stack: SENIOR-DEV
+-- Model: opus (default), opus (complex)
+-- Tasks: Analyze request, Identify files, Plan approach, Implement, Self-verify
+-- Output: Implemented code, Modified files list, Summary
+-- GATE: CODE_COMPLETE
    +-- Criteria:
    |   [x] Implementation matches user request
    |   [x] Code compiles/runs without errors
    |   [x] Basic self-testing done
    |   [x] Ready for formal testing
    +-- on_fail: iterate_implementation
    +-- on_pass: testing
    +-- Block message: [IN SUMMARY - "Cannot proceed to testing"]

-------------------------------------------------------------------------------

PHASE 2: Testing [MANDATORY - CRITICAL]
|
+-- Agent: TEST-WRITER (opus)
+-- Duration: 30min - 2 hours
+-- Tasks: Review changes, Identify test requirements, Write tests, Run suite
+-- Test Strategy:
|   +-- new_function: Unit tests
|   +-- api_change: Integration tests
|   +-- bug_fix: Regression test
|   +-- ui_change: Component tests
|   +-- refactor: Existing tests must pass
+-- Output: Test files, Execution report, Coverage report
+-- GATE: TESTS_PASS
    +-- Criteria:
    |   [x] New tests written for changes
    |   [x] All new tests pass
    |   [x] No regression in existing tests
    |   [x] Coverage maintained (not decreased)
    |   [x] All critical paths covered
    +-- on_fail: return_to_implementation
    +-- on_pass: review
    +-- Block message: [IN SUMMARY - "Cannot proceed to review"]

-------------------------------------------------------------------------------

PHASE 3: Review [MANDATORY - CRITICAL]
|
+-- Agent: CODE-REVIEWER (opus default, haiku simple)
+-- Checklist:
|   +-- Standards: Coding standards, Naming, File organization
|   +-- Patterns: Uses established patterns, No anti-patterns
|   +-- Security: No secrets, Input validation, No injection, Auth
|   +-- Quality: Error handling, No duplication, Tests meaningful
+-- GATE: REVIEW_APPROVED
    +-- Decision: approved -> completion, request_changes -> fix
    +-- Block message: [IN SUMMARY - "Must fix and retest"]

-------------------------------------------------------------------------------

PHASE 4: Fix [CONDITIONAL]
|
+-- Condition: review.decision == request_changes
+-- Agent: original_developer
+-- Tasks: Review feedback, Address Must Fix, Address Should Fix
+-- Output: Updated code, Summary of changes
+-- Next: testing (always return to testing after fixes)

-------------------------------------------------------------------------------

PHASE 5: Completion
|
+-- Agent: ORCHESTRATOR (opus)
+-- Tasks: Verify all gates, Update state files, Log metrics, Inform user
+-- GATE: USER_ACKNOWLEDGED
    +-- Criteria:
    |   [x] User informed of completion
    |   [x] Deliverables confirmed
    |   [x] State files updated
    |   [x] Next action communicated (if any)
    +-- Block message: [IN SUMMARY - "Task not complete"]
```

### ISSUES FOUND:

| Severity | Issue |
|----------|-------|
| MINOR | Block messages only in quality_gates summary, not inline |
| MINOR | No explicit gate enforcers listed |
| GOOD | Clear mandatory/critical flags on testing and review phases |
| GOOD | Good error recovery paths defined |


---

## 7. QUICK-FIX

**File:** `/workspaces/agent-methodology-pack/.claude/workflows/definitions/engineering/quick-fix.yaml`
**Trigger:** `bug_fix | hotfix | small_change | typo`
**Duration:** < 1 hour

```
WORKFLOW: quick-fix
===============================================================================

Prerequisites:
+-- issue_clearly_defined
+-- scope_is_small
+-- no_architectural_changes

Eligibility:
+-- max_files_changed: 3
+-- max_lines_changed: 100
+-- no_new_dependencies: true
+-- no_schema_changes: true
+-- no_api_contract_changes: true

-------------------------------------------------------------------------------

PHASE 1: Assess
|
+-- Agent: SENIOR-DEV
+-- Tasks: Assess fix scope and approach
+-- Output: estimated_scope, files_affected, approach, bug_type
+-- Decision:
|   +-- small: write_reproduction_test
|   +-- medium_or_large: escalate_to_story
+-- GATE: [IMPLICIT - assessment decision]
    +-- Block message: [NOT SPECIFIED]

-------------------------------------------------------------------------------

PHASE 2: Write Reproduction Test
|
+-- Agent: TEST-WRITER (haiku)
+-- Tasks: Write test that reproduces bug (RED phase)
+-- Output: Failing reproduction test
+-- Checkpoint:
|   [x] Test reproduces the bug
|   [x] Test FAILS with current code
+-- GATE: BUG_REPRODUCED
    +-- Criteria:
    |   [x] Reproduction test written
    |   [x] Test fails (proves bug exists)
    +-- on_pass: implement
    +-- Block message: [IN SUMMARY - "Cannot implement fix without failing test"]

-------------------------------------------------------------------------------

PHASE 3: Implement
|
+-- Agent Selection:
|   +-- backend_bug: BACKEND-DEV
|   +-- frontend_bug: FRONTEND-DEV
+-- Model: haiku
+-- Tasks: Implement fix to make reproduction test pass
+-- Output: Fixed source files
+-- Checkpoint:
|   [x] Fix addresses root cause
|   [x] Reproduction test now passes
|   [x] All existing tests still pass
+-- GATE: FIX_IMPLEMENTED
    +-- Criteria:
    |   [x] Reproduction test passes
    |   [x] All tests pass
    +-- on_pass: review
    +-- Block message: [IN SUMMARY - "Cannot proceed to review"]

-------------------------------------------------------------------------------

PHASE 4: Review
|
+-- Agent: CODE-REVIEWER (haiku)
+-- Tasks: Fast review for small changes
+-- Checkpoint:
|   [x] No security issues
|   [x] Tests adequate
|   [x] Code quality OK
+-- Decision:
|   +-- approved: verify
|   +-- request_changes: implement
+-- GATE: REVIEW_APPROVED
    +-- Criteria:
    |   [x] Code review passed
    |   [x] No security issues
    |   [x] Test coverage adequate
    +-- on_pass: verify
    +-- Block message: [IN SUMMARY - "Must fix and resubmit"]

-------------------------------------------------------------------------------

PHASE 5: Verify
|
+-- Agent: QA-AGENT (haiku)
+-- Tasks: Verify bug fixed, Quick smoke test
+-- Decision:
|   +-- pass: complete
|   +-- fail: implement
+-- GATE: QA_VERIFIED
    +-- Criteria:
    |   [x] Bug confirmed fixed
    |   [x] No new issues introduced
    +-- on_pass: complete
    +-- Block message: [IN SUMMARY - "Cannot close bug"]

-------------------------------------------------------------------------------

COMPLETION:
+-- Actions: Update issue status, Create commit, Close bug

ESCALATION PATH:
+-- escalate_to_story -> story-delivery.yaml
```

### ISSUES FOUND:

| Severity | Issue |
|----------|-------|
| MINOR | Block messages in summary but not inline |
| MINOR | Phase 1 Assess has no explicit gate |
| GOOD | Clear eligibility criteria defined |
| GOOD | Gates have explicit step and agent mapping in summary |


---

## 8. MIGRATION-WORKFLOW

**File:** `/workspaces/agent-methodology-pack/.claude/workflows/definitions/engineering/migration-workflow.yaml`
**Trigger:** `migration | onboarding | methodology_setup`
**Duration:** 4 hours (small) to 3 days (large)

```
WORKFLOW: migration-workflow
===============================================================================

Strategies:
+-- auto: Small projects (<50 files), 4-6 hours
+-- manual: Large projects (>200 files), 2-3 days
+-- hybrid: Medium projects (50-200 files), 1-2 days

-------------------------------------------------------------------------------

PHASE 1: Discovery
|
+-- Step 1.1: Project Scan
|   +-- Agent: DOC-AUDITOR (opus)
|   +-- Tasks: Scan project, Inventory docs, Identify large files, Detect orphans
|   +-- Output: AUDIT-REPORT.md
|   +-- Checkpoint:
|       [x] All project files scanned
|       [x] Large files identified
|       [x] Tech stack detected
|       [x] Issues documented
|
+-- Step 1.2: Context Interview [CONDITIONAL]
|   +-- Agent: DISCOVERY-AGENT (opus)
|   +-- Condition: scan.has_gaps OR scan.missing_context
|   +-- Skip if: complete_docs_found OR --skip-interview
|   +-- Config: depth=quick, max_questions=7
|   +-- Output: docs/0-DISCOVERY/MIGRATION-CONTEXT.md
|
+-- GATE: Audit Complete
    +-- Criteria:
    |   [x] All project files scanned
    |   [x] Large files identified
    |   [x] Tech stack detected
    |   [x] Issues documented
    |   [x] Report generated
    |   [x] Strategy recommended
    +-- Enforcer: [NOT SPECIFIED]
    +-- Block message: [NOT SPECIFIED]
    +-- Next: planning

-------------------------------------------------------------------------------

PHASE 2: Planning
|
+-- Step 2.1: Review Strategy
|   +-- Agent: ORCHESTRATOR (opus)
|   +-- Tasks: Review audit, Assess complexity, Choose strategy, Create plan
|   +-- Complexity Assessment:
|       +-- small: <50 files, AUTO
|       +-- medium: 50-200 files, HYBRID
|       +-- large: >200 files, MANUAL
|
+-- Step 2.2: Detailed Planning
|   +-- Agent: SCRUM-MASTER (opus)
|   +-- Tasks: Break down tasks, Prioritize MoSCoW, Estimate, Create timeline
|   +-- Output: MIGRATION-PLAN.md
|
+-- GATE: Plan Approved
    +-- Criteria:
    |   [x] Strategy chosen and justified
    |   [x] Tasks broken down and estimated
    |   [x] Timeline is realistic
    |   [x] Risks identified and mitigated
    |   [x] Rollback plan defined
    |   [x] Backup created
    +-- Enforcer: [NOT SPECIFIED]
    +-- Block message: [NOT SPECIFIED]
    +-- Next: execution

-------------------------------------------------------------------------------

PHASE 3: Execution
|
+-- Step 3.1: Setup Structure
|   +-- Agent: TECH-WRITER (opus)
|   +-- Tasks: Create .claude/ structure, Copy agents/workflows, Create state
|   +-- Checkpoint: Directories created, Files copied, State initialized
|
+-- Step 3.2: Create Core Files
|   +-- Agent: TECH-WRITER (opus)
|   +-- Tasks: Generate CLAUDE.md (<70 lines), Create PROJECT-STATE.md
|   +-- Checkpoint: CLAUDE.md exists and <70 lines, PROJECT-STATE.md exists
|
+-- Step 3.3: Migrate Documentation
|   +-- Agent: TECH-WRITER (opus)
|   +-- Tasks: Map to documentation structure, Move files, Create missing docs
|   +-- Documentation Mapping:
|       +-- 1-BASELINE: Requirements & Design
|       +-- 2-MANAGEMENT: Epics & Sprints
|       +-- 3-IMPLEMENTATION: Code & Tests
|       +-- 4-RELEASE: Deployment & Docs
|   +-- Checkpoint: All docs mapped, Files moved, Cross-refs updated
|
+-- Step 3.4: Shard Large Files [CONDITIONAL]
|   +-- Agent: TECH-WRITER (opus)
|   +-- Condition: large_files_exist
|   +-- For each: file > 500 lines
|   +-- Tasks: Analyze, Split into modules, Create index, Update refs
|   +-- Checkpoint: Split to <500 lines each, Index created
|
+-- Step 3.5: Generate Workspaces
|   +-- Agent: ARCHITECT-AGENT (opus)
|   +-- Tasks: Analyze architecture, Create workspace definitions
|   +-- Output: .claude/agents/workspaces/*.md
|   +-- Checkpoint: Workspaces defined, File-to-agent mapping complete
|
+-- Step 3.6: Infrastructure Setup [CONDITIONAL]
|   +-- Agent: DEVOPS-AGENT (opus)
|   +-- Condition: project_has_deployment_needs == true
|   +-- Tasks: Analyze CI/CD, Migrate pipeline, Setup deployment
|   +-- Output: .github/workflows/, Dockerfile, deployment-guide.md
|   +-- Checkpoint: Pipeline configured, Configs migrated, No secrets

-------------------------------------------------------------------------------

PHASE 4: Verification
|
+-- Step 4.1: Validation Script
|   +-- Command: bash scripts/validate-migration.sh
|   +-- Checks:
|       +-- Structure: .claude/ exists, subdirectories present
|       +-- Files: CLAUDE.md exists and <70 lines, PROJECT-STATE exists
|       +-- Content: @references valid, No broken links, No files >500 lines
|
+-- Step 4.2: Test Agent Loading
|   +-- Verify: Agents load, @references resolve, Context within budget
|
+-- Step 4.3: Deployment Validation [CONDITIONAL]
|   +-- Agent: DEVOPS-AGENT (opus)
|   +-- Condition: infrastructure_setup_completed == true
|   +-- Tasks: Validate pipeline syntax, Test dry-run, Verify configs
|   +-- Checkpoint: Pipeline valid, Configs correct, Security enabled
|
+-- GATE: Migration Complete
    +-- Criteria:
    |   [x] All validation checks pass
    |   [x] All agents can load successfully
    |   [x] All @references work
    |   [x] CLAUDE.md < 70 lines
    |   [x] No orphaned files
    |   [x] Workflows tested
    |   [x] Team can use methodology
    +-- Enforcer: [NOT SPECIFIED]
    +-- Block message: [NOT SPECIFIED]

-------------------------------------------------------------------------------

COMPLETION:
+-- Actions: Update PROJECT-STATE.md, Archive artifacts, Update docs
+-- Next workflow options: epic-workflow.yaml OR sprint-workflow.yaml
```

### ISSUES FOUND:

| Severity | Issue |
|----------|-------|
| MAJOR | No gate enforcers specified for any gate |
| MAJOR | No block messages defined for any gate |
| MINOR | Execution phase has no consolidated gate |
| GOOD | Comprehensive rollback procedures defined |
| GOOD | Clear complexity assessment criteria |


---

## 9. PLANNING-FLOW

**File:** `/workspaces/agent-methodology-pack/.claude/workflows/definitions/product/planning-flow.yaml`
**Trigger:** `planning | roadmap | prioritization | epic_planning`
**Duration:** 1-3 sessions

```
WORKFLOW: planning-flow
===============================================================================

Modes:
+-- portfolio: Full portfolio planning (new project, major pivot)
+-- epic_scoped: Single epic deep-dive
+-- adjustment: Quick priority adjustment

-------------------------------------------------------------------------------

PHASE 1: Context Gathering
|
+-- Agent: ORCHESTRATOR
+-- Tasks: Validate discovery outputs, Identify gaps, Trigger research if needed
+-- Parallel Research: research-agent (on technology_unknown, market_gap, etc.)
+-- Output: docs/0-DISCOVERY/planning-context.md
+-- Checkpoint:
|   [x] All required inputs available
|   [x] Clarity score >= 60%
|   [x] No critical unknowns blocking
+-- GATE: [Inline decision]
    +-- pass: outcomes
    +-- fail: return_to_discovery
    +-- Block message: [NOT SPECIFIED]

-------------------------------------------------------------------------------

PHASE 2: Outcomes & PRD
|
+-- Agent: PM-AGENT
+-- Tasks: Define SMART metrics, Create/update PRD, Apply MoSCoW, Define scope
+-- Output: docs/1-BASELINE/product/prd.md, success-metrics.md
+-- Checkpoint:
|   [x] All requirements have MoSCoW priority
|   [x] Success metrics are SMART
|   [x] Scope explicitly defined (IN/OUT/FUTURE)
|   [x] At least 3 MUST requirements defined
+-- GATE: [Inline decision]
    +-- pass: epic_discovery
    +-- needs_revision: iterate (max 2)
    +-- Block message: [NOT SPECIFIED]

-------------------------------------------------------------------------------

PHASE 3: Epic Discovery & Breakdown [SUB-PHASES]
|
+-- Sub-Phase 3.1: Epic Identification
|   +-- Agent: ARCHITECT-AGENT
|   +-- Tasks: Map PRD to epics, Ensure boundaries, Validate INVEST
|   +-- Output: docs/2-MANAGEMENT/epics/epic-catalog.md
|   +-- Checkpoint: Requirements mapped, Boundaries clear, No orphans
|
+-- Sub-Phase 3.2: Dependency Mapping
|   +-- Agent: ARCHITECT-AGENT
|   +-- Tasks: Identify tech/business dependencies, Create graph
|   +-- Output: docs/2-MANAGEMENT/epics/dependency-graph.md
|   +-- Checkpoint: All deps explicit, No circular, Critical path identified
|
+-- Sub-Phase 3.3: Risk Assessment
|   +-- Agent: ARCHITECT-AGENT
|   +-- Tasks: Identify risks, Propose mitigations, Flag unknowns
|   +-- Output: docs/2-MANAGEMENT/risks/risk-registry.md
|   +-- Checkpoint: Each epic has risk, High risks have mitigation
|
+-- GATE: [Inline decision]
    +-- pass: prioritization
    +-- needs_research: trigger research-agent, return to risk_assessment
    +-- Block message: [NOT SPECIFIED]

-------------------------------------------------------------------------------

PHASE 4: Prioritization & Roadmap [SUB-PHASES]
|
+-- Sub-Phase 4.1: Value Scoring
|   +-- Agent: PRODUCT-OWNER
|   +-- Tasks: Apply scoring framework, Consider dependencies
|   +-- Scoring: business_value, user_impact, technical_risk, dependency_weight
|   +-- Output: docs/2-MANAGEMENT/epics/prioritized-backlog.md
|
+-- Sub-Phase 4.2: Roadmap Creation
|   +-- Agent: PRODUCT-OWNER
|   +-- Tasks: Bucket into NOW/NEXT/LATER, Define milestones
|   +-- Output: docs/2-MANAGEMENT/roadmap.md
|   +-- Checkpoint: NOW bucket max 2-3 epics, Dependencies respected
|
+-- GATE: [Inline decision]
    +-- pass: sprint_intake
    +-- needs_revision: rebalance (on NOW > 3 or dependency_violation)
    +-- Block message: [NOT SPECIFIED]

-------------------------------------------------------------------------------

PHASE 5: Sprint Intake Preparation [SUB-PHASES]
|
+-- Sub-Phase 5.1: Story Breakdown
|   +-- Agent: ARCHITECT-AGENT
|   +-- Tasks: Break NOW epics into INVEST stories, Define AC
|   +-- Output: docs/2-MANAGEMENT/epics/epic-{N}-stories.md
|   +-- Checkpoint: All stories pass INVEST, AC in Given/When/Then
|
+-- Sub-Phase 5.2: INVEST Validation
|   +-- Agent: PRODUCT-OWNER
|   +-- Tasks: Review INVEST compliance, Verify PRD traceability
|   +-- Output: docs/2-MANAGEMENT/reviews/invest-review-epic-{N}.md
|   +-- Decision:
|       +-- approved: confirmation
|       +-- needs_revision: return to story_breakdown (max 2)
+-- GATE: [Decision-based]
    +-- Block message: [NOT SPECIFIED]

-------------------------------------------------------------------------------

PHASE 6: Planning Confirmation
|
+-- Agent: ORCHESTRATOR
+-- Tasks: Verify artifacts, Confirm alignment, Prepare handoff
+-- Output: docs/2-MANAGEMENT/planning-summary.md
+-- Checkpoint:
|   [x] All planning artifacts complete
|   [x] Stories ready for sprint planning
|   [x] No blocking issues
+-- Next workflow: new-project.yaml OR EPIC-WORKFLOW.md
```

### ISSUES FOUND:

| Severity | Issue |
|----------|-------|
| MAJOR | No explicit gate objects - all inline decisions |
| MAJOR | No gate enforcers specified |
| MAJOR | No block messages defined |
| MINOR | quality_gates section exists but not linked to phases |
| GOOD | Clear mode-based phase skipping |


---

## 10. DISCOVERY-FLOW

**File:** `/workspaces/agent-methodology-pack/.claude/workflows/definitions/product/discovery-flow.yaml`
**Trigger:** `discovery | new_project | migration | new_epic | unclear_requirements`
**Duration:** 45-60 minutes

```
WORKFLOW: discovery-flow
===============================================================================

Modes:
+-- deep: Full discovery for greenfield (clarity_target: 85)
+-- quick: Migration context (clarity_target: 50)
+-- standard: New epic (clarity_target: 70)
+-- targeted: Clarification (clarity_target: 90)

-------------------------------------------------------------------------------

PHASE 1: Initial Scan [OPTIONAL for some modes]
|
+-- Agent: DOC-AUDITOR (opus)
+-- Tasks: Scan project structure, Identify docs, List configs
+-- Output: docs/0-DISCOVERY/INITIAL-SCAN.md
+-- Checkpoint:
|   [x] Project structure mapped
|   [x] Existing documentation identified
|   [x] Key files listed
|   [x] Technology stack indicators noted
+-- GATE: SCAN_COMPLETE
    +-- Type: quality_gate
    +-- Enforcer: doc-auditor
    +-- pass: interview
    +-- blocking: interview
    +-- Block message: [NOT SPECIFIED]
    +-- on_blocked: expand_scan_scope

-------------------------------------------------------------------------------

PHASE 2: Discovery Interview
|
+-- Agent: DISCOVERY-AGENT (opus, opus for complex)
+-- Interview Structure:
|   +-- vision_goals: Purpose, Problem, Success
|   +-- users_personas: Target, Pain points, Tech-savvy
|   +-- features_requirements: Must-have, Nice-to-have, Out of scope
|   +-- constraints: Timeline, Budget, Technical, Regulatory
|   +-- context: New vs replacement, Integrations, Stakeholders
+-- Output: docs/0-DISCOVERY/PROJECT-UNDERSTANDING.md
+-- Checkpoint:
|   [x] All structured questions answered
|   [x] Goals and vision documented
|   [x] Target users identified
|   [x] Key requirements captured
|   [x] Constraints documented
+-- GATE: INTERVIEW_COMPLETE
    +-- Type: quality_gate
    +-- Enforcer: discovery-agent
    +-- pass: domain_questions
    +-- blocking: domain_questions
    +-- Block message: [NOT SPECIFIED]
    +-- on_blocked: schedule_followup

-------------------------------------------------------------------------------

PHASE 3: Domain-Specific Questions [PARALLEL]
|
+-- Parallel Agent A: Technical Discovery
|   +-- Agent: ARCHITECT-AGENT (opus)
|   +-- Questions: Tech stack, Integrations, Scale, Security, Performance, Deployment
|
+-- Parallel Agent B: Business Discovery
|   +-- Agent: PM-AGENT (opus)
|   +-- Questions: Market, Competitors, Business model, Success metrics, Priorities
|
+-- Parallel Agent C: Research Discovery [OPTIONAL]
|   +-- Agent: RESEARCH-AGENT (opus)
|   +-- Questions: Unknowns, Research needs, Assumptions, Risks
|
+-- Parallel Agent D: UX Discovery [CONDITIONAL]
|   +-- Agent: UX-DESIGNER (opus)
|   +-- Condition: UI requirements present
|   +-- Questions: User journey, Accessibility, Platforms, Design system
|
+-- Output: docs/0-DISCOVERY/PROJECT-UNDERSTANDING.md (merged)
+-- Checkpoint:
|   [x] Technical requirements understood
|   [x] Business context clear
|   [x] Unknowns documented
|   [x] All domain sections complete
+-- GATE: DOMAINS_COVERED
    +-- Type: quality_gate
    +-- Enforcer: orchestrator
    +-- pass: gap_analysis
    +-- blocking: gap_analysis
    +-- Block message: [NOT SPECIFIED]
    +-- on_blocked: focused_session
+-- Conflict Resolution: joint_session with all agents

-------------------------------------------------------------------------------

PHASE 4: Gap Analysis
|
+-- Agents: DOC-AUDITOR, DISCOVERY-AGENT (opus)
+-- Tasks: Review outputs, Identify gaps, Prioritize unknowns, Propose resolution
+-- Gap Categories:
|   +-- blocking: Must resolve before planning
|   +-- important: Resolve during planning
|   +-- minor: Resolve during development
|   +-- deferred: Document for later
+-- Output: docs/0-DISCOVERY/GAPS-AND-QUESTIONS.md
+-- Checkpoint:
|   [x] All gaps documented
|   [x] Open questions listed
|   [x] Priorities assigned
|   [x] Resolution strategies proposed
|   [x] No blocking gaps OR resolution plan exists
+-- GATE: GAPS_IDENTIFIED
    +-- Type: quality_gate
    +-- Enforcer: doc-auditor
    +-- pass: confirmation
    +-- blocking: confirmation
    +-- Block message: [NOT SPECIFIED]
    +-- on_blocked: return to interview

-------------------------------------------------------------------------------

PHASE 5: Confirmation
|
+-- Agent: ORCHESTRATOR (opus)
+-- Tasks: Compile summary, Present to user, Handle corrections, Finalize
+-- Summary sections:
|   +-- Project Overview
|   +-- Key Goals
|   +-- Target Users
|   +-- Must-Have Features
|   +-- Technical Approach
|   +-- Business Context
|   +-- Key Assumptions
|   +-- Open Questions (Non-Blocking)
+-- Output: docs/0-DISCOVERY/PROJECT-UNDERSTANDING.md (approved)
+-- Checkpoint:
|   [x] Summary presented to user
|   [x] User reviewed all sections
|   [x] User confirmed accuracy OR provided corrections
|   [x] Corrections incorporated
|   [x] Document marked as approved
+-- GATE: USER_CONFIRMED
    +-- Type: approval_gate
    +-- Enforcer: user
    +-- blocking: next_workflow
    +-- Block message: [NOT SPECIFIED]
    +-- on_blocked: address_corrections
    +-- on_rejection: return to appropriate phase
```

### ISSUES FOUND:

| Severity | Issue |
|----------|-------|
| MAJOR | Block messages not defined (just "blocking: X") |
| MINOR | on_blocked actions defined but not all have clear messaging |
| GOOD | Explicit gate IDs and types |
| GOOD | Clear enforcer assignment |
| GOOD | Multiple gate types (quality_gate, approval_gate) |


---

## 11. NEW-PROJECT

**File:** `/workspaces/agent-methodology-pack/.claude/workflows/definitions/product/new-project.yaml`
**Trigger:** `new_project | major_feature | greenfield`
**Duration:** Multiple sessions

```
WORKFLOW: new-project
===============================================================================

PHASE 1: Discovery
|
+-- Agent: DISCOVERY-AGENT
+-- Type: new_project, depth: deep
+-- Tasks: Gather requirements through structured interview
+-- Output: docs/0-DISCOVERY/PROJECT-UNDERSTANDING.md (min_clarity: 60)
+-- Checkpoint:
|   [x] Business context documented
|   [x] User personas identified
|   [x] Scope boundaries defined
+-- Next: prd_creation
+-- on_blocked: ask_user
+-- GATE: [IMPLICIT - checkpoint + clarity score]
    +-- Block message: [NOT SPECIFIED]

-------------------------------------------------------------------------------

PHASE 2: PRD Creation
|
+-- Agent: PM-AGENT
+-- Tasks: Create Product Requirements Document
+-- Output: docs/1-BASELINE/product/prd.md
+-- Checkpoint:
|   [x] All requirements have MoSCoW priority
|   [x] Success metrics are SMART
|   [x] Scope is explicit (in/out/future)
+-- Next: architecture
+-- on_blocked: return_to_discovery
+-- GATE: [IMPLICIT - checkpoint based]
    +-- Block message: [NOT SPECIFIED]

-------------------------------------------------------------------------------

PHASE 3: Architecture
|
+-- Agent: ARCHITECT-AGENT
+-- Type: full_design
+-- Tasks: Design architecture, Break into epics/stories
+-- Output: system-overview.md, epic-01-*.md
+-- Checkpoint:
|   [x] All PRD requirements mapped to stories
|   [x] ADRs created for major decisions
|   [x] Dependencies mapped
+-- Next: scope_validation
+-- on_blocked: return_to_pm
+-- GATE: [IMPLICIT - checkpoint based]
    +-- Block message: [NOT SPECIFIED]

-------------------------------------------------------------------------------

PHASE 4: Scope Validation
|
+-- Agent: PRODUCT-OWNER
+-- Tasks: Validate scope and INVEST compliance
+-- Output: docs/2-MANAGEMENT/reviews/scope-review-epic-01.md
+-- Checkpoint:
|   [x] All stories pass INVEST
|   [x] No scope creep detected
|   [x] AC are testable
+-- Decision:
|   +-- approved: sprint_planning
|   +-- needs_revision: return_to_architect
+-- on_blocked: ask_user
+-- GATE: [Decision-based]
    +-- Block message: [NOT SPECIFIED]

-------------------------------------------------------------------------------

PHASE 5: Sprint Planning
|
+-- Agent: SCRUM-MASTER
+-- Tasks: Plan first sprint
+-- Output: docs/2-MANAGEMENT/sprints/sprint-01-plan.md
+-- Checkpoint:
|   [x] Capacity not exceeded
|   [x] Dependencies respected
|   [x] Stories have estimates
+-- Next: complete
+-- GATE: [IMPLICIT - checkpoint based]
    +-- Block message: [NOT SPECIFIED]

-------------------------------------------------------------------------------

COMPLETION:
+-- Summary: Project ready for development
+-- Next workflow: engineering/story-delivery.yaml
```

### ISSUES FOUND:

| Severity | Issue |
|----------|-------|
| MAJOR | All gates are implicit (checkpoint-based only) |
| MAJOR | No explicit gate objects defined |
| MAJOR | No gate enforcers specified |
| MAJOR | No block messages defined |
| MINOR | quality_gates section exists but simple list format |


---

## 12. SKILL-DEVELOPMENT-WORKFLOW

**File:** `/workspaces/agent-methodology-pack/.claude/workflows/definitions/skills/skill-development-workflow.yaml`
**Trigger:** `skill_creation | skill_update | pattern_detected | skill_request`
**Duration:** 1-2 sessions per skill

```
WORKFLOW: skill-development-workflow
===============================================================================

Modes:
+-- new_skill: Create from scratch (all phases)
+-- skill_update: Update existing (skip design)
+-- skill_review: Periodic review (validation + integration only)

-------------------------------------------------------------------------------

PHASE 1: Research & Discovery [OPTIONAL for skill_review]
|
+-- Agent: RESEARCH-AGENT
+-- Tasks: Identify need, Research sources (Tier 1-3), Check version, Find duplicates
+-- Output: docs/skills/research/{skill-name}-research.md
+-- Checkpoint:
|   [x] At least 2 authoritative sources identified
|   [x] Sources are Tier 1-3
|   [x] No duplicate skill exists
|   [x] Clear use case defined
+-- GATE: [Inline decision]
    +-- pass: design
    +-- fail: escalate_to_user
    +-- fail_reason: "Insufficient sources or skill already exists"
    +-- Block message: [IMPLICIT in fail_reason]
    +-- on_blocked: request_user_input

-------------------------------------------------------------------------------

PHASE 2: Skill Design [OPTIONAL for update/review]
|
+-- Agent: SKILL-CREATOR
+-- Tasks: Define type, Draft triggers, Outline patterns, Plan anti-patterns
+-- Output: docs/skills/design/{skill-name}-design.md
+-- Checkpoint:
|   [x] Skill type determined
|   [x] Clear 'When to Use' trigger defined
|   [x] At least 2 patterns planned
|   [x] Anti-patterns identified
|   [x] Token estimate under 1500 OR split plan defined
+-- GATE: [Inline decision]
    +-- pass: implementation
    +-- needs_revision: iterate (max 2)
    +-- Block message: [NOT SPECIFIED]

-------------------------------------------------------------------------------

PHASE 3: Skill Implementation
|
+-- Agent: SKILL-CREATOR
+-- Tasks: Create skill file, Add source links, Write examples, Add checklist
+-- Output: .claude/skills/{type}/{skill-name}.md, REGISTRY.yaml update
+-- Checkpoint:
|   [x] Skill file follows template structure
|   [x] Every pattern has source link
|   [x] Token count under 1500
|   [x] REGISTRY.yaml entry added (status: draft)
|   [x] 'When to Use' section is specific
|   [x] Anti-patterns section exists
|   [x] Verification checklist present
+-- GATE: [Inline decision]
    +-- pass: validation
    +-- token_exceeded: split_skill, return to implementation
    +-- Block message: "Skill exceeds 1500 tokens - splitting"

-------------------------------------------------------------------------------

PHASE 4: Skill Validation [SUB-PHASES]
|
+-- Sub-Phase 4.1: Source Check
|   +-- Agent: SKILL-VALIDATOR
|   +-- Tasks: Fetch URLs, Compare content, Verify tiers
|   +-- Checkpoint: URLs accessible, Content matches, No outdated refs
|
+-- Sub-Phase 4.2: Freshness Check
|   +-- Agent: SKILL-VALIDATOR
|   +-- Tasks: Check current version, Identify breaking changes
|   +-- Checkpoint: Version matches, No breaking changes, Patterns not deprecated
|
+-- Sub-Phase 4.3: Quality Check
|   +-- Agent: SKILL-VALIDATOR
|   +-- Tasks: Validate structure, Check tokens, Verify sections
|   +-- Checkpoint: Under 1500 tokens, Has required sections
|
+-- Output: docs/skills/validation/{skill-name}-validation-report.md
+-- Decision:
|   +-- VALID: integration
|   +-- MINOR_UPDATE: return to implementation
|   +-- MAJOR_UPDATE: return to research
|   +-- DEPRECATED: archive_skill
|   +-- INVALID: escalate to ORCHESTRATOR
+-- GATE: [Decision-based with multiple outcomes]
    +-- Block message: [IMPLICIT in decision messages]

-------------------------------------------------------------------------------

PHASE 5: Integration & Documentation
|
+-- Agent: TECH-WRITER
+-- Tasks: Update REGISTRY.yaml (active), Set review date, Create docs
+-- Output: REGISTRY.yaml (status: active), docs/skills/catalog/{skill-name}.md
+-- Checkpoint:
|   [x] REGISTRY.yaml updated with status: active
|   [x] next_review date set
|   [x] Skill documentation complete
|   [x] Skill accessible to agents
+-- GATE: [Inline decision]
    +-- pass: complete
    +-- fail: escalate_to_user
    +-- Block message: [NOT SPECIFIED]

-------------------------------------------------------------------------------

COMPLETION:
+-- Actions: Log creation, Notify agents, Update metrics dashboard
```

### ISSUES FOUND:

| Severity | Issue |
|----------|-------|
| MINOR | Most gates are inline decisions without explicit gate objects |
| MINOR | Block messages only for some gates |
| GOOD | Clear validation verdicts with defined actions |
| GOOD | Handoff definitions clearly specified |
| GOOD | Error recovery well-defined |


---

## Cross-Reference Analysis

### Workflow Interconnections

```
new-project.yaml
    |
    v
discovery-flow.yaml -----> planning-flow.yaml
    |                           |
    v                           v
migration-workflow.yaml    epic-workflow.yaml
                               |
                               v
                          story-delivery.yaml <---+
                               |                  |
                          [Implementation]        |
                               |                  |
                          +----+----+             |
                          |         |             |
                          v         v             |
                   feature-flow  bug-workflow ----+
                          |         |
                          v         v
                     ad-hoc-flow  quick-fix.yaml

sprint-workflow.yaml
    |
    +-- Coordinates: story-delivery.yaml, bug-workflow.yaml
    |
    v
skill-development-workflow.yaml (independent track)
```

### Gate Consistency Analysis

| Workflow | Gate Objects | Enforcers | Block Messages | Overall |
|----------|--------------|-----------|----------------|---------|
| epic-workflow | YES | YES (7/7) | NO | 70% |
| story-delivery | NO | NO | NO | 20% |
| feature-flow | NO | NO | NO | 15% |
| sprint-workflow | PARTIAL | NO | NO | 30% |
| bug-workflow | YES | NO | YES (summary) | 75% |
| ad-hoc-flow | YES | NO | YES (summary) | 60% |
| quick-fix | YES | YES (summary) | YES (summary) | 70% |
| migration-workflow | YES | NO | NO | 40% |
| planning-flow | NO | NO | NO | 20% |
| discovery-flow | YES | YES | NO | 65% |
| new-project | NO | NO | NO | 15% |
| skill-development | PARTIAL | NO | PARTIAL | 50% |

### Agents Missing in Flows

| Agent | Expected In | Actually In | Gap |
|-------|-------------|-------------|-----|
| ORCHESTRATOR | All workflows | Most workflows | Minor - implicit in some |
| DOC-AUDITOR | All workflows | Epic, Sprint, Migration, Discovery | Feature-flow missing |
| DEVOPS-AGENT | Epic, Sprint | Epic, Sprint, Migration | Good |
| UX-DESIGNER | UI workflows | Story, Feature, Epic, Discovery | Good |
| SECURITY-AGENT | Bug (complex) | Not defined | Major gap |


---

## Issue Summary

### Critical Issues (Must Fix)

1. **story-delivery.yaml**: No explicit gate objects, enforcers, or block messages
2. **feature-flow.yaml**: All gates implicit, no quality control mechanism
3. **new-project.yaml**: No gate infrastructure at all
4. **planning-flow.yaml**: Complex workflow with no explicit gates

### Major Issues (Should Fix)

1. **epic-workflow.yaml**: No block messages for any gate
2. **sprint-workflow.yaml**: Missing gate enforcers, no daily cycle gates
3. **migration-workflow.yaml**: No gate enforcers or block messages
4. **All workflows**: Inconsistent gate definition patterns

### Minor Issues (Fix When Possible)

1. **bug-workflow.yaml**: Block messages only in summary section
2. **ad-hoc-flow.yaml**: Block messages only in summary section
3. **quick-fix.yaml**: Assess phase has no explicit gate
4. **discovery-flow.yaml**: Block messages not defined despite good structure

### Patterns Found

1. **Good Pattern**: bug-workflow.yaml has most comprehensive gate structure
2. **Good Pattern**: discovery-flow.yaml uses typed gates (quality_gate, approval_gate)
3. **Anti-Pattern**: Many workflows use implicit checkpoints instead of explicit gates
4. **Anti-Pattern**: Block messages often defined in summary section, not inline


---

## Recommendations

### Immediate Actions

1. **Standardize Gate Format**: Create a consistent gate object structure:
   ```yaml
   gate:
     id: GATE_NAME
     type: quality_gate | approval_gate | test_gate | decision_gate
     enforcer: agent-name | role
     criteria:
       - "Specific criterion 1"
       - "Specific criterion 2"
     on_pass: next_phase
     on_fail: action_or_phase
     block_message: "Cannot proceed to X: [reason]"
   ```

2. **Add Explicit Enforcers**: Every gate must have an enforcer that validates it

3. **Add Block Messages**: Every gate must have a clear message for when it fails

4. **Audit story-delivery.yaml**: Most used workflow has weakest gate structure

### Medium-Term Actions

1. Create gate validation tooling that enforces consistent structure
2. Add gate execution logging for debugging
3. Create gate metrics dashboard

### Quality Score

Based on the audit criteria:

| Criterion | Weight | Score | Weighted |
|-----------|--------|-------|----------|
| Gate Presence | 25% | 55% | 13.75% |
| Enforcer Definition | 25% | 35% | 8.75% |
| Block Messages | 20% | 30% | 6.00% |
| Criteria Specificity | 15% | 70% | 10.50% |
| Error Recovery | 15% | 65% | 9.75% |

**Overall Quality Score: 48.75% (POOR)**

This audit reveals significant gaps in gate definition consistency across workflows. The bug-workflow.yaml should serve as the reference implementation for other workflows to follow.

---

*Audit completed: 2025-12-10*
*Next review recommended: After gate standardization effort*
