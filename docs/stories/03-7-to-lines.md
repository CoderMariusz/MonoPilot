# Story 3.7: TO Line Management

**Epic:** 3 - Planning Operations
**Batch:** 3B - Transfer Orders
**Status:** Draft
**Priority:** P0 (Blocker)
**Story Points:** 3
**Created:** 2025-01-23

---

## Goal

Add, edit, and delete TO lines (products to transfer) with quantity tracking and UoM inheritance from products.

## User Story

**As a** Warehouse user
**I want** to add products to transfer orders with quantities
**So that** I can specify what inventory to move between warehouses

---

## Problem Statement

Transfer Orders (created in Story 3.6) are currently empty - they have from/to warehouses and dates, but no products specified. Users need:
1. Ability to add multiple products (TO lines) to a Transfer Order
2. Quantity specification per product with UoM (Unit of Measure)
3. Tracking of shipped and received quantities (initialized to 0, updated in Story 3.8)
4. Edit and delete lines while TO is in draft status
5. Validation to prevent negative quantities and ensure data integrity

Without TO lines, Transfer Orders are meaningless - we need to know what products are being transferred.

---

## Acceptance Criteria

### AC-3.7.1: TO Lines Table Display
**Given** I am viewing a Transfer Order detail page (created in Story 3.6)
**When** the page loads
**Then** I should see a "Transfer Order Lines" section with:
- Table columns: Product Code, Product Name, Planned Qty, UoM, Shipped Qty, Received Qty, Actions
- "Add Line" button (if status = 'draft')
- Empty state (if no lines): "No products added. Click 'Add Line' to start."

**Success Criteria:**
- ✅ TO lines fetched via `GET /api/planning/transfer-orders/:id/lines`
- ✅ Table shows all lines for current TO
- ✅ Shipped Qty column format: "0 / 10 kg" (shipped / planned, UoM)
- ✅ Received Qty column format: "0 / 10 kg" (received / planned, UoM)
- ✅ Actions column: Edit (icon button), Delete (icon button) - only if TO status = 'draft'
- ✅ "Add Line" button hidden if TO status ≠ 'draft'

---

### AC-3.7.2: Add TO Line Modal
**Given** I am viewing a TO with status = 'draft'
**When** I click "Add Line"
**Then** an Add TO Line modal should open with form fields:
- Product (required, searchable dropdown)
- Quantity (required, number input, min 0.01)
- UoM (read-only, auto-filled from selected product)
- Notes (optional, textarea, max 200 chars)

**Success Criteria:**
- ✅ Modal title: "Add Product to Transfer Order"
- ✅ Product dropdown populated via `GET /api/technical/products`
- ✅ Product dropdown searchable (by code or name)
- ✅ When product selected: UoM field auto-fills from `products.uom` (e.g., "kg", "pcs", "L")
- ✅ UoM field disabled (grayed out, read-only)
- ✅ Quantity input allows decimals (e.g., 10.5 kg)
- ✅ Cancel button closes modal without changes
- ✅ Save button disabled until required fields filled

**Validation Errors:**
- ❌ Empty Product → "Please select a product"
- ❌ Quantity ≤ 0 → "Quantity must be greater than 0"
- ❌ Quantity > 999999 → "Quantity cannot exceed 999,999"

---

### AC-3.7.3: Save TO Line
**Given** I have filled the Add TO Line form with valid data
**When** I click "Save Line"
**Then** a new TO line should be created with:
- `transfer_order_id` = current TO ID
- `product_id` = selected product
- `quantity` = entered quantity
- `uom` = inherited from product
- `shipped_qty` = 0 (initialized)
- `received_qty` = 0 (initialized)
- `notes` = entered text (if any)

**Success Criteria:**
- ✅ TO line inserted into `to_lines` table via `POST /api/planning/transfer-orders/:id/lines`
- ✅ RLS policy enforced via transfer_orders join
- ✅ Modal closes on successful save
- ✅ TO lines table refreshes showing new line
- ✅ Success toast: "Product added to Transfer Order"
- ✅ Line appears in table: Product Code, Name, Qty (e.g., "10 kg"), UoM, Shipped (0/10), Received (0/10)

**API Endpoint:**
```
POST /api/planning/transfer-orders/:id/lines
Body: {
  product_id: UUID,
  quantity: number,
  notes?: string
}
Response: TransferOrderLine object
```

---

### AC-3.7.4: Edit TO Line
**Given** a TO line exists on a TO with status = 'draft'
**When** I click the Edit icon button on a line
**Then** an Edit TO Line drawer should open with pre-filled fields:
- Product (read-only, shows selected product)
- Quantity (editable)
- UoM (read-only, from product)
- Notes (editable)

**When** I update Quantity or Notes and click "Save"
**Then** the TO line should be updated via `PUT /api/planning/transfer-orders/:id/lines/:lineId`

**Success Criteria:**
- ✅ Drawer title: "Edit Transfer Order Line"
- ✅ Product field disabled (cannot change product after creation)
- ✅ Quantity validation same as create (> 0, ≤ 999999)
- ✅ On save: TO line updated, drawer closes, table refreshes
- ✅ Success toast: "Transfer Order Line updated"

**Validation:**
- ❌ Cannot edit if TO status ≠ 'draft' → Error: "Cannot edit lines after planning. Current status: Planned"

**API Endpoint:**
```
PUT /api/planning/transfer-orders/:id/lines/:lineId
Body: {
  quantity?: number,
  notes?: string
}
Response: TransferOrderLine object
```

---

### AC-3.7.5: Delete TO Line
**Given** a TO line exists on a TO with status = 'draft'
**When** I click the Delete icon button on a line
**Then** a confirmation modal should appear:
- Title: "Delete Transfer Order Line?"
- Message: "Remove [Product Name] from this transfer? This action cannot be undone."
- Buttons: Cancel, Delete

**When** I click "Delete"
**Then** the TO line should be deleted via `DELETE /api/planning/transfer-orders/:id/lines/:lineId`

**Success Criteria:**
- ✅ Confirmation modal prevents accidental deletion
- ✅ On confirm: TO line deleted from database (hard delete)
- ✅ TO lines table refreshes (line removed)
- ✅ Success toast: "[Product Name] removed from Transfer Order"
- ✅ Line no longer appears in table

**Validation:**
- ❌ Cannot delete if TO status ≠ 'draft' → Error: "Cannot delete lines after planning. Current status: Shipped"

**API Endpoint:**
```
DELETE /api/planning/transfer-orders/:id/lines/:lineId
Response: { success: true }
```

---

### AC-3.7.6: TO Lines Summary
**Given** a TO has multiple lines
**When** viewing the TO detail page
**Then** I should see a summary section above the lines table:
- Total Lines: 3 products
- Total Planned Qty: (sum of all quantities with mixed UoMs - show as "3 products" if mixed)
- Shipped Status: 0% shipped (0/3 products fully shipped)
- Received Status: 0% received (0/3 products fully received)

**Success Criteria:**
- ✅ Summary updates in real-time when lines added/edited/deleted
- ✅ Shipped Status: Calculate % of lines where shipped_qty >= quantity
- ✅ Received Status: Calculate % of lines where received_qty >= shipped_qty
- ✅ Summary card styled with border, padding, responsive grid

**Examples:**
- 3 lines, 0 shipped → "0% shipped (0/3 products)"
- 3 lines, 2 shipped → "67% shipped (2/3 products)"
- 3 lines, all shipped → "100% shipped (3/3 products)"

---

### AC-3.7.7: Duplicate Product Allowed
**Given** I am adding a TO line
**When** I select a product that already exists on another line in the same TO
**Then** the system should allow it (no unique constraint on product_id per TO)

**Rationale:**
- Users may want to transfer same product in multiple batches
- Different lines could have different notes (e.g., "Batch A", "Batch B")
- No business reason to prevent duplicate products

**Success Criteria:**
- ✅ Can add "Product A, 10 kg" and "Product A, 5 kg" as separate lines
- ✅ Both lines displayed independently in table
- ✅ Each line has separate shipped_qty, received_qty tracking

---

### AC-3.7.8: Validation - Cannot Plan TO Without Lines
**Given** a TO with status = 'draft' and 0 lines
**When** I try to change status to 'planned' (Story 3.6)
**Then** I should receive an error

**Success Criteria:**
- ✅ API validation: `PUT /api/planning/transfer-orders/:id/status` checks line count
- ✅ Error message: "Cannot plan Transfer Order without lines. Add at least one product."
- ✅ Status remains 'draft'
- ✅ Error toast displayed in UI

---

## Technical Implementation

### Database Schema

```sql
-- Migration: 021_create_to_lines_table.sql

CREATE TABLE to_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_order_id UUID NOT NULL REFERENCES transfer_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
  uom VARCHAR(20) NOT NULL, -- Inherited from product
  shipped_qty NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (shipped_qty >= 0 AND shipped_qty <= quantity),
  received_qty NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (received_qty >= 0 AND received_qty <= shipped_qty),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_to_lines_transfer_order ON to_lines(transfer_order_id);
CREATE INDEX idx_to_lines_product ON to_lines(product_id);

-- RLS Policy (inherit org_id from transfer_orders)
ALTER TABLE to_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY to_lines_org_isolation ON to_lines
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM transfer_orders
      WHERE transfer_orders.id = to_lines.transfer_order_id
      AND transfer_orders.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

COMMENT ON COLUMN to_lines.shipped_qty IS 'Quantity actually shipped (updated in Story 3.8)';
COMMENT ON COLUMN to_lines.received_qty IS 'Quantity actually received (updated in Story 3.8)';
```

### Zod Schema

```typescript
// lib/validation/to-line-schemas.ts

import { z } from 'zod'

export const CreateToLineSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  quantity: z.number().positive('Quantity must be greater than 0').max(999999, 'Quantity cannot exceed 999,999'),
  notes: z.string().max(200, 'Notes cannot exceed 200 characters').optional()
})

export const UpdateToLineSchema = z.object({
  quantity: z.number().positive().max(999999).optional(),
  notes: z.string().max(200).optional()
})
```

### API Routes

```typescript
// app/api/planning/transfer-orders/[id]/lines/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateToLineSchema } from '@/lib/validation/to-line-schemas'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('to_lines')
    .select(`
      *,
      product:products(id, code, name, uom)
    `)
    .eq('transfer_order_id', params.id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const body = await request.json()

  // Validate
  const result = CreateToLineSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  // Get product to inherit UoM
  const { data: product } = await supabase
    .from('products')
    .select('uom')
    .eq('id', result.data.product_id)
    .single()

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // Check TO status (must be draft)
  const { data: to } = await supabase
    .from('transfer_orders')
    .select('status')
    .eq('id', params.id)
    .single()

  if (!to) {
    return NextResponse.json({ error: 'Transfer Order not found' }, { status: 404 })
  }

  if (to.status !== 'draft') {
    return NextResponse.json(
      { error: `Cannot add lines after planning. Current status: ${to.status}` },
      { status: 422 }
    )
  }

  // Insert TO line
  const { data: line, error } = await supabase
    .from('to_lines')
    .insert({
      transfer_order_id: params.id,
      product_id: result.data.product_id,
      quantity: result.data.quantity,
      uom: product.uom, // Inherit from product
      shipped_qty: 0,
      received_qty: 0,
      notes: result.data.notes
    })
    .select(`
      *,
      product:products(id, code, name, uom)
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(line, { status: 201 })
}
```

---

## Testing Requirements

### Unit Tests (Vitest)
- ✅ `CreateToLineSchema` validation (quantity > 0, ≤ 999999)
- ✅ `UpdateToLineSchema` validation
- ✅ UoM inheritance from product

### Integration Tests (Vitest + Supabase)
- ✅ `POST /api/planning/transfer-orders/:id/lines` creates TO line with inherited UoM
- ✅ `GET /api/planning/transfer-orders/:id/lines` returns lines for TO
- ✅ `PUT /api/planning/transfer-orders/:id/lines/:lineId` updates line (draft only)
- ✅ `DELETE /api/planning/transfer-orders/:id/lines/:lineId` deletes line (draft only)
- ✅ RLS policy: User A cannot view User B's TO lines (different org)
- ✅ Validation: Cannot add line if TO status ≠ 'draft' (422)
- ✅ Validation: Cannot delete line if TO status ≠ 'draft' (422)
- ✅ Validation: Cannot plan TO with 0 lines (422)
- ✅ Duplicate product allowed: Can add same product multiple times

### E2E Tests (Playwright)
- ✅ Add TO line: Select product, enter quantity, save, verify line appears
- ✅ Edit TO line: Update quantity, save, verify changes
- ✅ Delete TO line: Confirm deletion, verify line removed
- ✅ Add duplicate product: Add same product twice, verify both lines exist
- ✅ Validation error: Try add line to planned TO, verify error message

---

## Dependencies

### Prerequisite Stories
- ✅ Story 3.6: Transfer Order CRUD (transfer_orders table exists)
- ✅ Story 2.1: Product CRUD (products table exists, UoM field available)

### Consumed APIs
- `GET /api/technical/products` (Epic 2) - Populate product dropdown, get UoM
- `GET /api/planning/transfer-orders/:id` (Story 3.6) - Check TO status before line operations

### Provides APIs for
- Story 3.8: Partial Shipments (updates shipped_qty, received_qty)
- Story 3.9: LP Selection (links LPs to TO lines)

---

## Notes / References

- **Tech Spec:** `docs/sprint-artifacts/tech-spec-epic-3-batch-3b.md`
- **Epic Story:** `docs/epics/epic-3-planning.md` (Story 3.7)
- **Database Migration:** `lib/supabase/migrations/021_create_to_lines_table.sql`
- **Zod Schemas:** `lib/validation/to-line-schemas.ts`
- **API Routes:** `app/api/planning/transfer-orders/[id]/lines/route.ts`
- **UI Components:** `components/planning/ToLineTable.tsx`

---

**Definition of Done:**
- [ ] Database migration applied (to_lines table created)
- [ ] RLS policy enabled and tested
- [ ] API endpoints implemented (GET, POST, PUT, DELETE)
- [ ] Zod validation schemas created and tested
- [ ] TO lines table UI implemented
- [ ] Add TO line modal implemented with product dropdown
- [ ] Edit TO line drawer implemented
- [ ] Delete TO line confirmation modal implemented
- [ ] UoM inheritance from product working correctly
- [ ] TO summary section implemented (total lines, shipped/received %)
- [ ] All unit tests passing (95% coverage)
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
