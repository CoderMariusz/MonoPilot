# Purchase Orders API Documentation

## Overview

The Purchase Orders API provides comprehensive endpoints for creating, reading, updating, and managing purchase orders and their line items. All endpoints are authenticated and multi-tenant aware, automatically filtering by the current user's organization.

**Base URL**: `/api/planning/purchase-orders`

**Authentication**: Required on all endpoints (Bearer token via session)

**Multi-Tenancy**: All operations automatically filtered by `org_id` from current user's organization

## Table of Contents

1. [Authentication](#authentication)
2. [Response Format](#response-format)
3. [Error Codes](#error-codes)
4. [Endpoints](#endpoints)
5. [Data Models](#data-models)
6. [Examples](#examples)

## Authentication

All requests require a valid session. The API uses Supabase authentication with role-based access control (RBAC).

### Headers

```
Authorization: Bearer <session_token>
Content-Type: application/json
```

The session is automatically handled by Next.js middleware. Include credentials in requests:

```bash
curl -X GET http://localhost:3000/api/planning/purchase-orders \
  -H "Cookie: auth-token=..."
```

### Roles

Role-based permissions are enforced:

| Role | Create | Read | Update | Delete | Submit | Confirm |
|------|--------|------|--------|--------|--------|---------|
| Purchaser | Yes | Yes | Yes* | Yes* | Yes | No |
| Buyer | Yes | Yes | Yes* | Yes* | Yes | Yes |
| Manager | Yes | Yes | Yes* | Yes* | Yes | Yes |
| Viewer | No | Yes | No | No | No | No |
| Admin | Yes | Yes | Yes | Yes | Yes | Yes |

*Can only update/delete Draft status POs

## Response Format

### Success Response

```json
{
  "purchase_order": {
    "id": "uuid",
    "po_number": "PO-2025-00001",
    "status": "draft",
    ...
  },
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "error": "Human-readable error message",
  "details": [...] // Optional validation details
}
```

### List Response

```json
{
  "purchase_orders": [...],
  "total": 42
}
```

## Error Codes

### HTTP Status Codes

| Code | Meaning | Typical Cause |
|------|---------|---------------|
| 200 | OK | Successful GET/PUT |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid input or validation error |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Permission denied (role or status) |
| 404 | Not Found | PO doesn't exist or belongs to different org |
| 500 | Server Error | Database or server error |

### Common Errors

#### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

**Cause**: Missing session or invalid token
**Solution**: Ensure authentication middleware is passing session

#### 403 Forbidden

```json
{
  "error": "Forbidden: Buyer role required"
}
```

**Cause**: User doesn't have required role
**Solution**: Request has insufficient permissions for the action

#### 404 Not Found

```json
{
  "error": "Purchase order not found"
}
```

**Cause**: PO doesn't exist or belongs to different organization
**Solution**: Verify PO ID and that it belongs to your organization

#### 400 Bad Request

```json
{
  "error": "Invalid request data",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "number",
      "path": ["quantity"],
      "message": "Quantity must be at least 1"
    }
  ]
}
```

**Cause**: Request validation failed
**Solution**: Check field types and constraints

## Endpoints

### List Purchase Orders

**GET** `/api/planning/purchase-orders`

Retrieve all purchase orders for the current organization with optional filtering.

#### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | string | Search by PO number or supplier name | `search=PO-2025` |
| `status` | string | Filter by status | `status=draft` |
| `supplier_id` | UUID | Filter by supplier | `supplier_id=abc123...` |
| `warehouse_id` | UUID | Filter by warehouse | `warehouse_id=def456...` |
| `date_from` | date | Start of delivery date range | `date_from=2025-01-01` |
| `date_to` | date | End of delivery date range | `date_to=2025-12-31` |

#### Response (200 OK)

```json
{
  "purchase_orders": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "org_id": "org-uuid",
      "po_number": "PO-2025-00001",
      "supplier_id": "supplier-uuid",
      "warehouse_id": "warehouse-uuid",
      "status": "draft",
      "expected_delivery_date": "2025-01-15",
      "currency": "PLN",
      "subtotal": 1000.00,
      "tax_amount": 230.00,
      "total": 1230.00,
      "created_at": "2025-01-02T10:00:00Z",
      "suppliers": {
        "id": "supplier-uuid",
        "code": "SUPP001",
        "name": "ABC Supplier",
        "currency": "PLN"
      },
      "warehouses": {
        "id": "warehouse-uuid",
        "code": "WH01",
        "name": "Main Warehouse"
      }
    }
  ],
  "total": 1
}
```

#### Example Request

```bash
curl -X GET "http://localhost:3000/api/planning/purchase-orders?status=draft&supplier_id=abc123" \
  -H "Content-Type: application/json" \
  --include-credentials
```

---

### Create Purchase Order

**POST** `/api/planning/purchase-orders`

Create a new purchase order in Draft status.

#### Request Body

```json
{
  "supplier_id": "550e8400-e29b-41d4-a716-446655440000",
  "warehouse_id": "550e8400-e29b-41d4-a716-446655440001",
  "expected_delivery_date": "2025-01-15",
  "payment_terms": "Net 30",
  "shipping_method": "Ground",
  "notes": "Rush order - please expedite"
}
```

#### Field Validation

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `supplier_id` | UUID | Yes | Must exist in organization |
| `warehouse_id` | UUID | Yes | Must exist in organization |
| `expected_delivery_date` | date | Yes | Must be today or later |
| `payment_terms` | string | No | Max 50 chars |
| `shipping_method` | string | No | Max 100 chars |
| `notes` | string | No | No length limit |

#### Response (201 Created)

```json
{
  "purchase_order": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "po_number": "PO-2025-00001",
    "supplier_id": "supplier-uuid",
    "warehouse_id": "warehouse-uuid",
    "status": "draft",
    "expected_delivery_date": "2025-01-15",
    "currency": "PLN",
    "subtotal": 0.00,
    "tax_amount": 0.00,
    "total": 0.00,
    "created_by": "user-uuid",
    "created_at": "2025-01-02T10:00:00Z",
    "suppliers": {
      "id": "supplier-uuid",
      "code": "SUPP001",
      "name": "ABC Supplier",
      "currency": "PLN"
    },
    "warehouses": {
      "id": "warehouse-uuid",
      "code": "WH01",
      "name": "Main Warehouse"
    }
  },
  "message": "Purchase order created successfully"
}
```

#### Automatic Behavior

- **PO Number**: Generated as PO-YYYY-NNNNN (auto-incrementing per organization/year)
- **Currency**: Inherited from supplier
- **Status**: Set to "Draft"
- **Totals**: Initialized to 0 (updated when lines are added)

#### Example Request

```bash
curl -X POST http://localhost:3000/api/planning/purchase-orders \
  -H "Content-Type: application/json" \
  --data '{
    "supplier_id": "550e8400-e29b-41d4-a716-446655440000",
    "warehouse_id": "550e8400-e29b-41d4-a716-446655440001",
    "expected_delivery_date": "2025-01-15"
  }' \
  --include-credentials
```

---

### Get Purchase Order

**GET** `/api/planning/purchase-orders/{id}`

Retrieve a single purchase order with all related data.

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Purchase order ID |

#### Response (200 OK)

```json
{
  "purchase_order": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "po_number": "PO-2025-00001",
    "supplier_id": "supplier-uuid",
    "warehouse_id": "warehouse-uuid",
    "status": "draft",
    "expected_delivery_date": "2025-01-15",
    "currency": "PLN",
    "subtotal": 1000.00,
    "tax_amount": 230.00,
    "total": 1230.00,
    "payment_terms": "Net 30",
    "shipping_method": "Ground",
    "notes": "Rush order",
    "created_by": "user-uuid",
    "created_at": "2025-01-02T10:00:00Z",
    "suppliers": {
      "id": "supplier-uuid",
      "code": "SUPP001",
      "name": "ABC Supplier",
      "currency": "PLN",
      "payment_terms": "Net 30"
    },
    "warehouses": {
      "id": "warehouse-uuid",
      "code": "WH01",
      "name": "Main Warehouse"
    },
    "po_lines": [
      {
        "id": "line-uuid",
        "po_id": "550e8400-e29b-41d4-a716-446655440000",
        "line_number": 1,
        "product_id": "product-uuid",
        "quantity": 100,
        "uom": "kg",
        "unit_price": 10.00,
        "discount_percent": 0,
        "discount_amount": 0,
        "line_total": 1000.00,
        "products": {
          "id": "product-uuid",
          "code": "PROD001",
          "name": "Raw Material A",
          "uom": "kg"
        }
      }
    ]
  }
}
```

#### Example Request

```bash
curl -X GET http://localhost:3000/api/planning/purchase-orders/550e8400-e29b-41d4-a716-446655440000 \
  --include-credentials
```

---

### Update Purchase Order

**PUT** `/api/planning/purchase-orders/{id}`

Update a purchase order. Only editable in Draft or Submitted status.

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Purchase order ID |

#### Request Body

```json
{
  "expected_delivery_date": "2025-01-20",
  "payment_terms": "Net 45",
  "shipping_method": "Express",
  "notes": "Updated notes"
}
```

#### Editable Fields

| Field | Restrictions |
|-------|--------------|
| `expected_delivery_date` | Only when status is Draft or Submitted |
| `payment_terms` | Only when status is Draft or Submitted |
| `shipping_method` | Only when status is Draft or Submitted |
| `notes` | Only when status is Draft or Submitted |

#### Non-Editable Fields

These fields cannot be modified after creation:
- `po_number`
- `supplier_id`
- `warehouse_id`
- `currency`
- `status` (use status action endpoints instead)

#### Response (200 OK)

```json
{
  "purchase_order": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "po_number": "PO-2025-00001",
    "expected_delivery_date": "2025-01-20",
    "payment_terms": "Net 45",
    "shipping_method": "Express",
    "notes": "Updated notes",
    ...
  },
  "message": "Purchase order updated successfully"
}
```

#### Example Request

```bash
curl -X PUT http://localhost:3000/api/planning/purchase-orders/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  --data '{
    "expected_delivery_date": "2025-01-20",
    "payment_terms": "Net 45"
  }' \
  --include-credentials
```

---

### Delete Purchase Order

**DELETE** `/api/planning/purchase-orders/{id}`

Delete a purchase order. Only allowed in Draft status.

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Purchase order ID |

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Purchase order deleted successfully"
}
```

#### Constraints

- Can only delete POs in **Draft** status
- Deleting a PO also deletes all associated line items
- This action cannot be undone

#### Example Request

```bash
curl -X DELETE http://localhost:3000/api/planning/purchase-orders/550e8400-e29b-41d4-a716-446655440000 \
  --include-credentials
```

---

### Get Purchase Order Lines

**GET** `/api/planning/purchase-orders/{id}/lines`

Retrieve all line items for a purchase order.

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Purchase order ID |

#### Response (200 OK)

```json
{
  "lines": [
    {
      "id": "line-uuid",
      "po_id": "550e8400-e29b-41d4-a716-446655440000",
      "line_number": 1,
      "product_id": "product-uuid",
      "quantity": 100,
      "uom": "kg",
      "unit_price": 10.00,
      "discount_percent": 5,
      "discount_amount": 50.00,
      "line_total": 950.00,
      "expected_delivery_date": null,
      "received_qty": 0,
      "created_at": "2025-01-02T10:00:00Z",
      "products": {
        "id": "product-uuid",
        "code": "PROD001",
        "name": "Raw Material A",
        "uom": "kg"
      }
    }
  ],
  "total": 1
}
```

#### Example Request

```bash
curl -X GET http://localhost:3000/api/planning/purchase-orders/550e8400-e29b-41d4-a716-446655440000/lines \
  --include-credentials
```

---

### Add Purchase Order Line

**POST** `/api/planning/purchase-orders/{id}/lines`

Add a new line item to a purchase order.

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Purchase order ID |

#### Request Body

```json
{
  "product_id": "550e8400-e29b-41d4-a716-446655440002",
  "quantity": 100,
  "unit_price": 10.00,
  "discount_percent": 5,
  "expected_delivery_date": "2025-01-15"
}
```

#### Field Validation

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `product_id` | UUID | Yes | Must exist in organization |
| `quantity` | number | Yes | Must be positive, max 999,999,999 |
| `unit_price` | number | Yes | Must be >= 0 |
| `discount_percent` | number | No | Must be 0-100 |
| `expected_delivery_date` | date | No | Must be today or later |

#### Response (201 Created)

```json
{
  "line": {
    "id": "line-uuid",
    "po_id": "550e8400-e29b-41d4-a716-446655440000",
    "line_number": 1,
    "product_id": "550e8400-e29b-41d4-a716-446655440002",
    "quantity": 100,
    "uom": "kg",
    "unit_price": 10.00,
    "discount_percent": 5,
    "discount_amount": 50.00,
    "line_total": 950.00,
    "tax_amount": 218.50,
    "line_total_with_tax": 1168.50,
    "created_at": "2025-01-02T10:00:00Z",
    "products": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "code": "PROD001",
      "name": "Raw Material A",
      "uom": "kg"
    }
  },
  "message": "PO line added successfully"
}
```

#### Automatic Behavior

- **Line Number**: Auto-incremented per PO
- **Discount**: Calculated on line subtotal
- **Tax**: Applied from supplier's tax code
- **PO Totals**: Automatically recalculated on insert (via database trigger)

#### Constraints

- Cannot add lines to POs in **Closed** or **Receiving** status
- Product must belong to the same organization

#### Example Request

```bash
curl -X POST http://localhost:3000/api/planning/purchase-orders/550e8400-e29b-41d4-a716-446655440000/lines \
  -H "Content-Type: application/json" \
  --data '{
    "product_id": "550e8400-e29b-41d4-a716-446655440002",
    "quantity": 100,
    "unit_price": 10.00,
    "discount_percent": 5
  }' \
  --include-credentials
```

---

### Update Purchase Order Line

**PUT** `/api/planning/purchase-orders/{id}/lines/{lineId}`

Update an existing line item.

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Purchase order ID |
| `lineId` | UUID | Line item ID |

#### Request Body

```json
{
  "quantity": 150,
  "unit_price": 9.50,
  "discount_percent": 10
}
```

#### Response (200 OK)

```json
{
  "line": {
    "id": "line-uuid",
    "quantity": 150,
    "unit_price": 9.50,
    "discount_percent": 10,
    "line_total": 1275.00,
    ...
  },
  "message": "PO line updated successfully"
}
```

#### Constraints

- Can only update lines in **Draft** or **Submitted** status
- Cannot change `product_id` (delete and re-add instead)
- PO totals automatically recalculate

#### Example Request

```bash
curl -X PUT http://localhost:3000/api/planning/purchase-orders/550e8400-e29b-41d4-a716-446655440000/lines/line-uuid \
  -H "Content-Type: application/json" \
  --data '{
    "quantity": 150,
    "unit_price": 9.50
  }' \
  --include-credentials
```

---

### Delete Purchase Order Line

**DELETE** `/api/planning/purchase-orders/{id}/lines/{lineId}`

Remove a line item from a purchase order.

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Purchase order ID |
| `lineId` | UUID | Line item ID |

#### Response (200 OK)

```json
{
  "success": true,
  "message": "PO line deleted successfully"
}
```

#### Constraints

- Can only delete lines in **Draft** or **Submitted** status
- PO totals automatically recalculate
- Cannot delete lines from **Receiving** or **Closed** POs

#### Example Request

```bash
curl -X DELETE http://localhost:3000/api/planning/purchase-orders/550e8400-e29b-41d4-a716-446655440000/lines/line-uuid \
  --include-credentials
```

---

### Submit Purchase Order

**POST** `/api/planning/purchase-orders/{id}/submit`

Submit a draft PO for approval/confirmation.

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Purchase order ID |

#### Request Body

```json
{}
```

#### Response (200 OK)

```json
{
  "purchase_order": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "submitted",
    ...
  },
  "message": "Purchase order submitted successfully"
}
```

#### Validation

- PO must have at least one line item
- PO must be in **Draft** status
- All required fields must be filled

#### Example Request

```bash
curl -X POST http://localhost:3000/api/planning/purchase-orders/550e8400-e29b-41d4-a716-446655440000/submit \
  -H "Content-Type: application/json" \
  --data '{}' \
  --include-credentials
```

---

### Confirm Purchase Order

**POST** `/api/planning/purchase-orders/{id}/confirm`

Confirm a submitted PO (requires Buyer/Manager role).

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Purchase order ID |

#### Request Body

```json
{}
```

#### Response (200 OK)

```json
{
  "purchase_order": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "confirmed",
    ...
  },
  "message": "Purchase order confirmed successfully"
}
```

#### Authorization

- Requires **Buyer**, **Manager**, or **Admin** role
- Purchaser role cannot confirm POs

#### Example Request

```bash
curl -X POST http://localhost:3000/api/planning/purchase-orders/550e8400-e29b-41d4-a716-446655440000/confirm \
  -H "Content-Type: application/json" \
  --data '{}' \
  --include-credentials
```

---

### Cancel Purchase Order

**POST** `/api/planning/purchase-orders/{id}/cancel`

Cancel a PO (any status except Closed/Cancelled).

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Purchase order ID |

#### Request Body

```json
{
  "reason": "Supplier unable to deliver on time"
}
```

#### Response (200 OK)

```json
{
  "purchase_order": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "cancelled",
    ...
  },
  "message": "Purchase order cancelled successfully"
}
```

#### Constraints

- Cannot cancel POs in **Closed** or **Cancelled** status
- Cannot cancel if goods have been fully received
- Optional reason field for audit trail

#### Example Request

```bash
curl -X POST http://localhost:3000/api/planning/purchase-orders/550e8400-e29b-41d4-a716-446655440000/cancel \
  -H "Content-Type: application/json" \
  --data '{
    "reason": "Supplier unable to deliver on time"
  }' \
  --include-credentials
```

---

### Get Status History

**GET** `/api/planning/purchase-orders/{id}/history`

Retrieve the complete status change history for a PO.

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Purchase order ID |

#### Response (200 OK)

```json
{
  "history": [
    {
      "id": "history-uuid",
      "po_id": "550e8400-e29b-41d4-a716-446655440000",
      "old_status": "draft",
      "new_status": "submitted",
      "changed_at": "2025-01-02T10:30:00Z",
      "changed_by": "user-uuid",
      "reason": null,
      "user": {
        "id": "user-uuid",
        "email": "buyer@company.com",
        "name": "John Buyer"
      }
    },
    {
      "id": "history-uuid-2",
      "po_id": "550e8400-e29b-41d4-a716-446655440000",
      "old_status": "submitted",
      "new_status": "confirmed",
      "changed_at": "2025-01-02T11:00:00Z",
      "changed_by": "user-uuid",
      "reason": null,
      "user": {
        "id": "user-uuid",
        "email": "manager@company.com",
        "name": "Jane Manager"
      }
    }
  ],
  "total": 2
}
```

#### Example Request

```bash
curl -X GET http://localhost:3000/api/planning/purchase-orders/550e8400-e29b-41d4-a716-446655440000/history \
  --include-credentials
```

---

## Data Models

### Purchase Order

```typescript
{
  id: UUID
  org_id: UUID
  po_number: string              // PO-YYYY-NNNNN format
  supplier_id: UUID
  warehouse_id: UUID
  status: "draft" | "submitted" | "pending_approval" | "confirmed" | "receiving" | "closed" | "cancelled"
  expected_delivery_date: date
  actual_delivery_date?: date
  currency: "PLN" | "EUR" | "USD" | "GBP"
  tax_code_id?: UUID
  payment_terms?: string
  shipping_method?: string
  notes?: string
  internal_notes?: string

  // Approval fields (Story 03.5)
  approval_status?: "pending" | "approved" | "rejected"
  approved_by?: UUID
  approved_at?: timestamp
  approval_notes?: string
  rejection_reason?: string

  // Calculated totals
  subtotal: decimal
  discount_total: decimal
  tax_amount: decimal
  total: decimal

  // Audit
  created_by: UUID
  created_at: timestamp
  updated_by: UUID
  updated_at: timestamp

  // Relations
  suppliers?: Supplier
  warehouses?: Warehouse
  po_lines?: POLine[]
}
```

### PO Line

```typescript
{
  id: UUID
  po_id: UUID
  line_number: integer
  product_id: UUID
  quantity: decimal
  uom: string
  unit_price: decimal
  discount_percent: decimal (0-100)
  discount_amount: decimal
  line_total: decimal
  expected_delivery_date?: date
  confirmed_delivery_date?: date
  received_qty: decimal (default: 0)
  notes?: string
  created_at: timestamp
  updated_at: timestamp

  // Relations
  products?: Product
}
```

### Status History

```typescript
{
  id: UUID
  po_id: UUID
  old_status: string
  new_status: string
  changed_at: timestamp
  changed_by: UUID
  reason?: string

  // Relations
  user?: User
}
```

## Examples

### Complete Workflow Example

```bash
# 1. Create a new PO
PO_ID=$(curl -X POST http://localhost:3000/api/planning/purchase-orders \
  -H "Content-Type: application/json" \
  --data '{
    "supplier_id": "550e8400-e29b-41d4-a716-446655440000",
    "warehouse_id": "550e8400-e29b-41d4-a716-446655440001",
    "expected_delivery_date": "2025-01-15"
  }' \
  --include-credentials | jq -r '.purchase_order.id')

echo "Created PO: $PO_ID"

# 2. Add a line item
curl -X POST http://localhost:3000/api/planning/purchase-orders/$PO_ID/lines \
  -H "Content-Type: application/json" \
  --data '{
    "product_id": "550e8400-e29b-41d4-a716-446655440002",
    "quantity": 100,
    "unit_price": 10.00,
    "discount_percent": 5
  }' \
  --include-credentials

# 3. Get the full PO
curl -X GET http://localhost:3000/api/planning/purchase-orders/$PO_ID \
  --include-credentials

# 4. Submit for approval
curl -X POST http://localhost:3000/api/planning/purchase-orders/$PO_ID/submit \
  -H "Content-Type: application/json" \
  --data '{}' \
  --include-credentials

# 5. Confirm the PO (requires Buyer role)
curl -X POST http://localhost:3000/api/planning/purchase-orders/$PO_ID/confirm \
  -H "Content-Type: application/json" \
  --data '{}' \
  --include-credentials

# 6. View status history
curl -X GET http://localhost:3000/api/planning/purchase-orders/$PO_ID/history \
  --include-credentials
```

### Search and Filter Example

```bash
# Find all draft POs for a specific supplier
curl -X GET "http://localhost:3000/api/planning/purchase-orders?status=draft&supplier_id=550e8400-e29b-41d4-a716-446655440000" \
  --include-credentials

# Search by PO number
curl -X GET "http://localhost:3000/api/planning/purchase-orders?search=PO-2025-00001" \
  --include-credentials

# Filter by date range
curl -X GET "http://localhost:3000/api/planning/purchase-orders?date_from=2025-01-01&date_to=2025-01-31" \
  --include-credentials
```

---

**Last Updated**: January 2, 2026
**API Version**: 1.0
**Story**: 03.3 - PO CRUD + Lines
