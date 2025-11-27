# Epic 5 Batch B: Stories Implementation
## Stock Movement & Pallets

**Batch:** 5B
**Stories:** 5.14 - 5.22 (9 stories)
**Status:** Drafted
**Effort:** ~55-70 hours

---

## Story 5.14: LP Location Move

**User Story:**
> As a **Warehouse user**, I want to move LPs between locations, so that inventory is in the right place.

**Story Points:** 5

### Acceptance Criteria

#### AC 1: Move LP Modal
- **Given** viewing LP detail
- **When** clicking "Move LP" button
- **Then** modal opens with:
  - Current Location (read-only): "WH-A-01 (Storage)"
  - Destination Location (required, dropdown with warehouse locations)
  - Reason (optional, text field)
  - "Move" button

#### AC 2: Move LP
- **Given** form filled with valid destination
- **When** clicking "Move"
- **Then**:
  - Update LP: location_id = destination_location_id
  - Create stock_move record:
    - lp_id, from_location, to_location, movement_type (default: 'transfer')
    - reason (if provided), created_by_user_id, timestamp
  - Show success: "LP LP-20250127-0001 moved to WH-A-02 (Production)"
  - Close modal, refresh LP detail

#### AC 3: Stock Move Record
- **Given** LP moved
- **When** checking database
- **Then** stock_moves table has record with:
  - license_plate_id (FK)
  - from_location_id (FK)
  - to_location_id (FK)
  - created_at, created_by_user_id
  - movement_type = 'transfer' (or type from Story 5.18)
  - quantity (from LP.quantity at time of move)

#### AC 4: Validation
- **Given** move request
- **When** validating
- **Then** reject if:
  - LP not found
  - Location not found or inactive
  - Source = destination (same location)

### Technical Tasks

**Backend**
- [ ] Implement POST /api/warehouse/stock-moves
  - Accept lp_id, to_location_id, reason (optional)
  - Validate LP exists, location exists and active
  - Update LP.location_id
  - Create stock_move record
  - Return updated LP + move record

**Database**
- [ ] Create stock_moves table (see tech-spec)
- [ ] Add FKs: lp_id, from_location_id, to_location_id
- [ ] Create RLS policies (org_id isolation)

**Frontend**
- [ ] Create MoveLPModal component
  - Location dropdown with search
  - Reason field
  - "Move" button with loading state

- [ ] Add "Move LP" button to LP detail page
- [ ] Auto-refresh LP location after move

**Tests**
- [ ] Unit: location validation
- [ ] Integration: update LP + create stock_move
- [ ] E2E: move LP, verify in detail page and stock_moves list

### Definition of Done
- ✅ LP location updated
- ✅ stock_move record created
- ✅ Cannot move to same location
- ✅ Cannot move to inactive location
- ✅ E2E: move LP → see in movement history

**Dependencies:** Requires Batch 5A (License Plates)
**Estimated Effort:** 5 hours

---

## Story 5.15: Movement Audit Trail

**User Story:**
> As a **Warehouse Manager**, I want to see movement history, so that I can track where things went.

**Story Points:** 5

### Acceptance Criteria

#### AC 1: Movement History Page
- **Given** navigating to /warehouse/stock-moves
- **When** page loads
- **Then** display table with columns:
  - Date (sortable, descending by default)
  - LP Number (link to LP)
  - From Location
  - To Location
  - Movement Type
  - Qty Moved
  - Reason
  - User (who moved)

#### AC 2: Filter Options
- **Given** on stock-moves page
- **When** user applies filters
- **Then** can filter by:
  - LP Number (autocomplete search)
  - Location (from or to)
  - Movement Type
  - Date Range
  - User

#### AC 3: LP Movement History
- **Given** viewing LP detail page
- **When** scrolling to "Movement History" section
- **Then** show mini table:
  - Last 10 moves for this LP
  - Date, From Location, To Location, User
  - Link to full stock-moves page for this LP

#### AC 4: Export Option
- **Given** on stock-moves page
- **When** clicking "Export as CSV"
- **Then** download CSV with all visible columns and filtered data

### Technical Tasks

**Backend**
- [ ] Implement GET /api/warehouse/stock-moves
  - Support filters: lp_id, from_location_id, to_location_id, movement_type, date_from, date_to, user_id
  - Support sorting: created_at (default desc), lp_number
  - Return paginated results (50 per page)

- [ ] Implement GET /api/warehouse/stock-moves?lp_id=X (history for single LP)

**Frontend**
- [ ] Create /app/warehouse/stock-moves page
  - Table with all columns
  - Filter controls
  - Export button (export to CSV lib)
  - Pagination

- [ ] Add "Movement History" section to LP detail page
  - Show last 10 moves
  - "View all" link → stock-moves page filtered for this LP

**Tests**
- [ ] Integration: create 5 moves, query with filters
- [ ] E2E: move LP 3 times, see all moves in history

### Definition of Done
- ✅ Movement history page functional
- ✅ All filters working
- ✅ Export to CSV works
- ✅ LP detail shows recent moves
- ✅ Can sort by date, user

**Dependencies:** Requires Story 5.14
**Estimated Effort:** 5 hours

---

## Story 5.16: Partial Move (Split on Move)

**User Story:**
> As a **Warehouse user**, I want to move partial qty, so that I can split during movement.

**Story Points:** 5

### Acceptance Criteria

#### AC 1: Qty Option on Move
- **Given** moving LP with qty > 0
- **When** opening Move modal
- **Then** show option:
  - "Move entire LP" (checked by default)
  - "Move partial qty:" with input field (enabled if checkbox checked)

#### AC 2: Partial Move Execution
- **Given** LP: qty 100, moving 40 to different location
- **When** confirming partial move
- **Then**:
  - Call Story 5.5 split operation:
    - Split 40 from original 100 → creates new LP with 40, original has 60
  - Move new LP (40) to destination location
  - Original LP (60) stays in source location
  - Create 2 stock_moves:
    - Move new LP from source to destination (movement_type = 'transfer')
    - Genealogy record created for split

#### AC 3: Validation
- **Given** partial move request
- **When** validating
- **Then** reject if:
  - move_qty <= 0
  - move_qty >= LP.quantity (must be partial, not full)

#### AC 4: Result Display
- **Given** partial move completed
- **When** viewing LP detail
- **Then** show:
  - Original LP: qty 60, location source
  - Message: "Split: 40 moved to destination on [date] by [user]"
  - Link to new LP created

### Technical Tasks

**Backend**
- [ ] Extend POST /api/warehouse/stock-moves to support qty parameter
  - If qty < LP.quantity:
    - Call split service (Story 5.5)
    - Move new LP (with split qty)
    - Keep original LP in source
  - If qty = LP.quantity:
    - Move entire LP (simple mode)

**Frontend**
- [ ] Extend MoveLPModal
  - Add checkbox: "Move partial qty"
  - Show input field when checked
  - Validate move_qty < LP.quantity

**Tests**
- [ ] Unit: qty validation (0, full, partial)
- [ ] Integration: partial move → 2 LPs created, 2 moves recorded
- [ ] E2E: move 40 from 100 → see 60 in source, 40 in destination

### Definition of Done
- ✅ Can move full or partial qty
- ✅ Partial move creates split + moves new LP
- ✅ Original LP stays in source with remaining qty
- ✅ Genealogy recorded for split

**Dependencies:** Requires Story 5.14, 5.5 (split)
**Estimated Effort:** 5 hours

---

## Story 5.17: Destination Validation

**User Story:**
> As a **System**, I want to validate move destinations, so that inventory goes to correct locations.

**Story Points:** 3

### Acceptance Criteria

#### AC 1: Location Active Check
- **Given** moving LP
- **When** selecting destination location
- **Then** validate location.status = 'active'
- **And** reject if inactive: "Location WH-A-01 is inactive"

#### AC 2: Location Type Validation
- **Given** moving LP from Receiving (source location type)
- **When** selecting destination
- **Then** validate:
  - Receiving → any location type allowed (putaway phase)
  - Storage → any location type (flexible)
  - Production → only from Receiving, Storage, or Production (must have material)
  - Shipping → only from Storage (final consolidation)
  - Can warn if moving to incompatible type (e.g., Receiving → Shipping)

#### AC 3: Same Warehouse Only
- **Given** moving LP within same warehouse
- **When** selecting destination
- **Then** allow any location
- **And** if cross-warehouse: reject with message:
  - "Cross-warehouse moves require Transfer Order. Create TO instead."

#### AC 4: Location Dropdown
- **Given** in Move modal
- **When** clicking destination dropdown
- **Then** show only:
  - Active locations
  - In same warehouse as source location
  - Grouped by location type

### Technical Tasks

**Backend**
- [ ] Add validation in POST /api/warehouse/stock-moves:
  - Check destination location.status = 'active'
  - Check same warehouse_id
  - Log warning if type mismatch (future: business rule)

**Frontend**
- [ ] Update location dropdown in MoveLPModal:
  - Filter: active=true, warehouse_id=source_warehouse_id
  - Group by location type
  - Show type indicator (badge): "Storage", "Production", etc.

**Tests**
- [ ] Unit: location active check
- [ ] Unit: warehouse consistency check
- [ ] E2E: move LP, destination dropdown shows only valid locations

### Definition of Done
- ✅ Cannot move to inactive location
- ✅ Cannot move to different warehouse without TO
- ✅ Location dropdown filtered correctly
- ✅ Type validation working

**Dependencies:** Requires Story 5.14
**Estimated Effort:** 3 hours

---

## Story 5.18: Movement Types

**User Story:**
> As a **Warehouse Manager**, I want to categorize movements, so that I can analyze flow.

**Story Points:** 3

### Acceptance Criteria

#### AC 1: Movement Type Categories
- **Given** creating stock_move
- **When** recording move
- **Then** categorize as one of:
  - `receiving` - LP created from GRN, moved to initial location
  - `putaway` - Moving from Receiving location to Storage
  - `pick` - Moving from Storage to Production/Shipping
  - `transfer` - Between any locations (default)
  - `adjustment` - Inventory correction (not from move, from count)

#### AC 2: Auto-Categorize Movement Type
- **Given** moving LP
- **When** system determines movement_type
- **Then** logic:
  - If from_location.type = 'Receiving' AND to_location.type = 'Storage' → 'putaway'
  - If from_location.type = 'Storage' AND to_location.type IN ('Production', 'Shipping') → 'pick'
  - Otherwise → 'transfer'
  - User can override (expert mode)

#### AC 3: Filter by Type
- **Given** on /warehouse/stock-moves
- **When** filtering by Movement Type
- **Then** show only moves of selected type(s)
- **And** use colored badges:
  - receiving = 🔵 Blue
  - putaway = 🟢 Green
  - pick = 🟡 Yellow
  - transfer = ⚫ Gray
  - adjustment = 🔴 Red

#### AC 4: Movement Type Analytics
- **Given** Admin viewing /warehouse/dashboard (future P2)
- **When** checking movement breakdown
- **Then** show statistics:
  - Total moves by type (pie chart)
  - Avg time from putaway to pick
  - Most common paths (from→to location pairs)

### Technical Tasks

**Backend**
- [ ] Create movement_type determination logic:
  - Check from/to location types
  - Auto-assign type
  - Allow override

- [ ] Update stock_moves table: add movement_type column (enum: receiving, putaway, pick, transfer, adjustment)

**Frontend**
- [ ] Update stock-moves table:
  - Add Movement Type column with color badges
  - Add filter dropdown for movement_type

- [ ] Add "Movement Type" override option in expert mode

**Tests**
- [ ] Unit: auto-categorization logic
- [ ] Integration: move LP with expected type auto-assigned

### Definition of Done
- ✅ Movement type auto-categorized
- ✅ Filters working
- ✅ Badges color-coded
- ✅ Can filter by type

**Dependencies:** Requires Story 5.14
**Estimated Effort:** 3 hours

---

## Story 5.19: Pallet Creation

**User Story:**
> As a **Warehouse user**, I want to create pallets, so that I can group LPs.

**Story Points:** 5

### Acceptance Criteria

#### AC 1: Create Pallet Modal
- **Given** navigating to /warehouse/pallets
- **When** clicking "Create Pallet"
- **Then** modal opens with:
  - pallet_number (read-only, auto-generated)
  - location_id (required, dropdown with warehouse locations)
  - notes (optional, text field)
  - "Create" button

#### AC 2: Auto-Generate Pallet Number
- **Given** creating pallet
- **When** saving
- **Then** auto-generate: `PALLET-YYYYMMDD-NNNN`
  - Similar to LP/ASN numbering
  - Globally unique within org_id

#### AC 3: Create Pallet
- **Given** form filled with location
- **When** clicking "Create"
- **Then**:
  - Create pallet record with status = 'open'
  - Return pallet details
  - Show success: "Pallet PALLET-20250127-0001 created"
  - Open pallet detail page

#### AC 4: List Pallets
- **Given** navigating to /warehouse/pallets
- **When** page loads
- **Then** show table:
  - Pallet Number
  - Location
  - Status (open, closed, shipped)
  - LP Count
  - Total Qty
  - Created Date
  - Actions (View, Edit, Move, Close, Delete)

#### AC 5: Validation
- **Given** creating pallet
- **When** validating
- **Then** reject if:
  - Location not found or inactive

### Technical Tasks

**Backend**
- [ ] Create pallets table (see tech-spec)
- [ ] Implement POST /api/warehouse/pallets
- [ ] Implement GET /api/warehouse/pallets (list + filters)
- [ ] Implement GET /api/warehouse/pallets/:id (detail)
- [ ] Generate pallet_number using sequence (similar to LP)

**Database**
- [ ] Create pallets table with status enum
- [ ] Create pallet_items table (junction table)
- [ ] Create unique index on (org_id, pallet_number)
- [ ] Create RLS policies

**Frontend**
- [ ] Create /app/warehouse/pallets page
  - Table view with filters
  - "Create Pallet" button

- [ ] Create CreatePalletModal
- [ ] Create /app/warehouse/pallets/:id detail page

**Tests**
- [ ] Unit: pallet number generation
- [ ] Integration: create pallet, verify in list
- [ ] E2E: create pallet → see in list with status 'open'

### Definition of Done
- ✅ Pallet created with auto-generated number
- ✅ Pallet status = 'open'
- ✅ Can list all pallets
- ✅ RLS policies tested

**Dependencies:** Independent (does not require Batch 5A)
**Estimated Effort:** 5 hours

---

## Story 5.20: Pallet LP Management

**User Story:**
> As a **Warehouse user**, I want to add/remove LPs from pallets, so that I can organize inventory.

**Story Points:** 5

### Acceptance Criteria

#### AC 1: Add LP to Pallet
- **Given** pallet is 'open'
- **When** clicking "Add License Plate" in pallet detail
- **Then** show modal:
  - LP Number (autocomplete search by lp_number, product, batch)
  - "Add" button

#### AC 2: Add LP Validation
- **Given** adding LP to pallet
- **When** validating
- **Then** reject if:
  - LP not found
  - LP already assigned to another pallet (prevent double assignment)
  - LP status = 'consumed' or 'shipped' (cannot pallet)
  - LP location != pallet location (must be in same location)

#### AC 3: Add LP Execution
- **Given** valid LP selected
- **When** clicking "Add"
- **Then**:
  - Create pallet_items record: pallet_id, license_plate_id
  - Update pallet display (refresh item count, total qty)
  - Show success: "LP-20250127-0001 added to pallet"

#### AC 4: Remove LP from Pallet
- **Given** viewing pallet items
- **When** clicking "X" or "Remove" button on LP row
- **Then**:
  - Remove pallet_items record
  - LP remains in system (just unassigned from pallet)
  - Refresh pallet display
  - Show success: "LP-20250127-0001 removed from pallet"

#### AC 5: Pallet Display
- **Given** viewing pallet detail
- **When** page loaded
- **Then** show:
  - Pallet info: number, location, status
  - Items table:
    - LP Number (link to LP)
    - Product
    - Qty
    - Batch Number
    - Actions (View LP, Remove from Pallet)
  - Summary: "5 LPs, Total: 250 kg"

### Technical Tasks

**Backend**
- [ ] Implement POST /api/warehouse/pallets/:id/items
  - Accept lp_id
  - Validate LP exists, not in another pallet, in same location
  - Create pallet_items record

- [ ] Implement DELETE /api/warehouse/pallets/:id/items/:lpId
  - Remove pallet_items record
  - Return updated pallet

- [ ] Implement GET /api/warehouse/pallets/:id/items
  - Return LPs in pallet with details (product, qty, batch)

**Frontend**
- [ ] Create AddLPToPaletModal
  - LP autocomplete search
  - Validation errors

- [ ] Update pallet detail page:
  - Items table with add/remove buttons
  - Pallet summary (count, total qty)

**Tests**
- [ ] Unit: LP validation (already in pallet, consumed status)
- [ ] Integration: add LP → pallet_items created, count updated
- [ ] E2E: create pallet → add 3 LPs → remove 1 → verify counts

### Definition of Done
- ✅ Can add LPs to open pallet
- ✅ Cannot add LP already in pallet
- ✅ Cannot add consumed/shipped LP
- ✅ Can remove LPs from pallet
- ✅ Pallet summary updates correctly

**Dependencies:** Requires Story 5.19 (Pallet Creation), Batch 5A (License Plates)
**Estimated Effort:** 5 hours

---

## Story 5.21: Pallet Move

**User Story:**
> As a **Warehouse user**, I want to move entire pallets, so that I can relocate grouped inventory.

**Story Points:** 5

### Acceptance Criteria

#### AC 1: Move Pallet Modal
- **Given** viewing pallet detail
- **When** clicking "Move Pallet" button
- **Then** modal shows:
  - Current Location (read-only)
  - Destination Location (dropdown)
  - "Move" button

#### AC 2: Move Pallet Execution
- **Given** pallet with 5 LPs, location WH-A-01 → WH-A-02
- **When** confirming move
- **Then**:
  - Update pallet.location_id to destination
  - For EACH LP in pallet:
    - Update LP.location_id to destination
    - Create stock_move record (movement_type = 'transfer')
  - Show success: "Pallet moved with 5 LPs"
  - Refresh pallet detail

#### AC 3: Validation
- **Given** moving pallet
- **When** validating
- **Then** reject if:
  - Pallet not found
  - Destination location not found or inactive
  - Same location (source = destination)
  - Pallet status = 'closed' or 'shipped' (immutable)

#### AC 4: Stock Moves Created
- **Given** pallet moved
- **When** checking stock_moves table
- **Then** 5 move records exist:
  - One for each LP (lp_id, from_location, to_location, movement_type='transfer')
  - All created with same timestamp (to group pallet move)

### Technical Tasks

**Backend**
- [ ] Implement POST /api/warehouse/pallets/:id/move
  - Accept to_location_id
  - Validate location exists, active, different from current
  - Start transaction:
    - Update pallet.location_id
    - Update all LP.location_id for items in pallet
    - Create stock_move for each LP
  - Commit transaction
  - Return updated pallet

**Frontend**
- [ ] Create MovePalletModal
  - Location dropdown
  - "Move" button

- [ ] Add "Move Pallet" button to pallet detail
- [ ] Auto-refresh after move

**Tests**
- [ ] Unit: location validation
- [ ] Integration: move pallet → 5 LPs updated, 5 moves created
- [ ] E2E: move pallet with 3 LPs → verify all in new location

### Definition of Done
- ✅ Can move pallet to different location
- ✅ All LPs in pallet moved together
- ✅ stock_move created for each LP
- ✅ Cannot move closed/shipped pallets
- ✅ E2E: move pallet → all LPs relocated

**Dependencies:** Requires Story 5.19, 5.20 (Pallet with items)
**Estimated Effort:** 5 hours

---

## Story 5.22: Pallet Status

**User Story:**
> As a **Warehouse user**, I want to track pallet status, so that I know availability.

**Story Points:** 3

### Acceptance Criteria

#### AC 1: Pallet Status Lifecycle
- **Given** pallet created
- **Then** has status = 'open'

- **Given** pallet in 'open' status
- **When** user clicks "Close Pallet"
- **Then** status → 'closed'
- **And** cannot add/remove LPs (read-only)

- **Given** pallet in 'closed' status
- **When** shipped to customer
- **Then** status → 'shipped'
- **And** pallet locked (no changes allowed)

#### AC 2: Status Validation
- **Given** trying to close pallet
- **When** validating
- **Then** reject if:
  - Pallet has 0 LPs: "Cannot close empty pallet"
  - Pallet status = 'shipped': "Cannot reopen shipped pallet"

#### AC 3: Status Change UI
- **Given** viewing pallet detail
- **When** status = 'open'
- **Then** show buttons:
  - "Add LP"
  - "Remove LP"
  - "Close Pallet"
  - "Delete Pallet" (admin only)

- **When** status = 'closed'
- **Then** hide add/remove buttons
- **And** show button: "Reopen Pallet" / "Mark as Shipped"

- **When** status = 'shipped'
- **Then** show only: "View Details"

#### AC 4: Status Badges
- **Given** viewing pallet list
- **When** status column visible
- **Then** show badges:
  - open = 🟢 Green
  - closed = 🟡 Yellow
  - shipped = 🔵 Blue

### Technical Tasks

**Backend**
- [ ] Implement PATCH /api/warehouse/pallets/:id/status
  - Accept new_status
  - Validate transition and preconditions
  - Update pallet.status
  - Prevent operations if shipped

**Frontend**
- [ ] Add status badge to pallet detail and list
- [ ] Update buttons based on status:
  - open: show all action buttons
  - closed: show readonly/reopen/ship buttons
  - shipped: show readonly only

- [ ] Create ClosepalletModal with confirmation

**Tests**
- [ ] Unit: status transition validation
- [ ] Unit: cannot close empty pallet
- [ ] E2E: create pallet → open → close → ship → see status changes

### Definition of Done
- ✅ Status lifecycle working (open → closed → shipped)
- ✅ Cannot close empty pallet
- ✅ Cannot reopen shipped pallet
- ✅ UI reflects current status
- ✅ Actions restricted per status

**Dependencies:** Requires Story 5.19
**Estimated Effort:** 3 hours

---

## Summary

**Batch 5B Total:**
- **Stories:** 5.14-5.22 (9 stories)
- **Total Story Points:** 43
- **Total Effort Estimate:** ~55-70 hours
- **Duration:** ~2-3 weeks (1-2 person team)

**Key Dependencies:**
- ✅ Batch 5A: License Plates (LP CRUD, split)
- ✅ Epic 1: Locations (with types, active status)
- ✅ Story 5.5: LP Split (for partial move)

**Implementation Sequence:**
1. **Week 1**: Stories 5.14-5.18 (Stock Moves) in parallel
2. **Week 1-2**: Stories 5.19-5.22 (Pallets) in parallel
3. **Week 2**: Integration testing + refinement

**Parallel Tracks:**
- **Track A** (2-3 days): Stock Moves (5.14-5.18) - 5-6 hours/day
- **Track B** (2-3 days): Pallet Management (5.19-5.22) - 5-6 hours/day

**Batch 5B Success Criteria:**
- ✅ All 9 stories implemented
- ✅ Full movement workflow: putaway → pick → transfer
- ✅ Pallet lifecycle: create → add LPs → close → move → ship
- ✅ Stock move audit trail with 5+ filters
- ✅ RLS policies for multi-tenancy
- ✅ E2E: move 10 LPs via pallet → all tracked in audit trail
