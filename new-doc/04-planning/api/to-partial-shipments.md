# Transfer Order Partial Shipments API Reference

**Story**: 03.9a - TO Partial Shipments (Basic)
**Module**: Planning
**Version**: 1.0.0
**Last Updated**: December 2025

## Overview

This API enables warehouse staff to ship and receive transfer orders in multiple batches with partial quantity support. The endpoints support incremental quantity tracking, allowing users to handle split shipments when full quantities are not immediately available.

**Key Features**:
- Partial shipment and receipt tracking
- Cumulative quantity updates (does not replace previous values)
- Automatic status transitions based on quantities
- Immutable audit trail (actual_ship_date, shipped_by, etc.)
- Multi-tenant isolation with org_id verification
- Request/response validation with Zod schemas

---

## Endpoints

### POST /api/planning/transfer-orders/:id/ship

Ship a transfer order (partial or full).

#### Request

```http
POST /api/planning/transfer-orders/:id/ship HTTP/1.1
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "actual_ship_date": "2024-12-16",
  "line_items": [
    {
      "to_line_id": "uuid-1",
      "ship_qty": 10
    },
    {
      "to_line_id": "uuid-2",
      "ship_qty": 5
    }
  ],
  "notes": "Shipped via truck #42"
}
```

#### Request Body

| Field | Type | Required | Validation | Description |
|-------|------|----------|-----------|-------------|
| `actual_ship_date` | string | Yes | ISO date (YYYY-MM-DD), must not be in future | Date shipment was performed |
| `line_items` | array | Yes | Min 1 item, at least one with ship_qty > 0 | Lines being shipped |
| `line_items[].to_line_id` | string | Yes | Valid UUID | Transfer order line ID |
| `line_items[].ship_qty` | number | Yes | Positive, max 99999.9999 | Quantity to ship |
| `notes` | string | No | Max 1000 characters | Optional shipment notes |

#### Response (Success)

**Status**: 200 OK

```json
{
  "success": true,
  "transfer_order": {
    "id": "uuid-to-42",
    "to_number": "TO-2024-00042",
    "status": "shipped",
    "from_warehouse_id": "uuid-wh-main",
    "to_warehouse_id": "uuid-wh-branch-a",
    "planned_ship_date": "2024-12-20",
    "actual_ship_date": "2024-12-16",
    "shipped_by": "uuid-user-1",
    "lines": [
      {
        "id": "uuid-line-1",
        "product_id": "uuid-product-1",
        "quantity": 10,
        "shipped_qty": 10,
        "received_qty": 0
      },
      {
        "id": "uuid-line-2",
        "product_id": "uuid-product-2",
        "quantity": 5,
        "shipped_qty": 5,
        "received_qty": 0
      }
    ],
    "updated_at": "2024-12-16T10:30:00Z"
  },
  "message": "Transfer Order TO-2024-00042 shipped successfully"
}
```

#### Response (Error)

**Status**: 400 Bad Request

```json
{
  "error": "Ship quantity exceeds remaining quantity for line uuid-1",
  "details": [
    {
      "path": ["line_items", 0, "ship_qty"],
      "message": "Positive number expected",
      "code": "too_big"
    }
  ]
}
```

**Status**: 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

**Status**: 404 Not Found

```json
{
  "error": "Transfer Order or TO line not found"
}
```

**Status**: 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

#### Status Codes and Errors

| Status | Code | Message | When | Solution |
|--------|------|---------|------|----------|
| 400 | `INVALID_QUANTITY` | Ship quantity exceeds remaining quantity | shipped_qty + ship_qty > quantity | Reduce ship_qty to remaining quantity |
| 400 | `INVALID_QUANTITY` | At least one line must have quantity > 0 | All line ship_qty = 0 | Enter quantity > 0 for at least one line |
| 400 | `INVALID_STATUS` | Cannot ship Transfer Order with status: {status} | TO status in (received, closed, cancelled) | Check TO status before shipping |
| 400 | (Zod Error) | Invalid request data | Request body fails Zod validation | Verify date format (YYYY-MM-DD), uuid format, numbers are numeric |
| 401 | `UNAUTHORIZED` | Unauthorized | No JWT token or invalid session | Authenticate and provide valid JWT token |
| 403 | `FORBIDDEN` | Insufficient permissions | User lacks warehouse_operator role | Contact admin to grant warehouse role |
| 404 | `NOT_FOUND` | Transfer Order or TO line not found | TO ID or line ID not found, or wrong org | Verify TO ID and line IDs exist in your organization |
| 500 | (Internal) | Internal server error | Database error, server exception | Check server logs, retry operation |

---

### POST /api/planning/transfer-orders/:id/receive

Receive a transfer order (partial or full).

#### Request

```http
POST /api/planning/transfer-orders/:id/receive HTTP/1.1
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "receipt_date": "2024-12-18",
  "line_items": [
    {
      "to_line_id": "uuid-1",
      "receive_qty": 10
    },
    {
      "to_line_id": "uuid-2",
      "receive_qty": 3
    }
  ],
  "notes": "Received at warehouse branch-a"
}
```

#### Request Body

| Field | Type | Required | Validation | Description |
|-------|------|----------|-----------|-------------|
| `receipt_date` | string | Yes | ISO date (YYYY-MM-DD), must not be in future | Date items were received |
| `line_items` | array | Yes | Min 1 item, at least one with receive_qty > 0 | Lines being received |
| `line_items[].to_line_id` | string | Yes | Valid UUID | Transfer order line ID |
| `line_items[].receive_qty` | number | Yes | Positive, max 99999.9999 | Quantity to receive |
| `notes` | string | No | Max 1000 characters | Optional receipt notes |

#### Response (Success)

**Status**: 200 OK

```json
{
  "success": true,
  "transfer_order": {
    "id": "uuid-to-42",
    "to_number": "TO-2024-00042",
    "status": "partially_received",
    "from_warehouse_id": "uuid-wh-main",
    "to_warehouse_id": "uuid-wh-branch-a",
    "planned_receive_date": "2024-12-22",
    "actual_receive_date": "2024-12-18",
    "received_by": "uuid-user-2",
    "lines": [
      {
        "id": "uuid-line-1",
        "product_id": "uuid-product-1",
        "quantity": 10,
        "shipped_qty": 10,
        "received_qty": 10
      },
      {
        "id": "uuid-line-2",
        "product_id": "uuid-product-2",
        "quantity": 5,
        "shipped_qty": 5,
        "received_qty": 3
      }
    ],
    "updated_at": "2024-12-18T14:45:00Z"
  },
  "message": "Transfer Order TO-2024-00042 received successfully"
}
```

#### Response (Error)

**Status**: 400 Bad Request - Cannot receive more than shipped

```json
{
  "error": "Receive quantity exceeds shipped quantity for line uuid-2",
  "details": [
    {
      "path": ["line_items", 1, "receive_qty"],
      "message": "Quantity cannot exceed shipped amount",
      "code": "too_big"
    }
  ]
}
```

**Status**: 400 Bad Request - No items shipped

```json
{
  "error": "Cannot receive line uuid-3: no items have been shipped yet"
}
```

#### Status Codes and Errors

| Status | Code | Message | When | Solution |
|--------|------|---------|------|----------|
| 400 | `INVALID_QUANTITY` | Receive quantity exceeds shipped quantity | received_qty + receive_qty > shipped_qty | Reduce receive_qty to shipped quantity |
| 400 | `INVALID_QUANTITY` | Cannot receive line X: no items have been shipped yet | Attempting to receive before shipment (CRITICAL-SEC-01) | Ship items first, then receive |
| 400 | `INVALID_QUANTITY` | At least one line must have quantity > 0 | All line receive_qty = 0 | Enter quantity > 0 for at least one line |
| 400 | `INVALID_STATUS` | Cannot receive Transfer Order with status: {status} | TO status in (draft, planned, received, closed, cancelled) | TO must be shipped before receiving |
| 400 | (Zod Error) | Invalid request data | Request body fails Zod validation | Verify date format (YYYY-MM-DD), uuid format, numbers are numeric |
| 401 | `UNAUTHORIZED` | Unauthorized | No JWT token or invalid session | Authenticate and provide valid JWT token |
| 403 | `FORBIDDEN` | Insufficient permissions | User lacks warehouse_operator role | Contact admin to grant warehouse role |
| 404 | `NOT_FOUND` | Transfer Order or TO line not found | TO ID or line ID not found, or wrong org | Verify TO ID and line IDs exist in your organization |
| 500 | (Internal) | Internal server error | Database error, server exception | Check server logs, retry operation |

---

## Status Transitions

### Ship Operation

Automatically determines status after shipping:

```
PLANNED
  → PARTIALLY_SHIPPED (if any line has remaining quantity)
  → SHIPPED (if all lines fully shipped: shipped_qty >= quantity)

PARTIALLY_SHIPPED
  → PARTIALLY_SHIPPED (if any line still has remaining)
  → SHIPPED (if all lines now fully shipped)
```

**Logic**:
```typescript
if (allLines.every(l => l.shipped_qty >= l.quantity)) {
  status = 'shipped'
} else {
  status = 'partially_shipped'
}
```

### Receive Operation

Automatically determines status after receiving:

```
SHIPPED
  → PARTIALLY_RECEIVED (if any line has unrecieved shipped quantity)
  → RECEIVED (if all lines fully received: received_qty >= shipped_qty)

PARTIALLY_SHIPPED
  → PARTIALLY_RECEIVED (can receive while TO is still shipping)

PARTIALLY_RECEIVED
  → PARTIALLY_RECEIVED (if any line still has unrecieved)
  → RECEIVED (if all lines now fully received)
```

**Logic**:
```typescript
if (allLines.every(l => l.received_qty >= l.shipped_qty)) {
  status = 'received'
} else {
  status = 'partially_received'
}
```

---

## Security Considerations

### Critical Security Fixes (Implemented)

#### CRITICAL-SEC-01: Prevent Pre-Ship Receiving
**Issue**: Users could receive items that haven't been shipped yet, violating physical inventory constraints.
**Fix**: Validation prevents receiving when shipped_qty = 0.
```typescript
if (actionType === 'receive' && maxQty === 0) {
  return error(`Cannot receive line: no items have been shipped yet`)
}
```
**Impact**: Blocks invalid receipt operations at API layer.

#### CRITICAL-SEC-02: Multi-Tenant Isolation via org_id
**Issue**: RLS policies could be bypassed if org_id filtering is missing in service layer.
**Fix**: All queries include org_id filter before accessing sensitive data.
```typescript
const orgId = await getCurrentOrgId() // Fetch from auth context
const { data } = await supabaseAdmin
  .from('transfer_orders')
  .select(...)
  .eq('id', transferOrderId)
  .eq('org_id', orgId) // CRITICAL: org_id filter
  .single()
```
**Impact**: Prevents cross-tenant data access.

#### MAJOR-BUG-01: Response Consistency
**Issue**: Ship endpoint didn't include `success` field in response, breaking client logic.
**Fix**: Added `success: true` field to ship response.
```typescript
return NextResponse.json({
  success: true,  // Now consistent with receive endpoint
  transfer_order: result.data,
  message: `...`
})
```
**Impact**: Standardizes API responses across both endpoints.

### Additional Security Measures

1. **Authentication Required**: All endpoints require valid JWT token (status 401 if missing)
2. **Role-Based Access Control**: Users need `warehouse_operator` or `admin` role (status 403 if missing)
3. **Input Validation**: All inputs validated with Zod schemas before processing
4. **Idempotent Design**: Multiple requests with same data accumulate (don't duplicate)
5. **Immutable Audit Fields**: `actual_ship_date` and `shipped_by` set once and never changed

---

## Quantity Rules

### Ship Operation
- **Rule**: `shipped_qty + ship_qty <= quantity`
- **Example**: Line ordered 100 units, already shipped 60. Can ship max 40 more.
- **Validation Error**: "Ship quantity exceeds remaining quantity for line X"

### Receive Operation
- **Rule**: `received_qty + receive_qty <= shipped_qty`
- **Example**: Line shipped 100 units, already received 60. Can receive max 40 more.
- **Validation Error**: "Receive quantity exceeds shipped quantity for line X"

### Zero Quantity Prevention
- **Rule**: At least one line must have quantity > 0
- **Why**: Empty shipments are meaningless and waste server resources
- **Validation Error**: "At least one line must have quantity > 0"

---

## Audit Trail

### Ship Operation Fields
When a transfer order is shipped:
- `actual_ship_date`: Set on FIRST shipment only (immutable, never updated)
- `shipped_by`: Set to current user ID on FIRST shipment only (immutable)
- `updated_at`: Updated to current timestamp with every shipment
- `updated_by`: Set to current user ID with every shipment

**Example**:
```json
{
  "actual_ship_date": "2024-12-16",
  "shipped_by": "uuid-user-1",
  "updated_at": "2024-12-16T10:30:00Z",
  "updated_by": "uuid-user-1"
}
```

After additional shipment on Dec 18:
```json
{
  "actual_ship_date": "2024-12-16",  // Still the original date
  "shipped_by": "uuid-user-1",        // Still the original user
  "updated_at": "2024-12-18T14:00:00Z", // Updated timestamp
  "updated_by": "uuid-user-2"         // Different user
}
```

### Receive Operation Fields
When a transfer order is received:
- `actual_receive_date`: Set on FIRST receipt only (immutable, never updated)
- `received_by`: Set to current user ID on FIRST receipt only (immutable)
- `updated_at`: Updated to current timestamp with every receipt
- `updated_by`: Set to current user ID with every receipt

---

## Example Workflows

### Full Shipment → Full Receipt

1. **Create Transfer Order** (Status: PLANNED)
   - Line 1: Product A, qty 100
   - Line 2: Product B, qty 50

2. **Ship All** → POST /api/planning/transfer-orders/:id/ship
   ```json
   {
     "actual_ship_date": "2024-12-16",
     "line_items": [
       { "to_line_id": "line-1", "ship_qty": 100 },
       { "to_line_id": "line-2", "ship_qty": 50 }
     ]
   }
   ```
   - Status: SHIPPED (all lines fully shipped)
   - actual_ship_date: 2024-12-16
   - shipped_by: current user

3. **Receive All** → POST /api/planning/transfer-orders/:id/receive
   ```json
   {
     "receipt_date": "2024-12-18",
     "line_items": [
       { "to_line_id": "line-1", "receive_qty": 100 },
       { "to_line_id": "line-2", "receive_qty": 50 }
     ]
   }
   ```
   - Status: RECEIVED (all lines fully received)
   - actual_receive_date: 2024-12-18
   - received_by: current user

### Partial Shipment → Complete Later

1. **Create Transfer Order** (Status: PLANNED)
   - Line 1: Product A, qty 100
   - Line 2: Product B, qty 50

2. **Ship Partial** → POST /api/planning/transfer-orders/:id/ship
   ```json
   {
     "actual_ship_date": "2024-12-16",
     "line_items": [
       { "to_line_id": "line-1", "ship_qty": 60 },
       { "to_line_id": "line-2", "ship_qty": 50 }
     ]
   }
   ```
   - Status: PARTIALLY_SHIPPED (line 1 has remaining 40)
   - Line 1: shipped_qty = 60, remaining = 40
   - Line 2: shipped_qty = 50, remaining = 0

3. **Ship Remaining** → POST /api/planning/transfer-orders/:id/ship
   ```json
   {
     "actual_ship_date": "2024-12-18",
     "line_items": [
       { "to_line_id": "line-1", "ship_qty": 40 }
     ]
   }
   ```
   - Status: SHIPPED (all lines now fully shipped)
   - Line 1: shipped_qty = 100 (60 + 40), remaining = 0
   - actual_ship_date: Still 2024-12-16 (original date, immutable)

### Partial Receipt Across Multiple Days

1. **Transfer Order Status**: SHIPPED
   - Line 1: qty 100, shipped_qty 100
   - Line 2: qty 50, shipped_qty 50

2. **Receive Partial (Day 1)** → POST /api/planning/transfer-orders/:id/receive
   ```json
   {
     "receipt_date": "2024-12-18",
     "line_items": [
       { "to_line_id": "line-1", "receive_qty": 50 },
       { "to_line_id": "line-2", "receive_qty": 50 }
     ]
   }
   ```
   - Status: PARTIALLY_RECEIVED
   - Line 1: received_qty = 50, remaining = 50
   - Line 2: received_qty = 50, remaining = 0

3. **Receive Remaining (Day 2)** → POST /api/planning/transfer-orders/:id/receive
   ```json
   {
     "receipt_date": "2024-12-19",
     "line_items": [
       { "to_line_id": "line-1", "receive_qty": 50 }
     ]
   }
   ```
   - Status: RECEIVED (all lines now fully received)
   - Line 1: received_qty = 100 (50 + 50), remaining = 0
   - actual_receive_date: Still 2024-12-18 (original date, immutable)

---

## Validation Schemas

### ShipToSchema (Zod)

```typescript
export const shipToSchema = z.object({
  actual_ship_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .refine(
      date => new Date(date) <= new Date(),
      'Shipment date cannot be in the future'
    ),
  line_items: z.array(
    z.object({
      to_line_id: z.string().uuid('Invalid line ID'),
      ship_qty: z.number()
        .positive('Ship quantity must be greater than 0')
        .max(99999.9999, 'Ship quantity too large')
    })
  )
    .min(1, 'At least one line item required')
    .refine(
      items => items.some(item => item.ship_qty > 0),
      'At least one line must have quantity > 0'
    ),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional()
})

export type ShipToInput = z.infer<typeof shipToSchema>
```

### ReceiveTORequestSchema (Zod)

```typescript
export const receiveTORequestSchema = z.object({
  receipt_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .refine(
      date => new Date(date) <= new Date(),
      'Receipt date cannot be in the future'
    ),
  line_items: z.array(
    z.object({
      to_line_id: z.string().uuid('Invalid line ID'),
      receive_qty: z.number()
        .positive('Receive quantity must be greater than 0')
        .max(99999.9999, 'Receive quantity too large')
    })
  )
    .min(1, 'At least one line item required')
    .refine(
      items => items.some(item => item.receive_qty > 0),
      'At least one line must have quantity > 0'
    ),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional()
})

export type ReceiveTOInput = z.infer<typeof receiveTORequestSchema>
```

---

## Rate Limiting

Currently no rate limiting is enforced. However, expect future implementation:
- Ship operations: ~100 requests/minute per user
- Receive operations: ~100 requests/minute per user

Clients should implement exponential backoff for retry logic.

---

## Caching

Query results are cached at the organization level:
```
org:{orgId}:to:{toId}:detail          (30 second TTL)
org:{orgId}:to:{toId}:shipments       (30 second TTL)
org:{orgId}:to:{toId}:history         (1 minute TTL)
```

**Note**: Cache is automatically invalidated after ship/receive operations via React Query.

---

## Troubleshooting

### "Transfer Order not found" (404)

**Possible Causes**:
1. TO ID does not exist in your organization
2. User does not have access to that organization
3. TO was deleted

**Solution**: Verify TO ID is correct and user has appropriate org access.

### "Cannot ship this Transfer Order" (400 - INVALID_STATUS)

**Possible Causes**:
1. TO status is RECEIVED or CLOSED (already completed)
2. TO status is DRAFT (needs to be released first)

**Solution**: Check TO status. If DRAFT, release it first. If completed, no more shipments allowed.

### "Ship quantity exceeds remaining quantity" (400 - INVALID_QUANTITY)

**Possible Cause**: Total shipped (including this request) would exceed ordered quantity.

**Solution**: Calculate remaining quantity:
```
remaining = ordered_qty - already_shipped_qty
```
Reduce ship_qty to remaining amount.

### "Cannot receive line: no items have been shipped yet" (400 - CRITICAL-SEC-01)

**Possible Cause**: Attempting to receive items without shipping them first.

**Solution**: Ship items first, then receive. Cannot receive non-shipped quantities (CRITICAL-SEC-01).

### "Organization ID not found"

**Possible Cause**: Session/auth context is invalid or user org not determined.

**Solution**: Logout and login again to refresh auth session.

### "Insufficient permissions" (403 - FORBIDDEN)

**Possible Cause**: User lacks warehouse_operator role.

**Solution**: Contact organization admin to grant warehouse_operator or admin role.

---

## Performance Notes

- **Ship operation**: <500ms average (excludes network latency)
- **Receive operation**: <500ms average (excludes network latency)
- **Query plan**: Indexed on (org_id, id) for fast lookups
- **Batch size**: Recommend max 50 lines per request (API accepts up to 1000)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 2025 | Initial API documentation with security fixes |

---

## Related Resources

- Story: [03.9a - TO Partial Shipments (Basic)](../../2-MANAGEMENT/epics/current/03-planning/03.9a.to-partial-shipments.md)
- User Guide: [Transfer Order Partial Shipments](../../4-GUIDES/user/planning/to-partial-shipments.md)
- Developer Guide: [TO Partial Shipments Development](../../4-GUIDES/developer/planning/to-partial-shipments-development.md)
- Wireframes: [PLAN-012 - Transfer Order Detail](../ux/wireframes/PLAN-012-transfer-order-detail.md)
