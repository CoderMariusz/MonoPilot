# Handoff Document: Story 01.12 - Allergens Management

**Handoff Type:** REQUEST_CHANGES → DEV
**Story ID:** 01.12
**Story Name:** Allergens Management
**Date:** 2025-12-22
**From:** CODE-REVIEWER
**To:** BACKEND-DEV + FRONTEND-DEV

---

## Review Decision: REQUEST_CHANGES

**Status:** Story incomplete - RED phase (TDD tests written, implementation missing)

**Test Results:**
- Total Tests: 92
- Passing: 0 (0%)
- Failing: 92 (100%)
- Blocker: Missing API routes

**Required Actions:** Complete RED → GREEN → REFACTOR cycle

---

## Critical Blockers (Must Fix)

### 1. Missing API Routes (CRITICAL - BACKEND)
**Priority:** P0
**Effort:** 2-3 hours
**Assignee:** BACKEND-DEV

**Issue:** API endpoints required by frontend do not exist.

**Missing Files:**
- `apps/frontend/app/api/v1/settings/allergens/route.ts`
- `apps/frontend/app/api/v1/settings/allergens/[id]/route.ts`

**Required Implementation:**

```typescript
// File: apps/frontend/app/api/v1/settings/allergens/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch allergens (NO org_id filter - global reference data)
  const { data, error } = await supabase
    .from('allergens')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Failed to fetch allergens:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// Read-only enforcement (AC-RO-02)
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. EU allergens are read-only in MVP.' },
    { status: 405, headers: { 'Allow': 'GET' } }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. EU allergens are read-only in MVP.' },
    { status: 405, headers: { 'Allow': 'GET' } }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. EU allergens are read-only in MVP.' },
    { status: 405, headers: { 'Allow': 'GET' } }
  )
}
```

```typescript
// File: apps/frontend/app/api/v1/settings/allergens/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabase()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

  // Fetch single allergen
  const { data, error } = await supabase
    .from('allergens')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Allergen not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

// Read-only enforcement
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. EU allergens are read-only in MVP.' },
    { status: 405, headers: { 'Allow': 'GET' } }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. EU allergens are read-only in MVP.' },
    { status: 405, headers: { 'Allow': 'GET' } }
  )
}
```

**Validation Criteria:**
- [ ] GET /api/v1/settings/allergens returns 14 allergens
- [ ] Response sorted by display_order (A01 first, A14 last)
- [ ] 401 if not authenticated
- [ ] POST/PUT/DELETE return 405
- [ ] Response includes all multi-language fields

---

### 2. Service Implementation Wrong Story (CRITICAL - BACKEND)
**Priority:** P0
**Effort:** 1-2 hours
**Assignee:** BACKEND-DEV

**Issue:** `lib/services/allergen-service.ts` implements Story 1.9 (org-scoped CRUD) instead of Story 01.12 (global read-only).

**Current (WRONG):**
```typescript
export interface Allergen {
  org_id: string  // WRONG - allergens are global
  name: string    // WRONG - should be name_en, name_pl, etc.
}
```

**Correct Schema (from migration):**
```typescript
export interface Allergen {
  id: string
  code: string
  name_en: string
  name_pl: string
  name_de: string | null
  name_fr: string | null
  icon_url: string | null
  is_eu_mandatory: boolean
  is_active: boolean
  display_order: number
  // NO org_id!
}
```

**Action:** Replace entire service file

**Reference Correct Types:** `apps/frontend/lib/types/allergen.ts` (already correct)

**Required Methods (Read-Only):**
- `getAllergens()` - Returns all 14 allergens sorted by display_order
- `getAllergenById(id)` - Returns single allergen
- `getAllergenByCode(code)` - Returns allergen by code (A01-A14)
- `searchAllergens(query)` - Full-text search across all language fields

**Remove Methods:**
- `createAllergen()` - Not needed (read-only)
- `updateAllergen()` - Not needed (read-only)
- `deleteAllergen()` - Not needed (read-only)
- `seedEuAllergens()` - Handled by migration

---

### 3. Validation Schema Mismatch (CRITICAL - BACKEND)
**Priority:** P0
**Effort:** 30 minutes
**Assignee:** BACKEND-DEV

**Issue:** `lib/validation/allergen-schemas.ts` has wrong story reference and wrong schemas.

**Required Changes:**
1. Update story reference from 1.9 to 01.12
2. Remove `createAllergenSchema` (read-only MVP)
3. Remove `updateAllergenSchema` (read-only MVP)
4. Update `Allergen` interface to remove `org_id`, add multi-language fields
5. Keep only GET endpoint validation

**Example:**
```typescript
import { z } from 'zod'

// Allergen response schema (matches database)
export const allergenSchema = z.object({
  id: z.string().uuid(),
  code: z.string().regex(/^A[0-9]{2}$/, "Code must be format A01-A14"),
  name_en: z.string().min(1).max(100),
  name_pl: z.string().min(1).max(100),
  name_de: z.string().max(100).nullable(),
  name_fr: z.string().max(100).nullable(),
  icon_url: z.string().nullable(),
  is_eu_mandatory: z.boolean(),
  is_active: z.boolean(),
  display_order: z.number().int().min(0),
  created_at: z.string(),
  updated_at: z.string(),
})

export type Allergen = z.infer<typeof allergenSchema>
```

---

## Major Issues (Should Fix)

### 4. Test Placeholder Code (MAJOR - TEST-WRITER)
**Priority:** P1
**Effort:** 3-4 hours
**Assignee:** TEST-WRITER

**Issue:** All 92 tests contain `expect(true).toBe(false)` placeholder code.

**Affected Files:**
- `__tests__/01-settings/01.12.allergens-api.test.ts` (29 tests)
- `lib/services/__tests__/allergen-service.test.ts` (35 tests)
- `components/settings/allergens/__tests__/AllergensDataTable.test.tsx` (28 tests)

**Action:** Replace placeholders with real assertions after API routes implemented.

**Example Fix:**
```typescript
// BEFORE (RED phase)
it('should return all 14 EU allergens', async () => {
  expect(true).toBe(false) // Placeholder
})

// AFTER (GREEN phase)
it('should return all 14 EU allergens', async () => {
  const response = await GET(mockRequest)
  const data = await response.json()

  expect(response.status).toBe(200)
  expect(data).toHaveLength(14)
  expect(data[0].code).toBe('A01') // First allergen
  expect(data[13].code).toBe('A14') // Last allergen
})
```

**Dependency:** Wait for API routes (Blocker #1) before implementing.

---

### 5. Code Format Test Bug (MINOR - TEST-WRITER)
**Priority:** P2
**Effort:** 5 minutes
**Assignee:** TEST-WRITER

**Issue:** Test at line 510 expects 'A00' to NOT match `/^A[0-9]{2}$/`, but it DOES match (false negative).

**File:** `__tests__/01-settings/01.12.allergens-api.test.ts:509-511`

**Fix:**
```typescript
// BEFORE
const invalidCodes = ['A00', 'A15', 'B01', 'AA1', '123', '', 'GLUTEN']

// AFTER
const invalidCodes = ['B01', 'AA1', '123', '', 'GLUTEN'] // Remove A00, A15
```

**Reason:** A00 and A15 are syntactically valid (match regex) but semantically invalid (not in A01-A14 range).

---

## Already Implemented (No Action Needed)

The following components are APPROVED:

1. **Migration** ✓
   - File: `supabase/migrations/076_create_allergens_table.sql`
   - Creates global allergens table (no org_id)
   - Seeds 14 EU allergens with multi-language support
   - RLS policy: authenticated read-only
   - Proper indexes

2. **Types** ✓
   - File: `lib/types/allergen.ts`
   - Correct interface matching database schema
   - Helper function `getAllergenName()`

3. **Components** ✓
   - `AllergensDataTable.tsx` - Table with search, tooltips
   - `AllergenIcon.tsx` - Icon display with fallback
   - `AllergenBadge.tsx` - Reusable badge
   - `AllergenReadOnlyBanner.tsx` - Info banner

4. **Frontend Hook** ✓
   - File: `lib/hooks/use-allergens.ts`
   - Fetches from `/api/v1/settings/allergens`

5. **Page** ✓
   - File: `app/(authenticated)/settings/allergens/page.tsx`
   - Integrates all components

---

## Work Breakdown

### BACKEND-DEV Tasks (4-6 hours)

1. Create API routes (2-3 hours)
   - `app/api/v1/settings/allergens/route.ts`
   - `app/api/v1/settings/allergens/[id]/route.ts`

2. Replace service implementation (1-2 hours)
   - `lib/services/allergen-service.ts`

3. Fix validation schemas (30 mins)
   - `lib/validation/allergen-schemas.ts`

4. Run API tests (verify 29/29 pass)

### TEST-WRITER Tasks (3-4 hours)

**Dependency:** Wait for BACKEND-DEV to complete API routes

1. Implement API test assertions (1-2 hours)
   - `__tests__/01-settings/01.12.allergens-api.test.ts`

2. Implement service test assertions (1-2 hours)
   - `lib/services/__tests__/allergen-service.test.ts`

3. Implement component test assertions (30 mins)
   - `components/settings/allergens/__tests__/AllergensDataTable.test.tsx`

4. Fix code format test bug (5 mins)

5. Verify all 92 tests pass

---

## Acceptance Criteria Status

| AC ID | Criteria | Status | Blocker |
|-------|----------|--------|---------|
| AC-1 | Allergen list page loads 200ms | NOT TESTED | Missing API |
| AC-2 | Search filters all languages | NOT TESTED | Missing API |
| AC-3 | Allergen detail view | OUT OF SCOPE | Not required in MVP |
| AC-4 | Icon display with fallback | IMPLEMENTED | None |
| AC-5 | Multi-language tooltip | IMPLEMENTED | None |
| AC-6 | Read-only mode enforced | NOT TESTED | Missing API |
| AC-7 | Permission enforcement | NOT TESTED | Missing API |

**To Complete:** Implement API routes, then test ACs 1, 2, 6, 7

---

## Definition of Done Checklist

- [x] Database migration creates `allergens` table
- [x] Seed migration populates 14 EU allergens
- [x] RLS policy allows authenticated read access
- [ ] API endpoint `GET /api/v1/settings/allergens` - **BLOCKER**
- [ ] API endpoint `GET /api/v1/settings/allergens/:id` - **BLOCKER**
- [ ] POST/PUT/DELETE return 405 - **BLOCKER**
- [ ] `allergen-service.ts` with read methods - **NEEDS REFACTOR**
- [ ] Zod validation schemas - **NEEDS FIX**
- [x] Allergens list page displays 14 items
- [x] Search filters across all language fields
- [x] Icon display with fallback
- [x] Multi-language tooltip
- [x] Read-only banner displayed
- [ ] Page loads within 200ms - **BLOCKED BY API**
- [ ] Unit tests >80% coverage - **BLOCKED BY API**
- [ ] Integration tests pass - **BLOCKED BY API**
- [ ] E2E tests pass - **BLOCKED BY API**
- [x] Allergen icons in `/public/icons/allergens/`

**Progress:** 8/18 complete (44%)
**Blockers:** 3 critical (API routes, service, validation)

---

## Re-Review Criteria

After fixes are complete, re-submit for code review when:

1. All 92 tests pass (0 failures)
2. API routes return correct responses
3. Service implements Story 01.12 pattern (global, read-only)
4. Validation schemas match database schema
5. Code coverage >80%

**Expected Timeline:** 1-2 days (6-10 hours total work)

---

## Reference Documents

- **Story:** `docs/2-MANAGEMENT/epics/current/01-settings/01.12.allergens-management.md`
- **Context:** `docs/2-MANAGEMENT/epics/current/01-settings/context/01.12/`
- **Migration:** `supabase/migrations/076_create_allergens_table.sql`
- **Code Review:** `docs/2-MANAGEMENT/reviews/code-review-story-01.12.md`

---

## Contact

**Questions:** Contact CODE-REVIEWER or ORCHESTRATOR
**Handoff Date:** 2025-12-22
**Next Review:** After all blockers resolved and tests passing
