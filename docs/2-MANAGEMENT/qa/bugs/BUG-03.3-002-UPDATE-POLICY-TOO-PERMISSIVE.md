# BUG-03.3-002: RLS UPDATE Policy Allows Editing Confirmed Purchase Orders

**Status**: OPEN
**Severity**: HIGH
**Story**: 03.3 (PO CRUD + Lines)
**AC Affected**: AC-05-4

---

## Description

The RLS UPDATE policy on the `purchase_orders` table does not restrict status changes, allowing users to edit PO header fields even when the PO is in 'confirmed' status. This violates the intended status lifecycle where confirmed POs should only allow notes/dates updates and must be locked otherwise.

---

## Acceptance Criteria Impact

**AC-05-4: Confirmed PO restrictions**
> Given: PO is 'confirmed'
> When: planner views available actions
> Then: cannot add/remove lines, can only update notes/dates, can cancel if no receipts

**Current Behavior**: UPDATE allowed on ANY status

**Expected Behavior**: UPDATE restricted to draft/submitted status for most fields; confirmed POs can only update notes/expected_delivery_date

---

## Root Cause

Missing status check in RLS UPDATE policy in migration 079_create_purchase_orders.sql:

```sql
-- Current policy:
CREATE POLICY po_update ON purchase_orders
  FOR UPDATE
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
      (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
      IN ('owner', 'admin', 'planner', 'production_manager')
    )
  );

-- Missing status check - should be:
CREATE POLICY po_update ON purchase_orders
  FOR UPDATE
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
      (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
      IN ('owner', 'admin', 'planner', 'production_manager')
    )
    AND status IN ('draft', 'submitted')  -- Missing!
  );
```

---

## How to Reproduce

1. Create PO-2025-00001, add 1 line
2. Submit PO → status changes to 'confirmed'
3. Attempt to update PO: `PUT /api/planning/purchase-orders/:id` with new notes
4. Expected: Error 'Cannot edit PO in confirmed status'
5. Actual: PO updates successfully (WRONG)

---

## Attack Scenario

Malicious or careless user could:
1. Confirm a PO to supplier
2. Update supplier_id to different supplier
3. Supplier confusion, double orders, chaos

---

## Solution

### Step 1: Update RLS Policy

Modify migration 079_create_purchase_orders.sql or create new migration 084:

```sql
-- Migration 084: Restrict PO update to draft/submitted status

DROP POLICY po_update ON purchase_orders;

CREATE POLICY po_update ON purchase_orders
  FOR UPDATE
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
      (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
      IN ('owner', 'admin', 'planner', 'production_manager')
    )
    AND status IN ('draft', 'submitted')
  );
```

### Step 2: API-Level Validation (Defense in Depth)

Add status check in PUT endpoint before allowing update:

```typescript
// apps/frontend/app/api/planning/purchase-orders/[id]/route.ts

// GET existing PO first
const { data: existingPO } = await supabaseAdmin
  .from('purchase_orders')
  .select('status')
  .eq('id', id)
  .eq('org_id', currentUser.org_id)
  .single()

// Confirmed POs can only update notes and dates
if (existingPO.status === 'confirmed') {
  const allowedFields = ['notes', 'internal_notes', 'expected_delivery_date']
  const requestedFields = Object.keys(validatedData)
  const disallowedFields = requestedFields.filter(f => !allowedFields.includes(f))

  if (disallowedFields.length > 0) {
    return NextResponse.json(
      { error: `Cannot edit fields ${disallowedFields.join(', ')} on confirmed PO` },
      { status: 400 }
    )
  }
}

// Draft/submitted can update all fields
if (!['draft', 'submitted'].includes(existingPO.status)) {
  return NextResponse.json(
    { error: 'Cannot edit PO in current status' },
    { status: 400 }
  )
}
```

---

## Recommendation

Implement **both** solutions:
1. Database RLS policy (prevents direct database manipulation)
2. API validation (provides user-friendly error messages and detailed field-level restrictions)

---

## Testing

After fix:

```bash
# Create confirmed PO
curl -X POST /api/planning/purchase-orders/:id/submit

# Try to update supplier_id
curl -X PUT /api/planning/purchase-orders/:id \
  -H "Content-Type: application/json" \
  -d '{ "supplier_id": "new-supplier-uuid" }'

# Response (400): { error: "Cannot edit PO in current status" }

# Try to update notes (should work)
curl -X PUT /api/planning/purchase-orders/:id \
  -H "Content-Type: application/json" \
  -d '{ "notes": "Updated notes" }'

# Response (200): { purchase_order: { ...updated } }
```

---

## Files to Update

1. `supabase/migrations/079_create_purchase_orders.sql` OR
2. `supabase/migrations/084_restrict_po_update_by_status.sql` (NEW)
3. `apps/frontend/app/api/planning/purchase-orders/[id]/route.ts` (PUT handler)

---

## Related Issues

- AC-05-1: Draft status capabilities (also affected by too-permissive policy)
- AC-05-4: Confirmed PO restrictions (primary impact)

---

## Blocking For

- Story 03.3 QA Sign-off (AC-05-4, AC-05-1)
- Cannot pass security review until fixed
