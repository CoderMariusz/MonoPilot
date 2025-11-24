# Story 3.6: Transfer Order CRUD

**Epic:** 3 - Planning Operations
**Batch:** 3B - Transfer Orders
**Status:** Draft
**Priority:** P0 (Blocker)
**Story Points:** 5
**Created:** 2025-01-23

---

## Goal

Create and manage Transfer Orders (TO) for moving inventory between warehouses, with CRUD operations, auto-generated TO numbers, and status-based workflow.

## User Story

**As a** Warehouse user
**I want** to create, edit, and view transfer orders
**So that** I can manage inventory transfers between warehouses efficiently

---

## Problem Statement

MonoPilot currently lacks the ability to transfer inventory between warehouses in a structured way. Users need:
1. A way to plan transfers with from/to warehouse selection
2. Tracking of planned vs actual ship/receive dates
3. Auto-generated unique TO numbers for identification
4. Status workflow to track transfer progress
5. Validation to prevent common errors (same warehouse transfer, invalid dates)

Without Transfer Orders, inter-warehouse movements are untracked, leading to inventory discrepancies and lack of audit trail.

---

## Acceptance Criteria

### AC-3.6.1: Transfer Order List Page
**Given** I have Warehouse role or higher
**When** I navigate to `/planning/transfer-orders`
**Then** I should see a table with columns: TO Number, From Warehouse, To Warehouse, Status, Planned Ship Date, Planned Receive Date, Actions

**Success Criteria:**
- ✅ Table displays all TOs for current organization (RLS enforced)
- ✅ Sortable by TO Number, Status, Ship Date (default: newest first)
- ✅ Filterable by: Status (dropdown), From Warehouse (dropdown), To Warehouse (dropdown), Date Range (date pickers)
- ✅ Search by TO Number (text input, searches `to_number` field)
- ✅ Pagination: 50 TOs per page
- ✅ Status badges color-coded: Draft (gray), Planned (blue), Partially Shipped (yellow), Shipped (green), Partially Received (orange), Received (green), Cancelled (red)
- ✅ Empty state: "No Transfer Orders found. Create your first TO to move inventory between warehouses."

---

### AC-3.6.2: Create Transfer Order Modal
**Given** I am on `/planning/transfer-orders`
**When** I click "Add Transfer Order" button
**Then** a Create TO modal should open with form fields:
- From Warehouse (required, dropdown)
- To Warehouse (required, dropdown)
- Planned Ship Date (required, date picker)
- Planned Receive Date (required, date picker)
- Notes (optional, textarea, max 500 chars)

**Success Criteria:**
- ✅ Modal title: "Create Transfer Order"
- ✅ From Warehouse dropdown populated from `GET /api/settings/warehouses`
- ✅ To Warehouse dropdown excludes selected From Warehouse (validation: from ≠ to)
- ✅ Planned Receive Date picker min date = Planned Ship Date (validation: receive >= ship)
- ✅ Cancel button closes modal without changes
- ✅ Save button disabled until required fields filled

**Validation Errors:**
- ❌ From Warehouse = To Warehouse → "Source and destination warehouse must be different"
- ❌ Planned Receive Date < Planned Ship Date → "Receive date must be on or after ship date"
- ❌ Empty From/To Warehouse → "This field is required"
- ❌ Empty Planned Ship Date → "This field is required"

---

### AC-3.6.3: Save Transfer Order
**Given** I have filled the Create TO form with valid data
**When** I click "Save Transfer Order"
**Then** a new Transfer Order should be created with:
- Auto-generated `to_number` (format: TO-YYYY-NNN, e.g., TO-2025-001)
- `from_warehouse_id` = selected From Warehouse
- `to_warehouse_id` = selected To Warehouse
- `planned_ship_date` = selected date
- `planned_receive_date` = selected date
- `status` = 'draft'
- `notes` = entered text (if any)
- `created_by` = current user ID
- `created_at` = current timestamp

**Success Criteria:**
- ✅ `to_number` unique per organization (format: TO-YYYY-{sequential 3-digit number})
- ✅ TO inserted into `transfer_orders` table via `POST /api/planning/transfer-orders`
- ✅ RLS policy enforced: `org_id` = current user's organization
- ✅ Modal closes on successful save
- ✅ TO list refreshes showing new TO at top (sorted by created_at DESC)
- ✅ Success toast: "Transfer Order TO-2025-001 created successfully"
- ✅ Redirect to TO detail page: `/planning/transfer-orders/:id`

**API Endpoint:**
```
POST /api/planning/transfer-orders
Body: {
  from_warehouse_id: UUID,
  to_warehouse_id: UUID,
  planned_ship_date: ISO string,
  planned_receive_date: ISO string,
  notes?: string
}
Response: TransferOrder object
```

---

### AC-3.6.4: View Transfer Order Detail
**Given** a Transfer Order exists (e.g., TO-2025-001)
**When** I click on the TO row in the table
**Then** I should be navigated to `/planning/transfer-orders/:id` showing:
- **Header:**
  - TO Number (e.g., TO-2025-001)
  - Status badge (e.g., "Draft")
  - Created by, Created at
- **Transfer Details Card:**
  - From Warehouse: name + code
  - To Warehouse: name + code
  - Planned Ship Date
  - Planned Receive Date
  - Actual Ship Date (empty if not shipped)
  - Actual Receive Date (empty if not received)
  - Notes
- **Action Buttons:**
  - Edit (if status = 'draft')
  - Delete (if status = 'draft')
  - Change Status (Plan TO, Ship TO, Receive TO - context-dependent)
- **TO Lines Section:**
  - Table showing TO lines (initially empty, see Story 3.7)
  - "Add Line" button (if status = 'draft')

**Success Criteria:**
- ✅ Detail page loads via `GET /api/planning/transfer-orders/:id`
- ✅ All fields displayed correctly from database
- ✅ Status badge matches TO status
- ✅ Edit/Delete buttons hidden if status ≠ 'draft'
- ✅ "Add Line" button hidden if status ≠ 'draft'

---

### AC-3.6.5: Edit Transfer Order
**Given** I am viewing a TO with status = 'draft'
**When** I click "Edit Transfer Order"
**Then** an Edit TO drawer should open with pre-filled fields:
- From Warehouse (read-only, cannot change)
- To Warehouse (read-only, cannot change)
- Planned Ship Date (editable)
- Planned Receive Date (editable)
- Notes (editable)

**When** I update fields and click "Save"
**Then** the TO should be updated via `PUT /api/planning/transfer-orders/:id`

**Success Criteria:**
- ✅ Drawer title: "Edit Transfer Order - TO-2025-001"
- ✅ From/To Warehouse fields disabled (grayed out with tooltip: "Cannot change warehouses after creation")
- ✅ Validation same as create (receive date >= ship date)
- ✅ On save: TO updated, drawer closes, detail page refreshes
- ✅ Success toast: "Transfer Order updated"
- ✅ `updated_by` and `updated_at` fields updated

**Validation:**
- ❌ Cannot edit if status ≠ 'draft' → Error: "Cannot edit Transfer Order after planning. Status: Planned"

**API Endpoint:**
```
PUT /api/planning/transfer-orders/:id
Body: {
  planned_ship_date?: ISO string,
  planned_receive_date?: ISO string,
  notes?: string
}
Response: TransferOrder object
```

---

### AC-3.6.6: Delete Transfer Order
**Given** I am viewing a TO with status = 'draft'
**When** I click "Delete Transfer Order"
**Then** a confirmation modal should appear:
- Title: "Delete Transfer Order?"
- Message: "Are you sure you want to delete TO-2025-001? This action cannot be undone."
- Buttons: Cancel, Delete

**When** I click "Delete"
**Then** the TO should be deleted via `DELETE /api/planning/transfer-orders/:id`

**Success Criteria:**
- ✅ Confirmation modal prevents accidental deletion
- ✅ On confirm: TO deleted from database (hard delete, no soft delete)
- ✅ TO lines cascade deleted (`ON DELETE CASCADE` on FK)
- ✅ Redirect to `/planning/transfer-orders` list page
- ✅ Success toast: "Transfer Order TO-2025-001 deleted"
- ✅ TO no longer appears in list

**Validation:**
- ❌ Cannot delete if status ≠ 'draft' → Error: "Cannot delete Transfer Order with status: Shipped. Only Draft TOs can be deleted."

**API Endpoint:**
```
DELETE /api/planning/transfer-orders/:id
Response: { success: true }
```

---

### AC-3.6.7: Change TO Status to 'Planned'
**Given** I am viewing a TO with status = 'draft' and at least 1 TO line exists
**When** I click "Plan Transfer Order"
**Then** the TO status should change to 'planned' via `PUT /api/planning/transfer-orders/:id/status`

**Success Criteria:**
- ✅ Status badge updates: "Draft" → "Planned"
- ✅ Edit and Delete buttons hidden (status ≠ 'draft')
- ✅ "Ship Transfer Order" button appears
- ✅ Success toast: "Transfer Order TO-2025-001 marked as Planned"
- ✅ Audit log entry created: status change logged

**Validation:**
- ❌ Cannot plan if TO has 0 lines → Error: "Cannot plan Transfer Order without lines. Add at least one product."

**API Endpoint:**
```
PUT /api/planning/transfer-orders/:id/status
Body: { status: 'planned' }
Response: TransferOrder object
```

---

### AC-3.6.8: TO Number Auto-Generation
**Given** I create multiple Transfer Orders
**Then** TO numbers should be auto-generated sequentially:
- First TO in 2025: TO-2025-001
- Second TO in 2025: TO-2025-002
- ...
- 999th TO in 2025: TO-2025-999
- First TO in 2026: TO-2026-001

**Success Criteria:**
- ✅ Format: TO-{YYYY}-{NNN} where YYYY = year, NNN = 3-digit sequential number
- ✅ Unique constraint: `(org_id, to_number)` prevents duplicates
- ✅ Sequence resets each year (001 on Jan 1)
- ✅ Thread-safe: concurrent TO creation doesn't skip numbers or create duplicates
- ✅ Fallback: if number collision (unlikely), retry with next number

**Implementation:**
- Query max TO number for current year: `SELECT to_number FROM transfer_orders WHERE org_id = ? AND to_number LIKE 'TO-2025-%' ORDER BY to_number DESC LIMIT 1`
- Extract number: TO-2025-042 → 42
- Increment: 42 + 1 = 43
- Format: TO-2025-043

---

## Technical Implementation

### Database Schema

```sql
-- Migration: 020_create_transfer_orders_table.sql

CREATE TABLE transfer_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  to_number VARCHAR(20) NOT NULL,
  from_warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  to_warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  planned_ship_date DATE NOT NULL,
  planned_receive_date DATE NOT NULL,
  actual_ship_date DATE,
  actual_receive_date DATE,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: TO number unique per organization
CREATE UNIQUE INDEX idx_transfer_orders_to_number ON transfer_orders(org_id, to_number);

-- Indexes for performance
CREATE INDEX idx_transfer_orders_from_warehouse ON transfer_orders(from_warehouse_id);
CREATE INDEX idx_transfer_orders_to_warehouse ON transfer_orders(to_warehouse_id);
CREATE INDEX idx_transfer_orders_status ON transfer_orders(org_id, status);
CREATE INDEX idx_transfer_orders_ship_date ON transfer_orders(org_id, planned_ship_date);

-- RLS Policy
ALTER TABLE transfer_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY transfer_orders_org_isolation ON transfer_orders
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Validation constraint: from_warehouse ≠ to_warehouse
ALTER TABLE transfer_orders ADD CONSTRAINT check_different_warehouses
  CHECK (from_warehouse_id != to_warehouse_id);

-- Validation constraint: receive date >= ship date
ALTER TABLE transfer_orders ADD CONSTRAINT check_receive_after_ship
  CHECK (planned_receive_date >= planned_ship_date);

-- Enum for status (optional, using varchar for flexibility)
COMMENT ON COLUMN transfer_orders.status IS 'Valid values: draft, planned, partially_shipped, shipped, partially_received, received, cancelled';
```

### Zod Schema

```typescript
// lib/validation/transfer-order-schemas.ts

import { z } from 'zod'

export const CreateTransferOrderSchema = z.object({
  from_warehouse_id: z.string().uuid('Invalid warehouse ID'),
  to_warehouse_id: z.string().uuid('Invalid warehouse ID'),
  planned_ship_date: z.string().datetime('Invalid date format'),
  planned_receive_date: z.string().datetime('Invalid date format'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
}).refine(data => data.from_warehouse_id !== data.to_warehouse_id, {
  message: 'Source and destination warehouse must be different',
  path: ['to_warehouse_id']
}).refine(data => new Date(data.planned_receive_date) >= new Date(data.planned_ship_date), {
  message: 'Receive date must be on or after ship date',
  path: ['planned_receive_date']
})

export const UpdateTransferOrderSchema = z.object({
  planned_ship_date: z.string().datetime().optional(),
  planned_receive_date: z.string().datetime().optional(),
  notes: z.string().max(500).optional()
}).refine(data => {
  if (data.planned_ship_date && data.planned_receive_date) {
    return new Date(data.planned_receive_date) >= new Date(data.planned_ship_date)
  }
  return true
}, {
  message: 'Receive date must be on or after ship date',
  path: ['planned_receive_date']
})

export const ChangeToStatusSchema = z.object({
  status: z.enum(['planned', 'shipped', 'received', 'cancelled'])
})
```

### API Routes

```typescript
// app/api/planning/transfer-orders/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateTransferOrderSchema } from '@/lib/validation/transfer-order-schemas'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  // Build query
  let query = supabase
    .from('transfer_orders')
    .select(`
      *,
      from_warehouse:warehouses!from_warehouse_id(id, code, name),
      to_warehouse:warehouses!to_warehouse_id(id, code, name)
    `)
    .order('created_at', { ascending: false })

  // Apply filters
  if (searchParams.get('status')) {
    query = query.eq('status', searchParams.get('status'))
  }
  if (searchParams.get('from_warehouse_id')) {
    query = query.eq('from_warehouse_id', searchParams.get('from_warehouse_id'))
  }
  if (searchParams.get('to_warehouse_id')) {
    query = query.eq('to_warehouse_id', searchParams.get('to_warehouse_id'))
  }
  if (searchParams.get('search')) {
    query = query.ilike('to_number', `%${searchParams.get('search')}%`)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  // Validate
  const result = CreateTransferOrderSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Generate TO number
  const org_id = (user.user_metadata.org_id as string) || user.id
  const year = new Date().getFullYear()
  const prefix = `TO-${year}-`

  const { data: maxTo } = await supabase
    .from('transfer_orders')
    .select('to_number')
    .eq('org_id', org_id)
    .like('to_number', `${prefix}%`)
    .order('to_number', { ascending: false })
    .limit(1)
    .single()

  let nextNumber = 1
  if (maxTo && maxTo.to_number) {
    const currentNumber = parseInt(maxTo.to_number.split('-')[2])
    nextNumber = currentNumber + 1
  }

  const to_number = `${prefix}${nextNumber.toString().padStart(3, '0')}`

  // Insert TO
  const { data: to, error } = await supabase
    .from('transfer_orders')
    .insert({
      org_id,
      to_number,
      from_warehouse_id: result.data.from_warehouse_id,
      to_warehouse_id: result.data.to_warehouse_id,
      planned_ship_date: result.data.planned_ship_date,
      planned_receive_date: result.data.planned_receive_date,
      notes: result.data.notes,
      status: 'draft',
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(to, { status: 201 })
}
```

---

## Testing Requirements

### Unit Tests (Vitest)
- ✅ `CreateTransferOrderSchema` validation (from ≠ to, receive >= ship)
- ✅ `UpdateTransferOrderSchema` validation
- ✅ TO number generator (sequential, year reset, thread-safe)

### Integration Tests (Vitest + Supabase)
- ✅ `POST /api/planning/transfer-orders` creates TO with auto-generated number
- ✅ `GET /api/planning/transfer-orders` returns TO list filtered by status
- ✅ `PUT /api/planning/transfer-orders/:id` updates TO (draft only)
- ✅ `DELETE /api/planning/transfer-orders/:id` deletes TO (draft only)
- ✅ RLS policy: User A cannot view User B's TOs (different org)
- ✅ Validation: Cannot create TO with from = to warehouse (400)
- ✅ Validation: Cannot create TO with receive < ship date (400)
- ✅ Unique constraint: Cannot create duplicate to_number (409)

### E2E Tests (Playwright)
- ✅ Create TO: Fill form, save, verify TO-2025-001 created
- ✅ Edit TO: Update dates, save, verify changes
- ✅ Delete TO: Confirm deletion, verify TO removed from list
- ✅ Filter TOs: Select status filter, verify filtered results
- ✅ Search TOs: Enter TO number, verify search results
- ✅ Validation errors: Submit form with from = to warehouse, verify error message

---

## Dependencies

### Prerequisite Stories
- ✅ Story 1.5: Warehouse Configuration (warehouses table exists)
- ✅ Story 2.1: Product CRUD (products table exists for TO lines in Story 3.7)

### Consumed APIs
- `GET /api/settings/warehouses` (Epic 1) - Populate from/to warehouse dropdowns

### Provides APIs for
- Story 3.7: TO Line Management
- Story 3.8: Partial Shipments
- Story 3.9: LP Selection

---

## Notes / References

- **Tech Spec:** `docs/sprint-artifacts/tech-spec-epic-3-batch-3b.md`
- **Epic Story:** `docs/epics/epic-3-planning.md` (Story 3.6)
- **UX Design:** `docs/ux-design-planning-module.md` (Transfer Orders section)
- **Database Migration:** `lib/supabase/migrations/020_create_transfer_orders_table.sql`
- **Zod Schemas:** `lib/validation/transfer-order-schemas.ts`
- **API Routes:** `app/api/planning/transfer-orders/route.ts`
- **UI Components:** `app/(authenticated)/planning/transfer-orders/page.tsx`

---

**Definition of Done:**
- [ ] Database migration applied (transfer_orders table created)
- [ ] RLS policy enabled and tested
- [ ] API endpoints implemented (GET, POST, PUT, DELETE)
- [ ] Zod validation schemas created and tested
- [ ] TO list page UI implemented
- [ ] Create TO modal implemented with validation
- [ ] Edit TO drawer implemented
- [ ] Delete TO confirmation modal implemented
- [ ] Status change to 'planned' implemented
- [ ] TO number auto-generation working correctly
- [ ] All unit tests passing (95% coverage)
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated (API docs, tech spec)
