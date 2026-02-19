# Blocking Issues: Stories TD-208 + TD-209

**Date:** 2025-12-24
**QA Status:** BLOCKED - Cannot Test
**Severity:** CRITICAL (Blocks all testing)
**Resolution Required:** Complete implementation phase

---

## Issue Summary

Stories TD-208 and TD-209 are in DESIGN phase only. No implementation code exists to test. All 15 acceptance criteria are blocked.

---

## Blocking Issues

### CRITICAL-1: LanguageSelector Component Missing

**Type:** Missing Component
**Severity:** CRITICAL
**Affects:** TD-208, AC 1-7

**Description:**
The LanguageSelector component specified in story TD-208 does not exist. The component should display a dropdown with 4 language options (EN, PL, DE, FR) and allow users to change their allergen name display language.

**Current State:**
```typescript
// apps/frontend/components/settings/allergens/AllergensDataTable.tsx:39
userLanguage="en" // TODO: Get from user preferences
```

**Impact:**
- Cannot test language selector dropdown rendering
- Cannot test language persistence
- Cannot test language change updates allergen names
- Hardcoded to English only

**Files Missing:**
- `apps/frontend/components/settings/allergens/LanguageSelector.tsx` (NEW)
- `apps/frontend/hooks/use-language-preference.ts` (NEW)

**Required Implementation:**
1. React component with ShadCN Select or Popover dropdown
2. Show 4 languages: English, Polish (Polski), German (Deutsch), French (Francais)
3. Display currently selected language
4. onChange handler to call API
5. Loading state while saving
6. Error handling for failed saves
7. Keyboard navigation support

**Acceptance Criteria Blocked:**
- AC-1: Language selector dropdown renders
- AC-2: Shows 4 languages (EN, PL, DE, FR)
- AC-3: Current language selected
- AC-4: onChange fires on selection
- AC-5: Keyboard navigation works
- AC-6: Preference saved to database
- AC-7: Preference loaded on mount

---

### CRITICAL-2: API Routes Not Implemented

**Type:** Missing API Routes
**Severity:** CRITICAL
**Affects:** TD-208, TD-209

**Description:**
All 6 designed API routes are missing. Frontend cannot call backend RPC functions without these routes.

**Missing Routes:**

#### TD-208 Routes (3 routes)
```typescript
// 1. GET /api/v1/settings/users/me/preferences
// Status: MISSING ❌
// Returns: { language: string | null, effective_language: string }

// 2. PUT /api/v1/settings/users/me/preferences
// Status: MISSING ❌
// Accepts: { language: 'en' | 'pl' | 'de' | 'fr' }

// 3. GET /api/v1/settings/languages
// Status: MISSING ❌
// Returns: { languages: [{ code, name, native_name, is_default }] }
```

#### TD-209 Routes (3 routes)
```typescript
// 1. GET /api/v1/settings/allergens/counts
// Status: MISSING ❌
// Returns: { counts: { allergen_id: count, ... } }

// 2. GET /api/v1/settings/allergens/{allergen_id}/count
// Status: MISSING ❌
// Returns: { allergen_id: string, product_count: number }

// 3. GET /api/v1/settings/allergens/{allergen_id}/products
// Status: MISSING ❌
// Returns: { allergen_id, allergen_name, products: [...], total_count }
```

**Current File Structure:**
```
apps/frontend/app/api/v1/
├── settings/
│   ├── users/
│   │   ├── route.ts (existing)
│   │   ├── [id]/route.ts (existing)
│   │   ├── invitations/ (existing)
│   │   ├── me/ (NEW - MISSING)
│   │   │   └── preferences/
│   │   │       └── route.ts (MISSING)
│   │   └── (other existing routes)
│   ├── allergens/ (MISSING)
│   │   ├── counts/
│   │   │   └── route.ts (MISSING)
│   │   ├── [allergen_id]/
│   │   │   ├── count/
│   │   │   │   └── route.ts (MISSING)
│   │   │   └── products/
│   │   │       └── route.ts (MISSING)
│   │   └── languages/
│   │       └── route.ts (MISSING)
```

**Design Contracts Exist:**
- `docs/3-ARCHITECTURE/api/settings/user-preferences.md` ✅ (Design only)
- `docs/3-ARCHITECTURE/api/settings/allergen-counts.md` ✅ (Design only)

**Impact:**
- Frontend cannot fetch user language preference
- Frontend cannot save language preference
- Frontend cannot fetch allergen product counts
- Frontend cannot navigate to filtered products page
- All API-dependent features fail

---

### CRITICAL-3: Service Layer Missing

**Type:** Missing Service Layer
**Severity:** CRITICAL
**Affects:** TD-208, TD-209, API routes

**Description:**
Backend service layer required to implement business logic and coordinate between API routes and database.

**Missing Services:**
```typescript
// apps/frontend/lib/services/user-preference-service.ts
// Status: MISSING ❌
// Methods needed:
// - getLanguagePreference(): Promise<UserPreference>
// - setLanguagePreference(lang: SupportedLanguage): Promise<void>
// - getSupportedLanguages(): SupportedLanguage[]

// Designed in: docs/3-ARCHITECTURE/api/settings/user-preferences.md
```

**Existing Services:**
- `allergen-service.ts` (01.12) - Has getAllergens(), getByCode(), etc.
- `product-allergen-service.ts` (new, 16KB) - Has some methods but incomplete for TD-209

**Methods Required:**
- `allergen-service.ts` needs update:
  - `getAllergenProductCounts(): Promise<Map<string, number>>`
  - `getProductCount(allergenId: string): Promise<number>`
  - `getProductsByAllergen(allergenId: string): Promise<Product[]>`

**Impact:**
- API routes cannot be implemented without service layer
- Frontend cannot call service methods
- Business logic not abstracted from routes
- Difficult to unit test

---

### CRITICAL-4: React Hooks Missing

**Type:** Missing React Hooks
**Severity:** HIGH
**Affects:** TD-208, TD-209 frontend

**Description:**
Custom React hooks needed for frontend components to manage state and API calls.

**Missing Hooks:**

```typescript
// apps/frontend/hooks/use-language-preference.ts
// Status: MISSING ❌
// Used by: LanguageSelector.tsx, AllergensDataTable.tsx

// apps/frontend/hooks/use-allergen-counts.ts
// Status: MISSING ❌
// Used by: AllergensDataTable.tsx for Products column
```

**Hook Specifications:**

TD-208 Hook:
```typescript
export function useLanguagePreference() {
  // Should return:
  // - language: string (current preference)
  // - effectiveLanguage: string (with fallback)
  // - isLoading: boolean
  // - error: Error | null
  // - updateLanguage: (lang: SupportedLanguage) => Promise<void>
  // - refetch: () => Promise<void>
}
```

TD-209 Hook:
```typescript
export function useAllergenCounts() {
  // Should return:
  // - counts: Map<string, number> (allergen_id -> product_count)
  // - getCount: (allergenId: string) => number
  // - isLoading: boolean
  // - error: Error | null
  // - refetch: () => Promise<void>
}
```

**Impact:**
- Components cannot manage state
- Cannot fetch data from API
- Cannot update preference
- Cannot handle loading/error states

---

### CRITICAL-5: AllergensDataTable Missing Products Column

**Type:** Component Feature Missing
**Severity:** CRITICAL
**Affects:** TD-209

**Description:**
The AllergensDataTable component needs a 7th column to display product counts per allergen (TD-209).

**Current State:**
```typescript
// apps/frontend/components/settings/allergens/AllergensDataTable.tsx
// Lines 164-171: Current columns
<TableHead>Code</TableHead>
<TableHead>Icon</TableHead>
<TableHead>Name ({userLanguage.toUpperCase()})</TableHead>
<TableHead>Name EN</TableHead>
<TableHead>Name PL</TableHead>
<TableHead>Status</TableHead>
// MISSING: Products column ❌
```

**Required Column Design:**
```typescript
// Column definition (approximate)
{
  accessorKey: 'product_count',
  header: 'Products',
  cell: ({ allergen }) => {
    const count = allergenCounts.get(allergen.id) || 0;
    return (
      <Button
        variant="link"
        onClick={() => handleProductCountClick(allergen.id)}
        disabled={count === 0}
        className={count === 0 ? 'text-muted-foreground' : ''}
      >
        {count} {count === 1 ? 'product' : 'products'}
      </Button>
    );
  }
}
```

**Required Features:**
1. Display product count for each allergen
2. Make count clickable when > 0
3. Navigate to `/technical/products?allergen_id={id}` on click
4. Show disabled/muted state for 0 products
5. Show loading state while fetching counts
6. Handle error state if fetch fails

**Impact:**
- Cannot display product counts
- Cannot navigate to products by allergen
- Users cannot see which allergens are used
- TD-209 acceptance criteria cannot be tested

**Acceptance Criteria Blocked:**
- AC-1: Products column renders
- AC-2: Shows product count per allergen
- AC-3: Count clickable when > 0
- AC-4: Links to /technical/products?allergen_id=X
- AC-5: Disabled/muted for 0 products
- AC-6: Loading state works
- AC-7: Error handling works

---

### CRITICAL-6: Test Files Are Placeholders

**Type:** Test Implementation Missing
**Severity:** HIGH
**Affects:** All ACs, QA verification

**Description:**
Test files exist but all assertions are placeholders. The test count (66 mentioned in brief) is misleading - tests don't actually run or assert anything.

**Evidence:**

```typescript
// apps/frontend/components/settings/allergens/__tests__/AllergensDataTable.test.tsx
// Line 237 and many others:
expect(true).toBe(false) // Placeholder - will fail until implementation exists

// Line 223 (test name):
it('should display loading skeleton', async () => {
  // GIVEN allergens are loading
  // WHEN rendering table
  // render(<AllergensDataTable />)  // COMMENTED OUT
  // THEN loading skeleton displayed
  // expect(screen.getByText(/loading allergens/i)).toBeInTheDocument()  // COMMENTED OUT

  // Placeholder - will fail until implementation exists
  expect(true).toBe(false)  // Always fails
})
```

**Test File Status:**
- `AllergensDataTable.test.tsx` - 30+ tests marked as RED phase (placeholders)
- No other test files for TD-208 or TD-209 features
- No API route tests
- No service tests
- No hook tests

**Impact:**
- Cannot run automated tests
- Cannot verify implementations
- Cannot measure code coverage
- All 66+ test count is invalid (not actual executable tests)

**Files Missing:**
```
apps/frontend/lib/services/__tests__/
├── user-preference-service.test.ts (MISSING)
├── allergen-service.TD-209.test.ts (MISSING)

apps/frontend/hooks/__tests__/
├── use-language-preference.test.ts (MISSING)
├── use-allergen-counts.test.ts (MISSING)

apps/frontend/app/api/v1/settings/__tests__/
├── users/me/preferences/route.test.ts (MISSING)
├── allergens/counts/route.test.ts (MISSING)
├── allergens/[id]/count/route.test.ts (MISSING)
├── allergens/[id]/products/route.test.ts (MISSING)
├── languages/route.test.ts (MISSING)
```

---

## Resolution Strategy

### Phase 1: Core Services (Est. 3-4 hours)
1. [ ] Create `user-preference-service.ts` with 3 methods
2. [ ] Create `validation/user-preference-schemas.ts` with Zod schemas
3. [ ] Update `allergen-service.ts` with 3 count methods
4. [ ] Create unit tests for services (20 tests)

### Phase 2: API Routes (Est. 3-4 hours)
1. [ ] Create 3 user preference routes + tests
2. [ ] Create 3 allergen count routes + tests
3. [ ] Verify RPC functions are called correctly
4. [ ] Test error handling and validation

### Phase 3: Frontend Components (Est. 2-3 hours)
1. [ ] Create `LanguageSelector.tsx` component
2. [ ] Create `use-language-preference.ts` hook
3. [ ] Create `use-allergen-counts.ts` hook
4. [ ] Update `AllergensDataTable.tsx` with Products column

### Phase 4: Component Tests (Est. 2-3 hours)
1. [ ] Replace placeholder tests with real assertions
2. [ ] Write LanguageSelector tests (15 tests)
3. [ ] Write Products column tests (15 tests)
4. [ ] Achieve 80%+ code coverage

### Phase 5: Manual QA (Est. 1-2 hours)
1. [ ] Test all 15 acceptance criteria
2. [ ] Test edge cases
3. [ ] Verify persistence
4. [ ] Check no regression in 01.12

---

## Dependencies

**Already Available:**
- ✅ Database migrations (031, 032)
- ✅ RPC functions (5 functions)
- ✅ API contracts (design docs)
- ✅ Zod schemas (designed)
- ✅ Component shell (AllergensDataTable exists)

**Need Before Implementation Can Complete:**
- ❌ API routes must be created
- ❌ Services must be created
- ❌ Hooks must be created
- ❌ Components must be updated
- ❌ Tests must be written

---

## Unblocking Conditions

To move from BLOCKED to testable status:

1. **Minimum to Start Manual Testing:** (Est. 8 hours)
   - API routes implemented
   - Services implemented
   - Components updated
   - (Can skip tests initially, but not recommended)

2. **Full Implementation:** (Est. 12-17 hours)
   - All above +
   - Service tests written
   - API route tests written
   - Component tests written (replacing placeholders)
   - 80%+ code coverage achieved

3. **QA Ready:** (After implementation)
   - All code changes merged to main
   - All tests passing
   - Code reviewed
   - Ready for manual QA verification

---

## Next Actions Required

**Immediate (Today):**
1. Review this report with dev team
2. Confirm development schedule for implementation
3. Identify blocking dependencies

**Week 1:**
1. Implement service layer (Phase 1)
2. Implement API routes (Phase 2)
3. Start component implementation (Phase 3)

**Week 2:**
1. Complete component implementation
2. Write tests (Phase 4)
3. Manual QA testing (Phase 5)

---

**Report Generated:** 2025-12-24
**QA Decision:** FAIL - BLOCKED (Cannot test due to missing implementation)
**Recommendation:** Begin implementation phase with 12-17 hour estimate
