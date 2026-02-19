# MonoPilot Backend Code Patterns

**Version**: 2.0 (Updated for Hybrid AI Workflow)
**Tech Stack**: Next.js 16, Supabase, TypeScript, Zod
**Purpose**: Standard patterns for P2 (Test Generation) and P3 (Code Implementation)

---

## 🎯 Service Layer Pattern (MonoPilot Standard)

### File Location
```
apps/frontend/lib/services/{feature}-service.ts
apps/frontend/lib/services/__tests__/{feature}-service.test.ts
```

### Standard Service Template

```typescript
// apps/frontend/lib/services/supplier-product-service.ts
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';

type SupplierProduct = Database['public']['Tables']['supplier_products']['Row'];
type SupplierProductInsert = Database['public']['Tables']['supplier_products']['Insert'];
type SupplierProductUpdate = Database['public']['Tables']['supplier_products']['Update'];

/**
 * Service for managing supplier-product assignments
 * Handles CRUD operations with proper RLS enforcement
 */
export class SupplierProductService {
  /**
   * Get all products assigned to a supplier
   * @throws {Error} If fetch fails
   */
  static async getProductsBySupplier(
    supplierId: string
  ): Promise<SupplierProduct[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('supplier_products')
      .select(`
        *,
        product:products(id, code, name),
        supplier:suppliers(id, name)
      `)
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch supplier products: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Assign a product to a supplier with pricing
   */
  static async assignProduct(
    data: SupplierProductInsert
  ): Promise<SupplierProduct> {
    const supabase = createClient();

    const { data: created, error } = await supabase
      .from('supplier_products')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to assign product: ${error.message}`);
    }

    return created;
  }

  /**
   * Update supplier-product assignment (e.g., price change)
   */
  static async updateAssignment(
    id: string,
    updates: SupplierProductUpdate
  ): Promise<SupplierProduct> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('supplier_products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update assignment: ${error.message}`);
    }

    return data;
  }

  /**
   * Remove product assignment from supplier
   */
  static async removeAssignment(id: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from('supplier_products')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to remove assignment: ${error.message}`);
    }
  }

  /**
   * Check if product is already assigned to supplier
   */
  static async isProductAssigned(
    supplierId: string,
    productId: string
  ): Promise<boolean> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('supplier_products')
      .select('id')
      .eq('supplier_id', supplierId)
      .eq('product_id', productId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to check assignment: ${error.message}`);
    }

    return data !== null;
  }
}
```

### Key Patterns to Follow

1. **Static class methods** (no instantiation needed)
2. **Typed returns** using Supabase-generated types
3. **Error handling** with descriptive messages
4. **JSDoc comments** for all public methods
5. **RLS enforcement** (automatic via Supabase client)
6. **Joined data** using `.select()` syntax when needed

---

## 🧪 Service Test Pattern (Vitest + MSW)

### File Location
```
apps/frontend/lib/services/__tests__/{feature}-service.test.ts
```

### Standard Test Template

```typescript
// apps/frontend/lib/services/__tests__/supplier-product-service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupplierProductService } from '../supplier-product-service';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

describe('SupplierProductService', () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Setup mock Supabase client
    mockSupabase = {
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      insert: vi.fn(() => mockSupabase),
      update: vi.fn(() => mockSupabase),
      delete: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      order: vi.fn(() => mockSupabase),
      single: vi.fn(() => mockSupabase),
      maybeSingle: vi.fn(() => mockSupabase),
    };

    (createClient as any).mockReturnValue(mockSupabase);
  });

  describe('getProductsBySupplier', () => {
    it('should fetch products for a supplier', async () => {
      // Arrange
      const supplierId = 'supplier-123';
      const mockData = [
        {
          id: 'sp-1',
          supplier_id: supplierId,
          product_id: 'prod-1',
          unit_price: 10.50,
          currency: 'USD',
        },
      ];

      mockSupabase.order.mockResolvedValueOnce({
        data: mockData,
        error: null,
      });

      // Act
      const result = await SupplierProductService.getProductsBySupplier(supplierId);

      // Assert
      expect(result).toEqual(mockData);
      expect(mockSupabase.from).toHaveBeenCalledWith('supplier_products');
      expect(mockSupabase.eq).toHaveBeenCalledWith('supplier_id', supplierId);
    });

    it('should throw error when fetch fails', async () => {
      // Arrange
      mockSupabase.order.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      // Act & Assert
      await expect(
        SupplierProductService.getProductsBySupplier('supplier-123')
      ).rejects.toThrow('Failed to fetch supplier products: Database error');
    });
  });

  describe('assignProduct', () => {
    it('should assign product to supplier', async () => {
      // Arrange
      const newAssignment = {
        supplier_id: 'supplier-123',
        product_id: 'prod-1',
        unit_price: 10.50,
        currency: 'USD',
      };

      const mockCreated = { id: 'sp-1', ...newAssignment };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockCreated,
        error: null,
      });

      // Act
      const result = await SupplierProductService.assignProduct(newAssignment);

      // Assert
      expect(result).toEqual(mockCreated);
      expect(mockSupabase.insert).toHaveBeenCalledWith(newAssignment);
    });

    it('should throw error when product already assigned', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'duplicate key value violates unique constraint' },
      });

      // Act & Assert
      await expect(
        SupplierProductService.assignProduct({} as any)
      ).rejects.toThrow('Failed to assign product');
    });
  });

  describe('updateAssignment', () => {
    it('should update assignment successfully', async () => {
      // Arrange
      const id = 'sp-1';
      const updates = { unit_price: 12.00 };
      const mockUpdated = { id, unit_price: 12.00 };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockUpdated,
        error: null,
      });

      // Act
      const result = await SupplierProductService.updateAssignment(id, updates);

      // Assert
      expect(result).toEqual(mockUpdated);
      expect(mockSupabase.update).toHaveBeenCalledWith(updates);
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', id);
    });
  });

  describe('removeAssignment', () => {
    it('should delete assignment successfully', async () => {
      // Arrange
      const id = 'sp-1';

      mockSupabase.delete.mockResolvedValueOnce({
        error: null,
      });

      // Act
      await SupplierProductService.removeAssignment(id);

      // Assert
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', id);
    });

    it('should throw error when delete fails', async () => {
      // Arrange
      mockSupabase.delete.mockResolvedValueOnce({
        error: { message: 'Foreign key constraint' },
      });

      // Act & Assert
      await expect(
        SupplierProductService.removeAssignment('sp-1')
      ).rejects.toThrow('Failed to remove assignment');
    });
  });

  describe('isProductAssigned', () => {
    it('should return true when product is assigned', async () => {
      // Arrange
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: { id: 'sp-1' },
        error: null,
      });

      // Act
      const result = await SupplierProductService.isProductAssigned(
        'supplier-123',
        'prod-1'
      );

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when product is not assigned', async () => {
      // Arrange
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Act
      const result = await SupplierProductService.isProductAssigned(
        'supplier-123',
        'prod-1'
      );

      // Assert
      expect(result).toBe(false);
    });
  });
});
```

### Test Patterns to Follow

1. **Arrange-Act-Assert** structure
2. **Mock Supabase client** using vi.mock()
3. **Test happy path AND error cases**
4. **Clear test descriptions** ("should [expected behavior] when [condition]")
5. **Reset mocks** in beforeEach
6. **Verify method calls** with toHaveBeenCalledWith()

---

## 🔌 API Route Pattern (Next.js 16)

### File Location
```
apps/frontend/app/api/{module}/{resource}/[id]/route.ts
apps/frontend/app/api/{module}/{resource}/[id]/__tests__/route.test.ts
```

### Standard API Route Template

```typescript
// apps/frontend/app/api/planning/suppliers/[supplierId]/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SupplierProductService } from '@/lib/services/supplier-product-service';
import { assignProductSchema, updateProductSchema } from '@/lib/validation/supplier-product-schemas';
import { ZodError } from 'zod';

/**
 * GET /api/planning/suppliers/:supplierId/products
 * Get all products assigned to a supplier
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { supplierId: string } }
) {
  try {
    const { supplierId } = params;

    const products = await SupplierProductService.getProductsBySupplier(supplierId);

    return NextResponse.json(products, { status: 200 });
  } catch (error: any) {
    console.error('[API] Error fetching supplier products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier products' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/planning/suppliers/:supplierId/products
 * Assign a new product to supplier
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { supplierId: string } }
) {
  try {
    const { supplierId } = params;
    const body = await request.json();

    // Validate request body
    const validated = assignProductSchema.parse({
      ...body,
      supplier_id: supplierId,
    });

    // Check if already assigned
    const isAssigned = await SupplierProductService.isProductAssigned(
      supplierId,
      validated.product_id
    );

    if (isAssigned) {
      return NextResponse.json(
        { error: 'Product already assigned to this supplier' },
        { status: 409 }
      );
    }

    const created = await SupplierProductService.assignProduct(validated);

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('[API] Error assigning product:', error);
    return NextResponse.json(
      { error: 'Failed to assign product' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/planning/suppliers/:supplierId/products/:productId
 * Update product assignment (e.g., price change)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { supplierId: string; productId: string } }
) {
  try {
    const body = await request.json();

    // Validate updates
    const validated = updateProductSchema.parse(body);

    const updated = await SupplierProductService.updateAssignment(
      params.productId,
      validated
    );

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('[API] Error updating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/planning/suppliers/:supplierId/products/:productId
 * Remove product assignment from supplier
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { supplierId: string; productId: string } }
) {
  try {
    await SupplierProductService.removeAssignment(params.productId);

    return NextResponse.json(
      { message: 'Assignment removed successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[API] Error removing assignment:', error);
    return NextResponse.json(
      { error: 'Failed to remove assignment' },
      { status: 500 }
    );
  }
}
```

### API Route Patterns to Follow

1. **JSDoc comments** for each HTTP method
2. **Zod validation** for all inputs
3. **Proper status codes**: 200 (OK), 201 (Created), 400 (Bad Request), 409 (Conflict), 500 (Error)
4. **Error handling**: ZodError separate from general errors
5. **Logging**: console.error for all errors
6. **Type safety**: Use params types from Next.js

---

## ✅ Validation Schema Pattern (Zod)

### File Location
```
apps/frontend/lib/validation/{feature}-schemas.ts
apps/frontend/lib/validation/__tests__/{feature}-schemas.test.ts
```

### Standard Zod Schema Template

```typescript
// apps/frontend/lib/validation/supplier-product-schemas.ts
import { z } from 'zod';

/**
 * Schema for assigning a product to a supplier
 */
export const assignProductSchema = z.object({
  supplier_id: z.string().uuid('Supplier ID must be a valid UUID'),
  product_id: z.string().uuid('Product ID must be a valid UUID'),
  unit_price: z
    .number()
    .positive('Unit price must be positive')
    .refine(
      (val) => {
        const decimals = (val.toString().split('.')[1] || '').length;
        return decimals <= 4;
      },
      'Unit price can have maximum 4 decimal places'
    ),
  currency: z
    .enum(['PLN', 'EUR', 'USD', 'GBP'], {
      errorMap: () => ({ message: 'Invalid currency code' }),
    })
    .default('PLN'),
  is_default: z.boolean().default(false),
  lead_time_days: z
    .number()
    .int('Lead time must be an integer')
    .min(0, 'Lead time cannot be negative')
    .max(365, 'Lead time cannot exceed 365 days')
    .optional()
    .nullable(),
});

export type AssignProductInput = z.infer<typeof assignProductSchema>;

/**
 * Schema for updating supplier-product assignment
 */
export const updateProductSchema = assignProductSchema
  .omit({
    supplier_id: true,
    product_id: true,
  })
  .partial();

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

/**
 * Schema for search/filter query params
 */
export const searchProductsSchema = z.object({
  supplier_id: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  is_default: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  min_price: z.string().transform(Number).optional(),
  max_price: z.string().transform(Number).optional(),
});

export type SearchProductsQuery = z.infer<typeof searchProductsSchema>;
```

### Validation Test Template

```typescript
// apps/frontend/lib/validation/__tests__/supplier-product-schemas.test.ts
import { describe, it, expect } from 'vitest';
import { assignProductSchema, updateProductSchema } from '../supplier-product-schemas';

describe('assignProductSchema', () => {
  it('should validate correct data', () => {
    const validData = {
      supplier_id: '123e4567-e89b-12d3-a456-426614174000',
      product_id: '123e4567-e89b-12d3-a456-426614174001',
      unit_price: 10.5,
      currency: 'USD',
      is_default: false,
    };

    const result = assignProductSchema.parse(validData);

    expect(result).toEqual(validData);
  });

  it('should reject invalid UUID for supplier_id', () => {
    const invalidData = {
      supplier_id: 'not-a-uuid',
      product_id: '123e4567-e89b-12d3-a456-426614174001',
      unit_price: 10.5,
    };

    expect(() => assignProductSchema.parse(invalidData)).toThrow(
      'Supplier ID must be a valid UUID'
    );
  });

  it('should reject negative unit_price', () => {
    const invalidData = {
      supplier_id: '123e4567-e89b-12d3-a456-426614174000',
      product_id: '123e4567-e89b-12d3-a456-426614174001',
      unit_price: -10.5,
    };

    expect(() => assignProductSchema.parse(invalidData)).toThrow(
      'Unit price must be positive'
    );
  });

  it('should reject more than 4 decimal places', () => {
    const invalidData = {
      supplier_id: '123e4567-e89b-12d3-a456-426614174000',
      product_id: '123e4567-e89b-12d3-a456-426614174001',
      unit_price: 10.12345, // 5 decimal places
    };

    expect(() => assignProductSchema.parse(invalidData)).toThrow(
      'Unit price can have maximum 4 decimal places'
    );
  });

  it('should use default currency PLN', () => {
    const dataWithoutCurrency = {
      supplier_id: '123e4567-e89b-12d3-a456-426614174000',
      product_id: '123e4567-e89b-12d3-a456-426614174001',
      unit_price: 10.5,
    };

    const result = assignProductSchema.parse(dataWithoutCurrency);

    expect(result.currency).toBe('PLN');
  });
});
```

---

## 🔒 RLS Policy Pattern (Supabase)

### Standard RLS Migration Template

```sql
-- supabase/migrations/XXX_supplier_products_rls.sql

-- Enable RLS
ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view supplier products in their org
CREATE POLICY "Users can view supplier products in their org"
  ON supplier_products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM suppliers s
      WHERE s.id = supplier_products.supplier_id
        AND s.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
  );

-- Policy: Users can create supplier products in their org
CREATE POLICY "Users can create supplier products in their org"
  ON supplier_products
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM suppliers s
      WHERE s.id = supplier_products.supplier_id
        AND s.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
  );

-- Policy: Users can update supplier products in their org
CREATE POLICY "Users can update supplier products in their org"
  ON supplier_products
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM suppliers s
      WHERE s.id = supplier_products.supplier_id
        AND s.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
  );

-- Policy: Users can delete supplier products in their org
CREATE POLICY "Users can delete supplier products in their org"
  ON supplier_products
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM suppliers s
      WHERE s.id = supplier_products.supplier_id
        AND s.org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
  );
```

---

## 📝 Summary: MonoPilot Backend Checklist

When implementing a new backend feature, ensure:

### Service Layer
- [ ] Static class with typed methods
- [ ] JSDoc comments for all public methods
- [ ] Error handling with descriptive messages
- [ ] Return types using Supabase-generated types
- [ ] Vitest tests with 90%+ coverage

### API Routes
- [ ] JSDoc for each HTTP method
- [ ] Zod validation on all inputs
- [ ] Proper HTTP status codes (200/201/400/409/500)
- [ ] ZodError handling separate from general errors
- [ ] Error logging with console.error

### Validation
- [ ] Zod schemas for all DTOs
- [ ] Exported TypeScript types via `z.infer`
- [ ] Custom error messages
- [ ] Default values where appropriate
- [ ] Unit tests for validation rules

### Database
- [ ] RLS policies for all operations (SELECT/INSERT/UPDATE/DELETE)
- [ ] org_id filtering via related table
- [ ] Indexes on frequently queried columns
- [ ] Foreign key constraints

### Tests
- [ ] Arrange-Act-Assert pattern
- [ ] Happy path + error cases
- [ ] Mock Supabase client
- [ ] Clear test descriptions
- [ ] 90%+ coverage

---

**This template is optimized for GLM/DeepSeek code generation in P2 (tests) and P3 (implementation).**
