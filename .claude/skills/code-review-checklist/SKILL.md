---
name: code-review-checklist
description: Apply when reviewing pull requests, conducting code reviews, or self-reviewing code before submission.
---

## When to Use

Apply when reviewing pull requests, conducting code reviews, or self-reviewing code before submission.

## Patterns

### Pattern 1: Review Priorities (in order)
```
1. Design      - Does it fit the system architecture?
2. Functionality - Does it work correctly?
3. Complexity  - Is it easy to understand?
4. Tests       - Are tests correct and sufficient?
5. Naming      - Are names clear and descriptive?
6. Comments    - Are they necessary and helpful?
7. Style       - Does it follow conventions?
```
Source: https://google.github.io/eng-practices/review/reviewer/looking-for.html

### Pattern 2: Quick Review Checklist
```markdown
## Functionality
- [ ] Code does what PR description says
- [ ] Edge cases handled
- [ ] No obvious bugs

## Security
- [ ] No SQL injection, XSS, etc.
- [ ] Sensitive data not exposed
- [ ] Auth/authz properly implemented

## Performance
- [ ] No N+1 queries
- [ ] No unnecessary re-renders (React)
- [ ] Large data sets paginated

## Maintainability
- [ ] Code is readable without explanation
- [ ] No dead code or commented-out code
- [ ] DRY - no unnecessary duplication
```
Source: https://google.github.io/eng-practices/review/

### Pattern 3: Feedback Format
```markdown
# GOOD feedback
"Consider using `useMemo` here since this computation
runs on every render. See: [link to docs]"

# BAD feedback
"This is wrong" (no explanation)
"I would do it differently" (no actionable suggestion)
```

### Pattern 4: Review Decision
```
APPROVE:      - No blocking issues, minor nits OK
REQUEST_CHANGES: - Blocking issues that must be fixed
COMMENT:      - Questions or suggestions, no strong opinion
```

## Anti-Patterns

- **Nitpicking style** - Use linters, focus on substance
- **Rubber stamping** - Actually read and understand the code
- **Blocking on preferences** - Distinguish must-fix from nice-to-have
- **Delayed reviews** - Review within 24 hours

## Verification Checklist

- [ ] Read PR description first
- [ ] Understand the context/ticket
- [ ] Check all changed files
- [ ] Run code locally if complex
- [ ] Feedback is constructive and specific

## MonoPilot: Multi-Tenant Review

Additional checks for every MonoPilot PR:

```markdown
## Multi-Tenancy & Security
- [ ] Every Supabase query uses createServerSupabase() (not admin) for RLS
- [ ] No raw SQL without org_id filter
- [ ] No cross-org data leakage possible
- [ ] Permission check uses hasPermission() or requireRole()

## Data Integrity
- [ ] Zod validation on ALL API inputs
- [ ] LP system used for inventory (no loose quantities)
- [ ] BOM snapshots not modified after WO creation

## Conventions
- [ ] Services use static methods pattern
- [ ] Error handling uses handleApiError()
- [ ] Auth uses getAuthContextOrThrow()
- [ ] Tests use Vitest (vi.fn, NOT jest.fn)
```
