# Planning Module - Epic Breakdown

**Moduł:** Planning (PO, TO, WO, MRP)
**Priorytet:** P0 - Core Module
**FRs:** 16 (12 MVP + 4 Growth)
**Szacowany czas:** 3-4 tygodnie

---

## Podsumowanie Epików

| Epic | Nazwa | FRs | Stories | Priorytet | Effort |
|------|-------|-----|---------|-----------|--------|
| PLAN-1 | Purchase Orders | 4 | 8 | P0 | 5d |
| PLAN-2 | Transfer Orders | 3 | 5 | P0 | 3d |
| PLAN-3 | Work Orders | 5 | 8 | P0 | 5d |
| PLAN-4 | Suppliers & MRP | 4 | 6 | P0/P1 | 3d |
| **Total** | | **16** | **27** | | **16d** |

---

## Epic PLAN-1: Purchase Orders

**Cel:** Zarządzanie zamówieniami zakupu z bulk import i approval
**FRs:** FR-PLAN-001, FR-PLAN-002, FR-PLAN-003, FR-PLAN-004
**Priorytet:** P0 MVP
**Effort:** 5 dni

### Stories

#### PLAN-1-1: PO CRUD Core
**Jako** Purchaser **chcę** tworzyć zamówienia zakupu **aby** zamawiać materiały

**Acceptance Criteria:**
- [ ] PO list table z filtrami (status, supplier, date)
- [ ] Create PO: supplier, warehouse, expected date
- [ ] Currency/Tax inherited from supplier
- [ ] Edit PO (draft/submitted only)
- [ ] Delete PO (draft only)
- [ ] Auto-generated po_number

**Technical Tasks:**
- API: CRUD `/api/planning/purchase-orders`
- Zod schema
- UI: POsTable, CreatePOModal

---

#### PLAN-1-2: PO Lines with Inheritance
**Jako** Purchaser **chcę** dodawać produkty do PO **aby** definiować co zamawiamy

**Acceptance Criteria:**
- [ ] PO Lines table per PO
- [ ] Add line: product, qty
- [ ] UoM inherited from product
- [ ] Unit price inherited from product std_price
- [ ] Line total calculated
- [ ] Discount % optional
- [ ] Delete line

**Technical Tasks:**
- API: CRUD PO lines
- Inheritance logic from Product
- Line total calculation

---

#### PLAN-1-3: Configurable PO Statuses
**Jako** Admin **chcę** konfigurować statusy PO **aby** dopasować do naszego workflow

**Acceptance Criteria:**
- [ ] Settings: PO status list management
- [ ] Add/remove/rename statuses
- [ ] Default statuses: Draft, Submitted, Confirmed, Receiving, Closed
- [ ] Optional: Approved, Partially Received, Cancelled
- [ ] Status dropdown uses configured list

**Technical Tasks:**
- planning_settings.po_statuses JSONB
- Settings UI for status management
- API filtering by valid statuses

---

#### PLAN-1-4: Bulk PO Creation
**Jako** Purchaser **chcę** importować produkty z Excel **aby** szybko tworzyć PO

**Acceptance Criteria:**
- [ ] Excel upload OR bulk form
- [ ] Input: Product Code, Quantity (minimum)
- [ ] System looks up: Product → Default Supplier
- [ ] System groups by Supplier
- [ ] Creates multiple PO drafts
- [ ] Preview before creation
- [ ] User can edit drafts

**Technical Tasks:**
- API: POST `/api/planning/purchase-orders/bulk`
- Excel parsing (xlsx)
- Group-by-supplier logic
- UI: BulkImportModal, BulkAddForm

---

#### PLAN-1-5: PO Approval Workflow
**Jako** Manager **chcę** zatwierdzać PO **aby** kontrolować wydatki

**Acceptance Criteria:**
- [ ] Toggle in Settings: require_approval
- [ ] If enabled: PO has approval_status (Pending, Approved, Rejected)
- [ ] Submit button creates Pending approval
- [ ] Approve/Reject buttons for Manager/Admin
- [ ] Logged: approved_by, approved_at
- [ ] Cannot send to supplier until approved

**Technical Tasks:**
- approval_status, approved_by, approved_at fields
- Permission check for approval
- UI: ApprovalBadge, ApproveButton

---

#### PLAN-1-6: PO Totals Calculation
**Jako** System **chcę** kalkulować sumy PO **aby** pokazać wartość zamówienia

**Acceptance Criteria:**
- [ ] subtotal = sum of line_total
- [ ] tax_amount = subtotal × tax_rate
- [ ] total = subtotal + tax_amount
- [ ] Recalculated on any line change
- [ ] Displayed on PO header

**Technical Tasks:**
- Trigger/hook on line changes
- Total calculation logic
- Display in PO detail

---

#### PLAN-1-7: PO Configurable Fields
**Jako** Admin **chcę** włączać/wyłączać pola PO **aby** upraszczać formularze

**Acceptance Criteria:**
- [ ] Toggle: payment_terms, shipping_method, notes
- [ ] Fields hidden when disabled
- [ ] Settings UI for configuration

**Technical Tasks:**
- planning_settings.po_field_config JSONB
- Dynamic form rendering

---

#### PLAN-1-8: PO Status Change Actions
**Jako** User **chcę** zmieniać status PO **aby** śledzić postęp

**Acceptance Criteria:**
- [ ] Status dropdown z dozwolonymi transitions
- [ ] Draft → Submitted → Confirmed → Receiving → Closed
- [ ] Cannot skip statuses
- [ ] Audit log on status change

**Technical Tasks:**
- API: PUT `/api/planning/purchase-orders/:id/status`
- Status transition validation
- Audit logging

---

## Epic PLAN-2: Transfer Orders

**Cel:** Transfery między magazynami z partial shipments
**FRs:** FR-PLAN-005, FR-PLAN-006, FR-PLAN-007
**Priorytet:** P0 MVP
**Effort:** 3 dni

### Stories

#### PLAN-2-1: TO CRUD Core
**Jako** Warehouse Manager **chcę** tworzyć TO **aby** przenosić stock między magazynami

**Acceptance Criteria:**
- [ ] TO list z filtrami (status, date, warehouse)
- [ ] Create TO: from_warehouse, to_warehouse, dates
- [ ] Add lines: product, qty, uom
- [ ] Edit/Delete TO (draft only)
- [ ] Auto-generated to_number

**Technical Tasks:**
- API: CRUD `/api/planning/transfer-orders`
- UI: TOsTable, CreateTOModal

---

#### PLAN-2-2: Configurable TO Statuses
**Jako** Admin **chcę** konfigurować statusy TO **aby** dopasować workflow

**Acceptance Criteria:**
- [ ] Settings: TO status list
- [ ] Default: Draft, Planned, Shipped, Received
- [ ] Optional: Partially Shipped

**Technical Tasks:**
- planning_settings.to_statuses JSONB
- Status management UI

---

#### PLAN-2-3: Partial Shipments
**Jako** Warehouse Op **chcę** wysyłać TO częściowo **aby** nie blokować całości

**Acceptance Criteria:**
- [ ] Toggle in Settings: allow_partial
- [ ] Track shipped_qty vs quantity per line
- [ ] Status: Partially Shipped
- [ ] Multiple shipment records per TO
- [ ] Receive confirms which shipment

**Technical Tasks:**
- shipped_qty, received_qty fields
- Shipment records table
- Status logic for partial

---

#### PLAN-2-4: LP Selection for TO
**Jako** Warehouse Op **chcę** przypisać konkretne LP do TO **aby** wiedzieć co wysyłam

**Acceptance Criteria:**
- [ ] Toggle in Settings: require_lp_selection
- [ ] If enabled: can assign LPs to TO lines
- [ ] LP selector shows available stock
- [ ] Not mandatory - can ship without selection
- [ ] At shipping, scanner confirms actual LPs

**Technical Tasks:**
- to_line_lps table
- API: PUT `/api/planning/transfer-orders/:id/lines/:lineId/lps`
- UI: LPSelectionModal

---

#### PLAN-2-5: TO Status Lifecycle
**Jako** User **chcę** śledzić status TO **aby** wiedzieć gdzie jest transfer

**Acceptance Criteria:**
- [ ] Draft → Planned → Shipped → Received
- [ ] actual_ship_date set on Ship
- [ ] actual_receive_date set on Receive
- [ ] Audit log on status change

**Technical Tasks:**
- Status transition validation
- Date auto-fill on status change

---

## Epic PLAN-3: Work Orders

**Cel:** Zlecenia produkcyjne z BOM snapshot i material check
**FRs:** FR-PLAN-008, FR-PLAN-009, FR-PLAN-010, FR-PLAN-011, FR-PLAN-012
**Priorytet:** P0 MVP
**Effort:** 5 dni

### Stories

#### PLAN-3-1: WO CRUD Core
**Jako** Planner **chcę** tworzyć WO **aby** planować produkcję

**Acceptance Criteria:**
- [ ] WO list z filtrami (status, product, date, line)
- [ ] Create WO: product, qty, scheduled_date, line, priority
- [ ] UoM from product
- [ ] Edit/Delete (draft only)
- [ ] Auto-generated wo_number

**Technical Tasks:**
- API: CRUD `/api/planning/work-orders`
- UI: WOsTable, CreateWOModal

---

#### PLAN-3-2: BOM Auto-Selection
**Jako** System **chcę** automatycznie wybrać BOM **aby** użyć właściwej receptury

**Acceptance Criteria:**
- [ ] On product select, find active BOM
- [ ] effective_from <= scheduled_date <= effective_to
- [ ] If multiple, select most recent
- [ ] Show BOM preview in modal
- [ ] User can override selection

**Technical Tasks:**
- BOM lookup query with date filter
- BOM preview component
- Override selector

---

#### PLAN-3-3: BOM Snapshot (wo_materials)
**Jako** System **chcę** skopiować BOM do WO **aby** zachować immutability

**Acceptance Criteria:**
- [ ] On WO create, copy BOM items to wo_materials
- [ ] Calculate qty: (BOM item qty × WO qty) / BOM output qty
- [ ] Copy: uom, scrap%, consume_whole_lp, is_by_product, yield%, condition_flags
- [ ] wo_materials read-only after release
- [ ] consumed_qty updated during production

**Technical Tasks:**
- Deep copy on WO create
- Quantity calculation logic
- wo_materials table

---

#### PLAN-3-4: Material Availability Check
**Jako** Planner **chcę** widzieć dostępność materiałów **aby** wiedzieć czy mogę produkować

**Acceptance Criteria:**
- [ ] Toggle in Settings: material_check
- [ ] Calculate required from wo_materials
- [ ] Check available LP qty (status=available)
- [ ] Warnings: Yellow (low), Red (no stock)
- [ ] Allow proceed despite warnings

**Technical Tasks:**
- API: GET `/api/planning/work-orders/:id/availability`
- Stock calculation query
- UI: MaterialAvailabilityIndicator

---

#### PLAN-3-5: Routing Copy (wo_operations)
**Jako** System **chcę** skopiować routing do WO **aby** śledzić operacje

**Acceptance Criteria:**
- [ ] Toggle in Settings: copy_routing
- [ ] Copy routing operations to wo_operations
- [ ] Track expected vs actual duration/yield
- [ ] Operation status: Not Started, In Progress, Completed
- [ ] started_at, completed_at timestamps

**Technical Tasks:**
- Deep copy on WO create
- wo_operations table
- Operation status tracking

---

#### PLAN-3-6: Configurable WO Statuses
**Jako** Admin **chcę** konfigurować statusy WO **aby** dopasować workflow

**Acceptance Criteria:**
- [ ] Settings: WO status list
- [ ] Default: Draft, Planned, Released, In Progress, Completed, Closed
- [ ] Optional: On Hold, Cancelled, Quality Hold
- [ ] Status expiry (auto-close after X days)
- [ ] Source of demand field toggle

**Technical Tasks:**
- planning_settings.wo_statuses JSONB
- Expiry cron job
- source_of_demand field

---

#### PLAN-3-7: WO Gantt Schedule View
**Jako** Planner **chcę** widzieć WO na timeline **aby** planować wizualnie

**Acceptance Criteria:**
- [ ] Gantt chart: WOs by line/date
- [ ] Click WO to view details
- [ ] Color by status
- [ ] Filter by line, date range, status
- [ ] Today marker

**Technical Tasks:**
- API: GET `/api/planning/work-orders/schedule`
- UI: WOGanttChart component

---

#### PLAN-3-8: WO Status & Priority Management
**Jako** Planner **chcę** zmieniać status i priorytet WO **aby** zarządzać produkcją

**Acceptance Criteria:**
- [ ] Status dropdown z transitions
- [ ] Priority: Low, Medium, High, Critical
- [ ] Release button (Draft → Released)
- [ ] Start button (Released → In Progress)
- [ ] Complete button (In Progress → Completed)

**Technical Tasks:**
- API: PUT status/priority
- Status transition validation
- UI: Status/Priority controls

---

## Epic PLAN-4: Suppliers & MRP

**Cel:** Zarządzanie dostawcami i podstawy MRP
**FRs:** FR-PLAN-013, FR-PLAN-014, FR-PLAN-015, FR-PLAN-016
**Priorytet:** P0 (Suppliers), P1 (MRP)
**Effort:** 3 dni

### Stories

#### PLAN-4-1: Supplier CRUD
**Jako** Purchaser **chcę** zarządzać dostawcami **aby** mieć ich dane

**Acceptance Criteria:**
- [ ] Suppliers list z search
- [ ] Create supplier: code, name, contact, address
- [ ] Defaults: currency, tax_code, lead_time, moq, payment_terms
- [ ] Edit/Deactivate supplier

**Technical Tasks:**
- API: CRUD `/api/planning/suppliers`
- suppliers table
- UI: SuppliersTable, SupplierForm

---

#### PLAN-4-2: Supplier-Product Assignment
**Jako** Purchaser **chcę** przypisać produkty do dostawców **aby** wiedzieć od kogo kupować

**Acceptance Criteria:**
- [ ] Product can have multiple suppliers
- [ ] One marked as default
- [ ] Override: supplier_product_code, lead_time, unit_price, moq
- [ ] Assignment UI: multi-select products

**Technical Tasks:**
- supplier_products table
- API: PUT `/api/planning/suppliers/:id/products`
- UI: ProductAssignmentModal

---

#### PLAN-4-3: Default Supplier Lookup
**Jako** System **chcę** znajdować domyślnego dostawcę **aby** ułatwiać bulk PO

**Acceptance Criteria:**
- [ ] Product → Default Supplier via supplier_products
- [ ] Used in Bulk PO creation
- [ ] Fallback: none if no default

**Technical Tasks:**
- Query with is_default filter
- Integration with bulk PO

---

#### PLAN-4-4: Supplier Detail View
**Jako** Purchaser **chcę** widzieć szczegóły dostawcy **aby** mieć pełny obraz

**Acceptance Criteria:**
- [ ] Supplier info card
- [ ] Products tab with assignments
- [ ] PO history tab (POs from this supplier)
- [ ] Contact info

**Technical Tasks:**
- API: GET supplier with products and POs
- UI: SupplierDetail page

---

#### PLAN-4-5: Demand Forecasting (Growth)
**Jako** Planner **chcę** widzieć prognozę zapotrzebowania **aby** planować z wyprzedzeniem

**Acceptance Criteria:**
- [ ] Historical consumption analysis
- [ ] Forecast 7/14/30 days ahead
- [ ] Chart: predicted vs actual
- [ ] Export forecast

**Technical Tasks:**
- Analytics query on historical data
- Time series prediction
- UI: ForecastDashboard

---

#### PLAN-4-6: Auto-Generate PO Suggestions (Growth)
**Jako** Planner **chcę** widzieć sugerowane PO **aby** szybko zamawiać

**Acceptance Criteria:**
- [ ] Calculate needs from WO schedule + forecast
- [ ] Consider lead times, MOQ, reorder points
- [ ] Suggested PO list with products/quantities
- [ ] One-click generate PO drafts

**Technical Tasks:**
- MRP calculation engine
- API: GET suggested-pos, POST generate-pos
- UI: SuggestedPOsList

---

## Zależności

```
PLAN-1 (PO) ← PLAN-4 (Suppliers)
PLAN-2 (TO) ← requires Warehouse LPs
PLAN-3 (WO) ← requires TECH-2 (BOMs), TECH-3 (Routings)
```

- Suppliers needed for PO inheritance
- BOMs/Routings needed for WO creation
- LP data needed for TO selection and WO material check

---

## Definition of Done

- [ ] Wszystkie AC spełnione
- [ ] Inheritance logic works (Supplier → PO, Product → Line)
- [ ] Bulk PO groups correctly by supplier
- [ ] BOM snapshot immutable after release
- [ ] Material availability calculates correctly
- [ ] Unit tests (95% coverage)
- [ ] E2E tests for critical paths
- [ ] API documentation updated

---

## Status

- **Created:** 2025-11-19
- **Status:** Ready for Sprint Planning
- **Dependencies:** Settings, Technical modules complete

---

_Epic breakdown dla Planning Module - 16 FRs → 4 epiki, 27 stories_
