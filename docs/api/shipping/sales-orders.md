# Sales Orders API Reference

**Story:** 07.2 - Sales Orders Core
**Version:** 1.0
**Last Updated:** 2026-01-22

## Overview

The Sales Orders API provides endpoints for creating, managing, and tracking customer sales orders. This API supports the complete order lifecycle from draft creation through confirmation, with line-level pricing and automatic total calculations.

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
| View orders | Any authenticated user |
| Create/Edit/Confirm | `sales`, `manager`, `admin`, `owner` |
| Delete (draft only) | `manager`, `admin`, `owner` |
| Hold/Cancel | See Story 07.3 |

---

## Endpoints

### GET /api/shipping/sales-orders

List sales orders with filtering and pagination.

**Performance Target:** < 500ms for up to 1000 orders

#### Request

```bash
curl -X GET "https://your-domain.com/api/shipping/sales-orders?status=draft&limit=25&page=1" \
  -H "Content-Type: application/json"
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 25 | Items per page (max 100) |
| `search` | string | No | - | Search by order number or customer name |
| `customer_id` | UUID | No | - | Filter by customer |
| `status` | string | No | - | Filter by status (draft, confirmed, etc.) |
| `start_date` | date | No | - | Order date from (YYYY-MM-DD) |
| `end_date` | date | No | - | Order date to (YYYY-MM-DD) |
| `sortBy` | string | No | `created_at` | Sort field |
| `sortOrder` | string | No | `desc` | Sort direction (asc/desc) |

#### Response (200 OK)

```json
{
  "data": {
    "sales_orders": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "order_number": "SO-2026-00001",
        "customer_id": "cust-001",
        "customer_name": "Acme Corp",
        "status": "draft",
        "order_date": "2026-01-22",
        "required_delivery_date": "2026-01-29",
        "total_amount": 1050.00,
        "line_count": 3,
        "created_at": "2026-01-22T10:30:00Z"
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 25
  }
}
```

---

### GET /api/shipping/sales-orders/:id

Get a single sales order with lines and related data.

**Performance Target:** < 300ms

#### Request

```bash
curl -X GET https://your-domain.com/api/shipping/sales-orders/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json"
```

#### Response (200 OK)

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "order_number": "SO-2026-00001",
    "org_id": "org-001",
    "customer_id": "cust-001",
    "customer": {
      "id": "cust-001",
      "name": "Acme Corp",
      "code": "ACME"
    },
    "shipping_address_id": "addr-001",
    "shipping_address": {
      "id": "addr-001",
      "street": "123 Main St",
      "city": "Springfield",
      "state": "IL",
      "zip": "62701"
    },
    "status": "draft",
    "order_date": "2026-01-22",
    "required_delivery_date": "2026-01-29",
    "customer_po": "PO-12345",
    "notes": "Rush order",
    "total_amount": 1050.00,
    "line_count": 2,
    "lines": [
      {
        "id": "line-001",
        "line_number": 1,
        "product_id": "prod-001",
        "product": {
          "id": "prod-001",
          "code": "WF-001",
          "name": "Wheat Flour 25kg"
        },
        "quantity_ordered": 100,
        "quantity_allocated": 0,
        "unit_price": 10.00,
        "discount": null,
        "line_total": 1000.00,
        "notes": null
      },
      {
        "id": "line-002",
        "line_number": 2,
        "product_id": "prod-002",
        "product": {
          "id": "prod-002",
          "code": "SG-001",
          "name": "Sugar 10kg"
        },
        "quantity_ordered": 10,
        "quantity_allocated": 0,
        "unit_price": 5.00,
        "discount": null,
        "line_total": 50.00,
        "notes": null
      }
    ],
    "created_at": "2026-01-22T10:30:00Z",
    "updated_at": "2026-01-22T10:35:00Z",
    "confirmed_at": null
  }
}
```

#### Error Response (404 Not Found)

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Sales order not found"
  }
}
```

---

### POST /api/shipping/sales-orders

Create a new sales order with lines.

**Performance Target:** < 1000ms

#### Request

```bash
curl -X POST https://your-domain.com/api/shipping/sales-orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "cust-001",
    "shipping_address_id": "addr-001",
    "order_date": "2026-01-22",
    "required_delivery_date": "2026-01-29",
    "customer_po": "PO-12345",
    "notes": "Rush order",
    "lines": [
      {
        "product_id": "prod-001",
        "quantity_ordered": 100,
        "unit_price": 10.00
      },
      {
        "product_id": "prod-002",
        "quantity_ordered": 10,
        "unit_price": 5.00
      }
    ]
  }'
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customer_id` | UUID | Yes | Customer ID |
| `shipping_address_id` | UUID | Yes | Shipping address ID |
| `order_date` | date | Yes | Order date (YYYY-MM-DD) |
| `required_delivery_date` | date | No | Required delivery date |
| `customer_po` | string | No | Customer PO number (max 100 chars) |
| `notes` | string | No | Order notes (max 1000 chars) |
| `lines` | array | Yes | Order lines (min 1) |
| `lines[].product_id` | UUID | Yes | Product ID |
| `lines[].quantity_ordered` | decimal | Yes | Quantity (> 0) |
| `lines[].unit_price` | decimal | No | Unit price (auto-populates from product if omitted) |
| `lines[].discount` | object | No | Discount `{type: 'percent'|'fixed', value: number}` |
| `lines[].requested_lot` | string | No | Requested lot/batch (max 100 chars) |
| `lines[].notes` | string | No | Line notes (max 500 chars) |

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "order_number": "SO-2026-00001",
    "status": "draft",
    "total_amount": 1050.00,
    "lines": [...]
  }
}
```

#### Error Responses

**Status: 400 Bad Request - Validation Error**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "customer_id", "message": "Customer is required" },
      { "field": "lines", "message": "Order must have at least one line" }
    ]
  }
}
```

---

### PUT /api/shipping/sales-orders/:id

Update a sales order (draft status only).

#### Request

```bash
curl -X PUT https://your-domain.com/api/shipping/sales-orders/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "customer_po": "PO-67890",
    "required_delivery_date": "2026-01-30",
    "notes": "Updated delivery date"
  }'
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `shipping_address_id` | UUID | No | New shipping address |
| `customer_po` | string | No | Customer PO number |
| `required_delivery_date` | date | No | Required delivery date |
| `notes` | string | No | Order notes |

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "order_number": "SO-2026-00001",
    "status": "draft",
    ...
  }
}
```

#### Error Response (403 Forbidden)

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Cannot modify non-draft sales order"
  }
}
```

---

### DELETE /api/shipping/sales-orders/:id

Delete a sales order (draft status only).

#### Request

```bash
curl -X DELETE https://your-domain.com/api/shipping/sales-orders/550e8400-e29b-41d4-a716-446655440000
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Sales order deleted"
}
```

#### Error Response (403 Forbidden)

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Cannot delete confirmed orders. Contact administrator."
  }
}
```

---

## Line Endpoints

### GET /api/shipping/sales-orders/:id/lines

List all lines for a sales order.

#### Response (200 OK)

```json
{
  "data": [
    {
      "id": "line-001",
      "line_number": 1,
      "product_id": "prod-001",
      "product": {
        "id": "prod-001",
        "code": "WF-001",
        "name": "Wheat Flour 25kg",
        "std_price": 10.00
      },
      "quantity_ordered": 100,
      "quantity_allocated": 0,
      "unit_price": 10.00,
      "discount": null,
      "line_total": 1000.00,
      "notes": null
    }
  ]
}
```

---

### POST /api/shipping/sales-orders/:id/lines

Add a new line to a sales order (draft only).

#### Request

```bash
curl -X POST https://your-domain.com/api/shipping/sales-orders/550e8400-e29b-41d4-a716-446655440000/lines \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "prod-003",
    "quantity_ordered": 50,
    "unit_price": 15.00,
    "discount": { "type": "percent", "value": 10 }
  }'
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `product_id` | UUID | Yes | Product ID |
| `quantity_ordered` | decimal | Yes | Quantity (> 0) |
| `unit_price` | decimal | No | Unit price (auto from product.std_price) |
| `discount` | object | No | Discount `{type, value}` |
| `requested_lot` | string | No | Requested lot number |
| `notes` | string | No | Line notes |

#### Response (201 Created)

```json
{
  "success": true,
  "line": {
    "id": "line-003",
    "line_number": 3,
    "product_id": "prod-003",
    "quantity_ordered": 50,
    "unit_price": 15.00,
    "discount": { "type": "percent", "value": 10 },
    "line_total": 675.00
  },
  "so_total": 1725.00
}
```

---

### PUT /api/shipping/sales-orders/:id/lines/:lineId

Update a line (draft only).

#### Request

```bash
curl -X PUT https://your-domain.com/api/shipping/sales-orders/so-001/lines/line-001 \
  -H "Content-Type: application/json" \
  -d '{
    "quantity_ordered": 150,
    "discount": { "type": "fixed", "value": 50 }
  }'
```

#### Response (200 OK)

```json
{
  "success": true,
  "line": {
    "id": "line-001",
    "line_number": 1,
    "quantity_ordered": 150,
    "unit_price": 10.00,
    "discount": { "type": "fixed", "value": 50 },
    "line_total": 1450.00
  },
  "so_total": 2175.00
}
```

---

### DELETE /api/shipping/sales-orders/:id/lines/:lineId

Delete a line (draft only). Recalculates order total.

#### Response (200 OK)

```json
{
  "success": true,
  "so_total": 1050.00
}
```

---

## Status Endpoints

### PATCH /api/shipping/sales-orders/:id/status

Change sales order status (hold, cancel, confirm).

See [SO Status Workflow API](./so-status.md) for details.

**Quick Reference:**

| Action | Body | Result |
|--------|------|--------|
| `confirm` | `{"action": "confirm"}` | draft -> confirmed |
| `hold` | `{"action": "hold", "reason": "..."}` | draft/confirmed -> on_hold |
| `cancel` | `{"action": "cancel", "reason": "..."}` | draft/confirmed/on_hold -> cancelled |

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Sales order not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `INVALID_STATUS` | 400 | Invalid status transition |
| `PRODUCT_NOT_FOUND` | 400 | Product not found or no std_price |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Code Examples

### TypeScript/React

```typescript
// Fetch sales orders with filters
async function fetchSalesOrders(params: {
  status?: string
  customer_id?: string
  page?: number
  limit?: number
}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.append(key, String(value))
  })

  const response = await fetch(`/api/shipping/sales-orders?${query}`)
  const data = await response.json()
  return data.data
}

// Create a new sales order
async function createSalesOrder(order: {
  customer_id: string
  shipping_address_id: string
  order_date: string
  lines: Array<{
    product_id: string
    quantity_ordered: number
    unit_price?: number
  }>
}) {
  const response = await fetch('/api/shipping/sales-orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  })

  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to create order')
  }
  return data.data
}

// Confirm a sales order
async function confirmSalesOrder(orderId: string) {
  const response = await fetch(`/api/shipping/sales-orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'confirm' }),
  })

  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to confirm order')
  }
  return data.sales_order
}

// Add a line to an order
async function addOrderLine(
  orderId: string,
  line: {
    product_id: string
    quantity_ordered: number
    unit_price?: number
    discount?: { type: 'percent' | 'fixed'; value: number }
  }
) {
  const response = await fetch(`/api/shipping/sales-orders/${orderId}/lines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(line),
  })

  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to add line')
  }
  return { line: data.line, soTotal: data.so_total }
}
```

### Complete Order Creation Flow

```typescript
async function createOrderWithLines() {
  // Step 1: Create order with initial lines
  const order = await createSalesOrder({
    customer_id: 'cust-001',
    shipping_address_id: 'addr-001',
    order_date: '2026-01-22',
    lines: [
      { product_id: 'prod-001', quantity_ordered: 100 },
      { product_id: 'prod-002', quantity_ordered: 50, unit_price: 5.00 },
    ],
  })

  console.log('Order created:', order.order_number)

  // Step 2: Add another line
  const { line, soTotal } = await addOrderLine(order.id, {
    product_id: 'prod-003',
    quantity_ordered: 25,
    discount: { type: 'percent', value: 10 },
  })

  console.log('Line added, new total:', soTotal)

  // Step 3: Confirm the order
  const confirmed = await confirmSalesOrder(order.id)
  console.log('Order confirmed at:', confirmed.confirmed_at)

  return confirmed
}
```

---

## Request/Response Schemas

### SalesOrder

```typescript
interface SalesOrder {
  id: string
  org_id: string
  order_number: string              // SO-YYYY-NNNNN
  customer_id: string
  customer_name?: string
  shipping_address_id?: string
  status: SOStatus
  order_date: string                // YYYY-MM-DD
  required_delivery_date?: string   // YYYY-MM-DD
  customer_po?: string
  notes?: string
  total_amount: number              // DECIMAL(15,2)
  line_count: number
  lines?: SalesOrderLine[]
  created_at: string                // ISO 8601
  updated_at?: string               // ISO 8601
  confirmed_at?: string             // ISO 8601
}

type SOStatus =
  | 'draft'
  | 'confirmed'
  | 'on_hold'
  | 'cancelled'
  | 'allocated'
  | 'picking'
  | 'packing'
  | 'shipped'
  | 'delivered'
```

### SalesOrderLine

```typescript
interface SalesOrderLine {
  id: string
  sales_order_id: string
  line_number: number
  product_id: string
  product?: {
    id: string
    code: string
    name: string
    std_price?: number
  }
  quantity_ordered: number          // DECIMAL(15,4)
  quantity_allocated?: number       // DECIMAL(15,4) - Story 07.7
  quantity_picked?: number          // DECIMAL(15,4) - Story 07.8
  quantity_packed?: number          // DECIMAL(15,4) - Story 07.11
  quantity_shipped?: number         // DECIMAL(15,4) - Story 07.14
  unit_price: number                // DECIMAL(15,4)
  discount?: Discount | null
  line_total: number                // DECIMAL(15,2)
  requested_lot?: string
  notes?: string
  created_at: string
}

interface Discount {
  type: 'percent' | 'fixed'
  value: number
}
```

### CreateSalesOrderRequest

```typescript
interface CreateSalesOrderRequest {
  customer_id: string               // UUID
  shipping_address_id: string       // UUID
  order_date: string                // YYYY-MM-DD
  required_delivery_date?: string   // YYYY-MM-DD
  customer_po?: string              // max 100 chars
  notes?: string                    // max 1000 chars
  lines: Array<{
    product_id: string              // UUID
    quantity_ordered: number        // > 0
    unit_price?: number             // >= 0
    discount?: Discount
    requested_lot?: string          // max 100 chars
    notes?: string                  // max 500 chars
  }>                                // min 1 line
}
```

---

## Pricing Calculations

### Line Total

```
line_total = quantity_ordered * unit_price - discount

If discount.type = 'percent':
  line_total = quantity * price * (1 - discount.value / 100)

If discount.type = 'fixed':
  line_total = max(0, quantity * price - discount.value)
```

### Order Total

```
total_amount = SUM(all line_totals)
```

All amounts are rounded to 2 decimal places (DECIMAL(15,2)).

---

## Order Number Generation

Order numbers follow the format: `SO-YYYY-NNNNN`

- `SO` - Sales Order prefix
- `YYYY` - 4-digit year
- `NNNNN` - 5-digit sequence (padded with zeros)

**Examples:** `SO-2026-00001`, `SO-2026-00123`

**Rules:**
- Sequence resets to 00001 at the start of each year
- Each organization has its own independent sequence
- Generated automatically on order creation

---

## Related Documentation

- [Sales Order Workflow Guide](../../guides/shipping/sales-order-workflow.md)
- [SO Status API](./so-status.md) (Story 07.3)
- [SO Line Pricing](./so-pricing.md) (Story 07.4)
- [Inventory Allocation API](./inventory-allocation.md) (Story 07.7)

---

## Support

**Story:** 07.2
**Last Updated:** 2026-01-22
