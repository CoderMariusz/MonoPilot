# Purchase Orders Developer Guide

## Overview

This guide explains the Purchase Order module architecture for developers who need to extend, maintain, or integrate with the system. The module implements a Master-Detail pattern with atomic transactions, automatic calculations, and comprehensive access control.

**Module Location**: `apps/frontend/lib/{services,validation,types,hooks}/purchase-order*`

**Database**: PostgreSQL with 3 tables + 9 RLS policies + 7 triggers

**Architecture Pattern**: Service layer with pure functions + database-driven calculations

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Service Layer](#service-layer)
4. [API Routes](#api-routes)
5. [Validation](#validation)
6. [RLS Policies](#rls-policies)
7. [Extending the Module](#extending-the-module)
8. [Common Patterns](#common-patterns)
9. [Anti-Patterns](#anti-patterns)

## Architecture Overview

### Layered Architecture

```
┌─────────────────────────────────────────┐
│       React Components / Pages          │ User Interface
├─────────────────────────────────────────┤
│       React Query Hooks (usePO*)        │ Data Layer
├─────────────────────────────────────────┤
│    Next.js API Routes (/api/.../po)    │ HTTP/API Layer
├─────────────────────────────────────────┤
│     PurchaseOrderService (static)       │ Business Logic
├─────────────────────────────────────────┤
│   Zod Schemas (Validation)              │ Validation
├─────────────────────────────────────────┤
│  Supabase RLS + Triggers                │ Database Layer
├─────────────────────────────────────────┤
│   PostgreSQL (Tables + Indexes)         │ Storage
└─────────────────────────────────────────┘
```

### Design Principles

1. **Separation of Concerns**: Business logic in service layer, not in routes
2. **Pure Functions**: Calculations like `calculateTotals()` have no side effects
3. **Database-Driven**: Totals recalculated by triggers, not application code
4. **Multi-Tenant**: Every query filtered by `org_id` from current user
5. **Type-Safe**: Full TypeScript coverage with Zod validation
6. **Security First**: RLS policies prevent cross-tenant access at database level

## Database Schema

### Tables Overview

```sql
purchase_orders (header)
├── id: UUID PRIMARY KEY
├── org_id: UUID (multi-tenant isolation)
├── po_number: VARCHAR(20) UNIQUE per org
├── supplier_id: UUID (FK)
├── warehouse_id: UUID (FK)
├── tax_code_id: UUID (FK, optional)
├── status: VARCHAR(20) enum
├── currency: VARCHAR(3) enum
├── expected_delivery_date: DATE
├── subtotal, tax_amount, total: DECIMAL (denormalized)
└── approval fields...

purchase_order_lines (detail)
├── id: UUID PRIMARY KEY
├── po_id: UUID (FK CASCADE)
├── product_id: UUID (FK)
├── line_number: INTEGER (auto)
├── quantity, unit_price: DECIMAL
├── discount_percent, discount_amount: DECIMAL
├── line_total: DECIMAL (calculated)
├── expected_delivery_date: DATE (line-level override)
└── received_qty: DECIMAL (for receiving)

po_status_history (audit)
├── id: UUID PRIMARY KEY
├── po_id: UUID (FK)
├── old_status, new_status: VARCHAR
├── changed_at: TIMESTAMPTZ
├── changed_by: UUID (user who made change)
└── reason: TEXT (for cancellations)
```

### Key Indexes

```sql
-- Performance critical queries
CREATE INDEX idx_po_org_status ON purchase_orders(org_id, status);
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_po_delivery_date ON purchase_orders(expected_delivery_date);
CREATE INDEX idx_po_created_at ON purchase_orders(created_at DESC);

-- Line lookups
CREATE INDEX idx_po_lines_po ON purchase_order_lines(po_id);
CREATE INDEX idx_po_lines_product ON purchase_order_lines(product_id);
```

### Constraints

```sql
-- Uniqueness
UNIQUE(org_id, po_number)  -- PO numbers unique per org
UNIQUE(po_id, line_number) -- Line numbers unique per PO

-- Validation
CHECK (status IN ('draft', 'submitted', ...))
CHECK (currency IN ('PLN', 'EUR', 'USD', 'GBP'))
CHECK (quantity > 0)
CHECK (unit_price >= 0)
CHECK (discount_percent BETWEEN 0 AND 100)
CHECK (received_qty >= 0)

-- Referential integrity
REFERENCES organizations(id) ON DELETE CASCADE
REFERENCES suppliers(id)  -- supplier must exist
REFERENCES products(id)   -- product must exist
REFERENCES warehouses(id) -- warehouse must exist
```

### Denormalized Totals

PO totals are **denormalized and recalculated by triggers** for performance:

```
subtotal      = SUM(po_lines.line_total)
tax_amount    = SUM(po_lines.tax_amount) [calculated from tax_code]
total         = subtotal + tax_amount - discount_total
discount_total = SUM(po_lines.discount_amount)
```

**Why denormalize?**
- Queries don't need to JOIN line items to get totals
- Calculations happen at database level (faster)
- Single source of truth in database triggers

**How to update?**
- Never update `subtotal`, `tax_amount`, `total` directly
- Instead, update lines via API
- Database triggers automatically recalculate PO totals

## Service Layer

### PurchaseOrderService Class

Location: `lib/services/purchase-order-service.ts`

The service contains static methods organized into categories:

```typescript
export class PurchaseOrderService {
  // Pure Functions (no side effects)
  static calculateTotals(lines: POLine[]): { subtotal, tax, total, discount }
  static validateStatusTransition(currentStatus, newStatus): boolean
  static canEditLines(status): boolean
  static canDeleteLine(status): boolean

  // CRUD Operations
  static async list(org_id, filters): Promise<POListItem[]>
  static async getById(org_id, po_id): Promise<PurchaseOrderWithLines>
  static async create(org_id, data): Promise<PurchaseOrder>
  static async update(org_id, po_id, data): Promise<PurchaseOrder>
  static async delete(org_id, po_id): Promise<void>

  // Status Transitions
  static async submit(org_id, po_id): Promise<PurchaseOrder>
  static async confirm(org_id, po_id): Promise<PurchaseOrder>
  static async cancel(org_id, po_id, reason): Promise<PurchaseOrder>

  // Line Operations
  static async addLine(org_id, po_id, line_data): Promise<POLine>
  static async updateLine(org_id, po_id, line_id, updates): Promise<POLine>
  static async deleteLine(org_id, po_id, line_id): Promise<void>

  // Utilities
  static async generateNextNumber(org_id): Promise<string>
  static async getDefaultsFromSupplier(supplier_id): Promise<Defaults>
  static getStatusHistory(po_id): Promise<StatusHistoryEntry[]>
}
```

### Pure Functions Pattern

Functions like `calculateTotals()` are pure (no database access, no side effects):

```typescript
// Pure - safe to call multiple times
static calculateTotals(lines: POLine[]): {
  subtotal: number
  discount_total: number
  tax_amount: number
  total: number
} {
  const subtotal = lines.reduce((sum, line) => sum + line.line_total, 0)
  const discount_total = lines.reduce((sum, line) => sum + line.discount_amount, 0)
  const tax_amount = lines.reduce((sum, line) => sum + line.tax_amount, 0)
  const total = subtotal + tax_amount - discount_total

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount_total: Number(discount_total.toFixed(2)),
    tax_amount: Number(tax_amount.toFixed(2)),
    total: Number(total.toFixed(2)),
  }
}

// Used in validation and error checking
const { total } = PurchaseOrderService.calculateTotals(lines)
if (total > approvalThreshold) {
  status = 'pending_approval'
}
```

### Database Operations

Methods that modify state are async and use transactions where needed:

```typescript
// Atomic create with validation
static async create(
  supabase: SupabaseClient,
  org_id: string,
  data: CreatePOInput
): Promise<PurchaseOrder> {
  // 1. Validate all dependencies exist
  const supplier = await this.validateSupplier(org_id, data.supplier_id)
  const warehouse = await this.validateWarehouse(org_id, data.warehouse_id)

  // 2. Generate unique PO number
  const po_number = await this.generateNextNumber(org_id)

  // 3. Insert with inherited values
  const { data: po, error } = await supabase
    .from('purchase_orders')
    .insert({
      org_id,
      po_number,
      supplier_id: data.supplier_id,
      warehouse_id: data.warehouse_id,
      currency: supplier.currency,  // Inherited
      tax_code_id: supplier.tax_code_id,  // Inherited
      status: 'draft',
      expected_delivery_date: data.expected_delivery_date,
      ...
    })
    .select()
    .single()

  if (error) throw new PurchaseOrderError(error)
  return po
}
```

## API Routes

### Route Organization

```
/api/planning/purchase-orders/
├── route.ts                    # GET (list), POST (create)
├── [id]/
│   ├── route.ts               # GET, PUT, DELETE (CRUD)
│   ├── lines/
│   │   ├── route.ts           # GET (list), POST (add)
│   │   └── [lineId]/
│   │       └── route.ts       # PUT (update), DELETE (delete)
│   ├── submit/
│   │   └── route.ts           # POST (change status)
│   ├── confirm/
│   │   └── route.ts           # POST (change status)
│   ├── cancel/
│   │   └── route.ts           # POST (change status + reason)
│   └── history/
│       └── route.ts           # GET (audit trail)
```

### Standard Route Pattern

Every route follows this pattern:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: NextRequest, params?) {
  try {
    // 1. Get authenticated session
    const supabase = await createServerSupabase()
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get current user and org_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 3. Check authorization
    if (!checkPOPermission(user, 'action')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // 4. Execute business logic
    const supabaseAdmin = createServerSupabaseAdmin()
    // ... query and process

    // 5. Return success
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error:', error)
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
```

### Org Isolation Pattern

Every query must filter by current user's `org_id`:

```typescript
// CORRECT: Org isolation enforced
const { data, error } = await supabaseAdmin
  .from('purchase_orders')
  .select('*')
  .eq('org_id', currentUser.org_id)  // <-- REQUIRED
  .eq('id', po_id)
  .single()

// WRONG: No org filter = cross-tenant access vulnerability
const { data } = await supabaseAdmin
  .from('purchase_orders')
  .select('*')
  .eq('id', po_id)  // <-- Could match other org's PO
  .single()
```

Return 404 (not 403) for cross-tenant access to avoid leaking information:

```typescript
if (!data || data.org_id !== currentUser.org_id) {
  return NextResponse.json(
    { error: 'Purchase order not found' },  // Say 'not found', not 'forbidden'
    { status: 404 }
  )
}
```

## Validation

### Zod Schemas

Location: `lib/validation/purchase-order.ts`

Schemas validate at API boundary:

```typescript
// Schema for creating a PO
export const createPOSchema = z.object({
  supplier_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  expected_delivery_date: z
    .string()
    .refine(isTodayOrFuture, 'Must be today or later'),
  payment_terms: z.string().max(50).optional(),
  shipping_method: z.string().max(100).optional(),
  notes: z.string().optional(),
})

// Schema for adding a line
export const createPOLineSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().positive().max(999999999),
  unit_price: z.number().min(0),
  discount_percent: z.number().min(0).max(100).optional().default(0),
  expected_delivery_date: z
    .string()
    .refine(isTodayOrFuture, 'Must be today or later')
    .optional(),
})

// Usage in route
const validatedData = createPOSchema.parse(request.body)
```

### Validation Flow

```
Client Input
    ↓
Zod Schema Parse (catches type/format errors)
    ↓
Database Constraints (catches uniqueness/referential errors)
    ↓
RLS Policies (catches authorization errors)
    ↓
Success or Error
```

### Custom Validators

Helper functions for complex validation:

```typescript
// Check if PO can be edited
function canEditPO(status: POStatus): boolean {
  return ['draft', 'submitted'].includes(status)
}

// Check if lines can be modified
function canEditPOLines(status: POStatus): boolean {
  return status === 'draft'  // Only in draft
}

// Check status transition validity
function validateStatusTransition(
  currentStatus: POStatus,
  newStatus: POStatus
): boolean {
  const transitions: Record<POStatus, POStatus[]> = {
    draft: ['submitted', 'cancelled'],
    submitted: ['confirmed', 'pending_approval', 'cancelled'],
    pending_approval: ['approved', 'rejected', 'cancelled'],
    confirmed: ['receiving', 'cancelled'],
    receiving: ['closed', 'cancelled'],
    closed: [],  // No transitions from closed
    cancelled: [],
  }
  return transitions[currentStatus]?.includes(newStatus) ?? false
}
```

## RLS Policies

### Policy Architecture

Every table has RLS policies following ADR-013 pattern:

```sql
-- Org isolation
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can see POs from their org
CREATE POLICY "Users can see purchase orders in their org" ON purchase_orders
  FOR SELECT
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Policy 2: Purchasers can create POs
CREATE POLICY "Purchasers can create purchase orders" ON purchase_orders
  FOR INSERT
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('purchaser', 'buyer', 'manager')
    )
  );

-- Policy 3: Can update own org's POs
CREATE POLICY "Users can update purchase orders in their org" ON purchase_orders
  FOR UPDATE
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Policy 4: Can delete own org's POs
CREATE POLICY "Users can delete purchase orders in their org" ON purchase_orders
  FOR DELETE
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

### Line Item RLS

Lines inherit access from parent PO via FK:

```sql
-- PO lines inherit access through PO FK
ALTER TABLE purchase_order_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see lines from their org's POs" ON purchase_order_lines
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM purchase_orders
      WHERE id = po_id
      AND org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
  );
```

### Testing RLS

Always test RLS policies in development:

```sql
-- Test org isolation
SELECT * FROM purchase_orders WHERE org_id != current_org_id;  -- Should return 0 rows

-- Test role-based access
-- As viewer role:
INSERT INTO purchase_orders (...) VALUES (...);  -- Should fail

-- Test cross-tenant access (should see 0 rows)
SELECT * FROM purchase_orders WHERE id = 'other-org-po-id';
```

## Extending the Module

### Adding a New Status

1. **Database Migration**:
```sql
-- Update constraint
ALTER TABLE purchase_orders
  DROP CONSTRAINT purchase_orders_status_check;

ALTER TABLE purchase_orders
  ADD CONSTRAINT purchase_orders_status_check CHECK (
    status IN (..., 'new_status')
  );
```

2. **Type Definitions** (`lib/types/purchase-order.ts`):
```typescript
export type POStatus =
  | 'draft'
  | 'submitted'
  | 'new_status'  // Add here
  | 'confirmed'
  ...
```

3. **Validation Schema** (`lib/validation/purchase-order.ts`):
```typescript
export const poStatusEnum = z.enum([
  'draft',
  'submitted',
  'new_status',  // Add here
  'confirmed',
  ...
])
```

4. **Status Config** (`lib/types/purchase-order.ts`):
```typescript
export const PO_STATUS_CONFIG: Record<POStatus, ...> = {
  new_status: {
    label: 'New Status',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-800',
    borderColor: 'border-indigo-300',
  },
  ...
}
```

5. **Transition Logic** (Service layer):
```typescript
static validateStatusTransition(current, next): boolean {
  const valid = {
    draft: ['submitted', 'new_status', 'cancelled'],  // Add here
    new_status: ['confirmed', 'cancelled'],  // Add route from new status
    ...
  }
  return valid[current]?.includes(next) ?? false
}
```

6. **New Route** (if action needed):
```typescript
// /api/planning/purchase-orders/[id]/action-name/route.ts
export async function POST(request, { params }) {
  // Follow standard pattern
  // Call service method
  // Return updated PO
}
```

### Adding a New Field to PO Header

1. **Database Migration**:
```sql
ALTER TABLE purchase_orders
  ADD COLUMN new_field VARCHAR(255);
```

2. **Type Definition**:
```typescript
export interface PurchaseOrder {
  new_field?: string
  ...
}
```

3. **Validation Schema**:
```typescript
export const createPOSchema = z.object({
  new_field: z.string().optional(),
  ...
})
```

4. **API Route** - Include in select:
```typescript
.select(`
  *,
  suppliers(...),
  ...
`)
```

### Adding a New Action (Status Change)

Example: Adding "Hold PO" action

1. **Migration** - Add status:
```sql
ALTER TABLE purchase_orders
  ADD CONSTRAINT po_status_check CHECK (
    status IN (..., 'on_hold')
  );
```

2. **Service Method**:
```typescript
static async holdPO(
  supabase: SupabaseClient,
  org_id: string,
  po_id: string,
  reason: string
): Promise<PurchaseOrder> {
  const po = await this.getById(supabase, org_id, po_id)

  if (!['draft', 'submitted', 'confirmed'].includes(po.status)) {
    throw new Error('Cannot hold PO in current status')
  }

  const { data, error } = await supabase
    .from('purchase_orders')
    .update({ status: 'on_hold' })
    .eq('id', po_id)
    .eq('org_id', org_id)
    .select()
    .single()

  if (error) throw error

  // Record in history
  await this.recordStatusChange(
    supabase, po_id, po.status, 'on_hold', reason
  )

  return data
}
```

3. **API Route** - Create `/api/planning/purchase-orders/[id]/hold/route.ts`:
```typescript
export async function POST(request, { params }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  const { data: user } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', session.user.id)
    .single()

  const body = await request.json()

  const po = await PurchaseOrderService.holdPO(
    supabase, user.org_id, id, body.reason
  )

  return NextResponse.json({ purchase_order: po })
}
```

## Common Patterns

### Error Handling Pattern

```typescript
// Custom error class
export class PurchaseOrderError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message)
  }
}

// Usage in service
try {
  const po = await supabase
    .from('purchase_orders')
    .select()
    .eq('id', id)
    .single()

  if (!po) {
    throw new PurchaseOrderError(
      'Purchase order not found',
      'PO_NOT_FOUND',
      404
    )
  }
} catch (error) {
  if (error instanceof PurchaseOrderError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    )
  }
  // Handle unexpected errors
}
```

### Transaction Pattern

For atomic operations with multiple steps:

```typescript
// Database RPC function (in migration)
CREATE OR REPLACE FUNCTION create_po_with_lines(
  p_org_id UUID,
  p_supplier_id UUID,
  p_lines JSONB[]
)
RETURNS UUID AS $$
DECLARE
  v_po_id UUID;
BEGIN
  INSERT INTO purchase_orders (org_id, supplier_id, ...)
  VALUES (p_org_id, p_supplier_id, ...)
  RETURNING id INTO v_po_id;

  -- Insert lines atomically
  INSERT INTO purchase_order_lines (po_id, ...)
  SELECT v_po_id, ...
  FROM jsonb_array_elements(p_lines) AS elem;

  RETURN v_po_id;
END;
$$ LANGUAGE plpgsql;

// Call from API
const { data: po_id, error } = await supabase
  .rpc('create_po_with_lines', {
    p_org_id: user.org_id,
    p_supplier_id: data.supplier_id,
    p_lines: data.lines
  })
```

### Caching Pattern

Using React Query for efficient data loading:

```typescript
// Hook with automatic caching
export const usePurchaseOrder = (po_id: string) => {
  return useQuery({
    queryKey: ['purchase_orders', po_id],
    queryFn: async () => {
      const res = await fetch(`/api/planning/purchase-orders/${po_id}`)
      return res.json()
    },
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 10 * 60 * 1000,     // 10 minutes (formerly cacheTime)
  })
}

// Invalidate cache on mutations
export const useUpdatePO = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data) => {
      const res = await fetch(`/api/planning/purchase-orders/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      return res.json()
    },
    onSuccess: (data) => {
      // Invalidate list and detail queries
      queryClient.invalidateQueries({
        queryKey: ['purchase_orders']
      })
      queryClient.setQueryData(
        ['purchase_orders', data.id],
        data
      )
    },
  })
}
```

## Anti-Patterns

### Don't: Update Totals Directly

```typescript
// WRONG - Will be overwritten by trigger
await supabase
  .from('purchase_orders')
  .update({ total: 1234.56 })
  .eq('id', po_id)

// RIGHT - Totals update automatically when lines change
await supabase
  .from('po_lines')
  .update({ quantity: 200 })
  .eq('id', line_id)
// Trigger recalculates po.total
```

### Don't: Skip Org Isolation

```typescript
// WRONG - Missing org_id check
const po = await supabase
  .from('purchase_orders')
  .select()
  .eq('id', request.params.id)
  .single()

// RIGHT - Always filter by org_id
const po = await supabase
  .from('purchase_orders')
  .select()
  .eq('id', request.params.id)
  .eq('org_id', currentUser.org_id)
  .single()
```

### Don't: Create Permission Checks in Frontend Only

```typescript
// WRONG - Can be bypassed
if (user.role === 'admin') {
  setCanDelete(true)
}

// RIGHT - Check permissions server-side on every API call
export async function DELETE(request, { params }) {
  const user = await getCurrentUser(supabase)

  if (!checkPOPermission(user, 'delete')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  // ... proceed with delete
}
```

### Don't: Use Manual Transactions

```typescript
// WRONG - Error in step 2 leaves PO without lines
const po = await createPO(supabase, data)
const lines = await addLines(supabase, po.id, data.lines)  // Fails!
// PO exists but has no lines

// RIGHT - Use database RPC for atomicity
const po_id = await supabase.rpc('create_po_with_lines', {
  p_org_id: org_id,
  p_lines: data.lines,
})
// All or nothing
```

### Don't: Forget About Cascading Deletes

```typescript
// WRONG - Line items orphaned
await supabase
  .from('purchase_orders')
  .delete()
  .eq('id', po_id)

// RIGHT - Database constraint handles cascade
// ALTER TABLE purchase_order_lines
//   ADD CONSTRAINT fk_po_lines_po
//   FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE

// Lines automatically deleted when PO deleted
```

### Don't: Calculate Totals in Application

```typescript
// WRONG - Brittle, can get out of sync
let total = 0
for (const line of lines) {
  total += line.quantity * line.unit_price - line.discount_amount
}

// RIGHT - Database trigger maintains consistency
// Any application can insert/update lines
// Trigger automatically recalculates PO total
// Total is always correct in database
```

---

## Related Documents

- **Architecture Decision**: [ADR-013 RLS Multi-Tenant Pattern](../../1-BASELINE/architecture/decisions/ADR-013-rls-org-isolation-pattern.md)
- **User Guide**: [Purchase Orders User Guide](../../4-USER-GUIDE/planning/purchase-orders.md)
- **API Reference**: [Purchase Orders API](../api/planning/purchase-orders.md)
- **Implementation Report**: Story 03.3 Implementation Report
- **Database Migration**: `supabase/migrations/079_create_purchase_orders.sql`

---

**Last Updated**: January 2, 2026
**Module**: Planning - Story 03.3
**Status**: Production Ready
