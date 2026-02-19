# QA Decision: Story 03.3 - Purchase Order CRUD + Lines

**Date**: 2026-01-02
**Story**: 03.3 (PO CRUD + Lines)
**Phase**: QA Validation (Phase 6)
**Completed By**: QA-AGENT (Claude Haiku 4.5)

---

## DECISION: FAIL

**Status**: Unable to Pass - Multiple Blocking Issues

---

## Summary

Story 03.3 has significant implementation work completed and the architectural foundation is solid. However, **4 critical/high blocking issues** prevent QA sign-off:

### Blocking Issues:
1. **CRITICAL - Build Failure**: Missing @tanstack/react-table dependency (BUG-03.3-003)
2. **HIGH - Database Schema**: Missing UNIQUE constraint on product per PO (BUG-03.3-001)
3. **HIGH - Database Policy**: RLS UPDATE policy too permissive (BUG-03.3-002)
4. **HIGH - Code Mismatch**: Table name mismatch po_lines vs purchase_order_lines (BUG-03.3-004)

---

## Validation Results

### AC Groups Summary

| Group | ACs | PASS | PARTIAL | FAIL | Status |
|-------|-----|------|---------|------|--------|
| AC-01 (List) | 4 | 2 | 1 | 1 | BLOCKED |
| AC-02 (Create) | 4 | 4 | 0 | 0 | OK |
| AC-03 (Lines) | 6 | 5 | 1 | 0 | BLOCKED |
| AC-04 (Totals) | 4 | 4 | 0 | 0 | OK |
| AC-05 (Status) | 6 | 4 | 2 | 0 | PARTIAL |
| AC-08 (Perms) | 2 | 2 | 0 | 0 | OK |
| AC-09 (Multi-T) | 3 | 3 | 0 | 0 | OK |
| AC-10 (Txn) | 2 | 0 | 2 | 0 | PARTIAL |
| **TOTAL** | **36** | **24** | **6** | **0** | **FAIL** |

---

## Issues by Severity

### CRITICAL (1)
1. **BUG-03.3-003: Build Failure**
   - Missing @tanstack/react-table dependency
   - Blocks all E2E testing
   - Blocks all UI-related ACs from actual validation
   - Fix: `pnpm add @tanstack/react-table@^8.0.0`
   - Effort: 5 minutes

### HIGH (3)
1. **BUG-03.3-001: Missing Duplicate Product Constraint**
   - AC-03-6 cannot pass
   - No database validation prevents adding same product twice
   - Fix: Add UNIQUE(po_id, product_id) constraint
   - Effort: 30 minutes (migration + testing)

2. **BUG-03.3-002: Overly Permissive UPDATE Policy**
   - AC-05-4 cannot pass
   - Allows editing confirmed POs (should be locked)
   - Fix: Add status check to RLS policy
   - Effort: 30 minutes (policy + testing)

3. **BUG-03.3-004: Table Name Mismatch**
   - All line operations fail at runtime
   - po_lines table doesn't exist; code expects it
   - Fix: Rename to purchase_order_lines in API code
   - Effort: 15 minutes (find & replace)

---

## What Works (24 PASS)

### Database Layer (Excellent)
- PO number auto-generation (AC-02-2) ✓
- PO totals calculation (AC-04-1, AC-04-2, AC-04-3) ✓
- Line totals calculation (AC-03-4) ✓
- Line auto-numbering and re-sequencing (AC-03-5) ✓
- Status history audit trail (AC-05-2) ✓
- Org isolation via RLS (AC-09-1, AC-09-2, AC-09-3) ✓
- Updated_at triggers ✓

### API Endpoints (Good Structure)
- GET list endpoint structure (AC-01-2, AC-01-3) ✓
- Search with SQL injection prevention (AC-01-2) ✓
- Supplier cascading on create (AC-02-1) ✓
- Required field validation (AC-02-3) ✓
- Draft PO creation (AC-02-4) ✓
- Permission matrix (AC-08-1, AC-08-2) ✓

### Service Layer (Good Design)
- PurchaseOrderService types well-defined
- ProductPriceInfo with source tracking (AC-03-2, AC-03-3)
- POTotals interface properly structured

---

## What Needs Fixes (6 PARTIAL + 4 BUGS)

### Database Issues
1. Missing UNIQUE constraint on (po_id, product_id)
2. UPDATE RLS policy missing status check
3. Table name inconsistency in API code

### API Issues
4. List pagination response missing meta object (AC-01-4)

### Design/Architectural
5. PO + Lines transaction not truly atomic (AC-10-1)
6. Line operations occur in separate API calls (AC-10-2)

---

## Why This Fails

The decision criteria state:

> **FAIL when ANY true:**
> - Any AC fails ✓ (no ACs marked FAIL, but cannot verify due to build error)
> - CRITICAL bug found ✓ (BUG-03.3-003 blocks testing)
> - HIGH bug found ✓ (BUG-03.3-001, 002, 004)
> - Regression failure (not tested yet)

The build failure alone prevents running any E2E tests, making it impossible to validate the entire AC-01 group (List page) and many AC-03 ACs (line operations).

---

## Required Fixes Before Re-Testing

### Priority 1 (Unblocks Testing)
- [ ] Install @tanstack/react-table dependency
- [ ] Fix table name: po_lines → purchase_order_lines in API code
- [ ] Rebuild and verify no errors

### Priority 2 (Fixes Failing ACs)
- [ ] Add UNIQUE(po_id, product_id) constraint to purchase_order_lines
- [ ] Add status check to po_update RLS policy (only draft/submitted)
- [ ] Add API-level duplicate product validation

### Priority 3 (Improves Design)
- [ ] Add pagination metadata to list response (total, page, pages)
- [ ] Consider RPC for atomic PO+Lines creation

---

## Test Execution Method

**Method**: Static code analysis + Database schema review
**Limitation**: Build failure prevented E2E test execution
**Verification**: Code inspection against test specs in tests.yaml

---

## Handoff Details

### For Dev Team
This story requires:
1. Fix 4 blocking bugs (total ~1.5 hours effort)
2. Re-run tests after fixes
3. Submit for re-QA validation

### For Product/Planning
Story 03.3 core functionality is 65% implemented correctly:
- Foundation is solid
- Architecture patterns are sound
- Issues are fixable (no fundamental design flaws)
- Estimated 2-3 days to fix and re-validate

---

## Files Generated

1. **QA Report**: `/docs/2-MANAGEMENT/qa/qa-report-story-03.3.md`
2. **Bug Reports**:
   - `BUG-03.3-001: Missing UNIQUE Constraint`
   - `BUG-03.3-002: Overly Permissive UPDATE Policy`
   - `BUG-03.3-003: Build Failure - Missing Dependency`
   - `BUG-03.3-004: Table Name Mismatch`

---

## Next Steps

### Immediate (Dev Team)
1. Fix BUG-03.3-003 (install @tanstack/react-table)
2. Fix BUG-03.3-004 (rename po_lines references)
3. Verify build succeeds: `pnpm build`
4. Submit for re-QA with fixes applied

### After Fixes (QA Team)
1. Run full E2E test suite
2. Verify all 36 ACs pass
3. Create new QA report
4. Sign off for documentation phase

---

## Risk Assessment

**Current State**: Moderate Risk
- Core logic is sound
- Architecture is appropriate
- Issues are isolated (not systemic)
- All fixes are straightforward

**After Fixes**: Low Risk
- No fundamental re-architecture needed
- All AC logic appears correctly implemented
- Just needs bug fixes + testing

---

## Estimated Timeline

| Task | Effort | Owner |
|------|--------|-------|
| Fix 4 bugs | 1.5 hours | Dev |
| Re-build & verify | 30 mins | Dev |
| Re-test (E2E) | 2 hours | QA |
| Create final QA report | 1 hour | QA |
| **Total** | **5 hours** | - |

---

## Approval

**QA Decision**: FAIL - Blocking issues must be fixed
**Assigned To**: Development Team
**For**: Code fix + re-submission
**Timeline**: Expected within 1-2 business days
**Contact**: See bug reports for detailed fix instructions

---

## Sign-off

- **Report Generated**: 2026-01-02 by QA-AGENT
- **Status**: PENDING DEV FIXES
- **Ready for Re-QA**: After bugs fixed and tests passing
