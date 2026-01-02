# BUG-03-12-001: Description field hardcoded as NULL in WO operations copy

**Bug ID**: BUG-03-12-001
**Story**: 03.12 - WO Operations (Routing Copy)
**Severity**: CRITICAL
**Status**: OPEN
**Date Found**: 2025-12-31
**Assignee**: BACKEND-DEV

---

## Summary

The `copy_routing_to_wo()` function in migration 076 hardcodes the `description` field as NULL instead of copying from `routing_operations.description`. This violates AC-05 (description copy) and causes data loss.

---

## Impact

- **Acceptance Criteria Failed**: AC-01, AC-05
- **Feature Impact**: Operation descriptions are lost during routing copy
- **User Impact**: Planners cannot see operation details from routing definitions
- **Data Loss**: Yes - descriptions discarded on WO release
- **Blocks QA**: CRITICAL - Cannot pass story

---

## Root Cause

The migration function comment incorrectly states "description not in routing_operations" (line 142), but:
1. routing_operations table (migration 047) includes a `description` field
2. The comment is misleading/wrong
3. Result: description is hardcoded as NULL instead of copied

---

## Current Code

**File**: `supabase/migrations/076_create_wo_operations_table.sql`
**Lines**: 137-151

```sql
INSERT INTO wo_operations (
  wo_id,
  organization_id,
  sequence,
  operation_name,
  description,           -- Target field
  instructions,
  machine_id,
  line_id,
  expected_duration_minutes,
  expected_yield_percent,
  status
)
SELECT
  p_wo_id,
  p_org_id,
  ro.sequence,
  ro.operation_name,
  NULL,                  -- BUG: Should be ro.description
  ro.instructions,
  ro.machine_id,
  ro.line_id,
  COALESCE(ro.expected_duration_minutes, 0) + COALESCE(ro.setup_time_minutes, 0) + COALESCE(ro.cleanup_time_minutes, 0),
  ro.expected_yield_percent,
  'pending'
FROM routing_operations ro
WHERE ro.routing_id = v_routing_id
ORDER BY ro.sequence;
```

---

## Required Fix

**Option 1: Copy description (Recommended)**

Change line 142 from:
```sql
NULL,  -- description not in routing_operations
```

To:
```sql
ro.description,  -- Copy description from routing_operations
```

---

## Verification Steps

### Before Fix
1. Check routing_operations schema:
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'routing_operations'
ORDER BY column_name;
-- Should show: description column exists
```

2. Create test data and verify bug:
```sql
SELECT operation_name, description FROM wo_operations;
-- Shows: ('Test Op', NULL)  -- BUG: description is NULL
```

### After Fix
1. Apply corrected migration
2. Verify:
```sql
SELECT operation_name, description FROM wo_operations;
-- Should show: ('Test Op', 'Test Description')  -- FIXED
```

---

## Test Cases Affected

| Test | Status | Reason |
|------|--------|--------|
| AC-01: Copy operations on release | FAIL | Operations copied but description=NULL |
| AC-05: Description copy | FAIL | Description not copied (NULL) |
| All other AC | PASS | Unaffected by this bug |

---

## Migration Roll-Forward Plan

Since this migration is new (not applied to production yet):

**Recommended Approach**: Fix before deploy
1. Fix line 142 in migration 076
2. Ensure description field is copied from routing_operations
3. Re-test migration

---

## Testing Instructions

After fix:

1. **Unit Test**: Verify description in test mock
2. **Integration Test**: Create WO with routing, verify description copied
3. **AC-05 Test**: Description should match source routing operation

---

## Risk Assessment

- **Risk of Fix**: Very Low (1 line change)
- **Risk of Not Fixing**: High (data loss, AC failure)
- **Complexity**: Trivial
- **Testing Effort**: 15 minutes

---

## Acceptance Criteria

Fix is complete when:
- [ ] Line 142 changed from `NULL,` to `ro.description,`
- [ ] Migration tested with data
- [ ] AC-01 test passes
- [ ] AC-05 test passes
- [ ] Unit tests still pass (27/27)
- [ ] QA re-validation: PASS

---

## Sign-Off

**Found by**: QA-AGENT
**Date**: 2025-12-31
**Priority**: CRITICAL - Blocks story acceptance
**Fix Priority**: IMMEDIATE

---

## Files

- Migration: `supabase/migrations/076_create_wo_operations_table.sql`
- QA Report: `docs/2-MANAGEMENT/epics/current/03-planning/context/03.12/QA-REPORT.md`

