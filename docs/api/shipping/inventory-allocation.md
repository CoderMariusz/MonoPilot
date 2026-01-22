# Inventory Allocation API Reference

Story: 07.7 - Inventory Allocation (FIFO/FEFO + Backorders)

## Overview

The Inventory Allocation API enables reserving License Plates (LPs) against confirmed Sales Order lines using FIFO or FEFO strategies. It supports automatic allocation suggestions, manual overrides, partial allocations with backorder handling, and a 5-minute undo window.

## Base URL

```
/api/shipping/sales-orders/{id}
```

## Authentication

All endpoints require authentication. Include the session cookie or authorization header.

## Endpoints

### GET /allocations

Fetch allocation data with FIFO/FEFO suggestions for a Sales Order.

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| strategy | `FIFO` \| `FEFO` | org default | Override default picking strategy |
| include_suggestions | boolean | `true` | Include LP suggestions |
| include_last_updated | boolean | `true` | Include freshness timestamp |

**Response: 200 OK**

```json
{
  "sales_order_id": "uuid",
  "order_number": "SO-2025-00142",
  "last_updated": "2025-01-22T14:30:00Z",
  "lines": [
    {
      "line_id": "uuid",
      "line_number": 1,
      "product_id": "uuid",
      "product_name": "Organic Flour 25kg",
      "product_size": "25kg",
      "quantity_ordered": 100,
      "quantity_currently_allocated": 0,
      "unit_price": 45.50,
      "line_total": 4550.00,
      "allocation_status": "none",
      "total_available": 150,
      "qty_short": 0,
      "available_license_plates": [
        {
          "license_plate_id": "uuid",
          "lp_number": "LP-2025-0001",
          "location_code": "LOC-A-01",
          "on_hand_quantity": 50,
          "allocated_quantity": 0,
          "available_quantity": 50,
          "receipt_date": "2025-01-01T10:00:00Z",
          "created_at": "2025-01-01T10:00:00Z",
          "best_before_date": "2026-06-01",
          "expiry_date": "2026-06-01",
          "expiry_days_remaining": 495,
          "batch_number": "BATCH-001",
          "suggested_allocation_qty": 50,
          "is_suggested": true,
          "reason": "FIFO: oldest inventory"
        }
      ],
      "allocation_summary": {
        "fully_allocated": false,
        "partially_allocated": false,
        "total_available_qty": 150,
        "total_allocated_qty": 0,
        "shortfall_qty": 100
      }
    }
  ],
  "allocation_summary": {
    "total_lines": 3,
    "fully_allocated_lines": 0,
    "partially_allocated_lines": 0,
    "not_allocated_lines": 3,
    "total_qty_required": 250,
    "total_qty_allocated": 0,
    "total_qty_available": 300,
    "total_lps_selected": 0,
    "coverage_percentage": 0,
    "allocation_complete": false,
    "total_shortfall": 250
  },
  "fefo_warning_threshold_days": 7,
  "strategy": "fifo",
  "timestamp": "2025-01-22T14:30:00Z"
}
```

**Error Responses**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_SO_STATUS` | SO must be in confirmed status |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | User not found in org |
| 404 | `NOT_FOUND` | Sales order not found |

---

### POST /allocate

Confirm allocation and reserve LPs for SO lines.

**Roles Required:** Manager, Admin, Owner

**Request Body**

```json
{
  "allocation_strategy": "FIFO",
  "allocations": [
    {
      "sales_order_line_id": "uuid",
      "line_allocations": [
        {
          "license_plate_id": "uuid",
          "quantity_to_allocate": 50
        }
      ]
    }
  ],
  "hold_if_insufficient": false,
  "create_backorder_for_shortfall": true,
  "backorder_reason": "Customer requested partial shipment"
}
```

**Request Fields**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| allocation_strategy | `FIFO` \| `FEFO` | Yes | Picking strategy used |
| allocations | array | Yes | Line allocations (min 1) |
| allocations[].sales_order_line_id | uuid | Yes | SO line ID |
| allocations[].line_allocations | array | Yes | LP allocations (min 1) |
| allocations[].line_allocations[].license_plate_id | uuid | Yes | LP ID |
| allocations[].line_allocations[].quantity_to_allocate | number | Yes | Qty to allocate (> 0) |
| hold_if_insufficient | boolean | No | Set SO to on_hold if < threshold |
| create_backorder_for_shortfall | boolean | No | Create backorder signal (default: true) |
| backorder_reason | string | No | Reason for backorder |

**Response: 201 Created**

```json
{
  "success": true,
  "sales_order_id": "uuid",
  "order_number": "SO-2025-00142",
  "allocated_at": "2025-01-22T14:35:00Z",
  "undo_until": "2025-01-22T14:40:00Z",
  "allocations_created": [
    {
      "allocation_id": "uuid",
      "sales_order_line_id": "uuid",
      "license_plate_id": "uuid",
      "quantity_allocated": 50,
      "allocated_at": "2025-01-22T14:35:00Z",
      "allocated_by": "uuid"
    }
  ],
  "sales_order_status_updated": {
    "old_status": "confirmed",
    "new_status": "allocated",
    "timestamp": "2025-01-22T14:35:00Z"
  },
  "backorder_created": null,
  "summary": {
    "total_allocated": 100,
    "total_required": 100,
    "total_allocated_pct": 100,
    "shortfall_qty": 0,
    "allocation_complete": true,
    "held_on_insufficient_stock": false
  }
}
```

**Partial Allocation with Backorder**

When allocated quantity is less than required:

```json
{
  "success": true,
  "sales_order_id": "uuid",
  "order_number": "SO-2025-00143",
  "allocated_at": "2025-01-22T14:35:00Z",
  "undo_until": "2025-01-22T14:40:00Z",
  "allocations_created": [...],
  "sales_order_status_updated": {
    "old_status": "confirmed",
    "new_status": "confirmed",
    "timestamp": "2025-01-22T14:35:00Z"
  },
  "backorder_created": {
    "backorder_id": null,
    "sales_order_line_id": "uuid",
    "product_id": "uuid",
    "quantity_backordered": 40,
    "status": "pending",
    "created_at": "2025-01-22T14:35:00Z"
  },
  "summary": {
    "total_allocated": 60,
    "total_required": 100,
    "total_allocated_pct": 60,
    "shortfall_qty": 40,
    "allocation_complete": false,
    "held_on_insufficient_stock": false
  }
}
```

**Error Responses**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid request body |
| 400 | `INVALID_SO_STATUS` | SO must be in confirmed status |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions (requires Manager+) |
| 404 | `NOT_FOUND` | SO or LP not found |
| 409 | `LP_ALREADY_ALLOCATED` | LP already allocated to this SO line |

---

### POST /release-allocation

Release allocations and restore inventory to available.

**Roles Required:** Manager, Admin, Owner

**Request Body**

```json
{
  "allocation_ids": ["uuid1", "uuid2"],
  "reason": "manual_adjustment"
}
```

**Request Fields**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| allocation_ids | array | No | Specific allocation IDs to release (omit to release all) |
| reason | enum | No | `undo_allocation`, `manual_adjustment`, `so_cancelled`, `line_deleted`, `other` |

**Response: 200 OK**

```json
{
  "success": true,
  "allocations_released": [
    {
      "allocation_id": "uuid",
      "sales_order_line_id": "uuid",
      "license_plate_id": "uuid",
      "quantity_allocated": 50,
      "allocated_at": "2025-01-22T14:35:00Z",
      "allocated_by": "uuid"
    }
  ],
  "inventory_freed": 50,
  "undo_window_expired": false,
  "summary": "Released 1 allocation(s), freed 50 units"
}
```

**Error Responses**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `NO_ALLOCATIONS` | SO has no active allocations to release |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Sales order not found |

---

## Database Schema

### inventory_allocations Table

```sql
CREATE TABLE inventory_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  sales_order_line_id UUID NOT NULL REFERENCES sales_order_lines(id),
  license_plate_id UUID NOT NULL REFERENCES license_plates(id),
  quantity_allocated DECIMAL(15,4) NOT NULL CHECK (quantity_allocated > 0),
  quantity_picked DECIMAL(15,4) DEFAULT 0 CHECK (quantity_picked >= 0),
  allocated_at TIMESTAMPTZ DEFAULT now(),
  allocated_by UUID REFERENCES users(id),
  released_at TIMESTAMPTZ,
  released_by UUID REFERENCES users(id),

  UNIQUE(sales_order_line_id, license_plate_id)
);
```

### Key Indexes

- `idx_allocations_so_line` - SO line lookups
- `idx_allocations_lp` - LP lookups
- `idx_allocations_org_active` - Active allocations by org

### RLS Policies

All operations enforce org_id isolation through RLS policies.

---

## Allocation Algorithm

### FIFO Strategy

License Plates are sorted by `created_at ASC`:

```sql
SELECT * FROM license_plates
WHERE product_id = :product_id
  AND status = 'available'
  AND qa_status = 'passed'
  AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
ORDER BY created_at ASC
LIMIT 100
```

### FEFO Strategy

License Plates are sorted by `expiry_date ASC, created_at ASC`:

```sql
SELECT * FROM license_plates
WHERE product_id = :product_id
  AND status = 'available'
  AND qa_status = 'passed'
  AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
ORDER BY expiry_date ASC NULLS LAST, created_at ASC
LIMIT 100
```

### Allocation Threshold

SO status changes to `allocated` when:

```
fulfillment_pct >= allocation_threshold_pct (default 80%)
```

---

## Undo Window

Allocations can be undone within 5 minutes:

- `undo_until` timestamp included in allocation response
- `undo_window_expired` flag in release response
- After 5 minutes, explicit release required via Actions menu

---

## Code Examples

### Fetch Allocation Data

```typescript
const response = await fetch(
  `/api/shipping/sales-orders/${soId}/allocations?strategy=FIFO`
)
const data = await response.json()
```

### Allocate Inventory

```typescript
const response = await fetch(
  `/api/shipping/sales-orders/${soId}/allocate`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      allocation_strategy: 'FIFO',
      allocations: [
        {
          sales_order_line_id: lineId,
          line_allocations: [
            { license_plate_id: lpId, quantity_to_allocate: 50 }
          ]
        }
      ],
      create_backorder_for_shortfall: true
    })
  }
)
```

### Release Allocation

```typescript
const response = await fetch(
  `/api/shipping/sales-orders/${soId}/release-allocation`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'manual_adjustment' })
  }
)
```

---

## Related Documentation

- [Sales Order Workflow Guide](/docs/guides/shipping/sales-order-workflow.md)
- [SO Status Transitions](/docs/guides/shipping/so-status-transitions.md)
- [Inventory Allocation User Guide](/docs/guides/shipping/inventory-allocation-guide.md)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-22 | Initial release (Story 07.7) |
