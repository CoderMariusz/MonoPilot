# Planning Module - Purchase Orders, Transfer Orders, Work Orders

**Last Updated:** 2025-11-14 (Story 0.1 - warehouse_id requirement added)

---

## Overview

The Planning Module manages the procurement, material movement, and production scheduling workflows in MonoPilot MES. It ensures materials are ordered, received, transferred between warehouses, and allocated to production efficiently.

## Core Entities

### 1. Purchase Orders (PO)

**Purpose:** Order materials from suppliers with explicit warehouse routing

**Database Schema:** `po_header`, `po_line`

**Key Fields:**

- `number` - Unique PO identifier (e.g., PO-2025-001)
- `supplier_id` - Reference to suppliers table
- **`warehouse_id` - ⭐ REQUIRED (Story 0.1)** - Destination warehouse for GRN routing
- `status` - Lifecycle: draft → submitted → confirmed → received → closed/cancelled
- `currency`, `exchange_rate` - Multi-currency support
- `order_date`, `requested_delivery_date`, `promised_delivery_date`
- `created_by`, `approved_by` - Audit trail

**Business Rules:**

1. **Warehouse Requirement (Pattern 15 - Required Business Context):**
   - `warehouse_id` is **REQUIRED** for all Purchase Orders
   - No magic defaults - API validates and throws error if missing
   - UI shows red asterisk (\*) on warehouse field
   - Smart pre-select when only 1 warehouse exists
   - Inline help text: "Where should materials be received? This determines GRN routing."

2. **Quick PO Entry Workflow:**
   - Specialized rapid data entry for known suppliers
   - Pre-fills: currency, tax codes, lead times, default location per warehouse
   - Groups products by supplier, creates separate PO per supplier
   - Validates: product must have supplier, warehouse must be selected

3. **Multi-Currency Support:**
   - Each PO has currency and exchange_rate
   - Supplier's default currency pre-fills
   - Prevents currency mismatch errors

**API Methods:**

```typescript
PurchaseOrdersAPI.getAll(); // Fetch all POs with relationships
PurchaseOrdersAPI.getById(id); // Fetch single PO
PurchaseOrdersAPI.quickCreate({ lines, warehouse_id }); // Quick PO Entry
PurchaseOrdersAPI.cancel(id, reason); // Cancel PO
PurchaseOrdersAPI.close(id); // Close PO and create GRN
PurchaseOrdersAPI.delete(id); // Delete draft PO only
```

**Related Documentation:**

- Pattern 15: Required Business Context (`docs/architecture.md` lines 2310-2417)
- Quick PO Entry Implementation: `docs/QUICK_PO_ENTRY_IMPLEMENTATION.md`
- Story 0.1 Review: `docs/sprint-artifacts/0-1-fix-po-header-warehouse-id-REVIEW.md`

---

### 2. Transfer Orders (TO)

**Purpose:** Move materials between warehouses

**Database Schema:** `to_header`, `to_line`

**Key Fields:**

- `number` - Unique TO identifier
- `from_wh_id`, `to_wh_id` - Warehouse-to-warehouse (NO location in header)
- `status` - Lifecycle: draft → submitted → in_transit → received → closed/cancelled
- `planned_ship_date`, `actual_ship_date`
- `planned_receive_date`, `actual_receive_date`
- `created_by`, `approved_by` - Audit trail

**Business Rules:**

1. **Warehouse-Based Transfers (bmad.structure.yaml policy):**
   - Transfer Orders operate at warehouse level, NOT location level
   - `from_wh_id` and `to_wh_id` required in header
   - Transit handled by `warehouse_transit_location` (warehouse-specific)
   - Stock Moves handle location-to-location within same warehouse

2. **Status Lifecycle:**
   - draft → submitted: Approval required
   - submitted → in_transit: Ship materials (markShipped RPC)
   - in_transit → received: Receive materials (markReceived RPC)
   - received → closed: Finalize transfer

**API Methods:**

```typescript
TransferOrdersAPI.getAll(); // Fetch all TOs
TransferOrdersAPI.getById(id); // Fetch single TO
TransferOrdersAPI.create(data); // Create new TO
TransferOrdersAPI.markShipped(id); // Ship TO (submitted → in_transit)
TransferOrdersAPI.markReceived(id); // Receive TO (in_transit → received)
```

**Related Documentation:**

- Transfer Order vs Stock Move distinction: `docs/architecture.md` (Warehouse Patterns)
- Policy: `bmad.structure.yaml` - transfer_orders.mode: warehouse_based

---

### 3. Work Orders (WO)

**Purpose:** Plan and execute production runs

**Database Schema:** `work_orders`, `wo_materials`, `wo_operations`, `wo_by_products`

**Key Fields:**

- `number` - Unique WO identifier
- `product_id` - What to produce
- `bom_id` - Which BOM version to use (snapshot at creation)
- `quantity`, `uom` - How much to produce
- `line_id`, `machine_id` - Where to produce
- `scheduled_start`, `actual_start`, `actual_end` - When
- `status` - Lifecycle: draft → planned → released → in_progress → completed → cancelled
- `created_by`, `approved_by` - Audit trail

**Business Rules:**

1. **BOM Snapshot Pattern (Immutability):**
   - When WO is created, BOM is copied to `wo_materials` table
   - Includes: qty, UoM, scrap%, `consume_whole_lp` flag, allergens
   - Prevents mid-production recipe changes
   - Multi-version BOM support: automatic selection based on `scheduled_date`

2. **1:1 Consumption (Consume Whole LP):**
   - Flag on BOM items: `consume_whole_lp`
   - Enforces full LP consumption (no partial splits)
   - Critical for allergen control and traceability

3. **By-Products Support:**
   - `wo_by_products` table tracks secondary outputs
   - Each by-product generates its own LP
   - Genealogy tracked via `lp_genealogy`

**API Methods:**

```typescript
WorkOrdersAPI.getAll(); // Fetch all WOs
WorkOrdersAPI.getById(id); // Fetch single WO
WorkOrdersAPI.create(data); // Create new WO (BOM snapshot)
WorkOrdersAPI.release(id); // Release WO for production
WorkOrdersAPI.recordByProductOutput(woId, byProductId, data); // Record by-product
```

**Related Documentation:**

- BOM Snapshot Pattern: `docs/architecture.md` (Production Patterns)
- Multi-Version BOMs: `docs/EPIC-001_PHASE-*_SUMMARY.md`
- By-Products: `docs/EPIC-001_PHASE-3_SUMMARY.md`

---

## UI Components

### Purchase Orders Table (`/planning` → Purchase Orders tab)

**Features:**

- List all POs with supplier, warehouse, status, dates, totals
- Filter by status (draft, submitted, confirmed, received, closed, cancelled)
- Actions: Edit (draft only), Delete (draft only), View Details
- Quick PO Entry button (opens QuickPOEntryModal)

**Files:**

- Component: `apps/frontend/app/planning/page.tsx`
- Modal: `apps/frontend/components/QuickPOEntryModal.tsx`

### Transfer Orders Table (`/planning` → Transfer Orders tab)

**Features:**

- List all TOs with from/to warehouse, status, ship/receive dates
- Filter by status
- Actions: Ship, Receive, View Details

### Work Orders Table (`/planning` → Work Orders tab)

**Features:**

- List all WOs with product, quantity, line, status, dates
- Filter by status, line, product
- Actions: Release, View Details, Allocate Materials

---

## Workflows

### Quick PO Entry Workflow

**Purpose:** Rapid data entry for ordering multiple products from known suppliers

**Steps:**

1. User clicks "Quick Entry" button
2. **Select destination warehouse** (REQUIRED - Story 0.1)
3. Enter product codes and quantities (multi-line form)
4. System validates:
   - All products exist and are active
   - All products have supplier assigned
   - Warehouse is selected
5. System groups products by supplier
6. System creates one PO per supplier
7. Display results with PO numbers, totals, links

**Validation Rules:**

- Product code must exist and be active
- Product must have supplier_id set
- Warehouse must be selected (no default)
- Quantity must be > 0

**Error Handling:**

- Invalid product: Show error inline, highlight row
- Missing supplier: Show error "Product has no supplier assigned"
- Missing warehouse: Show error "Please select a destination warehouse"
- Empty warehouse list: Show error "No warehouses found. Please create a warehouse first."

**Files:**

- Modal: `apps/frontend/components/QuickPOEntryModal.tsx`
- API: `apps/frontend/lib/api/purchaseOrders.ts` (quickCreate method)
- RPC: `apps/frontend/lib/supabase/migrations/039_rpc_functions.sql` (quick_create_pos)

---

## Testing

### Unit Tests

**Location:** `apps/frontend/__tests__/purchaseOrders.test.ts`

**Coverage:**

- ✅ API validates warehouse_id is required (Story 0.1)
- ✅ API rejects null warehouse_id (Story 0.1)
- ✅ API creates PO successfully with valid warehouse_id (Story 0.1)
- ✅ RPC error handling (missing supplier, currency mismatch)

### E2E Tests

**Location:** `apps/frontend/e2e/02-purchase-orders.spec.ts`

**Coverage:**

- ✅ Quick PO Entry requires warehouse selection (Story 0.1)
- ✅ Shows error when warehouse not selected (Story 0.1)
- ✅ Creates PO successfully with warehouse selected (Story 0.1)
- ✅ Handles empty warehouse list gracefully (Story 0.1 - added)
- ✅ Edit/delete POs (draft only)
- ✅ Filter POs by status

**Test Results:**

- Unit tests: 13/13 passing
- E2E tests: 7/7 passing (including warehouse validation)

---

## Migration History

### Migration 057: Add warehouse_id to po_header (Story 0.1)

**Date:** 2025-11-14

**Changes:**

- Added `warehouse_id BIGINT REFERENCES warehouses(id) ON DELETE RESTRICT`
- Created index CONCURRENTLY: `idx_po_header_warehouse_id`
- Precondition check: Fails if warehouses table is empty
- Data migration: Set default warehouse_id for existing PO rows

**Reason:** Fix Quick PO Entry workflow - API tried to INSERT warehouse_id but column didn't exist

**Files:**

- Migration: `apps/frontend/lib/supabase/migrations/057_add_warehouse_id_to_po_header.sql`
- Story: `docs/sprint-artifacts/0-1-fix-po-header-warehouse-id.md`

---

## API Reference

For detailed API documentation, see:

- **Auto-generated:** `docs/API_REFERENCE.md` (regenerated via `pnpm docs:update`)
- **Purchase Orders:** PurchaseOrdersAPI section
- **Transfer Orders:** TransferOrdersAPI section
- **Work Orders:** WorkOrdersAPI section

---

## Architectural Patterns

### Pattern 15: Required Business Context (Explicit, No Defaults)

**Established in:** Story 0.1 - Fix PO Header warehouse_id

**Problem:** API consumers might forget critical business context (warehouse, currency), leading to:

- Silent failures (NULL values)
- Wrong-warehouse deliveries
- Broken audit trails

**Solution:** Explicit validation - no magic defaults

**Implementation:**

```typescript
// API (PurchaseOrdersAPI.quickCreate)
if (!request.warehouse_id) {
  throw new Error('warehouse_id is required');
}

// UI (QuickPOEntryModal)
<label>
  Destination Warehouse <span className="text-red-500">*</span>
</label>
<select required>
  <option value="">Select warehouse...</option>
  {warehouses.map(w => <option>{w.name}</option>)}
</select>
```

**Benefits:**

- Forces explicit intent
- Clean audit trail
- Prevents wrong-warehouse errors
- Future-proof for mobile/integrations

**Full Documentation:** `docs/architecture.md` lines 2310-2417

---

## Known Issues & Technical Debt

See: `docs/TECHNICAL_DEBT_TODO.md`

**Planning Module Specific:**

- None currently (Story 0.1 resolved critical warehouse_id issue)

---

## Related Documentation

- **Epic 0 Roadmap:** `docs/bmm-roadmap-epic-0-p0-fixes.md`
- **P0 Audit Report:** `docs/P0-MODULES-AUDIT-REPORT-2025-11-14.md`
- **Architecture:** `docs/architecture.md`
- **Database Schema:** `docs/DATABASE_SCHEMA.md` (auto-generated)
- **API Reference:** `docs/API_REFERENCE.md` (auto-generated)

---

**Maintained by:** MonoPilot Development Team
**Last Review:** 2025-11-14 (Story 0.1 completion)
