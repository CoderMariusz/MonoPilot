# Routing Operations API - Story 02.8

**Module**: Technical
**Feature**: Routing Operations Management
**Story**: 02.8
**API Version**: v1
**Last Updated**: 2025-12-28

---

## Overview

Routing operations are sequential production steps within a routing workflow. Each operation defines:
- Sequence order (1, 2, 3, etc.)
- Machine/equipment needed
- Duration and time allocations (setup, operation, cleanup)
- Expected yield and labor cost
- Detailed instructions and attachments

**Key Feature**: Parallel operations allow multiple operations at the same sequence number to run simultaneously, with duration calculated as MAX per sequence group and cost as SUM of all operations.

---

## Endpoints

### 1. GET /api/v1/technical/routings/{id}/operations

Get all operations for a routing with summary statistics.

**Authentication**: Required
**Roles**: All authenticated users (RLS filtered to org)
**Parameters**:
- `id` (path): Routing ID (UUID)

**Response**: 200 OK
```json
{
  "success": true,
  "data": {
    "operations": [
      {
        "id": "op-uuid-1",
        "routing_id": "routing-uuid",
        "sequence": 1,
        "name": "Mixing",
        "machine": {
          "id": "machine-uuid",
          "code": "MIXER-01",
          "name": "Industrial Mixer"
        },
        "line": {
          "id": "line-uuid",
          "code": "LINE-A",
          "name": "Production Line A"
        },
        "setup_time": 5,
        "duration": 15,
        "cleanup_time": 2,
        "labor_cost_per_hour": 12.00,
        "expected_yield_percent": 98.0,
        "instructions": "Mix at medium speed for 15 minutes",
        "attachment_count": 2,
        "created_at": "2025-12-28T10:30:00Z",
        "updated_at": "2025-12-28T10:30:00Z"
      }
    ],
    "summary": {
      "total_operations": 4,
      "total_duration": 90,
      "total_setup_time": 10,
      "total_cleanup_time": 5,
      "total_labor_cost": 40.00,
      "average_yield": 98.25
    }
  }
}
```

**Error Responses**:
- 404 Not Found: Routing does not exist
- 403 Forbidden: No access to this routing
- 500 Internal Server Error: Server error

---

### 2. POST /api/v1/technical/routings/{id}/operations

Create a new operation in a routing.

**Authentication**: Required
**Roles**: owner, admin, production_manager
**Permissions**: technical:C (create)
**Parameters**:
- `id` (path): Routing ID (UUID)

**Request Body**:
```json
{
  "sequence": 5,
  "name": "Cooling",
  "machine_id": "machine-uuid-or-null",
  "line_id": "line-uuid-or-null",
  "setup_time": 0,
  "duration": 20,
  "cleanup_time": 3,
  "labor_cost_per_hour": 10.00,
  "expected_yield_percent": 99.5,
  "instructions": "Cool to 25°C before next step"
}
```

**Validation**:
- `sequence`: 1-999, required
- `name`: 3-100 characters, required
- `machine_id`: UUID or null, optional
- `line_id`: UUID or null, optional
- `setup_time`: 0+ minutes, default 0
- `duration`: 1+ minutes, required
- `cleanup_time`: 0+ minutes, default 0
- `labor_cost_per_hour`: 0+ decimal, default 0
- `expected_yield_percent`: 0-100 decimal, default 100
- `instructions`: 0-2000 characters, optional

**Response**: 201 Created
```json
{
  "success": true,
  "data": {
    "id": "op-uuid-new",
    "routing_id": "routing-uuid",
    "sequence": 5,
    "name": "Cooling",
    "machine": null,
    "line": null,
    "setup_time": 0,
    "duration": 20,
    "cleanup_time": 3,
    "labor_cost_per_hour": 10.00,
    "expected_yield_percent": 99.5,
    "instructions": "Cool to 25°C before next step",
    "attachment_count": 0,
    "created_at": "2025-12-28T11:00:00Z",
    "updated_at": "2025-12-28T11:00:00Z"
  }
}
```

**Error Responses**:
- 400 Bad Request: Validation failed
- 404 Not Found: Routing does not exist
- 403 Forbidden: No permission or routing inactive
- 500 Internal Server Error

**Parallel Operations Note**: If sequence already exists in routing, operation will run in parallel. No validation error—this is intentional per FR-2.48.

---

### 3. PUT /api/v1/technical/routings/{id}/operations/{opId}

Update an existing operation.

**Authentication**: Required
**Roles**: owner, admin, production_manager, quality_manager
**Permissions**: technical:U (update)
**Parameters**:
- `id` (path): Routing ID (UUID)
- `opId` (path): Operation ID (UUID)

**Request Body**: Same as POST (partial updates allowed)

**Response**: 200 OK
```json
{
  "success": true,
  "data": {
    "id": "op-uuid",
    "routing_id": "routing-uuid",
    "sequence": 2,
    "name": "Proofing (updated)",
    "machine": { ... },
    "line": { ... },
    "setup_time": 5,
    "duration": 45,
    "cleanup_time": 3,
    "labor_cost_per_hour": 8.50,
    "expected_yield_percent": 99.0,
    "instructions": "Proof at 28°C for 45 minutes",
    "attachment_count": 1,
    "created_at": "2025-12-28T10:30:00Z",
    "updated_at": "2025-12-28T11:15:00Z"
  }
}
```

**Error Responses**:
- 400 Bad Request: Validation failed
- 404 Not Found: Operation or routing not found
- 403 Forbidden: No permission
- 500 Internal Server Error

---

### 4. DELETE /api/v1/technical/routings/{id}/operations/{opId}

Delete an operation and all its attachments.

**Authentication**: Required
**Roles**: owner, admin
**Permissions**: technical:D (delete)
**Parameters**:
- `id` (path): Routing ID (UUID)
- `opId` (path): Operation ID (UUID)

**Response**: 200 OK
```json
{
  "success": true,
  "message": "Operation deleted successfully"
}
```

**Error Responses**:
- 404 Not Found: Operation or routing not found
- 403 Forbidden: No permission
- 500 Internal Server Error

**Side Effects**:
- All attachments for this operation are deleted
- Remaining operations maintain their sequences (no reordering)

---

### 5. PATCH /api/v1/technical/routings/{id}/operations/{opId}/reorder

Move an operation up or down in the sequence (swaps with adjacent sequence).

**Authentication**: Required
**Roles**: owner, admin, production_manager
**Permissions**: technical:U (update)
**Parameters**:
- `id` (path): Routing ID (UUID)
- `opId` (path): Operation ID (UUID)

**Request Body**:
```json
{
  "direction": "up"
}
```

**Direction Values**:
- `"up"`: Swap this operation's sequence with the next lower sequence number
- `"down"`: Swap this operation's sequence with the next higher sequence number

**Response**: 200 OK
```json
{
  "success": true,
  "data": {
    "updated_operations": [
      {
        "id": "op-uuid-1",
        "sequence": 2
      },
      {
        "id": "op-uuid-2",
        "sequence": 1
      }
    ]
  }
}
```

**Error Responses**:
- 400 Bad Request: Invalid direction or already at boundary
- 404 Not Found: Operation or routing not found
- 403 Forbidden: No permission
- 500 Internal Server Error

**Parallel Operations Behavior**:
- When moving an operation in a parallel group, only that one operation moves
- Other parallel operations in the same sequence stay unchanged
- Example: Sequence 2 has [Mixing, Heating]. Moving "Mixing" down swaps its sequence with next distinct sequence only

---

### 6. POST /api/v1/technical/routings/{id}/operations/{opId}/attachments

Upload an attachment to an operation.

**Authentication**: Required
**Roles**: owner, admin, production_manager
**Permissions**: technical:U (update)
**Parameters**:
- `id` (path): Routing ID (UUID)
- `opId` (path): Operation ID (UUID)

**Request Body**: FormData (multipart/form-data)
```
file: File (required)
  - Allowed MIME types: application/pdf, image/png, image/jpeg, application/vnd.openxmlformats-officedocument.wordprocessingml.document
  - Max size: 10MB
  - Max 5 attachments per operation
```

**Response**: 201 Created
```json
{
  "success": true,
  "data": {
    "id": "attachment-uuid",
    "operation_id": "op-uuid",
    "filename": "mixing-instructions.pdf",
    "mime_type": "application/pdf",
    "file_size": 1024000,
    "url": "https://storage.example.com/attachments/...",
    "created_at": "2025-12-28T11:30:00Z"
  }
}
```

**Error Responses**:
- 400 Bad Request: Invalid file type, size exceeded, or max attachments reached
- 404 Not Found: Operation or routing not found
- 403 Forbidden: No permission
- 413 Payload Too Large: File exceeds 10MB
- 500 Internal Server Error

**Validation**:
- Max 5 attachments per operation
- Max 10MB per file
- Allowed types: PDF, PNG, JPG, DOCX
- Filename sanitization applied

---

### 7. DELETE /api/v1/technical/routings/{id}/operations/{opId}/attachments/{attachId}

Delete an attachment from an operation.

**Authentication**: Required
**Roles**: owner, admin, production_manager
**Permissions**: technical:D (delete) OR technical:U (update)
**Parameters**:
- `id` (path): Routing ID (UUID)
- `opId` (path): Operation ID (UUID)
- `attachId` (path): Attachment ID (UUID)

**Response**: 200 OK
```json
{
  "success": true,
  "message": "Attachment deleted successfully"
}
```

**Error Responses**:
- 404 Not Found: Attachment, operation, or routing not found
- 403 Forbidden: No permission
- 500 Internal Server Error

---

## Parallel Operations (FR-2.48)

### Overview

Parallel operations allow multiple production steps to run simultaneously at the same sequence number. This is critical for optimizing production workflows where multiple processes can happen concurrently.

### Example

```
Sequential workflow:
Seq 1: Mixing (15 min)
Seq 2: Proofing (45 min)
Seq 3: Baking (30 min)
Total time: 90 minutes

Parallel workflow (same routing, optimized):
Seq 1: Mixing (15 min)
Seq 2: Proofing (45 min)
Seq 2: Heating (40 min)  <- Same sequence, runs in parallel with Proofing
Seq 3: Baking (30 min)
Total time: 15 + MAX(45, 40) + 30 = 85 minutes (5 min saved!)
```

### Duration Calculation

For operations grouped by sequence:
- **Sequential (different sequences)**: Sum all operations
- **Parallel (same sequence)**: Use MAX duration of the group, then sum across groups

```
Formula:
total_duration = SUM of (MAX duration per sequence group)
                + setup_time and cleanup_time included in duration
```

Example calculation:
```
Seq 1: [15 + 5 + 2] = 22 min (only operation)
Seq 2: [45 + 0 + 0] vs [40 + 2 + 0] = MAX(45, 42) = 45 min (parallel group)
Seq 3: [30 + 10 + 3] = 43 min (only operation)
Total: 22 + 45 + 43 = 110 minutes
```

### Cost Calculation

Labor cost is **summed for all operations**, including parallel operations, because both incur labor costs despite running concurrently:

```
Formula:
total_labor_cost = SUM of (operation_duration / 60 * labor_cost_per_hour) for all operations

Example:
Op 1 (Seq 2): 45 min * 8.00/hr = 6.00
Op 2 (Seq 2, parallel): 40 min * 10.00/hr = 6.67
Total for Seq 2: 6.00 + 6.67 = 12.67 (NOT MAX, because both workers are paid)
```

### API Behavior

When creating an operation with a sequence number that already exists:
1. Operation is created successfully (no error)
2. Client receives `info` message in response: "Sequence X already used. This operation will run in parallel."
3. Validation is **not blocking**—parallel operations are feature, not error

---

## Authorization & RLS

All operations are protected by Row Level Security (RLS) policies:

1. **SELECT**: User can read operations if they can access the routing (via org_id lookup)
2. **INSERT/UPDATE**: Only owner, admin, production_manager, quality_manager roles
3. **DELETE**: Only owner, admin roles

Org isolation is enforced at database level through `routing_id` → `routings.org_id` lookup.

---

## Error Codes

| Code | HTTP | Meaning | Recovery |
|------|------|---------|----------|
| VALIDATION_ERROR | 400 | Invalid input data | Check required fields and types |
| ROUTING_NOT_FOUND | 404 | Routing doesn't exist | Verify routing ID |
| OPERATION_NOT_FOUND | 404 | Operation doesn't exist | Verify operation ID |
| PERMISSION_DENIED | 403 | Insufficient role/permission | Check user role and permissions |
| ATTACHMENT_LIMIT_EXCEEDED | 400 | More than 5 attachments | Delete old attachments first |
| FILE_TOO_LARGE | 413 | File exceeds 10MB | Use smaller file |
| INVALID_FILE_TYPE | 400 | File type not allowed | Use PDF, PNG, JPG, or DOCX |
| INVALID_DIRECTION | 400 | Reorder direction invalid | Use "up" or "down" |
| ALREADY_AT_BOUNDARY | 400 | Cannot move further | Operation is first/last |

---

## Rate Limits

- 100 requests per minute per user per endpoint
- 10 file uploads per minute per user
- 100MB total attachment storage per operation

---

## Changelog

### v1 (2025-12-28)
- Initial release with 7 endpoints
- Parallel operations support (FR-2.48)
- Attachment management (5 max, 10MB each)
- Comprehensive error handling
- RLS security enforcement

---

## Related Documentation

- [Routing Operations User Guide](../../4-USER-GUIDES/routing-operations.md)
- [Parallel Operations Developer Guide](../../5-DEVELOPER-GUIDES/parallel-operations.md)
- [Routing Components](../components/routing-operations.md)
- [ADR-013: RLS Org Isolation Pattern](../../architecture/decisions/ADR-013.md)
- [Story 02.8 Context](../../2-MANAGEMENT/epics/current/02-technical/context/02.8.context.yaml)

---

## Testing the API

### Quick Test with curl

```bash
# List operations for routing
curl -H "Authorization: Bearer $TOKEN" \
  https://api.example.com/api/v1/technical/routings/routing-uuid/operations

# Create operation
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sequence": 2,
    "name": "Proofing",
    "duration": 45,
    "labor_cost_per_hour": 8.0
  }' \
  https://api.example.com/api/v1/technical/routings/routing-uuid/operations

# Reorder operation
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"direction": "up"}' \
  https://api.example.com/api/v1/technical/routings/routing-uuid/operations/op-uuid/reorder

# Upload attachment
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@instructions.pdf" \
  https://api.example.com/api/v1/technical/routings/routing-uuid/operations/op-uuid/attachments

# Delete operation
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  https://api.example.com/api/v1/technical/routings/routing-uuid/operations/op-uuid
```

---

**Last Updated**: 2025-12-28
**Author**: TECH-WRITER
**Status**: Complete & Tested
