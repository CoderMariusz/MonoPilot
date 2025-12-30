# Code Review Report: Story 02.9 - BOM-Routing Link + Cost Calculation

**Reviewer**: CODE-REVIEWER Agent
**Date**: 2025-12-29
**Story**: 02.9 - BOM-Routing Link + Cost Calculation
**Epic**: 02 - Technical Module
**Phase**: Phase 5 - CODE REVIEW

---

## Executive Summary

**Decision**: REQUEST_CHANGES
**Severity**: CRITICAL - Tests Failing (22 failed / 15 passed)
**Recommendation**: Fix database mocking in tests before approval

### Quick Stats
- Files Reviewed: 19 files (5 backend, 14 frontend)
- Tests Status: RED (22 failed, 15 passed)
- Security Score: 6/10 (MAJOR issues found)
- Code Quality Score: 7/10 (MAJOR issues found)
- Business Logic Score: 8/10 (Minor issues)

---

## Review Decision Matrix

Per CODE-REVIEWER workflow: **"If tests FAIL → reject immediately"**

| Criteria | Status | Result |
|----------|--------|--------|
| All AC implemented | PASS | All acceptance criteria addressed |
| Tests pass with adequate coverage | FAIL | 22/37 tests failing (59% failure rate) |
| No critical/major security issues | FAIL | 2 CRITICAL, 3 MAJOR issues found |
| No blocking quality issues | FAIL | Duplicate code across 3 files |

**Outcome**: REQUEST_CHANGES (at least 1 blocking criterion failed)

---

## Issues Found

### CRITICAL Issues (MUST fix before approval)

#### CRITICAL-1: Tests Failing - Database Environment Issues
**File**: `apps/frontend/lib/services/__tests__/costing-service.test.ts`
**Lines**: 393-400, 429-439, 450-468, 547-559
**Severity**: CRITICAL

**Issue**: 22 out of 37 costing service tests are failing because they're attempting to connect to a real Supabase database instead of using mocks.

**Evidence**:
```
FAIL lib/services/__tests__/costing-service.test.ts > Costing Service - calculateTotalBOMCost > Error Handling > should return BOM_NOT_FOUND for non-existent BOM
AssertionError: expected 'DATABASE_ERROR' to be 'BOM_NOT_FOUND'
```

**Root Cause**: Test suite is not properly mocking `createServerSupabase()` function, causing actual database calls during test execution.

**Impact**:
- Cannot verify business logic correctness
- CI/CD pipeline will fail
- Blocks deployment to production

**Fix Required**:
```typescript
// In costing-service.test.ts, add mock setup:
import { vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockData, error: null }))
        }))
      }))
    }))
  }))
}))
```

---

#### CRITICAL-2: SQL Injection Risk in API Routes
**Files**:
- `apps/frontend/app/api/v1/technical/boms/[id]/cost/route.ts:84-136`
- `apps/frontend/app/api/v1/technical/boms/[id]/recalculate-cost/route.ts:84-161`
- `apps/frontend/app/api/v1/technical/routings/[id]/cost/route.ts:104-124`

**Severity**: CRITICAL (Security Vulnerability)

**Issue**: While Supabase uses parameterized queries which prevents classic SQL injection, the API routes are directly using user-supplied `id` parameter from URL without UUID validation before database query.

**Evidence**:
```typescript
// route.ts:82 - No validation before use
const { id } = await params

// route.ts:84 - Used directly in query
const { data: bom, error: bomError } = await supabase
  .from('boms')
  .select(...)
  .eq('id', id)  // <-- Unvalidated user input
```

**Attack Vector**: Malformed UUID could potentially cause database errors that leak information about database structure.

**Fix Required**:
```typescript
// Add UUID validation before database query
import { bomCostRequestSchema } from '@/lib/validation/costing-schema'

const { id } = await params

// Validate UUID format
const validation = bomCostRequestSchema.safeParse({ bom_id: id })
if (!validation.success) {
  return NextResponse.json(
    { error: 'Invalid BOM ID format', code: 'INVALID_UUID' },
    { status: 400 }
  )
}
```

---

### MAJOR Issues (Should fix before approval)

#### MAJOR-1: Code Duplication Across API Routes
**Files**:
- `apps/frontend/app/api/v1/technical/boms/[id]/cost/route.ts`
- `apps/frontend/app/api/v1/technical/boms/[id]/recalculate-cost/route.ts`
- `apps/frontend/app/api/v1/technical/routings/[id]/cost/route.ts`

**Severity**: MAJOR (Maintainability)

**Issue**: Cost calculation logic is duplicated 300+ lines across 3 different API route files. The exact same calculation code appears in:
- Lines 169-306 in `cost/route.ts`
- Lines 170-313 in `recalculate-cost/route.ts`
- Lines 149-212 in `routings/[id]/cost/route.ts`

**Impact**:
- Changes must be made in 3 places
- Risk of logic drift between implementations
- Violates DRY principle

**Recommendation**: Extract shared calculation logic to `costing-service.ts` and import into API routes.

**Fix Pattern**:
```typescript
// In lib/services/costing-service.ts
export async function calculateBOMCostFull(bomId: string, orgId: string) {
  // Move all calculation logic here
  // Return BOMCostResponse type
}

// In API routes
import { calculateBOMCostFull } from '@/lib/services/costing-service'

export async function GET(request: NextRequest, { params }: ...) {
  // Auth checks
  // ...

  const costData = await calculateBOMCostFull(id, userData.org_id)
  return NextResponse.json(costData)
}
```

---

#### MAJOR-2: Missing RLS Test Coverage
**File**: All API route files
**Severity**: MAJOR (Security)

**Issue**: No dedicated tests verify that RLS policies prevent cross-tenant data access. While RLS policies exist in migration `058_create_product_costs.sql`, there are no tests proving they work.

**AC Reference**: Story AC mentions "Returns 404 (not 403) for cross-tenant access" but no tests verify this.

**Required Tests**:
```typescript
// In route.test.ts
describe('RLS Enforcement', () => {
  it('should return 404 when accessing BOM from different org', async () => {
    // Setup: Create BOM in org-A
    // Login as user from org-B
    // Attempt to access org-A's BOM
    // Expect: 404 (not 403, to avoid info leak)
    expect(response.status).toBe(404)
  })
})
```

---

#### MAJOR-3: Performance - No Query Optimization
**Files**:
- `apps/frontend/app/api/v1/technical/boms/[id]/cost/route.ts:84-220`
- `apps/frontend/app/api/v1/technical/boms/[id]/recalculate-cost/route.ts:84-223`

**Severity**: MAJOR (Performance)

**Issue**: API routes make 3 sequential database queries:
1. BOM with items (line 84)
2. Routing operations (line 204)
3. Additional queries in service layer

This causes N+1 query problem for BOMs with many items.

**AC Reference**: "Performance: < 2s for 50 items" - Current implementation may not meet this.

**Evidence**:
```typescript
// Query 1 - Get BOM with nested items
const { data: bom } = await supabase.from('boms').select(`...`)

// Query 2 - Get operations (separate query)
const { data: operations } = await supabase
  .from('routing_operations')
  .select(`...`)
  .eq('routing_id', bom.routing_id)
```

**Recommendation**: Combine queries or use database views for better performance.

---

#### MAJOR-4: Error Handling - Generic Database Errors
**Files**: All API routes
**Lines**: catch blocks (lines 348-354, 397-403, 228-234)

**Severity**: MAJOR (Observability)

**Issue**: Catch blocks return generic 500 errors without logging structured error details for debugging.

**Evidence**:
```typescript
} catch (error) {
  console.error('GET BOM cost error:', error)  // <-- Only console.log
  return NextResponse.json(
    { error: 'Cost calculation failed', code: 'CALCULATION_ERROR' },
    { status: 500 }
  )
}
```

**Impact**:
- Difficult to debug production issues
- No error tracking/monitoring
- Lost context about failure reason

**Fix Required**:
```typescript
} catch (error) {
  // Structured logging with context
  logger.error('BOM cost calculation failed', {
    bomId: id,
    orgId: userData.org_id,
    userId: user.id,
    error: error instanceof Error ? error.message : 'Unknown',
    stack: error instanceof Error ? error.stack : undefined
  })

  // Return safe error to client
  return NextResponse.json(
    { error: 'Cost calculation failed', code: 'CALCULATION_ERROR' },
    { status: 500 }
  )
}
```

---

### MINOR Issues (Nice to have fixes)

#### MINOR-1: TypeScript Type Safety
**Files**: Multiple API routes
**Lines**: Various `as any` casts

**Issue**: Multiple unsafe type casts using `as any`:
```typescript
const routing = (bom as any).routing  // Line 163
const product = (bom as any).product  // Line 165
const component = (item as any).component  // Line 175
```

**Recommendation**: Define proper TypeScript interfaces for Supabase query results.

---

#### MINOR-2: Hardcoded Magic Numbers
**File**: `apps/frontend/app/api/v1/technical/boms/[id]/cost/route.ts:310`

**Issue**: Target margin percentage hardcoded to 30:
```typescript
const targetMarginPercent = 30 // Default target margin
```

**Recommendation**: Move to organization settings or configuration file.

---

#### MINOR-3: Inconsistent Error Codes
**Issue**: Error codes use different naming conventions:
- `BOM_NOT_FOUND` (snake_case)
- `UNAUTHORIZED` (UPPER_CASE)
- `CALCULATION_ERROR` (UPPER_CASE)

**Recommendation**: Standardize to one convention (preferably UPPER_CASE).

---

#### MINOR-4: Missing JSDoc Comments
**Files**: Multiple service functions

**Issue**: Complex calculation functions lack JSDoc documentation explaining parameters and return types.

**Example**:
```typescript
// Missing JSDoc
function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

// Should be:
/**
 * Round currency value to 2 decimal places
 * @param value - The number to round
 * @returns Rounded value with 2 decimal precision
 * @example roundCurrency(2.526) // Returns 2.53
 */
```

---

## Security Checklist Results

| Check | Status | Notes |
|-------|--------|-------|
| SQL injection prevention | FAIL | CRITICAL-2: Missing UUID validation |
| XSS prevention | PASS | No innerHTML usage, React sanitizes by default |
| Authentication bypass | PASS | All routes check auth.getUser() |
| RLS properly enforced | PARTIAL | Policies exist but tests missing (MAJOR-2) |
| Returns 404 for cross-tenant | UNKNOWN | No tests verify this behavior |
| No hardcoded secrets | PASS | No credentials in code |
| Input validation on endpoints | FAIL | CRITICAL-2: UUID not validated |
| Permission checks before mutation | PASS | Technical.U checked for POST |

**Overall Security Score**: 6/10 (MAJOR concerns)

---

## Code Quality Checklist Results

| Check | Status | Notes |
|-------|--------|-------|
| No TypeScript errors | PASS | Code compiles without errors |
| Consistent code style | PASS | ESLint rules followed |
| Proper error handling | PARTIAL | MAJOR-4: Generic errors, poor logging |
| No console.log in production | FAIL | Multiple console.error() calls |
| Comments where complex | PARTIAL | MINOR-4: Missing JSDoc |
| No dead code or unused imports | PASS | Clean imports |

**Overall Code Quality Score**: 7/10 (Room for improvement)

---

## Business Logic Validation

| Requirement | Status | Notes |
|-------------|--------|-------|
| Material cost formula correct | PASS | Matches PRD spec |
| Scrap percentage calculation | PASS | Correct: qty * (1 + scrap/100) |
| Labor rate hierarchy | PASS | BOM line > routing op > org default |
| Currency rounding to 2 decimals | PASS | roundCurrency() implementation correct |
| Performance < 2s for 50 items | UNKNOWN | MAJOR-3: No performance tests |
| Error handling: No routing | PASS | Returns 422 with message |
| Error handling: Missing costs | PASS | Returns 422 with ingredient list |
| Stale cost detection | PARTIAL | is_stale field present but logic unclear |

**Overall Business Logic Score**: 8/10 (Mostly correct)

---

## Acceptance Criteria Validation

### BOM-Routing Link
- AC-01: Routing dropdown shown - NOT VERIFIED (Frontend components incomplete)
- AC-02: Routing name displays with link - NOT VERIFIED (Frontend)
- AC-03: Error when no routing assigned - PASS (422 error returned)
- AC-04: Error prevents routing deletion - NOT VERIFIED (No DELETE endpoint reviewed)

### Material Cost Calculation (FR-2.36)
- AC-05: Material cost calculation within 500ms - UNKNOWN (No tests)
- AC-06: Scrap percentage added correctly - PASS (Code verified)
- AC-07: Error for missing ingredient cost - PASS (Returns 422 with details)
- AC-08: Current cost_per_unit value used - PASS (Queries products table)

### Operation Labor Cost (FR-2.50, FR-2.73)
- AC-09: Operation labor cost calculated - PASS (Formula verified)
- AC-10: Setup time cost calculation - PASS (Line 235)
- AC-11: Cleanup time cost calculation - PASS (Line 237)
- AC-12: Org default labor rate used - NOT IMPLEMENTED (No fallback logic)

### Routing-Level Costs (FR-2.51, FR-2.52, FR-2.53, FR-2.77)
- AC-13: Fixed setup cost added - PASS (Line 262)
- AC-14: Working cost per unit calculated - PASS (Line 264)
- AC-15: Overhead percentage applied - PASS (Line 281)
- AC-16: Routing defaults to 0 - PASS (Uses `|| 0` pattern)

### Total Cost Calculation (FR-2.72)
- AC-17: Total cost formula correct - PASS (Lines 291-292)
- AC-18: Cost per unit rounded to 2 decimals - PASS (Line 292)
- AC-19: product_costs record created - PASS (Lines 341-355)

### Cost Breakdown Display
- AC-20-25: UI components - NOT VERIFIED (Frontend review needed)

### API Endpoints
- AC-26: GET /boms/:id/cost returns breakdown - PASS (Verified)
- AC-27: POST recalculate-cost creates record - PASS (Verified)
- AC-28: GET /routings/:id/cost returns routing cost - PASS (Verified)

### Permission Enforcement
- AC-29: User without technical.R gets 403 - PASS (Lines 74-79)
- AC-30: Read-only user hides recalculate button - NOT VERIFIED (Frontend)

**AC Coverage**: 18/30 PASS, 10 NOT VERIFIED (Frontend), 2 UNKNOWN

---

## Test Coverage Analysis

### Unit Tests
**File**: `apps/frontend/lib/services/__tests__/costing-service.test.ts`
**Status**: 22 FAILED / 15 PASSED (59% failure rate)

**Failed Tests**:
1. `should return BOM_NOT_FOUND for non-existent BOM` - Database mock issue
2. `should calculate cost per unit correctly` - Database mock issue
3. `should round unit cost to 2 decimal places` - Database mock issue
4. `should include currency in result` - Database mock issue
5. `should round currency values to 2 decimal places` - Database mock issue
... (17 more failures)

**Root Cause**: All failures due to CRITICAL-1 (database mocking issue)

### Integration Tests
**Status**: NOT FOUND

No integration tests exist for:
- API route testing
- End-to-end cost calculation flow
- RLS policy enforcement

**Recommendation**: Add integration tests using Playwright or Vitest with real Supabase test instance.

### Performance Tests
**Status**: NOT FOUND

AC requires "< 2s for 50 items" but no performance tests exist.

**Coverage Estimate**: ~40% (only unit tests, many failing)

---

## Positive Findings

1. EXCELLENT: Cost calculation formula correctly implements PRD specification
2. GOOD: Comprehensive error handling for missing ingredient costs
3. GOOD: Proper permission checks (technical.R for GET, technical.U for POST)
4. GOOD: RLS policies correctly implemented in migration file
5. GOOD: Consistent use of roundCurrency() for precision
6. GOOD: Zod validation schemas well-defined
7. GOOD: TypeScript types properly defined in costing.ts
8. EXCELLENT: Detailed cost breakdown structure matches PRD exactly
9. GOOD: Margin analysis implementation correct
10. GOOD: Stale cost warning functionality present

---

## Recommendations

### Immediate Actions (Required before approval)

1. FIX CRITICAL-1: Implement proper database mocking in tests
   - Priority: P0
   - Estimated effort: 2-4 hours
   - Blocker: Yes

2. FIX CRITICAL-2: Add UUID validation before database queries
   - Priority: P0
   - Estimated effort: 1 hour
   - Blocker: Yes

3. FIX MAJOR-1: Extract duplicate calculation logic to service
   - Priority: P1
   - Estimated effort: 3-4 hours
   - Blocker: No, but strongly recommended

### Short-term Improvements (Should do)

4. ADD MAJOR-2: RLS enforcement tests
   - Priority: P1
   - Estimated effort: 2 hours

5. FIX MAJOR-4: Structured error logging
   - Priority: P2
   - Estimated effort: 1-2 hours

6. ADD Performance tests for AC-05 (500ms requirement)
   - Priority: P2
   - Estimated effort: 2 hours

### Long-term Improvements (Nice to have)

7. FIX MINOR-1: Remove `as any` type casts
8. FIX MINOR-2: Move magic numbers to config
9. FIX MINOR-3: Standardize error code naming
10. ADD MINOR-4: JSDoc comments for public functions

---

## Files Reviewed

### Backend Files (5)
1. `apps/frontend/app/api/v1/technical/boms/[id]/cost/route.ts` - 356 lines
2. `apps/frontend/app/api/v1/technical/boms/[id]/recalculate-cost/route.ts` - 405 lines
3. `apps/frontend/app/api/v1/technical/routings/[id]/cost/route.ts` - 236 lines
4. `apps/frontend/lib/validation/costing-schema.ts` - 154 lines
5. `apps/frontend/lib/types/costing.ts` - 151 lines

### Frontend Files (14)
6. `apps/frontend/components/technical/bom/cost/CostSummary.tsx` - 132 lines
7. `apps/frontend/components/technical/bom/cost/CostBreakdownChart.tsx`
8. `apps/frontend/components/technical/bom/cost/MarginAnalysis.tsx`
9. `apps/frontend/components/technical/bom/cost/RecalculateButton.tsx`
10. `apps/frontend/components/technical/bom/cost/StaleCostWarning.tsx`
11. `apps/frontend/components/technical/bom/cost/CostSummaryLoading.tsx`
12. `apps/frontend/components/technical/bom/cost/CostSummaryEmpty.tsx`
13. `apps/frontend/components/technical/bom/cost/CostSummaryError.tsx`
14-19. Additional cost-related components

### Database Files (1)
20. `supabase/migrations/058_create_product_costs.sql` - 165 lines

### Service Files (2)
21. `apps/frontend/lib/services/costing-service.ts` - 342 lines
22. `apps/frontend/lib/services/__tests__/costing-service.test.ts` - Tests failing

**Total Lines Reviewed**: ~2,500 lines

---

## Blockers for Approval

1. CRITICAL-1: Tests failing (22/37 failures) - BLOCKER
2. CRITICAL-2: UUID validation missing - BLOCKER
3. MAJOR-2: No RLS tests - STRONG BLOCKER

**Estimated Time to Fix Blockers**: 4-6 hours

---

## Handoff Instructions

### To DEV (for fixes):

**Priority Fixes Required**:
1. Fix database mocking in `costing-service.test.ts`
2. Add UUID validation to all API routes
3. Extract duplicate calculation logic to service layer
4. Add RLS enforcement tests

**Context**:
- Story: 02.9 - BOM-Routing Link + Cost Calculation
- Files: Listed above
- Test command: `pnpm test -- costing-service.test.ts`

**Expected Output**:
- All 37 tests passing (0 failures)
- UUID validation on all API endpoints
- Single source of truth for calculation logic
- RLS tests proving cross-tenant isolation

### To QA (after fixes):

**Test Scenarios**:
1. Create BOM with routing, verify cost calculation
2. Try accessing BOM from different org (should 404)
3. Test with invalid UUID (should 400)
4. Test with 50 items (should complete < 2s)
5. Test missing ingredient costs (should error)
6. Test margin analysis with std_price set
7. Test recalculate cost creates product_costs record

---

## Conclusion

Story 02.9 implements a comprehensive cost calculation system with correct business logic and good structure. However, **CRITICAL test failures and security concerns block approval**.

The core calculation logic is solid and matches PRD requirements. The main issues are:
1. Test infrastructure not properly configured
2. Input validation gaps
3. Code duplication reducing maintainability

**Estimated effort to address blockers**: 4-6 hours
**Recommended action**: REQUEST_CHANGES with immediate focus on test fixes

Once blockers are resolved, this will be a high-quality implementation ready for production.

---

## Review Metadata

- Story ID: 02.9
- Reviewer: CODE-REVIEWER Agent
- Review Date: 2025-12-29
- Review Duration: 45 minutes
- Files Reviewed: 19
- Lines Reviewed: ~2,500
- Issues Found: 2 CRITICAL, 4 MAJOR, 4 MINOR
- Decision: REQUEST_CHANGES
- Next Reviewer: DEV (for fixes)
