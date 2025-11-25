# Story 3.2: PO Line Management

**Epic:** 3 - Planning Operations (Batch 3A)
**Story ID:** 3.2
**Priority:** P0
**Effort:** 8 points
**Status:** Ready for Development

---

## User Story

**As a** Purchasing user,
**I want to** add and manage PO lines with automatic tax calculation,
**So that** I can specify what to order and see accurate totals.

---

## Acceptance Criteria

### AC-2.1: Add PO Line

**Given** PO exists in Draft status
**When** clicking "Add Line" button
**Then** Add Line modal opens with fields:

**Required:**
- `product_id`: Searchable dropdown (all active products)
- `quantity`: Number input (must be > 0)
- `unit_price`: Number input (pre-filled from supplier_products or product default, editable)

**Auto-populated:**
- `uom`: From product (read-only, displayed)

**Optional:**
- `discount_percent`: Number input (0-100, default 0)
- `expected_delivery_date`: Date picker (defaults to PO header date)

**Calculation (real-time as user types):**
```
line_subtotal = quantity × unit_price
discount_amount = line_subtotal × (discount_percent / 100)
line_total = line_subtotal - discount_amount
tax_amount = line_total × (tax_rate / 100)  // tax_rate from supplier.tax_code_id
line_total_with_tax = line_total + tax_amount
```

**When** saving line
**Then** line created with auto-incremented `sequence`
**And** PO totals recalculated via database trigger
**And** line added to PO Lines table

### AC-2.2: PO Lines Table Display

**Given** PO has lines
**Then** Lines tab shows table with columns:
- Sequence (#)
- Product Code
- Product Name
- Quantity
- UoM
- Unit Price (with currency badge)
- Discount %
- Line Total (with currency badge)
- Tax Amount (with currency badge)
- Total with Tax (with currency badge)
- Actions (Edit, Delete icons)

**And** table shows all lines sorted by sequence
**And** footer row shows PO totals:
  - **Subtotal**: SUM(line_total)
  - **Tax**: SUM(tax_amount)
  - **Total**: subtotal + tax
  - All with currency badge (from PO.currency)

### AC-2.3: Edit PO Line

**When** clicking Edit icon on line
**Then** Edit Line modal opens (same fields as Add Line)

**Can Edit:**
- quantity
- unit_price
- discount_percent
- expected_delivery_date

**Cannot Edit:**
- product_id (locked after creation, delete and re-add instead)
- uom (from product)
- sequence (auto-managed)

**When** saving changes
**Then** line updated
**And** calculations re-run
**And** PO totals recalculated
**And** `updated_at` timestamp updated

### AC-2.4: Delete PO Line

**When** clicking Delete icon on line
**Then** show confirmation dialog: "Delete this line?"

**When** confirmed
**Then** line deleted
**And** remaining lines re-sequenced (1, 2, 3, ...)
**And** PO totals recalculated
**And** if this was the last line → PO totals = 0

### AC-2.5: Tax Calculation Logic

**Tax Rate Source:**
- PO.supplier_id → suppliers.tax_code_id → tax_codes.rate

**Example:**
- Supplier has tax_code_id = "VAT 23%" (rate = 23.00)
- Line: quantity = 10, unit_price = 100, discount = 0%
- Calculations:
  - line_subtotal = 10 × 100 = 1,000
  - discount_amount = 1,000 × 0% = 0
  - line_total = 1,000 - 0 = 1,000
  - tax_amount = 1,000 × 23% = 230
  - line_total_with_tax = 1,000 + 230 = 1,230

### AC-2.6: PO Totals Recalculation Trigger

**When** line is added, edited, or deleted
**Then** database trigger fires:
```sql
CREATE OR REPLACE FUNCTION recalculate_po_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE purchase_orders
  SET
    subtotal = (SELECT COALESCE(SUM(line_total), 0) FROM po_lines WHERE po_id = NEW.po_id),
    tax_amount = (SELECT COALESCE(SUM(tax_amount), 0) FROM po_lines WHERE po_id = NEW.po_id),
    total = (SELECT COALESCE(SUM(line_total_with_tax), 0) FROM po_lines WHERE po_id = NEW.po_id),
    updated_at = NOW()
  WHERE id = NEW.po_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalc_po_totals
AFTER INSERT OR UPDATE OR DELETE ON po_lines
FOR EACH ROW
EXECUTE FUNCTION recalculate_po_totals();
```

**And** PO totals updated instantly
**And** no API roundtrip needed (database handles it)

### AC-2.7: Unit Price Pre-fill Logic

**When** user selects product
**Then** system looks up unit_price in this order:
1. Check `supplier_products` table:
   ```sql
   SELECT unit_price FROM supplier_products
   WHERE supplier_id = PO.supplier_id AND product_id = X AND unit_price IS NOT NULL
   ```
2. If not found, use `products.unit_price` (default from product)
3. If still null, set to 0 (user must enter manually)

**And** user can always edit the pre-filled price

### AC-2.8: Validation Rules

1. **Quantity**: Must be > 0
2. **Unit Price**: Must be >= 0 (can be 0 for free samples)
3. **Discount**: Must be 0-100 (percentage)
4. **Product**: Cannot add duplicate product to same PO (block or show warning)
5. **Status Check**: Cannot add/edit/delete lines if PO status = 'Closed' or 'Receiving'

---

## Technical Implementation

### Database Schema

```sql
CREATE TABLE po_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  sequence INTEGER NOT NULL,

  quantity NUMERIC(15,3) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  unit_price NUMERIC(15,2) NOT NULL,
  discount_percent NUMERIC(5,2) DEFAULT 0,

  -- Calculated fields
  line_subtotal NUMERIC(15,2) NOT NULL,
  discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(15,2) NOT NULL,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  line_total_with_tax NUMERIC(15,2) NOT NULL,

  expected_delivery_date DATE,
  received_qty NUMERIC(15,3) DEFAULT 0, -- Epic 5

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint
CREATE UNIQUE INDEX idx_po_lines_sequence ON po_lines(po_id, sequence);

-- Indexes
CREATE INDEX idx_po_lines_org ON po_lines(org_id);
CREATE INDEX idx_po_lines_po ON po_lines(po_id);
CREATE INDEX idx_po_lines_product ON po_lines(product_id);

-- RLS Policy
ALTER TABLE po_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY po_lines_isolation ON po_lines
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

### API Routes

```typescript
// apps/frontend/app/api/planning/purchase-orders/[id]/lines/route.ts

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseAdminClient()
  const body = await request.json()

  // Validate
  const validation = poLineSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Validation failed', details: validation.error.errors }, { status: 400 })
  }

  // Check PO status
  const { data: po } = await supabase
    .from('purchase_orders')
    .select('status, currency, supplier_id')
    .eq('id', params.id)
    .single()

  if (['closed', 'receiving'].includes(po.status.toLowerCase())) {
    return NextResponse.json({ error: 'Cannot add lines to PO in Closed/Receiving status' }, { status: 403 })
  }

  // Get product details
  const { data: product } = await supabase
    .from('products')
    .select('uom, unit_price')
    .eq('id', validation.data.product_id)
    .single()

  // Get tax rate
  const { data: supplier } = await supabase
    .from('suppliers')
    .select('tax_code_id, tax_codes(rate)')
    .eq('id', po.supplier_id)
    .single()

  const tax_rate = supplier.tax_codes.rate

  // Get next sequence
  const { count } = await supabase
    .from('po_lines')
    .select('*', { count: 'exact', head: true })
    .eq('po_id', params.id)

  const sequence = (count || 0) + 1

  // Calculate line amounts
  const line_subtotal = validation.data.quantity * validation.data.unit_price
  const discount_amount = line_subtotal * (validation.data.discount_percent / 100)
  const line_total = line_subtotal - discount_amount
  const tax_amount = line_total * (tax_rate / 100)
  const line_total_with_tax = line_total + tax_amount

  const lineData = {
    ...validation.data,
    org_id: po.org_id,
    po_id: params.id,
    uom: product.uom,
    sequence,
    line_subtotal,
    discount_amount,
    line_total,
    tax_amount,
    line_total_with_tax,
  }

  const { data, error } = await supabase
    .from('po_lines')
    .insert(lineData)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Trigger will recalculate PO totals

  return NextResponse.json(data, { status: 201 })
}
```

---

## Testing Requirements

### Unit Tests
- Line calculation logic (subtotal, discount, tax)
- Tax rate lookup
- Unit price pre-fill logic

### Integration Tests
- Create line → totals recalculated
- Edit line → totals updated
- Delete line → totals updated, re-sequence

### E2E Tests
- Add multiple lines to PO
- Edit line → verify totals
- Delete line → verify totals

---

## Definition of Done

- [ ] Database migration with trigger
- [ ] API routes (GET, POST, PUT, DELETE)
- [ ] Frontend components (Add/Edit Line modals, Lines table)
- [ ] Calculation logic tested
- [ ] Trigger tested (totals recalc)
- [ ] E2E test (line management flow)
- [ ] Code reviewed and approved

---

## Dependencies

- Story 3.1 (PO CRUD) - requires PO header
- Story 3.17 (Suppliers) - requires tax_code_id
- Epic 2 (Products) - requires products table

---

## Notes

- Tax calculation uses supplier.tax_code_id (fixed per PO)
- Totals recalculated via database trigger (no API call)
- Product cannot be changed after line creation (delete and re-add)
