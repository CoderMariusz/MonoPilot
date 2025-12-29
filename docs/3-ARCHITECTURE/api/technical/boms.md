# BOM API Documentation

**Story**: 02.4 - BOMs CRUD + Date Validity
**Version**: 1.0
**Last Updated**: 2025-12-26
**Status**: Production Ready

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [API Endpoints](#api-endpoints)
4. [Error Codes](#error-codes)
5. [Example Workflows](#example-workflows)
6. [Rate Limiting](#rate-limiting)

---

## Overview

The BOM (Bill of Materials) API provides endpoints for managing product compositions with automatic versioning, date validity ranges, and overlap prevention. All endpoints enforce multi-tenant isolation through org_id at both the database (RLS) and service layers (Defense in Depth).

**Base URL**: `/api/v1/technical/boms`

**Key Features**:
- List BOMs with pagination, search, and filtering
- Create new BOMs with automatic version numbering
- Update BOM metadata (dates, status, output quantities)
- Delete BOMs with dependency checking
- View BOM timeline across all versions
- Date overlap prevention (database trigger enforced)
- Full audit trail (created_by, updated_by, timestamps)

---

## Authentication & Authorization

### Authentication

All endpoints require a valid authentication token via Supabase auth.

```bash
curl -H "Authorization: Bearer <YOUR_TOKEN>" \
  https://your-app.com/api/v1/technical/boms
```

### Authorization (RBAC)

| Operation | Required Role | Permission |
|-----------|---------------|-----------|
| GET list/single | All authenticated users | Read-only |
| POST create | ADMIN, SUPER_ADMIN, or Technical:C | Create |
| PUT update | ADMIN, SUPER_ADMIN, or Technical:U | Update |
| DELETE | ADMIN, SUPER_ADMIN only | Delete |
| GET timeline | All authenticated users | Read-only |

**Permission Codes**:
- `C` = Create
- `U` = Update
- `D` = Delete
- `R` = Read (implicit for all authenticated users)

---

## API Endpoints

### 1. List BOMs

**Endpoint**: `GET /api/v1/technical/boms`

**Description**: Retrieve paginated list of BOMs with optional filtering and sorting.

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number (1-indexed) |
| `limit` | number | No | 50 | Records per page (max 100) |
| `search` | string | No | - | Search by product code/name |
| `status` | enum | No | - | Filter by status: `draft`, `active`, `phased_out`, `inactive` |
| `product_id` | string (UUID) | No | - | Filter by product |
| `product_type` | string | No | - | Filter by product type |
| `effective_date` | enum | No | - | Filter by date: `current`, `future`, `expired` |
| `sortBy` | string | No | effective_from | Sort field |
| `sortOrder` | enum | No | desc | Sort order: `asc` or `desc` |

**Response** (200 OK):

```json
{
  "boms": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "org_id": "123e4567-e89b-12d3-a456-426614174000",
      "product_id": "650e8400-e29b-41d4-a716-446655440001",
      "version": 1,
      "bom_type": "standard",
      "effective_from": "2025-01-01",
      "effective_to": null,
      "status": "draft",
      "output_qty": 100,
      "output_uom": "kg",
      "units_per_box": 10,
      "boxes_per_pallet": 50,
      "notes": "Initial version",
      "created_at": "2025-12-26T10:30:00Z",
      "updated_at": "2025-12-26T10:30:00Z",
      "created_by": "user-uuid",
      "updated_by": "user-uuid",
      "product": {
        "id": "650e8400-e29b-41d4-a716-446655440001",
        "code": "PROD-001",
        "name": "Product Name",
        "type": "finished",
        "uom": "kg"
      }
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 50
}
```

**Example Requests**:

```bash
# List first 50 BOMs
curl "https://your-app.com/api/v1/technical/boms" \
  -H "Authorization: Bearer <TOKEN>"

# Search by product code with pagination
curl "https://your-app.com/api/v1/technical/boms?search=PROD&page=1&limit=20" \
  -H "Authorization: Bearer <TOKEN>"

# Filter by status and effective date
curl "https://your-app.com/api/v1/technical/boms?status=active&effective_date=current" \
  -H "Authorization: Bearer <TOKEN>"

# Sort by version descending
curl "https://your-app.com/api/v1/technical/boms?sortBy=version&sortOrder=desc" \
  -H "Authorization: Bearer <TOKEN>"
```

---

### 2. Get Single BOM

**Endpoint**: `GET /api/v1/technical/boms/:id`

**Description**: Retrieve a single BOM with full product details.

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | BOM ID |

**Response** (200 OK):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "org_id": "123e4567-e89b-12d3-a456-426614174000",
  "product_id": "650e8400-e29b-41d4-a716-446655440001",
  "version": 1,
  "bom_type": "standard",
  "effective_from": "2025-01-01",
  "effective_to": null,
  "status": "draft",
  "output_qty": 100,
  "output_uom": "kg",
  "units_per_box": 10,
  "boxes_per_pallet": 50,
  "notes": "Initial version",
  "created_at": "2025-12-26T10:30:00Z",
  "updated_at": "2025-12-26T10:30:00Z",
  "created_by": "user-uuid",
  "updated_by": "user-uuid",
  "product": {
    "id": "650e8400-e29b-41d4-a716-446655440001",
    "code": "PROD-001",
    "name": "Product Name",
    "type": "finished",
    "uom": "kg"
  }
}
```

**Example Request**:

```bash
curl "https://your-app.com/api/v1/technical/boms/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <TOKEN>"
```

**Error Responses**:

- **404 Not Found**: BOM not found or belongs to different organization
  ```json
  { "error": "BOM_NOT_FOUND", "message": "BOM not found" }
  ```

---

### 3. Create BOM

**Endpoint**: `POST /api/v1/technical/boms`

**Description**: Create a new BOM with automatic version numbering.

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <TOKEN>
```

**Request Body**:

```json
{
  "product_id": "650e8400-e29b-41d4-a716-446655440001",
  "effective_from": "2025-01-01",
  "effective_to": null,
  "status": "draft",
  "output_qty": 100,
  "output_uom": "kg",
  "notes": "Initial BOM version"
}
```

**Request Body Schema**:

| Field | Type | Required | Rules | Description |
|-------|------|----------|-------|-------------|
| `product_id` | string (UUID) | Yes | Must exist in products table | Product reference |
| `effective_from` | string (ISO date) | Yes | Valid ISO date | Start date (inclusive) |
| `effective_to` | string (ISO date) \| null | No | Must be after effective_from | End date (inclusive) or null for ongoing |
| `status` | enum | No | `draft` (default), `active` | BOM status |
| `output_qty` | number | Yes | > 0, max 999999999 | Output quantity per batch |
| `output_uom` | string | Yes | 1-20 chars | Unit of measure |
| `notes` | string | No | Max 2000 chars | Optional notes |

**Response** (201 Created):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "org_id": "123e4567-e89b-12d3-a456-426614174000",
  "product_id": "650e8400-e29b-41d4-a716-446655440001",
  "version": 1,
  "bom_type": "standard",
  "effective_from": "2025-01-01",
  "effective_to": null,
  "status": "draft",
  "output_qty": 100,
  "output_uom": "kg",
  "units_per_box": null,
  "boxes_per_pallet": null,
  "notes": "Initial BOM version",
  "created_at": "2025-12-26T10:30:00Z",
  "updated_at": "2025-12-26T10:30:00Z",
  "created_by": "user-uuid",
  "updated_by": "user-uuid",
  "product": {
    "id": "650e8400-e29b-41d4-a716-446655440001",
    "code": "PROD-001",
    "name": "Product Name",
    "type": "finished",
    "uom": "kg"
  }
}
```

**Example Request**:

```bash
curl -X POST "https://your-app.com/api/v1/technical/boms" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "650e8400-e29b-41d4-a716-446655440001",
    "effective_from": "2025-01-01",
    "effective_to": "2025-06-30",
    "status": "active",
    "output_qty": 100,
    "output_uom": "kg",
    "notes": "Q1-Q2 BOM version"
  }'
```

**Error Responses**:

- **400 Validation Error**: Invalid input
  ```json
  {
    "error": "VALIDATION_ERROR",
    "details": [
      {
        "path": ["output_qty"],
        "message": "Output quantity must be greater than 0"
      }
    ]
  }
  ```

- **400 Date Overlap**: Overlaps with existing BOM
  ```json
  {
    "error": "DATE_OVERLAP",
    "message": "Date range overlaps with existing BOM v1 (2025-01-01 to 2025-06-30)"
  }
  ```

- **400 Multiple Ongoing**: Can't have multiple BOMs with no end date
  ```json
  {
    "error": "MULTIPLE_ONGOING",
    "message": "Only one BOM can have no end date per product"
  }
  ```

- **403 Forbidden**: Insufficient permissions
  ```json
  {
    "error": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
  ```

- **404 Not Found**: Product not found
  ```json
  {
    "error": "PRODUCT_NOT_FOUND",
    "message": "Product not found"
  }
  ```

---

### 4. Update BOM

**Endpoint**: `PUT /api/v1/technical/boms/:id`

**Description**: Update BOM metadata. Note: `product_id` is immutable.

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | BOM ID |

**Request Body** (all optional):

```json
{
  "effective_from": "2025-01-15",
  "effective_to": "2025-06-30",
  "status": "active",
  "output_qty": 120,
  "output_uom": "kg",
  "notes": "Updated notes"
}
```

**Updateable Fields**:

| Field | Rules |
|-------|-------|
| `effective_from` | Valid ISO date |
| `effective_to` | ISO date or null; must be after effective_from |
| `status` | `draft`, `active`, `phased_out`, `inactive` |
| `output_qty` | > 0, max 999999999 |
| `output_uom` | 1-20 chars |
| `notes` | Max 2000 chars |

**Non-updateable Fields**: `product_id`, `version`, `bom_type`, `org_id`

**Response** (200 OK):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "org_id": "123e4567-e89b-12d3-a456-426614174000",
  "product_id": "650e8400-e29b-41d4-a716-446655440001",
  "version": 1,
  "bom_type": "standard",
  "effective_from": "2025-01-15",
  "effective_to": "2025-06-30",
  "status": "active",
  "output_qty": 120,
  "output_uom": "kg",
  "units_per_box": null,
  "boxes_per_pallet": null,
  "notes": "Updated notes",
  "created_at": "2025-12-26T10:30:00Z",
  "updated_at": "2025-12-26T11:00:00Z",
  "created_by": "user-uuid",
  "updated_by": "user-uuid",
  "product": {
    "id": "650e8400-e29b-41d4-a716-446655440001",
    "code": "PROD-001",
    "name": "Product Name",
    "type": "finished",
    "uom": "kg"
  }
}
```

**Example Request**:

```bash
curl -X PUT "https://your-app.com/api/v1/technical/boms/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active",
    "effective_to": "2025-06-30",
    "output_qty": 120
  }'
```

**Error Responses**:

- **400 Invalid Date Range**: effective_to not after effective_from
  ```json
  {
    "error": "INVALID_DATE_RANGE",
    "message": "Effective To must be after Effective From"
  }
  ```

- **400 Date Overlap**: New dates overlap with existing BOM
  ```json
  {
    "error": "DATE_OVERLAP",
    "message": "Date range overlaps with existing BOM v2"
  }
  ```

- **403 Forbidden**: Insufficient permissions
  ```json
  {
    "error": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
  ```

- **404 Not Found**: BOM not found
  ```json
  {
    "error": "BOM_NOT_FOUND",
    "message": "BOM not found"
  }
  ```

---

### 5. Delete BOM

**Endpoint**: `DELETE /api/v1/technical/boms/:id`

**Description**: Delete a BOM if not used in any Work Orders.

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | BOM ID |

**Response** (200 OK):

```json
{
  "success": true,
  "message": "BOM deleted successfully"
}
```

**Example Request**:

```bash
curl -X DELETE "https://your-app.com/api/v1/technical/boms/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <TOKEN>"
```

**Error Responses**:

- **400 BOM In Use**: Used in Work Orders
  ```json
  {
    "error": "BOM_IN_USE",
    "message": "Cannot delete BOM used in Work Orders: WO-001, WO-002"
  }
  ```

- **403 Forbidden**: Only admins can delete
  ```json
  {
    "error": "FORBIDDEN",
    "message": "Only administrators can delete BOMs"
  }
  ```

- **404 Not Found**: BOM not found
  ```json
  {
    "error": "BOM_NOT_FOUND",
    "message": "BOM not found"
  }
  ```

---

### 6. Get BOM Timeline

**Endpoint**: `GET /api/v1/technical/boms/timeline/:productId`

**Description**: Retrieve all BOM versions for a product with timeline metadata.

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `productId` | string (UUID) | Yes | Product ID |

**Response** (200 OK):

```json
{
  "product": {
    "id": "650e8400-e29b-41d4-a716-446655440001",
    "code": "PROD-001",
    "name": "Product Name"
  },
  "versions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "version": 1,
      "status": "active",
      "effective_from": "2025-01-01",
      "effective_to": "2025-06-30",
      "output_qty": 100,
      "output_uom": "kg",
      "notes": "Initial version",
      "is_currently_active": false,
      "has_overlap": false
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "version": 2,
      "status": "active",
      "effective_from": "2025-07-01",
      "effective_to": null,
      "output_qty": 120,
      "output_uom": "kg",
      "notes": "Increased output",
      "is_currently_active": true,
      "has_overlap": false
    }
  ],
  "current_date": "2025-12-26"
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `product` | object | Product information |
| `versions` | array | All BOM versions sorted by effective_from |
| `is_currently_active` | boolean | BOM is active on current_date |
| `has_overlap` | boolean | Warning: overlaps with another BOM |
| `current_date` | string | Reference date (today) |

**Example Request**:

```bash
curl "https://your-app.com/api/v1/technical/boms/timeline/650e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer <TOKEN>"
```

**Error Responses**:

- **404 Not Found**: Product not found
  ```json
  {
    "error": "PRODUCT_NOT_FOUND",
    "message": "Product not found"
  }
  ```

---

## Error Codes

| Error Code | HTTP Status | Description | Resolution |
|-----------|------------|-------------|-----------|
| VALIDATION_ERROR | 400 | Request body validation failed | Check field types and constraints |
| DATE_OVERLAP | 400 | BOM date range overlaps with existing | Choose non-overlapping dates |
| MULTIPLE_ONGOING | 400 | Can't have multiple BOMs with no end date | Set effective_to for previous versions |
| INVALID_DATE_RANGE | 400 | effective_to not after effective_from | Ensure dates are in correct order |
| PRODUCT_NOT_FOUND | 404 | Referenced product doesn't exist | Verify product_id is correct |
| BOM_NOT_FOUND | 404 | BOM not found or wrong org | Verify BOM ID and organization |
| BOM_IN_USE | 400 | BOM used in Work Orders | Remove Work Order references first |
| FORBIDDEN | 403 | Insufficient permissions | Check user role and permissions |
| Unauthorized | 401 | Missing/invalid auth token | Provide valid authentication token |
| Internal Server Error | 500 | Unexpected server error | Contact support with error details |

---

## Example Workflows

### Workflow 1: Create Initial BOM

```bash
# 1. Create BOM for new product
curl -X POST "https://your-app.com/api/v1/technical/boms" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "650e8400-e29b-41d4-a716-446655440001",
    "effective_from": "2025-01-01",
    "effective_to": null,
    "status": "draft",
    "output_qty": 100,
    "output_uom": "kg",
    "notes": "Initial version"
  }'

# Returns: BOM with version=1, status=draft
```

### Workflow 2: Create New BOM Version (Date Range)

```bash
# 1. Get current BOM to know effective_to
curl "https://your-app.com/api/v1/technical/boms/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <TOKEN>"

# 2. Create v2 with non-overlapping dates
curl -X POST "https://your-app.com/api/v1/technical/boms" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "650e8400-e29b-41d4-a716-446655440001",
    "effective_from": "2025-07-01",
    "effective_to": "2025-12-31",
    "status": "active",
    "output_qty": 120,
    "output_uom": "kg"
  }'

# 3. Update v1 to end on 2025-06-30
curl -X PUT "https://your-app.com/api/v1/technical/boms/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "effective_to": "2025-06-30"
  }'

# Result: Two non-overlapping BOMs
```

### Workflow 3: View Timeline and Delete

```bash
# 1. View all versions for product
curl "https://your-app.com/api/v1/technical/boms/timeline/650e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer <TOKEN>"

# 2. Check if any BOM is in use
# (would get BOM_IN_USE error if trying to delete used BOM)

# 3. Delete unused BOM
curl -X DELETE "https://your-app.com/api/v1/technical/boms/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Rate Limiting

Currently no rate limiting implemented. Plan for future versions:
- **Standard Users**: 1000 requests/hour
- **API Users**: 10000 requests/hour
- **Burst**: Max 100 requests/minute

---

## Security Considerations

### Multi-Tenant Isolation (ADR-013)

All queries enforce `org_id` isolation at two layers:

1. **Database Layer**: RLS policies block cross-organization access
2. **Service Layer**: Explicit `org_id` filtering (Defense in Depth)

### Audit Trail

Every BOM tracks:
- `created_by`: User ID that created the BOM
- `created_at`: ISO timestamp
- `updated_by`: User ID of last update
- `updated_at`: ISO timestamp (auto-updated on modifications)

### Date Overlap Prevention

Prevented at two layers:

1. **RPC Function** (`check_bom_date_overlap`): Client-side validation for early feedback
2. **Database Trigger** (`check_bom_date_overlap`): Preventive control that blocks invalid modifications

Both use identical daterange logic:
```sql
daterange(effective_from, effective_to, '[]') &&
daterange(new_from, new_to, '[]')
```

---

## Type Definitions

### BOM Type

```typescript
interface BOM {
  id: string
  org_id: string
  product_id: string
  version: number
  bom_type: 'standard' | 'engineering' | 'costing'
  effective_from: string // ISO date
  effective_to: string | null // ISO date or null
  status: 'draft' | 'active' | 'phased_out' | 'inactive'
  output_qty: number
  output_uom: string
  units_per_box?: number | null
  boxes_per_pallet?: number | null
  notes?: string | null
  created_at: string // ISO timestamp
  updated_at: string // ISO timestamp
  created_by: string // User ID
  updated_by: string // User ID
}

interface BOMWithProduct extends BOM {
  product: {
    id: string
    code: string
    name: string
    type: string
    uom: string
  }
}

interface BOMsListResponse {
  boms: BOMWithProduct[]
  total: number
  page: number
  limit: number
}

interface CreateBOMRequest {
  product_id: string
  effective_from: string
  effective_to?: string | null
  status?: 'draft' | 'active'
  output_qty: number
  output_uom: string
  notes?: string
}

interface UpdateBOMRequest {
  effective_from?: string
  effective_to?: string | null
  status?: 'draft' | 'active' | 'phased_out' | 'inactive'
  output_qty?: number
  output_uom?: string
  notes?: string | null
}
```

---

## Support

For API issues or questions, contact the development team or file an issue in the project repository.
