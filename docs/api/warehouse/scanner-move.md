# Scanner Move API Reference

**Story:** 05.20 - Scanner Move Workflow
**Version:** 1.0
**Last Updated:** 2026-01-21

## Overview

The Scanner Move API provides endpoints for mobile barcode scanning workflows to move License Plates between warehouse locations. These APIs are optimized for industrial handheld scanners (Zebra, Honeywell) and mobile devices with response times under 500ms.

## Base URL

All endpoints are relative to your app base URL:

```
https://your-domain.com/api
```

## Authentication

All endpoints require authentication. Include your session token in the request headers (automatically handled by Supabase client).

**Required Roles:**
- `warehouse_operator`
- `warehouse_manager`
- `admin`
- `owner`

---

## Endpoints

### POST /api/warehouse/scanner/move

Execute a scanner move operation to relocate a License Plate to a new warehouse location.

**Performance Target:** < 2000ms response time

#### Request

```bash
curl -X POST https://your-domain.com/api/warehouse/scanner/move \
  -H "Content-Type: application/json" \
  -d '{
    "lp_id": "550e8400-e29b-41d4-a716-446655440000",
    "to_location_id": "660e8400-e29b-41d4-a716-446655440001",
    "notes": "Moved for inventory count"
  }'
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `lp_id` | UUID | Yes | License Plate ID to move |
| `to_location_id` | UUID | Yes | Destination location ID |
| `notes` | string | No | Optional move notes (max 500 characters) |

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "stock_move": {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "move_number": "MV-2026-00456",
      "move_type": "transfer",
      "from_location_id": "880e8400-e29b-41d4-a716-446655440003",
      "to_location_id": "660e8400-e29b-41d4-a716-446655440001",
      "quantity": 100,
      "status": "completed",
      "move_date": "2026-01-21T14:30:00Z"
    },
    "lp": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "lp_number": "LP-2026-01234",
      "location_id": "660e8400-e29b-41d4-a716-446655440001",
      "location_path": "Warehouse A > Zone 1 > Rack B-02",
      "product_name": "Wheat Flour",
      "quantity": 100,
      "uom": "kg"
    }
  }
}
```

#### Error Responses

**Status: 400 Bad Request - Validation Errors**

| Error Code | Description |
|------------|-------------|
| `VALIDATION_ERROR` | Invalid request data (missing fields, invalid UUID) |
| `LP_NOT_AVAILABLE` | LP status is not available for movement |
| `LP_RESERVED` | LP is reserved for a work order |
| `LP_BLOCKED` | LP is blocked by QA hold |
| `LP_CONSUMED` | LP has been consumed |
| `LOCATION_NOT_ACTIVE` | Destination location is inactive |
| `SAME_LOCATION` | Source and destination are the same |

**Example Error:**
```json
{
  "success": false,
  "error": {
    "code": "LP_NOT_AVAILABLE",
    "message": "LP not available for movement (status: reserved)"
  }
}
```

**Status: 401 Unauthorized**

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized"
  }
}
```

**Status: 404 Not Found**

```json
{
  "success": false,
  "error": {
    "code": "LP_NOT_FOUND",
    "message": "License Plate not found"
  }
}
```

---

### POST /api/warehouse/scanner/validate-move

Pre-validate a move operation without executing it. Use this to check if a move is valid before confirmation.

**Performance Target:** < 500ms response time

#### Request

```bash
curl -X POST https://your-domain.com/api/warehouse/scanner/validate-move \
  -H "Content-Type: application/json" \
  -d '{
    "lp_id": "550e8400-e29b-41d4-a716-446655440000",
    "to_location_id": "660e8400-e29b-41d4-a716-446655440001"
  }'
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `lp_id` | UUID | Yes | License Plate ID |
| `to_location_id` | UUID | Yes | Destination location ID |

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "valid": true,
    "errors": [],
    "warnings": [],
    "lp": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "lp_number": "LP-2026-01234",
      "product": {
        "id": "prod-001",
        "name": "Wheat Flour",
        "sku": "WF-001"
      },
      "quantity": 100,
      "uom": "kg",
      "location": {
        "id": "loc-001",
        "code": "A-01-01",
        "path": "Warehouse A > Zone 1 > Rack A-01"
      },
      "status": "available",
      "qa_status": "passed",
      "batch_number": "BATCH-2026-0123",
      "expiry_date": "2026-12-31"
    },
    "destination": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "location_code": "B-02-03",
      "location_path": "Warehouse A > Zone 1 > Rack B-02",
      "warehouse_name": "Main Warehouse",
      "is_active": true,
      "capacity_pct": null
    }
  }
}
```

#### Validation Errors Response

```json
{
  "success": true,
  "data": {
    "valid": false,
    "errors": [
      { "field": "lp_id", "message": "LP not available for movement (status: reserved)" }
    ],
    "warnings": [],
    "lp": { ... }
  }
}
```

#### Validation Warnings Response

```json
{
  "success": true,
  "data": {
    "valid": true,
    "errors": [],
    "warnings": [
      { "code": "CAPACITY_WARNING", "message": "Location at 90% capacity" }
    ],
    "lp": { ... },
    "destination": { ... }
  }
}
```

---

### GET /api/warehouse/scanner/lookup/lp/:barcode

Lookup a License Plate by its barcode (lp_number).

**Performance Target:** < 300ms response time

#### Request

```bash
curl -X GET https://your-domain.com/api/warehouse/scanner/lookup/lp/LP-2026-01234 \
  -H "Content-Type: application/json"
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `barcode` | string | LP number (e.g., "LP-2026-01234") |

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "lp_number": "LP-2026-01234",
    "product": {
      "id": "prod-001",
      "name": "Wheat Flour",
      "sku": "WF-001"
    },
    "quantity": 100,
    "uom": "kg",
    "location": {
      "id": "loc-001",
      "code": "A-01-01",
      "path": "Warehouse A > Zone 1 > Rack A-01"
    },
    "status": "available",
    "qa_status": "passed",
    "batch_number": "BATCH-2026-0123",
    "expiry_date": "2026-12-31"
  }
}
```

#### Error Responses

**Status: 404 Not Found**

```json
{
  "success": false,
  "error": {
    "code": "LP_NOT_FOUND",
    "message": "License plate LP-99999 not found"
  }
}
```

---

### GET /api/warehouse/scanner/lookup/location/:barcode

Lookup a warehouse location by its barcode (location_code).

**Performance Target:** < 300ms response time

#### Request

```bash
curl -X GET https://your-domain.com/api/warehouse/scanner/lookup/location/B-02-03 \
  -H "Content-Type: application/json"
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `barcode` | string | Location code (e.g., "B-02-03") |

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "location_code": "B-02-03",
    "location_path": "Warehouse A > Zone 1 > Rack B-02",
    "warehouse_name": "Main Warehouse",
    "is_active": true,
    "capacity_pct": null
  }
}
```

#### Error Responses

**Status: 404 Not Found**

```json
{
  "success": false,
  "error": {
    "code": "LOCATION_NOT_FOUND",
    "message": "Location X-99-99 not found"
  }
}
```

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient role permissions |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `LP_NOT_FOUND` | 404 | License Plate not found |
| `LP_NOT_AVAILABLE` | 400 | LP status is not available |
| `LP_RESERVED` | 400 | LP is reserved for a work order |
| `LP_BLOCKED` | 400 | LP is blocked by QA hold |
| `LP_CONSUMED` | 400 | LP has been consumed |
| `LOCATION_NOT_FOUND` | 404 | Location not found |
| `LOCATION_NOT_ACTIVE` | 400 | Location is inactive |
| `SAME_LOCATION` | 400 | Source and destination are the same |
| `CAPACITY_WARNING` | 200 | Warning: location near capacity |
| `NETWORK_ERROR` | 500 | Network or server error |

---

## Code Examples

### TypeScript/React

```typescript
import { useState } from 'react'

// Lookup LP by barcode
async function lookupLP(barcode: string) {
  const response = await fetch(
    `/api/warehouse/scanner/lookup/lp/${encodeURIComponent(barcode)}`
  )

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error?.message || 'LP not found')
  }

  return data.data
}

// Lookup location by barcode
async function lookupLocation(barcode: string) {
  const response = await fetch(
    `/api/warehouse/scanner/lookup/location/${encodeURIComponent(barcode)}`
  )

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error?.message || 'Location not found')
  }

  return data.data
}

// Validate move before execution
async function validateMove(lpId: string, toLocationId: string) {
  const response = await fetch('/api/warehouse/scanner/validate-move', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lp_id: lpId, to_location_id: toLocationId }),
  })

  const data = await response.json()
  return data.data
}

// Execute move
async function executeMove(lpId: string, toLocationId: string, notes?: string) {
  const response = await fetch('/api/warehouse/scanner/move', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lp_id: lpId,
      to_location_id: toLocationId,
      notes,
    }),
  })

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error?.message || 'Move failed')
  }

  return data.data
}
```

### Complete Scanner Flow Example

```typescript
async function handleScannerMoveFlow(
  lpBarcode: string,
  locationBarcode: string
) {
  // Step 1: Lookup LP
  const lp = await lookupLP(lpBarcode)
  console.log('LP found:', lp.lp_number, 'at', lp.location.path)

  // Check LP status
  if (lp.status !== 'available') {
    throw new Error(`LP not available (status: ${lp.status})`)
  }

  // Step 2: Lookup destination
  const destination = await lookupLocation(locationBarcode)
  console.log('Destination:', destination.location_path)

  // Check destination active
  if (!destination.is_active) {
    throw new Error('Destination location is inactive')
  }

  // Check same location
  if (lp.location.id === destination.id) {
    throw new Error('LP is already at this location')
  }

  // Step 3: Validate move
  const validation = await validateMove(lp.id, destination.id)
  if (!validation.valid) {
    throw new Error(validation.errors[0]?.message || 'Validation failed')
  }

  // Step 4: Execute move
  const result = await executeMove(lp.id, destination.id)
  console.log('Move complete:', result.stock_move.move_number)

  return result
}
```

---

## Request/Response Schemas

### ScannerMoveInput (Request)

```typescript
interface ScannerMoveInput {
  lp_id: string        // UUID - required
  to_location_id: string  // UUID - required
  notes?: string       // Optional, max 500 characters
}
```

### ScannerMoveResult (Response)

```typescript
interface ScannerMoveResult {
  stock_move: {
    id: string
    move_number: string
    move_type: 'transfer'
    from_location_id: string
    to_location_id: string
    quantity: number
    status: 'completed'
    move_date: string  // ISO 8601 timestamp
  }
  lp: {
    id: string
    lp_number: string
    location_id: string
    location_path: string
    product_name: string
    quantity: number
    uom: string
  }
}
```

### LPLookupResult

```typescript
interface LPLookupResult {
  id: string
  lp_number: string
  product: {
    id: string
    name: string
    sku: string
  }
  quantity: number
  uom: string
  location: {
    id: string
    code: string
    path: string
  }
  status: 'available' | 'reserved' | 'consumed' | 'blocked'
  qa_status: 'pending' | 'passed' | 'failed' | 'on_hold'
  batch_number: string | null
  expiry_date: string | null  // ISO 8601 date
}
```

### LocationLookupResult

```typescript
interface LocationLookupResult {
  id: string
  location_code: string
  location_path: string
  warehouse_name: string
  is_active: boolean
  capacity_pct: number | null
}
```

### MoveValidationResult

```typescript
interface MoveValidationResult {
  valid: boolean
  errors: Array<{ field: string; message: string }>
  warnings: Array<{ code: string; message: string }>
  lp?: LPLookupResult
  destination?: LocationLookupResult
}
```

---

## Performance Guidelines

| Operation | Target | Typical |
|-----------|--------|---------|
| LP Lookup | < 300ms | ~100-200ms |
| Location Lookup | < 300ms | ~100-200ms |
| Validate Move | < 500ms | ~200-400ms |
| Execute Move | < 2000ms | ~500-1000ms |

**Tips for optimal performance:**
- Use indexed barcode columns (lp_number, location_code)
- RLS policies filter by org_id automatically
- The execute_stock_move RPC handles LP update atomically

---

## Related Documentation

- [Scanner Move Workflow Guide](../../guides/warehouse/scanner-move-workflow.md)
- [LP Reservations API](./lp-reservations-api.md)
- [FIFO/FEFO Picking Guide](../../guides/warehouse/fifo-fefo-picking.md)

---

## Support

**Story:** 05.20
**Last Updated:** 2026-01-21
