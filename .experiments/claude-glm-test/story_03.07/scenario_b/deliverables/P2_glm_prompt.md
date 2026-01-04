# Task: Write TDD RED Phase Tests for Supplier Product Service

## Story Context
**Story 03.7**: Supplier Product Catalog
**Epic**: Planning Module
**Complexity**: M (Medium)

## Objective
Write comprehensive TDD tests for `SupplierProductService` - a service that manages the relationship between suppliers and products with pricing information.

## Business Requirements

### Entity: SupplierProduct
Junction table linking suppliers to products with pricing/sourcing metadata:
- `supplier_id` (FK to suppliers)
- `product_id` (FK to products)
- `supplier_product_code` - Supplier's SKU for this product
- `supplier_price` - Price from this supplier
- `currency` - Price currency (USD, EUR, etc.)
- `lead_time_days` - Delivery lead time
- `min_order_qty` - Minimum order quantity
- `is_preferred` - Preferred supplier flag

### Service Methods to Test:

1. `create(input)` - Create supplier-product link
2. `listBySupplier(supplierId, filters?)` - List products for supplier
3. `listByProduct(productId)` - List suppliers for product
4. `update(id, changes)` - Update pricing/metadata
5. `delete(id)` - Soft delete
6. `findCheapestSupplier(productId, filters?)` - Find lowest price supplier

### Validation Rules:
- Supplier + Product combination must be unique
- Price must be positive (> 0)
- Lead time must be >= 0
- Min order qty must be >= 0
- Cannot delete if used in active POs
- Cannot change supplier_id or product_id after creation

## Test Requirements

Write tests covering:

1. **CRUD Operations** (create, read, update, delete)
2. **Validation** (price > 0, lead time >= 0, uniqueness)
3. **Business Logic** (findCheapestSupplier with filters)
4. **Constraints** (cannot delete if in use, immutable IDs)
5. **Filtering** (by preferred, sort by price)

## Expected Output

Complete Vitest test file with:
- Proper imports and types
- beforeEach setup
- describe blocks for each method
- 15-20 test cases covering all requirements
- Clear test names following pattern: "should [expected behavior]"

**All tests should FAIL** (RED phase) - service doesn't exist yet.

Write the complete test file now.
