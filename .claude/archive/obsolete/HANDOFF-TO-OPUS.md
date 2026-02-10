# HANDOFF TO OPUS: Fix 5 Remaining E2E Tests

**Date**: 2026-01-25
**From**: Claude Sonnet 4.5 (master-e2e-test-writer)
**Status**: 11/16 passing → Need 16/16

---

## Quick Context (5h work already done)

✅ **Fixed**: Critical schema bug (36 files), seeding system created, routes corrected
❌ **Remaining**: 5 tests fail - all same pattern (APIs fail, pages stuck in error state)

**Full context**: `.claude/EPIC-04-FINAL-REPORT.md`

---

## Your Task: Fix These 5 Tests

1. `e2e/tests/production/consumption-desktop.spec.ts:25`
2. `e2e/tests/production/dashboard.spec.ts:31`
3. `e2e/tests/production/dashboard.spec.ts:39`
4. `e2e/tests/production/settings.spec.ts:22`
5. `e2e/tests/production/wo-lifecycle.spec.ts:24`

**Root cause hypothesis**: APIs can't read `org_id` from session → RLS fails → pages error

---

## Step 1: View Screenshots

```bash
pnpm exec playwright show-report
```

See what pages actually show (errors? loading? blank?)

---

## Step 2: Debug APIs

**Add to API route/middleware**:
```typescript
console.log('Session org_id:', session?.user?.user_metadata?.org_id);
```

**Run test**:
```bash
pnpm test:e2e e2e/tests/production/dashboard.spec.ts:31
```

Check console for errors.

---

## Step 3: Likely Fixes

### If org_id missing from session:
- Fix: `e2e/auth.setup.ts` - ensure session has org_id

### If middleware doesn't extract org_id:
- Fix: `apps/frontend/middleware.ts` - extract from session.user.user_metadata.org_id

### If APIs crash on missing tables:
- Fix: Add try-catch (example in production-dashboard-service.ts line 60)

---

## Step 4: Verify

```bash
pnpm test:e2e e2e/tests/production
# Target: 16/16 passing
```

---

## Key Files

- `e2e/auth.setup.ts` - Auth setup
- `apps/frontend/middleware.ts` - Session handling
- `apps/frontend/app/api/production/*/route.ts` - APIs
- Test data: WO=`wo-id-123`, LP=`LP-001`, org from seed script

---

## Success = 16/16 Passing + Commit

Expected time: 2-3h

**Start with screenshots!** 🔍
