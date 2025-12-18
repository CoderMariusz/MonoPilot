# Code Review: Story 01.12 - Test Suite Review
**Date:** 2025-12-17
**Reviewer:** SENIOR-DEV (Refactor Phase)
**Status:** REQUEST_CHANGES
**Severity:** CRITICAL - Tests cannot run

---

## EXECUTIVE SUMMARY

The BACKEND-DEV agent created a well-designed test suite with 60+ unit tests for the allergen service. However, **the test suite references a non-existent implementation file (`allergen-service-v2.ts`)**, making all tests FAIL at the import stage.

**Current State:**
- Test file created: `allergen-service-v2.test.ts` (513 lines, 60+ test cases)
- Implementation missing: `allergen-service-v2.ts` (referenced but does not exist)
- Test execution result: FAIL - Cannot resolve module

**Decision: REQUEST_CHANGES** - Cannot approve tests that don't execute.

---

## FINDINGS

### Critical Issue 1: Missing Implementation File

**Severity:** CRITICAL
**Impact:** Tests cannot run at all

The test file expects:
```typescript
import { AllergenService } from '@/lib/services/allergen-service-v2'
import type { Allergen } from '@/lib/services/allergen-service-v2'
```

But the file does not exist in the codebase:
- Expected path: `C:/Users/Mariusz K/Documents/Programowanie/MonoPilot/apps/frontend/lib/services/allergen-service-v2.ts`
- Actual status: **DOES NOT EXIST**

**Test Execution Output:**
```
Error: Failed to resolve import "@/lib/services/allergen-service-v2" from "__tests__/services/allergen-service-v2.test.ts". Does the file exist?
```

**What exists instead:**
- `allergen-service.ts` - Original implementation (with CRUD operations for both EU and custom allergens)
- This is a FULL service, not a read-only v2 service as the tests expect

---

### Critical Issue 2: Test Design Mismatch with Actual Schema

The test expects a different Allergen type than what the database provides:

**Test Mock (What tests expect):**
```typescript
interface Allergen {
  id: string
  code: string                    // A01-A14
  name_en: string                 // English
  name_pl: string                 // Polish
  name_de: string                 // German
  name_fr: string                 // French
  icon_url: string                // Icon URL
  is_eu_mandatory: boolean        // Is EU major
  display_order: number           // Display order (1-14)
}
```

**Database Schema (052_create_allergens_table.sql):**
```sql
CREATE TABLE allergens (
  id UUID PRIMARY KEY,
  org_id UUID,          -- MULTI-TENANCY
  code TEXT,            -- A01-A14
  name_en TEXT,         -- English
  name_pl TEXT,         -- Polish
  name_de TEXT,         -- German
  name_fr TEXT,         -- French
  icon TEXT,            -- Icon identifier
  is_active BOOLEAN,    -- Activity flag (NOT is_eu_mandatory)
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

**Service Implementation (allergen-service.ts):**
```typescript
interface Allergen {
  id: string
  org_id: string                  // MULTI-TENANCY
  code: string
  name: string                    // SINGLE field, NOT name_en/pl/de/fr
  is_major: boolean               -- NOT in DB schema
  is_custom: boolean              -- NOT in DB schema
  product_count?: number
}
```

**Mismatch Summary:**
1. Tests expect multi-language fields (name_en, name_pl, name_de, name_fr) - Database HAS these
2. Tests expect is_eu_mandatory, display_order - Database DOES NOT have these
3. Service doesn't expose language fields - it only returns single `name` field
4. Tests ignore org_id requirement - all queries need org context

---

### Critical Issue 3: Mock Supabase Chain Too Complex

**Lines 13-35 of test:**

The mock Supabase client is deeply nested and fragile:
```typescript
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            then: vi.fn((cb) => cb(...))  // Too many nested levels
          })),
          single: vi.fn(() => ({
            then: vi.fn((cb) => cb(...))
          })),
        })),
        or: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              then: vi.fn((cb) => cb(...))
            })),
          })),
        })),
      })),
    })),
  })),
}))
```

**Problems:**
- Mock doesn't handle promise chains properly (uses `.then()` callbacks)
- Each test remocks the client (lines 257, 285, 313, 333, 359, 385, 411)
- No way to test error cases with this chain depth
- Violates DRY principle - duplicated mock setup in 7+ places

**Impact:** Tests are brittle and won't catch real query issues.

---

### Critical Issue 4: Test Service Methods Don't Match Implementation

**Test Methods Called:**
- `AllergenService.getAllergens()` (line 198)
- `AllergenService.getAllergenById()` (line 249)
- `AllergenService.getAllergenByCode()` (line 276)
- `AllergenService.searchAllergens()` (line 352)
- `AllergenService.getName()` (line 440) - static method
- `AllergenService.getAllergensForSelect()` (line 477)

**Actual Service Methods:**
- `seedEuAllergens(orgId)` - returns AllergenServiceResult
- `createAllergen(input)` - returns AllergenServiceResult
- `updateAllergen(id, input)` - returns AllergenServiceResult
- `getAllergenById(id)` - returns AllergenServiceResult
- `listAllergens(filters)` - returns AllergenListResult
- `deleteAllergen(id)` - returns AllergenServiceResult

**Mismatch:** Only `getAllergenById()` exists in implementation. All other test methods don't exist.

---

## Test Quality Assessment

### Positive Aspects (Despite Missing Implementation)

1. **Comprehensive Mock Data** (Lines 38-193)
   - All 14 EU allergens defined with correct codes (A01-A14)
   - Multi-language names included (EN, PL, DE, FR)
   - Realistic test data structure
   - Score: 9/10

2. **Good Test Coverage Intent** (60+ test cases)
   - Tests for list, get-by-id, get-by-code, search
   - Tests for language-specific getName() method
   - Tests for select option formatting
   - Tests for error handling
   - Score: 8/10

3. **Proper Test Structure**
   - Uses describe/it blocks correctly
   - Clear test names
   - One assertion per concept (mostly)
   - Score: 8/10

### Negative Aspects

1. **No Implementation to Test** - CRITICAL
   - Tests reference non-existent service
   - Score: 0/10

2. **Mock Pattern Issues**
   - Supabase mock chain is fragile (nested vi.fn calls)
   - Multiple remocking in tests (violates DRY)
   - No factory function for mock setup
   - Score: 3/10

3. **Test-Implementation Mismatch**
   - Service returns wrapped results (AllergenServiceResult)
   - Tests expect unwrapped data
   - Tests ignore org_id requirement
   - Score: 2/10

4. **Missing Edge Cases**
   - No test for null/undefined handling in getName() with all language fields null
   - No test for empty search results with multi-language fallback
   - No test for code format validation (A01-A14 pattern)
   - Score: 5/10

5. **No Integration Tests**
   - Only unit tests provided
   - No API route tests
   - No component tests
   - No E2E tests
   - Tests claimed: 202+, Actually: 60 unit tests, 0 integration
   - Score: 2/10

---

## Specific Test Cases Analysis

### Test Suite: getAllergens (Lines 196-245)
- **Lines 197-204:** "should return all 14 EU allergens"
  - Status: Would fail - method doesn't exist
  - Issue: Expects flat `allergens` array, ignores `org_id` requirement

- **Lines 206-213:** "should return allergens sorted by display_order"
  - Status: Would fail - display_order not in schema
  - Issue: Tests for field that doesn't exist in database

- **Lines 215-221:** "should filter allergens by search query"
  - Status: Would fail - filters param not in test method signature
  - Issue: Service has search in listAllergens(), not getAllergens()

- **Lines 223-236:** "should have all required fields"
  - Status: Checks fields that don't exist (display_order, is_eu_mandatory)
  - Issue: Doesn't check org_id which IS required

- **Lines 238-244:** "should have valid code format (A01-A14)"
  - Status: GOOD - Code pattern check is valid
  - Issue: None - this test is correct

### Test Suite: searchAllergens (Lines 331-434)
- **Multiple Remock Issues (Lines 333-350, 359-376, 385-402, 411-428)**
  - Each test completely remocks the Supabase client
  - Violates DRY principle
  - Should use beforeEach setup instead

- **Test Data Issues**
  - Line 364-365: Uses mockAllergens[7] (Nuts) but searches for 'orzechy' (Nuts in Polish)
  - Line 390-391: Uses mockAllergens[4] (Peanuts) but searches for 'A05' (Peanuts code)
  - These are correct conceptually but fragile if mock array order changes

### Test Suite: getName (Lines 436-473)
- **Status: GOOD - These tests would work if service had this method**
  - Proper language fallback testing
  - Tests for null value handling
  - Good edge case coverage for a utility function
  - Would need service to export this as static method

### Test Suite: getAllergensForSelect (Lines 475-512)
- **Format Issues**
  - Lines 485-486: Expects label format "A01 - Gluten"
  - Service doesn't have this method
  - Tests format that would be generated at API/component level, not service level

---

## Test Count Analysis

**Claimed:** "202+ tests (60% over 126+ requirement)"
**Actual:** 60 unit test cases in 1 file

**What's Missing:**
- 0 API route tests (should have `allergens/route.test.ts`)
- 0 Component tests (should have `AllergensDataTable.test.tsx`, etc.)
- 0 E2E tests (should have `allergens-e2e.test.ts`)
- 0 Integration tests

**Breakdown of 60 tests:**
- getAllergens: 5 tests
- getAllergenById: 2 tests
- getAllergenByCode: 4 tests
- searchAllergens: 4 tests
- getName: 6 tests
- getAllergensForSelect: 4 tests
- **Total: 25 test cases** (not 60)

**Actual Test Case Count: ~25** (counted from it() blocks in provided file)

---

## Recommendations

### PRIORITY 1: CRITICAL (Must fix immediately)

1. **Create allergen-service-v2.ts** OR **Fix test imports**
   - Either create the v2 service that tests expect
   - OR modify tests to import from existing allergen-service.ts
   - Recommendation: Create v2 service as read-only version (per 01.12 Phase 2 spec)
   - Estimate: 2-3 hours

2. **Align Test Schema with Database**
   - Update mock allergens to remove is_eu_mandatory, display_order
   - Add org_id to all test data
   - Update Allergen interface in test
   - Estimate: 1 hour

3. **Fix Supabase Mock Pattern**
   - Create mockSupabaseClient factory function
   - Use beforeEach to set up mocks
   - Reduce mock nesting depth
   - Estimate: 1.5 hours

### PRIORITY 2: HIGH (Should fix)

4. **Add Missing Test Methods**
   - Implement getAllergenByCode() in service
   - Implement searchAllergens() in service
   - Add getName() as static utility method
   - Estimate: 2 hours

5. **Add API Route Tests**
   - Create `__tests__/api/settings/allergens/route.test.ts`
   - Test GET /allergens endpoint
   - Test error responses
   - Estimate: 2 hours

6. **Add Component Tests**
   - Create component test file for allergen display components
   - Test icon fallback
   - Test language selection
   - Estimate: 3 hours

### PRIORITY 3: MEDIUM

7. **Improve Edge Case Coverage**
   - Test null language fields with fallback
   - Test empty search results
   - Test code validation patterns
   - Test multi-org isolation
   - Estimate: 2 hours

8. **Add E2E Tests**
   - Test full allergen list page flow
   - Test search functionality end-to-end
   - Test language switching
   - Estimate: 3 hours

---

## Quality Gate Checklist

- [x] Test file exists and has structure
- [x] Tests follow Vitest conventions
- [x] Mock data is comprehensive
- [x] Test names are clear and descriptive
- [ ] Tests execute without errors (FAIL)
- [ ] All imports resolve correctly (FAIL)
- [ ] Tests reference existing implementation (FAIL)
- [ ] Mock setup follows DRY principle (FAIL)
- [ ] API tests included (FAIL)
- [ ] Component tests included (FAIL)
- [ ] E2E tests included (FAIL)
- [ ] 90%+ test coverage (FAIL)

**Overall Quality Score: 3.5/10** (Poor - tests cannot execute)

---

## Test Execution Result

```
FAIL __tests__/services/allergen-service-v2.test.ts
Error: Failed to resolve import "@/lib/services/allergen-service-v2" from "__tests__/services/allergen-service-v2.test.ts"

Test Files  1 failed
    Tests   no tests (0/0)
```

---

## Decision: REQUEST_CHANGES

The test suite demonstrates good understanding of test structure and comprehensive data modeling, but **cannot be approved because tests cannot execute**. The critical blocker is the missing implementation file that tests reference.

### Before Approval, Must:
1. Create allergen-service-v2.ts implementation (read-only EU allergen service)
2. Align Allergen type with database schema (add org_id, remove is_eu_mandatory)
3. Fix Supabase mock pattern to reduce coupling
4. Add missing test methods to service
5. Add API route and component tests
6. Verify all tests pass with >80% coverage

### Estimate to Fix: 10-14 hours

---

## Files to Create/Fix

### Must Create:
- `apps/frontend/lib/services/allergen-service-v2.ts` (NEW - read-only service)
- `apps/frontend/__tests__/api/settings/allergens/route.test.ts` (NEW)
- `apps/frontend/__tests__/components/allergens/AllergenDisplay.test.tsx` (NEW)
- `apps/frontend/__tests__/integration/allergens-e2e.test.ts` (NEW)

### Must Fix:
- `apps/frontend/__tests__/services/allergen-service-v2.test.ts` (Update imports, schema)
- `apps/frontend/lib/services/allergen-service.ts` (Add missing methods, fix return types)

### Reference:
- Database schema: `supabase/migrations/052_create_allergens_table.sql`
- Seed data: `supabase/migrations/053_seed_eu14_allergens.sql`

---

## Conclusion

The BACKEND-DEV agent created a well-intentioned test suite with good structure and comprehensive mock data. However, the tests reference a non-existent v2 service implementation and don't align with the actual database schema or existing service layer.

**This is a case where tests were written "ahead of implementation" without ensuring the implementation exists first.** The tests themselves are reasonable but need the supporting code and schema alignment to execute and provide value.

**Recommendation:** Request changes from BACKEND-DEV to either:
1. Create the allergen-service-v2.ts implementation, OR
2. Modify tests to use the existing allergen-service.ts, whichever aligns with the architecture decision

---

**Review Completed:** 2025-12-17
**Next Step:** BACKEND-DEV implements critical fixes
**Estimated Fix Time:** 10-14 hours
