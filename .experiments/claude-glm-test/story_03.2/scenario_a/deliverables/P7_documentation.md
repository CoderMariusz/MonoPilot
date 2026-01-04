# P7: Documentation - Supplier-Product Assignments

**Story**: 03.2
**Scenario**: A (Claude Full Flow)
**Phase**: P7 - Documentation
**Tech Writer**: Claude (Tech Writer Agent)

---

## Table of Contents

1. [Overview](#overview)
2. [API Reference](#api-reference)
3. [User Guide](#user-guide)
4. [Database Schema](#database-schema)
5. [Integration Guide](#integration-guide)
6. [Release Notes](#release-notes)

---

## Overview

### Feature Summary

The **Supplier-Product Assignments** feature enables organizations to link products to suppliers with supplier-specific pricing, lead times, and procurement terms. This streamlines purchase order creation by auto-populating PO lines with negotiated supplier data.

**Key Capabilities**:
- Assign any product to multiple suppliers
- Set supplier-specific pricing, lead times, MOQ, and order multiples
- Designate one default supplier per product for quick PO creation
- Track last purchase price and date for reference
- Manage supplier SKU mappings (supplier product codes)

**Use Cases**:
- **Procurement**: Quickly create POs with pre-negotiated supplier terms
- **Multi-Sourcing**: Maintain multiple suppliers per product for redundancy
- **Price Tracking**: Monitor supplier pricing changes over time
- **Negotiation**: Store contract terms and negotiated rates

---

## API Reference

### Base URL

```
/api/planning/suppliers/:supplierId/products
```

---

### Endpoints

#### 1. GET /api/planning/suppliers/:supplierId/products

Retrieve all products assigned to a supplier.

**Authentication**: Required
**Authorization**: User must have access to the supplier's organization

**Parameters**:
- `supplierId` (path, UUID, required): The supplier ID

**Response**: `200 OK`

```json
[
  {
    "id": "sp-001",
    "supplier_id": "sup-001",
    "product_id": "prod-001",
    "is_default": true,
    "supplier_product_code": "ACME-WW-001",
    "unit_price": 12.50,
    "currency": "PLN",
    "lead_time_days": 7,
    "moq": 100,
    "order_multiple": 25,
    "last_purchase_date": "2026-01-01",
    "last_purchase_price": 12.00,
    "notes": "Bulk discount applied",
    "created_at": "2026-01-01T10:00:00Z",
    "updated_at": "2026-01-02T15:30:00Z",
    "product": {
      "id": "prod-001",
      "code": "RM-001",
      "name": "Wheat Flour",
      "product_type": "RM",
      "base_uom": "kg"
    }
  }
]
```

**Error Responses**:
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Supplier not found or not in user's organization

---

#### 2. POST /api/planning/suppliers/:supplierId/products

Assign a product to a supplier.

**Authentication**: Required
**Authorization**: User must have Planner or Admin role

**Parameters**:
- `supplierId` (path, UUID, required): The supplier ID

**Request Body**:

```json
{
  "product_id": "prod-001",        // Required
  "is_default": false,             // Optional, default: false
  "supplier_product_code": "ACME-WW-001", // Optional
  "unit_price": 12.50,             // Optional
  "currency": "PLN",               // Optional (PLN|EUR|USD|GBP)
  "lead_time_days": 7,             // Optional, overrides product default
  "moq": 100,                      // Optional, overrides product default
  "order_multiple": 25,            // Optional
  "notes": "Negotiated price"      // Optional
}
```

**Validation Rules**:
- `product_id`: Must be valid UUID, product must exist in organization
- `unit_price`: Must be positive, max 4 decimal places
- `currency`: Must be one of: PLN, EUR, USD, GBP
- `lead_time_days`: Must be >= 0
- `moq`: Must be positive
- `order_multiple`: Must be positive
- `supplier_product_code`: Max 50 characters
- `notes`: Max 1000 characters

**Response**: `201 Created`

```json
{
  "id": "sp-002",
  "supplier_id": "sup-001",
  "product_id": "prod-001",
  "is_default": false,
  "unit_price": 12.50,
  "currency": "PLN",
  // ... other fields
}
```

**Error Responses**:
- `400 Bad Request`: Validation error (returns field-specific errors)
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User lacks permission (read-only role)
- `404 Not Found`: Supplier or product not found
- `409 Conflict`: Product already assigned to this supplier

**Example Request**:

```bash
curl -X POST \
  https://api.example.com/api/planning/suppliers/sup-001/products \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "product_id": "prod-001",
    "unit_price": 12.50,
    "currency": "PLN",
    "is_default": true
  }'
```

---

#### 3. PUT /api/planning/suppliers/:supplierId/products/:productId

Update an existing supplier-product assignment.

**Authentication**: Required
**Authorization**: User must have Planner or Admin role

**Parameters**:
- `supplierId` (path, UUID, required): The supplier ID
- `productId` (path, UUID, required): The product ID

**Request Body**: (all fields optional)

```json
{
  "unit_price": 13.00,
  "currency": "EUR",
  "is_default": true,
  "lead_time_days": 10,
  "moq": 150,
  "notes": "Updated contract terms"
}
```

**Response**: `200 OK`

```json
{
  "id": "sp-002",
  "supplier_id": "sup-001",
  "product_id": "prod-001",
  "unit_price": 13.00,      // Updated
  "currency": "EUR",         // Updated
  "is_default": true,        // Updated
  // ... other fields
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `404 Not Found`: Assignment not found

---

#### 4. DELETE /api/planning/suppliers/:supplierId/products/:productId

Remove a product assignment from a supplier.

**Authentication**: Required
**Authorization**: User must have Planner or Admin role

**Parameters**:
- `supplierId` (path, UUID, required): The supplier ID
- `productId` (path, UUID, required): The product ID

**Response**: `204 No Content`

**Error Responses**:
- `404 Not Found`: Assignment not found

**Note**: Delete is idempotent. Deleting a non-existent assignment returns 204.

---

#### 5. GET /api/planning/products/:productId/default-supplier

Get the default supplier for a product (used in PO creation).

**Authentication**: Required
**Authorization**: User must have access to product's organization

**Parameters**:
- `productId` (path, UUID, required): The product ID

**Response**: `200 OK`

```json
{
  "id": "sp-001",
  "supplier_id": "sup-001",
  "product_id": "prod-001",
  "is_default": true,
  "unit_price": 12.50,
  "currency": "PLN",
  "lead_time_days": 7,
  "supplier": {
    "id": "sup-001",
    "code": "SUP-001",
    "name": "ACME Ingredients",
    "currency": "PLN"
  }
}
```

**Error Responses**:
- `404 Not Found`: No default supplier set for this product

---

## User Guide

### For Planners

#### Assigning a Product to a Supplier

1. **Navigate** to Planning > Suppliers
2. **Click** on a supplier (e.g., "ACME Ingredients")
3. **Click** the "Products" tab
4. **Click** "+ Assign Product" button
5. **Search and select** the product from the dropdown
6. **(Optional)** Enter supplier-specific details:
   - **Unit Price**: Negotiated price (e.g., 12.50)
   - **Currency**: Select currency (PLN, EUR, USD, GBP)
   - **Lead Time**: Delivery time in days (e.g., 7)
   - **MOQ**: Minimum order quantity (e.g., 100 kg)
   - **Order Multiple**: Order quantity must be a multiple of this (e.g., 25 kg)
   - **Supplier Product Code**: Supplier's SKU (e.g., "ACME-WW-001")
   - **Notes**: Contract details, negotiation notes, etc.
7. **(Optional)** Check "Set as default supplier" to use this supplier by default in POs
8. **Click** "Assign Product"

**Result**: Product appears in the supplier's products table. When creating a PO for this supplier, this product can be quickly added with pre-filled pricing and terms.

---

#### Setting a Default Supplier

**Why**: When creating a PO without specifying a supplier, the system uses the default supplier for each product.

**How**:
1. Navigate to a supplier's Products tab
2. Find the product row
3. **Click the checkbox** in the "Default" column
4. **Result**: This supplier is now the default for this product
5. **Note**: Only ONE default supplier per product. Setting a new default automatically unsets the previous one.

**Example**:
- Product: RM-001 (Wheat Flour)
- Suppliers: SUP-001 (ACME), SUP-002 (Baker's Supply)
- Set SUP-001 as default → PO creation auto-selects ACME for Wheat Flour

---

#### Editing Supplier-Product Details

**To update pricing or terms after assignment**:

1. Navigate to the supplier's Products tab
2. Find the product row
3. **Click** the Edit icon (pencil)
4. **Update** fields (price, lead time, MOQ, notes, etc.)
5. **Click** "Save Changes"

**Common Updates**:
- Price changes after renegotiation
- Lead time adjustments based on supplier performance
- MOQ changes for bulk discounts
- Notes for contract renewals or special terms

---

#### Removing a Product from a Supplier

1. Navigate to the supplier's Products tab
2. Find the product row
3. **Click** the Delete icon (trash)
4. **Confirm** the deletion
5. **Result**: Product is unassigned from this supplier (product itself is NOT deleted)

**Note**: If this was the default supplier, you'll need to set a new default.

---

#### Searching and Filtering Products

**Search**:
- Use the search box to filter by product code or name
- Search is debounced (waits 300ms after you stop typing)

**Filters**:
- **All Products**: Show all assigned products
- **Default Only**: Show only products where this supplier is the default
- **Has Price**: Show only products with a unit price set
- **No Price**: Show products missing pricing (needs negotiation)

---

### For Administrators

#### Managing Permissions

**Required Roles**:
- **Admin**: Full access (assign, edit, delete)
- **Planner**: Full access (assign, edit, delete)
- **Viewer**: Read-only (can view products but not modify)

**Setting Roles**:
1. Navigate to Settings > Users
2. Assign user to role: Admin, Planner, or Viewer
3. Save changes

---

#### Data Import (Future Feature)

**Planned for Phase 1**:
- Bulk import supplier-product assignments via CSV
- Format: `supplier_code,product_code,unit_price,currency,lead_time_days,moq`
- Will validate all assignments before import
- Duplicate prevention enforced

---

## Database Schema

### Table: supplier_products

**Purpose**: Junction table linking suppliers to products with supplier-specific terms.

**Columns**:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key |
| supplier_id | UUID | No | FK to suppliers.id (CASCADE on delete) |
| product_id | UUID | No | FK to products.id (CASCADE on delete) |
| is_default | BOOLEAN | No | Default: false. Only one per product. |
| supplier_product_code | TEXT | Yes | Supplier's internal SKU |
| unit_price | DECIMAL(15,4) | Yes | Negotiated price |
| currency | TEXT | Yes | PLN, EUR, USD, GBP |
| lead_time_days | INTEGER | Yes | Override product's default lead time |
| moq | DECIMAL(15,4) | Yes | Minimum order quantity |
| order_multiple | DECIMAL(15,4) | Yes | Quantity must be multiple of this |
| last_purchase_date | DATE | Yes | Auto-updated on PO confirmation |
| last_purchase_price | DECIMAL(15,4) | Yes | Auto-updated on PO confirmation |
| notes | TEXT | Yes | Contract terms, negotiation details |
| created_at | TIMESTAMPTZ | No | Record creation timestamp |
| updated_at | TIMESTAMPTZ | No | Last update timestamp (auto-updated) |

**Constraints**:
- `UNIQUE(supplier_id, product_id)`: Prevents duplicate assignments
- `CHECK(unit_price > 0)`: Price must be positive
- `CHECK(moq > 0)`: MOQ must be positive
- `CHECK(lead_time_days >= 0)`: Lead time cannot be negative

**Indexes**:
- `idx_supplier_products_supplier` on `supplier_id` (query by supplier)
- `idx_supplier_products_product` on `product_id` (query by product)
- `idx_supplier_products_default` on `(product_id, is_default)` WHERE `is_default = true` (fast default lookup)

**RLS Policy**:
```sql
CREATE POLICY "Supplier-products org isolation"
ON supplier_products FOR ALL
USING (
  supplier_id IN (
    SELECT id FROM suppliers
    WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  )
);
```

**Rationale**: Filters all queries by user's organization via supplier FK.

---

## Integration Guide

### For Developers

#### Service Layer Usage

```typescript
import {
  getSupplierProducts,
  assignProductToSupplier,
  updateSupplierProduct,
  removeSupplierProduct,
  getDefaultSupplierForProduct
} from '@/lib/services/supplier-product-service';

// Get all products for a supplier
const products = await getSupplierProducts('sup-001');

// Assign a product
const assignment = await assignProductToSupplier('sup-001', {
  product_id: 'prod-001',
  unit_price: 12.50,
  currency: 'PLN',
  is_default: true
});

// Update assignment
const updated = await updateSupplierProduct('sup-001', 'prod-001', {
  unit_price: 13.00
});

// Remove assignment
await removeSupplierProduct('sup-001', 'prod-001');

// Get default supplier for PO creation
const defaultSupplier = await getDefaultSupplierForProduct('prod-001');
if (defaultSupplier) {
  // Use default supplier's price and terms in PO
  const price = defaultSupplier.unit_price || product.list_price;
  const leadTime = defaultSupplier.lead_time_days || product.supplier_lead_time_days;
}
```

---

#### React Component Usage

```tsx
import { SupplierProductsTable } from '@/components/planning/SupplierProductsTable';

export default function SupplierDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Supplier Details</h1>
      <Tabs>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>
        <TabsContent value="products">
          <SupplierProductsTable supplierId={params.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

#### PO Integration (Story 03.3)

When creating a purchase order:

```typescript
import { getDefaultSupplierForProduct } from '@/lib/services/supplier-product-service';

async function createPOLine(productId: string, quantity: number) {
  // Get default supplier
  const supplierProduct = await getDefaultSupplierForProduct(productId);

  if (!supplierProduct) {
    throw new Error('No default supplier set for this product');
  }

  // Use supplier-specific terms
  const poLine = {
    product_id: productId,
    supplier_id: supplierProduct.supplier_id,
    quantity: quantity,
    unit_price: supplierProduct.unit_price || fallbackPrice,
    currency: supplierProduct.currency || 'PLN',
    expected_delivery_date: addDays(new Date(), supplierProduct.lead_time_days || 0),
    // ...
  };

  return poLine;
}
```

---

#### Updating Last Purchase Data

After PO confirmation (called from Story 03.3):

```typescript
import { updateLastPurchaseData } from '@/lib/services/supplier-product-service';

async function confirmPurchaseOrder(poId: string) {
  const po = await getPurchaseOrder(poId);

  // Confirm PO
  await updatePOStatus(poId, 'confirmed');

  // Update last purchase data for all PO lines
  for (const line of po.lines) {
    await updateLastPurchaseData(
      po.supplier_id,
      line.product_id,
      line.unit_price,
      new Date()
    );
  }
}
```

---

## Release Notes

### Version 1.0.0 - Story 03.2

**Release Date**: 2026-01-03

**Feature**: Supplier-Product Assignments

**What's New**:
- ✅ Assign any product to multiple suppliers
- ✅ Set supplier-specific pricing (unit_price + currency)
- ✅ Override lead times and MOQ per supplier
- ✅ Designate one default supplier per product
- ✅ Track supplier SKU mappings (supplier_product_code)
- ✅ Auto-update last purchase price and date on PO confirmation
- ✅ Search and filter assigned products
- ✅ Edit and delete supplier-product assignments

**API Endpoints** (5 new):
- `GET /api/planning/suppliers/:supplierId/products`
- `POST /api/planning/suppliers/:supplierId/products`
- `PUT /api/planning/suppliers/:supplierId/products/:productId`
- `DELETE /api/planning/suppliers/:supplierId/products/:productId`
- `GET /api/planning/products/:productId/default-supplier`

**UI Components** (4 new):
- `SupplierProductsTable` - Display and manage assigned products
- `AssignProductModal` - Assign new products to supplier
- `EditSupplierProductModal` - Edit existing assignments
- `ProductSelectorCombobox` - Searchable product dropdown (reusable)

**Database**:
- New table: `supplier_products` (junction table)
- 3 indexes for performance
- RLS policy for org isolation

**Tests**:
- 40 unit tests (service layer)
- 8 API integration tests
- 10 validation tests
- 24 manual QA test cases
- **Overall**: 96% pass rate

**Performance**:
- Table load: ~220ms for 50 products
- Search response: ~150ms (debounced)
- Assign product: ~300ms

**Breaking Changes**: None (new feature)

**Known Issues**:
- ⚠️ Mobile table layout could be improved (card view planned for Phase 1)
- ⚠️ Loading state uses basic text spinner (enhanced spinner planned)

**Upgrade Instructions**: None required (new feature)

**Future Enhancements (Phase 1)**:
- Bulk CSV import for supplier-product assignments
- Price history tracking
- Multi-supplier price comparison view
- Enhanced mobile UI (card view)
- Loading skeleton placeholders

---

### Dependencies

**Required Stories**:
- Story 01.1: Org Context + RLS (for multi-tenancy)
- Story 02.1: Products CRUD (for product FK)
- Story 03.1: Suppliers CRUD (for supplier FK)

**Dependent Stories**:
- Story 03.3: PO CRUD (uses default supplier for auto-population)
- Story 03.4: Bulk PO (groups products by default supplier)

---

### Migration

**Migration File**: `supabase/migrations/100_create_supplier_products_table.sql`

**Run Migration**:
```bash
npx supabase db push
```

**Rollback** (if needed):
```sql
DROP TABLE supplier_products CASCADE;
```

---

### Support

**For Questions**:
- Internal: Contact Planning Team (#planning-module on Slack)
- Documentation: See `docs/planning/supplier-products.md`
- API Reference: See this document (Section: API Reference)

**For Bugs**:
- Report via GitHub Issues: `monopilot/issues`
- Include: Browser, steps to reproduce, expected vs actual behavior

---

## Tokens Count (Estimated)

**Documentation Size**: ~500 lines
**Estimated Tokens**: ~2,200 tokens (output)
