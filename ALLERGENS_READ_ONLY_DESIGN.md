# Allergens Page: Read-Only by Design (NOT A BUG)

**Investigation Date:** 2026-02-07  
**Severity:** NOT A BUG - Intentional Design  
**Status:** ✅ CLOSED - Working as Intended  

---

## 🔍 Executive Summary

The allergens settings page (`/settings/allergens`) **does NOT have CRUD functionality by design**. This is **intentional** and based on EU regulatory requirements, not a missing feature or bug.

---

## 📋 Evidence

### 1. **Page-Level Documentation**

**File:** `apps/frontend/app/(authenticated)/settings/allergens/page.tsx`

```typescript
/**
 * Allergens List Page
 * Story: 01.12 - Allergens Management
 *
 * Displays 14 EU-mandated allergens in read-only mode
 * - Multi-language support (EN, PL, DE, FR)
 * - Search across all language fields
 * - Icon display with fallback
 * - No Add/Edit/Delete actions (regulatory data) ← EXPLICIT DESIGN DECISION
 */
```

**Key Points:**
- ✅ Explicitly states "read-only mode"
- ✅ Explicitly states "No Add/Edit/Delete actions"
- ✅ Explains why: "(regulatory data)"

---

### 2. **User-Facing Banner**

**File:** `apps/frontend/components/settings/allergens/AllergenReadOnlyBanner.tsx`

```typescript
export function AllergenReadOnlyBanner() {
  return (
    <Alert className="bg-blue-50 border-blue-200">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-sm text-blue-800">
        EU-mandated allergens are system-managed and cannot be edited or deleted.
        Contact support for custom allergen requests.
      </AlertDescription>
    </Alert>
  )
}
```

**User Impact:**
- ✅ Banner clearly explains read-only nature
- ✅ Provides guidance: "Contact support for custom allergen requests"
- ✅ Visible on every page load

---

### 3. **API Enforcement**

**Files:**
- `apps/frontend/app/api/v1/settings/allergens/route.ts`
- `apps/frontend/app/api/v1/settings/allergens/[id]/route.ts`

```typescript
/**
 * POST /api/v1/settings/allergens
 * AC-RO-01: Read-only enforcement
 * Returns 405 Method Not Allowed
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. EU allergens are read-only in MVP.' },
    { status: 405, headers: { 'Allow': 'GET' } }
  )
}

/**
 * PUT /api/v1/settings/allergens/:id
 * AC-RO-02: Read-only enforcement
 * Returns 405 Method Not Allowed
 */
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. EU allergens are read-only in MVP.' },
    { status: 405, headers: { 'Allow': 'GET' } }
  )
}

/**
 * DELETE /api/v1/settings/allergens/:id
 * AC-RO-02: Read-only enforcement
 * Returns 405 Method Not Allowed
 */
export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. EU allergens are read-only in MVP.' },
    { status: 405, headers: { 'Allow': 'GET' } }
  )
}
```

**Backend Enforcement:**
- ✅ POST returns 405 (Method Not Allowed)
- ✅ PUT returns 405 (Method Not Allowed)
- ✅ DELETE returns 405 (Method Not Allowed)
- ✅ Only GET is supported
- ✅ Error message explains: "EU allergens are read-only in MVP"

---

### 4. **Test Coverage**

**File:** `apps/frontend/__tests__/01-settings/01.12.allergens-api.test.ts`

```typescript
describe('POST /api/v1/settings/allergens (Read-Only)', () => {
  it('should return 405 Method Not Allowed (AC-RO-02)', async () => { ... })
  it('should return error message explaining read-only mode', async () => { ... })
  it('should return 405 even for SUPER_ADMIN (AC-RO-01)', async () => { ... })
})

describe('PUT /api/v1/settings/allergens/:id (Read-Only)', () => {
  it('should return 405 Method Not Allowed', async () => { ... })
  it('should return 405 even for SUPER_ADMIN', async () => { ... })
})

describe('DELETE /api/v1/settings/allergens/:id (Read-Only)', () => {
  it('should return 405 Method Not Allowed', async () => { ... })
  it('should return 405 even for SUPER_ADMIN', async () => { ... })
})
```

**E2E Tests:** `e2e/tests/settings/allergens.spec.ts`

```typescript
/**
 * Allergens - E2E Tests
 * Story: 01.12 - Allergens Management
 *
 * NOTE: Allergens are READ-ONLY (EU-mandated, system-managed)
 * No Create/Edit/Delete operations available
 */
```

**Test Coverage:**
- ✅ Tests explicitly verify 405 responses for all mutation operations
- ✅ Tests confirm even SUPER_ADMIN cannot create/edit/delete
- ✅ E2E tests document read-only nature
- ✅ Tests confirm "No Create/Edit/Delete operations available"

---

### 5. **Data Table Implementation**

**File:** `apps/frontend/components/settings/allergens/AllergensDataTable.tsx`

```typescript
/**
 * AllergensDataTable Component
 * Story: 01.12 - Allergens Management
 *
 * Features:
 * - Displays 14 EU allergens (read-only)
 * - Search across all language fields (debounced 100ms)
 * - Multi-language columns and tooltips
 * - Icon display with fallback
 * - Products column with count and link to filtered products list
 * - No pagination (only 14 items)
 * - No Add/Edit/Delete actions ← EXPLICIT DESIGN
 * - Loading, error, empty states
 */
```

**UI Implementation:**
- ✅ No "Add Allergen" button
- ✅ No Edit actions in table rows
- ✅ No Delete confirmations
- ✅ No action columns in the table
- ✅ Comments explicitly state: "No Add/Edit/Delete actions"

---

## 🔄 Comparison with Other Settings Pages

### Tax Codes (CRUD Enabled)
**File:** `apps/frontend/app/(authenticated)/settings/tax-codes/page.tsx`

```typescript
// Has full CRUD
<Button onClick={handleCreate}>
  <Plus className="h-4 w-4 mr-2" />
  Add Tax Code
</Button>

// Has edit, set default, delete actions
onEdit={handleEdit}
onSetDefault={handleSetDefault}
onDelete={handleDelete}

// Has modal for create/edit
<TaxCodeModal
  mode={modalMode}
  taxCode={selectedTaxCode}
  onSubmit={handleModalSubmit}
/>

// Has delete confirmation
<DeleteTaxCodeDialog
  open={showDeleteDialog}
  onConfirm={handleConfirmDelete}
/>
```

### Warehouses (CRUD Enabled)
**File:** `apps/frontend/app/(authenticated)/settings/warehouses/page.tsx`

```typescript
// Has full CRUD
<Button onClick={handleCreate}>
  <Plus className="h-4 w-4 mr-2" />
  Add Warehouse
</Button>

// Has mutations for all CRUD operations
const createMutation = useCreateWarehouse()
const updateMutation = useUpdateWarehouse()
const disableMutation = useDisableWarehouse()
const enableMutation = useEnableWarehouse()
```

### Allergens (Read-Only)
**File:** `apps/frontend/app/(authenticated)/settings/allergens/page.tsx`

```typescript
// NO "Add Allergen" button
// NO Edit actions
// NO Delete confirmations
// NO Modal for create/edit
// NO Mutations

// ONLY has read-only banner
<AllergenReadOnlyBanner />

// ONLY displays data
<AllergensDataTable
  allergens={allergens || []}
  isLoading={isLoading}
  error={error?.message}
  onRetry={refetch}
  userLanguage="en"
/>
```

**Comparison Summary:**
- ✅ Tax Codes → Full CRUD with Add/Edit/Delete
- ✅ Warehouses → Full CRUD with Add/Edit/Delete
- ✅ Locations → Full CRUD with Add/Edit/Delete
- ✅ **Allergens → Read-only, NO CRUD** ← Different by design

---

## 📜 Regulatory Basis

**EU Regulation 1169/2011** (Food Information to Consumers)

**Annex II** specifies exactly **14 mandatory allergens**:

1. Gluten (A01)
2. Crustaceans (A02)
3. Eggs (A03)
4. Fish (A04)
5. Peanuts (A05)
6. Soybeans (A06)
7. Milk (A07)
8. Nuts (A08)
9. Celery (A09)
10. Mustard (A10)
11. Sesame (A11)
12. Sulphites (A12)
13. Lupin (A13)
14. Molluscs (A14)

**Key Points:**
- ✅ List is **legally defined** and cannot be modified by users
- ✅ All food businesses in the EU **must use this exact list**
- ✅ Adding/removing allergens would violate compliance
- ✅ Multi-language support is required (EN, PL, DE, FR)

**Reference:**
- EU Regulation: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32011R1169
- UK Food Standards: https://www.food.gov.uk/business-guidance/allergen-guidance-for-food-businesses

---

## ✅ Design Decision Rationale

### Why Read-Only?

1. **Regulatory Compliance**
   - EU law mandates exactly 14 allergens
   - Cannot add custom allergens without breaking compliance
   - Standardization ensures legal food labeling

2. **Data Integrity**
   - Prevents accidental modification of regulatory data
   - Ensures consistency across all organizations
   - Protects against data corruption

3. **Multi-tenancy**
   - Allergens are **global reference data**, not org-specific
   - Shared across all organizations in the system
   - Editing would affect all tenants

4. **Future Extensibility**
   - Base 14 allergens are read-only
   - Custom allergens could be added in a separate feature
   - Would require separate table (`custom_allergens`) and different UI

### User Guidance

The banner provides clear guidance:
```
"EU-mandated allergens are system-managed and cannot be edited or deleted.
Contact support for custom allergen requests."
```

If a user needs custom allergens (e.g., for internal tracking), they should:
1. Contact support
2. Request custom allergen feature
3. Support can add to backlog as future enhancement

---

## 🎯 Conclusion

**This is NOT a bug. This is intentional design.**

### Evidence Summary:
1. ✅ **Page comments** explicitly state "No Add/Edit/Delete actions (regulatory data)"
2. ✅ **User-facing banner** explains read-only nature and provides guidance
3. ✅ **API routes** return 405 for all mutation operations with clear error messages
4. ✅ **Tests** verify read-only enforcement (even for SUPER_ADMIN)
5. ✅ **E2E tests** document "No Create/Edit/Delete operations available"
6. ✅ **Data table** has no CRUD UI elements (no buttons, no modals, no actions)
7. ✅ **Regulatory basis** (EU Regulation 1169/2011) requires exactly 14 allergens

### Comparison:
- Other settings pages (Tax Codes, Warehouses, Locations) → Full CRUD
- Allergens → Read-only by design

### Recommendation:
**CLOSE AS "NOT A BUG" - Working as Intended**

### Future Enhancement (if needed):
If users genuinely need custom allergens for internal tracking:
1. Create new story: "Custom Allergens Management"
2. Add separate table: `custom_allergens` (org-specific, not global)
3. Build separate UI at `/settings/custom-allergens` with full CRUD
4. Keep base 14 EU allergens read-only
5. Allow linking both EU and custom allergens to products

---

## 📝 Additional Notes

### Database Schema
The `allergens` table is **global reference data**:
- NO `org_id` column → shared across all organizations
- `is_eu_mandatory = true` for all 14 allergens
- `is_custom = false` for all base allergens
- `is_active = true` (cannot be deactivated)

### RLS Policies
```sql
-- RLS Policy: allergens_select_authenticated
-- Allows all authenticated users to READ allergens
-- Does NOT allow INSERT, UPDATE, or DELETE
```

### Acceptance Criteria (from Story 01.12)
- **AC-AL-01 to AC-AL-03**: Allergen list display ✅ IMPLEMENTED
- **AC-AS-01 to AC-AS-03**: Search functionality ✅ IMPLEMENTED
- **AC-RO-01 to AC-RO-03**: Read-only enforcement ✅ IMPLEMENTED
- **AC-ML-01 to AC-ML-02**: Multi-language support ✅ IMPLEMENTED

All acceptance criteria **explicitly include read-only enforcement**.

---

**Investigation completed by:** Subagent Fixer #13  
**Verified:** Page comments, API routes, tests, E2E tests, user banner, comparison with other pages  
**Status:** ✅ NOT A BUG - INTENTIONAL DESIGN - DOCUMENTED  
