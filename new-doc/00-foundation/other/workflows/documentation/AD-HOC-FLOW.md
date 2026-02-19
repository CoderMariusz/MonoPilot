# AD-HOC-FLOW (Quick Task Workflow)

> **Version:** 1.0
> **Definition:** @.claude/workflows/definitions/engineering/ad-hoc-flow.yaml
> **Updated:** 2025-12-10

---

## Overview

Workflow for tasks that are NOT part of formal Epics/Stories - direct user requests, quick fixes, refactoring, or small features. Unlike Story Workflow, AD-HOC-FLOW is triggered directly by user requests but maintains ALL quality gates. The key difference: no Epic/Story planning phase, but Testing and Review phases are MANDATORY.

## ASCII Flow Diagram

```
                              AD-HOC-FLOW
                                   |
                                   v
                    +-----------------------------+
                    |       TRIGGER CHECK         |
                    | - Direct user request       |
                    | - Bug fix (not from Epic)   |
                    | - Small feature request     |
                    | - Refactoring task          |
                    | - Quick improvement         |
                    +-------------+---------------+
                                  |
                                  v
+=========================================================================+
|                     PHASE 1: IMPLEMENTATION                              |
+=========================================================================+
|                                                                          |
|   +------------------------------------------------------------------+  |
|   | DEVELOPER AGENT (assigned based on task type)                     |  |
|   | - SENIOR-DEV: Complex/architectural work                          |  |
|   | - BACKEND-DEV: API, database, business logic                      |  |
|   | - FRONTEND-DEV: UI components, user interactions                  |  |
|   +------------------------------------------------------------------+  |
|   |                                                                   |  |
|   |  1. Analyze user request                                          |  |
|   |  2. Break down into implementation steps                          |  |
|   |  3. Implement solution                                            |  |
|   |  4. Self-verify basic functionality                               |  |
|   |                                                                   |  |
|   +------------------------------------------------------------------+  |
|                               |                                          |
|                               v                                          |
|   +------------------------------------------------------------------+  |
|   | GATE: CODE_COMPLETE                                               |  |
|   | [ ] Implementation matches user request                           |  |
|   | [ ] Code compiles/runs without errors                             |  |
|   | [ ] Basic self-testing done                                       |  |
|   | [ ] Ready for formal testing                                      |  |
|   +------------------------------------------------------------------+  |
|                               |                                          |
+=========================================================================+
                                |
                                v
+=========================================================================+
|                     PHASE 2: TESTING (MANDATORY)                         |
+=========================================================================+
|                                                                          |
|   +------------------------------------------------------------------+  |
|   | TEST-ENGINEER (Sonnet)                                            |  |
|   +------------------------------------------------------------------+  |
|   |                                                                   |  |
|   |  1. Review implemented changes                                    |  |
|   |  2. Write/update tests for new code                               |  |
|   |     - Unit tests for functions/components                         |  |
|   |     - Integration tests if needed                                 |  |
|   |  3. Run full test suite                                           |  |
|   |  4. Verify no regressions                                         |  |
|   |                                                                   |  |
|   +------------------------------------------------------------------+  |
|                               |                                          |
|                               v                                          |
|   +------------------------------------------------------------------+  |
|   | GATE: TESTS_PASS                                                  |  |
|   | [ ] New tests written for changes                                 |  |
|   | [ ] All new tests pass                                            |  |
|   | [ ] No regression in existing tests                               |  |
|   | [ ] Coverage maintained/improved                                  |  |
|   +------------------------------------------------------------------+  |
|                               |                                          |
|                          PASS | FAIL                                     |
|                               |    |                                     |
|                               v    +---> Return to Phase 1 for fixes     |
|                               |                                          |
+=========================================================================+
                                |
                                v
+=========================================================================+
|                     PHASE 3: REVIEW (MANDATORY)                          |
+=========================================================================+
|                                                                          |
|   +------------------------------------------------------------------+  |
|   | CODE-REVIEWER (Sonnet/Haiku based on complexity)                  |  |
|   +------------------------------------------------------------------+  |
|   |                                                                   |  |
|   |  Review Checklist:                                                |  |
|   |  [ ] Code follows project standards                               |  |
|   |  [ ] Patterns compliance (check @.claude/PATTERNS.md)             |  |
|   |  [ ] Security check - no vulnerabilities introduced               |  |
|   |  [ ] Error handling present                                       |  |
|   |  [ ] Tests are meaningful                                         |  |
|   |  [ ] No code smells                                               |  |
|   |                                                                   |  |
|   +------------------------------------------------------------------+  |
|                               |                                          |
|                               v                                          |
|   +------------------------------------------------------------------+  |
|   | GATE: REVIEW_APPROVED                                             |  |
|   | Decision: APPROVED / REQUEST_CHANGES                              |  |
|   +------------------------------------------------------------------+  |
|                               |                                          |
|              +----------------+----------------+                          |
|              |                                 |                          |
|          APPROVED                     REQUEST_CHANGES                     |
|              |                                 |                          |
|              v                                 v                          |
|              |                    +------------------------+              |
|              |                    | PHASE 4: FIX           |              |
|              |                    | (if changes needed)    |              |
|              |                    +------------------------+              |
|              |                    | Original Developer     |              |
|              |                    | - Address feedback     |              |
|              |                    | - Apply corrections    |              |
|              |                    +------------------------+              |
|              |                                 |                          |
|              |                                 v                          |
|              |                    Return to PHASE 2 (Testing)             |
|              |                                                            |
+=========================================================================+
                |
                v
+=========================================================================+
|                     PHASE 5: COMPLETION                                  |
+=========================================================================+
|                                                                          |
|   +------------------------------------------------------------------+  |
|   | ORCHESTRATOR (Opus 4.5)                                           |  |
|   +------------------------------------------------------------------+  |
|   |                                                                   |  |
|   |  1. Update TASK-QUEUE.md - mark task complete                     |  |
|   |  2. Update PROJECT-STATE.md if needed                             |  |
|   |  3. Log in METRICS.md                                             |  |
|   |  4. Inform user of completion                                     |  |
|   |  5. Recommend next action (if any)                                |  |
|   |                                                                   |  |
|   +------------------------------------------------------------------+  |
|                               |                                          |
|                               v                                          |
|   +------------------------------------------------------------------+  |
|   | GATE: USER_ACKNOWLEDGED                                           |  |
|   | [ ] User informed of completion                                   |  |
|   | [ ] Deliverables confirmed                                        |  |
|   | [ ] State files updated                                           |  |
|   +------------------------------------------------------------------+  |
|                               |                                          |
+=========================================================================+
                                |
                                v
                    +-----------------------------+
                    |        TASK DONE            |
                    | - All phases complete       |
                    | - Quality gates passed      |
                    | - User acknowledged         |
                    +-----------------------------+
```

## Complete Flow Loop Diagram

```
    USER REQUEST
         |
         v
+------------------+
| Phase 1:         |
| IMPLEMENTATION   |
| (Developer)      |
+--------+---------+
         |
         | CODE_COMPLETE
         v
+------------------+
| Phase 2:         |
| TESTING          |<------------------+
| (Test Engineer)  |                   |
+--------+---------+                   |
         |                             |
    TESTS_PASS?                        |
    YES  |  NO                         |
         |   |                         |
         |   +-----> Fix & retest -----+
         v
+------------------+
| Phase 3:         |
| REVIEW           |<------------------+
| (Code Reviewer)  |                   |
+--------+---------+                   |
         |                             |
   APPROVED?                           |
   YES  |  NO                          |
        |   |                          |
        |   v                          |
        |  +------------------+        |
        |  | Phase 4:         |        |
        |  | FIX              |        |
        |  | (Developer)      |--------+
        |  +------------------+
        v
+------------------+
| Phase 5:         |
| COMPLETION       |
| (Orchestrator)   |
+--------+---------+
         |
         | USER_ACKNOWLEDGED
         v
    TASK DONE
```

## Triggers

This workflow is triggered when:

| Trigger | Description | Example |
|---------|-------------|---------|
| Direct user request | User asks for specific change | "Add logging to auth module" |
| Bug fix (standalone) | Bug not part of active Epic | "Fix typo in error message" |
| Small feature | Feature too small for full Epic | "Add export button" |
| Refactoring | Code improvement without feature | "Refactor database queries" |
| Quick improvement | Enhancement request | "Improve error messages" |

**NOT triggered when:**
- Task is part of an Epic (use 3-STORY-DELIVERY)
- Task requires formal planning (use 1-EPIC-DELIVERY)
- Task is a complex bug (use BUG-WORKFLOW with COMPLEX path)

## Phase Details

### Phase 1: Implementation

**Agent:** SENIOR-DEV / BACKEND-DEV / FRONTEND-DEV (based on task type)
**Model:** Sonnet (Opus for complex tasks)
**Duration:** Variable based on task complexity

#### Agent Selection

| Task Type | Primary Agent | Model |
|-----------|---------------|-------|
| API / Database / Logic | BACKEND-DEV | Sonnet |
| UI / Components / Styles | FRONTEND-DEV | Sonnet |
| Complex / Architectural | SENIOR-DEV | Opus |
| Full-stack / Multiple areas | SENIOR-DEV | Opus |

#### Activities
1. Analyze user request thoroughly
2. Identify affected files and components
3. Plan implementation approach
4. Implement the solution
5. Run basic checks (compile, lint)
6. Self-verify functionality

#### Output
- Implemented code changes
- List of modified files
- Brief summary of what was done

#### Gate: CODE_COMPLETE
```markdown
## Gate: CODE_COMPLETE

- [ ] Implementation matches user request
- [ ] Code compiles/runs without errors
- [ ] Basic self-testing done
- [ ] Ready for formal testing

Status: PASS / FAIL
```

---

### Phase 2: Testing (MANDATORY)

**Agent:** TEST-ENGINEER
**Model:** Sonnet
**Duration:** 30min - 2 hours

**This phase is NOT optional. All ad-hoc changes MUST be tested.**

#### Activities
1. Review implemented changes
2. Identify test requirements
3. Write new tests for changes
4. Update existing tests if affected
5. Run full test suite
6. Document test results

#### Test Strategy for Ad-Hoc

```markdown
| Change Type | Required Tests |
|-------------|----------------|
| New function | Unit tests |
| API change | Integration tests |
| Bug fix | Regression test that reproduces bug |
| UI change | Component tests |
| Refactor | Existing tests must pass |
```

#### Output
- Test files (new or updated)
- Test execution report
- Coverage report

#### Gate: TESTS_PASS
```markdown
## Gate: TESTS_PASS

- [ ] New tests written for changes
- [ ] All new tests pass
- [ ] No regression in existing tests
- [ ] Coverage maintained (not decreased)
- [ ] All critical paths covered

Status: PASS / FAIL
```

**If FAIL:** Return to Phase 1 with specific issues to fix.

---

### Phase 3: Review (MANDATORY)

**Agent:** CODE-REVIEWER
**Model:** Sonnet (Haiku for simple changes)
**Duration:** 30min - 1 hour

**This phase is NOT optional. All ad-hoc changes MUST be reviewed.**

#### Review Checklist

```markdown
## Code Review Checklist

### Standards Compliance
- [ ] Follows coding standards
- [ ] Consistent naming conventions
- [ ] Proper file organization

### Pattern Compliance
- [ ] Uses established patterns (@.claude/PATTERNS.md)
- [ ] No anti-patterns introduced
- [ ] Consistent with codebase style

### Security Check
- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] No SQL injection risks
- [ ] No XSS vulnerabilities
- [ ] Auth/authz handled properly

### Quality Check
- [ ] Error handling present
- [ ] No code duplication
- [ ] Tests are meaningful
- [ ] No obvious bugs

### Decision
- APPROVED: Proceed to Phase 5
- REQUEST_CHANGES: Proceed to Phase 4
```

#### Output
- Review feedback document
- Decision: APPROVED or REQUEST_CHANGES

#### Gate: REVIEW_APPROVED
```markdown
## Gate: REVIEW_APPROVED

- [ ] All review items passed OR
- [ ] Changes requested with specific feedback

Decision: APPROVED / REQUEST_CHANGES
```

---

### Phase 4: Fix (Conditional)

**Agent:** Original Developer (same as Phase 1)
**Model:** Same as Phase 1
**Duration:** Variable based on feedback

**Triggered only when:** REVIEW_REQUESTED_CHANGES

#### Activities
1. Review feedback from CODE-REVIEWER
2. Address all "Must Fix" items
3. Address "Should Fix" items
4. Document changes made
5. Return to Phase 2

#### Output
- Updated code addressing feedback
- Summary of changes made

**After Phase 4:** Always return to Phase 2 (Testing) to ensure fixes don't break anything.

---

### Phase 5: Completion

**Agent:** ORCHESTRATOR
**Model:** Opus 4.5
**Duration:** 5-15 minutes

#### Activities
1. Verify all gates passed
2. Update state files:
   - `.claude/state/TASK-QUEUE.md` - mark complete
   - `PROJECT-STATE.md` - update if significant
   - `.claude/state/METRICS.md` - log completion
3. Prepare completion summary for user
4. Inform user of completion
5. Recommend next action (if queue has items)

#### Completion Report Template

```markdown
## AD-HOC Task Completed

**Task:** {task description}
**Duration:** {total time}
**Phases:**
- Implementation: {duration} - PASS
- Testing: {duration} - PASS
- Review: {duration} - APPROVED
- Fix cycles: {count}

**Files Changed:**
- {file1}
- {file2}

**Tests Added/Updated:**
- {test1}
- {test2}

**Quality Gates:**
- [x] CODE_COMPLETE
- [x] TESTS_PASS
- [x] REVIEW_APPROVED
- [x] USER_ACKNOWLEDGED

**Next Recommended Action:**
{recommendation or "None - queue empty"}
```

#### Gate: USER_ACKNOWLEDGED
```markdown
## Gate: USER_ACKNOWLEDGED

- [ ] User informed of completion
- [ ] Deliverables confirmed
- [ ] State files updated
- [ ] Next action communicated (if any)

Status: COMPLETE
```

---

## Quality Gates Summary

| Phase | Gate | Criteria | Blocker If Fail |
|-------|------|----------|-----------------|
| 1 | CODE_COMPLETE | Code implemented, runs, self-tested | Cannot proceed to testing |
| 2 | TESTS_PASS | Tests written and passing | Cannot proceed to review |
| 3 | REVIEW_APPROVED | Code reviewed, approved | Must fix and retest |
| 4 | N/A (conditional) | Fixes applied | Back to testing |
| 5 | USER_ACKNOWLEDGED | User informed | Task not complete |

## Error Recovery Paths

### Path 1: Implementation Issues
```
Phase 1 fails self-check
     |
     v
Developer fixes issues
     |
     v
Re-attempt Phase 1
```

### Path 2: Test Failures
```
Phase 2: Tests fail
     |
     v
Return to Phase 1 with specific failures
     |
     v
Developer fixes
     |
     v
Return to Phase 2
```

### Path 3: Review Rejection
```
Phase 3: REQUEST_CHANGES
     |
     v
Phase 4: Developer fixes
     |
     v
Return to Phase 2 (re-test)
     |
     v
Phase 3 again (re-review)
```

### Path 4: Multiple Cycles
```
If more than 3 review cycles:
     |
     v
Escalate to SENIOR-DEV
     |
     v
Pair review with original developer
     |
     v
Combined fix attempt
```

## Example Scenarios

### Scenario 1: Simple Bug Fix

```
User: "Fix the typo 'Loding...' in the spinner component"

Phase 1: FRONTEND-DEV
- Locates spinner.tsx
- Fixes typo: "Loding..." -> "Loading..."
- Gate: CODE_COMPLETE (PASS)

Phase 2: TEST-ENGINEER
- Verifies existing tests pass
- Adds snapshot test for spinner text
- Gate: TESTS_PASS (PASS)

Phase 3: CODE-REVIEWER (Haiku)
- Quick review: typo fixed, no issues
- Gate: REVIEW_APPROVED (APPROVED)

Phase 5: ORCHESTRATOR
- Updates state files
- Informs user: "Typo fixed in spinner component"
- Gate: USER_ACKNOWLEDGED (COMPLETE)

Total time: ~20 minutes
```

### Scenario 2: Add Feature with Review Cycle

```
User: "Add a 'Copy to clipboard' button on the API key display"

Phase 1: FRONTEND-DEV
- Creates CopyButton component
- Integrates with API key display
- Gate: CODE_COMPLETE (PASS)

Phase 2: TEST-ENGINEER
- Writes component tests for CopyButton
- Writes integration test for copy functionality
- Gate: TESTS_PASS (PASS)

Phase 3: CODE-REVIEWER
- Reviews code
- Issue: "Missing error handling for clipboard API"
- Gate: REVIEW_APPROVED (REQUEST_CHANGES)

Phase 4: FRONTEND-DEV
- Adds try/catch and fallback
- Adds error toast on failure

Phase 2 (again): TEST-ENGINEER
- Adds test for error case
- All tests pass
- Gate: TESTS_PASS (PASS)

Phase 3 (again): CODE-REVIEWER
- Reviews fixes
- Gate: REVIEW_APPROVED (APPROVED)

Phase 5: ORCHESTRATOR
- Updates state files
- Informs user with summary
- Gate: USER_ACKNOWLEDGED (COMPLETE)

Total time: ~2 hours
```

### Scenario 3: Refactoring Task

```
User: "Refactor the database queries in user service to use prepared statements"

Phase 1: BACKEND-DEV
- Identifies all raw queries in user-service.ts
- Converts to prepared statements
- Gate: CODE_COMPLETE (PASS)

Phase 2: TEST-ENGINEER
- Runs existing tests (all must pass)
- Adds SQL injection test cases
- Gate: TESTS_PASS (PASS)

Phase 3: CODE-REVIEWER
- Security review: prepared statements correct
- No SQL injection possible
- Gate: REVIEW_APPROVED (APPROVED)

Phase 5: ORCHESTRATOR
- Updates state files
- Informs user with security improvement note
- Gate: USER_ACKNOWLEDGED (COMPLETE)

Total time: ~1.5 hours
```

## Metrics Tracking

Track for each ad-hoc task:

| Metric | Description | Update When |
|--------|-------------|-------------|
| Task type | bug/feature/refactor | Task start |
| Implementation duration | Phase 1 time | Phase 1 complete |
| Testing duration | Phase 2 time | Phase 2 complete |
| Review duration | Phase 3 time | Phase 3 complete |
| Fix cycles | Number of Phase 4 loops | Each loop |
| Total duration | Start to USER_ACKNOWLEDGED | Task complete |

Update in `.claude/state/METRICS.md`

## Integration with Other Workflows

| Scenario | Integration |
|----------|-------------|
| Ad-hoc reveals complex issue | Escalate to 3-STORY-DELIVERY or BUG-WORKFLOW |
| Ad-hoc part of larger feature | Convert to Epic, use 1-EPIC-DELIVERY |
| Ad-hoc requires architecture change | ARCHITECT-AGENT review first |
| Multiple related ad-hocs | Consider creating Epic |

## Key Differences from 3-STORY-DELIVERY

| Aspect | AD-HOC-FLOW | 3-STORY-DELIVERY |
|--------|-------------|----------------|
| Trigger | Direct user request | From Epic/Sprint |
| Planning | None | Full planning phase |
| UX Design | Optional/minimal | Required for UI |
| Testing | MANDATORY | MANDATORY (TDD) |
| Review | MANDATORY | MANDATORY |
| Documentation | Minimal | Full |
| Estimation | None | Required |
| Acceptance Criteria | Implicit (user request) | Explicit (Given/When/Then) |

## CRITICAL: What Orchestrator Must NOT Do

```
NEVER skip phases. All phases are MANDATORY:

BAD (old behavior):
User request -> Developer implements -> DONE

GOOD (correct behavior):
User request -> Developer implements -> Test Engineer tests ->
Code Reviewer reviews -> (Fix if needed) -> Orchestrator completes
```

## Orchestrator Integration

When ORCHESTRATOR receives an ad-hoc request:

1. **Identify as AD-HOC** (not part of Epic/Story)
2. **Assign to appropriate Developer** (Phase 1)
3. **After CODE_COMPLETE:** Assign to TEST-ENGINEER (Phase 2)
4. **After TESTS_PASS:** Assign to CODE-REVIEWER (Phase 3)
5. **If REQUEST_CHANGES:** Assign back to Developer (Phase 4)
6. **After REVIEW_APPROVED:** Execute Phase 5 (Completion)
7. **NEVER mark complete after Phase 1 only**

---

**AD-HOC-FLOW Version:** 1.0
**Created:** 2025-12-06
**Maintained by:** Agent Methodology Pack

