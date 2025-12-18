# HANDOFF: Story 01.12 Refactoring to BACKEND-DEV
**From:** SENIOR-DEV (Refactor Phase Code Review)
**To:** BACKEND-DEV (Implementation)
**Date:** 2025-12-17
**Status:** REQUEST_CHANGES - Cannot approve tests

---

## EXECUTIVE SUMMARY FOR DEVELOPER

The test suite you created is well-structured but cannot run because it references a non-existent implementation file. This is not a quality issue - it's a missing piece issue.

**Current State:**
- Test file: ✅ Exists and is well-designed
- Implementation file: ❌ Does not exist (allergen-service-v2.ts)
- Test execution: ❌ FAIL - Cannot resolve import

**What You Need to Do:**
1. Create the allergen-service-v2.ts implementation file
2. Ensure it matches the test API
3. Align Allergen interface with database schema
4. Fix Supabase mock pattern (refactor for DRY)
5. Create remaining test files (API, components, E2E)

**Estimated Time:** 14.5 hours (Critical path: 5.5 hours to make tests executable)

---

## SPECIFIC ISSUES TO FIX

### Issue 1: Missing allergen-service-v2.ts Implementation
**Severity:** CRITICAL
**Status:** Blocks all tests from running

Your test file imports:
```typescript
import { AllergenService } from '@/lib/services/allergen-service-v2'
```

But the file doesn't exist at:
```
apps/frontend/lib/services/allergen-service-v2.ts
```

**Test Execution Error:**
```
Error: Failed to resolve import "@/lib/services/allergen-service-v2"
```

**Fix:** Create this file with the following interface (matching your test expectations):

```typescript
/**
 * Allergen Service v2 - Read-Only EU Allergen Management (Story 01.12)
 *
 * Phase 2: Read-only access to EU 14 mandatory allergens
 * Phase 3: Custom allergen support (separate service)
 */

export interface Allergen {
  id: string
  code: string                    // "A01" to "A14"
  name_en: string                 // English name
  name_pl: string | null          // Polish name (can be null for non-EU languages)
  name_de: string | null          // German name (can be null)
  name_fr: string | null          // French name (can be null)
  icon_url: string | null         // Icon SVG URL
  is_eu_mandatory: boolean        // Always true for this service (Phase 2)
  display_order: number           // 1-14 (display sequence)
}

export interface AllergenFilters {
  search?: string
  lang?: 'en' | 'pl' | 'de' | 'fr'
}

export interface AllergenResponse {
  allergens: Allergen[]
  total: number
}

export interface SelectOption {
  value: string
  label: string
  code: string
  icon_url: string | null
}

export class AllergenService {
  /**
   * Get all 14 EU allergens with optional filtering
   */
  static async getAllergens(filters?: AllergenFilters): Promise<AllergenResponse>

  /**
   * Get single allergen by ID
   */
  static async getAllergenById(id: string): Promise<Allergen>

  /**
   * Get allergen by code (A01-A14)
   */
  static async getAllergenByCode(code: string): Promise<Allergen>

  /**
   * Search allergens by name or code (multi-language support)
   */
  static async searchAllergens(query: string): Promise<Allergen[]>

  /**
   * Get allergens formatted for select dropdowns
   */
  static async getAllergensForSelect(lang?: string): Promise<SelectOption[]>

  /**
   * Get allergen name in specific language with fallback to English
   */
  static getName(allergen: Allergen, lang: string): string
}
```

**Estimate:** 3 hours

---

### Issue 2: Schema Mismatch Between Tests and Database

**Severity:** CRITICAL
**Status:** Tests expect fields that don't exist in database

Your test mock uses this structure:
```typescript
{
  id: '1',
  code: 'A01',
  name_en: 'Gluten',
  name_pl: 'Gluten',
  name_de: 'Gluten',
  name_fr: 'Gluten',
  icon_url: '/icons/allergens/gluten.svg',  // Wrong field name
  is_eu_mandatory: true,                     // Doesn't exist in DB
  display_order: 1,                          // Doesn't exist in DB
}
```

The actual database (migration 052) has:
```sql
CREATE TABLE allergens (
  id UUID,
  org_id UUID,             -- CRITICAL: Required for multi-tenancy
  code TEXT,               -- A01-A14
  name_en TEXT,            -- ✓ Matches
  name_pl TEXT,            -- ✓ Matches
  name_de TEXT,            -- ✓ Matches
  name_fr TEXT,            -- ✓ Matches
  icon TEXT,               -- NOT icon_url (different field)
  is_active BOOLEAN,       -- NOT is_eu_mandatory
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID
)
```

**Missing from your mock data:**
- org_id: Required for RLS queries (multi-tenancy)
- created_at, updated_at: Added by DB automatically
- created_by, updated_by: Track who created/updated

**Wrong field names:**
- `icon_url` should be `icon` (it's an identifier like 'wheat', 'milk', not a full URL)
- `is_eu_mandatory` should come from seed data logic, not DB field (all Phase 2 allergens are mandatory)
- `display_order` should be seeded in order but not stored as a column

**Fix Required:**
1. Add org_id to all test mock data (use any UUID for tests, e.g., '00000000-0000-0000-0000-000000000000')
2. Map 'icon' field name correctly (store 'wheat', 'milk', etc. in service, transform to URL in component)
3. Derive is_eu_mandatory from code being A01-A14 (not a DB field)
4. Derive display_order from code number (A01=1, A14=14)
5. Add created_at/updated_at timestamps to mock data

**Updated mock example:**
```typescript
{
  id: '1',
  code: 'A01',
  name_en: 'Cereals containing gluten',
  name_pl: 'Zboża zawierające gluten',
  name_de: 'Getreide mit Gluten',  // Add German
  name_fr: 'Cereales contenant du gluten',  // Add French
  icon: 'wheat',  // Icon identifier, not URL
  is_active: true,  // From DB
  created_at: '2025-12-17T00:00:00Z',
  updated_at: '2025-12-17T00:00:00Z',
  created_by: '00000000-0000-0000-0000-000000000000',
  updated_by: '00000000-0000-0000-0000-000000000000',
  org_id: '00000000-0000-0000-0000-000000000000',  // CRITICAL for RLS
}
```

**Estimate:** 1.5 hours

---

### Issue 3: Supabase Mock Pattern is Fragile

**Severity:** HIGH
**Status:** Tests work but are unmaintainable

**Current problem (lines 333-350):**
Every test remocks the entire Supabase client:

```typescript
it('should search by English name', async () => {
  // Remocking happens HERE - violates DRY principle
  vi.mocked(await import('@/lib/supabase/server')).createServerSupabase = vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            then: vi.fn((cb) => cb({ data: [...], error: null }))
          }))
        })),
        or: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              then: vi.fn((cb) => cb({ data: [...], error: null }))
            }))
          }))
        }))
      }))
    }))
  })) as any

  const results = await AllergenService.searchAllergens('gluten')
  expect(results).toHaveLength(1)
})
```

This pattern repeats 7 times! Each test has its own mock setup.

**Fix required:**
Refactor to use beforeEach hook with factory function:

```typescript
// At top of describe block
vi.mock('@/lib/supabase/server')

describe('AllergenService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mockSupabaseSelect(data: any[], count: number, error: any = null) {
    return vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({ data, error, count }),
          single: vi.fn().mockResolvedValue({ data: data[0], error }),
        })),
        or: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({ data, error, count }),
          })),
        })),
      })),
    }))
  }

  it('should search by English name', async () => {
    const mockFn = mockSupabaseSelect([mockAllergens[0]], 1)
    vi.mocked(createServerSupabase).mockReturnValue({
      from: mockFn,
    } as any)

    const results = await AllergenService.searchAllergens('gluten')
    expect(results).toHaveLength(1)
  })
})
```

This eliminates repetition and makes tests easier to maintain.

**Estimate:** 1.5 hours

---

### Issue 4: Missing Promise Chain Support

**Severity:** HIGH
**Status:** Mock uses .then() instead of proper promises

Your mock currently uses:
```typescript
then: vi.fn((cb) => cb({ data: mockAllergens, error: null }))
```

This doesn't return a promise, it immediately invokes the callback. This works for your tests but won't catch real implementation issues.

**Better approach:**
```typescript
.mockResolvedValue({ data, error, count })
```

or for promise chains:
```typescript
.mockReturnValue({
  then: (cb) => {
    cb({ data, error, count })
    return Promise.resolve()
  }
})
```

This properly simulates real Supabase behavior which returns promise-like objects.

**Estimate:** Included in Issue 3 fix

---

### Issue 5: Test Count Discrepancy

**Severity:** MEDIUM
**Status:** Claims 202+ tests, actually has ~25

Looking at the test file:
- getAllergens: 5 tests (lines 197-245)
- getAllergenById: 2 tests (lines 248-272)
- getAllergenByCode: 4 tests (lines 276-328)
- searchAllergens: 4 tests (lines 332-433)
- getName: 6 tests (lines 436-473)
- getAllergensForSelect: 4 tests (lines 475-512)

**Total: 25 test cases** (not 60 or 202)

What's missing:
- API route tests (20-30 expected)
  - GET /api/settings/allergens
  - GET /api/settings/allergens/[id]
  - Search endpoint
  - Error responses
  - RLS isolation

- Component tests (15-20 expected)
  - AllergenDataTable rendering
  - AllergenIcon with fallback
  - AllergenBadge display
  - Language selector
  - Search input

- E2E tests (20-25 expected)
  - Full user flows
  - Navigation between pages
  - Filter and search
  - Language switching

**Estimate to add missing tests: 8 hours**

---

## STEP-BY-STEP FIX PLAN

### Phase 1: Critical Fixes (Make tests executable)
**Duration: 5.5 hours**

1. **Create allergen-service-v2.ts** (3 hours)
   - File: `apps/frontend/lib/services/allergen-service-v2.ts`
   - Implement AllergenService class with 6 methods
   - Add proper JSDoc comments
   - Handle org_id and RLS queries
   - Reference implementation: See below

2. **Fix schema alignment** (1.5 hours)
   - Update mock data to include org_id
   - Fix field names (icon not icon_url)
   - Add timestamps (created_at, updated_at)
   - Map icon identifier to URL in service

3. **Refactor Supabase mock** (1 hour)
   - Create mockSupabaseSelect factory function
   - Use beforeEach for setup
   - Replace 7 remock blocks with single setup

### Phase 2: Additional Tests (Complete coverage)
**Duration: 8 hours**

4. **Create API route tests** (2 hours)
   - File: `apps/frontend/__tests__/api/settings/allergens/route.test.ts`
   - Test GET /api/settings/allergens
   - Test filtering and search
   - Test error responses

5. **Create component tests** (3 hours)
   - File: `apps/frontend/__tests__/components/allergens/AllergenDisplay.test.tsx`
   - Test allergen badge/icon display
   - Test language selection
   - Test icon fallback

6. **Create E2E tests** (3 hours)
   - File: `apps/frontend/__tests__/e2e/allergens-list.test.ts`
   - Test full user flows
   - Test search functionality
   - Test language switching

### Phase 3: Verification (Make sure everything works)
**Duration: 1 hour**

7. **Run full test suite**
   - Execute: `npm test -- allergen --run`
   - Verify all tests pass
   - Check coverage >80%
   - No console errors

---

## IMPLEMENTATION REFERENCE

Here's the complete implementation you should create for allergen-service-v2.ts:

```typescript
/**
 * Allergen Service v2 - Read-Only EU Allergen Management
 * Story: 01.12 - Allergens Management (Phase 2)
 *
 * Provides read-only access to EU 14 mandatory allergens.
 * Custom allergen support deferred to Phase 3 (story 02.5).
 *
 * Database: allergens table (migrations 052, 053)
 * Permission: Requires authenticated user (org_id from JWT)
 */

import { createServerSupabase } from '@/lib/supabase/server'

export interface Allergen {
  id: string
  code: string                    // A01 to A14
  name_en: string
  name_pl: string | null
  name_de: string | null
  name_fr: string | null
  icon_url: string | null         // Full URL to icon SVG
  is_eu_mandatory: boolean        // Always true for Phase 2
  display_order: number           // 1-14
}

export interface AllergenFilters {
  search?: string
  lang?: 'en' | 'pl' | 'de' | 'fr'
}

export interface AllergenResponse {
  allergens: Allergen[]
  total: number
}

export interface SelectOption {
  value: string
  label: string
  code: string
  icon_url: string | null
}

/**
 * Maps database icon identifier to full URL
 */
function getIconUrl(iconIdentifier: string | null): string | null {
  if (!iconIdentifier) return null
  return `/icons/allergens/${iconIdentifier}.svg`
}

/**
 * Maps database record to service Allergen type
 */
function mapDbAllergenToService(dbRecord: any): Allergen {
  return {
    id: dbRecord.id,
    code: dbRecord.code,
    name_en: dbRecord.name_en,
    name_pl: dbRecord.name_pl,
    name_de: dbRecord.name_de,
    name_fr: dbRecord.name_fr,
    icon_url: getIconUrl(dbRecord.icon),
    is_eu_mandatory: true,  // All Phase 2 allergens are EU mandatory
    display_order: parseInt(dbRecord.code.substring(1), 10),  // A01 -> 1
  }
}

export class AllergenService {
  /**
   * Get all 14 EU allergens with optional search filtering
   *
   * @param filters Optional filters (search query)
   * @returns All allergens matching filter
   * @throws Error if database query fails
   */
  static async getAllergens(filters?: AllergenFilters): Promise<AllergenResponse> {
    try {
      const supabase = await createServerSupabase()

      let query = supabase.from('allergens').select('*', { count: 'exact' })

      // Search filter - matches code or any language name
      if (filters?.search) {
        const searchTerm = `%${filters.search}%`
        query = query.or(
          `code.ilike.${searchTerm},name_en.ilike.${searchTerm},name_pl.ilike.${searchTerm},name_de.ilike.${searchTerm},name_fr.ilike.${searchTerm}`
        )
      }

      // Sort by display order (code number)
      query = query.order('code', { ascending: true })

      const { data, error, count } = await query

      if (error) throw new Error(`Database query failed: ${error.message}`)

      const allergens = (data || []).map(mapDbAllergenToService)

      return {
        allergens,
        total: count || 0,
      }
    } catch (error) {
      console.error('Error in getAllergens:', error)
      throw error
    }
  }

  /**
   * Get single allergen by ID
   *
   * @param id Allergen UUID
   * @returns Allergen data
   * @throws Error if not found or query fails
   */
  static async getAllergenById(id: string): Promise<Allergen> {
    try {
      const supabase = await createServerSupabase()

      const { data, error } = await supabase
        .from('allergens')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) throw new Error('Allergen not found')

      return mapDbAllergenToService(data)
    } catch (error) {
      console.error('Error in getAllergenById:', error)
      throw error
    }
  }

  /**
   * Get allergen by code (A01-A14)
   *
   * @param code Allergen code (case-insensitive)
   * @returns Allergen data
   * @throws Error if not found or query fails
   */
  static async getAllergenByCode(code: string): Promise<Allergen> {
    try {
      const supabase = await createServerSupabase()
      const upperCode = code.toUpperCase()

      const { data, error } = await supabase
        .from('allergens')
        .select('*')
        .eq('code', upperCode)
        .single()

      if (error || !data) throw new Error(`Allergen code ${upperCode} not found`)

      return mapDbAllergenToService(data)
    } catch (error) {
      console.error('Error in getAllergenByCode:', error)
      throw error
    }
  }

  /**
   * Search allergens by query (searches all language names and code)
   *
   * @param query Search term
   * @returns Matching allergens
   */
  static async searchAllergens(query: string): Promise<Allergen[]> {
    try {
      const response = await this.getAllergens({ search: query })
      return response.allergens
    } catch (error) {
      console.error('Error in searchAllergens:', error)
      return []
    }
  }

  /**
   * Get allergens formatted for select dropdowns
   *
   * @param lang Optional language code for label (default: 'en')
   * @returns Array of select options
   */
  static async getAllergensForSelect(lang: string = 'en'): Promise<SelectOption[]> {
    try {
      const { allergens } = await this.getAllergens()

      return allergens.map(allergen => ({
        value: allergen.id,
        label: `${allergen.code} - ${this.getName(allergen, lang)}`,
        code: allergen.code,
        icon_url: allergen.icon_url,
      }))
    } catch (error) {
      console.error('Error in getAllergensForSelect:', error)
      return []
    }
  }

  /**
   * Get allergen name in specific language with fallback to English
   *
   * @param allergen Allergen object
   * @param lang Language code ('en', 'pl', 'de', 'fr')
   * @returns Localized name or English fallback
   */
  static getName(allergen: Allergen, lang: string): string {
    const langKey = `name_${lang}` as keyof Allergen

    // Return language-specific name if available and non-null
    if (lang !== 'en' && allergen[langKey]) {
      return String(allergen[langKey])
    }

    // Fallback to English
    return allergen.name_en || allergen.code
  }
}
```

---

## TEST EXECUTION CHECKLIST

After implementing the above fixes, run these commands:

```bash
# Run allergen service v2 tests
npm test -- allergen-service-v2.test.ts --run

# Expected output:
# ✓ AllergenService (60 tests pass)
# Test Files  1 passed
# Tests       60 passed

# Run full test suite for allergens module
npm test -- allergen --run

# Expected output:
# ✓ allergen-service-v2.test.ts (60 tests)
# ✓ allergens/route.test.ts (25 tests)
# ✓ AllergenDisplay.test.tsx (15 tests)
# ✓ allergens-e2e.test.ts (25 tests)
# Test Files  4 passed
# Tests       125 passed
# Coverage    >80%

# Verify TypeScript compilation
npm run build -- --filter=frontend

# Expected: No TypeScript errors
```

---

## QUESTIONS FOR CLARIFICATION

If you have questions while implementing:

1. **On allergen-service-v2.ts:** Should the icon identifier be mapped to full URL in the service, or left as identifier for component to transform?
   - Recommendation: Map to URL in service (separation of concerns)

2. **On org_id:** Should tests mock org_id in RLS queries or should service ignore it for Phase 2?
   - Recommendation: Always include org_id for consistency with multi-tenancy model

3. **On error handling:** Should getAllergens() return empty array on error, or throw exception?
   - Recommendation: Throw exception in service, let API route handle error response

4. **On Phase 3 prep:** Should service include comments about future write operations?
   - Recommendation: Yes, document planned Phase 3 methods as TODOs

---

## SUCCESS CRITERIA

Your work is complete when:

1. ✅ Test file executes without import errors
2. ✅ All 60 unit tests pass
3. ✅ allergen-service-v2.ts exists and is exported correctly
4. ✅ Mock data includes org_id and matches database schema
5. ✅ Supabase mock uses factory pattern (no remocking in tests)
6. ✅ 25+ API route tests pass
7. ✅ 15+ Component tests pass
8. ✅ 25+ E2E tests pass
9. ✅ Code coverage >80%
10. ✅ TypeScript strict mode passes
11. ✅ No console errors during test run

---

## RESOURCES

- **Database Schema:** `supabase/migrations/052_create_allergens_table.sql`
- **Seed Data:** `supabase/migrations/053_seed_eu14_allergens.sql`
- **Story Requirements:** `docs/2-MANAGEMENT/epics/current/01-settings/context/01.12.context.yaml`
- **Test File:** `apps/frontend/__tests__/services/allergen-service-v2.test.ts`
- **Existing Service (reference):** `apps/frontend/lib/services/allergen-service.ts`

---

## SUMMARY

You created a good test design but forgot to create the implementation code. The fix is straightforward:

1. Create allergen-service-v2.ts (following the reference implementation above)
2. Fix the schema mismatch (add org_id, adjust field names)
3. Refactor mock pattern (use factory function)
4. Add remaining test suites (API, components, E2E)

**This is not a quality problem - it's a missing piece problem. Once you create the service implementation, most of the tests will pass immediately.**

Good luck! Let me know when you're ready for re-review.

---

**Prepared by:** SENIOR-DEV Agent
**Date:** 2025-12-17
**Next Step:** Implement Phase 1 (critical fixes) and re-request review
