# BUG-03.3-001: Missing UNIQUE Constraint on Product per PO

**Status**: OPEN
**Severity**: HIGH
**Story**: 03.3 (PO CRUD + Lines)
**AC Affected**: AC-03-6

---

## Description

The `purchase_order_lines` table is missing a UNIQUE constraint to prevent duplicate products in a single purchase order. This allows invalid state where the same product can be added multiple times to the same PO.

---

## Acceptance Criteria Impact

**AC-03-6: Cannot add duplicate product**
> Given: PO already has line for 'RM-FLOUR-001'
> When: planner attempts to add same product again
> Then: error 'Product already exists on this PO' displays

**Current Behavior**: No validation prevents adding duplicate products

**Expected Behavior**: Duplicate product add is rejected with 400 error

---

## Root Cause

Missing database constraint in migration 079_create_purchase_orders.sql:

```sql
-- Current constraints on purchase_order_lines:
CONSTRAINT po_lines_po_line_unique UNIQUE(po_id, line_number),
CONSTRAINT po_lines_quantity_positive CHECK (quantity > 0),
CONSTRAINT po_lines_unit_price_nonneg CHECK (unit_price >= 0),
CONSTRAINT po_lines_discount_range CHECK (discount_percent >= 0 AND discount_percent <= 100),
CONSTRAINT po_lines_received_qty_range CHECK (received_qty >= 0)

-- Missing:
CONSTRAINT po_lines_unique_product_per_po UNIQUE(po_id, product_id)
```

---

## How to Reproduce

1. Create purchase order PO-2025-00001
2. Add line 1: product_id = 'uuid-flour-001', quantity 100
3. Attempt to add line 2: product_id = 'uuid-flour-001', quantity 50
4. Expected: Error 'Product already exists on this PO'
5. Actual: Line added successfully (WRONG)

---

## Solution

### Option A: Add Database Constraint (Recommended)

Add migration 083 to add constraint to existing table:

```sql
-- Migration 083: Add unique product constraint to purchase_order_lines

ALTER TABLE purchase_order_lines
ADD CONSTRAINT po_lines_unique_product_per_po UNIQUE(po_id, product_id);
```

### Option B: API-Level Validation

Add duplicate check in POST `/api/planning/purchase-orders/:id/lines` endpoint:

```typescript
// Check for existing line with same product
const { data: existingLine, error: checkError } = await supabaseAdmin
  .from('purchase_order_lines')
  .select('id')
  .eq('po_id', poId)
  .eq('product_id', validatedData.product_id)
  .single()

if (existingLine) {
  return NextResponse.json(
    { error: 'Product already exists on this PO' },
    { status: 400 }
  )
}
```

---

## Recommendation

Implement **both** Option A and B:
- Database constraint prevents accidental duplicates (data integrity)
- API validation returns user-friendly error message (UX)

---

## Testing

After fix:

```bash
# Should return 400 error
curl -X POST /api/planning/purchase-orders/:id/lines \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "existing-product-uuid",
    "quantity": 100,
    "unit_price": 2.50
  }'

# Response: { error: "Product already exists on this PO" }
```

---

## Files to Update

1. `supabase/migrations/083_add_po_product_unique_constraint.sql` (NEW)
2. `apps/frontend/app/api/planning/purchase-orders/[id]/lines/route.ts` (POST handler)

---

## Blocking For

- Story 03.3 QA Sign-off (AC-03-6)
- Documentation phase cannot begin until fixed
