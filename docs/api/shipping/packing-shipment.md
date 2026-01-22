# Packing & Shipment Creation API (Story 07.11)

API reference for shipment creation, box management, LP assignment, and packing completion.

## Overview

The Packing API enables creating shipments from picked sales orders, managing boxes with weight/dimensions, assigning license plates to boxes for full traceability, and completing the packing workflow.

## Base URL

```
/api/shipping/shipments
```

## Authentication

All endpoints require authentication. Include the session cookie or Bearer token.

## Endpoints

### Create Shipment from Sales Order

Creates a new shipment from a picked sales order.

```
POST /api/shipping/shipments
```

**Request Body:**

```json
{
  "sales_order_id": "so-44444444-4444-4444-4444-444444444444"
}
```

**Response (201 Created):**

```json
{
  "id": "shipment-33333333-3333-3333-3333-333333333333",
  "shipment_number": "SH-2025-00001",
  "sales_order_id": "so-44444444-4444-4444-4444-444444444444",
  "customer_id": "cust-55555555-5555-5555-5555-555555555555",
  "status": "pending",
  "total_boxes": 0,
  "total_weight": null,
  "created_at": "2025-01-22T10:00:00Z"
}
```

**Errors:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_SALES_ORDER | Sales order not found or invalid |
| 400 | INVALID_STATUS | Sales order must be in 'picked' status |
| 409 | CONFLICT | Shipment already exists for this SO |

**Business Rules:**
- Sales order must be in 'picked' or 'picking' status
- Shipment number format: `SH-YYYY-NNNNN` (auto-incremented)
- Sales order status updates to 'packing' on success

### List Shipments

Returns paginated list of shipments with optional filters.

```
GET /api/shipping/shipments
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status (comma-separated) |
| customer_id | uuid | Filter by customer |
| date_from | date | Filter by created_at >= date |
| date_to | date | Filter by created_at <= date |
| page | number | Page number (default: 1) |
| limit | number | Items per page (1-50, default: 20) |
| sort_by | string | Sort field (default: created_at) |
| sort_order | asc/desc | Sort direction (default: desc) |

**Response (200 OK):**

```json
{
  "shipments": [
    {
      "id": "shipment-33333333-3333-3333-3333-333333333333",
      "shipment_number": "SH-2025-00001",
      "status": "packing",
      "customer": {
        "id": "cust-55555555-5555-5555-5555-555555555555",
        "name": "Acme Foods Corp"
      },
      "sales_orders": {
        "id": "so-44444444-4444-4444-4444-444444444444",
        "order_number": "SO-2025-00001"
      },
      "total_boxes": 2,
      "total_weight": 25.5,
      "created_at": "2025-01-22T10:00:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 20,
  "pages": 1
}
```

### Get Shipment Detail

Returns shipment with boxes and contents.

```
GET /api/shipping/shipments/:id
```

**Response (200 OK):**

```json
{
  "shipment": {
    "id": "shipment-33333333-3333-3333-3333-333333333333",
    "shipment_number": "SH-2025-00001",
    "status": "packing",
    "total_boxes": 2,
    "total_weight": 25.5
  },
  "boxes": [
    {
      "id": "box-77777777-7777-7777-7777-777777777777",
      "box_number": 1,
      "weight": 12.5,
      "length": 40,
      "width": 30,
      "height": 25,
      "sscc": "003456789012345678"
    }
  ],
  "contents": [
    {
      "id": "content-88888888-8888-8888-8888-888888888888",
      "shipment_box_id": "box-77777777-7777-7777-7777-777777777777",
      "license_plate_id": "lp-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      "lot_number": "LOT-2025-001",
      "quantity": 100
    }
  ],
  "sales_order": {
    "id": "so-44444444-4444-4444-4444-444444444444",
    "order_number": "SO-2025-00001",
    "status": "packing"
  }
}
```

### Add Box to Shipment

Adds a new box to the shipment with auto-incremented box number.

```
POST /api/shipping/shipments/:id/boxes
```

**Response (201 Created):**

```json
{
  "id": "box-77777777-7777-7777-7777-777777777777",
  "shipment_id": "shipment-33333333-3333-3333-3333-333333333333",
  "box_number": 1,
  "weight": null,
  "length": null,
  "width": null,
  "height": null,
  "created_at": "2025-01-22T10:05:00Z"
}
```

**Business Rules:**
- Box number auto-increments (1, 2, 3...)
- Shipment status updates to 'packing' if 'pending'

### Update Box Weight/Dimensions

Updates box weight and/or dimensions.

```
PUT /api/shipping/shipments/:shipmentId/boxes/:boxId
```

**Request Body:**

```json
{
  "weight": 12.5,
  "length": 40,
  "width": 30,
  "height": 25
}
```

**Response (200 OK):**

```json
{
  "id": "box-77777777-7777-7777-7777-777777777777",
  "box_number": 1,
  "weight": 12.5,
  "length": 40,
  "width": 30,
  "height": 25
}
```

**Validation Rules:**
- Weight: 0 < weight <= 25 kg
- Dimensions: 10 <= value <= 200 cm

**Errors:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Weight or dimension out of range |
| 400 | ALREADY_PACKED | Cannot update box after shipment is packed |
| 404 | BOX_NOT_FOUND | Box not found |

### Add LP to Box

Adds a license plate (LP) content to a box.

```
POST /api/shipping/shipments/:shipmentId/boxes/:boxId/contents
```

**Request Body:**

```json
{
  "license_plate_id": "lp-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  "sales_order_line_id": "sol-99999999-9999-9999-9999-999999999999",
  "quantity": 100
}
```

**Response (201 Created):**

```json
{
  "id": "content-88888888-8888-8888-8888-888888888888",
  "shipment_box_id": "box-77777777-7777-7777-7777-777777777777",
  "license_plate_id": "lp-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  "lot_number": "LOT-2025-001",
  "quantity": 100,
  "created_at": "2025-01-22T10:10:00Z"
}
```

**Business Rules:**
- Quantity must be > 0
- Quantity cannot exceed LP available quantity
- lot_number captured from LP for traceability

**Errors:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_QUANTITY | Quantity must be > 0 |
| 400 | EXCEEDS_AVAILABLE | Quantity exceeds LP available |
| 404 | LICENSE_PLATE_NOT_FOUND | LP not found |

### Get Available LPs for Packing

Returns picked LPs available for packing (not yet packed).

```
GET /api/shipping/shipments/:id/available-lps
```

**Response (200 OK):**

```json
{
  "license_plates": [
    {
      "id": "lp-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      "lp_number": "LP-2025-00001",
      "product_id": "prod-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "product_name": "Organic Flour 5lb",
      "lot_number": "LOT-2025-001",
      "quantity_available": 100,
      "location_id": "loc-cccccccc-cccc-cccc-cccc-cccccccccccc",
      "location_name": "PICK-A-01"
    }
  ],
  "total_count": 5,
  "packed_count": 2,
  "remaining_count": 3
}
```

### Complete Packing

Validates and completes the packing workflow.

```
POST /api/shipping/shipments/:id/complete-packing
```

**Response (200 OK):**

```json
{
  "shipment_id": "shipment-33333333-3333-3333-3333-333333333333",
  "shipment_number": "SH-2025-00001",
  "status": "packed",
  "total_weight": 25.5,
  "total_boxes": 2,
  "packed_at": "2025-01-22T11:00:00Z",
  "packed_by": "user-22222222-2222-2222-2222-222222222222",
  "message": "Shipment SH-2025-00001 packed successfully"
}
```

**Validation Rules:**
- All boxes must have weight entered
- All picked LPs must be packed
- Shipment status must be 'packing'

**Errors:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | MISSING_WEIGHT | Boxes missing weight |
| 400 | UNPACKED_ITEMS | Not all LPs packed |
| 400 | INVALID_STATUS | Shipment not in packing status |

**Side Effects:**
- Shipment status -> 'packed'
- Sales order status -> 'packed'
- packed_at timestamp set
- total_weight calculated (sum of box weights)
- total_boxes count set

### Check Allergen Separation

Checks for allergen conflicts before adding LP to box.

```
POST /api/shipping/shipments/:shipmentId/boxes/:boxId/check-allergen
```

**Request Body:**

```json
{
  "product_id": "prod-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
}
```

**Response (200 OK):**

```json
{
  "has_conflict": true,
  "is_blocking": false,
  "product_allergens": ["Gluten", "Soy"],
  "customer_restrictions": ["Peanuts", "Gluten"],
  "conflicting_allergens": ["Gluten"],
  "box_allergens": ["Wheat"]
}
```

**Notes:**
- Non-blocking by default (warning only)
- User can proceed despite warning
- Logged for audit trail

## Shipment Status Lifecycle

```
pending -> packing -> packed -> manifested -> shipped -> delivered
                                    |
                                    v
                               exception
```

| Status | Description |
|--------|-------------|
| pending | Created, no boxes added yet |
| packing | Boxes being packed |
| packed | All items packed, ready for manifest |
| manifested | SSCC labels generated, ready to ship |
| shipped | Departed warehouse |
| delivered | Confirmed delivery |
| exception | Issue requiring attention |

## Data Models

### Shipment

```typescript
interface Shipment {
  id: string
  org_id: string
  shipment_number: string      // SH-YYYY-NNNNN
  sales_order_id: string
  customer_id: string
  shipping_address_id: string
  status: ShipmentStatus
  carrier: string | null
  tracking_number: string | null
  total_weight: number | null  // kg
  total_boxes: number
  packed_at: string | null
  packed_by: string | null
  shipped_at: string | null
  delivered_at: string | null
  created_at: string
  created_by: string
}
```

### ShipmentBox

```typescript
interface ShipmentBox {
  id: string
  org_id: string
  shipment_id: string
  box_number: number          // Auto-incremented
  sscc: string | null         // SSCC-18 code
  weight: number | null       // kg, max 25
  length: number | null       // cm, 10-200
  width: number | null        // cm, 10-200
  height: number | null       // cm, 10-200
  created_at: string
}
```

### ShipmentBoxContent

```typescript
interface ShipmentBoxContent {
  id: string
  org_id: string
  shipment_box_id: string
  sales_order_line_id: string
  product_id: string
  license_plate_id: string
  lot_number: string | null   // Captured for traceability
  quantity: number
  created_at: string
}
```

## Security

- All endpoints enforce `org_id` for multi-tenant isolation (ADR-013)
- RLS policies prevent cross-tenant data access
- Audit trail for allergen warnings

## Related Documentation

- [Packing Workbench Guide](/docs/guides/shipping/packing-workbench.md)
- [SSCC & BOL Labels API](/docs/api/shipping/sscc-bol-labels.md)
- [Shipment Manifest API](/docs/api/shipping/shipment-manifest.md)
- [Pick Confirmation API](/docs/api/shipping/pick-confirmation.md)
