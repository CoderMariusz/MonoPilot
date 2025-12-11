# Warehouse Module - PRD Specification

**Status:** PLANNED
**Priority:** P0 - Core Module
**Epic:** 5 - Warehouse & Scanner Operations
**Implementation:** Batch 05A-05E (TBD)

---

## Overview

Warehouse module manages physical inventory via License Plates (LP) - atomic tracking units for full traceability. Supports goods receipt (ASN/GRN), stock movements, FIFO/FEFO, catch weight, GS1 barcodes, and scanner workflows.

**Key Concepts:**
- **License Plate (LP):** Atomic inventory unit - no loose qty tracking
- **ASN:** Advanced Shipping Notice - pre-notification from supplier
- **GRN:** Goods Receipt Note - creates LPs on receipt
- **GS1:** GTIN-14 product codes, SSCC-18 pallet codes
- **FIFO/FEFO:** First-In-First-Out / First-Expired-First-Out
- **Catch Weight:** Variable weight per unit (e.g., meat, cheese)

## Dependencies

- **Settings:** Warehouses, Locations, Machines
- **Technical:** Products (for LP reference)
- **Planning:** PO, TO, WO (receipt sources)
- **Production:** Material consumption, output registration

## UI Structure

```
/warehouse
├── /dashboard          → Inventory KPIs, alerts, aging
├── /license-plates     → LP list, detail, split/merge
├── /receiving          → ASN/GRN workflows
├── /movements          → Stock transfers, adjustments
├── /pallets            → Pallet management (if enabled)
├── /inventory          → Inventory browser, cycle counts
└── /scanner            → Mobile workflows
```

---

## Functional Requirements

### Core Features (MVP - Phase 1)

#### WH-FR-001: LP Creation

| Attribute | Value |
|-----------|-------|
| Priority | P0 |
| Description | Create LP on GRN with auto/manual numbering |

**Acceptance Criteria:**
- GIVEN auto_generate_lp_number is enabled in warehouse_settings, WHEN a GRN is completed, THEN system generates LP number using format "{lp_number_prefix}{zero-padded sequence}" with sequence length from settings
- GIVEN auto_generate_lp_number is disabled, WHEN user creates LP, THEN system requires manual LP number input and validates uniqueness within org_id
- GIVEN a valid GRN with product_id, quantity, and location_id, WHEN LP is created, THEN LP record is created in <200ms with status='available' and qa_status from default_qa_status setting
- GIVEN LP creation request, WHEN lp_number already exists for org_id, THEN system returns 409 Conflict error with message "LP number already exists"
- GIVEN LP creation, WHEN successful, THEN created_at timestamp and created_by user_id are automatically populated

#### WH-FR-002: LP Tracking

| Attribute | Value |
|-----------|-------|
| Priority | P0 |
| Description | Track qty, location, status, QA status, batch, expiry |

**Acceptance Criteria:**
- GIVEN an existing LP, WHEN user queries LP detail, THEN system returns all tracked fields (qty, uom, location_id, warehouse_id, status, qa_status, batch_number, expiry_date) in <100ms
- GIVEN LP list query with filters (warehouse, location, product, status, qa_status), WHEN executed, THEN results return in <500ms with pagination support (default 50 per page)
- GIVEN LP with status='consumed', WHEN user attempts to view, THEN LP is displayed with consumed_by_wo_id reference and consumption timestamp
- GIVEN LP tracking, WHEN any LP field changes, THEN audit trail records previous value, new value, changed_by, and changed_at timestamp
- GIVEN LP search by lp_number, WHEN partial match entered, THEN system returns matching LPs using prefix search in <300ms

#### WH-FR-003: GRN from PO

| Attribute | Value |
|-----------|-------|
| Priority | P0 |
| Description | Receive goods from PO, create GRN + LPs |

**Acceptance Criteria:**
- GIVEN a PO with status='approved' or 'partial', WHEN user initiates receive, THEN system displays PO lines with ordered_qty and previously received_qty
- GIVEN PO line selection, WHEN user enters received_qty and required fields (batch if required, expiry if required), THEN system validates all required fields before allowing completion
- GIVEN valid GRN completion, WHEN saved, THEN system creates GRN record, LP record per line, updates po_lines.received_qty, and returns success in <500ms
- GIVEN received_qty causes total received > ordered_qty, WHEN allow_over_receipt is false, THEN system blocks receipt with error "Over-receipt not allowed"
- GIVEN received_qty causes total received > ordered_qty, WHEN allow_over_receipt is true and over_receipt_tolerance_pct is set, THEN system allows if (received_total / ordered_qty - 1) * 100 <= tolerance_pct, else blocks
- GIVEN GRN completion, WHEN all PO lines fully received, THEN PO status updates to 'received'
- GIVEN GRN completion, WHEN some PO lines partially received, THEN PO status updates to 'partial'

#### WH-FR-004: GRN from TO

| Attribute | Value |
|-----------|-------|
| Priority | P0 |
| Description | Receive goods from TO, update TO status |

**Acceptance Criteria:**
- GIVEN a TO with status='shipped' or 'partial', WHEN user initiates receive at destination warehouse, THEN system displays TO lines with shipped_qty and previously received_qty
- GIVEN TO line selection, WHEN user confirms receipt, THEN system creates GRN record, LP record, updates to_lines.received_qty
- GIVEN TO receipt, WHEN transit LP exists (enable_transit_location=true), THEN system moves LP from transit location to destination location and updates LP.location_id
- GIVEN TO receipt completion, WHEN all TO lines fully received, THEN TO status updates to 'received'
- GIVEN TO receipt, WHEN received_qty differs from shipped_qty, THEN system logs variance and allows receipt with variance reason

#### WH-FR-005: Stock Moves

| Attribute | Value |
|-----------|-------|
| Priority | P0 |
| Description | Move LP between locations, full/partial qty |

**Acceptance Criteria:**
- GIVEN LP with status='available', WHEN user initiates move with destination location, THEN system validates destination is active and creates stock_move record
- GIVEN full LP move (move_qty = LP.qty), WHEN completed, THEN LP.location_id updates to destination, stock_move.status='completed', operation completes in <300ms
- GIVEN partial LP move (move_qty < LP.qty), WHEN completed, THEN system triggers LP split creating new LP at destination with move_qty, original LP qty reduced by move_qty
- GIVEN move request with move_qty > LP.qty, WHEN validated, THEN system returns 400 error "Move quantity exceeds available quantity"
- GIVEN LP with status != 'available' (reserved, consumed, blocked), WHEN move attempted, THEN system returns 400 error "LP not available for movement"
- GIVEN destination location with enable_location_capacity=true, WHEN location at capacity, THEN system returns warning or error based on settings

#### WH-FR-006: LP Split

| Attribute | Value |
|-----------|-------|
| Priority | P0 |
| Description | Split LP into multiple with genealogy |

**Acceptance Criteria:**
- GIVEN LP with qty > split_qty, WHEN split executed, THEN system creates new LP with split_qty, reduces source LP qty by split_qty, completes in <300ms
- GIVEN split operation, WHEN completed, THEN lp_genealogy record created with operation_type='split', parent_lp_id=source, child_lp_id=new LP, quantity=split_qty
- GIVEN split request with split_qty >= source LP.qty, WHEN validated, THEN system returns 400 error "Split quantity must be less than LP quantity"
- GIVEN split operation, WHEN new LP created, THEN new LP inherits product_id, uom, batch_number, expiry_date, qa_status from source LP
- GIVEN split with different destination location, WHEN completed, THEN new LP.location_id set to destination, source LP.location_id unchanged
- GIVEN split operation, WHEN auto_generate_lp_number enabled, THEN new LP receives auto-generated number following sequence

#### WH-FR-007: LP Merge

| Attribute | Value |
|-----------|-------|
| Priority | P1 |
| Description | Merge LPs (same product/batch/expiry) |

**Acceptance Criteria:**
- GIVEN 2+ LPs with same product_id, uom, batch_number (or all null), and expiry_date (or within 1 day tolerance), WHEN merge executed, THEN primary LP qty increases by sum of other LPs qty
- GIVEN merge operation, WHEN completed, THEN merged LPs (non-primary) status changes to 'consumed', lp_genealogy records created for each with operation_type='merge'
- GIVEN merge request with LPs having different product_id, WHEN validated, THEN system returns 400 error "Cannot merge LPs with different products"
- GIVEN merge request with LPs having different batch_number (not both null), WHEN validated, THEN system returns 400 error "Cannot merge LPs with different batch numbers"
- GIVEN merge request with LPs having qa_status differences, WHEN validated, THEN system returns 400 error "Cannot merge LPs with different QA status"
- GIVEN merge operation, WHEN primary LP at different location than others, THEN other LPs must be at same location as primary (no cross-location merge)

#### WH-FR-008: QA Status Management

| Attribute | Value |
|-----------|-------|
| Priority | P0 |
| Description | Track pending/passed/failed/quarantine |

**Acceptance Criteria:**
- GIVEN LP creation, WHEN require_qa_on_receipt is true, THEN LP.qa_status set to default_qa_status (typically 'pending')
- GIVEN LP with qa_status='pending', WHEN QA passes inspection, THEN qa_status updates to 'passed', LP becomes available for consumption
- GIVEN LP with qa_status='pending' or 'passed', WHEN QA fails inspection, THEN qa_status updates to 'failed', LP.status updates to 'blocked'
- GIVEN LP with qa_status='failed', WHEN quarantine action taken, THEN qa_status updates to 'quarantine', stock_move created to quarantine location
- GIVEN LP with qa_status='quarantine', WHEN released, THEN qa_status updates to 'passed', LP.status updates to 'available'
- GIVEN LP with qa_status != 'passed', WHEN consumption attempted, THEN system returns 400 error "LP not QA approved for consumption"

#### WH-FR-009: Batch Tracking

| Attribute | Value |
|-----------|-------|
| Priority | P0 |
| Description | Track internal + supplier batch numbers |

**Acceptance Criteria:**
- GIVEN enable_batch_tracking is true, WHEN LP created, THEN batch_number field available for entry
- GIVEN require_batch_on_receipt is true, WHEN GRN item submitted without batch_number, THEN system returns 400 error "Batch number required"
- GIVEN enable_supplier_batch is true, WHEN LP created, THEN supplier_batch_number field available (separate from internal batch)
- GIVEN LP search by batch_number, WHEN query executed, THEN all LPs with matching batch_number returned in <300ms
- GIVEN batch_number entry, WHEN format validation enabled, THEN system validates against org batch format pattern

#### WH-FR-010: Expiry Tracking

| Attribute | Value |
|-----------|-------|
| Priority | P0 |
| Description | Track manufacture/expiry dates |

**Acceptance Criteria:**
- GIVEN enable_expiry_tracking is true, WHEN LP created, THEN expiry_date and manufacture_date fields available
- GIVEN require_expiry_on_receipt is true, WHEN GRN item submitted without expiry_date, THEN system returns 400 error "Expiry date required"
- GIVEN LP with expiry_date < current_date, WHEN consumption attempted, THEN system returns 400 error "LP is expired" and blocks consumption
- GIVEN LP with expiry_date approaching (within expiry_warning_days), WHEN displayed in UI, THEN LP shows yellow warning indicator
- GIVEN LP with expiry_date passed, WHEN displayed in UI, THEN LP shows red expired indicator and status consideration for blocking

#### WH-FR-011: Scanner Receive

| Attribute | Value |
|-----------|-------|
| Priority | P0 |
| Description | Mobile receive workflow (scan PO/TO) |

**Acceptance Criteria:**
- GIVEN scanner user authenticated, WHEN accessing receive workflow, THEN system displays list of pending POs/TOs for user's assigned warehouse
- GIVEN PO/TO barcode scanned, WHEN valid, THEN system displays order lines with pending quantities in <500ms
- GIVEN product barcode scanned (GTIN or internal), WHEN matched to order line, THEN system auto-selects line and prompts for quantity
- GIVEN all required fields entered (qty, batch if required, expiry if required), WHEN submit pressed, THEN GRN + LP created in <500ms with audible success feedback
- GIVEN invalid barcode scanned, WHEN not matched to product or order, THEN system displays error message with audible error feedback
- GIVEN scanner receive completed, WHEN print_label_on_receipt is true, THEN LP label print job queued automatically

#### WH-FR-012: Scanner Move

| Attribute | Value |
|-----------|-------|
| Priority | P0 |
| Description | Mobile move workflow (scan LP + location) |

**Acceptance Criteria:**
- GIVEN scanner user authenticated, WHEN accessing move workflow, THEN LP scan prompt displayed
- GIVEN LP barcode scanned, WHEN LP exists and status='available', THEN system displays LP details (product, qty, current location) in <200ms
- GIVEN LP displayed, WHEN destination location barcode scanned, THEN system validates location active and displays confirmation prompt
- GIVEN move confirmation, WHEN confirmed, THEN stock_move created, LP.location_id updated in <300ms with audible success feedback
- GIVEN LP barcode scanned, WHEN LP not found, THEN system displays "LP not found" error with audible error feedback
- GIVEN LP barcode scanned, WHEN LP.status != 'available', THEN system displays "LP not available (status: {status})" error

#### WH-FR-013: Scanner Putaway

| Attribute | Value |
|-----------|-------|
| Priority | P0 |
| Description | Guided putaway to optimal location |

**Acceptance Criteria:**
- GIVEN scanner putaway mode, WHEN LP scanned, THEN system calculates optimal putaway location based on FIFO/FEFO settings and product zone
- GIVEN optimal location calculated, WHEN displayed, THEN shows location code, aisle, rack position and reason (e.g., "FIFO zone A")
- GIVEN suggested location scanned, WHEN matches suggestion, THEN system confirms with green checkmark and completes putaway in <300ms
- GIVEN different location scanned, WHEN does not match suggestion, THEN system displays yellow warning "Different from suggested location" but allows override
- GIVEN putaway completed, WHEN successful, THEN stock_move record created with move_type='putaway' and audible confirmation
- GIVEN no available locations (all at capacity), WHEN putaway attempted, THEN system displays "No available locations" with alternative suggestions

#### WH-FR-014: Label Print

| Attribute | Value |
|-----------|-------|
| Priority | P1 |
| Description | Print ZPL labels for LP/pallet |

**Acceptance Criteria:**
- GIVEN LP exists, WHEN print label requested, THEN system generates ZPL with LP number barcode, product name, qty, batch, expiry, location, and QR code
- GIVEN print request with label_copies_default setting, WHEN sent to printer, THEN specified number of copies printed
- GIVEN print request, WHEN printer not configured or unreachable, THEN system returns 503 error "Printer unavailable" with retry option
- GIVEN pallet exists, WHEN print pallet label requested, THEN system generates ZPL with SSCC-18 barcode, pallet number, LP count, weight, and pack date
- GIVEN print job queued, WHEN successful, THEN print confirmation returned in <1000ms
- GIVEN ZPL generation, WHEN label size configured (4x6, 4x3), THEN ZPL formatted for configured label dimensions

### Advanced Features (Phase 2)

#### WH-FR-015: ASN Processing

| Attribute | Value |
|-----------|-------|
| Priority | P1 |
| Description | Pre-receive notification, pre-fill GRN |

**Acceptance Criteria:**
- GIVEN enable_asn is true, WHEN ASN created with po_id reference, THEN ASN linked to PO and items auto-populated from PO lines
- GIVEN ASN with expected_date, WHEN date arrives, THEN ASN appears in "Expected Today" dashboard widget
- GIVEN ASN received, WHEN receive initiated, THEN GRN pre-populated with ASN item details (expected_qty, supplier_batch, gtin, expiry)
- GIVEN ASN status='pending', WHEN partial receipt completed, THEN ASN status updates to 'partial'
- GIVEN ASN fully received, WHEN all items received_qty >= expected_qty, THEN ASN status updates to 'received'
- GIVEN ASN creation, WHEN carrier and tracking_number provided, THEN fields stored and displayed in ASN detail view

#### WH-FR-016: Pallet Management

| Attribute | Value |
|-----------|-------|
| Priority | P1 |
| Description | Create pallets, add/remove LPs, SSCC codes |

**Acceptance Criteria:**
- GIVEN enable_pallets is true, WHEN pallet created, THEN pallet_number generated (or SSCC-18 if GS1 enabled) with status='open'
- GIVEN pallet with status='open', WHEN LP added via scan, THEN pallet_items record created linking LP to pallet, LP.pallet_id updated
- GIVEN pallet with LPs, WHEN LP removed, THEN pallet_items record deleted, LP.pallet_id set to null
- GIVEN pallet moved, WHEN move executed, THEN all linked LPs move to same destination location
- GIVEN pallet with status='open', WHEN close action executed, THEN status updates to 'closed', closed_date set, no further LP additions allowed
- GIVEN pallet weight_kg, WHEN calculated, THEN equals sum of all LP catch_weight_kg values (or estimated from qty * product avg weight)

#### WH-FR-017: GS1 GTIN Support

| Attribute | Value |
|-----------|-------|
| Priority | P1 |
| Description | Parse GTIN-14 barcodes on receipt |

**Acceptance Criteria:**
- GIVEN enable_gs1_barcodes is true, WHEN barcode starting with "(01)" scanned, THEN system parses 14-digit GTIN
- GIVEN parsed GTIN, WHEN product lookup executed, THEN product with matching products.gtin returned in <100ms
- GIVEN GTIN not found in products table, WHEN receipt attempted, THEN system displays "Product not found for GTIN: {gtin}" error
- GIVEN combined GS1 barcode with (01)(10)(17), WHEN scanned, THEN system parses GTIN, batch, and expiry date in single scan
- GIVEN expiry date AI (17) with YYMMDD format, WHEN parsed, THEN converted to ISO date format (20YY-MM-DD)

#### WH-FR-018: GS1 SSCC Support

| Attribute | Value |
|-----------|-------|
| Priority | P1 |
| Description | Generate/scan SSCC-18 pallet codes |

**Acceptance Criteria:**
- GIVEN enable_gs1_barcodes is true and pallet created, WHEN SSCC requested, THEN system generates valid 18-digit SSCC with extension digit, company prefix, serial reference, and check digit
- GIVEN SSCC barcode scanned (starting with "(00)"), WHEN parsed, THEN system looks up pallet by sscc field in <100ms
- GIVEN pallet label printed, WHEN SSCC enabled, THEN label includes SSCC-18 barcode in Code 128 format
- GIVEN SSCC generation, WHEN company prefix configured in settings, THEN SSCC uses org's GS1 company prefix
- GIVEN SSCC uniqueness, WHEN generated, THEN system ensures SSCC unique across all pallets in organization

#### WH-FR-019: FIFO Enforcement

| Attribute | Value |
|-----------|-------|
| Priority | P1 |
| Description | Suggest oldest LP for picking |

**Acceptance Criteria:**
- GIVEN enable_fifo is true and pick request for product, WHEN suggestion calculated, THEN LP with oldest created_at returned (ORDER BY created_at ASC)
- GIVEN FIFO suggestion provided, WHEN user selects different (newer) LP, THEN system displays warning "FIFO violation: selected LP is newer than suggested"
- GIVEN FIFO warning displayed, WHEN user confirms override, THEN pick proceeds with audit log entry noting FIFO override
- GIVEN multiple LPs at same location, WHEN displayed in pick list, THEN ordered by created_at ASC with oldest highlighted
- GIVEN FIFO enforcement, WHEN LP picked out of order, THEN system logs fifo_violation_count metric for reporting

#### WH-FR-020: FEFO Enforcement

| Attribute | Value |
|-----------|-------|
| Priority | P1 |
| Description | Suggest soonest expiry LP for picking |

**Acceptance Criteria:**
- GIVEN enable_fefo is true and pick request for product with expiry dates, WHEN suggestion calculated, THEN LP with soonest expiry_date returned (ORDER BY expiry_date ASC, created_at ASC)
- GIVEN enable_fefo and enable_fifo both true, WHEN pick suggested, THEN FEFO takes precedence (expiry_date ASC primary sort)
- GIVEN FEFO suggestion provided, WHEN user selects LP with later expiry, THEN system displays warning "FEFO violation: selected LP expires later than suggested"
- GIVEN LP with expiry_date < current_date (expired), WHEN pick suggested, THEN expired LP excluded from suggestions (qa_status consideration)
- GIVEN FEFO enforcement, WHEN multiple LPs have same expiry_date, THEN secondary sort by created_at ASC (oldest first)

#### WH-FR-021: Catch Weight Support

| Attribute | Value |
|-----------|-------|
| Priority | P1 |
| Description | Support variable weight products |

**Acceptance Criteria:**
- GIVEN product.is_catch_weight is true, WHEN LP created, THEN system prompts for catch_weight_kg entry
- GIVEN catch weight entry, WHEN weight outside target_weight_kg +/- weight_tolerance_pct, THEN system displays warning "Weight outside tolerance range"
- GIVEN LP with catch_weight_kg, WHEN displayed, THEN shows both qty (units) and catch_weight_kg
- GIVEN catch weight consumption, WHEN BOM requires weight-based qty, THEN system calculates pieces needed based on LP's catch_weight_kg / qty ratio
- GIVEN catch weight product receipt, WHEN qty entered without weight, THEN system returns 400 error "Catch weight required for this product"

#### WH-FR-022: Shelf Life Calculation

| Attribute | Value |
|-----------|-------|
| Priority | P2 |
| Description | Calculate expiry from manufacture date |

**Acceptance Criteria:**
- GIVEN product.shelf_life_days configured and manufacture_date entered, WHEN expiry_date not provided, THEN system auto-calculates expiry_date = manufacture_date + shelf_life_days
- GIVEN auto-calculated expiry_date, WHEN displayed, THEN shows "(calculated)" indicator next to date
- GIVEN manufacture_date entered, WHEN later than current_date, THEN system displays warning "Manufacture date is in the future"
- GIVEN shelf_life_days not configured for product, WHEN expiry calculation requested, THEN system requires manual expiry_date entry

#### WH-FR-023: Cycle Count

| Attribute | Value |
|-----------|-------|
| Priority | P2 |
| Description | Scheduled/ad-hoc inventory counts |

**Acceptance Criteria:**
- GIVEN cycle count created with count_type='full', WHEN executed, THEN all LPs in selected warehouse included in count
- GIVEN cycle count created with count_type='partial', WHEN zone/location selected, THEN only LPs in selected areas included
- GIVEN count in_progress, WHEN LP scanned and qty entered, THEN system records counted_qty and calculates variance = counted_qty - expected_qty
- GIVEN variance detected (|variance| > 0), WHEN count completed, THEN system flags item for review with variance percentage
- GIVEN count completed and approved, WHEN variances exist, THEN system creates stock_moves with move_type='adjustment' for each variance
- GIVEN count sheet, WHEN LP physically found but not in expected location, THEN system allows adding LP with "unexpected" flag

#### WH-FR-024: Stock Adjustment

| Attribute | Value |
|-----------|-------|
| Priority | P2 |
| Description | Adjust LP qty with reason codes |

**Acceptance Criteria:**
- GIVEN LP exists, WHEN adjustment requested with new_qty and reason_code, THEN LP.qty updated and stock_move created with move_type='adjustment'
- GIVEN adjustment reason_code, WHEN submitted, THEN must be from predefined list (damage, theft, counting_error, quality_issue, expired, other)
- GIVEN adjustment increasing qty, WHEN submitted, THEN requires manager approval if increase > 10% of original
- GIVEN adjustment decreasing qty to 0, WHEN submitted, THEN LP.status updates to 'consumed' (fully adjusted out)
- GIVEN adjustment audit, WHEN completed, THEN records original_qty, new_qty, reason_code, notes, adjusted_by, adjusted_at

#### WH-FR-025: Location Capacity

| Attribute | Value |
|-----------|-------|
| Priority | P2 |
| Description | Track/validate location capacity |

**Acceptance Criteria:**
- GIVEN enable_location_capacity is true and location.max_capacity configured, WHEN LP moved to location, THEN system calculates current_occupancy from sum of LP quantities
- GIVEN current_occupancy + incoming_qty > max_capacity, WHEN move attempted, THEN system returns 400 error "Location capacity exceeded (current: {current}, max: {max})"
- GIVEN location capacity at 90%+, WHEN displayed in UI, THEN shows yellow warning indicator
- GIVEN location capacity at 100%, WHEN displayed in UI, THEN shows red full indicator and blocks new additions
- GIVEN location capacity query, WHEN requested, THEN returns current_occupancy, max_capacity, available_capacity, occupancy_percentage in <200ms

#### WH-FR-026: Zone Management

| Attribute | Value |
|-----------|-------|
| Priority | P2 |
| Description | Organize locations into zones |

**Acceptance Criteria:**
- GIVEN enable_location_zones is true, WHEN zone created, THEN zone record created with zone_code, zone_name, zone_type (receiving, storage, shipping, quarantine)
- GIVEN zone exists, WHEN locations assigned, THEN locations.zone_id updated to reference zone
- GIVEN product with preferred_zone_id, WHEN putaway suggested, THEN system prioritizes locations in product's preferred zone
- GIVEN zone query, WHEN requested, THEN returns all locations in zone with current occupancy summary
- GIVEN zone-based reporting, WHEN inventory report requested by zone, THEN groups LP quantities and values by zone

#### WH-FR-027: LP Reservation

| Attribute | Value |
|-----------|-------|
| Priority | P1 |
| Description | Reserve LP for WO/TO (via Planning) |

**Acceptance Criteria:**
- GIVEN LP with status='available' and qty >= reserved_qty, WHEN reservation created for WO or TO, THEN lp_reservations record created with status='active'
- GIVEN LP with active reservation, WHEN displayed, THEN LP.status updates to 'reserved' and shows reservation reference (WO or TO number)
- GIVEN reserved LP, WHEN another reservation attempted, THEN system returns 400 error "LP already reserved for {wo_number/to_number}"
- GIVEN reservation released (WO cancelled or TO cancelled), WHEN release executed, THEN lp_reservations.status updates to 'released', LP.status returns to 'available'
- GIVEN reservation consumed (WO material consumed), WHEN consumption completed, THEN lp_reservations.status updates to 'consumed'
- GIVEN partial reservation (reserved_qty < LP.qty), WHEN implemented, THEN remaining qty still available for other reservations

#### WH-FR-028: Genealogy Tree View

| Attribute | Value |
|-----------|-------|
| Priority | P1 |
| Description | Visual LP genealogy (split/merge/consume) |

**Acceptance Criteria:**
- GIVEN LP with genealogy history, WHEN genealogy tree requested, THEN system returns hierarchical tree structure of all parent/child relationships
- GIVEN genealogy tree, WHEN rendered, THEN shows visual tree with LP nodes, operation types (split/merge/consume/output), quantities, and dates
- GIVEN LP created from split, WHEN viewing child LP genealogy, THEN parent LP shown with split operation and quantity
- GIVEN LP merged from multiple sources, WHEN viewing result LP genealogy, THEN all source LPs shown as parents with merge operation
- GIVEN LP consumed by WO, WHEN viewing consumed LP genealogy, THEN shows output LPs created from WO as children
- GIVEN genealogy query, WHEN for LP with complex history (10+ operations), THEN returns complete tree in <500ms

#### WH-FR-029: Over-Receipt Control

| Attribute | Value |
|-----------|-------|
| Priority | P1 |
| Description | Allow/block over-receipt with tolerance |

**Acceptance Criteria:**
- GIVEN allow_over_receipt is false, WHEN received_qty would cause total > ordered_qty, THEN system blocks with "Over-receipt not allowed"
- GIVEN allow_over_receipt is true and over_receipt_tolerance_pct = 10, WHEN received_qty causes total <= ordered_qty * 1.10, THEN receipt allowed
- GIVEN allow_over_receipt is true and over_receipt_tolerance_pct = 10, WHEN received_qty causes total > ordered_qty * 1.10, THEN system blocks with "Over-receipt exceeds tolerance (max: {max_qty})"
- GIVEN over-receipt within tolerance, WHEN completed, THEN audit log records over_receipt_flag and over_receipt_percentage
- GIVEN over-receipt attempted, WHEN blocked, THEN user can reduce qty or request manager override

#### WH-FR-030: Expiry Alerts

| Attribute | Value |
|-----------|-------|
| Priority | P2 |
| Description | Alert on approaching expiry |

**Acceptance Criteria:**
- GIVEN expiry_warning_days = 30, WHEN LP.expiry_date <= current_date + 30 days, THEN LP appears in "Expiring Soon" dashboard widget
- GIVEN expiring LP list, WHEN displayed, THEN sorted by expiry_date ASC with days_until_expiry calculated
- GIVEN LP with expiry_date < current_date (expired), WHEN detected, THEN appears in "Expired" alert list with red indicator
- GIVEN daily expiry check job, WHEN executed, THEN generates notification/email to warehouse manager for LPs expiring within warning period
- GIVEN expiry alerts API, WHEN queried, THEN returns list of expiring LPs with product_name, lp_number, qty, expiry_date, days_remaining in <300ms
- GIVEN expiry alert thresholds, WHEN configurable, THEN supports multiple tiers (e.g., 7 days = red, 30 days = yellow)

---

## Non-Functional Requirements

| Category | Requirement | Target | Priority |
|----------|-------------|--------|----------|
| Performance | Page load time | <2 seconds | P0 |
| Performance | API response time | <500ms | P0 |
| Performance | Scanner scan-to-confirm | <1 second | P0 |
| Performance | LP lookup by barcode | <200ms | P0 |
| Performance | FIFO/FEFO pick suggestion | <500ms | P0 |
| Performance | Inventory summary query | <3 seconds (100K LPs) | P1 |
| Performance | GS1 barcode parsing | <100ms | P1 |
| Scalability | Concurrent scanner users per org | 20 | P0 |
| Scalability | Concurrent desktop users per org | 50 | P1 |
| Scalability | LPs per warehouse | 100,000 | P1 |
| Scalability | Stock movements per day | 10,000 | P1 |
| Scalability | Locations per warehouse | 5,000 | P1 |
| Availability | Uptime SLA | 99.5% | P0 |
| Availability | Scanner offline queue | 100 transactions | P1 |
| Security | RLS enforcement | 100% queries | P0 |
| Security | LP modification audit | 100% tracked | P0 |
| Data | Audit log retention | 2 years | P1 |
| Data | Genealogy tree depth | 10 levels | P1 |
| Data | Stock move history retention | 5 years | P1 |
| Reliability | Label print success rate | >99% | P1 |
| Reliability | Scanner session timeout | 5 minutes idle | P1 |
| Usability | Scanner button size | Min 44px touch target | P1 |
| Usability | Barcode scan success rate | >95% first attempt | P0 |

---

## Database Tables

### license_plates
```
- id UUID PK
- org_id UUID FK NOT NULL
- lp_number TEXT UNIQUE NOT NULL
- product_id UUID FK NOT NULL
- quantity NUMERIC(15,4) NOT NULL
- uom TEXT NOT NULL
- location_id UUID FK NOT NULL
- warehouse_id UUID FK NOT NULL
- status TEXT NOT NULL (available, reserved, consumed, blocked)
- qa_status TEXT NOT NULL (pending, passed, failed, quarantine)
- batch_number TEXT
- supplier_batch_number TEXT
- expiry_date DATE
- manufacture_date DATE
- gtin TEXT (GS1 GTIN-14)
- catch_weight_kg NUMERIC(10,3)
- po_number TEXT
- grn_id UUID FK
- wo_id UUID FK
- parent_lp_id UUID FK (for split/merge)
- consumed_by_wo_id UUID FK
- pallet_id UUID FK
- created_at TIMESTAMPTZ
- created_by UUID FK
```

### asns
```
- id UUID PK
- org_id UUID FK NOT NULL
- asn_number TEXT UNIQUE NOT NULL
- po_id UUID FK NOT NULL
- supplier_id UUID FK NOT NULL
- expected_date DATE NOT NULL
- actual_date DATE
- carrier TEXT
- tracking_number TEXT
- status TEXT NOT NULL (pending, received, partial, cancelled)
- notes TEXT
- created_at TIMESTAMPTZ
- created_by UUID FK
```

### asn_items
```
- id UUID PK
- asn_id UUID FK NOT NULL
- product_id UUID FK NOT NULL
- po_line_id UUID FK
- expected_qty NUMERIC NOT NULL
- received_qty NUMERIC DEFAULT 0
- uom TEXT NOT NULL
- supplier_lp_number TEXT
- supplier_batch_number TEXT
- gtin TEXT
- expiry_date DATE
```

### grns
```
- id UUID PK
- org_id UUID FK NOT NULL
- grn_number TEXT UNIQUE NOT NULL
- source_type TEXT NOT NULL (po, to, return)
- po_id UUID FK
- to_id UUID FK
- asn_id UUID FK
- supplier_id UUID FK
- receipt_date TIMESTAMPTZ NOT NULL
- warehouse_id UUID FK NOT NULL
- location_id UUID FK NOT NULL
- status TEXT NOT NULL (draft, completed, cancelled)
- notes TEXT
- created_at TIMESTAMPTZ
- received_by UUID FK
```

### grn_items
```
- id UUID PK
- grn_id UUID FK NOT NULL
- product_id UUID FK NOT NULL
- po_line_id UUID FK
- ordered_qty NUMERIC NOT NULL
- received_qty NUMERIC NOT NULL
- uom TEXT NOT NULL
- lp_id UUID FK
- batch_number TEXT
- supplier_batch_number TEXT
- gtin TEXT
- catch_weight_kg NUMERIC(10,3)
- expiry_date DATE
- manufacture_date DATE
- location_id UUID FK NOT NULL
- qa_status TEXT NOT NULL
- notes TEXT
```

### stock_moves
```
- id UUID PK
- org_id UUID FK NOT NULL
- move_number TEXT UNIQUE NOT NULL
- lp_id UUID FK NOT NULL
- move_type TEXT NOT NULL (transfer, issue, receipt, adjustment, return, quarantine)
- from_location_id UUID FK
- to_location_id UUID FK
- quantity NUMERIC NOT NULL
- move_date TIMESTAMPTZ NOT NULL
- status TEXT NOT NULL (completed, cancelled)
- reason TEXT
- wo_id UUID FK
- moved_by UUID FK
- created_at TIMESTAMPTZ
```

### lp_genealogy
```
- id UUID PK
- org_id UUID FK NOT NULL
- parent_lp_id UUID FK NOT NULL
- child_lp_id UUID FK NOT NULL
- operation_type TEXT NOT NULL (split, merge, consume, output)
- quantity NUMERIC NOT NULL
- operation_date TIMESTAMPTZ NOT NULL
- wo_id UUID FK
- operation_id UUID FK
```

### lp_reservations
```
- id UUID PK
- org_id UUID FK NOT NULL
- lp_id UUID FK NOT NULL
- wo_id UUID FK
- to_id UUID FK
- reserved_qty NUMERIC NOT NULL
- status TEXT NOT NULL (active, released, consumed)
- reserved_at TIMESTAMPTZ NOT NULL
- released_at TIMESTAMPTZ
- reserved_by UUID FK
```

### pallets
```
- id UUID PK
- org_id UUID FK NOT NULL
- pallet_number TEXT UNIQUE NOT NULL (SSCC-18)
- pallet_type TEXT (EUR, Standard, Custom)
- location_id UUID FK NOT NULL
- status TEXT NOT NULL (open, closed, shipped)
- sscc TEXT (GS1 SSCC-18)
- weight_kg NUMERIC(10,2)
- created_date TIMESTAMPTZ NOT NULL
- closed_date TIMESTAMPTZ
- shipped_date TIMESTAMPTZ
- created_by UUID FK
```

### pallet_items
```
- id UUID PK
- pallet_id UUID FK NOT NULL
- lp_id UUID FK NOT NULL
- added_date TIMESTAMPTZ NOT NULL
- sequence INTEGER
```

### cycle_counts
```
- id UUID PK
- org_id UUID FK NOT NULL
- count_number TEXT UNIQUE NOT NULL
- warehouse_id UUID FK NOT NULL
- count_type TEXT NOT NULL (full, partial, cycle)
- status TEXT NOT NULL (planned, in_progress, completed)
- scheduled_date DATE
- completed_date TIMESTAMPTZ
- counted_by UUID FK
- created_at TIMESTAMPTZ
```

### cycle_count_items
```
- id UUID PK
- count_id UUID FK NOT NULL
- lp_id UUID FK NOT NULL
- expected_qty NUMERIC NOT NULL
- counted_qty NUMERIC
- variance NUMERIC
- notes TEXT
```

### warehouse_settings
```
- id UUID PK
- org_id UUID FK NOT NULL UNIQUE
- enable_asn BOOLEAN DEFAULT false
- auto_generate_lp_number BOOLEAN DEFAULT true
- lp_number_prefix TEXT DEFAULT 'LP'
- lp_number_sequence_length INTEGER DEFAULT 8
- enable_pallets BOOLEAN DEFAULT false
- enable_split_merge BOOLEAN DEFAULT true
- require_qa_on_receipt BOOLEAN DEFAULT true
- default_qa_status TEXT DEFAULT 'pending'
- enable_expiry_tracking BOOLEAN DEFAULT true
- require_expiry_on_receipt BOOLEAN DEFAULT false
- enable_batch_tracking BOOLEAN DEFAULT true
- require_batch_on_receipt BOOLEAN DEFAULT false
- enable_supplier_batch BOOLEAN DEFAULT true
- allow_over_receipt BOOLEAN DEFAULT false
- over_receipt_tolerance_pct NUMERIC(5,2) DEFAULT 0
- enable_location_zones BOOLEAN DEFAULT false
- enable_location_capacity BOOLEAN DEFAULT false
- enable_fifo BOOLEAN DEFAULT true
- enable_fefo BOOLEAN DEFAULT false
- enable_gs1_barcodes BOOLEAN DEFAULT false
- enable_catch_weight BOOLEAN DEFAULT false
- enable_transit_location BOOLEAN DEFAULT true
- scanner_idle_timeout_sec INTEGER DEFAULT 300
- scanner_sound_feedback BOOLEAN DEFAULT true
- print_label_on_receipt BOOLEAN DEFAULT true
- label_copies_default INTEGER DEFAULT 1
- expiry_warning_days INTEGER DEFAULT 30
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
```

---

## API Endpoints

### License Plates
- `GET /api/warehouse/license-plates` - List LPs (filter: warehouse, location, product, status, QA, expiry)
- `GET /api/warehouse/license-plates/:id` - Get LP detail
- `POST /api/warehouse/license-plates` - Create LP (usually via GRN)
- `PUT /api/warehouse/license-plates/:id` - Update LP (limited fields)
- `POST /api/warehouse/license-plates/:id/split` - Split LP
- `POST /api/warehouse/license-plates/merge` - Merge LPs
- `PUT /api/warehouse/license-plates/:id/block` - Block LP
- `PUT /api/warehouse/license-plates/:id/unblock` - Unblock LP
- `GET /api/warehouse/license-plates/:id/genealogy` - Get genealogy tree
- `GET /api/warehouse/license-plates/:id/history` - Get movement history
- `POST /api/warehouse/license-plates/:id/print-label` - Print label (ZPL)

### ASN
- `GET /api/warehouse/asns` - List ASNs
- `GET /api/warehouse/asns/:id` - Get ASN detail
- `POST /api/warehouse/asns` - Create ASN
- `PUT /api/warehouse/asns/:id` - Update ASN
- `DELETE /api/warehouse/asns/:id` - Cancel ASN
- `POST /api/warehouse/asns/:id/receive` - Start receiving

### GRN
- `GET /api/warehouse/grns` - List GRNs
- `GET /api/warehouse/grns/:id` - Get GRN detail
- `POST /api/warehouse/grns` - Create GRN + LPs
- `PUT /api/warehouse/grns/:id` - Update GRN (draft)
- `POST /api/warehouse/grns/:id/complete` - Complete GRN
- `POST /api/warehouse/grns/:id/cancel` - Cancel GRN
- `POST /api/warehouse/grns/:id/print` - Print GRN

### Stock Movements
- `GET /api/warehouse/stock-moves` - List movements
- `GET /api/warehouse/stock-moves/:id` - Get move detail
- `POST /api/warehouse/stock-moves` - Create movement
- `POST /api/warehouse/stock-moves/:id/cancel` - Cancel movement

### Pallets
- `GET /api/warehouse/pallets` - List pallets
- `GET /api/warehouse/pallets/:id` - Get pallet detail
- `POST /api/warehouse/pallets` - Create pallet
- `POST /api/warehouse/pallets/:id/add-lp` - Add LP
- `POST /api/warehouse/pallets/:id/remove-lp` - Remove LP
- `POST /api/warehouse/pallets/:id/close` - Close pallet
- `POST /api/warehouse/pallets/:id/move` - Move pallet + LPs
- `POST /api/warehouse/pallets/:id/print-label` - Print pallet label (SSCC)

### Inventory
- `GET /api/warehouse/inventory` - Get inventory summary (by product, location, warehouse)
- `GET /api/warehouse/inventory/aging` - Get aging report (FIFO/FEFO)
- `GET /api/warehouse/inventory/expiring` - Get expiring LPs
- `POST /api/warehouse/inventory/adjust` - Create adjustment

### Cycle Counts
- `GET /api/warehouse/cycle-counts` - List counts
- `GET /api/warehouse/cycle-counts/:id` - Get count detail
- `POST /api/warehouse/cycle-counts` - Create count
- `POST /api/warehouse/cycle-counts/:id/items` - Add items to count
- `PUT /api/warehouse/cycle-counts/:id/items/:itemId` - Update counted qty
- `POST /api/warehouse/cycle-counts/:id/complete` - Complete count

### Scanner
- `POST /api/warehouse/scanner/login` - Scanner login
- `GET /api/warehouse/scanner/pending-receipts` - Get pending POs/TOs/ASNs
- `POST /api/warehouse/scanner/receive` - Quick receive
- `POST /api/warehouse/scanner/move` - Quick move
- `POST /api/warehouse/scanner/split` - Quick split
- `POST /api/warehouse/scanner/merge` - Quick merge
- `POST /api/warehouse/scanner/putaway` - Guided putaway
- `POST /api/warehouse/scanner/pick` - Guided pick (for TO)
- `POST /api/warehouse/scanner/pack` - Add LP to pallet
- `GET /api/warehouse/scanner/lp/:barcode` - Lookup LP
- `GET /api/warehouse/scanner/location/:barcode` - Lookup location
- `POST /api/warehouse/scanner/parse-gs1` - Parse GS1 barcode

### Settings
- `GET /api/warehouse/settings` - Get settings
- `PUT /api/warehouse/settings` - Update settings

---

## Scanner Workflows

### 1. Receive (from PO/TO)

```
Step 1: Select Source
- Scan PO/TO barcode OR select from list
- If ASN enabled: show pending ASNs

Step 2: Select Line
- Show pending lines (product, ordered qty, received qty)
- Select line to receive

Step 3: Scan Product Barcode
- Scan product barcode (GTIN or internal)
- Validate: matches selected line

Step 4: Enter Receipt Details
- Scan/Enter Batch Number (if enabled)
- Scan/Enter Supplier Batch (if enabled)
- Enter Expiry Date (if enabled) OR scan from GS1
- Enter Received Qty (if catch weight: enter weight)
- Select Location (default pre-filled, can override)

Step 5: GS1 Parse (if enabled)
- System parses GTIN (01), batch (10), expiry (17), serial (21)
- Auto-fills fields from barcode

Step 6: Validate
- Check over-receipt (block if not allowed)
- Validate required fields
- Show warnings/errors

Step 7: Confirm & Print
- Create GRN + LP
- Print LP label (ZPL)
- Option: receive more items or done
```

### 2. Move

```
Step 1: Scan LP
- Display: Product, Qty, Current Location, Status
- Validate: LP exists, status = available

Step 2: Scan Destination
- Scan location barcode OR select from list
- Validate: location active, capacity (if enabled)
- FIFO/FEFO warning if moving older stock behind newer

Step 3: Enter Quantity
- Default: Full LP qty
- Can enter partial → triggers Split

Step 4: Confirm Move
- Show summary (LP → Location)
- Create stock_move
- Update LP.location_id
- Sound feedback
```

### 3. Putaway (Guided)

```
Step 1: Scan LP
- Display: Product, Qty, Expiry
- Get putaway suggestion (FIFO/FEFO zone)

Step 2: System Suggests Location
- Suggest optimal location:
  - FIFO: oldest stock first
  - FEFO: soonest expiry first
  - Capacity: has space
  - Zone: product zone
- Show suggested location with reason

Step 3: Scan Suggested Location
- If scanned = suggested: green checkmark
- If scanned ≠ suggested: yellow warning, allow override

Step 4: Confirm Putaway
- Create stock_move
- Update LP.location_id
- Next LP or done
```

### 4. Pick (for TO/WO)

```
Step 1: Scan TO/WO Barcode
- Display: Destination, Required Products
- Show pick list (product, qty needed)

Step 2: System Suggests LP
- FIFO/FEFO: suggest oldest/soonest expiry LP
- Show: LP Number, Location, Qty, Batch, Expiry

Step 3: Navigate to Location
- Show location path
- Scan location barcode to confirm

Step 4: Scan LP
- Validate: matches suggested LP
- If different: warning, allow override

Step 5: Enter Pick Qty
- Default: full LP or required qty (whichever smaller)
- Can enter partial

Step 6: Confirm Pick
- Create stock_move (location → transit/staging)
- Reserve LP for TO/WO
- Next item or done
```

### 5. Split

```
Step 1: Scan LP
- Display: Product, Qty, Location
- Validate: LP available

Step 2: Enter Split Quantity
- Enter qty for new LP
- Validate: < current qty
- Show remaining qty

Step 3: Select Location
- Same as source (default)
- OR scan different location

Step 4: Confirm Split
- Create new LP (auto-number)
- Update source LP qty
- Record genealogy (parent_lp_id)
- Print new LP label
- Sound feedback
```

### 6. Merge

```
Step 1: Scan Primary LP
- Display: Product, Qty, Batch, Expiry
- This LP number will remain

Step 2: Scan Additional LPs
- Scan each LP to merge
- Validate: same product, UoM, batch, expiry
- Show running total
- Option: remove scanned LP

Step 3: Confirm Merge
- Show summary: X LPs → 1 LP
- Total quantity
- Update primary LP qty
- Mark other LPs as consumed
- Record genealogy for all
- Sound feedback
```

### 7. Pack (Pallet)

```
Step 1: Scan/Create Pallet
- Scan existing pallet SSCC barcode
- OR create new pallet (auto-generate SSCC-18)
- Display: Pallet status, LPs count, weight

Step 2: Add LPs
- Scan LP barcode
- Validate: LP available
- Add to pallet
- Show running count/weight
- Continue scanning
- Option: remove LP

Step 3: Complete
- Close pallet (optional, prevents further adds)
- Print pallet label (SSCC, contents, weight)
- Return to menu
```

### 8. Cycle Count

```
Step 1: Select Count
- Show scheduled counts
- OR create ad-hoc count

Step 2: Scan Location
- Display expected LPs at location

Step 3: Scan LPs
- Scan each LP found
- Enter counted qty
- Mark as counted
- Flag variances (red if different)

Step 4: Review Variances
- Show expected vs counted
- Add notes for variances

Step 5: Complete Count
- Submit count
- System creates adjustments for variances
```

---

## GS1 Barcode Support

### GTIN-14 (Product Identification)

**Format:** 14 digits - (01) + GTIN-14

**Example Barcode:**
```
(01)12345678901234
```

**Parsing:**
- AI Code: `01`
- GTIN: `12345678901234`

**Usage:**
- Scan on receipt → system looks up product by GTIN
- Store in `products.gtin` and `grn_items.gtin`

### SSCC-18 (Pallet/Shipping Container)

**Format:** 18 digits - (00) + SSCC-18

**Example Barcode:**
```
(00)123456789012345678
```

**Structure:**
- Extension Digit: 1
- Company Prefix: 1234567
- Serial Reference: 890123456
- Check Digit: 8

**Usage:**
- Generate on pallet creation
- Store in `pallets.sscc`
- Print on pallet labels

### Combined GS1 Barcode (Common on Incoming Goods)

**Example:**
```
(01)12345678901234(10)BATCH123(17)251231(21)SERIAL456
```

**Parsed:**
- `(01)` GTIN: 12345678901234
- `(10)` Batch: BATCH123
- `(17)` Expiry: 2025-12-31
- `(21)` Serial: SERIAL456

**Scanner Auto-Parse:**
1. System detects GS1 format (starts with `(`)
2. Parses each AI code
3. Auto-fills GRN fields:
   - Product lookup by GTIN
   - Batch from (10)
   - Expiry from (17)
   - Supplier LP number from (21)

### GS1 Application Identifiers (AI) Supported

| AI | Description | Length | Example |
|----|-------------|--------|---------|
| 01 | GTIN | 14 | 12345678901234 |
| 00 | SSCC | 18 | 123456789012345678 |
| 10 | Batch/Lot | Variable | BATCH123 |
| 17 | Expiry Date | 6 (YYMMDD) | 251231 |
| 13 | Pack Date | 6 (YYMMDD) | 251201 |
| 15 | Best Before | 6 (YYMMDD) | 260101 |
| 21 | Serial Number | Variable | SERIAL456 |
| 310x | Net Weight (kg) | Variable | 310512345 (123.45kg) |

---

## FIFO / FEFO Logic

### FIFO (First-In, First-Out)

**Concept:** Oldest inventory consumed first

**Implementation:**
1. On pick suggestion: `ORDER BY created_at ASC`
2. Scanner shows oldest LP first
3. Warning if user picks newer LP

**Use Cases:**
- Non-perishable goods
- Standard rotation

### FEFO (First-Expired, First-Out)

**Concept:** Soonest expiry consumed first

**Implementation:**
1. On pick suggestion: `ORDER BY expiry_date ASC`
2. Scanner shows soonest expiry LP first
3. Block pick if expired (qa_status = failed)

**Use Cases:**
- Perishable goods
- Products with shelf life

### Settings Toggle

```sql
-- In warehouse_settings
enable_fifo BOOLEAN DEFAULT true
enable_fefo BOOLEAN DEFAULT false

-- If both enabled: FEFO takes precedence
-- If neither: no enforcement, user selects any LP
```

### Pick Suggestion Query

```sql
-- FEFO (priority)
SELECT * FROM license_plates
WHERE product_id = ? AND status = 'available' AND qa_status = 'passed'
ORDER BY expiry_date ASC, created_at ASC
LIMIT 1

-- FIFO (fallback)
SELECT * FROM license_plates
WHERE product_id = ? AND status = 'available' AND qa_status = 'passed'
ORDER BY created_at ASC
LIMIT 1
```

---

## Catch Weight Support

### Concept

Products with variable weight per unit (e.g., meat cuts, cheese wheels)

**Example:**
- Product: Beef Ribeye Steak
- UoM: Each
- Catch Weight: 0.487 kg (varies per piece)

### Database Fields

```sql
-- In products table
is_catch_weight BOOLEAN DEFAULT false
target_weight_kg NUMERIC(10,3) -- target weight
weight_tolerance_pct NUMERIC(5,2) -- tolerance (e.g., ±10%)

-- In license_plates table
catch_weight_kg NUMERIC(10,3) -- actual weight

-- In grn_items table
catch_weight_kg NUMERIC(10,3)
```

### Receipt Workflow (Catch Weight)

```
Step 1: Select catch weight product
- System detects is_catch_weight = true
- Shows target weight

Step 2: Enter Received Qty
- Qty = number of units (e.g., 10 pieces)

Step 3: Enter Catch Weight
- Prompt: "Enter total weight (kg)"
- User enters: 4.87 kg
- System calculates: 4.87 / 10 = 0.487 kg/piece

Step 4: Validation
- Check: weight within tolerance
- Warn if outside range

Step 5: Create LP
- Store catch_weight_kg = 4.87
- Qty = 10
```

### Consumption (Catch Weight)

**Production consumes by weight:**
- BOM specifies: 5 kg beef needed
- System suggests LP with total catch_weight >= 5 kg
- User scans LP (10 pieces, 4.87 kg)
- System prompts: "Consume full LP (4.87 kg)?"
- If partial: split LP by piece count (e.g., take 6 pieces = 2.92 kg, leave 4 pieces = 1.95 kg)

---

## Shelf Life Calculation

### Auto-Calculate Expiry

**If product has shelf_life_days:**

```sql
-- On receipt (if expiry not provided)
expiry_date = manufacture_date + shelf_life_days

-- Example
manufacture_date = 2025-12-01
shelf_life_days = 90
expiry_date = 2025-03-01
```

### Expiry Alerts

**warehouse_settings.expiry_warning_days = 30**

```sql
-- Query expiring LPs
SELECT * FROM license_plates
WHERE expiry_date <= CURRENT_DATE + INTERVAL '30 days'
  AND expiry_date > CURRENT_DATE
  AND status = 'available'
ORDER BY expiry_date ASC
```

**Dashboard Alert:**
- Red: Expired (expiry < today)
- Yellow: Expiring soon (expiry < today + warning_days)

---

## Cycle Count Process

### Types

| Type | Frequency | Scope | Description |
|------|-----------|-------|-------------|
| Full | Annual | All LPs | Count entire warehouse |
| Partial | Quarterly | Zone/Location | Count specific area |
| Cycle | Weekly | ABC rotation | Count high-value items frequently |

### ABC Classification

| Class | Criteria | Count Frequency |
|-------|----------|-----------------|
| A | High value (top 20% of $ value) | Weekly |
| B | Medium value (next 30%) | Monthly |
| C | Low value (bottom 50%) | Quarterly |

### Workflow

```
1. Plan Count
- Select type (full/partial/cycle)
- Select warehouse/location/zone
- Schedule date
- Assign counter

2. Generate Count Sheet
- List expected LPs at locations
- Show: LP, Product, Location, Expected Qty

3. Execute Count
- Scanner: scan location → scan LPs → enter counted qty
- Desktop: view sheet, enter counts

4. Review Variances
- System calculates: variance = counted - expected
- Flag: |variance| > threshold (e.g., 5%)

5. Approve Adjustments
- Manager reviews variances
- Approve/reject adjustments
- System creates stock_moves for adjustments
```

---

## Label Printing (ZPL)

### LP Label Template (4x6 inch)

```zpl
^XA
^FO50,50^BY2
^BCN,100,Y,N,N
^FD{LP_NUMBER}^FS
^FO50,180^A0N,40,40^FD{PRODUCT_NAME}^FS
^FO50,230^A0N,30,30^FDQty: {QTY} {UOM}^FS
^FO50,270^A0N,30,30^FDBatch: {BATCH}^FS
^FO50,310^A0N,30,30^FDExp: {EXPIRY}^FS
^FO50,350^A0N,30,30^FDLoc: {LOCATION}^FS
^FO400,50^BQN,2,4
^FDQA,{QR_DATA}^FS
^XZ
```

**QR Code Data (JSON):**
```json
{
  "lp": "LP20251201-00000123",
  "product": "12345",
  "qty": 100,
  "batch": "BATCH456",
  "expiry": "2026-06-01"
}
```

### Pallet Label Template (4x6 inch)

```zpl
^XA
^FO50,50^BY3
^BCN,120,Y,N,N
^FD{SSCC}^FS
^FO50,200^A0N,40,40^FDPallet: {PALLET_NUMBER}^FS
^FO50,250^A0N,30,30^FDLPs: {LP_COUNT}^FS
^FO50,290^A0N,30,30^FDWeight: {WEIGHT_KG} kg^FS
^FO50,330^A0N,30,30^FDPacked: {PACKED_DATE}^FS
^FO400,200^BQN,2,4
^FDQA,{QR_DATA}^FS
^XZ
```

### Print Integration

**Endpoints:**
- `POST /api/warehouse/print/lp/:id` - Print LP label
- `POST /api/warehouse/print/pallet/:id` - Print pallet label
- `POST /api/warehouse/print/grn/:id` - Print GRN document

**Printer Config (in Settings):**
- Printer IP/hostname
- Printer port (default: 9100 for ZPL over TCP)
- Label size (4x6, 4x3, etc.)
- Print queue (immediate vs batched)

---

## Phase Roadmap

### Phase 1: Core Inventory (MVP)
**Timeline:** Weeks 1-4
**Stories:** 05A-1 to 05A-4 (10 stories)

| Story | Feature | Tasks |
|-------|---------|-------|
| 5.1 | Warehouse Settings | Settings page, toggles, validation |
| 5.2 | LP Management (Desktop) | LP list, detail modal, filters |
| 5.3 | GRN from PO | Receive workflow, create GRN + LPs |
| 5.4 | GRN from TO | TO receive, transit location |
| 5.5 | Stock Moves | Move LP, validation, audit trail |
| 5.6 | LP Split | Split workflow, genealogy |
| 5.7 | LP Merge | Merge validation, genealogy |
| 5.8 | QA Status Management | Block/unblock, quarantine |
| 5.9 | Batch/Expiry Tracking | Fields, validation, alerts |
| 5.10 | Warehouse Dashboard | KPIs, inventory summary, aging |

**Deliverables:**
- Desktop receiving (PO/TO → GRN → LP)
- LP list/detail pages
- Stock movements (full/partial)
- Basic genealogy

### Phase 2: Scanner Workflows
**Timeline:** Weeks 5-7
**Stories:** 05B-1 to 05B-3 (8 stories)

| Story | Feature | Tasks |
|-------|---------|-------|
| 5.11 | Scanner Login | Auth, session, timeout |
| 5.12 | Scanner Receive | Guided receive workflow |
| 5.13 | Scanner Move | Guided move workflow |
| 5.14 | Scanner Split | Quick split |
| 5.15 | Scanner Merge | Quick merge |
| 5.16 | Scanner Putaway | Guided putaway (FIFO/FEFO) |
| 5.17 | Scanner Pick | Guided pick (TO/WO) |
| 5.18 | Scanner UI Components | Large buttons, sound, offline queue |

**Deliverables:**
- Mobile scanner app (/scanner routes)
- Barcode scanning (LP, location, PO)
- Guided workflows
- Offline support

### Phase 3: Advanced Features
**Timeline:** Weeks 8-10
**Stories:** 05C-1 to 05C-4 (9 stories)

| Story | Feature | Tasks |
|-------|---------|-------|
| 5.19 | ASN Management | ASN CRUD, receive from ASN |
| 5.20 | Pallet Management | Create, add/remove LPs, move |
| 5.21 | GS1 GTIN Support | Parse GTIN, lookup product |
| 5.22 | GS1 SSCC Support | Generate SSCC, pallet labels |
| 5.23 | FIFO Enforcement | Pick suggestions, warnings |
| 5.24 | FEFO Enforcement | Expiry-based picking |
| 5.25 | Catch Weight | Weight input, tolerance validation |
| 5.26 | Shelf Life Calc | Auto-calculate expiry |
| 5.27 | Label Printing (ZPL) | LP/pallet label templates, print API |

**Deliverables:**
- ASN workflow
- Pallet management
- GS1 barcode support
- FIFO/FEFO enforcement
- Catch weight handling
- Label printing

### Phase 4: Inventory Management
**Timeline:** Weeks 11-12
**Stories:** 05D-1 to 05D-3 (6 stories)

| Story | Feature | Tasks |
|-------|---------|-------|
| 5.28 | Cycle Count Planning | Create counts, schedule |
| 5.29 | Cycle Count Execution | Scanner count, variance detection |
| 5.30 | Stock Adjustments | Adjust LP qty, reason codes |
| 5.31 | Inventory Browser | Advanced filters, grouping |
| 5.32 | Aging Report | FIFO/FEFO aging, expiry report |
| 5.33 | Expiry Alerts | Dashboard alerts, notifications |

**Deliverables:**
- Cycle count workflows
- Inventory adjustments
- Advanced reporting
- Alerts system

### Phase 5: Polish & Integration
**Timeline:** Week 13-14
**Stories:** 05E-1 to 05E-2 (4 stories)

| Story | Feature | Tasks |
|-------|---------|-------|
| 5.34 | Location Capacity | Track capacity, validation |
| 5.35 | Zone Management | Create zones, assign locations |
| 5.36 | LP Genealogy Tree | Visual genealogy UI |
| 5.37 | Warehouse Polish | Performance, UX, edge cases |

**Deliverables:**
- Capacity management
- Zone organization
- Genealogy visualization
- Performance optimization

---

## Integration Points

### With Planning Module
- **PO Receipt:** GRN creates LPs, updates `po_lines.received_qty`
- **TO Receipt:** GRN updates `to_lines.received_qty`, clears transit location
- **WO Reservation:** Planning reserves LPs via `lp_reservations` table

### With Production Module
- **Material Consumption:** Production consumes reserved LPs, updates `license_plates.qty`, creates genealogy
- **Output Registration:** Production creates output LPs, links to consumed materials via genealogy
- **By-Product Output:** Production creates by-product LPs

### With Technical Module
- **Products:** LP references `products.id` for name, UoM, GTIN, shelf_life_days, is_catch_weight
- **BOMs:** Material requirements drive reservation/consumption

### With Settings Module
- **Warehouses:** LP belongs to warehouse
- **Locations:** LP current location, movement destinations
- **Machines/Lines:** Output LP location defaults to line location

### With Quality Module (Future)
- **QA Inspections:** Update `license_plates.qa_status`
- **Quarantine:** Move LP to quarantine location, block from consumption

---

## Validation Rules

### Receipt Validation

| Rule | Condition | Action |
|------|-----------|--------|
| Over-receipt | received_qty > ordered_qty | Block/allow based on settings |
| Under-receipt | received_qty < ordered_qty | Allow (partial receipt) |
| UoM mismatch | item.uom ≠ source.uom | Block |
| Expiry required | setting ON, expiry null | Block |
| Batch required | setting ON, batch null | Block |
| Catch weight required | is_catch_weight, weight null | Block |
| Catch weight tolerance | weight outside ±tolerance% | Warn |

### Movement Validation

| Rule | Condition | Action |
|------|-----------|--------|
| LP exists | LP not found | Block |
| LP available | status ≠ available | Block |
| Qty available | move_qty > LP.qty | Block |
| Location active | location.active = false | Block |
| Capacity check | destination capacity exceeded | Block/warn based on settings |
| FIFO violation | moving older stock behind newer | Warn |
| FEFO violation | moving soonest expiry behind later | Warn |

### Split/Merge Validation

| Rule | Condition | Action |
|------|-----------|--------|
| Split qty valid | split_qty < LP.qty | Block if not |
| Merge same product | All LPs same product_id | Block if not |
| Merge same UoM | All LPs same uom | Block if not |
| Merge same batch | All LPs same batch (or all null) | Block if not |
| Merge same expiry | All LPs same expiry (or within tolerance) | Block if not |
| Merge same QA | All LPs same qa_status | Block if not |

---

## Notes

**Design Principles:**
- **LP = Atomic Unit:** No loose qty - every item is an LP for full traceability
- **Scanner-First:** Optimize for mobile workflows - desktop for corrections/management
- **Configurable:** Feature toggles for orgs of different sizes/needs
- **Standards Compliance:** GS1 barcode support for industry compatibility
- **Real-Time:** Inventory updates immediately on movement/consumption
- **Genealogy:** Full forward/backward traceability via lp_genealogy

**Performance Considerations:**
- Index on `license_plates(org_id, product_id, location_id, status)`
- Partition `stock_moves` by date for large orgs
- Cache inventory summaries (refresh on movement)
- Offline scanner queue syncs to server

**Future Enhancements:**
- WMS automation (auto-putaway rules, slotting optimization)
- RF picking (voice-directed, pick-to-light)
- Cross-docking (direct PO → TO without putaway)
- Kitting (assemble multiple LPs into kit LP)
- Replenishment (auto-generate TOs for min/max stock levels)
