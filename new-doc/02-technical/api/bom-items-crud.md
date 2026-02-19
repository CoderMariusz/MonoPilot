# BOM Items API Reference

**Module**: Technical
**Story**: 02.5a - BOM Items Core (MVP)
**Version**: 1.0
**Status**: Production ✅

## Overview

The BOM Items API provides full CRUD (Create, Read, Update, Delete) operations for managing components in a Bill of Materials. Each BOM can contain multiple items (raw materials, ingredients, packaging) with sequence ordering, unit-of-measure validation, and optional operation assignment.

**Key Features**:
- List all items for a BOM with product details
- Create new items with auto-sequence and UoM validation
- Update existing items (partial updates supported)
- Delete items with automatic cleanup
- Get next sequence number for auto-increment
- Non-blocking UoM mismatch warnings
- Multi-tenant isolation via RLS

---

## Authentication

All endpoints require authentication. Include the user session token in requests.

**Status Codes**:
- `200 OK` - Successful read or update
- `201 Created` - Item successfully created
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - BOM or item not found
- `500 Internal Server Error` - Server error

---

## Endpoints

### 1. GET /api/v1/technical/boms/{id}/items

List all items for a BOM with product details and summary.

**Parameters**:
- `id` (path, required) - UUID of the BOM

**Permissions**:
- Required role: Any authenticated user with `technical.R` (Read)

**Response** (200 OK):
```json
{
  "items": [
    {
      "id": "uuid",
      "bom_id": "uuid",
      "product_id": "uuid",
      "product_code": "RM-001",
      "product_name": "Wheat Flour Premium",
      "product_type": "RM",
      "product_base_uom": "kg",
      "quantity": 50.000000,
      "uom": "kg",
      "sequence": 10,
      "operation_seq": 10,
      "operation_name": "Mixing",
      "scrap_percent": 2.0,
      "notes": "Mix for 5 minutes",
      "created_at": "2025-12-28T10:00:00Z",
      "updated_at": "2025-12-28T10:05:00Z"
    },
    {
      "id": "uuid",
      "bom_id": "uuid",
      "product_id": "uuid",
      "product_code": "ING-002",
      "product_name": "Honey Organic",
      "product_type": "ING",
      "product_base_uom": "kg",
      "quantity": 5.000000,
      "uom": "kg",
      "sequence": 20,
      "operation_seq": 10,
      "operation_name": "Mixing",
      "scrap_percent": 0.5,
      "notes": null,
      "created_at": "2025-12-28T10:00:00Z",
      "updated_at": "2025-12-28T10:05:00Z"
    }
  ],
  "total": 2,
  "bom_output_qty": 100,
  "bom_output_uom": "kg"
}
```

**Response Fields**:
- `items` - Array of BOM items with product details
- `total` - Count of items
- `bom_output_qty` - Expected output quantity of the BOM
- `bom_output_uom` - Unit of measure for output

**Error Response** (404 Not Found):
```json
{
  "error": "BOM not found"
}
```

**cURL Example**:
```bash
curl -X GET https://app.example.com/api/v1/technical/boms/550e8400-e29b-41d4-a716-446655440000/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**JavaScript Example**:
```typescript
import { getBOMItems } from '@/lib/services/bom-items-service'

const response = await getBOMItems('550e8400-e29b-41d4-a716-446655440000')
console.log(`Loaded ${response.items.length} items for BOM`)
```

---

### 2. POST /api/v1/technical/boms/{id}/items

Create a new BOM item with optional auto-sequence and UoM validation.

**Parameters**:
- `id` (path, required) - UUID of the BOM

**Permissions**:
- Required role: `owner`, `admin`, `production_manager` (technical.C)

**Request Body**:
```json
{
  "product_id": "550e8400-e29b-41d4-a716-446655440000",
  "quantity": 50.000000,
  "uom": "kg",
  "sequence": 10,
  "operation_seq": 10,
  "scrap_percent": 2.0,
  "notes": "Mix for 5 minutes"
}
```

**Request Fields**:
- `product_id` (required) - UUID of the product (RM, ING, PKG, or WIP)
- `quantity` (required) - Amount needed (>0, max 6 decimal places)
- `uom` (required) - Unit of measure (e.g., "kg", "L", "pcs")
- `sequence` (optional) - Order in production (auto: max+10 if not provided)
- `operation_seq` (optional) - Sequence of operation in routing (must exist in routing)
- `scrap_percent` (optional, default 0) - Expected material loss (0-100)
- `notes` (optional) - Special handling notes (max 500 characters)

**Response** (201 Created):
```json
{
  "item": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "bom_id": "550e8400-e29b-41d4-a716-446655440000",
    "product_id": "550e8400-e29b-41d4-a716-446655440000",
    "product_code": "RM-001",
    "product_name": "Wheat Flour Premium",
    "product_type": "RM",
    "product_base_uom": "kg",
    "quantity": 50.000000,
    "uom": "kg",
    "sequence": 10,
    "operation_seq": 10,
    "operation_name": "Mixing",
    "scrap_percent": 2.0,
    "notes": "Mix for 5 minutes",
    "created_at": "2025-12-28T10:00:00Z",
    "updated_at": "2025-12-28T10:00:00Z"
  },
  "warnings": [
    {
      "code": "UOM_MISMATCH",
      "message": "UoM does not match component base UoM",
      "details": "Component base UoM is 'kg', you entered 'L'"
    }
  ]
}
```

**Response Fields**:
- `item` - Created BOM item
- `warnings` - Non-blocking validation warnings (e.g., UoM mismatch)

**Error Responses**:

**400 Bad Request** - Validation error:
```json
{
  "error": "Quantity must be greater than 0",
  "details": [
    {
      "path": ["quantity"],
      "message": "Quantity must be greater than 0",
      "code": "too_small"
    }
  ]
}
```

**400 Bad Request** - Operation not found:
```json
{
  "error": "Operation does not exist in assigned routing"
}
```

**400 Bad Request** - No routing assigned:
```json
{
  "error": "Cannot assign operation: BOM has no routing assigned"
}
```

**404 Not Found**:
```json
{
  "error": "BOM not found"
}
```

**403 Forbidden**:
```json
{
  "error": "Permission denied"
}
```

**cURL Example**:
```bash
curl -X POST https://app.example.com/api/v1/technical/boms/550e8400-e29b-41d4-a716-446655440000/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "550e8400-e29b-41d4-a716-446655440000",
    "quantity": 50,
    "uom": "kg",
    "scrap_percent": 2
  }'
```

**JavaScript Example**:
```typescript
import { createBOMItem } from '@/lib/services/bom-items-service'

const response = await createBOMItem('550e8400-e29b-41d4-a716-446655440000', {
  product_id: '550e8400-e29b-41d4-a716-446655440000',
  quantity: 50,
  uom: 'kg',
  scrap_percent: 2,
})

if (response.warnings.length > 0) {
  console.warn('UoM mismatch warning:', response.warnings[0])
}
console.log('Created item:', response.item)
```

**React Hook Example**:
```typescript
import { useCreateBOMItem } from '@/lib/hooks/use-bom-items'

function AddItemForm({ bomId }) {
  const { mutate: createItem, isPending } = useCreateBOMItem()

  const handleSubmit = async (formData) => {
    try {
      createItem(
        { bomId, data: formData },
        {
          onSuccess: (response) => {
            console.log('Item created:', response.item)
            if (response.warnings.length > 0) {
              console.warn('Warnings:', response.warnings)
            }
          },
          onError: (error) => {
            console.error('Failed to create item:', error.message)
          },
        }
      )
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

---

### 3. PUT /api/v1/technical/boms/{id}/items/{itemId}

Update an existing BOM item (partial updates supported).

**Parameters**:
- `id` (path, required) - UUID of the BOM
- `itemId` (path, required) - UUID of the item to update

**Permissions**:
- Required role: `owner`, `admin`, `production_manager`, `quality_manager` (technical.U)
- Note: Quality Manager can update but not create or delete

**Request Body**:
```json
{
  "quantity": 75.000000,
  "sequence": 15,
  "scrap_percent": 3.0
}
```

**Request Fields** (all optional, only provided fields are updated):
- `quantity` - Amount needed (>0, max 6 decimal places)
- `uom` - Unit of measure
- `sequence` - Order in production
- `operation_seq` - Sequence of operation in routing
- `scrap_percent` - Expected material loss (0-100)
- `notes` - Special handling notes

**Response** (200 OK):
```json
{
  "item": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "bom_id": "550e8400-e29b-41d4-a716-446655440000",
    "product_id": "550e8400-e29b-41d4-a716-446655440000",
    "product_code": "RM-001",
    "product_name": "Wheat Flour Premium",
    "product_type": "RM",
    "product_base_uom": "kg",
    "quantity": 75.000000,
    "uom": "kg",
    "sequence": 15,
    "operation_seq": 10,
    "operation_name": "Mixing",
    "scrap_percent": 3.0,
    "notes": "Mix for 5 minutes",
    "created_at": "2025-12-28T10:00:00Z",
    "updated_at": "2025-12-28T10:05:00Z"
  },
  "warnings": []
}
```

**Error Responses**: Same as POST (400, 403, 404)

**cURL Example**:
```bash
curl -X PUT https://app.example.com/api/v1/technical/boms/550e8400-e29b-41d4-a716-446655440000/items/550e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 75,
    "scrap_percent": 3
  }'
```

**JavaScript Example**:
```typescript
import { updateBOMItem } from '@/lib/services/bom-items-service'

const response = await updateBOMItem(
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001',
  {
    quantity: 75,
    scrap_percent: 3,
  }
)
console.log('Updated item:', response.item)
```

---

### 4. DELETE /api/v1/technical/boms/{id}/items/{itemId}

Delete a BOM item.

**Parameters**:
- `id` (path, required) - UUID of the BOM
- `itemId` (path, required) - UUID of the item to delete

**Permissions**:
- Required role: `owner`, `admin` only (technical.D)
- More restrictive than update permissions

**Response** (200 OK):
```json
{
  "success": true,
  "message": "BOM item deleted successfully"
}
```

**Error Responses**:
- `403 Forbidden` - Insufficient permissions (Production Manager cannot delete)
- `404 Not Found` - BOM or item not found

**cURL Example**:
```bash
curl -X DELETE https://app.example.com/api/v1/technical/boms/550e8400-e29b-41d4-a716-446655440000/items/550e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer $TOKEN"
```

**JavaScript Example**:
```typescript
import { deleteBOMItem } from '@/lib/services/bom-items-service'

const response = await deleteBOMItem(
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001'
)
console.log('Item deleted:', response.message)
```

---

### 5. GET /api/v1/technical/boms/{id}/items/next-sequence

Get the next sequence number for auto-increment (max existing + 10, or 10 for empty BOM).

**Parameters**:
- `id` (path, required) - UUID of the BOM

**Permissions**:
- Required role: Any authenticated user with `technical.R`

**Response** (200 OK):
```json
{
  "next_sequence": 40
}
```

**Error Response** (404 Not Found):
```json
{
  "error": "BOM not found"
}
```

**cURL Example**:
```bash
curl -X GET https://app.example.com/api/v1/technical/boms/550e8400-e29b-41d4-a716-446655440000/items/next-sequence \
  -H "Authorization: Bearer $TOKEN"
```

**JavaScript Example**:
```typescript
import { getNextSequence } from '@/lib/services/bom-items-service'

const nextSeq = await getNextSequence('550e8400-e29b-41d4-a716-446655440000')
console.log('Next sequence:', nextSeq) // Output: 40
```

---

## Request/Response Details

### Validation Rules

**Quantity**:
- Must be > 0 (enforced at client and database level)
- Maximum 6 decimal places
- Tested values: 0.000001 to 99999.999999
- Error: "Quantity must be greater than 0"

**UoM (Unit of Measure)**:
- Auto-filled from product's `base_uom`
- Non-blocking warning if doesn't match component's base UoM
- Warning logged but save succeeds
- Warning message: "UoM mismatch: component base UoM is 'kg', you entered 'L'"

**Sequence**:
- Auto-calculated: max(existing sequences) + 10
- Defaults to 10 for empty BOM
- Can be manually overridden
- Non-negative integer

**Scrap Percentage**:
- Valid range: 0-100
- Default: 0
- 2 decimal places supported

**Operation Assignment**:
- Optional (null allowed)
- Must exist in BOM's assigned routing (if provided)
- Cannot assign operation if BOM has no routing
- Returns operation name in response: "Op 10: Mixing"

**Notes**:
- Optional
- Max 500 characters

### Error Code Mapping

| Database Code | HTTP Status | Message |
|---|---|---|
| 23514 | 400 | Quantity must be greater than 0 |
| ROUTING_NOT_FOUND | 400 | Cannot assign operation: BOM has no routing assigned |
| OPERATION_NOT_FOUND | 400 | Operation does not exist in assigned routing |
| PRODUCT_NOT_FOUND | 404 | Component product not found |
| BOM_NOT_FOUND | 404 | BOM not found |

---

## Rate Limiting

No explicit rate limits documented. Follow standard API best practices.

---

## Multi-Tenant Isolation

All endpoints enforce multi-tenant isolation via RLS (Row Level Security) policies:

- BOM items are scoped to the user's organization
- Cross-organization access returns 404 (not 403)
- Authenticated users can only access BOMs in their organization

---

## Backward Compatibility

**Version**: 1.0
**Breaking Changes**: None expected for MVP

---

## Related Endpoints

- [GET /api/v1/technical/boms/{id}](./bom-header-crud.md) - BOM header details
- [GET /api/v1/settings/products](./products-list.md) - List products for component selection
- [GET /api/v1/technical/routings/{id}/operations](./routing-operations.md) - List operations for assignment

---

## Testing

### Test All Endpoints with Bash

```bash
#!/bin/bash

# Set your Bearer token
TOKEN="your-bearer-token-here"
BASE_URL="https://app.example.com"
BOM_ID="550e8400-e29b-41d4-a716-446655440000"

# 1. List items
echo "1. Testing GET /items..."
curl -X GET "$BASE_URL/api/v1/technical/boms/$BOM_ID/items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# 2. Create item
echo "\n2. Testing POST /items..."
RESPONSE=$(curl -X POST "$BASE_URL/api/v1/technical/boms/$BOM_ID/items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "550e8400-e29b-41d4-a716-446655440002",
    "quantity": 50,
    "uom": "kg",
    "scrap_percent": 2
  }')
echo "$RESPONSE"
ITEM_ID=$(echo "$RESPONSE" | jq -r '.item.id')

# 3. Update item
echo "\n3. Testing PUT /items/$ITEM_ID..."
curl -X PUT "$BASE_URL/api/v1/technical/boms/$BOM_ID/items/$ITEM_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 75,
    "scrap_percent": 3
  }'

# 4. Get next sequence
echo "\n4. Testing GET /items/next-sequence..."
curl -X GET "$BASE_URL/api/v1/technical/boms/$BOM_ID/items/next-sequence" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# 5. Delete item
echo "\n5. Testing DELETE /items/$ITEM_ID..."
curl -X DELETE "$BASE_URL/api/v1/technical/boms/$BOM_ID/items/$ITEM_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Support

For issues or questions:
1. Check the [BOM Items Developer Guide](../developer-guides/bom-items-management.md)
2. Review test suite: `apps/frontend/app/api/v1/technical/boms/[id]/items/__tests__/`
3. Contact: technical-team@example.com

