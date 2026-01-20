# POST /api/planning/work-orders/availability-check

**Story:** 03.13
**Description:** Checks material availability for Work Order *creation* based on a Bill of Materials (BOM).

## Overview

This endpoint is used prior to creating a Work Order. It takes a `bom_id` and a `planned_quantity` to calculate the total material requirements and compares them against current inventory levels.

**Note:** The status thresholds for this endpoint differ from the standard WO Availability Panel:

*   **Green:** ≥ 120% coverage
*   **Yellow:** 100% - 119% coverage
*   **Red:** < 100% coverage

## Request

**Method:** `POST`
**URL:** `/api/planning/work-orders/availability-check`
**Content-Type:** `application/json`

### Body Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bom_id` | `string` (UUID) | Yes | The ID of the Bill of Materials to check. |
| `planned_quantity` | `number` | Yes | The intended output quantity for the Work Order. |

### Example Request

```bash
curl -X POST https://your-domain.com/api/planning/work-orders/availability-check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "bom_id": "123e4567-e89b-12d3-a456-426614174000",
    "planned_quantity": 500
  }'
```

## Response

### 200 OK

Returns an object containing the list of materials, their calculated status, and a summary.

```typescript
interface AvailabilityCheckResult {
  materials: MaterialAvailability[]
  summary: {
    total: number
    green: number
    yellow: number
    red: number
  }
  can_proceed: boolean
}

interface MaterialAvailability {
  product_id: string
  product_code: string
  product_name: string
  required_qty: number
  available_qty: number
  uom: string
  status: 'green' | 'yellow' | 'red'
  coverage_percent: number
}
```

### Example Response

```json
{
  "data": {
    "materials": [
      {
        "product_id": "uuid-1",
        "product_code": "MAT-001",
        "product_name": "Steel Sheet",
        "required_qty": 100.5,
        "available_qty": 150.0,
        "uom": "kg",
        "status": "green",
        "coverage_percent": 149
      }
    ],
    "summary": {
      "total": 1,
      "green": 1,
      "yellow": 0,
      "red": 0
    },
    "can_proceed": true
  }
}
```

## Error Responses

| Code | Description |
|------|-------------|
| `401` | Unauthorized (Session missing or invalid). |
| `400` | Bad Request (Missing `bom_id` or `planned_quantity`). |
| `404` | BOM not found. |
| `500` | Internal server error. |
