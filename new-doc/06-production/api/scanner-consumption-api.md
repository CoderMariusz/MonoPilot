# Scanner Consumption API Reference

**Story:** 04.6b - Material Consumption Scanner
**Version:** 1.0
**Last Updated:** 2026-01-21

## Overview

The Scanner Consumption API provides endpoints for mobile barcode scanning workflows to record material consumption during production. These APIs are optimized for industrial handheld scanners (Zebra, Honeywell) and mobile devices with response times under 500ms.

## Base URL

All endpoints are relative to your app base URL:

```
https://your-domain.com/api
```

## Authentication

All endpoints require authentication. Include your session token in the request headers (automatically handled by Supabase client).

**Required Roles:**
- `production_operator`
- `production_manager`
- `admin`
- `owner`

---

## Endpoints

### GET /api/production/work-orders/barcode/:barcode

Lookup a Work Order by its barcode (WO number) for scanner consumption workflow.

**Performance Target:** < 500ms response time

#### Request

```bash
curl -X GET https://your-domain.com/api/production/work-orders/barcode/WO-2026-0156 \
  -H "Content-Type: application/json"
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `barcode` | string | WO number (e.g., "WO-2026-0156") |

#### Response (200 OK)

```json
{
  "wo": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "wo_number": "WO-2026-0156",
    "product_name": "Chocolate Cookies",
    "product_sku": "CHOC-001",
    "planned_qty": 1000,
    "actual_qty": 0,
    "status": "in_progress",
    "line_name": "Line 1",
    "batch_number": "BATCH-2026-0123"
  },
  "materials": [
    {
      "id": "mat-001",
      "material_name": "Wheat Flour",
      "required_qty": 50.0,
      "consumed_qty": 20.0,
      "uom": "kg",
      "consume_whole_lp": false,
      "progress_percent": 40
    },
    {
      "id": "mat-002",
      "material_name": "Sugar",
      "required_qty": 25.0,
      "consumed_qty": 25.0,
      "uom": "kg",
      "consume_whole_lp": true,
      "progress_percent": 100
    }
  ]
}
```

#### Error Responses

**Status: 401 Unauthorized**

```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

**Status: 404 Not Found**

```json
{
  "error": "WO_NOT_FOUND",
  "message": "Work order with barcode WO-99999 not found"
}
```

**Note:** Returns 404 for inactive WOs (completed, cancelled). Only `in_progress` and `started` WOs are returned.

---

### GET /api/warehouse/license-plates/barcode/:barcode

Lookup a License Plate by its barcode with optional material validation.

**Performance Target:** < 300ms response time

#### Request

```bash
# Basic LP lookup
curl -X GET https://your-domain.com/api/warehouse/license-plates/barcode/LP-2026-01234 \
  -H "Content-Type: application/json"

# LP lookup with material validation
curl -X GET "https://your-domain.com/api/warehouse/license-plates/barcode/LP-2026-01234?material_id=mat-001" \
  -H "Content-Type: application/json"
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `barcode` | string | LP number (e.g., "LP-2026-01234") |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `material_id` | UUID | No | WO material ID to validate product/UoM match |

#### Response (200 OK)

```json
{
  "lp": {
    "id": "lp-001",
    "lp_number": "LP-2026-01234",
    "product_id": "prod-001",
    "product_name": "Wheat Flour",
    "quantity": 500,
    "uom": "kg",
    "batch_number": "BATCH-123",
    "expiry_date": "2026-12-31",
    "location_name": "Rack A-01",
    "status": "available"
  },
  "validation": {
    "is_available": true,
    "product_match": true,
    "uom_match": true,
    "error_code": null,
    "error_message": null
  }
}
```

#### Validation Errors (in response body)

When `material_id` is provided, validation is performed:

**Product Mismatch:**
```json
{
  "lp": { ... },
  "validation": {
    "is_available": true,
    "product_match": false,
    "uom_match": true,
    "error_code": "PRODUCT_MISMATCH",
    "error_message": "Product mismatch: LP contains Sugar, material requires Wheat Flour"
  }
}
```

**UoM Mismatch:**
```json
{
  "validation": {
    "is_available": true,
    "product_match": true,
    "uom_match": false,
    "error_code": "UOM_MISMATCH",
    "error_message": "UOM mismatch: LP has L, material requires kg"
  }
}
```

**LP Not Available:**
```json
{
  "validation": {
    "is_available": false,
    "product_match": true,
    "uom_match": true,
    "error_code": "LP_NOT_AVAILABLE",
    "error_message": "License plate is not available (status: consumed)"
  }
}
```

#### Error Responses

**Status: 401 Unauthorized**

```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

**Status: 404 Not Found**

```json
{
  "error": "LP_NOT_FOUND",
  "message": "License plate with barcode LP-99999 not found"
}
```

---

### POST /api/production/work-orders/:woId/consume

Record material consumption from a License Plate.

**Performance Target:** < 2000ms response time (including LP update)

#### Request

```bash
curl -X POST https://your-domain.com/api/production/work-orders/wo-001/consume \
  -H "Content-Type: application/json" \
  -d '{
    "wo_material_id": "mat-001",
    "lp_id": "lp-001",
    "consume_qty": 50.5,
    "notes": "Batch consumption"
  }'
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `woId` | UUID | Work Order ID |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `wo_material_id` | UUID | Yes | WO material/BOM item ID |
| `lp_id` | UUID | Yes | License Plate ID |
| `consume_qty` | number | Yes | Quantity to consume |
| `notes` | string | No | Optional consumption notes |

#### Response (201 Created)

```json
{
  "consumption": {
    "id": "cons-001",
    "consumed_qty": 50.5,
    "consumed_at": "2026-01-21T10:30:00Z"
  },
  "lp_updated": {
    "id": "lp-001",
    "new_qty": 449.5,
    "new_status": "available"
  },
  "material_progress": {
    "consumed": 70.5,
    "required": 100,
    "percentage": 71
  }
}
```

#### Error Responses

**Status: 400 Bad Request - Validation Errors**

| Error Code | Description |
|------------|-------------|
| `INVALID_QUANTITY` | Quantity must be positive |
| `INSUFFICIENT_QUANTITY` | LP has less quantity than requested |
| `FULL_LP_REQUIRED` | Material requires full LP consumption |
| `PRODUCT_MISMATCH` | LP product differs from material requirement |
| `UOM_MISMATCH` | LP UoM differs from material requirement |
| `LP_NOT_AVAILABLE` | LP status is not available |
| `LP_QA_HOLD` | LP is on QA hold |
| `LP_EXPIRED` | LP is expired |
| `WO_NOT_IN_PROGRESS` | WO is not in valid status for consumption |

**Example Error:**
```json
{
  "error": "Insufficient quantity: LP has 30, requested 50",
  "code": "INSUFFICIENT_QUANTITY"
}
```

**Status: 401 Unauthorized**

```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

**Status: 403 Forbidden**

```json
{
  "error": "Insufficient permissions",
  "code": "FORBIDDEN"
}
```

**Status: 404 Not Found**

```json
{
  "error": "Work order not found",
  "code": "WO_NOT_FOUND"
}
```

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient role permissions |
| `WO_NOT_FOUND` | 404 | Work order not found or inactive |
| `WO_NOT_ACTIVE` | 400 | Work order is not in active status |
| `WO_NOT_IN_PROGRESS` | 400 | Cannot consume when WO is not in progress |
| `MATERIAL_NOT_FOUND` | 404 | WO material/BOM item not found |
| `LP_NOT_FOUND` | 404 | License plate not found |
| `LP_NOT_AVAILABLE` | 400 | LP status is not available |
| `LP_QA_HOLD` | 400 | LP is on QA hold |
| `LP_EXPIRED` | 400 | LP expiry date has passed |
| `PRODUCT_MISMATCH` | 400 | LP product differs from material |
| `UOM_MISMATCH` | 400 | LP UoM differs from material |
| `INSUFFICIENT_QUANTITY` | 400 | LP quantity less than requested |
| `FULL_LP_REQUIRED` | 400 | Material requires full LP consumption |
| `INVALID_QUANTITY` | 400 | Quantity must be positive |

---

## Code Examples

### TypeScript/React

```typescript
import { useState } from 'react'

// Scan WO barcode
async function scanWOBarcode(barcode: string) {
  const response = await fetch(
    `/api/production/work-orders/barcode/${encodeURIComponent(barcode)}`
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'WO not found')
  }

  return response.json()
}

// Scan LP barcode with material validation
async function scanLPBarcode(barcode: string, materialId?: string) {
  const url = new URL(`/api/warehouse/license-plates/barcode/${barcode}`, window.location.origin)
  if (materialId) {
    url.searchParams.set('material_id', materialId)
  }

  const response = await fetch(url.toString())
  const data = await response.json()

  // Check validation result
  if (data.validation?.error_code) {
    throw new Error(data.validation.error_message)
  }

  return data
}

// Record consumption
async function recordConsumption(
  woId: string,
  materialId: string,
  lpId: string,
  quantity: number
) {
  const response = await fetch(`/api/production/work-orders/${woId}/consume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wo_material_id: materialId,
      lp_id: lpId,
      consume_qty: quantity,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Consumption failed')
  }

  return response.json()
}
```

### Using the Scanner Hook

```typescript
import { useScannerFlow } from '@/lib/hooks/use-scanner-flow'

function ConsumptionScanner() {
  const {
    state,
    step,
    woData,
    lpData,
    consumeQty,
    handleWOScan,
    handleLPScan,
    setConsumeQty,
    handleFullConsumption,
    proceedToReview,
    submitConsumption,
  } = useScannerFlow()

  // Handle barcode input
  const onBarcodeScanned = async (barcode: string) => {
    if (state === 'scan_wo') {
      const result = await scanWOBarcode(barcode)
      handleWOScan(result)
    } else if (state === 'scan_lp') {
      const result = await scanLPBarcode(barcode, woData?.materials[0]?.id)
      handleLPScan(result.lp)
    }
  }

  return (
    <div>
      <p>Current Step: {step} of 6</p>
      <p>State: {state}</p>
      {/* Render appropriate step component */}
    </div>
  )
}
```

---

## Scanner Workflow

The 6-step consumption flow:

```
Step 1: Scan WO Barcode
  GET /api/production/work-orders/barcode/:barcode
  -> Display WO info and materials list

Step 2: Scan LP Barcode
  GET /api/warehouse/license-plates/barcode/:barcode?material_id=X
  -> Validate product/UoM match

Step 3: Enter Quantity
  -> Number pad input or "Full Consumption" button

Step 4: Review
  -> Display consumption preview

Step 5: Confirm
  POST /api/production/work-orders/:woId/consume
  -> Process consumption

Step 6: Next Material or Done
  -> Return to Step 2 or exit
```

---

## Performance Guidelines

| Operation | Target | Actual |
|-----------|--------|--------|
| WO Barcode Lookup | < 500ms | ~200-300ms |
| LP Barcode Lookup | < 300ms | ~100-200ms |
| Consumption Record | < 2000ms | ~500-1000ms |

**Tips for optimal performance:**
- Use indexed barcode columns (wo_number, lp_number)
- RLS policies filter by org_id
- Batch multiple LP movements in single transaction

---

## Related Documentation

- [Material Consumption Desktop API](./material-consumption-api.md)
- [Scanner Components Guide](../../guides/production/scanner-consume-components.md)
- [FIFO/FEFO Picking Guide](../../guides/warehouse/fifo-fefo-picking.md)

---

## Support

**Story:** 04.6b
**Last Updated:** 2026-01-21
