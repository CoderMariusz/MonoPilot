# QA Report: Stories TD-208 + TD-209
## Track D - Allergens Language + Products

**Report Date:** 2025-12-24
**QA Agent:** QA-AGENT
**Stories:** TD-208, TD-209
**Decision:** FAIL (Blocked - Implementation Not Started)

---

## Executive Summary

Stories TD-208 and TD-209 are **in DESIGN phase only**. Database schemas and API contracts are complete, but implementation has not begun. All frontend components, services, API routes, and tests remain to be created.

**Status:** 10% Complete (Schemas Only)
**Blockers:** No implementation code exists
**Recommendation:** Start implementation phase with service layer and API routes

---

## Acceptance Criteria Status

### Story TD-208: Language Selector for Allergen Names

#### AC-1: Language selector dropdown renders
**Status:** NOT IMPLEMENTED
**Evidence:**
- `LanguageSelector.tsx` component does NOT exist
- No dropdown component in `/components/settings/allergens/`
- `AllergensDataTable.tsx` page has hardcoded `userLanguage="en"` (line 39)

**Missing Implementation:**
```typescript
// Expected file: apps/frontend/components/settings/allergens/LanguageSelector.tsx
// Status: File does not exist
```

#### AC-2: Shows 4 languages (EN, PL, DE, FR)
**Status:** NOT TESTABLE
**Evidence:**
- No LanguageSelector component exists
- API Contract designed (user-preferences.md) but not implemented
- Database migration EXISTS with correct language constraint

**Language Support Status:**
- Database: CHECK constraint for ('en', 'pl', 'de', 'fr') ✅
- RPC functions: Both get/set implemented ✅
- API routes: NOT implemented ❌
- Frontend service: NOT implemented ❌
- Component: NOT implemented ❌

#### AC-3: Current language selected
**Status:** NOT TESTABLE
**Evidence:** No component exists to display current selection

#### AC-4: onChange fires on selection
**Status:** NOT TESTABLE
**Evidence:** No component exists to implement handler

#### AC-5: Keyboard navigation works
**Status:** NOT TESTABLE
**Evidence:** No component exists to implement accessibility

#### AC-6: Preference saved to database
**Status:** PARTIALLY IMPLEMENTED
**Evidence:**
- Migration 031 creates RPC functions ✅
- RPC `set_user_language(TEXT)` exists ✅
- CHECK constraint validates codes ✅
- Missing: API route to call RPC function ❌

#### AC-7: Preference loaded on mount
**Status:** PARTIALLY IMPLEMENTED
**Evidence:**
- Migration 031 creates `get_user_language(UUID)` RPC ✅
- Missing: API route to call RPC function ❌
- Missing: React hook to load preference ❌
- Missing: Component lifecycle to load on mount ❌

---

### Story TD-209: Products Column in Allergens Table

#### AC-1: Products column renders
**Status:** NOT IMPLEMENTED
**Evidence:**
- `AllergensDataTable.tsx` has 6 columns (Code, Icon, Name, Name EN, Name PL, Status)
- No Products column exists
- No product count display

**Current AllergensDataTable Columns:**
```typescript
// Lines 164-171: Current columns
<TableHead>Code</TableHead>
<TableHead>Icon</TableHead>
<TableHead>Name ({userLanguage.toUpperCase()})</TableHead>
<TableHead>Name EN</TableHead>
<TableHead>Name PL</TableHead>
<TableHead>Status</TableHead>
// Products column: MISSING ❌
```

#### AC-2: Shows product count per allergen
**Status:** PARTIALLY IMPLEMENTED
**Evidence:**
- Migration 032 creates `get_all_allergen_product_counts()` RPC ✅
- Migration 032 creates `product_allergens` junction table ✅
- Missing: API route to return counts ❌
- Missing: Service method to fetch counts ❌
- Missing: Component column to display counts ❌

#### AC-3: Count clickable when > 0
**Status:** NOT TESTABLE
**Evidence:** No Products column exists

#### AC-4: Links to /technical/products?allergen_id=X
**Status:** NOT TESTABLE
**Evidence:** No column or click handler exists

#### AC-5: Disabled/muted for 0 products
**Status:** NOT TESTABLE
**Evidence:** No column exists

#### AC-6: Loading state works
**Status:** NOT TESTABLE
**Evidence:** No component exists

#### AC-7: Error handling works
**Status:** NOT TESTABLE
**Evidence:** No component exists

#### AC-8: Filters by org_id
**Status:** PARTIALLY IMPLEMENTED
**Evidence:**
- Migration 032: RLS policies enforce org_id filtering ✅
- RPC functions filter by user's org_id ✅
- Missing: API routes not implemented ❌

---

## Implementation Status

### Database Layer

| Component | Status | Evidence |
|-----------|--------|----------|
| Migration 031 (User Language) | ✅ COMPLETE | `supabase/migrations/031_add_user_language_preference.sql` (150 lines) |
| Migration 032 (Product Allergens) | ✅ COMPLETE | `supabase/migrations/032_create_product_allergens_table.sql` (286 lines) |
| user.language column | ✅ EXISTS | Created in migration 003 |
| CHECK constraint | ✅ EXISTS | Lines 27-39 of migration 031 |
| Indexes | ✅ CREATED | 4 indexes in migration 032 (product, allergen, org, composite) |
| RLS policies | ✅ CREATED | 3 policies in migration 032 (select, insert, delete) |
| RPC functions | ✅ CREATED | 5 functions total |

**RPC Functions Summary:**

TD-208 Functions:
- `get_user_language(UUID)` - ✅ Get user's language with fallback chain
- `set_user_language(TEXT)` - ✅ Update user's language with validation

TD-209 Functions:
- `get_allergen_product_count(UUID)` - ✅ Single allergen count
- `get_all_allergen_product_counts()` - ✅ Batch count for all allergens
- `get_products_by_allergen(UUID)` - ✅ Products list for allergen

### Service Layer

| File | Status | Notes |
|------|--------|-------|
| `user-preference-service.ts` | ❌ MISSING | Designed in user-preferences.md but not created |
| `allergen-service.ts` (update) | ⚠️ PARTIAL | Exists for 01.12, needs count methods for TD-209 |
| `product-allergen-service.ts` | ✅ EXISTS | Created 2025-12-24 (16,716 bytes) |

### API Routes

| Route | Status | Notes |
|-------|--------|-------|
| `GET /api/v1/settings/users/me/preferences` | ❌ MISSING | Designed but not implemented |
| `PUT /api/v1/settings/users/me/preferences` | ❌ MISSING | Designed but not implemented |
| `GET /api/v1/settings/languages` | ❌ MISSING | Designed but not implemented |
| `GET /api/v1/settings/allergens/counts` | ❌ MISSING | Designed but not implemented |
| `GET /api/v1/settings/allergens/{id}/count` | ❌ MISSING | Designed but not implemented |
| `GET /api/v1/settings/allergens/{id}/products` | ❌ MISSING | Designed but not implemented |

### Frontend Components

| Component | Status | Notes |
|-----------|--------|-------|
| `LanguageSelector.tsx` | ❌ MISSING | TD-208 requires new component |
| `AllergensDataTable.tsx` (update) | ⚠️ PARTIAL | Exists for 01.12, needs Products column for TD-209 |
| `use-language-preference.ts` hook | ❌ MISSING | Designed in user-preferences.md |
| `use-allergen-counts.ts` hook | ❌ MISSING | Designed in allergen-counts.md |

### Tests

| Test Type | Status | Count | Notes |
|-----------|--------|-------|-------|
| Unit tests | ❌ MISSING | 0 | 66 tests mentioned in user request don't exist |
| Integration tests | ❌ MISSING | 0 | No API route tests |
| Component tests | ⚠️ PARTIAL | 30+ | Tests exist for 01.12 AllergensDataTable but marked as RED phase |
| E2E tests | ❌ MISSING | 0 | No navigation tests |

**Test File Evidence:**
```typescript
// apps/frontend/components/settings/allergens/__tests__/AllergensDataTable.test.tsx
// Line 28-237: Tests all commented out (RED phase placeholders)
// All tests have: expect(true).toBe(false) // Placeholder
```

### Validation Schemas

| Schema | Status | Notes |
|--------|--------|-------|
| `user-preference-schemas.ts` | ❌ MISSING | Designed but not created |
| `allergen-schemas.ts` (update) | ⚠️ PARTIAL | Exists, needs count schemas |

---

## Critical Findings

### Blocker 1: No Component Implementation
**Severity:** CRITICAL
**Issue:** LanguageSelector component does not exist
**Current Code:** AllergensDataTable hardcodes userLanguage="en"
```typescript
// Line 39 of AllergensDataTable.tsx
userLanguage="en" // TODO: Get from user preferences
```
**Impact:** Language preference feature cannot be tested manually
**Fix Required:** Create LanguageSelector component with dropdown UI

### Blocker 2: No API Routes
**Severity:** CRITICAL
**Issue:** All 6 designed API routes not implemented
**Database State:** RPC functions exist and can be called directly
**Frontend State:** No routes to call RPC functions
**Impact:** Frontend cannot fetch/persist language preferences or product counts
**Fix Required:** Create API route files and implement handler functions

### Blocker 3: Missing Service Layer
**Severity:** HIGH
**Issue:** user-preference-service.ts does not exist
**Impact:** Frontend components cannot call database operations
**Fix Required:** Create service file with methods matching API contract

### Blocker 4: Test Files Are Placeholders
**Severity:** HIGH
**Issue:** All AC tests have `expect(true).toBe(false)` placeholders
**Evidence:**
```typescript
// Line 237 of AllergensDataTable.test.tsx
expect(true).toBe(false) // Placeholder - will fail until implementation exists
```
**Impact:** Cannot run automated tests; 66 test count is incorrect (tests don't execute)
**Fix Required:** Implement actual test assertions after components exist

### Blocker 5: AllergensDataTable Needs Products Column
**Severity:** HIGH
**Issue:** TD-209 requires adding column to existing component
**Current:** 6 columns displayed
**Required:** 7th column for Products count
**Status:** Not even stubbed out
**Fix Required:** Add Products column definition and click handler

---

## Evidence Summary

### What Exists (10%)
1. Database schemas (migrations 031, 032) - Complete
2. RPC functions (5 total) - Complete
3. API documentation (2 contract files) - Complete
4. Allergen component shell (AllergensDataTable) - 01.12 only
5. Product allergen service - Partial for other features

### What's Missing (90%)
1. Language Selector component
2. All API routes (6 routes)
3. user-preference-service.ts
4. Validation schemas for user preferences
5. React hooks (use-language-preference, use-allergen-counts)
6. Products column in AllergensDataTable
7. Actual test implementations (currently placeholders)
8. Test data factories for product counts

---

## Manual Testing

### Attempt 1: Navigate to /settings/allergens
**Status:** PASS for 01.12, INCOMPLETE for TD-208/TD-209

**01.12 Features Working:**
- Page loads successfully
- 14 allergens display in table
- Search by code works (e.g., "A07")
- Search by English name works (e.g., "milk")
- Icons display with fallback
- Status badges show Active/Inactive
- Tooltips on hover show all language translations

**TD-208 Features Missing:**
- No language selector dropdown visible
- No way to change language preference
- AllergensDataTable receives hardcoded "en" via prop
- Allergen names always show in English

**TD-209 Features Missing:**
- Table only has 6 columns (missing Products)
- No product count display
- No click handlers for products
- No navigation to /technical/products with allergen filter

### Attempt 2: Test Language Persistence
**Status:** UNABLE TO TEST
**Reason:** No way to select language (component missing)

### Attempt 3: Test Product Count Display
**Status:** UNABLE TO TEST
**Reason:** No Products column in table (not implemented)

---

## Database Migration Status

### Migration 031 (User Language Preference)

**Status:** Exists, not applied to database

**Contents:**
- Add CHECK constraint on users.language
- Create index on users.language
- Create get_user_language(UUID) RPC
- Create set_user_language(TEXT) RPC

**Verification:**
```sql
-- Cloud database does NOT yet have these RPC functions
-- Local database status unknown (not checked)
-- Migration needs to be applied: npx supabase db push
```

### Migration 032 (Product Allergens Table)

**Status:** Exists, not applied to database

**Contents:**
- Create product_allergens junction table
- Create 4 indexes
- Enable RLS with 3 policies
- Create 3 RPC functions for counts

**Table Design:**
```sql
CREATE TABLE product_allergens (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL,
  allergen_id UUID NOT NULL,
  org_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  CONSTRAINT uq_product_allergen UNIQUE(product_id, allergen_id)
);
```

**Verification:**
```sql
-- Cloud database does NOT yet have this table
-- RPC functions do NOT exist
-- Migration needs to be applied: npx supabase db push
```

---

## Edge Cases Not Tested

### TD-208 Edge Cases
1. **Null user preference** - Should fall back to org locale
   - Status: RPC logic exists, not tested
2. **Invalid language code** - Should reject 'xx', 'es', etc.
   - Status: Validation exists in RPC, not tested via API
3. **User changes language** - Allergen names should update
   - Status: No UI to test this flow
4. **Multiple simultaneous language updates** - Race condition?
   - Status: Not testable (no UI)
5. **Logout and login** - Language preference should persist
   - Status: Not testable (no component)

### TD-209 Edge Cases
1. **Zero products for allergen** - Button should be disabled
   - Status: Design spec exists, not implemented
2. **Large product count** - Should display "45 products" not truncate
   - Status: Not testable (no column)
3. **Products soft-deleted** - Should not count in results
   - Status: RPC logic filters deleted_at IS NULL, not tested
4. **Cross-org isolation** - User should see only their org's counts
   - Status: RPC filters by org_id, not tested
5. **Product allergen deleted** - Count should decrease
   - Status: Cascade delete exists, not tested
6. **Navigate to products** - Should filter by allergen_id in URL
   - Status: No click handler implemented
7. **Back from products** - Should return to allergens page
   - Status: No navigation implemented

---

## Regression Testing

### Story 01.12 (Allergens Management) - Existing Feature

**Status:** NOT BROKEN by missing TD-208/TD-209 code

**01.12 Component Tests:**
- AllergensDataTable.test.tsx exists with 30+ test cases
- All tests marked as RED phase (placeholders)
- No assertions actually execute
- Component code itself is complete and functional

**01.12 Manual Verification:**
- Allergens page loads correctly
- All 14 allergens display
- Search works across all language fields
- Read-only enforcement works (no edit buttons)
- Icons display with fallback handling

**Impact Assessment:** TD-208/TD-209 code changes (when implemented) should NOT break 01.12 because:
1. AllergensDataTable component is stable
2. New LanguageSelector would be separate component
3. Products column is just added to table (not breaking existing columns)
4. User language preference would be optional (defaults to 'en')

---

## Quality Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| AC Coverage | 100% | 0% (blocked) | FAIL |
| Implementation | 100% | 10% | FAIL |
| Test Coverage | 80%+ | 0% (placeholders) | FAIL |
| Code Review | Approved | Not applicable | BLOCKED |
| Integration | End-to-end | Partial (DB only) | BLOCKED |

---

## Recommendation

### For Stories TD-208 and TD-209

**Current Decision:** FAIL

**Reasons:**
1. Implementation has not begun (10% complete - design only)
2. No acceptance criteria can be tested
3. All components, services, and API routes missing
4. Test files are placeholders with no real assertions
5. Cannot verify end-to-end functionality

### Required Before QA Approval (PASS)

**Phase 1: Service Layer** (Est. 2-3 hours)
- [ ] Create `user-preference-service.ts` with methods:
  - `getLanguagePreference(): Promise<UserPreference>`
  - `setLanguagePreference(lang: SupportedLanguage): Promise<void>`
  - `getSupportedLanguages(): SupportedLanguage[]`
- [ ] Create `validation/user-preference-schemas.ts` with Zod schemas
- [ ] Create validation schema for allergen count responses

**Phase 2: API Routes** (Est. 3-4 hours)
- [ ] Implement 3 user preference routes (GET, PUT, OPTIONS)
- [ ] Implement 3 allergen count routes (batch, single, products)
- [ ] Add error handling with proper status codes
- [ ] Add input validation using Zod

**Phase 3: Frontend Components** (Est. 2-3 hours)
- [ ] Create `LanguageSelector.tsx` component
  - Dropdown UI with 4 language options
  - Current language selected
  - onChange handler to save preference
  - Loading state while saving
- [ ] Create React hooks:
  - `use-language-preference.ts` - Load/save language
  - `use-allergen-counts.ts` - Load product counts
- [ ] Update `AllergensDataTable.tsx`:
  - Add Products column
  - Integrate allergen counts hook
  - Add click handler for navigation
  - Handle loading/error states

**Phase 4: Tests** (Est. 4-5 hours)
- [ ] Write unit tests for services (20 tests)
- [ ] Write integration tests for API routes (20 tests)
- [ ] Write component tests for LanguageSelector (15 tests)
- [ ] Write component tests for AllergensDataTable.Products (15 tests)
- [ ] Update RLS tests for product_allergens table (10 tests)

**Phase 5: Manual Testing** (Est. 1-2 hours)
- [ ] Test all 15 ACs against implementation
- [ ] Test edge cases (null, invalid, empty)
- [ ] Test cross-org isolation
- [ ] Test persistence across sessions
- [ ] Verify no regression in 01.12 features

**Total Estimated Effort:** 12-17 hours

### Next Steps

1. **Start Service Layer Implementation** (Day 1)
   - Create service files with business logic
   - Write unit tests for services
   - Verify RPC functions work correctly

2. **Implement API Routes** (Day 2)
   - Create route handlers
   - Add validation and error handling
   - Test with curl/Postman

3. **Build Frontend Components** (Day 2-3)
   - Create LanguageSelector component
   - Update AllergensDataTable
   - Create custom hooks

4. **Write Complete Tests** (Day 3)
   - Replace placeholder tests with real assertions
   - Achieve 80%+ code coverage
   - All 66+ tests passing

5. **QA Testing** (Day 4)
   - Manual verification of all ACs
   - Edge case testing
   - Regression testing on 01.12

---

## Conclusion

**Current Status:** TD-208 and TD-209 are **DESIGNED but NOT IMPLEMENTED**

**Blockers:**
- No LanguageSelector component
- No API routes
- No service layer
- Test files are placeholders

**Verdict:** Cannot PASS QA with current code state. All acceptance criteria are blocked.

**Recommendation:** Begin implementation phase with design documents in place. Estimated 12-17 hours to completion.

---

**Report Generated:** 2025-12-24 13:30:00 UTC
**Reviewed By:** QA-AGENT
**Next Review:** After implementation phase completes
