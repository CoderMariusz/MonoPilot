# Epic 5 Batch A: Stories Implementation
## License Plates & Receiving (MVP)

**Batch:** 5A
**Stories:** 5.1 - 5.13
**Status:** Drafted
**Effort:** ~60-80 hours

---

## Story 5.1: License Plate Creation

**User Story:**
> As a **Warehouse user**, I want to create license plates, so that inventory is tracked atomically.

**Story Points:** 8

### Acceptance Criteria

#### AC 1: LP Creation Modal
- **Given** user navigates to /warehouse/license-plates
- **When** clicking "Create License Plate"
- **Then** modal opens with form containing:
  - `lp_number` (text, read-only if auto-generated, optional input if override allowed)
  - `product_id` (required, dropdown with search by name/SKU)
  - `batch_number` (required, text field)
  - `supplier_batch_number` (optional, text field)
  - `quantity` (required, decimal, positive)
  - `uom` (auto-filled from product, display only)
  - `manufacture_date` (optional, date picker)
  - `expiry_date` (optional, date picker)
  - `location_id` (required, dropdown with warehouse locations)
  - `qa_status` (optional, dropdown: pending/passed/rejected)

#### AC 2: Auto-Generate LP Number
- **Given** lp_number not provided
- **When** saving LP
- **Then** auto-generate format: `LP-YYYYMMDD-NNNN` (e.g., LP-20250127-0001)
  - Sequence resets daily per organization
  - NNNN is 4-digit zero-padded counter
  - Globally unique constraint enforced at DB level

#### AC 3: Save LP
- **Given** form filled with required fields
- **When** clicking "Save"
- **Then**:
  - Validate all required fields present
  - Validate quantity > 0
  - Validate product_id exists (FK)
  - Validate location_id exists and is active (FK)
  - Create LP record with status = 'available'
  - Return created LP object (id, lp_number, etc.)
  - Show success toast: "License Plate LP-20250127-0001 created"
  - Close modal, refresh LP list

#### AC 4: List License Plates
- **Given** user navigates to /warehouse/license-plates
- **When** page loads
- **Then** display table with columns:
  - LP Number (sortable)
  - Product (name + SKU)
  - Batch Number
  - Quantity + UoM
  - Expiry Date
  - Status (badge: available=green, reserved=yellow, consumed=gray, quarantine=red, shipped=blue)
  - Location
  - Created Date
  - Actions (View, Edit, Delete)

#### AC 5: Validation Errors
- **Given** form with invalid data
- **When** clicking "Save"
- **Then** show error messages:
  - "Product is required" (if product_id missing)
  - "Location is required or inactive" (if location not found or inactive)
  - "Quantity must be greater than 0" (if qty <= 0)
  - "Location WH-A-01 no longer exists" (if location deleted between load and save)

### Technical Tasks

**Backend (API Routes)**
- [ ] Implement POST /api/warehouse/license-plates
  - Generate lp_number using sequence table
  - Validate FK constraints: product_id, location_id
  - Insert to license_plates table
  - Return created LP

- [ ] Implement GET /api/warehouse/license-plates
  - Fetch all LPs for org_id
  - Support filters: product_id, status, location_id, batch_number
  - Support sorting: lp_number, created_at, expiry_date
  - RLS: filter by org_id from JWT

- [ ] Create /api/warehouse/license-plates/:id endpoints
  - GET: fetch single LP detail
  - PATCH: update (status, location, qa_status only)
  - DELETE: soft delete (or hard delete if policy allows)

**Database**
- [ ] Create license_plates table (see tech-spec)
- [ ] Create lp_number_sequence table for auto-increment
- [ ] Create unique index on (org_id, lp_number)
- [ ] Create RLS policies:
  - SELECT: org_id = current_org_id
  - INSERT: org_id = current_org_id
  - UPDATE: org_id = current_org_id
  - DELETE: org_id = current_org_id

**Frontend**
- [ ] Create /app/warehouse/license-plates/page.tsx
  - Table view with columns
  - "Create License Plate" button
  - Filters/search UI

- [ ] Create /app/warehouse/license-plates/create-modal.tsx
  - Form with Zod validation schema
  - Product dropdown with search
  - Location dropdown
  - Date pickers for mfg/expiry
  - Submit handler to POST /api/warehouse/license-plates

- [ ] Create hooks/useCreateLP.ts
  - useMutation to POST LP
  - useFetch to list LPs
  - useUpdate for status changes

**Tests**
- [ ] Unit: LP CRUD operations
- [ ] Integration: POST with FK validation
- [ ] E2E: Create LP via UI, verify in table

### Definition of Done
- ✅ API routes return correct response format
- ✅ Database constraints enforced
- ✅ RLS policies tested (org isolation)
- ✅ UI form functional with validation
- ✅ LP number auto-generation tested
- ✅ E2E: create LP → see in list → delete

**Dependencies:**
- Requires: Epic 1 (Organizations, Users, Locations)
- Requires: Epic 2 (Products table)
- Blocks: Story 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.11

**Estimated Effort:** 8 hours

---

## Story 5.2: LP Status Tracking

**User Story:**
> As a **Warehouse user**, I want to track LP status, so that I know availability.

**Story Points:** 5

### Acceptance Criteria

#### AC 1: Status Lifecycle
- **Given** LP is created
- **Then** has status = 'available'

- **Given** LP status can be changed
- **When** updating status
- **Then** valid transitions are:
  - `available` → `reserved` (for WO/TO allocation)
  - `available` → `consumed` (fully used)
  - `available` → `quarantine` (QA hold)
  - `reserved` → `available` (unreserve)
  - `reserved` → `consumed` (after WO consumption)
  - `quarantine` → `available` (QA pass)
  - `quarantine` → `consumed` (rejected)
  - Any status → `shipped` (final state)

#### AC 2: Status Update UI
- **Given** LP detail view
- **When** clicking "Change Status" button
- **Then** modal shows:
  - Current status (read-only)
  - Status dropdown with allowed next states
  - Reason field (optional, text)
  - "Update" button

#### AC 3: Audit Trail
- **Given** status changes
- **When** updating status
- **Then** record:
  - `updated_by_user_id` (current user)
  - `updated_at` (timestamp)
  - In future: reason field in lp_status_history table

#### AC 4: Status List Display
- **Given** viewing LP list
- **When** status column visible
- **Then** show status with color badges:
  - available = 🟢 Green
  - reserved = 🟡 Yellow
  - consumed = ⚫ Gray
  - quarantine = 🔴 Red
  - shipped = 🔵 Blue

### Technical Tasks

**Backend**
- [ ] Add status transition validation to LP update endpoint
- [ ] Create validation rules in database CHECK constraint
- [ ] Implement PATCH /api/warehouse/license-plates/:id/status
  - Accept new_status and reason (optional)
  - Validate transition is allowed
  - Update status + updated_by + updated_at
  - Return updated LP

**Database**
- [ ] Update license_plates table: add status enum validation
- [ ] Create lp_status_history table (optional, for full audit)
  - lp_id, old_status, new_status, reason, changed_at, changed_by

**Frontend**
- [ ] Create StatusBadge component (color-coded)
- [ ] Create ChangeStatusModal component
- [ ] Update LP detail page to show status history
- [ ] Add status filter to LP list

**Tests**
- [ ] Unit: status transition validation (all valid paths)
- [ ] Unit: invalid transition rejection
- [ ] Integration: update status via API
- [ ] E2E: change status, see updated badge

### Definition of Done
- ✅ All status transitions validated
- ✅ Invalid transitions rejected with error message
- ✅ Audit trail (updated_by_user_id, updated_at) recorded
- ✅ UI shows color badges correctly
- ✅ Status filter works in list view

**Dependencies:** Requires Story 5.1
**Estimated Effort:** 5 hours

---

## Story 5.3: LP Batch/Expiry Tracking

**User Story:**
> As a **Warehouse user**, I want to track batch and expiry dates, so that I can manage FIFO/FEFO.

**Story Points:** 5

### Acceptance Criteria

#### AC 1: Batch Number Required
- **Given** creating LP
- **When** saving
- **Then** batch_number is required field
- **And** supplier_batch_number is optional

#### AC 2: Expiry Date Display
- **Given** viewing LP list
- **When** LP has expiry_date
- **Then** show in format: "2025-12-31" in dedicated column
- **And** if expiry_date < today, highlight row in light red background

#### AC 3: Expired LP Warning
- **Given** LP with expiry_date < today
- **When** viewing LP detail or list
- **Then** show warning banner: "⚠️ This LP is expired (Expired on 2025-01-20)"
- **And** status cannot be changed to 'available' (stays consumed/quarantine)

#### AC 4: FEFO Sorting
- **Given** user navigates to LP list
- **When** clicking "Expiry Date" column header to sort
- **Then** LPs sorted by expiry_date (earliest first)
- **And** expired LPs appear at top

#### AC 5: FEFO Pick Suggestion
- **Given** system determines which LP to consume
- **When** same product multiple LPs available
- **Then** suggest LP with earliest expiry_date (FEFO rule)

#### AC 6: Filter by Expiry Range
- **Given** LP list page
- **When** setting date range filter (e.g., "Expiring in 30 days")
- **Then** show only LPs with expiry_date between now and +30 days

### Technical Tasks

**Backend**
- [ ] Add expiry_date validation to license_plates table
- [ ] Create endpoint filter: ?expiry_from=YYYY-MM-DD&expiry_to=YYYY-MM-DD
- [ ] Implement FEFO sorting in queries
- [ ] Add query helper: `getExpiringSoonLPs(org_id, days=30)`
- [ ] Add validation: expired LP cannot move to 'available' status

**Database**
- [ ] Create index on expiry_date for sorting performance
- [ ] Add CHECK constraint: manufacture_date < expiry_date (if both provided)

**Frontend**
- [ ] Add date picker filters to LP list page
- [ ] Highlight expired rows with CSS background-color: #fee
- [ ] Add "Expiring Soon" badge next to expiry date
- [ ] Show warning banner on LP detail if expired
- [ ] Update sort logic for expiry_date column

**Tests**
- [ ] Unit: FEFO sorting with mixed dates
- [ ] Unit: expired LP validation
- [ ] E2E: create LP with past expiry → see warning → cannot change status

### Definition of Done
- ✅ Batch number displayed in list and detail
- ✅ Expired LPs highlighted
- ✅ FEFO sorting works
- ✅ Expiry filter works
- ✅ Cannot change expired LP to 'available'

**Dependencies:** Requires Story 5.1
**Estimated Effort:** 5 hours

---

## Story 5.4: LP Number Generation

**User Story:**
> As a **System**, I want to auto-generate LP numbers, so that they are unique and meaningful.

**Story Points:** 5

### Acceptance Criteria

#### AC 1: Default Format
- **Given** LP created without explicit lp_number
- **When** saving
- **Then** auto-generate: `LP-YYYYMMDD-NNNN`
  - YYYY = year (e.g., 2025)
  - MMDD = month-day (e.g., 0127)
  - NNNN = 4-digit sequence (0001, 0002, ..., 9999)
  - Example: LP-20250127-0001, LP-20250127-0002

#### AC 2: Daily Sequence Reset
- **Given** LP created on 2025-01-27
- **When** sequence reaches 9999
- **Then** sequence resets to 0001 on next day
- **And** date changes to 2025-01-28

#### AC 3: Configurable Format
- **Given** Admin navigates to /settings/warehouse
- **When** editing "LP Number Format"
- **Then** can set custom format:
  - Default: `LP-YYYYMMDD-NNNN`
  - Alternative: `{org_code}-{date}-{seq}` (e.g., ACME-20250127-0001)
  - Alternative: `{warehouse_code}{seq}` (e.g., WHA0001)

#### AC 4: Admin Override
- **Given** creating LP via UI
- **When** admin provides explicit lp_number
- **Then** system validates:
  - Format matches warehouse_settings.lp_number_format
  - Uniqueness within org_id
  - If valid: use provided number
  - If invalid: reject with error

#### AC 5: Global Uniqueness
- **Given** lp_number already exists in org
- **When** creating new LP with same lp_number
- **Then** reject with error: "License Plate LP-20250127-0001 already exists"
- **And** suggest next available: "Try LP-20250127-0002"

### Technical Tasks

**Backend**
- [ ] Create lp_number_sequence table:
  ```sql
  CREATE TABLE lp_number_sequence (
    id UUID PRIMARY KEY,
    org_id UUID NOT NULL,
    sequence_date DATE NOT NULL,
    next_sequence INT DEFAULT 1,
    UNIQUE(org_id, sequence_date)
  );
  ```

- [ ] Implement generateLPNumber(org_id, format) function
  - Fetch current sequence for today
  - Increment counter
  - Format using warehouse_settings.lp_number_format
  - Return formatted number

- [ ] Add endpoint POST /api/warehouse/license-plates/generate-number
  - Query param: ?override_format (optional)
  - Return: next_lp_number, all_recent_numbers

**Database**
- [ ] Create unique index on (org_id, lp_number)
- [ ] Create index on (org_id, created_at) for daily sequence queries

**Frontend**
- [ ] Update license_plates create modal to show "Auto-generated: LP-20250127-0001"
- [ ] Add "Override" checkbox to allow custom number entry
- [ ] Validate custom format matches pattern

**Tests**
- [ ] Unit: sequence increment and daily reset
- [ ] Unit: format generation with different templates
- [ ] Integration: concurrent LP creation (sequence consistency)
- [ ] E2E: create 5 LPs, verify sequencing

### Definition of Done
- ✅ LP numbers auto-generated correctly
- ✅ Daily sequence reset working
- ✅ Configurable format from settings
- ✅ Admin override with validation
- ✅ Uniqueness enforced

**Dependencies:** Requires Story 5.1
**Estimated Effort:** 5 hours

---

## Story 5.5: LP Split

**User Story:**
> As a **Warehouse user**, I want to split an LP into smaller quantities, so that I can partially use inventory.

**Story Points:** 8

### Acceptance Criteria

#### AC 1: Split Modal
- **Given** viewing LP detail
- **When** clicking "Split LP" button
- **Then** modal opens with:
  - Original LP (read-only): LP-20250127-0001, qty 100 kg
  - Split Quantity (required, decimal): min 0.01, max < original qty
  - Keep remaining in current location (checkbox, default checked)
  - "Split" button

#### AC 2: Split Execution
- **Given** original LP: qty 100, split_qty 40
- **When** confirming split
- **Then**:
  - Original LP qty updated: 100 - 40 = 60
  - New LP created: qty 40, new lp_number generated
  - New LP inherits: product_id, batch_number, expiry_date, location_id, status
  - Genealogy record created: parent_lp_id (original), child_lp_id (new), operation_type='split'

#### AC 3: Split Genealogy
- **Given** split completed
- **When** viewing LP genealogy
- **Then** trace shows:
  - Forward: original LP → new LP
  - Backward: new LP → original LP
  - Operation type: 'split'
  - Timestamp and user who split

#### AC 4: Validation
- **Given** split request
- **When** validating
- **Then** reject if:
  - split_qty < 0.01 (too small)
  - split_qty >= original qty (must be partial)
  - remaining_qty < 0.01 (would leave nothing)
  - LP status is 'consumed' or 'shipped' (immutable)

#### AC 5: New LP Number
- **Given** split creates new LP
- **When** saving
- **Then** new LP gets auto-generated lp_number
- **And** is independent entity (can be split again, merged, etc.)

### Technical Tasks

**Backend**
- [ ] Implement POST /api/warehouse/license-plates/:id/split
  - Validate split_qty
  - Start DB transaction
  - Decrement original LP qty
  - Create new LP with split qty
  - Create genealogy record
  - Commit transaction (or rollback on error)

- [ ] Create splitLP transaction handler with rollback

**Database**
- [ ] Ensure lp_genealogy table exists (story 5.7)
- [ ] Add transaction support to split endpoint

**Frontend**
- [ ] Create SplitLPModal component
  - Input for split quantity with validation
  - Show remaining qty in real-time
  - "Split" button triggers API

- [ ] Update LP detail page to show split button
- [ ] After split, refresh LP list and show genealogy

**Tests**
- [ ] Unit: qty calculation (100 - 40 = 60)
- [ ] Unit: rejection of invalid splits
- [ ] Integration: split with genealogy recording
- [ ] E2E: split 100 → 40+60, verify both LPs exist

### Definition of Done
- ✅ Split modal functional
- ✅ Original LP qty decremented
- ✅ New LP created with correct qty
- ✅ Genealogy recorded
- ✅ Cannot split consumed/shipped LPs
- ✅ E2E: split → genealogy → both LPs queryable

**Dependencies:** Requires Story 5.1, 5.7 (genealogy)
**Estimated Effort:** 8 hours

---

## Story 5.6: LP Merge

**User Story:**
> As a **Warehouse user**, I want to merge LPs of same product/batch, so that I can consolidate inventory.

**Story Points:** 8

### Acceptance Criteria

#### AC 1: Merge Preconditions
- **Given** multiple LPs with same product_id and batch_number
- **When** selecting LPs in list view
- **Then** "Merge Selected" button becomes available
- **And** shows count: "Merge 3 License Plates"

#### AC 2: Merge Modal
- **Given** clicking "Merge Selected"
- **When** modal opens
- **Then** show:
  - Source LPs (read-only): LP-001 (50), LP-002 (30), LP-003 (20)
  - Total qty to merge: 100
  - Target Location (dropdown, default = first LP location)
  - "Merge" button

#### AC 3: Merge Validation
- **Given** merge request
- **When** validating
- **Then** reject if:
  - Different product_id (at least one LP)
  - Different batch_number (at least one LP)
  - Any source LP is 'consumed' or 'shipped'
  - Different locations (with option to consolidate)

#### AC 4: Merge Execution
- **Given** 3 source LPs: 50, 30, 20 kg
- **When** confirming merge
- **Then**:
  - Target LP qty increased: 50 + 30 + 20 = 100
  - Source LPs status → 'merged'
  - Source LPs qty set to 0 (or marked as consumed)
  - Genealogy created for each source → target
    - source1 → target, operation_type='merge'
    - source2 → target, operation_type='merge'
    - source3 → target, operation_type='merge'

#### AC 5: Merge Genealogy
- **Given** merge completed
- **When** viewing target LP genealogy backward
- **Then** show all source LPs as parents
- **And** operation_type='merge' for each link

### Technical Tasks

**Backend**
- [ ] Implement POST /api/warehouse/license-plates/merge
  - Accept array of source_lp_ids and target_lp_id
  - Validate same product_id, batch_number
  - Start transaction
  - Update target LP qty += sum(source qty)
  - Update source LPs: status='merged', qty=0
  - Create genealogy records for each source → target
  - Commit transaction

- [ ] Create mergeLP transaction handler

**Database**
- [ ] Ensure lp_genealogy table supports multiple parents

**Frontend**
- [ ] Add checkbox selection to LP list
- [ ] Enable "Merge Selected" button when 2+ LPs selected
- [ ] Create MergeLPModal component
  - Show source/target LPs
  - Target location dropdown
  - "Merge" button

- [ ] After merge, refresh list and show success notification

**Tests**
- [ ] Unit: qty summation
- [ ] Unit: product/batch validation
- [ ] Integration: merge with genealogy
- [ ] E2E: select 3 LPs → merge → see target qty updated, sources merged

### Definition of Done
- ✅ Merge validation works (same product/batch only)
- ✅ Target LP qty updated correctly
- ✅ Source LPs marked as 'merged'
- ✅ Genealogy recorded for each source
- ✅ Cannot merge consumed/shipped LPs
- ✅ E2E: merge 3 LPs → target qty = sum(sources)

**Dependencies:** Requires Story 5.1, 5.7 (genealogy)
**Estimated Effort:** 8 hours

---

## Story 5.7: LP Genealogy Tracking

**User Story:**
> As a **System**, I want to track LP relationships, so that traceability is complete.

**Story Points:** 13 (Complex - includes atomicity & validation)

### Acceptance Criteria

#### AC 1: Genealogy Table Schema
- **Given** system tracks LP relationships
- **When** recording genealogy
- **Then** lp_genealogy table stores:
  - parent_lp_id (FK to license_plates)
  - child_lp_id (FK to license_plates)
  - wo_id (FK to work_orders, nullable)
  - operation_type (enum: split, merge, consume, produce)
  - created_at, created_by_user_id

#### AC 2: Transaction Atomicity
- **Given** creating genealogy record
- **When** starting transaction
- **Then** validate before INSERT:
  1. parent_lp_id exists in license_plates (FK)
  2. child_lp_id exists in license_plates (FK)
  3. Both LPs belong to same org_id
  4. parent_lp_id ≠ child_lp_id
  5. No circular dependency (recursive CTE check)
  6. No duplicate link (parent_lp_id, child_lp_id) already exists
  7. wo_id exists if provided (FK)
  8. operation_type is valid enum

**If ANY validation fails:**
- ROLLBACK transaction
- Return specific error message (see below)
- NO genealogy record created

#### AC 3: Circular Dependency Detection
- **Given** genealogy records: A→B, B→C
- **When** attempting to create: C→A
- **Then** reject with error: "Circular dependency detected. LP-001 is already a descendant of LP-003"
- **And** use recursive CTE to check all ancestors

#### AC 4: Error Messages (Atomicity)

| Failure Scenario | HTTP | Error Message |
|------------------|------|---------------|
| Parent LP not found | 404 | "Cannot create genealogy: Parent License Plate LP-001234 does not exist. Verify LP number." |
| Child LP not found | 404 | "Cannot create genealogy: Child License Plate LP-005678 does not exist. Verify LP number." |
| Different orgs | 403 | "Cannot create genealogy: Parent and child LPs belong to different organizations. Cross-org genealogy not allowed." |
| Circular dependency | 400 | "Cannot create genealogy: Circular dependency detected. LP-001234 is already a descendant of LP-005678." |
| Duplicate link | 409 | "Cannot create genealogy: Link already exists between Parent LP-001234 and Child LP-005678." |
| Invalid WO | 404 | "Cannot create genealogy: Work Order #9999 does not exist or is not related to these LPs." |
| Invalid operation type | 400 | "Cannot create genealogy: Operation type 'transform' is invalid. Use: split, merge, consume, or produce." |

#### AC 5: FK Validation
- **Given** genealogy being created
- **Then** validate FKs:
  - ✅ parent_lp_id → license_plates.id (must exist)
  - ✅ child_lp_id → license_plates.id (must exist)
  - ✅ wo_id → work_orders.id (must exist if provided)
  - ✅ org_id consistency (both LPs in same org)
  - ✅ Unique constraint on (parent_lp_id, child_lp_id)

#### AC 6: Operation Type Semantics

| Operation | Parent LP | Child LP | WO Required | Use Case |
|-----------|-----------|----------|-------------|----------|
| **split** | Original LP | New split LPs | No | Split 100kg → 2x 50kg pallets |
| **merge** | Multiple source LPs | New merged LP | No | Merge 2x 50kg → 1x 100kg pallet |
| **consume** | Input material LP | Output finished good LP | Yes | WO consumes Flour → produces Bread |
| **produce** | Input material LP | Output finished good LP | Yes | Legacy alias for consume |

#### AC 7: Trace Verification (Post-Insert)
- **Given** genealogy record inserted successfully
- **When** transaction commits
- **Then** verify integrity:

**Forward Traceability:**
```sql
-- All descendants reachable from parent
WITH RECURSIVE descendants AS (
  SELECT child_lp_id FROM lp_genealogy WHERE parent_lp_id = ?
  UNION ALL
  SELECT g.child_lp_id FROM lp_genealogy g
  JOIN descendants d ON g.parent_lp_id = d.child_lp_id
  WHERE d.depth < 10
)
SELECT * FROM descendants;
```

**Backward Traceability:**
```sql
-- All ancestors reachable from child
WITH RECURSIVE ancestors AS (
  SELECT parent_lp_id FROM lp_genealogy WHERE child_lp_id = ?
  UNION ALL
  SELECT g.parent_lp_id FROM lp_genealogy g
  JOIN ancestors a ON g.child_lp_id = a.parent_lp_id
  WHERE a.depth < 10
)
SELECT * FROM ancestors;
```

#### AC 8: Immutable Genealogy Audit Trail
- **Given** genealogy created
- **When** verifying audit trail
- **Then** genealogy record:
  - ✅ Can only be INSERT (no UPDATE, no DELETE)
  - ✅ Records created_at timestamp
  - ✅ Records created_by_user_id (who performed split/merge)
  - ✅ Never deleted (even if parent/child LP deleted → orphan flag)

#### AC 9: Orphan Detection (Future: Story 5.28)
- **Given** parent LP deleted
- **When** querying genealogy
- **Then** genealogy records remain (not cascade deleted)
- **And** UI flags orphaned LPs: "⚠️ LP-005678: Parent LP-001234 no longer exists (orphaned)"

#### AC 10: Data Integrity Guarantees
- ✅ Every split → parent LP linked to child LP
- ✅ Every merge → all source LPs linked to target LP
- ✅ Every consume → input LP linked to output LP via wo_id
- ✅ Genealogy records immutable (no DELETE, no UPDATE)
- ✅ No circular dependencies (tree structure enforced)
- ✅ No cross-org genealogy (org_id isolation)
- ❌ NEVER: output LP without input LP genealogy
- ❌ NEVER: genealogy link without valid parent AND child LPs
- ❌ NEVER: circular dependencies
- ❌ NEVER: broken traces

### Technical Tasks

**Backend**
- [ ] Implement POST /api/warehouse/lp-genealogy
  - Input validation (all 8 checks)
  - Circular dependency detection (recursive CTE)
  - DB transaction with rollback on error
  - Return specific error messages

- [ ] Create genealogyService.ts with:
  - validateFKs() function
  - checkCircularDependency() function
  - createGenealogy() transaction handler

- [ ] Implement GET /api/warehouse/lp-genealogy (list with filters)

**Database**
- [ ] Create lp_genealogy table (see tech-spec)
- [ ] Create unique index: (parent_lp_id, child_lp_id)
- [ ] Create indexes for FK lookups
- [ ] Add CHECK constraint: parent_lp_id != child_lp_id
- [ ] Create RLS policies (org_id isolation)

**Frontend** (UI for split/merge stories will consume this service)
- [ ] Create genealogyService.ts hook for creating genealogy
- [ ] Error handling for all 7 error messages
- [ ] Success notification: "Genealogy link created: LP-001 (parent) → LP-002 (child)"

**Tests**
- [ ] Unit: FK validation (parent not found, child not found)
- [ ] Unit: org_id isolation (cross-org rejection)
- [ ] Unit: circular dependency detection (A→B→C→A)
- [ ] Unit: duplicate link detection
- [ ] Unit: operation_type validation
- [ ] Integration: create genealogy → verify audit trail
- [ ] Integration: forward trace (parent → all descendants)
- [ ] Integration: backward trace (child → all ancestors)
- [ ] E2E: split LP → genealogy created → trace forward/backward

### Definition of Done
- ✅ All 8 ACs implemented and tested
- ✅ FK validation enforced at DB + API
- ✅ Circular dependency detection working
- ✅ Error messages specific and helpful
- ✅ Genealogy immutable (no delete/update)
- ✅ RLS policies tested
- ✅ Trace queries return correct results
- ✅ Integration test: 5 LPs with genealogy → all traces work

**Dependencies:** Requires Story 5.1, 5.5, 5.6 (genealogy is created by split/merge)
**Estimated Effort:** 13 hours

---

## Story 5.8: ASN Creation

**User Story:**
> As a **Warehouse user**, I want to create ASN for incoming shipments, so that I can prepare for receiving.

**Story Points:** 5

### Acceptance Criteria

#### AC 1: Create ASN Modal
- **Given** PO exists with status 'Confirmed' or higher
- **When** viewing PO detail, clicking "Create ASN"
- **Then** modal opens with:
  - po_id (auto-filled, read-only)
  - asn_number (auto-generated, read-only)
  - expected_arrival_date (date picker, required)
  - carrier (text, optional)
  - tracking_number (text, optional)
  - Items section showing PO lines:
    - Product (read-only)
    - Ordered Qty (read-only)
    - UoM (read-only)
    - Received Qty (read-only, 0 initially)

#### AC 2: Auto-Generate ASN Number
- **Given** creating ASN
- **When** saving
- **Then** auto-generate asn_number: `ASN-YYYYMMDD-NNNN` (similar to LP)
  - Globally unique within org
  - Daily sequence reset

#### AC 3: Pre-fill from PO Lines
- **Given** ASN created from PO
- **When** loading ASN items
- **Then** auto-fill from po_lines:
  - product_id, quantity_expected, uom
  - supplier_batch_number (if available in PO)
  - manufacture_date, expiry_date (optional)

#### AC 4: Save ASN
- **Given** form filled
- **When** clicking "Save"
- **Then**:
  - Validate po_id exists and is 'Confirmed'+
  - Create ASN record with status='pending'
  - Create asn_items from po_lines
  - Return created ASN
  - Show success: "ASN ASN-20250127-0001 created"
  - Redirect to ASN detail page

#### AC 5: List ASNs
- **Given** navigating to /warehouse/asns
- **When** page loads
- **Then** show table:
  - ASN Number
  - PO Number (link to PO)
  - Expected Arrival
  - Carrier
  - Status (pending, received, completed, cancelled)
  - Items Count
  - Created Date
  - Actions

#### AC 6: Validation
- **Given** creating ASN
- **When** validating
- **Then** reject if:
  - PO not found or not in Confirmed+ status
  - expected_arrival_date in past
  - PO already has completed ASN

### Technical Tasks

**Backend**
- [ ] Create asns and asn_items tables
- [ ] Implement POST /api/warehouse/asns
- [ ] Implement GET /api/warehouse/asns (list + filters)
- [ ] Implement GET /api/warehouse/asns/:id (detail)
- [ ] Generate ASN number (similar to LP_sequence)

**Database**
- [ ] Create asns table (see tech-spec)
- [ ] Create asn_items table
- [ ] Create unique index on (org_id, asn_number)
- [ ] Create FKs: asns.po_id, asn_items.asn_id, asn_items.product_id
- [ ] Create RLS policies

**Frontend**
- [ ] Create /app/warehouse/asns page
- [ ] Create CreateASNModal component
- [ ] Create ASN detail page /app/warehouse/asns/:id
- [ ] Link from PO detail → "Create ASN" button
- [ ] List all ASNs with filters

**Tests**
- [ ] Unit: ASN number generation
- [ ] Integration: create ASN from PO
- [ ] E2E: PO → Create ASN → see in list

### Definition of Done
- ✅ ASN created with correct number format
- ✅ Items pre-filled from PO lines
- ✅ Status tracking working
- ✅ RLS policies tested
- ✅ E2E: create ASN → verify in list

**Dependencies:** Requires Epic 3 (Purchase Orders)
**Estimated Effort:** 5 hours

---

## Story 5.9: ASN Item Management

**User Story:**
> As a **Warehouse user**, I want to manage ASN items, so that I know what's arriving.

**Story Points:** 3

### Acceptance Criteria

#### AC 1: Edit ASN Items
- **Given** ASN in 'pending' status
- **When** clicking "Edit" on ASN item
- **Then** can modify:
  - supplier_batch_number
  - manufacture_date
  - expiry_date
  - quantity_expected (if partial shipment expected)

#### AC 2: Item Validation
- **Given** editing ASN item
- **When** updating quantity
- **Then** validate:
  - quantity_expected > 0
  - expiry_date > manufacture_date (if both provided)

#### AC 3: Received Qty Tracking
- **Given** viewing ASN items
- **When** GRN created from this ASN
- **Then** asn_items.received_qty auto-updated
- **And** shows: "Ordered: 100, Received: 50, Remaining: 50"

#### AC 4: ASN Item Status
- **Given** item fully received
- **When** received_qty = quantity_expected
- **Then** show status badge: "Received ✓"
- **And** if remaining qty > 0: "Partial"

### Technical Tasks

**Backend**
- [ ] Implement PATCH /api/warehouse/asns/:id/items/:itemId
- [ ] Update asn_items with validation
- [ ] Auto-calculate received_qty from GRN

**Frontend**
- [ ] Create EditASNItemModal component
- [ ] Show received qty in ASN detail
- [ ] Item status badges

**Tests**
- [ ] Unit: item validation
- [ ] Integration: update item → verify persistence

### Definition of Done
- ✅ Edit ASN items working
- ✅ Qty validation enforced
- ✅ Received qty tracked
- ✅ Status badges correct

**Dependencies:** Requires Story 5.8
**Estimated Effort:** 3 hours

---

## Story 5.10: Over-Receipt Validation

**User Story:**
> As a **System**, I want to validate receiving against PO, so that we don't receive more than ordered.

**Story Points:** 3

### Acceptance Criteria

#### AC 1: Over-Receipt Warning
- **Given** PO line: qty_ordered = 100, qty_received = 70
- **When** attempting to receive 40 more (total would be 110)
- **Then** show warning modal:
  - "Over-Receipt Detected"
  - "Ordered: 100, Already Received: 70, Attempting: 40"
  - "Total would be: 110 (10 units over)"
  - Buttons: "Proceed Anyway" / "Cancel"

#### AC 2: Over-Receipt Block (Configurable)
- **Given** warehouse_settings.allow_over_receipt = false
- **When** over-receipt attempted
- **Then** reject with error: "Cannot receive more than ordered. Remaining: 30 units"
- **And** button greyed out

#### AC 3: Over-Receipt Setting
- **Given** navigating to /settings/warehouse
- **When** viewing settings
- **Then** checkbox: "Allow Over-Receipt" (default: unchecked)
- **And** if checked: warnings only, allow anyway

### Technical Tasks

**Backend**
- [ ] Add validation in GRN creation: check qty against PO
- [ ] Implement permission check: allow_over_receipt setting

**Frontend**
- [ ] Create OverReceiptWarning modal
- [ ] Show qty summary in receiving form
- [ ] Block submit if over-receipt not allowed

**Tests**
- [ ] Unit: qty validation
- [ ] E2E: attempt over-receipt, see warning

### Definition of Done
- ✅ Over-receipt warning shows
- ✅ Can block or allow per settings
- ✅ Error messages clear

**Dependencies:** Requires Story 5.8
**Estimated Effort:** 3 hours

---

## Story 5.11: GRN and LP Creation (ATOMIC)

**User Story:**
> As a **Warehouse user**, I want to receive goods and create LPs, so that inventory is recorded.

**Story Points:** 13

### Acceptance Criteria

#### AC 1: GRN Creation Flow
- **Given** ASN exists (or ad-hoc receiving from PO)
- **When** navigating to /warehouse/receiving, selecting ASN/PO
- **Then** form shows:
  - PO details (read-only)
  - ASN details if from ASN
  - Items to receive with fields:
    - Product (read-only)
    - Qty to Receive (required, decimal)
    - Batch Number (required, text)
    - Supplier Batch (optional)
    - Manufacture Date (optional)
    - Expiry Date (optional)
    - Location (required, dropdown)
    - QA Status (optional, pending/passed/rejected)

#### AC 2: Atomic Transaction
- **Given** GRN being created with items
- **When** clicking "Receive Goods"
- **Then** execute ATOMIC transaction:
  1. START transaction
  2. INSERT grn record (grn_number auto-generated, status='pending')
  3. INSERT grn_items for each line
  4. INSERT license_plates for each item (1 LP per GRN item)
  5. UPDATE purchase_order_lines: received_qty += qty_received
  6. UPDATE asn: status='completed' (if from ASN)
  7. COMMIT (all-or-nothing)

**If ANY step fails:**
- ROLLBACK entire transaction
- NO partial records created (no GRN, no LPs, no PO update)
- Show specific error message

#### AC 3: GRN Number Generation
- **Given** creating GRN
- **When** saving
- **Then** auto-generate: `GRN-YYYYMMDD-NNNN`
- **And** globally unique within org_id

#### AC 4: LP Creation from GRN
- **Given** GRN items received
- **When** creating LPs
- **Then** for each GRN item:
  - Create license_plate with:
    - lp_number (auto-generated)
    - product_id (from GRN item)
    - batch_number (from form)
    - quantity (from GRN item qty_received)
    - location_id (from form)
    - grn_id (link back to GRN)
    - status = 'available'
    - qa_status = warehouse_settings.default_qa_status OR form selection

#### AC 5: Validation (Pre-Transaction)
- **Given** GRN being created
- **When** validating
- **Then** reject if:
  - ASN not found (if from ASN)
  - PO not found or closed
  - Product not found
  - Location not found or inactive
  - Qty <= 0
  - Over-receipt not allowed (per AC 1 of Story 5.10)

#### AC 6: Error Handling & Rollback

| Failure Point | Error Message | Action |
|---------------|---------------|--------|
| ASN not found | "ASN #12345 no longer exists. Please refresh and try again." | Show error, reload page |
| Invalid supplier | "Supplier is inactive or does not exist. Please select a valid supplier." | Show error, select different |
| Invalid location | "Location 'WH-A-01' is inactive. Please select a different location." | Show error, select different |
| Invalid product | "Product SKU 'ABC123' no longer exists. Please verify product catalog." | Show error, update form |
| Duplicate LP# | "License Plate LP-001234 already exists. System will retry with next number." | Automatic retry (system generates new #) |
| PO update fails | "GRN creation aborted: Unable to update PO received quantity. Transaction rolled back." | Show error, refresh and retry |
| Transaction deadlock | "Operation in progress. Please try again in a moment." | Automatic retry (up to 3 attempts) |

#### AC 7: Concurrency Handling
- **Given** concurrent GRN creation for same ASN
- **When** second request arrives
- **Then**:
  - Check: ASN status = 'pending'
  - If first GRN already created: ASN status = 'completed'
  - Reject second with: "ASN #12345 is already being received. Please refresh."

#### AC 8: Success & Label Print
- **Given** GRN created successfully
- **When** transaction commits
- **Then**:
  - Show success toast: "GRN GRN-20250127-0001 created with 5 License Plates"
  - If warehouse_settings.auto_print_labels = true:
    - Generate ZPL labels for each LP
    - Send to configured printer (or show print preview)
  - Redirect to GRN detail page

#### AC 9: GRN Detail Page
- **Given** viewing GRN detail
- **When** page loads
- **Then** show:
  - GRN Number, Status
  - PO details
  - ASN details (if from ASN)
  - Created date, created by user
  - GRN Items table:
    - Product, Qty Received, Batch, Expiry
    - Link to created LP (click → see LP detail)
  - Actions: Print Labels, View LPs, Cancel GRN

#### AC 10: Cancel GRN
- **Given** GRN status = 'pending'
- **When** clicking "Cancel GRN"
- **Then**:
  - Confirm dialog: "Reverse all LPs and PO received quantities?"
  - On confirm: TRANSACTION:
    - Delete/reverse LPs created by this GRN
    - Decrement PO received_qty
    - Mark GRN status = 'cancelled'
  - On success: return to GRN list

### Technical Tasks

**Backend**
- [ ] Create grns and grn_items tables
- [ ] Implement POST /api/warehouse/grns (ATOMIC transaction)
  - Validate all inputs
  - Start transaction
  - Insert GRN, GRN items, LPs, update PO
  - Handle errors with specific messages
  - Rollback on failure

- [ ] Create grn transaction service

- [ ] Implement GET /api/warehouse/grns (list, filters)
- [ ] Implement GET /api/warehouse/grns/:id (detail)
- [ ] Implement POST /api/warehouse/grns/:id/cancel (reverse transaction)

**Database**
- [ ] Create grns table (see tech-spec)
- [ ] Create grn_items table
- [ ] Create unique index on (org_id, grn_number)
- [ ] Create FKs with proper constraints
- [ ] Create RLS policies

**Frontend**
- [ ] Create /app/warehouse/receiving page
  - PO/ASN selector
  - Items form with validation
  - "Receive Goods" button

- [ ] Create /app/warehouse/grns/:id detail page
- [ ] Create /app/warehouse/grns list page
- [ ] Link from ASN detail → "Receive" button

**Tests**
- [ ] Unit: atomicity test (success path - all inserts created)
- [ ] Unit: atomicity test (rollback - product not found)
- [ ] Unit: atomicity test (rollback - location not found)
- [ ] Unit: GRN number generation
- [ ] Integration: GRN + LP + PO update in one transaction
- [ ] Integration: concurrent GRN creation (second request rejected)
- [ ] E2E: ASN → Receive → GRN created → LPs created → PO updated

### Definition of Done
- ✅ All ACs 1-10 implemented and tested
- ✅ Atomic transaction working (all-or-nothing)
- ✅ GRN number format correct
- ✅ LPs created with correct data
- ✅ PO received_qty updated
- ✅ ASN status updated to 'completed'
- ✅ Error handling with specific messages
- ✅ Rollback tested for each error scenario
- ✅ Concurrency handled (prevent duplicate GRN for ASN)
- ✅ E2E: full flow ASN → GRN → 5 LPs → PO updated

**Dependencies:** Requires Story 5.1, 5.8, 5.10 (over-receipt validation)
**Estimated Effort:** 13 hours

---

## Story 5.12: Auto-Print Labels

**User Story:**
> As a **Warehouse user**, I want labels to print automatically, so that I can label inventory quickly.

**Story Points:** 5

### Acceptance Criteria

#### AC 1: ZPL Label Generation
- **Given** LP created during receiving
- **When** GRN completed (Story 5.11)
- **Then** generate ZPL (Zebra Printer Language) label for each LP:
  ```
  ^XA
  ^FO20,20^AAN,25,25^FDLicense Plate^FS
  ^FO20,50^AAN,20,20^FDLP-20250127-0001^FS
  ^FO20,80^AAN,15,15^FDProduct: FLOUR-001^FS
  ^FO20,110^AAN,15,15^FDQty: 50.00 kg^FS
  ^FO20,140^AAN,15,15^FDBatch: BATCH-123^FS
  ^FO20,170^AAN,15,15^FDExpiry: 2025-12-31^FS
  ^FO20,200^BY3,100^BCN,80,Y,N,N^FDLP-20250127-0001^FS
  ^XZ
  ```

#### AC 2: Label Content
- **Given** LP created
- **When** label generated
- **Then** label includes:
  - Title: "License Plate"
  - LP Number (bold, large)
  - Product Code + Name
  - Batch Number
  - Expiry Date
  - Quantity + UoM
  - Barcode (LP number in Code128 format)

#### AC 3: Auto-Print Trigger
- **Given** warehouse_settings.auto_print_labels = true
- **When** GRN completed (all LPs created)
- **Then**:
  - Generate ZPL for each LP
  - Send to configured printer device
  - Show confirmation: "3 labels sent to printer: WH-ZEBRA-01"

#### AC 4: Print Preview
- **Given** GRN completed, auto_print_labels = false
- **When** viewing GRN detail
- **Then** show button: "Print Labels"
  - Click → opens print preview dialog
  - Shows all LP labels (PDF or printable layout)
  - Print button → send to printer OR save as PDF

#### AC 5: Print Template Configuration
- **Given** Admin navigates to /settings/warehouse
- **When** viewing settings
- **Then** can configure:
  - Printer Name (text, e.g., "WH-ZEBRA-01")
  - Label Format (enum: ZPL, PDF)
  - Label Size (enum: 4x6, 3x5, etc.)
  - Auto-Print Enabled (checkbox)
  - Label Template (template editor - future P1)

#### AC 6: Label Reprint
- **Given** viewing LP detail
- **When** clicking "Reprint Label"
- **Then**:
  - Generate ZPL
  - Show print preview
  - Option to send to printer OR download PDF

### Technical Tasks

**Backend**
- [ ] Create label generation service (ZPL formatter)
  - Input: LP object (lp_number, product, batch, qty, uom, expiry)
  - Output: ZPL string

- [ ] Create printer integration service (stub for MVP)
  - Input: ZPL string, printer_name
  - Output: print job sent (or error)
  - MVP: just log to console or return ZPL for preview
  - P1: integrate with actual printer API

- [ ] Implement POST /api/warehouse/labels/generate
  - Input: lp_id
  - Output: ZPL string (for preview)

- [ ] Implement POST /api/warehouse/labels/print
  - Input: lp_id, printer_name
  - Output: print confirmation or error

**Frontend**
- [ ] Create label preview component
  - Show ZPL-rendered label (SVG or canvas)
  - Display barcode (using barcode library)
  - Show print button

- [ ] Create PrintLabelsModal
  - List of LPs to print
  - Printer selector
  - "Print All" button

- [ ] Add "Reprint Label" button to LP detail page

**Tests**
- [ ] Unit: ZPL generation (format validation)
- [ ] Unit: label content (all fields present)
- [ ] E2E: GRN → LPs created → labels generated → preview shows correct content

### Definition of Done
- ✅ ZPL generation working
- ✅ Label contains all required fields
- ✅ Auto-print triggers on GRN completion (if enabled)
- ✅ Print preview functional
- ✅ Reprint available from LP detail
- ✅ Label format matches warehouse_settings config

**Dependencies:** Requires Story 5.11 (GRN creation)
**Estimated Effort:** 5 hours

---

## Story 5.13: Update PO/TO Received Qty

**User Story:**
> As a **System**, I want to update PO/TO quantities on receiving, so that status is accurate.

**Story Points:** 5

### Acceptance Criteria

#### AC 1: Update PO Received Qty
- **Given** GRN created from PO (Story 5.11 already does this)
- **When** GRN completed
- **Then** update PO:
  - For each po_line: `received_qty += grn_item.qty_received`
  - Example: po_line ordered 100, received 50 → now received 70 (if second GRN has 20)

#### AC 2: PO Status Transition
- **Given** PO status = 'Confirmed'
- **When** ANY qty received (received_qty > 0)
- **Then** PO status → 'Receiving'

- **Given** all po_lines fully received (each line: received_qty >= ordered_qty)
- **When** last item received
- **Then** PO status → 'Closed'

#### AC 3: TO Received Qty (Future Dependency on Story 3.6)
- **Given** Transfer Order in 'Shipped' status
- **When** receiving goods at destination warehouse
- **Then** same logic as PO:
  - Update to_line.received_qty
  - When all lines received: TO status → 'Received'

#### AC 4: Display in PO/TO Detail
- **Given** viewing PO detail
- **When** page loads
- **Then** show for each line:
  - Ordered Qty
  - Received Qty (updated in real-time)
  - Remaining Qty = Ordered - Received
  - Status badge: "Pending" / "Partial" / "Complete"
  - Example: "Ordered: 100 | Received: 50 | Remaining: 50"

#### AC 5: Validation
- **Given** PO status = 'Closed'
- **When** attempting to receive more goods
- **Then** reject with: "PO is already closed. No more receiving allowed."

#### AC 6: History Display
- **Given** viewing PO/TO detail
- **When** expanding "Receiving History"
- **Then** show:
  - GRN Number (link)
  - Date Received
  - Qty Received
  - By User
  - Link to LPs created

### Technical Tasks

**Backend**
- [ ] Update purchase_order_lines table (if not already): add received_qty column
- [ ] Update transfer_order_lines table: add received_qty column (future)
- [ ] In GRN creation (Story 5.11), already updates po_line.received_qty
- [ ] Add PO status transition logic:
  - received_qty > 0 → status = 'Receiving'
  - all lines received >= ordered → status = 'Closed'

- [ ] Implement endpoint: GET /api/purchase-orders/:id/receiving-history
  - List all GRNs linked to this PO
  - Show items, dates, users

**Frontend**
- [ ] Update PO detail page to show received_qty
- [ ] Add "Receiving History" section
- [ ] Show status badges: Pending, Partial, Complete
- [ ] Display remaining qty calculation

**Tests**
- [ ] Unit: status transition logic (Confirmed → Receiving → Closed)
- [ ] Integration: GRN → PO update → status change
- [ ] E2E: Create PO → 2x GRN partially → Receiving status → 3rd GRN fully → Closed status

### Definition of Done
- ✅ PO received_qty updates on GRN creation
- ✅ PO status transitions correctly
- ✅ Remaining qty calculated correctly
- ✅ Cannot receive after PO closed
- ✅ History shows all GRNs linked to PO
- ✅ UI displays status badges

**Dependencies:** Requires Story 5.11 (GRN creates)
**Estimated Effort:** 5 hours

---

## Summary

**Batch 5A Total:**
- **Stories:** 5.1-5.13 (13 stories)
- **Total Story Points:** 91
- **Total Effort Estimate:** ~110-130 hours
- **Duration:** ~3-4 weeks (2-person team)

**Key Dependencies:**
- ✅ Epic 1: Organizations, Users, Locations, Warehouses
- ✅ Epic 2: Products with UoM, Suppliers
- ✅ Epic 3: Purchase Orders (po_lines)
- ⏳ Epic 4: Work Orders (for Story 5.7 genealogy - wo_id link)

**Implementation Sequence:**
1. **Week 1**: Stories 5.1-5.4 (LP Core) + 5.7 (Genealogy) in parallel
2. **Week 2**: Stories 5.5-5.6 (Split/Merge) + 5.8-5.10 (ASN) in parallel
3. **Week 3**: Stories 5.11-5.13 (GRN/Receiving/Labels) + integration testing
4. **Week 4**: E2E testing, refinement, deployment prep

**Batch 5A Success Criteria:**
- ✅ All 13 stories implemented
- ✅ Full receiving workflow: PO → ASN → GRN → LP → PO updated
- ✅ Genealogy tracking with atomicity & validation
- ✅ 100% test coverage for critical paths
- ✅ RLS policies for multi-tenancy
- ✅ Label printing functional
