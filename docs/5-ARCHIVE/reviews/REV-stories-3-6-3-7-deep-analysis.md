# Deep Analysis: Stories 3.6 & 3.7 - Code Review vs Implementation

**Analyst:** AI Assistant
**Date:** 2025-11-24
**Purpose:** Verify whether code review findings are valid or overly strict

---

## Executive Summary

**Verdict:** ✅ **Code Review is CORRECT and FAIR**

The code review accurately identified genuine gaps in the implementation. This is NOT a case of overly strict review or misunderstanding - the identified issues are real, documented in story requirements, and critical for production readiness.

**Root Causes:**
1. **Incomplete Implementation** - Key Acceptance Criteria (AC-3.6.7, AC-3.7.6) were skipped
2. **Zero Test Coverage** - Despite Definition of Done requiring 95% unit, 70% integration, 100% E2E
3. **Missing Authorization** - No role-based access control despite story requirements
4. **UX Gaps** - Format and searchability don't match story specifications

---

## Story 3.6: Transfer Order CRUD

### ✅ What WAS Implemented (Correct Implementation)

#### Backend (Excellent Quality)
1. **API Endpoints** - `apps/frontend/app/api/planning/transfer-orders/`
   - ✅ `GET /api/planning/transfer-orders` - List with filters
   - ✅ `POST /api/planning/transfer-orders` - Create TO
   - ✅ `GET /api/planning/transfer-orders/:id` - Get single TO
   - ✅ `PUT /api/planning/transfer-orders/:id` - Update TO
   - ✅ `DELETE /api/planning/transfer-orders/:id` - Delete TO

2. **Service Layer** - `apps/frontend/lib/services/transfer-order-service.ts`
   - ✅ TO number auto-generation (TO-YYYY-NNN format)
   - ✅ Warehouse validation (from ≠ to)
   - ✅ Date validation (receive >= ship)
   - ✅ Multi-org isolation via org_id
   - ✅ Status calculation logic
   - ✅ Error handling with proper codes

3. **Validation Schemas** - `apps/frontend/lib/validation/transfer-order-schemas.ts`
   - ✅ Zod schemas for create/update
   - ✅ Warehouse difference validation
   - ✅ Date range validation

4. **Database**
   - ✅ Migration exists (migration 026_create_transfer_orders_table.sql)
   - ✅ RLS policies enabled
   - ✅ Indexes for performance
   - ✅ Constraints for data integrity

#### Frontend (Good Quality)
1. **List Page** - `apps/frontend/components/planning/TransferOrdersTable.tsx`
   - ✅ Display TOs with TO Number, From/To Warehouse, Status, Dates
   - ✅ Search by TO number
   - ✅ Status filter dropdown
   - ✅ Click navigation to detail page
   - ✅ Edit/Delete actions

2. **Create/Edit Modal** - `apps/frontend/components/planning/TransferOrderFormModal.tsx`
   - ✅ From/To warehouse dropdowns
   - ✅ Planned ship/receive date pickers
   - ✅ Notes field
   - ✅ Validation: from ≠ to
   - ✅ Validation: receive >= ship
   - ✅ Auto-calculate receive date (ship + 1 day)

3. **Detail Page** - `apps/frontend/app/(authenticated)/planning/transfer-orders/[id]/page.tsx`
   - ✅ Display TO header (number, status badge)
   - ✅ Show warehouse details
   - ✅ Show planned and actual dates
   - ✅ Display notes
   - ✅ Embed TOLinesTable component

### ❌ What is MISSING (Review Correctly Identified)

#### Critical Gap #1: AC-3.6.7 - Change Status to 'Planned'

**Story Requirement (Line 219-240):**
```
AC-3.6.7: Change TO Status to 'Planned'
Given: I am viewing a TO with status = 'draft' and at least 1 TO line exists
When: I click "Plan Transfer Order"
Then: TO status should change to 'planned' via PUT /api/planning/transfer-orders/:id/status

API Endpoint:
PUT /api/planning/transfer-orders/:id/status
Body: { status: 'planned' }
Response: TransferOrder object
```

**What Exists:**
- ❌ No `/status` endpoint (checked: `apps/frontend/app/api/planning/transfer-orders/[id]/`)
- ❌ Only has `/ship` endpoint (Story 3.8)
- ❌ No "Plan Transfer Order" button in UI
- ❌ Cannot transition TO from draft → planned

**Impact:** BLOCKER
- Users cannot progress TO from draft to planned
- Workflow is incomplete
- Blocks Stories 3.8 and 3.9 (ship/receive require 'planned' status)

**Verification:**
```bash
$ ls apps/frontend/app/api/planning/transfer-orders/[id]/
lines/  route.ts  ship/
# No 'status/' directory exists
```

---

#### Critical Gap #2: Role-Based Authorization

**Story Requirement (Line 40):**
```
As a Warehouse user
I want to create, edit, and view transfer orders

AC-3.6.1: Given I have Warehouse role or higher
```

**What Exists:**
- ✅ Authentication check (session exists)
- ✅ Org_id isolation (RLS policies)
- ❌ NO role check in service layer
- ❌ NO role check in API routes

**Code Evidence:**
```typescript
// apps/frontend/lib/services/transfer-order-service.ts:53-71
async function getCurrentOrgId(): Promise<string | null> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userData, error } = await supabase
    .from('users')
    .select('org_id')  // ❌ Should select 'role, org_id'
    .eq('id', user.id)
    .single()

  // ❌ No role validation
  return userData.org_id
}
```

**Impact:** SECURITY VULNERABILITY
- Any authenticated user can create/edit/delete TOs
- No enforcement of "Warehouse role or higher" requirement
- Violates principle of least privilege

**Comparison with Story 3.17 (Supplier Management):**
Story 3.17 DOES implement role-based auth correctly:
```typescript
// apps/frontend/app/api/planning/suppliers/route.ts:38
if (!['purchasing', 'manager', 'admin'].includes(currentUser.role.toLowerCase())) {
  return NextResponse.json(
    { error: 'Forbidden: Purchasing role or higher required' },
    { status: 403 }
  )
}
```

**Recommendation:** Copy this pattern to transfer-order-service.ts

---

#### Critical Gap #3: Zero Test Coverage

**Story Requirement (Line 471-495):**
```
Testing Requirements

Unit Tests (Vitest)
- ✅ CreateTransferOrderSchema validation (from ≠ to, receive >= ship)
- ✅ UpdateTransferOrderSchema validation
- ✅ TO number generator (sequential, year reset, thread-safe)

Integration Tests (Vitest + Supabase)
- ✅ POST /api/planning/transfer-orders creates TO with auto-generated number
- ✅ RLS policy: User A cannot view User B's TOs (different org)
- ✅ Validation: Cannot create TO with from = to warehouse (400)
- ✅ Unique constraint: Cannot create duplicate to_number (409)

E2E Tests (Playwright)
- ✅ Create TO: Fill form, save, verify TO-2025-001 created
- ✅ Edit TO: Update dates, save, verify changes
- ✅ Delete TO: Confirm deletion, verify TO removed from list
- ✅ Validation errors: Submit form with from = to warehouse, verify error
```

**What Exists:**
```bash
$ find apps/frontend -name "*transfer*test*" -o -name "*to-*test*"
# NO FILES FOUND
```

- ❌ 0 unit tests
- ❌ 0 integration tests
- ❌ 0 E2E tests
- ❌ Coverage: 0% (required: 95% unit, 70% integration, 100% E2E)

**Impact:** PRODUCTION RISK
- No automated validation of business logic
- No regression protection
- Cannot confidently refactor or extend
- DoD not met

---

### 📊 Story 3.6 Scorecard

| Acceptance Criteria | Status | Implementation |
|---------------------|--------|----------------|
| AC-3.6.1: List Page | ✅ PASS | TransferOrdersTable with filters |
| AC-3.6.2: Create Modal | ✅ PASS | TransferOrderFormModal with validation |
| AC-3.6.3: Save TO | ✅ PASS | POST endpoint, auto TO number |
| AC-3.6.4: View Detail | ✅ PASS | TO detail page with all fields |
| AC-3.6.5: Edit TO | ✅ PASS | PUT endpoint, edit modal |
| AC-3.6.6: Delete TO | ✅ PASS | DELETE endpoint, confirmation dialog |
| **AC-3.6.7: Change Status to 'Planned'** | ❌ **FAIL** | **Endpoint missing, no UI button** |
| AC-3.6.8: TO Number Auto-Gen | ✅ PASS | generateToNumber() works correctly |
| **Role-Based Authorization** | ❌ **FAIL** | **No role check anywhere** |
| **Unit Tests** | ❌ **FAIL** | **0 tests (required: 95% coverage)** |
| **Integration Tests** | ❌ **FAIL** | **0 tests (required: 70% coverage)** |
| **E2E Tests** | ❌ **FAIL** | **0 tests (required: 100% coverage)** |

**Overall Score:** 5/12 ACs passing (42%)
**Critical Issues:** 3 HIGH severity (AC-3.6.7, Auth, Tests)
**Review Verdict:** 🔴 **BLOCKED** - Cannot proceed to Done

---

## Story 3.7: TO Line Management

### ✅ What WAS Implemented (Correct Implementation)

#### Backend (Excellent Quality)
1. **API Endpoints** - `apps/frontend/app/api/planning/transfer-orders/[id]/lines/`
   - ✅ `GET /api/planning/transfer-orders/:id/lines` - List TO lines
   - ✅ `POST /api/planning/transfer-orders/:id/lines` - Create line
   - ✅ `PUT /api/planning/transfer-orders/:id/lines/:lineId` - Update line
   - ✅ `DELETE /api/planning/transfer-orders/:id/lines/:lineId` - Delete line

2. **Service Logic**
   - ✅ UoM inheritance from product
   - ✅ Status check (can only edit lines if TO status = 'draft')
   - ✅ Quantity validation (> 0, <= 999999)
   - ✅ Duplicate products allowed (same product can appear multiple times)

3. **Validation Schemas** - `apps/frontend/lib/validation/transfer-order-schemas.ts`
   - ✅ CreateToLineInput with product_id, quantity, notes
   - ✅ UpdateToLineInput with quantity, notes

4. **Database**
   - ✅ Migration exists (to_lines table)
   - ✅ RLS policies via transfer_orders join
   - ✅ Constraints: quantity > 0, shipped_qty <= quantity, received_qty <= shipped_qty

#### Frontend (Good Quality)
1. **TO Lines Table** - `apps/frontend/components/planning/TOLinesTable.tsx`
   - ✅ Display lines with Product, Quantity, UoM, Shipped, Received
   - ✅ Add Line button
   - ✅ Edit/Delete actions per line
   - ✅ Empty state message

2. **TO Line Form Modal** - `apps/frontend/components/planning/TOLineFormModal.tsx`
   - ✅ Product dropdown (populated from /api/technical/products)
   - ✅ Quantity input with validation
   - ✅ UoM auto-filled from selected product (read-only)
   - ✅ Notes field (optional)
   - ✅ Product read-only in edit mode

3. **Integration**
   - ✅ TOLinesTable embedded in TO detail page
   - ✅ onLinesUpdate callback refreshes TO status

### ❌ What is MISSING (Review Correctly Identified)

#### Critical Gap #1: AC-3.7.6 - TO Lines Summary

**Story Requirement (Line 179-198):**
```
AC-3.7.6: TO Lines Summary
Given: A TO has multiple lines
When: Viewing the TO detail page
Then: I should see a summary section above the lines table:
- Total Lines: 3 products
- Total Planned Qty: (sum of all quantities with mixed UoMs)
- Shipped Status: 0% shipped (0/3 products fully shipped)
- Received Status: 0% received (0/3 products fully received)

Success Criteria:
✅ Summary updates in real-time when lines added/edited/deleted
✅ Shipped Status: Calculate % of lines where shipped_qty >= quantity
✅ Received Status: Calculate % of lines where received_qty >= shipped_qty
✅ Summary card styled with border, padding, responsive grid
```

**What Exists:**
- ❌ NO summary section above TOLinesTable
- ❌ NO "Total Lines" display
- ❌ NO "Shipped Status" percentage
- ❌ NO "Received Status" percentage
- ✅ Lines count could be calculated from `lines.length`
- ✅ Data available in lines array (shipped_qty, received_qty, quantity)

**Impact:** MEDIUM Priority UX Issue
- Users cannot see transfer progress at a glance
- No quick overview of fulfillment status
- Must manually scan each line to assess completion

**Example of What's Missing:**
```tsx
// Should exist ABOVE TOLinesTable in transfer-orders/[id]/page.tsx
<div className="border rounded-lg p-4 grid grid-cols-4 gap-4">
  <div>
    <p className="text-sm text-gray-600">Total Lines</p>
    <p className="text-2xl font-bold">{totalLines} products</p>
  </div>
  <div>
    <p className="text-sm text-gray-600">Shipped Status</p>
    <p className="text-2xl font-bold">{shippedPercent}%</p>
    <p className="text-xs text-gray-500">({shippedCount}/{totalLines} products)</p>
  </div>
  {/* ... Received Status ... */}
</div>
```

---

#### Critical Gap #2: Shipped/Received Format

**Story Requirement (Line 50-51):**
```
AC-3.7.1: TO Lines Table Display
- Shipped Qty column format: "0 / 10 kg" (shipped / planned, UoM)
- Received Qty column format: "0 / 10 kg" (received / planned, UoM)
```

**What Exists:**
```tsx
// apps/frontend/components/planning/TOLinesTable.tsx:215-216
<TableCell className="text-right">{formatNumber(line.shipped_qty)}</TableCell>
<TableCell className="text-right">{formatNumber(line.received_qty)}</TableCell>

// Displays: "0.00" instead of "0/10 kg"
```

**What's Required:**
```tsx
<TableCell className="text-right">
  {formatNumber(line.shipped_qty)} / {formatNumber(line.quantity)} {line.uom}
</TableCell>
<TableCell className="text-right">
  {formatNumber(line.received_qty)} / {formatNumber(line.quantity)} {line.uom}
</TableCell>
// Displays: "0.00 / 10.00 kg"
```

**Impact:** MEDIUM Priority UX Issue
- Cannot see planned vs actual quantities
- Unclear what "0.00" means (0 out of how much?)
- Difficult to assess completion per line

---

#### Medium Gap #3: Product Dropdown Not Searchable

**Story Requirement (Line 68-69):**
```
AC-3.7.2: Add TO Line Modal
- Product dropdown populated via GET /api/technical/products
- Product dropdown searchable (by code or name)
```

**What Exists:**
```tsx
// apps/frontend/components/planning/TOLineFormModal.tsx:73-88
<Select
  value={formData.product_id}
  onValueChange={(value) => handleChange('product_id', value)}
  disabled={loadingProducts}
>
  <SelectTrigger>
    <SelectValue placeholder={loadingProducts ? 'Loading...' : 'Select product'} />
  </SelectTrigger>
  <SelectContent>
    {products.map((product) => (
      <SelectItem key={product.id} value={product.id}>
        {product.code} - {product.name} ({product.uom})
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Problem:**
- ❌ Standard shadcn Select is NOT searchable
- ❌ With >100 products, scrolling is unusable
- ❌ No filtering or search capability

**Solution:**
Use `<Combobox>` component instead of `<Select>`:
```tsx
import { Combobox } from '@/components/ui/combobox'

<Combobox
  value={formData.product_id}
  onChange={(value) => handleChange('product_id', value)}
  options={products.map(p => ({
    label: `${p.code} - ${p.name}`,
    value: p.id
  }))}
  searchable
  placeholder="Search products..."
/>
```

**Impact:** MEDIUM Priority UX Issue
- Unusable with large product catalogs (>50 products)
- Violates accessibility best practices
- Story explicitly requires searchability

---

#### Minor Gap #4: Edit/Delete Buttons Always Visible

**Story Requirement (Line 52):**
```
AC-3.7.1: TO Lines Table Display
- Actions column: Edit (icon button), Delete (icon button) - only if TO status = 'draft'
```

**What Exists:**
```tsx
// apps/frontend/components/planning/TOLinesTable.tsx:217-233
<TableCell className="text-right">
  <div className="flex justify-end gap-2">
    <Button
      variant="ghost"
      size="sm"
      onClick={() => openEditModal(line)}
    >
      <Pencil className="h-4 w-4" />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => openDeleteDialog(line)}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
</TableCell>
```

**Problem:**
- ❌ Buttons always visible (no status check)
- ❌ Clicking edit/delete on non-draft TO shows error after API call
- ❌ Should be hidden/disabled BEFORE user clicks

**Solution:**
Pass TO status to TOLinesTable and conditionally render:
```tsx
interface TOLinesTableProps {
  transferOrderId: string
  toStatus: string  // Add this
  onLinesUpdate?: () => void
}

// In render:
{toStatus === 'draft' && (
  <div className="flex justify-end gap-2">
    <Button onClick={() => openEditModal(line)}>
      <Pencil className="h-4 w-4" />
    </Button>
    {/* ... */}
  </div>
)}
```

**Impact:** LOW Priority UX Issue
- Confusing user experience
- Error only shown after failed API call
- Better UX: disable buttons proactively

---

#### Minor Gap #5: Missing Product Code Column

**Story Requirement (Line 42-43):**
```
AC-3.7.1: TO Lines Table Display
Table columns: Product Code, Product Name, Planned Qty, UoM, Shipped Qty, Received Qty, Actions
```

**What Exists:**
```tsx
// apps/frontend/components/planning/TOLinesTable.tsx:184-191
<TableHeader>
  <TableRow>
    <TableHead>Product</TableHead>  {/* Combined Code + Name */}
    <TableHead className="text-right">Quantity</TableHead>
    <TableHead>UoM</TableHead>
    <TableHead className="text-right">Shipped</TableHead>
    <TableHead className="text-right">Received</TableHead>
    <TableHead className="text-right w-24">Actions</TableHead>
  </TableRow>
</TableHeader>
```

**Problem:**
- ❌ Product Code and Name combined in one column
- ❌ Story requires separate columns

**Current Display:**
```
Product           | Quantity | UoM
------------------+----------+----
Apple Juice       |   10.00  | L
  JUICE-001       |          |
```

**Required Display:**
```
Product Code | Product Name  | Quantity | UoM
-------------+---------------+----------+----
JUICE-001    | Apple Juice   |   10.00  | L
```

**Impact:** LOW Priority (Cosmetic)
- Still functional (code shown as sub-text)
- Not aligned with story spec
- May affect sorting/filtering if implemented later

---

#### Minor Gap #6: UoM Shown as Text Instead of Disabled Input

**Story Requirement (Line 70-71):**
```
AC-3.7.2: Add TO Line Modal
- UoM (read-only, auto-filled from selected product)
- UoM field disabled (grayed out, read-only)
```

**What Exists:**
```tsx
// apps/frontend/components/planning/TOLineFormModal.tsx:104-109
{selectedProduct && (
  <div className="text-sm text-gray-500 mt-1">
    UoM: {selectedProduct.uom}
  </div>
)}
```

**Problem:**
- ❌ UoM shown as plain text below dropdown
- ❌ Not a disabled input field
- ❌ Story requires "UoM field disabled (grayed out)"

**Required:**
```tsx
<div className="space-y-2">
  <Label htmlFor="uom">UoM</Label>
  <Input
    id="uom"
    value={selectedProduct?.uom || ''}
    disabled
    className="bg-gray-100 cursor-not-allowed"
  />
</div>
```

**Impact:** LOW Priority (Cosmetic)
- Current approach is more elegant
- Story spec might be overly prescriptive
- Consider discussing with PO if current UX is acceptable

---

#### Critical Gap #7: AC-3.7.8 - Cannot Plan Without Lines (Blocked by AC-3.6.7)

**Story Requirement (Line 218-228):**
```
AC-3.7.8: Validation - Cannot Plan TO Without Lines
Given: A TO with status = 'draft' and 0 lines
When: I try to change status to 'planned' (Story 3.6)
Then: I should receive an error

Success Criteria:
✅ API validation: PUT /api/planning/transfer-orders/:id/status checks line count
✅ Error message: "Cannot plan Transfer Order without lines. Add at least one product."
```

**What Exists:**
- ❌ Cannot implement - AC-3.6.7 (status change endpoint) doesn't exist
- ❌ No `/status` endpoint to validate against
- ✅ Service layer has calculateToStatus() function (could be used)

**Impact:** BLOCKED
- Depends on AC-3.6.7 being implemented first
- Cannot validate without status change functionality

---

#### Critical Gap #8: Zero Test Coverage

**Story Requirement (Line 394-415):**
Same as Story 3.6 - requires 95% unit, 70% integration, 100% E2E coverage.

**What Exists:**
```bash
$ find apps/frontend -name "*to-line*test*" -o -name "*transfer-order-line*test*"
# NO FILES FOUND
```

- ❌ 0 unit tests
- ❌ 0 integration tests
- ❌ 0 E2E tests
- ❌ Coverage: 0%

**Impact:** PRODUCTION RISK (same as Story 3.6)

---

### 📊 Story 3.7 Scorecard

| Acceptance Criteria | Status | Implementation |
|---------------------|--------|----------------|
| AC-3.7.1: TO Lines Table | 🟡 PARTIAL | Table exists, format issues |
| AC-3.7.2: Add TO Line Modal | 🟡 PARTIAL | Modal exists, not searchable |
| AC-3.7.3: Save TO Line | ✅ PASS | POST endpoint, UoM inheritance |
| AC-3.7.4: Edit TO Line | ✅ PASS | PUT endpoint, modal works |
| AC-3.7.5: Delete TO Line | ✅ PASS | DELETE endpoint, confirmation |
| **AC-3.7.6: TO Lines Summary** | ❌ **FAIL** | **Summary section missing** |
| AC-3.7.7: Duplicate Product Allowed | ✅ PASS | No unique constraint |
| **AC-3.7.8: Validation** | ❌ **FAIL** | **Blocked by AC-3.6.7** |
| **Unit Tests** | ❌ **FAIL** | **0 tests** |
| **Integration Tests** | ❌ **FAIL** | **0 tests** |
| **E2E Tests** | ❌ **FAIL** | **0 tests** |

**Overall Score:** 3/11 ACs passing (27%)
**Critical Issues:** 2 HIGH severity (AC-3.7.6, Tests), 1 BLOCKED (AC-3.7.8)
**Medium Issues:** 4 (format, searchability, button visibility, product code)
**Low Issues:** 1 (UoM display style)
**Review Verdict:** 🟡 **CHANGES REQUESTED**

---

## Where Does the Problem Lie?

### 1. ❌ NOT in Story Definition

**Story files are EXCELLENT:**
- ✅ Clear, detailed Acceptance Criteria
- ✅ Specific API endpoints documented
- ✅ UI mockups and validation rules specified
- ✅ Test requirements clearly defined
- ✅ DoD checklist comprehensive

**Evidence:**
- AC-3.6.7 explicitly defines `/status` endpoint (line 219-240)
- AC-3.7.6 specifies exact summary layout (line 179-198)
- Role-based auth mentioned in user story (line 40)
- Test requirements detailed with examples (line 471-495)

### 2. ❌ NOT in Code Review Process

**Review correctly identified:**
- ✅ Missing AC-3.6.7 (status endpoint)
- ✅ Missing AC-3.7.6 (TO lines summary)
- ✅ Zero test coverage
- ✅ Missing role-based authorization
- ✅ UX formatting issues

**Review is FAIR, not overly strict:**
- Issues are documented in story requirements
- Gaps are production-critical (auth, tests) or UX-critical (summary, format)
- No nitpicking or subjective complaints

### 3. ✅ Problem Lies in IMPLEMENTATION PHASE

**What went wrong:**

**A) Template Library Approach Created False Sense of Completion**
- Template A (CRUD) pattern was followed
- But AC-3.6.7 and AC-3.7.6 are NOT part of standard CRUD
- These are custom features specific to TO workflow
- Implementer assumed "CRUD done = story done"

**B) DoD Not Enforced**
- Definition of Done requires 95% test coverage
- 0 tests were written
- Story marked complete without DoD validation

**C) Role-Based Auth Oversight**
- User story mentions "Warehouse user" (line 40)
- AC-3.6.1 says "Given I have Warehouse role or higher" (line 40)
- But implementation only checks authentication, not authorization
- Story 3.17 (Supplier) implemented role-based auth correctly - inconsistency

**D) Rush to Commit**
- User requested "kontynuuj nastepne 2 story bez kommitu i pytan" (continue next 2 stories without commits and questions)
- Stories 3.7 and 3.10 implemented rapidly
- No time for story requirements cross-check
- Focus on speed over completeness

---

## Recommendations

### Immediate Actions (Before Marking Stories "Done")

#### For Story 3.6:
1. **Implement AC-3.6.7** (HIGH priority)
   - Create `apps/frontend/app/api/planning/transfer-orders/[id]/status/route.ts`
   - Add `PUT` endpoint to change status
   - Validate: TO must have at least 1 line before planning
   - Add "Plan Transfer Order" button to detail page (conditional on status='draft')

2. **Add Role-Based Authorization** (HIGH priority)
   - Modify `getCurrentOrgId()` to also fetch user role
   - Add role validation: `['warehouse', 'purchasing', 'technical', 'admin']`
   - Return 403 Forbidden if unauthorized
   - Copy pattern from Story 3.17 (suppliers)

3. **Write Tests** (HIGH priority)
   - Unit tests: TO number generator, schema validation
   - Integration tests: CRUD operations, RLS policies
   - E2E tests: Create/edit/delete flows
   - Target: 95% unit, 70% integration, 100% E2E

#### For Story 3.7:
1. **Implement AC-3.7.6 - TO Lines Summary** (HIGH priority)
   - Add summary card above TOLinesTable
   - Calculate: Total Lines, Shipped %, Received %
   - Update in real-time when lines change

2. **Fix Shipped/Received Format** (MEDIUM priority)
   - Change from "0.00" to "0 / 10 kg" format
   - Lines 215-216 in TOLinesTable.tsx

3. **Make Product Dropdown Searchable** (MEDIUM priority)
   - Replace `<Select>` with `<Combobox>` component
   - Enable search by product code or name

4. **Add Conditional Button Visibility** (MEDIUM priority)
   - Pass TO status to TOLinesTable
   - Hide Edit/Delete buttons if status ≠ 'draft'

5. **Write Tests** (HIGH priority)
   - Same as Story 3.6

### Process Improvements

1. **Add Pre-Commit Checklist**
   - [ ] All ACs implemented (not just CRUD basics)
   - [ ] Role-based auth verified
   - [ ] Tests written and passing
   - [ ] DoD criteria met

2. **AC Cross-Reference During Implementation**
   - Print story file alongside code editor
   - Check off each AC as implemented
   - Don't rely on memory or assumptions

3. **Separate "Feature Complete" from "Done"**
   - Feature Complete = All code written
   - Done = Feature Complete + Tests + Review Passed + DoD Met

4. **Template Library Enhancement**
   - Note: "Template A covers basic CRUD only"
   - Custom ACs (like status transitions, summaries) require additional implementation
   - Don't assume template completion = story completion

---

## Conclusion

**Code Review Verdict:** ✅ **VALID and ACCURATE**

The review correctly identified genuine gaps. This is not a case of:
- ❌ Overly strict reviewer
- ❌ Misunderstanding of requirements
- ❌ Nitpicking cosmetic issues

**Root Cause:** Implementation phase focused on Template A (CRUD) completion and skipped custom ACs (3.6.7, 3.7.6) and DoD requirements (tests, role-based auth).

**Comparison:**
- **Story 3.1, 3.2** (PO CRUD + Lines): Same template pattern, NO custom workflow ACs → Likely complete
- **Story 3.6, 3.7** (TO CRUD + Lines): Same template pattern, PLUS custom workflow ACs (status change, summary) → Incomplete

**Effort to Fix:**
- Story 3.6: ~4-6 hours (status endpoint + auth + basic tests)
- Story 3.7: ~3-4 hours (summary section + format fixes + basic tests)
- Total: ~8 hours to move both stories from "Changes Requested" → "Done"

**Quality of Existing Code:** ⭐⭐⭐⭐ (4/5)
- Architecture is excellent
- Backend service layer well-designed
- Frontend components clean and reusable
- Missing pieces are well-scoped and easy to add

**Recommendation:** Unblock stories by implementing missing ACs, then proceed with review-recommended fixes.
