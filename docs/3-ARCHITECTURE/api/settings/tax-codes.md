# Tax Codes API Documentation

**Story**: 01.13 - Tax Codes CRUD
**Module**: Settings
**Base Path**: `/api/v1/settings/tax-codes`
**Version**: 1.0.0
**Last Updated**: 2025-12-23

---

## Overview

The Tax Codes API provides CRUD operations for managing tax rate configurations (VAT, GST, sales tax, etc.) in the MonoPilot system. Tax codes represent tax rates with jurisdiction (country), validity periods, and default selection for automated workflows.

**Features**:
- Multi-tenancy (org-scoped isolation)
- Role-based access control (ADMIN, SUPER_ADMIN only)
- Multi-country support (ISO 3166-1 alpha-2)
- Effective date ranges with status calculation (active/expired/scheduled)
- Atomic default assignment (one default per org)
- Code immutability when referenced by suppliers
- Soft delete with audit trail preservation
- Search, filtering, sorting, and pagination
- Polish VAT codes pre-seeded (23%, 8%, 5%, 0%, Exempt)

---

## Authentication

All endpoints require authentication via Supabase Auth.

**Headers Required**:
```
Authorization: Bearer <access_token>
```

**Response Codes**:
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Valid auth but insufficient permissions (requires ADMIN or SUPER_ADMIN)
- `404 Not Found` - Resource not found (including cross-tenant access)

---

## Endpoints

### 1. List Tax Codes

```
GET /api/v1/settings/tax-codes
```

Returns paginated list of tax codes for the authenticated user's organization.

**Query Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | - | Filter by code or name (min 2 chars, case-insensitive) |
| `country_code` | string | - | Filter by ISO 3166-1 alpha-2 country code (e.g., PL, DE, GB) |
| `status` | string | `all` | Filter by status (`active`, `expired`, `scheduled`, `all`) |
| `sort` | string | `created_at` | Sort field (`code`, `name`, `rate`, `country_code`, `valid_from`, `created_at`) |
| `order` | string | `desc` | Sort order (`asc`, `desc`) |
| `page` | integer | `1` | Page number (1-based) |
| `limit` | integer | `20` | Items per page (max: 100) |

**Performance Target**: < 300ms for 100 tax codes, < 200ms for search queries

**Success Response (200 OK)**:

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "org_id": "org-uuid",
      "code": "VAT23",
      "name": "VAT 23%",
      "rate": 23.00,
      "country_code": "PL",
      "valid_from": "2011-01-01",
      "valid_to": null,
      "is_default": true,
      "is_deleted": false,
      "deleted_at": null,
      "deleted_by": null,
      "created_at": "2025-12-20T10:00:00Z",
      "updated_at": "2025-12-22T14:30:00Z",
      "created_by": "user-uuid",
      "updated_by": "user-uuid"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20,
  "total_pages": 1
}
```

**Status Filtering Logic**:

Status is calculated dynamically based on `valid_from`, `valid_to`, and current date:

- **active**: `valid_from <= today` AND (`valid_to IS NULL` OR `valid_to >= today`)
- **expired**: `valid_to < today`
- **scheduled**: `valid_from > today`
- **all**: No status filter applied

**Error Responses**:

```json
// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch tax codes"
}
```

**Example Requests**:

```bash
# List all tax codes (first page)
curl -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/tax-codes"

# Search for codes containing "VAT"
curl -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/tax-codes?search=VAT"

# Filter by country and status
curl -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/tax-codes?country_code=PL&status=active"

# Sort by rate ascending
curl -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/tax-codes?sort=rate&order=asc"

# Pagination (page 2, 50 items)
curl -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/tax-codes?page=2&limit=50"
```

---

### 2. Get Tax Code by ID

```
GET /api/v1/settings/tax-codes/:id
```

Returns details for a specific tax code.

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Tax code ID |

**Success Response (200 OK)**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "org_id": "org-uuid",
  "code": "VAT23",
  "name": "VAT 23%",
  "rate": 23.00,
  "country_code": "PL",
  "valid_from": "2011-01-01",
  "valid_to": null,
  "is_default": true,
  "is_deleted": false,
  "deleted_at": null,
  "deleted_by": null,
  "created_at": "2025-12-20T10:00:00Z",
  "updated_at": "2025-12-22T14:30:00Z",
  "created_by": "user-uuid",
  "updated_by": "user-uuid"
}
```

**Error Responses**:

```json
// 404 Not Found (tax code doesn't exist or belongs to different org)
{
  "error": "Tax code not found"
}

// 401 Unauthorized
{
  "error": "Unauthorized"
}
```

**Example Request**:

```bash
curl -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/tax-codes/550e8400-e29b-41d4-a716-446655440000"
```

---

### 3. Create Tax Code

```
POST /api/v1/settings/tax-codes
```

Creates a new tax code.

**Required Permissions**: `SUPER_ADMIN`, `ADMIN`

**Performance Target**: < 1s

**Request Body**:

```json
{
  "code": "VAT8",
  "name": "VAT 8%",
  "rate": 8.00,
  "country_code": "PL",
  "valid_from": "2011-01-01",
  "valid_to": null,
  "is_default": false
}
```

**Field Specifications**:

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `code` | string | Yes | 2-20 chars, uppercase alphanumeric + hyphens (`^[A-Z0-9-]+$`) | Unique tax code identifier |
| `name` | string | Yes | 2-100 chars | Human-readable tax name |
| `rate` | number | Yes | 0-100, max 2 decimals | Tax rate percentage (0 allowed for exempt) |
| `country_code` | string | Yes | Exactly 2 chars, uppercase (`^[A-Z]{2}$`) | ISO 3166-1 alpha-2 country code |
| `valid_from` | string | Yes | YYYY-MM-DD format | Tax code valid from date (inclusive) |
| `valid_to` | string | No | YYYY-MM-DD format, must be > valid_from | Tax code valid until date (null = no expiry) |
| `is_default` | boolean | No | true/false | Set as default tax code (default: false) |

**Success Response (201 Created)**:

```json
{
  "id": "new-tax-code-uuid",
  "org_id": "org-uuid",
  "code": "VAT8",
  "name": "VAT 8%",
  "rate": 8.00,
  "country_code": "PL",
  "valid_from": "2011-01-01",
  "valid_to": null,
  "is_default": false,
  "is_deleted": false,
  "deleted_at": null,
  "deleted_by": null,
  "created_at": "2025-12-23T15:00:00Z",
  "updated_at": "2025-12-23T15:00:00Z",
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
      "field": "code",
      "message": "Code must be uppercase alphanumeric with hyphens only"
    }
  ]
}

// 409 Conflict - Duplicate code within same org and country
{
  "error": "Tax code \"VAT23\" already exists for country PL"
}

// 403 Forbidden
{
  "error": "Permission denied"
}
```

**Validation Rules**:

- **Code**: Auto-uppercase transformation (DB trigger), unique per org+country, format `^[A-Z0-9-]+$`
- **Name**: Required, 2-100 characters
- **Rate**: 0-100 with max 2 decimal places (0% allowed for exempt/zero-rated)
- **Country Code**: Exactly 2 uppercase letters (ISO 3166-1 alpha-2)
- **Date Range**: valid_to must be after valid_from if provided
- **Default**: Setting is_default=true automatically unsets previous default (trigger)

**Example Request**:

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "VAT8",
    "name": "VAT 8%",
    "rate": 8.00,
    "country_code": "PL",
    "valid_from": "2011-01-01"
  }' \
  "https://api.monopilot.com/api/v1/settings/tax-codes"
```

---

### 4. Update Tax Code

```
PUT /api/v1/settings/tax-codes/:id
```

Updates an existing tax code.

**Required Permissions**: `SUPER_ADMIN`, `ADMIN`

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Tax code ID |

**Request Body** (all fields optional):

```json
{
  "code": "VAT8-NEW",
  "name": "VAT 8% Reduced",
  "rate": 8.50,
  "country_code": "PL",
  "valid_from": "2025-01-01",
  "valid_to": "2025-12-31",
  "is_default": false
}
```

**Business Rules**:

1. **Code Immutability When Referenced**: If tax code is referenced by suppliers (Epic 3/9), code cannot be changed
   - Error: "Cannot change code for referenced tax code"
   - Check via `get_tax_code_reference_count()` RPC function
2. **Code Uniqueness**: If changing code, new code must be unique per org+country
3. All other fields are mutable
4. Only provided fields will be updated

**Success Response (200 OK)**:

```json
{
  "id": "tax-code-uuid",
  "org_id": "org-uuid",
  "code": "VAT8-NEW",
  "name": "VAT 8% Reduced",
  "rate": 8.50,
  "country_code": "PL",
  "valid_from": "2025-01-01",
  "valid_to": "2025-12-31",
  "is_default": false,
  "is_deleted": false,
  "deleted_at": null,
  "deleted_by": null,
  "created_at": "2025-12-20T10:00:00Z",
  "updated_at": "2025-12-23T16:00:00Z",
  "created_by": "user-uuid",
  "updated_by": "user-uuid"
}
```

**Error Responses**:

```json
// 404 Not Found
{
  "error": "Tax code not found"
}

// 400 Bad Request - Code immutability violation
{
  "error": "Cannot change code for referenced tax code"
}

// 409 Conflict - Duplicate code
{
  "error": "Tax code \"VAT8\" already exists for country PL"
}

// 403 Forbidden
{
  "error": "Permission denied"
}
```

**Example Request**:

```bash
curl -X PUT \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "VAT 8% Reduced",
    "rate": 8.50
  }' \
  "https://api.monopilot.com/api/v1/settings/tax-codes/tax-code-uuid"
```

---

### 5. Delete Tax Code

```
DELETE /api/v1/settings/tax-codes/:id
```

Deletes a tax code (soft delete for audit trail preservation).

**Required Permissions**: `SUPER_ADMIN`, `ADMIN`

**Performance Target**: < 500ms

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Tax code ID |

**Request Body**: None

**Business Rules** (enforced):

1. Cannot delete if tax code is referenced by suppliers (Epic 3/9)
   - Error message includes reference count: "Cannot delete tax code referenced by N suppliers"
   - Checked via `get_tax_code_reference_count()` RPC function
2. Always performs soft delete (sets `is_deleted = true`, `deleted_at = timestamp`, `deleted_by = user_id`)
3. Preserves audit trail for historical supplier/invoice references

**Success Response (204 No Content)**:

```
(Empty response body)
```

**Error Responses**:

```json
// 400 Bad Request - Referenced by suppliers
{
  "error": "Cannot delete tax code referenced by 5 suppliers"
}

// 404 Not Found
{
  "error": "Tax code not found"
}

// 403 Forbidden
{
  "error": "Permission denied"
}
```

**Example Request**:

```bash
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/tax-codes/tax-code-uuid"
```

---

### 6. Set Default Tax Code

```
PATCH /api/v1/settings/tax-codes/:id/set-default
```

Sets a tax code as the default for the organization (atomic operation).

**Required Permissions**: `SUPER_ADMIN`, `ADMIN`

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Tax code ID |

**Request Body**: None

**Business Rules**:

1. Automatically unsets previous default (database trigger)
2. Atomic operation (no race conditions)
3. Only one tax code can be default per organization

**Success Response (200 OK)**:

```json
{
  "id": "tax-code-uuid",
  "org_id": "org-uuid",
  "code": "VAT23",
  "name": "VAT 23%",
  "is_default": true,
  "updated_at": "2025-12-23T16:30:00Z",
  "updated_by": "user-uuid"
}
```

**Error Responses**:

```json
// 404 Not Found
{
  "error": "Tax code not found"
}

// 403 Forbidden
{
  "error": "Permission denied"
}
```

**Example Request**:

```bash
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/tax-codes/tax-code-uuid/set-default"
```

---

### 7. Validate Tax Code

```
GET /api/v1/settings/tax-codes/validate-code
```

Checks if a tax code is unique within the organization and country.

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | string | Yes | Tax code to validate |
| `country_code` | string | Yes | ISO 3166-1 alpha-2 country code |
| `exclude_id` | UUID | No | Tax code ID to exclude from check (for updates) |

**Success Response (200 OK)**:

```json
{
  "available": false,
  "message": "Tax code already exists for this country"
}
```

**Error Responses**:

```json
// 400 Bad Request - Missing parameters
{
  "error": "Code and country_code are required"
}
```

**Example Requests**:

```bash
# Check if code is available (create mode)
curl -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/tax-codes/validate-code?code=VAT23&country_code=PL"

# Check if code is available (edit mode - exclude current tax code)
curl -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/tax-codes/validate-code?code=VAT23&country_code=PL&exclude_id=current-tax-code-uuid"
```

---

### 8. Get Default Tax Code

```
GET /api/v1/settings/tax-codes/default
```

Returns the default tax code for the organization.

**Success Response (200 OK)**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "org_id": "org-uuid",
  "code": "VAT23",
  "name": "VAT 23%",
  "rate": 23.00,
  "country_code": "PL",
  "is_default": true
}
```

**Error Responses**:

```json
// 404 Not Found - No default tax code set
{
  "error": "No default tax code found"
}
```

**Example Request**:

```bash
curl -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/tax-codes/default"
```

---

## Data Types

### Tax Code Object

```typescript
interface TaxCode {
  id: string                       // UUID
  org_id: string                   // Organization UUID (RLS enforced)
  code: string                     // 2-20 chars, uppercase alphanumeric + hyphens
  name: string                     // 2-100 chars
  rate: number                     // 0-100 with max 2 decimals (e.g., 23.00 for 23%)
  country_code: string             // ISO 3166-1 alpha-2 (e.g., PL, DE, GB)
  valid_from: string               // ISO date (YYYY-MM-DD)
  valid_to: string | null          // ISO date (YYYY-MM-DD), null = no expiry
  is_default: boolean              // Default flag (one per org)
  is_deleted: boolean              // Soft delete flag
  deleted_at: string | null        // ISO 8601 timestamp
  deleted_by: string | null        // User UUID
  created_at: string               // ISO 8601 timestamp
  updated_at: string               // ISO 8601 timestamp
  created_by: string               // User UUID
  updated_by: string               // User UUID
}
```

### Tax Code Status (Calculated)

```typescript
type TaxCodeStatus = 'active' | 'expired' | 'scheduled'
```

**Status Calculation Logic**:

```typescript
function getTaxCodeStatus(taxCode: TaxCode): TaxCodeStatus {
  const today = new Date().toISOString().split('T')[0]

  if (taxCode.valid_from > today) return 'scheduled'
  if (taxCode.valid_to && taxCode.valid_to < today) return 'expired'
  return 'active'
}
```

**Status Badge Colors**:
- **active**: Green (success)
- **expired**: Red (destructive)
- **scheduled**: Gray/Yellow (secondary)

### Country Codes (Supported)

Common EU countries for food manufacturing:

```typescript
const COUNTRY_OPTIONS = [
  { code: 'PL', name: 'Poland' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'AT', name: 'Austria' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'SE', name: 'Sweden' },
  { code: 'DK', name: 'Denmark' },
  { code: 'NO', name: 'Norway' },
  { code: 'FI', name: 'Finland' },
  { code: 'IE', name: 'Ireland' },
]
```

---

## Security

### Row-Level Security (RLS)

All tax code operations enforce org-level isolation via RLS policies:

```sql
-- SELECT: All authenticated users can read non-deleted org tax codes
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND is_deleted = false
)

-- INSERT: Admin only
WITH CHECK (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('SUPER_ADMIN', 'ADMIN')
  )
)

-- UPDATE: Admin only
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('SUPER_ADMIN', 'ADMIN')
  )
)

-- DELETE: Admin only
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

| Role | List | View | Create | Update | Delete | Set Default |
|------|------|------|--------|--------|--------|-------------|
| SUPER_ADMIN | Yes | Yes | Yes | Yes | Yes | Yes |
| ADMIN | Yes | Yes | Yes | Yes | Yes | Yes |
| PROD_MANAGER | Yes | Yes | No | No | No | No |
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
| 409 | Conflict | Unique constraint violation (duplicate code+country), reference exists |
| 500 | Internal Server Error | Unexpected server error |

---

## Performance Considerations

### Performance Targets

- **List**: < 300ms for 100 tax codes
- **Search**: < 200ms
- **Create**: < 1s
- **Update**: < 1s
- **Delete**: < 500ms (with reference check)

### Indexing

All queries are optimized with indexes on:
- `org_id` (org isolation)
- `(org_id, country_code)` (country filtering)
- `(org_id, is_deleted)` WHERE is_deleted = false (exclude soft-deleted)
- `(org_id, valid_from, valid_to)` (status filtering)

### Pagination

Default: 20 items per page
Maximum: 100 items per page

For organizations with >1000 tax codes, consider front-end caching strategies.

---

## Testing Examples

### JavaScript/TypeScript

```typescript
// List tax codes
const response = await fetch(
  '/api/v1/settings/tax-codes?country_code=PL&status=active',
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
)
const { data, total, page, limit, total_pages } = await response.json()

// Create tax code
const createResponse = await fetch(
  '/api/v1/settings/tax-codes',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code: 'VAT8',
      name: 'VAT 8%',
      rate: 8.00,
      country_code: 'PL',
      valid_from: '2011-01-01'
    })
  }
)
const taxCode = await createResponse.json()

// Update tax code
await fetch(
  `/api/v1/settings/tax-codes/${taxCodeId}`,
  {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Updated Name',
      rate: 8.50
    })
  }
)

// Set default
await fetch(
  `/api/v1/settings/tax-codes/${taxCodeId}/set-default`,
  {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` }
  }
)

// Delete tax code
await fetch(
  `/api/v1/settings/tax-codes/${taxCodeId}`,
  {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  }
)
```

---

## Common Use Cases

### 1. Search for Active Polish VAT Codes

```bash
curl -H "Authorization: Bearer TOKEN" \
  "https://api.monopilot.com/api/v1/settings/tax-codes?search=VAT&country_code=PL&status=active"
```

### 2. Create Tax Code with Validity Period

```bash
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "VAT8-2026",
    "name": "VAT 8% (2026 Rate Change)",
    "rate": 8.00,
    "country_code": "PL",
    "valid_from": "2026-01-01",
    "valid_to": "2026-12-31"
  }' \
  "https://api.monopilot.com/api/v1/settings/tax-codes"
```

### 3. Create Exempt Tax Code

```bash
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "ZW",
    "name": "Zwolniony (Exempt)",
    "rate": 0.00,
    "country_code": "PL",
    "valid_from": "2011-01-01"
  }' \
  "https://api.monopilot.com/api/v1/settings/tax-codes"
```

### 4. Set Default Tax Code

```bash
curl -X PATCH \
  -H "Authorization: Bearer TOKEN" \
  "https://api.monopilot.com/api/v1/settings/tax-codes/tax-code-uuid/set-default"
```

### 5. Get Default Tax Code

```bash
curl -H "Authorization: Bearer TOKEN" \
  "https://api.monopilot.com/api/v1/settings/tax-codes/default"
```

---

## Seed Data (Polish VAT)

All organizations are automatically seeded with 5 Polish VAT codes:

| Code | Name | Rate | Valid From | Default |
|------|------|------|------------|---------|
| VAT23 | VAT 23% | 23.00% | 2011-01-01 | Yes |
| VAT8 | VAT 8% | 8.00% | 2011-01-01 | No |
| VAT5 | VAT 5% | 5.00% | 2011-01-01 | No |
| VAT0 | VAT 0% | 0.00% | 2011-01-01 | No |
| ZW | Zwolniony (Exempt) | 0.00% | 2011-01-01 | No |

Seeding is idempotent and occurs during organization creation.

---

## Error Code Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `TAX_CODE_NOT_FOUND` | 404 | Tax code does not exist or not in user's org |
| `DUPLICATE_CODE` | 409 | Tax code already exists for org+country |
| `CODE_IMMUTABLE` | 400 | Cannot change code when referenced by suppliers |
| `REFERENCE_EXISTS` | 400 | Cannot delete tax code referenced by suppliers |
| `VALIDATION_FAILED` | 400 | Request body failed Zod schema validation |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | User lacks required role permissions (requires ADMIN) |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-23 | Initial release (Story 01.13) |

---

## Related Documentation

- [Tax Code User Guide](../../guides/tax-code-management.md)
- [Database Schema - Tax Codes Table](../../database/migrations/tax-codes.md)
- [Story 01.13 Specification](../../../2-MANAGEMENT/epics/current/01-settings/context/01.13/)
- [QA Report - Story 01.13](../../../2-MANAGEMENT/qa/qa-report-story-01.13.md)

---

**API Version**: 1.0.0
**Story**: 01.13
**Status**: Complete
**Last Updated**: 2025-12-23
