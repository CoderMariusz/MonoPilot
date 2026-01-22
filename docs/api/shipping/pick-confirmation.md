# Pick Confirmation API Reference

> Story: 07.9 - Pick Confirmation Desktop
> Module: Shipping
> Status: DEPLOYED

## Overview

The Pick Confirmation API enables warehouse pickers to confirm picked inventory on desktop computers. It handles full picks, short picks with reason tracking, and automatic backorder creation.

---

## Endpoints

### POST /api/shipping/pick-lists/:id/start

Start a pick list (transition from `assigned` to `in_progress`).

**Request**

```http
POST /api/shipping/pick-lists/pl-001/start
Authorization: Bearer <token>
Content-Type: application/json
```

**Response**

```json
{
  "success": true,
  "started_at": "2026-01-22T10:00:00Z"
}
```

**Status Codes**

| Code | Description |
|------|-------------|
| 200 | Pick list started successfully |
| 403 | User not assigned to this pick list |
| 404 | Pick list not found |
| 409 | Pick list not in `assigned` status |

---

### PUT /api/shipping/pick-lists/:id/lines/:lineId/pick

Confirm a full pick for a line. Updates 4 tables atomically:
1. `pick_list_lines` - quantity_picked, status, picked_at, picked_by
2. `inventory_allocations` - quantity_picked
3. `sales_order_lines` - quantity_picked (increment)
4. `license_plates` - quantity, allocated_quantity (decrement)

**Request**

```http
PUT /api/shipping/pick-lists/pl-001/lines/line-001/pick
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity_picked": 50,
  "picked_license_plate_id": "lp-001"
}
```

**Response**

```json
{
  "success": true,
  "line": {
    "id": "line-001",
    "status": "picked",
    "quantity_picked": 50,
    "picked_at": "2026-01-22T10:05:00Z"
  },
  "progress": {
    "picked_count": 4,
    "short_count": 0,
    "total_count": 12,
    "percentage": 33
  }
}
```

**Validation Rules**

| Rule | Error Message |
|------|---------------|
| quantity_picked > 0 | "Quantity must be positive" |
| quantity_picked <= quantity_to_pick | "Cannot pick more than allocated (X units)" |
| LP has sufficient quantity | "Insufficient quantity in license plate" |

**Status Codes**

| Code | Description |
|------|-------------|
| 200 | Pick confirmed successfully |
| 400 | Validation error (quantity exceeds limit) |
| 403 | Access denied (not assigned picker) |
| 404 | Pick list or line not found |
| 409 | Line already picked or pick list not in progress |

---

### POST /api/shipping/pick-lists/:id/lines/:lineId/short-pick

Record a short pick with reason. Creates backorder for unfulfilled quantity.

**Request**

```http
POST /api/shipping/pick-lists/pl-001/lines/line-001/short-pick
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity_picked": 30,
  "reason": "insufficient_inventory",
  "notes": "Only 30 units found in bin",
  "picked_license_plate_id": "lp-001"
}
```

**Reason Enum**

| Value | Description |
|-------|-------------|
| `insufficient_inventory` | Not enough stock in location |
| `damaged` | Product damaged |
| `expired` | Product expired |
| `location_empty` | Nothing at location |
| `quality_hold` | Product on quality hold |
| `other` | Other reason (notes required) |

**Response**

```json
{
  "success": true,
  "line": {
    "id": "line-001",
    "status": "short",
    "quantity_picked": 30,
    "picked_at": "2026-01-22T10:05:00Z"
  },
  "short_quantity": 20,
  "backorder_created": true,
  "backorder_quantity": 20,
  "progress": {
    "picked_count": 3,
    "short_count": 1,
    "total_count": 12,
    "percentage": 33
  }
}
```

**Status Codes**

| Code | Description |
|------|-------------|
| 200 | Short pick recorded successfully |
| 400 | Validation error (invalid reason) |
| 403 | Access denied |
| 404 | Pick list or line not found |

---

### POST /api/shipping/pick-lists/:id/complete

Complete the pick list. Validates all lines are picked or short.

**Request**

```http
POST /api/shipping/pick-lists/pl-001/complete
Authorization: Bearer <token>
```

**Response**

```json
{
  "success": true,
  "pick_list": {
    "id": "pl-001",
    "status": "completed",
    "completed_at": "2026-01-22T10:30:00Z"
  },
  "summary": {
    "total_lines": 12,
    "picked_lines": 10,
    "short_lines": 2,
    "total_units_picked": 450
  },
  "sales_orders_updated": [
    {
      "id": "so-001",
      "order_number": "SO-2026-00001",
      "status": "partial"
    }
  ]
}
```

**Sales Order Status Logic**

| Condition | New SO Status |
|-----------|---------------|
| All lines fully picked | `packing` |
| Any lines short | `partial` |

**Status Codes**

| Code | Description |
|------|-------------|
| 200 | Pick list completed successfully |
| 400 | Lines still pending |
| 404 | Pick list not found |

---

## Data Models

### ConfirmPickInput

```typescript
interface ConfirmPickInput {
  quantity_picked: number;        // Must be positive, <= quantity_to_pick
  picked_license_plate_id: string; // UUID of LP picked from
}
```

### ShortPickInput

```typescript
interface ShortPickInput {
  quantity_picked: number;         // Amount actually picked
  reason: ShortPickReason;         // Required reason enum
  notes?: string;                  // Optional notes (max 500 chars)
  picked_license_plate_id?: string; // LP if any quantity picked
}

type ShortPickReason =
  | 'insufficient_inventory'
  | 'damaged'
  | 'expired'
  | 'location_empty'
  | 'quality_hold'
  | 'other';
```

### PickProgress

```typescript
interface PickProgress {
  picked_count: number;   // Lines with status='picked'
  short_count: number;    // Lines with status='short'
  total_count: number;    // Total lines in pick list
  percentage: number;     // (picked + short) / total * 100
}
```

### PickListLine

```typescript
interface PickListLine {
  id: string;
  pick_list_id: string;
  sales_order_line_id: string;
  license_plate_id: string;
  location_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_allergens: string[];
  quantity_to_pick: number;
  quantity_picked: number;
  status: 'pending' | 'picked' | 'short';
  lot_number: string;
  best_before_date: string;
  pick_sequence: number;
  picked_at: string | null;
  picked_by: string | null;
  notes: string | null;
  location?: {
    zone: string;
    aisle: string;
    bin: string;
    name: string;
  };
  lp?: {
    id: string;
    lp_number: string;
    quantity_on_hand: number;
  };
}
```

---

## Permission Model

| Role | Can Start | Can Pick | Can Complete |
|------|-----------|----------|--------------|
| Picker (assigned) | Yes | Yes | Yes |
| Picker (not assigned) | No | No | No |
| Warehouse | Yes | Yes | Yes |
| Manager | Yes | Yes | Yes |
| Admin | Yes | Yes | Yes |

Warehouse+ roles can override assignment and pick any list.

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| NOT_FOUND | 404 | Pick list or line not found |
| FORBIDDEN | 403 | User not authorized |
| CONFLICT | 409 | Invalid state transition |
| VALIDATION_ERROR | 400 | Input validation failed |
| INTERNAL_ERROR | 500 | Server error |

---

## Multi-Tenant Isolation

All endpoints enforce RLS policies. Requests are filtered by the authenticated user's `org_id`. Cross-tenant access returns 404.

---

## Related Documentation

- [Pick Confirmation User Guide](../../guides/shipping/pick-confirmation.md)
- [Pick List Generation API](./pick-list-generation.md)
- [Inventory Allocation API](./inventory-allocation.md)
