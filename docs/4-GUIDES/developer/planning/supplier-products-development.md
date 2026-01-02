# Supplier-Product Assignment Development Guide

Story: 03.2 - Supplier-Product Assignment

This document provides technical guidance for developers integrating with the Supplier-Product Assignment API, implementing components, and extending functionality.

## Architecture Overview

The Supplier-Product Assignment system consists of:

1. **Database Layer** - `supplier_products` table with RLS
2. **API Routes** - CRUD endpoints with validation
3. **Service Layer** - Business logic and utilities
4. **Validation** - Zod schemas for input validation
5. **Frontend Components** - React components for UI
6. **Types** - TypeScript interfaces

## Database Schema

### supplier_products Table

```sql
CREATE TABLE supplier_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  supplier_product_code TEXT,
  unit_price DECIMAL(15,4),
  currency TEXT,
  lead_time_days INTEGER,
  moq DECIMAL(15,4),
  order_multiple DECIMAL(15,4),
  last_purchase_date DATE,
  last_purchase_price DECIMAL(15,4),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT supplier_products_unique UNIQUE(supplier_id, product_id),
  CONSTRAINT supplier_products_price_positive CHECK (unit_price IS NULL OR unit_price > 0),
  CONSTRAINT supplier_products_moq_positive CHECK (moq IS NULL OR moq > 0),
  CONSTRAINT supplier_products_order_multiple_positive CHECK (order_multiple IS NULL OR order_multiple > 0),
  CONSTRAINT supplier_products_lead_time_non_negative CHECK (lead_time_days IS NULL OR lead_time_days >= 0),
  CONSTRAINT supplier_products_currency_valid CHECK (currency IS NULL OR currency IN ('PLN', 'EUR', 'USD', 'GBP')),
  CONSTRAINT supplier_products_supplier_code_length CHECK (supplier_product_code IS NULL OR length(supplier_product_code) <= 50),
  CONSTRAINT supplier_products_notes_length CHECK (notes IS NULL OR length(notes) <= 1000)
);
```

### Indexes

```sql
CREATE INDEX idx_supplier_products_supplier ON supplier_products(supplier_id);
CREATE INDEX idx_supplier_products_product ON supplier_products(product_id);
CREATE INDEX idx_supplier_products_default ON supplier_products(product_id, is_default) WHERE is_default = true;
```

The `idx_supplier_products_default` index is critical for fast lookups when finding a product's default supplier during PO creation.

### Row-Level Security (RLS)

RLS policies enforce organization isolation:

```sql
-- SELECT: Users can only read assignments for their org's suppliers
CREATE POLICY "supplier_products_org_isolation" ON supplier_products
  FOR SELECT USING (
    supplier_id IN (
      SELECT id FROM suppliers
      WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
  );
```

Users cannot access supplier-products from other organizations even with direct IDs.

### Triggers

```sql
-- Auto-update updated_at timestamp
CREATE TRIGGER supplier_products_updated_at
  BEFORE UPDATE ON supplier_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### RPC Functions

The migration creates a function for atomic default assignment:

```sql
CREATE OR REPLACE FUNCTION set_default_supplier_product(
  p_supplier_id UUID,
  p_product_id UUID
) RETURNS void AS $$
BEGIN
  UPDATE supplier_products
  SET is_default = false, updated_at = NOW()
  WHERE product_id = p_product_id AND is_default = true;

  UPDATE supplier_products
  SET is_default = true, updated_at = NOW()
  WHERE supplier_id = p_supplier_id AND product_id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Note:** Currently not used by API (toggling is done in application logic), but available for future optimization.

### Migration File

Location: `supabase/migrations/075_create_supplier_products.sql`

Key sections:
1. Table creation with constraints
2. Index creation
3. RLS enablement and policies
4. Permissions grants
5. Trigger setup
6. RPC function definitions
7. Documentation comments

## API Routes

### Route Files

**GET/POST Routes:**
- File: `apps/frontend/app/api/planning/suppliers/[supplierId]/products/route.ts`
- Exports: `GET`, `POST`

**PUT/DELETE Routes:**
- File: `apps/frontend/app/api/planning/suppliers/[supplierId]/products/[productId]/route.ts`
- Exports: `PUT`, `DELETE`

**Default Supplier:**
- File: `apps/frontend/app/api/planning/products/[productId]/default-supplier/route.ts`
- Exports: `GET`

### Route Implementation Pattern

Each route follows this pattern:

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    // 1. Await params
    const { supplierId } = await params

    // 2. Create Supabase client
    const supabase = await createServerSupabase()

    // 3. Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 4. Get user's org_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    // 5. Verify resource belongs to org
    const { data: supplier } = await supabaseAdmin
      .from('suppliers')
      .select('id')
      .eq('id', supplierId)
      .eq('org_id', userData.org_id)
      .single()

    // 6. Perform business logic
    const { data } = await supabaseAdmin
      .from('supplier_products')
      .select('...relevant_fields...')

    // 7. Return response
    return NextResponse.json({ success: true, data })
  } catch (error) {
    // 8. Error handling
    return NextResponse.json({ success: false, error: 'message' }, { status: 500 })
  }
}
```

### Key Implementation Details

**CSRF Protection:**
```typescript
if (!validateOrigin(request)) {
  return NextResponse.json(
    { success: false, ...createCsrfErrorResponse() },
    { status: 403 }
  )
}
```

Applied to POST, PUT, DELETE (mutation) operations.

**Admin Client Usage:**
```typescript
const supabaseAdmin = createServerSupabaseAdmin()
```

Used instead of regular client to bypass RLS during verification checks (admin reads user org_id, supplier org_id, then RLS filters supplier_products).

**Default Supplier Toggle Logic:**
```typescript
if (validatedData.is_default === true) {
  await supabaseAdmin
    .from('supplier_products')
    .update({ is_default: false, updated_at: new Date().toISOString() })
    .eq('product_id', productId)
    .eq('is_default', true)
    .neq('supplier_id', supplierId)  // Don't unset self
}
```

Ensures only one default per product by clearing others before setting new default.

**Error Handling:**
```typescript
if (error.code === '23505') {
  // Unique constraint violation
  return NextResponse.json(
    { success: false, error: 'This product is already assigned to this supplier' },
    { status: 400 }
  )
}
```

Catches database constraint violations and returns user-friendly error.

## Service Layer

### supplier-product-service.ts

Client-side service for API interaction:

```typescript
export async function getSupplierProducts(
  supplierId: string,
  options?: { search?: string }
): Promise<SupplierProductWithProduct[]>

export async function assignProductToSupplier(
  supplierId: string,
  input: AssignProductInput
): Promise<SupplierProduct>

export async function updateSupplierProduct(
  supplierId: string,
  productId: string,
  input: UpdateSupplierProductInput
): Promise<SupplierProduct>

export async function removeSupplierProduct(
  supplierId: string,
  productId: string
): Promise<void>

export async function getDefaultSupplierForProduct(
  productId: string
): Promise<SupplierProductWithSupplier | null>

export async function setDefaultSupplier(
  supplierId: string,
  productId: string
): Promise<SupplierProduct>

export function resolveLeadTime(
  supplierProductLeadTime: number | null | undefined,
  productDefaultLeadTime: number | null | undefined
): number
```

### Error Handling

Service catches API errors and throws descriptive messages:

```typescript
if (!response.ok) {
  const error = await response.json()

  if (response.status === 400 && error.code === 'DUPLICATE_ASSIGNMENT') {
    throw new Error('This product is already assigned to this supplier')
  }

  throw new Error(error.error || 'Failed to assign product to supplier')
}
```

Components should catch these errors and display to user:

```typescript
try {
  await assignProductToSupplier(supplierId, input)
  // Success - show toast
} catch (error) {
  // Show error toast
  console.error(error.message)
}
```

### Utility Functions

**resolveLeadTime:**

```typescript
export function resolveLeadTime(
  supplierProductLeadTime: number | null | undefined,
  productDefaultLeadTime: number | null | undefined
): number {
  return supplierProductLeadTime ?? productDefaultLeadTime ?? 0
}
```

Used in multiple places to consistently apply lead time fallback logic:
1. Supplier product override (preferred)
2. Product default (fallback)
3. Zero (final fallback)

## Validation Layer

### supplier-product-validation.ts

```typescript
export const assignProductSchema = z.object({
  product_id: z.string().uuid('Product ID must be a valid UUID'),
  is_default: z.boolean().default(false),
  supplier_product_code: z.string().max(50, 'Max 50 characters').optional().nullable(),
  unit_price: z.number().positive('Price must be positive').optional().nullable(),
  currency: z.enum(['PLN', 'EUR', 'USD', 'GBP'], { errorMap: () => ({ message: 'Invalid currency' }) }).optional().nullable(),
  lead_time_days: z.number().int('Must be a whole number').nonnegative('Cannot be negative').optional().nullable(),
  moq: z.number().positive('MOQ must be positive').optional().nullable(),
  order_multiple: z.number().positive('Order multiple must be positive').optional().nullable(),
  notes: z.string().max(1000, 'Max 1000 characters').optional().nullable(),
})

export const updateSupplierProductSchema = assignProductSchema
  .partial()
  .omit({ product_id: true })
```

### Validation Rules

| Field | Rules | Example |
|-------|-------|---------|
| `product_id` | UUID, required | `"770e8400-e29b-41d4-a716-446655440002"` |
| `is_default` | Boolean, optional | `true` or `false` |
| `supplier_product_code` | Max 50 chars | `"MILL-FLOUR-A"` |
| `unit_price` | Positive decimal | `10.50` (not `0` or negative) |
| `currency` | Enum: PLN, EUR, USD, GBP | `"PLN"` |
| `lead_time_days` | Non-negative integer | `5`, `0` (not negative) |
| `moq` | Positive decimal | `100.50` (not `0`) |
| `order_multiple` | Positive decimal | `50` |
| `notes` | Max 1000 chars | Any text string |

### Zod Usage in Routes

```typescript
const body = await request.json()
const validatedData = assignProductSchema.parse(body)
```

If validation fails, Zod throws an error caught by the try-catch:

```typescript
if (error instanceof ZodError) {
  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      details: error.errors,
    },
    { status: 400 }
  )
}
```

## Type System

### Types File

Location: `apps/frontend/lib/types/supplier-product.ts`

#### SupplierProduct

Base type for the database table:

```typescript
export interface SupplierProduct {
  id: string
  supplier_id: string
  product_id: string
  is_default: boolean
  supplier_product_code: string | null
  unit_price: number | null
  currency: string | null
  lead_time_days: number | null
  moq: number | null
  order_multiple: number | null
  last_purchase_date: string | null
  last_purchase_price: number | null
  notes: string | null
  created_at: string
  updated_at: string
}
```

#### SupplierProductWithProduct

Used when returning products assigned to a supplier (includes product details):

```typescript
export interface SupplierProductWithProduct extends SupplierProduct {
  product: ProductSummary
}
```

#### SupplierProductWithSupplier

Used when returning supplier information with default supplier (includes supplier details):

```typescript
export interface SupplierProductWithSupplier extends SupplierProduct {
  supplier: SupplierSummary
}
```

#### ProductSummary

Light product info embedded in responses:

```typescript
export interface ProductSummary {
  id: string
  code: string
  name: string
  uom: string
  supplier_lead_time_days: number | null
}
```

#### SupplierSummary

Light supplier info embedded in responses:

```typescript
export interface SupplierSummary {
  id: string
  code: string
  name: string
  currency: string
}
```

#### Input Types

```typescript
export interface AssignProductInput {
  product_id: string
  is_default?: boolean
  supplier_product_code?: string | null
  unit_price?: number | null
  currency?: string | null
  lead_time_days?: number | null
  moq?: number | null
  order_multiple?: number | null
  notes?: string | null
}

export interface UpdateSupplierProductInput {
  is_default?: boolean
  supplier_product_code?: string | null
  unit_price?: number | null
  currency?: string | null
  lead_time_days?: number | null
  moq?: number | null
  order_multiple?: number | null
  notes?: string | null
}
```

### Using Types

In components:

```typescript
import type { SupplierProductWithProduct } from '@/lib/types/supplier-product'

function SupplierProductsTable({ products }: { products: SupplierProductWithProduct[] }) {
  return (
    <table>
      {products.map((sp) => (
        <tr key={sp.id}>
          <td>{sp.product.code}</td>
          <td>{sp.unit_price}</td>
        </tr>
      ))}
    </table>
  )
}
```

## Frontend Components

### Component Architecture

Expected component structure:

```
components/planning/
├── SupplierProductsTable.tsx
├── AssignProductModal.tsx
├── SupplierProductForm.tsx
└── ProductSelectorCombobox.tsx
```

### Integration with Supplier Detail Page

The supplier detail page integrates supplier products:

```typescript
// app/(authenticated)/planning/suppliers/[id]/page.tsx

import { SupplierProductsTable } from '@/components/planning/SupplierProductsTable'
import { AssignProductModal } from '@/components/planning/AssignProductModal'

export default function SupplierDetailPage() {
  const [showAssignModal, setShowAssignModal] = useState(false)

  return (
    <Tabs>
      <TabsContent value="products">
        <SupplierProductsTable supplierId={supplierId} />
        {showAssignModal && (
          <AssignProductModal
            supplierId={supplierId}
            onClose={() => setShowAssignModal(false)}
            onSuccess={() => {
              // Refresh table
            }}
          />
        )}
      </TabsContent>
    </Tabs>
  )
}
```

### Recommended Hook Usage

For fetching supplier products:

```typescript
export function useSupplierProducts(supplierId: string, search?: string) {
  const [data, setData] = useState<SupplierProductWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const products = await getSupplierProducts(supplierId, { search })
        setData(products)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [supplierId, search])

  return { data, loading, error }
}
```

## Testing

### Unit Test Example

Testing the service layer:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { assignProductToSupplier } from '@/lib/services/supplier-product-service'

describe('assignProductToSupplier', () => {
  it('should assign product to supplier', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 'test-id',
          supplier_id: 'supp-1',
          product_id: 'prod-1',
          is_default: false,
        },
      }),
    })

    const result = await assignProductToSupplier('supp-1', {
      product_id: 'prod-1',
      unit_price: 10.50,
    })

    expect(result.id).toBe('test-id')
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/planning/suppliers/supp-1/products',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('should handle duplicate assignment error', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ error: 'This product is already assigned to this supplier' }),
    })

    await expect(
      assignProductToSupplier('supp-1', { product_id: 'prod-1' })
    ).rejects.toThrow('This product is already assigned to this supplier')
  })
})
```

### E2E Test Coverage

Key test scenarios from `e2e/supplier-products.spec.ts`:

1. **AC-01: Full supplier-product workflow**
   - Assign product with all fields
   - Verify product appears in table
   - Verify price displays correctly

2. **AC-03: Default supplier toggle**
   - Set default supplier
   - Verify only one can be default
   - Verify previous default is unset

3. **AC-05: Duplicate prevention**
   - Attempt to assign same product twice
   - Verify error message shown
   - Verify modal stays open for correction

4. **AC-08: Remove assignment**
   - Delete assignment with confirmation
   - Verify product removed from table
   - Verify success notification

5. **Edit assignment**
   - Click edit button
   - Modal opens with existing data
   - Update price
   - Verify table updates

6. **Empty state**
   - Show CTA when no products
   - Click button from empty state
   - Modal opens

7. **Loading state**
   - Show skeleton while fetching
   - Verify table appears when loaded

8. **Search and filter**
   - Type in search box
   - Verify only matching products shown

9. **Validation**
   - Prevent submission with missing data
   - Show error on negative price
   - Prevent invalid currency

## Performance Optimization

### Caching Strategy

Default supplier lookups are frequent during PO creation:

```typescript
// In PO creation form
const cachedDefault = useCallback(async (productId: string) => {
  const cached = sessionStorage.getItem(`default_supplier:${productId}`)
  if (cached) return JSON.parse(cached)

  const result = await getDefaultSupplierForProduct(productId)
  sessionStorage.setItem(`default_supplier:${productId}`, JSON.stringify(result))
  return result
}, [])
```

Invalidate on update:

```typescript
const handleSetDefault = async (supplierId: string, productId: string) => {
  await setDefaultSupplier(supplierId, productId)
  sessionStorage.removeItem(`default_supplier:${productId}`)
}
```

### Query Optimization

The GET endpoint uses:

- Select specific columns (not `*`)
- Join only needed relations
- Filter by supplier_id first
- Order by created_at with indexes

### Pagination

For suppliers with 100+ products:

```typescript
const [page, setPage] = useState(0)
const pageSize = 20

const paginatedProducts = useMemo(() => {
  const start = page * pageSize
  return products.slice(start, start + pageSize)
}, [products, page, pageSize])
```

### Search Optimization

Currently searched in-memory after fetch. For 1000+ records, consider:

```typescript
// Phase 1 enhancement: Server-side full-text search
const { data } = await supabaseAdmin
  .from('supplier_products')
  .select('...')
  .textSearch('product_name_fts', search) // PostgreSQL FTS
```

## Integration Points

### With Story 03.1 (Suppliers CRUD)

Supplier-Product depends on suppliers:

```typescript
// Get supplier details for context
const { data: supplier } = await supabaseAdmin
  .from('suppliers')
  .select('code, name, currency')
  .eq('id', supplierId)
  .single()
```

### With Story 03.3 (Purchase Order Creation)

PO creation uses supplier-products:

```typescript
import { getDefaultSupplierForProduct } from '@/lib/services/supplier-product-service'

// In PO form, pre-fill from default supplier
const defaultSupplier = await getDefaultSupplierForProduct(productId)
poForm.setValue('unit_price', defaultSupplier?.unit_price)
poForm.setValue('expected_delivery_date',
  addDays(today, resolveLeadTime(defaultSupplier?.lead_time_days, product.supplier_lead_time_days))
)
```

### With Story 03.4 (Bulk PO Creation)

Bulk PO groups by supplier:

```typescript
// Group products by default supplier
const groupByDefaultSupplier = async (products: Product[]) => {
  const grouped = new Map<string, Product[]>()

  for (const product of products) {
    const defaultSupplier = await getDefaultSupplierForProduct(product.id)
    const supplierId = defaultSupplier?.supplier_id || 'unassigned'

    if (!grouped.has(supplierId)) {
      grouped.set(supplierId, [])
    }
    grouped.get(supplierId)!.push(product)
  }

  return grouped
}
```

## Extending Functionality

### Adding Fields

To add a new field (e.g., `minimum_batch_size`):

1. **Database:**
   ```sql
   ALTER TABLE supplier_products ADD COLUMN minimum_batch_size DECIMAL(15,4);
   ALTER TABLE supplier_products ADD CONSTRAINT supplier_products_batch_positive
     CHECK (minimum_batch_size IS NULL OR minimum_batch_size > 0);
   ```

2. **Types:**
   ```typescript
   export interface SupplierProduct {
     // ... existing fields
     minimum_batch_size: number | null
   }
   ```

3. **Validation:**
   ```typescript
   export const assignProductSchema = z.object({
     // ... existing fields
     minimum_batch_size: z.number().positive('Must be positive').optional().nullable(),
   })
   ```

4. **API:**
   ```typescript
   const { data } = await supabaseAdmin
     .from('supplier_products')
     .insert({
       // ... existing fields
       minimum_batch_size: validatedData.minimum_batch_size ?? null,
     })
   ```

5. **Components:**
   Update form and table to show new field

6. **Tests:**
   Add test for new field validation and API behavior

### Bulk Import Feature

For Phase 1, consider:

```typescript
export async function importSupplierProducts(
  supplierId: string,
  csvFile: File
): Promise<{ success: number; failed: number; errors: string[] }> {
  const csv = await csvFile.text()
  const lines = csv.split('\n').slice(1) // Skip header

  let success = 0, failed = 0
  const errors: string[] = []

  for (const line of lines) {
    const [productCode, price, leadTime, moq] = line.split(',')

    try {
      // Validate and assign
      await assignProductToSupplier(supplierId, {
        product_id: await getProductIdByCode(productCode),
        unit_price: parseFloat(price),
        lead_time_days: parseInt(leadTime),
        moq: parseFloat(moq),
      })
      success++
    } catch (error) {
      failed++
      errors.push(`Row: ${productCode} - ${error.message}`)
    }
  }

  return { success, failed, errors }
}
```

## Debugging

### Enable Request Logging

In API routes:

```typescript
console.log('Request:', {
  method: request.method,
  url: request.url,
  body: await request.json(),
})
```

### Check RLS Policies

Verify user's org_id matches supplier's org:

```typescript
const { data: supplier } = await supabaseAdmin
  .from('suppliers')
  .select('id, org_id')
  .eq('id', supplierId)
  .single()

console.log('Supplier org:', supplier.org_id)
console.log('User org:', userData.org_id)
console.log('Match:', supplier.org_id === userData.org_id)
```

### Test Validation

```typescript
import { assignProductSchema } from '@/lib/validation/supplier-product-validation'

try {
  assignProductSchema.parse({
    product_id: 'not-a-uuid',
    unit_price: -5,
  })
} catch (error) {
  console.log('Validation errors:', error.errors)
  // Output: errors for invalid UUID and negative price
}
```

## Version History

- **1.0** (2025-12-16) - Initial implementation
  - CRUD operations
  - Default supplier toggle
  - Lead time and MOQ overrides
  - RLS enforcement

---

## Related Documentation

- **API Documentation:** `docs/3-ARCHITECTURE/api/planning/supplier-products.md`
- **User Guide:** `docs/4-GUIDES/user/planning/supplier-product-assignment.md`
- **Database Schema:** `.claude/TABLES.md`
- **RLS Patterns:** `.claude/PATTERNS.md#rls-strategy`

Last Updated: 2025-12-16
