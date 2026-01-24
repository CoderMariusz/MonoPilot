# Scanner QA API Reference

Mobile-optimized scanner endpoints for QA inspections. Enables inspectors to perform pass/fail quality checks on the warehouse floor by scanning LP barcodes.

## Base URL

```
/api/v1/quality/scanner
```

## Authentication

All endpoints require authentication via `Authorization: Bearer {token}` header. User must have one of these roles:
- `qa_inspector`
- `qa_manager`
- `admin`
- `owner`

Users without these roles receive HTTP 403 with message: `"Scanner access requires QA Inspector role"`.

---

## Data Models

### QuickInspectionInput

Request body for quick pass/fail inspection.

```typescript
{
  inspection_id: string       // UUID - Required
  result: 'pass' | 'fail'     // Required
  result_notes?: string       // Optional, max 2000 chars
  defects_found?: number      // Optional, 0-1000
  inspection_method: 'scanner' // Required, must be 'scanner'
  scanner_device_id?: string  // Optional, max 100 chars
  scanner_location?: string   // Optional, GPS coordinates
}
```

### QuickInspectionResponse

Response after completing quick inspection.

```typescript
{
  inspection: {
    id: string
    lp_id: string
    status: 'completed'
    result: 'pass' | 'fail'
    inspection_method: 'scanner'
    completed_at: ISO8601 timestamp
    result_notes?: string
    defects_found?: number
  }
  lp_status_updated: boolean
  lp_new_status: 'passed' | 'failed'
}
```

### OfflineAction

Structure for offline queue items.

```typescript
{
  id: string                  // UUID - local action ID
  type: 'quick_inspection' | 'test_result'
  payload: QuickInspectionInput | object
  timestamp: string           // ISO 8601 datetime
}
```

### SyncOfflineResponse

Response from bulk sync operation.

```typescript
{
  success: number             // Count of successfully synced actions
  failed: number              // Count of failed actions
  errors: Array<{
    action_id: string         // ID of failed action
    error: string             // Error message
  }>
}
```

---

## Endpoints

### Quick Inspection

Complete a quality inspection with pass or fail result from scanner device.

```
POST /api/v1/quality/scanner/quick-inspection
```

**Request Body:**

```json
{
  "inspection_id": "550e8400-e29b-41d4-a716-446655440001",
  "result": "pass",
  "inspection_method": "scanner",
  "scanner_device_id": "ZEBRA-TC52-001"
}
```

**Success Response (200):**

```json
{
  "inspection": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "lp_id": "550e8400-e29b-41d4-a716-446655440010",
    "status": "completed",
    "result": "pass",
    "inspection_method": "scanner",
    "completed_at": "2025-01-23T14:30:00.000Z",
    "scanner_device_id": "ZEBRA-TC52-001"
  },
  "lp_status_updated": true,
  "lp_new_status": "passed"
}
```

**Fail Result Example:**

```json
{
  "inspection_id": "550e8400-e29b-41d4-a716-446655440002",
  "result": "fail",
  "result_notes": "Damaged packaging, product exposed",
  "defects_found": 3,
  "inspection_method": "scanner",
  "scanner_device_id": "ZEBRA-TC52-001"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `Validation failed` | Invalid input data with field-level details |
| 400 | `Inspection already completed` | Inspection was previously completed |
| 401 | `Unauthorized` | Missing or invalid auth token |
| 403 | `Scanner access requires QA Inspector role` | User lacks required role |
| 404 | `Inspection not found` | Inspection ID does not exist or belongs to different org |
| 500 | `Failed to update inspection` | Database update failed |

**Validation Error Response (400):**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "inspection_id",
      "message": "Invalid inspection ID"
    },
    {
      "field": "result",
      "message": "Expected 'pass' | 'fail', received 'maybe'"
    }
  ]
}
```

---

### Sync Offline Actions

Bulk sync offline-queued actions when device reconnects.

```
POST /api/v1/quality/scanner/sync-offline
```

**Request Body:**

```json
{
  "actions": [
    {
      "id": "local-uuid-001",
      "type": "quick_inspection",
      "payload": {
        "inspection_id": "550e8400-e29b-41d4-a716-446655440001",
        "result": "pass",
        "inspection_method": "scanner"
      },
      "timestamp": "2025-01-23T10:30:00Z"
    },
    {
      "id": "local-uuid-002",
      "type": "quick_inspection",
      "payload": {
        "inspection_id": "550e8400-e29b-41d4-a716-446655440002",
        "result": "fail",
        "result_notes": "Contamination detected",
        "defects_found": 1,
        "inspection_method": "scanner"
      },
      "timestamp": "2025-01-23T10:35:00Z"
    }
  ]
}
```

**Success Response (200):**

```json
{
  "success": 2,
  "failed": 0,
  "errors": []
}
```

**Partial Failure Response (200):**

```json
{
  "success": 1,
  "failed": 1,
  "errors": [
    {
      "action_id": "local-uuid-002",
      "error": "Inspection already completed"
    }
  ]
}
```

**Constraints:**

| Constraint | Value | Description |
|------------|-------|-------------|
| Max actions per request | 100 | Exceeding returns 400 validation error |
| Processing order | Chronological | Actions sorted by timestamp, oldest first |
| Duplicate handling | Rejected | Already-completed inspections return error |

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `Validation failed` | Invalid action structure or count exceeds 100 |
| 401 | `Unauthorized` | Missing or invalid auth token |
| 403 | `Scanner access requires QA Inspector role` | User lacks required role |
| 500 | `Internal server error` | Unexpected server failure |

---

## Audit Trail

All scanner actions log entries to `quality_audit_log` table.

**Audit Entry Structure:**

```json
{
  "entity_type": "inspection",
  "entity_id": "550e8400-e29b-41d4-a716-446655440001",
  "action": "scanner_complete",
  "user_id": "user-uuid",
  "old_value": {
    "status": "in_progress",
    "result": null
  },
  "new_value": {
    "status": "completed",
    "result": "pass"
  },
  "change_reason": "Scanner quick pass",
  "metadata": {
    "inspection_method": "scanner",
    "device_id": "ZEBRA-TC52-001",
    "offline_queued": false,
    "sync_delay_seconds": 0
  }
}
```

**Offline Sync Metadata:**

When actions are synced from offline queue, metadata includes:
- `offline_queued: true`
- `sync_delay_seconds: N` - Time between local timestamp and server sync

---

## Database Tables

### scanner_offline_queue

Stores synced offline actions for audit and debugging.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| org_id | UUID | Organization owner |
| user_id | UUID | User who performed action |
| action_type | TEXT | `quick_inspection`, `test_result`, `qa_status_update` |
| action_payload | JSONB | Complete action data |
| device_id | TEXT | Scanner device identifier |
| created_at_local | TIMESTAMPTZ | Local device timestamp |
| synced_at | TIMESTAMPTZ | Server sync timestamp |
| sync_status | TEXT | `synced`, `failed`, `duplicate` |
| error_message | TEXT | Error details if failed |

**RLS Policy:** Enforces org_id isolation - users can only access their organization's queue entries.

---

## Performance Requirements

| Operation | Target | Description |
|-----------|--------|-------------|
| Quick inspection (online) | < 1 second | Full round-trip including LP status update |
| Offline queue | < 100ms | Local IndexedDB write |
| Bulk sync (50 actions) | < 10 seconds | Sequential processing with audit logging |
| LP lookup | < 500ms | Barcode to inspection retrieval |

---

## Integration with Other APIs

### LP Lookup

Use existing LP lookup endpoint before calling quick inspection:

```
GET /api/warehouse/license-plates/barcode/{barcode}
```

Returns LP details including current `qa_status` and pending inspection count.

### Inspection by LP

Get pending inspection for a specific License Plate:

```
GET /api/quality/inspections/by-lp/{lpId}
```

**Response:**

```json
{
  "inspection": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "lp_id": "550e8400-e29b-41d4-a716-446655440010",
    "inspection_number": "INS-INC-2025-00001",
    "status": "in_progress",
    "result": null,
    "created_at": "2025-01-23T10:00:00.000Z"
  },
  "lp": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "barcode": "LP00000001",
    "product_id": "prod-uuid",
    "batch_number": "BATCH-2025-001",
    "quantity": 100,
    "qa_status": "pending"
  },
  "has_pending_inspection": true
}
```

---

## Validation Schema (Zod)

```typescript
import { z } from 'zod'

export const quickInspectionSchema = z.object({
  inspection_id: z.string().uuid('Invalid inspection ID'),
  result: z.enum(['pass', 'fail']),
  result_notes: z.string().max(2000).optional(),
  defects_found: z.number().int().min(0).max(1000).optional(),
  inspection_method: z.literal('scanner'),
  scanner_device_id: z.string().max(100).optional(),
  scanner_location: z.string().max(100).optional(),
})

export const offlineActionSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['quick_inspection', 'test_result']),
  payload: z.record(z.any()),
  timestamp: z.string().datetime(),
})

export const syncOfflineSchema = z.object({
  actions: z.array(offlineActionSchema).min(1).max(100),
})
```

---

## Error Codes Reference

| Error Message | HTTP Status | Resolution |
|---------------|-------------|------------|
| `Unauthorized` | 401 | Provide valid auth token |
| `User not found` | 401 | User profile missing in database |
| `Scanner access requires QA Inspector role` | 403 | Request role upgrade from admin |
| `Validation failed` | 400 | Check field-level error details |
| `Inspection not found` | 404 | Verify inspection_id exists and org matches |
| `Inspection already completed` | 400 | Cannot modify completed inspection |
| `Failed to update inspection` | 500 | Database error, retry request |
| `Failed to update LP status` | 500 | LP update failed, inspection still completed |
| `Internal server error` | 500 | Unexpected error, check server logs |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-23 | Initial API documentation for Story 06.8 |
