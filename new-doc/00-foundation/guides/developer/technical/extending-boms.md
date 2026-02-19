# Developer Guide: Extending BOM Functionality

**Story**: 02.4 - BOMs CRUD + Date Validity
**Version**: 1.0
**Last Updated**: 2025-12-26
**Status**: Production Ready

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Adding New BOM Fields](#adding-new-bom-fields)
3. [Extending Validation](#extending-validation)
4. [Adding API Endpoints](#adding-api-endpoints)
5. [Customizing Timeline](#customizing-timeline)
6. [Database Schema Changes](#database-schema-changes)
7. [Testing Strategies](#testing-strategies)
8. [Security Considerations](#security-considerations)
9. [Performance Tips](#performance-tips)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

The BOM module follows a layered architecture:

```
┌─────────────────────────────────────────────┐
│       Frontend (Next.js/React)              │
│  - Pages: app/(authenticated)/technical/   │
│  - Components: components/technical/bom/   │
│  - API Routes: app/api/v1/technical/boms/  │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│       Service Layer                         │
│  - lib/services/bom-service-02-4.ts        │
│  - Business logic & validation              │
│  - Multi-tenant isolation                   │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│       Validation Layer                      │
│  - lib/validation/bom-schema.ts            │
│  - Zod schemas for type-safe validation     │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│       Supabase Client                       │
│  - RLS policies enforce security            │
│  - Triggers enforce business rules          │
│  - RPC functions for complex logic          │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│       PostgreSQL Database                   │
│  - boms table (versioning, dates)           │
│  - bom_items table (line items)             │
│  - RLS policies & triggers                  │
└─────────────────────────────────────────────┘
```

---

## Adding New BOM Fields

### Scenario: Add "Cost Per Batch" Field

**Goal**: Track the cost of ingredients per batch

**Step 1: Update Database Schema**

Create a migration file: `supabase/migrations/041_add_cost_per_batch_to_boms.sql`

```sql
-- Add cost_per_batch field to boms table
ALTER TABLE boms
ADD COLUMN cost_per_batch DECIMAL(15,2);

-- Add comment
COMMENT ON COLUMN boms.cost_per_batch IS 'Total material cost per batch (auto-calculated from ingredients)';

-- Optional: Add index if you'll filter/sort by cost
CREATE INDEX idx_boms_cost_per_batch ON boms(cost_per_batch);
```

**Step 2: Update Zod Schema**

File: `apps/frontend/lib/validation/bom-schema.ts`

```typescript
import { z } from 'zod'

// Update CreateBOMSchema
export const createBOMSchema = z.object({
  product_id: z.string().uuid(),
  effective_from: z.string().refine((val) => !isNaN(Date.parse(val))),
  effective_to: z.string().nullable().optional(),
  status: z.enum(['draft', 'active']).default('draft'),
  output_qty: z.number().positive(),
  output_uom: z.string().min(1).max(20),
  notes: z.string().max(2000).optional().nullable(),
  // NEW FIELD:
  cost_per_batch: z.number().positive().optional().nullable(),
})

// Update UpdateBOMSchema
export const updateBOMSchema = createBOMSchema
  .omit({ product_id: true })
  .partial()
  .extend({
    cost_per_batch: z.number().positive().optional().nullable(),
  })
```

**Step 3: Update Service Layer**

File: `apps/frontend/lib/services/bom-service-02-4.ts`

```typescript
// In createBOM function, add to insert data:
const { data: created, error } = await supabase
  .from('boms')
  .insert({
    // ... existing fields
    cost_per_batch: data.cost_per_batch || null,
  })
  .select(/* ... */)
  .single()

// In updateBOM function, add to update logic:
const updateData: Record<string, any> = {
  // ... existing fields
}

if (data.cost_per_batch !== undefined) {
  updateData.cost_per_batch = data.cost_per_batch
}
```

**Step 4: Update API Route**

File: `apps/frontend/app/api/v1/technical/boms/route.ts`

```typescript
const createBOMSchema = z.object({
  // ... existing fields
  cost_per_batch: z.number().positive().optional().nullable(),
})

// In POST handler:
const { data: newBom, error: insertError } = await supabase
  .from('boms')
  .insert({
    // ... existing fields
    cost_per_batch: data.cost_per_batch || null,
  })
```

**Step 5: Update TypeScript Types**

File: `apps/frontend/lib/types/bom.ts`

```typescript
export interface BOM {
  id: string
  org_id: string
  product_id: string
  version: number
  bom_type: 'standard' | 'engineering' | 'costing'
  effective_from: string
  effective_to: string | null
  status: 'draft' | 'active' | 'phased_out' | 'inactive'
  output_qty: number
  output_uom: string
  units_per_box: number | null
  boxes_per_pallet: number | null
  notes: string | null
  // NEW FIELD:
  cost_per_batch: number | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface CreateBOMRequest {
  product_id: string
  effective_from: string
  effective_to?: string | null
  status?: 'draft' | 'active'
  output_qty: number
  output_uom: string
  notes?: string
  // NEW FIELD:
  cost_per_batch?: number | null
}

export interface UpdateBOMRequest {
  effective_from?: string
  effective_to?: string | null
  status?: 'draft' | 'active' | 'phased_out' | 'inactive'
  output_qty?: number
  output_uom?: string
  notes?: string | null
  // NEW FIELD:
  cost_per_batch?: number | null
}
```

**Step 6: Test Migration**

```bash
# Push migration to database
export SUPABASE_ACCESS_TOKEN=<your-token>
npx supabase db push

# Verify column exists
npx supabase db pull
# Check supabase/schema.sql for new column
```

**Step 7: Update UI Components** (if needed)

Add cost field to BOM form component:

```typescript
// In your BOM form component
<div>
  <label htmlFor="cost">Cost Per Batch</label>
  <input
    id="cost"
    type="number"
    step="0.01"
    placeholder="0.00"
    {...register('cost_per_batch')}
  />
</div>
```

---

## Extending Validation

### Scenario: Add Custom Validation Rule

**Goal**: Ensure output_qty doesn't exceed warehouse capacity

**Approach**: Add validation in service layer

**Step 1: Create Validation Function**

File: `apps/frontend/lib/services/bom-service-02-4.ts`

```typescript
/**
 * Check if output quantity exceeds warehouse capacity
 * @param supabase - Supabase client
 * @param productId - Product ID
 * @param outputQty - Proposed output quantity
 * @param orgId - Organization ID
 * @returns Capacity check result
 */
async function checkCapacityConstraint(
  supabase: SupabaseClient,
  productId: string,
  outputQty: number,
  orgId: string
): Promise<{ compliant: boolean; maxCapacity?: number }> {
  // Get product's warehouse
  const { data: product, error } = await supabase
    .from('products')
    .select('warehouse_id')
    .eq('id', productId)
    .eq('org_id', orgId)
    .single()

  if (error || !product) {
    return { compliant: true } // No warehouse = no constraint
  }

  // Get warehouse capacity
  const { data: warehouse } = await supabase
    .from('warehouses')
    .select('max_batch_size')
    .eq('id', product.warehouse_id)
    .single()

  if (!warehouse?.max_batch_size) {
    return { compliant: true }
  }

  return {
    compliant: outputQty <= warehouse.max_batch_size,
    maxCapacity: warehouse.max_batch_size,
  }
}
```

**Step 2: Call Validation in createBOM**

```typescript
export async function createBOM(
  supabase: SupabaseClient,
  input: CreateBOMRequest,
  orgId: string
): Promise<BOMWithProduct> {
  // ... existing validation ...

  const data = validation.data

  // NEW: Check capacity constraint
  const capacityCheck = await checkCapacityConstraint(
    supabase,
    data.product_id,
    data.output_qty,
    orgId
  )

  if (!capacityCheck.compliant) {
    throw new Error(
      `Output quantity ${data.output_qty} exceeds warehouse capacity of ${capacityCheck.maxCapacity}`
    )
  }

  // ... continue with rest of function ...
}
```

**Step 3: Add Test**

File: `apps/frontend/lib/services/__tests__/bom-service-02-4.test.ts`

```typescript
describe('createBOM - capacity validation', () => {
  it('should reject BOM if output exceeds warehouse capacity', async () => {
    // Mock warehouse with max_batch_size = 50
    supabase.from('warehouses').select.mockResolvedValueOnce({
      data: { max_batch_size: 50 },
      error: null,
    })

    await expect(
      BOMService024.createBOM(
        supabase,
        {
          product_id: productId,
          effective_from: '2025-01-01',
          output_qty: 100, // Exceeds capacity
          output_uom: 'kg',
        },
        orgId
      )
    ).rejects.toThrow('exceeds warehouse capacity')
  })
})
```

---

## Adding API Endpoints

### Scenario: Add Bulk Update Endpoint

**Goal**: Update multiple BOMs at once (change status to Active)

**Step 1: Create Route Handler**

File: `apps/frontend/app/api/v1/technical/boms/bulk-update/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema
const bulkUpdateSchema = z.object({
  bom_ids: z.array(z.string().uuid()).min(1),
  status: z.enum(['draft', 'active', 'phased_out', 'inactive']),
})

/**
 * PATCH /api/v1/technical/boms/bulk-update
 * Bulk update BOMs (status, or other fields)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user org_id and role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        org_id,
        role:roles (
          code,
          permissions
        )
      `)
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const roleCode = (userData.role as any)?.code || ''
    const techPerm = (userData.role as any)?.permissions?.technical || ''
    const isAdmin = roleCode === 'admin' || roleCode === 'super_admin'
    const hasTechWrite = techPerm.includes('U')

    if (!isAdmin && !hasTechWrite) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Validate request
    const body = await request.json()
    const validation = bulkUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { bom_ids, status } = validation.data

    // Update all BOMs
    const { data: updated, error: updateError } = await supabase
      .from('boms')
      .update({
        status,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', userData.org_id)
      .in('id', bom_ids)
      .select('id, version, status')

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      updated_count: updated?.length || 0,
      updated: updated,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
```

**Step 2: Add Service Method** (optional)

```typescript
// In bom-service-02-4.ts
export async function bulkUpdateBOMs(
  supabase: SupabaseClient,
  bomIds: string[],
  updateData: Record<string, any>,
  orgId: string
): Promise<void> {
  if (!orgId) {
    throw new Error('org_id is required for multi-tenant isolation')
  }

  const { error } = await supabase
    .from('boms')
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', orgId)
    .in('id', bomIds)

  if (error) {
    throw new Error(error.message)
  }
}
```

**Step 3: Add Types**

```typescript
// In lib/types/bom.ts
export interface BulkUpdateRequest {
  bom_ids: string[]
  status: BOMStatus
  // other fields as needed
}
```

**Step 4: Test Endpoint**

```bash
curl -X PATCH "http://localhost:3000/api/v1/technical/boms/bulk-update" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "bom_ids": ["bom-1", "bom-2", "bom-3"],
    "status": "active"
  }'
```

---

## Customizing Timeline

### Scenario: Add Cost Visualization to Timeline

**Goal**: Show cost_per_batch on timeline bars

**Step 1: Update BOMTimelineVersion Type**

File: `apps/frontend/lib/types/bom.ts`

```typescript
export interface BOMTimelineVersion {
  id: string
  version: number
  status: BOMStatus
  effective_from: string
  effective_to: string | null
  output_qty: number
  output_uom: string
  notes: string | null
  is_currently_active: boolean
  has_overlap: boolean
  // NEW FIELD:
  cost_per_batch?: number | null
}
```

**Step 2: Update RPC Function**

File: `supabase/migrations/040_create_bom_rpc_functions.sql`

```sql
-- Update get_bom_timeline to include cost_per_batch
CREATE OR REPLACE FUNCTION get_bom_timeline(
  p_product_id UUID,
  p_org_id UUID
)
RETURNS TABLE (
  id UUID,
  version INTEGER,
  status TEXT,
  effective_from DATE,
  effective_to DATE,
  output_qty DECIMAL,
  output_uom TEXT,
  notes TEXT,
  cost_per_batch DECIMAL, -- NEW
  is_currently_active BOOLEAN,
  has_overlap BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
    SELECT
      boms.id,
      boms.version,
      boms.status,
      boms.effective_from,
      boms.effective_to,
      boms.output_qty,
      boms.output_uom,
      boms.notes,
      boms.cost_per_batch, -- NEW
      -- calculation for is_currently_active...
      -- calculation for has_overlap...
    FROM boms
    WHERE boms.product_id = p_product_id
      AND boms.org_id = p_org_id
    ORDER BY boms.version ASC;
END;
$$ LANGUAGE plpgsql;
```

**Step 3: Update Timeline Component**

File: `apps/frontend/components/technical/bom/BOMVersionTimeline.tsx`

```typescript
// In tooltip content
<TooltipContent
  role="tooltip"
  side="top"
  className="max-w-xs bg-white text-gray-900 border shadow-lg p-3"
>
  <div className="space-y-2">
    <p className="font-semibold">Version {version.version}</p>
    <p className="text-sm">
      <span className="text-gray-500">Status:</span> {version.status}
    </p>
    <p className="text-sm">
      <span className="text-gray-500">Effective:</span>{' '}
      {formatDateRange(version.effective_from, version.effective_to)}
    </p>
    <p className="text-sm">
      <span className="text-gray-500">Output:</span> {version.output_qty}{' '}
      {version.output_uom}
    </p>
    {/* NEW: Cost display */}
    {version.cost_per_batch && (
      <p className="text-sm">
        <span className="text-gray-500">Cost/Batch:</span> ${version.cost_per_batch}
      </p>
    )}
    {version.notes && (
      <p className="text-sm">
        <span className="text-gray-500">Notes:</span> {version.notes}
      </p>
    )}
  </div>
</TooltipContent>
```

---

## Database Schema Changes

### Best Practices

**When Adding Fields**:

1. Make optional in migration (nullable)
   ```sql
   ALTER TABLE boms ADD COLUMN new_field TEXT;
   ```

2. Only make required if necessary
   ```sql
   -- Avoid: ALTER TABLE boms ADD COLUMN required_field TEXT NOT NULL;
   -- Better: Make nullable, then migrate data, then add NOT NULL
   ```

3. Add index if used in queries
   ```sql
   CREATE INDEX idx_boms_new_field ON boms(new_field);
   ```

4. Add comments
   ```sql
   COMMENT ON COLUMN boms.new_field IS 'Description of field';
   ```

**Migration Template**:

```sql
-- Migration: Add new_field to boms
-- Story: XX.Y - Description
-- Purpose: Explanation of why field is needed

BEGIN;

ALTER TABLE boms
ADD COLUMN new_field TEXT DEFAULT NULL;

-- Add index if filtering/sorting by this field
CREATE INDEX idx_boms_new_field ON boms(new_field)
WHERE new_field IS NOT NULL;

-- Add comment
COMMENT ON COLUMN boms.new_field IS 'Description and use case';

COMMIT;
```

---

## Testing Strategies

### Unit Tests

File: `apps/frontend/lib/services/__tests__/bom-service-02-4.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BOMService024 } from '../bom-service-02-4'

describe('BOMService024', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn(),
    }
  })

  describe('createBOM', () => {
    it('should create BOM with auto-incremented version', async () => {
      mockSupabase.from().select().eq().order().limit().mockResolvedValueOnce({
        data: [{ version: 2 }],
        error: null,
      })

      mockSupabase
        .from()
        .insert()
        .select()
        .single()
        .mockResolvedValueOnce({
          data: { id: 'bom-1', version: 3, product_id: 'prod-1' },
          error: null,
        })

      const result = await BOMService024.createBOM(
        mockSupabase,
        {
          product_id: 'prod-1',
          effective_from: '2025-01-01',
          output_qty: 100,
          output_uom: 'kg',
        },
        'org-1'
      )

      expect(result.version).toBe(3)
    })

    it('should validate input with Zod schema', async () => {
      await expect(
        BOMService024.createBOM(
          mockSupabase,
          {
            product_id: 'invalid', // Invalid UUID
            effective_from: '2025-01-01',
            output_qty: 100,
            output_uom: 'kg',
          },
          'org-1'
        )
      ).rejects.toThrow()
    })
  })
})
```

### Integration Tests

```typescript
describe('BOM Module Integration', () => {
  it('should create and retrieve BOM', async () => {
    // 1. Create BOM
    const created = await BOMService024.createBOM(supabase, bomData, orgId)

    // 2. Retrieve BOM
    const retrieved = await BOMService024.getBOM(
      supabase,
      created.id,
      orgId
    )

    // 3. Verify
    expect(retrieved).toEqual(created)
  })

  it('should prevent date overlap', async () => {
    // 1. Create BOM v1
    await BOMService024.createBOM(
      supabase,
      {
        product_id: productId,
        effective_from: '2025-01-01',
        effective_to: '2025-06-30',
        output_qty: 100,
        output_uom: 'kg',
      },
      orgId
    )

    // 2. Try to create overlapping BOM v2
    await expect(
      BOMService024.createBOM(
        supabase,
        {
          product_id: productId,
          effective_from: '2025-06-01',
          effective_to: '2025-12-31',
          output_qty: 100,
          output_uom: 'kg',
        },
        orgId
      )
    ).rejects.toThrow('overlaps')
  })
})
```

---

## Security Considerations

### 1. Multi-Tenant Isolation (ADR-013)

Always include org_id in queries:

```typescript
// CORRECT - Defense in Depth
const { data } = await supabase
  .from('boms')
  .select('*')
  .eq('id', id)
  .eq('org_id', orgId) // Explicit filter
  .single()

// WRONG - Relies only on RLS
const { data } = await supabase
  .from('boms')
  .select('*')
  .eq('id', id)
  .single()
```

### 2. Input Validation

Always validate input:

```typescript
// CORRECT
const validation = createBOMSchema.safeParse(input)
if (!validation.success) {
  throw new Error('Validation failed')
}
const data = validation.data

// WRONG - No validation
const data = input as BOM
```

### 3. Rate Limiting

Consider implementing rate limiting for bulk operations:

```typescript
// Check if user has exceeded rate limit
const recentRequests = await redis.get(
  `bulk-update:${userId}:${Date.now() / 60000}`
)
if (recentRequests && recentRequests > 10) {
  return NextResponse.json(
    { error: 'Rate limit exceeded' },
    { status: 429 }
  )
}
```

### 4. Audit Trail

Always track who makes changes:

```typescript
const { error } = await supabase
  .from('boms')
  .update({
    status: 'active',
    updated_by: user.id, // Who made the change
    updated_at: new Date().toISOString(), // When
  })
  .eq('id', id)
```

---

## Performance Tips

### 1. Index Strategy

```sql
-- Good: Composite index for common filters
CREATE INDEX idx_boms_org_status
ON boms(org_id, status)
WHERE status IN ('active', 'draft');

-- Bad: Too many indexes
CREATE INDEX idx_boms_field1 ON boms(field1);
CREATE INDEX idx_boms_field2 ON boms(field2);
-- etc...
```

### 2. Query Optimization

```typescript
// SLOW: Multiple queries
const boms = await listBOMs(supabase, {}, orgId)
const products = await Promise.all(
  boms.boms.map(bom => getProduct(supabase, bom.product_id))
)

// FAST: Single query with join
const { data } = await supabase
  .from('boms')
  .select(`
    *,
    product:products!product_id (
      id,
      code,
      name
    )
  `)
  .eq('org_id', orgId)
```

### 3. Pagination

```typescript
// Always use pagination for large datasets
const page = 1
const limit = 50
const offset = (page - 1) * limit

const { data, count } = await supabase
  .from('boms')
  .select('*', { count: 'exact' })
  .range(offset, offset + limit - 1)
```

### 4. Caching

Consider caching timeline data:

```typescript
// Cache for 5 minutes
const cacheKey = `bom-timeline:${productId}`
const cached = await redis.get(cacheKey)

if (cached) {
  return JSON.parse(cached)
}

const timeline = await BOMService024.getBOMTimeline(
  supabase,
  productId,
  orgId
)

await redis.setex(cacheKey, 300, JSON.stringify(timeline))
return timeline
```

---

## Troubleshooting

### Issue: Date Overlap Validation Bypassed

**Symptom**: Created overlapping BOMs despite validation

**Cause**: RPC function and trigger use different logic

**Solution**: Ensure both use identical daterange logic

```sql
-- Both should use: daterange(..., '[]') && daterange(...)
-- '[]' = inclusive on both ends
-- NOT (newTo < existingFrom OR newFrom > existingTo)
```

### Issue: org_id Filter Missing in Query

**Symptom**: Data accessible across organizations

**Cause**: Forgot explicit org_id filter

**Solution**: Add `.eq('org_id', orgId)` to every query

```typescript
// Add this line to every query
.eq('org_id', orgId)
```

### Issue: Version Number Duplicates

**Symptom**: Two BOMs with same version for same product

**Cause**: Concurrent inserts bypassed unique constraint

**Solution**: Use database transaction or unique constraint

```sql
-- Already in place:
CONSTRAINT uq_boms_org_product_version UNIQUE(org_id, product_id, version)
```

### Issue: Timeline Component Not Rendering Correctly

**Symptom**: Versions not displaying in timeline

**Cause**: API returns versions in wrong format

**Solution**: Check RPC function returns all required fields

```typescript
// Ensure API response includes all timeline fields:
versions.forEach(v => {
  console.assert(v.id, 'Missing id')
  console.assert(v.version, 'Missing version')
  console.assert(v.effective_from, 'Missing effective_from')
  console.assert(v.is_currently_active !== undefined, 'Missing is_currently_active')
  console.assert(v.has_overlap !== undefined, 'Missing has_overlap')
})
```

---

## Related Documentation

- API Documentation: `docs/3-ARCHITECTURE/api/technical/boms.md`
- Service Documentation: `docs/3-ARCHITECTURE/services/bom-service.md`
- Component Documentation: `docs/3-ARCHITECTURE/components/bom-version-timeline.md`
- Database Schema: `docs/3-ARCHITECTURE/database/boms-schema.md`
- ADR-013 (RLS Pattern): `docs/3-ARCHITECTURE/decisions/ADR-013-rls-org-isolation-pattern.md`

---

## Code Review Checklist

Before submitting BOM-related changes:

- [ ] All queries include `.eq('org_id', orgId)` filter
- [ ] Input validated with Zod schema
- [ ] Database migration created (if schema changed)
- [ ] Types updated in lib/types/bom.ts
- [ ] Service layer updated with new business logic
- [ ] API endpoint validation matches service validation
- [ ] Tests added for new functionality
- [ ] Security review completed (no cross-tenant access)
- [ ] Performance analyzed (indexes, query plans)
- [ ] Error handling implemented
- [ ] Documentation updated
