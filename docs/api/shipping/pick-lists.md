# Pick List API Reference

> Story 07.8 - Pick List Generation + Wave Picking

## Overview

The Pick List API enables warehouse operations to generate pick lists from allocated sales orders, assign pickers, and track picking progress. Supports single-order picking and wave picking (multi-order consolidation).

## Base URL

```
/api/shipping/pick-lists
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/shipping/pick-lists` | List pick lists with filters |
| POST | `/api/shipping/pick-lists` | Create pick list from sales orders |
| GET | `/api/shipping/pick-lists/:id` | Get pick list detail |
| POST | `/api/shipping/pick-lists/:id/assign` | Assign picker to pick list |
| GET | `/api/shipping/pick-lists/:id/lines` | Get pick lines for a pick list |
| GET | `/api/shipping/pick-lists/my-picks` | Get current user's assigned picks |
| POST | `/api/shipping/pick-lists/:id/start` | Start picking (status to in_progress) |
| POST | `/api/shipping/pick-lists/:id/complete` | Complete pick list |

---

## Authentication

All endpoints require authentication via Supabase Auth. Include the session token in request headers:

```http
Authorization: Bearer <session_token>
```

## Authorization Roles

| Action | Allowed Roles |
|--------|---------------|
| Create pick list | owner, admin, manager, warehouse_manager, shipping_manager |
| Assign picker | owner, admin, manager, warehouse_manager, shipping_manager |
| View pick lists | All authenticated users |
| Pick (be assigned) | owner, admin, manager, warehouse_manager, picker, warehouse_operator |

---

## Endpoints Detail

### List Pick Lists

```http
GET /api/shipping/pick-lists
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Comma-separated statuses: pending,assigned,in_progress,completed,cancelled |
| `assigned_to` | string | No | User ID or "unassigned" |
| `priority` | string | No | low, normal, high, urgent |
| `date_from` | string | No | Start date (YYYY-MM-DD) |
| `date_to` | string | No | End date (YYYY-MM-DD) |
| `search` | string | No | Search by pick list number (min 2 chars) |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 20, max: 100) |
| `sort_by` | string | No | pick_list_number, created_at, status, priority |
| `sort_order` | string | No | asc, desc (default: desc) |

#### Response

```json
{
  "pick_lists": [
    {
      "id": "uuid",
      "org_id": "uuid",
      "pick_list_number": "PL-2026-00042",
      "pick_type": "single_order",
      "status": "assigned",
      "priority": "normal",
      "assigned_to": "uuid",
      "wave_id": null,
      "created_at": "2026-01-22T10:00:00Z",
      "created_by": "uuid",
      "started_at": null,
      "completed_at": null,
      "assigned_user": {
        "id": "uuid",
        "name": "John Picker"
      },
      "line_count": 12,
      "lines_picked": 0,
      "lines_short": 0
    }
  ],
  "total": 45,
  "page": 1,
  "pages": 3
}
```

---

### Create Pick List

```http
POST /api/shipping/pick-lists
```

Create a pick list from one or more sales orders. Single order creates type `single_order`, multiple orders create type `wave` with consolidated lines.

#### Request Body

```json
{
  "sales_order_ids": ["uuid1", "uuid2"],
  "priority": "normal",
  "assigned_to": "uuid"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sales_order_ids` | string[] | Yes | Array of sales order UUIDs (min 1) |
| `priority` | string | No | low, normal, high, urgent (default: normal) |
| `assigned_to` | string | No | Immediately assign to picker |

#### Response (201 Created)

```json
{
  "pick_list_id": "uuid",
  "pick_list_number": "PL-2026-00042",
  "pick_type": "wave",
  "line_count": 25,
  "status": "assigned"
}
```

#### Business Rules

1. All sales orders must have status `confirmed`
2. All sales orders must have inventory allocations
3. Pick lines are sorted by location hierarchy: zone (A-Z) -> aisle (numeric) -> bin (numeric)
4. Each allocation becomes one pick line with assigned `pick_sequence`
5. Wave picking consolidates lines by (location_id, product_id)
6. Sales order status updates to `picking` when pick list is created

#### Error Responses

| Status | Code | Message |
|--------|------|---------|
| 400 | NOT_FOUND | Sales orders not found: [ids] |
| 400 | INVALID_SO_STATUS | Sales orders must be in confirmed status |
| 400 | NO_ALLOCATIONS | No inventory allocations found |
| 400 | INVALID_ROLE | Assigned user does not have picker role |
| 500 | NUMBER_GENERATION_ERROR | Failed to generate pick list number |

---

### Get Pick List Detail

```http
GET /api/shipping/pick-lists/:id
```

#### Response

```json
{
  "pick_list": {
    "id": "uuid",
    "pick_list_number": "PL-2026-00042",
    "pick_type": "wave",
    "status": "assigned",
    "priority": "high",
    "assigned_to": "uuid",
    "created_at": "2026-01-22T10:00:00Z",
    "assigned_user": { "id": "uuid", "name": "John Picker" },
    "sales_orders": [
      { "id": "uuid", "order_number": "SO-2026-00001", "customer_name": "Acme Corp" },
      { "id": "uuid", "order_number": "SO-2026-00002", "customer_name": "Beta Inc" }
    ],
    "line_count": 25,
    "lines_picked": 10,
    "lines_short": 1
  },
  "lines": [
    {
      "id": "uuid",
      "pick_list_id": "uuid",
      "sales_order_line_id": "uuid",
      "license_plate_id": "uuid",
      "location_id": "uuid",
      "product_id": "uuid",
      "lot_number": "LOT-2026-001",
      "quantity_to_pick": 50,
      "quantity_picked": 50,
      "pick_sequence": 1,
      "status": "picked",
      "product": { "id": "uuid", "code": "PROD-001", "name": "Widget A" },
      "location": {
        "id": "uuid",
        "zone": "Dry",
        "aisle": "A1",
        "bin": "01",
        "full_path": "Dry / Aisle A1 / Bin 01"
      },
      "license_plate": {
        "id": "uuid",
        "lp_number": "LP-000123",
        "quantity": 100,
        "expiry_date": "2026-06-15"
      }
    }
  ]
}
```

---

### Assign Picker

```http
POST /api/shipping/pick-lists/:id/assign
```

#### Request Body

```json
{
  "assigned_to": "uuid"
}
```

#### Response

```json
{
  "id": "uuid",
  "pick_list_number": "PL-2026-00042",
  "status": "assigned",
  "assigned_to": "uuid"
}
```

#### Business Rules

1. Pick list must have status `pending` or `assigned`
2. Assigned user must have picker role
3. Status automatically changes to `assigned`

---

### Get My Picks

```http
GET /api/shipping/pick-lists/my-picks
```

Returns pick lists assigned to the current authenticated user.

#### Response

```json
{
  "pick_lists": [
    {
      "id": "uuid",
      "pick_list_number": "PL-2026-00042",
      "pick_type": "single_order",
      "status": "assigned",
      "priority": "urgent",
      "line_count": 12,
      "lines_picked": 5
    }
  ]
}
```

#### Sorting

Results are sorted by:
1. Priority (urgent first)
2. Created date (oldest first)

Only includes status: `assigned`, `in_progress`

---

### Get Pick Lines

```http
GET /api/shipping/pick-lists/:id/lines
```

#### Response

```json
{
  "lines": [
    {
      "id": "uuid",
      "pick_sequence": 1,
      "product": { "code": "PROD-001", "name": "Widget A" },
      "location": { "zone": "Dry", "aisle": "A1", "bin": "01", "full_path": "Dry / Aisle A1 / Bin 01" },
      "license_plate": { "lp_number": "LP-000123", "quantity": 100 },
      "lot_number": "LOT-2026-001",
      "quantity_to_pick": 50,
      "quantity_picked": 0,
      "status": "pending"
    }
  ]
}
```

Lines are sorted by `pick_sequence` (ascending) for optimal warehouse route.

---

## Database Schema

### pick_lists

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| org_id | UUID | Organization (multi-tenant) |
| pick_list_number | TEXT | PL-YYYY-NNNNN format |
| pick_type | TEXT | single_order, wave |
| status | TEXT | pending, assigned, in_progress, completed, cancelled |
| priority | TEXT | low, normal, high, urgent |
| assigned_to | UUID | Assigned picker |
| wave_id | UUID | Optional wave grouping |
| created_at | TIMESTAMPTZ | Creation timestamp |
| created_by | UUID | Creator user |
| started_at | TIMESTAMPTZ | When picking started |
| completed_at | TIMESTAMPTZ | When picking completed |

### pick_list_lines

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| org_id | UUID | Organization |
| pick_list_id | UUID | Parent pick list |
| sales_order_line_id | UUID | Source SO line |
| license_plate_id | UUID | Suggested LP |
| location_id | UUID | Pick location |
| product_id | UUID | Product to pick |
| lot_number | TEXT | Lot from LP |
| quantity_to_pick | DECIMAL | Quantity required |
| quantity_picked | DECIMAL | Quantity picked |
| pick_sequence | INTEGER | Route order |
| status | TEXT | pending, picked, short |
| picked_license_plate_id | UUID | Actual picked LP |
| picked_at | TIMESTAMPTZ | When picked |
| picked_by | UUID | Picker user |
| short_pick_reason | TEXT | Reason for short pick |

### pick_list_sales_orders

Junction table linking pick lists to sales orders.

| Column | Type | Description |
|--------|------|-------------|
| pick_list_id | UUID | Pick list |
| sales_order_id | UUID | Sales order |

---

## Pick Sequence Algorithm

Pick lines are sorted by location hierarchy to minimize warehouse travel:

1. **Zone** (alphabetical): Chilled -> Dry -> Frozen
2. **Aisle** (numeric): A1 -> A2 -> B1
3. **Bin** (numeric): 01 -> 02 -> 03

Example sequence:
```
1. Dry / A1 / 01
2. Dry / A1 / 03
3. Dry / A2 / 01
4. Frozen / B1 / 01
```

---

## Status Workflow

```
pending -> assigned -> in_progress -> completed
                                   -> cancelled
```

| Transition | Trigger |
|------------|---------|
| pending -> assigned | Assign picker |
| assigned -> in_progress | Start picking (07.9/07.10) |
| in_progress -> completed | All lines picked/short |
| any -> cancelled | Cancel pick list (if not in_progress) |

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| VALIDATION_ERROR | 400 | Invalid request body |
| NOT_FOUND | 404 | Pick list not found |
| INVALID_SO_STATUS | 400 | SO not in confirmed status |
| NO_ALLOCATIONS | 400 | No allocations for SOs |
| USER_NOT_FOUND | 400 | Assigned user not found |
| INVALID_ROLE | 400 | User cannot be assigned |
| INVALID_STATUS | 400 | Status transition not allowed |
| FETCH_ERROR | 500 | Database query failed |
| CREATE_ERROR | 500 | Insert failed |

---

## TypeScript Types

```typescript
import type {
  PickList,
  PickListLine,
  CreatePickListInput,
  CreatePickListResult,
  PickListFilters,
  PickListsListResult,
  PickListDetailResult,
  PickListStatus,
  PickListType,
  PickListPriority,
} from '@/lib/validation/pick-list-schemas'
```

---

## Related

- [Sales Orders API](/docs/api/shipping/sales-orders.md)
- [Inventory Allocation](/docs/api/shipping/inventory-allocation.md)
- [Pick List User Guide](/docs/guides/shipping/pick-list-workflow.md)
