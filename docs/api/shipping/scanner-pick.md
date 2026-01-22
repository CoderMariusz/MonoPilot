# Scanner Pick API Reference

> Story: 07.10 - Pick Scanner
> Module: Shipping
> Status: DEPLOYED

## Overview

The Scanner Pick API provides mobile-optimized endpoints for warehouse pickers using barcode scanners. Endpoints are optimized for low latency (<200ms response time) and include pre-computed next-line previews to minimize round trips.

---

## Endpoints

### POST /api/shipping/scanner/pick

Confirm a pick via barcode scanner. Returns the next pick line in the same response to enable auto-advance without additional API calls.

**Request**

```http
POST /api/shipping/scanner/pick
Authorization: Bearer <token>
Content-Type: application/json

{
  "pick_line_id": "123e4567-e89b-12d3-a456-426614174000",
  "scanned_lp_barcode": "LP-2025-00042",
  "quantity_picked": 24,
  "short_pick": false,
  "short_pick_reason": null,
  "short_pick_notes": null
}
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| pick_line_id | UUID | Yes | Pick line to confirm |
| scanned_lp_barcode | string | Yes | Scanned LP barcode |
| quantity_picked | number | Yes | Quantity picked (positive) |
| short_pick | boolean | Yes | True if short picking |
| short_pick_reason | string | If short_pick | Reason code |
| short_pick_notes | string | No | Additional notes |

**Short Pick Reasons**

| Value | Description |
|-------|-------------|
| `insufficient_inventory` | Not enough stock in location |
| `product_not_found` | Product not found at location |
| `product_damaged` | Product damaged |
| `location_empty` | Nothing at location |
| `other` | Other reason |

**Response (Success)**

```json
{
  "success": true,
  "pick_line_status": "picked",
  "next_line": {
    "id": "uuid-line-002",
    "pick_sequence": 4,
    "location_path": "CHILLED / A-04-08",
    "product_name": "Yogurt Strawberry",
    "quantity_to_pick": 12,
    "expected_lp": "LP-2025-00055"
  },
  "progress": {
    "total_lines": 12,
    "picked_lines": 4,
    "short_lines": 0
  },
  "pick_list_complete": false
}
```

**Response (Pick List Complete)**

```json
{
  "success": true,
  "pick_line_status": "picked",
  "next_line": null,
  "progress": {
    "total_lines": 12,
    "picked_lines": 12,
    "short_lines": 0
  },
  "pick_list_complete": true
}
```

**Status Codes**

| Code | Description |
|------|-------------|
| 200 | Pick confirmed successfully |
| 400 | Validation error |
| 401 | Not authenticated |
| 403 | Insufficient permissions |
| 404 | Pick line not found |
| 409 | Line already picked |

**Error Response**

```json
{
  "error": {
    "code": "LP_MISMATCH",
    "message": "Wrong LP - Expected LP-2025-00042"
  }
}
```

**Error Codes**

| Code | Description |
|------|-------------|
| LP_MISMATCH | Scanned LP does not match expected |
| QUANTITY_EXCEEDS_AVAILABLE | Picked quantity exceeds LP availability |
| SHORT_PICK_REASON_REQUIRED | Missing reason for short pick |
| LINE_ALREADY_PICKED | Line already confirmed |
| NOT_FOUND | Pick line not found |

---

### GET /api/shipping/scanner/lookup/lp/:barcode

Fast LP lookup by barcode for scanner validation. Target response time: <100ms.

**Request**

```http
GET /api/shipping/scanner/lookup/lp/LP-2025-00042
Authorization: Bearer <token>
```

**Response (Found)**

```json
{
  "lp_number": "LP-2025-00042",
  "product_id": "uuid-product-001",
  "product_name": "Chocolate Milk 1L",
  "product_sku": "CHO-MILK-1L",
  "lot_number": "A2025-003",
  "best_before_date": "2025-06-15",
  "on_hand_quantity": 48,
  "location_id": "uuid-loc-001",
  "location_path": "CHILLED / A-03-12",
  "allergens": ["Milk"],
  "qa_status": "passed"
}
```

**Status Codes**

| Code | Description |
|------|-------------|
| 200 | LP found |
| 401 | Not authenticated |
| 403 | Insufficient permissions |
| 404 | LP not found |

**Error Response (Not Found)**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "LP not found - Check barcode"
  }
}
```

---

### GET /api/shipping/scanner/suggest-pick/:lineId

Get FIFO/FEFO pick suggestion for a line. Returns suggested LP and alternatives.

**Request**

```http
GET /api/shipping/scanner/suggest-pick/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer <token>
```

**Response**

```json
{
  "suggested_lp": "LP-2025-00040",
  "suggested_lp_id": "uuid-lp-00040",
  "alternate_lps": [
    {
      "lp_number": "LP-2025-00040",
      "lp_id": "uuid-lp-00040",
      "mfg_date": "2025-10-20",
      "bbd_date": "2026-04-20"
    },
    {
      "lp_number": "LP-2025-00042",
      "lp_id": "uuid-lp-00042",
      "mfg_date": "2025-11-15",
      "bbd_date": "2026-05-15"
    }
  ],
  "fifo_warning": false,
  "fefo_warning": false
}
```

**Response Fields**

| Field | Type | Description |
|-------|------|-------------|
| suggested_lp | string | FIFO/FEFO recommended LP barcode |
| suggested_lp_id | UUID | Suggested LP ID |
| alternate_lps | array | Other valid LPs for this product |
| fifo_warning | boolean | True if suggested is not oldest receipt |
| fefo_warning | boolean | True if suggested is not soonest expiry |

**Status Codes**

| Code | Description |
|------|-------------|
| 200 | Suggestion returned |
| 400 | Invalid UUID format |
| 401 | Not authenticated |
| 403 | Insufficient permissions |
| 404 | Pick line not found |

---

## Data Models

### ScannerPickInput

```typescript
interface ScannerPickInput {
  pick_line_id: string;          // UUID
  scanned_lp_barcode: string;    // LP barcode (min 1 char)
  quantity_picked: number;       // Positive integer
  short_pick: boolean;           // True if short picking
  short_pick_reason?: string;    // Required if short_pick=true
  short_pick_notes?: string;     // Optional notes
}
```

### ScannerPickResponse

```typescript
interface ScannerPickResponse {
  success: boolean;
  pick_line_status: 'picked' | 'short';
  next_line: PickLinePreview | null;
  progress: PickProgress;
  pick_list_complete: boolean;
}
```

### PickLinePreview

```typescript
interface PickLinePreview {
  id: string;
  pick_sequence: number;
  location_path: string;
  product_name: string;
  quantity_to_pick: number;
  expected_lp: string;
}
```

### LPLookupResult

```typescript
interface LPLookupResult {
  lp_number: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  lot_number: string;
  best_before_date?: string;
  on_hand_quantity: number;
  location_id: string;
  location_path: string;
  allergens: string[];
  qa_status: string;
}
```

### PickSuggestion

```typescript
interface PickSuggestion {
  suggested_lp: string;
  suggested_lp_id: string;
  alternate_lps: AlternateLP[];
  fifo_warning: boolean;
  fefo_warning: boolean;
}

interface AlternateLP {
  lp_number: string;
  lp_id: string;
  mfg_date: string;
  bbd_date?: string;
}
```

---

## Permission Model

| Role | Lookup LP | Suggest Pick | Confirm Pick |
|------|-----------|--------------|--------------|
| PICKER | Yes | Yes | Yes |
| SUPERVISOR | Yes | Yes | Yes |
| WAREHOUSE_MANAGER | Yes | Yes | Yes |
| SUPER_ADMIN | Yes | Yes | Yes |
| VIEWER | No | No | No |
| OPERATOR | No | No | No |

---

## Performance Requirements

| Endpoint | Target Response Time |
|----------|---------------------|
| POST /scanner/pick | < 200ms |
| GET /lookup/lp/:barcode | < 100ms |
| GET /suggest-pick/:lineId | < 100ms |

---

## FIFO/FEFO Enforcement

When a picker scans an LP that is not the FIFO/FEFO recommended LP:

1. API validates scanned LP is acceptable (same product, has quantity)
2. Returns `fifo_warning: true` or `fefo_warning: true` in response
3. Scanner UI displays warning with "Use Suggested LP" option
4. Picker can override and continue with scanned LP
5. Override is logged in audit trail

---

## Multi-Tenant Isolation

All endpoints enforce RLS policies. Requests are filtered by the authenticated user's `org_id`:

- LP lookup only returns LPs within user's organization
- Pick lines filtered by organization
- Cross-tenant access returns 404 (not 403) to prevent enumeration

---

## Related Documentation

- [Scanner Pick Workflow Guide](../../guides/shipping/scanner-pick-workflow.md)
- [Pick Confirmation API](./pick-confirmation.md)
- [Pick List Generation API](./pick-lists.md)
