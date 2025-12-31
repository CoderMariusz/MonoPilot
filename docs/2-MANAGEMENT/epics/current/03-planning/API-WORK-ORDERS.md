# Work Order API Documentation

**Story**: 03.10
**Module**: Planning (03)
**Last Updated**: 2025-12-31

---

## Overview

The Work Order API provides comprehensive CRUD operations for managing work orders in the Manufacturing Execution System (MES). This includes creating, reading, updating, deleting work orders, managing status transitions, and handling material reservations and BOM auto-selection.

**Base URL**: `/api/planning/work-orders`

---

## Authentication & Authorization

All endpoints require:
- **Authentication**: Valid session token (Supabase auth)
- **Organization Context**: User must belong to an organization (org_id)
- **Row-Level Security (RLS)**: All queries filtered by org_id

### Role-Based Permissions

| Endpoint | Required Permission | Roles |
|----------|-------------------|-------|
| GET (List/Detail) | read | Admin, Production Manager, Production Operator, Planner, Viewer |
| POST (Create) | write | Admin, Production Manager, Planner |
| PUT (Update) | write | Admin, Production Manager, Planner |
| DELETE | delete | Admin, Production Manager (draft only) |
| Plan/Release/Cancel | transition | Admin, Production Manager, Planner |

---

## Endpoints

### 1. List Work Orders

```http
GET /api/planning/work-orders
```

**Query Parameters**

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| page | integer | No | Page number (1-indexed) | 1 |
| limit | integer | No | Items per page (1-100) | 20 |
| search | string | No | Search WO number (min 2 chars) | WO-202412 |
| product_id | string (UUID) | No | Filter by product | abc123... |
| status | string | No | Comma-separated statuses | planned,released,in_progress |
| line_id | string (UUID) | No | Filter by production line | xyz789... |
| machine_id | string (UUID) | No | Filter by machine | mach123... |
| priority | string | No | Filter by priority | high,critical |
| date_from | string (YYYY-MM-DD) | No | Start date for scheduled_date | 2024-12-20 |
| date_to | string (YYYY-MM-DD) | No | End date for scheduled_date | 2024-12-31 |
| sort | string | No | Sort field | created_at |
| order | string | No | Sort direction | asc, desc |

**Request Example**

```bash
curl -X GET "https://api.example.com/api/planning/work-orders?status=planned,released&priority=high&limit=20&page=1" \
  -H "Authorization: Bearer {token}"
```

**Response (200 OK)**

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "wo_number": "WO-20241220-0001",
      "product_code": "FG-CHOC-001",
      "product_name": "Chocolate Bar",
      "planned_quantity": 1000,
      "uom": "pc",
      "status": "planned",
      "planned_start_date": "2024-12-20",
      "production_line_name": "Packing #1",
      "priority": "high",
      "created_at": "2024-12-14T10:30:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "wo_number": "WO-20241219-0001",
      "product_code": "FG-VANILLA-001",
      "product_name": "Vanilla Cookie",
      "planned_quantity": 500,
      "uom": "kg",
      "status": "in_progress",
      "planned_start_date": "2024-12-19",
      "production_line_name": "Baking #2",
      "priority": "normal",
      "created_at": "2024-12-13T09:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

**Error Responses**

```json
// 400 Bad Request - Invalid filters
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid status value",
    "details": ["status must be one of: draft, planned, released, in_progress, on_hold, completed, closed, cancelled"]
  }
}

// 401 Unauthorized
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized"
  }
}
```

---

### 2. Get Work Order Summary (KPI)

```http
GET /api/planning/work-orders/summary
```

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| None | - | - |

**Response (200 OK)**

```json
{
  "success": true,
  "data": {
    "scheduled_today_count": 12,
    "in_progress_count": 8,
    "on_hold_count": 2,
    "this_week_count": 42
  }
}
```

---

### 3. Get BOM for Scheduled Date

```http
GET /api/planning/work-orders/bom-for-date
```

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| product_id | string (UUID) | Yes | Product UUID |
| scheduled_date | string (YYYY-MM-DD) | Yes | Scheduled production date |

**Request Example**

```bash
curl -X GET "https://api.example.com/api/planning/work-orders/bom-for-date?product_id=abc123&scheduled_date=2024-12-20" \
  -H "Authorization: Bearer {token}"
```

**Response (200 OK) - BOM Found**

```json
{
  "success": true,
  "data": {
    "bom_id": "bom-uuid-123",
    "bom_code": "BOM-CHOC-001",
    "bom_version": 2,
    "output_qty": 100,
    "effective_from": "2024-12-01",
    "effective_to": null,
    "routing_id": "routing-uuid-456",
    "item_count": 5,
    "is_current": true
  }
}
```

**Response (200 OK) - No BOM Found**

```json
{
  "success": true,
  "data": null
}
```

---

### 4. Get Available BOMs for Product

```http
GET /api/planning/work-orders/available-boms
```

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| product_id | string (UUID) | Yes | Product UUID |

**Request Example**

```bash
curl -X GET "https://api.example.com/api/planning/work-orders/available-boms?product_id=abc123" \
  -H "Authorization: Bearer {token}"
```

**Response (200 OK)**

```json
{
  "success": true,
  "data": [
    {
      "bom_id": "bom-uuid-123",
      "bom_code": "BOM-CHOC-001",
      "bom_version": 2,
      "output_qty": 100,
      "effective_from": "2024-12-01",
      "effective_to": null,
      "routing_id": "routing-uuid-456",
      "routing_name": "Standard Production",
      "item_count": 5,
      "is_current": true
    },
    {
      "bom_id": "bom-uuid-122",
      "bom_code": "BOM-CHOC-001",
      "bom_version": 1,
      "output_qty": 100,
      "effective_from": "2024-01-01",
      "effective_to": "2024-11-30",
      "routing_id": "routing-uuid-455",
      "routing_name": "Legacy Process",
      "item_count": 4,
      "is_current": false
    }
  ]
}
```

---

### 5. Get Next WO Number

```http
GET /api/planning/work-orders/next-number
```

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| date | string (YYYY-MM-DD) | No | Target date (defaults to today) |

**Response (200 OK)**

```json
{
  "success": true,
  "data": "WO-20241220-0005"
}
```

---

### 6. Create Work Order

```http
POST /api/planning/work-orders
```

**Request Headers**

```
Content-Type: application/json
Authorization: Bearer {token}
```

**Request Body**

```json
{
  "product_id": "prod-uuid-123",
  "planned_quantity": 1000,
  "planned_start_date": "2024-12-20",
  "bom_id": "bom-uuid-456",
  "planned_end_date": "2024-12-21",
  "scheduled_start_time": "08:00",
  "scheduled_end_time": "16:00",
  "production_line_id": "line-uuid-789",
  "machine_id": null,
  "priority": "high",
  "source_of_demand": "manual",
  "source_reference": null,
  "expiry_date": "2025-06-20",
  "notes": "Customer order #4567 - use organic cocoa if available"
}
```

**Request Example**

```bash
curl -X POST "https://api.example.com/api/planning/work-orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "product_id": "prod-uuid-123",
    "planned_quantity": 1000,
    "planned_start_date": "2024-12-20",
    "bom_id": "bom-uuid-456",
    "production_line_id": "line-uuid-789",
    "priority": "high",
    "notes": "Customer order #4567"
  }'
```

**Response (201 Created)**

```json
{
  "success": true,
  "data": {
    "id": "wo-uuid-001",
    "wo_number": "WO-20241220-0001",
    "org_id": "org-uuid-123",
    "product_id": "prod-uuid-123",
    "bom_id": "bom-uuid-456",
    "routing_id": "routing-uuid-789",
    "planned_quantity": 1000,
    "produced_quantity": 0,
    "uom": "pc",
    "status": "draft",
    "planned_start_date": "2024-12-20",
    "planned_end_date": "2024-12-21",
    "scheduled_start_time": "08:00",
    "scheduled_end_time": "16:00",
    "production_line_id": "line-uuid-789",
    "machine_id": null,
    "priority": "high",
    "source_of_demand": "manual",
    "source_reference": null,
    "expiry_date": "2025-06-20",
    "notes": "Customer order #4567 - use organic cocoa if available",
    "created_at": "2024-12-14T10:30:00Z",
    "updated_at": "2024-12-14T10:30:00Z",
    "created_by": "user-uuid-001",
    "updated_by": "user-uuid-001"
  }
}
```

**Validation Errors (400 Bad Request)**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      "product_id is required",
      "planned_quantity must be greater than 0",
      "planned_start_date must be a future date"
    ]
  }
}
```

**Product Not Found (404)**

```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found"
  }
}
```

---

### 7. Get Work Order Detail

```http
GET /api/planning/work-orders/{id}
```

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (UUID) | Work order UUID |

**Request Example**

```bash
curl -X GET "https://api.example.com/api/planning/work-orders/wo-uuid-001" \
  -H "Authorization: Bearer {token}"
```

**Response (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": "wo-uuid-001",
    "wo_number": "WO-20241220-0001",
    "org_id": "org-uuid-123",
    "product_id": "prod-uuid-123",
    "bom_id": "bom-uuid-456",
    "routing_id": "routing-uuid-789",
    "planned_quantity": 1000,
    "produced_quantity": 650,
    "uom": "pc",
    "status": "in_progress",
    "planned_start_date": "2024-12-20",
    "planned_end_date": "2024-12-21",
    "scheduled_start_time": "08:00",
    "scheduled_end_time": "16:00",
    "production_line_id": "line-uuid-789",
    "machine_id": null,
    "priority": "high",
    "source_of_demand": "manual",
    "source_reference": null,
    "started_at": "2024-12-19T08:00:00Z",
    "completed_at": null,
    "paused_at": null,
    "pause_reason": null,
    "actual_qty": 650,
    "yield_percent": 65,
    "expiry_date": "2025-06-20",
    "notes": "Customer order #4567 - use organic cocoa if available",
    "created_at": "2024-12-14T10:30:00Z",
    "updated_at": "2024-12-19T14:10:00Z",
    "created_by": "user-uuid-001",
    "updated_by": "user-uuid-002",
    "product": {
      "id": "prod-uuid-123",
      "code": "FG-CHOC-001",
      "name": "Chocolate Bar",
      "base_uom": "pc"
    },
    "bom": {
      "id": "bom-uuid-456",
      "code": "BOM-CHOC-001",
      "version": 2,
      "output_qty": 100,
      "effective_from": "2024-12-01",
      "effective_to": null
    },
    "routing": {
      "id": "routing-uuid-789",
      "code": "ROUTING-STD",
      "name": "Standard Production"
    },
    "production_line": {
      "id": "line-uuid-789",
      "code": "PACK-01",
      "name": "Packing #1"
    },
    "machine": null,
    "created_by_user": {
      "name": "John Smith"
    }
  }
}
```

**Not Found (404)**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Work order not found"
  }
}
```

---

### 8. Update Work Order

```http
PUT /api/planning/work-orders/{id}
```

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (UUID) | Work order UUID |

**Request Body** (all fields optional)

```json
{
  "planned_quantity": 1200,
  "production_line_id": "line-uuid-999",
  "machine_id": "mach-uuid-111",
  "priority": "critical",
  "scheduled_start_time": "09:00",
  "scheduled_end_time": "17:00",
  "notes": "Updated notes",
  "expiry_date": "2025-07-20"
}
```

**Response (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": "wo-uuid-001",
    "wo_number": "WO-20241220-0001",
    "status": "draft",
    "planned_quantity": 1200,
    "production_line_id": "line-uuid-999",
    "machine_id": "mach-uuid-111",
    "priority": "critical",
    "scheduled_start_time": "09:00",
    "scheduled_end_time": "17:00",
    "notes": "Updated notes",
    "updated_at": "2024-12-14T11:00:00Z",
    "updated_by": "user-uuid-002"
  }
}
```

**Field Lock Rules After Release**

```
Status: Released or later

Cannot modify:
- product_id
- bom_id
- planned_quantity

Can modify:
- production_line_id
- machine_id
- priority
- scheduled_start_time
- scheduled_end_time
- notes
- expiry_date
```

---

### 9. Delete Work Order

```http
DELETE /api/planning/work-orders/{id}
```

**Constraints**

- Only draft status work orders can be deleted
- Requires WORK_ORDER_DELETE permission

**Response (200 OK)**

```json
{
  "success": true,
  "message": "Work order deleted successfully"
}
```

**Cannot Delete (400)**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATUS",
    "message": "Only draft work orders can be deleted. Current status: planned"
  }
}
```

---

### 10. Plan Work Order

```http
POST /api/planning/work-orders/{id}/plan
```

**Status Transition**: draft → planned

**Request Body** (optional)

```json
{
  "notes": "Scheduled for production"
}
```

**Response (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": "wo-uuid-001",
    "wo_number": "WO-20241220-0001",
    "status": "planned",
    "updated_at": "2024-12-16T14:00:00Z"
  }
}
```

---

### 11. Release Work Order

```http
POST /api/planning/work-orders/{id}/release
```

**Status Transition**: planned → released

**Request Body** (optional)

```json
{
  "notes": "Materials confirmed, ready for production"
}
```

**Response (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": "wo-uuid-001",
    "wo_number": "WO-20241220-0001",
    "status": "released",
    "updated_at": "2024-12-19T07:00:00Z"
  }
}
```

---

### 12. Cancel Work Order

```http
POST /api/planning/work-orders/{id}/cancel
```

**Status Transitions**: Any status (except completed, closed)

**Request Body** (optional)

```json
{
  "reason": "Customer order cancelled"
}
```

**Response (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": "wo-uuid-001",
    "wo_number": "WO-20241220-0001",
    "status": "cancelled",
    "updated_at": "2024-12-18T10:00:00Z"
  }
}
```

---

### 13. Get Status History

```http
GET /api/planning/work-orders/{id}/history
```

**Response (200 OK)**

```json
{
  "success": true,
  "data": [
    {
      "id": "history-uuid-1",
      "wo_id": "wo-uuid-001",
      "from_status": "draft",
      "to_status": "planned",
      "changed_by": "user-uuid-001",
      "changed_at": "2024-12-16T14:00:00Z",
      "notes": "Scheduled for production",
      "changed_by_user": {
        "name": "John Smith"
      }
    },
    {
      "id": "history-uuid-2",
      "wo_id": "wo-uuid-001",
      "from_status": "planned",
      "to_status": "released",
      "changed_by": "user-uuid-001",
      "changed_at": "2024-12-19T07:00:00Z",
      "notes": "Materials confirmed, ready for production",
      "changed_by_user": {
        "name": "John Smith"
      }
    }
  ]
}
```

---

## Error Codes Reference

| Code | Status | Description |
|------|--------|-------------|
| PRODUCT_NOT_FOUND | 404 | Product does not exist or not accessible |
| BOM_NOT_FOUND | 404 | BOM does not exist or not accessible |
| INVALID_BOM | 400 | BOM does not belong to selected product |
| INACTIVE_BOM | 400 | BOM status is not active |
| NOT_FOUND | 404 | Work order not found |
| INVALID_STATUS | 400 | Current status does not allow this action |
| INVALID_TRANSITION | 400 | Status transition not allowed |
| FIELD_LOCKED | 400 | Field cannot be modified in current status |
| VALIDATION_ERROR | 400 | Input validation failed |
| UNAUTHORIZED | 401 | User not authenticated |
| FORBIDDEN | 403 | User lacks required permissions |
| NUMBER_GENERATION_ERROR | 500 | Failed to generate WO number |
| FETCH_ERROR | 500 | Database query failed |
| CREATE_ERROR | 500 | Failed to create work order |
| UPDATE_ERROR | 500 | Failed to update work order |
| DELETE_ERROR | 500 | Failed to delete work order |

---

## Status Transition Matrix

```
draft     → [planned, cancelled]
planned   → [released, draft, cancelled]
released  → [in_progress, cancelled]
in_progress → [on_hold, completed]
on_hold   → [in_progress, cancelled]
completed → [closed]
closed    → []
cancelled → []
```

---

## BOM Auto-Selection Algorithm

**When Creating Work Order Without Explicit BOM:**

1. Query active BOMs for the product where:
   - status = 'active'
   - effective_from <= planned_start_date
   - effective_to IS NULL OR effective_to >= planned_start_date

2. If multiple matches found:
   - Sort by version DESC (highest version = most recent)
   - Select the first match

3. Result:
   - If found: Auto-populate bom_id and routing_id from BOM
   - If not found: Allow creation as draft (warning shown in UI)

**Example:**

```json
// Query
{
  "product_id": "prod-uuid-123",
  "planned_start_date": "2024-12-20"
}

// Results
[
  { bom_id: "bom-v2", version: 2, effective_from: "2024-12-01" },  // Selected
  { bom_id: "bom-v1", version: 1, effective_from: "2024-01-01", effective_to: "2024-11-30" }
]
```

---

## Rate Limiting

- **List endpoint**: 100 requests/minute per user
- **Create/Update endpoints**: 50 requests/minute per user
- **Other endpoints**: 200 requests/minute per user

---

## Pagination

All list endpoints use cursor-based pagination:

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

Recommended: Use `limit=20` for optimal performance.

---

## Response Format

All responses follow standardized format:

```json
{
  "success": true|false,
  "data": null|object|array,
  "error": null|{
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": null|[]
  },
  "meta": null|object
}
```

---

## Testing Code Examples

### Create a Work Order (JavaScript/TypeScript)

```typescript
const response = await fetch('/api/planning/work-orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    product_id: 'prod-uuid-123',
    planned_quantity: 1000,
    planned_start_date: '2024-12-20',
    bom_id: 'bom-uuid-456',
    production_line_id: 'line-uuid-789',
    priority: 'high',
    notes: 'Test WO'
  })
});

const result = await response.json();
if (result.success) {
  console.log('WO created:', result.data.wo_number);
} else {
  console.error('Error:', result.error.message);
}
```

### List Work Orders with Filters (JavaScript/TypeScript)

```typescript
const params = new URLSearchParams({
  status: 'planned,released',
  priority: 'high',
  limit: '20',
  page: '1'
});

const response = await fetch(`/api/planning/work-orders?${params}`);
const result = await response.json();

result.data.forEach(wo => {
  console.log(`${wo.wo_number}: ${wo.product_name} (${wo.status})`);
});
```

### Get Auto-Selected BOM (JavaScript/TypeScript)

```typescript
const response = await fetch(
  '/api/planning/work-orders/bom-for-date?product_id=prod-123&scheduled_date=2024-12-20'
);

const result = await response.json();
if (result.data) {
  console.log(`Selected BOM: v${result.data.bom_version}`);
} else {
  console.log('No active BOM found for this date');
}
```

---

## API Client Library Integration

### Using React Query

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// List work orders
const { data, isLoading } = useQuery({
  queryKey: ['work-orders', { status: 'planned' }],
  queryFn: async () => {
    const response = await fetch('/api/planning/work-orders?status=planned');
    return response.json();
  }
});

// Create work order
const createMutation = useMutation({
  mutationFn: async (input) => {
    const response = await fetch('/api/planning/work-orders', {
      method: 'POST',
      body: JSON.stringify(input)
    });
    return response.json();
  }
});
```

---

## Related Documentation

- [Work Order Database Schema](./DATABASE-WORK-ORDERS.md)
- [Work Order Components](./COMPONENTS-WORK-ORDERS.md)
- [Work Order Developer Guide](./DEV-GUIDE-WORK-ORDERS.md)
- [Wireframe: PLAN-013 (List)](../../3-ARCHITECTURE/ux/wireframes/PLAN-013-work-order-list.md)
- [Wireframe: PLAN-014 (Create)](../../3-ARCHITECTURE/ux/wireframes/PLAN-014-work-order-create-modal.md)
- [Wireframe: PLAN-015 (Detail)](../../3-ARCHITECTURE/ux/wireframes/PLAN-015-work-order-detail.md)

---

**Last Reviewed**: 2025-12-31
**Version**: 1.0
**Status**: Complete
