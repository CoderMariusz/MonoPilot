# Warehouses API Documentation

**Story**: 01.8 - Warehouses CRUD
**Module**: Settings
**Base Path**: `/api/v1/settings/warehouses`
**Version**: 1.0.0
**Last Updated**: 2025-12-20

---

## Overview

The Warehouses API provides CRUD operations for managing warehouse entities in the MonoPilot system. Warehouses are physical storage locations categorized by type (General, Raw Materials, WIP, Finished Goods, Quarantine) with support for:

- Multi-tenancy (org-scoped isolation)
- Role-based access control (ADMIN, WAREHOUSE_MANAGER)
- Default warehouse designation (one per organization)
- Business rule enforcement (inventory checks, code immutability)
- Search, filtering, sorting, and pagination

---

## Authentication

All endpoints require authentication via Supabase Auth.

**Headers Required**:
```
Authorization: Bearer <access_token>
```

**Response Codes**:
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Valid auth but insufficient permissions
- `404 Not Found` - Resource not found (including cross-tenant access)

---

## Endpoints

### 1. List Warehouses

```
GET /api/v1/settings/warehouses
```

Returns paginated list of warehouses for the authenticated user's organization.

**Query Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | - | Filter by warehouse code or name (case-insensitive, min 2 chars) |
| `type` | string | - | Filter by warehouse type (`GENERAL`, `RAW_MATERIALS`, `WIP`, `FINISHED_GOODS`, `QUARANTINE`) |
| `status` | string | - | Filter by status (`active`, `disabled`) |
| `sort` | string | `code` | Sort field (`code`, `name`, `type`, `location_count`, `created_at`) |
| `order` | string | `asc` | Sort order (`asc`, `desc`) |
| `page` | integer | `1` | Page number (1-based) |
| `limit` | integer | `20` | Items per page (max: 100) |

**Success Response (200 OK)**:

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "org_id": "org-uuid",
      "code": "WH-001",
      "name": "Main Warehouse",
      "type": "GENERAL",
      "address": "123 Factory Rd, Springfield, IL 62701",
      "contact_email": "warehouse@example.com",
      "contact_phone": "+1-555-123-4567",
      "is_default": true,
      "is_active": true,
      "location_count": 45,
      "disabled_at": null,
      "disabled_by": null,
      "created_at": "2025-12-01T10:00:00Z",
      "updated_at": "2025-12-20T14:30:00Z",
      "created_by": "user-uuid",
      "updated_by": "user-uuid"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "total_pages": 1
  }
}
```

**Error Responses**:

```json
// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch warehouses"
}
```

**Example Requests**:

```bash
# List all warehouses (first page)
curl -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/warehouses"

# Search for warehouses containing "main"
curl -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/warehouses?search=main"

# Filter by type and status
curl -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/warehouses?type=RAW_MATERIALS&status=active"

# Sort by name descending
curl -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/warehouses?sort=name&order=desc"

# Pagination (page 2, 50 items)
curl -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/warehouses?page=2&limit=50"
```

---

### 2. Get Warehouse by ID

```
GET /api/v1/settings/warehouses/:id
```

Returns details for a specific warehouse.

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Warehouse ID |

**Success Response (200 OK)**:

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "org_id": "org-uuid",
  "code": "WH-001",
  "name": "Main Warehouse",
  "type": "GENERAL",
  "address": "123 Factory Rd, Springfield, IL 62701",
  "contact_email": "warehouse@example.com",
  "contact_phone": "+1-555-123-4567",
  "is_default": true,
  "is_active": true,
  "location_count": 45,
  "disabled_at": null,
  "disabled_by": null,
  "created_at": "2025-12-01T10:00:00Z",
  "updated_at": "2025-12-20T14:30:00Z",
  "created_by": "user-uuid",
  "updated_by": "user-uuid"
}
```

**Error Responses**:

```json
// 404 Not Found (warehouse doesn't exist or belongs to different org)
{
  "error": "Warehouse not found"
}

// 401 Unauthorized
{
  "error": "Unauthorized"
}
```

**Example Request**:

```bash
curl -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/warehouses/123e4567-e89b-12d3-a456-426614174000"
```

---

### 3. Create Warehouse

```
POST /api/v1/settings/warehouses
```

Creates a new warehouse.

**Required Permissions**: `SUPER_ADMIN`, `ADMIN`, `WAREHOUSE_MANAGER`

**Request Body**:

```json
{
  "code": "WH-RAW",
  "name": "Raw Materials Warehouse",
  "type": "RAW_MATERIALS",
  "address": "456 Storage Ln, Springfield, IL 62702",
  "contact_email": "raw-materials@example.com",
  "contact_phone": "+1-555-987-6543",
  "is_active": true
}
```

**Field Specifications**:

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `code` | string | Yes | 2-20 chars, uppercase alphanumeric + hyphens only (`^[A-Z0-9-]+$`) | Unique warehouse identifier |
| `name` | string | Yes | 2-100 chars | Human-readable warehouse name |
| `type` | string | No | One of: `GENERAL`, `RAW_MATERIALS`, `WIP`, `FINISHED_GOODS`, `QUARANTINE` | Warehouse type (default: `GENERAL`) |
| `address` | string | No | Max 500 chars | Physical address |
| `contact_email` | string | No | Valid email, max 255 chars | Contact email |
| `contact_phone` | string | No | Max 20 chars | Contact phone |
| `is_active` | boolean | No | - | Active status (default: `true`) |

**Success Response (201 Created)**:

```json
{
  "id": "new-warehouse-uuid",
  "org_id": "org-uuid",
  "code": "WH-RAW",
  "name": "Raw Materials Warehouse",
  "type": "RAW_MATERIALS",
  "address": "456 Storage Ln, Springfield, IL 62702",
  "contact_email": "raw-materials@example.com",
  "contact_phone": "+1-555-987-6543",
  "is_default": false,
  "is_active": true,
  "location_count": 0,
  "disabled_at": null,
  "disabled_by": null,
  "created_at": "2025-12-20T15:00:00Z",
  "updated_at": "2025-12-20T15:00:00Z",
  "created_by": "user-uuid",
  "updated_by": "user-uuid"
}
```

**Error Responses**:

```json
// 400 Bad Request - Validation error
{
  "error": "Validation failed",
  "details": [
    {
      "code": "invalid_string",
      "path": ["code"],
      "message": "Code must be 2-20 uppercase alphanumeric characters with hyphens only"
    }
  ]
}

// 409 Conflict - Duplicate code
{
  "error": "Warehouse code already exists"
}

// 403 Forbidden
{
  "error": "Insufficient permissions"
}
```

**Validation Rules**:

- **Code**: Auto-uppercase transformation, unique per organization
- **Email**: Valid email format or null
- **Phone**: Max 20 characters
- **Address**: Max 500 characters

**Example Request**:

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "WH-RAW",
    "name": "Raw Materials Warehouse",
    "type": "RAW_MATERIALS",
    "address": "456 Storage Ln, Springfield, IL 62702",
    "contact_email": "raw-materials@example.com"
  }' \
  "https://api.monopilot.com/api/v1/settings/warehouses"
```

---

### 4. Update Warehouse

```
PUT /api/v1/settings/warehouses/:id
```

Updates an existing warehouse.

**Required Permissions**: `SUPER_ADMIN`, `ADMIN`, `WAREHOUSE_MANAGER`

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Warehouse ID |

**Request Body** (all fields optional):

```json
{
  "code": "WH-RAW-NEW",
  "name": "Updated Warehouse Name",
  "type": "FINISHED_GOODS",
  "address": "789 New Address St",
  "contact_email": "new-email@example.com",
  "contact_phone": "+1-555-111-2222",
  "is_active": false
}
```

**Business Rules**:

1. **Code Immutability**: Cannot change `code` if warehouse has active inventory (license plates with `quantity > 0`)
2. **Code Uniqueness**: If changing code, new code must be unique per organization

**Success Response (200 OK)**:

```json
{
  "id": "warehouse-uuid",
  "org_id": "org-uuid",
  "code": "WH-RAW-NEW",
  "name": "Updated Warehouse Name",
  "type": "FINISHED_GOODS",
  "address": "789 New Address St",
  "contact_email": "new-email@example.com",
  "contact_phone": "+1-555-111-2222",
  "is_default": false,
  "is_active": false,
  "location_count": 45,
  "disabled_at": null,
  "disabled_by": null,
  "created_at": "2025-12-01T10:00:00Z",
  "updated_at": "2025-12-20T15:30:00Z",
  "created_by": "user-uuid",
  "updated_by": "user-uuid"
}
```

**Error Responses**:

```json
// 400 Bad Request - Code change with active inventory
{
  "error": "Cannot change code for warehouse with active inventory"
}

// 404 Not Found
{
  "error": "Warehouse not found"
}

// 409 Conflict - Duplicate code
{
  "error": "Warehouse code already exists"
}

// 403 Forbidden
{
  "error": "Insufficient permissions"
}
```

**Example Request**:

```bash
curl -X PUT \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Warehouse Name",
    "address": "789 New Address St"
  }' \
  "https://api.monopilot.com/api/v1/settings/warehouses/warehouse-uuid"
```

---

### 5. Set Default Warehouse

```
PATCH /api/v1/settings/warehouses/:id/set-default
```

Sets a warehouse as the organization's default warehouse. This is an atomic operation that unsets the previous default.

**Required Permissions**: `SUPER_ADMIN`, `ADMIN`, `WAREHOUSE_MANAGER`

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Warehouse ID |

**Request Body**: None

**Success Response (200 OK)**:

```json
{
  "id": "warehouse-uuid",
  "org_id": "org-uuid",
  "code": "WH-002",
  "name": "Secondary Warehouse",
  "type": "GENERAL",
  "is_default": true,
  "is_active": true,
  "location_count": 20,
  "created_at": "2025-12-01T10:00:00Z",
  "updated_at": "2025-12-20T16:00:00Z",
  "created_by": "user-uuid",
  "updated_by": "user-uuid"
}
```

**Database Behavior**:

The `ensure_single_default_warehouse` trigger automatically:
1. Sets `is_default = true` on the target warehouse
2. Sets `is_default = false` on the previous default warehouse
3. Both operations occur in a single atomic transaction

**Error Responses**:

```json
// 404 Not Found
{
  "error": "Warehouse not found"
}

// 403 Forbidden
{
  "error": "Insufficient permissions"
}
```

**Example Request**:

```bash
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/warehouses/warehouse-uuid/set-default"
```

---

### 6. Disable Warehouse

```
PATCH /api/v1/settings/warehouses/:id/disable
```

Disables a warehouse with business rule enforcement.

**Required Permissions**: `SUPER_ADMIN`, `ADMIN`, `WAREHOUSE_MANAGER`

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Warehouse ID |

**Request Body**: None

**Business Rules** (enforced):

1. Cannot disable warehouse with active inventory (license plates with `quantity > 0`)
2. Cannot disable the default warehouse (must set another warehouse as default first)

**Success Response (200 OK)**:

```json
{
  "id": "warehouse-uuid",
  "org_id": "org-uuid",
  "code": "WH-OLD",
  "name": "Old Warehouse",
  "type": "GENERAL",
  "is_default": false,
  "is_active": false,
  "location_count": 10,
  "disabled_at": "2025-12-20T16:30:00Z",
  "disabled_by": "user-uuid",
  "created_at": "2025-12-01T10:00:00Z",
  "updated_at": "2025-12-20T16:30:00Z",
  "created_by": "user-uuid",
  "updated_by": "user-uuid"
}
```

**Error Responses**:

```json
// 400 Bad Request - Active inventory
{
  "error": "Cannot disable warehouse with active inventory"
}

// 400 Bad Request - Default warehouse
{
  "error": "Cannot disable default warehouse. Set another warehouse as default first."
}

// 404 Not Found
{
  "error": "Warehouse not found"
}

// 403 Forbidden
{
  "error": "Insufficient permissions"
}
```

**Example Request**:

```bash
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/warehouses/warehouse-uuid/disable"
```

---

### 7. Enable Warehouse

```
PATCH /api/v1/settings/warehouses/:id/enable
```

Re-enables a previously disabled warehouse.

**Required Permissions**: `SUPER_ADMIN`, `ADMIN`, `WAREHOUSE_MANAGER`

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Warehouse ID |

**Request Body**: None

**Success Response (200 OK)**:

```json
{
  "id": "warehouse-uuid",
  "org_id": "org-uuid",
  "code": "WH-REACTIVATED",
  "name": "Reactivated Warehouse",
  "type": "GENERAL",
  "is_default": false,
  "is_active": true,
  "location_count": 10,
  "disabled_at": null,
  "disabled_by": null,
  "created_at": "2025-12-01T10:00:00Z",
  "updated_at": "2025-12-20T17:00:00Z",
  "created_by": "user-uuid",
  "updated_by": "user-uuid"
}
```

**Error Responses**:

```json
// 404 Not Found
{
  "error": "Warehouse not found"
}

// 403 Forbidden
{
  "error": "Insufficient permissions"
}
```

**Example Request**:

```bash
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/warehouses/warehouse-uuid/enable"
```

---

### 8. Validate Warehouse Code

```
GET /api/v1/settings/warehouses/validate-code
```

Checks if a warehouse code is available (not already used by another warehouse in the organization). Used for real-time validation in forms.

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | string | Yes | Warehouse code to validate |
| `exclude_id` | UUID | No | Warehouse ID to exclude from check (for edit mode) |

**Success Response (200 OK)**:

```json
// Code is available
{
  "available": true
}

// Code is already taken
{
  "available": false,
  "message": "Warehouse code already exists"
}
```

**Error Responses**:

```json
// 401 Unauthorized
{
  "error": "Unauthorized"
}
```

**Example Requests**:

```bash
# Check if code is available (create mode)
curl -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/warehouses/validate-code?code=WH-NEW"

# Check if code is available (edit mode - exclude current warehouse)
curl -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/warehouses/validate-code?code=WH-UPDATED&exclude_id=warehouse-uuid"
```

---

## Data Types

### Warehouse Object

```typescript
interface Warehouse {
  id: string                    // UUID
  org_id: string               // Organization UUID (RLS enforced)
  code: string                 // 2-20 chars, uppercase alphanumeric + hyphens
  name: string                 // 2-100 chars
  type: WarehouseType          // Enum (see below)
  address: string | null       // Max 500 chars
  contact_email: string | null // Valid email, max 255 chars
  contact_phone: string | null // Max 20 chars
  is_default: boolean          // Only one per org
  is_active: boolean           // Active/disabled status
  location_count: number       // Denormalized count (maintained by triggers)
  disabled_at: string | null   // ISO 8601 timestamp
  disabled_by: string | null   // User UUID who disabled
  created_at: string           // ISO 8601 timestamp
  updated_at: string           // ISO 8601 timestamp
  created_by: string           // User UUID
  updated_by: string           // User UUID
}
```

### Warehouse Type Enum

```typescript
type WarehouseType =
  | 'GENERAL'          // Multi-purpose storage
  | 'RAW_MATERIALS'    // Incoming raw materials/ingredients
  | 'WIP'              // Work-in-progress inventory
  | 'FINISHED_GOODS'   // Completed products
  | 'QUARANTINE'       // Quality hold/rejected items
```

---

## Security

### Row-Level Security (RLS)

All warehouse operations enforce org-level isolation via RLS policies:

```sql
-- SELECT: All authenticated users can read org warehouses
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))

-- INSERT/UPDATE: Admin, Warehouse Manager only
WITH CHECK (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER')
  )
)
```

### Multi-Tenancy

Cross-organization access returns `404 Not Found` (not `403 Forbidden`) to prevent information leakage about resource existence.

### Permission Matrix

| Role | List | View | Create | Update | Set Default | Disable | Enable |
|------|------|------|--------|--------|-------------|---------|--------|
| SUPER_ADMIN | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| ADMIN | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| WAREHOUSE_MANAGER | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| PRODUCTION_MANAGER | Yes | Yes | No | No | No | No | No |
| VIEWER | Yes | Yes | No | No | No | No | No |

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Error message",
  "details": [...]  // Optional, present for validation errors
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation error, business rule violation |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Valid auth but insufficient permissions |
| 404 | Not Found | Resource not found (including cross-org) |
| 409 | Conflict | Unique constraint violation (duplicate code) |
| 500 | Internal Server Error | Unexpected server error |

---

## Rate Limiting

Not currently implemented. Future versions may enforce rate limits of:
- 100 requests/minute per user
- 1000 requests/hour per organization

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-20 | Initial release (Story 01.8) |

---

## Related Documentation

- [Warehouse Component Documentation](../../frontend/components/warehouses.md)
- [Warehouse Developer Guide](../../guides/warehouse-management.md)
- [Database Schema - Warehouses Table](../../database/tables/warehouses.md)
- [Story 01.8 Specification](../../../2-MANAGEMENT/epics/current/01-settings/01.8.warehouses-crud.md)
