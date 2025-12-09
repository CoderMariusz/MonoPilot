# Bug Workflow

## Overview

Bug fix workflow with complexity-based routing. Bugs are triaged by severity and complexity, then routed to the appropriate fix path: simple fixes use fast review, medium bugs follow standard TDD, and complex bugs may require architectural review or full story workflow.

## ASCII Flow Diagram

```
                                  BUG WORKFLOW
                                       |
                                       v
+================================================================================+
|                           PHASE 1: BUG INTAKE                                  |
+================================================================================+
|                                                                                |
|   +------------------------------------------------------------------------+  |
|   | Bug Report Received                                                     |  |
|   | Source: QA-AGENT | Developer | User Report | Monitoring                 |  |
|   +------------------------------------------------------------------------+  |
|                                    |                                          |
|                                    v                                          |
|   +------------------------------------------------------------------------+  |
|   | BUG REPORT TEMPLATE                                                     |  |
|   | - Title, Description                                                    |  |
|   | - Steps to reproduce                                                    |  |
|   | - Expected vs Actual                                                    |  |
|   | - Environment details                                                   |  |
|   | - Screenshots/Logs                                                      |  |
|   +------------------------------------------------------------------------+  |
|                                                                                |
+================================================================================+
                                       |
                                       v
+================================================================================+
|                          PHASE 2: SEVERITY ASSESSMENT                          |
+================================================================================+
|                                                                                |
|   +------------------------------------------------------------------------+  |
|   | QA-AGENT / PRODUCT-OWNER (Sonnet)                                       |  |
|   +------------------------------------------------------------------------+  |
|   |                                                                         |  |
|   |   SEVERITY MATRIX                                                       |  |
|   |   +----------+---------------------------+------------------+           |  |
|   |   | Level    | Description               | Response Time    |           |  |
|   |   +----------+---------------------------+------------------+           |  |
|   |   | CRITICAL | System down, data loss    | IMMEDIATE        |           |  |
|   |   | HIGH     | Major feature broken      | Same day         |           |  |
|   |   | MEDIUM   | Feature impaired          | This sprint      |           |  |
|   |   | LOW      | Minor issue, cosmetic     | Backlog          |           |  |
|   |   +----------+---------------------------+------------------+           |  |
|   |                                                                         |  |
|   +------------------------------------------------------------------------+  |
|                                    |                                          |
+================================================================================+
                                       |
                                       v
+================================================================================+
|                         PHASE 3: COMPLEXITY ROUTING                            |
+================================================================================+
|                                                                                |
|   +------------------------------------------------------------------------+  |
|   | COMPLEXITY ASSESSMENT                                                   |  |
|   +------------------------------------------------------------------------+  |
|   |                                                                         |  |
|   |   Analyze bug to determine complexity:                                  |  |
|   |                                                                         |  |
|   |   SIMPLE (< 10 lines change)                                            |  |
|   |   - Typo fix                                                            |  |
|   |   - Config change                                                       |  |
|   |   - Simple logic fix                                                    |  |
|   |   - CSS adjustment                                                      |  |
|   |                                                                         |  |
|   |   MEDIUM (Investigation needed)                                         |  |
|   |   - Logic error                                                         |  |
|   |   - Integration issue                                                   |  |
|   |   - Performance problem                                                 |  |
|   |   - Edge case handling                                                  |  |
|   |                                                                         |  |
|   |   COMPLEX (Architecture issue)                                          |  |
|   |   - Design flaw                                                         |  |
|   |   - Cross-system bug                                                    |  |
|   |   - Security vulnerability                                              |  |
|   |   - Data corruption                                                     |  |
|   |                                                                         |  |
|   +------------------------------------------------------------------------+  |
|                                    |                                          |
|                    +---------------+----------------+                          |
|                    |               |                |                          |
|                 SIMPLE          MEDIUM          COMPLEX                        |
|                    |               |                |                          |
+================================================================================+
                     |               |                |
                     v               v                v
     +===============+  +============+  +=============+
     | SIMPLE PATH   |  | MEDIUM     |  | COMPLEX     |
     | (Fast Track)  |  | PATH       |  | PATH        |
     +===============+  +============+  +=============+


+===================================================================================+
|                        SIMPLE PATH (Fast Track)                                   |
+===================================================================================+
|                                                                                   |
|   Model: Haiku (fast, cost-effective)                                             |
|   Duration: < 1 hour                                                              |
|                                                                                   |
|   +------------------+     +------------------+     +------------------+          |
|   | DEV AGENT        |---->| CODE-REVIEWER    |---->| QA-AGENT         |          |
|   | (Haiku)          |     | (Haiku)          |     | (Haiku)          |          |
|   +------------------+     +------------------+     +------------------+          |
|   | 1. Locate issue  |     | Quick review:    |     | Verify fix:      |          |
|   | 2. Make fix      |     | - Correct fix?   |     | - Bug resolved?  |          |
|   | 3. Run tests     |     | - Side effects?  |     | - No regression? |          |
|   +------------------+     +------------------+     +------------------+          |
|            |                        |                        |                    |
|            v                        v                        v                    |
|   +------------------+     +------------------+     +------------------+          |
|   | CHECKPOINT       |     | CHECKPOINT       |     | CHECKPOINT       |          |
|   | [ ] Fix < 10 LOC |     | [ ] Approved     |     | [ ] Bug closed   |          |
|   | [ ] Tests pass   |     | [ ] No issues    |     | [ ] No new bugs  |          |
|   +------------------+     +------------------+     +------------------+          |
|                                                              |                    |
|                                                              v                    |
|                                                         BUG CLOSED                |
|                                                                                   |
+===================================================================================+


+===================================================================================+
|                        MEDIUM PATH (Standard TDD)                                 |
+===================================================================================+
|                                                                                   |
|   Model: Sonnet                                                                   |
|   Duration: 2-8 hours                                                             |
|                                                                                   |
|   +-----------------------------------------------------------------------+      |
|   |                    PHASE M1: INVESTIGATION                            |      |
|   +-----------------------------------------------------------------------+      |
|   |                                                                        |      |
|   |   +------------------------------------------------------------+      |      |
|   |   | DEV AGENT (Sonnet)                                          |      |      |
|   |   +------------------------------------------------------------+      |      |
|   |   | 1. Reproduce the bug                                        |      |      |
|   |   | 2. Identify root cause                                      |      |      |
|   |   | 3. Document findings                                        |      |      |
|   |   | 4. Propose fix approach                                     |      |      |
|   |   +------------------------------------------------------------+      |      |
|   |                            |                                           |      |
|   |                            v                                           |      |
|   |   +------------------------------------------------------------+      |      |
|   |   | ROOT CAUSE ANALYSIS                                         |      |      |
|   |   | - What went wrong?                                          |      |      |
|   |   | - Why wasn't it caught?                                     |      |      |
|   |   | - What's the fix scope?                                     |      |      |
|   |   +------------------------------------------------------------+      |      |
|   |                                                                        |      |
|   +-----------------------------------------------------------------------+      |
|                                    |                                              |
|                                    v                                              |
|   +-----------------------------------------------------------------------+      |
|   |                    PHASE M2: TEST (RED)                               |      |
|   +-----------------------------------------------------------------------+      |
|   |                                                                        |      |
|   |   +------------------------------------------------------------+      |      |
|   |   | TEST-ENGINEER (Sonnet)                                      |      |      |
|   |   +------------------------------------------------------------+      |      |
|   |   | 1. Write test that reproduces bug                           |      |      |
|   |   | 2. Test should FAIL with current code                       |      |      |
|   |   | 3. Add edge case tests                                      |      |      |
|   |   +------------------------------------------------------------+      |      |
|   |                                                                        |      |
|   +-----------------------------------------------------------------------+      |
|                                    |                                              |
|                                    v                                              |
|   +-----------------------------------------------------------------------+      |
|   |                    PHASE M3: FIX (GREEN)                              |      |
|   +-----------------------------------------------------------------------+      |
|   |                                                                        |      |
|   |   +------------------------------------------------------------+      |      |
|   |   | DEV AGENT (Sonnet)                                          |      |      |
|   |   +------------------------------------------------------------+      |      |
|   |   | 1. Implement fix                                            |      |      |
|   |   | 2. Make test pass                                           |      |      |
|   |   | 3. Verify no regressions                                    |      |      |
|   |   +------------------------------------------------------------+      |      |
|   |                                                                        |      |
|   +-----------------------------------------------------------------------+      |
|                                    |                                              |
|                                    v                                              |
|   +-----------------------------------------------------------------------+      |
|   |                    PHASE M4: REVIEW                                   |      |
|   +-----------------------------------------------------------------------+      |
|   |                                                                        |      |
|   |   +------------------------------------------------------------+      |      |
|   |   | CODE-REVIEWER (Sonnet)                                      |      |      |
|   |   +------------------------------------------------------------+      |      |
|   |   | 1. Review fix correctness                                   |      |      |
|   |   | 2. Check for side effects                                   |      |      |
|   |   | 3. Verify test coverage                                     |      |      |
|   |   | 4. Approve or request changes                               |      |      |
|   |   +------------------------------------------------------------+      |      |
|   |                            |                                           |      |
|   |                    APPROVED | CHANGES REQUESTED                        |      |
|   |                            |         |                                 |      |
|   |                            v         +---> Back to FIX                 |      |
|   |                                                                        |      |
|   +-----------------------------------------------------------------------+      |
|                                    |                                              |
|                                    v                                              |
|   +-----------------------------------------------------------------------+      |
|   |                    PHASE M5: VERIFICATION                             |      |
|   +-----------------------------------------------------------------------+      |
|   |                                                                        |      |
|   |   +------------------------------------------------------------+      |      |
|   |   | QA-AGENT (Sonnet)                                           |      |      |
|   |   +------------------------------------------------------------+      |      |
|   |   | 1. Verify bug is fixed                                      |      |      |
|   |   | 2. Run regression tests                                     |      |      |
|   |   | 3. Test related functionality                               |      |      |
|   |   | 4. Approve closure                                          |      |      |
|   |   +------------------------------------------------------------+      |      |
|   |                            |                                           |      |
|   |                       PASS | FAIL                                      |      |
|   |                            |   |                                       |      |
|   |                            v   +---> Back to INVESTIGATION             |      |
|   |                                                                        |      |
|   +-----------------------------------------------------------------------+      |
|                                    |                                              |
|                                    v                                              |
|                               BUG CLOSED                                          |
|                                                                                   |
+===================================================================================+


+===================================================================================+
|                        COMPLEX PATH (Architecture Review)                         |
+===================================================================================+
|                                                                                   |
|   Model: Opus (for architecture) + Sonnet (for implementation)                    |
|   Duration: 1+ days                                                               |
|                                                                                   |
|   +-----------------------------------------------------------------------+      |
|   |                    PHASE C0: RESEARCH (if unknown domain)             |      |
|   +-----------------------------------------------------------------------+      |
|   |                                                                        |      |
|   |   +------------------------------------------------------------+      |      |
|   |   | RESEARCH-AGENT (Sonnet) - OPTIONAL                          |      |      |
|   |   +------------------------------------------------------------+      |      |
|   |   | When to use:                                                |      |      |
|   |   | - Bug in unfamiliar technology/library                      |      |      |
|   |   | - Security vulnerability requiring CVE research             |      |      |
|   |   | - Performance issue needing benchmark data                  |      |      |
|   |   | - Integration bug with external system                      |      |      |
|   |   |                                                             |      |      |
|   |   | Tasks:                                                      |      |      |
|   |   | 1. Research technology/library involved                     |      |      |
|   |   | 2. Find similar issues in community                         |      |      |
|   |   | 3. Identify known solutions/workarounds                     |      |      |
|   |   | 4. Document findings for ARCHITECT-AGENT                    |      |      |
|   |   +------------------------------------------------------------+      |      |
|   |                                                                        |      |
|   +-----------------------------------------------------------------------+      |
|                                    |                                              |
|                                    v                                              |
|   +-----------------------------------------------------------------------+      |
|   |                    PHASE C1: ARCHITECTURE REVIEW                      |      |
|   +-----------------------------------------------------------------------+      |
|   |                                                                        |      |
|   |   +------------------------------------------------------------+      |      |
|   |   | ARCHITECT-AGENT (Opus)                                      |      |      |
|   |   +------------------------------------------------------------+      |      |
|   |   | 1. Analyze bug and system impact                            |      |      |
|   |   | 2. Identify architectural root cause                        |      |      |
|   |   | 3. Propose solution options                                 |      |      |
|   |   | 4. Create ADR if significant change                         |      |      |
|   |   | 5. Determine if full story needed                           |      |      |
|   |   +------------------------------------------------------------+      |      |
|   |                            |                                           |      |
|   |                            v                                           |      |
|   |   +------------------------------------------------------------+      |      |
|   |   | DECISION POINT                                              |      |      |
|   |   +------------------------------------------------------------+      |      |
|   |   | Can fix within bug workflow?                                |      |      |
|   |   |   YES -> Continue to FIX phase                              |      |      |
|   |   |   NO  -> Convert to Story -> STORY-WORKFLOW                 |      |      |
|   |   +------------------------------------------------------------+      |      |
|   |                            |                                           |      |
|   |                    FIX HERE | CONVERT TO STORY                         |      |
|   |                            |         |                                 |      |
|   +-----------------------------------------------------------------------+      |
|                                |         |                                        |
|                                v         +-----> Create Story                     |
|                                |                 -> STORY-WORKFLOW                |
|   +-----------------------------------------------------------------------+      |
|   |                    PHASE C2: SENIOR DEV FIX                           |      |
|   +-----------------------------------------------------------------------+      |
|   |                                                                        |      |
|   |   +------------------------------------------------------------+      |      |
|   |   | SENIOR-DEV (Opus)                                           |      |      |
|   |   +------------------------------------------------------------+      |      |
|   |   | 1. Implement architectural fix                              |      |      |
|   |   | 2. Update affected systems                                  |      |      |
|   |   | 3. Comprehensive testing                                    |      |      |
|   |   | 4. Update documentation                                     |      |      |
|   |   +------------------------------------------------------------+      |      |
|   |                                                                        |      |
|   +-----------------------------------------------------------------------+      |
|                                    |                                              |
|                                    v                                              |
|   +-----------------------------------------------------------------------+      |
|   |                    PHASE C3: FULL REVIEW                              |      |
|   +-----------------------------------------------------------------------+      |
|   |                                                                        |      |
|   |   +------------------------------------------------------------+      |      |
|   |   | CODE-REVIEWER (Sonnet) + ARCHITECT-AGENT (Opus)             |      |      |
|   |   +------------------------------------------------------------+      |      |
|   |   | 1. Code review                                              |      |      |
|   |   | 2. Architecture compliance                                  |      |      |
|   |   | 3. Security review                                          |      |      |
|   |   | 4. Performance review                                       |      |      |
|   |   +------------------------------------------------------------+      |      |
|   |                                                                        |      |
|   +-----------------------------------------------------------------------+      |
|                                    |                                              |
|                                    v                                              |
|   +-----------------------------------------------------------------------+      |
|   |                    PHASE C4: QA + REGRESSION                          |      |
|   +-----------------------------------------------------------------------+      |
|   |                                                                        |      |
|   |   +------------------------------------------------------------+      |      |
|   |   | QA-AGENT (Sonnet)                                           |      |      |
|   |   +------------------------------------------------------------+      |      |
|   |   | 1. Full regression test suite                               |      |      |
|   |   | 2. Integration testing                                      |      |      |
|   |   | 3. Performance testing                                      |      |      |
|   |   | 4. Security validation                                      |      |      |
|   |   +------------------------------------------------------------+      |      |
|   |                                                                        |      |
|   +-----------------------------------------------------------------------+      |
|                                    |                                              |
|                                    v                                              |
|                               BUG CLOSED                                          |
|                               + ADR Updated                                       |
|                               + Docs Updated                                      |
|                                                                                   |
+===================================================================================+
```

## Detailed Steps

### Phase 1: Bug Intake

#### Bug Report Template
```markdown
## BUG-{ID}: {Title}

**Reporter:** {agent or user}
**Date:** {YYYY-MM-DD}
**Status:** New

### Environment
- Version: {version}
- Platform: {platform}
- Browser: {browser if applicable}

### Description
{Clear description of the bug}

### Steps to Reproduce
1. {Step 1}
2. {Step 2}
3. {Step 3}

### Expected Behavior
{What should happen}

### Actual Behavior
{What actually happens}

### Screenshots/Logs
{Attach relevant evidence}

### Additional Context
{Any other relevant information}
```

---

### Phase 2: Severity Assessment

**Agent:** QA-AGENT or PRODUCT-OWNER
**Model:** Sonnet
**Duration:** 15-30 minutes

#### Severity Definitions

| Severity | Definition | Examples | Response |
|----------|------------|----------|----------|
| CRITICAL | System unusable, data loss | App crash, data corruption, security breach | Immediate |
| HIGH | Major feature broken | Cannot login, payment fails, data not saved | Same day |
| MEDIUM | Feature impaired | Slow performance, UI glitch, edge case fail | Sprint |
| LOW | Minor issue | Typo, cosmetic, rarely occurs | Backlog |

#### Assessment Checklist
```markdown
## Severity Assessment: BUG-{ID}

### Impact Analysis
- [ ] How many users affected?
- [ ] Is there a workaround?
- [ ] Is data at risk?
- [ ] Is security at risk?

### Business Impact
- [ ] Revenue impact?
- [ ] Reputation impact?
- [ ] Legal/compliance impact?

### Assigned Severity: {CRITICAL|HIGH|MEDIUM|LOW}
### Assigned Priority: {P0|P1|P2|P3}
### Justification: {reason}
```

---

### Phase 3: Complexity Routing

**Agent:** QA-AGENT or DEV
**Model:** Sonnet
**Duration:** 15-30 minutes

#### Complexity Criteria

##### SIMPLE (< 10 lines)
- Clear cause, obvious fix
- No investigation needed
- Single file change
- No architectural impact
- Examples:
  - Typo in text
  - Wrong constant value
  - Missing null check
  - CSS property fix

##### MEDIUM (Investigation needed)
- Cause not immediately clear
- May span multiple files
- Needs root cause analysis
- Examples:
  - Logic error in function
  - State management bug
  - API integration issue
  - Performance problem

##### COMPLEX (Architecture issue)
- Systemic problem
- Design flaw
- Cross-cutting concern
- May need ADR
- Examples:
  - Security vulnerability
  - Data model issue
  - Concurrency bug
  - Cross-service failure

#### Routing Decision
```markdown
## Complexity Assessment: BUG-{ID}

### Analysis
- Estimated lines of change: {number}
- Files affected: {count}
- Investigation needed: Yes/No
- Architecture impact: Yes/No

### Routing Decision: SIMPLE | MEDIUM | COMPLEX

### Justification
{Why this complexity level}
```

---

## Simple Path (Fast Track)

**Total Duration:** < 1 hour
**Models:** Haiku throughout

### Step S1: Quick Fix (DEV)
**Model:** Haiku
**Duration:** 15-30 minutes

1. Locate the issue in code
2. Implement minimal fix
3. Run existing tests
4. Verify fix works

**Output:** Fixed code, passing tests

### Step S2: Quick Review (CODE-REVIEWER)
**Model:** Haiku
**Duration:** 10-15 minutes

```markdown
## Quick Review: BUG-{ID}

- [ ] Fix is correct
- [ ] No side effects
- [ ] Tests pass
- [ ] No security issues

Decision: APPROVE / REJECT
```

### Step S3: Quick Verify (QA-AGENT)
**Model:** Haiku
**Duration:** 10-15 minutes

1. Verify bug is fixed
2. Quick smoke test
3. Close bug

---

## Medium Path (Standard TDD)

**Total Duration:** 2-8 hours
**Models:** Sonnet throughout

### Step M1: Investigation (DEV)
**Model:** Sonnet
**Duration:** 30 min - 2 hours

1. Reproduce the bug reliably
2. Debug and trace root cause
3. Document findings
4. Propose fix approach

**Root Cause Analysis Template:**
```markdown
## Root Cause Analysis: BUG-{ID}

### Reproduction Steps
{How to consistently reproduce}

### Root Cause
{What is actually causing the bug}

### Why It Wasn't Caught
{Gap in testing/review}

### Proposed Fix
{How to fix it}

### Estimated Scope
- Files affected: {list}
- Lines of change: ~{number}
- Risk level: Low/Medium/High
```

### Step M2: Test First (TEST-ENGINEER)
**Model:** Sonnet
**Duration:** 30 min - 1 hour

1. Write test that reproduces bug
2. Test must FAIL with current code
3. Add edge case tests
4. Define test coverage for fix

**Test Requirements:**
```markdown
## Bug Fix Tests: BUG-{ID}

### Reproduction Test
- Test name: {name}
- Expected: FAIL before fix, PASS after

### Edge Case Tests
| Test | Purpose |
|------|---------|
| {test} | {why needed} |

### Coverage Target
- Must cover: {specific code paths}
```

### Step M3: Fix Implementation (DEV)
**Model:** Sonnet
**Duration:** 1-4 hours

1. Implement the fix
2. Make all tests pass
3. Run full test suite
4. Verify no regressions

### Step M4: Code Review (CODE-REVIEWER)
**Model:** Sonnet
**Duration:** 30 min - 1 hour

```markdown
## Code Review: BUG-{ID} Fix

### Fix Assessment
- [ ] Root cause addressed
- [ ] Fix is minimal and focused
- [ ] No side effects introduced
- [ ] Tests are meaningful

### Quality Check
- [ ] Follows coding standards
- [ ] Error handling appropriate
- [ ] No security issues

### Decision: APPROVE / CHANGES REQUESTED
```

### Step M5: Verification (QA-AGENT)
**Model:** Sonnet
**Duration:** 30 min - 1 hour

1. Verify bug is fixed
2. Execute regression tests
3. Test related functionality
4. Approve closure or reject

---

## Complex Path (Architecture Review)

**Total Duration:** 1+ days
**Models:** Opus (architecture) + Sonnet (implementation)

### Step C0: Research (RESEARCH-AGENT) - OPTIONAL
**Model:** Sonnet
**Duration:** 1-2 hours
**When to use:** Unfamiliar technology, security CVE, external integration, performance benchmarks

1. Research technology/library involved in bug
2. Search for similar issues in community (GitHub, StackOverflow, vendor docs)
3. Identify known solutions, patches, or workarounds
4. Document findings for ARCHITECT-AGENT

**Research Output:**
```markdown
## Research: BUG-{ID}

### Technology Context
- Library/Framework: {name} v{version}
- Known issues: {list}

### Community Findings
| Source | Finding | Relevance |
|--------|---------|-----------|
| {url} | {summary} | High/Medium/Low |

### Recommended Approaches
1. {approach from research}
2. {alternative}

### References
- {links to docs, issues, discussions}
```

### Step C1: Architecture Review (ARCHITECT-AGENT)
**Model:** Opus
**Duration:** 2-4 hours

1. Deep analysis of bug and impact (use RESEARCH-AGENT findings if available)
2. Identify architectural root cause
3. Evaluate solution options
4. Decide if ADR needed
5. Determine if story conversion needed

**Architecture Analysis Template:**
```markdown
## Architecture Analysis: BUG-{ID}

### System Impact
- Components affected: {list}
- Services affected: {list}
- Data affected: {describe}

### Root Cause Category
[ ] Design flaw
[ ] Missing validation
[ ] Concurrency issue
[ ] Security gap
[ ] Performance issue
[ ] Integration problem

### Solution Options
| Option | Pros | Cons | Effort |
|--------|------|------|--------|
| A | | | |
| B | | | |

### Recommendation
{Recommended approach}

### ADR Required: Yes/No
### Convert to Story: Yes/No
```

**Decision Point:**
- If fix can be contained: Continue to C2
- If major refactor needed: Convert to Story -> STORY-WORKFLOW

### Step C2: Senior Dev Fix (SENIOR-DEV)
**Model:** Opus
**Duration:** 4+ hours

1. Implement architectural fix
2. Update all affected components
3. Comprehensive unit tests
4. Integration tests
5. Update documentation

### Step C3: Full Review
**Models:** CODE-REVIEWER (Sonnet) + ARCHITECT-AGENT (Opus)
**Duration:** 1-2 hours

```markdown
## Full Review: BUG-{ID}

### Code Review (CODE-REVIEWER)
- [ ] Implementation correct
- [ ] Tests comprehensive
- [ ] No regressions introduced

### Architecture Review (ARCHITECT)
- [ ] Solution matches approved approach
- [ ] No new technical debt
- [ ] Documentation updated
- [ ] ADR completed (if needed)

### Security Review
- [ ] No new vulnerabilities
- [ ] Security best practices followed

### Decision: APPROVE / CHANGES REQUESTED
```

### Step C4: Full QA (QA-AGENT)
**Model:** Sonnet
**Duration:** 2-4 hours

1. Full regression test suite
2. Integration testing
3. Performance testing
4. Security validation
5. Final approval

---

## Quality Gates

| Path | Gate | Criteria |
|------|------|----------|
| All | Intake | Bug report complete |
| All | Severity | Severity assigned, priority set |
| All | Routing | Complexity determined |
| Simple | Fix | < 10 LOC, tests pass |
| Simple | Review | Quick approval |
| Simple | Verify | Bug confirmed fixed |
| Medium | Investigation | Root cause identified |
| Medium | Test | Failing test exists |
| Medium | Fix | All tests pass |
| Medium | Review | Code approved |
| Medium | Verify | QA approved |
| Complex | Architecture | Solution approved |
| Complex | Fix | Comprehensive implementation |
| Complex | Review | Full review passed |
| Complex | QA | Full regression passed |

## Error Handling

### Bug Cannot Be Reproduced
```
1. Request more information from reporter
2. Check different environments
3. Add logging/monitoring
4. If still cannot reproduce:
   - Document investigation
   - Close as "Cannot Reproduce"
   - Add monitoring for future occurrence
```

### Fix Causes Regression
```
1. Revert the fix immediately
2. Re-open bug
3. Escalate complexity if needed
4. Add regression to test requirements
5. Retry with expanded scope
```

### Complexity Underestimated
```
1. Stop current path
2. Re-assess complexity
3. Route to appropriate path
4. Document why initial assessment was wrong
```

### Fix Requires Architecture Change
```
1. During any path, if architecture change needed:
2. Pause current work
3. Route to ARCHITECT-AGENT
4. May convert to Story
5. Continue with appropriate path
```

## Example Scenarios

### Scenario 1: Simple Bug - Typo Fix
```
Bug: "Login button says 'Lgin'"

Intake: BUG-042 created
Severity: LOW (cosmetic)
Complexity: SIMPLE (1 line change)

Simple Path:
S1: DEV (Haiku) fixes typo in button.tsx
S2: CODE-REVIEWER (Haiku) approves
S3: QA (Haiku) verifies

Total time: 20 minutes
```

### Scenario 2: Medium Bug - Logic Error
```
Bug: "Discount not applied when quantity > 10"

Intake: BUG-043 created
Severity: HIGH (affects revenue)
Complexity: MEDIUM (logic investigation needed)

Medium Path:
M1: DEV investigates, finds off-by-one error
M2: TEST-ENGINEER writes test for quantity=10,11,12
M3: DEV fixes comparison operator
M4: CODE-REVIEWER approves
M5: QA verifies with various quantities

Total time: 4 hours
```

### Scenario 3: Complex Bug - Security Issue
```
Bug: "User can access other user's data via API"

Intake: BUG-044 created
Severity: CRITICAL (security breach)
Complexity: COMPLEX (authorization architecture)

Complex Path:
C1: ARCHITECT reviews auth architecture
    - Creates ADR-005-authorization-refactor
    - Decides fix can be done in bug workflow
C2: SENIOR-DEV implements:
    - Authorization middleware
    - Resource ownership checks
    - Audit logging
C3: Full review by CODE-REVIEWER + ARCHITECT
C4: Full regression + security testing

Total time: 2 days
```

### Scenario 4: Complex Bug -> Story Conversion
```
Bug: "Performance degrades with large datasets"

Intake: BUG-045 created
Severity: HIGH (affects usability)
Complexity: COMPLEX (data architecture)

Complex Path:
C1: ARCHITECT reviews:
    - Root cause: N+1 queries + no pagination
    - Fix requires: Database redesign, API changes, UI updates
    - Decision: Convert to Story

-> Creates Story S-3.5: "Implement pagination and optimize queries"
-> Routes to STORY-WORKFLOW
-> Bug linked to story, closed when story done
```

## Metrics Tracking

Track for each bug:

| Metric | Description | Update When |
|--------|-------------|-------------|
| Time to triage | Intake to routing | Routing complete |
| Time to fix | Routing to fix complete | Fix done |
| Time to close | Fix to verification | Bug closed |
| Complexity accuracy | Actual vs estimated | Bug closed |
| Regression count | Fixes causing new bugs | On regression |
| Reopen count | Times bug reopened | On reopen |

Update in `.claude/state/METRICS.md`

## Bug Status Flow

```
NEW -> TRIAGED -> ASSIGNED -> IN PROGRESS -> IN REVIEW -> VERIFIED -> CLOSED
                     ^            |              |           |
                     |            v              v           v
                     +-------- BLOCKED       CHANGES     REOPENED
                     |                       REQUESTED       |
                     +------------------------------------------+
```

## Integration with Other Workflows

| Scenario | Integration |
|----------|-------------|
| Bug found during Story QA | BUG-WORKFLOW, return to Story QA when fixed |
| Bug causes Sprint delay | SCRUM-MASTER notified, sprint adjusted |
| Bug converts to Story | STORY-WORKFLOW, link bug to story |
| Critical bug during release | Immediate BUG-WORKFLOW, block release |
