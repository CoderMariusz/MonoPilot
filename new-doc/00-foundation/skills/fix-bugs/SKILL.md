---
name: fix-bugs
description: >-
  Batch bug fixer. Takes a list of bugs, categorizes them by type
  (API, UI, data), routes to developer agents, and coordinates
  parallel fixes. Use when user reports multiple bugs to fix.
user-invocable: true
argument-hint: "[bug descriptions]"
---

# Bug Batch Fixer

You are a bug-fixing orchestrator. When invoked, follow these steps STRICTLY.

## STEP 1: CATALOG

Parse user's bug descriptions into a structured table. For each bug determine:

- **Category**: API | UI | DATA | AUTH | PERF
- **Severity**: CRITICAL (blocking) | HIGH (major feature broken) | MEDIUM (minor) | LOW (cosmetic)
- **Estimated files**: Based on category and description
- **Complexity**: SIMPLE (<10 LOC) | MEDIUM (10-100 LOC) | COMPLEX (>100 LOC or architecture)

Present the catalog to the user:

```
## Bug Catalog

| # | Bug | Category | Severity | Est. Files | Complexity |
|---|-----|----------|----------|-----------|------------|
| 1 | {description} | API | HIGH | route.ts, service.ts | MEDIUM |
| 2 | {description} | UI | MEDIUM | Modal.tsx | SIMPLE |
| 3 | {description} | DATA | MEDIUM | hook.ts, Table.tsx | MEDIUM |
```

## STEP 2: GATHER INFO

For each bug, check if you have enough info to fix. If NOT, ask the user:

**API bugs**: "Which endpoint? (e.g., /api/warehouse/receiving)"
**UI bugs**: "Which component/page? (e.g., ReceivingForm in /warehouse)"
**DATA bugs**: "Which table/field? Expected vs actual value?"
**AUTH bugs**: "Which role should have access? What's the error?"

Ask all questions at once using AskUserQuestion (don't ask one at a time).

## STEP 3: LOCATE FILES

For each bug, find the actual files:

```bash
# API bug → find route file
# Pattern: apps/frontend/app/api/{module}/{resource}/route.ts

# UI bug → find component
# Pattern: apps/frontend/components/{module}/{Component}.tsx

# DATA bug → find service + hook
# Pattern: apps/frontend/lib/services/{module}-service.ts
# Pattern: apps/frontend/hooks/use{Feature}.ts
```

Use Grep/Glob to confirm files exist before routing to agents.

## STEP 4: ANALYZE DEPENDENCIES

Determine execution order:

```
Different files → PARALLEL (fix simultaneously)
Same file → SEQUENTIAL (fix one at a time)
Bug B depends on Bug A → SEQUENTIAL (fix A first)
```

## STEP 5: ROUTE TO AGENTS

For each bug, create a Task:

```
Task(developer): FIX-{N} {category}
Bug: {user's description}
File: {exact path from Step 3}
Steps:
  1. Read the file, identify the issue
  2. Check if test exists for this case - if not, write one
  3. Fix the code (minimal change)
  4. Run: pnpm test
Exit: tests pass, bug fixed
```

**Parallel rules**:
- Max 3 parallel developer agents
- Different files = parallel
- Same file = sequential (queue them)

## STEP 6: VERIFY

After ALL agents finish:

```
Task(quality): VERIFY-BATCH
Check:
  1. Run pnpm test - all must pass
  2. Run ./ops check - build must succeed
  3. For each bug: verify the specific fix works
  4. Check for regressions (new failures)
Report: PASS/FAIL per bug
```

## STEP 7: REPORT

Present final results:

```
## Fix Report

| # | Bug | Status | Files Changed | Tests |
|---|-----|--------|--------------|-------|
| 1 | API nie dziala | FIXED | route.ts:45 | +2 tests |
| 2 | Modal nie zamyka | FIXED | Modal.tsx:23 | +1 test |
| 3 | Tabela nie aktualizuje | FIXED | hook.ts:12, Table.tsx:89 | +1 test |

All tests: PASS ({N}/{N})
Build: PASS
Regressions: 0
```

If any bug is NOT fixed, explain why and suggest next steps.

## CATEGORY ROUTING

| Category | Typical Files | Common Fixes |
|----------|--------------|-------------|
| API | route.ts, service.ts | Missing org_id filter, wrong status code, Zod schema mismatch |
| UI | Component.tsx, page.tsx | Missing onClick handler, state not updating, wrong CSS class |
| DATA | service.ts, hook.ts, Component.tsx | Wrong query, missing refetch, stale cache, wrong field mapping |
| AUTH | route.ts, middleware | Missing role check, wrong permission level, session expired |
| PERF | Any | N+1 query, missing index, excessive re-renders, no memoization |

## SEVERITY → RESPONSE

| Severity | Action |
|----------|--------|
| CRITICAL | Fix FIRST, all other bugs wait. Run tests immediately after. |
| HIGH | Fix in parallel with other HIGH bugs. |
| MEDIUM | Fix after CRITICAL/HIGH resolved. |
| LOW | Fix last. Can be deferred if time constrained. |