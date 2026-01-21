# Material Reservations API

**Story:** 04.8 - Material Reservations
**Status:** DEPLOYED
**Module:** Production
**Last Updated:** 2026-01-21

## Overview

The Material Reservations API enables reserving License Plates (LPs) for Work Order materials before consumption. It prevents allocation conflicts when multiple Work Orders compete for the same inventory and provides full traceability through the lp_genealogy table.

**Key Features:**
- Reserve specific LPs for WO materials
- FIFO/FEFO picking suggestions
- Multi-LP reservation for large requirements
- Auto-release on WO completion
- Over-reservation warnings
- Concurrency handling with optimistic locking

## Base URL

```
/api/production/work-orders/{woId}
```

## Authentication

All endpoints require authentication via Supabase Auth. Include the session token in the request headers.

## Authorization

| Endpoint | Allowed Roles |
|----------|---------------|
| GET /materials/reservations | owner, admin, manager, operator, planner |
| POST /materials/reserve | owner, admin, manager, operator |
| DELETE /materials/reservations/{id} | owner, admin, manager, operator |
| GET /materials/{materialId}/available-lps | owner, admin, manager, operator, planner |

---

## Endpoints

### GET /materials/reservations

Returns all materials for a work order with their reservation status and progress.

**Response (200 OK):**

```json
{
  "materials": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "material_name": "Wheat Flour",
      "required_qty": 100,
      "reserved_qty": 80,
      "consumed_qty": 40,
      "uom": "kg",
      "consume_whole_lp": false,
      "reservations": [
        {
          "id": "uuid",
          "lp_id": "uuid",
          "lp_number": "LP-2026-00123",
          "reserved_qty": 50,
          "sequence_number": 1,
          "status": "reserved",
          "reserved_at": "2026-01-21T10:30:00Z",
          "reserved_by_user": {
            "id": "uuid",
            "name": "John Doe"
          }
        },
        {
          "id": "uuid",
          "lp_id": "uuid",
          "lp_number": "LP-2026-00124",
          "reserved_qty": 30,
          "sequence_number": 2,
          "status": "reserved",
          "reserved_at": "2026-01-21T10:35:00Z",
          "reserved_by_user": {
            "id": "uuid",
            "name": "John Doe"
          }
        }
      ]
    }
  ]
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Authentication required |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | WO_NOT_FOUND | Work order not found |

---

### POST /materials/reserve

Creates a reservation for a License Plate against a WO material.

**Request Body:**

```json
{
  "material_id": "uuid",
  "lp_id": "uuid",
  "reserved_qty": 50,
  "notes": "optional notes"
}
```

**Validation Schema (Zod):**

```typescript
const reserveMaterialSchema = z.object({
  material_id: z.string().uuid('Invalid material ID'),
  lp_id: z.string().uuid('Invalid LP ID'),
  reserved_qty: z.number().positive('Quantity must be positive'),
  notes: z.string().max(500).optional(),
});
```

**Response (201 Created):**

```json
{
  "id": "uuid",
  "wo_id": "uuid",
  "material_id": "uuid",
  "material_name": "Wheat Flour",
  "lp_id": "uuid",
  "lp_number": "LP-2026-00123",
  "reserved_qty": 50,
  "uom": "kg",
  "sequence_number": 1,
  "status": "reserved",
  "reserved_at": "2026-01-21T10:30:00Z",
  "reserved_by_user": {
    "id": "uuid",
    "name": "John Doe"
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | LP_NOT_FOUND | License plate not found |
| 400 | PRODUCT_MISMATCH | LP product does not match material |
| 400 | UOM_MISMATCH | LP UoM does not match material UoM |
| 400 | INSUFFICIENT_QTY | Requested qty exceeds LP available qty |
| 400 | LP_ALREADY_RESERVED | LP already reserved for this WO |
| 400 | WO_NOT_IN_PROGRESS | WO must be in_progress to reserve |
| 400 | CONSUME_WHOLE_LP_VIOLATION | Material requires full LP reservation |
| 400 | MATERIAL_NOT_IN_BOM | Material not found in WO BOM |
| 400 | CONCURRENCY_ERROR | Modified by another user, retry |
| 403 | FORBIDDEN | Insufficient permissions |
| 403 | ORG_ISOLATION | Access denied (wrong organization) |
| 404 | WO_NOT_FOUND | Work order not found |

---

### DELETE /materials/reservations/{reservationId}

Releases a reservation, returning the LP to available status.

**Response (200 OK):**

```json
{
  "material_id": "uuid",
  "material_name": "Wheat Flour",
  "reserved_qty": 50,
  "lp_id": "uuid",
  "lp_number": "LP-2026-00123"
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Cannot unreserve: status is not reserved |
| 403 | FORBIDDEN | Insufficient permissions |
| 403 | ORG_ISOLATION | Access denied |
| 404 | RESERVATION_NOT_FOUND | Reservation not found |

---

### GET /materials/{materialId}/available-lps

Returns available LPs for a specific material, sorted by FIFO or FEFO strategy.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| search | string | - | Filter by LP number (partial match) |
| strategy | string | "fifo" | Picking strategy: fifo, fefo |
| limit | number | 50 | Max results to return |

**Response (200 OK):**

```json
{
  "lps": [
    {
      "id": "uuid",
      "lp_number": "LP-2026-00123",
      "quantity": 100,
      "current_qty": 80,
      "uom": "kg",
      "expiry_date": "2026-06-30",
      "location_name": "WH-01 / Zone-A / Rack-1",
      "suggested": true,
      "suggestion_reason": "FIFO: oldest available"
    },
    {
      "id": "uuid",
      "lp_number": "LP-2026-00124",
      "quantity": 50,
      "current_qty": 50,
      "uom": "kg",
      "expiry_date": "2026-08-15",
      "location_name": "WH-01 / Zone-A / Rack-2",
      "suggested": false
    }
  ],
  "total": 5,
  "strategy": "fifo"
}
```

---

## FIFO vs FEFO Picking

### FIFO (First In, First Out)

Suggests the oldest LP first, based on `created_at` timestamp.

**Use Cases:**
- Non-perishable materials
- No expiry date tracked
- Default warehouse setting

**Sorting:** `ORDER BY created_at ASC`

**Example Request:**
```bash
curl -X GET "/api/production/work-orders/wo-123/materials/mat-456/available-lps?strategy=fifo" \
  -H "Authorization: Bearer $TOKEN"
```

### FEFO (First Expired, First Out)

Suggests the LP with the nearest expiry date first.

**Use Cases:**
- Perishable ingredients
- Materials with shelf life
- Quality-sensitive products

**Sorting:** `ORDER BY expiry_date ASC NULLS LAST, created_at ASC`

**Example Request:**
```bash
curl -X GET "/api/production/work-orders/wo-123/materials/mat-456/available-lps?strategy=fefo" \
  -H "Authorization: Bearer $TOKEN"
```

### Violation Warning

When a user selects an LP that violates the picking strategy, the API returns a warning (but does not block):

```json
{
  "warning": {
    "type": "fifo_violation",
    "message": "FIFO violation: LP-2026-00124 is newer than suggested LP-2026-00123",
    "suggested_lp": "LP-2026-00123",
    "selected_lp": "LP-2026-00124"
  }
}
```

---

## Over-Reservation Handling

When the total reserved quantity exceeds the required quantity, a warning is returned:

**Example Scenario:**
- Required qty: 100 kg
- Already reserved: 80 kg
- User attempts to reserve: 30 kg
- Total would be: 110 kg (10% over)

**Warning Response:**

```json
{
  "reservation": { ... },
  "warning": {
    "type": "over_reservation",
    "message": "Total reserved (110 kg) exceeds required (100 kg) by 10%",
    "required_qty": 100,
    "total_reserved": 110,
    "over_qty": 10,
    "over_percent": 10
  }
}
```

The reservation is created but the warning is returned to alert the user.

---

## Auto-Release Behavior

Reservations are automatically released when:

1. **WO is cancelled**: All reservations released, LPs return to "available"
2. **WO is completed**: Unused reservations (reserved_qty > consumed_qty) released
3. **Reservation consumed**: When material is consumed, reservation status changes to "consumed"

**Manual Release:**
Use `DELETE /materials/reservations/{id}` to manually release before consumption.

---

## Database Schema

### wo_material_reservations Table

```sql
CREATE TABLE wo_material_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  wo_id UUID NOT NULL REFERENCES work_orders(id),
  material_id UUID NOT NULL REFERENCES wo_materials(id),
  lp_id UUID NOT NULL REFERENCES license_plates(id),

  reserved_qty DECIMAL(15,6) NOT NULL CHECK (reserved_qty > 0),
  uom TEXT NOT NULL,
  sequence_number INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'reserved' CHECK (status IN ('reserved', 'consumed', 'released')),

  reserved_by_user_id UUID REFERENCES users(id),
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_wo_lp_reservation UNIQUE (wo_id, lp_id, status)
);
```

### Indexes

```sql
CREATE INDEX idx_reservation_org ON wo_material_reservations(org_id);
CREATE INDEX idx_reservation_wo ON wo_material_reservations(wo_id);
CREATE INDEX idx_reservation_lp ON wo_material_reservations(lp_id);
CREATE INDEX idx_reservation_material ON wo_material_reservations(material_id);
CREATE INDEX idx_reservation_status ON wo_material_reservations(status);
CREATE INDEX idx_reservation_active ON wo_material_reservations(wo_id) WHERE status = 'reserved';
```

### lp_genealogy Integration

When a reservation is created, an lp_genealogy record is created:

```sql
INSERT INTO lp_genealogy (
  parent_lp_id,           -- LP being reserved
  child_lp_id,            -- NULL until output registration
  relationship_type,      -- 'production'
  work_order_id,          -- WO ID
  quantity_from_parent,   -- reserved_qty
  uom,
  wo_material_reservation_id,
  reserved_at,
  reserved_by_user_id,
  created_by
)
```

---

## Side Effects

### On Reservation (POST /materials/reserve)

1. **LP status updated**: `status = 'reserved'`
2. **Reservation record created**: `wo_material_reservations` row inserted
3. **Genealogy record created**: `lp_genealogy` row for traceability
4. **Sequence number assigned**: Auto-increment per material

### On Release (DELETE /materials/reservations/{id})

1. **LP status restored**: `status = 'available'`
2. **Reservation deleted**: Row removed from `wo_material_reservations`
3. **Genealogy deleted**: Related `lp_genealogy` row removed

---

## Usage Examples

### Reserve LP (cURL)

```bash
curl -X POST /api/production/work-orders/wo-123/materials/reserve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "material_id": "mat-uuid",
    "lp_id": "lp-uuid",
    "reserved_qty": 50
  }'
```

### Reserve LP (TypeScript)

```typescript
import { MaterialReservationService } from '@/lib/services/material-reservation-service';

const service = new MaterialReservationService(supabase);

const result = await service.reserveMaterial({
  woId: 'wo-123',
  materialId: 'mat-456',
  lpId: 'lp-789',
  reservedQty: 50,
  userId: currentUserId,
  orgId: currentOrgId,
}, userRole);

if (result.error) {
  switch (result.error.code) {
    case 'LP_ALREADY_RESERVED':
      toast.error('This LP is already reserved for this WO');
      break;
    case 'INSUFFICIENT_QTY':
      toast.error(result.error.message);
      break;
    case 'CONSUME_WHOLE_LP_VIOLATION':
      toast.error(result.error.message);
      break;
    default:
      toast.error('Failed to reserve LP');
  }
} else {
  toast.success(`Reserved ${result.data.reserved_qty} ${result.data.uom}`);
}
```

### Release Reservation (TypeScript)

```typescript
const result = await service.unreserveMaterial({
  reservationId: 'res-123',
  woId: 'wo-456',
  userId: currentUserId,
  orgId: currentOrgId,
}, userRole);

if (result.error) {
  toast.error(result.error.message);
} else {
  toast.success(`Released ${result.data.lp_number}`);
}
```

### Get Available LPs with FEFO Strategy

```typescript
const result = await service.searchAvailableLPs(
  productId,
  'kg',
  orgId,
  searchQuery
);

// LPs sorted by expiry_date ASC
result.data?.forEach(lp => {
  console.log(`${lp.lp_number}: ${lp.current_qty}${lp.uom} expires ${lp.expiry_date}`);
});
```

---

## Error Codes Reference

| Code | HTTP Status | Description | User Action |
|------|-------------|-------------|-------------|
| UNAUTHORIZED | 401 | Authentication required | Login required |
| FORBIDDEN | 403 | Insufficient permissions | Contact admin |
| ORG_ISOLATION | 403 | Wrong organization | Check WO access |
| WO_NOT_FOUND | 404 | Work order not found | Verify WO number |
| WO_NOT_IN_PROGRESS | 400 | WO not in valid status | Start WO first |
| MATERIAL_NOT_IN_BOM | 400 | Material not in WO | Check BOM |
| LP_NOT_FOUND | 400 | License plate not found | Rescan LP |
| LP_ALREADY_RESERVED | 400 | LP reserved for this WO | Select different LP |
| PRODUCT_MISMATCH | 400 | LP product differs | Select correct LP |
| UOM_MISMATCH | 400 | LP UoM differs | Check LP/material UoM |
| INSUFFICIENT_QTY | 400 | LP qty < requested | Reduce qty or select different LP |
| CONSUME_WHOLE_LP_VIOLATION | 400 | Must reserve full LP | Enter full LP qty |
| CONCURRENCY_ERROR | 400 | Modified by another user | Retry operation |
| RESERVATION_NOT_FOUND | 404 | Reservation not found | Refresh list |
| VALIDATION_ERROR | 400 | Input validation failed | Check input data |

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Get materials with reservations | < 500ms |
| Create reservation | < 1s |
| Release reservation | < 500ms |
| Search available LPs | < 500ms |

---

## Troubleshooting

### LP shows as unavailable but has quantity

**Cause:** LP status is 'reserved' by another WO or 'consumed'.

**Solution:** Check `license_plates.status` - must be 'available'. Query `wo_material_reservations` to find existing reservations.

### Cannot reserve - CONSUME_WHOLE_LP_VIOLATION

**Cause:** Material has `consume_whole_lp=true` but reservation qty differs from LP qty.

**Solution:** Reserve the exact LP quantity. For 25kg LP, reserve exactly 25kg.

### CONCURRENCY_ERROR on reservation

**Cause:** Another user reserved the same LP concurrently.

**Solution:** Refresh LP list and try a different LP or wait and retry.

### Reservation not visible after creation

**Cause:** RLS policy filtering or status already changed.

**Solution:** Ensure user has correct org_id and role. Check reservation status.

---

## Related Documentation

- [LP Reservations API (Warehouse)](../warehouse/lp-reservations-api.md)
- [Material Consumption API](./material-consumption.md)
- [Reservation Workflow Guide](../../guides/production/reservation-workflow.md)
- [FIFO/FEFO Picking Guide](../../guides/warehouse/fifo-fefo-picking.md)
- [LP Genealogy Tracking](../lp-genealogy-tracking.md)
