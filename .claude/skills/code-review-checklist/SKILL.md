---
name: code-review-checklist
description: Apply when reviewing pull requests, conducting code reviews, or self-reviewing code before submission.
version: 1.0.0
tokens: ~500
confidence: high
sources:
  - https://google.github.io/eng-practices/review/
  - https://github.com/google/eng-practices
last_validated: 2025-01-10
next_review: 2025-01-24
tags: [quality, review, checklist, best-practices]
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
