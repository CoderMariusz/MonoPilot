# BUG-03.3-004: Table Name Mismatch - po_lines vs purchase_order_lines

**Status**: OPEN
**Severity**: HIGH
**Story**: 03.3 (PO CRUD + Lines)
**AC Affected**: AC-03-1 through AC-03-6 (all line operations)

---

## Description

There is an inconsistency in table naming for PO line items:
- **Database migration** creates table: `purchase_order_lines`
- **API code** references table: `po_lines`
- This mismatch causes runtime errors when API attempts to query non-existent table

---

## Evidence

**Migration (Migration 079)**:
```sql
CREATE TABLE purchase_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id),
  ...
);
```

**API Code (apps/frontend/app/api/planning/purchase-orders/[id]/lines/route.ts)**:
```typescript
const { data, error } = await supabaseAdmin
  .from('po_lines')  // <-- WRONG! Table doesn't exist
  .select(`...`)
  .eq('po_id', id)
  .order('sequence', { ascending: true })

// Will return error: relation "po_lines" does not exist
```

---

## How to Reproduce

1. Get a PO ID from successful POST to create PO
2. Call GET `/api/planning/purchase-orders/:id/lines`
3. Expected: Returns array of line items
4. Actual: 500 error with message "relation 'po_lines' does not exist"

---

## Impact

**Runtime Errors**:
- GET `/api/planning/purchase-orders/:id/lines` returns 500
- POST `/api/planning/purchase-orders/:id/lines` returns 500
- PUT `/api/planning/purchase-orders/:id/lines/:lineId` returns 500
- DELETE `/api/planning/purchase-orders/:id/lines/:lineId` returns 500

**Blocking All Line Operations**:
- AC-03-1: Add line item (fails at database query)
- AC-03-2: Product selection defaults (fails at line creation)
- AC-03-3: Fallback to std_price (fails at line creation)
- AC-03-4: Line total calculation (trigger works, but API can't read)
- AC-03-5: Remove line item (fails at database query)
- AC-03-6: Duplicate product check (fails at database query)

---

## Root Cause

Inconsistent naming between schema design and implementation:
- Schema decided on `purchase_order_lines` (more descriptive)
- Implementation uses `po_lines` (shorter alias)
- No standardization enforced in code review

---

## Solution

Choose one standard and update all references:

### Option A: Use `purchase_order_lines` (Recommended)

Update all API code to use full table name:

```typescript
// Change from:
const { data, error } = await supabaseAdmin
  .from('po_lines')

// To:
const { data, error } = await supabaseAdmin
  .from('purchase_order_lines')
```

**Files to Update**:
1. `apps/frontend/app/api/planning/purchase-orders/[id]/lines/route.ts`
2. `apps/frontend/app/api/planning/purchase-orders/[id]/lines/[lineId]/route.ts`
3. Any service layer that queries lines

**Advantage**: Consistent with migration, matches PR table naming convention

### Option B: Use `po_lines` Alias (Not Recommended)

Create a view in database:

```sql
CREATE VIEW po_lines AS SELECT * FROM purchase_order_lines;
```

**Disadvantage**: Adds complexity, harder to maintain

---

## Recommendation

Implement **Option A** (use purchase_order_lines consistently):
- Matches database migration
- More explicit and self-documenting
- Standard table naming in codebase uses full descriptive names

---

## Files to Update

1. `apps/frontend/app/api/planning/purchase-orders/[id]/lines/route.ts` (GET and POST handlers)
   - Line ~47: `from('po_lines')` → `from('purchase_order_lines')`
   - Line ~80: `from('po_lines')` → `from('purchase_order_lines')`

2. `apps/frontend/app/api/planning/purchase-orders/[id]/lines/[lineId]/route.ts` (GET, PUT, DELETE handlers)
   - All `from('po_lines')` → `from('purchase_order_lines')`

3. `apps/frontend/lib/services/purchase-order-service.ts` (if querying lines)
   - Search for `po_lines` references and update

---

## Testing After Fix

```bash
# 1. Create PO
curl -X POST /api/planning/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{ "supplier_id": "...", "warehouse_id": "..." }'

# Response: { purchase_order: { id: "po-uuid" } }

# 2. Get lines (should return empty array)
curl -X GET /api/planning/purchase-orders/po-uuid/lines

# Response: { lines: [] }

# 3. Add line
curl -X POST /api/planning/purchase-orders/po-uuid/lines \
  -H "Content-Type: application/json" \
  -d '{ "product_id": "...", "quantity": 100, "unit_price": 2.50 }'

# Response (201): { line: { id: "line-uuid", line_number: 1, ... } }

# 4. Get lines again (should return 1 line)
curl -X GET /api/planning/purchase-orders/po-uuid/lines

# Response: { lines: [{ id: "line-uuid", line_number: 1, ... }] }
```

---

## Blocking For

- All line operation ACs (AC-03-1 through AC-03-6)
- Story 03.3 QA cannot pass without this fix
- Cannot move to documentation until fixed

---

## Priority

**HIGH** - Breaks core PO functionality
