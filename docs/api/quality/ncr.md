# NCR (Non-Conformance Report) API Reference

Story: 06.9 - Basic NCR Creation

## Overview

The NCR API allows you to create, manage, and track Non-Conformance Reports for your organization. NCRs document quality issues found during production, receiving, inspection, or from customer complaints.

## Base URL

All endpoints are relative to your app base URL:

```
https://your-domain.com/api/quality/ncrs
```

## Authentication

All endpoints require authentication. Include your session token in the request headers (automatically handled by the client SDK).

**Required Roles**:
- `GET`: Any authenticated user
- `POST/PUT/DELETE`: Any role except `viewer`
- `POST .../close`: `qa_manager` or `admin` only

## NCR Number Format

NCR numbers are auto-generated with the format:

```
NCR-YYYY-NNNNN
```

- **NCR-**: Fixed prefix
- **YYYY**: 4-digit year (e.g., 2026)
- **NNNNN**: 5-digit sequence number, zero-padded (e.g., 00001)

Example: `NCR-2026-00042`

The sequence resets each year and is unique per organization.

---

## Endpoints

### GET /api/quality/ncrs

Get a paginated list of NCRs with optional filters.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | - | Filter by status: `draft`, `open`, `closed` |
| `severity` | string | - | Filter by severity: `minor`, `major`, `critical` |
| `detection_point` | string | - | Filter by detection point (see enum below) |
| `category` | string | - | Filter by category (see enum below) |
| `detected_by` | UUID | - | Filter by user who detected the issue |
| `assigned_to` | UUID | - | Filter by assigned user |
| `date_from` | string | - | Filter by detected_date >= date_from (ISO 8601) |
| `date_to` | string | - | Filter by detected_date <= date_to (ISO 8601) |
| `search` | string | - | Search in ncr_number and title (min 1 char) |
| `sort_by` | string | `detected_date` | Sort field: `ncr_number`, `detected_date`, `severity`, `status` |
| `sort_order` | string | `desc` | Sort direction: `asc`, `desc` |
| `page` | integer | 1 | Page number (1-based) |
| `limit` | integer | 20 | Page size (1-100) |

#### Request

```bash
curl -X GET "https://your-domain.com/api/quality/ncrs?status=open&severity=critical&limit=10" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

#### Response

**Status: 200 OK**

```json
{
  "ncrs": [
    {
      "id": "850e8400-e29b-41d4-a716-446655440000",
      "org_id": "550e8400-e29b-41d4-a716-446655440000",
      "ncr_number": "NCR-2026-00001",
      "title": "Temperature deviation during receiving",
      "description": "Refrigerated ingredients received at 8C instead of required 0-4C range",
      "severity": "major",
      "status": "open",
      "category": "supplier_issue",
      "detection_point": "incoming",
      "detected_date": "2026-01-23T10:30:00Z",
      "detected_by": "650e8400-e29b-41d4-a716-446655440001",
      "detected_by_name": "John Inspector",
      "assigned_to": "750e8400-e29b-41d4-a716-446655440002",
      "assigned_to_name": "Jane QA Manager",
      "created_at": "2026-01-23T10:30:00Z",
      "updated_at": "2026-01-23T14:15:00Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "pages": 5
  },
  "stats": {
    "draft_count": 3,
    "open_count": 15,
    "closed_count": 24,
    "critical_count": 2,
    "major_count": 18,
    "minor_count": 22
  }
}
```

#### Error Responses

**Status: 400 Bad Request** - Invalid filter parameters

```json
{
  "error": "Invalid request parameters",
  "details": [
    {
      "path": ["severity"],
      "message": "Severity must be one of: minor, major, critical"
    }
  ]
}
```

**Status: 401 Unauthorized**

```json
{
  "error": "Unauthorized"
}
```

---

### GET /api/quality/ncrs/:id

Get NCR detail with permissions.

#### Request

```bash
curl -X GET "https://your-domain.com/api/quality/ncrs/850e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

#### Response

**Status: 200 OK**

```json
{
  "ncr": {
    "id": "850e8400-e29b-41d4-a716-446655440000",
    "org_id": "550e8400-e29b-41d4-a716-446655440000",
    "ncr_number": "NCR-2026-00001",
    "title": "Temperature deviation during receiving",
    "description": "Refrigerated ingredients received at 8C instead of required 0-4C range",
    "severity": "major",
    "status": "open",
    "category": "supplier_issue",
    "detection_point": "incoming",
    "detected_date": "2026-01-23T10:30:00Z",
    "detected_by": "650e8400-e29b-41d4-a716-446655440001",
    "detected_by_name": "John Inspector",
    "source_type": "inspection",
    "source_id": "950e8400-e29b-41d4-a716-446655440000",
    "source_description": "Incoming Inspection INS-2026-00015",
    "assigned_to": "750e8400-e29b-41d4-a716-446655440002",
    "assigned_to_name": "Jane QA Manager",
    "assigned_at": "2026-01-23T11:00:00Z",
    "created_at": "2026-01-23T10:30:00Z",
    "updated_at": "2026-01-23T14:15:00Z"
  },
  "permissions": {
    "can_edit": false,
    "can_delete": false,
    "can_close": true,
    "can_assign": true
  }
}
```

#### Error Responses

**Status: 400 Bad Request** - Invalid ID format

```json
{
  "error": "Invalid NCR ID"
}
```

**Status: 404 Not Found**

```json
{
  "error": "NCR not found"
}
```

---

### POST /api/quality/ncrs

Create a new NCR.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | NCR title (5-200 characters) |
| `description` | string | Yes | Detailed description (20-2000 characters) |
| `severity` | string | Yes | `minor`, `major`, or `critical` |
| `detection_point` | string | Yes | Where the issue was detected (see enum) |
| `category` | string | No | Type of non-conformance (see enum) |
| `source_type` | string | No | Reference source type (see enum) |
| `source_id` | UUID | No | UUID of the source entity |
| `source_description` | string | No | Human-readable source reference (max 500) |
| `submit_immediately` | boolean | No | If true, NCR starts as `open` instead of `draft` |

#### Request

```bash
curl -X POST "https://your-domain.com/api/quality/ncrs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "title": "Temperature deviation during receiving",
    "description": "Refrigerated ingredients received at 8C instead of required 0-4C range. Product was dairy-based and requires cold chain maintenance.",
    "severity": "major",
    "detection_point": "incoming",
    "category": "supplier_issue",
    "source_type": "inspection",
    "source_id": "950e8400-e29b-41d4-a716-446655440000"
  }'
```

#### Response

**Status: 201 Created**

```json
{
  "ncr": {
    "id": "850e8400-e29b-41d4-a716-446655440000",
    "org_id": "550e8400-e29b-41d4-a716-446655440000",
    "ncr_number": "NCR-2026-00001",
    "title": "Temperature deviation during receiving",
    "description": "Refrigerated ingredients received at 8C instead of required 0-4C range. Product was dairy-based and requires cold chain maintenance.",
    "severity": "major",
    "status": "draft",
    "category": "supplier_issue",
    "detection_point": "incoming",
    "detected_date": "2026-01-23T10:30:00Z",
    "detected_by": "650e8400-e29b-41d4-a716-446655440001",
    "detected_by_name": "John Inspector",
    "source_type": "inspection",
    "source_id": "950e8400-e29b-41d4-a716-446655440000",
    "created_at": "2026-01-23T10:30:00Z",
    "updated_at": "2026-01-23T10:30:00Z"
  }
}
```

#### Error Responses

**Status: 400 Bad Request** - Validation errors

```json
{
  "error": "Invalid request data",
  "details": [
    {
      "path": ["title"],
      "message": "Title must be at least 5 characters"
    }
  ]
}
```

Common validation errors:
- `Title is required`
- `Title must be at least 5 characters`
- `Description is required`
- `Description must be at least 20 characters`
- `Severity is required`
- `Invalid severity`
- `Detection point is required`
- `Invalid detection point`

**Status: 403 Forbidden** - Viewer role cannot create NCRs

```json
{
  "error": "Insufficient permissions to create NCRs"
}
```

---

### PUT /api/quality/ncrs/:id

Update a draft NCR. Only draft NCRs can be edited.

#### Request Body

All fields are optional (partial update):

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | NCR title (5-200 characters) |
| `description` | string | Detailed description (20-2000 characters) |
| `severity` | string | `minor`, `major`, or `critical` |
| `detection_point` | string | Where the issue was detected |
| `category` | string | Type of non-conformance |

#### Request

```bash
curl -X PUT "https://your-domain.com/api/quality/ncrs/850e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "severity": "critical",
    "description": "Refrigerated ingredients received at 8C instead of required 0-4C range. Product was dairy-based allergen and requires immediate disposition."
  }'
```

#### Response

**Status: 200 OK**

```json
{
  "ncr": {
    "id": "850e8400-e29b-41d4-a716-446655440000",
    "severity": "critical",
    "description": "Refrigerated ingredients received at 8C...",
    "status": "draft",
    "updated_at": "2026-01-23T11:00:00Z"
  }
}
```

#### Error Responses

**Status: 403 Forbidden** - Cannot edit non-draft NCR

```json
{
  "error": "Cannot edit open NCR"
}
```

```json
{
  "error": "Cannot edit closed NCR"
}
```

---

### DELETE /api/quality/ncrs/:id

Delete a draft NCR. Only draft NCRs can be deleted.

#### Request

```bash
curl -X DELETE "https://your-domain.com/api/quality/ncrs/850e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

#### Response

**Status: 200 OK**

```json
{}
```

#### Error Responses

**Status: 403 Forbidden** - Cannot delete non-draft NCR

```json
{
  "error": "Cannot delete open NCR"
}
```

```json
{
  "error": "Cannot delete closed NCR"
}
```

---

### POST /api/quality/ncrs/:id/submit

Submit a draft NCR to open status (draft -> open).

#### Request

```bash
curl -X POST "https://your-domain.com/api/quality/ncrs/850e8400-e29b-41d4-a716-446655440000/submit" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

#### Response

**Status: 200 OK**

```json
{
  "ncr": {
    "id": "850e8400-e29b-41d4-a716-446655440000",
    "status": "open",
    "updated_at": "2026-01-23T11:00:00Z"
  }
}
```

#### Error Responses

**Status: 409 Conflict** - Already submitted

```json
{
  "error": "NCR is already open"
}
```

```json
{
  "error": "Cannot submit closed NCR"
}
```

---

### POST /api/quality/ncrs/:id/close

Close an open NCR with closure notes. **QA Manager or Admin only.**

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `closure_notes` | string | Yes | Resolution notes (50-2000 characters) |

#### Request

```bash
curl -X POST "https://your-domain.com/api/quality/ncrs/850e8400-e29b-41d4-a716-446655440000/close" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "closure_notes": "Investigated temperature deviation with supplier. Root cause: refrigeration unit failure during transit. Corrective action: Supplier replaced unit and provided credit for affected materials. Preventive action: Added temperature monitoring requirement to supplier agreement."
  }'
```

#### Response

**Status: 200 OK**

```json
{
  "ncr": {
    "id": "850e8400-e29b-41d4-a716-446655440000",
    "status": "closed",
    "closed_at": "2026-01-24T09:00:00Z",
    "closed_by": "750e8400-e29b-41d4-a716-446655440002",
    "closure_notes": "Investigated temperature deviation with supplier...",
    "updated_at": "2026-01-24T09:00:00Z"
  }
}
```

#### Error Responses

**Status: 400 Bad Request** - Validation errors

```json
{
  "error": "Closure notes required"
}
```

```json
{
  "error": "Closure notes must be at least 50 characters"
}
```

**Status: 403 Forbidden** - Permission denied

```json
{
  "error": "Only QA_MANAGER can close NCRs"
}
```

```json
{
  "error": "Cannot close draft NCR"
}
```

---

### POST /api/quality/ncrs/:id/assign

Assign an NCR to a user.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `assigned_to` | UUID | Yes | User ID to assign |

#### Request

```bash
curl -X POST "https://your-domain.com/api/quality/ncrs/850e8400-e29b-41d4-a716-446655440000/assign" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "assigned_to": "750e8400-e29b-41d4-a716-446655440002"
  }'
```

#### Response

**Status: 200 OK**

```json
{
  "ncr": {
    "id": "850e8400-e29b-41d4-a716-446655440000",
    "assigned_to": "750e8400-e29b-41d4-a716-446655440002",
    "assigned_at": "2026-01-23T11:00:00Z",
    "updated_at": "2026-01-23T11:00:00Z"
  }
}
```

#### Error Responses

**Status: 400 Bad Request** - Invalid user ID

```json
{
  "error": "Invalid user ID"
}
```

---

## Enums Reference

### Status

| Value | Description |
|-------|-------------|
| `draft` | Initial state. Can be edited, deleted, or submitted |
| `open` | Submitted for investigation. Cannot be edited or deleted |
| `closed` | Resolved with closure notes. Terminal state |

### Severity

| Value | Description | Response Time |
|-------|-------------|---------------|
| `minor` | Process deviation, no product impact | 72 hours |
| `major` | Quality impact, customer complaint risk | 48 hours |
| `critical` | Food safety risk, regulatory violation | 24 hours |

### Detection Point

| Value | Description |
|-------|-------------|
| `incoming` | During goods receipt inspection |
| `in_process` | During production (WIP) |
| `final` | During final inspection |
| `customer` | Customer complaint/return |
| `internal_audit` | Internal quality audit |
| `supplier_audit` | Supplier audit finding |
| `other` | Other detection source |

### Category

| Value | Description |
|-------|-------------|
| `product_defect` | Product quality issue |
| `process_deviation` | Process not followed |
| `documentation_error` | Record/document issue |
| `equipment_failure` | Equipment malfunction |
| `supplier_issue` | Supplier-related problem |
| `customer_complaint` | Customer feedback issue |
| `other` | Other category |

### Source Type

| Value | Description |
|-------|-------------|
| `inspection` | Quality inspection finding |
| `hold` | Quality hold reference |
| `batch` | Production batch issue |
| `work_order` | Work order issue |
| `supplier` | Supplier-related |
| `customer_complaint` | Customer complaint |
| `audit` | Audit finding |
| `other` | Other source |

---

## Error Codes

| HTTP Status | Error | Description |
|-------------|-------|-------------|
| 400 | Invalid request data | Validation failed |
| 400 | Invalid NCR ID | UUID format invalid |
| 400 | Closure notes required | Missing closure notes on close |
| 400 | Closure notes must be at least 50 characters | Notes too short |
| 401 | Unauthorized | Not authenticated |
| 403 | Insufficient permissions to create NCRs | Viewer role |
| 403 | Only QA_MANAGER can close NCRs | Wrong role for close |
| 403 | Cannot edit open NCR | NCR not in draft status |
| 403 | Cannot edit closed NCR | NCR already closed |
| 403 | Cannot delete open NCR | NCR not in draft status |
| 403 | Cannot delete closed NCR | NCR already closed |
| 404 | NCR not found | NCR does not exist or wrong org |
| 409 | NCR is already open | Submit on open NCR |
| 409 | Cannot submit closed NCR | Submit on closed NCR |
| 500 | Internal server error | Unexpected error |

---

## Code Examples

### TypeScript - Create and Submit NCR

```typescript
interface CreateNCRInput {
  title: string;
  description: string;
  severity: 'minor' | 'major' | 'critical';
  detection_point: string;
  category?: string;
  submit_immediately?: boolean;
}

async function createNCR(input: CreateNCRInput) {
  const response = await fetch('/api/quality/ncrs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create NCR');
  }

  return response.json();
}

async function submitNCR(ncrId: string) {
  const response = await fetch(`/api/quality/ncrs/${ncrId}/submit`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit NCR');
  }

  return response.json();
}

// Usage
const { ncr } = await createNCR({
  title: 'Temperature deviation during receiving',
  description: 'Refrigerated ingredients received at 8C instead of required 0-4C range...',
  severity: 'major',
  detection_point: 'incoming',
  category: 'supplier_issue',
});

await submitNCR(ncr.id);
```

### React Query Hook

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useNCRList(filters: NCRFilters) {
  const params = new URLSearchParams(filters as Record<string, string>);

  return useQuery({
    queryKey: ['ncrs', filters],
    queryFn: async () => {
      const res = await fetch(`/api/quality/ncrs?${params}`);
      if (!res.ok) throw new Error('Failed to fetch NCRs');
      return res.json();
    },
  });
}

export function useCreateNCR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateNCRInput) => {
      const res = await fetch('/api/quality/ncrs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to create');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ncrs'] });
    },
  });
}

export function useCloseNCR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, closure_notes }: { id: string; closure_notes: string }) => {
      const res = await fetch(`/api/quality/ncrs/${id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closure_notes }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['ncrs'] });
      queryClient.invalidateQueries({ queryKey: ['ncr', id] });
    },
  });
}
```

---

## Multi-Tenant Security

- All NCRs are filtered by the authenticated user's `org_id`
- The `org_id` is set automatically from the user's session, not from request body
- Row Level Security (RLS) ensures users can only access their organization's data
- Attempting to access another organization's NCR returns 404 (not 403) to prevent enumeration

---

## Changelog

### v1.0 (2026-01-23)

- Initial release with Basic NCR Creation (Story 06.9)
- CRUD operations for NCR management
- Status workflow: draft -> open -> closed
- QA Manager approval for closing NCRs
- Pagination and filtering for NCR list
- Statistics aggregation (by status and severity)
