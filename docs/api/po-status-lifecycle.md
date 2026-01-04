# PO Status Lifecycle API Documentation

**Story:** 03.7 - PO Status Lifecycle (Configurable Statuses)
**Version:** 1.0
**Last Updated:** 2026-01-02

## Overview

The PO Status Lifecycle API provides configurable purchase order status management with transition validation, history tracking, and admin controls. This allows organizations to customize their procurement workflow while maintaining system integrity.

## Base URL

```
/api/settings/planning/po-statuses
```

## Authentication

All endpoints require authentication via Supabase Auth session. Most endpoints require **Admin role** (`admin`, `owner`, or `super_admin`).

## Endpoints

### 1. List PO Statuses

Retrieve all PO statuses for the organization, ordered by `display_order`.

**Endpoint:** `GET /api/settings/planning/po-statuses`

**Authentication:** Admin only

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `include` | string | No | Set to `usage_count` to include count of POs per status |

**Response:** `200 OK`

```json
{
  "statuses": [
    {
      "id": "uuid",
      "org_id": "uuid",
      "code": "draft",
      "name": "Draft",
      "color": "gray",
      "display_order": 1,
      "is_system": true,
      "is_active": true,
      "description": "PO is being prepared, not yet submitted",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z",
      "po_count": 12
    }
  ],
  "total": 7
}
```

**Example Request:**

```bash
curl -X GET "https://your-domain.com/api/settings/planning/po-statuses?include=usage_count" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

**Error Responses:**

- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User does not have admin role
- `500 Internal Server Error` - Database or server error

---

### 2. Create PO Status

Create a new custom PO status.

**Endpoint:** `POST /api/settings/planning/po-statuses`

**Authentication:** Admin only

**Request Body:**

```json
{
  "code": "awaiting_vendor",
  "name": "Awaiting Vendor Confirmation",
  "color": "orange",
  "display_order": 3,
  "description": "Waiting for vendor to confirm order"
}
```

**Field Validation:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `code` | string | Yes | 2-50 chars, lowercase + underscores, must start with letter, unique per org |
| `name` | string | Yes | 2-100 chars |
| `color` | enum | No | One of: gray, blue, yellow, green, purple, emerald, red, orange, amber, teal, indigo (default: gray) |
| `display_order` | number | No | Positive integer (auto-assigned if omitted) |
| `description` | string | No | Max 500 chars, nullable |

**Response:** `201 Created`

```json
{
  "id": "uuid",
  "org_id": "uuid",
  "code": "awaiting_vendor",
  "name": "Awaiting Vendor Confirmation",
  "color": "orange",
  "display_order": 3,
  "is_system": false,
  "is_active": true,
  "description": "Waiting for vendor to confirm order",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

**Headers:**

```
Location: /api/settings/planning/po-statuses/{id}
```

**Error Responses:**

- `400 Bad Request` - Validation failed or duplicate code
  ```json
  {
    "error": "Status code must be unique within organization"
  }
  ```
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User does not have admin role
- `500 Internal Server Error` - Database error

**Example Request:**

```bash
curl -X POST "https://your-domain.com/api/settings/planning/po-statuses" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "awaiting_vendor",
    "name": "Awaiting Vendor Confirmation",
    "color": "orange"
  }'
```

---

### 3. Get PO Status

Retrieve a single PO status by ID.

**Endpoint:** `GET /api/settings/planning/po-statuses/:id`

**Authentication:** Admin only

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Status ID |

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "org_id": "uuid",
  "code": "confirmed",
  "name": "Confirmed",
  "color": "green",
  "display_order": 4,
  "is_system": true,
  "is_active": true,
  "description": "PO has been confirmed by supplier",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

**Error Responses:**

- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User does not have admin role
- `404 Not Found` - Status not found or belongs to different org
- `500 Internal Server Error` - Database error

---

### 4. Update PO Status

Update an existing PO status. System statuses cannot have their `name` changed.

**Endpoint:** `PUT /api/settings/planning/po-statuses/:id`

**Authentication:** Admin only

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Status ID |

**Request Body (all fields optional):**

```json
{
  "name": "Vendor Review",
  "color": "amber",
  "display_order": 4,
  "description": "Under vendor review",
  "is_active": true
}
```

**Field Constraints:**

| Field | Type | Constraints |
|-------|------|-------------|
| `name` | string | 2-100 chars (cannot modify system status names) |
| `color` | enum | One of 11 allowed colors |
| `display_order` | number | Positive integer |
| `description` | string | Max 500 chars, nullable |
| `is_active` | boolean | - |

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "code": "awaiting_vendor",
  "name": "Vendor Review",
  "color": "amber",
  "display_order": 4,
  ...
}
```

**Error Responses:**

- `400 Bad Request` - Validation failed or attempted to modify system status name
  ```json
  {
    "error": "Cannot change name of system status"
  }
  ```
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User does not have admin role
- `404 Not Found` - Status not found
- `500 Internal Server Error` - Database error

---

### 5. Delete PO Status

Delete a custom PO status. Cannot delete system statuses or statuses currently in use.

**Endpoint:** `DELETE /api/settings/planning/po-statuses/:id`

**Authentication:** Admin only

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Status ID |

**Response:** `204 No Content`

**Error Responses:**

- `400 Bad Request` - Status is in use or is a system status
  ```json
  {
    "error": "Cannot delete. 5 POs use this status. Change their status first."
  }
  ```
  ```json
  {
    "error": "Cannot delete system status"
  }
  ```
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User does not have admin role
- `404 Not Found` - Status not found
- `500 Internal Server Error` - Database error

**Example Request:**

```bash
curl -X DELETE "https://your-domain.com/api/settings/planning/po-statuses/{id}" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

---

### 6. Reorder Statuses

Bulk update display order for all statuses.

**Endpoint:** `PUT /api/settings/planning/po-statuses/reorder`

**Authentication:** Admin only

**Request Body:**

```json
{
  "status_ids": [
    "uuid-1",
    "uuid-2",
    "uuid-3",
    "uuid-4"
  ]
}
```

Array order determines new `display_order` (1-indexed).

**Response:** `200 OK`

```json
{
  "statuses": [...],
  "total": 7
}
```

**Error Responses:**

- `400 Bad Request` - Validation failed or status IDs not found
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User does not have admin role
- `500 Internal Server Error` - Database error

---

### 7. Get Status Transitions

Retrieve allowed transitions from a status.

**Endpoint:** `GET /api/settings/planning/po-statuses/:id/transitions`

**Authentication:** Admin only

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Status ID (from status) |

**Response:** `200 OK`

```json
{
  "transitions": [
    {
      "id": "uuid",
      "org_id": "uuid",
      "from_status_id": "uuid",
      "to_status_id": "uuid",
      "is_system": false,
      "requires_approval": false,
      "requires_reason": false,
      "condition_function": null,
      "created_at": "2024-01-15T10:00:00Z",
      "to_status": {
        "id": "uuid",
        "code": "submitted",
        "name": "Submitted",
        "color": "blue",
        ...
      }
    }
  ],
  "total": 3
}
```

**Error Responses:**

- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User does not have admin role
- `404 Not Found` - Status not found
- `500 Internal Server Error` - Database error

---

### 8. Update Status Transitions

Configure which statuses can be transitioned to from a given status.

**Endpoint:** `PUT /api/settings/planning/po-statuses/:id/transitions`

**Authentication:** Admin only

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Status ID (from status) |

**Request Body:**

```json
{
  "allowed_to_status_ids": [
    "uuid-submitted",
    "uuid-cancelled"
  ]
}
```

**Validation:**

- Max 20 transitions
- Cannot create self-loop (from status = to status)
- Cannot remove system-required transitions

**Response:** `200 OK`

```json
{
  "transitions": [...],
  "total": 2
}
```

**Error Responses:**

- `400 Bad Request` - Validation failed or attempted to remove system transition
  ```json
  {
    "error": "Cannot remove system-required transition"
  }
  ```
  ```json
  {
    "error": "Cannot create self-loop transition"
  }
  ```
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User does not have admin role
- `404 Not Found` - Status not found
- `500 Internal Server Error` - Database error

---

## Status Operations (User-Facing)

These endpoints are used by planners to change PO statuses and view history.

### 9. Get Available Transitions for PO

Get allowed next statuses for a specific purchase order.

**Endpoint:** `GET /api/planning/purchase-orders/:id/status/available`

**Authentication:** Authenticated (Planner or above)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Purchase Order ID |

**Response:** `200 OK`

```json
{
  "statuses": [
    {
      "id": "uuid",
      "code": "submitted",
      "name": "Submitted",
      "color": "blue",
      "display_order": 2,
      ...
    }
  ],
  "current_status": "draft"
}
```

---

### 10. Validate Status Transition

Check if a status transition is valid before attempting.

**Endpoint:** `POST /api/planning/purchase-orders/:id/status/validate`

**Authentication:** Authenticated (Planner or above)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Purchase Order ID |

**Request Body:**

```json
{
  "to_status": "submitted"
}
```

**Response:** `200 OK`

```json
{
  "valid": true,
  "warnings": [
    "PO total exceeds 10,000"
  ]
}
```

Or if invalid:

```json
{
  "valid": false,
  "reason": "Cannot submit PO without line items"
}
```

**Business Rules Enforced:**

1. Transition must be allowed in configuration
2. Cannot submit without line items (`draft` → `submitted` or `pending_approval`)
3. Warnings for high-value POs (>$10,000)

---

### 11. Change PO Status

Execute a status transition for a purchase order.

**Endpoint:** `POST /api/planning/purchase-orders/:id/status`

**Authentication:** Authenticated (Planner or above)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Purchase Order ID |

**Request Body:**

```json
{
  "to_status": "submitted",
  "notes": "Ready for processing"
}
```

**Field Validation:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `to_status` | string | Yes | 2-50 chars, valid status code |
| `notes` | string | No | Max 500 chars, nullable |

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "status": "submitted"
}
```

**Side Effects:**

1. PO `status` field updated
2. `updated_at` and `updated_by` set
3. `po_status_history` record created with user, timestamp, and notes

**Error Responses:**

- `400 Bad Request` - Invalid transition
  ```json
  {
    "error": "Invalid transition: confirmed -> draft"
  }
  ```
  ```json
  {
    "error": "Cannot submit PO without line items"
  }
  ```
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - PO not found
- `500 Internal Server Error` - Database error

**Example Request:**

```bash
curl -X POST "https://your-domain.com/api/planning/purchase-orders/{id}/status" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to_status": "submitted",
    "notes": "Ready for vendor"
  }'
```

---

### 12. Get PO Status History

Retrieve complete status change history for a purchase order.

**Endpoint:** `GET /api/planning/purchase-orders/:id/status/history`

**Authentication:** Authenticated (Planner or above)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Purchase Order ID |

**Response:** `200 OK`

```json
{
  "history": [
    {
      "id": "uuid",
      "po_id": "uuid",
      "from_status": "draft",
      "to_status": "submitted",
      "changed_by": "user-uuid",
      "changed_at": "2024-01-15T11:30:00Z",
      "notes": "Ready for processing",
      "transition_metadata": null,
      "user": {
        "id": "user-uuid",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com"
      }
    },
    {
      "id": "uuid",
      "po_id": "uuid",
      "from_status": null,
      "to_status": "draft",
      "changed_by": "user-uuid",
      "changed_at": "2024-01-15T10:00:00Z",
      "notes": "PO created",
      "user": {...}
    }
  ],
  "total": 2
}
```

**Notes:**

- Sorted by `changed_at` descending (newest first)
- `from_status` is `null` for PO creation
- `changed_by` is `null` for system-triggered transitions

---

## Status Colors

11 predefined colors for status badges:

| Color | CSS Classes | Use Case |
|-------|-------------|----------|
| `gray` | bg-gray-100 text-gray-800 | Draft, inactive |
| `blue` | bg-blue-100 text-blue-800 | Submitted, in progress |
| `yellow` | bg-yellow-100 text-yellow-800 | Pending, awaiting |
| `green` | bg-green-100 text-green-800 | Confirmed, approved |
| `purple` | bg-purple-100 text-purple-800 | Receiving, active work |
| `emerald` | bg-emerald-100 text-emerald-800 | Closed, completed |
| `red` | bg-red-100 text-red-800 | Cancelled, rejected |
| `orange` | bg-orange-100 text-orange-800 | Warning, review |
| `amber` | bg-amber-100 text-amber-800 | Caution |
| `teal` | bg-teal-100 text-teal-800 | Info |
| `indigo` | bg-indigo-100 text-indigo-800 | Special |

---

## Default Statuses

Every organization receives 7 default statuses on creation:

| Code | Name | Color | Order | System | Description |
|------|------|-------|-------|--------|-------------|
| `draft` | Draft | gray | 1 | Yes | PO is being prepared |
| `submitted` | Submitted | blue | 2 | Yes | PO submitted for processing |
| `pending_approval` | Pending Approval | yellow | 3 | No | Awaiting approval |
| `confirmed` | Confirmed | green | 4 | Yes | Confirmed by supplier |
| `receiving` | Receiving | purple | 5 | Yes | Goods being received |
| `closed` | Closed | emerald | 6 | Yes | PO complete |
| `cancelled` | Cancelled | red | 7 | Yes | PO cancelled |

---

## Default Transitions

| From | To | System |
|------|-----|--------|
| draft | submitted | No |
| draft | cancelled | No |
| submitted | pending_approval | No |
| submitted | confirmed | No |
| submitted | cancelled | No |
| pending_approval | confirmed | No |
| pending_approval | cancelled | No |
| confirmed | receiving | **Yes** (auto) |
| confirmed | cancelled | No |
| receiving | closed | **Yes** (auto) |
| receiving | cancelled | No |

**System Transitions:**
- `confirmed → receiving`: Auto-triggered when first receipt recorded
- `receiving → closed`: Auto-triggered when all items fully received

---

## Multi-Tenancy

All endpoints enforce organization isolation:

1. User's `org_id` extracted from session
2. All queries filtered by `org_id`
3. RLS policies prevent cross-org access
4. Status codes are unique per organization

---

## Rate Limiting

Not currently implemented. Consider adding rate limiting for production:

- Admin endpoints: 60 requests/minute
- User endpoints: 120 requests/minute

---

## Webhooks

Not currently supported. Future feature.

---

## Examples

### Complete Workflow: Add Custom Status

```bash
# 1. Create custom status
curl -X POST "/api/settings/planning/po-statuses" \
  -d '{"code":"vendor_review","name":"Vendor Review","color":"orange"}'

# Response: { "id": "status-uuid", ... }

# 2. Configure transitions (submitted -> vendor_review)
curl -X PUT "/api/settings/planning/po-statuses/{submitted-id}/transitions" \
  -d '{"allowed_to_status_ids":["pending-approval-uuid","vendor-review-uuid","cancelled-uuid"]}'

# 3. Change PO status
curl -X POST "/api/planning/purchase-orders/{po-id}/status" \
  -d '{"to_status":"vendor_review","notes":"Sent to vendor for review"}'

# 4. View history
curl -X GET "/api/planning/purchase-orders/{po-id}/status/history"
```

---

## Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `DUPLICATE_CODE` | 400 | Status code already exists in org |
| `INVALID_INPUT` | 400 | Validation failed |
| `SYSTEM_STATUS` | 400 | Cannot modify system status |
| `STATUS_IN_USE` | 400 | Cannot delete status in use |
| `INVALID_TRANSITION` | 400 | Transition not allowed |
| `SELF_LOOP` | 400 | Cannot transition to same status |
| `SYSTEM_TRANSITION` | 400 | Cannot remove system-required transition |
| `NO_LINES` | 400 | Cannot submit PO without line items |
| `NOT_FOUND` | 404 | Resource not found |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `DATABASE_ERROR` | 500 | Database operation failed |

---

## Testing

See `apps/frontend/__tests__/api/planning/po-statuses.test.ts` for integration tests.

**Test Coverage:**
- Create/update/delete operations
- Transition validation
- Status history tracking
- Multi-tenancy isolation
- Permission checks
- Business rule enforcement

---

## Related Documentation

- [Service Layer Documentation](../guides/po-status-service.md)
- [Database Schema](../guides/po-status-database.md)
- [Admin Configuration Guide](../guides/po-status-admin-guide.md)
- [Story 03.7 Specification](../2-MANAGEMENT/epics/current/03-planning/03.7.po-status-lifecycle.md)
