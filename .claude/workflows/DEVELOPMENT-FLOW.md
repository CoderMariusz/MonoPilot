# Development Flow - Quick Reference

## Overview

Quick reference for the TDD implementation loop (Phase 4 of Epic Workflow). Test-first development following RED-GREEN-REFACTOR cycle.

## TDD Cycle Diagram

```
DEVELOPMENT FLOW
       |
       v
+================+
| FOR EACH STORY |
+================+
       |
       v
+------------------+
| RED              |
| Write Tests      |
+------------------+
| TEST-ENGINEER    |
| - Failing tests  |
| - All AC covered |
+--------+---------+
         |
         v
    [Tests Fail?]
      YES |
         v
+------------------+
| GREEN            |
| Implement        |
+------------------+
| DEV AGENT        |
| - Minimal code   |
| - Pass tests     |
+--------+---------+
         |
         v
    [Tests Pass?]
      YES |
         v
+------------------+
| REFACTOR         |
| Clean Up         |
+------------------+
| DEV AGENT        |
| - Remove dupl.   |
| - Improve names  |
| - Keep tests green|
+--------+---------+
         |
         v
+------------------+
| QA VALIDATION    |
+------------------+
| QA-AGENT         |
| - Manual testing |
| - Edge cases     |
+--------+---------+
         |
         v
    [QA Pass?]
      YES |
         v
+------------------+
| CODE REVIEW      |
+------------------+
| CODE-REVIEWER    |
| - Standards      |
| - Security       |
+--------+---------+
         |
         v
   [Approved?]
      YES |
         v
+------------------+
| DOCUMENTATION    |
+------------------+
| TECH-WRITER      |
+--------+---------+
         |
         v
    STORY DONE
```

## Phase: RED (Test First)

### TEST-ENGINEER (Sonnet)
**Duration:** 15-30% of story time

**Inputs:**
- Story with acceptance criteria
- UX specs (if UI story)

**Activities:**
1. Analyze acceptance criteria (Given/When/Then)
2. Design test strategy (unit, integration, E2E)
3. Write failing tests for all AC
4. Verify tests fail with correct errors

**Test Categories:**
- **Unit Tests:** Individual components/functions
- **Integration Tests:** Component interactions
- **E2E Tests:** Complete user journeys

**Outputs:**
- Test files (all failing)
- Test coverage targets (min 80%)
- Test strategy document

### Checkpoint: Tests Ready
- [ ] Tests written for all acceptance criteria
- [ ] Tests fail with expected errors
- [ ] Coverage targets defined
- [ ] No tests pass yet

## Phase: GREEN (Implementation)

### DEV AGENT (Sonnet/Opus)
**Agent Selection:**
- BACKEND-DEV: API, database, business logic
- FRONTEND-DEV: UI components, user interactions
- SENIOR-DEV: Complex/architectural work

**Duration:** 50-60% of story time

**Activities:**
1. Read and understand failing tests
2. Implement MINIMAL code to pass tests
3. Run tests frequently
4. No extra features beyond test requirements
5. Continue until ALL tests pass

**Guidelines:**
```
DO:
- Follow test requirements exactly
- Use existing patterns
- Handle errors appropriately
- Write readable code

DON'T:
- Add features not covered by tests
- Over-engineer solutions
- Skip error handling
- Ignore performance
```

**Outputs:**
- Implementation code
- All tests passing

### Checkpoint: All Tests Pass
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Coverage threshold met (80%+)
- [ ] No skipped tests
- [ ] Build succeeds

## Phase: REFACTOR (Clean Up)

### DEV AGENT (Same as GREEN)
**Duration:** 15-25% of story time

**Activities:**
1. Review code quality
2. Remove code duplication (DRY principle)
3. Improve naming and readability
4. Extract reusable components
5. Optimize if needed
6. Run tests after EACH change
7. Keep all tests passing

**Refactoring Checklist:**
- [ ] No duplicated code
- [ ] Clear, descriptive names
- [ ] Functions do one thing
- [ ] No magic numbers/strings
- [ ] Appropriate error messages
- [ ] Follows project patterns
- [ ] No commented-out code

**Outputs:**
- Clean, refactored code
- All tests still passing

### Checkpoint: Code Clean
- [ ] No code duplication
- [ ] Clear naming conventions
- [ ] Follows project patterns
- [ ] All tests still pass
- [ ] No code smells

## Phase: QA Validation

### QA-AGENT (Sonnet)
**Duration:** 1-2 hours per story

**Activities:**
1. Execute full test suite
2. Manual testing of acceptance criteria
3. Exploratory testing (unexpected inputs)
4. Edge case validation
5. Cross-browser/device testing (if UI)
6. Document bugs if found

**Testing Scope:**
- Happy path scenarios
- Edge cases
- Boundary conditions
- Error conditions
- Performance
- Accessibility (if UI)

**Outputs:**
- QA report
- Bug tickets (if issues found)
- Pass/Fail decision

### Checkpoint: QA Passed
- [ ] All acceptance criteria validated
- [ ] No critical/high severity bugs
- [ ] Edge cases handled
- [ ] Performance acceptable
- [ ] Accessibility validated (if UI)

**If bugs found:** Route to BUG-WORKFLOW, then return to QA

## Phase: Code Review

### CODE-REVIEWER (Sonnet/Haiku)
**Duration:** 0.5-2 hours per story

**Review Checklist:**

**Correctness:**
- [ ] Logic matches requirements
- [ ] Edge cases handled
- [ ] Error handling present

**Quality:**
- [ ] Follows coding standards
- [ ] No code smells
- [ ] No security issues
- [ ] Performance acceptable

**Tests:**
- [ ] Tests are meaningful
- [ ] Coverage adequate
- [ ] Tests are maintainable

**Documentation:**
- [ ] Code is self-documenting
- [ ] Comments where needed
- [ ] API docs updated

**Decisions:**
- **APPROVED:** Continue to documentation
- **CHANGES REQUESTED:** Return to QA Validation after fixes

## Phase: Documentation

### TECH-WRITER (Sonnet)
**Duration:** 0.5-1 hour per story

**Activities:**
1. Review inline code comments
2. Update API documentation (if applicable)
3. Update user guides (if applicable)
4. Add changelog entry

**Documentation Standards:**
- Code comments explain "why" not "what"
- API docs include examples
- User docs are task-oriented
- Changelog follows conventional format

**Outputs:**
- Updated code comments
- Updated API docs
- Updated user docs
- Changelog entry

### Checkpoint: Docs Complete
- [ ] Code comments adequate
- [ ] API docs updated (if applicable)
- [ ] User docs updated (if applicable)
- [ ] Changelog entry added

## Agent Assignment by Story Type

| Story Type | Primary Agent | UX First? | Tests | Implementation |
|------------|---------------|-----------|-------|----------------|
| Backend API | BACKEND-DEV | No | Unit, Integration | Business logic, endpoints |
| Frontend UI | FRONTEND-DEV | Yes | Component, E2E | UI components, interactions |
| Full-stack | SENIOR-DEV | Maybe | All types | Complete feature |
| Complex/Arch | SENIOR-DEV (Opus) | Maybe | All types | Architectural changes |

## Error Recovery

### Tests Cannot Pass
1. Review test expectations
2. Clarify with TEST-ENGINEER
3. If AC unclear, escalate to PRODUCT-OWNER
4. Update AC and tests if needed
5. Resume implementation

### QA Finds Bugs
1. QA creates bug tickets with severity
2. Route to BUG-WORKFLOW
3. After fix, return to QA Validation
4. Re-validate all acceptance criteria

### Code Review Rejected
1. Review feedback carefully
2. Address "Must Fix" items first
3. Address "Should Fix" items
4. Return to QA Validation
5. Request re-review
6. Iterate until approved

## Parallel Work Opportunities

Multiple stories can run in parallel at different phases:

```
TIME    STORY A      STORY B      STORY C
----    --------     --------     --------
09:00   RED          -            -
10:00   GREEN        RED          -
11:00   GREEN        GREEN        RED
12:00   REFACTOR     GREEN        GREEN
13:00   QA           REFACTOR     GREEN
14:00   REVIEW       QA           REFACTOR
15:00   DONE         REVIEW       QA
```

## Metrics to Track

| Metric | When | Purpose |
|--------|------|---------|
| RED duration | Phase complete | Test writing efficiency |
| GREEN duration | Phase complete | Implementation speed |
| REFACTOR duration | Phase complete | Code quality effort |
| QA cycles | Each QA pass | Quality of implementation |
| Review cycles | Each review | Code quality |
| Bugs found | During QA | Test effectiveness |
| Total cycle time | Story done | Overall efficiency |

Update in `.claude/state/METRICS.md`
