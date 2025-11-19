# Warehouse & Scanner Module - Epic Breakdown

**Modul:** Warehouse & Scanner (LP, ASN, GRN, Movements, Pallets, Scanner)
**Priorytet:** P0 - Core Module
**FRs:** 30 (wszystkie MVP/Should)
**Szacowany czas:** 4-5 tygodni

---

## Podsumowanie Epikow

| Epic | Nazwa | FRs | Stories | Priorytet | Effort |
|------|-------|-----|---------|-----------|--------|
| WH-1 | License Plate Management | 7 | 9 | P0 | 5d |
| WH-2 | ASN & GRN Receiving | 6 | 8 | P0 | 5d |
| WH-3 | Stock Movements | 5 | 6 | P0 | 3d |
| WH-4 | Pallet Management | 4 | 5 | P1 | 3d |
| WH-5 | Scanner Workflows | 5 | 8 | P0 | 4d |
| WH-6 | Traceability & Genealogy | 3 | 4 | P0 | 2d |
| **Total** | | **30** | **40** | | **22d** |

---

## Epic WH-1: License Plate Management

**Cel:** CRUD LP z generowaniem numerow, split/merge i statusami
**FRs:** WH-FR-01, WH-FR-02, WH-FR-03, WH-FR-04, WH-FR-05, WH-FR-06, WH-FR-07
**Priorytet:** P0 MVP
**Effort:** 5 dni

### Stories

#### WH-1-1: LP Core Fields
**Jako** Warehouse Manager **chce** sledzic LP **aby** miec pelna kontrole inventory

**Acceptance Criteria:**
- [ ] LP fields: lp_number, product_id, quantity, uom, location_id, warehouse_id
- [ ] Status: available, reserved, consumed, blocked
- [ ] QA status: pending, passed, failed, quarantine
- [ ] Each LP has unique lp_number per org
- [ ] UoM inherited from product

**Technical Tasks:**
- license_plates table with all fields
- RLS policy for org_id
- Indexes for common queries

---

#### WH-1-2: LP Tracking Fields
**Jako** QC Manager **chce** sledzic batch i expiry **aby** zapewnic quality

**Acceptance Criteria:**
- [ ] batch_number (when enabled)
- [ ] supplier_batch_number (when enabled)
- [ ] expiry_date (when enabled)
- [ ] manufacture_date (optional)
- [ ] po_number, grn_id for source tracking
- [ ] wo_id for production source

**Technical Tasks:**
- Fields in license_plates table
- Settings toggles for required fields
- Validation based on settings

---

#### WH-1-3: LP Number Generation
**Jako** System **chce** generowac LP numbers **aby** zapewnic unikalnosc

**Acceptance Criteria:**
- [ ] Auto-generate: {prefix}{YYMMDD}{sequence}
- [ ] Settings: lp_number_prefix (default "LP")
- [ ] Settings: lp_number_sequence_length (default 8)
- [ ] Manual entry option (validate uniqueness)
- [ ] Example: LP250115-00000001

**Technical Tasks:**
- LP number generation logic
- Sequence tracking per org
- Uniqueness validation

---

#### WH-1-4: LP List & Detail UI
**Jako** Warehouse Op **chce** przegladac LP **aby** znajdowac inventory

**Acceptance Criteria:**
- [ ] LP list with filters: Warehouse, Location, Product, Status, QA, Expiry
- [ ] Columns: LP Number, Product, Qty, UoM, Location, Status, QA, Expiry, Batch
- [ ] LP detail modal: all fields, genealogy, movement history
- [ ] Actions: View, Move, Split, Merge, Block/Unblock
- [ ] Bulk actions: Print Labels, Move, Change QA

**Technical Tasks:**
- API: GET `/api/license-plates`
- API: GET `/api/license-plates/:id`
- UI: LPsTable, LPDetailModal

---

#### WH-1-5: LP Split
**Jako** Warehouse Op **chce** dzielic LP **aby** czesc przeniesc/wydac

**Acceptance Criteria:**
- [ ] Toggle: enable_split_merge
- [ ] Select source LP
- [ ] Enter split quantity (< current)
- [ ] New LP inherits: product, batch, expiry, QA status
- [ ] New LP number auto-generated
- [ ] Optionally select different location
- [ ] Records genealogy (parent_lp_id)

**Technical Tasks:**
- API: POST `/api/license-plates/:id/split`
- Genealogy record creation
- UI: SplitLPModal

---

#### WH-1-6: LP Merge
**Jako** Warehouse Op **chce** laczyc LP **aby** konsolidowac inventory

**Acceptance Criteria:**
- [ ] Must be same: product_id, uom, batch_number, qa_status
- [ ] Expiry must match or within tolerance
- [ ] Select primary LP (keeps number)
- [ ] Add LPs to merge
- [ ] New qty = sum of all
- [ ] Location = primary LP location
- [ ] Records genealogy for all merged

**Technical Tasks:**
- API: POST `/api/license-plates/merge`
- Merge validation logic
- lp_compositions table
- UI: MergeLPModal

---

#### WH-1-7: LP Block/Unblock
**Jako** QC Manager **chce** blokowac LP **aby** wstrzymac uzycie

**Acceptance Criteria:**
- [ ] Block LP: status -> blocked
- [ ] Unblock LP: status -> available
- [ ] Reason required for block
- [ ] Audit trail
- [ ] Blocked LP cannot be consumed or shipped

**Technical Tasks:**
- API: PUT `/api/license-plates/:id/block`
- API: PUT `/api/license-plates/:id/unblock`
- Status transition validation

---

#### WH-1-8: LP Label Printing
**Jako** Warehouse Op **chce** drukowac etykiety LP **aby** identyfikowac inventory

**Acceptance Criteria:**
- [ ] Print LP label from detail view
- [ ] Label content: LP Number (barcode), Product, Qty, UoM, Batch, Expiry, Location
- [ ] QR code with LP data
- [ ] Formats: ZPL, PDF, PNG
- [ ] Multiple copies option
- [ ] Settings: label_copies_default

**Technical Tasks:**
- API: POST `/api/license-plates/:id/print-label`
- ZPL template generation
- Label template configuration

---

#### WH-1-9: LP Movement History
**Jako** Manager **chce** widziec historie LP **aby** audytowac ruchy

**Acceptance Criteria:**
- [ ] Timeline of all movements
- [ ] Each entry: Date, From, To, Qty, Type, User
- [ ] Show on LP detail modal
- [ ] Export option

**Technical Tasks:**
- API: GET `/api/license-plates/:id/history`
- Query stock_moves by lp_id
- UI: MovementHistoryTimeline

---

## Epic WH-2: ASN & GRN Receiving

**Cel:** Przyjecie towaru z PO/TO/ASN i tworzenie LP
**FRs:** WH-FR-08, WH-FR-09, WH-FR-10, WH-FR-11, WH-FR-12, WH-FR-13
**Priorytet:** P0 MVP
**Effort:** 5 dni

### Stories

#### WH-2-1: GRN CRUD Core
**Jako** Receiver **chce** tworzyc GRN **aby** rejestrowac przyjecie

**Acceptance Criteria:**
- [ ] GRN fields: grn_number (auto), source_type, po_id/to_id, receipt_date
- [ ] warehouse_id, location_id, received_by
- [ ] Status: draft, completed, cancelled
- [ ] Auto-generated grn_number
- [ ] GRN list with filters

**Technical Tasks:**
- grns table
- API: CRUD `/api/grns`
- UI: GRNsTable, GRNDetailView

---

#### WH-2-2: Desktop Receive from PO
**Jako** Receiver **chce** przyjmowac z PO **aby** rejestrowac dostawy

**Acceptance Criteria:**
- [ ] Select PO from pending list
- [ ] Auto-fill: Supplier, Warehouse (from PO)
- [ ] User selects: Location (default from warehouse)
- [ ] For each line: received_qty, batch, supplier_batch, expiry
- [ ] LP number auto/manual per settings
- [ ] Can split line into multiple LPs
- [ ] Validation: over-receipt based on settings

**Technical Tasks:**
- Receive workflow logic
- PO line update (received_qty)
- UI: ReceivePOForm

---

#### WH-2-3: Desktop Receive from TO
**Jako** Receiver **chce** przyjmowac z TO **aby** rejestrowac transfery

**Acceptance Criteria:**
- [ ] Select TO from in-transit list
- [ ] Auto-fill from TO
- [ ] Create GRN + LP
- [ ] Update to_line.received_qty
- [ ] Handle transit location

**Technical Tasks:**
- TO receive workflow
- UI: ReceiveTOForm

---

#### WH-2-4: ASN Management
**Jako** Purchaser **chce** zarzadzac ASN **aby** przygotowac przyjecie

**Acceptance Criteria:**
- [ ] Toggle: enable_asn
- [ ] ASN fields: asn_number, po_id, supplier_id, expected_date, carrier, tracking
- [ ] ASN items: product_id, expected_qty, supplier_lp_number, supplier_batch, expiry
- [ ] Status: pending, received, partial, cancelled
- [ ] Link to PO

**Technical Tasks:**
- asns, asn_items tables
- API: CRUD `/api/asns`
- UI: ASNsTable, ASNDetailView

---

#### WH-2-5: Receive from ASN
**Jako** Receiver **chce** przyjmowac z ASN **aby** miec pre-filled dane

**Acceptance Criteria:**
- [ ] Select ASN from pending list
- [ ] Auto-fill from ASN items: product, qty, supplier_batch, expiry
- [ ] Can modify actual received
- [ ] Creates GRN with asn_id reference
- [ ] Updates ASN status

**Technical Tasks:**
- ASN to GRN workflow
- UI: ReceiveFromASNForm

---

#### WH-2-6: Over-Receipt Control
**Jako** Manager **chce** kontrolowac over-receipt **aby** sledzic variance

**Acceptance Criteria:**
- [ ] Toggle: allow_over_receipt
- [ ] Setting: over_receipt_tolerance_pct
- [ ] If off: block if received > ordered
- [ ] If on: allow within tolerance %
- [ ] Warning message
- [ ] Track variance

**Technical Tasks:**
- Over-receipt validation
- Tolerance calculation

---

#### WH-2-7: Auto Print on Receipt
**Jako** Receiver **chce** auto-druk etykiet **aby** od razu oznaczac

**Acceptance Criteria:**
- [ ] Toggle: print_label_on_receipt
- [ ] Print label for each created LP
- [ ] Number of copies from settings
- [ ] Can skip if needed

**Technical Tasks:**
- Auto-print trigger on GRN complete
- Label queue

---

#### WH-2-8: PO/TO Line Update
**Jako** System **chce** aktualizowac PO/TO lines **aby** sledzic stan

**Acceptance Criteria:**
- [ ] Update po_line.received_qty on GRN complete
- [ ] Update to_line.received_qty on GRN complete
- [ ] Handle partial receipt
- [ ] Update PO/TO status if fully received

**Technical Tasks:**
- Transaction for GRN + PO/TO update
- Status calculation logic

---

## Epic WH-3: Stock Movements

**Cel:** Ruchy LP miedzy lokalizacjami z audytem
**FRs:** WH-FR-14, WH-FR-15, WH-FR-16, WH-FR-17, WH-FR-18
**Priorytet:** P0 MVP
**Effort:** 3 dni

### Stories

#### WH-3-1: Movement Types
**Jako** System **chce** klasyfikowac ruchy **aby** miec audyt

**Acceptance Criteria:**
- [ ] Types: TRANSFER, ISSUE, RECEIPT, ADJUSTMENT, RETURN, QUARANTINE
- [ ] Each movement has move_number (auto)
- [ ] Track: lp_id, from/to location, quantity, date, user
- [ ] Status: draft, completed, cancelled

**Technical Tasks:**
- stock_moves table
- Move type enum
- API: POST `/api/stock-moves`

---

#### WH-3-2: Desktop Move LP
**Jako** Warehouse Op **chce** przesuwac LP **aby** zmienic lokalizacje

**Acceptance Criteria:**
- [ ] Scan/select LP
- [ ] Select destination location
- [ ] Enter quantity (full LP default)
- [ ] Partial qty triggers split
- [ ] Create stock_move record
- [ ] Update LP location

**Technical Tasks:**
- Move workflow logic
- Location update transaction
- UI: MoveLPForm

---

#### WH-3-3: Movement Validation
**Jako** System **chce** walidowac ruchy **aby** zapobiegac bledom

**Acceptance Criteria:**
- [ ] LP has sufficient quantity
- [ ] Destination location is active
- [ ] LP status = available (not blocked)
- [ ] Same warehouse for internal moves
- [ ] FIFO/FEFO validation (optional)

**Technical Tasks:**
- Validation layer
- Error messages

---

#### WH-3-4: Movement Audit Trail
**Jako** Manager **chce** pelny audit trail **aby** sledzic historie

**Acceptance Criteria:**
- [ ] Every movement recorded
- [ ] Fields: move_number, date, user, reason
- [ ] Cannot delete movements
- [ ] Search and filter movements
- [ ] Export option

**Technical Tasks:**
- Immutable stock_moves
- Movement list API with filters

---

#### WH-3-5: Movement List View
**Jako** Manager **chce** przegladac ruchy **aby** audytowac operacje

**Acceptance Criteria:**
- [ ] Filter by: Type, Date, Location, Product, User
- [ ] Columns: Move Number, LP, Product, From, To, Qty, Type, Date, User
- [ ] Click to view details
- [ ] Export to Excel

**Technical Tasks:**
- API: GET `/api/stock-moves`
- UI: MovementsTable, MovementDetailModal

---

#### WH-3-6: Location Capacity Check
**Jako** System **chce** sprawdzac capacity **aby** nie przepelniac lokalizacji

**Acceptance Criteria:**
- [ ] Toggle: enable_location_capacity
- [ ] Location has max_capacity field
- [ ] Check before move
- [ ] Warning or block based on settings

**Technical Tasks:**
- Capacity check logic
- Location capacity field

---

## Epic WH-4: Pallet Management

**Cel:** Zarzadzanie paletami z LP
**FRs:** WH-FR-19, WH-FR-20, WH-FR-21, WH-FR-22
**Priorytet:** P1 (Should)
**Effort:** 3 dni

### Stories

#### WH-4-1: Pallet CRUD
**Jako** Warehouse Op **chce** tworzyc palety **aby** grupowac LP

**Acceptance Criteria:**
- [ ] Toggle: enable_pallets
- [ ] Pallet fields: pallet_number (SSCC), pallet_type, location_id, weight_kg
- [ ] Status: open, closed, shipped
- [ ] Auto-generate pallet_number
- [ ] Pallet list with filters

**Technical Tasks:**
- pallets, pallet_items tables
- API: CRUD `/api/pallets`
- UI: PalletsTable, PalletDetailView

---

#### WH-4-2: Add/Remove LP to Pallet
**Jako** Warehouse Op **chce** dodawac LP do palety **aby** pakowac

**Acceptance Criteria:**
- [ ] Scan pallet, then scan LP
- [ ] LP moves to pallet's location
- [ ] LP.pallet_id updated
- [ ] Remove LP: pallet_id = null
- [ ] Track sequence on pallet

**Technical Tasks:**
- API: POST `/api/pallets/:id/add-lp`
- API: POST `/api/pallets/:id/remove-lp`
- pallet_items table

---

#### WH-4-3: Move Pallet
**Jako** Warehouse Op **chce** przesuwac palete **aby** wszystkie LP poszly razem

**Acceptance Criteria:**
- [ ] Select pallet and destination
- [ ] All LPs on pallet move together
- [ ] Create stock_move for each LP
- [ ] Pallet location updated

**Technical Tasks:**
- API: POST `/api/pallets/:id/move`
- Batch move transaction

---

#### WH-4-4: Close Pallet
**Jako** Warehouse Op **chce** zamknac palete **aby** przygotowac do wysylki

**Acceptance Criteria:**
- [ ] Close: status -> closed
- [ ] No more LPs can be added
- [ ] closed_date set
- [ ] Can reopen if needed

**Technical Tasks:**
- API: POST `/api/pallets/:id/close`
- Status transition

---

#### WH-4-5: Pallet Label Printing
**Jako** Warehouse Op **chce** drukowac etykiety palety **aby** identyfikowac

**Acceptance Criteria:**
- [ ] Pallet number (SSCC barcode)
- [ ] Contents summary
- [ ] Total weight
- [ ] Date packed
- [ ] QR code

**Technical Tasks:**
- API: POST `/api/pallets/:id/print-label`
- SSCC label template

---

## Epic WH-5: Scanner Workflows

**Cel:** Mobilne workflow dla operacji magazynowych
**FRs:** WH-FR-23, WH-FR-24, WH-FR-25, WH-FR-26, WH-FR-27
**Priorytet:** P0 MVP
**Effort:** 4 dni

### Stories

#### WH-5-1: Scanner Home & Login
**Jako** Operator **chce** logowac sie na scanner **aby** uzywac terminala

**Acceptance Criteria:**
- [ ] Login: badge scan or PIN
- [ ] Home menu based on role
- [ ] Options: Receive, Move, Split, Merge, Pack
- [ ] Session timeout from settings
- [ ] Timeout warning before expiry

**Technical Tasks:**
- API: POST `/api/scanner/login`
- Scanner auth flow
- UI: ScannerHomeScreen

---

#### WH-5-2: Scanner Receive
**Jako** Operator **chce** przyjmowac na scanner **aby** szybko rejestrowac

**Acceptance Criteria:**
- [ ] Step 1: Scan PO/TO/ASN barcode or select from list
- [ ] Step 2: Select line if multiple products
- [ ] Step 3: Enter batch, supplier batch, expiry, qty, location
- [ ] Step 4: Validate (over-receipt, required fields)
- [ ] Step 5: Confirm -> create GRN + LP, print label
- [ ] Continue with next item or done

**Technical Tasks:**
- API: POST `/api/scanner/receive`
- Scanner receive flow
- UI: ScannerReceiveScreens

---

#### WH-5-3: Scanner Move
**Jako** Operator **chce** przesuwac LP na scanner **aby** szybko operowac

**Acceptance Criteria:**
- [ ] Step 1: Scan LP -> display info
- [ ] Step 2: Scan destination location
- [ ] Step 3: Enter qty (default full LP)
- [ ] Step 4: Confirm -> create move, update LP
- [ ] Sound/visual feedback

**Technical Tasks:**
- API: POST `/api/scanner/move`
- UI: ScannerMoveScreens

---

#### WH-5-4: Scanner Split
**Jako** Operator **chce** dzielic LP na scanner **aby** szybko podzielic

**Acceptance Criteria:**
- [ ] Step 1: Scan LP -> display info
- [ ] Step 2: Enter split qty
- [ ] Step 3: Optionally scan different location
- [ ] Step 4: Confirm -> create new LP, print label
- [ ] Sound feedback

**Technical Tasks:**
- API: POST `/api/scanner/split`
- UI: ScannerSplitScreens

---

#### WH-5-5: Scanner Merge
**Jako** Operator **chce** laczyc LP na scanner **aby** szybko konsolidowac

**Acceptance Criteria:**
- [ ] Step 1: Scan primary LP
- [ ] Step 2: Scan additional LPs (validate rules)
- [ ] Step 3: Show running total
- [ ] Step 4: Confirm -> merge, update qtys
- [ ] Sound feedback

**Technical Tasks:**
- API: POST `/api/scanner/merge`
- UI: ScannerMergeScreens

---

#### WH-5-6: Scanner Pack (Pallet)
**Jako** Operator **chce** pakowac na scanner **aby** budowac palety

**Acceptance Criteria:**
- [ ] Step 1: Scan/create pallet
- [ ] Step 2: Scan LP to add
- [ ] Step 3: Show count/weight
- [ ] Step 4: Continue or close pallet
- [ ] Print pallet label

**Technical Tasks:**
- API: POST `/api/scanner/pack`
- UI: ScannerPackScreens

---

#### WH-5-7: Scanner Validation & Feedback
**Jako** System **chce** walidowac w real-time **aby** zapobiegac bledom

**Acceptance Criteria:**
- [ ] Validate barcode on every scan
- [ ] Clear error messages
- [ ] Sound feedback: success/error
- [ ] Visual feedback: green flash on scan
- [ ] Back button on every screen

**Technical Tasks:**
- Validation responses
- Sound/visual feedback components
- Scanner UI patterns

---

#### WH-5-8: Scanner Barcode Lookup
**Jako** Operator **chce** skanowac kody **aby** szybko znajdowac

**Acceptance Criteria:**
- [ ] Lookup LP by barcode
- [ ] Lookup location by barcode
- [ ] Lookup PO/TO by barcode
- [ ] Display relevant info
- [ ] Handle not found

**Technical Tasks:**
- API: GET `/api/scanner/lp/:barcode`
- API: GET `/api/scanner/location/:barcode`
- Barcode parsing

---

## Epic WH-6: Traceability & Genealogy

**Cel:** Pelna traceability przez genealogie LP
**FRs:** WH-FR-28, WH-FR-29, WH-FR-30
**Priorytet:** P0 MVP
**Effort:** 2 dni

### Stories

#### WH-6-1: LP Genealogy Table
**Jako** System **chce** rejestrowac relacje LP **aby** miec traceability

**Acceptance Criteria:**
- [ ] lp_genealogy: parent_lp_id, child_lp_id, operation_type, quantity
- [ ] Operation types: split, merge, consume, output
- [ ] operation_date, wo_id, operation_id
- [ ] Indexes for fast queries

**Technical Tasks:**
- lp_genealogy table
- Indexes on parent/child

---

#### WH-6-2: Record Genealogy on Operations
**Jako** System **chce** zapisywac genealogie **aby** sledzic kazda operacje

**Acceptance Criteria:**
- [ ] On split: create record (parent -> new LP)
- [ ] On merge: create record for each merged LP
- [ ] On consume: create record (material -> NULL child)
- [ ] On output: update child_lp_id to output LP

**Technical Tasks:**
- Genealogy hooks on LP operations
- Transaction integrity

---

#### WH-6-3: Source Document Links
**Jako** Manager **chce** widziec zrodlo LP **aby** miec pelny context

**Acceptance Criteria:**
- [ ] LP links to: po_number, grn_id, wo_id, asn_id
- [ ] Display on LP detail
- [ ] Click to navigate to source document
- [ ] Full audit from receipt to consumption

**Technical Tasks:**
- Source document references on LP
- UI: Source links on detail

---

#### WH-6-4: LP Genealogy View
**Jako** QC Manager **chce** widziec genealogie LP **aby** sledzic pochodzenie

**Acceptance Criteria:**
- [ ] API: GET `/api/license-plates/:id/genealogy`
- [ ] Return: parent chain (backward), child chain (forward)
- [ ] Display as tree or list
- [ ] Show: LP number, product, qty, operation, date
- [ ] Click to navigate

**Technical Tasks:**
- Recursive query for genealogy
- UI: GenealogyView component

---

## Zaleznosci

```
WH-1 (LP) <- foundation for all
WH-2 (Receiving) <- requires LP, PO/TO from Planning
WH-3 (Movements) <- requires LP, Locations
WH-4 (Pallets) <- requires LP
WH-5 (Scanner) <- requires all above
WH-6 (Genealogy) <- requires LP operations
```

- Settings module complete (Warehouses, Locations)
- Planning module (PO, TO) for receiving
- Technical module (Products) for LP product reference

---

## Definition of Done

- [ ] Wszystkie AC spelnione
- [ ] LP lifecycle complete (create, split, merge, consume)
- [ ] GRN creates LP and updates PO/TO
- [ ] Scanner workflows operational
- [ ] Genealogy complete for all operations
- [ ] Unit tests (95% coverage)
- [ ] E2E tests for critical paths
- [ ] API documentation updated
- [ ] Label printing functional

---

## Status

- **Created:** 2025-11-19
- **Status:** Ready for Sprint Planning
- **Dependencies:** Settings, Technical, Planning complete

---

_Epic breakdown dla Warehouse Module - 30 FRs -> 6 epikow, 40 stories_
