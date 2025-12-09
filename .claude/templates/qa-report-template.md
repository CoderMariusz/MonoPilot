# QA Report: Story {N}.{M}

## Summary
| Field | Value |
|-------|-------|
| Story | {N}.{M} - {title} |
| QA Engineer | QA-AGENT (Vera) |
| Date | {YYYY-MM-DD} |
| Duration | {time spent} |
| Decision | ✅ PASS / ❌ FAIL |

## Executive Summary
{2-3 sentence summary of QA results}

---

## Acceptance Criteria Results

| AC | Description | Status | Notes |
|----|-------------|--------|-------|
| AC-1 | {description} | ✅ / ❌ | {notes} |
| AC-2 | {description} | ✅ / ❌ | {notes} |
| AC-3 | {description} | ✅ / ❌ | {notes} |

**AC Summary:** {X}/{Y} Passing

---

## AC Test Details

### AC-1: {Description}
| Field | Value |
|-------|-------|
| Given | {precondition} |
| When | {action} |
| Then | {expected result} |
| Actual | {actual result} |
| Status | ✅ PASS / ❌ FAIL |
| Evidence | {screenshot/log reference} |

### AC-2: {Description}
{Same format}

---

## Edge Case Testing

| Category | Tests | Passed | Failed |
|----------|-------|--------|--------|
| Input Boundaries | {N} | {N} | {N} |
| User Behavior | {N} | {N} | {N} |
| Data States | {N} | {N} | {N} |

### Edge Cases Tested
| Scenario | Expected | Actual | Status |
|----------|----------|--------|--------|
| Empty input | {expected} | {actual} | ✅ / ❌ |
| Max length | {expected} | {actual} | ✅ / ❌ |
| Special chars | {expected} | {actual} | ✅ / ❌ |

---

## Regression Testing

| Area | Status | Notes |
|------|--------|-------|
| {related feature 1} | ✅ / ❌ | {notes} |
| {related feature 2} | ✅ / ❌ | {notes} |

---

## Exploratory Testing

| Field | Value |
|-------|-------|
| Time Spent | {duration} |
| Areas Explored | {areas} |
| Issues Found | {count} |

**Observations:**
- {observation 1}
- {observation 2}

---

## Bugs Found

| Bug ID | Severity | Description | Blocking? |
|--------|----------|-------------|-----------|
| BUG-{ID} | Critical/High/Medium/Low | {description} | Yes/No |

**Total Bugs:** {N}
**Blocking Bugs:** {N}

---

## QA Decision

### Decision: {✅ PASS / ❌ FAIL}

### Rationale
{Explanation of decision}

### If FAIL - Required Actions
1. [ ] Fix BUG-{ID}: {description}
2. [ ] Fix BUG-{ID}: {description}

### If PASS - Notes
{Any known issues or observations for future}

---

## Sign-off

| Field | Value |
|-------|-------|
| QA Status | ✅ PASS / ❌ FAIL |
| QA Engineer | QA-AGENT (Vera) |
| Date | {YYYY-MM-DD} |

**If PASS:** Story {N}.{M} is verified and ready for completion.
**If FAIL:** Story requires fixes. Return to development.
