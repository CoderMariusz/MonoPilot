# Epic 5: Warehouse & Scanner

**Goal:** Manage inventory through License Plates, ASN, GRN, movements, and Scanner operations.

**Dependencies:** Epic 1-3
**Required by:** Epic 4 (Production)

**FRs Covered:** 30 (WH-FR-01 to WH-FR-30)
**Stories:** 35
**Effort Estimate:** 4-5 weeks

**UX Design Reference:** [ux-design-warehouse-module.md](../ux-design-warehouse-module.md), [ux-design-scanner-module.md](../ux-design-scanner-module.md)

---

## Story 5.1: License Plate Creation

As a **Warehouse user**,
I want to create license plates,
So that inventory is tracked atomically.

**Acceptance Criteria:**

**Given** the user navigates to /warehouse/license-plates
**When** clicking "Create LP"
**Then** modal opens with:
- lp_number (auto-generated, can override)
- product_id (required)
- qty (required)
- uom (from product)
- batch_number (required)
- manufacture_date (optional)
- expiry_date (optional)
- location_id (required)

**When** saving
**Then** LP created with status = 'available'

**Prerequisites:** Epic 1, Epic 2

**Technical Notes:**
- LP number format configurable
- API: GET/POST/PUT /api/warehouse/license-plates

---

## Story 5.2: LP Status Tracking

As a **Warehouse user**,
I want to track LP status,
So that I know availability.

**Acceptance Criteria:**

**Given** LP exists
**Then** has status:
- available: can be consumed/shipped
- reserved: reserved for WO/TO
- consumed: fully consumed
- quarantine: quality hold
- shipped: sent out

**When** status changes
**Then** timestamp and user recorded

**Prerequisites:** Story 5.1

**Technical Notes:**
- Status affects availability queries

---

## Story 5.3: LP Batch/Expiry Tracking

As a **Warehouse user**,
I want to track batch and expiry,
So that I can manage FIFO/FEFO.

**Acceptance Criteria:**

**Given** LP is created
**Then** stores:
- batch_number (required)
- supplier_batch_number (optional)
- manufacture_date (optional)
- expiry_date (optional)

**When** searching LPs
**Then** can filter by expiry date
**And** expired LPs highlighted in red

**Prerequisites:** Story 5.1

**Technical Notes:**
- FEFO: First Expired First Out
- Sort by expiry_date for picking suggestions

---

## Story 5.4: LP Number Generation

As a **System**,
I want to auto-generate LP numbers,
So that they are unique and meaningful.

**Acceptance Criteria:**

**Given** new LP is created
**When** lp_number not provided
**Then** auto-generate format: LP-{date}-{sequence}

**And** sequence per day
**And** globally unique

**Admin** can configure format in Settings

**Prerequisites:** Story 5.1

**Technical Notes:**
- Format stored in warehouse_settings
- Example: LP-20250120-0001

---

## Story 5.5: LP Split

As a **Warehouse user**,
I want to split an LP into smaller quantities,
So that I can partially use inventory.

**Acceptance Criteria:**

**Given** LP has qty > split qty
**When** clicking "Split"
**Then** modal asks for split qty

**When** confirming
**Then** original LP qty decreased
**And** new LP created with split qty
**And** genealogy recorded: parent_lp_id = original

**And** new LP inherits: product, batch, expiry, location

**Prerequisites:** Story 5.1

**Technical Notes:**
- New LP gets new lp_number
- API: POST /api/warehouse/license-plates/:id/split

---

## Story 5.6: LP Merge

As a **Warehouse user**,
I want to merge LPs of same product/batch,
So that I can consolidate inventory.

**Acceptance Criteria:**

**Given** multiple LPs with same product and batch
**When** selecting LPs and clicking "Merge"
**Then** modal shows total qty

**When** confirming
**Then** target LP qty increased
**And** source LPs status → 'merged'
**And** genealogy recorded

**Prerequisites:** Story 5.1

**Technical Notes:**
- Validation: same product_id, batch_number
- API: POST /api/warehouse/license-plates/merge

---

## Story 5.7: LP Genealogy Tracking

As a **System**,
I want to track LP relationships,
So that traceability is complete.

**Acceptance Criteria:**

**Given** LP operations occur
**Then** lp_genealogy records:
- parent_lp_id
- child_lp_id
- wo_id (if from production)
- operation_type (split, merge, consume, produce)
- timestamp

**Prerequisites:** Stories 5.5, 5.6

**Technical Notes:**
- Enables forward/backward tracing
- Links to Epic 2 traceability features

---

## Story 5.8: ASN Creation

As a **Warehouse user**,
I want to create ASN for incoming shipments,
So that I can prepare for receiving.

**Acceptance Criteria:**

**Given** PO exists with status Confirmed+
**When** clicking "Create ASN" on PO
**Then** modal opens with:
- po_id (pre-filled)
- expected_arrival_date
- carrier
- tracking_number

**And** ASN items from PO lines

**When** saving
**Then** ASN created
**And** linked to PO

**Prerequisites:** Story 3.1

**Technical Notes:**
- API: GET/POST /api/warehouse/asns

---

## Story 5.9: ASN Item Management

As a **Warehouse user**,
I want to manage ASN items,
So that I know what's arriving.

**Acceptance Criteria:**

**Given** ASN is created
**Then** items from PO lines:
- product_id, quantity, uom
- supplier_batch_number (can edit)
- manufacture_date (can edit)
- expiry_date (can edit)

**And** can adjust quantities if partial shipment

**Prerequisites:** Story 5.8

**Technical Notes:**
- Pre-fill from supplier metadata if available

---

## Story 5.10: Over-Receipt Validation

As a **System**,
I want to validate receiving against PO,
So that we don't receive more than ordered.

**Acceptance Criteria:**

**Given** receiving against PO
**When** received_qty would exceed ordered_qty
**Then** system warns (or blocks if configured)

**And** shows: Ordered: X, Already Received: Y, Receiving: Z

**Prerequisites:** Story 5.8

**Technical Notes:**
- Toggle in warehouse_settings.allow_over_receipt

---

## Story 5.11: GRN and LP Creation

As a **Warehouse user**,
I want to receive goods and create LPs,
So that inventory is recorded.

**Acceptance Criteria:**

**Given** ASN exists (or ad-hoc receiving)
**When** clicking "Receive"
**Then** GRN created
**And** for each item:
- LP created with qty, batch, expiry
- Location from warehouse default or selected
- QA status assigned

**And** GRN items linked to LPs

**Prerequisites:** Story 5.8

**Technical Notes:**
- API: POST /api/warehouse/grns

---

## Story 5.12: Auto-Print Labels

As a **Warehouse user**,
I want labels to print automatically,
So that I can label inventory quickly.

**Acceptance Criteria:**

**Given** LP is created during receiving
**When** auto-print enabled
**Then** ZPL label sent to configured printer

**Label includes:**
- LP number (barcode)
- Product code and name
- Batch number
- Expiry date
- Quantity and UoM

**Prerequisites:** Story 5.11

**Technical Notes:**
- ZPL format in Settings
- Printer configured per warehouse/location

---

## Story 5.13: Update PO/TO Received Qty

As a **System**,
I want to update PO/TO quantities on receiving,
So that status is accurate.

**Acceptance Criteria:**

**Given** GRN is created from PO
**When** goods received
**Then** po_line.received_qty updated

**When** all lines received >= ordered
**Then** PO status → Closed

**Same logic for TO** with received_qty

**Prerequisites:** Story 5.11

**Technical Notes:**
- Automatic status transition

---

## Story 5.14: LP Location Move

As a **Warehouse user**,
I want to move LPs between locations,
So that inventory is in the right place.

**Acceptance Criteria:**

**Given** LP exists
**When** clicking "Move"
**Then** modal shows:
- Current location
- Destination location (dropdown)
- Reason (optional)

**When** confirming
**Then** LP.location_id updated
**And** stock_move record created
**And** audit trail entry

**Prerequisites:** Story 5.1

**Technical Notes:**
- API: POST /api/warehouse/stock-moves

---

## Story 5.15: Movement Audit Trail

As a **Warehouse Manager**,
I want to see movement history,
So that I can track where things went.

**Acceptance Criteria:**

**Given** the user navigates to /warehouse/stock-moves
**Then** they see history:
- LP number
- From location → To location
- Timestamp
- User
- Movement type

**And** can filter by LP, location, date, user

**Prerequisites:** Story 5.14

**Technical Notes:**
- stock_moves table
- API: GET /api/warehouse/stock-moves

---

## Story 5.16: Partial Move (Split on Move)

As a **Warehouse user**,
I want to move partial qty,
So that I can split during movement.

**Acceptance Criteria:**

**Given** LP has qty > move qty
**When** moving partial
**Then** system performs split first
**And** then moves new LP

**Or** shows option to move full LP

**Prerequisites:** Story 5.5, Story 5.14

**Technical Notes:**
- Combines split + move in one operation

---

## Story 5.17: Destination Validation

As a **System**,
I want to validate move destinations,
So that inventory goes to correct locations.

**Acceptance Criteria:**

**Given** LP is being moved
**When** destination is selected
**Then** validate:
- Location is active
- Location type allows storage
- Same warehouse (or via TO for cross-warehouse)

**Prerequisites:** Story 5.14

**Technical Notes:**
- Location types: Receiving, Storage, Production, Shipping

---

## Story 5.18: Movement Types

As a **Warehouse Manager**,
I want to categorize movements,
So that I can analyze flow.

**Acceptance Criteria:**

**Given** stock move is recorded
**Then** has movement_type:
- Receiving (from GRN)
- Put-away (receiving → storage)
- Pick (storage → production/shipping)
- Transfer (between locations)
- Adjustment (qty correction)

**Prerequisites:** Story 5.14

**Technical Notes:**
- Affects reporting and analytics

---

## Story 5.19: Pallet Creation

As a **Warehouse user**,
I want to create pallets,
So that I can group LPs.

**Acceptance Criteria:**

**Given** the user navigates to /warehouse/pallets
**When** clicking "Create Pallet"
**Then** modal opens with:
- pallet_number (auto-generated)
- location_id (required)
- notes (optional)

**When** saving
**Then** pallet created with status = 'open'

**Prerequisites:** Story 5.1

**Technical Notes:**
- API: GET/POST /api/warehouse/pallets

---

## Story 5.20: Pallet LP Management

As a **Warehouse user**,
I want to add/remove LPs from pallets,
So that I can organize inventory.

**Acceptance Criteria:**

**Given** pallet exists and is open
**When** adding LP
**Then** LP assigned to pallet
**And** LP moves to pallet location

**When** removing LP
**Then** LP unassigned from pallet

**And** pallet shows: LP count, total qty

**Prerequisites:** Story 5.19

**Technical Notes:**
- pallet_items table
- API: POST/DELETE /api/warehouse/pallets/:id/items

---

## Story 5.21: Pallet Move

As a **Warehouse user**,
I want to move entire pallets,
So that I can relocate grouped inventory.

**Acceptance Criteria:**

**Given** pallet with LPs
**When** moving pallet
**Then** all LPs move together
**And** all LP.location_id updated
**And** stock_moves created for each LP

**Prerequisites:** Story 5.19, Story 5.14

**Technical Notes:**
- Single move operation for pallet

---

## Story 5.22: Pallet Status

As a **Warehouse user**,
I want to track pallet status,
So that I know availability.

**Acceptance Criteria:**

**Given** pallet exists
**Then** has status:
- open: can add/remove LPs
- closed: ready for shipping
- shipped: sent out

**When** closing pallet
**Then** cannot modify contents

**Prerequisites:** Story 5.19

**Technical Notes:**
- Status affects operations allowed

---

## Story 5.23: Scanner Guided Workflows

As an **Operator**,
I want guided scanner workflows,
So that I don't make mistakes.

**Acceptance Criteria:**

**Given** the user opens scanner
**Then** sees workflow menu:
- Receive
- Put-away
- Pick for WO
- Move

**Each workflow** guides step-by-step with:
- What to scan
- Expected value
- Validation feedback
- Next step

**Prerequisites:** Epic 5, Epic 4

**Technical Notes:**
- State machine per workflow
- Touch-optimized UI

---

## Story 5.24: Scanner Barcode Validation

As a **System**,
I want to validate scanned barcodes,
So that correct items are processed.

**Acceptance Criteria:**

**Given** operator scans barcode
**When** barcode matches expected
**Then** shows ✅ green confirmation
**And** proceeds to next step

**When** barcode doesn't match
**Then** shows ❌ red error
**And** shows expected vs scanned
**And** blocks until correct

**Prerequisites:** Story 5.23

**Technical Notes:**
- Barcode formats: LP, Location, Product, WO

---

## Story 5.25: Scanner Feedback

As an **Operator**,
I want clear feedback on scanner,
So that I know operation status.

**Acceptance Criteria:**

**Given** scanner operation completes
**Then** shows:
- ✅ Success with details
- ❌ Error with reason
- ⚠️ Warning with option to proceed

**And** vibration/sound feedback (if enabled)
**And** auto-proceed after success (configurable delay)

**Prerequisites:** Story 5.23

**Technical Notes:**
- Haptic feedback API
- Settings: feedback type, auto-proceed delay

---

## Story 5.26: Scanner Operations Menu

As an **Operator**,
I want quick access to scanner operations,
So that I can work efficiently.

**Acceptance Criteria:**

**Given** the user opens /scanner
**Then** sees large buttons:
- Receive (from ASN/PO)
- Consume (for WO)
- Output (for WO)
- Move (location to location)
- Inventory Count

**Each** opens respective workflow

**Prerequisites:** Story 5.23

**Technical Notes:**
- Touch targets: minimum 48px

---

## Story 5.27: Scanner Session Timeout

As a **System**,
I want to timeout inactive sessions,
So that security is maintained.

**Acceptance Criteria:**

**Given** scanner is idle for X minutes
**Then** shows timeout warning
**And** after additional Y seconds → logout

**When** activity detected
**Then** timer resets

**Prerequisites:** Story 5.23

**Technical Notes:**
- Default: 5 min idle, 30 sec warning
- Settings: timeout duration

---

## Story 5.28: Forward/Backward Traceability

As a **QC Manager**,
I want to trace LP relationships,
So that I can investigate issues.

**Acceptance Criteria:**

**Given** viewing LP detail
**When** clicking "Trace Forward"
**Then** shows all child LPs and outputs

**When** clicking "Trace Backward"
**Then** shows all parent LPs and sources

**Prerequisites:** Story 5.7

**Technical Notes:**
- Links to Epic 2 traceability stories
- Recursive query on lp_genealogy

---

## Story 5.29: Genealogy Recording

As a **System**,
I want to record all LP relationships,
So that traceability is complete.

**Acceptance Criteria:**

**Given** LP operation occurs
**Then** lp_genealogy records:
- Split: parent → child
- Merge: sources → target
- Consume: input → (to be filled with output)
- Produce: (filled from consume) → output

**And** includes: wo_id, timestamp, operation_type

**Prerequisites:** Story 5.7

**Technical Notes:**
- Every LP transformation creates genealogy record

---

## Story 5.30: Source Document Linking

As a **Warehouse user**,
I want LPs linked to source documents,
So that I can trace origin.

**Acceptance Criteria:**

**Given** LP is created
**Then** stores source info:
- source: 'receiving', 'production', 'transfer', 'manual'
- po_id / grn_id / wo_id / to_id as applicable

**When** viewing LP
**Then** can click to view source document

**Prerequisites:** Story 5.11, Story 4.12

**Technical Notes:**
- Polymorphic reference to source

---

## Story 5.31: Warehouse Settings Configuration

As an **Admin**,
I want to configure Warehouse module settings,
So that operations match our process.

**Acceptance Criteria:**

**Given** Admin navigates to /settings/warehouse
**Then** can configure:
- LP number format
- Auto-print on receive
- Allow over-receipt
- Scanner timeout
- Barcode formats

**Prerequisites:** Epic 1

**Technical Notes:**
- warehouse_settings table
- API: GET/PUT /api/warehouse/settings

---

## Story 5.32: Receive from PO (Desktop)

As a **Warehouse user**,
I want to receive goods against PO from desktop,
So that I can process deliveries.

**Acceptance Criteria:**

**Given** the user navigates to /warehouse/receiving
**When** selecting PO
**Then** shows PO lines with: product, ordered, received, remaining

**When** clicking "Receive"
**Then** can enter:
- qty per line
- batch_number
- expiry_date
- location

**When** confirming
**Then** GRN and LPs created

**Prerequisites:** Story 5.11

**Technical Notes:**
- Desktop alternative to scanner

---

## Story 5.33: Receive from TO (Desktop)

As a **Warehouse user**,
I want to receive goods from transfer order,
So that inter-warehouse transfers complete.

**Acceptance Criteria:**

**Given** TO is in Shipped status
**When** receiving
**Then** shows TO lines with: product, shipped, received

**When** confirming receipt
**Then** LP locations updated
**And** TO status → Received

**Prerequisites:** Story 3.6, Story 5.14

**Technical Notes:**
- LP already exists, just update location

---

## Story 5.34: Scanner Receive Workflow

As an **Operator**,
I want to receive via scanner,
So that I can work on the dock.

**Acceptance Criteria:**

**Workflow:**
1. Scan PO barcode
2. System shows items to receive
3. Scan product barcode (validation)
4. Enter qty
5. Enter batch/expiry (or scan)
6. Scan location barcode
7. Confirm → LP created, label printed
8. Next item or done

**Prerequisites:** Story 5.23

**Technical Notes:**
- Guided workflow with validation at each step

---

## Story 5.35: Inventory Count

As a **Warehouse user**,
I want to perform inventory counts,
So that I can verify accuracy.

**Acceptance Criteria:**

**Given** the user initiates count
**When** scanning location
**Then** shows expected LPs at location

**When** scanning each LP
**Then** confirms presence

**When** LP not scanned
**Then** marked as missing

**When** extra LP scanned
**Then** marked as found

**And** generates variance report

**Prerequisites:** Story 5.23

**Technical Notes:**
- API: POST /api/warehouse/inventory-counts
- Future: cycle counting feature

---

## FR Coverage

| FR ID | Requirement | Stories |
|-------|-------------|---------|
| WH-FR-01 | LP Creation with unique number | 5.1, 5.4 |
| WH-FR-02 | LP Status Tracking | 5.2 |
| WH-FR-03 | LP Batch/Expiry Tracking | 5.3 |
| WH-FR-04 | LP Number Generation | 5.4 |
| WH-FR-05 | LP Split with Genealogy | 5.5 |
| WH-FR-06 | LP Merge | 5.6 |
| WH-FR-07 | LP Genealogy Tracking | 5.7, 5.29 |
| WH-FR-08 | Receive from PO/TO | 5.11, 5.32, 5.33 |
| WH-FR-09 | ASN Pre-fill | 5.8, 5.9 |
| WH-FR-10 | Over-receipt Validation | 5.10 |
| WH-FR-11 | GRN and LP Creation | 5.11 |
| WH-FR-12 | Auto-print Labels | 5.12 |
| WH-FR-13 | Update PO/TO Received Qty | 5.13 |
| WH-FR-14 | LP Location Move | 5.14 |
| WH-FR-15 | Movement Audit Trail | 5.15 |
| WH-FR-16 | Partial Move (Split) | 5.16 |
| WH-FR-17 | Destination Validation | 5.17 |
| WH-FR-18 | Movement Types | 5.18 |
| WH-FR-19 | Pallet Creation | 5.19 |
| WH-FR-20 | Pallet LP Management | 5.20 |
| WH-FR-21 | Pallet Move | 5.21 |
| WH-FR-22 | Pallet Status | 5.22 |
| WH-FR-23 | Scanner Guided Workflows | 5.23 |
| WH-FR-24 | Scanner Barcode Validation | 5.24 |
| WH-FR-25 | Scanner Feedback | 5.25 |
| WH-FR-26 | Scanner Operations | 5.26 |
| WH-FR-27 | Scanner Session Timeout | 5.27 |
| WH-FR-28 | Forward/Backward Traceability | 5.28 |
| WH-FR-29 | Genealogy Recording | 5.29 |
| WH-FR-30 | Source Document Linking | 5.30 |

**Coverage:** 30 of 30 FRs (100%)
