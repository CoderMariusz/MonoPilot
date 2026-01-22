# Quality Status API Reference

## Overview

The Quality Status API provides 5 core endpoints for managing quality status lifecycle across License Plates (LPs), Batches, and Inspections. All endpoints require authentication and support multi-tenant isolation via RLS.

**Base Path**: `/api/quality/status`

---

## Endpoint 1: Get Status Types

Get all 7 available quality status types with configuration (colors, icons, permissions).

### Endpoint

```
GET /api/quality/status/types
```

### Authentication

Required: Yes (Bearer token)

### Query Parameters

None

### Request Example

```bash
curl -X GET "https://app.monopilot.com/api/quality/status/types" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response: 200 OK

```json
{
  "types": [
    {
      "code": "PENDING",
      "name": "Pending",
      "description": "Awaiting inspection",
      "color": "gray",
      "icon": "Clock",
      "allows_shipment": false,
      "allows_consumption": false
    },
    {
      "code": "PASSED",
      "name": "Passed",
      "description": "Meets specifications",
      "color": "green",
      "icon": "CheckCircle",
      "allows_shipment": true,
      "allows_consumption": true
    },
    {
      "code": "FAILED",
      "name": "Failed",
      "description": "Does not meet specs",
      "color": "red",
      "icon": "XCircle",
      "allows_shipment": false,
      "allows_consumption": false
    },
    {
      "code": "HOLD",
      "name": "Hold",
      "description": "Investigation required",
      "color": "orange",
      "icon": "Pause",
      "allows_shipment": false,
      "allows_consumption": false
    },
    {
      "code": "RELEASED",
      "name": "Released",
      "description": "Approved for use after hold",
      "color": "blue",
      "icon": "Unlock",
      "allows_shipment": true,
      "allows_consumption": true
    },
    {
      "code": "QUARANTINED",
      "name": "Quarantined",
      "description": "Isolated pending review",
      "color": "darkRed",
      "icon": "AlertTriangle",
      "allows_shipment": false,
      "allows_consumption": false
    },
    {
      "code": "COND_APPROVED",
      "name": "Conditionally Approved",
      "description": "Limited use allowed",
      "color": "yellow",
      "icon": "AlertCircle",
      "allows_shipment": false,
      "allows_consumption": true
    }
  ]
}
```

### Response: 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### Performance

- Response time: <200ms
- Returns static configuration (cached)
- No database queries

---

## Endpoint 2: Get Valid Transitions

Get all valid status transitions from current status based on business rules.

### Endpoint

```
GET /api/quality/status/transitions?current={status}
```

### Authentication

Required: Yes (Bearer token)

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `current` | string | Yes | Current status (PENDING, PASSED, FAILED, HOLD, RELEASED, QUARANTINED, COND_APPROVED) |

### Request Example

```bash
curl -X GET "https://app.monopilot.com/api/quality/status/transitions?current=PENDING" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response: 200 OK

```json
{
  "current_status": "PENDING",
  "valid_transitions": [
    {
      "id": "trans-001",
      "from_status": "PENDING",
      "to_status": "PASSED",
      "requires_inspection": true,
      "requires_approval": false,
      "requires_reason": true,
      "is_allowed": true,
      "description": "Mark as passed after successful inspection"
    },
    {
      "id": "trans-002",
      "from_status": "PENDING",
      "to_status": "FAILED",
      "requires_inspection": true,
      "requires_approval": true,
      "requires_reason": true,
      "is_allowed": true,
      "description": "Mark as failed - requires QA approval"
    },
    {
      "id": "trans-003",
      "from_status": "PENDING",
      "to_status": "HOLD",
      "requires_inspection": false,
      "requires_approval": false,
      "requires_reason": true,
      "is_allowed": true,
      "description": "Place on hold for investigation"
    }
  ]
}
```

### Response: 400 Bad Request

```json
{
  "error": "current parameter is required"
}
```

Or:

```json
{
  "error": "Invalid status value"
}
```

### Response: 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### Performance

- Response time: <100ms
- Database query with index on from_status + is_allowed
- Cached transition rules (updated rarely)

---

## Endpoint 3: Validate Transition

Validate if a status transition is allowed, including business rule checks.

### Endpoint

```
POST /api/quality/status/validate-transition
```

### Authentication

Required: Yes (Bearer token)

### Request Body

```json
{
  "entity_type": "lp",
  "entity_id": "550e8400-e29b-41d4-a716-446655440000",
  "from_status": "PENDING",
  "to_status": "PASSED",
  "reason": "Inspection completed successfully, all parameters within spec"
}
```

### Request Fields

| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| `entity_type` | string | Yes | Entity type | One of: `lp`, `batch`, `inspection` |
| `entity_id` | string (UUID) | Yes | Entity ID | Valid UUID v4 format |
| `from_status` | string | Yes | Current status | One of 7 quality statuses |
| `to_status` | string | Yes | Target status | One of 7 quality statuses, must differ from `from_status` |
| `reason` | string | No | Reason for change | 10-500 characters if provided |

### Request Example

```bash
curl -X POST "https://app.monopilot.com/api/quality/status/validate-transition" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entity_type": "lp",
    "entity_id": "550e8400-e29b-41d4-a716-446655440000",
    "from_status": "PENDING",
    "to_status": "PASSED",
    "reason": "All tests passed successfully"
  }'
```

### Response: 200 OK (Valid)

```json
{
  "is_valid": true,
  "required_actions": {
    "inspection_required": true,
    "approval_required": false,
    "reason_required": true
  }
}
```

### Response: 200 OK (Invalid)

```json
{
  "is_valid": false,
  "errors": [
    "Invalid status transition: PENDING -> UNKNOWN",
    "Reason is required for this status transition"
  ],
  "required_actions": {
    "reason_required": true,
    "approval_required": false
  }
}
```

### Response: 400 Bad Request

```json
{
  "error": "Invalid request data",
  "details": [
    {
      "code": "invalid_enum_value",
      "expected": "PENDING | PASSED | FAILED | HOLD | RELEASED | QUARANTINED | COND_APPROVED",
      "received": "INVALID_STATUS",
      "path": ["to_status"],
      "message": "Invalid enum value"
    }
  ]
}
```

### Response: 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### Validation Rules

- `from_status` and `to_status` cannot be the same
- `reason` must be 10-500 characters if provided
- `entity_id` must be valid UUID
- Transition must exist in `quality_status_transitions` table
- Transition must have `is_allowed = true`

### Performance

- Response time: <150ms
- Up to 4 database queries (transition check, inspection check, approval check, user role)
- Heavy operations (inspection/approval) only on demand

---

## Endpoint 4: Change Status

Change entity status and create audit trail entry.

### Endpoint

```
POST /api/quality/status/change
```

### Authentication

Required: Yes (Bearer token)

### Request Body

```json
{
  "entity_type": "lp",
  "entity_id": "550e8400-e29b-41d4-a716-446655440000",
  "to_status": "PASSED",
  "reason": "Inspection completed successfully, all parameters within specification",
  "inspection_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

### Request Fields

| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| `entity_type` | string | Yes | Entity type | One of: `lp`, `batch`, `inspection` |
| `entity_id` | string (UUID) | Yes | Entity ID | Valid UUID v4 format |
| `to_status` | string | Yes | New status | One of 7 quality statuses |
| `reason` | string | Yes | Reason for change | 10-500 characters (required) |
| `inspection_id` | string (UUID) | No | Associated inspection | Valid UUID v4 format if provided |

### Request Example

```bash
curl -X POST "https://app.monopilot.com/api/quality/status/change" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entity_type": "lp",
    "entity_id": "550e8400-e29b-41d4-a716-446655440000",
    "to_status": "PASSED",
    "reason": "Batch inspection completed - all parameters within spec"
  }'
```

### Response: 200 OK

```json
{
  "success": true,
  "new_status": "PASSED",
  "history_id": "hist-001",
  "warnings": []
}
```

### Response: 200 OK (With Warnings)

```json
{
  "success": true,
  "new_status": "COND_APPROVED",
  "history_id": "hist-002",
  "warnings": [
    "Shipment not allowed for this status"
  ]
}
```

### Response: 400 Bad Request

```json
{
  "error": "Invalid request data",
  "details": [
    {
      "code": "too_small",
      "minimum": 10,
      "type": "string",
      "path": ["reason"],
      "message": "Reason must be at least 10 characters"
    }
  ]
}
```

Or:

```json
{
  "error": "Invalid status transition: PENDING -> INVALID_STATUS"
}
```

### Response: 403 Forbidden

```json
{
  "error": "Forbidden: QA Manager approval required for this transition"
}
```

Or:

```json
{
  "error": "Forbidden: Viewers cannot change quality status"
}
```

### Response: 404 Not Found

```json
{
  "error": "Entity not found"
}
```

### Response: 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### Side Effects

- Updates entity status in appropriate table (license_plates.qa_status, etc.)
- Creates audit trail entry in quality_status_history
- Records user_id, timestamp, from/to status, and reason
- Returns history_id for reference

### Permission Rules

- Viewers cannot perform status changes (403)
- QA Manager/Director/Admin required for certain transitions (approval_required)
- All authenticated users can perform transitions within their role permissions

### Performance

- Response time: <300ms
- 2 database writes (entity update + history insert)
- Transaction wrapped for consistency

---

## Endpoint 5: Get Status History

Retrieve status change history for an entity.

### Endpoint

```
GET /api/quality/status/history/:entityType/:entityId
```

### Authentication

Required: Yes (Bearer token)

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `entityType` | string | Yes | Entity type: `lp`, `batch`, or `inspection` |
| `entityId` | string (UUID) | Yes | Entity ID (UUID format) |

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 100 | Number of entries to return (must be positive) |
| `offset` | integer | 0 | Number of entries to skip (must be non-negative) |

### Request Example

```bash
# Get all history
curl -X GET "https://app.monopilot.com/api/quality/status/history/lp/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

```bash
# Get first 10 entries
curl -X GET "https://app.monopilot.com/api/quality/status/history/lp/550e8400-e29b-41d4-a716-446655440000?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response: 200 OK

```json
{
  "entity_type": "lp",
  "entity_id": "550e8400-e29b-41d4-a716-446655440000",
  "history": [
    {
      "id": "hist-001",
      "from_status": null,
      "to_status": "PENDING",
      "reason": "Initial status on creation",
      "changed_by": "550e8400-e29b-41d4-a716-446655440100",
      "changed_by_name": "John Smith",
      "changed_at": "2025-01-20T14:30:00Z"
    },
    {
      "id": "hist-002",
      "from_status": "PENDING",
      "to_status": "PASSED",
      "reason": "Batch inspection completed successfully",
      "changed_by": "550e8400-e29b-41d4-a716-446655440101",
      "changed_by_name": "Sarah Johnson",
      "changed_at": "2025-01-20T15:45:00Z"
    },
    {
      "id": "hist-003",
      "from_status": "PASSED",
      "to_status": "RELEASED",
      "reason": "Released for shipment after hold investigation",
      "changed_by": "550e8400-e29b-41d4-a716-446655440100",
      "changed_by_name": "John Smith",
      "changed_at": "2025-01-20T16:20:00Z"
    }
  ]
}
```

### Response: 400 Bad Request

```json
{
  "error": "Invalid entity ID - must be a valid UUID"
}
```

Or:

```json
{
  "error": "Invalid entity type. Must be one of: lp, batch, inspection"
}
```

### Response: 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### History Entry Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | History entry UUID |
| `from_status` | string \| null | Previous status (null if creation) |
| `to_status` | string | New status |
| `reason` | string \| null | Reason for change |
| `changed_by` | string | User ID who made the change |
| `changed_by_name` | string | User's full name |
| `changed_at` | string (ISO 8601) | Timestamp of change |

### Sorting

Results are sorted by `changed_at` DESC (newest first)

### Performance

- Response time: <200ms
- Uses indexed queries on (entity_type, entity_id, changed_at)
- Includes user join for display name

---

## Common Response Headers

All responses include:

```
Content-Type: application/json
Cache-Control: no-cache, no-store, must-revalidate
X-Request-ID: [UUID]
```

---

## Error Handling

### Status Codes

| Code | Meaning | When It Occurs |
|------|---------|----------------|
| 200 | Success | Operation completed successfully |
| 400 | Bad Request | Invalid input, validation failed |
| 401 | Unauthorized | Missing/invalid authentication token |
| 403 | Forbidden | User lacks permission (role-based) |
| 404 | Not Found | Entity doesn't exist |
| 500 | Internal Server Error | Unexpected server error |

### Error Response Format

```json
{
  "error": "Human-readable error message",
  "details": []
}
```

Or with validation details:

```json
{
  "error": "Invalid request data",
  "details": [
    {
      "code": "too_small",
      "minimum": 10,
      "type": "string",
      "path": ["reason"],
      "message": "Reason must be at least 10 characters"
    }
  ]
}
```

---

## Authentication

All endpoints require Bearer token authentication:

```
Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN
```

Tokens obtained from Supabase Auth.

---

## Rate Limiting

Not implemented in Phase 1A. Available in Phase 1B+.

---

## Pagination

Implemented only for `/api/quality/status/history/:entityType/:entityId`.

Use `limit` and `offset` parameters:

```
GET /api/quality/status/history/lp/{id}?limit=20&offset=40
```

---

## Testing the API

### Using cURL

```bash
# 1. Get token (from Supabase Auth)
export TOKEN="your_jwt_token"

# 2. Get all status types
curl -X GET "http://localhost:3000/api/quality/status/types" \
  -H "Authorization: Bearer $TOKEN"

# 3. Get transitions from PENDING
curl -X GET "http://localhost:3000/api/quality/status/transitions?current=PENDING" \
  -H "Authorization: Bearer $TOKEN"

# 4. Validate transition
curl -X POST "http://localhost:3000/api/quality/status/validate-transition" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entity_type": "lp",
    "entity_id": "550e8400-e29b-41d4-a716-446655440000",
    "from_status": "PENDING",
    "to_status": "PASSED",
    "reason": "Test validation"
  }'

# 5. Change status
curl -X POST "http://localhost:3000/api/quality/status/change" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entity_type": "lp",
    "entity_id": "550e8400-e29b-41d4-a716-446655440000",
    "to_status": "PASSED",
    "reason": "Test status change completed successfully"
  }'

# 6. Get history
curl -X GET "http://localhost:3000/api/quality/status/history/lp/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer $TOKEN"
```

### Using TypeScript/JavaScript

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)

// Get token
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token

// Get status types
const response = await fetch('/api/quality/status/types', {
  headers: { Authorization: `Bearer ${token}` }
})

const { types } = await response.json()
console.log(types)
```

---

## Relationship to Database

All endpoints interact with:

- **quality_status_transitions** - Rules for valid transitions
- **license_plates** / **batches** / **inspections** - Entity status fields
- **quality_status_history** - Audit trail

See `.claude/TABLES.md` for full schema.
