# Scanner Putaway API Reference

**Story:** 05.21 - Scanner Putaway Workflow
**Version:** 1.0
**Last Updated:** 2026-01-21

## Overview

The Scanner Putaway API provides endpoints for mobile barcode scanning workflows to move License Plates (LPs) from receiving areas to optimal storage locations. The system uses FIFO/FEFO algorithms to suggest locations that group similar products together for efficient picking.

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
- `production_operator`
- `admin`
- `owner`

---

## Endpoints

### GET /api/warehouse/scanner/putaway/suggest/[lpId]

Get optimal location suggestion for a License Plate using FIFO/FEFO zone logic.

**Performance Target:** < 500ms response time

#### Request

```bash
curl -X GET https://your-domain.com/api/warehouse/scanner/putaway/suggest/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json"
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `lpId` | UUID | License Plate ID |

#### Response (200 OK)

```json
{
  "suggested_location": {
    "id": "loc-001",
    "location_code": "A-01-01",
    "full_path": "Warehouse 1 / Zone A / Rack 01 / Level 01",
    "zone_id": "zone-001",
    "zone_name": "Dry Storage",
    "aisle": "A",
    "rack": "01",
    "level": "01"
  },
  "reason": "FIFO: Place near oldest stock of same product",
  "reason_code": "fifo_zone",
  "alternatives": [
    {
      "id": "loc-002",
      "location_code": "A-01-02",
      "reason": "Same zone, next available"
    },
    {
      "id": "loc-003",
      "location_code": "B-02-01",
      "reason": "Alternative zone"
    }
  ],
  "strategy_used": "fifo",
  "lp_details": {
    "lp_number": "LP-2026-01234",
    "product_name": "Wheat Flour",
    "quantity": 500,
    "uom": "kg",
    "expiry_date": "2026-12-31",
    "current_location": "Receiving Dock 1"
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `suggested_location` | object | Optimal storage location (null if none available) |
| `suggested_location.id` | UUID | Location ID |
| `suggested_location.location_code` | string | Location code (e.g., "A-01-01") |
| `suggested_location.full_path` | string | Human-readable location path |
| `suggested_location.zone_id` | UUID | Zone ID (nullable) |
| `suggested_location.zone_name` | string | Zone name (nullable) |
| `suggested_location.aisle` | string | Aisle identifier (nullable) |
| `suggested_location.rack` | string | Rack number (nullable) |
| `suggested_location.level` | string | Level/shelf number (nullable) |
| `reason` | string | Human-readable reason for suggestion |
| `reason_code` | string | Machine-readable reason code |
| `alternatives` | array | Up to 2 alternative locations |
| `strategy_used` | string | "fifo", "fefo", or "none" |
| `lp_details` | object | LP information for display |

#### Reason Codes

| Code | Description |
|------|-------------|
| `fifo_zone` | FIFO strategy: Location near oldest stock of same product |
| `fefo_zone` | FEFO strategy: Location with similar expiry dates |
| `product_zone` | Product's preferred zone |
| `default_zone` | Default warehouse zone |
| `no_preference` | No available locations in preferred zone |

#### Error Responses

**Status: 400 Bad Request**

```json
{
  "error": "LP not available for putaway (status: consumed)"
}
```

**Status: 401 Unauthorized**

```json
{
  "error": "Unauthorized"
}
```

**Status: 404 Not Found**

```json
{
  "error": "LP not found"
}
```

---

### POST /api/warehouse/scanner/putaway

Execute putaway transaction to move LP to target location.

**Performance Target:** < 2000ms response time

#### Request

```bash
curl -X POST https://your-domain.com/api/warehouse/scanner/putaway \
  -H "Content-Type: application/json" \
  -d '{
    "lp_id": "550e8400-e29b-41d4-a716-446655440000",
    "location_id": "loc-001",
    "suggested_location_id": "loc-001",
    "override": false,
    "override_reason": null
  }'
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `lp_id` | UUID | Yes | License Plate ID |
| `location_id` | UUID | Yes | Destination location ID |
| `suggested_location_id` | UUID | No | Original suggested location ID (for audit) |
| `override` | boolean | No | True if user overrode suggestion (default: false) |
| `override_reason` | string | No | Reason for override (max 500 chars) |

#### Response (201 Created)

```json
{
  "stock_move": {
    "id": "move-001",
    "move_number": "SM-2026-00456",
    "move_type": "putaway",
    "from_location_id": "loc-recv-001",
    "to_location_id": "loc-001",
    "quantity": 500,
    "status": "completed"
  },
  "lp": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "lp_number": "LP-2026-01234",
    "location_id": "loc-001",
    "location_path": "Warehouse 1 / Zone A / Rack 01 / Level 01"
  },
  "override_applied": false,
  "suggested_location_code": null
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `stock_move` | object | Created stock move record |
| `stock_move.id` | UUID | Stock move ID |
| `stock_move.move_number` | string | Human-readable move number |
| `stock_move.move_type` | string | Always "putaway" |
| `stock_move.from_location_id` | UUID | Original location ID |
| `stock_move.to_location_id` | UUID | Destination location ID |
| `stock_move.quantity` | number | LP quantity |
| `stock_move.status` | string | Always "completed" |
| `lp` | object | Updated LP information |
| `lp.id` | UUID | LP ID |
| `lp.lp_number` | string | LP number |
| `lp.location_id` | UUID | New location ID |
| `lp.location_path` | string | New location path |
| `override_applied` | boolean | True if override was applied |
| `suggested_location_code` | string | Original suggestion if overridden |

#### Validation Errors (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "lp_id",
      "message": "Invalid LP ID"
    }
  ]
}
```

#### Error Responses

**Status: 400 Bad Request - LP Status**

```json
{
  "error": "LP not available for putaway (status: blocked)"
}
```

**Status: 400 Bad Request - Location**

```json
{
  "error": "Destination location not found"
}
```

```json
{
  "error": "Destination location not available (inactive)"
}
```

**Status: 401 Unauthorized**

```json
{
  "error": "Unauthorized"
}
```

**Status: 404 Not Found**

```json
{
  "error": "LP not found"
}
```

---

## FIFO/FEFO Algorithm

The putaway suggestion algorithm determines optimal storage locations based on warehouse settings.

### Strategy Precedence

1. If `enable_fefo = true`: FEFO strategy (regardless of `enable_fifo`)
2. Else if `enable_fifo = true`: FIFO strategy
3. Else: No strategy (default zone)

### FIFO (First In, First Out)

**Goal:** Place new stock near oldest stock of same product.

**Algorithm:**
1. Find existing LPs of same product in warehouse
2. Sort by `created_at ASC` (oldest first)
3. Get zone from oldest LP's location
4. Suggest available location in that zone

**Example:**
```
Existing stock (same product):
  LP-001: Zone A, Created 2025-12-01 (oldest)
  LP-002: Zone A, Created 2025-12-15
  LP-003: Zone B, Created 2026-01-01

New LP:
  Suggested zone: Zone A (where oldest stock is)
  Reason: "FIFO: Place near oldest stock of same product"
```

### FEFO (First Expired, First Out)

**Goal:** Place new stock with similar expiry dates together.

**Algorithm:**
1. Find existing LPs of same product in warehouse
2. Sort by `expiry_date ASC`, then `created_at ASC`
3. Get zone from LP with soonest expiry
4. Suggest available location in that zone

**Example:**
```
Existing stock (same product):
  LP-001: Zone A, Expiry 2026-06-01
  LP-002: Zone B, Expiry 2026-03-01 (soonest)
  LP-003: Zone A, Expiry NULL

New LP (Expiry 2026-04-01):
  Suggested zone: Zone B (where soonest expiry is)
  Reason: "FEFO: Place with similar expiry dates"
```

### Fallback Logic

If no existing LPs found:
1. Use product's `preferred_zone_id` if set
2. Otherwise, return first available location in warehouse

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `LP_NOT_FOUND` | 404 | License plate not found |
| `LP_NOT_AVAILABLE` | 400 | LP status is not 'available' or 'reserved' |
| `LP_CONSUMED` | 400 | LP has already been consumed |
| `LP_BLOCKED` | 400 | LP is blocked (QA hold) |
| `LOCATION_NOT_FOUND` | 400 | Destination location not found |
| `LOCATION_NOT_ACTIVE` | 400 | Destination location is inactive |
| `LOCATION_NOT_IN_WAREHOUSE` | 400 | Location is in different warehouse |
| `NO_LOCATIONS_AVAILABLE` | 400 | No available locations in zone |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `NETWORK_ERROR` | 500 | Network or server error |

---

## Request/Response Schemas

### ScannerPutawayInput Schema (Zod)

```typescript
import { z } from 'zod'

export const scannerPutawaySchema = z.object({
  lp_id: z.string().uuid('Invalid LP ID'),
  location_id: z.string().uuid('Invalid location ID'),
  suggested_location_id: z.string().uuid().optional().nullable(),
  override: z.boolean().default(false),
  override_reason: z.string().max(500).optional().nullable(),
})

type ScannerPutawayInput = z.infer<typeof scannerPutawaySchema>
```

### SuggestedLocation Type

```typescript
interface SuggestedLocation {
  id: string
  location_code: string
  full_path: string
  zone_id: string | null
  zone_name: string | null
  aisle: string | null
  rack: string | null
  level: string | null
}
```

### PutawaySuggestion Type

```typescript
interface PutawaySuggestion {
  suggestedLocation: SuggestedLocation | null
  reason: string
  reasonCode: 'fifo_zone' | 'fefo_zone' | 'product_zone' | 'default_zone' | 'no_preference'
  alternatives: Array<{
    id: string
    location_code: string
    reason: string
  }>
  strategyUsed: 'fifo' | 'fefo' | 'none'
  lpDetails: {
    lp_number: string
    product_name: string
    quantity: number
    uom: string
    expiry_date: string | null
    current_location: string
  }
}
```

### PutawayResult Type

```typescript
interface PutawayResult {
  stockMove: {
    id: string
    move_number: string
    move_type: 'putaway'
    from_location_id: string
    to_location_id: string
    quantity: number
    status: 'completed'
  }
  lp: {
    id: string
    lp_number: string
    location_id: string
    location_path: string
  }
  overrideApplied: boolean
  suggestedLocationCode?: string
}
```

---

## Code Examples

### TypeScript/React

```typescript
// Get putaway suggestion
async function getPutawaySuggestion(lpId: string) {
  const response = await fetch(
    `/api/warehouse/scanner/putaway/suggest/${lpId}`
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get suggestion')
  }

  return response.json()
}

// Confirm putaway
async function confirmPutaway(
  lpId: string,
  locationId: string,
  suggestedLocationId?: string,
  override = false,
  overrideReason?: string
) {
  const response = await fetch('/api/warehouse/scanner/putaway', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lp_id: lpId,
      location_id: locationId,
      suggested_location_id: suggestedLocationId,
      override,
      override_reason: overrideReason,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Putaway failed')
  }

  return response.json()
}
```

### Using Scanner Putaway Components

```typescript
import {
  ScannerPutawayWizard,
  Step1ScanLP,
  Step2ViewSuggestion,
  Step3ScanLocation,
  Step4Confirm,
  Step5Success,
} from '@/components/scanner/putaway'

function PutawayPage() {
  return (
    <ScannerPutawayWizard
      onComplete={(result) => {
        console.log('Putaway complete:', result)
      }}
    />
  )
}
```

---

## Scanner Workflow

The 5-step putaway flow:

```
Step 1: Scan LP Barcode
  -> Lookup LP by barcode
  -> Validate LP status is 'available' or 'reserved'

Step 2: View Suggestion
  GET /api/warehouse/scanner/putaway/suggest/[lpId]
  -> Display suggested location with reason
  -> Show alternatives

Step 3: Scan Location Barcode
  -> Lookup location by barcode
  -> Validate location is active
  -> Check if different from suggestion (override)

Step 4: Confirm
  -> Review putaway details
  -> Enter override reason if applicable

Step 5: Execute
  POST /api/warehouse/scanner/putaway
  -> Create stock move
  -> Update LP location
  -> Display success
```

---

## Performance Guidelines

| Operation | Target | Typical |
|-----------|--------|---------|
| LP Barcode Lookup | < 300ms | ~100-200ms |
| Putaway Suggestion | < 500ms | ~200-400ms |
| Putaway Confirm | < 2000ms | ~500-1000ms |

**Tips for optimal performance:**
- LP and location tables have indexed barcode columns
- RLS policies filter by org_id at database level
- FIFO/FEFO queries use indexed `created_at` and `expiry_date` columns

---

## Related Documentation

- [Scanner Putaway Workflow Guide](../../guides/warehouse/scanner-putaway-workflow.md)
- [FIFO/FEFO Picking Guide](../../guides/warehouse/fifo-fefo-picking.md)
- [LP Reservations API](./lp-reservations-api.md)

---

## Support

**Story:** 05.21
**Last Updated:** 2026-01-21
