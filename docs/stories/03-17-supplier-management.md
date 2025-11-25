# Story 3.17: Supplier Management

**Epic:** 3 - Planning Operations (Batch 3A)
**Story ID:** 3.17
**Priority:** P0 (Blocker for PO creation)
**Effort:** 5 points
**Status:** Ready for Development

---

## User Story

**As a** Purchasing user,
**I want to** manage suppliers with defaults (currency, tax code, payment terms, lead time),
**So that** PO creation is efficient and data is inherited automatically.

---

## Acceptance Criteria

### AC-17.1: Supplier CRUD Operations

**Given** the user has Purchasing role or higher
**When** they navigate to `/planning/suppliers`
**Then** they see a table with columns:
- Code
- Name
- Currency
- Lead Time (days)
- Status (Active/Inactive)

**And** can search by code/name
**And** can filter by currency, is_active

**When** clicking "Add Supplier"
**Then** Create modal opens with all fields per Settings configuration

**When** saving supplier
**Then** supplier is created with auto-validation
**And** audit trail entry created (created_by, created_at)

### AC-17.2: Supplier Form Fields

**Required Fields:**
- `code`: Unique per org, uppercase/numbers/hyphens only (e.g., SUP-001)
- `name`: Supplier name
- `currency`: Dropdown (PLN, EUR, USD, GBP)
- `tax_code_id`: Dropdown from tax_codes table (Epic 1)
- `payment_terms`: Text (e.g., "Net 30", "Net 60")
- `lead_time_days`: Number, default 7

**Optional Fields:**
- `contact_person`: Text
- `email`: Valid email format
- `phone`: Text
- `address`: Text
- `city`: Text
- `postal_code`: Text
- `country`: Dropdown (PL, UK, US, etc.)
- `moq`: Minimum Order Quantity (number)
- `is_active`: Toggle, default true

### AC-17.3: Supplier Edit & Delete

**When** clicking Edit on supplier
**Then** Edit Drawer opens with all fields except `code` (immutable)

**When** saving changes
**Then** supplier updated
**And** `updated_by`, `updated_at` recorded

**When** clicking Delete
**Then** if supplier has active POs → show error: "Cannot delete supplier with active purchase orders (X active POs)"
**And** if no active POs → show confirmation dialog
**And** supplier deleted (hard delete, no soft delete dla suppliers)

### AC-17.4: Supplier-Product Assignments

**Given** a supplier exists
**When** viewing supplier detail page
**Then** see "Products" tab with assigned products table

**When** clicking "Assign Products"
**Then** modal opens with:
- Multi-select product dropdown
- For each product:
  - `is_default` toggle (only one default per product)
  - `supplier_product_code`: Text (supplier's internal SKU)
  - `unit_price`: Number (overrides product default)
  - `lead_time_days`: Number (overrides supplier default)
  - `moq`: Number (overrides supplier default)

**When** saving assignments
**Then** supplier_products records created
**And** if `is_default = true` → unset previous default dla that product
**And** validation enforces: only one default supplier per product

### AC-17.5: Validation Rules

1. **Unique Code**: Cannot create supplier with duplicate code within org
2. **Email Format**: If email provided, must be valid email
3. **Currency Enum**: Must be one of: PLN, EUR, USD, GBP
4. **Tax Code**: Must exist in tax_codes table
5. **Lead Time**: Must be >= 0
6. **MOQ**: Must be > 0 if provided
7. **Default Supplier**: Only one supplier per product can have `is_default = true`

### AC-17.6: Default Supplier Lookup

**Given** bulk PO creation or PO line addition
**When** system looks up default supplier dla product
**Then** query: `SELECT * FROM supplier_products WHERE product_id = X AND is_default = true`
**And** if found → use that supplier
**And** if not found → show error: "No default supplier configured for product"

---

## Technical Implementation

### Database Schema

#### Suppliers Table
```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(2),
  currency VARCHAR(3) NOT NULL, -- PLN, EUR, USD, GBP
  tax_code_id UUID NOT NULL REFERENCES tax_codes(id),
  payment_terms VARCHAR(100) NOT NULL,
  lead_time_days INTEGER NOT NULL DEFAULT 7,
  moq NUMERIC(15,3),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint
CREATE UNIQUE INDEX idx_suppliers_org_code ON suppliers(org_id, code);

-- Indexes
CREATE INDEX idx_suppliers_org ON suppliers(org_id);
CREATE INDEX idx_suppliers_active ON suppliers(is_active);

-- RLS Policy
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY suppliers_isolation ON suppliers
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

#### Supplier-Products Table
```sql
CREATE TABLE supplier_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  is_default BOOLEAN NOT NULL DEFAULT false,
  supplier_product_code VARCHAR(100),
  unit_price NUMERIC(15,2),
  lead_time_days INTEGER,
  moq NUMERIC(15,3),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraints
CREATE UNIQUE INDEX idx_supplier_products_unique
  ON supplier_products(org_id, supplier_id, product_id);

-- Partial unique index: only one default per product
CREATE UNIQUE INDEX idx_supplier_products_default
  ON supplier_products(org_id, product_id)
  WHERE is_default = true;

-- Indexes
CREATE INDEX idx_supplier_products_supplier ON supplier_products(supplier_id);
CREATE INDEX idx_supplier_products_product ON supplier_products(product_id);
CREATE INDEX idx_supplier_products_default_flag ON supplier_products(is_default);

-- RLS Policy
ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY supplier_products_isolation ON supplier_products
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

### API Routes

#### Supplier CRUD
```typescript
// apps/frontend/app/api/planning/suppliers/route.ts

import { createSupabaseAdminClient } from '@/lib/supabase/admin-client'
import { supplierSchema } from '@/lib/validation/planning-schemas'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createSupabaseAdminClient()
  const { searchParams } = new URL(request.url)

  const search = searchParams.get('search')
  const is_active = searchParams.get('is_active')

  let query = supabase
    .from('suppliers')
    .select('*, tax_codes(code, description, rate)')
    .order('code', { ascending: true })

  if (search) {
    query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`)
  }

  if (is_active !== null) {
    query = query.eq('is_active', is_active === 'true')
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseAdminClient()
  const body = await request.json()

  // Validate with Zod
  const validation = supplierSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.errors
    }, { status: 400 })
  }

  const { data: user } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supplierData = {
    ...validation.data,
    org_id: user.user.user_metadata.org_id,
    created_by: user.user.id,
    updated_by: user.user.id,
  }

  const { data, error } = await supabase
    .from('suppliers')
    .insert(supplierData)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') { // Unique violation
      return NextResponse.json({
        error: 'Supplier code already exists'
      }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
```

#### Supplier-Product Assignment
```typescript
// apps/frontend/app/api/planning/suppliers/[id]/products/route.ts

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseAdminClient()
  const body = await request.json()
  const { product_assignments } = body // Array of { product_id, is_default, ... }

  const { data: user } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const org_id = user.user.user_metadata.org_id

  // Transaction: Delete existing, insert new
  const { error: deleteError } = await supabase
    .from('supplier_products')
    .delete()
    .eq('supplier_id', params.id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  const assignments = product_assignments.map((assignment: any) => ({
    ...assignment,
    org_id,
    supplier_id: params.id,
  }))

  const { data, error } = await supabase
    .from('supplier_products')
    .insert(assignments)
    .select()

  if (error) {
    if (error.code === '23505') { // Unique violation
      return NextResponse.json({
        error: 'Only one default supplier allowed per product'
      }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
```

### Frontend Components

#### Supplier List Page
```typescript
// apps/frontend/app/(authenticated)/planning/suppliers/page.tsx

'use client'

import { useState } from 'react'
import { useSuppliers } from '@/lib/hooks/useSuppliers'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SupplierCreateModal } from '@/components/planning/SupplierCreateModal'
import { columns } from './columns'

export default function SuppliersPage() {
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { data: suppliers, isLoading } = useSuppliers({ search })

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Suppliers</h1>
        <Button onClick={() => setIsCreateOpen(true)}>Add Supplier</Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search by code or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <DataTable columns={columns} data={suppliers || []} loading={isLoading} />

      <SupplierCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  )
}
```

#### Supplier Create Modal
```typescript
// apps/frontend/components/planning/SupplierCreateModal.tsx

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supplierSchema } from '@/lib/validation/planning-schemas'
import { Modal } from '@/components/ui/modal'
import { Form, FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useTaxCodes } from '@/lib/hooks/useTaxCodes'

interface SupplierCreateModalProps {
  open: boolean
  onClose: () => void
}

export function SupplierCreateModal({ open, onClose }: SupplierCreateModalProps) {
  const { data: taxCodes } = useTaxCodes()

  const form = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      code: '',
      name: '',
      currency: 'PLN',
      payment_terms: 'Net 30',
      lead_time_days: 7,
      is_active: true,
    },
  })

  const onSubmit = async (data: any) => {
    const response = await fetch('/api/planning/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (response.ok) {
      form.reset()
      onClose()
      // Invalidate cache
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Supplier">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField name="code" label="Code*" control={form.control}>
            <Input placeholder="SUP-001" />
          </FormField>

          <FormField name="name" label="Name*" control={form.control}>
            <Input placeholder="Supplier name" />
          </FormField>

          <FormField name="currency" label="Currency*" control={form.control}>
            <Select options={[
              { value: 'PLN', label: 'PLN' },
              { value: 'EUR', label: 'EUR' },
              { value: 'USD', label: 'USD' },
              { value: 'GBP', label: 'GBP' },
            ]} />
          </FormField>

          <FormField name="tax_code_id" label="Tax Code*" control={form.control}>
            <Select options={taxCodes?.map(tc => ({
              value: tc.id,
              label: `${tc.code} (${tc.rate}%)`,
            })) || []} />
          </FormField>

          <FormField name="payment_terms" label="Payment Terms*" control={form.control}>
            <Input placeholder="Net 30" />
          </FormField>

          <FormField name="lead_time_days" label="Lead Time (days)*" control={form.control}>
            <Input type="number" />
          </FormField>

          {/* Optional fields: email, phone, address, moq */}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create Supplier</Button>
          </div>
        </form>
      </Form>
    </Modal>
  )
}
```

### Validation Schemas

```typescript
// apps/frontend/lib/validation/planning-schemas.ts

import { z } from 'zod'

export const supplierSchema = z.object({
  code: z.string()
    .min(1, 'Code is required')
    .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase letters, numbers, and hyphens only'),
  name: z.string().min(1, 'Name is required'),
  contact_person: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().length(2).optional(),
  currency: z.enum(['PLN', 'EUR', 'USD', 'GBP']),
  tax_code_id: z.string().uuid('Invalid tax code'),
  payment_terms: z.string().min(1, 'Payment terms required'),
  lead_time_days: z.number().int().min(0, 'Lead time must be >= 0').default(7),
  moq: z.number().positive('MOQ must be positive').optional(),
  is_active: z.boolean().default(true),
})

export const supplierProductSchema = z.object({
  product_id: z.string().uuid(),
  is_default: z.boolean().default(false),
  supplier_product_code: z.string().optional(),
  unit_price: z.number().positive().optional(),
  lead_time_days: z.number().int().min(0).optional(),
  moq: z.number().positive().optional(),
})
```

---

## Testing Requirements

### Unit Tests

1. **Supplier Validation** (`supplier-validation.spec.ts`)
   - Valid supplier data passes
   - Invalid code format fails
   - Invalid email format fails
   - Currency enum validation

2. **Supplier-Product Logic** (`supplier-products.spec.ts`)
   - Default supplier lookup
   - Only one default per product enforcement
   - Unit price override logic

### Integration Tests

1. **Supplier CRUD** (`suppliers-api.test.ts`)
   - Create supplier → success
   - Create duplicate code → 409 error
   - Update supplier → success
   - Delete supplier with POs → 403 error
   - Delete supplier without POs → success

2. **Supplier-Product Assignment** (`supplier-products-api.test.ts`)
   - Assign products to supplier → success
   - Set default supplier → unsets previous default
   - Multiple defaults → 409 error
   - Lookup default supplier → correct result

3. **RLS Policy** (`suppliers-rls.test.ts`)
   - User A cannot read User B's suppliers
   - Supplier query respects org_id isolation

### E2E Tests

1. **Supplier Management Flow** (`supplier-management.e2e.ts`)
   - Navigate to suppliers page
   - Create new supplier
   - Edit supplier
   - Assign products
   - Set default supplier
   - Delete supplier (blocked if has POs)

2. **Default Supplier Lookup** (`default-supplier.e2e.ts`)
   - Create product
   - Assign 3 suppliers, set 1 as default
   - Bulk PO creation → uses default supplier
   - Verify correct supplier selected

---

## Definition of Done

- [ ] Database migration created and applied
- [ ] RLS policies enabled and tested
- [ ] API routes implemented (GET, POST, PUT, DELETE)
- [ ] Zod validation schemas created
- [ ] Frontend components created (List, Create Modal, Edit Drawer, Detail Page)
- [ ] Supplier-product assignment UI implemented
- [ ] Unit tests written (>95% coverage)
- [ ] Integration tests written (>70% coverage)
- [ ] E2E test written (supplier management flow)
- [ ] API documentation updated
- [ ] Code reviewed and approved
- [ ] Deployed to staging
- [ ] QA tested
- [ ] Product Owner approved

---

## Dependencies

### Requires from Epic 1:
- `organizations` table (org_id FK)
- `users` table (created_by, updated_by FK)
- `tax_codes` table (tax_code_id FK)

### Blocks:
- Story 3.1 (PO CRUD) - requires suppliers
- Story 3.3 (Bulk PO) - requires default supplier lookup

---

## Notes

- Suppliers are **not soft-deleted** (use `is_active` flag instead)
- Supplier code is **immutable** after creation
- Currency is **locked** to supplier (PO inherits, no conversion in MVP)
- Default supplier logic is critical dla bulk PO creation
- If multiple suppliers for product, user manually selects in PO
