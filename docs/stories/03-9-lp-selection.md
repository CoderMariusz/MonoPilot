# Story 3.9: LP Selection for TO

**Epic:** 3 - Planning Operations
**Batch:** 3B - Transfer Orders
**Status:** Draft
**Priority:** P1 (Optional)
**Story Points:** 3
**Created:** 2025-01-23

---

## Goal

Enable optional pre-selection of specific License Plates (LPs) for Transfer Order lines, allowing users to reserve inventory before shipment.

## User Story

**As a** Warehouse user
**I want** to pre-select specific License Plates for transfer
**So that** I can reserve inventory and ensure the correct batches are transferred

---

## Problem Statement

Currently (after Story 3.8), Transfer Orders specify WHAT to transfer (products, quantities) but not WHICH inventory (License Plates, batches) to use. This creates issues:
1. Multiple batches of same product exist (different expiry dates, batch numbers)
2. Users need to decide which batches to transfer (FIFO, FEFO, specific customer requirements)
3. No way to reserve specific LPs before shipment (risk: LP consumed by another order)
4. No audit trail of which exact LPs were planned vs actually shipped

LP Selection solves this by allowing users to:
- Pre-select specific LPs for each TO line
- Reserve those LPs (mark as "reserved for TO-2025-001")
- Track planned vs actual LPs used during shipment

**Note:** This is an OPTIONAL feature, controlled by `planning_settings.to_require_lp_selection`. If disabled, TOs work without LP pre-selection (as in Stories 3.6-3.8).

---

## Acceptance Criteria

### AC-3.9.1: Feature Toggle - Enable LP Selection
**Given** I am an Admin user
**When** I navigate to `/settings/planning`
**Then** I should see a toggle: "Require LP Selection for Transfer Orders"

**Success Criteria:**
- ✅ Toggle stored in `planning_settings.to_require_lp_selection` (boolean, default: false)
- ✅ Toggle description: "When enabled, users must select specific License Plates before shipping Transfer Orders. When disabled, TOs work without LP pre-selection."
- ✅ On toggle: success toast "LP Selection setting updated"
- ✅ Setting applies immediately (no page refresh needed)

**API Endpoint:**
```
PUT /api/planning/settings
Body: { to_require_lp_selection: true }
Response: PlanningSettings object
```

---

### AC-3.9.2: TO Line - "Select LPs" Button
**Given** LP Selection is enabled AND I am viewing a TO with status = 'planned'
**When** viewing the TO lines table
**Then** each line should show a "Select LPs" button in the Actions column

**Success Criteria:**
- ✅ Button shows icon: checkbox/list
- ✅ Button label: "Select LPs" (or "Edit LPs" if already selected)
- ✅ Button hidden if TO status ≠ 'planned' (can only select LPs before shipment)
- ✅ Button hidden if LP Selection feature disabled globally
- ✅ Tooltip on hover: "Choose specific License Plates for this transfer"

---

### AC-3.9.3: LP Selection Modal - Initial Load
**Given** I click "Select LPs" on a TO line (Product: Flour, Quantity: 10 kg)
**When** the modal opens
**Then** I should see:
- Modal title: "Select License Plates - Flour (10 kg needed)"
- Warehouse context: "From Warehouse: Main Warehouse"
- Table of available LPs with columns:
  - LP ID (e.g., LP-001)
  - Batch Number
  - Expiry Date
  - Available Qty (e.g., 8 kg)
  - Status (e.g., "Available")
  - Select (checkbox)
  - Reserved Qty (input, disabled until checkbox selected)
- Summary section: "Total Reserved: 0 / 10 kg (0% complete)"
- Buttons: Cancel, Save Selection

**Success Criteria:**
- ✅ LP list fetched via `GET /api/warehouse/license-plates?product_id={}&warehouse_id={}&status=available`
- ✅ Only LPs from from_warehouse shown (not to_warehouse)
- ✅ Only LPs with matching product_id shown
- ✅ Only LPs with status = 'available' shown (exclude reserved, consumed, shipped)
- ✅ Table sorted by expiry_date ASC (FEFO - First Expiry First Out)
- ✅ Empty state: "No available License Plates found for this product in Main Warehouse."

---

### AC-3.9.4: Select LPs and Enter Reserved Quantities
**Given** the LP Selection modal shows 3 available LPs:
- LP-001: 8 kg, expires 2025-03-01
- LP-002: 5 kg, expires 2025-02-15
- LP-003: 3 kg, expires 2025-04-10

**When** I select LPs:
1. Check LP-002 → Reserved Qty input enabled
2. Enter Reserved Qty = 5 kg (full LP)
3. Check LP-001 → Reserved Qty input enabled
4. Enter Reserved Qty = 5 kg (partial LP, 3 kg left)

**Then** the summary should update:
- "Total Reserved: 10 / 10 kg (100% complete) ✅"

**Success Criteria:**
- ✅ Checkbox selection enables Reserved Qty input for that row
- ✅ Unchecking checkbox disables input, resets reserved_qty to 0
- ✅ Reserved Qty input type: number, step: 0.01 (allows decimals)
- ✅ Reserved Qty input validation:
  - Min: 0.01 (must reserve at least something)
  - Max: available_qty of that LP
- ✅ Summary calculates total: SUM(reserved_qty) across all selected LPs
- ✅ Summary shows progress: 10/10 kg (100%), color: green if complete, yellow if partial, red if over
- ✅ Can select partial LP (e.g., 5 out of 8 kg from LP-001)

---

### AC-3.9.5: Validation - Total Reserved Must Match TO Line Quantity
**Given** TO line quantity = 10 kg
**When** I select LPs with total reserved = 12 kg (over)
**Then** I should see a validation error

**Validation Rules:**
- ❌ Total reserved > TO line quantity → Error: "Total reserved (12 kg) exceeds line quantity (10 kg). Reduce reserved quantities."
- ⚠️ Total reserved < TO line quantity → Warning: "Total reserved (8 kg) is less than line quantity (10 kg). 2 kg remaining. Continue anyway?"
- ✅ Total reserved = TO line quantity → Success: "100% complete ✅ Ready to save."

**Success Criteria:**
- ✅ Error shown inline in summary section (red text, icon)
- ✅ Save button disabled if total > line quantity (hard error)
- ✅ Save button enabled if total < line quantity (warning only, can proceed)
- ✅ Save button enabled if total = line quantity (ideal case)

---

### AC-3.9.6: Save LP Selection
**Given** I have selected LPs totaling 10 kg (matching TO line quantity)
**When** I click "Save Selection"
**Then** the LP selections should be saved via `PUT /api/planning/transfer-orders/:id/lines/:lineId/lps`

**API Request:**
```json
{
  "lps": [
    { "lp_id": "uuid-lp-002", "reserved_qty": 5 },
    { "lp_id": "uuid-lp-001", "reserved_qty": 5 }
  ]
}
```

**Database Updates:**
1. Delete existing `to_line_lps` records for this TO line (replace, not append)
2. Insert new `to_line_lps` records:
   - to_line_id = current TO line ID
   - lp_id = selected LP
   - reserved_qty = entered quantity
3. Update `license_plates.status` = 'reserved' for selected LPs (Epic 5 integration)
4. Emit cache invalidation event: 'to_lp_selected'

**Success Criteria:**
- ✅ Modal closes on successful save
- ✅ TO line detail refreshes showing selected LPs
- ✅ Success toast: "License Plates selected for Flour"
- ✅ TO line row shows badge: "LPs Selected ✅" (green)
- ✅ "Select LPs" button label changes to "Edit LPs" (can edit selection before shipment)

**API Endpoint:**
```
PUT /api/planning/transfer-orders/:id/lines/:lineId/lps
Body: {
  lps: [{ lp_id: UUID, reserved_qty: number }]
}
Response: TransferOrderLineLp[]
```

---

### AC-3.9.7: Display Selected LPs in TO Line Detail
**Given** a TO line has LPs selected (Story 3.9.6)
**When** viewing the TO detail page
**Then** the TO line should expand to show selected LPs:

**Display:**
- TO Line Row: "Flour | 10 kg | Shipped: 0/10 | **LPs Selected ✅**"
- Expandable section (click to expand):
  - Table: LP ID, Batch Number, Expiry, Reserved Qty
  - LP-002: Batch-2025-02, Exp: 2025-02-15, Reserved: 5 kg
  - LP-001: Batch-2025-01, Exp: 2025-03-01, Reserved: 5 kg
  - Total: 10 kg (100%)

**Success Criteria:**
- ✅ Selected LPs fetched via `GET /api/planning/transfer-orders/:id/lines/:lineId/lps`
- ✅ LP details shown: LP ID, batch, expiry, reserved qty
- ✅ Expandable row (chevron icon: ▼ expanded, ▶ collapsed)
- ✅ Total reserved qty matches TO line quantity
- ✅ "Edit LPs" button allows changing selection (before shipment)

---

### AC-3.9.8: Edit LP Selection
**Given** a TO line has LPs selected (e.g., LP-002: 5 kg, LP-001: 5 kg)
**When** I click "Edit LPs"
**Then** the LP Selection modal should open with pre-selected LPs:
- LP-002: checkbox checked, Reserved Qty = 5 kg
- LP-001: checkbox checked, Reserved Qty = 5 kg
- LP-003: checkbox unchecked, Reserved Qty = 0

**When** I change selection:
- Uncheck LP-002 (remove)
- Check LP-003, enter Reserved Qty = 3 kg
- Update LP-001 Reserved Qty = 7 kg (instead of 5 kg)
- Total: 10 kg (7 + 3)

**When** I click "Save Selection"
**Then** the LP selections should be replaced (not appended)

**Success Criteria:**
- ✅ Modal pre-fills with existing LP selections
- ✅ Can add/remove LPs from selection
- ✅ Can change reserved_qty for existing LPs
- ✅ On save: old records deleted, new records inserted (replace operation)
- ✅ LP-002 status updated: 'reserved' → 'available' (unreserved)
- ✅ LP-003 status updated: 'available' → 'reserved' (newly reserved)

---

### AC-3.9.9: Validation - LP Must Be Available
**Given** I am selecting LPs for a TO line
**When** I try to select an LP with status = 'reserved' (already reserved by another TO)
**Then** the LP should not appear in the available LPs list

**Success Criteria:**
- ✅ LP list query filters: `status = 'available'`
- ✅ Reserved LPs (by other TOs) excluded from modal
- ✅ If LP becomes reserved during selection (race condition), save fails with error: "LP-002 is no longer available. Please refresh and try again."
- ✅ Database constraint: `CHECK (lp_status = 'available')` before insert (Epic 5)

---

### AC-3.9.10: Validation - Cannot Select LPs After Shipment
**Given** a TO has status = 'shipped'
**When** viewing the TO lines
**Then** the "Select LPs" button should be hidden

**Success Criteria:**
- ✅ Button only visible if TO status = 'planned' or 'partially_shipped'
- ✅ Button hidden if TO status = 'shipped' or 'received'
- ✅ Rationale: LP selection is for planning, not post-shipment tracking
- ✅ If user tries to call API after shipment: Error 422 "Cannot select LPs: TO already shipped"

---

### AC-3.9.11: Optional Feature - Work Without LP Selection
**Given** LP Selection is disabled globally (planning_settings.to_require_lp_selection = false)
**When** creating and shipping TOs
**Then** the system should work normally without LP pre-selection

**Success Criteria:**
- ✅ "Select LPs" buttons hidden in TO lines table
- ✅ Can ship TO without selecting LPs (Story 3.8 flow unchanged)
- ✅ No validation errors if LPs not selected
- ✅ Feature is truly optional (default: disabled)

**Given** LP Selection is enabled AND set to "required" (planning_settings.to_require_lp_selection = true)
**When** I try to ship a TO without selecting LPs for any line
**Then** I should receive a validation error

**Validation (if required):**
- ❌ Error: "LP Selection required. Please select License Plates for all lines before shipping."
- ✅ Ship TO button disabled until all lines have LPs selected

---

## Technical Implementation

### Database Schema

```sql
-- Migration: 023_create_to_line_lps_table.sql

CREATE TABLE to_line_lps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_line_id UUID NOT NULL REFERENCES to_lines(id) ON DELETE CASCADE,
  lp_id UUID NOT NULL REFERENCES license_plates(id) ON DELETE RESTRICT,
  reserved_qty NUMERIC(10, 2) NOT NULL CHECK (reserved_qty > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: Same LP cannot be reserved twice for same TO line
CREATE UNIQUE INDEX idx_to_line_lps_unique ON to_line_lps(to_line_id, lp_id);

-- Indexes for performance
CREATE INDEX idx_to_line_lps_to_line ON to_line_lps(to_line_id);
CREATE INDEX idx_to_line_lps_lp ON to_line_lps(lp_id);

-- RLS Policy (inherit org_id from to_lines → transfer_orders)
ALTER TABLE to_line_lps ENABLE ROW LEVEL SECURITY;

CREATE POLICY to_line_lps_org_isolation ON to_line_lps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM to_lines
      JOIN transfer_orders ON transfer_orders.id = to_lines.transfer_order_id
      WHERE to_lines.id = to_line_lps.to_line_id
      AND transfer_orders.org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- Validation: SUM(reserved_qty) per to_line_id should <= to_line.quantity
-- (Enforced in API, not database trigger for simplicity)

COMMENT ON TABLE to_line_lps IS 'Optional pre-selected License Plates for Transfer Order lines';
COMMENT ON COLUMN to_line_lps.reserved_qty IS 'Quantity reserved from this LP (can be partial)';
```

### Planning Settings Schema Update

```sql
-- Migration: 024_add_lp_selection_setting.sql

ALTER TABLE planning_settings
  ADD COLUMN to_require_lp_selection BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN planning_settings.to_require_lp_selection IS 'If true, users must select LPs before shipping TOs';
```

### Zod Schema

```typescript
// lib/validation/lp-selection-schemas.ts

import { z } from 'zod'

export const SelectLpsSchema = z.object({
  lps: z.array(
    z.object({
      lp_id: z.string().uuid('Invalid LP ID'),
      reserved_qty: z.number().positive('Reserved quantity must be positive')
    })
  ).min(1, 'At least one License Plate must be selected')
})

// Validation helper: Total reserved qty
export function validateTotalReservedQty(
  lps: { lp_id: string; reserved_qty: number }[],
  lineQuantity: number
): { valid: boolean; total: number; error?: string } {
  const total = lps.reduce((sum, lp) => sum + lp.reserved_qty, 0)

  if (total > lineQuantity) {
    return { valid: false, total, error: `Total reserved (${total}) exceeds line quantity (${lineQuantity})` }
  }

  return { valid: true, total }
}
```

### API Routes

```typescript
// app/api/planning/transfer-orders/[id]/lines/[lineId]/lps/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SelectLpsSchema, validateTotalReservedQty } from '@/lib/validation/lp-selection-schemas'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; lineId: string } }
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('to_line_lps')
    .select(`
      *,
      lp:license_plates(id, lp_number, batch_number, expiry_date, available_qty)
    `)
    .eq('to_line_id', params.lineId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; lineId: string } }
) {
  const supabase = await createClient()
  const body = await request.json()

  // Validate
  const result = SelectLpsSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  // Get TO line
  const { data: line } = await supabase
    .from('to_lines')
    .select('quantity, transfer_order_id')
    .eq('id', params.lineId)
    .single()

  if (!line) {
    return NextResponse.json({ error: 'TO Line not found' }, { status: 404 })
  }

  // Validate total reserved qty
  const validation = validateTotalReservedQty(result.data.lps, line.quantity)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  // Check TO status (must be planned)
  const { data: to } = await supabase
    .from('transfer_orders')
    .select('status')
    .eq('id', params.id)
    .single()

  if (!to || !['planned', 'partially_shipped'].includes(to.status)) {
    return NextResponse.json(
      { error: `Cannot select LPs: TO status is ${to?.status}` },
      { status: 422 }
    )
  }

  // Validate all LPs are available
  const { data: lps } = await supabase
    .from('license_plates')
    .select('id, status, available_qty')
    .in('id', result.data.lps.map(lp => lp.lp_id))

  for (const selectedLp of result.data.lps) {
    const lp = lps?.find(l => l.id === selectedLp.lp_id)
    if (!lp) {
      return NextResponse.json({ error: `LP ${selectedLp.lp_id} not found` }, { status: 404 })
    }
    if (lp.status !== 'available') {
      return NextResponse.json(
        { error: `LP ${selectedLp.lp_id} is not available (status: ${lp.status})` },
        { status: 422 }
      )
    }
    if (selectedLp.reserved_qty > lp.available_qty) {
      return NextResponse.json(
        { error: `Cannot reserve ${selectedLp.reserved_qty} from LP ${selectedLp.lp_id} (only ${lp.available_qty} available)` },
        { status: 400 }
      )
    }
  }

  // Delete existing selections (replace, not append)
  await supabase
    .from('to_line_lps')
    .delete()
    .eq('to_line_id', params.lineId)

  // Insert new selections
  const { data: newSelections, error } = await supabase
    .from('to_line_lps')
    .insert(
      result.data.lps.map(lp => ({
        to_line_id: params.lineId,
        lp_id: lp.lp_id,
        reserved_qty: lp.reserved_qty
      }))
    )
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update LP status to 'reserved' (Epic 5 integration)
  await supabase
    .from('license_plates')
    .update({ status: 'reserved' })
    .in('id', result.data.lps.map(lp => lp.lp_id))

  return NextResponse.json(newSelections)
}
```

---

## Testing Requirements

### Unit Tests (Vitest)
- ✅ `SelectLpsSchema` validation
- ✅ `validateTotalReservedQty` helper (exact, under, over)

### Integration Tests (Vitest + Supabase)
- ✅ `GET /api/planning/transfer-orders/:id/lines/:lineId/lps` returns selected LPs
- ✅ `PUT /api/planning/transfer-orders/:id/lines/:lineId/lps` saves LP selections
- ✅ Validation: Total reserved > line quantity (400)
- ✅ Validation: LP not available (422)
- ✅ Validation: Reserved qty > LP available_qty (400)
- ✅ Validation: Cannot select LPs after shipment (422)
- ✅ Replace operation: Old selections deleted, new inserted
- ✅ LP status updated to 'reserved' after selection

### E2E Tests (Playwright)
- ✅ Select LPs: Open modal, select 2 LPs, save, verify saved
- ✅ Edit LPs: Change selection, save, verify updated
- ✅ Validation error: Select total > line qty, verify error message
- ✅ Feature toggle: Disable LP selection, verify "Select LPs" button hidden

---

## Dependencies

### Prerequisite Stories
- ✅ Story 3.6: Transfer Order CRUD
- ✅ Story 3.7: TO Line Management
- ✅ Epic 5: License Plates (license_plates table, available_qty field)

### Consumed APIs
- `GET /api/warehouse/license-plates` (Epic 5) - Get available LPs for product in warehouse
- `PUT /api/warehouse/license-plates/:id` (Epic 5) - Update LP status to 'reserved'

---

## Notes / References

- **Tech Spec:** `docs/sprint-artifacts/tech-spec-epic-3-batch-3b.md`
- **Epic Story:** `docs/epics/epic-3-planning.md` (Story 3.9)
- **Database Migration:** `lib/supabase/migrations/023_create_to_line_lps_table.sql`
- **Zod Schemas:** `lib/validation/lp-selection-schemas.ts`
- **API Routes:** `app/api/planning/transfer-orders/[id]/lines/[lineId]/lps/route.ts`
- **UI Components:** `components/planning/LpSelectionModal.tsx`
- **Feature Flag:** `planning_settings.to_require_lp_selection`

---

**Definition of Done:**
- [ ] Database migration applied (to_line_lps table created)
- [ ] RLS policy enabled and tested
- [ ] Planning settings updated (to_require_lp_selection field)
- [ ] API endpoints implemented (GET, PUT)
- [ ] Zod validation schemas created and tested
- [ ] LP Selection modal UI implemented
- [ ] TO line detail shows selected LPs (expandable row)
- [ ] "Select LPs" / "Edit LPs" button working
- [ ] Feature toggle working (can enable/disable LP selection)
- [ ] LP status integration with Epic 5 (status → 'reserved')
- [ ] All unit tests passing (95% coverage)
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
