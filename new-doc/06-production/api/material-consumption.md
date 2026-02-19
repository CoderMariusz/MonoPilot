# Material Consumption API

**Story:** 04.6a - Material Consumption Desktop
**Extended:** 04.6c - 1:1 Consumption Enforcement, 04.6d - Consumption Correction
**Status:** DEPLOYED
**Module:** Production
**Last Updated:** 2026-01-21

## Overview

The Material Consumption API enables recording and managing material consumption from License Plates (LPs) during work order execution. It provides endpoints for:

- Listing WO materials with consumption progress
- Recording material consumption from LPs
- Viewing consumption history
- Reversing consumption records (manager only)
- **1:1 Consumption Enforcement** (Story 04.6c)
- **Consumption Reversal with Audit Trail** (Story 04.6d)

## Base URL

```
/api/production/work-orders/{woId}
```

## Authentication

All endpoints require authentication via Supabase Auth. Include the session token in the request headers.

## Authorization

| Endpoint | Allowed Roles |
|----------|---------------|
| GET /materials | owner, admin, production_manager, production_operator, planner |
| POST /consume | owner, admin, production_manager, production_operator |
| GET /consumptions | owner, admin, production_manager, production_operator, planner |
| POST /consume/reverse | owner, admin, production_manager |

## Endpoints

### GET /materials

Returns materials for a work order with consumption progress.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| filter | string | "all" | Filter materials: all, partial, completed, over-consumed |
| sort | string | "sequence" | Sort by: sequence, name, progress |

**Response (200 OK):**

```json
{
  "materials": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "material_name": "Sugar",
      "material_sku": "SUG-001",
      "required_qty": 100,
      "consumed_qty": 40,
      "remaining_qty": 60,
      "uom": "kg",
      "sequence": 1,
      "consume_whole_lp": false,
      "is_by_product": false,
      "progress_percent": 40,
      "variance_percent": -60
    },
    {
      "id": "uuid",
      "product_id": "uuid",
      "material_name": "Peanut Flour",
      "material_sku": "PF-001",
      "required_qty": 25,
      "consumed_qty": 0,
      "remaining_qty": 25,
      "uom": "kg",
      "sequence": 2,
      "consume_whole_lp": true,
      "is_by_product": false,
      "progress_percent": 0,
      "variance_percent": -100
    }
  ],
  "total": 5
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Authentication required |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | WO_NOT_FOUND | Work order not found |

---

### POST /consume

Records material consumption from a License Plate.

**Request Body:**

```json
{
  "wo_material_id": "uuid",
  "lp_id": "uuid",
  "consume_qty": 40,
  "notes": "optional notes"
}
```

**Validation Schema (Zod):**

```typescript
const consumeRequestSchema = z.object({
  wo_material_id: z.string().uuid('Invalid material ID'),
  lp_id: z.string().uuid('Invalid LP ID'),
  consume_qty: z.number().positive('Quantity must be positive'),
  notes: z.string().optional(),
});
```

**Response (201 Created):**

```json
{
  "consumption": {
    "id": "uuid",
    "consumed_qty": 40,
    "consumed_at": "2026-01-21T10:30:00Z",
    "is_full_lp": false
  },
  "lp_updated": {
    "id": "uuid",
    "new_qty": 60,
    "new_status": "available"
  },
  "material_progress": {
    "consumed": 80,
    "required": 100,
    "percentage": 80
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | WO_NOT_IN_PROGRESS | WO status must be in_progress or released |
| 400 | LP_NOT_FOUND | License plate not found |
| 400 | LP_NOT_AVAILABLE | LP status is not available |
| 400 | LP_QA_HOLD | LP is on QA hold |
| 400 | LP_EXPIRED | LP has expired |
| 400 | PRODUCT_MISMATCH | LP product does not match material |
| 400 | UOM_MISMATCH | LP UoM does not match material |
| 400 | INSUFFICIENT_QUANTITY | Requested qty exceeds LP quantity |
| 400 | **FULL_LP_REQUIRED** | Material requires full LP consumption (04.6c) |
| 400 | INVALID_QUANTITY | Quantity must be positive |
| 404 | MATERIAL_NOT_FOUND | WO material not found |
| 404 | WO_NOT_FOUND | Work order not found |

---

## 1:1 Consumption Enforcement (Story 04.6c)

### Overview

When a WO material has `consume_whole_lp=true`, the API enforces full LP consumption. Partial consumption is blocked with a `FULL_LP_REQUIRED` error.

### Use Cases

| Use Case | Example | Behavior |
|----------|---------|----------|
| Allergen-Sensitive Materials | Peanut flour 25kg LP | Must consume entire LP to prevent cross-contamination |
| Traceability Requirements | Organic ingredients | Complete LP consumption for certification compliance |
| Sealed Packaging | Box of 5000 bags | Cannot partially use, must consume entire box |

### Validation Logic

The API validates the `consume_whole_lp` flag at step 14 of the consumption process:

```typescript
// API route validation (route.ts line 228-239)
if (material.consume_whole_lp && Math.abs(consume_qty - lpQty) > 0.0001) {
  return NextResponse.json(
    {
      error: 'FULL_LP_REQUIRED',
      message: `Full LP consumption required. LP quantity is ${lpQty}`,
      lp_qty: lpQty,
      requested_qty: consume_qty,
    },
    { status: 400 }
  )
}
```

**Tolerance:** A floating-point tolerance of 0.0001 is used to handle decimal precision issues.

### FULL_LP_REQUIRED Error Response

When partial consumption is attempted on a `consume_whole_lp=true` material:

**Request:**
```json
{
  "wo_material_id": "mat-002",
  "lp_id": "lp-001",
  "consume_qty": 15
}
```

**Response (400 Bad Request):**
```json
{
  "error": "FULL_LP_REQUIRED",
  "message": "Full LP consumption required. LP quantity is 25",
  "lp_qty": 25,
  "requested_qty": 15
}
```

### is_full_lp Flag

When full LP consumption is recorded, the `is_full_lp` flag is set to `true` on the consumption record:

```typescript
const isFullLp = Math.abs(consume_qty - lpQty) < 0.0001
```

This flag is stored in `wo_material_consumptions.is_full_lp` for traceability and reporting.

### Variance Recording

When LP quantity differs from the required quantity for a 1:1 material, variance is calculated:

**Example:**
- Required qty: 90 kg
- LP.qty: 100 kg
- Variance: +11.1% (over-consumption)

The consumption proceeds successfully with the variance recorded in the material progress.

### Frontend Handling

**Desktop (AddConsumptionModal):**
- Qty input is pre-filled with LP.qty
- Qty input is read-only with lock icon
- Warning banner displays when consume_whole_lp=true
- "Use All Available" button is the primary action

**Scanner (Step3EnterQty):**
- Qty input pre-filled with LP.qty
- NumberPad is disabled (50% opacity)
- "Full Consumption" button is prominent
- Number pad key taps are ignored

---

### GET /consumptions

Returns paginated consumption history for a work order.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number (1-indexed) |
| limit | number | 20 | Items per page (max 100) |
| status | string | - | Filter by status: all, active, reversed |
| material_id | string | - | Filter by specific material |
| sort | string | "consumed_at" | Sort by: consumed_at, consumed_qty, status |
| order | string | "desc" | Sort order: asc, desc |

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "lp_number": "LP-2026-00123",
      "material_name": "Sugar",
      "consumed_qty": 40,
      "uom": "kg",
      "consumed_at": "2026-01-21T10:30:00Z",
      "consumed_by_name": "John Doe",
      "batch_number": "BATCH-001",
      "expiry_date": "2026-06-30",
      "status": "active",
      "is_full_lp": false
    },
    {
      "id": "uuid",
      "lp_number": "LP-2026-00456",
      "material_name": "Peanut Flour",
      "consumed_qty": 25,
      "uom": "kg",
      "consumed_at": "2026-01-21T11:00:00Z",
      "consumed_by_name": "Jane Smith",
      "batch_number": "BATCH-002",
      "expiry_date": "2026-09-15",
      "status": "active",
      "is_full_lp": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  },
  "total": 45,
  "hasMore": true
}
```

---

### POST /consume/reverse (Story 04.6d)

Reverses a consumption record. Manager role required.

**Full documentation:** [Consumption Reversal API](./consumption-reversal.md)

**Request Body:**

```json
{
  "consumption_id": "uuid",
  "reason": "scanned_wrong_lp",
  "notes": "optional additional notes"
}
```

**Valid Reason Codes:**

| Code | Label | Notes Required |
|------|-------|----------------|
| scanned_wrong_lp | Scanned Wrong LP | No |
| wrong_quantity | Wrong Quantity Entered | No |
| operator_error | Operator Error | No |
| quality_issue | Quality Issue | No |
| other | Other (specify) | Yes |

**Validation Schema (Zod):**

```typescript
const reverseSchema = z.object({
  consumption_id: z.string().uuid('Invalid consumption ID'),
  reason: z.enum([
    'scanned_wrong_lp',
    'wrong_quantity',
    'operator_error',
    'quality_issue',
    'other',
  ], { required_error: 'Reason for reversal is required' }),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
}).refine(
  (data) => data.reason !== 'other' || (data.notes && data.notes.trim().length > 0),
  { message: 'Notes are required when reason is "other"', path: ['notes'] }
);
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Consumption reversed successfully",
  "consumption_id": "uuid",
  "wo_number": "WO-2026-00001",
  "lp_number": "LP-001",
  "reversed_qty": 40,
  "lp_new_qty": 100,
  "lp_new_status": "available",
  "reversed_at": "2026-01-21T11:00:00Z",
  "reversed_by": "uuid",
  "reason": "scanned_wrong_lp"
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | ALREADY_REVERSED | Consumption already reversed |
| 400 | NOTES_REQUIRED_FOR_OTHER | Notes required when reason is "other" |
| 403 | FORBIDDEN | Only managers can reverse |
| 404 | CONSUMPTION_NOT_FOUND | Consumption record not found |

---

## Database Schema

### wo_consumption Table (with Reversal Fields)

```sql
CREATE TABLE wo_consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  wo_id UUID NOT NULL REFERENCES work_orders(id),
  material_id UUID NOT NULL REFERENCES wo_materials(id),
  lp_id UUID NOT NULL REFERENCES license_plates(id),
  reservation_id UUID REFERENCES wo_material_reservations(id),

  consumed_qty DECIMAL(15,6) NOT NULL CHECK (consumed_qty > 0),
  uom TEXT NOT NULL,
  is_full_lp BOOLEAN DEFAULT false,

  consumed_by_user_id UUID REFERENCES users(id),
  consumed_at TIMESTAMPTZ DEFAULT NOW(),

  status TEXT DEFAULT 'consumed' CHECK (status IN ('consumed', 'reversed')),

  -- Reversal fields (Story 04.6d)
  reversed BOOLEAN DEFAULT false,
  reversed_at TIMESTAMPTZ,
  reversed_by UUID REFERENCES users(id),
  reversed_by_user_id UUID REFERENCES users(id),
  reversal_reason TEXT,
  reverse_reason TEXT,
  reversal_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_reversal_reason CHECK (
    reversal_reason IS NULL OR
    reversal_reason IN ('scanned_wrong_lp', 'wrong_quantity', 'operator_error', 'quality_issue', 'other')
  )
);
```

### wo_materials Table (relevant columns)

```sql
-- consume_whole_lp flag (Story 04.6c)
consume_whole_lp BOOLEAN DEFAULT false
-- If true, entire LP must be consumed (1:1 mode)
```

### lp_genealogy Table (Reversal Fields)

```sql
-- Added by Story 04.6d
is_reversed BOOLEAN DEFAULT false,
reversed_at TIMESTAMPTZ,
reversed_by UUID REFERENCES users(id),
reverse_reason TEXT
```

### Indexes

```sql
CREATE INDEX idx_consumption_org ON wo_consumption(org_id);
CREATE INDEX idx_consumption_wo ON wo_consumption(wo_id);
CREATE INDEX idx_consumption_lp ON wo_consumption(lp_id);
CREATE INDEX idx_consumption_material ON wo_consumption(material_id);
CREATE INDEX idx_consumption_status ON wo_consumption(status);
CREATE INDEX idx_consumption_consumed_at ON wo_consumption(consumed_at DESC);
-- Story 04.6d indexes
CREATE INDEX idx_consumption_reversed ON wo_consumption(org_id, reversed);
CREATE INDEX idx_consumption_wo_active ON wo_consumption(wo_id) WHERE reversed = false;
```

---

## Side Effects

### On Consumption (POST /consume)

1. **LP quantity updated**: `current_qty = current_qty - consume_qty`
2. **LP status change**: If `new_qty <= 0`, status changes to "consumed"
3. **Material progress updated**: `wo_materials.consumed_qty += consume_qty`
4. **Movement record created**: `lp_movements` with type "consumption"
5. **is_full_lp flag set**: `true` if `consume_qty == LP.qty` (04.6c)
6. **Genealogy record created**: Links parent LP to WO output

### On Reversal (POST /consume/reverse) - Story 04.6d

1. **LP quantity restored**: `current_qty = current_qty + reversed_qty`
2. **LP status restored**: If was "consumed", changes back to "available"
3. **Material progress updated**: `wo_materials.consumed_qty -= reversed_qty`
4. **Consumption marked**: `reversed=true, reversed_at, reversed_by, reason, notes`
5. **Movement record created**: `lp_movements` with type "consumption_reversal"
6. **Genealogy updated**: `is_reversed=true` on related lp_genealogy records
7. **Audit log created**: `activity_logs` with action "consumption_reversal"
8. **Reservation restored**: If had reservation, status set back to "reserved"

---

## Usage Examples

### Record Consumption (cURL)

```bash
curl -X POST /api/production/work-orders/abc123/consume \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "wo_material_id": "mat-uuid",
    "lp_id": "lp-uuid",
    "consume_qty": 40
  }'
```

### Record Full LP Consumption (1:1 Material)

```bash
# For consume_whole_lp=true materials, consume_qty MUST equal LP.qty
curl -X POST /api/production/work-orders/abc123/consume \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "wo_material_id": "mat-uuid-whole-lp",
    "lp_id": "lp-uuid",
    "consume_qty": 25
  }'
# This will succeed if LP.qty == 25
# This will return FULL_LP_REQUIRED if LP.qty != 25
```

### Reverse Consumption (cURL)

```bash
curl -X POST /api/production/work-orders/abc123/consume/reverse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "consumption_id": "cons-uuid",
    "reason": "scanned_wrong_lp"
  }'
```

### Record Consumption (TypeScript)

```typescript
import { recordConsumption } from '@/lib/services/consumption-service';

const result = await recordConsumption(woId, {
  wo_material_id: materialId,
  lp_id: lpId,
  consume_qty: 40,
});

console.log(`Consumed ${result.consumed_qty} from LP ${result.lp_number}`);
console.log(`Full LP: ${result.is_full_lp}`);
```

### Reverse Consumption (TypeScript)

```typescript
import { reverseConsumption } from '@/lib/services/consumption-service';

const result = await reverseConsumption(woId, {
  consumption_id: consumptionId,
  reason: 'scanned_wrong_lp',
});

console.log(`Reversed ${result.reversed_qty} - LP restored to ${result.lp_new_qty}`);
```

### Handle FULL_LP_REQUIRED Error (TypeScript)

```typescript
try {
  await recordConsumption(woId, {
    wo_material_id: materialId,
    lp_id: lpId,
    consume_qty: partialQty,
  });
} catch (error) {
  if (error.code === 'FULL_LP_REQUIRED') {
    // Show error to user
    toast.error(`Full LP consumption required. LP quantity is ${error.lp_qty}`);
    // Pre-fill input with LP qty
    setConsumeQty(error.lp_qty);
  }
}
```

### Fetch Materials with Progress

```typescript
import { getWOMaterials } from '@/lib/services/consumption-service';

const { materials, total } = await getWOMaterials(woId);

materials.forEach(m => {
  console.log(`${m.material_name}: ${m.consumed_qty}/${m.required_qty} (${m.progress_percent}%)`);
  if (m.consume_whole_lp) {
    console.log('  -> Full LP Required');
  }
});
```

---

## Performance Targets

| Metric | Target |
|--------|--------|
| LP validation response | < 500ms |
| Consumption recording | < 2s |
| Consumption reversal | < 2s |
| Materials table load | < 1s |
| Full LP validation | < 100ms (no additional DB queries) |

---

## Error Codes Reference

| Code | HTTP Status | Description | User Action |
|------|-------------|-------------|-------------|
| UNAUTHORIZED | 401 | Authentication required | Login required |
| FORBIDDEN | 403 | Insufficient permissions | Contact admin |
| WO_NOT_FOUND | 404 | Work order not found | Verify WO number |
| WO_NOT_IN_PROGRESS | 400 | WO not in valid status | Start WO first |
| MATERIAL_NOT_FOUND | 404 | Material not in WO | Check BOM |
| LP_NOT_FOUND | 400 | License plate not found | Rescan LP |
| LP_NOT_AVAILABLE | 400 | LP already consumed | Select different LP |
| LP_QA_HOLD | 400 | LP is on QA hold | Release from hold |
| LP_EXPIRED | 400 | LP has expired | Select different LP |
| PRODUCT_MISMATCH | 400 | LP product differs | Select correct LP |
| UOM_MISMATCH | 400 | LP UoM differs | Check LP/material UoM |
| INSUFFICIENT_QUANTITY | 400 | LP qty < requested | Reduce qty or select different LP |
| **FULL_LP_REQUIRED** | 400 | Material requires full LP | Enter full LP qty |
| INVALID_QUANTITY | 400 | Qty must be positive | Enter valid qty |
| ALREADY_REVERSED | 400 | Already reversed | No action needed |
| NOTES_REQUIRED_FOR_OTHER | 400 | Notes required for "other" | Add notes |
| CONSUMPTION_NOT_FOUND | 404 | Record not found | Refresh list |

---

## Related Documentation

- [Consumption Reversal API](./consumption-reversal.md) - Full reversal documentation (04.6d)
- [Component Guide: FullLPRequiredBadge](../../guides/production/consumption-components.md#fulllprequiredbadge)
- [Component Guide: ReverseConsumptionModal](../../guides/production/consumption-components.md#reverseconsumptionmodal)
- [Scanner Consumption API](./scanner-consumption-api.md)
- [Story 04.6a](../../../docs/2-MANAGEMENT/epics/current/04-production/04.6a.material-consumption-desktop.md)
- [Story 04.6c](../../../docs/2-MANAGEMENT/epics/current/04-production/04.6c.1-1-consumption-enforcement.md)
- [Story 04.6d](../../../docs/2-MANAGEMENT/epics/current/04-production/04.6d.consumption-correction.md)
- [License Plate API](../warehouse/license-plates.md)
