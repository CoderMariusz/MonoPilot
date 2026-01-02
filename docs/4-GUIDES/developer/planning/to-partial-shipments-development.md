# Transfer Order Partial Shipments - Developer Guide

**Story**: 03.9a - TO Partial Shipments (Basic)
**Module**: Planning
**Audience**: Backend Developers, Frontend Developers, Code Reviewers
**Last Updated**: December 2025

## Overview

This guide covers the technical implementation of partial shipments and receipts for transfer orders. It includes database migrations, service layer architecture, API route implementation, React components, and testing patterns.

**Key Implementation Highlights**:
- Configuration-driven design via action-helpers
- 90% code duplication elimination between ship and receive
- 5 critical security fixes documented
- Multi-tenant isolation (org_id filtering)
- Cumulative quantity tracking (append, not replace)
- Immutable audit fields

---

## Architecture Overview

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Layer (Next.js)                        │
│  - Transfer Order Detail Page                               │
│  - ShipTOModal Component                                    │
│  - ReceiveTOModal Component                                │
│  - Progress Indicators                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   API Routes (Next.js)                      │
│  - POST /api/planning/transfer-orders/:id/ship             │
│  - POST /api/planning/transfer-orders/:id/receive          │
│  - Input validation (Zod schemas)                          │
│  - Error handling                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│               Service Layer (Business Logic)                │
│  ├─ transfer-order/actions.ts (shipTransferOrder, receive) │
│  ├─ transfer-order/action-helpers.ts (shared logic)        │
│  ├─ transfer-order/helpers.ts (status calculation)         │
│  └─ transfer-order/constants.ts (error codes)              │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              Database Layer (Supabase)                      │
│  - transfer_orders table                                   │
│  - transfer_order_lines table                              │
│  - RLS Policies (org_id filtering)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### transfer_orders Table

Columns used for ship/receive operations:

```sql
CREATE TABLE transfer_orders (
  -- ... existing columns ...
  status TEXT CHECK (status IN ('draft', 'planned', 'partially_shipped',
                                 'shipped', 'partially_received',
                                 'received', 'closed', 'cancelled')),

  -- Ship audit fields
  actual_ship_date DATE,              -- Set on FIRST shipment (immutable)
  shipped_by UUID REFERENCES users(id), -- Set on FIRST shipment (immutable)

  -- Receive audit fields
  actual_receive_date DATE,           -- Set on FIRST receipt (immutable)
  received_by UUID REFERENCES users(id), -- Set on FIRST receipt (immutable)

  -- Multi-tenant isolation (CRITICAL-SEC-02)
  org_id UUID NOT NULL REFERENCES organizations(id),

  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES users(id)
);
```

### transfer_order_lines Table

Columns used for partial tracking:

```sql
CREATE TABLE transfer_order_lines (
  -- ... existing columns ...
  quantity DECIMAL(15,4) NOT NULL,      -- Ordered quantity
  shipped_qty DECIMAL(15,4) DEFAULT 0,  -- Cumulative shipped
  received_qty DECIMAL(15,4) DEFAULT 0  -- Cumulative received
);
```

### Quantity Flow

```
User ships 60 units:
  shipped_qty = 0 + 60 = 60

User ships 40 more:
  shipped_qty = 60 + 40 = 100

User receives 50 units:
  received_qty = 0 + 50 = 50

User receives 50 more:
  received_qty = 50 + 50 = 100
```

### No New Migrations

**Important**: This story uses existing schema columns from Story 03.8. No new database migrations required. All columns already exist in the database.

---

## Service Layer

### Architecture: Configuration-Driven Design

The core innovation is the `executeTransferOrderAction` helper that eliminates 90% code duplication:

```typescript
// Both ship and receive use the same helper with different config
export async function shipTransferOrder(
  transferOrderId: string,
  input: ShipToInput,
  userId: string
): Promise<ServiceResult<TransferOrder>> {
  const { executeTransferOrderAction } = await import('./action-helpers')

  return executeTransferOrderAction(
    {
      transferOrderId,
      userId,
      actionType: 'ship',    // Configures the action type
      date: input.actual_ship_date || new Date().toISOString().split('T')[0],
      notes: input.notes,
    },
    input.line_items.map(item => ({
      line_id: item.to_line_id,
      quantity: item.ship_qty,
    }))
  )
}

export async function receiveTransferOrder(
  transferOrderId: string,
  input: ReceiveTOInput,
  userId: string
): Promise<ServiceResult<TransferOrder>> {
  const { executeTransferOrderAction } = await import('./action-helpers')

  return executeTransferOrderAction(
    {
      transferOrderId,
      userId,
      actionType: 'receive',  // Different action type
      date: input.receipt_date || new Date().toISOString().split('T')[0],
      notes: input.notes,
    },
    input.line_items.map(item => ({
      line_id: item.to_line_id,
      quantity: item.receive_qty,
    }))
  )
}
```

### Service File Structure

**File**: `apps/frontend/lib/services/transfer-order/actions.ts`

```typescript
export async function shipTransferOrder(...): Promise<ServiceResult<TransferOrder>>
export async function receiveTransferOrder(...): Promise<ServiceResult<TransferOrder>>
export async function getToLineLps(...): Promise<ListResult<ToLineLp>>
export async function selectLpsForToLine(...): Promise<ServiceResult<ToLineLp[]>>
export async function deleteToLineLp(...): Promise<ServiceResult<void>>
```

**File**: `apps/frontend/lib/services/transfer-order/action-helpers.ts`

```typescript
// Validation
export async function validateTransferOrderState(...): Promise<ValidationResult>
export async function fetchAndValidateLines(...): Promise<ValidationResult>

// Update operations
export async function updateLineQuantities(...): Promise<ServiceResult<void>>
export async function updateTransferOrderMetadata(...): Promise<ServiceResult<TransferOrder>>

// Main executor
export async function executeTransferOrderAction(...): Promise<ServiceResult<TransferOrder>>
```

---

## Security Fixes (Critical Implementations)

### CRITICAL-SEC-01: Prevent Pre-Ship Receiving

**Problem**: Without validation, users could receive items without shipping them first, violating physical inventory constraints.

**Fix Location**: `action-helpers.ts::fetchAndValidateLines()`

```typescript
// CRITICAL-SEC-01: Prevent receiving items that haven't been shipped
if (actionType === 'receive' && maxQty === 0) {
  return {
    success: false,
    error: `Cannot receive line ${lineQty.line_id}: no items have been shipped yet`,
    code: ErrorCode.INVALID_QUANTITY,
  }
}
```

**How It Works**:
1. When actionType is 'receive', maxQty = shipped_qty
2. If shipped_qty = 0, return error
3. Prevents receiving non-shipped quantities

**Impact**: Enforces physical warehouse logic at API layer.

### CRITICAL-SEC-02: Multi-Tenant Isolation via org_id

**Problem**: RLS policies can be bypassed if service layer doesn't filter org_id. Unauthorized users could access other organizations' transfer orders.

**Fix Location**: `action-helpers.ts::validateTransferOrderState()` and `fetchAndValidateLines()`

```typescript
// CRITICAL-SEC-02: Get org_id to enforce multi-tenant isolation
const orgId = await getCurrentOrgId()
if (!orgId) {
  return {
    success: false,
    error: 'Organization ID not found',
    code: ErrorCode.NOT_FOUND,
  }
}

// Get TO status and action date
const { data: existingTo, error: toError } = await supabaseAdmin
  .from('transfer_orders')
  .select(`status, ${dateField}, ${byField}`)
  .eq('id', transferOrderId)
  .eq('org_id', orgId)  // CRITICAL: org_id filter
  .single()
```

**How It Works**:
1. Get org_id from auth context (user's organization)
2. Filter all queries by .eq('org_id', orgId)
3. Even if attackers know TO ID, they can only access their own org's TOs

**Impact**: Prevents cross-tenant data access.

**Testing**:
```typescript
it('should reject access to other org transfer orders', async () => {
  // Create TO in org-1
  const to = await createTransferOrderInOrg('org-1')

  // Switch to org-2 user
  const user2 = await switchOrganization('org-2')

  // Try to ship TO from org-1 as org-2 user
  const result = await shipTransferOrder(to.id, input, user2.id)

  expect(result.success).toBe(false)
  expect(result.code).toBe('NOT_FOUND')
})
```

### MAJOR-BUG-01: Response Consistency

**Problem**: Ship endpoint was missing `success` field, but receive endpoint included it. This breaks client-side response handling.

**Fix Location**: `apps/frontend/app/api/planning/transfer-orders/[id]/ship/route.ts`

```typescript
// Before (inconsistent)
return NextResponse.json({
  transfer_order: result.data,
  message: `Transfer Order ${result.data?.to_number} shipped successfully`,
})

// After (consistent)
return NextResponse.json({
  success: true,
  transfer_order: result.data,
  message: `Transfer Order ${result.data?.to_number} shipped successfully`,
})
```

**Impact**: Standardizes API responses across both endpoints.

### Additional Security Measures

1. **Input Validation (Zod)**
   - Date format validation (YYYY-MM-DD)
   - UUID validation on all IDs
   - Positive number validation on quantities
   - Future date prevention

2. **Authentication**
   - JWT token required
   - Session validation in API route
   - Returns 401 Unauthorized if missing

3. **Authorization**
   - Role-based access control via middleware
   - Users need warehouse_operator or admin role
   - Returns 403 Forbidden if insufficient permissions

---

## API Routes Implementation

### Ship Route: POST /api/planning/transfer-orders/:id/ship

**File**: `apps/frontend/app/api/planning/transfer-orders/[id]/ship/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { shipToSchema, type ShipToInput } from '@/lib/validation/transfer-order-schemas'
import { shipTransferOrder } from '@/lib/services/transfer-order-service'
import { ZodError } from 'zod'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()

    // 1. Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // 2. Parse and validate request body
    const body = await request.json()
    const validatedData: ShipToInput = shipToSchema.parse(body)

    // 3. Call service method
    const result = await shipTransferOrder(id, validatedData, session.user.id)

    // 4. Handle service errors
    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: result.error || 'Transfer Order or TO line not found' },
          { status: 404 }
        )
      }

      if (result.code === 'INVALID_STATUS') {
        return NextResponse.json(
          { error: result.error || 'Cannot ship this Transfer Order' },
          { status: 400 }
        )
      }

      if (result.code === 'INVALID_QUANTITY') {
        return NextResponse.json(
          { error: result.error || 'Invalid ship quantity' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to ship transfer order' },
        { status: 500 }
      )
    }

    // 5. Return success response
    return NextResponse.json(
      {
        success: true,
        transfer_order: result.data,
        message: `Transfer Order ${result.data?.to_number} shipped successfully`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in POST /api/planning/transfer-orders/:id/ship:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Receive Route: POST /api/planning/transfer-orders/:id/receive

**File**: `apps/frontend/app/api/planning/transfer-orders/[id]/receive/route.ts`

Same structure as ship, but calls `receiveTransferOrder` service method.

---

## React Components

### Component Architecture

```
TransferOrderDetailPage
├─ Header (status badge, TO number)
├─ Lines Table
│  └─ TOLineProgressBar (for each line)
└─ Action Buttons
   ├─ ShipTOModal (conditional on status)
   └─ ReceiveTOModal (conditional on status)
```

### ShipTOModal Component

**Location**: `apps/frontend/components/planning/transfer-orders/ShipTOModal.tsx`

**Props**:
```typescript
interface ShipTOModalProps {
  transferOrder: TransferOrder
  lines: TOLine[]
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}
```

**Key Features**:
1. Modal form with ship date picker
2. Line quantity input table
3. Smart defaults (remaining qty)
4. Submit validation
5. Loading and error states
6. Success callback

**Example Implementation**:
```typescript
export function ShipTOModal({
  transferOrder,
  lines,
  isOpen,
  onClose,
  onSuccess,
}: ShipTOModalProps) {
  const [shipDate, setShipDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [lineInputs, setLineInputs] = useState<ShipLineInput[]>(
    lines.map(line => ({
      line_id: line.id,
      ship_qty: line.quantity - line.shipped_qty, // Smart default
      remaining_qty: line.quantity - line.shipped_qty,
    }))
  )
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleShip = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/planning/transfer-orders/${transferOrder.id}/ship`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actual_ship_date: shipDate,
            line_items: lineInputs
              .filter(l => l.ship_qty > 0)
              .map(l => ({
                to_line_id: l.line_id,
                ship_qty: l.ship_qty,
              })),
            notes: notes || undefined,
          }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to ship transfer order')
      }

      const data = await response.json()

      // Show success toast
      toast.success(`Transfer Order ${data.transfer_order.to_number} shipped successfully`)

      // Close modal
      onClose()

      // Refresh data
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      toast.error(err instanceof Error ? err.message : 'Failed to ship')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ship Transfer Order {transferOrder.to_number}</DialogTitle>
        </DialogHeader>

        {/* Shipment Date */}
        <div className="space-y-2">
          <Label>Shipment Date</Label>
          <Input
            type="date"
            value={shipDate}
            onChange={e => setShipDate(e.target.value)}
          />
        </div>

        {/* Lines Table */}
        <div className="space-y-2">
          <Label>Lines to Ship</Label>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Ordered</TableHead>
                <TableHead>Previously Shipped</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Ship Now</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineInputs.map((input, idx) => {
                const line = lines.find(l => l.id === input.line_id)!
                return (
                  <TableRow key={input.line_id}>
                    <TableCell>{line.product.name}</TableCell>
                    <TableCell>{line.quantity}</TableCell>
                    <TableCell>{line.shipped_qty}</TableCell>
                    <TableCell>{input.remaining_qty}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max={input.remaining_qty}
                        value={input.ship_qty}
                        onChange={e =>
                          setLineInputs(prev => {
                            const updated = [...prev]
                            updated[idx].ship_qty = parseFloat(e.target.value) || 0
                            return updated
                          })
                        }
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label>Notes (Optional)</Label>
          <Textarea
            placeholder="Shipment notes..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            maxLength={1000}
          />
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleShip}
            disabled={loading}
            isLoading={loading}
          >
            Ship
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### ReceiveTOModal Component

Same pattern as ShipTOModal, but:
- Field name: `receive_qty` instead of `ship_qty`
- Remaining calculation: `shipped_qty - received_qty`
- Endpoint: `/api/planning/transfer-orders/:id/receive`

### TOLineProgressBar Component

**Props**:
```typescript
interface TOLineProgressBarProps {
  shipped: number
  received: number
  total: number
  type: 'ship' | 'receive'
}
```

**Implementation**:
```typescript
export function TOLineProgressBar({
  shipped,
  received,
  total,
  type,
}: TOLineProgressBarProps) {
  const current = type === 'ship' ? shipped : received
  const max = type === 'ship' ? total : shipped
  const percent = max > 0 ? (current / max) * 100 : 0

  return (
    <div className="flex items-center gap-2">
      <Progress value={percent} className="w-20 h-2" />
      <span className="text-sm font-medium">
        {current} / {max}
        {percent === 100 && <CheckCircle2 className="w-4 h-4 text-green-500 ml-2" />}
      </span>
    </div>
  )
}
```

---

## Validation Schemas

### Zod Schemas

**File**: `apps/frontend/lib/validation/transfer-order-schemas.ts`

```typescript
// Ship validation
const ShipLineItemSchema = z.object({
  to_line_id: z.string().uuid('Invalid line ID'),
  ship_qty: z.number()
    .positive('Ship quantity must be greater than 0')
    .max(99999.9999, 'Ship quantity too large'),
})

export const shipToSchema = z.object({
  actual_ship_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .refine(
      date => new Date(date) <= new Date(),
      'Shipment date cannot be in the future'
    ),
  line_items: z.array(ShipLineItemSchema)
    .min(1, 'At least one line item required')
    .refine(
      items => items.some(item => item.ship_qty > 0),
      'At least one line must have quantity > 0'
    ),
  notes: z.string().max(1000).optional(),
})

export type ShipToInput = z.infer<typeof shipToSchema>

// Receive validation (similar pattern)
const ReceiveLineItemSchema = z.object({
  to_line_id: z.string().uuid('Invalid line ID'),
  receive_qty: z.number()
    .positive('Receive quantity must be greater than 0')
    .max(99999.9999, 'Receive quantity too large'),
})

export const receiveTORequestSchema = z.object({
  receipt_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .refine(
      date => new Date(date) <= new Date(),
      'Receipt date cannot be in the future'
    ),
  line_items: z.array(ReceiveLineItemSchema)
    .min(1, 'At least one line item required')
    .refine(
      items => items.some(item => item.receive_qty > 0),
      'At least one line must have quantity > 0'
    ),
  notes: z.string().max(1000).optional(),
})

export type ReceiveTOInput = z.infer<typeof receiveTORequestSchema>
```

---

## Testing Patterns

### Unit Tests: Service Layer

**File**: `apps/frontend/lib/services/__tests__/transfer-order-service.ship.test.ts`

```typescript
describe('shipTransferOrder', () => {
  describe('Validation', () => {
    it('should validate TO exists', async () => {
      const result = await shipTransferOrder(
        'nonexistent-id',
        { /* input */ },
        'user-1'
      )
      expect(result.success).toBe(false)
      expect(result.code).toBe('NOT_FOUND')
    })

    it('should prevent shipping unshippable statuses', async () => {
      const to = await createTransferOrder({ status: 'received' })
      const result = await shipTransferOrder(
        to.id,
        { /* input */ },
        'user-1'
      )
      expect(result.success).toBe(false)
      expect(result.code).toBe('INVALID_STATUS')
    })

    it('should validate quantities do not exceed ordered', async () => {
      const to = await createTransferOrder()
      const line = to.lines[0]

      const result = await shipTransferOrder(
        to.id,
        {
          line_items: [
            { to_line_id: line.id, ship_qty: line.quantity + 1 }
          ]
        },
        'user-1'
      )
      expect(result.success).toBe(false)
      expect(result.code).toBe('INVALID_QUANTITY')
    })

    // CRITICAL-SEC-02: Test org isolation
    it('should reject access to other org TOs', async () => {
      const to = await createTransferOrderInOrg('org-1')
      const user2 = await getUserInOrg('org-2')

      const result = await shipTransferOrder(to.id, { /* input */ }, user2.id)
      expect(result.success).toBe(false)
      expect(result.code).toBe('NOT_FOUND')
    })
  })

  describe('Quantity Updates', () => {
    it('should accumulate shipped_qty', async () => {
      const to = await createTransferOrder({
        lines: [{ quantity: 100, shipped_qty: 0 }]
      })
      const line = to.lines[0]

      // First shipment
      const result1 = await shipTransferOrder(
        to.id,
        {
          line_items: [{ to_line_id: line.id, ship_qty: 60 }]
        },
        'user-1'
      )
      expect(result1.data.lines[0].shipped_qty).toBe(60)

      // Second shipment
      const result2 = await shipTransferOrder(
        to.id,
        {
          line_items: [{ to_line_id: line.id, ship_qty: 40 }]
        },
        'user-1'
      )
      expect(result2.data.lines[0].shipped_qty).toBe(100)
    })

    it('should set actual_ship_date on FIRST shipment only', async () => {
      const to = await createTransferOrder()
      const line = to.lines[0]

      const result1 = await shipTransferOrder(
        to.id,
        {
          line_items: [{ to_line_id: line.id, ship_qty: 50 }],
          actual_ship_date: '2024-12-16'
        },
        'user-1'
      )
      expect(result1.data.actual_ship_date).toBe('2024-12-16')
      expect(result1.data.shipped_by).toBe('user-1')

      // Second shipment with different date
      const result2 = await shipTransferOrder(
        to.id,
        {
          line_items: [{ to_line_id: line.id, ship_qty: 50 }],
          actual_ship_date: '2024-12-18'
        },
        'user-2'
      )
      // Should keep original date
      expect(result2.data.actual_ship_date).toBe('2024-12-16')
      // Should keep original user
      expect(result2.data.shipped_by).toBe('user-1')
      // But updated_by should be new user
      expect(result2.data.updated_by).toBe('user-2')
    })
  })

  describe('Status Transitions', () => {
    it('should transition PLANNED -> SHIPPED when all lines fully shipped', async () => {
      const to = await createTransferOrder({
        status: 'planned',
        lines: [
          { quantity: 10, shipped_qty: 0 },
          { quantity: 5, shipped_qty: 0 }
        ]
      })

      const result = await shipTransferOrder(
        to.id,
        {
          line_items: [
            { to_line_id: to.lines[0].id, ship_qty: 10 },
            { to_line_id: to.lines[1].id, ship_qty: 5 }
          ]
        },
        'user-1'
      )
      expect(result.data.status).toBe('shipped')
    })

    it('should transition PLANNED -> PARTIALLY_SHIPPED when partial', async () => {
      const to = await createTransferOrder({
        status: 'planned',
        lines: [{ quantity: 10, shipped_qty: 0 }]
      })

      const result = await shipTransferOrder(
        to.id,
        {
          line_items: [
            { to_line_id: to.lines[0].id, ship_qty: 5 }
          ]
        },
        'user-1'
      )
      expect(result.data.status).toBe('partially_shipped')
    })

    it('should transition PARTIALLY_SHIPPED -> SHIPPED when all shipped', async () => {
      const to = await createTransferOrder({
        status: 'partially_shipped',
        lines: [{ quantity: 10, shipped_qty: 5 }]
      })

      const result = await shipTransferOrder(
        to.id,
        {
          line_items: [
            { to_line_id: to.lines[0].id, ship_qty: 5 }
          ]
        },
        'user-1'
      )
      expect(result.data.status).toBe('shipped')
    })
  })
})
```

### Integration Tests: API Routes

**File**: `apps/frontend/app/api/planning/transfer-orders/__tests__/integration.test.ts`

```typescript
describe('POST /api/planning/transfer-orders/:id/ship', () => {
  it('should ship transfer order with valid input', async () => {
    const to = await createTransferOrder()

    const response = await POST(
      createRequest({
        method: 'POST',
        body: {
          actual_ship_date: '2024-12-16',
          line_items: [
            { to_line_id: to.lines[0].id, ship_qty: 50 }
          ]
        }
      }),
      { params: Promise.resolve({ id: to.id }) }
    )

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.transfer_order.status).toBe('shipped')
  })

  it('should return 400 for invalid quantity', async () => {
    const to = await createTransferOrder()

    const response = await POST(
      createRequest({
        method: 'POST',
        body: {
          actual_ship_date: '2024-12-16',
          line_items: [
            { to_line_id: to.lines[0].id, ship_qty: 1000 } // Exceeds quantity
          ]
        }
      }),
      { params: Promise.resolve({ id: to.id }) }
    )

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('quantity')
  })

  it('should return 401 if not authenticated', async () => {
    const response = await POST(
      createRequest({ authenticated: false }),
      { params: Promise.resolve({ id: 'some-id' }) }
    )

    expect(response.status).toBe(401)
  })
})
```

### E2E Tests: Playwright

```typescript
import { test, expect } from '@playwright/test'

test('Ship and receive transfer order workflow', async ({ page }) => {
  // Navigate to TO detail page
  await page.goto('/planning/transfer-orders/TO-2024-00001')

  // Verify status is PLANNED
  await expect(page.locator('[data-testid="to-status"]')).toContainText('Planned')

  // Open ship modal
  await page.click('button:has-text("Ship")')

  // Edit ship quantities
  await page.fill('input[name="ship_qty_0"]', '50')

  // Set date
  await page.fill('input[type="date"]', '2024-12-16')

  // Click ship button
  await page.click('button:has-text("Ship")')

  // Wait for success
  await expect(page.locator('text=shipped successfully')).toBeVisible()

  // Verify status changed
  await expect(page.locator('[data-testid="to-status"]')).toContainText('Partially Shipped')

  // Verify progress indicator
  await expect(page.locator('[data-testid="line-0-progress"]')).toContainText('50 / 100')
})
```

---

## Constants and Error Codes

**File**: `apps/frontend/lib/services/transfer-order/constants.ts`

```typescript
export const ErrorCode = {
  NOT_FOUND: 'NOT_FOUND',
  INVALID_STATUS: 'INVALID_STATUS',
  INVALID_QUANTITY: 'INVALID_QUANTITY',
  INVALID_INPUT: 'INVALID_INPUT',
  DATABASE_ERROR: 'DATABASE_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const

export const NON_SHIPPABLE_STATUSES = [
  'draft',
  'shipped',
  'received',
  'closed',
  'cancelled'
]

export const NON_RECEIVABLE_STATUSES = [
  'draft',
  'planned',
  'received',
  'closed',
  'cancelled'
]

export const EDITABLE_STATUSES = [
  'draft'
]
```

---

## Helper Functions

**File**: `apps/frontend/lib/services/transfer-order/helpers.ts`

### calculateToStatus()

```typescript
export async function calculateToStatus(transferOrderId: string): Promise<string> {
  const supabaseAdmin = createServerSupabaseAdmin()

  const { data: lines } = await supabaseAdmin
    .from('transfer_order_lines')
    .select('quantity, shipped_qty, received_qty')
    .eq('to_id', transferOrderId)

  if (!lines || lines.length === 0) return 'draft'

  // Determine status based on line quantities
  const allLinesFullyShipped = lines.every(l => l.shipped_qty >= l.quantity)
  const allLinesFullyReceived = lines.every(l => l.received_qty >= l.shipped_qty)

  if (allLinesFullyReceived) return 'received'
  if (allLinesFullyShipped) return 'shipped'

  const anyLineReceived = lines.some(l => l.received_qty > 0)
  if (anyLineReceived) return 'partially_received'

  const anyLineShipped = lines.some(l => l.shipped_qty > 0)
  if (anyLineShipped) return 'partially_shipped'

  return 'planned'
}
```

### enrichWithWarehouses()

Adds warehouse names to the response for better readability.

### getCurrentOrgId()

Gets org_id from auth context (CRITICAL-SEC-02).

---

## Refactoring Patterns

### Configuration-Driven Design

Instead of duplicating ship and receive logic, use configuration:

```typescript
// Bad: Duplicate code
export async function shipTransferOrder(...) {
  // 100 lines of code
}

export async function receiveTransferOrder(...) {
  // 100 lines of code (90% same as ship)
}

// Good: Configuration-driven
export async function shipTransferOrder(...) {
  return executeTransferOrderAction(
    { actionType: 'ship', ... },
    lineQuantities
  )
}

export async function receiveTransferOrder(...) {
  return executeTransferOrderAction(
    { actionType: 'receive', ... },
    lineQuantities
  )
}
```

### Validation Extraction

Move validation logic to separate functions for reusability:

```typescript
// Instead of inline validation
if (!existingTo) { ... }
if (!EDITABLE_STATUSES.includes(to.status)) { ... }
if (newQty > maxQty) { ... }

// Extract to helper
const validation = await validateTransferOrderState(...)
if (!validation.success) return validation

const linesValidation = await fetchAndValidateLines(...)
if (!linesValidation.success) return linesValidation
```

---

## Performance Optimization

### Query Strategy

1. **Single Query for TO State**: Get TO with one query, cache org_id
2. **Bulk Line Fetch**: Get all TO lines with one query
3. **Batch Updates**: Update all lines with single batch operation
4. **Indexed Lookups**: Queries use (org_id, id) index

### Caching

```typescript
// Cache invalidation keys
org:{orgId}:to:{toId}:detail        // Invalidate on ship/receive
org:{orgId}:to:{toId}:shipments     // Invalidate on ship
org:{orgId}:to:{toId}:history       // Invalidate on any action
```

### Performance Targets

- Ship operation: <500ms (excluding network)
- Receive operation: <500ms (excluding network)
- Modal open: <100ms
- Component render: <50ms

---

## Deployment Checklist

- [ ] All migrations run (none needed for 03.9a)
- [ ] Service methods exported and tested
- [ ] API routes created and tested
- [ ] Components created and integrated
- [ ] Validation schemas added
- [ ] Constants defined
- [ ] Security fixes verified
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Performance targets met
- [ ] Code review approved
- [ ] Merged to main
- [ ] Deployed to production

---

## Troubleshooting Guide

### Service Layer Issues

**Problem**: `Cannot find module './action-helpers'`
**Solution**: Ensure `action-helpers.ts` exists in same directory as `actions.ts`

**Problem**: `getCurrentOrgId is not defined`
**Solution**: Import from `./helpers.ts` and ensure it's exported

### API Route Issues

**Problem**: `error: 'Internal server error'` with no details
**Solution**: Check server logs for console.error output. Add more detailed error logging.

**Problem**: Response doesn't include `success` field
**Solution**: Make sure you're returning the consistent response format with `success: true/false`

### Testing Issues

**Problem**: Supabase admin client not mocking correctly
**Solution**: Use `createServerSupabaseMock` from test utilities. Set `eq()` expectations properly.

**Problem**: Async/await timing issues in tests
**Solution**: Ensure all Promises are awaited. Use `async/await` consistently, not `.then()`

---

## Related Documentation

- **Story**: [03.9a - TO Partial Shipments](../../../2-MANAGEMENT/epics/current/03-planning/03.9a.to-partial-shipments.md)
- **API Docs**: [TO Partial Shipments API](../../../3-ARCHITECTURE/api/planning/to-partial-shipments.md)
- **User Guide**: [Transfer Order Partial Shipments](../user/planning/to-partial-shipments.md)
- **Story 03.8**: TO CRUD implementation (baseline)
- **Story 03.9b**: LP Pre-Selection (future)

---

**Version**: 1.0.0
**Last Updated**: December 2025
**Contributors**: Backend Dev Team, Frontend Dev Team
