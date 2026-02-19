# Planning - Work Order Materials & Operations API Reference

## Base URL

```
https://app.monopilot.io/api/planning/work-orders
```

## Authentication

All endpoints require a valid JWT bearer token in the `Authorization` header.

```bash
Authorization: Bearer <your_jwt_token>
```

Requests without a token or with an expired token will receive a 401 Unauthorized response.

## Common Response Formats

### Success Response

All successful responses follow this pattern:

```json
{
  "status": 200,
  "data": { /* endpoint-specific data */ }
}
```

### Error Response

All error responses follow this pattern:

```json
{
  "status": 400,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": { /* optional additional details */ }
}
```

---

## Materials Endpoints

### GET /work-orders/:id/materials

Retrieve all materials (BOM snapshot) for a work order.

**Endpoint Summary**:
- Method: `GET`
- Requires Auth: Yes
- Roles: All authenticated users
- Rate Limit: 100 req/min

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Work Order ID |

**Query Parameters**:

None

**Request Headers**:

```
Authorization: Bearer <jwt_token>
Content-Type: application/json (optional for GET)
```

**Example Request**:

```bash
curl -X GET https://app.monopilot.io/api/planning/work-orders/123e4567-e89b-12d3-a456-426614174000/materials \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Example Response (200 OK)**:

```json
{
  "materials": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "wo_id": "123e4567-e89b-12d3-a456-426614174000",
      "product_id": "660e8400-e29b-41d4-a716-446655440000",
      "material_name": "Flour",
      "required_qty": 13.125,
      "consumed_qty": 5.5,
      "reserved_qty": 7.625,
      "uom": "kg",
      "sequence": 1,
      "consume_whole_lp": false,
      "is_by_product": false,
      "yield_percent": null,
      "scrap_percent": 5.0,
      "condition_flags": null,
      "bom_item_id": "770e8400-e29b-41d4-a716-446655440000",
      "bom_version": 2,
      "notes": "Food-grade flour only",
      "created_at": "2025-12-20T10:00:00Z",
      "product": {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "code": "FLR-001",
        "name": "Flour",
        "product_type": "RM"
      }
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "wo_id": "123e4567-e89b-12d3-a456-426614174000",
      "product_id": "660e8400-e29b-41d4-a716-446655440001",
      "material_name": "Whey (By-product)",
      "required_qty": 0.0,
      "consumed_qty": 0.0,
      "reserved_qty": 0.0,
      "uom": "kg",
      "sequence": 2,
      "consume_whole_lp": false,
      "is_by_product": true,
      "yield_percent": 35.5,
      "scrap_percent": 0.0,
      "condition_flags": null,
      "bom_item_id": "770e8400-e29b-41d4-a716-446655440001",
      "bom_version": 2,
      "notes": null,
      "created_at": "2025-12-20T10:00:00Z",
      "product": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "code": "WHEY-001",
        "name": "Whey",
        "product_type": "FG"
      }
    }
  ],
  "total": 2,
  "bom_version": 2,
  "snapshot_at": "2025-12-20T10:00:00Z"
}
```

**Response Schema**:

| Field | Type | Description |
|-------|------|-------------|
| `materials` | Array | List of material items |
| `materials[].id` | UUID | Unique material record ID |
| `materials[].wo_id` | UUID | Parent work order ID |
| `materials[].product_id` | UUID | Component product ID |
| `materials[].material_name` | String | Denormalized product name (snapshot) |
| `materials[].required_qty` | Decimal | Scaled quantity from BOM |
| `materials[].consumed_qty` | Decimal | Consumed during production |
| `materials[].reserved_qty` | Decimal | Reserved from inventory |
| `materials[].uom` | String | Unit of measure (kg, L, boxes, etc.) |
| `materials[].sequence` | Integer | Display/BOM order |
| `materials[].consume_whole_lp` | Boolean | License plate consumption flag |
| `materials[].is_by_product` | Boolean | True if output product |
| `materials[].yield_percent` | Decimal \| null | By-product yield percentage |
| `materials[].scrap_percent` | Decimal | Waste percentage in scaling |
| `materials[].condition_flags` | Object \| null | Conditional item flags |
| `materials[].bom_item_id` | UUID \| null | Source BOM item for audit |
| `materials[].bom_version` | Integer \| null | BOM version at snapshot |
| `materials[].notes` | String \| null | Item notes |
| `materials[].created_at` | ISO8601 | Snapshot creation timestamp |
| `materials[].product` | Object \| null | Joined product data |
| `materials[].product.id` | UUID | Product ID |
| `materials[].product.code` | String | Product code |
| `materials[].product.name` | String | Product name |
| `materials[].product.product_type` | String | RM, ING, PKG, WIP, FG |
| `total` | Integer | Number of materials |
| `bom_version` | Integer \| null | BOM version at snapshot |
| `snapshot_at` | ISO8601 \| null | When snapshot was created |

**Error Responses**:

| Status | Code | Message | Cause |
|--------|------|---------|-------|
| 401 | `UNAUTHORIZED` | Unauthorized | No valid JWT token |
| 404 | `WO_NOT_FOUND` | Work order not found | WO doesn't exist or belongs to different org |
| 500 | `INTERNAL_ERROR` | Server error | Database error (rare) |

**Example Error Response**:

```json
{
  "status": 404,
  "error": "WO_NOT_FOUND",
  "message": "Work order not found"
}
```

**Performance**:
- Typical response time: 150-300ms
- Max response time: 500ms (for 200 materials)
- Indexed on: wo_id, organization_id

---

### POST /work-orders/:id/snapshot

Create or refresh BOM snapshot for a work order. Only allowed for draft/planned WOs.

**Endpoint Summary**:
- Method: `POST`
- Requires Auth: Yes
- Required Roles: owner, admin, planner, production_manager
- Rate Limit: 30 req/min

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Work Order ID |

**Request Body**:

None required. Uses the WO's existing `bom_id`.

**Request Headers**:

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Example Request**:

```bash
curl -X POST https://app.monopilot.io/api/planning/work-orders/123e4567-e89b-12d3-a456-426614174000/snapshot \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Example Response (200 OK)**:

```json
{
  "success": true,
  "materials_count": 10,
  "message": "Snapshot created with 10 materials"
}
```

**Response Schema**:

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | True if snapshot created/refreshed |
| `materials_count` | Integer | Number of materials in snapshot |
| `message` | String | Human-readable status message |

**Error Responses**:

| Status | Code | Message | Cause |
|--------|------|---------|-------|
| 400 | `NO_BOM_SELECTED` | Work order has no BOM selected | WO.bom_id is null |
| 401 | `UNAUTHORIZED` | Unauthorized | No valid JWT token |
| 403 | `FORBIDDEN` | Permission denied | User lacks required role |
| 404 | `WO_NOT_FOUND` | Work order not found | WO doesn't exist |
| 409 | `WO_RELEASED` | Cannot modify materials after WO is released | WO status in (released, in_progress, completed, closed) |
| 500 | `INTERNAL_ERROR` | Server error | Database or service error |

**Example Error Response**:

```json
{
  "status": 409,
  "error": "WO_RELEASED",
  "message": "Cannot modify materials after WO is released"
}
```

**Behavior**:
- If materials already exist: Deletes old records, creates new ones
- Atomicity: All-or-nothing operation via transaction
- Duration: 1-2 seconds for 100-item BOM

**Performance**:
- Typical response time: 1-2 seconds
- Max response time: 5 seconds (for 200-item BOM)
- Bottleneck: Database INSERT performance

---

## Operations Endpoints

### GET /work-orders/:wo_id/operations

Retrieve all operations for a work order, ordered by sequence.

**Endpoint Summary**:
- Method: `GET`
- Requires Auth: Yes
- Roles: All authenticated users
- Rate Limit: 100 req/min

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `wo_id` | UUID | Yes | Work Order ID |

**Query Parameters**:

None

**Request Headers**:

```
Authorization: Bearer <jwt_token>
```

**Example Request**:

```bash
curl -X GET https://app.monopilot.io/api/planning/work-orders/wo-123/operations \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Example Response (200 OK)**:

```json
{
  "operations": [
    {
      "id": "op-1",
      "wo_id": "wo-123",
      "sequence": 1,
      "operation_name": "Mix Ingredients",
      "description": "Combine all dry ingredients in mixer",
      "machine_id": "m-1",
      "machine_code": "MIXER-01",
      "machine_name": "Industrial Mixer",
      "line_id": "l-1",
      "line_code": "LINE-A",
      "line_name": "Production Line A",
      "expected_duration_minutes": 30,
      "expected_yield_percent": null,
      "actual_duration_minutes": null,
      "actual_yield_percent": null,
      "status": "pending",
      "started_at": null,
      "completed_at": null,
      "started_by": null,
      "completed_by": null,
      "started_by_user": null,
      "completed_by_user": null,
      "skip_reason": null,
      "notes": null,
      "created_at": "2025-12-20T10:00:00Z"
    },
    {
      "id": "op-2",
      "wo_id": "wo-123",
      "sequence": 2,
      "operation_name": "Bake",
      "description": "Bake in oven at 180C",
      "machine_id": "m-2",
      "machine_code": "OVEN-01",
      "machine_name": "Industrial Oven",
      "line_id": "l-1",
      "line_code": "LINE-A",
      "line_name": "Production Line A",
      "expected_duration_minutes": 45,
      "expected_yield_percent": 98.5,
      "actual_duration_minutes": 48,
      "actual_yield_percent": 97.2,
      "status": "completed",
      "started_at": "2025-12-20T11:00:00Z",
      "completed_at": "2025-12-20T11:48:00Z",
      "started_by": "user-1",
      "completed_by": "user-1",
      "started_by_user": {
        "name": "John Operator"
      },
      "completed_by_user": {
        "name": "John Operator"
      },
      "skip_reason": null,
      "notes": "Oven was running warm, baked 3 min extra",
      "created_at": "2025-12-20T10:00:00Z"
    }
  ],
  "total": 2
}
```

**Response Schema**:

| Field | Type | Description |
|-------|------|-------------|
| `operations` | Array | List of operations |
| `operations[].id` | UUID | Unique operation ID |
| `operations[].wo_id` | UUID | Parent work order ID |
| `operations[].sequence` | Integer | Operation order |
| `operations[].operation_name` | String | Operation title |
| `operations[].description` | String \| null | Additional context |
| `operations[].machine_id` | UUID \| null | Assigned machine |
| `operations[].machine_code` | String \| null | Machine code |
| `operations[].machine_name` | String \| null | Machine name |
| `operations[].line_id` | UUID \| null | Production line ID |
| `operations[].line_code` | String \| null | Line code |
| `operations[].line_name` | String \| null | Line name |
| `operations[].expected_duration_minutes` | Integer \| null | Planned duration |
| `operations[].expected_yield_percent` | Decimal \| null | Planned yield |
| `operations[].actual_duration_minutes` | Integer \| null | Recorded duration |
| `operations[].actual_yield_percent` | Decimal \| null | Recorded yield |
| `operations[].status` | String | pending, in_progress, completed, or skipped |
| `operations[].started_at` | ISO8601 \| null | When operation started |
| `operations[].completed_at` | ISO8601 \| null | When operation finished |
| `operations[].started_by` | UUID \| null | User who started |
| `operations[].completed_by` | UUID \| null | User who completed |
| `operations[].started_by_user` | Object \| null | User details (name only) |
| `operations[].completed_by_user` | Object \| null | User details (name only) |
| `operations[].skip_reason` | String \| null | Why operation was skipped |
| `operations[].notes` | String \| null | Production notes |
| `operations[].created_at` | ISO8601 | When operation was created |
| `total` | Integer | Total operations count |

**Error Responses**:

| Status | Code | Message | Cause |
|--------|------|---------|-------|
| 401 | `UNAUTHORIZED` | Unauthorized | No valid JWT token |
| 404 | `WO_NOT_FOUND` | Work order not found | WO doesn't exist |
| 500 | `INTERNAL_ERROR` | Server error | Database error |

---

### GET /work-orders/:wo_id/operations/:op_id

Retrieve full details of a single operation including calculated variances.

**Endpoint Summary**:
- Method: `GET`
- Requires Auth: Yes
- Roles: All authenticated users
- Rate Limit: 100 req/min

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `wo_id` | UUID | Yes | Work Order ID |
| `op_id` | UUID | Yes | Operation ID |

**Example Request**:

```bash
curl -X GET https://app.monopilot.io/api/planning/work-orders/wo-123/operations/op-2 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Example Response (200 OK)**:

```json
{
  "id": "op-2",
  "wo_id": "wo-123",
  "sequence": 2,
  "operation_name": "Bake",
  "description": "Bake in oven at 180C",
  "instructions": "1. Preheat oven to 180C\n2. Place product on rack\n3. Bake for 45 min\n4. Check color",
  "machine_id": "m-2",
  "machine": {
    "id": "m-2",
    "code": "OVEN-01",
    "name": "Industrial Oven"
  },
  "line_id": "l-1",
  "line": {
    "id": "l-1",
    "code": "LINE-A",
    "name": "Production Line A"
  },
  "expected_duration_minutes": 45,
  "expected_yield_percent": 98.5,
  "actual_duration_minutes": 48,
  "actual_yield_percent": 97.2,
  "duration_variance_minutes": 3,
  "yield_variance_percent": -1.3,
  "status": "completed",
  "started_at": "2025-12-20T11:00:00Z",
  "completed_at": "2025-12-20T11:48:00Z",
  "started_by": "user-1",
  "completed_by": "user-1",
  "started_by_user": {
    "id": "user-1",
    "name": "John Operator"
  },
  "completed_by_user": {
    "id": "user-1",
    "name": "John Operator"
  },
  "skip_reason": null,
  "notes": "Oven was running warm, baked 3 min extra",
  "created_at": "2025-12-20T10:00:00Z",
  "updated_at": "2025-12-20T11:48:00Z"
}
```

**Response Schema** (extends GET list):

Additional fields in detail response:

| Field | Type | Description |
|-------|------|-------------|
| `instructions` | String \| null | Detailed production instructions |
| `machine` | Object | Full machine details (not just name/code) |
| `line` | Object | Full line details (not just name/code) |
| `duration_variance_minutes` | Integer \| null | actual - expected duration |
| `yield_variance_percent` | Decimal \| null | actual - expected yield |
| `started_by_user.id` | UUID | User ID (full object in detail) |
| `completed_by_user.id` | UUID | User ID (full object in detail) |
| `updated_at` | ISO8601 | Last modification timestamp |

**Variance Interpretation**:
- `duration_variance_minutes > 0`: Operation took longer than expected
- `duration_variance_minutes < 0`: Operation finished ahead of schedule
- `yield_variance_percent > 0`: Yield exceeded expectations
- `yield_variance_percent < 0`: Yield below expectations

**Error Responses**:

| Status | Code | Message | Cause |
|--------|------|---------|-------|
| 401 | `UNAUTHORIZED` | Unauthorized | No valid JWT token |
| 404 | `WO_NOT_FOUND` | Work order not found | WO doesn't exist |
| 404 | `OPERATION_NOT_FOUND` | Operation not found | Operation doesn't exist for this WO |
| 500 | `INTERNAL_ERROR` | Server error | Database error |

---

### POST /work-orders/:wo_id/copy-routing

Manually trigger routing operations copy. Admin-only endpoint.

**Endpoint Summary**:
- Method: `POST`
- Requires Auth: Yes
- Required Roles: ADMIN, SUPER_ADMIN
- Rate Limit: 10 req/min

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `wo_id` | UUID | Yes | Work Order ID |

**Request Body**:

None required.

**Request Headers**:

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Example Request**:

```bash
curl -X POST https://app.monopilot.io/api/planning/work-orders/wo-123/copy-routing \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Example Response (200 OK)**:

```json
{
  "success": true,
  "operations_created": 5,
  "message": "5 operations copied from routing"
}
```

**Response Schema**:

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | Always true on success |
| `operations_created` | Integer | Number of operations copied (0 if already copied or no operations) |
| `message` | String | Human-readable status message |

**Special Cases**:
- Routing with 0 operations: Returns `operations_created: 0`, success: true
- Operations already copied (idempotent): Returns existing count, no duplicates
- wo_copy_routing setting disabled: Returns `operations_created: 0`
- No routing assigned: Returns `operations_created: 0`

**Example Response (Already Copied)**:

```json
{
  "success": true,
  "operations_created": 0,
  "message": "No operations copied (routing empty or already copied)"
}
```

**Error Responses**:

| Status | Code | Message | Cause |
|--------|------|---------|-------|
| 400 | `ROUTING_NOT_FOUND` | Routing not found | WO has no routing_id or routing doesn't exist |
| 401 | `UNAUTHORIZED` | Unauthorized | No valid JWT token |
| 403 | `FORBIDDEN` | Admin role required | User lacks ADMIN or SUPER_ADMIN role |
| 404 | `WO_NOT_FOUND` | Work order not found | WO doesn't exist |
| 500 | `INTERNAL_ERROR` | Server error | Database error |

**Example Error Response**:

```json
{
  "status": 403,
  "error": "FORBIDDEN",
  "message": "Admin role required"
}
```

---

## Code Examples

### JavaScript/TypeScript

**Fetch Materials**:

```typescript
async function getMaterials(woId: string) {
  const response = await fetch(
    `/api/planning/work-orders/${woId}/materials`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}

// Usage
const { materials, total } = await getMaterials('wo-123');
console.log(`WO has ${total} materials`);
```

**Refresh Snapshot**:

```typescript
async function refreshSnapshot(woId: string) {
  const response = await fetch(
    `/api/planning/work-orders/${woId}/snapshot`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}

// Usage
try {
  const result = await refreshSnapshot('wo-123');
  console.log(result.message); // "Snapshot created with 10 materials"
} catch (error) {
  console.error('Failed to refresh:', error.message);
}
```

**Get Operation Details**:

```typescript
async function getOperationDetail(woId: string, opId: string) {
  const response = await fetch(
    `/api/planning/work-orders/${woId}/operations/${opId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch operation');
  }

  return response.json();
}

// Usage
const operation = await getOperationDetail('wo-123', 'op-1');
if (operation) {
  console.log(`Variance: ${operation.duration_variance_minutes} min`);
}
```

### cURL

**Get Materials**:

```bash
curl -X GET "https://app.monopilot.io/api/planning/work-orders/wo-123/materials" \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: application/json"
```

**Refresh Snapshot**:

```bash
curl -X POST "https://app.monopilot.io/api/planning/work-orders/wo-123/snapshot" \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Get Operations List**:

```bash
curl -X GET "https://app.monopilot.io/api/planning/work-orders/wo-123/operations" \
  -H "Authorization: Bearer your_token_here"
```

**Copy Routing** (Admin):

```bash
curl -X POST "https://app.monopilot.io/api/planning/work-orders/wo-123/copy-routing" \
  -H "Authorization: Bearer your_admin_token" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## Rate Limiting

All endpoints are rate-limited per organization per minute:

| Endpoint | Limit | Note |
|----------|-------|------|
| GET /work-orders/:id/materials | 100 req/min | Reads only |
| POST /work-orders/:id/snapshot | 30 req/min | Writes to database |
| GET /work-orders/:wo_id/operations | 100 req/min | Reads only |
| GET /work-orders/:wo_id/operations/:op_id | 100 req/min | Reads only |
| POST /work-orders/:wo_id/copy-routing | 10 req/min | Admin write |

Rate limit exceeded returns 429 Too Many Requests.

---

## Versioning

Current API version: **v1** (production)

This documentation covers v1 endpoints. Future versions will be announced with deprecation notice.

---

## Related Documentation

- **Technical Architecture**: [WO Materials & Operations Technical](../technical/wo-materials-operations.md)
- **User Guide**: [Work Order Materials & Operations](../../4-USER-GUIDE/planning/work-order-materials-operations.md)
- **Developer Guide**: [WO Materials & Operations Dev Guide](../dev-guide/wo-materials-operations-dev-guide.md)
