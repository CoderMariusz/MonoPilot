# TDD Phase Flow

Complete explanation of RED → GREEN → REFACTOR workflow and phase transitions. This is the central source of truth for TDD methodology across all agents.

---

## Overview: The TDD Cycle

```
┌─────────────────────────────────────────────────────┐
│                   RED PHASE (P2)                    │
│         TEST-WRITER writes failing tests             │
│    Tests don't pass (by design) - RED status         │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│                   GREEN PHASE (P3)                  │
│    BACKEND-DEV / FRONTEND-DEV write minimal code     │
│         to make ALL tests pass                       │
│    Tests all pass - GREEN status                    │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│                 REFACTOR PHASE (P4)                 │
│    SENIOR-DEV improves structure without behavior   │
│         changes. Tests remain GREEN.                │
│              Ready for production                   │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│               CODE REVIEW (P5)                      │
│     CODE-REVIEWER verifies quality & security       │
│           APPROVED or REQUEST_CHANGES               │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│               QA TESTING (P6)                       │
│    QA-AGENT validates acceptance criteria met       │
│            PASS or FAIL decision                    │
└─────────────────────────────────────────────────────┘
```

---

## Phase Definitions and Transitions

### Phase 1: UX Design (Optional)
**Agent**: UX-DESIGNER | **Status**: DESIGN
**Input**: Story context, wireframe requirements
**Output**: Approved wireframes
**Checkpoint Format**: `P1: ✓ ux-designer {time} wireframes:N approved:yes/no`

**When this phase happens**:
- UX-heavy stories (Settings, Technical setup)
- New user flows or complex interactions

**Transition to P2**:
- Wireframes approved by PRODUCT-OWNER
- Design locked (no more changes during dev)

---

### Phase 2: RED Phase - Test Writing
**Agent**: TEST-WRITER | **Status**: RED (intentionally)
**Input**: Story AC, technical design context
**Output**: Failing test suite that exercises all AC

**Rules**:
- Write tests BEFORE implementation
- Tests must fail initially (RED status confirms this)
- Tests should be comprehensive - one test per AC item minimum
- Use BDD style when possible (Given/When/Then)
- Mock external dependencies

**Test Quality Checklist**:
```
✓ All AC have at least one test
✓ Tests are independent (can run in any order)
✓ Tests fail without implementation (confirm RED)
✓ Mock setup is clean and reusable
✓ Test names describe what they test
✓ Edge cases covered (empty, null, invalid input)
✓ Error paths tested
```

**Checkpoint Format**:
```yaml
P2: ✓ unit-test-writer {time} files:N tests:X status:red
```

Example:
```yaml
P2: ✓ unit-test-writer 13:50 files:3 tests:27 status:red
```

**Transition to P3**:
- All test files written and committed
- Tests confirmed RED (failing)
- Ready for implementation

---

### Phase 3: GREEN Phase - Implementation
**Agents**: BACKEND-DEV, FRONTEND-DEV, DEVOPS-AGENT
**Input**: Failing test suite, story context
**Output**: Minimal code that makes all tests pass

**Core Rules**:
1. Write ONLY code needed to pass failing tests
2. NO refactoring (that's phase 4)
3. NO new features beyond AC
4. Security is MANDATORY (not optional)
5. Run tests after each implementation
6. Commit atomic units of work

**Implementation Order**:
```
1. Models/Entities
2. Data access layer (Repositories)
3. Business logic (Services)
4. API/UI layer (Controllers/Components)
5. Middleware/Guards
6. Configuration/Constants
```

**Quality Requirements**:
- All tests pass (GREEN status)
- 80%+ code coverage on new code
- No console.log or debug code
- Input validation on all external data
- No hardcoded secrets
- Performance: reasonable for story scope

**Per-Test Workflow**:
```
1. Run failing test
2. Implement minimal code to pass it
3. Run all tests (should stay GREEN)
4. Commit atomic change if multiple files
5. Move to next failing test
```

**Checkpoint Format**:
```yaml
P3: ✓ backend-dev {time} files:N tests:X/Y
P3: ✓ frontend-dev {time} files:N tests:X/Y
```

Examples:
```yaml
P3: ✓ backend-dev 14:23 files:5 tests:12/12
P3: ✓ frontend-dev 14:45 files:8 tests:15/15
```

**Transition to P4**:
- All tests pass (GREEN status confirmed)
- Code is minimal and focused
- Ready for refactoring

---

### Phase 4: REFACTOR Phase - Code Improvement
**Agent**: SENIOR-DEV | **Status**: GREEN (maintained)
**Input**: Working GREEN code, story context
**Output**: Improved code structure, behavior unchanged

**Core Rules**:
1. NEVER change behavior
2. ONE refactoring at a time
3. Run tests after EACH change
4. If RED → UNDO immediately
5. NEVER refactor + new feature in same commit

**Code Smells to Fix**:
```
- Duplicated code → Extract method
- Long functions (>30 lines) → Split
- Deep nesting (>3 levels) → Guard clauses
- Unclear naming → Rename
- Magic numbers → Extract constants
- God classes → Decompose
- Tight coupling → Dependency injection
- Unused imports/variables → Remove
```

**Per-Refactoring Workflow**:
```
1. Identify one smell
2. Plan refactoring (what will change, what won't)
3. Make change
4. Run tests → GREEN? Commit | RED? Undo and try different approach
5. Move to next smell
```

**When to Create ADR (Architecture Decision Record)**:
- Significant architectural pattern
- New pattern not in PATTERNS.md
- Trade-off with long-term impact
- Affects multiple modules

**Checkpoint Format**:
```yaml
P4: ✓ senior-dev {time} refactored:N complexity:reduced/same
```

Examples:
```yaml
P4: ✓ senior-dev 14:45 refactored:3 complexity:reduced
P4: ✓ senior-dev 14:50 refactored:2 complexity:same
```

**Transition to P5**:
- Code is clean and well-structured
- All tests still pass (GREEN)
- No behavior changes verified
- Ready for code review

---

### Phase 5: CODE REVIEW
**Agent**: CODE-REVIEWER | **Status**: REVIEW
**Input**: GREEN code, story AC, review checklist
**Output**: APPROVED or REQUEST_CHANGES decision

**Review Criteria**:

**APPROVED when ALL true**:
- All AC fully implemented
- Tests pass with adequate coverage
- No critical/major security issues
- No blocking quality issues
- Code follows patterns in PATTERNS.md
- Performance acceptable for story scope

**REQUEST_CHANGES when ANY true**:
- AC not fully implemented
- Security vulnerability found
- Tests failing
- Critical quality issues
- Missing error handling
- Insufficient test coverage

**Issue Severity Guide**:
```
CRITICAL → Block merge immediately
  - Security vulnerabilities
  - Data loss risks
  - Hardcoded secrets
  - Missing authentication/authorization

MAJOR → Should fix before merge
  - Logic errors
  - Missing tests
  - Missing error handling
  - Performance issues

MINOR → Can fix post-merge if not blocking
  - Naming inconsistencies
  - Code style
  - Documentation gaps
```

**Checkpoint Format**:
```yaml
P5: ✓ code-reviewer {time} issues:N decision:approved/changes
```

Examples:
```yaml
P5: ✓ code-reviewer 15:10 issues:0 decision:approved
P5: ✓ code-reviewer 15:15 issues:2-major decision:changes
```

**Transition to P6**:
- Decision is APPROVED (no changes needed)
- All critical/major issues resolved
- Ready for QA testing

---

### Phase 6: QA TESTING
**Agent**: QA-AGENT | **Status**: TEST
**Input**: APPROVED code, AC checklist, test data
**Output**: PASS or FAIL decision with bug report

**Testing Scope**:
- All acceptance criteria verified
- Edge cases and error paths
- User flows end-to-end
- Performance under load (if applicable)
- Browser compatibility (frontend)
- Data integrity (backend)

**QA Checkpoint Format**:
```yaml
P6: ✓ qa-agent {time} ac:X/Y bugs:N-severity decision:pass/fail
```

Examples:
```yaml
P6: ✓ qa-agent 15:30 ac:5/5 bugs:0 decision:pass
P6: ✓ qa-agent 15:35 ac:3/5 bugs:2-critical decision:fail
```

**PASS Decision**:
- All AC met
- No critical bugs
- Performance acceptable
- Ready for deployment

**FAIL Decision**:
- Blocks deployment
- Developer returns to implementation
- Fixes critical/major bugs
- Back to P3 for implementation of fixes

**Transition to P7**:
- Decision is PASS
- All critical bugs fixed
- Ready for documentation

---

### Phase 7: DOCUMENTATION (Optional)
**Agent**: TECH-WRITER | **Status**: DOCS
**Input**: Implementation details, QA results, AC
**Output**: API docs, guides, decision records

**Checkpoint Format**:
```yaml
P7: ✓ tech-writer {time} report:done docs:updated/created
```

Example:
```yaml
P7: ✓ tech-writer 15:45 report:done docs:updated
```

**Transition Complete**:
- Story ready for deployment
- All documentation complete
- Checkpoint trail complete (P1-P7)

---

## Phase Transition Criteria

### RED → GREEN transition
**Prerequisites**:
- Test file committed
- Tests confirmed failing
- Implementation scope clear
- Story AC understood

**Gate**: Test-Writer confirms RED status

### GREEN → REFACTOR transition
**Prerequisites**:
- All tests pass
- Code reviewed for safety
- No commits while RED

**Gate**: Test-Engineer confirms all tests GREEN

### REFACTOR → REVIEW transition
**Prerequisites**:
- All tests still pass
- Code smells addressed
- Commit history clean (one refactor per commit)

**Gate**: Senior-Dev confirms GREEN and commits clean

### REVIEW → QA transition
**Prerequisites**:
- Code review approved
- No critical/major issues remaining
- Code merged to development branch

**Gate**: Code-Reviewer decision = APPROVED

### QA → DONE transition
**Prerequisites**:
- All AC verified passing
- No critical bugs
- Performance acceptable

**Gate**: QA-Agent decision = PASS

---

## When Tests Go RED During Refactor

**Immediate Action**: UNDO the last refactoring change

```bash
git diff HEAD~1  # See what changed
git checkout -- <file>  # Undo the change
# OR if committed:
git revert HEAD  # Revert the commit
```

**Analysis**: Why did this break?
1. You changed behavior (VIOLATION of refactoring rules)
2. Tests were incomplete (edge case not covered)
3. Side effects not accounted for

**Recovery**:
1. UNDO the change
2. Analyze what went wrong
3. Plan a different refactoring approach
4. Try again with smaller, more focused change

**If RED stays for more than 2 attempts**:
- Stop refactoring this code
- Document the issue in comments
- Move to different code smell
- Escalate to architect if pattern issue

---

## Common Mistakes and How to Avoid Them

| Mistake | Phase | Impact | Fix |
|---------|-------|--------|-----|
| Tests too vague | RED | Can't verify passing | Specific assertions per AC |
| Implementing extras | GREEN | Scope creep | Stick to failing tests only |
| Refactoring + new feature | REFACTOR | Tests break, behavior changes | Separate commits |
| Skipping tests | GREEN | Can't verify correctness | Every implementation runs tests |
| Review without tests passing | REVIEW | Fundamental failure | Verify GREEN status first |
| QA tests acceptance not functionality | QA | Wrong validation | Test both behavior + edge cases |

---

## Integration with Agent Workflows

Each agent's workflow section should reference this document:

```markdown
## TDD Phase Overview

See: `.claude/procedures/tdd-phase-flow.md`

Your role in the TDD cycle:
- TEST-WRITER: RED phase (P2) - write failing tests
- BACKEND-DEV: GREEN phase (P3) - minimal implementation
- SENIOR-DEV: REFACTOR phase (P4) - code improvement
- CODE-REVIEWER: REVIEW phase (P5) - quality gate
- QA-AGENT: TEST phase (P6) - acceptance validation
```

---

## References

- AGENT-FOOTER.md - Checkpoint and handoff templates
- PATTERNS.md - Code patterns and conventions
- refactoring-patterns skill - Code smell definitions
- code-review-checklist skill - Review criteria
- test-guidelines skill - Test best practices

