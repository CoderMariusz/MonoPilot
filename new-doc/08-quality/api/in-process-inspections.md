# In-Process Inspections API Reference

> API endpoints for managing quality inspections during work order (WO) operations.

## Overview

In-process inspections verify product quality at specific operations during manufacturing. They integrate with the Production module to:

- Track QA status per WO operation
- Block subsequent operations on failure (configurable)
- Support AQL-based sampling plans
- Auto-create inspections on operation completion

## Authentication

All endpoints require a valid session. Include your session token via Supabase Auth.

**Required Roles:**
- `qa_inspector` - Can create, start, and complete inspections
- `qa_manager` - Can assign inspectors and approve conditional results
- `admin`, `owner` - Full access

## Endpoints

### List In-Process Inspections

```http
GET /api/quality/inspections/in-process
```

Returns a paginated list of in-process inspections with optional filters.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `wo_id` | UUID | Filter by Work Order ID |
| `wo_operation_id` | UUID | Filter by WO operation ID |
| `status` | enum | `scheduled`, `in_progress`, `completed`, `cancelled` |
| `priority` | enum | `low`, `normal`, `high`, `urgent` |
| `inspector_id` | UUID | Filter by assigned inspector |
| `product_id` | UUID | Filter by product |
| `date_from` | date | Scheduled date >= (YYYY-MM-DD) |
| `date_to` | date | Scheduled date <= (YYYY-MM-DD) |
| `search` | string | Search inspection_number or batch_number |
| `sort_by` | string | `inspection_number`, `scheduled_date`, `created_at`, `priority` |
| `sort_order` | string | `asc` or `desc` (default: `desc`) |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page, max 100 (default: 20) |

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "inspection_number": "INS-2026-0001",
      "inspection_type": "in_process",
      "status": "scheduled",
      "priority": "normal",
      "product_id": "...",
      "product_code": "PROD-001",
      "product_name": "Chocolate Chip Cookie",
      "wo_id": "...",
      "wo_number": "WO-2026-0050",
      "wo_operation_id": "...",
      "batch_number": "BATCH-001",
      "spec_id": "...",
      "spec_number": "SPEC-001",
      "spec_name": "Cookie Quality Spec v1.0",
      "inspector_id": null,
      "inspector_name": null,
      "scheduled_date": "2026-01-23",
      "created_at": "2026-01-23T10:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid query parameters |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 500 | `INTERNAL_ERROR` | Server error |

---

### Get WO Inspections

```http
GET /api/quality/inspections/wo/{woId}
```

Returns all inspections for a Work Order with a quality summary.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `woId` | UUID | Work Order ID |

**Response (200 OK):**

```json
{
  "wo": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "wo_number": "WO-2026-0050",
    "status": "in_progress",
    "product_name": "Chocolate Chip Cookie",
    "batch_number": "BATCH-001"
  },
  "inspections": [
    {
      "id": "...",
      "inspection_number": "INS-2026-0001",
      "wo_operation_id": "...",
      "status": "completed",
      "result": "pass",
      "completed_at": "2026-01-23T14:30:00.000Z"
    }
  ],
  "summary": {
    "total_operations": 5,
    "inspections_completed": 3,
    "inspections_passed": 2,
    "inspections_failed": 0,
    "inspections_pending": 2
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_ID` | Invalid Work Order ID format |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 404 | `NOT_FOUND` | Work Order not found |

---

### Get Operation Inspection

```http
GET /api/quality/inspections/operation/{operationId}
```

Returns the inspection for a specific WO operation with context about previous operations.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `operationId` | UUID | WO Operation ID |

**Response (200 OK):**

```json
{
  "operation": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "sequence": 2,
    "name": "Mixing",
    "status": "completed",
    "started_at": "2026-01-23T10:00:00.000Z",
    "completed_at": "2026-01-23T11:30:00.000Z",
    "operator_name": "John Smith",
    "qa_status": "pending",
    "qa_inspection_id": null
  },
  "inspection": {
    "id": "...",
    "inspection_number": "INS-2026-0002",
    "status": "scheduled",
    "priority": "normal"
  },
  "previous_operation_qa": {
    "operation_name": "Weighing",
    "result": "passed"
  }
}
```

**Notes:**
- `inspection` is `null` if no inspection exists for this operation
- `previous_operation_qa` is `null` for the first operation or if previous didn't require QA

---

### Create In-Process Inspection

```http
POST /api/quality/inspections
```

Creates a new in-process inspection for a WO operation.

**Request Body:**

```json
{
  "wo_id": "123e4567-e89b-12d3-a456-426614174000",
  "wo_operation_id": "456e4567-e89b-12d3-a456-426614174001",
  "product_id": "789e4567-e89b-12d3-a456-426614174002",
  "spec_id": "abc4567-e89b-12d3-a456-426614174003",
  "batch_number": "BATCH-001",
  "priority": "normal",
  "scheduled_date": "2026-01-23",
  "inspector_id": "def4567-e89b-12d3-a456-426614174004",
  "notes": "Pre-baking inspection"
}
```

**Field Validation:**

| Field | Required | Type | Validation |
|-------|----------|------|------------|
| `wo_id` | Yes | UUID | Must exist, status must be `in_progress` |
| `wo_operation_id` | Yes | UUID | Must belong to the WO |
| `product_id` | No | UUID | Defaults to WO product |
| `spec_id` | No | UUID | Auto-selects active spec if not provided |
| `batch_number` | No | string | Max 100 characters |
| `priority` | No | enum | `low`, `normal`, `high`, `urgent` |
| `scheduled_date` | No | date | YYYY-MM-DD format, defaults to today |
| `inspector_id` | No | UUID | Must be valid user |
| `notes` | No | string | Max 2000 characters |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "inspection": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "inspection_number": "INS-2026-0003",
      "status": "scheduled",
      "wo_id": "...",
      "wo_operation_id": "...",
      "product_code": "PROD-001",
      "product_name": "Chocolate Chip Cookie"
    }
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid request body |
| 400 | - | "Invalid Work Order" - WO not found |
| 400 | - | "Work Order must be in progress for in-process inspection" |
| 400 | - | "Invalid operation" - Operation not found or doesn't belong to WO |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions |

---

### Start Inspection

```http
POST /api/quality/inspections/{id}/start
```

Starts an inspection workflow, transitioning from `scheduled` to `in_progress`.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Inspection ID |

**Request Body (optional):**

```json
{
  "take_over": false
}
```

**Notes:**
- `take_over: true` requires `qa_manager` role
- If no inspector is assigned, the current user becomes the inspector

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "inspection": {
      "id": "...",
      "status": "in_progress",
      "started_at": "2026-01-23T14:00:00.000Z",
      "inspector_id": "...",
      "inspector_name": "Jane Doe"
    }
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | - | "Only scheduled inspections can be started" |
| 400 | - | "Cannot inspect - Work Order is paused" |
| 400 | - | "Cannot inspect - Work Order is cancelled" |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Insufficient permissions or take_over without manager role |
| 404 | `NOT_FOUND` | Inspection not found |

---

### Complete Inspection

```http
POST /api/quality/inspections/{id}/complete
```

Completes an inspection with a result. For in-process inspections, this also updates the WO operation QA status.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Inspection ID |

**Request Body:**

```json
{
  "result": "pass",
  "result_notes": "All parameters within specification",
  "defects_found": 0,
  "major_defects": 0,
  "minor_defects": 0,
  "critical_defects": 0,
  "create_ncr": false,
  "block_next_operation": false,
  "process_parameters": [
    {
      "parameter_name": "Temperature",
      "measured_value": "180",
      "within_spec": true
    }
  ]
}
```

**Field Validation:**

| Field | Required | Type | Validation |
|-------|----------|------|------------|
| `result` | Yes | enum | `pass`, `fail`, `conditional` |
| `result_notes` | No | string | Max 2000 characters |
| `defects_found` | No | number | >= 0, default 0 |
| `major_defects` | No | number | >= 0, default 0 |
| `minor_defects` | No | number | >= 0, default 0 |
| `critical_defects` | No | number | >= 0, default 0 |
| `conditional_reason` | Conditional | string | Required if result is `conditional`, max 500 chars |
| `conditional_restrictions` | Conditional | string | Required if result is `conditional`, max 1000 chars |
| `conditional_expires_at` | No | datetime | ISO 8601 format |
| `create_ncr` | No | boolean | Create NCR if result is `fail` |
| `block_next_operation` | No | boolean | Override org settings for blocking |
| `process_parameters` | No | array | Captured process values |

**Response (200 OK):**

```json
{
  "inspection": {
    "id": "...",
    "inspection_number": "INS-2026-0003",
    "status": "completed",
    "result": "pass",
    "completed_at": "2026-01-23T15:30:00.000Z",
    "completed_by": "...",
    "completed_by_name": "Jane Doe"
  },
  "wo_operation_updated": true,
  "wo_operation_qa_status": "passed",
  "next_operation_blocked": false,
  "alert_sent_to": ["production_team"]
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `wo_operation_updated` | boolean | Whether WO operation was updated |
| `wo_operation_qa_status` | string | New QA status: `passed`, `failed`, `conditional` |
| `next_operation_blocked` | boolean | Whether next operation is blocked |
| `ncr_id` | string | Created NCR ID (if `create_ncr` was true and result was fail) |
| `alert_sent_to` | array | Teams notified of completion |

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid request body |
| 400 | - | "Only in-progress inspections can be completed" |
| 400 | - | "Conditional reason and restrictions required for conditional result" |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | - | "Insufficient permissions to complete inspections" |
| 403 | - | "Only QA Manager can approve conditional results" |
| 404 | - | Inspection not found |

---

### Assign Inspector

```http
POST /api/quality/inspections/{id}/assign
```

Assigns or reassigns an inspector to an inspection. Requires `qa_manager` role.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Inspection ID |

**Request Body:**

```json
{
  "inspector_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "inspection": {
      "id": "...",
      "inspector_id": "...",
      "inspector_name": "John Smith",
      "assigned_by": "...",
      "assigned_by_name": "Jane Doe",
      "assigned_at": "2026-01-23T13:00:00.000Z"
    }
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid inspector_id |
| 400 | - | "Cannot assign inspector to completed or cancelled inspection" |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Only QA Manager can assign |
| 404 | `NOT_FOUND` | Inspection not found |

---

## Data Types

### QualityInspection

```typescript
interface QualityInspection {
  id: string;
  org_id: string;
  inspection_number: string;
  inspection_type: 'incoming' | 'in_process' | 'final';
  reference_type: 'po' | 'grn' | 'wo' | 'lp' | 'batch';
  reference_id: string;

  // Product
  product_id: string;
  product_code?: string;
  product_name?: string;

  // Specification
  spec_id?: string;
  spec_number?: string;
  spec_name?: string;

  // WO Info (in-process only)
  wo_id?: string;
  wo_number?: string;
  wo_operation_id?: string;

  // Batch
  batch_number?: string;
  lot_size?: number;
  sample_size?: number;
  sampling_plan_id?: string;

  // Assignment
  inspector_id?: string;
  inspector_name?: string;
  assigned_by?: string;
  assigned_by_name?: string;
  assigned_at?: string;

  // Status
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';

  // Timing
  scheduled_date?: string;
  started_at?: string;
  completed_at?: string;
  completed_by?: string;
  completed_by_name?: string;

  // Result
  result?: 'pass' | 'fail' | 'conditional';
  result_notes?: string;
  defects_found: number;
  major_defects: number;
  minor_defects: number;
  critical_defects: number;

  // Conditional
  conditional_reason?: string;
  conditional_restrictions?: string;
  conditional_approved_by?: string;
  conditional_expires_at?: string;

  // NCR
  ncr_id?: string;

  // Audit
  created_at: string;
  created_by?: string;
  updated_at: string;
  updated_by?: string;
}
```

### WOOperationQAStatus

```typescript
type WOOperationQAStatus =
  | 'pending'       // Awaiting inspection
  | 'passed'        // QA inspection passed
  | 'failed'        // QA inspection failed
  | 'conditional'   // Approved with restrictions
  | 'not_required'; // No QA check needed
```

---

## Quality Settings

Organization-level settings affect inspection behavior:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `require_operation_qa_pass` | boolean | false | Block next op if current QA is pending |
| `block_next_operation_on_fail` | boolean | true | Block next op on QA failure |
| `auto_create_inspection_on_operation` | boolean | false | Auto-create when operation completes |
| `inspection_sla_hours` | number | 2 | Hours before inspection is overdue |

---

## Service Functions

The `InProcessInspectionService` provides additional functions not exposed as REST endpoints:

| Function | Description |
|----------|-------------|
| `canStartNextOperation(orgId, woId, sequence)` | Check if next operation can start |
| `getWOQualitySummary(orgId, woId)` | Get overall WO quality summary |
| `operationRequiresInspection(orgId, operationId)` | Check if operation needs QA |
| `createForOperationCompletion(orgId, operationId, userId)` | Auto-create on op completion |
| `checkAndAlertOverdueInspections(orgId)` | Alert on overdue inspections |

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient role permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `INVALID_ID` | 400 | Invalid UUID format |
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Related Documentation

- [In-Process Inspection Workflow Guide](../../guides/quality/in-process-inspection-workflow.md)
- [Sampling Plans API](./sampling-plans.md)
- [Quality Holds API](./holds.md)
- [NCR API](./ncrs.md)
