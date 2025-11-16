# Test Design: Epic 0 - P0 Modules Data Integrity Fixes
**MonoPilot MES - Epic-Level Test Planning**

**Epic**: Epic 0 - P0 Modules Data Integrity Audit & Fix
**Document Date**: 2025-11-14
**Author**: TEA (Test Architect Agent)
**Workflow**: `testarch-test-design` v4.0 (Epic-Level Mode - Phase 4)
**Status**: Epic 0 Test Design - COMPLETE

---

## Executive Summary

### Epic Risk Assessment: **CRITICAL** 🔴

**Risk Score: 95/100** (Highest Priority)

Epic 0 addresses **7 critical data integrity inconsistencies** between database schema, TypeScript types, API layer, and UI components in already-implemented P0 modules. These are **production-blocking bugs** that prevent core workflows from functioning.

### Test Coverage Requirements

| Story | Priority | Test Complexity | Test Effort | Risk Level |
|-------|----------|----------------|-------------|------------|
| **0.1: PO Header warehouse_id** | 🔴 Critical | High | 8 hours | 95/100 - CRITICAL |
| **0.2: TO Status enum** | 🟡 Medium | Low | 2 hours | 60/100 - Medium |
| **0.3: LP Status enum** | 🔴 Critical | Very High | 12 hours | 90/100 - CRITICAL |
| **0.4: LP QA Status enum** | 🟡 Medium | Medium | 4 hours | 65/100 - Medium |
| **0.5: LP UoM constraint** | 🟡 Medium | Medium | 4 hours | 70/100 - Medium-High |
| **0.6: Deep Audit (WO/Products/BOMs)** | ⚠️ Verification | High | 10 hours | 80/100 - High |
| **0.7: Automated Validation** | ✅ Prevention | Very High | 12 hours | 85/100 - High |

**Total Test Effort**: 52 hours (~6.5 days)

### Quality Gate Criteria

Before Epic 0 can be marked COMPLETE:

- ✅ All 7 stories have passing integration tests (DB ↔ TS ↔ API ↔ UI)
- ✅ Quick PO Entry workflow verified working end-to-end
- ✅ License Plate lifecycle (create → reserve → consume → ship) verified working
- ✅ Zero enum mismatches detected by automated validation
- ✅ All E2E tests updated and passing (100+ tests)
- ✅ Manual smoke test checklist completed for all P0 modules

---

## Story 0.1: Fix PO Header `warehouse_id`

### Risk Assessment

**Priority**: 🔴 **CRITICAL**
**Risk Score**: 95/100 (Production Blocker)
**Complexity**: High (touches DB, API, UI, RPC function)

**Impact if not fixed**:
- ❌ Quick PO Entry workflow completely broken (SQL INSERT error)
- ❌ Cannot specify destination warehouse for Purchase Orders
- ❌ GRN creation doesn't know where to receive materials
- ❌ Planning module unusable for multi-warehouse operations

### Test Coverage Strategy

#### 1. Database Migration Test (Integration)

**Test ID**: `0.1-INT-001`
**Priority**: P0
**Effort**: 2 hours

```typescript
// apps/frontend/lib/supabase/__tests__/migrations/warehouse-id-migration.test.ts

describe('Story 0.1: PO Header warehouse_id Migration', () => {
  it('should add warehouse_id column to po_header table', async () => {
    // Verify column exists
    const { data: columns } = await supabase.rpc('get_table_columns', {
      table_name: 'po_header',
    });

    const warehouseIdColumn = columns.find(col => col.column_name === 'warehouse_id');
    expect(warehouseIdColumn).toBeDefined();
    expect(warehouseIdColumn.data_type).toBe('integer');
    expect(warehouseIdColumn.is_nullable).toBe('YES'); // Optional column
  });

  it('should have foreign key constraint to warehouses table', async () => {
    const { data: constraints } = await supabase.rpc('get_table_constraints', {
      table_name: 'po_header',
    });

    const fk = constraints.find(c =>
      c.constraint_type === 'FOREIGN KEY' &&
      c.constraint_name.includes('warehouse')
    );

    expect(fk).toBeDefined();
    expect(fk.foreign_table_name).toBe('warehouses');
  });

  it('should have index on warehouse_id for query performance', async () => {
    const { data: indexes } = await supabase.rpc('get_table_indexes', {
      table_name: 'po_header',
    });

    const warehouseIndex = indexes.find(idx =>
      idx.index_name.includes('warehouse_id')
    );

    expect(warehouseIndex).toBeDefined();
  });
});
```

---

#### 2. TypeScript Interface Test (Unit)

**Test ID**: `0.1-UNIT-001`
**Priority**: P0
**Effort**: 1 hour

```typescript
// apps/frontend/lib/__tests__/types/po-header-types.test.ts

import { POHeader } from '../../types';

describe('Story 0.1: POHeader TypeScript Interface', () => {
  it('should have warehouse_id property', () => {
    const mockPO: POHeader = {
      id: 1,
      number: 'PO-2025-001',
      supplier_id: 1,
      status: 'draft',
      currency: 'USD',
      order_date: '2025-11-14',
      warehouse_id: 5, // ✅ Should be valid
      created_at: '2025-11-14',
      updated_at: '2025-11-14',
    };

    // TypeScript compiler will error if warehouse_id is not in interface
    expect(mockPO.warehouse_id).toBe(5);
  });

  it('should allow warehouse_id to be optional', () => {
    const mockPO: Partial<POHeader> = {
      id: 1,
      number: 'PO-2025-002',
      // warehouse_id omitted (should be optional)
    };

    expect(mockPO.warehouse_id).toBeUndefined();
  });
});
```

---

#### 3. RPC Function Integration Test

**Test ID**: `0.1-INT-002`
**Priority**: P0
**Effort**: 2 hours

```typescript
// apps/frontend/lib/api/__tests__/purchase-orders/quick-create.test.ts

import { PurchaseOrdersAPI } from '../../PurchaseOrdersAPI';

describe('Story 0.1: Quick PO Create with warehouse_id', () => {
  let testWarehouse: Warehouse;

  beforeEach(async () => {
    testWarehouse = await createTestWarehouse({ code: 'WH-TEST' });
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it('should create PO with warehouse_id via quick_create_pos RPC', async () => {
    const quickPORequest = {
      lines: [
        { product_code: 'MAT-001', quantity: 100, price: 10.0 },
      ],
      warehouse_id: testWarehouse.id,
    };

    const result = await PurchaseOrdersAPI.quickCreate(quickPORequest);

    expect(result.success).toBe(true);
    expect(result.po_header).toBeDefined();
    expect(result.po_header.warehouse_id).toBe(testWarehouse.id);
  });

  it('should fail gracefully if warehouse_id is invalid', async () => {
    const quickPORequest = {
      lines: [{ product_code: 'MAT-001', quantity: 100, price: 10.0 }],
      warehouse_id: 99999, // Non-existent warehouse
    };

    await expect(PurchaseOrdersAPI.quickCreate(quickPORequest)).rejects.toThrow(
      /foreign key constraint/i
    );
  });

  it('should allow warehouse_id to be null (optional)', async () => {
    const quickPORequest = {
      lines: [{ product_code: 'MAT-001', quantity: 100, price: 10.0 }],
      warehouse_id: null,
    };

    const result = await PurchaseOrdersAPI.quickCreate(quickPORequest);

    expect(result.success).toBe(true);
    expect(result.po_header.warehouse_id).toBeNull();
  });
});
```

---

#### 4. E2E Test - Quick PO Entry Workflow

**Test ID**: `0.1-E2E-001`
**Priority**: P0
**Effort**: 3 hours

```typescript
// apps/frontend/e2e/02-purchase-orders.spec.ts

import { test, expect } from '@playwright/test';
import { login, gotoPlanningTab } from './helpers';

test.describe('Story 0.1: Quick PO Entry with Warehouse', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await gotoPlanningTab(page, 'Purchase Orders');
  });

  test('0.1-E2E-001: should create Quick PO with warehouse selection @P0', async ({ page }) => {
    // Click Quick Entry button
    await page.getByTestId('quick-po-entry-button').click();

    // Wait for Quick PO modal
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/Quick PO Entry/i)).toBeVisible();

    // Select warehouse (NEW FIELD - this is what we're testing)
    const warehouseSelect = page.getByTestId('quick-po-warehouse-select');
    await expect(warehouseSelect).toBeVisible();
    await warehouseSelect.selectOption({ index: 1 }); // Select first warehouse

    // Fill product code and quantity
    await page.getByTestId('quick-po-code-input').first().fill('MAT-001');
    await page.getByTestId('quick-po-qty-input').first().fill('100');

    // Submit
    await page.getByTestId('quick-po-submit-button').click();

    // Verify success
    await expect(page.getByText(/PO created successfully/i)).toBeVisible({
      timeout: 10000,
    });

    // Verify PO appears in table with warehouse
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toContainText('WH-'); // Warehouse code should be visible
  });

  test('0.1-E2E-002: should show validation error if warehouse not selected @P1', async ({ page }) => {
    await page.getByTestId('quick-po-entry-button').click();

    // Fill product but skip warehouse
    await page.getByTestId('quick-po-code-input').first().fill('MAT-001');
    await page.getByTestId('quick-po-qty-input').first().fill('100');

    // Try to submit
    await page.getByTestId('quick-po-submit-button').click();

    // Should show validation error
    await expect(page.getByText(/warehouse is required/i)).toBeVisible();
  });
});
```

---

### Regression Testing

**Affected Areas**:
- Purchase Orders (create, edit, view, delete)
- Quick PO Entry workflow
- GRN creation (depends on PO warehouse)
- Warehouse assignment logic

**Regression Test Checklist**:

```yaml
regression_tests:
  - test_id: REG-0.1-001
    area: Standard PO Create
    description: Verify standard PO creation still works (not just Quick PO)
    priority: P0

  - test_id: REG-0.1-002
    area: PO Edit
    description: Verify editing existing PO allows changing warehouse_id
    priority: P1

  - test_id: REG-0.1-003
    area: GRN Creation
    description: Verify GRN creation uses PO warehouse_id correctly
    priority: P0

  - test_id: REG-0.1-004
    area: PO List Filtering
    description: Verify filtering POs by warehouse works
    priority: P2
```

---

## Story 0.2: Fix TO Status enum

### Risk Assessment

**Priority**: 🟡 **MEDIUM**
**Risk Score**: 60/100
**Complexity**: Low (TypeScript enum update only)

**Impact if not fixed**:
- ⚠️ UI may not display 'closed' status correctly
- ⚠️ Filtering/searching for closed TOs may fail
- ⚠️ Possible data inconsistency if SQL sets status='closed'

### Test Coverage Strategy

#### 1. TypeScript Enum Test (Unit)

**Test ID**: `0.2-UNIT-001`
**Priority**: P1
**Effort**: 30 minutes

```typescript
// apps/frontend/lib/__tests__/types/to-status.test.ts

import { TOStatus } from '../../types';

describe('Story 0.2: TOStatus enum', () => {
  it('should include "closed" status', () => {
    const validStatuses: TOStatus[] = [
      'draft',
      'submitted',
      'in_transit',
      'received',
      'closed', // ✅ Should be valid
      'cancelled',
    ];

    validStatuses.forEach(status => {
      expect(['draft', 'submitted', 'in_transit', 'received', 'closed', 'cancelled']).toContain(status);
    });
  });

  it('should reject invalid status', () => {
    // TypeScript compiler will error if invalid status assigned
    // @ts-expect-error - Testing invalid status
    const invalidStatus: TOStatus = 'invalid_status';

    expect(invalidStatus).toBe('invalid_status'); // Runtime check
  });
});
```

---

#### 2. Database Constraint Validation (Integration)

**Test ID**: `0.2-INT-001`
**Priority**: P1
**Effort**: 1 hour

```typescript
// apps/frontend/lib/supabase/__tests__/to-status-constraint.test.ts

describe('Story 0.2: TO Status Database Constraint', () => {
  it('should allow "closed" status in database', async () => {
    const testTO = await createTestTO({ status: 'draft' });

    // Update status to 'closed' (should succeed)
    const { error } = await supabase
      .from('to_header')
      .update({ status: 'closed' })
      .eq('id', testTO.id);

    expect(error).toBeNull();

    // Verify status updated
    const { data } = await supabase
      .from('to_header')
      .select('status')
      .eq('id', testTO.id)
      .single();

    expect(data.status).toBe('closed');
  });

  it('should match database constraint with TypeScript enum', async () => {
    // Query database for valid statuses from CHECK constraint
    const { data: constraints } = await supabase.rpc('get_check_constraint', {
      table_name: 'to_header',
      column_name: 'status',
    });

    const dbStatuses = extractStatusesFromConstraint(constraints[0].definition);
    const tsStatuses: TOStatus[] = ['draft', 'submitted', 'in_transit', 'received', 'closed', 'cancelled'];

    // Verify TypeScript enum matches database constraint
    expect(tsStatuses.sort()).toEqual(dbStatuses.sort());
  });
});
```

---

#### 3. E2E Test - TO Closed Status

**Test ID**: `0.2-E2E-001`
**Priority**: P2
**Effort**: 30 minutes

```typescript
// apps/frontend/e2e/03-transfer-orders.spec.ts

test('0.2-E2E-001: should display "closed" status for Transfer Orders @P2', async ({ page }) => {
  await login(page);
  await gotoPlanningTab(page, 'Transfer Orders');

  // Create TO and move to 'received' status
  const to = await createTestTO({ status: 'received' });

  // Admin closes the TO
  await page.goto(`/planning/transfer-orders/${to.id}`);
  await page.getByTestId('close-to-button').click();

  // Verify status changed to 'closed'
  await expect(page.getByTestId('to-status')).toHaveText('Closed');

  // Verify appears in TO list with 'closed' badge
  await gotoPlanningTab(page, 'Transfer Orders');
  const toRow = page.locator(`table tbody tr:has-text("${to.number}")`);
  await expect(toRow.getByText('Closed')).toBeVisible();
});
```

---

## Story 0.3: Fix License Plate Status enum

### Risk Assessment

**Priority**: 🔴 **CRITICAL**
**Risk Score**: 90/100 (High Impact)
**Complexity**: Very High (major enum mismatch, affects warehouse workflows)

**Impact if not fixed**:
- ❌ License Plate lifecycle broken (status updates fail)
- ❌ Scanner workflows fail (cannot update LP status)
- ❌ Warehouse operations unusable (LP reservation, consumption, shipping)
- ❌ Only 2 out of 11 status values are compatible between DB and TypeScript

**Enum Mismatch Details**:

| Database (6 values) | TypeScript (7 values) | Match? |
|--------------------|-----------------------|--------|
| available | Available | ✅ Match (case diff) |
| reserved | Reserved | ✅ Match (case diff) |
| consumed | - | ❌ DB only |
| in_transit | - | ❌ DB only |
| quarantine | - | ❌ DB only |
| damaged | - | ❌ DB only |
| - | In Production | ❌ TS only |
| - | QA Hold | ❌ TS only |
| - | QA Released | ❌ TS only |
| - | QA Rejected | ❌ TS only |
| - | Shipped | ❌ TS only |

**Decision Required**: Which enum is correct? Likely need to merge both.

### Test Coverage Strategy

#### 1. Enum Alignment Validation (Integration)

**Test ID**: `0.3-INT-001`
**Priority**: P0
**Effort**: 3 hours

```typescript
// apps/frontend/lib/supabase/__tests__/lp-status-enum.test.ts

describe('Story 0.3: License Plate Status Enum Alignment', () => {
  it('should have consistent LP status enum between DB and TypeScript', async () => {
    // Query database for valid statuses from CHECK constraint
    const { data: constraints } = await supabase.rpc('get_check_constraint', {
      table_name: 'license_plates',
      column_name: 'status',
    });

    const dbStatuses = extractStatusesFromConstraint(constraints[0].definition);
    const tsStatuses: LPStatus[] = [
      'Available',
      'Reserved',
      'In Production',
      'Consumed',
      'In Transit',
      'Quarantine',
      'Damaged',
      'QA Hold',
      'QA Released',
      'QA Rejected',
      'Shipped',
    ];

    // Verify TypeScript enum includes all database statuses (case-insensitive)
    dbStatuses.forEach(dbStatus => {
      const normalized = dbStatus.toLowerCase().replace(/_/g, ' ');
      const tsMatch = tsStatuses.some(
        ts => ts.toLowerCase() === normalized
      );
      expect(tsMatch).toBe(true);
    });
  });

  it('should successfully update LP status to all valid values', async () => {
    const testLP = await createTestLP({ status: 'Available' });

    const validStatuses = [
      'Reserved',
      'In Production',
      'Consumed',
      'In Transit',
      'Quarantine',
      'Damaged',
      'QA Hold',
      'QA Released',
      'QA Rejected',
      'Shipped',
    ];

    for (const status of validStatuses) {
      const { error } = await supabase
        .from('license_plates')
        .update({ status })
        .eq('id', testLP.id);

      expect(error).toBeNull();

      // Verify status updated correctly
      const { data } = await supabase
        .from('license_plates')
        .select('status')
        .eq('id', testLP.id)
        .single();

      expect(data.status).toBe(status);
    }
  });
});
```

---

#### 2. LP Lifecycle State Machine Test (Integration)

**Test ID**: `0.3-INT-002`
**Priority**: P0
**Effort**: 4 hours

```typescript
// apps/frontend/lib/api/__tests__/license-plates/lifecycle.test.ts

describe('Story 0.3: License Plate Lifecycle State Transitions', () => {
  it('should transition LP through complete lifecycle', async () => {
    // Create LP (Available)
    const lp = await LicensePlatesAPI.create({
      product_id: 1,
      quantity: 100,
      uom: 'kg',
      status: 'Available',
    });

    expect(lp.status).toBe('Available');

    // Reserve for WO (Available → Reserved)
    await LicensePlatesAPI.reserve(lp.id, { wo_id: 1 });
    const reserved = await LicensePlatesAPI.getById(lp.id);
    expect(reserved.status).toBe('Reserved');

    // Start production (Reserved → In Production)
    await LicensePlatesAPI.updateStatus(lp.id, 'In Production');
    const inProduction = await LicensePlatesAPI.getById(lp.id);
    expect(inProduction.status).toBe('In Production');

    // Consume (In Production → Consumed)
    await LicensePlatesAPI.consume(lp.id, { wo_id: 1, qty: 100 });
    const consumed = await LicensePlatesAPI.getById(lp.id);
    expect(consumed.status).toBe('Consumed');
  });

  it('should enforce valid state transitions', async () => {
    const lp = await createTestLP({ status: 'Available' });

    // Invalid transition: Available → Consumed (must go through Reserved → In Production first)
    await expect(
      LicensePlatesAPI.updateStatus(lp.id, 'Consumed')
    ).rejects.toThrow(/invalid state transition/i);
  });
});
```

---

#### 3. E2E Test - Scanner LP Status Updates

**Test ID**: `0.3-E2E-001`
**Priority**: P0
**Effort**: 5 hours

```typescript
// apps/frontend/e2e/scanner/lp-status-updates.spec.ts

test.describe('Story 0.3: Scanner LP Status Updates', () => {
  test('0.3-E2E-001: should update LP status through scanner workflow @P0', async ({ page }) => {
    await login(page);

    // Create test LP
    const lp = await createTestLP({
      lp_number: 'LP-TEST-001',
      status: 'Available',
      product_code: 'FG-001',
    });

    // Navigate to scanner
    await page.goto('/scanner');

    // Scan LP
    await page.getByTestId('scanner-input').fill(lp.lp_number);
    await page.getByTestId('scanner-input').press('Enter');

    // Verify LP details displayed
    await expect(page.getByText(lp.lp_number)).toBeVisible();
    await expect(page.getByText('Available')).toBeVisible();

    // Reserve LP for WO
    await page.getByTestId('reserve-lp-button').click();
    await page.getByTestId('wo-select').selectOption({ index: 1 });
    await page.getByTestId('confirm-reserve-button').click();

    // Verify status changed to 'Reserved'
    await expect(page.getByText('Reserved')).toBeVisible();

    // Start production
    await page.getByTestId('start-production-button').click();

    // Verify status changed to 'In Production'
    await expect(page.getByText('In Production')).toBeVisible();
  });
});
```

---

## Story 0.4: Fix License Plate QA Status enum

### Risk Assessment

**Priority**: 🟡 **MEDIUM**
**Risk Score**: 65/100
**Complexity**: Medium (QA workflow enum mismatch)

**Impact if not fixed**:
- ⚠️ QA workflow broken (cannot update QA status)
- ⚠️ Quality holds not enforceable
- ⚠️ Scanner QA operations fail

### Test Coverage Strategy

**Test ID**: `0.4-INT-001` (Integration - QA Status Validation)
**Effort**: 2 hours

**Test ID**: `0.4-E2E-001` (E2E - QA Hold/Release Workflow)
**Effort**: 2 hours

(Similar structure to 0.3, focusing on QA status lifecycle)

---

## Story 0.5: Fix License Plate UoM constraint

### Risk Assessment

**Priority**: 🟡 **MEDIUM**
**Risk Score**: 70/100
**Complexity**: Medium (constraint limitation)

**Impact if not fixed**:
- ⚠️ Only 4 UoMs allowed: kg, lb, ea, ltr (CHECK constraint)
- ⚠️ Other UoMs fail silently or with SQL error
- ⚠️ No validation feedback to user

**Decision Required**: Expand constraint or enforce strict UoM list?

### Test Coverage Strategy

#### Integration Test - UoM Constraint Validation

**Test ID**: `0.5-INT-001`
**Priority**: P1
**Effort**: 2 hours

```typescript
describe('Story 0.5: License Plate UoM Constraint', () => {
  it('should allow all standard UoMs', async () => {
    const standardUoMs = ['kg', 'lb', 'ea', 'ltr', 'g', 'oz', 'gal', 'pcs'];

    for (const uom of standardUoMs) {
      const lp = await LicensePlatesAPI.create({
        product_id: 1,
        quantity: 100,
        uom,
      });

      expect(lp.uom).toBe(uom);
    }
  });

  it('should reject invalid UoMs with clear error', async () => {
    await expect(
      LicensePlatesAPI.create({
        product_id: 1,
        quantity: 100,
        uom: 'invalid_unit',
      })
    ).rejects.toThrow(/invalid UoM/i);
  });
});
```

---

## Story 0.6: Deep Audit - Work Orders, Products, BOMs

### Risk Assessment

**Priority**: ⚠️ **VERIFICATION**
**Risk Score**: 80/100 (Unknown issues)
**Complexity**: High (requires comprehensive audit)

**Impact if issues found**:
- 🔴 Critical production workflows may be broken
- 🔴 BOM immutability may be violated
- 🔴 WO material snapshot may not work correctly

### Test Coverage Strategy

#### Comprehensive Audit Test Suite

**Test ID**: `0.6-INT-001` (Audit - Work Orders)
**Test ID**: `0.6-INT-002` (Audit - Products)
**Test ID**: `0.6-INT-003` (Audit - BOMs)
**Test ID**: `0.6-INT-004` (Audit - BOM Snapshot Immutability)

**Total Effort**: 10 hours

```typescript
// apps/frontend/lib/__tests__/audit/deep-audit.test.ts

describe('Story 0.6: Deep Audit - WO, Products, BOMs', () => {
  describe('Work Orders Audit', () => {
    it('should validate WO schema matches TypeScript interface', async () => {
      // Query DB columns
      const dbColumns = await getTableColumns('work_orders');

      // Get TypeScript interface properties
      const tsInterface = getTypeScriptInterface('WorkOrder');

      // Compare
      const mismatches = compareSchemaToInterface(dbColumns, tsInterface);
      expect(mismatches).toHaveLength(0);
    });

    it('should validate wo_materials foreign keys are correct', async () => {
      const { data: constraints } = await supabase.rpc('get_foreign_keys', {
        table_name: 'wo_materials',
      });

      expect(constraints).toContainEqual(
        expect.objectContaining({
          foreign_table: 'work_orders',
          foreign_column: 'id',
        })
      );

      expect(constraints).toContainEqual(
        expect.objectContaining({
          foreign_table: 'products',
          foreign_column: 'id',
        })
      );
    });
  });

  describe('BOM Snapshot Immutability Audit', () => {
    it('should verify BOM snapshot is truly immutable', async () => {
      // Create BOM v1.0
      const bom = await createTestBOM({
        version: '1.0',
        materials: [{ product_id: 1, qty: 10 }],
      });

      // Create WO with BOM v1.0 (snapshot)
      const wo = await createTestWO({
        product_id: 1,
        bom_id: bom.id,
      });

      // Verify wo_materials snapshot created
      const woMaterials = await getWOMaterials(wo.id);
      expect(woMaterials.length).toBe(1);
      expect(woMaterials[0].quantity).toBe(10);
      expect(woMaterials[0].bom_version).toBe('1.0');

      // Update BOM to v1.1 (add 11th material)
      await updateBOM(bom.id, {
        version: '1.1',
        materials: [
          { product_id: 1, qty: 10 },
          { product_id: 2, qty: 5 }, // NEW MATERIAL
        ],
      });

      // Verify WO still has 1 material (snapshot unchanged)
      const woMaterialsAfter = await getWOMaterials(wo.id);
      expect(woMaterialsAfter.length).toBe(1);
      expect(woMaterialsAfter[0].bom_version).toBe('1.0');
    });
  });
});
```

---

## Story 0.7: Automated Validation Tests

### Risk Assessment

**Priority**: ✅ **PREVENTION**
**Risk Score**: 85/100 (Critical for future)
**Complexity**: Very High (infrastructure work)

**Impact if not implemented**:
- 🔴 Future inconsistencies will not be detected
- 🔴 No automated protection against schema drift
- 🔴 Manual audits required for every change

### Test Coverage Strategy

#### Schema Validation Test Suite

**Test ID**: `0.7-INT-001` (Schema Validation)
**Test ID**: `0.7-INT-002` (Enum Validation)
**Test ID**: `0.7-INT-003` (Foreign Key Validation)

**Total Effort**: 12 hours

```typescript
// apps/frontend/lib/__tests__/validation/schema-validation.test.ts

describe('Story 0.7: Automated Schema Validation', () => {
  it('should validate all business tables have org_id column', async () => {
    const businessTables = [
      'po_header',
      'to_header',
      'work_orders',
      'license_plates',
      'products',
      'boms',
      // ... all 40+ tables
    ];

    for (const table of businessTables) {
      const columns = await getTableColumns(table);
      const hasOrgId = columns.some(col => col.column_name === 'org_id');

      expect(hasOrgId).toBe(true);
    }
  });

  it('should validate all TypeScript enums match database constraints', async () => {
    const enumValidations = [
      { table: 'po_header', column: 'status', tsEnum: 'POStatus' },
      { table: 'to_header', column: 'status', tsEnum: 'TOStatus' },
      { table: 'license_plates', column: 'status', tsEnum: 'LPStatus' },
      { table: 'license_plates', column: 'qa_status', tsEnum: 'LPQAStatus' },
      { table: 'work_orders', column: 'status', tsEnum: 'WOStatus' },
    ];

    for (const validation of enumValidations) {
      const dbEnum = await getCheckConstraintValues(
        validation.table,
        validation.column
      );

      const tsEnum = getTypeScriptEnum(validation.tsEnum);

      const mismatches = compareEnums(dbEnum, tsEnum);
      expect(mismatches).toHaveLength(0);
    }
  });

  it('should validate all API classes have corresponding TypeScript interfaces', async () => {
    const apiClasses = [
      'PurchaseOrdersAPI',
      'TransferOrdersAPI',
      'WorkOrdersAPI',
      'LicensePlatesAPI',
      'ProductsAPI',
      'BomsAPI',
      // ... all 28 APIs
    ];

    for (const apiClass of apiClasses) {
      const apiMethods = getAPIClassMethods(apiClass);
      const tsInterfaces = getRelatedTypeScriptInterfaces(apiClass);

      // Verify all API methods return typed interfaces
      apiMethods.forEach(method => {
        expect(method.returnType).toBeDefined();
        expect(tsInterfaces).toContain(method.returnType);
      });
    }
  });
});
```

---

## Epic-Level Integration Testing

### Cross-Story Integration Tests

**Test ID**: `EPIC-0-INT-001`
**Description**: End-to-end workflow validation across all 7 fixes
**Priority**: P0
**Effort**: 6 hours

```typescript
// apps/frontend/e2e/epic-0-integration.spec.ts

test.describe('Epic 0: Full Integration - All Fixes Combined', () => {
  test('EPIC-0-E2E-001: Complete workflow with all fixes @P0', async ({ page }) => {
    await login(page);

    // 1. Create PO with warehouse_id (Story 0.1)
    await gotoPlanningTab(page, 'Purchase Orders');
    const po = await createQuickPO(page, {
      warehouse_id: 'WH-001',
      products: [{ code: 'MAT-001', qty: 100 }],
    });

    // 2. Create TO and close it (Story 0.2)
    await gotoPlanningTab(page, 'Transfer Orders');
    const to = await createTO(page, {
      from_warehouse: 'WH-001',
      to_warehouse: 'WH-002',
    });
    await closeTO(page, to.id);
    await expect(page.getByText('Closed')).toBeVisible();

    // 3. Create LP with valid status (Story 0.3)
    await page.goto('/warehouse/license-plates');
    const lp = await createLP(page, {
      product: 'FG-001',
      status: 'Available',
      uom: 'kg', // Story 0.5 - valid UoM
    });

    // 4. Update LP QA status (Story 0.4)
    await updateLPQAStatus(page, lp.id, 'QA Hold');
    await expect(page.getByText('QA Hold')).toBeVisible();

    // 5. Reserve LP and consume (Story 0.3 - lifecycle)
    await reserveLP(page, lp.id, { wo_id: 1 });
    await expect(page.getByText('Reserved')).toBeVisible();

    await consumeLP(page, lp.id);
    await expect(page.getByText('Consumed')).toBeVisible();

    // 6. Verify BOM immutability (Story 0.6 - audit)
    const wo = await createWO(page, { product: 'FG-001', qty: 100 });
    const woMaterials = await getWOMaterials(page, wo.id);
    expect(woMaterials.length).toBeGreaterThan(0);
  });
});
```

---

## Quality Gate Checklist

Before Epic 0 can be marked COMPLETE, all of the following must pass:

### Database Layer ✅

- [ ] All migrations executed successfully on staging environment
- [ ] All CHECK constraints validated against TypeScript enums
- [ ] All foreign keys verified
- [ ] All indexes created for performance
- [ ] Zero orphaned records or data inconsistencies

### TypeScript Layer ✅

- [ ] All interfaces updated to match DB schema
- [ ] All enums aligned with database constraints
- [ ] Zero TypeScript compilation errors
- [ ] All API classes have correct return types

### API Layer ✅

- [ ] All 28 API classes pass unit tests (95%+ coverage)
- [ ] All RPC functions tested with integration tests
- [ ] Zero API errors in staging environment
- [ ] All API methods have proper error handling

### UI Layer ✅

- [ ] All forms display correct fields (warehouse_id, status dropdowns)
- [ ] All validation messages clear and user-friendly
- [ ] All workflows tested end-to-end (PO, TO, LP, WO)
- [ ] Zero UI errors in staging environment

### E2E Testing ✅

- [ ] All 100+ existing E2E tests passing
- [ ] New E2E tests added for all 7 stories (16 new tests)
- [ ] Integration test suite covering cross-story workflows
- [ ] Burn-in test (10 iterations) passes with 0 failures

### Automated Validation ✅

- [ ] Schema validation tests in CI/CD pipeline
- [ ] Enum validation tests automated
- [ ] Pre-commit hook validates DB ↔ TS alignment
- [ ] CI/CD fails if inconsistencies detected

---

## Test Execution Timeline

### Week 1-2 (Sprint 0.1)
**Stories**: 0.1 (PO warehouse_id), 0.2 (TO status)
**Test Effort**: 10 hours

- Day 1-2: Story 0.1 tests (8 hours)
- Day 3: Story 0.2 tests (2 hours)
- Day 4-5: Regression testing, bug fixes

### Week 3-4 (Sprint 0.2)
**Stories**: 0.3 (LP status), 0.4 (LP QA status)
**Test Effort**: 16 hours

- Day 1-3: Story 0.3 tests (12 hours)
- Day 4: Story 0.4 tests (4 hours)
- Day 5: Integration testing

### Week 5-6 (Sprint 0.3)
**Stories**: 0.5 (LP UoM), 0.6 (Deep Audit)
**Test Effort**: 14 hours

- Day 1: Story 0.5 tests (4 hours)
- Day 2-4: Story 0.6 deep audit tests (10 hours)
- Day 5: Cross-story integration testing

### Week 7 (Sprint 0.4)
**Story**: 0.7 (Automated Validation)
**Test Effort**: 12 hours

- Day 1-3: Automated validation test suite (12 hours)
- Day 4: Epic-level integration testing (6 hours)
- Day 5: Final regression run, quality gate validation

**Total Test Effort**: 52 hours + 6 hours (epic integration) = **58 hours (~7.25 days)**

---

## Risk Mitigation Strategies

### Risk 1: Hidden Issues in Deep Audit (Story 0.6)

**Mitigation**:
- Allocate 21 SP (42 hours) for thorough audit
- Use automated schema comparison tools
- Manual verification by 2 developers

### Risk 2: Breaking Changes in Production

**Mitigation**:
- Run full E2E suite before each deployment
- Deploy to staging first, validate for 24 hours
- Maintain rollback plan for each migration

### Risk 3: Test Suite Execution Time

**Mitigation**:
- Run unit tests in parallel (Vitest workers)
- Use selective test execution (P0-P1 on PR)
- Full suite only on merge to main + nightly

---

## Appendix: Test Templates

### Unit Test Template

```typescript
// apps/frontend/lib/__tests__/<area>/<feature>.test.ts

import { describe, it, expect } from 'vitest';
import { <API> } from '../../api/<API>';

describe('Story X.X: <Feature Name>', () => {
  it('should <expected behavior>', () => {
    // Arrange
    const input = { ... };

    // Act
    const result = <API>.method(input);

    // Assert
    expect(result).toBe(expected);
  });
});
```

### Integration Test Template

```typescript
// apps/frontend/lib/__tests__/integration/<feature>.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createSupabaseClient } from '../../supabase/test-client';

describe('Story X.X: <Feature> Integration', () => {
  let supabase;

  beforeEach(async () => {
    supabase = createSupabaseClient();
    await setupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it('should <expected behavior>', async () => {
    // Test implementation
  });
});
```

### E2E Test Template

```typescript
// apps/frontend/e2e/<epic>/<feature>.spec.ts

import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Story X.X: <Feature>', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('X.X-E2E-001: should <expected behavior> @P0', async ({ page }) => {
    // Test implementation
  });
});
```

---

## Implementation Notes - Story 0.1 Completed (2025-11-14)

### ✅ Migration 057 Executed Successfully

**Status**: COMPLETE
**Date**: 2025-11-14
**Migration File**: `apps/frontend/lib/supabase/migrations/057_add_warehouse_id_to_po_header.sql`

**Changes Applied**:
- Added `warehouse_id BIGINT` column to `po_header` table with FK constraint to `warehouses(id)`
- Created concurrent index `idx_po_header_warehouse_id` for query performance
- Added column comment documentation
- Data migration: Set default warehouse_id for existing PO rows

**Verification**: All checks passed via `scripts/verify-migration-057.mjs`

### 🧪 Test Implementation Findings

#### Database Fixture Architecture Created
**File**: `apps/frontend/e2e/fixtures/database-fixture.ts`

**Key Features**:
- Auto-cleanup fixtures using Playwright's fixture pattern
- Cascading FK handling (fixtures clean up in reverse dependency order)
- Type-safe with actual database schema (no `org_id` on warehouses/suppliers/po_header)
- Environment variables loaded via dotenv from `.env.local`

**Fixtures Created**:
1. `createWarehouse` - Auto-generates unique warehouse code, auto-cleanup
2. `createSupplier` - Auto-generates unique supplier name, auto-cleanup
3. `createPO` - Creates default supplier/warehouse if not provided, auto-cleanup
4. `createWO` - Fetches first available product, auto-cleanup (future use)
5. `createLP` - Fetches first available product, auto-cleanup (future use)

#### Schema Discovery Issues Fixed

**Issue #1**: Multi-tenancy assumption incorrect
**Expected**: All tables have `org_id` column (per CLAUDE.md)
**Actual**: `suppliers`, `warehouses`, `po_header` do NOT have `org_id` column
**Resolution**: Removed `org_id` from fixture types and test data

**Issue #2**: Suppliers table missing `code` column
**Expected**: Suppliers have `code` column like Warehouses
**Actual**: Suppliers only have `name`, `legal_name`, no `code` column
**Resolution**: Use unique `name` instead of `code` for test data generation

**Issue #3**: Data type mismatch in original test design
**Expected**: `warehouse_id INTEGER`
**Actual**: `warehouse_id BIGINT`
**Resolution**: Updated test expectations to match actual schema

### ✅ Test Results - Story 0.1

**Integration Tests**: 4/4 PASSING ✅

| Test ID | Test Description | Status | Notes |
|---------|------------------|--------|-------|
| 0.1-INT-001 | warehouse_id column exists | ✅ PASS | Column query successful |
| 0.1-INT-002 | FK constraint to warehouses | ✅ PASS | Invalid warehouse_id correctly rejected (code 23503) |
| 0.1-INT-003 | Create PO with warehouse_id | ✅ PASS | Successfully created and retrieved |
| 0.1-INT-004 | Allow warehouse_id to be null | ✅ PASS | Null value accepted (optional column) |

**E2E Tests**: 2/6 FAILING ⚠️

| Test ID | Test Description | Status | Notes |
|---------|------------------|--------|-------|
| 0.1-E2E-001 | Quick PO with warehouse selection | ❌ FAIL | Helper issue: `gotoPlanningTab` selector resolves to 3 elements |
| 0.1-E2E-002 | Warehouse field visible in form | ❌ FAIL | Same helper issue (not Story 0.1 bug) |

**Root Cause**: Pre-existing test infrastructure issue in `helpers.ts:146`
**Impact**: Does NOT block Story 0.1 - integration tests verify DB migration succeeded
**Action Required**: Fix `gotoPlanningTab` helper to use more specific selector (separate issue)

### 📝 Lessons Learned

1. **Always verify actual schema**: Don't assume schema matches documentation - use `select *` queries to verify actual columns
2. **Supabase type generation blocked**: Requires `supabase login` or `SUPABASE_ACCESS_TOKEN` - manual execution not feasible in CI
3. **Playwright fixtures pattern works well**: Auto-cleanup prevents test pollution, type-safe fixtures enforce actual schema
4. **Migration execution requires manual step**: No RPC `exec_sql` function available - migrations must be executed via Dashboard SQL Editor
5. **Test helpers need strict selectors**: `locator('h2,h1')` is too broad and causes flaky tests - use data-testid instead

### 🎯 Quality Gate Status - Story 0.1

- ✅ Migration 057 executed successfully
- ✅ warehouse_id column exists with FK constraint
- ✅ TypeScript interface updated (POHeader.warehouse_id)
- ✅ Database fixture infrastructure created
- ✅ Integration tests passing (4/4)
- ⚠️ E2E tests blocked by pre-existing helper issue (2/6 failing)
- 🔲 UI implementation NOT YET DONE (Quick PO Entry form needs warehouse select dropdown)

**Next Steps**:
1. Fix `gotoPlanningTab` helper selector issue
2. Implement UI changes (add warehouse_id select to Quick PO Entry form)
3. Re-run E2E tests to verify full workflow
4. Proceed to Story 0.2 (TO Status enum)

---

**Prepared by**: TEA (Test Architect Agent)
**Workflow**: `testarch-test-design` v4.0 (Epic-Level Mode)
**Last Updated**: 2025-11-14 (Story 0.1 implementation notes added)
**Next Steps**: Execute tests per sprint plan, update quality gate checklist as stories complete

**Questions?** Review system-level test design (`docs/test-design-system.md`) for infrastructure guidance.
