# LP Reservations API Reference

**Story:** 05.3 - LP Reservations + FIFO/FEFO Picking
**Version:** 1.0
**Last Updated:** 2026-01-03

## Overview

The LP Reservations API enables Work Orders (WO) and Transfer Orders (TO) to reserve specific License Plates for material consumption. The API implements FIFO (First In, First Out) and FEFO (First Expired, First Out) picking strategies to ensure optimal inventory rotation.

**Base Path:** `/api/warehouse`

**Authentication:** All endpoints require authentication via Supabase Auth.

**Multi-tenancy:** All operations enforce `org_id` isolation via Row Level Security (RLS).

---

## Service Layer

The API uses a service-based architecture. All business logic is in service modules that accept a Supabase client as a parameter.

**Services:**
- `LPReservationService` - CRUD operations for reservations
- `FIFOFEFOService` - Picking algorithms and strategy management

**Import:**
```typescript
import { LPReservationService } from '@/lib/services/lp-reservation-service'
import { FIFOFEFOService } from '@/lib/services/fifo-fefo-service'
```

---

## Core Concepts

### Reservation Lifecycle

```
┌─────────┐    reserveLPs()    ┌────────┐    consumeReservation()    ┌──────────┐
│ No      │ ──────────────────>│ Active │ ────────────────────────>│ Consumed │
│ Reserve │                     └────────┘                           └──────────┘
└─────────┘                        │
                                   │ releaseReservation()
                                   ▼
                              ┌──────────┐
                              │ Released │
                              └──────────┘
```

**States:**
- **active** - Reservation is active, material allocated but not consumed
- **consumed** - Material fully consumed from this reservation
- **released** - Reservation cancelled/released, LP available again

### Available Quantity Calculation

```
available_qty = lp.quantity - SUM(active_reservations.reserved_qty - consumed_qty)
```

**Example:**
- LP total quantity: 100 kg
- Reservation 1: reserved_qty=40, consumed_qty=10 → net reserved: 30 kg
- Reservation 2: reserved_qty=20, consumed_qty=0 → net reserved: 20 kg
- Available quantity: 100 - 30 - 20 = **50 kg**

### FIFO vs FEFO

**FIFO (First In, First Out):**
- Sort by `created_at ASC` (oldest LP first)
- Use when product has no expiry date
- Default strategy

**FEFO (First Expired, First Out):**
- Sort by `expiry_date ASC, created_at ASC` (soonest expiry first)
- Use for perishable products
- LPs with NULL expiry_date sort LAST
- Takes precedence when both FIFO and FEFO are enabled

**Strategy Selection:**
```typescript
// Get current strategy from warehouse settings
const strategy = await FIFOFEFOService.getPickingStrategy(supabase)
// Returns: 'fifo' | 'fefo' | 'none'
```

---

## Service Methods

### LPReservationService

#### createReservation()

Create a single reservation for a License Plate.

**Signature:**
```typescript
async function createReservation(
  supabase: SupabaseClient,
  input: CreateReservationInput
): Promise<ReservationResult>
```

**Input:**
```typescript
interface CreateReservationInput {
  lp_id: string          // UUID of License Plate
  wo_id?: string         // UUID of Work Order (required if no to_id)
  to_id?: string         // UUID of Transfer Order (required if no wo_id)
  wo_material_id?: string // UUID of WO Material (for Epic 04.8)
  reserved_qty: number   // Quantity to reserve (must be > 0)
}
```

**Returns:**
```typescript
interface ReservationResult {
  id: string
  lp_id: string
  wo_id: string | null
  to_id: string | null
  wo_material_id: string | null
  reserved_qty: number
  consumed_qty: number
  status: 'active' | 'released' | 'consumed'
  reserved_at: string
  released_at: string | null
  reserved_by: string
  created_at: string
}
```

**Validation:**
- LP must exist and belong to same org
- LP status must be 'available' or 'reserved'
- LP qa_status must be 'passed'
- reserved_qty must not exceed available quantity
- Either wo_id or to_id must be provided

**Errors:**
- `LP_NOT_FOUND` - LP does not exist
- `LP_UNAVAILABLE` - LP status is not 'available' or 'reserved'
- `QA_NOT_PASSED` - LP qa_status is not 'passed'
- `INSUFFICIENT_QTY` - Requested quantity exceeds available
- `VALIDATION_ERROR` - Input validation failed

**Example:**
```typescript
import { createServerClient } from '@/lib/supabase/server'
import { LPReservationService } from '@/lib/services/lp-reservation-service'

export async function POST(req: Request) {
  const supabase = await createServerClient()

  const input = {
    lp_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    wo_id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    reserved_qty: 50.00
  }

  try {
    const reservation = await LPReservationService.createReservation(supabase, input)
    return Response.json(reservation)
  } catch (error) {
    if (error.code === 'INSUFFICIENT_QTY') {
      return Response.json({ error: error.message }, { status: 400 })
    }
    throw error
  }
}
```

**Response Time:** < 200ms

---

#### reserveLPs()

Reserve multiple LPs for a material requirement using FIFO/FEFO strategy. Allocates from multiple LPs when a single LP has insufficient quantity.

**Signature:**
```typescript
async function reserveLPs(
  supabase: SupabaseClient,
  woId: string,
  materialId: string,
  productId: string,
  requiredQty: number,
  warehouseId?: string
): Promise<AllocationResult>
```

**Parameters:**
- `woId` - Work Order ID
- `materialId` - WO Material ID (for linking reservation to material)
- `productId` - Product to reserve
- `requiredQty` - Total quantity needed
- `warehouseId` - Optional warehouse filter

**Returns:**
```typescript
interface AllocationResult {
  success: boolean          // true if any reservation created
  reservations: ReservationResult[]
  total_reserved: number    // Total quantity reserved
  shortfall: number         // 0 if fully allocated, >0 if partial
  warning?: string          // Message if partial allocation
}
```

**Behavior:**
1. Find available LPs using FIFO/FEFO strategy
2. Allocate from LPs in order until required quantity met
3. If insufficient inventory, reserve all available and report shortfall
4. Skip LPs that fail validation (concurrent reservations, etc.)

**Example - Full Allocation:**
```typescript
const result = await LPReservationService.reserveLPs(
  supabase,
  'wo-123',
  'material-456',
  'product-789',
  100.00,
  'warehouse-001'
)

// Result (full allocation):
{
  success: true,
  reservations: [
    { lp_id: 'lp-001', reserved_qty: 40 },
    { lp_id: 'lp-002', reserved_qty: 50 },
    { lp_id: 'lp-003', reserved_qty: 10 }
  ],
  total_reserved: 100,
  shortfall: 0
}
```

**Example - Partial Allocation:**
```typescript
const result = await LPReservationService.reserveLPs(
  supabase,
  'wo-123',
  'material-456',
  'product-789',
  100.00
)

// Result (only 70 kg available):
{
  success: true,
  reservations: [
    { lp_id: 'lp-001', reserved_qty: 40 },
    { lp_id: 'lp-002', reserved_qty: 30 }
  ],
  total_reserved: 70,
  shortfall: 30,
  warning: "Partial allocation: 30 units short"
}
```

**Response Time:** < 500ms for multi-LP allocation

---

#### getReservations()

Get all reservations for a Work Order with full LP details.

**Signature:**
```typescript
async function getReservations(
  supabase: SupabaseClient,
  woId: string
): Promise<ReservationWithLP[]>
```

**Returns:**
```typescript
interface ReservationWithLP extends ReservationResult {
  lp: {
    lp_number: string
    product_id: string
    product_name: string
    batch_number: string | null
    expiry_date: string | null
    location_id: string
    location_path: string
    warehouse_id: string
    warehouse_name: string
  }
  remaining_qty: number  // reserved_qty - consumed_qty
}
```

**Example:**
```typescript
const reservations = await LPReservationService.getReservations(supabase, 'wo-123')

// Response:
[
  {
    id: 'res-001',
    lp_id: 'lp-001',
    wo_id: 'wo-123',
    reserved_qty: 50,
    consumed_qty: 20,
    status: 'active',
    lp: {
      lp_number: 'LP-2026-001',
      product_name: 'Wheat Flour',
      batch_number: 'BATCH-2026-001',
      expiry_date: '2026-06-01',
      location_path: 'WH-01/Zone-A/Rack-1/Shelf-1',
      warehouse_name: 'Main Warehouse'
    },
    remaining_qty: 30
  }
]
```

**Response Time:** < 100ms

---

#### releaseReservation()

Release a single reservation. Updates status to 'released' and makes LP available again.

**Signature:**
```typescript
async function releaseReservation(
  supabase: SupabaseClient,
  id: string
): Promise<ReservationResult>
```

**Behavior:**
- Sets `status = 'released'`
- Sets `released_at = NOW()`
- LP status updates to 'available' if fully reserved and now has no active reservations

**Example:**
```typescript
const reservation = await LPReservationService.releaseReservation(supabase, 'res-001')

// Response:
{
  id: 'res-001',
  status: 'released',
  released_at: '2026-01-03T10:30:00Z',
  ...
}
```

**Errors:**
- `NOT_FOUND` - Reservation does not exist

**Response Time:** < 100ms

---

#### releaseAllReservations()

Release all active reservations for a Work Order.

**Signature:**
```typescript
async function releaseAllReservations(
  supabase: SupabaseClient,
  woId: string
): Promise<number>
```

**Returns:** Number of reservations released

**Use Cases:**
- WO cancelled before production starts
- WO completed and unused reservations need cleanup

**Example:**
```typescript
const count = await LPReservationService.releaseAllReservations(supabase, 'wo-123')
// Returns: 5 (released 5 reservations)
```

**Response Time:** < 200ms

---

#### consumeReservation()

Mark a reservation as consumed (partially or fully).

**Signature:**
```typescript
async function consumeReservation(
  supabase: SupabaseClient,
  id: string,
  consumedQty: number
): Promise<ReservationResult>
```

**Behavior:**
- Increments `consumed_qty` by `consumedQty`
- If `consumed_qty >= reserved_qty`, sets `status = 'consumed'`
- Otherwise, status remains 'active' (partial consumption)

**Validation:**
- `consumed_qty + consumedQty` must not exceed `reserved_qty`

**Errors:**
- `NOT_FOUND` - Reservation does not exist
- `OVERCONSUME` - Consumption would exceed reserved quantity

**Example:**
```typescript
// Reservation: reserved_qty=100, consumed_qty=0
const res = await LPReservationService.consumeReservation(supabase, 'res-001', 40)

// Response:
{
  id: 'res-001',
  reserved_qty: 100,
  consumed_qty: 40,
  status: 'active',  // Still active, partially consumed
  ...
}

// Consume remaining 60
const res2 = await LPReservationService.consumeReservation(supabase, 'res-001', 60)

// Response:
{
  id: 'res-001',
  reserved_qty: 100,
  consumed_qty: 100,
  status: 'consumed',  // Now fully consumed
  ...
}
```

**Response Time:** < 100ms

---

#### getAvailableQuantity()

Calculate available quantity for a License Plate.

**Signature:**
```typescript
async function getAvailableQuantity(
  supabase: SupabaseClient,
  lpId: string
): Promise<number>
```

**Calculation:**
```
available_qty = lp.quantity - SUM(active_reservations.reserved_qty - consumed_qty)
```

**Example:**
```typescript
const available = await LPReservationService.getAvailableQuantity(supabase, 'lp-001')
// Returns: 50.00
```

**Response Time:** < 50ms

---

### FIFOFEFOService

#### findAvailableLPs()

Find available LPs for a product using FIFO/FEFO strategy.

**Signature:**
```typescript
async function findAvailableLPs(
  supabase: SupabaseClient,
  productId: string,
  options?: FindAvailableLPsOptions
): Promise<AvailableLP[]>
```

**Options:**
```typescript
interface FindAvailableLPsOptions {
  warehouseId?: string
  locationId?: string
  strategy?: 'fifo' | 'fefo' | 'none'
  limit?: number  // Default: 100
}
```

**Returns:**
```typescript
interface AvailableLP {
  id: string
  lp_number: string
  product_id: string
  quantity: number
  available_qty: number
  uom: string
  location_id: string
  warehouse_id: string
  batch_number: string | null
  expiry_date: string | null
  created_at: string
  qa_status: string
  status: string
  suggested?: boolean         // true for first LP (optimal pick)
  suggestion_reason?: string  // e.g., "FIFO: oldest" or "FEFO: expires 2026-03-01"
}
```

**Filters Applied:**
- `status = 'available'`
- `qa_status = 'passed'`
- `expiry_date >= CURRENT_DATE` OR `expiry_date IS NULL`
- `available_qty > 0`

**Sorting:**
- **FIFO:** `ORDER BY created_at ASC`
- **FEFO:** `ORDER BY expiry_date ASC NULLS LAST, created_at ASC`
- **none:** No specific ordering

**Example - FIFO:**
```typescript
const lps = await FIFOFEFOService.findAvailableLPs(
  supabase,
  'product-123',
  { strategy: 'fifo', warehouseId: 'wh-001' }
)

// Response (sorted oldest first):
[
  {
    id: 'lp-001',
    lp_number: 'LP-2025-001',
    available_qty: 50,
    created_at: '2025-12-01T10:00:00Z',
    suggested: true,
    suggestion_reason: 'FIFO: oldest'
  },
  {
    id: 'lp-002',
    lp_number: 'LP-2026-001',
    available_qty: 30,
    created_at: '2026-01-01T10:00:00Z',
    suggested: false
  }
]
```

**Example - FEFO:**
```typescript
const lps = await FIFOFEFOService.findAvailableLPs(
  supabase,
  'product-123',
  { strategy: 'fefo' }
)

// Response (sorted by expiry, NULLS last):
[
  {
    id: 'lp-002',
    lp_number: 'LP-2026-002',
    available_qty: 40,
    expiry_date: '2026-03-01',
    suggested: true,
    suggestion_reason: 'FEFO: expires 2026-03-01'
  },
  {
    id: 'lp-001',
    lp_number: 'LP-2025-001',
    available_qty: 50,
    expiry_date: '2026-06-01',
    suggested: false
  },
  {
    id: 'lp-003',
    lp_number: 'LP-2026-003',
    available_qty: 30,
    expiry_date: null,  // No expiry - sorted last
    suggested: false
  }
]
```

**Response Time:** < 200ms

---

#### getPickingStrategy()

Get the current picking strategy from warehouse settings.

**Signature:**
```typescript
async function getPickingStrategy(
  supabase: SupabaseClient
): Promise<PickingStrategy>
```

**Returns:** `'fifo'` | `'fefo'` | `'none'`

**Logic:**
1. If `enable_fefo = true` → return 'fefo' (FEFO takes precedence)
2. Else if `enable_fifo = true` → return 'fifo'
3. Else → return 'none'

**Example:**
```typescript
const strategy = await FIFOFEFOService.getPickingStrategy(supabase)
// Returns: 'fefo'
```

**Response Time:** < 50ms

---

#### checkFIFOFEFOViolation()

Check if selecting a specific LP violates FIFO/FEFO rules.

**Signature:**
```typescript
async function checkFIFOFEFOViolation(
  supabase: SupabaseClient,
  selectedLpId: string,
  productId: string,
  strategy: PickingStrategy
): Promise<ViolationResult>
```

**Returns:**
```typescript
interface ViolationResult {
  hasViolation: boolean
  violationType?: 'fifo' | 'fefo'
  message?: string
  suggestedLP?: AvailableLP
  selectedLP?: AvailableLP
}
```

**Example - FIFO Violation:**
```typescript
const result = await FIFOFEFOService.checkFIFOFEFOViolation(
  supabase,
  'lp-002',  // User selected newer LP
  'product-123',
  'fifo'
)

// Response:
{
  hasViolation: true,
  violationType: 'fifo',
  message: 'FIFO violation: LP-2026-002 is newer than suggested LP-2025-001',
  suggestedLP: { id: 'lp-001', ... },
  selectedLP: { id: 'lp-002', ... }
}
```

**Use Case:** Show warning to user when they manually select a non-optimal LP. Does NOT block the reservation (warning only).

**Response Time:** < 100ms

---

## Error Handling

### Error Codes

| Code | Meaning | HTTP Status |
|------|---------|-------------|
| `LP_NOT_FOUND` | License Plate does not exist | 404 |
| `LP_UNAVAILABLE` | LP status not 'available' or 'reserved' | 400 |
| `QA_NOT_PASSED` | QA status is not 'passed' | 400 |
| `INSUFFICIENT_QTY` | Requested qty exceeds available | 400 |
| `NOT_FOUND` | Reservation does not exist | 404 |
| `OVERCONSUME` | Consumption exceeds reserved qty | 400 |
| `VALIDATION_ERROR` | Input validation failed | 400 |
| `INSERT_ERROR` | Database insert failed | 500 |
| `UPDATE_ERROR` | Database update failed | 500 |
| `FETCH_ERROR` | Database fetch failed | 500 |

### Error Response Format

```typescript
try {
  const reservation = await LPReservationService.createReservation(supabase, input)
} catch (error) {
  if (error instanceof ReservationError) {
    // Handle known error
    console.error(`[${error.code}] ${error.message}`)
  } else {
    // Handle unexpected error
    throw error
  }
}
```

---

## Performance

### Response Time Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| createReservation | < 200ms | Single LP |
| reserveLPs | < 500ms | Multi-LP allocation |
| getReservations | < 100ms | With LP joins |
| releaseReservation | < 100ms | Single update |
| releaseAllReservations | < 200ms | Batch update |
| consumeReservation | < 100ms | Single update |
| getAvailableQuantity | < 50ms | Aggregation query |
| findAvailableLPs | < 200ms | FIFO/FEFO sorting |
| getPickingStrategy | < 50ms | Settings lookup |
| checkFIFOFEFOViolation | < 100ms | Comparison |

### Database Indexes

The following indexes ensure optimal query performance:

```sql
idx_reservation_org_lp         -- (org_id, lp_id)
idx_reservation_lp             -- (lp_id)
idx_reservation_wo             -- (wo_id) WHERE wo_id IS NOT NULL
idx_reservation_to             -- (to_id) WHERE to_id IS NOT NULL
idx_reservation_status         -- (org_id, status)
idx_reservation_lp_status      -- (lp_id, status)
idx_reservation_active_lp      -- (lp_id) WHERE status = 'active'
```

---

## Security

### Row Level Security (RLS)

All queries enforce org_id isolation:

```sql
-- SELECT policy
CREATE POLICY "reservation_select_org" ON lp_reservations
FOR SELECT TO authenticated
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- INSERT policy
CREATE POLICY "reservation_insert_org" ON lp_reservations
FOR INSERT TO authenticated
WITH CHECK (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND lp_id IN (
    SELECT id FROM license_plates
    WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  )
);
```

**Important:** You do NOT need to filter by `org_id` in your queries. RLS handles this automatically.

**Example (correct):**
```typescript
// RLS automatically filters by org_id
const { data } = await supabase
  .from('lp_reservations')
  .select('*')
  .eq('wo_id', woId)
```

**Example (incorrect - redundant):**
```typescript
// DON'T do this - org_id filter is redundant
const { data } = await supabase
  .from('lp_reservations')
  .select('*')
  .eq('wo_id', woId)
  .eq('org_id', orgId)  // ❌ Unnecessary
```

---

## Testing

### Running Tests

```bash
# Unit tests
pnpm test apps/frontend/lib/services/__tests__/lp-reservation-service.test.ts
pnpm test apps/frontend/lib/services/__tests__/fifo-fefo-service.test.ts

# Integration tests
pnpm test apps/frontend/__tests__/api/warehouse/reservations.test.ts
```

### Test Coverage

- **LPReservationService:** 64 tests covering all CRUD operations
- **FIFOFEFOService:** Edge cases for FIFO/FEFO algorithms
- **Multi-LP allocation:** Partial fulfillment, shortfall scenarios
- **Validation:** Over-reservation, QA status, expiry filtering

---

## Next Steps

### For Epic 04.8 (Material Reservations)

Epic 04.8 will consume these service methods:

1. **Auto-reserve on WO start:**
   ```typescript
   // Loop through wo_materials
   for (const material of woMaterials) {
     const result = await LPReservationService.reserveLPs(
       supabase,
       woId,
       material.id,
       material.product_id,
       material.quantity_required
     )

     if (result.shortfall > 0) {
       // Handle partial allocation
     }
   }
   ```

2. **Release on WO cancel:**
   ```typescript
   const count = await LPReservationService.releaseAllReservations(supabase, woId)
   ```

3. **Consume on material issue:**
   ```typescript
   await LPReservationService.consumeReservation(supabase, reservationId, issuedQty)
   ```

---

## Related Documentation

- [LP Reservations Database Schema](../../database/lp-reservations-schema.md)
- [FIFO/FEFO Picking Guide](../../guides/warehouse/fifo-fefo-picking.md)
- [Integration Guide for Epic 04.8](../../guides/warehouse/epic-04-integration.md)
- [Warehouse Settings](../../guides/warehouse/warehouse-settings.md)

---

## Support

**Story:** 05.3
**Owner:** OPUS (Story Writer)
**Last Updated:** 2026-01-03
