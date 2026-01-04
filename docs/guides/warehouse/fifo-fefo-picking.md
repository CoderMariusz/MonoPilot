# FIFO/FEFO Picking Guide

**Story:** 05.3 - LP Reservations + FIFO/FEFO Picking
**Version:** 1.0
**Last Updated:** 2026-01-03

## Overview

This guide explains how to use FIFO (First In, First Out) and FEFO (First Expired, First Out) picking strategies in MonoPilot to ensure optimal inventory rotation and minimize waste.

**Who is this for:**
- Warehouse managers configuring picking strategies
- Developers integrating with reservation APIs
- Production planners understanding material allocation

---

## What are FIFO and FEFO?

### FIFO (First In, First Out)

**Definition:** Use the oldest inventory first.

**How it works:**
- License Plates (LPs) are sorted by `created_at` timestamp (ascending)
- The LP received earliest is suggested first
- Ensures inventory rotates chronologically

**When to use:**
- Non-perishable products (no expiry date)
- Products with long shelf life
- General inventory management

**Example:**
```
Product: Wheat Flour (no expiry date)

LP-001: Received 2025-12-01, Qty: 50 kg  ← SUGGESTED (oldest)
LP-002: Received 2025-12-15, Qty: 40 kg
LP-003: Received 2026-01-01, Qty: 60 kg
```

### FEFO (First Expired, First Out)

**Definition:** Use the inventory that expires soonest first.

**How it works:**
- LPs are sorted by `expiry_date` (ascending), then `created_at`
- The LP expiring soonest is suggested first
- LPs with NULL expiry_date sort LAST (after all dated LPs)

**When to use:**
- Perishable products (dairy, fresh produce)
- Products with regulatory expiry requirements
- Minimizing waste from expired inventory

**Example:**
```
Product: Milk Powder

LP-002: Expiry 2026-03-01, Qty: 40 kg  ← SUGGESTED (expires soonest)
LP-001: Expiry 2026-06-01, Qty: 50 kg
LP-004: No expiry, Qty: 30 kg          (sorted last)
```

---

## Configuration

### Enable FIFO/FEFO in Warehouse Settings

Navigate to **Settings → Warehouse** and configure:

| Setting | Description | Default |
|---------|-------------|---------|
| **Enable FIFO** | Use oldest inventory first | ✓ ON |
| **Enable FEFO** | Use soonest expiry first | ✗ OFF |

**Important:** If both are enabled, **FEFO takes precedence**.

**Precedence Rules:**
```
Both FIFO + FEFO ON  → FEFO strategy (expiry-based)
Only FIFO ON         → FIFO strategy (date-based)
Only FEFO ON         → FEFO strategy (expiry-based)
Both OFF             → No strategy (no specific ordering)
```

### Settings API

```typescript
// Get current strategy
import { FIFOFEFOService } from '@/lib/services/fifo-fefo-service'

const strategy = await FIFOFEFOService.getPickingStrategy(supabase)
// Returns: 'fifo' | 'fefo' | 'none'
```

---

## Using FIFO/FEFO in the UI

### 1. Reserve Materials Modal

When reserving materials for a Work Order:

1. Click **Reserve Materials** on WO detail page
2. Select material and quantity needed
3. Click **Find Available LPs**
4. System shows LPs sorted by FIFO/FEFO:

```
┌─────────────────────────────────────────────────────────────┐
│ Available License Plates                                    │
├─────────────────────────────────────────────────────────────┤
│ ✓ LP-2026-001  50 kg  FIFO: oldest          [SUGGESTED]    │
│   LP-2026-002  40 kg  Received 2025-12-15                   │
│   LP-2026-003  60 kg  Received 2026-01-01                   │
└─────────────────────────────────────────────────────────────┘
```

5. Select suggested LP or manually choose a different one
6. If you select a non-optimal LP, system shows warning:

```
⚠️ FIFO violation: LP-2026-003 is newer than suggested LP-2026-001
   Continue anyway?  [Yes] [No]
```

**Note:** Warnings are informational only. You can still proceed with the reservation.

### 2. FIFO/FEFO Indicators

LPs display visual indicators:

| Indicator | Meaning |
|-----------|---------|
| ✓ Green checkmark | Suggested LP (optimal pick) |
| "FIFO: oldest" | This LP is oldest (FIFO strategy) |
| "FEFO: expires 2026-03-01" | This LP expires soonest (FEFO strategy) |
| ⚠️ Warning icon | You selected a non-optimal LP |

---

## Using FIFO/FEFO in Code

### Find Available LPs

```typescript
import { FIFOFEFOService } from '@/lib/services/fifo-fefo-service'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { product_id } = await req.json()

  // Find available LPs using default strategy from settings
  const lps = await FIFOFEFOService.findAvailableLPs(
    supabase,
    product_id
  )

  // Response:
  // [
  //   {
  //     id: 'lp-001',
  //     lp_number: 'LP-2026-001',
  //     available_qty: 50,
  //     suggested: true,
  //     suggestion_reason: 'FIFO: oldest'
  //   },
  //   ...
  // ]

  return Response.json(lps)
}
```

### Override Strategy

```typescript
// Force FIFO (ignore settings)
const lps = await FIFOFEFOService.findAvailableLPs(
  supabase,
  product_id,
  { strategy: 'fifo' }
)

// Force FEFO
const lps = await FIFOFEFOService.findAvailableLPs(
  supabase,
  product_id,
  { strategy: 'fefo' }
)

// No strategy (default order)
const lps = await FIFOFEFOService.findAvailableLPs(
  supabase,
  product_id,
  { strategy: 'none' }
)
```

### Reserve with Multi-LP Allocation

```typescript
import { LPReservationService } from '@/lib/services/lp-reservation-service'

// Reserve 100 kg using FIFO/FEFO strategy
const result = await LPReservationService.reserveLPs(
  supabase,
  'wo-123',      // Work Order ID
  'material-456', // WO Material ID
  'product-789',  // Product ID
  100.00          // Required quantity
)

// Result (allocated from 3 LPs in FIFO order):
// {
//   success: true,
//   reservations: [
//     { lp_id: 'lp-001', reserved_qty: 40 },
//     { lp_id: 'lp-002', reserved_qty: 50 },
//     { lp_id: 'lp-003', reserved_qty: 10 }
//   ],
//   total_reserved: 100,
//   shortfall: 0
// }
```

---

## FIFO/FEFO Algorithms

### FIFO Algorithm

**SQL Query:**
```sql
SELECT lp.*,
       lp.quantity - COALESCE(SUM(r.reserved_qty - r.consumed_qty), 0) AS available_qty
FROM license_plates lp
LEFT JOIN lp_reservations r ON lp.id = r.lp_id AND r.status = 'active'
WHERE lp.product_id = $product_id
  AND lp.status = 'available'
  AND lp.qa_status = 'passed'
  AND (lp.expiry_date IS NULL OR lp.expiry_date >= CURRENT_DATE)
GROUP BY lp.id
HAVING lp.quantity - COALESCE(SUM(r.reserved_qty - r.consumed_qty), 0) > 0
ORDER BY lp.created_at ASC;  -- ← FIFO: oldest first
```

**Filters:**
- Status = 'available'
- QA Status = 'passed'
- Not expired (expiry_date >= today OR NULL)
- Available quantity > 0

**Sort:** `created_at ASC` (oldest LP first)

### FEFO Algorithm

**SQL Query:**
```sql
-- Same as FIFO, but different ORDER BY:
ORDER BY
  CASE WHEN lp.expiry_date IS NULL THEN 1 ELSE 0 END,  -- NULLs last
  lp.expiry_date ASC,   -- Soonest expiry first
  lp.created_at ASC;    -- Tie-breaker: oldest first
```

**Sort:**
1. LPs with expiry_date (sorted by expiry ASC)
2. LPs with NULL expiry_date (sorted by created_at ASC)

**Example:**
```
LP-002: Expiry 2026-03-01, Created 2025-12-15  ← SUGGESTED (expires first)
LP-001: Expiry 2026-06-01, Created 2025-12-01
LP-003: Expiry NULL, Created 2025-12-01        (NULL sorted last)
LP-004: Expiry NULL, Created 2025-12-15        (then by created_at)
```

---

## Edge Cases

### 1. NULL Expiry Dates in FEFO

**Scenario:** Product has mix of dated and undated LPs.

**Behavior:** NULL expiry dates sort LAST (after all dated LPs).

**Example:**
```
FEFO Order:
1. LP-002: Expiry 2026-03-01, Qty: 40 kg  ← SUGGESTED
2. LP-001: Expiry 2026-06-01, Qty: 50 kg
3. LP-003: Expiry NULL, Qty: 30 kg        (sorted last)
4. LP-004: Expiry NULL, Qty: 20 kg
```

**Rationale:** Undated LPs don't have urgency. Use dated LPs first to prevent expiry waste.

### 2. Same Expiry Date (FEFO)

**Scenario:** Multiple LPs expire on same date.

**Behavior:** Use `created_at` as tie-breaker (oldest first).

**Example:**
```
FEFO Order (both expire 2026-03-01):
1. LP-002: Expiry 2026-03-01, Created 2025-12-01  ← SUGGESTED (older)
2. LP-003: Expiry 2026-03-01, Created 2025-12-15
```

### 3. Expired LPs

**Scenario:** LP expiry_date < CURRENT_DATE.

**Behavior:** LP is **excluded** from available LPs.

**Example:**
```sql
-- Today: 2026-01-03

LP-001: Expiry 2025-12-01  ❌ EXCLUDED (expired)
LP-002: Expiry 2026-03-01  ✓ INCLUDED
LP-003: Expiry NULL        ✓ INCLUDED
```

**Note:** Expired LPs should be handled via QA process (status → 'blocked').

### 4. QA Status Filter

**Scenario:** LP has `qa_status = 'pending'` or `'failed'`.

**Behavior:** LP is **excluded** from available LPs.

**Example:**
```
LP-001: qa_status = 'pending'  ❌ EXCLUDED
LP-002: qa_status = 'passed'   ✓ INCLUDED
LP-003: qa_status = 'failed'   ❌ EXCLUDED
```

### 5. Partial Reservations

**Scenario:** LP has 100 kg total, 40 kg already reserved.

**Behavior:** LP shows `available_qty = 60` and remains in available list.

**Example:**
```
LP-001:
  Total Quantity: 100 kg
  Reserved (active): 40 kg
  Available: 60 kg  ← Can reserve up to 60 kg more
```

**LP Status:** Remains 'available' (only changes to 'reserved' when fully reserved).

### 6. Multi-LP Allocation

**Scenario:** Need 100 kg, but largest LP has only 50 kg.

**Behavior:** System allocates from multiple LPs in FIFO/FEFO order.

**Example:**
```
Requirement: 100 kg

Available LPs (FIFO order):
  LP-001: 40 kg  → Reserve 40 kg
  LP-002: 50 kg  → Reserve 50 kg
  LP-003: 60 kg  → Reserve 10 kg (partial)

Result:
  Total Reserved: 100 kg (from 3 LPs)
  Shortfall: 0 kg
```

### 7. Insufficient Inventory

**Scenario:** Need 100 kg, but only 70 kg available across all LPs.

**Behavior:** System reserves all available (70 kg) and reports shortfall.

**Example:**
```
Requirement: 100 kg

Available LPs (FIFO order):
  LP-001: 40 kg  → Reserve 40 kg
  LP-002: 30 kg  → Reserve 30 kg

Result:
  Total Reserved: 70 kg
  Shortfall: 30 kg
  Warning: "Partial allocation: 30 units short"
```

---

## FIFO/FEFO Violations

### What is a Violation?

A violation occurs when you manually select a non-optimal LP:

**FIFO Violation:**
- You select LP-003 (newer) when LP-001 (older) is available

**FEFO Violation:**
- You select LP-003 (expires 2026-09-01) when LP-002 (expires 2026-03-01) is available

### Detecting Violations

```typescript
import { FIFOFEFOService } from '@/lib/services/fifo-fefo-service'

const result = await FIFOFEFOService.checkFIFOFEFOViolation(
  supabase,
  'lp-003',      // User selected this LP
  'product-789', // For this product
  'fifo'         // Check against FIFO strategy
)

// Response (violation detected):
{
  hasViolation: true,
  violationType: 'fifo',
  message: 'FIFO violation: LP-2026-003 is newer than suggested LP-2025-001',
  suggestedLP: { id: 'lp-001', lp_number: 'LP-2025-001', ... },
  selectedLP: { id: 'lp-003', lp_number: 'LP-2026-003', ... }
}
```

### Handling Violations in UI

```typescript
// Show warning modal
if (violationResult.hasViolation) {
  const confirmed = await showConfirmDialog({
    title: 'FIFO Violation Detected',
    message: violationResult.message,
    warning: 'This may cause older inventory to expire unused.',
    confirmText: 'Continue Anyway',
    cancelText: 'Select Suggested LP'
  })

  if (!confirmed) {
    return // User cancelled, don't create reservation
  }
}

// User confirmed - proceed with reservation
await createReservation(...)
```

**Important:** Violations are **warnings only**, not blocking errors. Users can override for valid reasons (e.g., location proximity, batch matching).

### Audit Logging

Consider logging FIFO/FEFO violations for compliance:

```typescript
if (violationResult.hasViolation) {
  await logAuditEvent({
    event: 'fifo_fefo_violation',
    user_id: userId,
    violation_type: violationResult.violationType,
    suggested_lp: violationResult.suggestedLP.id,
    selected_lp: violationResult.selectedLP.id,
    reason: userProvidedReason // Optional: ask user why
  })
}
```

---

## Best Practices

### 1. Choose the Right Strategy

| Product Type | Recommended Strategy | Reason |
|-------------|---------------------|---------|
| Fresh produce | FEFO | Minimize waste from expiry |
| Dairy products | FEFO | Regulatory compliance |
| Canned goods | FIFO | Long shelf life, chronological rotation |
| Raw materials (flour, sugar) | FIFO | No expiry date |
| Chemicals with expiry | FEFO | Safety and compliance |

### 2. Handle NULL Expiry Dates

**Recommendation:** Set expiry_date for perishable products, leave NULL for non-perishable.

**FEFO with NULLs:**
- Dated LPs will be used first (optimal)
- NULL LPs will be used last (acceptable for non-perishable)

### 3. Multi-Warehouse Scenarios

```typescript
// Filter by warehouse to avoid cross-warehouse picks
const lps = await FIFOFEFOService.findAvailableLPs(
  supabase,
  product_id,
  { warehouseId: 'warehouse-001' }  // Only from Warehouse 1
)
```

**Why:** Avoid inefficient transfers between warehouses.

### 4. Location-Based Picking

```typescript
// Filter by location for scanner-based picking
const lps = await FIFOFEFOService.findAvailableLPs(
  supabase,
  product_id,
  { locationId: 'zone-a-rack-1' }  // Only from specific rack
)
```

**Use Case:** Warehouse worker is already at a specific location.

### 5. Monitor Violations

Track violation frequency:

```sql
-- Count violations per user
SELECT reserved_by, COUNT(*) AS violation_count
FROM audit_log
WHERE event = 'fifo_fefo_violation'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY reserved_by
ORDER BY violation_count DESC;
```

**Action:** Retrain users with high violation rates.

---

## Testing FIFO/FEFO

### Test FIFO Sorting

```typescript
describe('FIFO Algorithm', () => {
  it('should suggest oldest LP first', async () => {
    // Create 3 LPs with different created_at
    const lp1 = await createLP({ created_at: '2025-12-01' })
    const lp2 = await createLP({ created_at: '2025-12-15' })
    const lp3 = await createLP({ created_at: '2026-01-01' })

    // Find available LPs
    const lps = await FIFOFEFOService.findAvailableLPs(
      supabase,
      productId,
      { strategy: 'fifo' }
    )

    // Assert order
    expect(lps[0].id).toBe(lp1.id)  // Oldest first
    expect(lps[1].id).toBe(lp2.id)
    expect(lps[2].id).toBe(lp3.id)

    // Assert suggestion
    expect(lps[0].suggested).toBe(true)
    expect(lps[0].suggestion_reason).toBe('FIFO: oldest')
  })
})
```

### Test FEFO Sorting

```typescript
describe('FEFO Algorithm', () => {
  it('should suggest soonest expiry first', async () => {
    // Create LPs with different expiry dates
    const lp1 = await createLP({ expiry_date: '2026-06-01' })
    const lp2 = await createLP({ expiry_date: '2026-03-01' })
    const lp3 = await createLP({ expiry_date: null })

    const lps = await FIFOFEFOService.findAvailableLPs(
      supabase,
      productId,
      { strategy: 'fefo' }
    )

    // Assert order (LP2, LP1, LP3)
    expect(lps[0].id).toBe(lp2.id)  // Expires soonest
    expect(lps[1].id).toBe(lp1.id)
    expect(lps[2].id).toBe(lp3.id)  // NULL expiry last

    // Assert suggestion
    expect(lps[0].suggested).toBe(true)
    expect(lps[0].suggestion_reason).toContain('FEFO')
  })
})
```

### Test NULL Expiry Handling

```typescript
it('should sort NULL expiry dates last in FEFO', async () => {
  const lp1 = await createLP({ expiry_date: '2026-03-01', created_at: '2025-12-15' })
  const lp2 = await createLP({ expiry_date: null, created_at: '2025-12-01' })
  const lp3 = await createLP({ expiry_date: null, created_at: '2025-12-10' })

  const lps = await FIFOFEFOService.findAvailableLPs(
    supabase,
    productId,
    { strategy: 'fefo' }
  )

  // LP1 (dated) should be first
  expect(lps[0].id).toBe(lp1.id)

  // LP2 and LP3 (NULL) sorted by created_at among themselves
  expect(lps[1].id).toBe(lp2.id)  // Older NULL
  expect(lps[2].id).toBe(lp3.id)
})
```

---

## Troubleshooting

### Problem: LPs not appearing in available list

**Possible Causes:**
1. LP status is not 'available'
2. LP qa_status is not 'passed'
3. LP is expired (expiry_date < today)
4. LP is fully reserved (available_qty = 0)
5. LP is in different warehouse (if warehouseId filter applied)

**Solution:**
```typescript
// Debug: Check LP status
const { data: lp } = await supabase
  .from('license_plates')
  .select('*')
  .eq('id', lpId)
  .single()

console.log('LP Status:', lp.status)  // Should be 'available'
console.log('QA Status:', lp.qa_status)  // Should be 'passed'
console.log('Expiry:', lp.expiry_date)  // Should be >= today or NULL
console.log('Available Qty:', await getAvailableQuantity(lpId))  // Should be > 0
```

### Problem: Wrong LP suggested (not oldest/soonest expiry)

**Possible Causes:**
1. Wrong strategy applied (FIFO vs FEFO)
2. Available quantity calculation incorrect
3. Concurrent reservations changed availability

**Solution:**
```typescript
// Verify strategy
const strategy = await FIFOFEFOService.getPickingStrategy(supabase)
console.log('Active Strategy:', strategy)  // Should match expectation

// Check warehouse settings
const { data: settings } = await supabase
  .from('warehouse_settings')
  .select('enable_fifo, enable_fefo')
  .single()

console.log('Settings:', settings)
```

### Problem: FIFO/FEFO violation not detected

**Possible Causes:**
1. Strategy parameter incorrect
2. Selected LP is actually the suggested one (no violation)

**Solution:**
```typescript
// Verify violation check
const result = await FIFOFEFOService.checkFIFOFEFOViolation(
  supabase,
  selectedLpId,
  productId,
  'fifo'  // Make sure this matches current strategy
)

console.log('Violation Result:', result)
```

---

## Related Documentation

- [LP Reservations API Reference](../../api/warehouse/lp-reservations-api.md)
- [LP Reservations Database Schema](../../database/lp-reservations-schema.md)
- [Integration Guide for Epic 04.8](./epic-04-integration.md)
- [Warehouse Settings Configuration](./warehouse-settings.md)

---

## Support

**Story:** 05.3
**Owner:** OPUS (Story Writer)
**Last Updated:** 2026-01-03
