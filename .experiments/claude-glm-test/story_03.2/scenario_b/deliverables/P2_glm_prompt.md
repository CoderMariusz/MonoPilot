# P2: GLM Prompt - Write Tests for Supplier-Product Assignments

**Story**: 03.2
**Scenario**: B (Claude + GLM Hybrid)
**Phase**: P2 - Test Writing
**Orchestrator**: Claude → GLM-4.7

---

## Context for GLM

You are a test engineer writing unit tests for a **Supplier-Product Assignment** feature in a food manufacturing MES system.

### Feature Summary

Users can assign products to suppliers with supplier-specific pricing, lead times, and MOQ. Key functionality:
- Assign product to supplier (with optional price, currency, lead time, MOQ overrides)
- Update assignment (change price, lead time, etc.)
- Delete assignment
- Set ONE default supplier per product (toggle)
- Prevent duplicate assignments (same supplier + product)

### Tech Stack

- **Framework**: Next.js 15, TypeScript
- **Database**: Supabase (PostgreSQL with RLS)
- **Validation**: Zod schemas
- **Testing**: Vitest + @testing-library/react

---

## Test Requirements

Write comprehensive unit tests covering:

### 1. Service Layer Tests (`supplier-product-service.ts`)

**Functions to test**:
- `getSupplierProducts(supplierId)` - Fetch all products for supplier
- `assignProductToSupplier(supplierId, data)` - Create assignment
- `updateSupplierProduct(supplierId, productId, data)` - Update assignment
- `removeSupplierProduct(supplierId, productId)` - Delete assignment
- `getDefaultSupplierForProduct(productId)` - Get default supplier

**Test Cases for Each**:
- Happy path (valid input → success)
- Edge cases (null/empty values, min/max values)
- Error cases (not found, validation errors, duplicates)
- Business rules (only one default per product, RLS filtering)

### 2. Validation Schema Tests (`supplier-product-validation.ts`)

**Schemas to test**:
- `assignProductSchema` - Validate create input
- `updateSupplierProductSchema` - Validate update input (partial)

**Test Cases**:
- Valid input (minimal and full)
- Invalid UUID
- Negative price
- Invalid currency (not in enum)
- Max length violations (supplier_product_code, notes)
- Decimal precision (unit_price max 4 decimals)

### 3. API Route Tests

**Endpoints**:
- `GET /api/planning/suppliers/:id/products`
- `POST /api/planning/suppliers/:id/products`
- `PUT /api/planning/suppliers/:id/products/:productId`
- `DELETE /api/planning/suppliers/:id/products/:productId`
- `GET /api/planning/products/:id/default-supplier`

**Test Cases**:
- Status codes (200, 201, 204, 400, 404, 409)
- Request/response bodies
- Authentication (401 if not logged in)
- Authorization (403 if read-only user)
- Validation errors (400 with error details)

---

## Test File Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Supplier-Product Service Layer', () => {
  describe('getSupplierProducts', () => {
    it('should fetch all products for supplier', async () => {
      // Test implementation
    });
  });

  describe('assignProductToSupplier', () => {
    it('should create assignment with all fields', async () => {});
    it('should prevent duplicate assignments', async () => {});
    it('should unset previous default when is_default=true', async () => {});
  });

  // ... more tests
});

describe('Validation Schemas', () => {
  describe('assignProductSchema', () => {
    it('should validate minimal input', () => {});
    it('should reject negative price', () => {});
    // ... more validation tests
  });
});

describe('API Routes', () => {
  describe('POST /api/planning/suppliers/:id/products', () => {
    it('should return 201 with created assignment', async () => {});
    it('should return 400 on validation error', async () => {});
    it('should return 409 on duplicate', async () => {});
  });
});
```

---

## Expected Output

Write a **complete test file** (`P2_tests.test.ts`) with:
- **50+ test cases** covering all scenarios
- Proper mocking of Supabase client
- Clear test descriptions (Given/When/Then style)
- Edge case coverage (empty strings, null, undefined, max values)
- Error message assertions
- Type safety (TypeScript, no `any`)

**Code Style**:
- Use `describe` blocks for logical grouping
- Use `it` for test cases
- Use `expect` for assertions
- Mock external dependencies (Supabase, API calls)

**Test Coverage Target**: >80% for service layer

---

## Example Test

```typescript
it('should prevent duplicate supplier-product assignments', async () => {
  // Arrange
  const supplierId = 'sup-001';
  const productId = 'prod-001';
  const duplicateData = { product_id: productId };

  // Mock: product already assigned
  mockSupabase.from('supplier_products').select().single.mockResolvedValue({
    data: { id: 'sp-001', supplier_id: supplierId, product_id: productId },
    error: null
  });

  // Act & Assert
  await expect(
    assignProductToSupplier(supplierId, duplicateData)
  ).rejects.toThrow('This product is already assigned to this supplier');
});
```

---

## Deliverable

**File Name**: `P2_tests.test.ts`

**Content**: Full Vitest test suite with 50+ test cases covering:
- All service functions
- All validation schemas
- All API routes
- Edge cases and error scenarios

**Length**: ~300-400 lines of TypeScript

---

**GO! Write the tests now.**
