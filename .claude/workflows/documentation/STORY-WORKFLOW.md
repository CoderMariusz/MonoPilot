# Story Workflow

> **Version:** 1.0
> **Definition:** @.claude/workflows/definitions/engineering/story-delivery.yaml
> **Updated:** 2025-12-10

---

## Overview

TDD-based story implementation workflow following the RED-GREEN-REFACTOR cycle. This workflow ensures code quality through test-first development, continuous validation, and comprehensive review.

## Phase Requirements Legend

| Marker | Meaning |
|--------|---------|
| `[MANDATORY]` | Cannot be skipped - phase MUST be completed |
| `[OPTIONAL]` | Can be skipped with documented reason |
| `[USER-CHOICE]` | User decides between provided options |

**IMPORTANT:** All phases in Story Workflow are `[MANDATORY]` by default except Phase 1 (UX Design) which is optional for non-UI stories.

## ASCII Flow Diagram

```
                                STORY WORKFLOW
                                      |
                                      v
                         +------------------------+
                         |   STORY READY CHECK    |
                         | - Acceptance criteria  |
                         | - Dependencies clear   |
                         | - Estimate provided    |
                         +-----------+------------+
                                     |
                           READY?    |
                      +------+-------+-------+
                      |                      |
                     YES                     NO
                      |                      |
                      v                      v
                      |              Return to SCRUM-MASTER
                      |              for refinement
                      |
            +---------+---------+
            |  HAS UI COMPONENT |
            +----+--------+-----+
                 |        |
                YES       NO
                 |        |
                 v        |
+================================+    |
| PHASE 1: UX DESIGN             |    |
+================================+    |
|                                |    |
| +----------------------------+ |    |
| | UX-DESIGNER (Sonnet)       | |    |
| +----------------------------+ |    |
| | - Component mockups        | |    |
| | - Interaction specs        | |    |
| | - Responsive behavior      | |    |
| | - Accessibility notes      | |    |
| +----------------------------+ |    |
|              |                 |    |
|              v                 |    |
| +----------------------------+ |    |
| | CHECKPOINT: UX Ready       | |    |
| | [ ] Mockups complete       | |    |
| | [ ] States defined         | |    |
| | [ ] Dev can implement      | |    |
| +----------------------------+ |    |
|              |                 |    |
+================================+    |
                 |                    |
                 +--------+-----------+
                          |
                          v
+==================================================================+
|                    PHASE 2: RED (Test First)                     |
+==================================================================+
|                                                                  |
|   +----------------------------------------------------------+  |
|   | TEST-ENGINEER (Sonnet)                                    |  |
|   +----------------------------------------------------------+  |
|   |                                                           |  |
|   |  1. Analyze acceptance criteria                           |  |
|   |  2. Design test strategy                                  |  |
|   |     - Unit tests for components                           |  |
|   |     - Integration tests for flows                         |  |
|   |     - E2E tests for user journeys                         |  |
|   |  3. Write failing tests                                   |  |
|   |  4. Verify tests fail for right reasons                   |  |
|   |                                                           |  |
|   +----------------------------------------------------------+  |
|                            |                                     |
|                            v                                     |
|   +----------------------------------------------------------+  |
|   | CHECKPOINT: Tests Ready                                   |  |
|   | [ ] Tests written for all acceptance criteria             |  |
|   | [ ] Tests fail with expected errors                       |  |
|   | [ ] Test coverage targets defined                         |  |
|   | [ ] No tests pass yet (nothing implemented)               |  |
|   +----------------------------------------------------------+  |
|                            |                                     |
+==================================================================+
                             |
                             v
+==================================================================+
|                   PHASE 3: GREEN (Implementation)                |
+==================================================================+
|                                                                  |
|   +----------------------------------------------------------+  |
|   | DEV AGENT (Sonnet/Opus)                                   |  |
|   | BACKEND-DEV | FRONTEND-DEV | SENIOR-DEV                   |  |
|   +----------------------------------------------------------+  |
|   |                                                           |  |
|   |  1. Read failing tests                                    |  |
|   |  2. Implement MINIMAL code to pass                        |  |
|   |  3. Run tests frequently                                  |  |
|   |  4. No extra features beyond tests                        |  |
|   |  5. Continue until all tests pass                         |  |
|   |                                                           |  |
|   +----------------------------------------------------------+  |
|                            |                                     |
|                            v                                     |
|   +----------------------------------------------------------+  |
|   | CHECKPOINT: All Tests Pass                                |  |
|   | [ ] All unit tests pass                                   |  |
|   | [ ] All integration tests pass                            |  |
|   | [ ] Coverage threshold met                                |  |
|   | [ ] No skipped/pending tests                              |  |
|   +----------------------------------------------------------+  |
|                            |                                     |
|                       PASS | FAIL                                |
|                            |   |                                 |
|                            v   +---> Continue implementing       |
|                            |                                     |
+==================================================================+
                             |
                             v
+==================================================================+
|                   PHASE 4: REFACTOR (Clean Up)                   |
+==================================================================+
|                                                                  |
|   +----------------------------------------------------------+  |
|   | DEV AGENT (Sonnet)                                        |  |
|   +----------------------------------------------------------+  |
|   |                                                           |  |
|   |  1. Review implementation                                 |  |
|   |  2. Remove code duplication (DRY)                         |  |
|   |  3. Improve naming and readability                        |  |
|   |  4. Extract reusable components                           |  |
|   |  5. Optimize where needed                                 |  |
|   |  6. Run tests after each change                           |  |
|   |  7. KEEP ALL TESTS PASSING                                |  |
|   |                                                           |  |
|   +----------------------------------------------------------+  |
|                            |                                     |
|                            v                                     |
|   +----------------------------------------------------------+  |
|   | CHECKPOINT: Code Clean                                    |  |
|   | [ ] No code duplication                                   |  |
|   | [ ] Clear naming conventions                              |  |
|   | [ ] Follows project patterns                              |  |
|   | [ ] All tests still pass                                  |  |
|   | [ ] No code smells                                        |  |
|   +----------------------------------------------------------+  |
|                            |                                     |
+==================================================================+
                             |
                             v
+==================================================================+
|                   PHASE 5: QA VALIDATION                         |
+==================================================================+
|                                                                  |
|   +----------------------------------------------------------+  |
|   | QA-AGENT (Sonnet)                                         |  |
|   +----------------------------------------------------------+  |
|   |                                                           |  |
|   |  1. Execute full test suite                               |  |
|   |  2. Manual testing of acceptance criteria                 |  |
|   |  3. Exploratory testing                                   |  |
|   |  4. Edge case validation                                  |  |
|   |  5. Cross-browser/device testing (if UI)                  |  |
|   |  6. Document any bugs found                               |  |
|   |                                                           |  |
|   +----------------------------------------------------------+  |
|                            |                                     |
|                            v                                     |
|   +----------------------------------------------------------+  |
|   | CHECKPOINT: QA Passed                                     |  |
|   | [ ] All acceptance criteria validated                     |  |
|   | [ ] No critical/high bugs                                 |  |
|   | [ ] Edge cases handled                                    |  |
|   | [ ] Performance acceptable                                |  |
|   +----------------------------------------------------------+  |
|                            |                                     |
|                      PASS  |  BUGS FOUND                         |
|                            |      |                              |
|                            v      +---> BUG-WORKFLOW             |
|                            |           then return               |
|                            |                                     |
+==================================================================+
                             |
                             v
+==================================================================+
|                   PHASE 6: CODE REVIEW                           |
+==================================================================+
|                                                                  |
|   +----------------------------------------------------------+  |
|   | CODE-REVIEWER (Sonnet/Haiku)                              |  |
|   +----------------------------------------------------------+  |
|   |                                                           |  |
|   |  Review Checklist:                                        |  |
|   |  [ ] Code follows standards                               |  |
|   |  [ ] Logic is correct                                     |  |
|   |  [ ] Error handling present                               |  |
|   |  [ ] Security considered                                  |  |
|   |  [ ] Performance acceptable                               |  |
|   |  [ ] Tests are meaningful                                 |  |
|   |  [ ] Documentation present                                |  |
|   |  [ ] No code smells                                       |  |
|   |                                                           |  |
|   +----------------------------------------------------------+  |
|                            |                                     |
|                            v                                     |
|              +-------------+-------------+                       |
|              |                           |                       |
|          APPROVED              CHANGES REQUESTED                 |
|              |                           |                       |
|              v                           v                       |
|              |                 +-----------------+                |
|              |                 | DEV addresses   |                |
|              |                 | feedback        |                |
|              |                 +--------+--------+                |
|              |                          |                        |
|              |                          v                        |
|              |                 Return to QA VALIDATION           |
|              |                                                   |
+==================================================================+
                             |
                             v
+==================================================================+
|                   PHASE 7: DOCUMENTATION                         |
+==================================================================+
|                                                                  |
|   +----------------------------------------------------------+  |
|   | TECH-WRITER (Sonnet)                                      |  |
|   +----------------------------------------------------------+  |
|   |                                                           |  |
|   |  1. Update inline code documentation                      |  |
|   |  2. Update API docs (if applicable)                       |  |
|   |  3. Update user guide (if applicable)                     |  |
|   |  4. Add to changelog                                      |  |
|   |                                                           |  |
|   +----------------------------------------------------------+  |
|                            |                                     |
|                            v                                     |
|   +----------------------------------------------------------+  |
|   | CHECKPOINT: Docs Complete                                 |  |
|   | [ ] Code comments adequate                                |  |
|   | [ ] API docs updated                                      |  |
|   | [ ] User-facing docs updated                              |  |
|   +----------------------------------------------------------+  |
|                            |                                     |
+==================================================================+
                             |
                             v
                  +----------+-----------+
                  |     STORY DONE       |
                  | - Update status      |
                  | - Record metrics     |
                  | - Notify SM          |
                  +----------------------+
```

## Detailed Steps

---

### Pre-Workflow: Story Ready Check [MANDATORY]

#### Why This Check Matters
| Aspect | Description |
|--------|-------------|
| **What it delivers** | Validated story ready for implementation |
| **If skipped** | Unclear requirements, blocked development, wasted effort |
| **Problems prevented** | Mid-sprint confusion, scope creep, incomplete features |

Before starting the workflow, verify the story is ready:

```markdown
## Story Ready Checklist

- [ ] Story has clear description
- [ ] Acceptance criteria defined (Given/When/Then)
- [ ] Complexity estimated (S/M/L)
- [ ] Type identified (Backend/Frontend/Full-stack)
- [ ] Dependencies resolved or not blocking
- [ ] UX specs available (if UI story)
- [ ] Technical notes from Architect reviewed
```

**If not ready:** Return to SCRUM-MASTER for refinement

### Pre-Workflow Completion Checklist
- [ ] Story Ready Checklist all items verified
- [ ] Story type determined (UI/Backend/Full-stack)
- [ ] Handoff to Phase 1 or Phase 2 confirmed

---

### Phase 1: UX Design (UI Stories Only) [OPTIONAL]

#### Why This Phase Matters
| Aspect | Description |
|--------|-------------|
| **What it delivers** | Detailed component mockups, interaction specs, accessibility requirements |
| **If skipped (when required)** | Inconsistent UI, poor user experience, accessibility issues |
| **Problems prevented** | Design-implementation mismatch, rework, UX debt |

**Skip Condition:** This phase is automatically skipped for backend-only stories. For UI stories, this phase is MANDATORY.

**Agent:** UX-DESIGNER
**Model:** Sonnet
**Duration:** 1-4 hours depending on complexity

#### Activities
1. Create detailed component mockups
2. Define all states (default, hover, active, disabled, error, loading)
3. Specify responsive behavior
4. Document accessibility requirements
5. Provide interaction specifications

#### Outputs
- Component mockups
- State specifications
- Interaction notes
- Accessibility checklist

#### Checkpoint: UX Ready
- [ ] All component states designed
- [ ] Responsive breakpoints defined
- [ ] Accessibility requirements documented
- [ ] Developer can implement from specs

### Phase 1 Completion Checklist
- [ ] Component mockups created
- [ ] All states defined (default, hover, active, disabled, error, loading)
- [ ] Responsive behavior documented
- [ ] Accessibility checklist complete
- [ ] Handoff to Phase 2 confirmed

---

### Phase 2: RED (Test First) [MANDATORY]

#### Why This Phase Matters
| Aspect | Description |
|--------|-------------|
| **What it delivers** | Comprehensive test suite that defines expected behavior |
| **If skipped** | No test coverage, untested code, bugs reach production |
| **Problems prevented** | Regression bugs, undefined behavior, brittle code |

**Agent:** TEST-ENGINEER
**Model:** Sonnet
**Duration:** 15-30% of estimated story time

#### Activities
1. **Analyze Acceptance Criteria**
   - Parse Given/When/Then statements
   - Identify test scenarios
   - Map to test types (unit, integration, E2E)

2. **Design Test Strategy**
   ```markdown
   | Acceptance Criteria | Test Type | Priority |
   |---------------------|-----------|----------|
   | Given X, When Y, Then Z | Unit | High |
   | User can complete flow | E2E | Critical |
   ```

3. **Write Failing Tests**
   - Unit tests for individual components/functions
   - Integration tests for component interactions
   - E2E tests for user journeys

4. **Verify Failures**
   - Tests should fail with clear error messages
   - Failures should indicate what is missing
   - No false positives

#### Test Categories by Story Type

| Story Type | Unit Tests | Integration | E2E |
|------------|------------|-------------|-----|
| Backend | Business logic, validators | API endpoints | Critical paths |
| Frontend | Components, hooks | User interactions | User flows |
| Full-stack | Both | Full flow | Complete journey |

#### Outputs
- Test files (all failing)
- Test coverage targets
- Test strategy documentation

#### Checkpoint: Tests Ready
- [ ] Tests written for all acceptance criteria
- [ ] Tests fail with expected errors
- [ ] Coverage targets defined (min 80% for new code)
- [ ] No tests pass yet

#### User Choice Point: Test Coverage Level
**Options:**
1. **Standard Coverage (80%)** - Unit + Integration tests for new code
2. **High Coverage (90%)** - Additional edge case and boundary tests
3. **Critical Coverage (95%)** - Exhaustive testing for critical paths

**Default:** Standard Coverage (80%)
**Decision Required:** No - Standard recommended, user may increase for critical features

### Phase 2 Completion Checklist
- [ ] Tests written for all acceptance criteria
- [ ] All tests fail correctly (expected errors)
- [ ] Test coverage targets defined
- [ ] Test strategy documented
- [ ] Handoff to Phase 3 confirmed

---

### Phase 3: GREEN (Implementation) [MANDATORY]

#### Why This Phase Matters
| Aspect | Description |
|--------|-------------|
| **What it delivers** | Working implementation that passes all tests |
| **If skipped** | No code, no product |
| **Problems prevented** | Over-engineering, gold-plating, untested features |

**Agent:** BACKEND-DEV, FRONTEND-DEV, or SENIOR-DEV
**Model:** Sonnet (Opus for complex stories)
**Duration:** 50-60% of estimated story time

#### Activities
1. **Read Failing Tests**
   - Understand what needs to be implemented
   - Tests are the specification

2. **Implement Minimally**
   - Write only enough code to pass tests
   - No gold-plating or extra features
   - Follow existing patterns

3. **Run Tests Frequently**
   - After each significant change
   - Fix one test at a time

4. **Achieve Green**
   - All tests must pass
   - No skipped tests allowed

#### Implementation Guidelines
```markdown
DO:
- Follow test requirements exactly
- Use existing patterns and utilities
- Handle errors appropriately
- Write readable code

DON'T:
- Add features not covered by tests
- Over-engineer the solution
- Skip error handling
- Ignore performance implications
```

#### Outputs
- Implementation code
- All tests passing

#### Checkpoint: All Tests Pass
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Coverage threshold met (80%+)
- [ ] No skipped or pending tests
- [ ] Build succeeds

#### User Choice Point: Developer Assignment
**Options:**
1. **BACKEND-DEV** - For backend/API work
2. **FRONTEND-DEV** - For UI/frontend work
3. **SENIOR-DEV** - For complex or full-stack work

**Default:** Based on story type
**Decision Required:** No - Orchestrator assigns based on story type

### Phase 3 Completion Checklist
- [ ] All tests pass
- [ ] Coverage threshold met
- [ ] Build succeeds
- [ ] No skipped tests
- [ ] Handoff to Phase 4 confirmed

---

### Phase 4: REFACTOR (Clean Up) [MANDATORY]

#### Why This Phase Matters
| Aspect | Description |
|--------|-------------|
| **What it delivers** | Clean, maintainable, DRY code |
| **If skipped** | Technical debt accumulates, code becomes unmaintainable |
| **Problems prevented** | Code rot, duplication, complex maintenance |

**Agent:** Same DEV as GREEN phase
**Model:** Sonnet
**Duration:** 15-25% of estimated story time

#### Activities
1. **Review Code Quality**
   - Check for duplication
   - Review naming
   - Assess structure

2. **Apply Refactoring**
   - Extract common code
   - Improve naming
   - Simplify complex logic
   - Remove dead code

3. **Verify Tests**
   - Run after each change
   - All tests must stay green

4. **Optimize if Needed**
   - Only for measurable issues
   - Profile before optimizing

#### Refactoring Checklist
```markdown
- [ ] No duplicated code (DRY)
- [ ] Clear, descriptive names
- [ ] Functions do one thing
- [ ] No magic numbers/strings
- [ ] Appropriate error messages
- [ ] Follows project patterns
- [ ] No commented-out code
```

#### Outputs
- Clean, refactored code
- All tests still passing

#### Checkpoint: Code Clean
- [ ] No code duplication
- [ ] Clear naming conventions
- [ ] Follows project patterns
- [ ] All tests still pass
- [ ] No code smells detected

### Phase 4 Completion Checklist
- [ ] Code refactored and clean
- [ ] No duplication (DRY)
- [ ] Clear naming throughout
- [ ] All tests still pass
- [ ] Handoff to Phase 5 confirmed

---

### Phase 5: QA Validation [MANDATORY]

#### Why This Phase Matters
| Aspect | Description |
|--------|-------------|
| **What it delivers** | Validated functionality, confirmed acceptance criteria |
| **If skipped** | Untested edge cases, missed requirements, poor quality |
| **Problems prevented** | Production bugs, user complaints, rework |

**Agent:** QA-AGENT
**Model:** Sonnet
**Duration:** 1-2 hours per story

#### Activities
1. **Execute Test Suite**
   - Run full test suite
   - Verify no regressions

2. **Manual Testing**
   - Verify each acceptance criterion
   - Test happy path and edge cases

3. **Exploratory Testing**
   - Try unexpected inputs
   - Test boundary conditions
   - Look for edge cases

4. **Cross-Platform Testing** (if UI)
   - Different browsers
   - Different devices
   - Accessibility testing

5. **Document Issues**
   - Create bug reports for any issues
   - Categorize by severity

#### QA Report Template
```markdown
## QA Report: Story {ID}

### Test Execution
- Unit Tests: PASS/FAIL
- Integration Tests: PASS/FAIL
- E2E Tests: PASS/FAIL

### Manual Testing
| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1 | PASS | - |
| AC-2 | PASS | Edge case noted |

### Issues Found
| ID | Severity | Description |
|----|----------|-------------|
| BUG-XXX | Medium | Description |

### Recommendation
APPROVE / NEEDS FIXES
```

#### Outputs
- QA report
- Bug tickets (if issues found)
- Approval or rejection

#### Checkpoint: QA Passed
- [ ] All acceptance criteria validated
- [ ] No critical or high severity bugs
- [ ] Edge cases handled properly
- [ ] Performance acceptable
- [ ] Accessibility validated (if UI)

**If bugs found:** Route to BUG-WORKFLOW, then return to QA

### Phase 5 Completion Checklist
- [ ] Full test suite executed
- [ ] Manual testing complete
- [ ] All acceptance criteria validated
- [ ] No critical/high bugs
- [ ] QA report generated
- [ ] Handoff to Phase 6 confirmed

---

### Phase 6: Code Review [MANDATORY]

#### Why This Phase Matters
| Aspect | Description |
|--------|-------------|
| **What it delivers** | Reviewed, approved code meeting standards |
| **If skipped** | Knowledge silos, inconsistent code, security vulnerabilities |
| **Problems prevented** | Bad patterns spreading, security issues, maintainability problems |

**Agent:** CODE-REVIEWER
**Model:** Sonnet (Haiku for simple stories)
**Duration:** 0.5-2 hours per story

#### Review Checklist
```markdown
## Code Review Checklist

### Correctness
- [ ] Logic matches requirements
- [ ] Edge cases handled
- [ ] Error handling present

### Quality
- [ ] Follows coding standards
- [ ] No code smells
- [ ] No security issues
- [ ] Performance acceptable

### Tests
- [ ] Tests are meaningful
- [ ] Coverage adequate
- [ ] Tests are maintainable

### Documentation
- [ ] Code is self-documenting
- [ ] Comments where needed
- [ ] API docs updated
```

#### Review Feedback Format
```markdown
## Code Review: Story {ID}

### Summary
{Overall assessment}

### Must Fix (Blocking)
- {Critical issue}

### Should Fix (Non-blocking)
- {Improvement}

### Consider (Suggestion)
- {Nice to have}

### Decision: APPROVED / CHANGES REQUESTED
```

#### Outputs
- Review feedback
- Approval or change requests

#### Error Recovery: Changes Requested
1. DEV receives feedback
2. DEV addresses "Must Fix" items
3. DEV addresses "Should Fix" items
4. Return to Phase 5 (QA Validation)
5. Re-review focused on changes

### Phase 6 Completion Checklist
- [ ] Code review completed
- [ ] All "Must Fix" items addressed
- [ ] All "Should Fix" items addressed
- [ ] Review APPROVED
- [ ] Handoff to Phase 7 confirmed

---

### Phase 7: Documentation [MANDATORY]

#### Why This Phase Matters
| Aspect | Description |
|--------|-------------|
| **What it delivers** | Updated documentation, changelog entry |
| **If skipped** | Outdated docs, knowledge gaps, onboarding difficulties |
| **Problems prevented** | Support overhead, developer confusion, tribal knowledge |

**Agent:** TECH-WRITER
**Model:** Sonnet
**Duration:** 0.5-1 hour per story

#### Activities
1. **Code Documentation**
   - Review inline comments
   - Add JSDoc/docstrings where needed

2. **API Documentation** (if applicable)
   - Update endpoint documentation
   - Add request/response examples
   - Document error responses

3. **User Documentation** (if applicable)
   - Update user guides
   - Add screenshots if UI changed
   - Document new features

4. **Changelog**
   - Add entry to changelog
   - Follow conventional commit format

#### Documentation Standards
```markdown
### Code Comments
- Explain "why" not "what"
- Document complex algorithms
- Note non-obvious behavior

### API Docs
- Clear endpoint descriptions
- All parameters documented
- Example requests/responses

### User Docs
- Task-oriented structure
- Include screenshots
- Update navigation
```

#### Outputs
- Updated code comments
- Updated API docs
- Updated user docs
- Changelog entry

#### Checkpoint: Docs Complete
- [ ] Code comments adequate
- [ ] API docs updated (if applicable)
- [ ] User docs updated (if applicable)
- [ ] Changelog entry added

#### User Choice Point: Documentation Scope
**Options:**
1. **Full Documentation** - Code comments, API docs, user docs, changelog
2. **Essential Documentation** - Code comments and changelog only
3. **API Focus** - Code comments and API documentation only

**Default:** Full Documentation for user-facing features, API Focus for backend
**Decision Required:** No - Default recommended

### Phase 7 Completion Checklist
- [ ] Code comments adequate
- [ ] API docs updated (if applicable)
- [ ] User docs updated (if applicable)
- [ ] Changelog entry added
- [ ] Story marked as DONE
- [ ] Metrics recorded
- [ ] Scrum Master notified

---

## Quality Gates Summary

| Phase | Gate | Criteria | Status |
|-------|------|----------|--------|
| Pre | Story Ready | Clear AC, estimated, dependencies resolved | [MANDATORY] |
| 1 | UX Ready | All states, responsive, accessible | [OPTIONAL - UI only] |
| 2 | Tests Ready | All AC covered, tests fail correctly | [MANDATORY] |
| 3 | Tests Pass | All green, coverage met | [MANDATORY] |
| 4 | Code Clean | No smells, patterns followed | [MANDATORY] |
| 5 | QA Passed | AC validated, no critical bugs | [MANDATORY] |
| 6 | Review Approved | Standards met, secure | [MANDATORY] |
| 7 | Docs Complete | All docs updated | [MANDATORY] |

### Gate Enforcement Rules

**CRITICAL:** All MANDATORY gates MUST PASS before proceeding to next phase. No agent can skip gates autonomously.

**Skip Protocol (for all gates):**
1. User must explicitly request skip
2. User must provide documented reason
3. User must acknowledge specific risks
4. Skip must be logged in GATE-OVERRIDES.md

## Error Recovery Paths

```
                    ERROR RECOVERY FLOW
                           |
           +---------------+---------------+
           |               |               |
     Tests Fail      QA Bugs Found    Review Rejected
           |               |               |
           v               v               v
     +----------+    +-----------+   +------------+
     | Analyze  |    | Create    |   | Address    |
     | failures |    | bug tix   |   | feedback   |
     +----+-----+    +-----+-----+   +-----+------+
          |                |               |
          v                v               v
     +----------+    +-----------+   +------------+
     | Fix      |    | Fix via   |   | Return to  |
     | and      |    | BUG       |   | QA phase   |
     | re-run   |    | WORKFLOW  |   |            |
     +----+-----+    +-----+-----+   +------------+
          |                |
          v                v
     Continue       Return to QA
     to REFACTOR    Validation
```

### Error: Tests Cannot Pass
1. Review test expectations
2. Clarify with TEST-ENGINEER
3. If AC unclear, escalate to PRODUCT-OWNER
4. Update AC if needed
5. Update tests
6. Resume implementation

### Error: QA Finds Bugs
1. QA creates bug tickets with severity
2. Route to BUG-WORKFLOW
3. After fix, return to QA Validation
4. Re-validate all acceptance criteria

### Error: Code Review Rejected
1. Review feedback carefully
2. Address "Must Fix" items first
3. Address "Should Fix" items
4. Return to QA Validation
5. Request re-review
6. Iterate until approved

### Error: Documentation Incomplete
1. Identify missing documentation
2. TECH-WRITER completes
3. Verify with reviewer
4. Complete story

## Example Scenarios

### Scenario 1: Backend API Story
```
Story: "As a user, I can retrieve my profile via API"

Phase 1: UX Design
- SKIP (no UI)

Phase 2: RED
- TEST-ENGINEER writes:
  - Unit tests for profile service
  - Integration tests for /api/profile endpoint
  - Tests for auth, validation, errors

Phase 3: GREEN
- BACKEND-DEV implements:
  - Profile service
  - API endpoint
  - Validation logic
  - Error handling

Phase 4: REFACTOR
- Extract common validation
- Improve error messages
- Add logging

Phase 5: QA
- Validate all test scenarios
- Test with invalid tokens
- Test with missing data

Phase 6: Code Review
- Check security (auth)
- Verify error handling
- Approve

Phase 7: Documentation
- Update API docs
- Add to changelog
```

### Scenario 2: Frontend UI Story
```
Story: "As a user, I can see my dashboard with stats"

Phase 1: UX Design
- UX-DESIGNER creates dashboard mockups
- Defines card layouts, charts, responsive behavior
- Documents loading and error states

Phase 2: RED
- TEST-ENGINEER writes:
  - Component unit tests
  - Integration tests with mock API
  - E2E test for dashboard load

Phase 3: GREEN
- FRONTEND-DEV implements:
  - Dashboard component
  - Stats cards
  - Charts
  - API integration

Phase 4: REFACTOR
- Extract reusable card component
- Improve chart configuration
- Clean up styles

Phase 5: QA
- Validate layout matches mockups
- Test responsive behavior
- Test loading states
- Cross-browser check

Phase 6: Code Review
- Check accessibility
- Verify responsive CSS
- Approve

Phase 7: Documentation
- Update component docs
- Add storybook entry
- Screenshot in user guide
```

## Metrics Tracking

Track for each story:

| Metric | Description | Update When |
|--------|-------------|-------------|
| RED duration | Time in test writing | Phase 2 complete |
| GREEN duration | Time implementing | Phase 3 complete |
| REFACTOR duration | Time refactoring | Phase 4 complete |
| QA cycles | Number of QA rounds | Each QA pass |
| Review cycles | Number of review rounds | Each review |
| Total duration | Start to done | Story complete |
| Bugs found | Bugs during story | During QA |

Update in `.claude/state/METRICS.md`
