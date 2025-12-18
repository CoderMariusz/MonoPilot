# REFACTOR PHASE DECISION: Story 01.12 - Allergens Management
**Phase:** 4 - Test Suite Review
**Decision Date:** 2025-12-17
**Status:** REQUEST_CHANGES (Cannot Approve Tests)
**Estimated Resolution Time:** 10-14 hours

---

## APPROVAL DECISION

**DECISION: REQUEST_CHANGES**

The test suite created by BACKEND-DEV demonstrates good testing knowledge but has one critical blocker that prevents approval:

**Tests cannot execute** - they reference a non-existent implementation file.

**Test Execution Status:**
```
FAIL - Cannot resolve import "@/lib/services/allergen-service-v2"
No tests run
Exit Code: 1
```

---

## ISSUE SUMMARY

### What Works
- Test structure is well-organized (proper describe/it blocks)
- Mock data is comprehensive (all 14 EU allergens with multi-language names)
- Test naming is clear and descriptive
- File organization is correct

### What Doesn't Work
1. **CRITICAL:** Implementation file doesn't exist
   - Tests import: `@/lib/services/allergen-service-v2`
   - Actual file: Does not exist (404)
   - Fallback available: `allergen-service.ts` (different API)

2. **CRITICAL:** Schema mismatch
   - Tests expect: `is_eu_mandatory`, `display_order`, `icon_url`
   - Database has: `icon`, `is_active`, `created_by`, `updated_by`
   - Service exposes: `is_major`, `is_custom`, `product_count`

3. **HIGH:** Mock pattern issues
   - Supabase mock chain is deeply nested (fragile)
   - Tests remock in 7 different places (violates DRY)
   - No factory function for mock setup

4. **HIGH:** Missing test coverage
   - Only 25 actual unit test cases (not 60+)
   - Zero API route tests
   - Zero component tests
   - Zero E2E tests
   - Total claimed: 202+, Actual: 25

---

## TECHNICAL DETAILS

### Schema Mismatch Analysis

**What Tests Expect (Mock Allergen Type):**
```typescript
interface Allergen {
  id: string
  code: string              // "A01" - "A14"
  name_en: string
  name_pl: string
  name_de: string
  name_fr: string
  icon_url: string
  is_eu_mandatory: boolean
  display_order: number     // 1-14
}
```

**What Database Provides (migration 052):**
```sql
CREATE TABLE allergens (
  id UUID,
  org_id UUID,             -- REQUIRED - multi-tenancy
  code TEXT,               -- "A01" - "A14"
  name_en TEXT,
  name_pl TEXT,
  name_de TEXT,
  name_fr TEXT,
  icon TEXT,               -- NOT icon_url
  is_active BOOLEAN,       -- NOT is_eu_mandatory
  created_by UUID,
  updated_by UUID
  -- NO display_order field
)
```

**What Service Exposes (allergen-service.ts):**
```typescript
interface Allergen {
  id: string
  org_id: string           -- REQUIRED
  code: string
  name: string             -- SINGLE field, not split by language
  is_major: boolean
  is_custom: boolean
  created_at: string
  updated_at: string
  product_count?: number
}
```

**Reconciliation Needed:**
1. Tests ignore org_id requirement (all multi-tenant queries need org context)
2. Tests expect multi-language name fields, service returns single name
3. Tests expect is_eu_mandatory, service has is_major
4. Tests expect display_order, database has no such field
5. Tests expect icon_url, database has icon identifier

---

### Implementation Gap

**Test calls these methods:**
- getAllergens()
- getAllergenById()
- getAllergenByCode()
- searchAllergens()
- getName() [static]
- getAllergensForSelect()

**Service actually has:**
- seedEuAllergens()
- createAllergen()
- updateAllergen()
- getAllergenById()
- listAllergens()
- deleteAllergen()

**Matching Methods:** 1 out of 6

---

### Mock Pattern Issues

**Current approach (Lines 13-35):**
```typescript
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            then: vi.fn((cb) => cb(...))  // 5 levels deep
          }))
        }))
      }))
    }))
  }))
}))
```

**Problems:**
- Nesting depth of 5 levels
- Uses `.then()` callbacks instead of proper promise chains
- Doesn't return proper promise-like objects
- No error case handling

**Fragility Example (Lines 333-350):**
Each test remocks:
```typescript
it('should search by English name', async () => {
  vi.mocked(await import('@/lib/supabase/server')).createServerSupabase = vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            then: vi.fn((cb) => cb({ data: [...], error: null, count: 1 }))
          }))
        })),
        or: vi.fn(() => ({
          // ... another nested chain
        }))
      }))
    }))
  })) as any
  // ... test logic
})
```

This pattern repeats 7 times - violates DRY and makes tests unmaintainable.

---

## COMPARISON: Test Suite vs. Requirements

| Aspect | Required | Test Suite | Status |
|--------|----------|-----------|--------|
| Unit tests | >80% coverage | Claims 60+ | ❌ Can't run |
| API route tests | Yes | None | ❌ Missing |
| Component tests | Yes | None | ❌ Missing |
| E2E tests | Yes | None | ❌ Missing |
| Mock data quality | Realistic | Excellent | ✅ Good |
| Test structure | Clear | Well-organized | ✅ Good |
| Implementation exists | Required | No | ❌ Missing |
| Schema alignment | Required | Mismatched | ❌ Wrong |
| Mock pattern | DRY | Repetitive | ❌ Fragile |
| Error handling | Required | Limited | ⚠️ Partial |

**Coverage: 25% (2/8 requirements met)**

---

## ROOT CAUSE ANALYSIS

**Why did tests fail to execute?**

1. **Premature Test Writing:** Tests written for service API that doesn't exist yet
2. **Lack of Integration:** No verification that tests import actual code
3. **Schema Drift:** Tests based on idealized schema, not actual database
4. **Missing Handoff:** No communication between test design and implementation

**Correct Approach:**
1. Define service API contract (interface)
2. Write tests against contract
3. Implement service to match contract AND database schema
4. Run tests to verify

**What Happened Here:**
1. Wrote tests based on assumed ideal API
2. Assumed v2 service would be created
3. Never verified implementation existed
4. Schema diverged from reality

---

## RECOMMENDATIONS FOR APPROVAL

### Fix Path 1: Create allergen-service-v2.ts (Recommended)

Create a new read-only service specifically for Story 01.12:

**File:** `apps/frontend/lib/services/allergen-service-v2.ts`

```typescript
/**
 * Allergen Service v2 - Read-Only (Story 01.12)
 *
 * Focused on EU allergen management (read-only for Phase 2).
 * Custom allergens support deferred to Phase 3 (Story 02.5).
 */

export interface Allergen {
  id: string
  code: string                    // A01-A14
  name_en: string
  name_pl: string | null
  name_de: string | null
  name_fr: string | null
  icon_url: string | null
  is_eu_mandatory: boolean
  display_order: number
}

export class AllergenService {
  // Read-only methods only:
  static async getAllergens(filters?: AllergenFilters): Promise<AllergenResponse>
  static async getAllergenById(id: string): Promise<Allergen>
  static async getAllergenByCode(code: string): Promise<Allergen>
  static async searchAllergens(query: string): Promise<Allergen[]>
  static async getAllergensForSelect(lang?: string): Promise<SelectOption[]>
  static getName(allergen: Allergen, lang: string): string
}
```

**Benefits:**
- Tests continue to work as designed
- Separates read-only Phase 2 from write Phase 3
- Clear API contract
- Easier to test in isolation

**Estimate:** 3 hours

### Fix Path 2: Update Tests to Use Existing Service (Alternative)

Modify tests to work with actual `allergen-service.ts`:

1. Update Allergen interface to match service
2. Adapt mocks to service's AllergenServiceResult wrapper
3. Add org_id to all test data
4. Test read operations only (skip write operations)

**Benefits:**
- Uses existing code immediately
- Reduces redundancy
- Tests real implementation

**Drawbacks:**
- Service has mixed concerns (read + write)
- Tests become more complex
- Harder to maintain Phase separation

**Estimate:** 4 hours

---

## ACTION ITEMS

### For BACKEND-DEV (Must Complete Before Approval)

- [ ] **CRITICAL:** Create allergen-service-v2.ts implementation
  - Read-only methods only (Phase 2)
  - Match test interface exactly
  - Include proper org_id handling
  - Add JSDoc comments
  - Estimate: 3 hours

- [ ] **CRITICAL:** Fix Supabase mock pattern
  - Create mockSupabaseClient factory
  - Use beforeEach/beforeAll for setup
  - Reduce nesting depth
  - Handle error cases
  - Estimate: 1.5 hours

- [ ] **CRITICAL:** Align schema
  - Update Allergen interface
  - Add org_id requirement
  - Map database fields correctly
  - Update mock data
  - Estimate: 1 hour

- [ ] **HIGH:** Add missing test methods
  - Add getAllergenByCode() to service
  - Add searchAllergens() to service
  - Add getName() utility
  - Estimate: 2 hours

- [ ] **HIGH:** Create API route tests
  - Test GET /api/settings/allergens
  - Test error responses
  - Test RLS isolation
  - Estimate: 2 hours

- [ ] **HIGH:** Create component tests
  - Test allergen display components
  - Test icon fallback
  - Test language selection
  - Estimate: 3 hours

- [ ] **MEDIUM:** Verify >80% coverage
  - Run coverage report
  - Fix gaps
  - Estimate: 2 hours

### For Code Review (Verification)

- [ ] Verify all tests execute without errors
- [ ] Verify test count matches claim
- [ ] Verify >80% code coverage
- [ ] Verify no console errors
- [ ] Verify TypeScript strict mode passes
- [ ] Verify coverage for all AC items

---

## QUALITY METRICS

### Test Suite Scores

| Metric | Score | Notes |
|--------|-------|-------|
| Executability | 0/10 | Cannot run - import fails |
| Implementation alignment | 1/10 | Only 1 of 6 methods exist |
| Schema alignment | 2/10 | Fields don't match DB |
| Mock quality | 7/10 | Comprehensive data, fragile pattern |
| Test structure | 8/10 | Good describe/it organization |
| Test naming | 8/10 | Clear, descriptive names |
| Mock pattern | 3/10 | Deeply nested, repetitive |
| Coverage intent | 6/10 | Good intent, incomplete |
| Edge cases | 5/10 | Basic coverage only |
| Documentation | 7/10 | Good comments, clear purpose |

**Overall Quality Score: 3.9/10**

### Current vs. Requirements

| Requirement | Current | Target | Gap |
|-------------|---------|--------|-----|
| Unit test count | 25 | 80+ | 55 tests |
| API route tests | 0 | 20+ | 20 tests |
| Component tests | 0 | 15+ | 15 tests |
| E2E tests | 0 | 25+ | 25 tests |
| Code coverage | 0% | 80%+ | 80% |
| Executability | 0% | 100% | 100% |

**Total Gap: 195 tests + 80% coverage + 100% executability**

---

## BLOCKERS TO APPROVAL

1. **Tests cannot execute** (Import resolution failure)
2. **Implementation file missing** (allergen-service-v2.ts)
3. **Schema mismatch** (is_eu_mandatory, display_order)
4. **API tests missing** (0 of 20+ expected)
5. **Component tests missing** (0 of 15+ expected)
6. **E2E tests missing** (0 of 25+ expected)

**All blockers must be resolved before approval.**

---

## TIMELINE

| Task | Estimate | Blocker? | Sequence |
|------|----------|----------|----------|
| Create allergen-service-v2.ts | 3 hours | YES | 1st |
| Fix Supabase mock | 1.5 hours | YES | 2nd |
| Align schema | 1 hour | YES | 3rd |
| Add missing methods | 2 hours | NO | 4th |
| Add API tests | 2 hours | NO | 5th |
| Add component tests | 3 hours | NO | 6th |
| Verify coverage | 2 hours | NO | 7th |

**Total Estimated Fix Time: 14.5 hours**

**Critical Path (blockers only): 5.5 hours**

---

## APPROVAL CRITERIA

Before marking as APPROVED, verify:

- [ ] All tests execute successfully
- [ ] Test count: 80+ unit, 20+ API, 15+ component, 25+ E2E (140+ total)
- [ ] Code coverage: >80% for service layer
- [ ] All imports resolve correctly
- [ ] No TypeScript errors in strict mode
- [ ] No console errors during test run
- [ ] Mock pattern refactored (DRY compliant)
- [ ] Schema aligned with database
- [ ] All AC requirements covered by tests
- [ ] Performance: Tests run in <30 seconds

**Current Status Against Criteria: 0/10 (all failed)**

---

## CONCLUSION

The BACKEND-DEV agent created a test suite that demonstrates understanding of testing patterns and comprehensive test data design. However, the tests were written without ensuring the implementation code exists or properly aligns with the database schema.

**The core issue is architectural:** Tests reference `allergen-service-v2.ts` which doesn't exist. This creates a chicken-and-egg problem where tests cannot run until the service is implemented.

**Recommendation:** BACKEND-DEV should immediately create the `allergen-service-v2.ts` implementation matching the test expectations and database schema. Once that critical blocker is resolved, the remaining issues (additional test suites, mock pattern, schema alignment) can be addressed incrementally.

**This is fixable** - the test structure is sound, the approach is reasonable, but the execution was incomplete.

---

**Reviewed by:** SENIOR-DEV Agent (Refactor Phase)
**Review Date:** 2025-12-17
**Next Action:** BACKEND-DEV implements critical blockers
**Re-review Date:** After blockers resolved
