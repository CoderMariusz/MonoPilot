# NPD Module Test Suite

This directory contains test scripts for Epic NPD-6 retrospective action items.

## Action Item #2: RLS Policy Verification

**File:** `npd-rls-verification.sql`
**Owner:** Dana (QA Engineer)
**Purpose:** Verify multi-tenant isolation for NPD tables
**Duration:** ~2 minutes to execute

### How to Run

1. Open **Supabase Dashboard** → SQL Editor
2. Copy contents of `tests/npd-rls-verification.sql`
3. Paste into SQL Editor
4. Click **Run**
5. Review results - all tests should show `PASS ✅`

### Expected Results

```
TEST 1A: Org A SELECT → 1 row → PASS ✅
TEST 1B: Org A Data Integrity → org_id=9001 → PASS ✅
TEST 2A: Org B SELECT → 1 row → PASS ✅
TEST 2B: Org B Data Integrity → org_id=9002 → PASS ✅
TEST 3: Cross-org INSERT blocked → PASS ✅
TEST 4: Cross-org UPDATE blocked → 0 rows → PASS ✅
TEST 5: Cross-org DELETE blocked → 0 rows → PASS ✅
TEST 6: Child table RLS (npd_formulations) → 0 rows → PASS ✅
```

### What It Tests

- ✅ Org A can only see Org A data (SELECT isolation)
- ✅ Org B can only see Org B data (SELECT isolation)
- ✅ Org A cannot INSERT with Org B's org_id (INSERT protection)
- ✅ Org A cannot UPDATE Org B's data (UPDATE protection)
- ✅ Org A cannot DELETE Org B's data (DELETE protection)
- ✅ Child tables (npd_formulations) inherit RLS via FK (child table isolation)

## Action Item #3: Temporal Versioning Smoke Test

**File:** `npd-temporal-versioning-test.sql`
**Owner:** Charlie (Senior Dev)
**Purpose:** Validate EXCLUDE constraints and immutability triggers
**Duration:** ~2 minutes to execute

### How to Run

1. Open **Supabase Dashboard** → SQL Editor
2. Copy contents of `tests/npd-temporal-versioning-test.sql`
3. Paste into SQL Editor
4. Click **Run**
5. Review results - all tests should show `PASS ✅`

### Expected Results

```
TEST 1 PASSED ✅: Non-overlapping formulations created successfully
TEST 2 PASSED ✅: EXCLUDE constraint blocked overlapping formulation
TEST 3 PASSED ✅: EXCLUDE constraint blocked exact date overlap
TEST 4 PASSED ✅: Superseded formulation with overlapping dates allowed
TEST 5 SETUP: Formulation v1.0 locked
TEST 6 PASSED ✅: Immutability trigger blocked update to locked formulation
TEST 7 PASSED ✅: Exactly 1 current version found (is_current_version = TRUE)
TEST 8 PASSED ✅: Cannot manually assign to GENERATED column
```

### What It Tests

- ✅ Non-overlapping dates allowed (v1.0: 2025-01-01 to 2025-06-30, v2.0: 2025-07-01 to NULL)
- ✅ EXCLUDE constraint prevents overlapping dates (v3.0: 2025-06-01 to 2025-08-31 → BLOCKED)
- ✅ EXCLUDE constraint prevents exact overlap (v4.0: same dates as v1.0 → BLOCKED)
- ✅ Superseded formulations excluded from overlap check (v1.0-OLD with status='superseded' → ALLOWED)
- ✅ Locked formulations cannot be edited (UPDATE blocked by trigger)
- ✅ GENERATED column `is_current_version` auto-calculated correctly
- ✅ GENERATED column cannot be manually set (database enforced)

## Test Data Cleanup

Both scripts include automatic cleanup at the end. Test projects are deleted after tests complete.

**Test org_id Values:**
- 9001: Test Org A (RLS test)
- 9002: Test Org B (RLS test)
- 9003: Temporal Test Org (temporal test)

**Note:** `org_id` is an INTEGER column (no organizations table exists). Test values 9001-9003 are hardcoded for testing purposes.

## Success Criteria

**Action Item #2 Complete:** All 6 RLS tests pass (multi-tenant isolation confirmed)
**Action Item #3 Complete:** All 8 temporal tests pass (EXCLUDE constraints + triggers work correctly)

## Next Steps After Testing

Once both action items are verified:
1. Update Epic NPD-6 retrospective document with test results
2. Mark action items as complete in sprint-status.yaml
3. Start Epic NPD-1 Story 1 (NPDProjectsAPI CRUD operations)

---

**Created:** 2025-11-16
**Epic:** NPD-6 (Database Schema & Infrastructure)
**Retrospective:** docs/sprint-artifacts/epic-npd-6-retro-2025-11-16.md
