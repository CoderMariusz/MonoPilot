# Technical API Schema Documentation

**Last Updated**: 2025-02-09  
**Status**: Comprehensive documentation for all production API endpoints  
**Coverage**: Complete request/response schemas, validation rules, and error codes

---

## Table of Contents

1. [Quality Holds API](#quality-holds-api)
2. [Error Codes](#error-codes)
3. [Data Types & Enums](#data-types--enums)
4. [Validation Rules](#validation-rules)
5. [Authentication & Authorization](#authentication--authorization)

---

## Quality Holds API

### Base Path
```
/api/quality/holds
```

---

### Endpoint: POST /api/quality/holds

**Description**: Create a new quality hold with associated items (license plates, work orders, or batches).

#### Request

**Method**: `POST`  
**Content-Type**: `application/json`

##### Request Body Schema

```typescript
interface CreateHoldInput {
  reason: string                    // Required. 10-500 characters
  hold_type: HoldType               // Required. Enum: 'qa_pending' | 'investigation' | 'recall' | 'quarantine'
  priority?: HoldPriority           // Optional. Default: 'medium'
                                    // Enum: 'low' | 'medium' | 'high' | 'critical'
  items: QualityHoldItemInput[]     // Required. Min 1 item, Max 100 items
                                    // No duplicate items allowed (same reference_type + reference_id)
}

interface QualityHoldItemInput {
  reference_type: ReferenceType     // Required. Enum: 'lp' | 'wo' | 'batch'
  reference_id: string              // Required. Valid UUID v4
  quantity_held?: number            // Optional. Must be > 0 if provided
  uom?: string                      // Optional. Max 20 characters
  notes?: string                    // Optional. Max 500 characters
}
```

##### Validation Rules

| Field | Type | Constraints | Example |
|-------|------|-------------|---------|
| `reason` | string | Min 10, Max 500 chars | "Failed metal detection test" |
| `hold_type` | enum | qa_pending, investigation, recall, quarantine | "investigation" |
| `priority` | enum | low, medium, high, critical (default: medium) | "high" |
| `items` | array | Min 1, Max 100, no duplicates | See below |
| `reference_type` | enum | lp, wo, batch | "lp" |
| `reference_id` | UUID v4 | Must exist and belong to user's org | "550e8400-e29b..." |
| `quantity_held` | number | > 0 | 100 |
| `uom` | string | Max 20 chars | "kg" |
| `notes` | string | Max 500 chars | "Batch lot #123 affected" |

##### Request Example

```json
{
  "reason": "Failed metal detection test during production. Material contains ferrous contamination.",
  "hold_type": "investigation",
  "priority": "high",
  "items": [
    {
      "reference_type": "lp",
      "reference_id": "550e8400-e29b-41d4-a716-446655440000",
      "quantity_held": 100,
      "uom": "kg",
      "notes": "Full batch affected - requires re-inspection"
    },
    {
      "reference_type": "wo",
      "reference_id": "550e8400-e29b-41d4-a716-446655440001",
      "notes": "Work order on hold pending investigation"
    }
  ]
}
```

#### Response

**Status Code**: `201 Created`  
**Content-Type**: `application/json`

##### Response Body Schema

```typescript
interface CreateHoldResponse {
  hold: QualityHold
  items: QualityHoldItem[]
  lp_updates?: LicensePlateUpdate[]
}

interface QualityHold {
  id: string                        // UUID
  hold_number: string               // Auto-generated. Format: QH-YYYYMMDD-NNNN
  org_id: string                    // Organization ID (RLS)
  status: 'active'                  // Always 'active' for new holds
  priority: HoldPriority            // 'low' | 'medium' | 'high' | 'critical'
  hold_type: HoldType               // 'qa_pending' | 'investigation' | 'recall' | 'quarantine'
  reason: string                    // Full reason text (10-500 chars)
  items_count: number               // Count of items in hold
  held_by: {
    id: string                      // User UUID
    name: string                    // User name
    email: string                   // User email
  }
  held_at: string                   // ISO 8601 timestamp
  released_by: null                 // Always null for new holds
  released_at: null                 // Always null for new holds
  disposition: null                 // Always null for new holds
  release_notes: null               // Always null for new holds
  ncr_id: string | null             // Non-conformance report ID if linked
  created_by: string                // User ID who created
  created_at: string                // ISO 8601 timestamp
  updated_by: string                // User ID of last update
  updated_at: string                // ISO 8601 timestamp
}

interface QualityHoldItem {
  id: string                        // UUID of hold item
  hold_id: string                   // UUID of parent hold
  reference_type: ReferenceType     // 'lp' | 'wo' | 'batch'
  reference_id: string              // UUID of referenced entity
  reference_display: string         // Display name (e.g., "LP-00001")
  quantity_held: number | null      // Quantity if provided
  uom: string | null                // Unit of measure if provided
  location_id: string | null        // Location ID (for LP items only)
  location_name: string | null      // Location name (for LP items only)
  notes: string | null              // Notes if provided
}

interface LicensePlateUpdate {
  lp_id: string                     // UUID of license plate
  lp_number: string                 // Display number (e.g., "LP-00001")
  previous_status: string           // qa_status before hold
  new_status: string                // qa_status after hold (always 'hold')
}
```

##### Response Example

```json
{
  "hold": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "hold_number": "QH-20250209-0001",
    "org_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "active",
    "priority": "high",
    "hold_type": "investigation",
    "reason": "Failed metal detection test during production...",
    "items_count": 2,
    "held_by": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "held_at": "2025-02-09T10:30:00Z",
    "released_by": null,
    "released_at": null,
    "disposition": null,
    "release_notes": null,
    "ncr_id": null,
    "created_by": "550e8400-e29b-41d4-a716-446655440001",
    "created_at": "2025-02-09T10:30:00Z",
    "updated_by": "550e8400-e29b-41d4-a716-446655440001",
    "updated_at": "2025-02-09T10:30:00Z"
  },
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "hold_id": "550e8400-e29b-41d4-a716-446655440002",
      "reference_type": "lp",
      "reference_id": "550e8400-e29b-41d4-a716-446655440000",
      "reference_display": "LP-00001",
      "quantity_held": 100,
      "uom": "kg",
      "location_id": "550e8400-e29b-41d4-a716-446655440020",
      "location_name": "Warehouse A",
      "notes": "Full batch affected - requires re-inspection"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440011",
      "hold_id": "550e8400-e29b-41d4-a716-446655440002",
      "reference_type": "wo",
      "reference_id": "550e8400-e29b-41d4-a716-446655440001",
      "reference_display": "WO-00123",
      "quantity_held": null,
      "uom": null,
      "location_id": null,
      "location_name": null,
      "notes": "Work order on hold pending investigation"
    }
  ],
  "lp_updates": [
    {
      "lp_id": "550e8400-e29b-41d4-a716-446655440000",
      "lp_number": "LP-00001",
      "previous_status": "pending",
      "new_status": "hold"
    }
  ]
}
```

#### Error Responses

##### 400 Bad Request - Validation Error

```json
{
  "error": "Invalid request data",
  "details": [
    {
      "code": "too_small",
      "minimum": 10,
      "type": "string",
      "path": ["reason"],
      "message": "String must contain at least 10 character(s)"
    }
  ]
}
```

**Common Validation Errors**:
- Missing required fields: reason, hold_type, items
- Reason length < 10 or > 500 characters
- Invalid enum values (hold_type, priority, reference_type)
- Invalid UUID format for reference_id
- quantity_held <= 0
- Empty items array
- Duplicate items in array
- Malformed JSON

##### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

**Causes**:
- Missing authentication token
- Invalid authentication token
- Expired session

##### 403 Forbidden

```json
{
  "error": "Insufficient permissions to create quality holds"
}
```

**Causes**:
- User role is VIEWER (read-only)
- User role is OPERATOR (no quality write permission)
- User lacks required permission scope

**Allowed Roles**: QA_INSPECTOR, QA_MANAGER, ADMIN

##### 404 Not Found

```json
{
  "error": "License plate not found"
}
```

Or:
```json
{
  "error": "Work order not found"
}
```

**Causes**:
- Referenced LP/WO/batch ID does not exist
- Referenced entity belongs to different organization
- Referenced entity was deleted

##### 500 Internal Server Error

```json
{
  "error": "Database connection failed"
}
```

**Causes**:
- Database errors
- Service failures
- Unexpected exceptions

---

### Endpoint: GET /api/quality/holds

**Description**: Retrieve paginated list of quality holds with filters, search, and sorting.

#### Request

**Method**: `GET`  
**Query Parameters**:

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `status` | string | - | - | Comma-separated: active,released,disposed |
| `priority` | string | - | - | Comma-separated: low,medium,high,critical |
| `hold_type` | string | - | - | Comma-separated: qa_pending,investigation,recall,quarantine |
| `from` | string (ISO 8601) | - | - | Start date (inclusive) for held_at range |
| `to` | string (ISO 8601) | - | - | End date (inclusive) for held_at range |
| `search` | string | - | - | Free-text search in hold_number or reason |
| `limit` | number | 20 | 100 | Records per page |
| `offset` | number | 0 | - | Records to skip |
| `sort` | string | held_at DESC | - | Sort field and direction |

##### Query Examples

```
GET /api/quality/holds?status=active
GET /api/quality/holds?priority=high,critical&sort=priority DESC
GET /api/quality/holds?from=2025-01-01&to=2025-01-31&limit=50&offset=0
GET /api/quality/holds?search=metal%20detection&hold_type=investigation
```

#### Response

**Status Code**: `200 OK`

##### Response Body Schema

```typescript
interface ListHoldsResponse {
  holds: QualityHoldSummary[]
  pagination: {
    total: number
    limit: number
    offset: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
  filters_applied: {
    status?: string[]
    priority?: string[]
    hold_type?: string[]
    date_range?: {
      from: string | null
      to: string | null
    }
    search?: string
  }
}

interface QualityHoldSummary {
  id: string
  hold_number: string               // QH-YYYYMMDD-NNNN format
  status: 'active' | 'released' | 'disposed'
  priority: HoldPriority
  hold_type: HoldType
  reason: string                    // Truncated to 100 chars in list view
  items_count: number
  held_by: {
    id: string
    name: string
    email: string
  }
  held_at: string                   // ISO 8601
  aging_hours: number               // Hours since held_at
  aging_status: 'normal' | 'warning' | 'critical'
}
```

##### Response Example

```json
{
  "holds": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "hold_number": "QH-20250209-0001",
      "status": "active",
      "priority": "high",
      "hold_type": "investigation",
      "reason": "Failed metal detection test during production...",
      "items_count": 2,
      "held_by": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "held_at": "2025-02-09T10:30:00Z",
      "aging_hours": 5,
      "aging_status": "normal"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0,
    "total_pages": 2,
    "has_next": true,
    "has_prev": false
  },
  "filters_applied": {
    "status": ["active"],
    "priority": ["high", "critical"],
    "hold_type": null,
    "date_range": {
      "from": null,
      "to": null
    },
    "search": null
  }
}
```

#### Error Responses

##### 400 Bad Request

```json
{
  "error": "Invalid request parameters",
  "details": [
    {
      "code": "too_big",
      "maximum": 100,
      "type": "number",
      "path": ["limit"],
      "message": "Number must be less than or equal to 100"
    }
  ]
}
```

##### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

##### 500 Internal Server Error

```json
{
  "error": "Database query failed"
}
```

---

## Error Codes

### HTTP Status Codes

| Code | Status | Meaning | Use Case |
|------|--------|---------|----------|
| 200 | OK | Success (GET, PATCH) | Query executed successfully |
| 201 | Created | Resource created | Hold created successfully (POST) |
| 204 | No Content | Success with no body | Soft-delete successful (DELETE) |
| 400 | Bad Request | Validation failed | Invalid input parameters |
| 401 | Unauthorized | Auth missing/invalid | Missing or expired token |
| 403 | Forbidden | Permission denied | User lacks required role |
| 404 | Not Found | Resource not found | Entity doesn't exist or RLS blocked |
| 409 | Conflict | State conflict | Can't release already-released hold |
| 500 | Internal Server Error | Server error | Database/service failure |

### Application Error Codes

| Error | Code | HTTP | Message | Resolution |
|-------|------|------|---------|-----------|
| VALIDATION_ERROR | INVALID_REQUEST_DATA | 400 | Details in response | Check constraints in schema |
| AUTH_ERROR | UNAUTHORIZED | 401 | No credentials/expired | Authenticate and retry |
| PERMISSION_ERROR | INSUFFICIENT_PERMISSIONS | 403 | User role insufficient | Request access elevation |
| NOT_FOUND_ERROR | RESOURCE_NOT_FOUND | 404 | Entity not found | Verify ID exists and belongs to org |
| STATE_ERROR | INVALID_STATE_TRANSITION | 409 | Hold already released | Cannot re-release or dispose |
| DUPLICATE_ERROR | DUPLICATE_ITEM | 400 | Duplicate in request | Remove duplicate items |
| RLS_ERROR | RESOURCE_NOT_FOUND | 404 | Cross-org access attempt | Verify entity in same org |

---

## Data Types & Enums

### Hold Status
```typescript
type HoldStatus = 'active' | 'released' | 'disposed'

// active    - Hold is currently preventing operations
// released  - Hold has been released with a disposition
// disposed  - Hold record archived (soft-delete)
```

### Hold Type
```typescript
type HoldType = 'qa_pending' | 'investigation' | 'recall' | 'quarantine'

// qa_pending   - Awaiting QA decision/review
// investigation - Under investigation
// recall       - Product recall situation
// quarantine   - Physical quarantine of material
```

### Hold Priority
```typescript
type HoldPriority = 'low' | 'medium' | 'high' | 'critical'

// Impacts aging alert thresholds:
// low      - Alert after 72 hours
// medium   - Alert after 48 hours
// high     - Alert after 24 hours
// critical - Alert after 12 hours
```

### Reference Type
```typescript
type ReferenceType = 'lp' | 'wo' | 'batch'

// lp    - License Plate (tracked material lot)
// wo    - Work Order
// batch - Production batch
```

### QA Status (for LP)
```typescript
type QAStatus = 'pending' | 'hold' | 'passed' | 'rejected' | 'scrap'

// pending   - Default, awaiting QA
// hold      - On quality hold
// passed    - QA passed
// rejected  - QA failed
// scrap     - Material scrapped
```

### Disposition Type (for release)
```typescript
type Disposition = 'release' | 'rework' | 'scrap' | 'return'

// release - Material released to operations
// rework  - Material sent for rework/retest
// scrap   - Material scrapped
// return  - Material returned to supplier
```

### Aging Status
```typescript
type AgingStatus = 'normal' | 'warning' | 'critical'

// Calculated from: (current_time - held_at) vs priority thresholds
// normal   - Within normal aging threshold
// warning  - Exceeded warning threshold
// critical - Exceeded critical threshold (requires action)
```

---

## Validation Rules

### Reason Field
- **Type**: String
- **Minimum Length**: 10 characters
- **Maximum Length**: 500 characters
- **Required**: Yes
- **Trim**: Yes (leading/trailing whitespace removed)
- **Pattern**: No special pattern required
- **Examples**:
  - ✅ "Failed metal detection test during production"
  - ❌ "Short" (too short)
  - ❌ "a".repeat(501) (too long)

### Hold Type Field
- **Type**: Enum string
- **Valid Values**: 'qa_pending', 'investigation', 'recall', 'quarantine'
- **Required**: Yes
- **Case-Sensitive**: Yes
- **Examples**:
  - ✅ "investigation"
  - ❌ "Investigation" (case mismatch)
  - ❌ "invalid_type"

### Priority Field
- **Type**: Enum string
- **Valid Values**: 'low', 'medium', 'high', 'critical'
- **Required**: No
- **Default**: 'medium'
- **Case-Sensitive**: Yes
- **Examples**:
  - ✅ "high"
  - ✅ (omitted → defaults to 'medium')
  - ❌ "urgent"

### Reference ID Field
- **Type**: String (UUID v4)
- **Format**: 550e8400-e29b-41d4-a716-446655440000
- **Required**: Yes per item
- **Validation**: Must exist and belong to user's organization
- **Examples**:
  - ✅ "550e8400-e29b-41d4-a716-446655440000"
  - ❌ "not-a-uuid"
  - ❌ "550e8400-e29b-41d4-a716-446655440099" (non-existent)

### Quantity Held Field
- **Type**: Number
- **Minimum**: > 0 (must be positive)
- **Required**: No
- **Examples**:
  - ✅ 100
  - ✅ 0.5
  - ❌ 0 (must be > 0)
  - ❌ -10 (negative)

### UOM (Unit of Measure) Field
- **Type**: String
- **Maximum Length**: 20 characters
- **Required**: No
- **Examples**:
  - ✅ "kg"
  - ✅ "pieces"
  - ✅ "liters"
  - ❌ "this_is_a_very_long_unit_of_measure_string" (> 20 chars)

### Notes Field
- **Type**: String
- **Maximum Length**: 500 characters
- **Required**: No
- **Examples**:
  - ✅ "Batch lot #123 affected by test failure"
  - ❌ "a".repeat(501) (> 500 chars)

---

## Authentication & Authorization

### Authentication Methods

- **Type**: Bearer Token (JWT)
- **Header**: `Authorization: Bearer <token>`
- **Expiration**: Configurable (typically 24-48 hours)
- **Refresh**: Via `/api/sessions` endpoint

### Role-Based Access Control (RBAC)

#### Quality Holds Permissions

| Role | GET List | GET Detail | POST Create | PATCH Release | DELETE |
|------|----------|-----------|------------|---------------|--------|
| VIEWER | ✅ | ✅ | ❌ | ❌ | ❌ |
| OPERATOR | ✅ | ✅ | ❌ | ❌ | ❌ |
| QA_INSPECTOR | ✅ | ✅ | ✅ | ✅ | ❌ |
| QA_MANAGER | ✅ | ✅ | ✅ | ✅ | ✅ |
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |

### Row-Level Security (RLS)

- **Enforcement**: All endpoints enforce organization-based RLS
- **Behavior**: Users can only access holds belonging to their organization
- **Cross-Org Access**: Returns 404 (not found) to prevent org detection
- **References**: Referenced items (LPs, WOs) must belong to same org as user

### Special Rules

- **Hold Creator Release**: QA_INSPECTOR can release only holds they created (unless QA_MANAGER+)
- **Permission Elevation**: Requires admin to grant VIEWER → QA_INSPECTOR role
- **Audit Trail**: All operations recorded with user ID and timestamp

---

## Performance & Constraints

### API Limits

| Aspect | Limit | Notes |
|--------|-------|-------|
| Max items per hold | 100 | Configurable server-side |
| Max holds per list response | 100 | Limited by `limit` parameter |
| Max search length | 500 chars | Free-text search |
| Max reason length | 500 chars | Full-text stored |
| Request timeout | 30 seconds | Per individual request |
| Pagination max offset | 1,000,000 | Practical limit |

### Performance Targets

| Operation | Target | Acceptable Range |
|-----------|--------|-----------------|
| POST create hold | 1 second | < 1 second with < 10 items |
| GET list holds | 1 second | < 1 second for 100+ holds |
| GET hold detail | 500ms | < 500ms with 10+ items |
| PATCH release | 1 second | < 1 second |

### Database Indexes

- `quality_holds(org_id, status, held_at DESC)` - List queries
- `quality_holds(hold_number)` - Number lookup
- `quality_hold_items(hold_id, reference_type, reference_id)` - Item lookup
- `license_plates(org_id, qa_status)` - LP status updates

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-02-09 | Initial comprehensive schema documentation |

---

**Document maintained by**: Quality Engineering Team  
**Last reviewed**: 2025-02-09  
**Next review**: 2025-03-09
