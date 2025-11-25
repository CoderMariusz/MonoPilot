# Story 2.16: Routing Operations

**Epic:** 2 - Technical Core
**Batch:** 2C - Routing System
**Status:** Completed (Backend)
**Priority:** P1 (High)
**Story Points:** 8
**Created:** 2025-11-23

---

## Goal

Enable Technical users to define step-by-step operations within a routing, including sequencing, resource assignment, time estimates, and costs.

## User Story

**As a** Technical user
**I want** to add and manage operations within a routing
**So that** we can define the exact production steps, assign machines/lines, and estimate time and costs

---

## Problem Statement

A routing without operations is just a name. To make routings actionable for production:
- Work orders need to know which operations to execute and in what order
- Production tracking needs to record progress through each operation step
- Capacity planning needs operation durations to estimate throughput
- Cost accounting needs labor costs per operation

Operations transform routings from abstract definitions into executable production plans.

---

## Acceptance Criteria

### AC-2.16.1: Add Operation Modal

**Given** I am viewing a routing detail page
**And** I have Admin or Technical role
**When** I click "Add Operation" button
**Then** a modal dialog opens with the title "Add Operation"

**And** the form contains fields:
- **Sequence** (number input, required, placeholder: "1")
  - Validation: positive integer, must be unique within this routing
  - Helper text: "Execution order (1, 2, 3...)"

- **Operation Name** (text input, required, placeholder: "e.g., Mixing")
  - Validation: 1-100 chars

- **Machine** (dropdown, optional)
  - Options: machines from current organization (from machines table)
  - Shows: machine code + name
  - Searchable dropdown
  - Clear button to remove selection

- **Production Line** (dropdown, optional)
  - Options: production lines from current organization
  - Shows: line code + name
  - Searchable dropdown
  - Clear button to remove selection

- **Expected Duration** (number input, required, placeholder: "60")
  - Label: "Expected Duration (minutes)"
  - Validation: positive integer
  - Helper text: "Time to complete this operation"

- **Setup Time** (number input, optional, default: 0, placeholder: "15")
  - Label: "Setup Time (minutes)"
  - Validation: non-negative integer
  - Helper text: "Time to prepare machine/line before operation"

- **Expected Yield** (number input, optional, default: 100.00, placeholder: "98.5")
  - Label: "Expected Yield (%)"
  - Validation: 0.01 - 100.00
  - Helper text: "Percentage of input expected as output"

- **Labor Cost** (number input, optional, placeholder: "25.50")
  - Label: "Labor Cost"
  - Validation: non-negative decimal
  - Helper text: "Cost for this operation (optional)"

**And** form has buttons:
- "Cancel" (closes modal, no save)
- "Add Operation" (saves and closes)

**API Endpoint:**
```
POST /api/technical/routings/:id/operations
Body: {
  sequence: number,
  operation_name: string,
  machine_id?: string,
  line_id?: string,
  expected_duration_minutes: number,
  setup_time_minutes?: number,
  expected_yield_percent?: number,
  labor_cost?: number
}
Response: {
  operation: RoutingOperation,
  message: string
}
```

**Success Criteria:**
- Form validation shows inline errors
- Machine/line dropdowns populated from organization data
- Sequence uniqueness validated on blur
- Created operation appears in operations table immediately
- Operations table re-sorts by sequence after addition
- Success toast: "Operation added successfully"

---

### AC-2.16.2: Operations List Display

**Given** I am viewing a routing detail page
**When** the Operations section loads
**Then** I see a table with operations ordered by sequence (ascending)

**And** the table has columns:
- **Seq** (sequence number, small column)
- **Operation Name**
- **Machine** (code, or "—" if not assigned)
- **Line** (code, or "—" if not assigned)
- **Duration** (minutes, formatted: "60 min")
- **Setup** (minutes, formatted: "15 min")
- **Yield** (percentage, formatted: "98.5%")
- **Labor Cost** (formatted: "$25.50" or "—")
- **Actions** (Edit, Delete icons)

**And** table shows drag handle icon at the start of each row for reordering

**Success Criteria:**
- Operations loaded from GET /api/technical/routings/:id/operations
- Empty state if no operations: "No operations defined. Add your first operation to get started."
- Loading skeleton during fetch
- Sequence numbers displayed prominently
- Machine/line show code (hover shows full name)

---

### AC-2.16.3: Drag-Drop Operation Reordering

**Given** I am viewing operations list with multiple operations
**And** I have Admin or Technical role
**When** I drag an operation row and drop it in a new position
**Then** the operations are reordered
**And** sequence numbers are automatically recalculated to maintain order

**Example:**
```
Before:
1. Mixing
2. Baking
3. Cooling

User drags "Cooling" to position 1

After:
1. Cooling   (was 3)
2. Mixing    (was 1)
3. Baking    (was 2)
```

**API Endpoint:**
```
POST /api/technical/routings/:id/operations/reorder
Body: {
  operations: [
    { id: "uuid1", sequence: 1 },
    { id: "uuid2", sequence: 2 },
    { id: "uuid3", sequence: 3 }
  ]
}
Response: {
  success: true,
  message: string
}
```

**Success Criteria:**
- Drag indicator shows while dragging
- Drop zones highlighted
- Sequence numbers update immediately after drop
- API call batches all sequence updates
- Success toast: "Operations reordered successfully"
- No page refresh needed

---

### AC-2.16.4: Edit Operation Drawer

**Given** I am viewing operations list
**And** I have Admin or Technical role
**When** I click the "Edit" icon for an operation
**Then** a right-side drawer opens with the title "Edit Operation"

**And** the form contains the same fields as Add Operation form
**And** all fields are pre-filled with current values

**When** I update any field and click "Save Changes"
**Then** operation is updated via PUT /api/technical/routings/:id/operations/:operationId
**And** the operations table refreshes with updated values
**And** success toast appears: "Operation updated successfully"

**API Endpoint:**
```
PUT /api/technical/routings/:id/operations/:operationId
Body: {
  sequence?: number,
  operation_name?: string,
  machine_id?: string | null,
  line_id?: string | null,
  expected_duration_minutes?: number,
  setup_time_minutes?: number,
  expected_yield_percent?: number,
  labor_cost?: number | null
}
Response: {
  operation: RoutingOperation,
  message: string
}
```

**Success Criteria:**
- All validations same as Add form
- Sequence uniqueness enforced (except current value)
- Drawer closes on successful save
- Table updates without page reload

---

### AC-2.16.5: Delete Operation Confirmation

**Given** I am viewing operations list
**And** I have Admin role
**When** I click the "Delete" icon for an operation
**Then** a confirmation dialog appears

**And** the dialog shows:
- Title: "Delete Operation?"
- Message: "Are you sure you want to delete operation '[Operation Name]' (Seq: X)? This action cannot be undone."
- Warning icon (red)
- Buttons:
  - "Cancel" (closes dialog)
  - "Delete" (red, destructive action)

**When** I click "Delete"
**Then** operation is deleted via DELETE /api/technical/routings/:id/operations/:operationId
**And** the operations table refreshes
**And** remaining operations keep their sequence numbers (no auto-renumbering)
**And** success toast appears: "Operation deleted successfully"

**API Endpoint:**
```
DELETE /api/technical/routings/:id/operations/:operationId
Response: {
  success: true,
  message: string
}
```

**Success Criteria:**
- Confirmation prevents accidental deletion
- Table updates immediately after delete
- Sequence gaps allowed (e.g., 1, 2, 4, 5 after deleting 3)

---

### AC-2.16.6: Sequence Uniqueness Validation

**Given** I am adding a new operation
**When** I enter a sequence number that already exists in this routing
**Then** an error message appears: "Sequence X already exists. Choose a different sequence number."
**And** the "Add Operation" button is disabled

**When** I edit an operation and change its sequence to an existing number
**Then** the same error appears

**When** I choose a unique sequence number
**Then** the error clears and the save button is enabled

**Success Criteria:**
- Database enforces uniqueness: `UNIQUE (routing_id, sequence)`
- Frontend validates on blur before submission
- Clear error message

---

### AC-2.16.7: Machine and Line Dropdowns

**Given** I am adding or editing an operation
**When** I click the "Machine" dropdown
**Then** I see a list of machines from my organization
**And** each option shows: "[Machine Code] - [Machine Name]"
**And** I can search/filter machines by code or name
**And** I can clear the selection to set machine_id to null

**When** I click the "Production Line" dropdown
**Then** I see a list of production lines from my organization
**And** each option shows: "[Line Code] - [Line Name]"
**And** I can search/filter lines by code or name
**And** I can clear the selection to set line_id to null

**Success Criteria:**
- Dropdowns populated from GET /api/settings/machines and GET /api/settings/lines
- Only active machines/lines shown
- Searchable combobox (shadcn/ui Combobox component)
- Both fields are optional (can be null)

---

### AC-2.16.8: Operation Time Calculations

**Given** an operation has:
- Setup time: 15 minutes
- Expected duration: 60 minutes
**When** displayed in UI or reports
**Then** total time = 75 minutes

**Success Criteria:**
- Frontend calculates total time where needed
- Reports show setup + duration separately
- Work orders use total time for scheduling

---

### AC-2.16.9: Yield Percentage Usage

**Given** an operation has expected yield of 95%
**And** input quantity is 100 kg
**When** calculating expected output
**Then** expected output = 100 kg × 0.95 = 95 kg

**Success Criteria:**
- Yield applied during work order quantity calculations (Epic 3)
- Yield defaults to 100% (no loss)
- Yield validation: 0.01% - 100%

---

### AC-2.16.10: Operations Summary Card

**Given** I am viewing a routing detail page
**When** the Operations section loads
**Then** above the operations table, I see a summary card showing:
- Total operations: X
- Total duration: Y minutes (sum of all expected_duration_minutes)
- Total setup time: Z minutes (sum of all setup_time_minutes)
- Total labor cost: $A (sum of all labor_cost, or "—" if any are null)

**Success Criteria:**
- Summary updates when operations added/edited/deleted
- Duration formatted: "120 min" or "2h 30min" if > 60
- Cost formatted: "$XXX.XX"

---

## Technical Requirements

### Database Schema

**Table: routing_operations**
```sql
CREATE TABLE routing_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routing_id UUID NOT NULL REFERENCES routings(id) ON DELETE CASCADE,

  sequence INTEGER NOT NULL,
  operation_name VARCHAR(100) NOT NULL,

  machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  line_id UUID REFERENCES production_lines(id) ON DELETE SET NULL,

  expected_duration_minutes INTEGER NOT NULL,
  expected_yield_percent DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  setup_time_minutes INTEGER DEFAULT 0,
  labor_cost DECIMAL(10,2),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT routing_operations_unique_sequence UNIQUE (routing_id, sequence),
  CONSTRAINT routing_operations_sequence_check CHECK (sequence > 0),
  CONSTRAINT routing_operations_yield_check CHECK (expected_yield_percent > 0 AND expected_yield_percent <= 100),
  CONSTRAINT routing_operations_duration_check CHECK (expected_duration_minutes > 0),
  CONSTRAINT routing_operations_setup_time_check CHECK (setup_time_minutes >= 0)
);
```

### API Endpoints

1. **GET /api/technical/routings/:id/operations**
   - Returns: { operations: RoutingOperation[], total: number }
   - Operations ordered by sequence ASC

2. **POST /api/technical/routings/:id/operations**
   - Body: CreateOperationInput
   - Returns: { operation: RoutingOperation, message: string }
   - Auth: Admin, Technical

3. **PUT /api/technical/routings/:id/operations/:operationId**
   - Body: UpdateOperationInput
   - Returns: { operation: RoutingOperation, message: string }
   - Auth: Admin, Technical

4. **DELETE /api/technical/routings/:id/operations/:operationId**
   - Returns: { success: true, message: string }
   - Auth: Admin

5. **POST /api/technical/routings/:id/operations/reorder**
   - Body: { operations: Array<{id, sequence}> }
   - Returns: { success: true, message: string }
   - Auth: Admin, Technical

---

## Implementation Status

### ✅ Completed (Backend)
- [x] Database migration (021_create_routing_operations_table.sql)
- [x] Service layer (routing-service.ts - operations functions)
- [x] Validation schemas (routing-schemas.ts - operation schemas)
- [x] API routes (GET, POST, PUT, DELETE, reorder)
- [x] RLS policies (via routing FK)
- [x] Unique sequence constraint
- [x] Yield/duration/sequence validation

### ⏳ Pending (Frontend)
- [ ] Operations table component
- [ ] Add operation modal
- [ ] Edit operation drawer
- [ ] Delete confirmation dialog
- [ ] Drag-drop reordering UI
- [ ] Machine/line dropdowns
- [ ] Operations summary card

---

## Testing Checklist

### Unit Tests
- [ ] Sequence validation (positive, unique)
- [ ] Yield validation (0.01-100%)
- [ ] Duration validation (positive)
- [ ] Setup time validation (non-negative)

### Integration Tests
- [ ] Create operation API
- [ ] Update operation API (sequence conflict handling)
- [ ] Delete operation API
- [ ] Reorder operations API
- [ ] RLS policy enforcement via routing

### E2E Tests
- [ ] Add operation to routing
- [ ] Edit operation
- [ ] Delete operation
- [ ] Drag-drop reorder operations
- [ ] Assign machine to operation
- [ ] Assign line to operation

---

## Dependencies

### Requires
- ✅ Story 2.15: Routing CRUD
- ✅ Epic 1 Story 1.7: Machines
- ✅ Epic 1 Story 1.8: Production Lines

### Enables
- 🔄 Epic 3: Work Orders (operation execution)
- 🔄 Epic 4: Production (operation tracking)
- 🔄 Epic 5: Capacity Planning (duration-based scheduling)

---

## UI/UX Notes

### Drag-Drop Implementation
- Use `@dnd-kit/core` and `@dnd-kit/sortable` for React drag-drop
- Visual feedback: dragging item slightly elevated, drop zones highlighted
- Auto-scroll when dragging near table edges
- Touch support for mobile/tablet

### Machine/Line Dropdowns
- Use shadcn/ui Combobox component
- Searchable with keyboard navigation
- Show "(Not assigned)" option to clear selection
- Display both code and name for clarity

### Sequence Gaps
- Allow gaps after deletion (don't auto-renumber)
- Users can manually reorder to close gaps if desired
- Sequence gaps have no functional impact (only visual)

---

## Notes

- Operations cascade delete when routing is deleted
- Machine/line deletion sets operation FK to NULL (ON DELETE SET NULL)
- Sequence gaps are allowed and don't affect operation execution
- Labor cost is optional - used for cost accounting reports
- Yield affects output quantity in work orders (Epic 3)

**Implementation Reference:**
- Tech Spec: `docs/sprint-artifacts/tech-spec-epic-2-batch-2c-routing.md`
- Migration: `apps/frontend/lib/supabase/migrations/021_create_routing_operations_table.sql`
- Service: `apps/frontend/lib/services/routing-service.ts`
