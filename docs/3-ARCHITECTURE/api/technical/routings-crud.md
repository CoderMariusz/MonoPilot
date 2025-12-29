# Routings CRUD API Reference

**Story**: 02.7 - Routings CRUD + Header Management
**Module**: Technical
**Version**: 1.0
**Status**: Production Ready
**Last Updated**: 2025-12-28

---

## Overview

The Routings API provides complete CRUD (Create, Read, Update, Delete) operations for managing production routings. Routings are reusable templates that define sequences of production operations with associated costs, status, and configuration.

**Key Features**:
- List routings with pagination, search, and filtering
- Create new routings with optional cloning from existing
- Edit routing headers with automatic version control
- Delete routings with BOM usage tracking
- Clone routings with all operations
- Check BOM usage before deletion
- Cost configuration per ADR-009

---

## Authentication

All endpoints require authentication via JWT bearer token in the `Authorization` header:

```bash
Authorization: Bearer <jwt_token>
```

---

## Endpoints

### 1. List Routings

**Endpoint**:
```
GET /api/v1/technical/routings
```

**Description**: List all routings with pagination, search, and filtering capabilities.

**Query Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 25 | Items per page (max 100) |
| `search` | string | - | Search by code or name (case-insensitive) |
| `is_active` | boolean | all | Filter by status: `true`, `false`, or `all` |
| `sortBy` | string | name | Sort field: `name`, `code`, `created_at` |
| `sortOrder` | string | asc | Sort order: `asc` or `desc` |

**Request Example**:

```bash
curl -X GET 'https://api.monopilot.app/api/v1/technical/routings?page=1&limit=25&search=bread&is_active=true' \
  -H 'Authorization: Bearer <token>'
```

**Response** (200 OK):

```json
{
  "routings": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "org_id": "org-123",
      "code": "RTG-BREAD-01",
      "name": "Standard Bread Line",
      "description": "Basic bread production workflow",
      "version": 2,
      "is_active": true,
      "is_reusable": true,
      "setup_cost": 50.00,
      "working_cost_per_unit": 2.50,
      "overhead_percent": 15.00,
      "currency": "PLN",
      "operations_count": 5,
      "boms_count": 3,
      "created_at": "2025-12-20T10:30:00Z",
      "updated_at": "2025-12-27T14:15:00Z",
      "created_by": "user-456"
    }
  ],
  "total": 23,
  "page": 1,
  "limit": 25
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 400 | INVALID_PARAMS | Invalid query parameters |

---

### 2. Get Single Routing

**Endpoint**:
```
GET /api/v1/technical/routings/:id
```

**Description**: Get detailed information about a specific routing, including operations count and BOM assignments.

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Routing ID |

**Request Example**:

```bash
curl -X GET 'https://api.monopilot.app/api/v1/technical/routings/550e8400-e29b-41d4-a716-446655440000' \
  -H 'Authorization: Bearer <token>'
```

**Response** (200 OK):

```json
{
  "routing": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "org_id": "org-123",
    "code": "RTG-BREAD-01",
    "name": "Standard Bread Line",
    "description": "Basic bread production workflow",
    "version": 2,
    "is_active": true,
    "is_reusable": true,
    "setup_cost": 50.00,
    "working_cost_per_unit": 2.50,
    "overhead_percent": 15.00,
    "currency": "PLN",
    "operations_count": 5,
    "created_at": "2025-12-20T10:30:00Z",
    "updated_at": "2025-12-27T14:15:00Z",
    "created_by": "user-456"
  },
  "boms_count": 3,
  "related_boms": [
    {
      "id": "bom-789",
      "product_code": "PROD-001",
      "product_name": "White Bread",
      "version": 1
    }
  ]
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 404 | ROUTING_NOT_FOUND | Routing does not exist |

---

### 3. Create Routing

**Endpoint**:
```
POST /api/v1/technical/routings
```

**Description**: Create a new routing or clone an existing one. All cost fields are optional with sensible defaults.

**Permissions Required**:
- Technical module write permission (`C`)
- OR Admin/Super Admin role

**Request Body**:

```json
{
  "code": "RTG-BREAD-02",
  "name": "Premium Bread Line",
  "description": "High-quality bread with extended proofing",
  "is_active": true,
  "is_reusable": true,
  "setup_cost": 75.00,
  "working_cost_per_unit": 3.25,
  "overhead_percent": 20.00,
  "currency": "PLN",
  "cloneFrom": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Field Validation**:

| Field | Type | Validation |
|-------|------|-----------|
| `code` | string | Required. 2-50 chars, uppercase alphanumeric + hyphens. Must be unique per org. |
| `name` | string | Required. 1-100 chars. |
| `description` | string | Optional. Max 500 chars. |
| `is_active` | boolean | Optional. Default: `true` |
| `is_reusable` | boolean | Optional. Default: `true` |
| `setup_cost` | number | Optional. Default: `0`. Must be >= 0. |
| `working_cost_per_unit` | number | Optional. Default: `0`. Must be >= 0. |
| `overhead_percent` | number | Optional. Default: `0`. Must be 0-100. |
| `currency` | string | Optional. Default: `PLN`. Enum: `PLN`, `EUR`, `USD`, `GBP` |
| `cloneFrom` | string (UUID) | Optional. If provided, clone all operations from source routing. |

**Request Example**:

```bash
curl -X POST 'https://api.monopilot.app/api/v1/technical/routings' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "code": "RTG-BREAD-02",
    "name": "Premium Bread Line",
    "setup_cost": 75.00,
    "working_cost_per_unit": 3.25,
    "overhead_percent": 20.00,
    "currency": "PLN"
  }'
```

**Response** (201 Created):

```json
{
  "routing": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "org_id": "org-123",
    "code": "RTG-BREAD-02",
    "name": "Premium Bread Line",
    "description": "High-quality bread with extended proofing",
    "version": 1,
    "is_active": true,
    "is_reusable": true,
    "setup_cost": 75.00,
    "working_cost_per_unit": 3.25,
    "overhead_percent": 20.00,
    "currency": "PLN",
    "operations_count": 5,
    "created_at": "2025-12-28T10:00:00Z",
    "updated_at": "2025-12-28T10:00:00Z",
    "created_by": "user-456"
  },
  "operationsCount": 5
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 400 | VALIDATION_ERROR | Invalid request body. See details for field errors. |
| 409 | DUPLICATE_CODE | Code 'RTG-BREAD-02' already exists in your organization |
| 403 | PERMISSION_DENIED | You do not have permission to create routings |
| 401 | UNAUTHORIZED | Missing or invalid token |

---

### 4. Update Routing

**Endpoint**:
```
PUT /api/v1/technical/routings/:id
```

**Description**: Update routing header fields. Version auto-increments when any tracked field changes. Code is immutable after creation.

**Permissions Required**:
- Technical module write permission (`U`)
- OR Admin/Super Admin role

**Important**: The `code` field cannot be changed. Attempting to include it will return a 400 error.

**Request Body** (all fields optional):

```json
{
  "name": "Updated Bread Line",
  "description": "Updated description",
  "is_active": false,
  "is_reusable": true,
  "setup_cost": 100.00,
  "working_cost_per_unit": 3.50,
  "overhead_percent": 25.00,
  "currency": "EUR"
}
```

**Request Example**:

```bash
curl -X PUT 'https://api.monopilot.app/api/v1/technical/routings/550e8400-e29b-41d4-a716-446655440000' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Updated Bread Line",
    "setup_cost": 100.00
  }'
```

**Response** (200 OK):

```json
{
  "routing": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "org_id": "org-123",
    "code": "RTG-BREAD-01",
    "name": "Updated Bread Line",
    "description": "Basic bread production workflow",
    "version": 3,
    "is_active": true,
    "is_reusable": true,
    "setup_cost": 100.00,
    "working_cost_per_unit": 2.50,
    "overhead_percent": 15.00,
    "currency": "PLN",
    "operations_count": 5,
    "created_at": "2025-12-20T10:30:00Z",
    "updated_at": "2025-12-28T11:00:00Z",
    "created_by": "user-456"
  }
}
```

**Version Control**:

The `version` field auto-increments when these fields change:
- `name`
- `description`
- `is_active`
- `is_reusable`
- `setup_cost`
- `working_cost_per_unit`
- `overhead_percent`
- `currency`

Changes to other fields do not increment the version.

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 400 | CODE_IMMUTABLE | Code cannot be changed after creation |
| 400 | VALIDATION_ERROR | Invalid request body |
| 404 | ROUTING_NOT_FOUND | Routing does not exist |
| 403 | PERMISSION_DENIED | You do not have permission to update routings |
| 401 | UNAUTHORIZED | Missing or invalid token |

---

### 5. Delete Routing

**Endpoint**:
```
DELETE /api/v1/technical/routings/:id
```

**Description**: Delete a routing and unassign it from all BOMs. Operations are cascade-deleted.

**Permissions Required**:
- Admin or Super Admin role (only)

**Request Example**:

```bash
curl -X DELETE 'https://api.monopilot.app/api/v1/technical/routings/550e8400-e29b-41d4-a716-446655440000' \
  -H 'Authorization: Bearer <token>'
```

**Response** (200 OK):

```json
{
  "success": true,
  "affected_boms": 3,
  "message": "Routing deleted. 3 BOMs unassigned."
}
```

**Behavior**:
- Routing is deleted
- All BOMs using this routing are unassigned (`routing_id` set to `NULL`)
- All operations for this routing are deleted
- No data loss - BOMs remain but without routing

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 404 | ROUTING_NOT_FOUND | Routing does not exist |
| 403 | PERMISSION_DENIED | Only admins can delete routings |
| 401 | UNAUTHORIZED | Missing or invalid token |

---

### 6. Check BOM Usage

**Endpoint**:
```
GET /api/v1/technical/routings/:id/boms
```

**Description**: Get list of BOMs currently using this routing. Useful for showing usage warnings before deletion.

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Routing ID |

**Request Example**:

```bash
curl -X GET 'https://api.monopilot.app/api/v1/technical/routings/550e8400-e29b-41d4-a716-446655440000/boms' \
  -H 'Authorization: Bearer <token>'
```

**Response** (200 OK):

```json
{
  "boms": [
    {
      "id": "bom-789",
      "code": "BOM-BREAD-001",
      "product_name": "White Bread",
      "status": "ACTIVE"
    },
    {
      "id": "bom-790",
      "code": "BOM-BREAD-002",
      "product_name": "Whole Wheat Bread",
      "status": "ACTIVE"
    },
    {
      "id": "bom-791",
      "code": "BOM-BREAD-003",
      "product_name": "Premium White Bread",
      "status": "DRAFT"
    }
  ],
  "count": 3
}
```

**Limits**: Returns up to 10 BOMs, sorted by effective_from date.

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 404 | ROUTING_NOT_FOUND | Routing does not exist |
| 401 | UNAUTHORIZED | Missing or invalid token |

---

## Code Examples

### JavaScript/TypeScript

```typescript
// List routings
async function listRoutings(filters?: RoutingFilters) {
  const params = new URLSearchParams()
  if (filters?.search) params.append('search', filters.search)
  if (filters?.is_active !== undefined) params.append('is_active', String(filters.is_active))
  if (filters?.page) params.append('page', String(filters.page))

  const response = await fetch(
    `/api/v1/technical/routings?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return response.json()
}

// Create routing
async function createRouting(data: CreateRoutingInput) {
  const response = await fetch('/api/v1/technical/routings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  return response.json()
}

// Update routing
async function updateRouting(id: string, data: UpdateRoutingInput) {
  const response = await fetch(`/api/v1/technical/routings/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  return response.json()
}

// Delete routing
async function deleteRouting(id: string) {
  const response = await fetch(`/api/v1/technical/routings/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.json()
}

// Check BOM usage
async function checkBomUsage(id: string) {
  const response = await fetch(`/api/v1/technical/routings/${id}/boms`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.json()
}
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react'

export function useRouting(id: string) {
  const [routing, setRouting] = useState(null)
  const [boms, setBoms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetch() {
      try {
        const res = await fetch(`/api/v1/technical/routings/${id}`)
        const data = await res.json()
        setRouting(data.routing)

        // Check BOM usage
        const bomRes = await fetch(`/api/v1/technical/routings/${id}/boms`)
        const bomData = await bomRes.json()
        setBoms(bomData.boms)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetch()
  }, [id])

  return { routing, boms, loading, error }
}
```

---

## ADR-009: Routing-Level Costs

All routing endpoints support cost configuration per ADR-009 Architecture Decision Record.

**Cost Fields**:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `setup_cost` | DECIMAL(10,2) | Fixed cost per routing run (e.g., machine setup) | 75.50 |
| `working_cost_per_unit` | DECIMAL(10,4) | Variable cost per output unit | 2.2500 |
| `overhead_percent` | DECIMAL(5,2) | Factory overhead as percentage (0-100) | 15.00 |
| `currency` | TEXT | Currency code | PLN, EUR, USD, GBP |

**Validation**:
- setup_cost >= 0
- working_cost_per_unit >= 0
- overhead_percent: 0-100
- currency: must be one of PLN, EUR, USD, GBP

**Usage in BOM Costing** (Story 02.9):
Routing costs are used to calculate total BOM cost per unit:
```
BOM Cost = Sum(Material Costs) + (Setup Cost / Expected Output) + (Working Cost * Quantity) + (Overhead % * Total)
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Common Error Codes**:

| Code | HTTP | Description |
|------|------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid JWT token |
| VALIDATION_ERROR | 400 | Request body fails schema validation |
| DUPLICATE_CODE | 409 | Code already exists in organization |
| CODE_IMMUTABLE | 400 | Attempt to change immutable code field |
| ROUTING_NOT_FOUND | 404 | Routing ID does not exist |
| PERMISSION_DENIED | 403 | User lacks required permissions |

---

## Rate Limiting

API requests are rate-limited:
- **Limit**: 1000 requests per hour per token
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Changelog

### v1.0 (2025-12-28)
- Initial release with full CRUD operations
- ADR-009 cost fields support
- Version control for routing changes
- Code immutability enforcement
- BOM usage tracking

---

## Related Documentation

- **[ADR-009: Routing-Level Costs](../../adr/009-routing-costs.md)**
- **[Story 02.7: Routings CRUD + Header Management](../../../2-MANAGEMENT/epics/current/02-technical/context/02.7/_index.yaml)**
- **[Story 02.9: BOM-Routing Costs](../../../2-MANAGEMENT/epics/current/02-technical/context/02.9/)**
- **[Routings User Guide](../../../4-USER-GUIDES/routings-management.md)**
