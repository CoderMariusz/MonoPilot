# Quality Holds API Reference

Quality Holds management API for blocking inventory (License Plates, Work Orders, batches) from consumption pending investigation. Provides endpoints for creating, retrieving, releasing, and managing quality holds with automatic aging alerts.

## Base URL

```
/api/quality/holds
```

## Authentication

All endpoints require authentication. Include `Authorization: Bearer {token}` header. User must belong to the organization owning the hold.

## Data Models

### QualityHold

Complete hold record with all audit fields.

```typescript
{
  id: string // UUID
  org_id: string // Organization owner
  hold_number: string // Auto-generated format: QH-YYYYMMDD-NNNN
  reason: string // Why hold was created (10-500 chars)
  hold_type: 'qa_pending' | 'investigation' | 'recall' | 'quarantine'
  status: 'active' | 'released' | 'disposed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  held_by: { id: string; name: string; email: string }
  held_at: ISO8601 timestamp // When hold was created
  released_by?: { id: string; name: string; email: string } | null
  released_at?: ISO8601 timestamp | null
  release_notes?: string | null
  disposition?: 'release' | 'rework' | 'scrap' | 'return' | null
  ncr_id?: string | null // Non-Conformance Report reference (Phase 2)
  created_at: ISO8601 timestamp
  updated_at: ISO8601 timestamp
  created_by?: string | null
  updated_by?: string | null
}
```

### QualityHoldItem

Individual item (LP, WO, batch) placed on hold.

```typescript
{
  id: string // UUID
  hold_id: string // Reference to quality_holds
  reference_type: 'lp' | 'wo' | 'batch'
  reference_id: string // UUID of referenced item
  reference_display: string // Display value (LP number, WO number, etc.)
  quantity_held?: number | null // Optional quantity affected
  uom?: string | null // Unit of measure
  location_id?: string | null // Warehouse location (for LPs)
  location_name?: string | null // Joined location name
  notes?: string | null // Item-specific notes
  created_at: ISO8601 timestamp
}
```

### QualityHoldSummary

Summary view for list displays with aging calculations.

```typescript
{
  id: string
  hold_number: string
  status: 'active' | 'released' | 'disposed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  hold_type: 'qa_pending' | 'investigation' | 'recall' | 'quarantine'
  reason: string // Truncated to 100 chars
  items_count: number // Count of items on hold
  held_by: { id: string; name: string }
  held_at: ISO8601 timestamp
  aging_hours: number // Hours since hold creation
  aging_status: 'normal' | 'warning' | 'critical'
}
```

## Endpoints

### List Holds

Retrieve paginated list of holds with optional filters.

```
GET /api/quality/holds
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | string[] | - | Filter by status (comma-separated): `active,released,disposed` |
| priority | string[] | - | Filter by priority: `low,medium,high,critical` |
| hold_type | string[] | - | Filter by type: `qa_pending,investigation,recall,quarantine` |
| from | ISO8601 | - | Filter holds created >= this date |
| to | ISO8601 | - | Filter holds created <= this date |
| search | string | - | Search by hold_number or reason (case-insensitive) |
| limit | number | 20 | Page size (max 100) |
| offset | number | 0 | Pagination offset |
| sort | string | `held_at DESC` | Sort field and direction (e.g., `priority ASC`) |

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/quality/holds?status=active&priority=high,critical&limit=20&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**

```json
{
  "holds": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "hold_number": "QH-20251216-0001",
      "status": "active",
      "priority": "high",
      "hold_type": "investigation",
      "reason": "Failed metal detection test on batch...",
      "items_count": 3,
      "held_by": {
        "id": "user-123",
        "name": "John Smith"
      },
      "held_at": "2025-12-16T14:30:00Z",
      "aging_hours": 52.5,
      "aging_status": "warning"
    }
  ],
  "pagination": {
    "total": 47,
    "page": 1,
    "limit": 20,
    "total_pages": 3
  },
  "filters_applied": {
    "status": ["active"],
    "priority": ["high", "critical"],
    "hold_type": null,
    "date_range": null
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid filter values or pagination parameters
- `401 Unauthorized` - Missing or invalid authentication token

---

### Get Hold Detail

Retrieve full hold record with all items.

```
GET /api/quality/holds/:id
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Hold ID |

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/quality/holds/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**

```json
{
  "hold": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "org_id": "org-456",
    "hold_number": "QH-20251216-0001",
    "reason": "Failed metal detection test on batch B-2025-001",
    "hold_type": "investigation",
    "status": "active",
    "priority": "high",
    "held_by": {
      "id": "user-123",
      "name": "John Smith",
      "email": "john@company.com"
    },
    "held_at": "2025-12-16T14:30:00Z",
    "released_by": null,
    "released_at": null,
    "release_notes": null,
    "disposition": null,
    "ncr_id": null,
    "created_at": "2025-12-16T14:30:00Z",
    "updated_at": "2025-12-16T14:30:00Z"
  },
  "items": [
    {
      "id": "item-1",
      "hold_id": "550e8400-e29b-41d4-a716-446655440000",
      "reference_type": "lp",
      "reference_id": "lp-001",
      "reference_display": "LP-20251216-001",
      "quantity_held": 150.00,
      "uom": "KG",
      "location_id": "loc-warehouse-a",
      "location_name": "Warehouse A - Shelf 3",
      "notes": "Hold due to metal contamination",
      "created_at": "2025-12-16T14:30:00Z"
    },
    {
      "id": "item-2",
      "hold_id": "550e8400-e29b-41d4-a716-446655440000",
      "reference_type": "lp",
      "reference_id": "lp-002",
      "reference_display": "LP-20251216-002",
      "quantity_held": 150.00,
      "uom": "KG",
      "location_id": "loc-warehouse-a",
      "location_name": "Warehouse A - Shelf 3",
      "notes": null,
      "created_at": "2025-12-16T14:30:00Z"
    }
  ],
  "ncr": null
}
```

**Error Responses:**

- `400 Bad Request` - Invalid hold ID format
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Hold does not exist or user lacks access

---

### Create Hold

Create new quality hold with items. Automatically updates affected License Plate QA statuses to "hold".

```
POST /api/quality/holds
```

**Request Body:**

```json
{
  "reason": "Failed metal detection test on batch B-2025-001",
  "hold_type": "investigation",
  "priority": "high",
  "items": [
    {
      "reference_type": "lp",
      "reference_id": "lp-001-uuid",
      "quantity_held": 150.00,
      "uom": "KG",
      "notes": "Hold due to metal contamination"
    },
    {
      "reference_type": "lp",
      "reference_id": "lp-002-uuid",
      "quantity_held": 150.00,
      "uom": "KG"
    }
  ]
}
```

**Request Field Validation:**

| Field | Type | Rules | Example |
|-------|------|-------|---------|
| reason | string | Required, 10-500 chars | "Failed metal detection test..." |
| hold_type | enum | Required, one of: `qa_pending`, `investigation`, `recall`, `quarantine` | "investigation" |
| priority | enum | Optional, default "medium", one of: `low`, `medium`, `high`, `critical` | "high" |
| items | array | Required, min 1 item | [...] |
| items[].reference_type | enum | Required, one of: `lp`, `wo`, `batch` | "lp" |
| items[].reference_id | UUID | Required, must exist and belong to org | "lp-001-uuid" |
| items[].quantity_held | number | Optional, positive | 150.00 |
| items[].uom | string | Optional, max 20 chars | "KG" |
| items[].notes | string | Optional, max 500 chars | "Hold due to..." |

**Example Request:**

```bash
curl -X POST "http://localhost:3000/api/quality/holds" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Failed metal detection test on batch B-2025-001",
    "hold_type": "investigation",
    "priority": "high",
    "items": [
      {
        "reference_type": "lp",
        "reference_id": "550e8400-e29b-41d4-a716-446655440111",
        "quantity_held": 150,
        "uom": "KG"
      }
    ]
  }'
```

**Response (201 Created):**

```json
{
  "hold": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "org_id": "org-456",
    "hold_number": "QH-20251216-0001",
    "reason": "Failed metal detection test on batch B-2025-001",
    "hold_type": "investigation",
    "status": "active",
    "priority": "high",
    "held_by": {
      "id": "user-123",
      "name": "John Smith",
      "email": "john@company.com"
    },
    "held_at": "2025-12-16T14:30:00Z",
    "created_at": "2025-12-16T14:30:00Z",
    "updated_at": "2025-12-16T14:30:00Z"
  },
  "items": [
    {
      "id": "item-1",
      "hold_id": "550e8400-e29b-41d4-a716-446655440000",
      "reference_type": "lp",
      "reference_id": "550e8400-e29b-41d4-a716-446655440111",
      "reference_display": "LP-20251216-001",
      "quantity_held": 150.00,
      "uom": "KG",
      "location_id": "loc-warehouse-a",
      "location_name": "Warehouse A - Shelf 3",
      "notes": null,
      "created_at": "2025-12-16T14:30:00Z"
    }
  ],
  "lp_updates": [
    {
      "lp_id": "550e8400-e29b-41d4-a716-446655440111",
      "lp_number": "LP-20251216-001",
      "previous_status": "passed",
      "new_status": "hold"
    }
  ]
}
```

**Error Responses:**

- `400 Bad Request` - Validation error
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
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User lacks permission (VIEWER role cannot create holds)
- `404 Not Found` - Referenced item (LP/WO) does not exist
- `409 Conflict` - Duplicate item in request

---

### Release Hold

Release quality hold with disposition decision. Updates affected License Plate QA statuses based on disposition.

```
PATCH /api/quality/holds/:id/release
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Hold ID |

**Request Body:**

```json
{
  "disposition": "release",
  "release_notes": "All items passed re-inspection by QA team"
}
```

**Request Field Validation:**

| Field | Type | Rules | Example |
|-------|------|-------|---------|
| disposition | enum | Required, one of: `release`, `rework`, `scrap`, `return` | "release" |
| release_notes | string | Required, 10-1000 chars | "All items passed re-inspection..." |

**Disposition Effects on LP QA Status:**

| Disposition | LP QA Status | Quantity | Reason |
|-------------|--------------|----------|--------|
| release | passed | unchanged | Item approved, safe to consume |
| rework | pending | unchanged | Item needs reprocessing |
| scrap | failed | set to 0 | Item destroyed, no longer available |
| return | failed | unchanged | Item returned to supplier |

**Example Request:**

```bash
curl -X PATCH "http://localhost:3000/api/quality/holds/550e8400-e29b-41d4-a716-446655440000/release" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "disposition": "release",
    "release_notes": "All items passed re-inspection by QA team on 2025-12-17"
  }'
```

**Response (200 OK):**

```json
{
  "hold": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "org_id": "org-456",
    "hold_number": "QH-20251216-0001",
    "reason": "Failed metal detection test on batch B-2025-001",
    "hold_type": "investigation",
    "status": "released",
    "priority": "high",
    "held_by": {
      "id": "user-123",
      "name": "John Smith",
      "email": "john@company.com"
    },
    "held_at": "2025-12-16T14:30:00Z",
    "released_by": {
      "id": "user-456",
      "name": "Jane Doe",
      "email": "jane@company.com"
    },
    "released_at": "2025-12-17T10:15:00Z",
    "release_notes": "All items passed re-inspection by QA team on 2025-12-17",
    "disposition": "release",
    "created_at": "2025-12-16T14:30:00Z",
    "updated_at": "2025-12-17T10:15:00Z"
  },
  "lp_updates": [
    {
      "lp_id": "550e8400-e29b-41d4-a716-446655440111",
      "lp_number": "LP-20251216-001",
      "previous_status": "hold",
      "new_status": "passed",
      "disposition_action": "release"
    }
  ]
}
```

**Error Responses:**

- `400 Bad Request` - Validation error or invalid hold ID format
  ```json
  {
    "error": "Invalid request data",
    "details": [
      {
        "code": "too_small",
        "minimum": 10,
        "type": "string",
        "path": ["release_notes"],
        "message": "Release notes must be at least 10 characters"
      }
    ]
  }
  ```
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User lacks permission (VIEWER role cannot release holds)
- `404 Not Found` - Hold does not exist
- `409 Conflict` - Hold is already released or disposed

---

### Get Active Holds

Retrieve active holds only with aging summary statistics.

```
GET /api/quality/holds/active
```

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/quality/holds/active" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**

```json
{
  "holds": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "hold_number": "QH-20251216-0001",
      "status": "active",
      "priority": "critical",
      "hold_type": "recall",
      "reason": "Safety issue detected in production...",
      "items_count": 5,
      "held_by": {
        "id": "user-123",
        "name": "John Smith"
      },
      "held_at": "2025-12-16T14:30:00Z",
      "aging_hours": 28.5,
      "aging_status": "critical"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "hold_number": "QH-20251216-0002",
      "status": "active",
      "priority": "high",
      "hold_type": "investigation",
      "reason": "Failed metal detection test...",
      "items_count": 3,
      "held_by": {
        "id": "user-456",
        "name": "Jane Doe"
      },
      "held_at": "2025-12-16T18:00:00Z",
      "aging_hours": 25.0,
      "aging_status": "warning"
    }
  ],
  "aging_summary": {
    "normal": 12,
    "warning": 5,
    "critical": 2
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid authentication token

---

### Get Hold Statistics

Retrieve aggregated hold statistics for dashboard displays.

```
GET /api/quality/holds/stats
```

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/quality/holds/stats" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200 OK):**

```json
{
  "active_count": 19,
  "released_today": 3,
  "aging_critical": 2,
  "by_priority": {
    "low": 2,
    "medium": 8,
    "high": 6,
    "critical": 3
  },
  "by_type": {
    "qa_pending": 5,
    "investigation": 8,
    "recall": 4,
    "quarantine": 2
  },
  "avg_resolution_time_hours": 18.5
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid authentication token

---

### Delete Hold

Soft-delete quality hold (only if status is "active" and has no items).

```
DELETE /api/quality/holds/:id
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Hold ID |

**Example Request:**

```bash
curl -X DELETE "http://localhost:3000/api/quality/holds/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (204 No Content)**

Empty response on successful deletion.

**Error Responses:**

- `400 Bad Request` - Invalid hold ID format
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User lacks permission (VIEWER role cannot delete holds)
- `404 Not Found` - Hold does not exist
- `409 Conflict` - Hold has items or is not active status

---

## Hold Auto-Numbering

Hold numbers are automatically generated using the format:

```
QH-YYYYMMDD-NNNN
```

- **QH**: Quality Hold prefix
- **YYYYMMDD**: Date created (e.g., 20251216)
- **NNNN**: Sequential number per day (0001, 0002, ...)

**Examples:**
- `QH-20251216-0001` - First hold created on 2025-12-16
- `QH-20251216-0002` - Second hold created on 2025-12-16
- `QH-20251217-0001` - First hold created on 2025-12-17

---

## Hold Type Reference

| Type | Use Case | Priority Guidance |
|------|----------|-------------------|
| qa_pending | Awaiting quality inspection results | Medium |
| investigation | Under active investigation for root cause | High |
| recall | Safety recall for customer units | Critical |
| quarantine | Isolated due to contamination risk | High |

---

## Hold Status Lifecycle

```
active
  ├─→ released (with disposition)
  │    ├─ release    → LP qa_status = passed
  │    ├─ rework     → LP qa_status = pending
  │    ├─ scrap      → LP qa_status = failed (quantity = 0)
  │    └─ return     → LP qa_status = failed
  │
  └─→ disposed (for archive/cleanup)
```

---

## Aging Alert Thresholds

Hold aging status is calculated based on priority and time elapsed since hold creation (held_at).

| Priority | Warning | Critical |
|----------|---------|----------|
| critical | 12 hours | 24 hours |
| high | 24 hours | 48 hours |
| medium | 48 hours | 72 hours |
| low | 120 hours (5d) | 168 hours (7d) |

**Example:**
- A "high" priority hold created 50 hours ago shows `aging_status: "critical"`
- A "critical" priority hold created 13 hours ago shows `aging_status: "warning"`

---

## License Plate (LP) Integration

When a hold is created with LP items, the `qa_status` field in the `license_plates` table is automatically updated:

- **Hold created**: LP `qa_status` = "hold"
- **Hold released with "release"**: LP `qa_status` = "passed"
- **Hold released with "rework"**: LP `qa_status` = "pending"
- **Hold released with "scrap"**: LP `qa_status` = "failed", `quantity` = 0
- **Hold released with "return"**: LP `qa_status` = "failed"

This prevents consumption of LPs on hold during production picking operations.

---

## Rate Limiting

API endpoints are rate limited per organization:

- **List endpoint**: 100 requests/minute
- **Create/Release**: 20 requests/minute
- **Other endpoints**: 50 requests/minute

Responses include rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1639668600
```

---

## Multi-Tenancy & Security

All holds are automatically filtered by user's organization (`org_id`) through Row Level Security (RLS) policies:

- Users can only access holds belonging to their organization
- Cannot query, create, update, or delete holds from other organizations
- All database queries are parameterized to prevent SQL injection

---

## Pagination Best Practices

For large hold lists:

1. Always use pagination: `limit` and `offset` parameters
2. Recommended page size: 20-50 holds
3. Combine with filters to reduce result sets
4. Sort by `held_at DESC` for recent holds first

**Example paginating through critical holds:**

```bash
# Page 1
curl "http://localhost:3000/api/quality/holds?priority=critical&limit=20&offset=0"

# Page 2
curl "http://localhost:3000/api/quality/holds?priority=critical&limit=20&offset=20"

# Page 3
curl "http://localhost:3000/api/quality/holds?priority=critical&limit=20&offset=40"
```

---

## Common Integration Patterns

### Pattern 1: Block LP Consumption in Production Picking

Before allowing LP consumption, check if LP is on active hold:

```typescript
// In production picking API
const canConsume = await QualityHoldService.blockLPConsumption(lpId, orgId);

if (!canConsume) {
  const hold = await QualityHoldService.getActiveLPHold(lpId, orgId);
  throw new Error(`LP is on quality hold ${hold.hold_number}. Cannot consume.`);
}
```

### Pattern 2: List Active Holds for QA Dashboard

Retrieve holds with aging to prioritize review:

```typescript
const { holds, aging_summary } = await fetch(
  '/api/quality/holds/active',
  { headers: { Authorization: `Bearer ${token}` } }
).then(r => r.json());

// Display holds sorted by aging_status: critical > warning > normal
const sorted = holds.sort((a, b) => {
  const priority = { critical: 0, warning: 1, normal: 2 };
  return priority[a.aging_status] - priority[b.aging_status];
});
```

### Pattern 3: Release Hold Batch

Release multiple holds with same disposition:

```typescript
const holds = await fetch(
  '/api/quality/holds?priority=low&status=active',
  { headers: { Authorization: `Bearer ${token}` } }
).then(r => r.json());

for (const hold of holds.holds) {
  await fetch(`/api/quality/holds/${hold.id}/release`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      disposition: 'release',
      release_notes: 'Batch release after review'
    })
  });
}
```

---

## Troubleshooting

### Issue: Hold creation fails with "License plate not found"

**Cause:** Referenced LP UUID does not exist or belongs to different organization.

**Solution:** Verify LP ID is valid UUID and user has access to LP's organization.

### Issue: Release hold returns "Hold is already released"

**Cause:** Attempting to release hold that is already in "released" status.

**Solution:** Check hold status before attempting release. Only "active" holds can be released.

### Issue: LP still shows qa_status "hold" after releasing hold

**Cause:** LP update transaction failed silently.

**Solution:** Check application logs. Manually verify LP qa_status in database. May need to re-release hold with same disposition.

---

## See Also

- [Component Guide: Quality Holds UI](quality-holds-components.md)
- [Hold Workflow Guide](quality-holds-workflow.md)
- [Aging Alert Guide](quality-holds-aging-alerts.md)
