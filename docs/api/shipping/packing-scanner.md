# Packing Scanner API Reference

Story: **07.12 - Packing Scanner Mobile UI**

API endpoints for mobile packing workflow operations with barcode scanning, box management, and allergen validation.

## Base URL

```
/api/shipping/scanner/pack
```

## Authentication

All endpoints require authentication. Include `Authorization: Bearer {token}` header.
RLS policies ensure org isolation - users can only access shipments from their organization.

---

## Endpoints

### POST /api/shipping/scanner/pack

Add an item to a shipment box (main packing transaction).

**Request Body:**

```typescript
{
  shipment_id: string;      // UUID - Target shipment
  box_id: string;           // UUID - Active box
  license_plate_id: string; // UUID - LP to pack
  so_line_id: string;       // UUID - Sales order line
  quantity: number;         // Quantity to pack (positive, max 999999999)
  notes?: string;           // Optional notes (max 500 chars)
}
```

**Success Response (201 Created):**

```typescript
{
  box_content: {
    id: string;
    quantity: number;
    product_name: string;
    lot_number: string | null;
  };
  box_summary: {
    item_count: number;
    total_weight_est: number;
    items: Array<{
      product_name: string;
      quantity: number;
      uom: string;
    }>;
  };
  so_line_status: {
    packed_qty: number;
    remaining_qty: number;
    status: 'partial' | 'complete';
  };
  allergen_warning: {
    matches: string[];
    customer_name: string;
    product_name: string;
  } | null;
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | LP_NOT_ALLOCATED | LP not allocated to this shipment |
| 400 | QUANTITY_EXCEEDS_AVAILABLE | Quantity exceeds LP available qty |
| 400 | BOX_CLOSED | Cannot pack to closed box |
| 400 | SHIPMENT_NOT_PACKABLE | Shipment status not in [pending, packing] |
| 404 | NOT_FOUND | Shipment, box, or LP not found |

**Example:**

```bash
curl -X POST /api/shipping/scanner/pack \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "shipment_id": "550e8400-e29b-41d4-a716-446655440001",
    "box_id": "550e8400-e29b-41d4-a716-446655440002",
    "license_plate_id": "550e8400-e29b-41d4-a716-446655440003",
    "so_line_id": "550e8400-e29b-41d4-a716-446655440004",
    "quantity": 50
  }'
```

---

### POST /api/shipping/scanner/pack/box/create

Create a new box for a shipment with auto-incrementing box number.

**Request Body:**

```typescript
{
  shipment_id: string; // UUID - Target shipment
}
```

**Success Response (201 Created):**

```typescript
{
  id: string;
  box_number: number;    // Auto-incremented (1, 2, 3...)
  status: 'open';
  weight: null;
  dimensions: {
    length: null;
    width: null;
    height: null;
  };
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | SHIPMENT_NOT_PACKABLE | Shipment status not packable |
| 404 | SHIPMENT_NOT_FOUND | Shipment not found |

---

### POST /api/shipping/scanner/pack/box/close

Close a box with optional weight and dimensions.

**Request Body:**

```typescript
{
  box_id: string;      // UUID - Box to close
  weight?: number;     // Optional, kg (positive, max 1000)
  length?: number;     // Optional, cm (positive, max 500)
  width?: number;      // Optional, cm (positive, max 500)
  height?: number;     // Optional, cm (positive, max 500)
}
```

**Success Response (200 OK):**

```typescript
{
  id: string;
  box_number: number;
  status: 'closed';
  weight: number | null;
  dimensions: {
    length: number | null;
    width: number | null;
    height: number | null;
  };
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | EMPTY_BOX | Cannot close empty box |
| 400 | ALREADY_CLOSED | Box already closed |
| 400 | INVALID_WEIGHT | Weight must be positive |
| 404 | NOT_FOUND | Box not found |

---

### GET /api/shipping/scanner/pack/shipments

List pending shipments available for packing.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| warehouse_id | UUID | - | Filter by warehouse |
| search | string | - | Search SO/customer/shipment number |
| limit | number | 50 | Max results (1-100) |

**Success Response (200 OK):**

```typescript
{
  data: Array<{
    id: string;
    shipment_number: string;
    so_number: string;
    customer_name: string;
    status: 'pending' | 'packing';
    promised_ship_date: string | null;
    lines_total: number;
    lines_packed: number;
    boxes_count: number;
    allergen_alert: boolean;
  }>;
  total: number;
}
```

**Example:**

```bash
curl "/api/shipping/scanner/pack/shipments?warehouse_id=wh-001&limit=20" \
  -H "Authorization: Bearer {token}"
```

---

### GET /api/shipping/scanner/pack/lookup/:barcode

Lookup shipment or LP by barcode.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| barcode | string | SO number, shipment number, or LP number |

**Query Parameters (for LP lookup):**

| Parameter | Type | Description |
|-----------|------|-------------|
| shipment_id | UUID | Required for LP allocation validation |

**Success Response - Shipment (200 OK):**

```typescript
{
  type: 'shipment';
  data: {
    id: string;
    shipment_number: string;
    so_number: string;
    customer_name: string;
    lines_total: number;
    allergen_restrictions: string[];
  };
}
```

**Success Response - License Plate (200 OK):**

```typescript
{
  type: 'license_plate';
  data: {
    lp: {
      id: string;
      lp_number: string;
      product_id: string;
      product_name: string;
      quantity: number;
      lot_number: string | null;
    };
    allocated: boolean;
    so_line_id: string | null;
    available_qty: number;
  };
}
```

**Error Response:**

| Status | Code | Description |
|--------|------|-------------|
| 404 | NOT_FOUND | Barcode not found |

---

### GET /api/shipping/scanner/pack/box/:boxId

Get box details with contents.

**Success Response (200 OK):**

```typescript
{
  box: {
    id: string;
    box_number: number;
    status: 'open' | 'closed';
    weight: number | null;
    dimensions: {
      length: number | null;
      width: number | null;
      height: number | null;
    };
  };
  contents: Array<{
    id: string;
    product_name: string;
    lot_number: string | null;
    lp_number: string;
    quantity: number;
  }>;
  summary: {
    item_count: number;
    total_weight_est: number;
    items: Array<{
      product_name: string;
      quantity: number;
      uom: string;
    }>;
  };
}
```

---

### DELETE /api/shipping/scanner/pack/box/:boxId/item/:itemId

Remove an item from a box (undo pack operation).

**Success Response (204 No Content)**

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | BOX_CLOSED | Cannot modify closed box |
| 404 | NOT_FOUND | Item not found |

---

## Performance Requirements

| Endpoint | Target Response Time |
|----------|---------------------|
| Pack item | < 500ms |
| Create box | < 100ms |
| Close box | < 200ms |
| List shipments | < 500ms |
| Barcode lookup | < 200ms |
| Box details | < 200ms |

---

## Validation Rules

### Pack Item

- `shipment_id`: Required UUID
- `box_id`: Required UUID (must belong to shipment)
- `license_plate_id`: Required UUID (must be allocated to shipment)
- `so_line_id`: Required UUID
- `quantity`: Required positive number, max 999999999, must not exceed LP available qty
- `notes`: Optional string, max 500 characters

### Close Box

- `box_id`: Required UUID
- `weight`: Optional positive number, max 1000 kg
- `length/width/height`: Optional positive numbers, max 500 cm

---

## Business Rules

1. **Shipment Status**: Only shipments with status `pending` or `packing` can be packed
2. **LP Allocation**: LP must be allocated to the shipment via pick list to be packed
3. **Quantity Validation**: Cannot pack more than LP available quantity
4. **Box State**: Cannot add items to or modify closed boxes
5. **Empty Box**: Cannot close a box with no contents
6. **Auto-Increment**: Box numbers auto-increment per shipment (1, 2, 3...)
7. **Status Update**: First pack operation changes shipment status from `pending` to `packing`

---

## Related Stories

- **07.11** - Packing Station Workflow (desktop)
- **07.10** - Pick Confirmation Scanner
- **07.13** - SSCC + Labels + BOL
- **07.14** - Shipment Manifest & Ship
