# Consumption Reversal API

**Story:** 04.6d - Consumption Correction (Reversal)
**Status:** DEPLOYED
**Module:** Production
**PRD Reference:** FR-PROD-009

## Overview

The Consumption Reversal API enables Managers and Admins to undo incorrect material consumptions. When a reversal is executed, the system atomically:

1. Restores LP quantity
2. Updates LP status (consumed -> available if applicable)
3. Marks the consumption as reversed with audit trail
4. Updates genealogy records
5. Creates audit log entries for compliance

## Base URL

```
/api/production/work-orders/{woId}/consume/reverse
```

## Authentication

Requires authentication via Supabase Auth. Include the session token in request headers.

## Authorization

| Role | Can Reverse |
|------|-------------|
| admin | Yes |
| owner | Yes |
| manager | Yes |
| production_manager | Yes |
| production_operator | No |
| warehouse_staff | No |
| planner | No |

## Endpoint

### POST /consume/reverse

Reverses a consumption record. Requires Manager/Admin role.

**Request Body:**

```json
{
  "consumption_id": "00000000-0000-0000-0000-000000000001",
  "reason": "scanned_wrong_lp",
  "notes": "Operator accidentally scanned LP from wrong pallet"
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| consumption_id | UUID | Yes | ID of consumption to reverse |
| reason | enum | Yes | Reversal reason code |
| notes | string | Conditional | Required when reason is "other", max 500 chars |

**Valid Reason Values:**

| Code | Label | Description |
|------|-------|-------------|
| scanned_wrong_lp | Scanned Wrong LP | Operator scanned incorrect License Plate |
| wrong_quantity | Wrong Quantity Entered | Incorrect quantity was entered during consumption |
| operator_error | Operator Error | General operator mistake |
| quality_issue | Quality Issue | Material quality problem discovered after consumption |
| other | Other (specify) | Other reason - requires notes field |

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
  ], {
    required_error: 'Reason for reversal is required',
  }),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
}).refine(
  (data) => data.reason !== 'other' || (data.notes && data.notes.trim().length > 0),
  {
    message: 'Notes are required when reason is "other"',
    path: ['notes'],
  }
);
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Consumption reversed successfully",
  "consumption_id": "00000000-0000-0000-0000-000000000001",
  "wo_id": "wo-uuid",
  "wo_number": "WO-2026-00001",
  "lp_id": "lp-uuid",
  "lp_number": "LP-001",
  "reversed_qty": 40,
  "lp_new_qty": 100,
  "lp_new_status": "available",
  "reversed_at": "2026-01-21T10:30:00Z",
  "reversed_by": "user-uuid",
  "reason": "scanned_wrong_lp",
  "uom": "kg",
  "product_name": "Sugar"
}
```

**Error Responses:**

| Status | Code | Message | When |
|--------|------|---------|------|
| 400 | ALREADY_REVERSED | This consumption has already been reversed | Consumption status is "reversed" |
| 400 | REASON_REQUIRED | Reason for reversal is required | reason field missing |
| 400 | NOTES_REQUIRED_FOR_OTHER | Notes are required when reason is "other" | reason="other" without notes |
| 400 | VALIDATION_ERROR | consumption_id is required | Invalid or missing consumption_id |
| 401 | UNAUTHORIZED | Unauthorized | No valid session |
| 403 | FORBIDDEN | Only Managers and Admins can reverse consumptions | User role not authorized |
| 404 | WO_NOT_FOUND | Work order not found | Invalid woId |
| 404 | CONSUMPTION_NOT_FOUND | Consumption not found | Invalid consumption_id or cross-org |
| 500 | REVERSAL_FAILED | Failed to reverse consumption | Database or transaction error |

---

## Transaction Flow

The reversal executes atomically. All steps complete or all rollback:

1. **Validate** - Check consumption exists, not already reversed, user has permission
2. **Update consumption** - Set reversed=true, reversed_at, reversed_by, reason, notes
3. **Restore LP qty** - current_qty = current_qty + consumed_qty
4. **Update LP status** - If was "consumed", change to "available"
5. **Update reservation** - Set status back to "reserved" if applicable
6. **Update wo_materials** - Subtract consumed_qty from material progress
7. **Update genealogy** - Set is_reversed=true on lp_genealogy records
8. **Create lp_movement** - Record with type="consumption_reversal"
9. **Create audit log** - Activity log with action="consumption_reversal"

---

## Database Updates

### wo_consumption Table

```sql
UPDATE wo_consumption SET
  status = 'reversed',
  reversed = true,
  reversed_at = NOW(),
  reversed_by = 'user-uuid',
  reversed_by_user_id = 'user-uuid',
  reversal_reason = 'scanned_wrong_lp',
  reverse_reason = 'scanned_wrong_lp',
  reversal_notes = 'optional notes'
WHERE id = 'consumption-uuid';
```

### license_plates Table

```sql
UPDATE license_plates SET
  current_qty = current_qty + 40,  -- restored qty
  status = 'available',            -- if was 'consumed'
  consumed_by_wo_id = NULL,
  consumed_at = NULL,
  updated_at = NOW()
WHERE id = 'lp-uuid';
```

### wo_materials Table

```sql
UPDATE wo_materials SET
  consumed_qty = consumed_qty - 40,  -- subtract reversed qty
  updated_at = NOW()
WHERE id = 'material-uuid';
```

### lp_genealogy Table

```sql
UPDATE lp_genealogy SET
  is_reversed = true,
  status = 'reversed',
  reversed_at = NOW(),
  reversed_by = 'user-uuid',
  reverse_reason = 'scanned_wrong_lp'
WHERE parent_lp_id = 'lp-uuid'
  AND work_order_id = 'wo-uuid'
  AND wo_material_reservation_id = 'reservation-uuid';
```

### lp_movements Table (Insert)

```sql
INSERT INTO lp_movements (
  org_id, lp_id, movement_type, qty_change,
  qty_before, qty_after, uom, wo_id,
  consumption_id, created_by_user_id, notes
) VALUES (
  'org-uuid', 'lp-uuid', 'consumption_reversal', 40,
  60, 100, 'kg', 'wo-uuid',
  'consumption-uuid', 'user-uuid',
  'Consumption reversal for WO WO-2026-00001. Reason: scanned_wrong_lp'
);
```

### activity_logs Table (Insert)

```sql
INSERT INTO activity_logs (
  org_id, user_id, action, entity_type,
  entity_id, entity_code, description
) VALUES (
  'org-uuid', 'user-uuid', 'consumption_reversal', 'wo_consumption',
  'consumption-uuid', 'WO-2026-00001',
  'Reversed consumption of 40 kg of Sugar. Reason: Scanned Wrong LP'
);
```

---

## Usage Examples

### Reverse Consumption (cURL)

```bash
curl -X POST /api/production/work-orders/wo-uuid/consume/reverse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "consumption_id": "00000000-0000-0000-0000-000000000001",
    "reason": "scanned_wrong_lp"
  }'
```

### Reverse with Custom Reason (cURL)

```bash
curl -X POST /api/production/work-orders/wo-uuid/consume/reverse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "consumption_id": "00000000-0000-0000-0000-000000000001",
    "reason": "other",
    "notes": "Material was recalled by supplier - batch contamination"
  }'
```

### Reverse Consumption (TypeScript)

```typescript
import { reverseConsumption } from '@/lib/services/consumption-service';

const result = await reverseConsumption(woId, {
  consumption_id: consumptionId,
  reason: 'scanned_wrong_lp',
});

console.log(`Reversed ${result.reversed_qty} ${result.uom} from ${result.lp_number}`);
console.log(`LP restored to ${result.lp_new_qty} ${result.uom}`);
```

### Using the Hook (React)

```typescript
import { useReverseConsumption } from '@/lib/hooks/use-consumption';

function ReversalButton({ woId, consumptionId }) {
  const reverseConsumption = useReverseConsumption();

  const handleReverse = async () => {
    await reverseConsumption.mutateAsync({
      woId,
      request: {
        consumption_id: consumptionId,
        reason: 'operator_error',
        notes: 'Wrong LP selected during shift change',
      },
    });
  };

  return (
    <Button
      onClick={handleReverse}
      disabled={reverseConsumption.isPending}
    >
      {reverseConsumption.isPending ? 'Reversing...' : 'Reverse'}
    </Button>
  );
}
```

---

## Multi-Tenancy

The API enforces org_id isolation:

- Work order must belong to user's organization
- Attempting to reverse consumption from different org returns 404 (not 403)
- This prevents information leakage about resources in other tenants

---

## Security Considerations

1. **Role-Based Access**: RLS and API both enforce Manager/Admin only
2. **Audit Trail**: All reversals logged with actor, timestamp, reason
3. **Immutable Logs**: Audit entries cannot be deleted or modified
4. **Transaction Integrity**: Atomic operations ensure data consistency
5. **Cross-Tenant Protection**: 404 response prevents org enumeration

---

## Related Documentation

- [Material Consumption API](./material-consumption.md)
- [Consumption Components Guide](../../guides/production/consumption-components.md)
- [Story 04.6d](../../2-MANAGEMENT/epics/current/04-production/04.6d.consumption-correction.md)
- [License Plate API](../warehouse/license-plates.md)
