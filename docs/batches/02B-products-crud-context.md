# Epic 2 Batch 2A - Implementation Context

**Created:** 2025-11-23
**Stories:** 2.1, 2.2, 2.3, 2.4, 2.5, 2.22 (6 stories, 17 points)
**Estimated Time:** 30-40k tokens, 1-2 sessions

---

## Quick Reference

### Implementation Order
1. ✅ **Story 2.22** - Technical Settings (foundation for other stories)
2. ✅ **Story 2.5** - Product Types (needed for product creation)
3. ✅ **Story 2.1** - Product CRUD (core functionality)
4. ✅ **Story 2.2** - Product Versioning (extends Story 2.1)
5. ✅ **Story 2.3** - Product History (depends on Story 2.2)
6. ✅ **Story 2.4** - Product Allergens (extends Story 2.1)

### Files to Reference
- Tech Spec: `docs/sprint-artifacts/tech-spec-epic-2-batch-2a.md`
- Stories: `docs/sprint-artifacts/stories/story-2-*.md`
- Epic File: `docs/epics/epic-2-technical.md`
- Architecture: `docs/architecture/patterns/database.md`

---

## Database Schema Summary

### Migration 014: Create Products Tables

```sql
-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE product_type AS ENUM ('RM', 'WIP', 'FG', 'PKG', 'BP', 'CUSTOM');

-- ============================================
-- TABLE: products
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Business fields
  code TEXT NOT NULL,                    -- Immutable after creation
  name TEXT NOT NULL,
  type product_type NOT NULL,
  description TEXT,
  category TEXT,
  uom TEXT NOT NULL,
  version NUMERIC(4,1) NOT NULL DEFAULT 1.0,
  status TEXT NOT NULL DEFAULT 'active',

  -- Optional fields (visibility controlled by settings)
  shelf_life_days INTEGER,
  min_stock_qty NUMERIC(10,2),
  max_stock_qty NUMERIC(10,2),
  reorder_point NUMERIC(10,2),
  cost_per_unit NUMERIC(10,2),

  -- Multi-tenancy
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE (org_id, code),
  CHECK (version >= 1.0)
);

-- Indexes
CREATE INDEX idx_products_org_code ON products(org_id, code);
CREATE INDEX idx_products_org_type ON products(org_id, type);
CREATE INDEX idx_products_org_status ON products(org_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_category ON products(org_id, category) WHERE category IS NOT NULL;

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON products
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Auto-update timestamp
CREATE TRIGGER update_products_timestamp
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- TABLE: product_version_history
-- ============================================
CREATE TABLE product_version_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  version NUMERIC(4,1) NOT NULL,
  changed_fields JSONB NOT NULL,         -- { field: { old: X, new: Y } }
  change_summary TEXT,
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  org_id UUID NOT NULL REFERENCES organizations(id)
);

-- Indexes
CREATE INDEX idx_product_version_history_product ON product_version_history(product_id, changed_at DESC);
CREATE INDEX idx_product_version_history_org ON product_version_history(org_id, changed_at DESC);

-- RLS
ALTER TABLE product_version_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON product_version_history
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- ============================================
-- TABLE: product_allergens
-- ============================================
CREATE TABLE product_allergens (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  allergen_id UUID NOT NULL REFERENCES allergens(id) ON DELETE RESTRICT,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('contains', 'may_contain')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  PRIMARY KEY (product_id, allergen_id, relation_type)
);

-- Indexes
CREATE INDEX idx_product_allergens_product ON product_allergens(product_id);
CREATE INDEX idx_product_allergens_allergen ON product_allergens(allergen_id);

-- RLS
ALTER TABLE product_allergens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON product_allergens
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- ============================================
-- TABLE: product_type_config
-- ============================================
CREATE TABLE product_type_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  org_id UUID NOT NULL REFERENCES organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  UNIQUE (org_id, code)
);

-- Indexes
CREATE INDEX idx_product_type_config_org ON product_type_config(org_id) WHERE is_active = true;

-- RLS
ALTER TABLE product_type_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON product_type_config
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Auto-update timestamp
CREATE TRIGGER update_product_type_config_timestamp
  BEFORE UPDATE ON product_type_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- TABLE: technical_settings
-- ============================================
CREATE TABLE technical_settings (
  org_id UUID PRIMARY KEY REFERENCES organizations(id),
  product_field_config JSONB NOT NULL DEFAULT '{
    "shelf_life_days": {"visible": true, "mandatory": false},
    "min_stock_qty": {"visible": true, "mandatory": false},
    "max_stock_qty": {"visible": true, "mandatory": false},
    "reorder_point": {"visible": true, "mandatory": false},
    "cost_per_unit": {"visible": true, "mandatory": false},
    "category": {"visible": true, "mandatory": false}
  }',
  max_bom_versions INTEGER,
  use_conditional_flags BOOLEAN DEFAULT false,
  conditional_flags JSONB DEFAULT '["organic", "gluten_free", "vegan", "kosher", "halal", "dairy_free", "nut_free", "soy_free"]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES users(id)
);

-- RLS
ALTER TABLE technical_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON technical_settings
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Auto-update timestamp
CREATE TRIGGER update_technical_settings_timestamp
  BEFORE UPDATE ON technical_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- FUNCTIONS: Version Increment
-- ============================================
CREATE OR REPLACE FUNCTION increment_product_version(current_version NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  major_ver INTEGER;
  minor_ver INTEGER;
BEGIN
  major_ver := floor(current_version);
  minor_ver := round((current_version - major_ver) * 10);

  IF minor_ver >= 9 THEN
    RETURN (major_ver + 1.0);
  ELSE
    RETURN (major_ver + (minor_ver + 1) * 0.1);
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- TRIGGER: Track Product Version
-- ============================================
CREATE OR REPLACE FUNCTION track_product_version()
RETURNS TRIGGER AS $$
DECLARE
  changed JSONB := '{}';
  field TEXT;
  old_val TEXT;
  new_val TEXT;
BEGIN
  -- Skip if soft delete
  IF NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Track changed fields
  FOREACH field IN ARRAY ARRAY[
    'code', 'name', 'type', 'description', 'category', 'uom',
    'shelf_life_days', 'min_stock_qty', 'max_stock_qty',
    'reorder_point', 'cost_per_unit', 'status'
  ]
  LOOP
    EXECUTE format('SELECT ($1).%I::TEXT, ($2).%I::TEXT', field, field)
      INTO old_val, new_val
      USING OLD, NEW;

    IF old_val IS DISTINCT FROM new_val THEN
      changed := changed || jsonb_build_object(
        field,
        jsonb_build_object('old', old_val, 'new', new_val)
      );
    END IF;
  END LOOP;

  -- If any fields changed, increment version and log
  IF changed <> '{}' THEN
    NEW.version := increment_product_version(OLD.version);

    INSERT INTO product_version_history (
      product_id, version, changed_fields, changed_by, org_id
    ) VALUES (
      NEW.id, NEW.version, changed, NEW.updated_by, NEW.org_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_product_version
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION track_product_version();

-- ============================================
-- SEED DATA: Default Product Types
-- ============================================
-- Run for each organization during setup
INSERT INTO product_type_config (code, name, is_default, org_id, created_by)
VALUES
  ('RM', 'Raw Material', true, :org_id, :user_id),
  ('WIP', 'Work in Progress', true, :org_id, :user_id),
  ('FG', 'Finished Good', true, :org_id, :user_id),
  ('PKG', 'Packaging', true, :org_id, :user_id),
  ('BP', 'By-Product', true, :org_id, :user_id)
ON CONFLICT (org_id, code) DO NOTHING;

-- ============================================
-- SEED DATA: Default Technical Settings
-- ============================================
INSERT INTO technical_settings (org_id, updated_by)
VALUES (:org_id, :user_id)
ON CONFLICT (org_id) DO NOTHING;
```

---

## API Endpoints Summary

### Products (Story 2.1)

**GET /api/technical/products**
- Query: search, type, status, category, page, limit, sort, order
- Returns: Paginated product list

**POST /api/technical/products**
- Body: code, name, type, uom, description, category, shelf_life_days, min_stock_qty, etc.
- Returns: Created product with version 1.0

**GET /api/technical/products/:id**
- Returns: Product detail with allergens

**PUT /api/technical/products/:id**
- Body: All fields except code (immutable)
- Returns: Updated product with incremented version (Story 2.2)

**DELETE /api/technical/products/:id**
- Soft delete (sets deleted_at)
- Returns: success

### Product History (Story 2.3)

**GET /api/technical/products/:id/history**
- Query: page, limit
- Returns: Paginated version history

**GET /api/technical/products/:id/history/compare**
- Query: v1, v2
- Returns: Differences between two versions

### Product Allergens (Story 2.4)

**PUT /api/technical/products/:id/allergens**
- Body: { contains: [uuid], may_contain: [uuid] }
- Returns: Updated allergen assignments

### Product Types (Story 2.5)

**GET /api/technical/product-types**
- Returns: All product types (default + custom) with products count

**POST /api/technical/product-types**
- Body: { code, name }
- Returns: Created custom product type

**PUT /api/technical/product-types/:id**
- Body: { name?, is_active? }
- Returns: Updated product type

### Technical Settings (Story 2.22)

**GET /api/technical/settings**
- Returns: Technical module settings

**PUT /api/technical/settings**
- Body: { product_field_config, max_bom_versions, use_conditional_flags, conditional_flags }
- Returns: Updated settings

---

## Frontend Structure

```
apps/frontend/app/
├── technical/
│   ├── products/
│   │   ├── page.tsx                     # Product list (Story 2.1)
│   │   ├── [id]/
│   │   │   └── page.tsx                 # Product detail (Story 2.1)
│   │   └── components/
│   │       ├── ProductTable.tsx         # Data table (Story 2.1)
│   │       ├── ProductCreateModal.tsx   # Create dialog (Story 2.1)
│   │       ├── ProductEditDrawer.tsx    # Edit drawer (Story 2.1, 2.2)
│   │       ├── ProductDeleteDialog.tsx  # Delete confirmation (Story 2.1)
│   │       ├── ProductHistoryModal.tsx  # Version history (Story 2.3)
│   │       ├── VersionHistoryEntry.tsx  # History entry (Story 2.3)
│   │       ├── VersionCompareDialog.tsx # Compare versions (Story 2.3)
│   │       └── ProductAllergenSection.tsx # Allergen UI (Story 2.4)
│   │
│   └── product-types/
│       └── page.tsx                     # Product types mgmt (Story 2.5)
│
├── settings/
│   └── technical/
│       ├── page.tsx                     # Technical settings (Story 2.22)
│       └── product-types/
│           └── page.tsx                 # Product types (Story 2.5)
│
└── api/
    └── technical/
        ├── products/
        │   ├── route.ts                 # GET (list), POST (create)
        │   └── [id]/
        │       ├── route.ts             # GET, PUT, DELETE
        │       ├── history/
        │       │   ├── route.ts         # GET history
        │       │   └── compare/
        │       │       └── route.ts     # GET compare
        │       └── allergens/
        │           └── route.ts         # PUT allergens
        ├── product-types/
        │   ├── route.ts                 # GET, POST
        │   └── [id]/
        │       └── route.ts             # PUT
        └── settings/
            └── route.ts                 # GET, PUT
```

---

## Validation Schemas (Zod)

### Product Create/Update

```typescript
import { z } from 'zod'

export const productCreateSchema = z.object({
  code: z.string()
    .min(2, 'Code must be at least 2 characters')
    .max(50, 'Code must be less than 50 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Code must be alphanumeric with hyphens or underscores'),
  name: z.string().min(1, 'Name is required').max(200),
  type: z.enum(['RM', 'WIP', 'FG', 'PKG', 'BP', 'CUSTOM']),
  description: z.string().optional(),
  category: z.string().optional(),
  uom: z.string().min(1, 'Unit of Measure is required'),
  shelf_life_days: z.number().int().positive().optional(),
  min_stock_qty: z.number().positive().optional(),
  max_stock_qty: z.number().positive().optional(),
  reorder_point: z.number().positive().optional(),
  cost_per_unit: z.number().positive().optional(),
  status: z.enum(['active', 'inactive', 'obsolete']).default('active')
})

export const productUpdateSchema = productCreateSchema.omit({ code: true })
```

### Allergen Assignment

```typescript
export const allergenAssignmentSchema = z.object({
  contains: z.array(z.string().uuid()).default([]),
  may_contain: z.array(z.string().uuid()).default([])
})
```

### Product Type

```typescript
export const productTypeCreateSchema = z.object({
  code: z.string()
    .min(2).max(10)
    .regex(/^[A-Z]+$/, 'Code must be uppercase letters only')
    .refine(code => !['RM', 'WIP', 'FG', 'PKG', 'BP'].includes(code), {
      message: 'This code is reserved for default types'
    }),
  name: z.string().min(1).max(100)
})

export const productTypeUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  is_active: z.boolean().optional()
})
```

### Technical Settings

```typescript
const fieldConfigSchema = z.object({
  visible: z.boolean(),
  mandatory: z.boolean()
}).refine(data => !data.mandatory || data.visible, {
  message: 'Mandatory fields must be visible'
})

export const technicalSettingsSchema = z.object({
  product_field_config: z.record(fieldConfigSchema),
  max_bom_versions: z.number().int().positive().nullable(),
  use_conditional_flags: z.boolean(),
  conditional_flags: z.array(
    z.string().regex(/^[a-z_]+$/, 'Flag must be lowercase with underscores')
  )
})
```

---

## Key Implementation Patterns

### 1. Follow Epic 1 Patterns

**Reference existing implementations:**
- Settings pages: `app/settings/warehouses/page.tsx`
- Data tables: `app/settings/warehouses/components/WarehouseTable.tsx`
- Create/Edit modals: `app/settings/allergens/components/AllergenModal.tsx`
- API routes: `app/api/settings/warehouses/route.ts`

**Reuse patterns:**
- RLS policy structure
- Audit trail (created_by, updated_by, timestamps)
- Soft delete (deleted_at)
- Multi-tenancy (org_id filtering)
- Error handling (RFC 7807 format)
- Validation (Zod schemas)

### 2. Shadcn/UI Components

**Use these components:**
- `Dialog` - for modals (Create Product, Compare Versions)
- `Sheet` - for drawers (Edit Product)
- `DataTable` - for tables (Product list, Product Types)
- `Form`, `FormField`, `FormItem` - for forms
- `Badge` - for status, type, version displays
- `Alert` - for version info in edit drawer
- `MultiSelect` - for allergen selection (custom or Combobox)

### 3. API Route Structure

**Standard pattern:**
```typescript
// app/api/technical/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { productCreateSchema } from '@/lib/validations/product'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get org_id from user metadata
  const orgId = user.user_metadata.org_id

  // Query with RLS
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .order('code', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orgId = user.user_metadata.org_id
  const body = await req.json()

  // Validate
  const validated = productCreateSchema.parse(body)

  // Insert
  const { data, error } = await supabase
    .from('products')
    .insert({
      ...validated,
      org_id: orgId,
      created_by: user.id,
      updated_by: user.id
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data, { status: 201 })
}
```

### 4. React Query Hooks

**Create API client functions:**
```typescript
// lib/api/technical/products.ts
export async function getProducts(params?: ProductListParams) {
  const query = new URLSearchParams(params as any)
  const res = await fetch(`/api/technical/products?${query}`)
  if (!res.ok) throw new Error('Failed to fetch products')
  return res.json()
}

export async function getProduct(id: string) {
  const res = await fetch(`/api/technical/products/${id}`)
  if (!res.ok) throw new Error('Failed to fetch product')
  return res.json()
}

export async function createProduct(data: ProductCreateInput) {
  const res = await fetch('/api/technical/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to create product')
  return res.json()
}

export async function updateProduct(id: string, data: ProductUpdateInput) {
  const res = await fetch(`/api/technical/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to update product')
  return res.json()
}

export async function deleteProduct(id: string) {
  const res = await fetch(`/api/technical/products/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete product')
  return res.json()
}
```

**Use in components:**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProducts, createProduct } from '@/lib/api/technical/products'

export function ProductList() {
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts
  })

  const queryClient = useQueryClient()
  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })

  // ...
}
```

---

## Testing Requirements

### Unit Tests (95% coverage)

**Test files:**
- `__tests__/lib/validations/product.test.ts`
- `__tests__/lib/api/technical/products.test.ts`
- `__tests__/database/functions/increment_product_version.test.sql`

**Example:**
```typescript
// __tests__/lib/validations/product.test.ts
import { productCreateSchema } from '@/lib/validations/product'

describe('productCreateSchema', () => {
  test('validates valid product', () => {
    const valid = productCreateSchema.parse({
      code: 'FLOUR-001',
      name: 'Wheat Flour',
      type: 'RM',
      uom: 'kg'
    })
    expect(valid.code).toBe('FLOUR-001')
  })

  test('rejects invalid code format', () => {
    expect(() => productCreateSchema.parse({
      code: 'FL@UR!',
      name: 'Flour',
      type: 'RM',
      uom: 'kg'
    })).toThrow()
  })

  test('requires mandatory fields', () => {
    expect(() => productCreateSchema.parse({})).toThrow()
  })
})
```

### Integration Tests (70% coverage)

**Test files:**
- `__tests__/api/technical/products.test.ts`
- `__tests__/api/technical/product-types.test.ts`
- `__tests__/api/technical/settings.test.ts`

**Example:**
```typescript
// __tests__/api/technical/products.test.ts
describe('POST /api/technical/products', () => {
  test('creates product with version 1.0', async () => {
    const res = await fetch('/api/technical/products', {
      method: 'POST',
      body: JSON.stringify({
        code: 'TEST-001',
        name: 'Test Product',
        type: 'RM',
        uom: 'kg'
      })
    })
    expect(res.status).toBe(201)
    const product = await res.json()
    expect(product.version).toBe(1.0)
  })

  test('rejects duplicate code', async () => {
    await createProduct({ code: 'DUP-001', name: 'First' })
    const res = await fetch('/api/technical/products', {
      method: 'POST',
      body: JSON.stringify({ code: 'DUP-001', name: 'Second', type: 'RM', uom: 'kg' })
    })
    expect(res.status).toBe(400)
  })
})
```

### E2E Tests (Playwright)

**Test files:**
- `__tests__/e2e/technical/products-crud.spec.ts`
- `__tests__/e2e/technical/product-versioning.spec.ts`
- `__tests__/e2e/technical/product-history.spec.ts`

**Example:**
```typescript
// __tests__/e2e/technical/products-crud.spec.ts
test('User creates and edits product', async ({ page }) => {
  await page.goto('/technical/products')
  await page.click('button:has-text("Add Product")')

  await page.fill('input[name="code"]', 'FLOUR-001')
  await page.fill('input[name="name"]', 'Wheat Flour')
  await page.selectOption('select[name="type"]', 'RM')
  await page.fill('input[name="uom"]', 'kg')

  await page.click('button:has-text("Create Product")')

  await expect(page.locator('table')).toContainText('FLOUR-001')
  await expect(page.locator('table')).toContainText('1.0')
})
```

---

## Seed Data Script

**Update:** `scripts/seed-products.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seedProducts() {
  const orgId = 'your-org-id'
  const userId = 'your-user-id'

  // 1. Seed product types
  await supabase.from('product_type_config').insert([
    { code: 'RM', name: 'Raw Material', is_default: true, org_id: orgId, created_by: userId },
    { code: 'WIP', name: 'Work in Progress', is_default: true, org_id: orgId, created_by: userId },
    { code: 'FG', name: 'Finished Good', is_default: true, org_id: orgId, created_by: userId },
    { code: 'PKG', name: 'Packaging', is_default: true, org_id: orgId, created_by: userId },
    { code: 'BP', name: 'By-Product', is_default: true, org_id: orgId, created_by: userId }
  ])

  // 2. Seed technical settings
  await supabase.from('technical_settings').insert({
    org_id: orgId,
    updated_by: userId
  })

  // 3. Seed sample products
  await supabase.from('products').insert([
    {
      code: 'FLOUR-001',
      name: 'Wheat Flour',
      type: 'RM',
      uom: 'kg',
      shelf_life_days: 180,
      org_id: orgId,
      created_by: userId,
      updated_by: userId
    },
    {
      code: 'SUGAR-001',
      name: 'White Sugar',
      type: 'RM',
      uom: 'kg',
      shelf_life_days: 365,
      org_id: orgId,
      created_by: userId,
      updated_by: userId
    },
    {
      code: 'BREAD-001',
      name: 'White Bread 500g',
      type: 'FG',
      uom: 'unit',
      shelf_life_days: 7,
      org_id: orgId,
      created_by: userId,
      updated_by: userId
    },
    {
      code: 'BOX-001',
      name: 'Cardboard Box 30x30x30',
      type: 'PKG',
      uom: 'unit',
      org_id: orgId,
      created_by: userId,
      updated_by: userId
    }
  ])

  console.log('✅ Products seeded successfully')
}

seedProducts().catch(console.error)
```

---

## Common Gotchas & Tips

### 1. Version Increment Trigger

**Issue:** Version doesn't increment when expected
**Solution:** Ensure `updated_by` is set in the UPDATE statement. The trigger uses this field.

```typescript
// ❌ Wrong - trigger won't fire correctly
await supabase.from('products').update({ name: 'New Name' })

// ✅ Correct
await supabase.from('products').update({
  name: 'New Name',
  updated_by: userId  // Required for trigger
})
```

### 2. RLS Policies

**Issue:** Cannot query products even with valid user
**Solution:** Ensure JWT contains `org_id` in user metadata

```typescript
// Check JWT structure
const { data: { user } } = await supabase.auth.getUser()
console.log(user.user_metadata.org_id) // Should exist
```

### 3. Code Immutability

**Issue:** Users try to change product code
**Solution:** Disable code field in edit form, validate server-side

```typescript
// In API PUT handler
if (body.code && body.code !== existingProduct.code) {
  return NextResponse.json(
    { error: 'Product code is immutable' },
    { status: 400 }
  )
}
```

### 4. Allergen Assignment

**Issue:** Allergens not showing in product detail
**Solution:** Use JOIN to fetch allergens with product

```typescript
const { data } = await supabase
  .from('products')
  .select(`
    *,
    product_allergens (
      allergen_id,
      relation_type,
      allergens (id, code, name, icon)
    )
  `)
  .eq('id', productId)
  .single()

// Transform to expected format
const allergens = {
  contains: data.product_allergens
    .filter(pa => pa.relation_type === 'contains')
    .map(pa => pa.allergens),
  may_contain: data.product_allergens
    .filter(pa => pa.relation_type === 'may_contain')
    .map(pa => pa.allergens)
}
```

### 5. Product Type Dropdown

**Issue:** Custom types not appearing in dropdown
**Solution:** Fetch active types only

```typescript
const { data: types } = await supabase
  .from('product_type_config')
  .select('code, name')
  .eq('is_active', true)
  .order('is_default', { ascending: false })
  .order('name')
```

---

## Implementation Checklist

### Story 2.22: Technical Settings
- [ ] Create API routes (GET, PUT /api/technical/settings)
- [ ] Create settings page UI
- [ ] ProductFieldConfig component
- [ ] BomSettingsSection component
- [ ] ConditionalFlagsConfig component
- [ ] Tests (unit, integration, E2E)

### Story 2.5: Product Types
- [ ] Create API routes (GET, POST /api/technical/product-types, PUT /:id)
- [ ] Seed default types
- [ ] Create product types management page
- [ ] ProductTypeTable component
- [ ] ProductTypeCreateModal component
- [ ] ProductTypeEditModal component
- [ ] Tests (unit, integration, E2E)

### Story 2.1: Product CRUD
- [ ] Create API routes (GET, POST, PUT, DELETE /api/technical/products)
- [ ] Create product list page
- [ ] ProductTable component
- [ ] ProductCreateModal component
- [ ] ProductEditDrawer component
- [ ] ProductDeleteDialog component
- [ ] Product detail page
- [ ] Tests (unit, integration, E2E)

### Story 2.2: Product Versioning
- [ ] Create version increment function (SQL)
- [ ] Create version tracking trigger (SQL)
- [ ] Update ProductEditDrawer to show version info
- [ ] Tests for version logic (SQL + API)

### Story 2.3: Product History
- [ ] Create history API (GET /api/technical/products/:id/history)
- [ ] Create compare API (GET /api/technical/products/:id/history/compare)
- [ ] ProductHistoryModal component
- [ ] VersionHistoryEntry component
- [ ] VersionCompareDialog component
- [ ] Tests (unit, integration, E2E)

### Story 2.4: Product Allergens
- [ ] Create allergens API (PUT /api/technical/products/:id/allergens)
- [ ] Update product detail API to include allergens
- [ ] ProductAllergenSection component (view + edit)
- [ ] Allergen badges styling
- [ ] Tests (unit, integration, E2E)

### Final Steps
- [ ] Run all tests (pnpm test)
- [ ] Type check (pnpm type-check)
- [ ] Update seed script
- [ ] Manual testing in UI
- [ ] Code review
- [ ] Documentation review

---

**Ready to implement! Start with Story 2.22 (Technical Settings) as it provides the foundation for other stories.**

**Estimated time: 30-40k tokens, 1-2 implementation sessions**

**Pozostały kontekst: ~109,000 tokenów**
