# Story 3.8: Partial TO Shipments

**Epic:** 3 - Planning Operations
**Batch:** 3B - Transfer Orders
**Status:** Draft
**Priority:** P0 (Blocker)
**Story Points:** 5
**Created:** 2025-01-23

---

## Goal

Enable shipping Transfer Orders in multiple partial shipments, tracking shipped_qty per line and automatically calculating TO status based on shipment completion.

## User Story

**As a** Warehouse user
**I want** to ship Transfer Orders in multiple partial shipments
**So that** I can handle scenarios where full inventory is not available at once

---

## Problem Statement

In real warehouse operations, it's common that:
1. Not all products are available at the planned ship date
2. Products need to be shipped in multiple batches as they become available
3. Some products may never be fully shipped (damaged, lost, etc.)

Currently (after Story 3.7), TO lines have shipped_qty initialized to 0, but there's no way to update them. Users need:
1. Ability to ship partial quantities (e.g., 5 out of 10 kg)
2. Multiple shipment operations (ship 5 kg today, 3 kg tomorrow, 2 kg next week)
3. Automatic status calculation (partially_shipped vs shipped)
4. Validation to prevent over-shipping (shipped_qty > quantity)
5. Tracking of actual_ship_date

---

## Acceptance Criteria

### AC-3.8.1: Ship Transfer Order Button
**Given** a TO with status = 'planned' and at least 1 line
**When** viewing the TO detail page
**Then** I should see a "Ship Transfer Order" button in the header actions

**Success Criteria:**
- ✅ Button styled as primary action (blue/green)
- ✅ Button shows icon: truck/package
- ✅ Button hidden if status = 'shipped' or 'received' (already shipped)
- ✅ Button enabled if status = 'planned' or 'partially_shipped'
- ✅ Tooltip on hover: "Record shipment for this transfer"

---

### AC-3.8.2: Ship TO Modal - Initial Load
**Given** I click "Ship Transfer Order" on a TO with status = 'planned'
**When** the modal opens
**Then** I should see:
- Modal title: "Ship Transfer Order - TO-2025-001"
- Actual Ship Date field (date picker, default: today)
- Table of all TO lines with columns:
  - Product Code, Product Name
  - Planned Qty (from to_lines.quantity)
  - Already Shipped (from to_lines.shipped_qty, initially 0)
  - Remaining (calculated: quantity - shipped_qty)
  - Ship Now (input field, number, max = remaining)
- Buttons: Cancel, Confirm Shipment

**Success Criteria:**
- ✅ All TO lines displayed in table
- ✅ Actual Ship Date defaults to current date
- ✅ Ship Now inputs default to 0 (user must enter quantities)
- ✅ Remaining calculated correctly for each line
- ✅ Table sorted by line creation order (same as TO lines table)

**Example Row:**
| Product Code | Product Name | Planned | Already Shipped | Remaining | Ship Now |
|--------------|--------------|---------|-----------------|-----------|----------|
| RAW-001 | Flour | 10 kg | 0 kg | 10 kg | [input: 0] |
| RAW-002 | Sugar | 5 kg | 0 kg | 5 kg | [input: 0] |

---

### AC-3.8.3: Enter Partial Shipment Quantities
**Given** the Ship TO modal is open
**When** I enter quantities in "Ship Now" inputs:
- Flour: Ship Now = 10 kg (full quantity)
- Sugar: Ship Now = 3 kg (partial, 2 kg remaining)
**Then** the inputs should validate:
- 0 ≤ Ship Now ≤ Remaining
- Decimals allowed (e.g., 2.5 kg)
- Negative numbers rejected

**Success Criteria:**
- ✅ Ship Now input type: number, step: 0.01 (allows decimals)
- ✅ Ship Now input min: 0, max: remaining qty
- ✅ Invalid input shows inline error: "Cannot ship more than remaining (5 kg)"
- ✅ Can ship 0 kg for a line (skip that line in this shipment)
- ✅ Can ship full quantity (Ship Now = Remaining)
- ✅ Can ship partial quantity (0 < Ship Now < Remaining)

---

### AC-3.8.4: Confirm Partial Shipment
**Given** I have entered valid Ship Now quantities (at least 1 line > 0)
**When** I click "Confirm Shipment"
**Then** the shipment should be recorded via `POST /api/planning/transfer-orders/:id/ship`

**API Request:**
```json
{
  "actual_ship_date": "2025-01-23",
  "lines": [
    { "line_id": "uuid-1", "shipped_qty": 10 },
    { "line_id": "uuid-2", "shipped_qty": 3 }
  ]
}
```

**Database Updates:**
1. Update `to_lines.shipped_qty`:
   - Flour: shipped_qty = 0 + 10 = 10 kg (fully shipped)
   - Sugar: shipped_qty = 0 + 3 = 3 kg (partially shipped, 2 kg remaining)
2. Update `transfer_orders.actual_ship_date` = "2025-01-23" (first shipment only)
3. Calculate and update `transfer_orders.status`:
   - If ALL lines fully shipped (shipped_qty >= quantity) → status = 'shipped'
   - If SOME lines partially shipped (0 < shipped_qty < quantity) → status = 'partially_shipped'

**Success Criteria:**
- ✅ Modal closes on successful shipment
- ✅ TO detail page refreshes
- ✅ TO lines table shows updated Shipped Qty: Flour (10/10 ✅), Sugar (3/5 ⏳)
- ✅ TO status badge updates: "Planned" → "Partially Shipped" (yellow/orange)
- ✅ Success toast: "Transfer Order shipped successfully"
- ✅ Audit log entry created (status change logged)

**API Endpoint:**
```
POST /api/planning/transfer-orders/:id/ship
Body: {
  actual_ship_date: ISO string,
  lines: [{ line_id: UUID, shipped_qty: number }]
}
Response: TransferOrder object (with updated status)
```

---

### AC-3.8.5: Second Partial Shipment
**Given** a TO with status = 'partially_shipped' (Sugar: 3/5 kg shipped, 2 kg remaining)
**When** I click "Ship Transfer Order" again
**Then** the Ship TO modal should show:

| Product Code | Product Name | Planned | Already Shipped | Remaining | Ship Now |
|--------------|--------------|---------|-----------------|-----------|----------|
| RAW-001 | Flour | 10 kg | 10 kg | 0 kg | [disabled] |
| RAW-002 | Sugar | 5 kg | 3 kg | 2 kg | [input: 0] |

**Success Criteria:**
- ✅ Fully shipped lines (Flour) have Ship Now input disabled (grayed out)
- ✅ Remaining qty updated: Sugar shows 2 kg remaining
- ✅ User can ship remaining 2 kg (or partial, e.g., 1 kg)
- ✅ Actual Ship Date defaults to today (can be different from first shipment)

**When** I ship remaining 2 kg of Sugar:
**Then** the shipment should update:
- Sugar: shipped_qty = 3 + 2 = 5 kg (fully shipped now)
- TO status: ALL lines fully shipped → status = 'shipped'
- Status badge: "Partially Shipped" → "Shipped" (green)

---

### AC-3.8.6: Status Calculation Logic
**Given** a TO with multiple lines
**When** shipment is recorded
**Then** the status should be calculated as follows:

**Status = 'shipped' IF:**
- ALL lines have shipped_qty >= quantity
- Example: Line 1 (10/10), Line 2 (5/5), Line 3 (20/20) → 100% shipped

**Status = 'partially_shipped' IF:**
- AT LEAST ONE line has shipped_qty < quantity
- Example: Line 1 (10/10), Line 2 (3/5), Line 3 (20/20) → 67% shipped (2/3 lines done)

**Status remains 'planned' IF:**
- ALL lines have shipped_qty = 0 (nothing shipped yet - shouldn't happen via Ship TO modal)

**Success Criteria:**
- ✅ Status calculated automatically on backend (not manual user selection)
- ✅ Status calculation runs after every shipment
- ✅ Status badge color:
  - 'planned' → Blue
  - 'partially_shipped' → Yellow/Orange
  - 'shipped' → Green
- ✅ Status visible in TO list and detail page

---

### AC-3.8.7: Validation - Cannot Over-Ship
**Given** a TO line with quantity = 10 kg, already shipped = 7 kg (remaining = 3 kg)
**When** I try to ship 5 kg (more than remaining)
**Then** I should receive a validation error

**Success Criteria:**
- ✅ Client-side validation: Ship Now input max = remaining qty (HTML5 validation)
- ✅ Server-side validation: `shipped_qty <= quantity` check in API
- ✅ Error message: "Cannot ship more than remaining quantity. Max: 3 kg"
- ✅ Error toast displayed in UI
- ✅ Shipment rejected (422 Unprocessable Entity)

**Database Constraint:**
```sql
ALTER TABLE to_lines ADD CONSTRAINT check_shipped_qty_max
  CHECK (shipped_qty >= 0 AND shipped_qty <= quantity);
```

---

### AC-3.8.8: Validation - At Least One Line Must Be Shipped
**Given** the Ship TO modal is open
**When** I leave all "Ship Now" inputs at 0 (shipping nothing)
**And** click "Confirm Shipment"
**Then** I should receive a validation error

**Success Criteria:**
- ✅ Error message: "Please enter quantities to ship. At least one line must have Ship Now > 0."
- ✅ Confirm button disabled if all Ship Now = 0
- ✅ Modal remains open (doesn't submit)

---

### AC-3.8.9: Actual Ship Date Immutability
**Given** a TO has been shipped once (actual_ship_date = "2025-01-23")
**When** I record a second shipment on "2025-01-25"
**Then** the actual_ship_date should NOT be overwritten

**Success Criteria:**
- ✅ actual_ship_date set on FIRST shipment only
- ✅ Subsequent shipments do NOT update actual_ship_date
- ✅ Rationale: actual_ship_date represents "when the transfer started", not "last shipment date"
- ✅ For tracking individual shipment dates, use shipment_history table (future enhancement)

---

### AC-3.8.10: TO Lines Table - Shipped Qty Display
**Given** a TO has partial shipments
**When** viewing the TO detail page
**Then** the TO lines table should show Shipped Qty with visual indicators:

**Display Format:**
- Fully shipped line: "10 / 10 kg ✅" (green checkmark)
- Partially shipped line: "3 / 5 kg ⏳" (yellow clock icon)
- Not shipped line: "0 / 10 kg ⏳" (gray clock icon)

**Success Criteria:**
- ✅ Shipped Qty column format: "{shipped} / {quantity} {uom} {icon}"
- ✅ Icon based on shipped_qty:
  - shipped_qty >= quantity → ✅ (green checkmark)
  - 0 < shipped_qty < quantity → ⏳ (yellow/orange clock)
  - shipped_qty = 0 → ⏳ (gray clock)
- ✅ Tooltip on icon: "Fully shipped", "Partially shipped (2 kg remaining)", "Not shipped yet"

---

## Technical Implementation

### Database Schema Updates

```sql
-- Migration: 022_add_shipped_received_constraints.sql

-- Already exists from Story 3.7, but add comments for clarity:
COMMENT ON COLUMN to_lines.shipped_qty IS 'Cumulative quantity shipped across all shipments';
COMMENT ON COLUMN to_lines.received_qty IS 'Cumulative quantity received (Story 3.8 receive functionality)';

-- Ensure constraints exist:
ALTER TABLE to_lines
  DROP CONSTRAINT IF EXISTS check_shipped_qty_max,
  ADD CONSTRAINT check_shipped_qty_max CHECK (shipped_qty >= 0 AND shipped_qty <= quantity);

ALTER TABLE to_lines
  DROP CONSTRAINT IF EXISTS check_received_qty_max,
  ADD CONSTRAINT check_received_qty_max CHECK (received_qty >= 0 AND received_qty <= shipped_qty);

-- Add index for status queries:
CREATE INDEX IF NOT EXISTS idx_transfer_orders_status_date ON transfer_orders(org_id, status, planned_ship_date);
```

### Zod Schema

```typescript
// lib/validation/ship-to-schemas.ts

import { z } from 'zod'

export const ShipToLineSchema = z.object({
  line_id: z.string().uuid('Invalid line ID'),
  shipped_qty: z.number().min(0, 'Shipped quantity cannot be negative')
})

export const ShipToSchema = z.object({
  actual_ship_date: z.string().datetime('Invalid date format'),
  lines: z.array(ShipToLineSchema).min(1, 'At least one line must be shipped')
}).refine(data => data.lines.some(line => line.shipped_qty > 0), {
  message: 'At least one line must have shipped quantity > 0',
  path: ['lines']
})
```

### API Route

```typescript
// app/api/planning/transfer-orders/[id]/ship/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ShipToSchema } from '@/lib/validation/ship-to-schemas'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const body = await request.json()

  // Validate
  const result = ShipToSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  // Get TO with lines
  const { data: to } = await supabase
    .from('transfer_orders')
    .select(`
      *,
      lines:to_lines(*)
    `)
    .eq('id', params.id)
    .single()

  if (!to) {
    return NextResponse.json({ error: 'Transfer Order not found' }, { status: 404 })
  }

  // Validate status (must be planned or partially_shipped)
  if (!['planned', 'partially_shipped'].includes(to.status)) {
    return NextResponse.json(
      { error: `Cannot ship TO with status: ${to.status}` },
      { status: 422 }
    )
  }

  // Start transaction
  const updates = result.data.lines.map(async (lineUpdate) => {
    const line = to.lines.find(l => l.id === lineUpdate.line_id)
    if (!line) {
      throw new Error(`Line ${lineUpdate.line_id} not found`)
    }

    // Calculate new shipped_qty (cumulative)
    const newShippedQty = line.shipped_qty + lineUpdate.shipped_qty

    // Validate: cannot over-ship
    if (newShippedQty > line.quantity) {
      throw new Error(
        `Cannot ship more than remaining. Line: ${line.product_id}, Max: ${line.quantity - line.shipped_qty}`
      )
    }

    // Update line
    return supabase
      .from('to_lines')
      .update({ shipped_qty: newShippedQty })
      .eq('id', lineUpdate.line_id)
  })

  await Promise.all(updates)

  // Calculate new status
  const { data: updatedLines } = await supabase
    .from('to_lines')
    .select('*')
    .eq('transfer_order_id', params.id)

  const allFullyShipped = updatedLines?.every(line => line.shipped_qty >= line.quantity)
  const newStatus = allFullyShipped ? 'shipped' : 'partially_shipped'

  // Update TO
  const toUpdate: any = { status: newStatus }

  // Set actual_ship_date on FIRST shipment only
  if (!to.actual_ship_date) {
    toUpdate.actual_ship_date = result.data.actual_ship_date
  }

  const { data: updatedTo, error } = await supabase
    .from('transfer_orders')
    .update(toUpdate)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(updatedTo)
}
```

### Frontend Component

```typescript
// components/planning/ShipToModal.tsx

interface ShipToModalProps {
  transferOrder: TransferOrder
  lines: TransferOrderLine[]
  onClose: () => void
  onSuccess: () => void
}

export function ShipToModal({ transferOrder, lines, onClose, onSuccess }: ShipToModalProps) {
  const [actualShipDate, setActualShipDate] = useState(new Date().toISOString().split('T')[0])
  const [lineShipments, setLineShipments] = useState<Record<string, number>>(
    Object.fromEntries(lines.map(line => [line.id, 0]))
  )

  const handleShipNowChange = (lineId: string, value: number) => {
    const line = lines.find(l => l.id === lineId)
    if (!line) return

    const remaining = line.quantity - line.shipped_qty
    const clamped = Math.max(0, Math.min(value, remaining))
    setLineShipments(prev => ({ ...prev, [lineId]: clamped }))
  }

  const handleSubmit = async () => {
    const linesToShip = Object.entries(lineShipments)
      .filter(([_, qty]) => qty > 0)
      .map(([line_id, shipped_qty]) => ({ line_id, shipped_qty }))

    if (linesToShip.length === 0) {
      toast.error('Please enter quantities to ship')
      return
    }

    const response = await fetch(`/api/planning/transfer-orders/${transferOrder.id}/ship`, {
      method: 'POST',
      body: JSON.stringify({
        actual_ship_date: actualShipDate,
        lines: linesToShip
      })
    })

    if (response.ok) {
      toast.success('Transfer Order shipped successfully')
      onSuccess()
      onClose()
    } else {
      const error = await response.json()
      toast.error(error.message || 'Failed to ship Transfer Order')
    }
  }

  return (
    <Modal title={`Ship Transfer Order - ${transferOrder.to_number}`} onClose={onClose}>
      <div className="space-y-4">
        <Input
          type="date"
          label="Actual Ship Date"
          value={actualShipDate}
          onChange={(e) => setActualShipDate(e.target.value)}
        />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Planned</TableHead>
              <TableHead>Already Shipped</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Ship Now</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map(line => {
              const remaining = line.quantity - line.shipped_qty
              const isFullyShipped = remaining === 0

              return (
                <TableRow key={line.id}>
                  <TableCell>{line.product.name}</TableCell>
                  <TableCell>{line.quantity} {line.uom}</TableCell>
                  <TableCell>{line.shipped_qty} {line.uom}</TableCell>
                  <TableCell>{remaining} {line.uom}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      max={remaining}
                      value={lineShipments[line.id]}
                      onChange={(e) => handleShipNowChange(line.id, parseFloat(e.target.value))}
                      disabled={isFullyShipped}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Confirm Shipment</Button>
        </div>
      </div>
    </Modal>
  )
}
```

---

## Testing Requirements

### Unit Tests (Vitest)
- ✅ `ShipToSchema` validation (at least 1 line, shipped_qty > 0)
- ✅ Status calculation logic (shipped vs partially_shipped)
- ✅ Cumulative shipped_qty calculation (previous + new)

### Integration Tests (Vitest + Supabase)
- ✅ `POST /api/planning/transfer-orders/:id/ship` updates shipped_qty and status
- ✅ First shipment: status 'planned' → 'partially_shipped'
- ✅ Second shipment: status 'partially_shipped' → 'shipped' (if all fully shipped)
- ✅ Validation: Cannot ship more than remaining qty (422)
- ✅ Validation: Cannot ship with status = 'received' (422)
- ✅ actual_ship_date set on first shipment only (not overwritten)
- ✅ Database constraint: shipped_qty <= quantity enforced

### E2E Tests (Playwright)
- ✅ Ship full TO: Ship all lines 100%, verify status = 'shipped'
- ✅ Ship partial TO: Ship 50% of lines, verify status = 'partially_shipped'
- ✅ Second shipment: Ship remaining qty, verify status = 'shipped'
- ✅ Validation error: Try ship more than remaining, verify error message
- ✅ TO lines table: Verify Shipped Qty display with icons (✅ vs ⏳)

---

## Dependencies

### Prerequisite Stories
- ✅ Story 3.6: Transfer Order CRUD (transfer_orders table, status field)
- ✅ Story 3.7: TO Line Management (to_lines table, shipped_qty field initialized to 0)

### Provides APIs for
- Story 3.8 (this story): Receive TO functionality (updates received_qty, similar to shipped_qty)

---

## Notes / References

- **Tech Spec:** `docs/sprint-artifacts/tech-spec-epic-3-batch-3b.md`
- **Epic Story:** `docs/epics/epic-3-planning.md` (Story 3.8)
- **Database Migration:** `lib/supabase/migrations/022_add_shipped_received_constraints.sql`
- **Zod Schemas:** `lib/validation/ship-to-schemas.ts`
- **API Routes:** `app/api/planning/transfer-orders/[id]/ship/route.ts`
- **UI Components:** `components/planning/ShipToModal.tsx`

---

**Definition of Done:**
- [ ] Database constraints applied (shipped_qty validation)
- [ ] API endpoint implemented (POST /ship)
- [ ] Zod validation schema created and tested
- [ ] Ship TO modal UI implemented
- [ ] Status calculation logic working (shipped vs partially_shipped)
- [ ] Cumulative shipped_qty updates working correctly
- [ ] actual_ship_date immutability implemented (set once)
- [ ] TO lines table showing Shipped Qty with icons (✅ ⏳)
- [ ] All unit tests passing (95% coverage)
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
