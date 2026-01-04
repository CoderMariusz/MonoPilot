# P3 iter1: GLM Implementation Summary - Supplier-Product Assignments

**Story**: 03.2
**Scenario**: B (Hybrid)
**Phase**: P3 - Implementation (iter 1)
**Agent**: GLM-4-plus
**Status**: Completed (with intentional bugs for review)

---

## Files Implemented

1. ✅ Migration: `supabase/migrations/100_create_supplier_products_table.sql`
2. ✅ Validation: `lib/validation/supplier-product-validation.ts`
3. ✅ Service: `lib/services/supplier-product-service.ts`
4. ✅ API Routes: 5 endpoints
5. ✅ Components: 4 React components

---

## Code Summary

### 1. Database Migration (Complete)
- ✅ Table created with all columns
- ✅ Unique constraint on (supplier_id, product_id)
- ✅ RLS policy for org isolation
- ✅ Indexes on supplier_id, product_id

### 2. Validation Schemas (Complete)
- ✅ `assignProductSchema` with all fields
- ✅ `updateSupplierProductSchema` (partial, omits product_id)
- ✅ Zod validation rules (UUID, positive numbers, max lengths)

### 3. Service Layer (Complete with BUGS)

**Functions implemented**:
```typescript
// getSupplierProducts
export async function getSupplierProducts(supplierId: string) {
  const { data } = await supabase
    .from('supplier_products')
    .select(`*, product:products(*)`)
    .eq('supplier_id', supplierId)
    .order('product.code'); // BUG #1: Wrong order syntax

  return data || [];
}

// assignProductToSupplier
export async function assignProductToSupplier(supplierId: string, input: AssignProductInput) {
  // Check duplicate
  const { data: existing } = await supabase
    .from('supplier_products')
    .select('id')
    .eq('supplier_id', supplierId)
    .eq('product_id', input.product_id)
    .single();

  if (existing) throw new Error('Already assigned');

  // Unset previous default
  if (input.is_default) {
    await supabase
      .from('supplier_products')
      .update({ is_default: false })
      .eq('product_id', input.product_id)
      .eq('is_default', true);
  }

  // Insert
  const { data } = await supabase
    .from('supplier_products')
    .insert({ supplier_id: supplierId, ...input })
    .select()
    .single();

  return data;
}

// updateSupplierProduct
export async function updateSupplierProduct(
  supplierId: string,
  productId: string,
  input: UpdateSupplierProductInput
) {
  const { data: existing } = await supabase
    .from('supplier_products')
    .select('id')
    .eq('supplier_id', supplierId)
    .eq('product_id', productId)
    .single();

  if (!existing) throw new Error('Not found');

  if (input.is_default) {
    await supabase
      .from('supplier_products')
      .update({ is_default: false })
      .eq('product_id', productId)
      .eq('is_default', true)
      .neq('id', existing.id); // BUG #6: Logic issue
  }

  const { data } = await supabase
    .from('supplier_products')
    .update(input)
    .eq('id', existing.id)
    .select()
    .single();

  return data;
}

// removeSupplierProduct
export async function removeSupplierProduct(supplierId: string, productId: string) {
  await supabase
    .from('supplier_products')
    .delete()
    .eq('supplier_id', supplierId)
    .eq('product_id', productId);
  // BUG #7: No error handling distinction
}

// getDefaultSupplierForProduct
export async function getDefaultSupplierForProduct(productId: string) {
  const { data, error } = await supabase
    .from('supplier_products')
    .select(`*, supplier:suppliers(*)`)
    .eq('product_id', productId)
    .eq('is_default', true)
    .single();

  if (error?.code === 'PGRST116') return null;
  if (error) throw error;
  return data;
}
```

### 4. API Routes (Complete with BUGS)

**POST endpoint**:
```typescript
// POST /api/planning/suppliers/[supplierId]/products/route.ts
export async function POST(request: NextRequest, { params }: { params: { supplierId: string } }) {
  try {
    const body = await request.json();
    const validated = assignProductSchema.parse(body);
    const result = await assignProductToSupplier(params.supplierId, validated);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') { // BUG #2: Wrong type check
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues }, // BUG #2: .issues doesn't exist on Error
        { status: 400 }
      );
    }
    if (error.message.includes('Already assigned')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Other endpoints**: GET, PUT, DELETE implemented similarly

### 5. React Components (Complete with BUGS)

**SupplierProductsTable.tsx**:
```typescript
export function SupplierProductsTable({ supplierId }: Props) {
  const [products, setProducts] = useState([]);

  async function loadProducts() {
    const data = await getSupplierProducts(supplierId);
    setProducts(data);
  }

  async function handleToggleDefault(productId: string, current: boolean) {
    // BUG #4: Not implemented
    toast({ title: 'Not implemented' });
  }

  async function handleEdit(product: SupplierProduct) {
    // BUG #5: Not implemented
    toast({ title: 'Not implemented' });
  }

  // Table with columns, search, filter
  return (
    <DataTable
      columns={columns}
      data={products}
      // ...
    />
  );
}
```

**ProductSelectorCombobox.tsx**:
```typescript
async function loadProducts() {
  let query = supabase.from('products').select('*').limit(50);

  if (search) {
    query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`); // BUG #3: Syntax
  }

  const { data } = await query;
  setProducts(data || []);
}
```

**Other components**: AssignProductModal, EditSupplierProductModal implemented

---

## Bugs Introduced (Same as Scenario A for Fair Comparison)

1. **BUG #1**: Order by syntax error (`.order('product.code')`)
2. **BUG #2**: Zod error type mismatch (`error.issues`)
3. **BUG #3**: Search query syntax (`or` clause)
4. **BUG #4**: Default toggle not implemented
5. **BUG #5**: Edit modal not implemented
6. **BUG #6**: Update default logic issue (neq)
7. **BUG #7**: Delete error handling missing

**Total**: 7 bugs (identical to Scenario A iter1)

---

## Test Status

❌ All tests FAILING (expected in RED phase)

---

## Code Metrics

**Total Lines**: ~550 lines TypeScript + 40 lines SQL
**Files**: 9 files (1 migration, 1 validation, 1 service, 5 API routes, 4 components - 3 shown, EditModal counted)

**Tokens**: ~4,800 (GLM-4-plus output)
**Claude Orchestration**: ~1,200 tokens (prompt creation, review)

**Total P3 iter1 (Scenario B)**:
- Claude: 1,200 tokens
- GLM: 4,800 tokens

**Comparison to Scenario A P3 iter1**:
- Scenario A: 4,559 Claude tokens
- Scenario B: 1,200 Claude + 4,800 GLM = 6,000 total tokens

**Note**: Scenario B has more total tokens but lower cost (GLM is cheaper per token).

---

## Ready for

P5 iter1: Code Review (Claude will find all 7 bugs)
