# Planning Module - Szczegółowa Analiza Gap i Pliki do Analizy

> 📅 **Created**: 2025-11-03  
> 🎯 **Purpose**: Porównanie rzeczywistego stanu Planning Module z tym co jest w schemacie bazy  
> ⚠️ **Status**: Planning Module ~70% - Wiele kolumn ze schematu NIE jest w UI!

---

## 🔴 CRITICAL FINDINGS - GAP Analysis

### 1. Work Orders Table - Missing Columns

**SCHEMA Database** (`001_planning_tables.sql` lines 52-73):
```sql
CREATE TABLE work_orders (
  wo_number VARCHAR(50),
  product_id INTEGER,
  bom_id INTEGER,              -- ❌ NIE w UI
  quantity DECIMAL(12, 4),
  uom VARCHAR(20),
  priority INTEGER,
  status VARCHAR(20),
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,    -- ❌ NIE w UI
  actual_end TIMESTAMPTZ,      -- ❌ NIE w UI
  machine_id INTEGER,
  line_number VARCHAR(50),
  source_demand_type VARCHAR(50), -- ❌ NIE w UI
  source_demand_id INTEGER,    -- ❌ NIE w UI
  created_by INTEGER,          -- ❌ NIE w UI
  approved_by INTEGER          -- ❌ NIE w UI
)
```

**ACTUAL UI Table** (`WorkOrdersTable.tsx` lines 273-344):
1. ✅ WO # (wo_number)
2. ✅ Product (product_id → product.description)
3. ✅ Qty + UoM (quantity + uom)
4. ✅ Status (status)
5. ✅ Line/Machine (line_number / machine_id)
6. ✅ Dates (scheduled_start / scheduled_end)
7. ✅ Priority (priority)
8. ✅ QA (qa_status - from production)
9. ✅ Made (production output)
10. ✅ Progress % (calculated)
11. ✅ Shortages (calculated)
12. ✅ Actions

**❌ MISSING in UI (but in Database)**:
- `actual_start` / `actual_end` - Rzeczywiste daty rozpoczęcia/zakończenia
- `source_demand_type` / `source_demand_id` - Źródło zapotrzebowania (PO/TO/Manual)
- `bom_id` - ID BOM użytego dla WO
- `created_by` / `approved_by` - User tracking
- `notes` field (if exists)

**✅ EXIST in UI (calculated/joined)**:
- QA status (from production data)
- Made quantity (from production_outputs)
- Progress % (calculated)
- Shortages (from wo_materials vs stock)

### 2. Purchase Orders Table - Missing Columns

**SCHEMA Database** (`001_planning_tables.sql` lines 106-123):
```sql
CREATE TABLE purchase_orders (
  po_number VARCHAR(50),
  supplier_id INTEGER,
  warehouse_id INTEGER,
  status VARCHAR(20),
  request_delivery_date TIMESTAMPTZ,
  expected_delivery_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,        -- ❌ NIE w UI
  currency VARCHAR(3),         -- ❌ NIE w UI
  exchange_rate DECIMAL(10, 4), -- ❌ NIE w UI
  buyer_id INTEGER,
  notes TEXT,                  -- ❌ NIE w UI (tylko w Details)
  created_by INTEGER,          -- ❌ NIE w UI
  approved_by INTEGER          -- ❌ NIE w UI
)
```

**ACTUAL UI Table** (`PurchaseOrdersTable.tsx` lines 159-247):
1. ✅ PO Number (po_number)
2. ✅ Supplier (supplier_id → supplier.name)
3. ✅ Warehouse (warehouse_id → warehouse.name)
4. ✅ Request Delivery (request_delivery_date)
5. ✅ Expected Delivery (expected_delivery_date)
6. ✅ Buyer (buyer_id → buyer name)
7. ✅ Status (status)
8. ✅ Total Items (count of purchase_order_items)
9. ✅ Actions

**❌ MISSING in UI**:
- `due_date` - Data wymagalności płatności
- `currency` - Waluta zakupu
- `exchange_rate` - Kurs wymiany
- `notes` - Notatki (tylko w Details Modal, nie w table)
- `created_by` / `approved_by` - User tracking
- **Total Amount** - Suma wartości zamówienia (calculated field)

### 3. Transfer Orders Table - Missing Columns

**SCHEMA Database** (`001_planning_tables.sql` lines 180-194):
```sql
CREATE TABLE transfer_orders (
  to_number VARCHAR(50),
  from_location_id INTEGER,     -- ⚠️ UI shows warehouse (wrong!)
  to_location_id INTEGER,       -- ⚠️ UI shows warehouse (wrong!)
  status VARCHAR(20),
  planned_ship_date TIMESTAMPTZ,    -- ❌ NIE w UI
  actual_ship_date TIMESTAMPTZ,     -- ❌ NIE w UI
  planned_receive_date TIMESTAMPTZ, -- ❌ NIE w UI
  actual_receive_date TIMESTAMPTZ,  -- ❌ NIE w UI
  created_by INTEGER,           -- ❌ NIE w UI
  received_by INTEGER,          -- ❌ NIE w UI
  created_at TIMESTAMPTZ
)
```

**ACTUAL UI Table** (`TransferOrdersTable.tsx` lines 153-219):
1. ✅ TO Number (to_number)
2. ⚠️ From Location (showing from_warehouse?.name - should be from_location)
3. ⚠️ To Location (showing to_warehouse?.name - should be to_location)
4. ✅ Date (created_at) - ale to NIE jest planned/actual ship/receive!
5. ✅ Status (status)
6. ✅ Total Items (count of transfer_order_items)
7. ✅ Actions

**❌ MISSING in UI**:
- `planned_ship_date` - Planowana data wysyłki
- `actual_ship_date` - Rzeczywista data wysyłki
- `planned_receive_date` - Planowana data odbioru
- `actual_receive_date` - Rzeczywista data odbioru
- `created_by` / `received_by` - User tracking

**⚠️ INCORRECT in UI**:
- UI pokazuje `from_warehouse` / `to_warehouse` zamiast `from_location` / `to_location`
- Schema ma `from_location_id` / `to_location_id` (dokładna lokalizacja w magazynie)
- Phase 14 dodało `from_warehouse_id` / `to_warehouse_id` jako dodatkowe pola

---

## 📊 Planning Module - Co Jest vs Co Powinno Być

### Work Orders (WO)

| Feature | Status | Notes |
|---------|--------|-------|
| **Core Table** | ✅ ~90% | Podstawowe kolumny są |
| WO Number | ✅ Complete | |
| Product Selection | ✅ Complete | |
| Quantity + UoM | ✅ Complete | |
| Status | ✅ Complete | draft, planned, released, in_progress, completed, cancelled |
| Priority | ✅ Complete | 1-5 scale with color coding |
| Scheduled Start/End | ✅ Complete | |
| Line/Machine | ✅ Complete | |
| **Missing Fields** | ❌ ~30% | |
| Actual Start/End | ❌ Missing | Rzeczywiste daty |
| Source Demand | ❌ Missing | Skąd pochodzi WO (PO/TO/Manual) |
| BOM ID | ❌ Missing | Który BOM został użyty |
| Created By | ❌ Missing | User tracking |
| Approved By | ❌ Missing | Workflow approval |
| **Production Data** | ✅ ~80% | |
| QA Status | ✅ Complete | From production |
| Made Quantity | ✅ Complete | From production_outputs |
| Progress % | ✅ Complete | Calculated |
| Shortages | ✅ Complete | From wo_materials |
| **Modals** | ✅ ~95% | |
| Create WO Modal | ✅ Complete | Full form |
| Edit WO Modal | ✅ Complete | Reuses Create modal |
| Details Modal | ✅ Complete | Shows materials, operations |

**Overall WO**: ~85% Complete

### Purchase Orders (PO)

| Feature | Status | Notes |
|---------|--------|-------|
| **Core Table** | ✅ ~85% | Większość kolumn jest |
| PO Number | ✅ Complete | |
| Supplier | ✅ Complete | |
| Warehouse | ✅ Complete | |
| Request Delivery | ✅ Complete | |
| Expected Delivery | ✅ Complete | |
| Buyer | ✅ Complete | |
| Status | ✅ Complete | draft, submitted, confirmed, received, closed, cancelled |
| Total Items | ✅ Complete | Count of line items |
| **Missing Fields** | ❌ ~20% | |
| Due Date | ❌ Missing | Data wymagalności |
| Currency | ❌ Missing | Waluta |
| Exchange Rate | ❌ Missing | Kurs wymiany |
| Total Amount | ❌ Missing | Suma wartości (should be calculated) |
| Created By | ❌ Missing | User tracking |
| **Line Items** | ✅ ~90% | |
| Product Selection | ✅ Complete | MEAT + DRYGOODS only |
| Quantity | ✅ Complete | |
| Unit Price | ✅ Complete | |
| Total Price | ✅ Complete | Calculated |
| Qty Received | ✅ Complete | Tracking |
| Confirmed | ✅ Complete | Line item confirmation |
| **Modals** | ✅ ~90% | |
| Create PO Modal | ✅ Complete | Full form with line items |
| Edit PO Modal | ✅ Complete | Can edit all fields |
| Details Modal | ✅ Complete | Shows all PO data |

**Overall PO**: ~80% Complete

### Transfer Orders (TO)

| Feature | Status | Notes |
|---------|--------|-------|
| **Core Table** | ⚠️ ~60% | Dużo brakuje! |
| TO Number | ✅ Complete | |
| From Location | ⚠️ Wrong | Shows warehouse instead of location |
| To Location | ⚠️ Wrong | Shows warehouse instead of location |
| Date | ⚠️ Incomplete | Only created_at, no planned/actual |
| Status | ✅ Complete | draft, submitted, in_transit, received, cancelled |
| Total Items | ✅ Complete | Count of line items |
| **Missing Fields** | ❌ ~40% | |
| Planned Ship Date | ❌ Missing | Kiedy ma być wysłane |
| Actual Ship Date | ❌ Missing | Kiedy faktycznie wysłano |
| Planned Receive Date | ❌ Missing | Kiedy ma być odebrane |
| Actual Receive Date | ❌ Missing | Kiedy faktycznie odebrano |
| Created By | ❌ Missing | User tracking |
| Received By | ❌ Missing | User tracking |
| **Location Issue** | ⚠️ Critical | |
| Schema has | `from_location_id`, `to_location_id` | Exact location in warehouse |
| Phase 14 added | `from_warehouse_id`, `to_warehouse_id` | Warehouse level |
| UI shows | `from_warehouse?.name`, `to_warehouse?.name` | Only warehouse |
| **Line Items** | ✅ ~80% | |
| Product Selection | ✅ Complete | |
| Quantity Planned | ✅ Complete | |
| Quantity Actual | ⚠️ Missing | Not tracked in UI |
| LP ID | ⚠️ Missing | Which LP was transferred |
| Batch | ⚠️ Missing | Batch tracking |
| **Modals** | ✅ ~85% | |
| Create TO Modal | ✅ Complete | Warehouse selection |
| Edit TO Modal | ✅ Complete | Can edit |
| Details Modal | ✅ Complete | Shows items |

**Overall TO**: ~65% Complete

---

## 📁 Pliki Planning Module

### 1. Database Schema Files

```
apps/frontend/lib/supabase/migrations/
├── 001_planning_tables.sql              # Core planning tables (WO, PO, TO, GRN)
├── 003_phase14_schema.sql               # Phase 14 updates (warehouses, expanded suppliers)
└── 004_phase14_rpc_functions.sql        # RPC functions for planning
```

### 2. Frontend Components

#### Work Orders Components
```
apps/frontend/components/
├── WorkOrdersTable.tsx                  # Main WO table (536 lines)
├── CreateWorkOrderModal.tsx             # WO creation modal (306 lines)
├── WorkOrderDetailsModal.tsx            # WO details with materials/operations
└── RecordWeightsModal.tsx               # Weight recording for operations
```

#### Purchase Orders Components
```
apps/frontend/components/
├── PurchaseOrdersTable.tsx              # Main PO table (344 lines)
├── CreatePurchaseOrderModal.tsx         # PO creation with line items (431 lines)
├── EditPurchaseOrderModal.tsx           # PO editing (411 lines)
└── PurchaseOrderDetailsModal.tsx        # PO details view
```

#### Transfer Orders Components
```
apps/frontend/components/
├── TransferOrdersTable.tsx              # Main TO table (311 lines)
├── CreateTransferOrderModal.tsx         # TO creation
├── EditTransferOrderModal.tsx           # TO editing
└── TransferOrderDetailsModal.tsx        # TO details view
```

### 3. API Layer

```
apps/frontend/lib/api/
├── workOrders.ts                        # WO CRUD + operations
├── purchaseOrders.ts                    # PO CRUD
├── transferOrders.ts                    # TO CRUD
└── grn.ts                               # GRN operations
```

### 4. Documentation

```
docs/modules/planning/
├── PLANNING_MODULE_GUIDE.md             # Main planning guide
└── (no other planning-specific docs)

docs/testing/
└── PLANNING_TEST_PLAN.md                # Test plan for planning
```

---

## 🎯 Action Items - Co Należy Naprawić

### Priority 1 - CRITICAL (1-2 tygodnie)

#### 1. Work Orders - Add Missing Columns (3 dni)
**Columns to add**:
- [ ] `actual_start` / `actual_end` columns in table
- [ ] `source_demand` display (show where WO came from)
- [ ] `bom_id` / `bom_version` display (which BOM was used)
- [ ] `created_by` / `approved_by` in Details modal

**UI Updates**:
- [ ] Add "Actual Dates" column (show actual_start → actual_end)
- [ ] Add "Source" column (PO-001, TO-002, or Manual)
- [ ] Add "BOM" column in Details (show BOM version used)
- [ ] Add audit trail in Details (created by, approved by)

**Form Updates**:
- [ ] CreateWorkOrderModal: Add source_demand selection
- [ ] CreateWorkOrderModal: Show selected BOM version
- [ ] WorkOrderDetailsModal: Display actual dates
- [ ] WorkOrderDetailsModal: Show BOM snapshot info

#### 2. Purchase Orders - Add Missing Columns (2 dni)
**Columns to add**:
- [ ] `due_date` column (payment due date)
- [ ] `currency` + `exchange_rate` columns
- [ ] `total_amount` calculated column
- [ ] `created_by` in Details modal

**UI Updates**:
- [ ] Add "Due Date" column after Expected Delivery
- [ ] Add "Currency" column (show currency code)
- [ ] Add "Total Amount" column (calculated from line items)
- [ ] Show exchange rate in Details modal

**Form Updates**:
- [ ] CreatePurchaseOrderModal: Add due_date field
- [ ] CreatePurchaseOrderModal: Add currency selection
- [ ] CreatePurchaseOrderModal: Add exchange_rate field (auto-fill based on supplier)
- [ ] PurchaseOrderDetailsModal: Show total amount with currency

#### 3. Transfer Orders - Fix Location + Add Dates (3-4 dni)
**CRITICAL FIX**:
- [ ] Fix `from_location` / `to_location` display
- [ ] Show warehouse + location (e.g., "WH-MAIN / A-01-02")
- [ ] Update schema understanding (location vs warehouse)

**Columns to add**:
- [ ] `planned_ship_date` / `actual_ship_date` columns
- [ ] `planned_receive_date` / `actual_receive_date` columns
- [ ] `created_by` / `received_by` in Details

**UI Updates**:
- [ ] Replace "Date" column with "Planned Ship" and "Actual Ship"
- [ ] Add "Planned Receive" and "Actual Receive" columns
- [ ] Show location hierarchy (Warehouse → Location)
- [ ] Add date tracking workflow (plan → ship → receive)

**Form Updates**:
- [ ] CreateTransferOrderModal: Add date fields (planned_ship, planned_receive)
- [ ] EditTransferOrderModal: Allow updating actual dates
- [ ] TransferOrderDetailsModal: Show all 4 dates
- [ ] Add workflow status based on dates (planned, shipped, received)

**Line Items**:
- [ ] Add `quantity_actual` tracking (how much actually transferred)
- [ ] Add `lp_id` selection (which LP was transferred)
- [ ] Add `batch` tracking

### Priority 2 - IMPORTANT (1 tydzień)

#### 4. User Tracking & Audit Trail (2 dni)
**All Planning entities should track**:
- [ ] `created_by` - Who created the record
- [ ] `approved_by` - Who approved (if applicable)
- [ ] `updated_by` - Who last updated (if applicable)
- [ ] `received_by` - Who received (for TO/GRN)

**UI Updates**:
- [ ] Show "Created by" in Details modals
- [ ] Show "Last updated by" with timestamp
- [ ] Show approval workflow (if approved)
- [ ] Add audit log tab in Details modals

#### 5. Calculated Fields & KPIs (2 dni)
**Work Orders**:
- [x] Progress % (already calculated) ✅
- [x] Shortages (already calculated) ✅
- [ ] Cost tracking (planned vs actual)
- [ ] Time tracking (scheduled vs actual duration)
- [ ] Efficiency % (actual output / planned output)

**Purchase Orders**:
- [x] Total Items count ✅
- [ ] Total Amount (sum of line items)
- [ ] Received % (qty_received / qty_ordered)
- [ ] Outstanding Amount (not yet received)
- [ ] Lead time tracking (ordered → received)

**Transfer Orders**:
- [x] Total Items count ✅
- [ ] Transfer time (ship → receive)
- [ ] Completion % (actual / planned quantity)
- [ ] In-transit tracking

#### 6. Enhanced Filtering & Search (1-2 dni)
**Work Orders**:
- [x] Basic filters (status, line, product, QA, KPI scope) ✅
- [ ] Date range filter (scheduled/actual dates)
- [ ] Source demand filter (show only PO-driven, etc.)
- [ ] BOM version filter
- [ ] Multi-select filters

**Purchase Orders**:
- [x] Basic search (PO number, supplier, item codes) ✅
- [ ] Date range filter (request/expected delivery)
- [ ] Supplier filter dropdown
- [ ] Warehouse filter dropdown
- [ ] Status multi-select
- [ ] Currency filter

**Transfer Orders**:
- [x] Basic search (TO number, locations, item codes) ✅
- [ ] Date range filter (planned/actual ship/receive)
- [ ] From/To warehouse filters
- [ ] Status multi-select
- [ ] In-transit only filter

### Priority 3 - NICE TO HAVE (Post-MVP)

#### 7. Advanced Features
- [ ] Bulk operations (create multiple WOs/POs/TOs)
- [ ] Import from Excel
- [ ] Export to Excel/PDF
- [ ] Print PO/TO documents
- [ ] Email notifications
- [ ] Approval workflows
- [ ] Copy/Clone functionality
- [ ] Templates for recurring orders

---

## 📋 Summary - Planning Module Status

### Overall Status: ~70% Complete

| Component | Completion | Missing |
|-----------|-----------|---------|
| Work Orders | ~85% | Actual dates, source demand, BOM tracking, user tracking |
| Purchase Orders | ~80% | Due date, currency, exchange rate, total amount, user tracking |
| Transfer Orders | ~65% | Ship/receive dates (all 4), location fix, line item details, user tracking |

### Time Estimate to Complete

**Priority 1 (Critical)**:
- WO updates: 3 dni
- PO updates: 2 dni
- TO updates: 3-4 dni
- **Total**: 8-9 dni roboczych (~2 tygodnie)

**Priority 2 (Important)**:
- User tracking: 2 dni
- Calculated fields: 2 dni
- Enhanced filters: 1-2 dni
- **Total**: 5-6 dni roboczych (~1 tydzień)

**GRAND TOTAL**: 13-15 dni roboczych (~3 tygodnie)

---

## 📎 Pliki do Analizy - Complete List

### Schema Files (3 pliki)
```
apps/frontend/lib/supabase/migrations/001_planning_tables.sql    # Lines 52-261: WO, PO, TO, GRN tables
apps/frontend/lib/supabase/migrations/003_phase14_schema.sql     # Lines 1-99: Warehouses, expanded suppliers
apps/frontend/lib/supabase/migrations/004_phase14_rpc_functions.sql  # RPC functions
```

### Component Files (13 plików)
```
apps/frontend/components/WorkOrdersTable.tsx                     # 536 lines
apps/frontend/components/CreateWorkOrderModal.tsx                # 306 lines
apps/frontend/components/WorkOrderDetailsModal.tsx               # 421 lines
apps/frontend/components/PurchaseOrdersTable.tsx                 # 344 lines
apps/frontend/components/CreatePurchaseOrderModal.tsx            # 431 lines
apps/frontend/components/EditPurchaseOrderModal.tsx              # 411 lines
apps/frontend/components/PurchaseOrderDetailsModal.tsx           # 411 lines
apps/frontend/components/TransferOrdersTable.tsx                 # 311 lines
apps/frontend/components/CreateTransferOrderModal.tsx            # ~300 lines
apps/frontend/components/EditTransferOrderModal.tsx              # ~300 lines
apps/frontend/components/TransferOrderDetailsModal.tsx           # 220 lines
apps/frontend/components/RecordWeightsModal.tsx                  # Weight recording
apps/frontend/app/planning/page.tsx                              # Main planning page
```

### API Files (4 pliki)
```
apps/frontend/lib/api/workOrders.ts                              # WO CRUD + operations
apps/frontend/lib/api/purchaseOrders.ts                          # PO CRUD
apps/frontend/lib/api/transferOrders.ts                          # TO CRUD
apps/frontend/lib/api/grn.ts                                     # GRN operations
```

### Documentation (2 pliki)
```
docs/modules/planning/PLANNING_MODULE_GUIDE.md                   # Planning module guide
docs/testing/PLANNING_TEST_PLAN.md                               # Test plan
```

---

**Last Updated**: 2025-11-03  
**Status**: ✅ Ready for Implementation  
**Next Action**: Priority 1 fixes (8-9 dni) → Planning Module ~95% complete

