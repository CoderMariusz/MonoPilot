# Story 3.1: Purchase Order CRUD

**Epic:** 3 - Planning Operations (Batch 3A)
**Story ID:** 3.1
**Priority:** P0
**Effort:** 8 points
**Status:** Ready for Development

---

## User Story

**As a** Purchasing user,
**I want to** create, edit, and view purchase orders,
**So that** I can manage procurement efficiently.

---

## Acceptance Criteria

### AC-1.1: PO List View

**Given** the user has Purchasing role or higher
**When** they navigate to `/planning/purchase-orders`
**Then** they see a table with columns:
- PO Number
- Supplier
- Status
- Expected Date
- Total (with currency badge)

**And** can search by PO number/supplier name
**And** can filter by:
  - Status (dropdown: all statuses from planning_settings)
  - Supplier (multi-select dropdown)
  - Warehouse (dropdown)
  - Date range (from/to date pickers)

**And** table is paginated (50 per page) if >100 POs
**And** table is sortable by all columns

### AC-1.2: PO Creation Flow

**When** clicking "Add PO" button
**Then** Create modal opens with:

**Step 1: Select Supplier** (required)
- Supplier dropdown (shows only active suppliers)
- On selection → Auto-populate:
  - Currency (badge shown on all amount fields)
  - Tax Code (used dla line tax calculation)
  - Payment Terms (editable)

**Step 2: PO Header Fields**
- `warehouse_id`: Dropdown (required) - dla receiving location reference
- `expected_delivery_date`: Date picker (required, cannot be in past)
- `payment_terms`: Text input (pre-filled from supplier, editable)
- `shipping_method`: Text input (optional, visible if enabled in settings)
- `notes`: Textarea (optional, visible if enabled in settings, max 1000 chars)

**Step 3: Review & Save**
- Show summary: Supplier, Warehouse, Date, Currency
- Click "Create" → API call
- Loading state shown
- Success → Redirect to PO detail page
- Error → Show error message inline

### AC-1.3: PO Number Generation

**When** PO is created
**Then** PO number auto-generated with format: `PO-YYYY-NNNN`
**Examples:**
- First PO in 2025 → `PO-2025-0001`
- Second PO in 2025 → `PO-2025-0002`
- First PO in 2026 → `PO-2026-0001` (resets each year)

**And** PO number is unique per org
**And** PO number is immutable (never changes)

### AC-1.4: Currency Inheritance

**When** supplier is selected
**Then** PO inherits `currency` from supplier
**And** currency badge shown on all amount fields (subtotal, tax, total)
**And** currency **cannot be changed** after PO creation (locked)

**Example:**
- Supplier has currency = EUR
- PO shows: "Subtotal: €1,000", "Tax: €230", "Total: €1,230"

### AC-1.5: Default Status Assignment

**When** PO is created
**Then** status set to `planning_settings.po_default_status` (usually "Draft")
**And** if `po_require_approval = true` AND `total > po_approval_threshold`:
  - Set `approval_status = 'pending'`
  - PO shown in "Pending Approval" list (Story 3.4)
**Else**:
  - `approval_status = null` (no approval needed)

### AC-1.6: PO Detail View

**When** clicking on PO row
**Then** navigate to `/planning/purchase-orders/:id`
**And** show PO detail page with tabs:
- **Overview**: Header fields, totals, status
- **Lines**: PO lines table (Story 3.2)
- **Approval**: Approval history (Story 3.4)
- **Activity**: Audit log (created_by, updated_by, status changes)

**Header Section:**
- PO Number (badge)
- Status (badge with color)
- Supplier name (link to supplier detail)
- Warehouse name
- Expected Delivery Date
- Currency badge

**Totals Section:**
- Subtotal
- Tax Amount
- Total
- All amounts with currency badge

**Actions:**
- Edit button (if status allows)
- Delete button (if status = Draft and no lines)
- Change Status dropdown (Story 3.5)
- Approve/Reject buttons (if pending approval, Story 3.4)

### AC-1.7: PO Edit

**When** clicking Edit button
**Then** Edit Drawer opens with same fields as Create modal

**Can Edit:**
- `expected_delivery_date`
- `payment_terms`
- `shipping_method`
- `notes`

**Cannot Edit:**
- `supplier_id` (locked after creation)
- `warehouse_id` (locked after creation)
- `currency` (inherited from supplier, locked)
- `po_number` (immutable)

**Validation:**
- If status = 'Closed' OR 'Receiving' → Block edit, show error: "Cannot edit PO in Closed or Receiving status"
- If PO has received lines (Epic 5) → Block edit, show warning

**When** saving changes
**Then** PO updated
**And** `updated_by`, `updated_at` recorded
**And** audit log entry created

### AC-1.8: PO Delete

**When** clicking Delete button
**Then** show confirmation dialog: "Are you sure? This action cannot be undone."

**Validation:**
- If PO has lines → Block delete, show error: "Cannot delete PO with lines. Delete lines first."
- If status != 'Draft' → Block delete, show error: "Can only delete POs in Draft status"
- If PO has been partially received (Epic 5) → Block delete

**When** confirmed
**Then** hard delete PO (no soft delete)
**And** redirect to PO list
**And** show success toast: "PO deleted successfully"

---

## Technical Implementation

### Database Schema

```sql
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  po_number VARCHAR(20) NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  status VARCHAR(50) NOT NULL,
  expected_delivery_date DATE NOT NULL,
  actual_delivery_date DATE,
  payment_terms VARCHAR(100),
  shipping_method VARCHAR(100),
  notes TEXT,

  -- Financial fields (all in supplier currency)
  currency VARCHAR(3) NOT NULL,
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,

  -- Approval fields (Story 3.4)
  approval_status VARCHAR(20),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,

  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint
CREATE UNIQUE INDEX idx_po_org_number ON purchase_orders(org_id, po_number);

-- Indexes
CREATE INDEX idx_po_org ON purchase_orders(org_id);
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_po_warehouse ON purchase_orders(warehouse_id);
CREATE INDEX idx_po_status ON purchase_orders(status);
CREATE INDEX idx_po_expected_date ON purchase_orders(expected_delivery_date);

-- RLS Policy
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY po_isolation ON purchase_orders
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

### PO Number Generator

```typescript
// apps/frontend/lib/utils/po-number-generator.ts

export async function generatePONumber(supabase: any, org_id: string): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `PO-${year}-`

  // Get highest PO number dla current year
  const { data: latestPO } = await supabase
    .from('purchase_orders')
    .select('po_number')
    .eq('org_id', org_id)
    .like('po_number', `${prefix}%`)
    .order('po_number', { ascending: false })
    .limit(1)
    .single()

  let sequence = 1
  if (latestPO) {
    const lastNumber = latestPO.po_number.split('-')[2]
    sequence = parseInt(lastNumber, 10) + 1
  }

  return `${prefix}${sequence.toString().padStart(4, '0')}`
}
```

### API Routes

```typescript
// apps/frontend/app/api/planning/purchase-orders/route.ts

import { createSupabaseAdminClient } from '@/lib/supabase/admin-client'
import { purchaseOrderSchema } from '@/lib/validation/planning-schemas'
import { generatePONumber } from '@/lib/utils/po-number-generator'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createSupabaseAdminClient()
  const { searchParams } = new URL(request.url)

  const search = searchParams.get('search')
  const status = searchParams.get('status')
  const supplier_id = searchParams.get('supplier_id')
  const warehouse_id = searchParams.get('warehouse_id')
  const date_from = searchParams.get('date_from')
  const date_to = searchParams.get('date_to')

  let query = supabase
    .from('purchase_orders')
    .select(`
      *,
      suppliers(code, name, currency),
      warehouses(code, name)
    `)
    .order('po_number', { ascending: false })

  if (search) {
    query = query.or(`po_number.ilike.%${search}%,suppliers.name.ilike.%${search}%`)
  }

  if (status) {
    query = query.eq('status', status)
  }

  if (supplier_id) {
    query = query.eq('supplier_id', supplier_id)
  }

  if (warehouse_id) {
    query = query.eq('warehouse_id', warehouse_id)
  }

  if (date_from) {
    query = query.gte('expected_delivery_date', date_from)
  }

  if (date_to) {
    query = query.lte('expected_delivery_date', date_to)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseAdminClient()
  const body = await request.json()

  // Validate
  const validation = purchaseOrderSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.errors
    }, { status: 400 })
  }

  const { data: user } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const org_id = user.user.user_metadata.org_id

  // Fetch supplier to inherit currency, tax_code_id
  const { data: supplier } = await supabase
    .from('suppliers')
    .select('currency, tax_code_id, payment_terms')
    .eq('id', validation.data.supplier_id)
    .single()

  if (!supplier) {
    return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
  }

  // Fetch planning settings dla default status
  const { data: settings } = await supabase
    .from('planning_settings')
    .select('po_default_status, po_require_approval, po_approval_threshold')
    .eq('org_id', org_id)
    .single()

  const defaultStatus = settings?.po_default_status || 'draft'

  // Generate PO number
  const po_number = await generatePONumber(supabase, org_id)

  const poData = {
    ...validation.data,
    org_id,
    po_number,
    currency: supplier.currency,
    payment_terms: validation.data.payment_terms || supplier.payment_terms,
    status: defaultStatus,
    subtotal: 0,
    tax_amount: 0,
    total: 0,
    created_by: user.user.id,
    updated_by: user.user.id,
  }

  const { data, error } = await supabase
    .from('purchase_orders')
    .insert(poData)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
```

```typescript
// apps/frontend/app/api/planning/purchase-orders/[id]/route.ts

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      suppliers(id, code, name, currency, payment_terms),
      warehouses(id, code, name),
      po_lines(*)
    `)
    .eq('id', params.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseAdminClient()
  const body = await request.json()

  // Fetch current PO to check status
  const { data: currentPO } = await supabase
    .from('purchase_orders')
    .select('status')
    .eq('id', params.id)
    .single()

  if (!currentPO) {
    return NextResponse.json({ error: 'PO not found' }, { status: 404 })
  }

  // Block edit if status is Closed or Receiving
  if (['closed', 'receiving'].includes(currentPO.status.toLowerCase())) {
    return NextResponse.json({
      error: 'Cannot edit PO in Closed or Receiving status'
    }, { status: 403 })
  }

  const { data: user } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('purchase_orders')
    .update({
      ...body,
      updated_by: user?.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseAdminClient()

  // Check if PO has lines
  const { count } = await supabase
    .from('po_lines')
    .select('*', { count: 'exact', head: true })
    .eq('po_id', params.id)

  if (count && count > 0) {
    return NextResponse.json({
      error: 'Cannot delete PO with lines. Delete lines first.'
    }, { status: 403 })
  }

  // Check status
  const { data: po } = await supabase
    .from('purchase_orders')
    .select('status')
    .eq('id', params.id)
    .single()

  if (po && po.status.toLowerCase() !== 'draft') {
    return NextResponse.json({
      error: 'Can only delete POs in Draft status'
    }, { status: 403 })
  }

  const { error } = await supabase
    .from('purchase_orders')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

### Frontend Components

```typescript
// apps/frontend/app/(authenticated)/planning/purchase-orders/page.tsx

'use client'

import { useState } from 'react'
import { usePurchaseOrders } from '@/lib/hooks/usePurchaseOrders'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { POCreateModal } from '@/components/planning/POCreateModal'
import { columns } from './columns'

export default function PurchaseOrdersPage() {
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { data: pos, isLoading } = usePurchaseOrders({ search })

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Purchase Orders</h1>
        <Button onClick={() => setIsCreateOpen(true)}>Add PO</Button>
      </div>

      <div className="mb-4 flex gap-4">
        <Input
          placeholder="Search by PO number or supplier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        {/* Filters: Status, Supplier, Warehouse, Date Range */}
      </div>

      <DataTable columns={columns} data={pos || []} loading={isLoading} />

      <POCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  )
}
```

### Validation Schemas

```typescript
// apps/frontend/lib/validation/planning-schemas.ts

export const purchaseOrderSchema = z.object({
  supplier_id: z.string().uuid('Invalid supplier'),
  warehouse_id: z.string().uuid('Invalid warehouse'),
  expected_delivery_date: z.date()
    .min(new Date(), 'Expected delivery date cannot be in the past'),
  payment_terms: z.string().optional(),
  shipping_method: z.string().optional(),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
})
```

---

## Testing Requirements

### Unit Tests

1. **PO Number Generation** (`po-number-generator.spec.ts`)
   - First PO → PO-2025-0001
   - Second PO → PO-2025-0002
   - Year rollover → PO-2026-0001
   - Concurrent creation → no duplicates

2. **PO Validation** (`po-validation.spec.ts`)
   - Valid PO data passes
   - Missing supplier_id fails
   - Past expected_delivery_date fails
   - Notes >1000 chars fails

### Integration Tests

1. **PO CRUD API** (`purchase-orders-api.test.ts`)
   - Create PO → success, PO number generated, currency inherited
   - Get PO list → paginated results
   - Get PO by ID → with supplier, warehouse, lines
   - Update PO → success (if status allows)
   - Update closed PO → 403 error
   - Delete PO with lines → 403 error
   - Delete draft PO → success

2. **Currency Inheritance** (`currency-inheritance.test.ts`)
   - Select supplier with EUR → PO currency = EUR
   - PO amounts shown in EUR
   - Cannot change currency after creation

3. **RLS Policy** (`po-rls.test.ts`)
   - User A cannot read User B's POs

### E2E Tests

1. **PO Creation Flow** (`po-creation.e2e.ts`)
   - Navigate to PO page
   - Click "Add PO"
   - Select supplier → currency auto-populated
   - Fill header fields
   - Create PO → redirect to detail page
   - Verify PO number format

2. **PO Edit Flow** (`po-edit.e2e.ts`)
   - Open PO detail
   - Click Edit
   - Change expected_delivery_date
   - Save → success

3. **PO Delete Flow** (`po-delete.e2e.ts`)
   - Create draft PO (no lines)
   - Delete → confirmation dialog
   - Confirm → PO deleted
   - Create PO with lines → delete blocked

---

## Definition of Done

- [ ] Database migration created and applied
- [ ] RLS policies enabled and tested
- [ ] PO number generator implemented and tested
- [ ] API routes implemented (GET, POST, PUT, DELETE)
- [ ] Zod validation schemas created
- [ ] Frontend components created (List, Create Modal, Edit Drawer, Detail Page)
- [ ] Currency inheritance logic implemented
- [ ] Unit tests written (>95% coverage)
- [ ] Integration tests written (>70% coverage)
- [ ] E2E tests written (PO CRUD flow)
- [ ] API documentation updated
- [ ] Code reviewed and approved
- [ ] Deployed to staging
- [ ] QA tested
- [ ] Product Owner approved

---

## Dependencies

### Requires:
- Story 3.17 (Supplier Management) - must be completed first
- Epic 1: warehouses, tax_codes, users tables
- Epic 2: products table (dla lines in Story 3.2)

### Blocks:
- Story 3.2 (PO Lines) - requires PO header
- Story 3.3 (Bulk PO) - uses PO creation logic
- Story 3.4 (Approval) - requires PO base
- Story 3.5 (Statuses) - requires PO base

---

## Notes

- PO number format is **immutable** (never changes)
- Currency is **locked** to supplier (inherited, cannot change)
- Status transitions defined in Story 3.5
- Approval logic defined in Story 3.4
- PO receiving handled in Epic 5 (Warehouse Module)
- Multi-currency conversion deferred to Phase 2
