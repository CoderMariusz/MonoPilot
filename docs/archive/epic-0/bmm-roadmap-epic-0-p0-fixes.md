# Implementation Roadmap: Epic 0 - P0 Modules Data Integrity Fixes

**Date:** 2025-11-14
**Project:** MonoPilot MES
**Roadmap Type:** Critical Prerequisite (Before Phase 1)
**Prepared by:** Dev Team (BMAD Method)
**Priority:** 🔴 P0 (CRITICAL - BLOCKER FOR PHASE 1)

---

## Executive Summary

**Epic 0** addresses **7 critical data integrity issues** discovered during solutioning gate check (2025-11-14) in already-implemented P0 modules (Technical, Planning, Production, Warehouse, Scanner, Settings).

**Critical Discovery:**
During automated audit of DB schema vs TypeScript vs API vs UI, **severe inconsistencies** were found that prevent core workflows from functioning correctly.

**Impact:**

- ❌ **Quick PO Entry workflow BROKEN** - SQL error (warehouse_id doesn't exist)
- ❌ **License Plate workflow BROKEN** - enum mismatch prevents status updates
- ⚠️ **5 additional medium-priority issues** requiring fixes

**Timeline Impact:**

- **Original MVP Timeline:** 24 weeks (Phase 1-2)
- **New MVP Timeline:** 31 weeks (Epic 0 + Phase 1-2)
- **Added Duration:** +7 weeks (Epic 0 prerequisite)

**Goals:**

1. Fix all 7 critical inconsistencies between DB ↔ TypeScript ↔ API ↔ UI
2. Verify all P0 modules (WO, Products, BOMs, etc.) for additional issues
3. Implement automated validation to prevent future inconsistencies
4. Pass all quality gates before starting Phase 1 (Epic 1.1)

**Success Metrics:**

- ✅ Zero critical inconsistencies (DB ↔ TS ↔ API ↔ UI)
- ✅ Quick PO Entry workflow working end-to-end
- ✅ License Plate lifecycle (create → reserve → consume → ship) working
- ✅ All E2E tests passing for P0 modules
- ✅ Automated validation tests in CI/CD pipeline

---

## Epic 0 Overview

### Total Effort

**71 Story Points (142 hours, ~7 weeks)**

### Breakdown by Priority

- 🔴 **Critical (2 stories):** 21 SP (42 hours) - Stories 0.1, 0.3
- 🟡 **Medium (3 stories):** 16 SP (32 hours) - Stories 0.2, 0.4, 0.5
- ⚠️ **Verification (1 story):** 21 SP (42 hours) - Story 0.6
- ✅ **Prevention (1 story):** 13 SP (26 hours) - Story 0.7

### Sprint Plan

- **Sprint 0.1 (2 weeks):** Stories 0.1, 0.2 (11 SP) - Critical fixes start
- **Sprint 0.2 (2 weeks):** Stories 0.3, 0.4 (18 SP) - LP enum fixes
- **Sprint 0.3 (2 weeks):** Stories 0.5, 0.6 (29 SP) - UoM + deep audit
- **Sprint 0.4 (1 week):** Story 0.7 (13 SP) - Automated validation

---

## Story 0.1: Fix PO Header `warehouse_id` (CRITICAL)

**Priorytet:** 🔴 **KRYTYCZNY**
**Effort:** 8 SP (16 hours, 2 days)
**Sprint:** 0.1 (Week 1-2)

### Problem Description

**What's broken:**

- API `quick_create_pos` accepts `warehouse_id` parameter (purchaseOrders.ts:11, 300)
- RPC function tries to INSERT `warehouse_id` into `po_header` (migrations/039_rpc_functions.sql:304)
- **Column `warehouse_id` DOES NOT EXIST** in `po_header` table (migrations/016_po_header.sql)

**SQL Error:**

```
ERROR: column "warehouse_id" of relation "po_header" does not exist
```

**Impact:**

- ❌ Quick PO Entry workflow completely broken (SQL error on INSERT)
- ❌ Cannot specify destination warehouse for Purchase Orders
- ❌ GRN creation doesn't know where to receive materials
- ❌ Planning module unusable for multi-warehouse operations

### Implementation Steps

#### 1. Database Migration (Day 1 - 4 hours)

```sql
-- Migration: 0XX_add_warehouse_id_to_po_header.sql

-- Add warehouse_id column to po_header
ALTER TABLE po_header
  ADD COLUMN warehouse_id INTEGER REFERENCES warehouses(id);

-- Add index for query performance
CREATE INDEX idx_po_header_warehouse_id ON po_header(warehouse_id);

-- Optional: Set default warehouse for existing POs (if any data exists)
-- UPDATE po_header
-- SET warehouse_id = (SELECT id FROM warehouses WHERE code = 'MAIN' LIMIT 1)
-- WHERE warehouse_id IS NULL;

-- Add comment
COMMENT ON COLUMN po_header.warehouse_id IS 'Destination warehouse for this Purchase Order (required for GRN routing)';
```

#### 2. TypeScript Interface Update (Day 1 - 1 hour)

```typescript
// lib/types.ts - Update POHeader interface

export interface POHeader {
  id: number;
  number: string;
  supplier_id: number;
  status: POStatus;
  currency: string;
  exchange_rate?: number;
  order_date: string;
  requested_delivery_date?: string;
  promised_delivery_date?: string;
  payment_due_date?: string;
  warehouse_id?: number; // ✅ ADD THIS LINE
  snapshot_supplier_name?: string;
  snapshot_supplier_vat?: string;
  snapshot_supplier_address?: string;
  asn_ref?: string;
  net_total?: number;
  vat_total?: number;
  gross_total?: number;
  created_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  // Relationships
  supplier?: Supplier;
  warehouse?: Warehouse; // ✅ ADD THIS LINE
  po_lines?: POLine[];
  po_corrections?: POCorrection[];
}
```

#### 3. UI Component Verification (Day 1-2 - 6 hours)

**Check these files:**

- `apps/frontend/app/planning/purchase-orders/create/page.tsx` (or similar)
- `apps/frontend/components/forms/POHeaderForm.tsx` (or similar)

**Required changes:**

```tsx
// POHeaderForm.tsx - Add warehouse dropdown

<FormField>
  <Label>Destination Warehouse *</Label>
  <Select
    name="warehouse_id"
    options={warehouses.map(w => ({
      value: w.id,
      label: `${w.code} - ${w.name}`,
    }))}
    required
  />
  <HelperText>Where should materials be received?</HelperText>
</FormField>
```

#### 4. API Verification (Day 2 - 2 hours)

**Verify RPC function:**

- `migrations/039_rpc_functions.sql` - `quick_create_pos` function
- Ensure `warehouse_id` is correctly inserted (already done, just verify after migration)

**Verify API call:**

- `lib/api/purchaseOrders.ts` - `quickCreate()` method
- Already passes `warehouse_id`, no changes needed

#### 5. Testing (Day 2 - 3 hours)

**Unit Tests:**

```typescript
// test/api/purchaseOrders.test.ts

describe('PurchaseOrdersAPI.quickCreate', () => {
  it('should create PO with warehouse_id', async () => {
    const request = {
      lines: [{ product_code: 'BEEF001', quantity: 100 }],
      warehouse_id: 1,
    };

    const response = await PurchaseOrdersAPI.quickCreate(request);

    expect(response.purchase_orders[0].warehouse_id).toBe(1);
  });
});
```

**E2E Test:**

```typescript
// e2e/planning/quick-po-entry.spec.ts

test('Quick PO Entry creates PO with correct warehouse', async ({ page }) => {
  // Navigate to Quick PO Entry
  await page.goto('/planning/quick-po-entry');

  // Select warehouse
  await page.selectOption('#warehouse', { label: 'Main Warehouse' });

  // Enter product lines
  await page.fill('#product-0', 'BEEF001');
  await page.fill('#quantity-0', '100');

  // Submit
  await page.click('button[type="submit"]');

  // Verify PO created with warehouse_id
  await expect(page.locator('.success-message')).toContainText(
    'PO created successfully'
  );

  // Verify in database
  const po = await supabase
    .from('po_header')
    .select('warehouse_id')
    .order('created_at', { descending: true })
    .limit(1)
    .single();

  expect(po.data.warehouse_id).toBe(1);
});
```

### Deliverables

- ✅ Migration file: `0XX_add_warehouse_id_to_po_header.sql`
- ✅ TypeScript update: `lib/types.ts` (POHeader interface)
- ✅ UI update: PO create form has warehouse dropdown
- ✅ Unit tests: API tests for warehouse_id
- ✅ E2E tests: Quick PO Entry workflow end-to-end
- ✅ Documentation: Update `docs/API_REFERENCE.md` (auto-generated)

### Success Criteria

- ✅ Migration executes successfully on staging environment
- ✅ Quick PO Entry creates PO without SQL error
- ✅ PO record has valid warehouse_id in database
- ✅ GRN creation uses correct warehouse from PO
- ✅ All E2E tests passing
- ✅ No TypeScript errors

**Effort:** 8 SP (16 hours)

---

## Story 0.2: Fix TO Status enum (MEDIUM)

**Priorytet:** 🟡 **ŚREDNI**
**Effort:** 3 SP (6 hours, 1 day)
**Sprint:** 0.1 (Week 1-2)

### Problem Description

**What's broken:**

- DB schema allows status='closed' (migrations/019_to_header.sql:9)
- TypeScript `TOStatus` enum does NOT include 'closed' (lib/types.ts:406-411)

**Impact:**

- ⚠️ If any SQL code sets status='closed', UI won't recognize it
- ⚠️ Filters and searches may not work for closed TOs
- ⚠️ Potential data inconsistency if business logic expects 'closed' status

### Implementation Steps

#### 1. TypeScript Enum Update (2 hours)

```typescript
// lib/types.ts

export type TOStatus =
  | 'draft'
  | 'submitted'
  | 'in_transit'
  | 'received'
  | 'closed' // ✅ ADD THIS
  | 'cancelled';
```

#### 2. UI Component Verification (2 hours)

**Check status badge rendering:**

```tsx
// components/StatusBadge.tsx

function getStatusColor(status: TOStatus) {
  switch (status) {
    case 'draft':
      return 'gray';
    case 'submitted':
      return 'blue';
    case 'in_transit':
      return 'yellow';
    case 'received':
      return 'green';
    case 'closed':
      return 'green'; // ✅ ADD THIS
    case 'cancelled':
      return 'red';
  }
}
```

#### 3. Testing (2 hours)

**Unit test:**

```typescript
test('TOStatus includes closed', () => {
  const validStatuses: TOStatus[] = [
    'draft',
    'submitted',
    'in_transit',
    'received',
    'closed',
    'cancelled',
  ];

  validStatuses.forEach(status => {
    expect(() => {
      const to: Partial<TOHeader> = { status };
    }).not.toThrow();
  });
});
```

### Deliverables

- ✅ TypeScript update: Add 'closed' to `TOStatus` enum
- ✅ UI update: Status badge handles 'closed' status
- ✅ Unit tests: Verify enum includes 'closed'

### Success Criteria

- ✅ TypeScript enum matches DB CHECK constraint
- ✅ UI renders 'closed' status correctly
- ✅ No TypeScript errors

**Effort:** 3 SP (6 hours)

---

## Story 0.3: Fix License Plate Status enum (CRITICAL)

**Priorytet:** 🔴 **KRYTYCZNY**
**Effort:** 13 SP (26 hours, 3-4 days)
**Sprint:** 0.2 (Week 3-4)

### Problem Description

**What's broken - SEVERE MISMATCH:**

**DB Schema (migrations/025_license_plates.sql:13):**

```sql
status VARCHAR(20) CHECK (status IN (
  'available', 'reserved', 'consumed', 'in_transit', 'quarantine', 'damaged'
))
```

**TypeScript (lib/types.ts:172-179):**

```typescript
export type LicensePlateStatus =
  | 'Available' // ✅ Matches 'available' (case issue)
  | 'Reserved' // ✅ Matches 'reserved' (case issue)
  | 'In Production' // ❌ NOT IN DB
  | 'QA Hold' // ❌ NOT IN DB
  | 'QA Released' // ❌ NOT IN DB
  | 'QA Rejected' // ❌ NOT IN DB
  | 'Shipped'; // ❌ NOT IN DB
// ❌ MISSING: consumed, in_transit, quarantine, damaged
```

**Analysis:**

- **Only 2 values match** (case-insensitive): available, reserved
- **DB has 4 values TypeScript doesn't:** consumed, in_transit, quarantine, damaged
- **TypeScript has 5 values DB doesn't:** In Production, QA Hold, QA Released, QA Rejected, Shipped

**Impact:**

- ❌ **WAREHOUSE WORKFLOW BROKEN** - cannot consume LPs (status='consumed' not recognized by UI)
- ❌ **SHIPPING BROKEN** - cannot ship LPs (status='shipped' not in DB)
- ❌ **QA WORKFLOW BROKEN** - cannot set QA statuses that TypeScript expects

### Proposed Solution: Unified Enum

**Architectural Decision:** Use **extended enum** combining both sources with lowercase convention.

```sql
-- Proposed DB schema (migration)
status VARCHAR(20) DEFAULT 'available' CHECK (status IN (
  'available',      -- LP available for use
  'reserved',       -- LP reserved for WO
  'in_production',  -- LP currently being processed in WO (was: "In Production")
  'consumed',       -- LP consumed by WO (traceability locked)
  'in_transit',     -- LP in transport between warehouses
  'quarantine',     -- LP in QA quarantine (was: "QA Hold")
  'qa_passed',      -- LP passed QA (was: "QA Released")
  'qa_rejected',    -- LP rejected by QA (was: "QA Rejected")
  'shipped',        -- LP shipped to customer
  'damaged'         -- LP physically damaged
))
```

```typescript
// Proposed TypeScript enum
export type LicensePlateStatus =
  | 'available'
  | 'reserved'
  | 'in_production'
  | 'consumed'
  | 'in_transit'
  | 'quarantine'
  | 'qa_passed'
  | 'qa_rejected'
  | 'shipped'
  | 'damaged';
```

### Implementation Steps

#### 1. Database Migration (Day 1 - 6 hours)

```sql
-- Migration: 0XX_fix_lp_status_enum.sql

-- Step 1: Drop old CHECK constraint
ALTER TABLE license_plates DROP CONSTRAINT license_plates_status_check;

-- Step 2: Map existing data (if any exists)
-- Convert old values to new values
UPDATE license_plates SET status = 'in_production' WHERE status = 'In Production';
UPDATE license_plates SET status = 'quarantine' WHERE status = 'QA Hold';
UPDATE license_plates SET status = 'qa_passed' WHERE status = 'QA Released';
UPDATE license_plates SET status = 'qa_rejected' WHERE status = 'QA Rejected';
UPDATE license_plates SET status = 'shipped' WHERE status = 'Shipped';
-- Note: 'available', 'reserved', 'consumed', 'in_transit', 'damaged' already lowercase

-- Step 3: Add new CHECK constraint with unified enum
ALTER TABLE license_plates ADD CONSTRAINT license_plates_status_check
  CHECK (status IN (
    'available',
    'reserved',
    'in_production',
    'consumed',
    'in_transit',
    'quarantine',
    'qa_passed',
    'qa_rejected',
    'shipped',
    'damaged'
  ));

-- Step 4: Update default value
ALTER TABLE license_plates ALTER COLUMN status SET DEFAULT 'available';
```

#### 2. TypeScript Update (Day 2 - 4 hours)

```typescript
// lib/types.ts

export type LicensePlateStatus =
  | 'available'
  | 'reserved'
  | 'in_production'
  | 'consumed'
  | 'in_transit'
  | 'quarantine'
  | 'qa_passed'
  | 'qa_rejected'
  | 'shipped'
  | 'damaged';
```

#### 3. API Updates (Day 2 - 4 hours)

**Search all API files for LP status usage:**

```bash
grep -r "In Production\|QA Hold\|QA Released\|QA Rejected\|Shipped" apps/frontend/lib/api/
```

**Update to use new lowercase values:**

```typescript
// lib/api/LicensePlatesAPI.ts

static async consume(lpId: number, woId: number): Promise<LicensePlate> {
  return await supabase
    .from('license_plates')
    .update({
      status: 'consumed',  // ✅ WAS: 'In Production' or 'consumed'
      consumed_by_wo_id: woId,
      consumed_at: new Date().toISOString()
    })
    .eq('id', lpId);
}

static async ship(lpId: number): Promise<LicensePlate> {
  return await supabase
    .from('license_plates')
    .update({ status: 'shipped' })  // ✅ NOW IN DB
    .eq('id', lpId);
}
```

#### 4. UI Component Updates (Day 3 - 8 hours)

**Update status badges:**

```tsx
// components/StatusBadge.tsx

function getLPStatusColor(status: LicensePlateStatus): string {
  switch (status) {
    case 'available':
      return 'green';
    case 'reserved':
      return 'blue';
    case 'in_production':
      return 'yellow';
    case 'consumed':
      return 'gray';
    case 'in_transit':
      return 'purple';
    case 'quarantine':
      return 'orange';
    case 'qa_passed':
      return 'green';
    case 'qa_rejected':
      return 'red';
    case 'shipped':
      return 'blue';
    case 'damaged':
      return 'red';
  }
}

function getLPStatusLabel(status: LicensePlateStatus): string {
  switch (status) {
    case 'available':
      return 'Available';
    case 'reserved':
      return 'Reserved';
    case 'in_production':
      return 'In Production';
    case 'consumed':
      return 'Consumed';
    case 'in_transit':
      return 'In Transit';
    case 'quarantine':
      return 'Quarantine (QA Hold)';
    case 'qa_passed':
      return 'QA Passed';
    case 'qa_rejected':
      return 'QA Rejected';
    case 'shipped':
      return 'Shipped';
    case 'damaged':
      return 'Damaged';
  }
}
```

**Update all LP components:**

- Warehouse LP list
- Scanner LP details
- Production output LP creation
- Shipping LP selection

#### 5. Testing (Day 4 - 4 hours)

**E2E Test - LP Lifecycle:**

```typescript
// e2e/warehouse/lp-lifecycle.spec.ts

test('LP status transitions work correctly', async ({ page }) => {
  // 1. Create LP (status: available)
  const lp = await createLP({ product_id: 1, quantity: 100 });
  expect(lp.status).toBe('available');

  // 2. Reserve for WO (status: reserved)
  await LicensePlatesAPI.reserve(lp.id, woId);
  const reserved = await LicensePlatesAPI.getById(lp.id);
  expect(reserved.status).toBe('reserved');

  // 3. Consume in production (status: consumed)
  await LicensePlatesAPI.consume(lp.id, woId);
  const consumed = await LicensePlatesAPI.getById(lp.id);
  expect(consumed.status).toBe('consumed');

  // 4. Ship LP (status: shipped)
  await LicensePlatesAPI.ship(outputLpId);
  const shipped = await LicensePlatesAPI.getById(outputLpId);
  expect(shipped.status).toBe('shipped');
});

test('QA workflow statuses work', async ({ page }) => {
  const lp = await createLP({ product_id: 1, quantity: 100 });

  // QA Hold
  await LicensePlatesAPI.quarantine(lp.id);
  expect((await LicensePlatesAPI.getById(lp.id)).status).toBe('quarantine');

  // QA Pass
  await LicensePlatesAPI.qaPass(lp.id);
  expect((await LicensePlatesAPI.getById(lp.id)).status).toBe('qa_passed');
});
```

### Deliverables

- ✅ Migration: `0XX_fix_lp_status_enum.sql`
- ✅ Data migration: Existing LPs mapped to new statuses
- ✅ TypeScript: `LicensePlateStatus` enum updated
- ✅ API: All LP methods use new statuses
- ✅ UI: All components render new statuses correctly
- ✅ E2E tests: LP lifecycle fully tested

### Success Criteria

- ✅ DB and TypeScript enums 100% synchronized
- ✅ LP lifecycle works end-to-end (create → reserve → consume → ship)
- ✅ QA workflow works (quarantine → qa_passed/qa_rejected)
- ✅ All E2E tests passing
- ✅ No TypeScript errors

**Effort:** 13 SP (26 hours)

---

## Stories 0.4 - 0.7: Summary

### Story 0.4: Fix LP QA Status enum (5 SP)

- Remove 'Quarantine' from QAStatus (it belongs to `status`, not `qa_status`)
- Change 'Hold' to 'on_hold' (match DB)
- Use lowercase convention

### Story 0.5: Fix LP UoM constraint (8 SP)

- Decision: Remove CHECK constraint OR create UoM master table
- Allow more units: GALLON, POUND, BOX, PALLET, CASE, DRUM
- Update UI dropdown to allow all units

### Story 0.6: Deep Audit - WO, Products, BOMs (21 SP)

- Comprehensive audit of remaining P0 modules
- Compare DB schema vs TypeScript vs API vs UI
- Fix any additional inconsistencies found
- Focus on: work_orders, products, boms, bom_items, wo_materials, wo_by_products

### Story 0.7: Automated Validation Tests (13 SP)

- Schema validation script (compare DB vs TypeScript enums)
- API contract tests
- CI/CD integration (pre-commit hooks)
- Prevents future inconsistencies

---

## Quality Gates

### Before starting Phase 1 (Epic 1.1), ALL must be ✅:

1. **Zero Critical Inconsistencies**
   - ✅ DB ↔ TypeScript enums 100% synchronized
   - ✅ API uses correct column names and types
   - ✅ UI components use correct enums

2. **All Workflows Working**
   - ✅ Quick PO Entry creates PO with warehouse_id
   - ✅ LP lifecycle (create → reserve → consume → ship) works
   - ✅ QA workflow (quarantine → qa_passed/rejected) works

3. **All Tests Passing**
   - ✅ Unit tests for all APIs updated
   - ✅ E2E tests for all critical workflows passing
   - ✅ No TypeScript compilation errors

4. **Automated Validation Deployed**
   - ✅ Schema validation script in CI/CD
   - ✅ Pre-commit hooks validate DB ↔ TypeScript sync
   - ✅ API contract tests in test suite

---

## References

**Related Documents:**

- **Audit Report:** `docs/P0-MODULES-AUDIT-REPORT-2025-11-14.md`
- **Sprint Status:** `docs/sprint-artifacts/sprint-status.yaml`
- **PRD (Updated):** `docs/MonoPilot-PRD-2025-11-13.md` (Section: Critical Prerequisite)
- **Workflow Status:** `docs/bmm-workflow-status.yaml` (Phase 2.5: Epic 0)

---

## Document Information

**Workflow:** BMad Method - Critical Prerequisite Roadmap
**Roadmap Type:** Epic 0 - Data Integrity Fixes (Before Phase 1)
**Generated:** 2025-11-14
**Next Review:** After Epic 0 completion (Week 8)

---

_This roadmap was created to address critical data integrity issues discovered during solutioning gate check. Epic 0 MUST be completed before starting Phase 1 (Epic 1.1) to ensure stable foundation for MVP development._
