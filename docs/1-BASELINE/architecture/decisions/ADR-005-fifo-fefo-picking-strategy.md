# ADR-005: FIFO/FEFO Picking Strategy

## Status: ACCEPTED

**Date**: 2025-12-10
**Decision Makers**: Architecture Team
**Related PRDs**: Warehouse (Epic 5), Production (Epic 4), Quality (Epic 6)

---

## Context

Food manufacturers must manage inventory rotation to:
1. Minimize waste from expired products
2. Ensure customers receive freshest possible product
3. Meet retailer shelf-life requirements (e.g., "minimum 60% remaining")
4. Comply with food safety regulations (no expired product shipment)

Inventory rotation strategies:
- **FIFO (First-In-First-Out)**: Pick oldest received inventory first
- **FEFO (First-Expired-First-Out)**: Pick soonest-to-expire inventory first
- **LIFO (Last-In-First-Out)**: Pick newest inventory first
- **Manual**: User chooses which inventory to pick

For perishable food products, FEFO is the industry standard. However, some materials (packaging, non-perishables) may not have expiry dates.

---

## Decision

**Implement FEFO as default picking strategy with FIFO fallback for non-expiring items.**

Pick suggestion algorithm:
1. If product has expiry dates: **FEFO** (earliest expiry first)
2. If product lacks expiry dates: **FIFO** (earliest receipt first)
3. Allow manual override with audit trail

Additionally:
- Minimum shelf-life rules by customer/product
- Expiry warnings in scanner UI
- Block picking of expired inventory (configurable)

---

## Implementation

### Pick Suggestion Algorithm

```typescript
// pick-suggestion-service.ts
interface PickSuggestion {
  lp_id: string
  lp_number: string
  location: string
  available_qty: number
  suggested_qty: number
  expiry_date?: Date
  received_date: Date
  days_to_expiry?: number
  priority_reason: 'FEFO' | 'FIFO' | 'MANUAL'
}

async function getPickSuggestions(
  productId: string,
  requiredQty: number,
  warehouseId: string,
  customerId?: string
): Promise<PickSuggestion[]> {
  // Get available LPs for product
  const lps = await supabase
    .from('license_plates')
    .select('*')
    .eq('product_id', productId)
    .eq('warehouse_id', warehouseId)
    .eq('status', 'available')
    .gt('current_qty', 0)
    .order('expiry_date', { ascending: true, nullsFirst: false })
    .order('received_date', { ascending: true })

  // Apply minimum shelf-life filter if customer specified
  const minShelfLife = await getCustomerMinShelfLife(customerId, productId)
  const filteredLps = lps.filter(lp =>
    !minShelfLife || !lp.expiry_date ||
    daysUntilExpiry(lp.expiry_date) >= minShelfLife
  )

  // Generate suggestions to fulfill required qty
  return generateSuggestions(filteredLps, requiredQty)
}
```

### SQL Query for Pick Suggestions

```sql
-- Pick suggestions ordered by FEFO, then FIFO
SELECT
  lp.id,
  lp.lp_number,
  loc.name as location_name,
  lp.current_qty as available_qty,
  lp.expiry_date,
  lp.received_date,
  CASE
    WHEN lp.expiry_date IS NOT NULL
    THEN lp.expiry_date - CURRENT_DATE
    ELSE NULL
  END as days_to_expiry,
  CASE
    WHEN lp.expiry_date IS NOT NULL THEN 'FEFO'
    ELSE 'FIFO'
  END as priority_reason
FROM license_plates lp
JOIN locations loc ON lp.location_id = loc.id
WHERE lp.product_id = $1
  AND lp.warehouse_id = $2
  AND lp.status = 'available'
  AND lp.current_qty > 0
  AND (lp.expiry_date IS NULL OR lp.expiry_date > CURRENT_DATE)
ORDER BY
  lp.expiry_date ASC NULLS LAST,  -- FEFO: earliest expiry first
  lp.received_date ASC             -- FIFO fallback: earliest receipt
LIMIT 20;
```

### Override Handling

```typescript
// When user overrides FEFO suggestion
interface PickOverride {
  suggested_lp_id: string
  selected_lp_id: string
  reason: string
  user_id: string
  timestamp: Date
}

async function recordPickOverride(override: PickOverride): Promise<void> {
  // Log override for audit
  await supabase.from('pick_overrides').insert({
    ...override,
    suggested_expiry: await getLPExpiry(override.suggested_lp_id),
    selected_expiry: await getLPExpiry(override.selected_lp_id),
  })

  // If selected LP expires after suggested, flag for review
  if (await isSignificantOverride(override)) {
    await createAuditAlert(override)
  }
}
```

### Minimum Shelf-Life Configuration

```typescript
// Customer-specific shelf-life requirements
interface ShelfLifeRule {
  customer_id?: string       // null = default for all
  product_id?: string        // null = all products
  product_type_id?: string   // null = specific product takes precedence
  min_days_remaining: number // e.g., 60 days
  min_percentage?: number    // e.g., 60% of total shelf life
}

async function getMinShelfLife(
  customerId: string,
  productId: string
): Promise<number | null> {
  // Priority: customer+product > customer+type > customer default > global
  const rules = await supabase
    .from('shelf_life_rules')
    .select('*')
    .or(`customer_id.eq.${customerId},customer_id.is.null`)
    .or(`product_id.eq.${productId},product_id.is.null`)
    .order('customer_id', { ascending: false, nullsFirst: false })
    .order('product_id', { ascending: false, nullsFirst: false })

  return rules[0]?.min_days_remaining || null
}
```

### Expiry Blocking

```typescript
// System configuration
interface PickingConfig {
  block_expired: boolean           // Hard block on expired LPs
  warn_expiring_days: number       // Warning threshold (e.g., 7 days)
  allow_override_expired: boolean  // Supervisor can override
}

// Validation during pick
async function validatePick(lpId: string): Promise<PickValidation> {
  const lp = await getLicensePlate(lpId)
  const config = await getPickingConfig()

  if (lp.expiry_date && lp.expiry_date < new Date()) {
    if (config.block_expired && !config.allow_override_expired) {
      return { valid: false, error: 'LP_EXPIRED', requiresOverride: false }
    }
    return { valid: false, error: 'LP_EXPIRED', requiresOverride: true }
  }

  if (lp.expiry_date && daysUntil(lp.expiry_date) <= config.warn_expiring_days) {
    return { valid: true, warning: 'LP_EXPIRING_SOON', daysRemaining: daysUntil(lp.expiry_date) }
  }

  return { valid: true }
}
```

---

## Alternatives

| Option | Pros | Cons |
|--------|------|------|
| **FIFO only** | Simple; consistent | Ignores expiry; waste risk |
| **FEFO only** | Best for perishables | Fails for non-expiring items |
| **LIFO** | Fresh product to customer | Waste; oldest expires |
| **Manual only** | Full control | Error-prone; no enforcement; audit gaps |
| **FEFO + FIFO (chosen)** | Best of both; handles all products | Slightly more complex |

---

## Consequences

### Positive

1. **Waste Reduction**: Earliest expiring inventory picked first
2. **Compliance**: Expired product blocked from shipping
3. **Customer Satisfaction**: Meets shelf-life requirements
4. **Audit Trail**: Override logging for traceability
5. **Flexibility**: Works for both perishable and non-perishable products
6. **Automation**: Pick suggestions reduce decision time

### Negative

1. **Location Efficiency**: FEFO may require picking from distant locations
2. **Override Friction**: Extra steps when user knows better
3. **Configuration Complexity**: Customer-specific shelf-life rules
4. **Edge Cases**: Partial shelf life data requires handling
5. **Scanner UI**: Must show expiry clearly for validation

### Mitigation

| Challenge | Mitigation |
|-----------|------------|
| Location efficiency | Include location zone in secondary sort |
| Override friction | Quick override button with reason dropdown |
| Configuration | Default rules; customer overrides only when needed |
| Edge cases | Treat missing expiry as "never expires" for FEFO |
| Scanner UI | Large expiry display; color coding (green/yellow/red) |

---

## Scanner UI Integration

```typescript
// Scanner pick screen displays
interface PickScreenDisplay {
  lp_number: string
  product_name: string
  location_code: string
  quantity: number
  expiry_display: string        // "Exp: Dec 31, 2025"
  expiry_status: 'OK' | 'WARNING' | 'EXPIRED'
  days_remaining?: number
  fifo_fefo_indicator: string   // "FEFO" or "FIFO"
}

// Color coding
const expiryColors = {
  OK: 'green',         // > warn_expiring_days
  WARNING: 'yellow',   // <= warn_expiring_days
  EXPIRED: 'red',      // past expiry
}
```

---

## Database Schema

```sql
-- Shelf life rules table
CREATE TABLE shelf_life_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  customer_id UUID REFERENCES customers(id),
  product_id UUID REFERENCES products(id),
  product_type_id UUID REFERENCES product_types(id),
  min_days_remaining INTEGER,
  min_percentage INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_rule CHECK (
    min_days_remaining IS NOT NULL OR min_percentage IS NOT NULL
  )
);

-- Pick override audit log
CREATE TABLE pick_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  suggested_lp_id UUID REFERENCES license_plates(id),
  selected_lp_id UUID REFERENCES license_plates(id),
  suggested_expiry DATE,
  selected_expiry DATE,
  reason TEXT NOT NULL,
  work_order_id UUID REFERENCES work_orders(id),
  sales_order_id UUID REFERENCES sales_orders(id),
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE shelf_life_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE pick_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON shelf_life_rules
  FOR ALL USING (org_id = (auth.jwt() ->> 'org_id')::UUID);

CREATE POLICY "Tenant isolation" ON pick_overrides
  FOR ALL USING (org_id = (auth.jwt() ->> 'org_id')::UUID);
```

---

## Validation

This decision was validated against:
- [x] FDA FSMA food traceability requirements
- [x] Retailer shelf-life requirements (Walmart: 75%, Kroger: 60%)
- [x] Food waste reduction best practices
- [x] Competitor analysis (SAP, Oracle WMS use FEFO)

---

## References

- Pick Service: `apps/frontend/lib/services/pick-service.ts`
- Reservation Service: `apps/frontend/lib/services/reservation-service.ts`
- PRD Warehouse Module: `docs/1-BASELINE/product/modules/warehouse.md`
- ADR-001: License Plate Inventory Model
