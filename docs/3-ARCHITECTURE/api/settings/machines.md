# Machines API Documentation

**Story**: 01.10 - Machines CRUD
**Module**: Settings
**Base Path**: `/api/v1/settings/machines`
**Version**: 1.0.0
**Last Updated**: 2025-12-22

---

## Overview

The Machines API provides CRUD operations for managing production machine entities in the MonoPilot system. Machines represent physical equipment used in manufacturing processes, categorized by type (Mixer, Oven, Filler, etc.) with operational status tracking (Active, Maintenance, Offline, Decommissioned).

**Features**:
- Multi-tenancy (org-scoped isolation)
- Role-based access control (ADMIN, PROD_MANAGER)
- 9 machine types with distinct classifications
- 4 operational statuses for tracking machine availability
- Capacity tracking (units/hour, setup time, batch size)
- Location assignment integration
- Soft delete for audit trail preservation
- Business rule enforcement (line assignment checks)
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

### 1. List Machines

```
GET /api/v1/settings/machines
```

Returns paginated list of machines for the authenticated user's organization.

**Query Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | - | Filter by machine code or name (case-insensitive) |
| `type` | string | - | Filter by machine type (see Machine Types enum) |
| `status` | string | - | Filter by status (`ACTIVE`, `MAINTENANCE`, `OFFLINE`, `DECOMMISSIONED`) |
| `location_id` | UUID | - | Filter by location UUID |
| `sortBy` | string | `code` | Sort field (`code`, `name`, `type`, `status`, `created_at`) |
| `sortOrder` | string | `asc` | Sort order (`asc`, `desc`) |
| `page` | integer | `1` | Page number (1-based) |
| `limit` | integer | `25` | Items per page (max: 100) |

**Performance Target**: < 300ms for 100 machines

**Success Response (200 OK)**:

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "org_id": "org-uuid",
      "code": "MIX-001",
      "name": "Industrial Mixer A1",
      "description": "High-capacity mixer for dry ingredients",
      "type": "MIXER",
      "status": "ACTIVE",
      "units_per_hour": 500,
      "setup_time_minutes": 30,
      "max_batch_size": 1000,
      "location_id": "loc-uuid",
      "location": {
        "id": "loc-uuid",
        "code": "B001",
        "name": "Bin 001",
        "full_path": "WH-001/ZONE-A/A01/R01/B001",
        "warehouse_id": "wh-uuid"
      },
      "is_deleted": false,
      "deleted_at": null,
      "created_at": "2025-12-20T10:00:00Z",
      "updated_at": "2025-12-22T14:30:00Z",
      "created_by": "user-uuid",
      "updated_by": "user-uuid"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 45,
    "total_pages": 2
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
  "error": "Failed to fetch machines"
}
```

**Example Requests**:

```bash
# List all machines (first page)
curl -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/machines"

# Search for machines containing "mixer"
curl -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/machines?search=mixer"

# Filter by type and status
curl -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/machines?type=OVEN&status=ACTIVE"

# Sort by name descending
curl -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/machines?sortBy=name&sortOrder=desc"

# Pagination (page 2, 50 items)
curl -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/machines?page=2&limit=50"
```

---

### 2. Get Machine by ID

```
GET /api/v1/settings/machines/:id
```

Returns details for a specific machine with location information.

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Machine ID |

**Success Response (200 OK)**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "org_id": "org-uuid",
  "code": "MIX-001",
  "name": "Industrial Mixer A1",
  "description": "High-capacity mixer for dry ingredients",
  "type": "MIXER",
  "status": "ACTIVE",
  "units_per_hour": 500,
  "setup_time_minutes": 30,
  "max_batch_size": 1000,
  "location_id": "loc-uuid",
  "location": {
    "id": "loc-uuid",
    "code": "B001",
    "name": "Bin 001",
    "full_path": "WH-001/ZONE-A/A01/R01/B001",
    "warehouse_id": "wh-uuid"
  },
  "is_deleted": false,
  "deleted_at": null,
  "created_at": "2025-12-20T10:00:00Z",
  "updated_at": "2025-12-22T14:30:00Z",
  "created_by": "user-uuid",
  "updated_by": "user-uuid"
}
```

**Error Responses**:

```json
// 404 Not Found (machine doesn't exist or belongs to different org)
{
  "error": "Machine not found"
}

// 401 Unauthorized
{
  "error": "Unauthorized"
}
```

**Example Request**:

```bash
curl -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/machines/550e8400-e29b-41d4-a716-446655440000"
```

---

### 3. Create Machine

```
POST /api/v1/settings/machines
```

Creates a new machine.

**Required Permissions**: `SUPER_ADMIN`, `ADMIN`, `PROD_MANAGER`

**Performance Target**: < 500ms

**Request Body**:

```json
{
  "code": "OVN-001",
  "name": "Convection Oven #1",
  "description": "Industrial convection oven for baking",
  "type": "OVEN",
  "status": "ACTIVE",
  "units_per_hour": 200,
  "setup_time_minutes": 45,
  "max_batch_size": 500,
  "location_id": "loc-uuid"
}
```

**Field Specifications**:

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `code` | string | Yes | 1-50 chars, uppercase alphanumeric + hyphens (`^[A-Z0-9-]+$`) | Unique machine identifier |
| `name` | string | Yes | 1-100 chars | Human-readable machine name |
| `description` | string | No | Max 500 chars | Additional details |
| `type` | string | Yes | See Machine Types enum | Machine type classification |
| `status` | string | No | See Machine Status enum | Operational status (default: `ACTIVE`) |
| `units_per_hour` | integer | No | > 0 | Production rate (units per hour) |
| `setup_time_minutes` | integer | No | >= 0 | Setup/changeover time in minutes |
| `max_batch_size` | integer | No | > 0 | Maximum batch size |
| `location_id` | UUID | No | Valid location UUID | Physical location assignment |

**Success Response (201 Created)**:

```json
{
  "id": "new-machine-uuid",
  "org_id": "org-uuid",
  "code": "OVN-001",
  "name": "Convection Oven #1",
  "description": "Industrial convection oven for baking",
  "type": "OVEN",
  "status": "ACTIVE",
  "units_per_hour": 200,
  "setup_time_minutes": 45,
  "max_batch_size": 500,
  "location_id": "loc-uuid",
  "location": null,
  "is_deleted": false,
  "deleted_at": null,
  "created_at": "2025-12-22T15:00:00Z",
  "updated_at": "2025-12-22T15:00:00Z",
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
      "message": "Code must be uppercase alphanumeric with hyphens only"
    }
  ]
}

// 409 Conflict - Duplicate code
{
  "error": "Machine code must be unique"
}

// 403 Forbidden
{
  "error": "Insufficient permissions"
}
```

**Validation Rules**:

- **Code**: Auto-uppercase transformation, unique per organization, format `^[A-Z0-9-]+$`
- **Name**: Required, 1-100 characters
- **Type**: Must be one of 9 valid machine types
- **Status**: Default is `ACTIVE` if not provided
- **Capacity Fields**: All optional, positive integers if provided
- **Location**: Must exist in same organization if provided

**Example Request**:

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "OVN-001",
    "name": "Convection Oven #1",
    "type": "OVEN",
    "units_per_hour": 200,
    "setup_time_minutes": 45
  }' \
  "https://api.monopilot.com/api/v1/settings/machines"
```

---

### 4. Update Machine

```
PUT /api/v1/settings/machines/:id
```

Updates an existing machine.

**Required Permissions**: `SUPER_ADMIN`, `ADMIN`, `PROD_MANAGER`

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Machine ID |

**Request Body** (all fields optional):

```json
{
  "code": "MIX-001-NEW",
  "name": "Updated Mixer Name",
  "description": "Updated description",
  "type": "BLENDER",
  "status": "MAINTENANCE",
  "units_per_hour": 600,
  "setup_time_minutes": 20,
  "max_batch_size": 1200,
  "location_id": "new-loc-uuid"
}
```

**Business Rules**:

1. **Code Uniqueness**: If changing code, new code must be unique per organization
2. All fields are optional; only provided fields will be updated
3. System fields (`org_id`, `created_at`, `created_by`) cannot be modified

**Success Response (200 OK)**:

```json
{
  "id": "machine-uuid",
  "org_id": "org-uuid",
  "code": "MIX-001-NEW",
  "name": "Updated Mixer Name",
  "description": "Updated description",
  "type": "BLENDER",
  "status": "MAINTENANCE",
  "units_per_hour": 600,
  "setup_time_minutes": 20,
  "max_batch_size": 1200,
  "location_id": "new-loc-uuid",
  "is_deleted": false,
  "deleted_at": null,
  "created_at": "2025-12-20T10:00:00Z",
  "updated_at": "2025-12-22T16:00:00Z",
  "created_by": "user-uuid",
  "updated_by": "user-uuid"
}
```

**Error Responses**:

```json
// 404 Not Found
{
  "error": "Machine not found"
}

// 409 Conflict - Duplicate code
{
  "error": "Machine code must be unique"
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
    "name": "Updated Mixer Name",
    "status": "MAINTENANCE",
    "units_per_hour": 600
  }' \
  "https://api.monopilot.com/api/v1/settings/machines/machine-uuid"
```

---

### 5. Update Machine Status

```
PATCH /api/v1/settings/machines/:id/status
```

Updates only the machine status (quick status change without full update).

**Required Permissions**: `SUPER_ADMIN`, `ADMIN`, `PROD_MANAGER`

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Machine ID |

**Request Body**:

```json
{
  "status": "MAINTENANCE"
}
```

**Success Response (200 OK)**:

```json
{
  "id": "machine-uuid",
  "org_id": "org-uuid",
  "code": "MIX-001",
  "name": "Industrial Mixer A1",
  "status": "MAINTENANCE",
  "updated_at": "2025-12-22T16:30:00Z",
  "updated_by": "user-uuid"
}
```

**Error Responses**:

```json
// 404 Not Found
{
  "error": "Machine not found"
}

// 400 Bad Request - Invalid status
{
  "error": "Validation failed",
  "details": [...]
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
  -H "Content-Type: application/json" \
  -d '{"status": "MAINTENANCE"}' \
  "https://api.monopilot.com/api/v1/settings/machines/machine-uuid/status"
```

---

### 6. Delete Machine

```
DELETE /api/v1/settings/machines/:id
```

Deletes a machine (soft delete for audit trail preservation).

**Required Permissions**: `SUPER_ADMIN`, `ADMIN` (NOT `PROD_MANAGER`)

**Performance Target**: < 500ms

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Machine ID |

**Request Body**: None

**Business Rules** (enforced):

1. Cannot delete if machine is assigned to production line (Story 01.11)
2. Always performs soft delete (sets `is_deleted = true`, `deleted_at = timestamp`)
3. Preserves audit trail for historical work order references

**Success Response (204 No Content)**:

```
(Empty response body)
```

**Error Responses**:

```json
// 409 Conflict - Assigned to production line
{
  "error": "Machine is assigned to line [LINE-001]. Remove from line first."
}

// 409 Conflict - Multiple line assignments
{
  "error": "Machine is assigned to lines [LINE-001, LINE-002]. Remove from lines first."
}

// 404 Not Found
{
  "error": "Machine not found"
}

// 403 Forbidden
{
  "error": "Insufficient permissions"
}
```

**Example Request**:

```bash
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/machines/machine-uuid"
```

---

## Data Types

### Machine Object

```typescript
interface Machine {
  id: string                       // UUID
  org_id: string                   // Organization UUID (RLS enforced)
  code: string                     // 1-50 chars, uppercase alphanumeric + hyphens
  name: string                     // 1-100 chars
  description: string | null       // Max 500 chars
  type: MachineType                // Enum (see below)
  status: MachineStatus            // Enum (see below)
  units_per_hour: number | null    // Production rate (integer > 0)
  setup_time_minutes: number | null // Setup time (integer >= 0)
  max_batch_size: number | null    // Max batch size (integer > 0)
  location_id: string | null       // Location UUID (FK to locations table)
  location?: MachineLocation | null // Joined location data
  is_deleted: boolean              // Soft delete flag
  deleted_at: string | null        // ISO 8601 timestamp
  created_at: string               // ISO 8601 timestamp
  updated_at: string               // ISO 8601 timestamp
  created_by: string               // User UUID
  updated_by: string               // User UUID
}
```

### Machine Type Enum

9 production machine types with distinct classifications:

```typescript
type MachineType =
  | 'MIXER'       // Mixing equipment (blue badge)
  | 'OVEN'        // Baking/heating equipment (orange badge)
  | 'FILLER'      // Filling/packaging machines (purple badge)
  | 'PACKAGING'   // Packaging equipment (green badge)
  | 'CONVEYOR'    // Conveyor systems (gray badge)
  | 'BLENDER'     // Blending equipment (cyan badge)
  | 'CUTTER'      // Cutting/slicing machines (red badge)
  | 'LABELER'     // Labeling equipment (yellow badge)
  | 'OTHER'       // Other equipment types (slate badge)
```

**Badge Colors**:
- MIXER: Blue (bg-blue-100, text-blue-800)
- OVEN: Orange (bg-orange-100, text-orange-800)
- FILLER: Purple (bg-purple-100, text-purple-800)
- PACKAGING: Green (bg-green-100, text-green-800)
- CONVEYOR: Gray (bg-gray-100, text-gray-800)
- BLENDER: Cyan (bg-cyan-100, text-cyan-800)
- CUTTER: Red (bg-red-100, text-red-800)
- LABELER: Yellow (bg-yellow-100, text-yellow-800)
- OTHER: Slate (bg-slate-100, text-slate-800)

### Machine Status Enum

4 operational statuses for tracking machine availability:

```typescript
type MachineStatus =
  | 'ACTIVE'          // Operational and available (green badge)
  | 'MAINTENANCE'     // Under maintenance (yellow badge)
  | 'OFFLINE'         // Temporarily offline (red badge)
  | 'DECOMMISSIONED'  // Permanently decommissioned (gray badge)
```

**Status Colors**:
- ACTIVE: Green (bg-green-100, text-green-800)
- MAINTENANCE: Yellow (bg-yellow-100, text-yellow-800)
- OFFLINE: Red (bg-red-100, text-red-800)
- DECOMMISSIONED: Gray (bg-gray-100, text-gray-800)

### Location Reference

```typescript
interface MachineLocation {
  id: string          // Location UUID
  code: string        // Location code
  name: string        // Location name
  full_path: string   // Hierarchical path (e.g., "WH-001/ZONE-A/A01/R01/B001")
  warehouse_id: string // Warehouse UUID
}
```

---

## Security

### Row-Level Security (RLS)

All machine operations enforce org-level isolation via RLS policies:

```sql
-- SELECT: All authenticated users can read non-deleted org machines
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND is_deleted = false
)

-- INSERT/UPDATE: Admin, Production Manager only
WITH CHECK (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('SUPER_ADMIN', 'ADMIN', 'PROD_MANAGER')
  )
)

-- DELETE: Admin only (not Production Manager)
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('SUPER_ADMIN', 'ADMIN')
  )
)
```

### Multi-Tenancy

Cross-organization access returns `404 Not Found` (not `403 Forbidden`) to prevent information leakage about resource existence.

### Permission Matrix

| Role | List | View | Create | Update | Update Status | Delete |
|------|------|------|--------|--------|---------------|--------|
| SUPER_ADMIN | Yes | Yes | Yes | Yes | Yes | Yes |
| ADMIN | Yes | Yes | Yes | Yes | Yes | Yes |
| PROD_MANAGER | Yes | Yes | Yes | Yes | Yes | No |
| WAREHOUSE_MANAGER | Yes | Yes | No | No | No | No |
| VIEWER | Yes | Yes | No | No | No | No |

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
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error, business rule violation |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Valid auth but insufficient permissions |
| 404 | Not Found | Resource not found (including cross-org) |
| 409 | Conflict | Unique constraint violation (duplicate code), line assignment |
| 500 | Internal Server Error | Unexpected server error |

---

## Performance Considerations

### Performance Targets

- **List**: < 300ms for 100 machines
- **Create**: < 500ms
- **Update**: < 500ms
- **Delete**: < 500ms (with line assignment check)

### Indexing

All queries are optimized with indexes on:
- `org_id` (org isolation)
- `type` (filtering)
- `status` (filtering)
- `location_id` (joins)
- `org_id, code` (uniqueness, search)
- `org_id, is_deleted` (soft delete filtering)

### Pagination

Default: 25 items per page
Maximum: 100 items per page

For organizations with >1000 machines, consider front-end caching strategies.

---

## Rate Limiting

Not currently implemented. Future versions may enforce rate limits of:
- 100 requests/minute per user
- 1000 requests/hour per organization

---

## Testing Examples

### JavaScript/TypeScript

```typescript
// List machines
const response = await fetch(
  '/api/v1/settings/machines?type=MIXER&status=ACTIVE',
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
)
const { data, pagination } = await response.json()

// Create machine
const createResponse = await fetch(
  '/api/v1/settings/machines',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code: 'MIX-002',
      name: 'Planetary Mixer',
      type: 'MIXER',
      units_per_hour: 400,
      setup_time_minutes: 25
    })
  }
)
const machine = await createResponse.json()

// Update machine
await fetch(
  `/api/v1/settings/machines/${machineId}`,
  {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Updated Name',
      units_per_hour: 500
    })
  }
)

// Update status only
await fetch(
  `/api/v1/settings/machines/${machineId}/status`,
  {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: 'MAINTENANCE' })
  }
)

// Delete machine
await fetch(
  `/api/v1/settings/machines/${machineId}`,
  {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  }
)
```

---

## Common Use Cases

### 1. Search for Available Mixers

```bash
curl -H "Authorization: Bearer TOKEN" \
  "https://api.monopilot.com/api/v1/settings/machines?type=MIXER&status=ACTIVE"
```

### 2. Create Machine with Full Capacity Data

```bash
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "PKG-001",
    "name": "Packaging Line 1",
    "type": "PACKAGING",
    "status": "ACTIVE",
    "units_per_hour": 1200,
    "setup_time_minutes": 15,
    "max_batch_size": 5000,
    "location_id": "loc-uuid"
  }' \
  "https://api.monopilot.com/api/v1/settings/machines"
```

### 3. Mark Machine for Maintenance

```bash
curl -X PATCH \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "MAINTENANCE"}' \
  "https://api.monopilot.com/api/v1/settings/machines/machine-uuid/status"
```

### 4. Find Machines at Specific Location

```bash
curl -H "Authorization: Bearer TOKEN" \
  "https://api.monopilot.com/api/v1/settings/machines?location_id=loc-uuid"
```

---

## Error Code Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `MACHINE_NOT_FOUND` | 404 | Machine does not exist or not in user's org |
| `DUPLICATE_CODE` | 409 | Machine code already exists in organization |
| `LINE_ASSIGNMENT_EXISTS` | 409 | Cannot delete machine assigned to production line |
| `VALIDATION_FAILED` | 400 | Request body failed Zod schema validation |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | User lacks required role permissions |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-22 | Initial release (Story 01.10) |

---

## Related Documentation

- [Machine Component Documentation](../../frontend/components/machines.md)
- [Machine Developer Guide](../../guides/machine-management.md)
- [Database Schema - Machines Table](../../database/migrations/machines.md)
- [Story 01.10 Specification](../../../2-MANAGEMENT/epics/current/01-settings/01.10.machines-crud.md)
