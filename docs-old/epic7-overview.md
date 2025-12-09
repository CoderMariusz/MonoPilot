# Epic 7: Shipping & Order Fulfillment

**Goal:** Enable end-to-end order fulfillment - sales orders, picking, packing, shipment tracking, and shipping documentation.

**Dependencies:** Epic 1 (Settings), Epic 5 (Warehouse - LP)
**Required by:** None (outbound logistics)

**FRs Covered:** 26 (SH-FR-01 to SH-FR-26)
**Stories:** 28
**Priority:** Should Have (Growth/Phase 2)
**Effort Estimate:** 3-4 weeks

**UX Design Reference:** [ux-design-shipping-module.md](../ux-design-shipping-module.md)

---

## Story 7.1: Sales Order CRUD

As a **Sales user**,
I want to create and manage sales orders,
So that customer orders are tracked.

**Acceptance Criteria:**

**Given** the user has Sales role or higher
**When** they navigate to /shipping/sales-orders
**Then** they see a table with: SO Number, Customer, Status, Order Date, Total

**When** clicking "Add SO"
**Then** modal opens with:
- customer_id (required, dropdown)
- order_date (default: today)
- requested_ship_date (required)
- shipping_address (from customer or override)
- payment_terms, shipping_method (optional)

**When** saving SO
**Then** SO created with auto-generated number
**And** status = 'draft'

**Prerequisites:** Epic 1 (Customers table)

**Technical Notes:**
- FR: SH-FR-01
- sales_orders table
- API: GET/POST/PUT/DELETE /api/shipping/sales-orders

---

## Story 7.2: SO Status Tracking

As a **Sales user**,
I want to track SO through fulfillment,
So that progress is visible.

**Acceptance Criteria:**

**Given** SO exists
**Then** has status:
- draft: being created
- confirmed: ready to pick
- picking: pick in progress
- picked: ready to pack
- packed: ready to ship
- shipped: sent to customer
- delivered: confirmed delivery
- cancelled: order cancelled

**When** status changes
**Then** timestamp recorded
**And** audit trail entry

**Prerequisites:** Story 7.1

**Technical Notes:**
- FR: SH-FR-02
- Status workflow in sales_orders table

---

## Story 7.3: SO Line Management

As a **Sales user**,
I want to add products to sales orders,
So that I specify what to ship.

**Acceptance Criteria:**

**Given** SO is created
**When** adding a line
**Then** modal opens with:
- product_id (required)
- quantity (required)
- unit_price (editable)
- discount_percent (optional)

**When** saving line
**Then** line_total calculated
**And** SO totals updated

**And** line has status (same as SO)

**Prerequisites:** Story 7.1

**Technical Notes:**
- FR: SH-FR-03
- so_lines table
- API: POST/PUT/DELETE /api/shipping/sales-orders/:id/lines

---

## Story 7.4: Calculate Available Inventory for SO

As a **Sales user**,
I want to see available inventory when creating SO,
So that I know if we can fulfill.

**Acceptance Criteria:**

**Given** adding SO line
**When** selecting product
**Then** shows:
- Total inventory: sum of all LP qty
- Available: not reserved, qa_status = passed
- Reserved: allocated to other SOs/WOs

**And** warning if ordered > available

**Prerequisites:** Story 7.3, Epic 5

**Technical Notes:**
- FR: SH-FR-04
- Query: SUM(qty) WHERE product_id = X AND status = 'available' AND qa_status = 'passed'

---

## Story 7.5: Create Shipment from SO

As a **Warehouse user**,
I want to create shipments from SOs,
So that I can group orders for shipping.

**Acceptance Criteria:**

**Given** one or more SOs with status confirmed
**When** clicking "Create Shipment"
**Then** modal shows:
- Select SOs to include
- Carrier (dropdown)
- Tracking number (optional)
- Planned ship date

**When** saving
**Then** shipment created
**And** SOs linked to shipment

**Prerequisites:** Story 7.1

**Technical Notes:**
- FR: SH-FR-05
- shipments table
- API: POST /api/shipping/shipments

---

## Story 7.6: Consolidate Multiple SOs into Shipment

As a **Warehouse user**,
I want to consolidate multiple SOs into one shipment,
So that I can ship efficiently.

**Acceptance Criteria:**

**Given** creating shipment
**When** selecting multiple SOs
**Then** all orders combined into one shipment

**And** shipment shows:
- Total items from all SOs
- Combined pick list

**Prerequisites:** Story 7.5

**Technical Notes:**
- FR: SH-FR-06
- Many-to-many: shipment_orders table

---

## Story 7.7: Shipment Status Tracking

As a **Warehouse user**,
I want to track shipment status,
So that I monitor progress.

**Acceptance Criteria:**

**Given** shipment exists
**Then** has status:
- pending: not started
- picking: pick in progress
- packed: ready to ship
- shipped: sent out
- in_transit: carrier tracking
- delivered: confirmed

**When** status changes
**Then** timestamps updated

**Prerequisites:** Story 7.5

**Technical Notes:**
- FR: SH-FR-07
- Status workflow in shipments table

---

## Story 7.8: Record Carrier and Tracking

As a **Warehouse user**,
I want to record carrier and tracking info,
So that shipments can be traced.

**Acceptance Criteria:**

**Given** shipment is ready to ship
**When** marking as shipped
**Then** modal asks for:
- carrier (dropdown: FedEx, UPS, DHL, USPS, Other)
- tracking_number (required)
- actual_ship_date (default: today)

**When** saving
**Then** info recorded
**And** customer can view tracking

**Prerequisites:** Story 7.5

**Technical Notes:**
- FR: SH-FR-08
- Fields in shipments table

---

## Story 7.9: Generate Pick Lists

As a **Warehouse user**,
I want to generate pick lists from SOs/shipments,
So that pickers know what to collect.

**Acceptance Criteria:**

**Given** SO or shipment with status confirmed
**When** clicking "Generate Pick List"
**Then** pick list created showing:
- Product, qty, location
- Suggested LPs (by FIFO/FEFO)
- Picker assignment (optional)

**And** can print or view on scanner

**Prerequisites:** Story 7.5

**Technical Notes:**
- FR: SH-FR-09
- pick_lists table
- API: POST /api/shipping/pick-lists

---

## Story 7.10: LP Picking Strategy (FIFO/FEFO)

As a **System**,
I want to suggest LPs based on picking strategy,
So that oldest inventory ships first.

**Acceptance Criteria:**

**Given** generating pick list
**When** picking strategy = FIFO
**Then** LPs sorted by created_at ASC

**When** picking strategy = FEFO
**Then** LPs sorted by expiry_date ASC

**And** only passed LPs suggested
**And** sufficient qty for order

**Prerequisites:** Story 7.9

**Technical Notes:**
- FR: SH-FR-10
- Configurable in shipping_settings.picking_strategy

---

## Story 7.11: Picker Assignment

As a **Warehouse Manager**,
I want to assign pickers to pick lists,
So that work is distributed.

**Acceptance Criteria:**

**Given** pick list is created
**When** assigning picker
**Then** can select user from Warehouse role

**And** picker sees their assigned picks in:
- Dashboard: My Picks
- Scanner: My Tasks

**When** pick is completed
**Then** assignment cleared

**Prerequisites:** Story 7.9

**Technical Notes:**
- FR: SH-FR-11
- assigned_to field in pick_lists

---

## Story 7.12: Handle Pick Shorts

As a **Picker**,
I want to handle short picks,
So that incomplete orders are flagged.

**Acceptance Criteria:**

**Given** picking LP
**When** LP qty < required
**Then** can mark as "short"

**And** enter:
- actual_picked_qty
- short_reason (Out of Stock, Damaged, Wrong Product, Other)
- notes

**When** saving short
**Then** SO line updated with picked qty
**And** short recorded for follow-up

**Prerequisites:** Story 7.9

**Technical Notes:**
- FR: SH-FR-12
- pick_shorts table

---

## Story 7.13: Update SO Picked Quantity

As a **System**,
I want to update SO with picked qty,
So that fulfillment progress is tracked.

**Acceptance Criteria:**

**Given** picker confirms pick
**When** LP is picked
**Then** so_line.picked_qty updated

**When** picked_qty = ordered_qty
**Then** so_line.status → picked

**When** all lines picked
**Then** SO.status → picked

**Prerequisites:** Story 7.9

**Technical Notes:**
- FR: SH-FR-13
- Automatic update on pick confirmation

---

## Story 7.14: Only Allow Picking QA Passed LPs

As a **System**,
I want to restrict picking to passed LPs,
So that only approved inventory ships.

**Acceptance Criteria:**

**Given** generating pick suggestions
**Then** only LPs with qa_status = 'passed'

**When** scanner picks LP
**Then** validates qa_status
**And** blocks if not passed

**Prerequisites:** Story 7.9, Epic 6

**Technical Notes:**
- FR: SH-FR-14
- Validation in pick workflow

---

## Story 7.15: Create Packages for Shipment

As a **Warehouse user**,
I want to create packages for shipments,
So that I track boxes/pallets.

**Acceptance Criteria:**

**Given** shipment is being packed
**When** clicking "Add Package"
**Then** modal opens with:
- package_type (Box, Pallet, Envelope)
- weight_kg (optional)
- dimensions (L × W × H, optional)

**When** saving
**Then** package created
**And** linked to shipment

**Prerequisites:** Story 7.5

**Technical Notes:**
- FR: SH-FR-15
- packages table
- API: POST /api/shipping/packages

---

## Story 7.16: Track Items in Each Package

As a **Warehouse user**,
I want to track which items are in each package,
So that contents are documented.

**Acceptance Criteria:**

**Given** package exists
**When** packing items
**Then** can add package items:
- so_line_id (which product)
- quantity
- lp_id (which LP)

**And** package shows:
- Total items
- Total weight (if LP weight tracked)

**Prerequisites:** Story 7.15

**Technical Notes:**
- FR: SH-FR-16
- package_items table

---

## Story 7.17: Record Package Weight

As a **Warehouse user**,
I want to record package weight,
So that shipping costs can be calculated.

**Acceptance Criteria:**

**Given** packing package
**When** weighing package
**Then** can enter actual_weight_kg

**And** weight shown on packing slip
**And** used for carrier integration

**Prerequisites:** Story 7.15

**Technical Notes:**
- FR: SH-FR-17
- actual_weight_kg field in packages

---

## Story 7.18: Generate Pick Lists

As a **Warehouse user**,
I want to print pick lists,
So that pickers can work.

**Acceptance Criteria:**

**Given** pick list is generated
**When** clicking "Print"
**Then** PDF generated with:
- Pick list number
- Date
- Picker assignment
- Items table: Product, Qty, Location, LP
- Checkboxes for manual picking

**And** downloads immediately

**Prerequisites:** Story 7.9

**Technical Notes:**
- FR: SH-FR-18
- PDF generation with jspdf

---

## Story 7.19: Generate Packing Slips

As a **Warehouse user**,
I want to print packing slips,
So that shipments have documentation.

**Acceptance Criteria:**

**Given** shipment is packed
**When** clicking "Print Packing Slip"
**Then** PDF generated with:
- Customer info
- SO numbers
- Items table: Product, Qty, Serial/Batch
- Package count and weight
- Company logo and signature

**Prerequisites:** Story 7.5

**Technical Notes:**
- FR: SH-FR-19
- PDF template

---

## Story 7.20: Generate Shipping Labels

As a **Warehouse user**,
I want to print shipping labels,
So that carriers can deliver.

**Acceptance Criteria:**

**Given** shipment has carrier and tracking
**When** clicking "Print Label"
**Then** shipping label PDF with:
- From address (warehouse)
- To address (customer)
- Tracking barcode
- Carrier logo
- Package number (if multiple)

**Prerequisites:** Story 7.8

**Technical Notes:**
- FR: SH-FR-20
- Label template (4×6 inch)

---

## Story 7.21: Print Label Support

As a **Warehouse user**,
I want labels to print directly to label printer,
So that workflow is efficient.

**Acceptance Criteria:**

**Given** label printer configured in Settings
**When** printing label
**Then** sends ZPL to printer directly

**And** supports:
- Network printers
- USB printers
- Browser print dialog (fallback)

**Prerequisites:** Story 7.20

**Technical Notes:**
- FR: SH-FR-21
- ZPL format for Zebra printers

---

## Story 7.22: Scanner Picking Workflow

As a **Picker**,
I want to pick via scanner,
So that I work efficiently.

**Acceptance Criteria:**

**Workflow:**
1. Scanner shows: My Pick Lists
2. Select pick list
3. System shows first item with location
4. Scan location (validation)
5. Scan LP (validation)
6. Enter qty picked (or confirm full LP)
7. System confirms pick
8. Next item or complete

**And** can mark shorts at step 6

**Prerequisites:** Story 7.9

**Technical Notes:**
- FR: SH-FR-22
- Touch-optimized UI

---

## Story 7.23: Scanner Packing Workflow

As a **Packer**,
I want to pack via scanner,
So that I work efficiently.

**Acceptance Criteria:**

**Workflow:**
1. Scan shipment barcode or SO
2. System shows items to pack
3. Create package
4. Scan item LP (validation)
5. Enter qty (or confirm)
6. Add to package
7. Repeat until done
8. Enter package weight
9. Print packing slip & label

**Prerequisites:** Story 7.15

**Technical Notes:**
- FR: SH-FR-23
- Guided packing workflow

---

## Story 7.24: Scanner Item Validation

As a **System**,
I want to validate scanned items during pack,
So that wrong items don't ship.

**Acceptance Criteria:**

**Given** packing shipment
**When** scanning LP
**Then** validates:
- LP belongs to pick list
- Product matches expected
- QA status = passed

**When** validation fails
**Then** shows error and blocks

**Prerequisites:** Story 7.23

**Technical Notes:**
- FR: SH-FR-24
- Real-time validation

---

## Story 7.25: Open Orders Report

As a **Sales Manager**,
I want to see open orders report,
So that I track backlog.

**Acceptance Criteria:**

**Given** the user navigates to /shipping/reports
**When** selecting "Open Orders"
**Then** shows all SOs with status != shipped, delivered

**And** table shows:
- SO number
- Customer
- Order date
- Requested ship date
- Status
- Days open
- Total value

**And** can filter by customer, date, status
**And** export to Excel

**Prerequisites:** Story 7.1

**Technical Notes:**
- FR: SH-FR-25
- API: GET /api/shipping/reports/open-orders

---

## Story 7.26: Shipping Performance Report

As a **Warehouse Manager**,
I want to see shipping performance,
So that I monitor efficiency.

**Acceptance Criteria:**

**Given** viewing reports
**When** selecting "Shipping Performance"
**Then** shows KPIs:
- Orders shipped (by date range)
- Avg time to ship (order → ship)
- On-time delivery %
- Pick accuracy % (picked / ordered)
- Short rate %

**And** charts:
- Shipments per day
- Top customers by volume

**Prerequisites:** Story 7.7

**Technical Notes:**
- FR: SH-FR-26
- API: GET /api/shipping/reports/performance

---

## Story 7.27: Shipping Settings Configuration

As an **Admin**,
I want to configure Shipping module settings,
So that operations match our process.

**Acceptance Criteria:**

**Given** Admin navigates to /settings/shipping
**Then** can configure:
- picking_strategy (FIFO, FEFO, Manual)
- require_qa_passed_for_shipping (toggle)
- auto_generate_pick_list (toggle)
- default_carrier (dropdown)
- label_printer_ip (text)

**Prerequisites:** Epic 1

**Technical Notes:**
- shipping_settings table
- API: GET/PUT /api/shipping/settings

---

## Story 7.28: Shipping Dashboard

As a **Warehouse Manager**,
I want to see shipping dashboard,
So that I monitor daily operations.

**Acceptance Criteria:**

**Given** the user navigates to /shipping/dashboard
**Then** sees KPI cards:
- Orders to Pick: count SO with status = confirmed
- Orders to Pack: count SO with status = picked
- Orders to Ship: count SO with status = packed
- Shipped Today: count

**And** Active Pick Lists table
**And** Pending Shipments table
**And** auto-refresh (30s)

**Prerequisites:** Story 7.1

**Technical Notes:**
- Real-time dashboard
- API: GET /api/shipping/dashboard

---

## FR Coverage Matrix

This section maps all Functional Requirements from the Shipping Module (PRD) to their implementing stories, ensuring 100% traceability.

| FR ID | FR Title | Story IDs | Status | Notes |
|-------|----------|-----------|--------|-------|
| SH-FR-01 | Create Sales Orders | 7.1, 7.3 | ✅ Covered | SO header + line items |
| SH-FR-02 | Track SO Status | 7.2 | ✅ Covered | Draft, Confirmed, Picking, Packed, Shipped, Delivered |
| SH-FR-03 | SO Line-Level Status | 7.3 | ✅ Covered | Track status per line item |
| SH-FR-04 | Calculate Available Inventory | 7.4 | ✅ Covered | Real-time stock availability check |
| SH-FR-05 | Create Shipments | 7.5 | ✅ Covered | Create shipment from SO |
| SH-FR-06 | Consolidate SOs | 7.6 | ✅ Covered | Combine multiple SOs into single shipment |
| SH-FR-07 | Track Shipment Status | 7.7 | ✅ Covered | Created, Picking, Packed, Dispatched, Delivered |
| SH-FR-08 | Record Carrier & Tracking | 7.8 | ✅ Covered | Carrier, tracking number, dispatch date |
| SH-FR-09 | Generate Pick Lists | 7.9, 7.18 | ✅ Covered | Desktop + Scanner pick list generation |
| SH-FR-10 | LP Picking Strategy | 7.10 | ✅ Covered | FIFO, FEFO, LIFO, Manual |
| SH-FR-11 | Picker Assignment | 7.11 | ✅ Covered | Assign pickers to pick lists |
| SH-FR-12 | Handle Pick Shorts | 7.12 | ✅ Covered | Partial pick, backorder, substitute |
| SH-FR-13 | Update SO Picked Qty | 7.13 | ✅ Covered | Update SO with picked quantities |
| SH-FR-14 | Only Pick QA Passed LPs | 7.14 | ✅ Covered | Block picking of non-Passed LPs (integration with QA module) |
| SH-FR-15 | Create Packages | 7.15 | ✅ Covered | Create shipping packages |
| SH-FR-16 | Track Package Items | 7.16 | ✅ Covered | Track items in each package |
| SH-FR-17 | Record Package Weight | 7.17 | ✅ Covered | Weight, dimensions for shipping |
| SH-FR-18 | Generate Packing Slips | 7.19 | ✅ Covered | PDF packing slip generation |
| SH-FR-19 | Generate Shipping Labels | 7.20 | ✅ Covered | PDF/ZPL shipping label generation |
| SH-FR-20 | Print Label Support | 7.21 | ✅ Covered | Print to thermal/desktop printers |
| SH-FR-21 | Scanner Picking Workflow | 7.22 | ✅ Covered | Mobile picking with barcode scanning |
| SH-FR-22 | Scanner Packing Workflow | 7.23 | ✅ Covered | Mobile packing with barcode scanning |
| SH-FR-23 | Scanner Item Validation | 7.24 | ✅ Covered | Validate scanned items vs pick list |
| SH-FR-24 | Open Orders Report | 7.25 | ✅ Covered | Report of open SOs |
| SH-FR-25 | Shipping Performance Report | 7.26 | ✅ Covered | On-time delivery, pick accuracy |

**Coverage Summary:**
- **Total FRs:** 25 (all P0)
- **P0 FRs Covered:** 25/25 (100%)
- **Total Stories:** 28 (includes technical/UX stories: 7.27, 7.28)

**Validation:**
- ✅ All P0 functional requirements have at least one implementing story
- ✅ No orphaned stories (all stories trace back to FRs or technical requirements)
- ✅ SH-FR-01 split into 2 stories (SO header vs line items)
- ✅ SH-FR-09 has desktop (7.9) and scanner (7.18) implementations
- ✅ Story 7.14 critical integration with Quality module (QA status blocking)

**Reverse Traceability (Story → FR):**
- Story 7.1 → SH-FR-01
- Story 7.2 → SH-FR-02
- Story 7.3 → SH-FR-01, SH-FR-03
- Story 7.4 → SH-FR-04
- Story 7.5 → SH-FR-05
- Story 7.6 → SH-FR-06
- Story 7.7 → SH-FR-07
- Story 7.8 → SH-FR-08
- Story 7.9 → SH-FR-09
- Story 7.10 → SH-FR-10
- Story 7.11 → SH-FR-11
- Story 7.12 → SH-FR-12
- Story 7.13 → SH-FR-13
- Story 7.14 → SH-FR-14 (Integration with Quality module)
- Story 7.15 → SH-FR-15
- Story 7.16 → SH-FR-16
- Story 7.17 → SH-FR-17
- Story 7.18 → SH-FR-09 (Scanner variant)
- Story 7.19 → SH-FR-18
- Story 7.20 → SH-FR-19
- Story 7.21 → SH-FR-20
- Story 7.22 → SH-FR-21
- Story 7.23 → SH-FR-22
- Story 7.24 → SH-FR-23
- Story 7.25 → SH-FR-24
- Story 7.26 → SH-FR-25
- Story 7.27 → Technical (Shipping Settings Configuration)
- Story 7.28 → UX Design (Shipping Dashboard)

---
