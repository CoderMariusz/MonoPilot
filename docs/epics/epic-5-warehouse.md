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

**AC: Genealogy Integrity & Atomicity (Sprint 0 Gap 2)**

LP genealogy tracking ensures **FDA-compliant traceability** with guaranteed data integrity:

**Transaction Flow (Atomic Genealogy Creation):**

1. **START** database transaction
2. **VALIDATE** pre-conditions:
   - parent_lp_id exists in license_plates table (FK validation)
   - child_lp_id exists in license_plates table (FK validation)
   - Both LPs belong to same org_id (multi-tenant isolation)
   - wo_id exists if provided (FK validation)
   - operation_type is valid enum: 'split', 'merge', 'consume', 'produce'
   - No duplicate genealogy link (parent → child already exists)
3. **CHECK** for circular dependencies:
   - child_lp_id cannot be ancestor of parent_lp_id (prevent cycles)
   - Use recursive CTE to validate genealogy tree integrity
4. **INSERT** lp_genealogy record:
   - parent_lp_id, child_lp_id, wo_id, operation_type, created_at, created_by_user_id
5. **VERIFY** trace integrity:
   - Forward trace: parent → all descendants reachable
   - Backward trace: child → all ancestors reachable
6. **COMMIT** transaction

**Rollback Scenarios:**

**If ANY step fails** (FK violation, circular dependency, duplicate link):
- Transaction **ROLLBACK**
- **No genealogy record created** (maintain clean traceability tree)
- **Error message** displayed with specific failure reason

**Error Examples:**

| Failure Point | Error Message |
|---------------|---------------|
| Parent LP not exists | "Cannot create genealogy: Parent License Plate LP-001234 does not exist. Verify LP number." |
| Child LP not exists | "Cannot create genealogy: Child License Plate LP-005678 does not exist. Verify LP number." |
| Different orgs | "Cannot create genealogy: Parent and child LPs belong to different organizations. Cross-org genealogy not allowed." |
| Circular dependency | "Cannot create genealogy: Circular dependency detected. LP-001234 is already a descendant of LP-005678." |
| Duplicate link | "Cannot create genealogy: Link already exists between Parent LP-001234 and Child LP-005678." |
| Invalid WO | "Cannot create genealogy: Work Order #9999 does not exist or is not related to these LPs." |
| Invalid operation type | "Cannot create genealogy: Operation type 'transform' is invalid. Use: split, merge, consume, or produce." |

**FK Validation Rules (Gap 2 Critical):**

- ✅ parent_lp_id → license_plates.id (CASCADE DELETE blocked, must orphan children explicitly)
- ✅ child_lp_id → license_plates.id (CASCADE DELETE blocked)
- ✅ wo_id → work_orders.id (CASCADE DELETE blocked, genealogy is immutable audit trail)
- ✅ org_id → organizations.id (both parent and child must match)

**Trace Verification Integrity (Gap 2):**

After every genealogy insert, system verifies:

1. **Forward Traceability:**
   - FROM parent_lp → trace all descendants (children, grandchildren, etc.)
   - Verify no broken links (all descendants reachable via recursive query)
   - Use: `WITH RECURSIVE descendants AS (SELECT * FROM lp_genealogy WHERE parent_lp_id = X UNION...)`

2. **Backward Traceability:**
   - FROM child_lp → trace all ancestors (parents, grandparents, etc.)
   - Verify no broken links (all ancestors reachable via recursive query)
   - Use: `WITH RECURSIVE ancestors AS (SELECT * FROM lp_genealogy WHERE child_lp_id = X UNION...)`

3. **Orphan Detection:**
   - If parent LP is deleted → children become orphans
   - System flags orphaned LPs in UI: "⚠️ LP-005678: Parent LP-001234 no longer exists (orphaned)"
   - Orphaned LPs still tracked for audit purposes (do not cascade delete genealogy)

**Operation Type Semantics:**

| Operation Type | Parent LP | Child LP | WO Required | Use Case |
|----------------|-----------|----------|-------------|----------|
| **split** | Original LP | New split LPs | No | Split 100kg pallet → 2x 50kg pallets |
| **merge** | Multiple source LPs | New merged LP | No | Merge 2x 50kg pallets → 1x 100kg pallet |
| **consume** | Input material LP | Output finished good LP | Yes | WO consumes Flour LP → produces Bread LP |
| **produce** | Input material LP | Output finished good LP | Yes | Same as consume (legacy alias) |

**Data Integrity Guarantees (FDA Compliance):**

- ✅ Every consumed LP → linked to output LP via genealogy (full traceability)
- ✅ Every output LP → linked to all input LPs (backward trace)
- ✅ LP split → all child LPs linked to parent (forward trace)
- ✅ LP merge → all parent LPs linked to merged child (backward trace)
- ✅ Genealogy records immutable (no DELETE, no UPDATE, only INSERT)
- ✅ No circular dependencies (tree structure enforced)
- ✅ No cross-org genealogy (multi-tenant isolation)
- ❌ NEVER: Output LP without input LP genealogy (consumption)
- ❌ NEVER: Genealogy link without valid parent AND child LPs
- ❌ NEVER: Circular dependencies (A → B → C → A)
- ❌ NEVER: Broken traces (missing intermediate links)

**Recall Simulation (Forward + Backward Trace):**

**Scenario:** Recall all products affected by contaminated Flour batch LP-001234

1. **Forward Trace (Impact Analysis):**
   ```sql
   WITH RECURSIVE descendants AS (
     SELECT child_lp_id, operation_type, wo_id, 1 AS depth
     FROM lp_genealogy WHERE parent_lp_id = 'LP-001234'
     UNION ALL
     SELECT g.child_lp_id, g.operation_type, g.wo_id, d.depth + 1
     FROM lp_genealogy g
     JOIN descendants d ON g.parent_lp_id = d.child_lp_id
     WHERE d.depth < 10 -- prevent infinite loops
   )
   SELECT DISTINCT child_lp_id FROM descendants;
   ```
   **Result:** All downstream LPs (Bread, Pastry, etc.) that used contaminated Flour

2. **Backward Trace (Root Cause Analysis):**
   ```sql
   WITH RECURSIVE ancestors AS (
     SELECT parent_lp_id, operation_type, wo_id, 1 AS depth
     FROM lp_genealogy WHERE child_lp_id = 'LP-009876' -- contaminated Bread LP
     UNION ALL
     SELECT g.parent_lp_id, g.operation_type, g.wo_id, a.depth + 1
     FROM lp_genealogy g
     JOIN ancestors a ON g.child_lp_id = a.parent_lp_id
     WHERE a.depth < 10
   )
   SELECT DISTINCT parent_lp_id FROM ancestors;
   ```
   **Result:** All upstream LPs (Flour, Yeast, etc.) that contributed to contaminated Bread

**Concurrency Handling:**
- Use unique constraint on (parent_lp_id, child_lp_id) to prevent duplicate links
- Row-level locks not required (INSERT-only operation, no UPDATEs)
- If duplicate insert attempt: Silently succeed (link already exists, idempotent)

**Audit Trail:**
- All genealogy records include created_at timestamp and created_by_user_id
- Genealogy records are NEVER deleted (immutable audit trail for FDA inspections)
- If LP is deleted, genealogy records remain (with orphan flag for broken trace detection)

**Reference:**
- AC Template Checklist (.bmad/templates/ac-template-checklist.md § 4, § 6)
- Gap 2: LP Genealogy Integrity (docs/readiness-assessment/3-gaps-and-risks.md)
- FDA 21 CFR Part 117 (Food Safety Modernization Act - traceability requirements)

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

**AC: Transaction Atomicity (Sprint 0 Gap 6)**

GRN + LP creation is atomic (all-or-nothing guarantee):

**Transaction Flow:**
1. **START** database transaction
2. **INSERT** grn record
   - Validate FK: asn_id (if from ASN), supplier_id, warehouse_id, org_id
   - Auto-generate grn_number (GRN-YYYYMMDD-NNNN)
3. **INSERT** grn_items for each line
   - Validate FK: grn_id, product_id, org_id
4. **INSERT** license_plates for each item
   - Validate FK: grn_id, product_id, location_id, org_id
   - Auto-generate lp_number (per configured format)
   - Set initial qa_status (Pending or Passed per warehouse settings)
5. **UPDATE** asn.status → "Completed" (if GRN from ASN)
6. **UPDATE** po_line.received_qty += grn_qty (if linked to PO)
7. **COMMIT** transaction

**Rollback Scenarios:**

**If ANY step fails** (FK violation, unique constraint, validation error):
- Transaction **ROLLBACK**
- **No partial records created** (no GRN, no GRN items, no LPs, no ASN update, no PO update)
- **Error message** displayed to user with specific failure reason

**Error Examples:**

| Failure Point | Error Message |
|---------------|---------------|
| ASN not found | "Cannot create GRN: ASN #12345 no longer exists. Please refresh and try again." |
| Invalid supplier | "Cannot create GRN: Supplier is inactive or does not exist. Please select a valid supplier." |
| Invalid location | "Cannot create LP: Location 'WH-A-01' is inactive. Please select a different location." |
| Invalid product | "Cannot create LP: Product SKU 'ABC123' no longer exists. Please verify product catalog." |
| Duplicate LP# | "Cannot create LP: License Plate LP-001234 already exists. System will retry with next number." |
| PO update fails | "GRN creation aborted: Unable to update PO received quantity. Transaction rolled back." |

**Concurrency Handling:**
- Use row-level locks on ASN, PO during update (SELECT ... FOR UPDATE)
- Prevent duplicate GRN creation for same ASN (check ASN status before insert)
- If concurrent GRN attempt detected: "ASN #12345 is already being received. Please refresh."

**Data Integrity Guarantees:**
- ✅ GRN exists → All LPs exist
- ✅ LP exists → Parent GRN exists
- ✅ ASN marked Completed → GRN exists with all items
- ✅ PO received_qty updated → GRN exists
- ❌ NEVER: GRN without LPs
- ❌ NEVER: LP without GRN
- ❌ NEVER: ASN Completed without GRN

**Reference:** AC Template Checklist (.bmad/templates/ac-template-checklist.md § 6)

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

## Story 5.36: Scanner Offline Queue Management (Sprint 0 - Gap 5)

As an **Operator**,
I want the scanner to queue operations while offline,
So that I can continue working during network outages without losing data.

**Acceptance Criteria:**

**AC 1: Offline Queue Capacity Limits**

**Given** Scanner PWA is offline (network disconnected)
**And** Operator performing warehouse operations (receive, consume, move)

**When** operations are executed while offline
**Then** verify queue management:
- ✅ Operations stored in IndexedDB (browser local storage)
- ✅ Max capacity: 100 offline operations
- ⚠️ Warning at 80 operations: **"80/100 offline operations queued. Reconnect to sync soon."**
- ❌ Block at 100 operations: **"Offline queue full (100/100). Please reconnect to sync before continuing."**
- ✅ Each operation stores: operation_type, payload, timestamp, user_id, retry_count

**Operation Types Supported Offline:**
- Receive (GRN + LP creation)
- Consume (WO material consumption)
- Output (WO output recording)
- LP Move (location change)
- LP Split
- Inventory Count

**Prerequisites:** Story 5.23

**Technical Notes:**
- IndexedDB key: `scanner_offline_queue_{org_id}_{user_id}`
- Queue structure: Array of operation objects with timestamps
- Warning threshold: 80%, Block threshold: 100%

---

**AC 2: Offline Queue UI Indicators**

**Given** Scanner PWA with queued offline operations

**When** viewing scanner interface
**Then** verify UI indicators:
- ✅ Network status badge: **"🔴 Offline"** (red) or **"🟢 Online"** (green)
- ✅ Queue counter badge: **"📦 Queue: 23"** (always visible when offline operations exist)
- ✅ Sync status indicator: **"⏳ Syncing..."** (during sync) or **"✅ Synced"** (when complete)
- ⚠️ Warning banner at 80 operations: **"80/100 operations queued. Reconnect to sync."**
- ❌ Error banner at 100 operations: **"Queue full. Sync required before continuing."**

**UI Placement:**
- Network status: Top-right corner (persistent)
- Queue counter: Top-center (persistent when >0 operations)
- Sync status: Top-center (during sync only)
- Warning/error banners: Full-width at top

**Prerequisites:** Story 5.23

**Technical Notes:**
- Real-time queue count updates (on every operation)
- Network status via `navigator.onLine` + periodic ping to server

---

**AC 3: Automatic Sync on Reconnect**

**Given** Scanner PWA with 50 queued offline operations
**And** Network connection restored

**When** connection detected
**Then** verify automatic sync:
- ✅ Sync starts within 2 seconds of reconnection
- ✅ UI shows: **"⏳ Syncing 50 operations..."**
- ✅ Operations synced in order (FIFO: First In First Out)
- ✅ Progress indicator: **"Syncing 10/50... 20/50... 30/50..."**
- ✅ Sync completes: **"✅ All 50 operations synced successfully"**
- ✅ Queue cleared after successful sync
- ✅ IndexedDB offline queue emptied

**Sync Strategy:**
- Batch size: 10 operations per API call (for performance)
- Retry on failure: 3 attempts with exponential backoff (2s, 4s, 8s)
- If batch fails after 3 attempts: Mark operations as failed, continue with next batch

**Prerequisites:** Story 5.23

**Technical Notes:**
- API: POST /api/scanner/sync-offline-queue (bulk endpoint)
- Request payload: Array of operations (max 10 per request)
- Connection detection: `window.addEventListener('online', handleOnline)`

---

**AC 4: Partial Sync with Failure Handling**

**Given** Scanner PWA with 100 queued operations
**And** Network reconnects but some operations fail validation (e.g., LP no longer exists)

**When** sync executes
**Then** verify failure handling:
- ✅ Operations 1-70: Sync successfully
- ❌ Operation 71: Fails (LP-001 no longer exists) → Marked as failed, moved to failed queue
- ✅ Operations 72-100: Continue syncing (don't block entire queue)
- ✅ UI shows: **"⚠️ 70/100 synced. 1 failed. 29 remaining."**
- ✅ Failed operations shown in "Failed Queue" section (separate UI)
- ✅ User can review failed operations and retry manually or discard

**Failed Queue UI:**
- Shows: Operation type, timestamp, error message, payload
- Actions: "Retry" or "Discard"
- Example: **"❌ LP Move failed: LP-001 no longer exists. (2025-01-20 14:32)"**

**Prerequisites:** Story 5.23

**Technical Notes:**
- Failed operations stored in separate IndexedDB key: `scanner_failed_queue`
- Max failed queue size: 50 operations (auto-purge oldest after 7 days)

---

**AC 5: Manual Sync Trigger**

**Given** Scanner PWA with queued operations
**And** Network connection available

**When** Operator clicks "Sync Now" button
**Then** verify manual sync:
- ✅ Sync starts immediately (even if <80 operations)
- ✅ UI shows progress indicator
- ✅ Sync completes with success/failure summary
- ✅ Button disabled during sync (prevent double-click)
- ✅ Button re-enabled after sync complete

**Button Placement:**
- Top-right corner next to network status badge
- Only visible when offline queue has >0 operations

**Prerequisites:** Story 5.23

**Technical Notes:**
- Same sync logic as AC 3 (automatic sync)
- Button: "Sync Now (23)" showing queue count

---

**AC 6: Queue Persistence Across App Restarts**

**Given** Scanner PWA with 30 queued operations
**And** Operator closes browser/app

**When** Operator reopens scanner
**Then** verify queue persistence:
- ✅ All 30 operations still in queue (loaded from IndexedDB)
- ✅ UI shows: **"📦 Queue: 30"** (restored state)
- ✅ Operations maintain order (FIFO preserved)
- ✅ If online: Auto-sync starts within 5 seconds

**Prerequisites:** Story 5.23

**Technical Notes:**
- IndexedDB persists across app restarts (browser storage)
- On app load: Check IndexedDB for pending operations, restore queue state

---

**AC 7: Offline Operation Timestamps**

**Given** Scanner PWA offline for 2 hours
**And** Operator performs 50 operations during offline period

**When** operations sync
**Then** verify timestamps:
- ✅ Each operation records: `performed_at` (when operator executed) and `synced_at` (when uploaded to server)
- ✅ Server respects `performed_at` timestamp for audit trail (not `synced_at`)
- ✅ Example: Operation performed at 10:00 AM, synced at 12:00 PM → Audit log shows 10:00 AM
- ✅ UI shows both timestamps in Failed Queue: **"Performed: 10:00 AM, Synced: 12:00 PM"**

**Prerequisites:** Story 5.23

**Technical Notes:**
- Timestamps stored in ISO 8601 format with timezone
- Server validates: `performed_at` cannot be in future

---

**AC 8: Multi-User Queue Isolation**

**Given** 2 operators using same scanner device with different user accounts
**And** User A has 20 queued operations, User B has 15 queued operations

**When** each user logs in
**Then** verify queue isolation:
- ✅ User A sees: **"📦 Queue: 20"** (only their operations)
- ✅ User B sees: **"📦 Queue: 15"** (only their operations)
- ✅ Queues stored separately: `scanner_offline_queue_{org_id}_UserA`, `scanner_offline_queue_{org_id}_UserB`
- ✅ On sync: Only current user's queue synced (not other users)

**Prerequisites:** Story 5.23

**Technical Notes:**
- Queue keys include user_id for isolation
- On logout: Queue persists (not cleared)

---

**AC 9: Queue Size Warning in Settings**

**Given** Admin navigates to /settings/scanner
**Then** verify configurable queue settings:
- ✅ Max queue size (default: 100, range: 50-500)
- ✅ Warning threshold % (default: 80%, range: 50-90%)
- ✅ Auto-sync on reconnect (default: enabled, toggle)
- ✅ Sync batch size (default: 10, range: 5-50)
- ✅ Failed queue retention days (default: 7, range: 1-30)

**When** Admin changes max queue size to 200
**Then** verify:
- ✅ Scanner now allows 200 operations before blocking
- ✅ Warning threshold updates: 80% of 200 = 160 operations

**Prerequisites:** Story 5.31

**Technical Notes:**
- Settings stored in `warehouse_settings` table
- Settings synced to scanner on load

---

**AC 10: E2E Test - 100 Offline Operations + Sync**

**Test Scenario: Full Queue Capacity**

**Given** Scanner PWA offline
**When** Operator performs 100 consecutive operations:
1. Receive 50 LPs (from PO)
2. Consume 30 LPs (for WO)
3. Move 15 LPs (location change)
4. Split 5 LPs

**Then** verify offline queue:
- ✅ All 100 operations stored in IndexedDB
- ✅ UI shows: **"⚠️ Queue full (100/100). Sync required."**
- ❌ 101st operation blocked: **"Offline queue full. Please reconnect."**

**When** network reconnects
**Then** verify sync:
- ✅ Auto-sync starts within 2 seconds
- ✅ UI shows: **"⏳ Syncing 100 operations..."**
- ✅ Progress updates: 10/100, 20/100, ..., 100/100
- ✅ All 100 operations synced successfully within 30 seconds
- ✅ Database verification:
  - 50 GRNs created with 50 LPs (receive operations)
  - 30 wo_consumption records created (consume operations)
  - 15 lp_movements records created (move operations)
  - 5 LP split records + genealogy (split operations)
- ✅ Queue cleared: UI shows **"✅ All operations synced"**
- ✅ IndexedDB offline queue empty

**Performance Target:**
- ✅ 100 operations sync in <30 seconds (batches of 10 = 10 API calls)
- ✅ No data loss (100% success rate for valid operations)

**Prerequisites:** Story 5.23, Story 5.11, Story 4.7, Story 5.14, Story 5.5

**Technical Notes:**
- E2E test file: `e2e/integration/scanner-offline-queue.spec.ts`
- Mock network offline: `page.context().setOffline(true)`
- Mock network online: `page.context().setOffline(false)`

---

## Success Criteria (Story 5.36)

- ✅ All 10 ACs implemented and tested
- ✅ Max 100 offline operations enforced (configurable)
- ✅ Warning at 80% capacity (configurable threshold)
- ✅ UI shows queue size, sync status, network status
- ✅ Auto-sync on reconnect within 2 seconds
- ✅ Manual sync trigger available
- ✅ Queue persists across app restarts
- ✅ Failed operations moved to separate queue for manual review
- ✅ E2E test: 100 offline ops → sync → 100% success
- ✅ Performance: 100 operations sync in <30 seconds

**Reference:** Gap 5 (Scanner Offline Queue Management) - docs/readiness-assessment/3-gaps-and-risks.md

---

## FR Coverage Matrix

This section maps all Functional Requirements from the Warehouse Module (PRD) to their implementing stories, ensuring 100% traceability.

| FR ID | FR Title | Story IDs | Status | Notes |
|-------|----------|-----------|--------|-------|
| WH-FR-01 | LP Creation with unique number | 5.1, 5.4 | ✅ Covered | License Plate creation + auto-numbering |
| WH-FR-02 | LP Status Tracking | 5.2 | ✅ Covered | Available, Reserved, QA Hold, Consumed |
| WH-FR-03 | LP Batch/Expiry Tracking | 5.3 | ✅ Covered | Batch number, MFG/EXP dates |
| WH-FR-04 | LP Number Generation | 5.4 | ✅ Covered | Configurable LP# format |
| WH-FR-05 | LP Split with Genealogy | 5.5 | ✅ Covered | Split LP with parent-child link |
| WH-FR-06 | LP Merge | 5.6 | ✅ Covered | Merge multiple LPs |
| WH-FR-07 | LP Genealogy Tracking | 5.7, 5.29 | ✅ Covered | FDA traceability (Sprint 0 Gap 2: ACs update) |
| WH-FR-08 | Receive from PO/TO | 5.11, 5.32, 5.33, 5.34 | ✅ Covered | Desktop + Scanner receiving workflows |
| WH-FR-09 | ASN Pre-fill | 5.8, 5.9 | ✅ Covered | ASN creation + item management |
| WH-FR-10 | Over-receipt Validation | 5.10 | ✅ Covered | Prevent over-receiving |
| WH-FR-11 | GRN and LP Creation | 5.11 | ✅ Covered | Atomic GRN+LP (Sprint 0 Gap 6: Atomicity AC) |
| WH-FR-12 | Auto-print Labels | 5.12 | ✅ Covered | Print LP labels on creation |
| WH-FR-13 | Update PO/TO Received Qty | 5.13 | ✅ Covered | Update source document qty |
| WH-FR-14 | LP Location Move | 5.14 | ✅ Covered | Move LP between locations |
| WH-FR-15 | Movement Audit Trail | 5.15 | ✅ Covered | Track all LP movements |
| WH-FR-16 | Partial Move (Split) | 5.16 | ✅ Covered | Split LP during move |
| WH-FR-17 | Destination Validation | 5.17 | ✅ Covered | Validate target location |
| WH-FR-18 | Movement Types | 5.18 | ✅ Covered | Putaway, Pick, Transfer, Adjust |
| WH-FR-19 | Pallet Creation | 5.19 | ✅ Covered | Create pallets (containers) |
| WH-FR-20 | Pallet LP Management | 5.20 | ✅ Covered | Add/remove LPs from pallet |
| WH-FR-21 | Pallet Move | 5.21 | ✅ Covered | Move entire pallet |
| WH-FR-22 | Pallet Status | 5.22 | ✅ Covered | Pallet status tracking |
| WH-FR-23 | Scanner Guided Workflows | 5.23 | ✅ Covered | Step-by-step scanner UX |
| WH-FR-24 | Scanner Barcode Validation | 5.24 | ✅ Covered | Real-time barcode validation |
| WH-FR-25 | Scanner Feedback | 5.25 | ✅ Covered | Visual/audio feedback |
| WH-FR-26 | Scanner Operations | 5.26 | ✅ Covered | Scanner menu for all operations |
| WH-FR-27 | Scanner Session Timeout | 5.27 | ✅ Covered | Auto-logout, offline support |
| WH-FR-28 | Forward/Backward Traceability | 5.28 | ✅ Covered | Trace LP usage (forward/backward) |
| WH-FR-29 | Genealogy Recording | 5.29 | ✅ Covered | Record parent-child relationships |
| WH-FR-30 | Source Document Linking | 5.30 | ✅ Covered | Link LP to PO/TO/WO |

**Coverage Summary:**
- **Total FRs:** 30 (all P0)
- **P0 FRs Covered:** 30/30 (100%)
- **Total Stories:** 35 (includes technical/UX stories: 5.31, 5.34, 5.35)

**Validation:**
- ✅ All P0 functional requirements have at least one implementing story
- ✅ No orphaned stories (all stories trace back to FRs or technical requirements)
- ✅ WH-FR-07 flagged for Sprint 0 Gap 2 (LP Genealogy Integrity ACs)
- ✅ WH-FR-11 flagged for Sprint 0 Gap 6 (GRN+LP Transaction Atomicity)
- ✅ Story 5.7 critical for FDA compliance (genealogy tracking)

**Reverse Traceability (Story → FR):**
- Story 5.1 → WH-FR-01
- Story 5.2 → WH-FR-02
- Story 5.3 → WH-FR-03
- Story 5.4 → WH-FR-01, WH-FR-04
- Story 5.5 → WH-FR-05
- Story 5.6 → WH-FR-06
- Story 5.7 → WH-FR-07 (Sprint 0 Gap 2: Update ACs for error handling, atomicity, FK validation)
- Story 5.8 → WH-FR-09
- Story 5.9 → WH-FR-09
- Story 5.10 → WH-FR-10
- Story 5.11 → WH-FR-08, WH-FR-11 (Sprint 0 Gap 6: Add Transaction Atomicity AC)
- Story 5.12 → WH-FR-12
- Story 5.13 → WH-FR-13
- Story 5.14 → WH-FR-14
- Story 5.15 → WH-FR-15
- Story 5.16 → WH-FR-16
- Story 5.17 → WH-FR-17
- Story 5.18 → WH-FR-18
- Story 5.19 → WH-FR-19
- Story 5.20 → WH-FR-20
- Story 5.21 → WH-FR-21
- Story 5.22 → WH-FR-22
- Story 5.23 → WH-FR-23
- Story 5.24 → WH-FR-24
- Story 5.25 → WH-FR-25
- Story 5.26 → WH-FR-26
- Story 5.27 → WH-FR-27
- Story 5.28 → WH-FR-28
- Story 5.29 → WH-FR-07, WH-FR-29
- Story 5.30 → WH-FR-30
- Story 5.31 → Technical (Warehouse Settings Configuration)
- Story 5.32 → WH-FR-08 (Desktop Receive from PO)
- Story 5.33 → WH-FR-08 (Desktop Receive from TO)
- Story 5.34 → WH-FR-08 (Scanner Receive Workflow)
- Story 5.35 → Technical (Inventory Count - future cycle counting)

**Sprint 0 Gap References:**
- **Gap 2 (LP Genealogy Integrity):** Story 5.7 requires enhanced ACs for transaction rollback, FK validation, trace verification
- **Gap 6 (Transaction Atomicity):** Story 5.11 (GRN+LP) requires atomic creation with rollback on failure

---
