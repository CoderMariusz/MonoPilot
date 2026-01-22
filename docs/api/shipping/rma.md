# RMA (Returns) API Reference

**Story:** 07.16 - RMA Core CRUD + Approval
**Version:** 1.0
**Last Updated:** 2026-01-22

## Overview

The RMA (Return Merchandise Authorization) API provides endpoints for managing customer returns. It supports the complete RMA lifecycle from creation through approval to closure, with line-level tracking for returned products.

## Base URL

All endpoints are relative to your app base URL:

```
https://your-domain.com/api
```

## Authentication

All endpoints require authentication. Include your session token in the request headers (automatically handled by Supabase client).

**Required Roles by Operation:**

| Operation | Roles |
|-----------|-------|
| View RMAs | Any authenticated user |
| Create/Edit/Delete | `sales`, `manager`, `admin`, `owner` |
| Approve | `manager`, `admin`, `owner` |
| Close | `manager`, `admin`, `owner` |

---

## RMA Endpoints

### GET /api/shipping/rma

List RMAs with filtering, search, and pagination.

**Performance Target:** < 500ms for up to 1000 RMAs

#### Request

```bash
curl -X GET "https://your-domain.com/api/shipping/rma?status=pending&limit=20&page=1" \
  -H "Content-Type: application/json"
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 20 | Items per page (10-100) |
| `search` | string | No | - | Search by RMA number |
| `status` | string | No | - | Filter by status |
| `reason_code` | string | No | - | Filter by reason code |
| `customer_id` | uuid | No | - | Filter by customer |
| `date_from` | string | No | - | Filter from date (YYYY-MM-DD) |
| `date_to` | string | No | - | Filter to date (YYYY-MM-DD) |
| `sort_by` | string | No | `created_at` | Sort field |
| `sort_order` | string | No | `desc` | Sort direction (asc/desc) |

#### Response (200 OK)

```json
{
  "rmas": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "org_id": "org-001",
      "rma_number": "RMA-2026-00001",
      "customer_id": "cust-001",
      "customer_name": "Acme Foods Inc.",
      "sales_order_id": "so-001",
      "reason_code": "damaged",
      "disposition": "scrap",
      "status": "pending",
      "notes": "Packaging damaged in transit",
      "total_value": 250.00,
      "approved_at": null,
      "approved_by": null,
      "created_at": "2026-01-22T10:30:00Z",
      "created_by": "user-001",
      "updated_at": "2026-01-22T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "pages": 3
  },
  "stats": {
    "pending_count": 12,
    "approved_count": 8,
    "total_count": 45
  }
}
```

---

### GET /api/shipping/rma/:id

Get a single RMA with lines and permissions.

**Performance Target:** < 300ms

#### Request

```bash
curl -X GET https://your-domain.com/api/shipping/rma/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json"
```

#### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "org_id": "org-001",
  "rma_number": "RMA-2026-00001",
  "customer_id": "cust-001",
  "customer_name": "Acme Foods Inc.",
  "sales_order_id": "so-001",
  "sales_order_number": "SO-2026-00045",
  "reason_code": "damaged",
  "disposition": "scrap",
  "status": "pending",
  "notes": "Packaging damaged in transit",
  "total_value": 250.00,
  "approved_at": null,
  "approved_by": null,
  "approved_by_name": null,
  "created_at": "2026-01-22T10:30:00Z",
  "created_by": "user-001",
  "created_by_name": "John Smith",
  "updated_at": "2026-01-22T10:30:00Z",
  "lines": [
    {
      "id": "line-001",
      "org_id": "org-001",
      "rma_request_id": "550e8400-e29b-41d4-a716-446655440000",
      "product_id": "prod-001",
      "product_name": "Whole Wheat Bread",
      "product_code": "BREAD-001",
      "quantity_expected": 50,
      "quantity_received": 0,
      "lot_number": "LOT-2026-001",
      "reason_notes": "Packages crushed",
      "disposition": null,
      "created_at": "2026-01-22T10:30:00Z"
    }
  ],
  "permissions": {
    "can_edit": true,
    "can_delete": true,
    "can_approve": true,
    "can_close": false,
    "can_add_lines": true
  }
}
```

#### Error Response (404 Not Found)

```json
{
  "error": "RMA not found"
}
```

---

### POST /api/shipping/rma

Create a new RMA with lines.

**Performance Target:** < 1000ms

#### Request

```bash
curl -X POST https://your-domain.com/api/shipping/rma \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "550e8400-e29b-41d4-a716-446655440001",
    "sales_order_id": "550e8400-e29b-41d4-a716-446655440002",
    "reason_code": "damaged",
    "disposition": "scrap",
    "notes": "Packaging damaged in transit",
    "lines": [
      {
        "product_id": "550e8400-e29b-41d4-a716-446655440003",
        "quantity_expected": 50,
        "lot_number": "LOT-2026-001",
        "reason_notes": "Packages crushed"
      }
    ]
  }'
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customer_id` | uuid | Yes | Customer ID |
| `sales_order_id` | uuid | No | Linked sales order ID |
| `reason_code` | enum | Yes | Reason for return |
| `disposition` | enum | No | Disposition action |
| `notes` | string | No | RMA notes (max 1000 chars) |
| `lines` | array | Yes | At least one line required |
| `lines[].product_id` | uuid | Yes | Product ID |
| `lines[].quantity_expected` | number | Yes | Expected quantity (positive) |
| `lines[].lot_number` | string | No | Lot number (max 100 chars) |
| `lines[].reason_notes` | string | No | Line reason (max 500 chars) |
| `lines[].disposition` | enum | No | Line-level disposition override |

**Reason Codes:**

| Code | Description | Default Disposition |
|------|-------------|---------------------|
| `damaged` | Product damaged | `scrap` |
| `expired` | Product expired | `scrap` |
| `wrong_product` | Wrong product shipped | `restock` |
| `quality_issue` | Quality problem | `quality_hold` |
| `customer_change` | Customer changed mind | `restock` |
| `other` | Other reason | (none) |

**Dispositions:**

| Code | Description |
|------|-------------|
| `restock` | Return to inventory |
| `scrap` | Dispose of product |
| `quality_hold` | Hold for quality inspection |
| `rework` | Send for rework |

#### Response (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "rma_number": "RMA-2026-00001",
  "status": "pending",
  ...
}
```

#### Error Responses

**Status: 400 Bad Request - Validation Error**

```json
{
  "error": "Validation failed",
  "details": [
    { "path": ["customer_id"], "message": "Invalid customer ID" },
    { "path": ["lines"], "message": "At least one line required" }
  ]
}
```

**Status: 400 Bad Request - Customer Not Found**

```json
{
  "error": "Customer not found"
}
```

---

### PUT /api/shipping/rma/:id

Update a pending RMA.

**Note:** Only pending RMAs can be updated.

#### Request

```bash
curl -X PUT https://your-domain.com/api/shipping/rma/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "reason_code": "expired",
    "disposition": "scrap",
    "notes": "Updated notes"
  }'
```

#### Response (200 OK)

Returns the updated RMA detail object.

#### Error Responses

**Status: 400 Bad Request - Invalid Status**

```json
{
  "error": "Cannot edit non-pending RMA"
}
```

**Status: 404 Not Found**

```json
{
  "error": "RMA not found"
}
```

---

### DELETE /api/shipping/rma/:id

Delete a pending RMA.

**Note:** Only pending RMAs can be deleted. Lines are deleted via cascade.

#### Request

```bash
curl -X DELETE https://your-domain.com/api/shipping/rma/550e8400-e29b-41d4-a716-446655440000
```

#### Response (204 No Content)

#### Error Responses

**Status: 400 Bad Request - Invalid Status**

```json
{
  "error": "Cannot delete non-pending RMA"
}
```

---

## Line Endpoints

### POST /api/shipping/rma/:id/lines

Add a line to a pending RMA.

#### Request

```bash
curl -X POST https://your-domain.com/api/shipping/rma/rma-001/lines \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "550e8400-e29b-41d4-a716-446655440003",
    "quantity_expected": 25,
    "lot_number": "LOT-2026-002",
    "reason_notes": "Different damage type"
  }'
```

#### Response (201 Created)

```json
{
  "id": "line-002",
  "rma_request_id": "rma-001",
  "product_id": "prod-002",
  "product_name": "Fresh Basil",
  "product_code": "BASIL-001",
  "quantity_expected": 25,
  "quantity_received": 0,
  "lot_number": "LOT-2026-002",
  "reason_notes": "Different damage type",
  "disposition": null,
  "created_at": "2026-01-22T11:00:00Z"
}
```

---

### PUT /api/shipping/rma/:id/lines/:lineId

Update an RMA line (pending RMA only).

#### Request

```bash
curl -X PUT https://your-domain.com/api/shipping/rma/rma-001/lines/line-001 \
  -H "Content-Type: application/json" \
  -d '{
    "quantity_expected": 40,
    "reason_notes": "Updated notes"
  }'
```

#### Response (200 OK)

Returns the updated line object.

---

### DELETE /api/shipping/rma/:id/lines/:lineId

Delete an RMA line (pending RMA only).

#### Response (204 No Content)

---

## Workflow Endpoints

### POST /api/shipping/rma/:id/approve

Approve a pending RMA.

**Required Role:** Manager or above

**Preconditions:**
- RMA must have status `pending`
- RMA must have at least one line

#### Request

```bash
curl -X POST https://your-domain.com/api/shipping/rma/rma-001/approve \
  -H "Content-Type: application/json"
```

#### Response (200 OK)

```json
{
  "id": "rma-001",
  "rma_number": "RMA-2026-00001",
  "status": "approved",
  "approved_at": "2026-01-22T12:00:00Z",
  "approved_by": "user-001",
  "approved_by_name": "John Manager",
  ...
}
```

#### Error Responses

**Status: 400 Bad Request - Invalid Status**

```json
{
  "error": "RMA is not pending"
}
```

**Status: 400 Bad Request - No Lines**

```json
{
  "error": "RMA must have at least one line"
}
```

**Status: 403 Forbidden**

```json
{
  "error": "Only MANAGER+ can approve"
}
```

---

### POST /api/shipping/rma/:id/close

Close an approved RMA.

**Required Role:** Manager or above

**Preconditions:**
- RMA must have status `approved`, `receiving`, `received`, or `processed`

#### Request

```bash
curl -X POST https://your-domain.com/api/shipping/rma/rma-001/close \
  -H "Content-Type: application/json"
```

#### Response (200 OK)

```json
{
  "id": "rma-001",
  "rma_number": "RMA-2026-00001",
  "status": "closed",
  ...
}
```

#### Error Responses

**Status: 400 Bad Request - Invalid Status**

```json
{
  "error": "Cannot close pending RMA - must be approved first"
}
```

---

## Status Workflow

RMA status follows a one-way progression:

```
pending -> approved -> receiving -> received -> processed -> closed
```

| Status | Description | Allowed Actions |
|--------|-------------|-----------------|
| `pending` | Newly created, awaiting approval | Edit, Delete, Approve |
| `approved` | Approved, ready for receiving | Close |
| `receiving` | Receiving in progress (Story 07.17) | Close |
| `received` | All items received | Close |
| `processed` | Dispositions completed (Story 07.18) | Close |
| `closed` | Finalized | None |

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | RMA not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `INVALID_STATUS` | 400 | Cannot perform action on current status |
| `NO_LINES` | 400 | RMA must have at least one line |
| `CUSTOMER_NOT_FOUND` | 400 | Invalid customer ID |
| `PRODUCT_NOT_FOUND` | 400 | Invalid product ID |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Code Examples

### TypeScript/React

```typescript
// List RMAs with filters
async function listRMAs(params: {
  status?: string
  customer_id?: string
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.append(key, String(value))
  })

  const response = await fetch(`/api/shipping/rma?${query}`)
  return response.json()
}

// Create RMA with lines
async function createRMA(data: {
  customer_id: string
  reason_code: string
  disposition?: string
  sales_order_id?: string
  notes?: string
  lines: Array<{
    product_id: string
    quantity_expected: number
    lot_number?: string
    reason_notes?: string
  }>
}) {
  const response = await fetch('/api/shipping/rma', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create RMA')
  }

  return response.json()
}

// Approve RMA
async function approveRMA(rmaId: string) {
  const response = await fetch(`/api/shipping/rma/${rmaId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to approve RMA')
  }

  return response.json()
}

// Add line to RMA
async function addRMALine(
  rmaId: string,
  line: {
    product_id: string
    quantity_expected: number
    lot_number?: string
    reason_notes?: string
  }
) {
  const response = await fetch(`/api/shipping/rma/${rmaId}/lines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(line),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to add line')
  }

  return response.json()
}
```

### Complete RMA Creation Flow

```typescript
async function createRMAWithApproval() {
  // Step 1: Create RMA with lines
  const rma = await createRMA({
    customer_id: 'cust-001',
    reason_code: 'damaged',
    disposition: 'scrap',
    notes: 'Damaged in transit',
    lines: [
      {
        product_id: 'prod-001',
        quantity_expected: 50,
        lot_number: 'LOT-2026-001',
        reason_notes: 'Packages crushed',
      },
      {
        product_id: 'prod-002',
        quantity_expected: 25,
        reason_notes: 'Water damage',
      },
    ],
  })

  console.log('RMA created:', rma.rma_number) // RMA-2026-00001

  // Step 2: Approve RMA (requires Manager+ role)
  const approved = await approveRMA(rma.id)

  console.log('RMA approved:', approved.status) // approved
  console.log('Approved at:', approved.approved_at)
  console.log('Approved by:', approved.approved_by_name)

  return approved
}
```

---

## Request/Response Schemas

### RMA

```typescript
interface RMA {
  id: string
  org_id: string
  rma_number: string                 // Auto: RMA-YYYY-NNNNN
  customer_id: string
  customer_name?: string
  sales_order_id: string | null
  sales_order_number?: string | null
  reason_code: RMAReasonCode
  disposition: RMADisposition | null
  status: RMAStatus
  notes: string | null
  total_value: number | null
  approved_at: string | null         // ISO 8601
  approved_by: string | null
  approved_by_name?: string | null
  created_at: string                 // ISO 8601
  created_by: string
  created_by_name?: string
  updated_at: string                 // ISO 8601
}

type RMAReasonCode =
  | 'damaged'
  | 'expired'
  | 'wrong_product'
  | 'quality_issue'
  | 'customer_change'
  | 'other'

type RMADisposition =
  | 'restock'
  | 'scrap'
  | 'quality_hold'
  | 'rework'

type RMAStatus =
  | 'pending'
  | 'approved'
  | 'receiving'
  | 'received'
  | 'processed'
  | 'closed'
```

### RMALine

```typescript
interface RMALine {
  id: string
  org_id: string
  rma_request_id: string
  product_id: string
  product_name?: string
  product_code?: string
  quantity_expected: number          // DECIMAL(15,4)
  quantity_received: number          // DECIMAL(15,4), default 0
  lot_number: string | null
  reason_notes: string | null
  disposition: RMADisposition | null // Override RMA-level
  created_at: string                 // ISO 8601
}
```

### RMAPermissions

```typescript
interface RMAPermissions {
  can_edit: boolean       // true if pending
  can_delete: boolean     // true if pending
  can_approve: boolean    // true if pending and user is Manager+
  can_close: boolean      // true if approved+ and user is Manager+
  can_add_lines: boolean  // true if pending
}
```

---

## RMA Number Rules

RMA numbers follow these rules:

- **Format:** `RMA-YYYY-NNNNN` (e.g., RMA-2026-00001)
- **Year:** Current year at creation
- **Sequence:** 5-digit number, padded with zeros
- **Scope:** Sequence resets per year, per organization
- **Uniqueness:** Unique within organization
- **Immutable:** Cannot be changed after creation
- **Auto-generated:** Created by database trigger

---

## Related Documentation

- [RMA Workflow Guide](../../guides/shipping/rma-workflow.md)
- [Customers API](./customers.md) (Story 07.1)
- [Sales Orders API](./sales-orders.md) (Story 07.2)

---

## Support

**Story:** 07.16
**Last Updated:** 2026-01-22
