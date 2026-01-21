# Output Registration API

**Story:** 04.7a - Output Registration Desktop
**Status:** DEPLOYED
**Module:** Production
**Last Updated:** 2026-01-21

## Overview

The Output Registration API enables recording production output from work orders. When output is registered:

1. A new License Plate (LP) is created with `source='production'`
2. Genealogy records link consumed materials to the output LP
3. Work order progress is updated (output_qty, progress_percent)
4. Yield metrics are calculated

## Base URL

```
/api/production/work-orders/{woId}
```

## Authentication

All endpoints require authentication via Supabase Auth. Include the session token in request headers.

## Authorization

| Endpoint | Allowed Roles |
|----------|---------------|
| GET /outputs | owner, admin, production_manager, production_operator, planner |
| POST /outputs | owner, admin, production_manager, production_operator |
| GET /outputs/export | owner, admin, production_manager |
| GET /by-products | owner, admin, production_manager, production_operator |
| POST /by-products | owner, admin, production_manager, production_operator |

---

## Endpoints

### POST /outputs

Registers a production output, creating a License Plate and genealogy records.

**Request Body:**

```json
{
  "qty": 500,
  "qa_status": "approved",
  "location_id": "uuid",
  "notes": "optional notes",
  "is_over_production": false,
  "over_production_parent_lp_id": null
}
```

**Validation Schema (Zod):**

```typescript
const registerOutputSchema = z.object({
  wo_id: z.string().uuid('Invalid work order ID'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  uom: z.string().min(1, 'Unit of measure is required'),
  batch_number: z.string().min(1, 'Batch number is required').max(50),
  qa_status: z.enum(['approved', 'pending', 'rejected']).optional(),
  location_id: z.string().uuid('Invalid location'),
  expiry_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid expiry date',
  }),
  notes: z.string().max(500).optional(),
});
```

**Response (200 OK):**

```json
{
  "data": {
    "output": {
      "id": "uuid",
      "lp_id": "uuid",
      "lp_number": "LP-WO-2025-0001-M2ABC123",
      "quantity": 500
    },
    "consumptionRecords": [
      { "id": "uuid", "lpId": "uuid", "qty": 100 },
      { "id": "uuid", "lpId": "uuid", "qty": 50 }
    ],
    "genealogyRecords": 2,
    "warnings": []
  },
  "message": "Output registered successfully"
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | WO_NOT_IN_PROGRESS | Work order must be in_progress status |
| 400 | INVALID_QTY | Output quantity must be > 0 |
| 400 | QA_STATUS_REQUIRED | QA status is required (if setting enabled) |
| 404 | NOT_FOUND | Work order not found |
| 409 | OVER_CONSUMPTION_DENIED | Over-consumption requires confirmation |

---

### GET /outputs

Returns output history for a work order with pagination and filtering.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number (1-indexed) |
| limit | number | 20 | Items per page (max 100) |
| qa_status | string | - | Filter: approved, pending, rejected |
| location_id | string | - | Filter by location UUID |
| sort | string | "created_at" | Sort by: created_at, qty, lp_number |
| order | string | "desc" | Sort order: asc, desc |

**Response (200 OK):**

```json
{
  "data": {
    "outputs": [
      {
        "id": "uuid",
        "lp_id": "uuid",
        "lp_number": "LP-WO-2025-0001-M2ABC123",
        "quantity": 500,
        "uom": "kg",
        "batch_number": "WO-2025-0001",
        "qa_status": "approved",
        "location_id": "uuid",
        "location_name": "Warehouse A - Zone 1",
        "expiry_date": "2025-04-21",
        "created_at": "2026-01-21T10:30:00Z",
        "created_by_name": "John Doe"
      }
    ],
    "summary": {
      "total_outputs": 5,
      "total_qty": 2500,
      "approved_count": 4,
      "approved_qty": 2000,
      "pending_count": 1,
      "pending_qty": 500,
      "rejected_count": 0,
      "rejected_qty": 0
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

---

### GET /outputs/export

Exports output history as CSV file.

**Response (200 OK):**

Returns `text/csv` content with headers:

```csv
LP Number,Quantity,UoM,Batch,QA Status,Location,Expiry Date,Created At
LP-WO-2025-0001-M2ABC123,500,kg,WO-2025-0001,approved,Warehouse A,2025-04-21,2026-01-21T10:30:00Z
```

---

### GET /by-products

Returns by-products defined in BOM with registration status.

**Response (200 OK):**

```json
{
  "by_products": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "product_name": "Wheat Germ",
      "product_code": "WG-001",
      "yield_percent": 5,
      "expected_qty": 50,
      "actual_qty": 45,
      "uom": "kg",
      "status": "registered"
    },
    {
      "id": "uuid",
      "product_id": "uuid",
      "product_name": "Wheat Bran",
      "product_code": "WB-001",
      "yield_percent": 10,
      "expected_qty": 100,
      "actual_qty": 0,
      "uom": "kg",
      "status": "pending"
    }
  ]
}
```

---

### POST /by-products

Registers a by-product output.

**Request Body:**

```json
{
  "main_output_lp_id": "uuid",
  "by_product_id": "uuid",
  "quantity": 45,
  "uom": "kg",
  "batch_number": "WO-2025-0001-BP-WG001",
  "qa_status": "approved",
  "location_id": "uuid",
  "expiry_date": "2025-04-21"
}
```

**Response (200 OK):**

```json
{
  "lp": {
    "id": "uuid",
    "lp_number": "LP-BP-WO-2025-0001-ABC123",
    "quantity": 45,
    "source": "production",
    "wo_id": "uuid"
  },
  "genealogy": {
    "parent_lps": [
      { "lp_id": "uuid", "lp_number": "LP-001", "qty_consumed": 100 }
    ],
    "child_lp_id": "uuid"
  }
}
```

---

## Validation Schemas

### Register Output Schema

```typescript
import { z } from 'zod';

export const registerOutputSchema = z.object({
  wo_id: z.string().uuid('Invalid work order ID'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  uom: z.string().min(1, 'Unit of measure is required'),
  batch_number: z.string().min(1, 'Batch number is required').max(50),
  qa_status: z.enum(['approved', 'pending', 'rejected']).optional(),
  location_id: z.string().uuid('Invalid location'),
  expiry_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid expiry date',
  }),
  notes: z.string().max(500).optional(),
});
```

### Register By-Product Schema

```typescript
export const registerByProductSchema = z.object({
  wo_id: z.string().uuid(),
  main_output_lp_id: z.string().uuid(),
  by_product_id: z.string().uuid(),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  uom: z.string().min(1),
  batch_number: z.string().min(1).max(50),
  qa_status: z.enum(['approved', 'pending', 'rejected']).optional(),
  location_id: z.string().uuid(),
  expiry_date: z.string(),
  notes: z.string().max(500).optional(),
});
```

### Dynamic QA Validation

```typescript
export const createOutputSchemaWithSettings = (requireQA: boolean) => {
  if (requireQA) {
    return registerOutputSchema.extend({
      qa_status: z.enum(['approved', 'pending', 'rejected'], {
        required_error: 'QA status is required',
      }),
    });
  }
  return registerOutputSchema;
};
```

---

## Side Effects

### On Output Registration (POST /outputs)

1. **LP created**: `source='production'`, `wo_id` linked
2. **Expiry date calculated**: `today + product.shelf_life_days`
3. **Batch number assigned**: From WO or custom input
4. **Genealogy records created**: Links consumed LPs as parents
5. **WO updated**: `output_qty`, `progress_percent`
6. **LP movement created**: Type "production_output"

### On By-Product Registration

1. **LP created**: Same as main output
2. **Genealogy links**: Same parent LPs as main output
3. **WO material updated**: `by_product_registered_qty`

---

## Usage Examples

### Register Output (cURL)

```bash
curl -X POST /api/production/work-orders/abc123/outputs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "qty": 500,
    "qa_status": "approved",
    "location_id": "loc-uuid"
  }'
```

### Register Output (TypeScript)

```typescript
import { registerOutput } from '@/lib/services/output-service';

const result = await registerOutput({
  wo_id: woId,
  quantity: 500,
  uom: 'kg',
  batch_number: 'WO-2025-0001',
  qa_status: 'approved',
  location_id: locationId,
  expiry_date: '2025-04-21',
}, userId, orgId);

console.log(`Created LP: ${result.lp.lp_number}`);
console.log(`Genealogy records: ${result.genealogy.parent_lps.length}`);
```

### Fetch Outputs with Pagination

```typescript
const response = await fetch(
  `/api/production/work-orders/${woId}/outputs?page=1&limit=20&qa_status=approved`,
  { headers: { Authorization: `Bearer ${token}` } }
);
const { data } = await response.json();

console.log(`Total: ${data.summary.total_qty} ${data.outputs[0]?.uom}`);
```

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Output registration | < 2s |
| Output list (20 items) | < 1s |
| CSV export (100 items) | < 3s |
| By-product registration | < 2s |

---

## Error Codes Reference

| Code | HTTP Status | Description | User Action |
|------|-------------|-------------|-------------|
| UNAUTHORIZED | 401 | Authentication required | Login required |
| NOT_FOUND | 404 | Work order not found | Verify WO ID |
| WO_NOT_IN_PROGRESS | 400 | WO not in valid status | Start WO first |
| INVALID_QTY | 400 | Quantity must be > 0 | Enter valid quantity |
| QA_STATUS_REQUIRED | 400 | QA status required | Select QA status |
| LP_CREATION_FAILED | 500 | Failed to create LP | Retry operation |
| OVER_CONSUMPTION_DENIED | 409 | Over-consumption detected | Confirm or adjust |
| MISSING_PARENT_LP | 400 | Over-production needs parent LP | Select parent LP |

---

## Related Documentation

- [Yield Calculation Guide](./yield-calculation.md)
- [Genealogy Linking Guide](./genealogy-linking.md)
- [Component Guide: RegisterOutputModal](../../guides/production/output-components.md)
- [Material Consumption API](./material-consumption.md)
