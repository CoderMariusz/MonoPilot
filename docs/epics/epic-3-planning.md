# Epic 3: Planning Operations

**Goal:** Enable purchase orders, transfer orders, work orders, and supplier management.

**Dependencies:** Epic 1 (Settings), Epic 2 (Technical)
**Required by:** Epic 4 (Production), Epic 5 (Warehouse)

**FRs Covered:** 16 (FR-PLAN-001 to FR-PLAN-016)
**Stories:** 22
**Effort Estimate:** 3-4 weeks

**UX Design Reference:** [ux-design-planning-module.md](../ux-design-planning-module.md)

---

## Story 3.1: Purchase Order CRUD

As a **Purchasing user**,
I want to create, edit, and view purchase orders,
So that I can manage procurement.

**Acceptance Criteria:**

**Given** the user has Purchasing role or higher
**When** they navigate to /planning/purchase-orders
**Then** they see a table with columns: PO Number, Supplier, Status, Expected Date, Total

**And** can search by PO number/supplier
**And** can filter by status, supplier, date range

**When** clicking "Add PO"
**Then** Create modal opens with fields:
- supplier_id (required) - inherits currency, tax_code
- warehouse_id (required)
- expected_delivery_date (required)
- payment_terms, shipping_method, notes (optional based on Settings)

**When** saving PO
**Then** PO created with auto-generated number
**And** status from configured default

**Prerequisites:** Epic 1, Epic 2

**Technical Notes:**
- Inheritance: currency/tax from supplier
- API: GET/POST/PUT/DELETE /api/planning/purchase-orders

---

## Story 3.2: PO Line Management

As a **Purchasing user**,
I want to add and manage PO lines,
So that I can specify what to order.

**Acceptance Criteria:**

**Given** a PO is created
**When** adding a line
**Then** modal opens with:
- product_id (required) - inherits UoM, unit_price
- quantity (required)
- unit_price (editable, defaults from product)
- discount_percent (optional)
- expected_delivery_date (optional, defaults to header)

**When** saving line
**Then** line_total calculated (qty × price - discount)
**And** PO totals updated (subtotal, tax, total)

**Prerequisites:** Story 3.1

**Technical Notes:**
- API: POST/PUT/DELETE /api/planning/purchase-orders/:id/lines

---

## Story 3.3: Bulk PO Creation

As a **Purchasing user**,
I want to bulk create POs from a list of products,
So that I can quickly order from multiple suppliers.

**Acceptance Criteria:**

**Given** the user clicks "Bulk Create POs"
**When** they upload Excel or use bulk form
**Then** they enter: Product Code, Quantity

**And** system looks up:
- Product → default supplier
- Supplier → currency, tax, payment terms
- Product → UoM, std price

**And** groups products by supplier
**And** creates multiple draft POs

**When** reviewing drafts
**Then** user can edit before submitting

**Prerequisites:** Story 3.1, Story 3.2

**Technical Notes:**
- Excel template: Product Code, Quantity
- API: POST /api/planning/purchase-orders/bulk

---

## Story 3.4: PO Approval Workflow

As a **Manager**,
I want to approve POs before sending to suppliers,
So that we have control over spending.

**Acceptance Criteria:**

**Given** approval is enabled in Settings
**When** PO is submitted
**Then** approval_status → Pending

**Given** Manager reviews pending PO
**When** clicking Approve/Reject
**Then** approval_status updated
**And** approved_by/approved_at recorded
**And** rejection requires reason

**Only** Admin/Manager can approve

**Prerequisites:** Story 3.1

**Technical Notes:**
- Toggle in planning_settings.po_require_approval
- API: PUT /api/planning/purchase-orders/:id/approve

---

## Story 3.5: Configurable PO Statuses

As an **Admin**,
I want to configure PO status workflow,
So that it matches our process.

**Acceptance Criteria:**

**Given** Admin navigates to /settings/planning
**When** viewing PO Statuses
**Then** can add/remove/rename statuses
**And** set default status for new POs

**Default statuses:**
- Draft, Submitted, Confirmed, Receiving, Closed

**Optional statuses:**
- Approved, Partially Received, Cancelled

**Prerequisites:** Epic 1

**Technical Notes:**
- Stored in planning_settings.po_statuses JSONB
- API: GET/PUT /api/planning/settings

---

## Story 3.6: Transfer Order CRUD

As a **Warehouse user**,
I want to create transfer orders between warehouses,
So that I can move inventory.

**Acceptance Criteria:**

**Given** the user has Warehouse role or higher
**When** they navigate to /planning/transfer-orders
**Then** they see a table with: TO Number, From WH, To WH, Status, Ship Date

**When** clicking "Add TO"
**Then** modal opens with:
- from_warehouse_id (required)
- to_warehouse_id (required)
- planned_ship_date (required)
- planned_receive_date (required)
- notes (optional)

**When** saving TO
**Then** TO created with auto-generated number
**And** status from configured default

**Prerequisites:** Story 1.5

**Technical Notes:**
- Warehouse-based (no location in header)
- API: GET/POST/PUT/DELETE /api/planning/transfer-orders

---

## Story 3.7: TO Line Management

As a **Warehouse user**,
I want to add products to transfer orders,
So that I can specify what to transfer.

**Acceptance Criteria:**

**Given** a TO is created
**When** adding a line
**Then** modal opens with:
- product_id (required)
- quantity (required)
- uom (from product)

**And** can add multiple lines

**When** TO is shipped
**Then** shipped_qty tracked per line
**When** TO is received
**Then** received_qty tracked

**Prerequisites:** Story 3.6

**Technical Notes:**
- API: POST/PUT/DELETE /api/planning/transfer-orders/:id/lines

---

## Story 3.8: Partial TO Shipments

As a **Warehouse user**,
I want to ship TOs in multiple shipments,
So that I can handle partial availability.

**Acceptance Criteria:**

**Given** partial shipments enabled in Settings
**When** shipping TO
**Then** can select subset of lines/quantities

**And** status → Partially Shipped
**And** shipped_qty updated per line

**When** all shipped
**Then** status → Shipped

**Prerequisites:** Story 3.6, Story 3.7

**Technical Notes:**
- Toggle in planning_settings.to_allow_partial
- Track shipment records

---

## Story 3.9: LP Selection for TO

As a **Warehouse user**,
I want to pre-select specific LPs for transfer,
So that I can reserve inventory.

**Acceptance Criteria:**

**Given** LP selection enabled in Settings
**When** viewing TO lines
**Then** can click "Select LPs"

**And** modal shows available LPs for product
**And** can select specific LPs

**When** saving LP selections
**Then** LPs reserved for TO
**And** shown in TO line detail

**Not mandatory** - can ship without pre-selection

**Prerequisites:** Story 3.7, Epic 5

**Technical Notes:**
- to_line_lps table
- Toggle in planning_settings.to_require_lp_selection
- API: PUT /api/planning/transfer-orders/:id/lines/:lineId/lps

---

## Story 3.10: Work Order CRUD

As a **Planner**,
I want to create work orders,
So that I can schedule production.

**Acceptance Criteria:**

**Given** the user has Planner role or higher
**When** they navigate to /planning/work-orders
**Then** they see a table with: WO Number, Product, Qty, Status, Scheduled Date, Line

**When** clicking "Add WO"
**Then** modal opens with:
- product_id (required)
- quantity (required)
- scheduled_date (required) - triggers BOM selection
- line_id (optional)
- machine_id (optional)
- priority (Low/Medium/High/Critical)

**When** saving WO
**Then** WO created with auto-generated number
**And** BOM snapshot created

**Prerequisites:** Epic 2

**Technical Notes:**
- BOM auto-selection based on scheduled_date
- API: GET/POST/PUT/DELETE /api/planning/work-orders

---

## Story 3.11: BOM Auto-Selection for WO

As a **Planner**,
I want the system to auto-select the correct BOM,
So that the right recipe is used.

**Acceptance Criteria:**

**Given** user selects product and scheduled_date
**When** system searches for BOM
**Then** finds BOM where: effective_from <= date <= effective_to
**And** selects most recent if multiple match

**Given** no active BOM found
**Then** shows error: "No active BOM for this date"

**When** user wants different BOM
**Then** can override with dropdown

**Prerequisites:** Story 3.10, Story 2.6

**Technical Notes:**
- Query: SELECT * FROM boms WHERE product_id = X AND status = 'active' AND effective_from <= date AND (effective_to IS NULL OR effective_to >= date)

---

## Story 3.12: WO Materials Snapshot

As a **Planner**,
I want WO to capture BOM at creation time,
So that recipe is immutable during production.

**Acceptance Criteria:**

**Given** WO is created
**When** BOM is selected
**Then** all BOM items copied to wo_materials:
- product_id, quantity (scaled to WO qty), uom
- scrap_percent, consume_whole_lp
- is_by_product, yield_percent
- condition_flags

**And** wo_materials cannot change after WO is released
**And** shows warning if BOM is updated after WO creation

**Prerequisites:** Story 3.10, Story 3.11

**Technical Notes:**
- Calculation: wo_material.qty = bom_item.qty × (wo.qty / bom.output_qty)

---

## Story 3.13: Material Availability Check

As a **Planner**,
I want to see material availability when creating WO,
So that I know if production can proceed.

**Acceptance Criteria:**

**Given** material check enabled in Settings
**When** WO is being created
**Then** system calculates required materials
**And** checks available LP qty per material

**And** shows indicators:
- 🟢 Green: available >= required × 1.2
- 🟡 Yellow: available >= required but < required × 1.2
- 🔴 Red: available < required

**When** user sees warnings
**Then** can still proceed (warnings only)

**Prerequisites:** Story 3.12, Epic 5

**Technical Notes:**
- Query available LPs: SUM(qty) WHERE product_id = X AND status = 'available'
- Toggle in planning_settings.wo_material_check
- API: GET /api/planning/work-orders/:id/availability

---

## Story 3.14: Routing Copy to WO

As a **Planner**,
I want WO to include routing operations,
So that operators know what steps to perform.

**Acceptance Criteria:**

**Given** product has routing assigned
**When** WO is created and copy_routing enabled
**Then** routing operations copied to wo_operations:
- sequence, operation_name
- machine_id, line_id
- expected_duration_minutes
- expected_yield_percent

**And** all operations start with status = 'not_started'

**When** viewing WO
**Then** operations shown in sequence

**Prerequisites:** Story 3.10, Story 2.15

**Technical Notes:**
- Toggle in planning_settings.wo_copy_routing
- Can override machine/line per operation

---

## Story 3.15: Configurable WO Statuses

As an **Admin**,
I want to configure WO status lifecycle,
So that it matches our process.

**Acceptance Criteria:**

**Given** Admin navigates to /settings/planning
**When** viewing WO Statuses
**Then** can add/remove/rename statuses
**And** set status expiry (auto-close after X days)

**Default statuses:**
- Draft, Planned, Released, In Progress, Completed, Closed

**Optional statuses:**
- On Hold, Cancelled, Quality Hold

**Prerequisites:** Epic 1

**Technical Notes:**
- Stored in planning_settings.wo_statuses JSONB
- Status expiry in planning_settings.wo_status_expiry_days

---

## Story 3.16: WO Source of Demand

As a **Planner**,
I want to track why a WO was created,
So that I can trace demand.

**Acceptance Criteria:**

**Given** source_of_demand enabled in Settings
**When** creating WO
**Then** can select:
- PO Number
- Customer Order
- Manual
- Forecast

**And** enter source_reference (e.g., "PO-001", "ORD-123")

**When** viewing WO
**Then** source shown for reference

**Prerequisites:** Story 3.10

**Technical Notes:**
- Toggle in planning_settings.wo_source_of_demand
- Optional fields: source_of_demand, source_reference

---

## Story 3.17: Supplier Management

As a **Purchasing user**,
I want to manage suppliers with defaults,
So that PO creation is efficient.

**Acceptance Criteria:**

**Given** the user navigates to /planning/mrp
**When** viewing Suppliers tab
**Then** they see a table with: Code, Name, Currency, Lead Time, Status

**When** clicking "Add Supplier"
**Then** modal opens with:
- code (required, unique)
- name (required)
- contact info (optional)
- currency (required)
- tax_code_id (required)
- payment_terms, lead_time_days (required)
- moq (optional)
- is_active (toggle)

**Prerequisites:** Epic 1

**Technical Notes:**
- API: GET/POST/PUT/DELETE /api/planning/suppliers

---

## Story 3.18: Supplier-Product Assignments

As a **Purchasing user**,
I want to assign products to suppliers,
So that I know where to order each product.

**Acceptance Criteria:**

**Given** a supplier exists
**When** viewing supplier detail
**Then** see Products tab with assigned products

**When** clicking "Assign Products"
**Then** modal shows available products
**And** can set per product:
- is_default (only one default per product)
- supplier_product_code
- lead_time_days (override)
- unit_price
- moq

**When** bulk creating PO
**Then** uses default supplier per product

**Prerequisites:** Story 3.17, Story 2.1

**Technical Notes:**
- supplier_products table
- UNIQUE (supplier_id, product_id)
- API: PUT /api/planning/suppliers/:id/products

---

## Story 3.19: PO Status Lifecycle

As a **Purchasing user**,
I want to move PO through statuses,
So that I can track procurement progress.

**Acceptance Criteria:**

**Given** PO exists
**When** clicking status change button
**Then** PO moves to next status

**Typical flow:**
Draft → Submitted → Confirmed → Receiving → Closed

**And** status change logged in audit
**And** timestamps updated

**Prerequisites:** Story 3.1, Story 3.5

**Technical Notes:**
- API: PUT /api/planning/purchase-orders/:id/status

---

## Story 3.20: TO Status Lifecycle

As a **Warehouse user**,
I want to move TO through statuses,
So that I can track transfer progress.

**Acceptance Criteria:**

**Given** TO exists
**When** shipping TO
**Then** status → Shipped
**And** actual_ship_date set

**When** receiving TO
**Then** status → Received
**And** actual_receive_date set

**Flow:**
Draft → Planned → Shipped → Received

**Prerequisites:** Story 3.6

**Technical Notes:**
- API: PUT /api/planning/transfer-orders/:id/status

---

## Story 3.21: WO Gantt View

As a **Planner**,
I want to see WO schedule as Gantt chart,
So that I can visualize production timeline.

**Acceptance Criteria:**

**Given** the user navigates to /planning/work-orders
**When** selecting "Schedule View"
**Then** Gantt chart shows:
- X-axis: dates
- Y-axis: production lines
- Bars: WOs with product, qty, status color

**And** can click bar to view WO detail
**And** can drag to reschedule (if allowed)

**Prerequisites:** Story 3.10

**Technical Notes:**
- API: GET /api/planning/work-orders/schedule
- Use recharts or similar for visualization

---

## Story 3.22: Planning Settings Configuration

As an **Admin**,
I want to configure Planning module settings,
So that PO/TO/WO behavior matches our process.

**Acceptance Criteria:**

**Given** Admin navigates to /settings/planning
**Then** can configure:
- PO: statuses, require_approval, field toggles
- TO: statuses, allow_partial, require_lp_selection
- WO: statuses, status_expiry, source_of_demand, material_check, copy_routing

**Prerequisites:** Epic 1

**Technical Notes:**
- planning_settings table
- API: GET/PUT /api/planning/settings

---

## FR Coverage

| FR ID | Requirement | Stories |
|-------|-------------|---------|
| FR-PLAN-001 | PO CRUD | 3.1, 3.2 |
| FR-PLAN-002 | Bulk PO Creation | 3.3 |
| FR-PLAN-003 | PO Approval Workflow | 3.4 |
| FR-PLAN-004 | Configurable PO Statuses | 3.5, 3.19 |
| FR-PLAN-005 | TO CRUD | 3.6, 3.7 |
| FR-PLAN-006 | Partial Shipments | 3.8 |
| FR-PLAN-007 | LP Selection for TO | 3.9 |
| FR-PLAN-008 | WO CRUD | 3.10 |
| FR-PLAN-009 | BOM Auto-Selection | 3.11 |
| FR-PLAN-010 | Material Availability Check | 3.13 |
| FR-PLAN-011 | Routing Copy to WO | 3.14 |
| FR-PLAN-012 | Configurable WO Statuses | 3.15 |
| FR-PLAN-013 | Supplier Management | 3.17, 3.18 |
| FR-PLAN-014 | Demand Forecasting | Phase 2 |
| FR-PLAN-015 | Auto-Generate PO | Phase 2 |
| FR-PLAN-016 | Auto-Schedule WO | Phase 2 |

**Coverage:** 13 of 16 FRs (3 deferred to Phase 2)
