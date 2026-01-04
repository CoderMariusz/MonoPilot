# P3 iter1: GLM Implementation Prompt - Supplier-Product Assignments

**Story**: 03.2
**Scenario**: B (Hybrid)
**Phase**: P3 - Implementation (iter 1)
**Orchestrator**: Claude → GLM-4-plus

---

## Task

Implement complete backend and frontend for **Supplier-Product Assignments** feature.

### Tech Stack
- Next.js 15.5 App Router
- TypeScript
- Supabase (PostgreSQL)
- Zod validation
- ShadCN UI components
- React Hook Form

---

## Requirements

### 1. Database Migration

Create `supabase/migrations/100_create_supplier_products_table.sql`:

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
  UNIQUE(supplier_id, product_id)
);

CREATE INDEX idx_supplier_products_supplier ON supplier_products(supplier_id);
CREATE INDEX idx_supplier_products_product ON supplier_products(product_id);

ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supplier-products org isolation"
ON supplier_products FOR ALL
USING (
  supplier_id IN (SELECT id FROM suppliers WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
);

GRANT ALL ON supplier_products TO authenticated;
```

### 2. Validation Schemas

File: `apps/frontend/lib/validation/supplier-product-validation.ts`

```typescript
import { z } from 'zod';

export const assignProductSchema = z.object({
  product_id: z.string().uuid(),
  is_default: z.boolean().default(false),
  supplier_product_code: z.string().max(50).optional().nullable(),
  unit_price: z.number().positive().optional().nullable(),
  currency: z.enum(['PLN', 'EUR', 'USD', 'GBP']).optional().nullable(),
  lead_time_days: z.number().int().min(0).optional().nullable(),
  moq: z.number().positive().optional().nullable(),
  order_multiple: z.number().positive().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateSupplierProductSchema = assignProductSchema
  .partial()
  .omit({ product_id: true });

export type AssignProductInput = z.infer<typeof assignProductSchema>;
export type UpdateSupplierProductInput = z.infer<typeof updateSupplierProductSchema>;
```

### 3. Service Layer

File: `apps/frontend/lib/services/supplier-product-service.ts`

Implement functions:
- `getSupplierProducts(supplierId)` - Fetch all with product join
- `assignProductToSupplier(supplierId, data)` - Create with duplicate check, default toggle
- `updateSupplierProduct(supplierId, productId, data)` - Update with default toggle
- `removeSupplierProduct(supplierId, productId)` - Delete
- `getDefaultSupplierForProduct(productId)` - Get default with supplier join

**Business Rules**:
- Only one `is_default=true` per product
- When setting new default, unset previous
- Check duplicates before insert

### 4. API Routes

Implement 5 endpoints:
- `GET /api/planning/suppliers/[supplierId]/products/route.ts`
- `POST /api/planning/suppliers/[supplierId]/products/route.ts`
- `PUT /api/planning/suppliers/[supplierId]/products/[productId]/route.ts`
- `DELETE /api/planning/suppliers/[supplierId]/products/[productId]/route.ts`
- `GET /api/planning/products/[productId]/default-supplier/route.ts`

Handle errors: 400, 404, 409, 500

### 5. React Components

Create 4 components:
- `SupplierProductsTable.tsx` - DataTable with search, filter, actions
- `AssignProductModal.tsx` - Dialog for creating assignment
- `EditSupplierProductModal.tsx` - Dialog for editing
- `ProductSelectorCombobox.tsx` - Searchable product picker

Use ShadCN: Dialog, Form, Input, Checkbox, Combobox, DataTable

---

## Output

Provide complete TypeScript code for all files. Include:
- Proper error handling
- Type safety (no `any`)
- Supabase client usage
- React Hook Form integration
- Loading states
- Toast notifications

**Code Length**: ~500-600 lines total

**GO! Implement now.**
