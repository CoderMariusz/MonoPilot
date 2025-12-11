# Code Review: Story {N}.{M}

## Review Info
| Field | Value |
|-------|-------|
| Story | {N}.{M} - {title} |
| Reviewer | CODE-REVIEWER (Marcus) |
| Date | {YYYY-MM-DD} |
| Files Reviewed | {count} |
| Test Coverage | {X}% |

## Decision: {✅ APPROVED / ❌ REQUEST_CHANGES}

---

## Summary
{2-3 sentence summary of overall assessment}

---

## Files Reviewed

| File | Status | Notes |
|------|--------|-------|
| `{file1}` | ✅ / ⚠️ / ❌ | {notes} |
| `{file2}` | ✅ / ⚠️ / ❌ | {notes} |

---

## Checklist Results

| Area | Status | Notes |
|------|--------|-------|
| Correctness | ✅ / ❌ | {notes} |
| Security | ✅ / ❌ | {notes} |
| Quality | ✅ / ❌ | {notes} |
| Tests | ✅ / ❌ | {notes} |

---

## Issues Found

### Critical ❌ (must fix before merge)
| Location | Issue | Suggestion |
|----------|-------|------------|
| `{file}:{line}` | {issue} | {fix suggestion} |

### Major ⚠️ (should fix)
| Location | Issue | Suggestion |
|----------|-------|------------|
| `{file}:{line}` | {issue} | {fix suggestion} |

### Minor 💡 (optional improvements)
| Location | Issue | Suggestion |
|----------|-------|------------|
| `{file}:{line}` | {issue} | {fix suggestion} |

---

## Positive Feedback 👍
- {Good practice noticed}
- {Well-done aspect}
- {Clean implementation}

---

## Security Assessment

| Check | Status | Notes |
|-------|--------|-------|
| Input validation | ✅ / ❌ | {notes} |
| Injection prevention | ✅ / ❌ | {notes} |
| Auth checks | ✅ / ❌ | {notes} |
| Data protection | ✅ / ❌ | {notes} |

**Security Status:** PASS / FAIL

---

## Test Assessment

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Coverage | {X}% | {Y}% | ✅ / ❌ |
| AC tests | {X}/{Y} | 100% | ✅ / ❌ |
| Edge cases | Present | Yes | ✅ / ❌ |

**Test Quality:** Good / Acceptable / Needs Work

---

## Action Items (if REQUEST_CHANGES)

| # | Action | Location | Priority |
|---|--------|----------|----------|
| 1 | {fix description} | `{file}:{line}` | Critical |
| 2 | {fix description} | `{file}:{line}` | Major |

---

## Re-review Required?

- [ ] Yes - full re-review
- [ ] Yes - focused on {areas}
- [ ] No - approved

---

## Handoff

**If APPROVED:**
Ready for QA testing. Focus areas: {areas to test}

**If REQUEST_CHANGES:**
Return to DEV. Required fixes listed above.
