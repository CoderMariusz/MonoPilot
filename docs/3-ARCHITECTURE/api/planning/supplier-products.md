# Supplier-Product Assignment API

Story: 03.2 - Supplier-Product Assignment

This document describes all API endpoints for managing supplier-product assignments. These endpoints enable you to assign products to suppliers with negotiated pricing, lead times, and procurement terms.

## Overview

The Supplier-Product Assignment API manages the junction table between suppliers and products. Each assignment can override default product values like price, lead time, and minimum order quantity (MOQ).

## Endpoints

### 1. List Products for a Supplier

Retrieves all products assigned to a specific supplier.

```http
GET /api/planning/suppliers/:supplierId/products
```

#### Parameters

**Path Parameters:**
- `supplierId` (UUID, required): The supplier ID

**Query Parameters:**
- `search` (string, optional): Filter by product code, name, or supplier product code
- `sort` (string, optional): Sort field (`product_code`, `product_name`, `unit_price`, `is_default`). Default: `created_at`
- `order` (string, optional): Sort order (`asc` or `desc`). Default: `asc`

#### Request Example

```bash
curl -X GET \
  'http://localhost:3000/api/planning/suppliers/550e8400-e29b-41d4-a716-446655440000/products?search=flour&sort=product_code' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "supplier_id": "550e8400-e29b-41d4-a716-446655440000",
      "product_id": "770e8400-e29b-41d4-a716-446655440002",
      "is_default": true,
      "supplier_product_code": "MILL-FLOUR-A",
      "unit_price": 10.50,
      "currency": "PLN",
      "lead_time_days": 5,
      "moq": 100,
      "order_multiple": 50,
      "last_purchase_date": "2025-12-20",
      "last_purchase_price": 10.50,
      "notes": "Premium quality flour",
      "created_at": "2025-12-16T10:30:00Z",
      "updated_at": "2025-12-16T10:30:00Z",
      "product": {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "code": "FLOUR",
        "name": "Wheat Flour",
        "uom": "kg",
        "supplier_lead_time_days": 7
      }
    }
  ],
  "meta": {
    "total": 1,
    "default_count": 1
  }
}
```

#### Error Responses

**401 Unauthorized**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**404 Supplier Not Found**
```json
{
  "success": false,
  "error": "Supplier not found"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "error": "User organization not found"
}
```

---

### 2. Assign Product to Supplier

Creates a new supplier-product assignment with optional pricing and procurement overrides.

```http
POST /api/planning/suppliers/:supplierId/products
```

#### Parameters

**Path Parameters:**
- `supplierId` (UUID, required): The supplier ID

**Request Body:**
```typescript
{
  product_id: string          // UUID of product (required)
  is_default?: boolean        // Mark as default supplier (optional, default: false)
  supplier_product_code?: string | null   // Supplier SKU (optional, max 50 chars)
  unit_price?: number | null  // Price per unit (optional, must be > 0)
  currency?: string | null    // Currency code (optional: PLN, EUR, USD, GBP)
  lead_time_days?: number | null   // Lead time override (optional, must be >= 0)
  moq?: number | null         // Minimum order quantity (optional, must be > 0)
  order_multiple?: number | null   // Order multiple (optional, must be > 0)
  notes?: string | null       // Additional notes (optional, max 1000 chars)
}
```

#### Request Example

```bash
curl -X POST \
  'http://localhost:3000/api/planning/suppliers/550e8400-e29b-41d4-a716-446655440000/products' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "product_id": "770e8400-e29b-41d4-a716-446655440002",
    "is_default": true,
    "supplier_product_code": "MILL-FLOUR-A",
    "unit_price": 10.50,
    "currency": "PLN",
    "lead_time_days": 5,
    "moq": 100,
    "order_multiple": 50,
    "notes": "Premium quality flour"
  }'
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "supplier_id": "550e8400-e29b-41d4-a716-446655440000",
    "product_id": "770e8400-e29b-41d4-a716-446655440002",
    "is_default": true,
    "supplier_product_code": "MILL-FLOUR-A",
    "unit_price": 10.50,
    "currency": "PLN",
    "lead_time_days": 5,
    "moq": 100,
    "order_multiple": 50,
    "last_purchase_date": null,
    "last_purchase_price": null,
    "notes": "Premium quality flour",
    "created_at": "2025-12-16T10:30:00Z",
    "updated_at": "2025-12-16T10:30:00Z"
  }
}
```

#### Error Responses

**400 Bad Request - Validation Failed**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "code": "too_big",
      "maximum": 50,
      "type": "string",
      "message": "Max 50 characters",
      "path": ["supplier_product_code"]
    }
  ]
}
```

**400 Bad Request - Duplicate Assignment**
```json
{
  "success": false,
  "error": "This product is already assigned to this supplier"
}
```

**404 Not Found**
```json
{
  "success": false,
  "error": "Supplier not found"
}
```

**404 Not Found - Product**
```json
{
  "success": false,
  "error": "Product not found"
}
```

---

### 3. Update Supplier-Product Assignment

Updates an existing supplier-product assignment. When setting `is_default` to true, all other defaults for that product are automatically unset.

```http
PUT /api/planning/suppliers/:supplierId/products/:productId
```

#### Parameters

**Path Parameters:**
- `supplierId` (UUID, required): The supplier ID
- `productId` (UUID, required): The product ID

**Request Body:** (all fields optional)
```typescript
{
  is_default?: boolean        // Mark as default supplier
  supplier_product_code?: string | null   // Update supplier SKU
  unit_price?: number | null  // Update price
  currency?: string | null    // Update currency
  lead_time_days?: number | null   // Update lead time
  moq?: number | null         // Update MOQ
  order_multiple?: number | null   // Update order multiple
  notes?: string | null       // Update notes
}
```

#### Request Example

```bash
curl -X PUT \
  'http://localhost:3000/api/planning/suppliers/550e8400-e29b-41d4-a716-446655440000/products/770e8400-e29b-41d4-a716-446655440002' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "unit_price": 12.00,
    "is_default": true
  }'
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "supplier_id": "550e8400-e29b-41d4-a716-446655440000",
    "product_id": "770e8400-e29b-41d4-a716-446655440002",
    "is_default": true,
    "supplier_product_code": "MILL-FLOUR-A",
    "unit_price": 12.00,
    "currency": "PLN",
    "lead_time_days": 5,
    "moq": 100,
    "order_multiple": 50,
    "last_purchase_date": "2025-12-20",
    "last_purchase_price": 10.50,
    "notes": "Premium quality flour",
    "created_at": "2025-12-16T10:30:00Z",
    "updated_at": "2025-12-16T11:45:00Z"
  }
}
```

#### Error Responses

**404 Not Found**
```json
{
  "success": false,
  "error": "Supplier-product assignment not found"
}
```

**400 Bad Request - Validation**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "code": "invalid_enum_value",
      "enum": ["PLN", "EUR", "USD", "GBP"],
      "message": "Invalid currency",
      "path": ["currency"]
    }
  ]
}
```

---

### 4. Remove Product from Supplier

Deletes a supplier-product assignment. The product and supplier records are not affected.

```http
DELETE /api/planning/suppliers/:supplierId/products/:productId
```

#### Parameters

**Path Parameters:**
- `supplierId` (UUID, required): The supplier ID
- `productId` (UUID, required): The product ID

#### Request Example

```bash
curl -X DELETE \
  'http://localhost:3000/api/planning/suppliers/550e8400-e29b-41d4-a716-446655440000/products/770e8400-e29b-41d4-a716-446655440002' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Product assignment removed"
}
```

#### Error Responses

**404 Not Found**
```json
{
  "success": false,
  "error": "Supplier-product assignment not found"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "error": "User organization not found"
}
```

---

### 5. Get Default Supplier for Product

Retrieves the default supplier assignment for a product, used during purchase order creation.

```http
GET /api/planning/products/:productId/default-supplier
```

#### Parameters

**Path Parameters:**
- `productId` (UUID, required): The product ID

#### Request Example

```bash
curl -X GET \
  'http://localhost:3000/api/planning/products/770e8400-e29b-41d4-a716-446655440002/default-supplier' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

#### Response (200 OK) - With Default Supplier

```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "supplier_id": "550e8400-e29b-41d4-a716-446655440000",
    "product_id": "770e8400-e29b-41d4-a716-446655440002",
    "is_default": true,
    "supplier_product_code": "MILL-FLOUR-A",
    "unit_price": 10.50,
    "currency": "PLN",
    "lead_time_days": 5,
    "moq": 100,
    "order_multiple": 50,
    "last_purchase_date": "2025-12-20",
    "last_purchase_price": 10.50,
    "notes": "Premium quality flour",
    "created_at": "2025-12-16T10:30:00Z",
    "updated_at": "2025-12-16T10:30:00Z",
    "supplier": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "code": "SUP001",
      "name": "Premium Flour Mill",
      "currency": "PLN"
    }
  }
}
```

#### Response (200 OK) - No Default Supplier

```json
{
  "success": true,
  "data": null
}
```

#### Error Responses

**404 Product Not Found**
```json
{
  "success": false,
  "error": "Product not found"
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

---

## Data Types

### SupplierProduct

Complete representation of a supplier-product assignment:

```typescript
{
  id: string                      // UUID, auto-generated
  supplier_id: string             // UUID, references suppliers
  product_id: string              // UUID, references products
  is_default: boolean             // Only ONE true per product
  supplier_product_code: string | null   // Supplier SKU, max 50 chars
  unit_price: number | null       // Price per unit, decimal(15,4)
  currency: string | null         // PLN, EUR, USD, GBP
  lead_time_days: number | null   // Days, non-negative integer
  moq: number | null              // Minimum order quantity
  order_multiple: number | null   // Order multiple
  last_purchase_date: string | null   // ISO date
  last_purchase_price: number | null  // Price from last PO
  notes: string | null            // Max 1000 characters
  created_at: string              // ISO timestamp, auto-set
  updated_at: string              // ISO timestamp, auto-updated
}
```

### ProductSummary

Product information embedded in supplier product responses:

```typescript
{
  id: string                      // UUID
  code: string                    // Product code
  name: string                    // Product name
  uom: string                     // Unit of measure
  supplier_lead_time_days: number | null   // Default lead time
}
```

### SupplierSummary

Supplier information embedded in default supplier responses:

```typescript
{
  id: string                      // UUID
  code: string                    // Supplier code
  name: string                    // Supplier name
  currency: string                // Default currency
}
```

---

## Key Business Rules

### 1. Default Supplier Atomicity

Only one supplier-product assignment per product can have `is_default = true`. When you set a new default:

- All other suppliers for that product are automatically set to `is_default = false`
- This happens atomically at the database level
- No need for client-side checks

### 2. Lead Time Resolution

When creating a purchase order, lead time is resolved with fallback:

```typescript
const leadTime = supplierProduct.lead_time_days
  ?? product.supplier_lead_time_days
  ?? 0
```

If the supplier has an override, it takes precedence. Otherwise, the product default is used.

### 3. Currency Default

If `supplier_products.currency` is NULL, the supplier's default currency is used:

```typescript
const currency = supplierProduct.currency ?? supplier.currency
```

### 4. MOQ and Order Multiple

Procurement validation uses:

```typescript
const moq = supplierProduct.moq ?? product.moq ?? 0
const orderMultiple = supplierProduct.order_multiple ?? product.order_multiple ?? 1
```

### 5. Duplicate Prevention

The database enforces `UNIQUE(supplier_id, product_id)`. Attempting to assign the same product to the same supplier twice returns HTTP 400.

### 6. Last Purchase Tracking

When a purchase order is confirmed (Story 03.3), `last_purchase_date` and `last_purchase_price` are automatically updated.

---

## Validation Rules

### Currency Enum

Valid currencies:
- `PLN` - Polish Zloty
- `EUR` - Euro
- `USD` - US Dollar
- `GBP` - British Pound

### Price Validation

- Must be positive (> 0) or null
- Stored as DECIMAL(15,4) - allows up to 15 digits with 4 decimal places
- Example: 1234567890.9999

### Lead Time

- Must be non-negative integer (>= 0) or null
- Represents days
- NULL means no override (product default will be used)

### MOQ and Order Multiple

- Must be positive (> 0) or null
- Represents quantity units
- Follows product's unit of measure (UOM)

### Supplier Product Code

- Max 50 characters
- Any string value accepted
- Used for supplier communication and PO export

### Notes

- Max 1000 characters
- Free-form text
- Optional

---

## Multi-Tenancy and Security

### Row-Level Security (RLS)

All queries are automatically filtered by organization. Users can only see supplier-products for:

1. Suppliers that belong to their organization
2. Products that belong to their organization

RLS policies enforce this at the database level - no API-level checks needed.

### Authentication

All endpoints require a valid session token (Authorization header):

```
Authorization: Bearer YOUR_SUPABASE_SESSION_TOKEN
```

### Role-Based Access

In future versions, role checks may restrict who can assign products:
- Admin: Full access
- Planner: Assign/modify products
- Operator: Read-only

Currently, all authenticated users can perform all operations.

---

## Performance Considerations

### Indexes

The database includes indexes for fast queries:

- `idx_supplier_products_supplier` - For listing products by supplier
- `idx_supplier_products_product` - For finding default supplier by product
- `idx_supplier_products_default` - Optimized for default lookups

### Pagination

For suppliers with hundreds of products:

- The API returns all results in one request
- Frontend should implement pagination at 20 items per page
- Consider lazy-loading the Products tab on supplier detail page

### Caching

Default supplier lookups are used frequently during PO creation:

- Consider caching for 5 minutes in production
- Cache key: `default_supplier:{productId}`
- Invalidate on `is_default` update

---

## Common Workflows

### Workflow 1: Assign Product with Full Pricing

```bash
# 1. Assign product with pricing and lead time
curl -X POST \
  'http://localhost:3000/api/planning/suppliers/550e8400-e29b-41d4-a716-446655440000/products' \
  -H 'Content-Type: application/json' \
  -d '{
    "product_id": "770e8400-e29b-41d4-a716-446655440002",
    "supplier_product_code": "MILL-FL-A",
    "unit_price": 10.50,
    "currency": "PLN",
    "lead_time_days": 5,
    "moq": 100,
    "order_multiple": 50
  }'
```

### Workflow 2: Set Default Supplier for Product

```bash
# 1. First, assign the product if not already assigned
# 2. Then, set it as default
curl -X PUT \
  'http://localhost:3000/api/planning/suppliers/550e8400-e29b-41d4-a716-446655440000/products/770e8400-e29b-41d4-a716-446655440002' \
  -H 'Content-Type: application/json' \
  -d '{
    "is_default": true
  }'
```

### Workflow 3: Update Pricing

```bash
# Update just the price for an existing assignment
curl -X PUT \
  'http://localhost:3000/api/planning/suppliers/550e8400-e29b-41d4-a716-446655440000/products/770e8400-e29b-41d4-a716-446655440002' \
  -H 'Content-Type: application/json' \
  -d '{
    "unit_price": 12.00
  }'
```

### Workflow 4: Fetch Default Supplier

```bash
# Used during PO creation to pre-fill supplier and pricing
curl -X GET \
  'http://localhost:3000/api/planning/products/770e8400-e29b-41d4-a716-446655440002/default-supplier' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

## HTTP Status Codes

| Code | Meaning | Scenario |
|------|---------|----------|
| 200 | OK | Successful GET or PUT |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation failed, duplicate assignment |
| 401 | Unauthorized | Missing or invalid session token |
| 403 | Forbidden | User organization mismatch |
| 404 | Not Found | Supplier, product, or assignment not found |
| 500 | Server Error | Database or unexpected error |

---

## Integration with Other Stories

### Story 03.1 - Suppliers CRUD

Supplier-Product depends on suppliers existing:

- When a supplier is deleted, all its supplier-products are cascade-deleted
- Use supplier code and currency from Story 03.1

### Story 03.3 - Purchase Order Creation

Supplier-Product provides data to PO creation:

- Default supplier lookup populates PO header
- Unit price pre-fills PO line
- Lead time calculates expected delivery date
- MOQ/order_multiple validate PO quantities

### Story 03.4 - Bulk PO Creation

Bulk PO uses default supplier assignments:

- Groups products by default supplier
- Creates multiple POs (one per supplier)
- Pre-fills pricing and lead times from assignments

---

## Testing

### Example Test Cases

**GET /api/planning/suppliers/:supplierId/products**
- Lists all products for a supplier
- Filters by search parameter
- Sorts by product code ascending/descending

**POST /api/planning/suppliers/:supplierId/products**
- Assigns new product with full data
- Assigns product with minimal data
- Prevents duplicate assignment (returns 400)
- Auto-unsets previous default when is_default=true

**PUT /api/planning/suppliers/:supplierId/products/:productId**
- Updates price only
- Updates is_default toggle
- Updates multiple fields

**DELETE /api/planning/suppliers/:supplierId/products/:productId**
- Removes assignment successfully
- Returns 404 if assignment not found

**GET /api/planning/products/:productId/default-supplier**
- Returns default supplier when one exists
- Returns null when no default exists
- Honors RLS (no access to other org's suppliers)

---

## Version

- Current Version: 1.0
- Last Updated: 2025-12-16
- Story: 03.2 - Supplier-Product Assignment

For updates and changes, see the CHANGELOG.
