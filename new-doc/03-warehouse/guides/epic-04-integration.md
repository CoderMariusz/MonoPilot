# Epic 04.8 Integration Guide: Material Reservations

**Story:** 05.3 - LP Reservations + FIFO/FEFO Picking
**Target:** Epic 04.8 (Work Order Material Reservations)
**Version:** 1.0
**Last Updated:** 2026-01-03

## Overview

This guide shows Epic 04 developers how to integrate LP Reservations into Work Order material management. Story 05.3 provides the complete infrastructure - this document explains how to use it.

**What Epic 04.8 needs to implement:**
- Auto-reserve materials when WO starts
- Display reservations on WO detail page
- Release reservations when WO cancelled/completed
- Track material consumption against reservations

**What Story 05.3 provides:**
- `lp_reservations` table with RLS
- FIFO/FEFO picking algorithms
- Multi-LP allocation logic
- Service methods for all operations
- UI components (reservations panel, modals)

---

## Quick Start

### 1. Import Services

```typescript
import { LPReservationService } from '@/lib/services/lp-reservation-service'
import { FIFOFEFOService } from '@/lib/services/fifo-fefo-service'
```

### 2. Reserve Materials on WO Start

```typescript
import { createServerClient } from '@/lib/supabase/server'

export async function reserveMaterialsForWO(woId: string) {
  const supabase = await createServerClient()

  // Get WO materials
  const { data: materials } = await supabase
    .from('wo_materials')
    .select('*')
    .eq('wo_id', woId)

  // Reserve each material
  const results = []

  for (const material of materials || []) {
    const result = await LPReservationService.reserveLPs(
      supabase,
      woId,
      material.id,           // wo_material_id for linking
      material.product_id,
      material.quantity_required
    )

    results.push({
      material,
      result
    })

    // Handle shortfall
    if (result.shortfall > 0) {
      console.warn(
        `Material ${material.product_name}: Reserved ${result.total_reserved}, ` +
        `Shortfall ${result.shortfall}`
      )
    }
  }

  return results
}
```

### 3. Display Reservations on WO Detail Page

```typescript
// app/(authenticated)/production/work-orders/[id]/page.tsx

import { ReservationsPanel } from '@/components/warehouse/reservations/ReservationsPanel'

export default function WODetailPage({ params }: { params: { id: string } }) {
  const { id: woId } = params

  // Fetch WO data...

  return (
    <div>
      {/* WO Header, BOM, etc. */}

      {/* Reservations Panel */}
      <ReservationsPanel
        woId={woId}
        woNumber={wo.wo_number}
        woStatus={wo.status}
        onReservationsChange={() => {
          // Refresh WO data if needed
        }}
        onAddReservation={() => {
          // Open Reserve LPs modal
        }}
        onReleaseReservation={async (reservationId) => {
          // Handle release
          await LPReservationService.releaseReservation(supabase, reservationId)
        }}
      />
    </div>
  )
}
```

### 4. Release Reservations on WO Cancel

```typescript
export async function cancelWorkOrder(woId: string) {
  const supabase = await createServerClient()

  // Release all reservations
  const releasedCount = await LPReservationService.releaseAllReservations(
    supabase,
    woId
  )

  console.log(`Released ${releasedCount} reservations`)

  // Update WO status to 'cancelled'
  await supabase
    .from('work_orders')
    .update({ status: 'cancelled' })
    .eq('id', woId)
}
```

---

## Integration Points

### Point 1: Auto-Reserve on WO Start

**Trigger:** User clicks "Start Production" button on WO.

**Implementation:**

```typescript
// app/api/production/work-orders/[id]/start/route.ts

import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { LPReservationService } from '@/lib/services/lp-reservation-service'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerClient()
  const woId = params.id

  try {
    // 1. Get WO materials
    const { data: materials, error: materialsError } = await supabase
      .from('wo_materials')
      .select('*')
      .eq('wo_id', woId)

    if (materialsError) {
      return Response.json({ error: materialsError.message }, { status: 500 })
    }

    // 2. Reserve each material
    const reservationResults = []
    let hasShortfall = false

    for (const material of materials || []) {
      const result = await LPReservationService.reserveLPs(
        supabase,
        woId,
        material.id,
        material.product_id,
        material.quantity_required
      )

      reservationResults.push({
        material_id: material.id,
        product_name: material.product_name,
        total_reserved: result.total_reserved,
        shortfall: result.shortfall
      })

      if (result.shortfall > 0) {
        hasShortfall = true
      }
    }

    // 3. Update WO status
    const { error: updateError } = await supabase
      .from('work_orders')
      .update({ status: 'in_progress' })
      .eq('id', woId)

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 })
    }

    // 4. Return result
    return Response.json({
      success: true,
      reservations: reservationResults,
      warning: hasShortfall
        ? 'Some materials have insufficient inventory'
        : undefined
    })

  } catch (error) {
    console.error('Failed to start WO:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Error Handling:**

```typescript
// If reservation fails for one material, continue with others
for (const material of materials || []) {
  try {
    const result = await LPReservationService.reserveLPs(...)
    reservationResults.push(result)
  } catch (error) {
    console.error(`Failed to reserve material ${material.id}:`, error)

    // Log error but continue
    reservationResults.push({
      material_id: material.id,
      error: error.message,
      total_reserved: 0,
      shortfall: material.quantity_required
    })
  }
}
```

---

### Point 2: Display Reservations Panel

**Location:** WO detail page (Production module).

**Component:** `ReservationsPanel` (already implemented in Story 05.3).

**Props:**

```typescript
interface ReservationsPanelProps {
  woId: string                                        // Required
  woNumber: string                                    // For display
  woStatus: string                                    // To disable actions if completed
  onReservationsChange?: () => void                   // Callback when reservations change
  onAddReservation?: () => void                       // Open Reserve LPs modal
  onReleaseReservation?: (reservationId: string) => void
}
```

**Example:**

```typescript
// app/(authenticated)/production/work-orders/[id]/page.tsx

'use client'

import { useState } from 'react'
import { ReservationsPanel } from '@/components/warehouse/reservations/ReservationsPanel'
import { ReserveLPsModal } from '@/components/warehouse/reservations/ReserveLPsModal'
import { createBrowserClient } from '@/lib/supabase/client'
import { LPReservationService } from '@/lib/services/lp-reservation-service'

export default function WODetailPage({ params }: { params: { id: string } }) {
  const [showReserveModal, setShowReserveModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const supabase = createBrowserClient()

  // Fetch WO data...
  const { data: wo } = useWO(params.id)

  return (
    <div className="space-y-6">
      {/* WO Header */}
      <div>
        <h1>Work Order: {wo?.wo_number}</h1>
        <p>Status: {wo?.status}</p>
      </div>

      {/* BOM Section */}
      {/* ... */}

      {/* Reservations Panel */}
      <ReservationsPanel
        woId={params.id}
        woNumber={wo?.wo_number || ''}
        woStatus={wo?.status || ''}
        key={refreshKey}  // Force refresh when key changes
        onReservationsChange={() => {
          setRefreshKey(prev => prev + 1)
        }}
        onAddReservation={() => {
          setShowReserveModal(true)
        }}
        onReleaseReservation={async (reservationId) => {
          try {
            await LPReservationService.releaseReservation(supabase, reservationId)
            setRefreshKey(prev => prev + 1)  // Refresh panel
          } catch (error) {
            console.error('Failed to release reservation:', error)
            alert('Failed to release reservation')
          }
        }}
      />

      {/* Reserve LPs Modal */}
      {showReserveModal && (
        <ReserveLPsModal
          woId={params.id}
          onClose={() => setShowReserveModal(false)}
          onSuccess={() => {
            setShowReserveModal(false)
            setRefreshKey(prev => prev + 1)
          }}
        />
      )}
    </div>
  )
}
```

**Features Provided:**
- List of all reservations with LP details
- Search and filter (by status, material)
- Summary bar (total reserved, consumed, remaining)
- Release button (per reservation)
- Empty state with "Reserve Materials" CTA
- Loading and error states

---

### Point 3: Release on WO Cancel/Complete

**Scenario 1: WO Cancelled**

```typescript
// app/api/production/work-orders/[id]/cancel/route.ts

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerClient()
  const woId = params.id

  try {
    // 1. Release all reservations
    const releasedCount = await LPReservationService.releaseAllReservations(
      supabase,
      woId
    )

    console.log(`Released ${releasedCount} reservations for WO ${woId}`)

    // 2. Update WO status
    const { error } = await supabase
      .from('work_orders')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', woId)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({
      success: true,
      released_count: releasedCount
    })

  } catch (error) {
    console.error('Failed to cancel WO:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Scenario 2: WO Completed**

```typescript
// app/api/production/work-orders/[id]/complete/route.ts

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerClient()
  const woId = params.id

  try {
    // 1. Release unused reservations (status='active', not consumed)
    const { data: activeReservations } = await supabase
      .from('lp_reservations')
      .select('id, reserved_qty, consumed_qty')
      .eq('wo_id', woId)
      .eq('status', 'active')

    let releasedCount = 0

    for (const res of activeReservations || []) {
      if (res.consumed_qty < res.reserved_qty) {
        // Still has remaining qty - release it
        await LPReservationService.releaseReservation(supabase, res.id)
        releasedCount++
      }
    }

    console.log(`Released ${releasedCount} unused reservations`)

    // 2. Update WO status
    const { error } = await supabase
      .from('work_orders')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', woId)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({
      success: true,
      released_count: releasedCount
    })

  } catch (error) {
    console.error('Failed to complete WO:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

### Point 4: Material Consumption Tracking

**Scenario:** Worker issues material from reserved LP.

**Implementation:**

```typescript
// app/api/production/work-orders/[id]/consume-material/route.ts

import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { LPReservationService } from '@/lib/services/lp-reservation-service'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerClient()
  const woId = params.id
  const { lp_id, consumed_qty } = await req.json()

  try {
    // 1. Find active reservation for this LP + WO
    const { data: reservation, error: findError } = await supabase
      .from('lp_reservations')
      .select('*')
      .eq('wo_id', woId)
      .eq('lp_id', lp_id)
      .eq('status', 'active')
      .single()

    if (findError || !reservation) {
      return Response.json(
        { error: 'No active reservation found for this LP' },
        { status: 404 }
      )
    }

    // 2. Consume from reservation
    const updated = await LPReservationService.consumeReservation(
      supabase,
      reservation.id,
      consumed_qty
    )

    // 3. Update LP quantity
    const { error: lpError } = await supabase
      .from('license_plates')
      .update({
        quantity: supabase.raw(`quantity - ${consumed_qty}`)
      })
      .eq('id', lp_id)

    if (lpError) {
      return Response.json({ error: lpError.message }, { status: 500 })
    }

    // 4. Update wo_material consumed_qty
    if (reservation.wo_material_id) {
      await supabase
        .from('wo_materials')
        .update({
          consumed_qty: supabase.raw(`consumed_qty + ${consumed_qty}`)
        })
        .eq('id', reservation.wo_material_id)
    }

    return Response.json({
      success: true,
      reservation: updated
    })

  } catch (error) {
    console.error('Failed to consume material:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Alternative: Consume from any reservation (first match):**

```typescript
// If multiple reservations exist for same material, consume from first available
const { data: reservations } = await supabase
  .from('lp_reservations')
  .select('*')
  .eq('wo_id', woId)
  .eq('lp_id', lp_id)
  .eq('status', 'active')
  .order('created_at', { ascending: true })  // FIFO consumption

const reservation = reservations?.[0]

if (!reservation) {
  throw new Error('No active reservation found')
}

// Consume from this reservation...
```

---

## Database Integration

### Link Reservations to WO Materials

The `lp_reservations.wo_material_id` column links reservations to `wo_materials` table.

**Schema:**

```sql
-- wo_materials table (Epic 04)
CREATE TABLE wo_materials (
  id UUID PRIMARY KEY,
  wo_id UUID REFERENCES work_orders(id),
  product_id UUID REFERENCES products(id),
  quantity_required DECIMAL(15,4),
  quantity_consumed DECIMAL(15,4) DEFAULT 0,
  ...
);

-- lp_reservations table (Story 05.3)
CREATE TABLE lp_reservations (
  ...
  wo_material_id UUID,  -- Links to wo_materials.id
  ...
);
```

**Query: Get reservations per material:**

```sql
SELECT
  wom.id AS material_id,
  wom.product_id,
  wom.quantity_required,
  wom.quantity_consumed,
  COUNT(r.id) AS reservation_count,
  COALESCE(SUM(r.reserved_qty), 0) AS total_reserved,
  COALESCE(SUM(r.consumed_qty), 0) AS total_consumed_from_reservations,
  COALESCE(SUM(r.reserved_qty - r.consumed_qty), 0) AS total_remaining
FROM wo_materials wom
LEFT JOIN lp_reservations r ON wom.id = r.wo_material_id AND r.status = 'active'
WHERE wom.wo_id = $wo_id
GROUP BY wom.id;
```

**Use Case:** Display material status with reservation details.

---

## UI Components Provided

Story 05.3 provides these ready-to-use components:

### 1. ReservationsPanel

**Purpose:** Display all reservations for a WO.

**Location:** `apps/frontend/components/warehouse/reservations/ReservationsPanel.tsx`

**Features:**
- Table of reservations with LP details
- Search and filter
- Release button per reservation
- Summary bar (total reserved/consumed/remaining)
- Empty, loading, error states

**Usage:** See Point 2 above.

### 2. ReserveLPsModal

**Purpose:** Reserve LPs for a material (manual reservation).

**Location:** `apps/frontend/components/warehouse/reservations/ReserveLPsModal.tsx`

**Features:**
- Select material from WO
- Find available LPs using FIFO/FEFO
- Multi-LP selection
- Quantity input
- FIFO/FEFO violation warnings

**Usage:**

```typescript
import { ReserveLPsModal } from '@/components/warehouse/reservations/ReserveLPsModal'

<ReserveLPsModal
  woId="wo-123"
  onClose={() => setShowModal(false)}
  onSuccess={() => {
    // Refresh reservations
    setShowModal(false)
  }}
/>
```

### 3. AvailableLPsPicker

**Purpose:** Find and select available LPs with FIFO/FEFO suggestions.

**Location:** `apps/frontend/components/warehouse/reservations/AvailableLPsPicker.tsx`

**Features:**
- List available LPs sorted by strategy
- Visual suggestion indicator (green checkmark)
- Suggestion reason ("FIFO: oldest", "FEFO: expires 2026-03-01")
- Multi-select support

**Usage:**

```typescript
import { AvailableLPsPicker } from '@/components/warehouse/reservations/AvailableLPsPicker'

<AvailableLPsPicker
  productId="product-123"
  warehouseId="warehouse-001"
  onSelect={(selectedLPs) => {
    // Handle LP selection
  }}
/>
```

---

## Workflow Examples

### Example 1: Complete WO Lifecycle

```typescript
// 1. User creates WO
const wo = await createWorkOrder({
  product_id: 'product-123',
  quantity: 1000
})

// 2. System generates BOM → wo_materials
const materials = await generateBOM(wo.id)

// 3. User clicks "Start Production"
await startWorkOrder(wo.id)
  // → Auto-reserves materials using FIFO/FEFO
  // → Creates lp_reservations for each material
  // → Updates WO status to 'in_progress'

// 4. Worker issues material
await consumeMaterial(wo.id, lp_id, consumed_qty)
  // → Updates lp_reservations.consumed_qty
  // → Updates license_plates.quantity
  // → Updates wo_materials.quantity_consumed

// 5. Production complete
await completeWorkOrder(wo.id)
  // → Releases unused reservations
  // → Updates WO status to 'completed'
```

### Example 2: Partial Allocation Handling

```typescript
// Reserve materials
const results = await reserveMaterialsForWO('wo-123')

// Check for shortfalls
const shortfalls = results.filter(r => r.result.shortfall > 0)

if (shortfalls.length > 0) {
  // Notify user
  const message = shortfalls
    .map(s =>
      `${s.material.product_name}: ${s.result.total_reserved} reserved, ` +
      `${s.result.shortfall} short`
    )
    .join('\n')

  await showWarningDialog({
    title: 'Insufficient Inventory',
    message: 'Some materials have insufficient inventory:\n\n' + message,
    action: 'Do you want to proceed with partial allocation?'
  })

  // Options:
  // 1. Proceed with partial allocation (user accepts shortfall)
  // 2. Cancel WO start
  // 3. Initiate purchase order for missing materials
}
```

### Example 3: Manual Reservation Override

```typescript
// User wants to manually select LP (override FIFO/FEFO)

// 1. Find available LPs
const availableLPs = await FIFOFEFOService.findAvailableLPs(
  supabase,
  'product-123',
  { strategy: 'fifo' }
)

// 2. User selects LP-003 instead of suggested LP-001
const selectedLP = availableLPs.find(lp => lp.id === 'lp-003')

// 3. Check violation
const violation = await FIFOFEFOService.checkFIFOFEFOViolation(
  supabase,
  'lp-003',
  'product-123',
  'fifo'
)

if (violation.hasViolation) {
  // 4. Show warning
  const confirmed = await showConfirmDialog({
    title: 'FIFO Violation',
    message: violation.message,
    confirmText: 'Continue Anyway'
  })

  if (!confirmed) {
    return // User cancelled
  }
}

// 5. Create reservation
await LPReservationService.createReservation(supabase, {
  lp_id: 'lp-003',
  wo_id: 'wo-123',
  reserved_qty: 50
})
```

---

## Testing Epic 04.8 Integration

### Unit Tests

```typescript
// Test auto-reservation logic
describe('reserveMaterialsForWO', () => {
  it('should reserve all materials using FIFO', async () => {
    const wo = await createTestWO()
    const materials = await createTestMaterials(wo.id, 3)

    const results = await reserveMaterialsForWO(wo.id)

    expect(results).toHaveLength(3)
    results.forEach(r => {
      expect(r.result.success).toBe(true)
      expect(r.result.shortfall).toBe(0)
    })
  })

  it('should handle partial allocation', async () => {
    const wo = await createTestWO()
    const material = await createTestMaterial(wo.id, {
      product_id: 'product-123',
      quantity_required: 100
    })

    // Only 70 kg available
    await createTestLP({ product_id: 'product-123', quantity: 70 })

    const results = await reserveMaterialsForWO(wo.id)

    expect(results[0].result.total_reserved).toBe(70)
    expect(results[0].result.shortfall).toBe(30)
  })
})
```

### Integration Tests

```typescript
// Test complete workflow
describe('WO Material Reservation Workflow', () => {
  it('should reserve → consume → complete', async () => {
    // 1. Create WO
    const wo = await createTestWO()
    await createTestMaterials(wo.id, 2)

    // 2. Start WO (auto-reserve)
    await startWorkOrder(wo.id)

    // Verify reservations created
    const { data: reservations } = await supabase
      .from('lp_reservations')
      .select('*')
      .eq('wo_id', wo.id)

    expect(reservations).toHaveLength(2)

    // 3. Consume material
    await consumeMaterial(wo.id, reservations[0].lp_id, 50)

    // Verify consumed_qty updated
    const { data: updated } = await supabase
      .from('lp_reservations')
      .select('consumed_qty')
      .eq('id', reservations[0].id)
      .single()

    expect(updated.consumed_qty).toBe(50)

    // 4. Complete WO
    await completeWorkOrder(wo.id)

    // Verify reservations released
    const { data: final } = await supabase
      .from('lp_reservations')
      .select('status')
      .eq('wo_id', wo.id)

    final.forEach(r => {
      expect(['released', 'consumed']).toContain(r.status)
    })
  })
})
```

---

## Performance Considerations

### 1. Batch Reservation Creation

**Problem:** Creating N reservations in a loop is slow.

**Solution:** Use batch insert:

```typescript
// Instead of this (slow):
for (const material of materials) {
  await LPReservationService.reserveLPs(...)
}

// Do this (fast):
const reservationPromises = materials.map(material =>
  LPReservationService.reserveLPs(
    supabase,
    woId,
    material.id,
    material.product_id,
    material.quantity_required
  )
)

const results = await Promise.all(reservationPromises)
```

### 2. Cache Picking Strategy

**Problem:** Fetching warehouse settings for every LP lookup is slow.

**Solution:** Cache strategy at WO level:

```typescript
// Fetch strategy once
const strategy = await FIFOFEFOService.getPickingStrategy(supabase)

// Reuse for all materials
for (const material of materials) {
  const lps = await FIFOFEFOService.findAvailableLPs(
    supabase,
    material.product_id,
    { strategy }  // Pass cached strategy
  )
}
```

### 3. Prefetch Available LPs

**Problem:** Finding available LPs for N materials is slow.

**Solution:** Prefetch LPs for all products:

```typescript
// Get unique product IDs
const productIds = materials.map(m => m.product_id)

// Prefetch available LPs for all products
const lpsByProduct = {}

await Promise.all(
  productIds.map(async productId => {
    lpsByProduct[productId] = await FIFOFEFOService.findAvailableLPs(
      supabase,
      productId
    )
  })
)

// Now reserve using prefetched data
for (const material of materials) {
  const availableLPs = lpsByProduct[material.product_id]
  // ... allocate from availableLPs
}
```

---

## Troubleshooting

### Problem: Reservations not created on WO start

**Check:**
1. Are `wo_materials` records created?
2. Are there available LPs for the products?
3. Is FIFO/FEFO strategy enabled in warehouse settings?

**Debug:**
```typescript
// Check wo_materials
const { data: materials } = await supabase
  .from('wo_materials')
  .select('*')
  .eq('wo_id', woId)

console.log('Materials:', materials)

// Check available LPs
for (const material of materials || []) {
  const lps = await FIFOFEFOService.findAvailableLPs(
    supabase,
    material.product_id
  )
  console.log(`LPs for ${material.product_name}:`, lps)
}
```

### Problem: "Insufficient quantity" error

**Cause:** Total available < total required, but service still tries to over-reserve.

**Solution:** `reserveLPs()` handles this gracefully - it allocates all available and reports shortfall. Check that you're reading `result.shortfall` correctly.

```typescript
const result = await LPReservationService.reserveLPs(...)

if (result.shortfall > 0) {
  // Handle partial allocation
  console.warn(`Shortfall: ${result.shortfall} units`)
}
```

### Problem: LP status stuck on 'reserved'

**Cause:** Trigger not updating LP status when reservations released.

**Check:**
```sql
-- Verify trigger exists
SELECT tgname FROM pg_trigger
WHERE tgrelid = 'lp_reservations'::regclass;

-- Should show: tr_lp_reservation_status
```

**Fix:** Re-run migration 090.

---

## Best Practices

1. **Always handle shortfalls:**
   ```typescript
   if (result.shortfall > 0) {
     // Alert user, create PO, or cancel WO
   }
   ```

2. **Release reservations on WO cancel:**
   ```typescript
   await LPReservationService.releaseAllReservations(supabase, woId)
   ```

3. **Link reservations to materials:**
   ```typescript
   await LPReservationService.reserveLPs(
     supabase,
     woId,
     material.id,  // ← Important: pass wo_material_id
     material.product_id,
     material.quantity_required
   )
   ```

4. **Use FIFO/FEFO appropriately:**
   - FIFO for non-perishable products
   - FEFO for products with expiry dates

5. **Show reservation status on WO detail page:**
   - Use `ReservationsPanel` component
   - Display shortfalls prominently

---

## Related Documentation

- [LP Reservations API Reference](../../api/warehouse/lp-reservations-api.md)
- [LP Reservations Database Schema](../../database/lp-reservations-schema.md)
- [FIFO/FEFO Picking Guide](./fifo-fefo-picking.md)
- [Warehouse Settings](./warehouse-settings.md)

---

## Support

**Story:** 05.3
**Target Epic:** 04.8
**Owner:** OPUS (Story Writer)
**Last Updated:** 2026-01-03

For questions, contact the Epic 04 team or refer to the API documentation.
