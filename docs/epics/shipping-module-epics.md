# Shipping Module - Epic Breakdown

**Modul:** Shipping (SO, Shipments, Picking, Packing, Documents)
**Priorytet:** P0 - Core Module
**FRs:** 26 (Must + Should)
**Szacowany czas:** 3-4 tygodnie

---

## Podsumowanie Epikow

| Epic | Nazwa | FRs | Stories | Priorytet | Effort |
|------|-------|-----|---------|-----------|--------|
| SHIP-1 | Sales Orders | 4 | 6 | P0 | 3d |
| SHIP-2 | Shipment Management | 4 | 5 | P0 | 3d |
| SHIP-3 | Picking Workflows | 6 | 8 | P0 | 4d |
| SHIP-4 | Packing & Documents | 7 | 8 | P0 | 4d |
| SHIP-5 | Scanner Workflows | 3 | 5 | P0 | 3d |
| SHIP-6 | Reports & Dashboard | 2 | 3 | P1 | 1d |
| **Total** | | **26** | **35** | | **18d** |

---

## Epic SHIP-1: Sales Orders

**Cel:** Zarzadzanie zamowieniami klientow
**FRs:** SH-FR-01, SH-FR-02, SH-FR-03, SH-FR-04
**Priorytet:** P0 MVP
**Effort:** 3 dni

### Stories

#### SHIP-1-1: SO CRUD Core
**Jako** Sales Rep **chce** tworzyc SO **aby** rejestrowac zamowienia

**Acceptance Criteria:**
- [ ] SO header: so_number (auto), customer_id, order_date, requested_date
- [ ] Fields: ship_to_address, warehouse_id, priority, shipping_method
- [ ] SO lines: product_id, quantity, uom, unit_price
- [ ] Status: draft, confirmed, picking, packed, shipped, delivered, cancelled
- [ ] Auto-generated so_number

**Technical Tasks:**
- so_header, so_line tables
- API: CRUD `/api/sales-orders`
- UI: SOsTable, CreateSOModal

---

#### SHIP-1-2: SO Status Lifecycle
**Jako** System **chce** sledzic status SO **aby** kontrolowac flow

**Acceptance Criteria:**
- [ ] draft -> confirmed -> picking -> packed -> shipped -> delivered
- [ ] Status transitions validated
- [ ] Cannot skip statuses
- [ ] Cancelled from any status
- [ ] Partial shipment creates backorder

**Technical Tasks:**
- Status transition validation
- Backorder creation logic

---

#### SHIP-1-3: SO Line Status
**Jako** Warehouse Op **chce** sledzic status linii **aby** widziec postep

**Acceptance Criteria:**
- [ ] Line status: pending, picking, packed, shipped
- [ ] picked_qty, shipped_qty per line
- [ ] Progress calculation
- [ ] Short handling

**Technical Tasks:**
- Line status updates
- Quantity tracking

---

#### SHIP-1-4: Inventory Availability Check
**Jako** Sales Rep **chce** sprawdzic dostepnosc **aby** obiecac date

**Acceptance Criteria:**
- [ ] Check available LP qty for each line
- [ ] Consider reserved qty
- [ ] Show: available, on-hand, on-order
- [ ] Warning if insufficient

**Technical Tasks:**
- Availability calculation query
- UI: AvailabilityIndicator

---

#### SHIP-1-5: SO List & Detail UI
**Jako** User **chce** przegladac SO **aby** zarzadzac

**Acceptance Criteria:**
- [ ] SO list with filters: Status, Customer, Date, Warehouse, Priority
- [ ] Columns: SO #, Customer, Date, Items, Status, Ship Date
- [ ] SO detail: header, lines, shipment history
- [ ] Actions: Edit (draft), Confirm, Generate Pick, Ship

**Technical Tasks:**
- API: GET `/api/sales-orders`
- UI: SOsList, SODetailView

---

#### SHIP-1-6: Customer Selection
**Jako** Sales Rep **chce** wybrac klienta **aby** wypelnic adres

**Acceptance Criteria:**
- [ ] Customer search/select
- [ ] Auto-fill ship-to address from customer
- [ ] Override address option
- [ ] Multiple addresses per customer (future)

**Technical Tasks:**
- Customer API integration
- Address auto-fill

---

## Epic SHIP-2: Shipment Management

**Cel:** Grupowanie i sledzenie wysylek
**FRs:** SH-FR-05, SH-FR-06, SH-FR-07, SH-FR-08
**Priorytet:** P0 MVP
**Effort:** 3 dni

### Stories

#### SHIP-2-1: Shipment CRUD
**Jako** Shipping Clerk **chce** tworzyc shipments **aby** grupowac wysylki

**Acceptance Criteria:**
- [ ] Shipment fields: shipment_number (auto), warehouse_id, ship_date, status
- [ ] Carrier, tracking_number, weight, package_count
- [ ] Status: draft, picking, packed, shipped, delivered
- [ ] Link to SO lines

**Technical Tasks:**
- shipments, shipment_items tables
- API: CRUD `/api/shipments`
- UI: ShipmentsTable, CreateShipmentModal

---

#### SHIP-2-2: Create Shipment from SO
**Jako** Shipping Clerk **chce** tworzyc shipment z SO **aby** realizowac zamowienie

**Acceptance Criteria:**
- [ ] Select SO(s) to include
- [ ] Select lines to ship
- [ ] Set ship date
- [ ] Select carrier
- [ ] Create shipment with items

**Technical Tasks:**
- SO to shipment mapping
- UI: CreateShipmentFromSOModal

---

#### SHIP-2-3: Consolidate Multiple SOs
**Jako** Shipping Clerk **chce** konsolidowac SO **aby** optymalizowac wysylki

**Acceptance Criteria:**
- [ ] Select multiple SOs (same customer/destination)
- [ ] Combine into one shipment
- [ ] Show total items/weight

**Technical Tasks:**
- Multi-SO consolidation logic
- Validation rules

---

#### SHIP-2-4: Ship & Deliver Actions
**Jako** Shipping Clerk **chce** oznaczac shipped/delivered **aby** sledzic status

**Acceptance Criteria:**
- [ ] Mark as shipped: set ship_date, tracking
- [ ] Update SO and LP statuses
- [ ] Mark as delivered: set pod_date, signature
- [ ] Send notification

**Technical Tasks:**
- API: POST `/api/shipments/:id/ship`
- API: POST `/api/shipments/:id/deliver`
- Status cascade updates

---

#### SHIP-2-5: Shipment List & Detail UI
**Jako** User **chce** przegladac shipments **aby** sledzic

**Acceptance Criteria:**
- [ ] List with filters: Status, Date, Carrier, Customer
- [ ] Columns: Shipment #, Date, Customer, Items, Carrier, Tracking, Status
- [ ] Detail: info, items, packages, documents
- [ ] Actions: Track, Print, Ship, Deliver

**Technical Tasks:**
- UI: ShipmentsList, ShipmentDetailView

---

## Epic SHIP-3: Picking Workflows

**Cel:** Picking z rozymi strategiami i walidacja
**FRs:** SH-FR-09, SH-FR-10, SH-FR-11, SH-FR-12, SH-FR-13, SH-FR-14
**Priorytet:** P0 MVP
**Effort:** 4 dni

### Stories

#### SHIP-3-1: Generate Pick List
**Jako** System **chce** generowac pick list **aby** przygotowac picking

**Acceptance Criteria:**
- [ ] Generate from SO or Shipment
- [ ] pick_number auto-generated
- [ ] Calculate required qty per line
- [ ] Group by location for efficiency
- [ ] Pick list status: pending

**Technical Tasks:**
- pick_lists, pick_items tables
- API: POST `/api/pick-lists`
- Pick generation logic

---

#### SHIP-3-2: LP Suggestion by Strategy
**Jako** System **chce** sugerowac LP **aby** optymalizowac picking

**Acceptance Criteria:**
- [ ] Strategies: FIFO (oldest first), FEFO (expiry first), Manual
- [ ] Default from settings
- [ ] Suggest LP for each item
- [ ] Consider: available qty, QA status, location
- [ ] User can override suggestion

**Technical Tasks:**
- Strategy implementation
- LP selection queries
- UI: Suggested LP with override

---

#### SHIP-3-3: Picker Assignment
**Jako** Supervisor **chce** przypisac pickera **aby** zarzadzac praca

**Acceptance Criteria:**
- [ ] Assign user to pick list
- [ ] Or self-assign on start
- [ ] Track assigned_to
- [ ] Filter picks by assigned

**Technical Tasks:**
- API: PUT `/api/pick-lists/:id/assign`
- Assignment UI

---

#### SHIP-3-4: Pick Items (Desktop)
**Jako** Picker **chce** pickowac na desktop **aby** realizowac liste

**Acceptance Criteria:**
- [ ] View pick list items with locations
- [ ] Start pick: status -> in_progress
- [ ] For each item: select/scan LP, enter picked qty
- [ ] Update pick_item status
- [ ] Complete when all picked

**Technical Tasks:**
- API: PUT `/api/pick-items/:id`
- UI: PickDetailView, PickItemRow

---

#### SHIP-3-5: Handle Pick Shorts
**Jako** Picker **chce** obslugiwac braki **aby** kontynuowac

**Acceptance Criteria:**
- [ ] If LP not available or qty insufficient
- [ ] Mark as short (picked_qty < required)
- [ ] Select alternative LP
- [ ] Continue with remaining items
- [ ] Report shorts on completion

**Technical Tasks:**
- Short handling logic
- Alternative LP selection

---

#### SHIP-3-6: Complete Pick & Update SO
**Jako** System **chce** aktualizowac SO **aby** sledzic postep

**Acceptance Criteria:**
- [ ] On pick complete: update SO line picked_qty
- [ ] Update SO status -> packed (if all picked)
- [ ] Create backorder for shorts (if enabled)
- [ ] completed_at timestamp

**Technical Tasks:**
- API: POST `/api/pick-lists/:id/complete`
- SO update transaction

---

#### SHIP-3-7: QA Status Validation
**Jako** System **chce** walidowac QA **aby** zapobiec bledom

**Acceptance Criteria:**
- [ ] Setting: require_qa_passed
- [ ] Only suggest/allow QA passed LPs
- [ ] Block pick of pending/failed/quarantine
- [ ] Clear error message

**Technical Tasks:**
- QA validation in LP selection
- Error handling

---

#### SHIP-3-8: Pick List UI
**Jako** Supervisor **chce** przegladac pick lists **aby** zarzadzac

**Acceptance Criteria:**
- [ ] List with filters: Status, Date, Warehouse, Assigned
- [ ] Columns: Pick #, SO/Shipment, Items, Status, Assigned, Priority
- [ ] Detail: pick info, items with locations, progress
- [ ] Actions: Assign, Start, Print

**Technical Tasks:**
- UI: PickListsTable, PickDetailView

---

## Epic SHIP-4: Packing & Documents

**Cel:** Pakowanie i generowanie dokumentow
**FRs:** SH-FR-15, SH-FR-16, SH-FR-17, SH-FR-18, SH-FR-19, SH-FR-20, SH-FR-21
**Priorytet:** P0 MVP
**Effort:** 4 dni

### Stories

#### SHIP-4-1: Create Package
**Jako** Packer **chce** tworzyc paczki **aby** pakowac towary

**Acceptance Criteria:**
- [ ] Toggle: enable_pack_station
- [ ] Package fields: pack_number (auto), shipment_id, package_type
- [ ] Weight, dimensions, tracking
- [ ] Status: packing, packed, shipped

**Technical Tasks:**
- packages, package_items tables
- API: POST `/api/packages`
- UI: CreatePackageModal

---

#### SHIP-4-2: Pack Station Workflow
**Jako** Packer **chce** pakowac na stacji **aby** przygotowac wysylke

**Acceptance Criteria:**
- [ ] Select shipment
- [ ] Show picked items to pack
- [ ] Create package
- [ ] Scan items into package
- [ ] Weigh package
- [ ] Print label
- [ ] Complete pack

**Technical Tasks:**
- Pack station UI
- Item to package assignment

---

#### SHIP-4-3: Track Package Contents
**Jako** System **chce** sledzic zawartosc **aby** miec audit

**Acceptance Criteria:**
- [ ] Record LP in each package
- [ ] Quantity per LP
- [ ] Link package to shipment
- [ ] View contents on package detail

**Technical Tasks:**
- package_items table
- Contents tracking

---

#### SHIP-4-4: Generate Pick List Document
**Jako** Picker **chce** wydrukowac pick list **aby** miec na papierze

**Acceptance Criteria:**
- [ ] Pick list content: items, locations, qty
- [ ] Sorted by pick path
- [ ] PDF format
- [ ] Print button

**Technical Tasks:**
- Pick list PDF generation
- Print integration

---

#### SHIP-4-5: Generate Packing Slip
**Jako** Packer **chce** packing slip **aby** dolaczac do paczki

**Acceptance Criteria:**
- [ ] Content: shipment #, customer, ship-to, items, qtys
- [ ] Total packages and weight
- [ ] PDF format
- [ ] Print with each shipment

**Technical Tasks:**
- API: GET `/api/shipments/:id/packing-slip`
- Packing slip template

---

#### SHIP-4-6: Generate Shipping Label
**Jako** Packer **chce** shipping label **aby** oznaczyc paczke

**Acceptance Criteria:**
- [ ] Label content: carrier logo, tracking barcode, addresses
- [ ] Weight, service type
- [ ] ZPL format for label printer
- [ ] Print per package

**Technical Tasks:**
- API: GET `/api/packages/:id/label`
- Label template (ZPL)

---

#### SHIP-4-7: Bill of Lading (Optional)
**Jako** Shipping Clerk **chce** BOL **aby** dokumentowac dla carrier

**Acceptance Criteria:**
- [ ] Toggle: enable_bill_of_lading
- [ ] BOL content: shipper, consignee, items, weights
- [ ] Carrier acceptance signature
- [ ] PDF format

**Technical Tasks:**
- API: GET `/api/shipments/:id/bol`
- BOL template

---

#### SHIP-4-8: Document Print Integration
**Jako** User **chce** drukowac dokumenty **aby** miec fizyczne kopie

**Acceptance Criteria:**
- [ ] Print button on each document
- [ ] ZPL for labels
- [ ] PDF for documents
- [ ] Network printer support

**Technical Tasks:**
- Print service integration
- Document queue

---

## Epic SHIP-5: Scanner Workflows

**Cel:** Mobilne workflow dla picking i packing
**FRs:** SH-FR-22, SH-FR-23, SH-FR-24
**Priorytet:** P0 MVP
**Effort:** 3 dni

### Stories

#### SHIP-5-1: Scanner Pick Workflow
**Jako** Picker **chce** pickowac na scanner **aby** szybko realizowac

**Acceptance Criteria:**
- [ ] Step 1: Select pick list (scan or select)
- [ ] Step 2: Show items with locations
- [ ] Step 3: Navigate to location, scan LP
- [ ] Step 4: Validate product, QA, qty
- [ ] Step 5: Confirm picked qty
- [ ] Step 6: Complete pick

**Technical Tasks:**
- Scanner pick flow
- UI: ScannerPickScreens

---

#### SHIP-5-2: Scanner Short Handling
**Jako** Picker **chce** obslugiwac braki na scanner **aby** kontynuowac

**Acceptance Criteria:**
- [ ] If LP not available
- [ ] Mark as short OR
- [ ] Select alternative LP
- [ ] Continue with next item
- [ ] Report on completion

**Technical Tasks:**
- Short handling in scanner
- Alternative selection

---

#### SHIP-5-3: Scanner Pack Workflow
**Jako** Packer **chce** pakowac na scanner **aby** szybko realizowac

**Acceptance Criteria:**
- [ ] Step 1: Scan shipment
- [ ] Step 2: Create package
- [ ] Step 3: Scan items into package
- [ ] Step 4: Enter weight
- [ ] Step 5: Print label
- [ ] Step 6: Complete

**Technical Tasks:**
- Scanner pack flow
- UI: ScannerPackScreens

---

#### SHIP-5-4: Scanner Ship Verification
**Jako** Shipping Clerk **chce** weryfikowac wysylke **aby** potwierdzic

**Acceptance Criteria:**
- [ ] Scan shipment/package
- [ ] Display carrier, tracking, contents
- [ ] Scan each package to verify
- [ ] Confirm count
- [ ] Mark as shipped
- [ ] Capture signature (optional)

**Technical Tasks:**
- Verification flow
- Signature capture

---

#### SHIP-5-5: Scanner Validation
**Jako** System **chce** walidowac skany **aby** zapobiec bledom

**Acceptance Criteria:**
- [ ] Validate LP exists and available
- [ ] Validate product matches pick item
- [ ] Validate QA status = passed
- [ ] Validate qty available
- [ ] Clear error messages
- [ ] Sound/visual feedback

**Technical Tasks:**
- Validation layer
- Error handling

---

## Epic SHIP-6: Reports & Dashboard

**Cel:** Raporty i metryki shipping
**FRs:** SH-FR-25, SH-FR-26
**Priorytet:** P1 (Should)
**Effort:** 1 dzien

### Stories

#### SHIP-6-1: Open Orders Report
**Jako** Manager **chce** raport otwartych zamowien **aby** priorytetyzowac

**Acceptance Criteria:**
- [ ] Unshipped SOs
- [ ] Filters: Date, Customer, Priority
- [ ] Sort by: requested_date, priority
- [ ] Export to Excel

**Technical Tasks:**
- Report query
- UI: OpenOrdersReport

---

#### SHIP-6-2: Shipping Performance Reports
**Jako** Manager **chce** metryki **aby** analizowac efektywnosc

**Acceptance Criteria:**
- [ ] Reports: On-Time %, Pick Performance, Backorders
- [ ] Carrier Analysis
- [ ] Daily/Weekly summary
- [ ] Export PDF/Excel

**Technical Tasks:**
- Performance calculations
- Report templates

---

#### SHIP-6-3: Shipping Settings
**Jako** Admin **chce** konfigurowac Shipping **aby** dostosowac

**Acceptance Criteria:**
- [ ] All toggles from settings table
- [ ] Picking strategy default
- [ ] Carrier configuration
- [ ] Document toggles

**Technical Tasks:**
- shipping_settings table
- API: GET/PUT `/api/shipping-settings`
- UI: ShippingSettingsForm

---

## Zaleznosci

```
SHIP-1 (SO) <- foundation
SHIP-2 (Shipments) <- requires SO
SHIP-3 (Picking) <- requires SO, LP from Warehouse
SHIP-4 (Packing) <- requires Picking
SHIP-5 (Scanner) <- requires all above
SHIP-6 (Reports) <- requires all above
```

- Warehouse module complete (License Plates)
- Quality module (QA status validation)
- Technical module (Products)

---

## Definition of Done

- [ ] Wszystkie AC spelnione
- [ ] SO lifecycle complete
- [ ] Picking strategies work correctly
- [ ] Scanner pick/pack operational
- [ ] Documents generate correctly
- [ ] QA validation enforced
- [ ] Unit tests (95% coverage)
- [ ] E2E tests for critical paths
- [ ] API documentation updated

---

## Status

- **Created:** 2025-11-19
- **Status:** Ready for Sprint Planning
- **Dependencies:** Settings, Technical, Warehouse, Quality complete

---

_Epic breakdown dla Shipping Module - 26 FRs -> 6 epikow, 35 stories_
