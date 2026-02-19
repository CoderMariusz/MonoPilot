# WO Materials & Operations Developer Guide

## Overview

This guide provides comprehensive information for developers implementing and maintaining the WO Materials (Story 03.11a) and WO Operations (Story 03.12) features.

**Key Components**:
- Database tables: `wo_materials`, `wo_operations`
- API routes: Materials and Operations endpoints
- Services: `wo-materials-service.ts`, `wo-operations-service.ts`
- Components: Materials table, Operations timeline
- Hooks: `use-wo-materials`, `use-wo-operations`

## Project Structure

```
apps/frontend/
  ├── app/api/planning/work-orders/
  │   ├── [id]/materials/route.ts          # GET materials
  │   ├── [id]/snapshot/route.ts           # POST snapshot
  │   ├── [wo_id]/operations/route.ts      # GET operations list
  │   ├── [wo_id]/operations/[op_id]/route.ts  # GET operation detail
  │   └── [wo_id]/copy-routing/route.ts    # POST copy-routing
  │
  ├── lib/services/
  │   ├── wo-materials-service.ts          # Materials business logic
  │   └── wo-operations-service.ts         # Operations business logic
  │
  ├── lib/types/
  │   ├── wo-materials.ts                  # Materials types
  │   └── wo-operation.ts                  # Operations types
  │
  ├── lib/validation/
  │   └── wo-materials.ts                  # Zod schemas
  │
  ├── lib/hooks/
  │   ├── use-wo-materials.ts              # Materials React Query hook
  │   ├── use-wo-operations.ts             # Operations React Query hook
  │   └── use-wo-operation-detail.ts       # Operation detail hook
  │
  └── components/planning/work-orders/
      ├── WOMaterialsTable.tsx             # Materials list
      ├── WOMaterialRow.tsx                # Material row
      ├── RefreshSnapshotButton.tsx        # Refresh button
      ├── WOOperationsTimeline.tsx         # Operations list
      ├── WOOperationCard.tsx              # Operation card
      ├── WOOperationDetailPanel.tsx       # Operation detail
      ├── WOOperationStatusBadge.tsx       # Status indicator
      ├── WOOperationProgressBar.tsx       # Progress bar
      └── WOOperationsEmptyState.tsx       # No operations message

supabase/
  └── migrations/
      ├── XXX_create_wo_materials_table.sql
      └── XXX_create_wo_operations_table.sql
```

## Setup & Dependencies

### Database Setup

1. **Apply migrations**:

```bash
export SUPABASE_ACCESS_TOKEN=<your_token>
npx supabase db push
```

This creates:
- `wo_materials` table with RLS policies
- `wo_operations` table with RLS policies and triggers
- Indexes and constraints

2. **Verify migrations**:

```bash
npx supabase db list
```

Output should include:
```
Schema: public
  Table: wo_materials
  Table: wo_operations
```

### Dependencies

**Frontend packages** (already in pnpm-lock.yaml):

```json
{
  "@supabase/auth-helpers-nextjs": "^latest",
  "@supabase/supabase-js": "^latest",
  "@tanstack/react-query": "^latest",
  "zod": "^3.x",
  "date-fns": "^2.x",
  "lucide-react": "^latest"
}
```

No additional packages needed—all core dependencies are already installed.

## Type Definitions

### Materials Types

**File**: `apps/frontend/lib/types/wo-materials.ts`

```typescript
export interface WOMaterial {
  id: string;
  wo_id: string;
  product_id: string;
  material_name: string;
  required_qty: number;
  consumed_qty: number;
  reserved_qty: number;
  uom: string;
  sequence: number;
  consume_whole_lp: boolean;
  is_by_product: boolean;
  yield_percent: number | null;
  scrap_percent: number;
  condition_flags: Record<string, boolean> | null;
  bom_item_id: string | null;
  bom_version: number | null;
  notes: string | null;
  created_at: string;
  product?: {
    id: string;
    code: string;
    name: string;
    product_type: string;
  };
}

export interface WOMaterialsListResponse {
  materials: WOMaterial[];
  total: number;
  bom_version: number | null;
  snapshot_at: string | null;
}

export interface CreateSnapshotResponse {
  success: boolean;
  materials_count: number;
  message: string;
}

export type MaterialStatus =
  | 'pending'      // 0% consumed
  | 'in_progress'  // 0 < consumed < required
  | 'complete'     // consumed >= required
  | 'by_product';  // is_by_product = true
```

### Operations Types

**File**: `apps/frontend/lib/types/wo-operation.ts`

```typescript
export type WOOperationStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface WOOperation {
  id: string;
  wo_id: string;
  sequence: number;
  operation_name: string;
  description: string | null;
  machine_id: string | null;
  machine_code: string | null;
  machine_name: string | null;
  line_id: string | null;
  line_code: string | null;
  line_name: string | null;
  expected_duration_minutes: number | null;
  expected_yield_percent: number | null;
  actual_duration_minutes: number | null;
  actual_yield_percent: number | null;
  status: WOOperationStatus;
  started_at: string | null;
  completed_at: string | null;
  started_by: string | null;
  completed_by: string | null;
  started_by_user: { name: string } | null;
  completed_by_user: { name: string } | null;
  skip_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WOOperationDetail extends WOOperation {
  instructions: string | null;
  machine: { id: string; code: string; name: string } | null;
  line: { id: string; code: string; name: string } | null;
  duration_variance_minutes: number | null;
  yield_variance_percent: number | null;
}

export interface WOOperationsListResponse {
  operations: WOOperation[];
  total: number;
}

export interface CopyRoutingResponse {
  success: boolean;
  operations_created: number;
  message: string;
}
```

## Services

### Materials Service

**File**: `apps/frontend/lib/services/wo-materials-service.ts`

Functions for fetching and managing WO materials:

```typescript
/**
 * Get all materials for a Work Order (BOM snapshot)
 */
export async function getWOMaterials(
  woId: string
): Promise<WOMaterialsListResponse> {
  const response = await fetch(`/api/planning/work-orders/${woId}/materials`);
  if (!response.ok) {
    throw new Error('Failed to fetch materials');
  }
  return response.json();
}

/**
 * Refresh BOM snapshot for a Work Order
 */
export async function refreshSnapshot(
  woId: string
): Promise<CreateSnapshotResponse> {
  const response = await fetch(
    `/api/planning/work-orders/${woId}/snapshot`,
    { method: 'POST' }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to refresh snapshot');
  }
  return response.json();
}

/**
 * Check if WO snapshot can be modified
 */
export function canModifySnapshot(woStatus: string): boolean {
  return ['draft', 'planned'].includes(woStatus);
}
```

### Operations Service

**File**: `apps/frontend/lib/services/wo-operations-service.ts`

Functions for fetching and managing WO operations:

```typescript
/**
 * Get all operations for a WO
 */
export async function getOperationsForWO(
  supabase: SupabaseClient,
  woId: string
): Promise<WOOperationsListResponse> {
  // Verify WO exists
  const { data: wo, error: woError } = await supabase
    .from('work_orders')
    .select('id')
    .eq('id', woId)
    .single();

  if (woError || !wo) {
    throw new Error('Work order not found');
  }

  // Get operations with related data
  const { data: operations, error } = await supabase
    .from('wo_operations')
    .select(`
      *,
      machine:machines(id, code, name),
      line:production_lines(id, code, name),
      started_by_user:users!wo_operations_started_by_fkey(name),
      completed_by_user:users!wo_operations_completed_by_fkey(name)
    `)
    .eq('wo_id', woId)
    .order('sequence', { ascending: true });

  if (error) {
    throw new Error('Failed to fetch operations');
  }

  return {
    operations: operations || [],
    total: (operations || []).length,
  };
}

/**
 * Get single operation with full details
 */
export async function getOperationById(
  supabase: SupabaseClient,
  woId: string,
  opId: string
): Promise<WOOperationDetail | null> {
  const { data: operation, error } = await supabase
    .from('wo_operations')
    .select(`
      *,
      machine:machines(id, code, name),
      line:production_lines(id, code, name),
      started_by_user:users!wo_operations_started_by_fkey(id, name),
      completed_by_user:users!wo_operations_completed_by_fkey(id, name)
    `)
    .eq('id', opId)
    .eq('wo_id', woId)
    .single();

  if (error || !operation) {
    return null;
  }

  // Calculate variances
  const duration_variance =
    operation.actual_duration_minutes !== null &&
    operation.expected_duration_minutes !== null
      ? operation.actual_duration_minutes - operation.expected_duration_minutes
      : null;

  return {
    ...operation,
    duration_variance_minutes: duration_variance,
    yield_variance_percent: null, // From DB or calculated
  };
}

/**
 * Copy routing operations to WO (database function call)
 */
export async function copyRoutingToWO(
  supabase: SupabaseClient,
  woId: string,
  orgId: string
): Promise<number> {
  const { data, error } = await supabase.rpc('copy_routing_to_wo', {
    p_wo_id: woId,
    p_org_id: orgId,
  });

  if (error) {
    throw new Error(error.message || 'Failed to copy routing');
  }

  return data || 0;
}

/**
 * Calculate expected duration from routing operation
 */
export function calculateExpectedDuration(routingOp: {
  duration?: number | null;
  setup_time?: number | null;
  cleanup_time?: number | null;
}): number {
  return (
    (routingOp.duration || 0) +
    (routingOp.setup_time || 0) +
    (routingOp.cleanup_time || 0)
  );
}

/**
 * Validate operation sequences are unique
 */
export function validateOperationSequence(
  operations: { sequence: number }[]
): boolean {
  const sequences = operations.map(op => op.sequence);
  const uniqueSequences = new Set(sequences);
  return sequences.length === uniqueSequences.size;
}
```

## React Hooks

### useWOMaterials

**File**: `apps/frontend/lib/hooks/use-wo-materials.ts`

React Query hook for fetching materials with caching:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWOMaterials, refreshSnapshot } from '@/lib/services/wo-materials-service';
import { WOMaterialsListResponse } from '@/lib/types/wo-materials';

export function useWOMaterials(woId: string) {
  return useQuery<WOMaterialsListResponse>({
    queryKey: ['wo-materials', woId],
    queryFn: () => getWOMaterials(woId),
    enabled: !!woId,
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
  });
}

export function useRefreshSnapshot(woId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => refreshSnapshot(woId),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: ['wo-materials', woId],
      });
    },
  });
}
```

**Usage in Components**:

```typescript
export function MaterialsList({ woId }: { woId: string }) {
  const { data, isLoading, error } = useWOMaterials(woId);

  if (isLoading) return <Skeleton className="h-32" />;
  if (error) return <Error message="Failed to load materials" />;
  if (!data?.materials) return <Empty />;

  return (
    <table>
      {data.materials.map(material => (
        <tr key={material.id}>
          <td>{material.material_name}</td>
          <td>{material.required_qty} {material.uom}</td>
        </tr>
      ))}
    </table>
  );
}
```

### useWOOperations

**File**: `apps/frontend/lib/hooks/use-wo-operations.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { getOperationsForWO } from '@/lib/services/wo-operations-service';
import { WOOperation } from '@/lib/types/wo-operation';

export function useWOOperations(woId: string) {
  return useQuery<WOOperation[]>({
    queryKey: ['wo-operations', woId],
    queryFn: async () => {
      const data = await getOperationsForWO(woId);
      return data.operations;
    },
    enabled: !!woId,
    staleTime: 30 * 1000,
  });
}

export function useWOOperationDetail(woId: string, opId: string) {
  return useQuery({
    queryKey: ['wo-operation-detail', woId, opId],
    queryFn: () => getOperationById(woId, opId),
    enabled: !!woId && !!opId,
    staleTime: 30 * 1000,
  });
}
```

## API Routes

### GET /api/planning/work-orders/:id/materials

**File**: `apps/frontend/app/api/planning/work-orders/[id]/materials/route.ts`

Example implementation:

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });

  // Verify WO exists and belongs to user's org (RLS handles isolation)
  const { data: wo, error: woError } = await supabase
    .from('work_orders')
    .select('id, bom_id')
    .eq('id', params.id)
    .single();

  if (woError || !wo) {
    return NextResponse.json(
      { error: 'Work order not found' },
      { status: 404 }
    );
  }

  // Get materials with product details
  const { data: materials, error } = await supabase
    .from('wo_materials')
    .select(`
      *,
      product:products(id, code, name, product_type)
    `)
    .eq('wo_id', params.id)
    .order('sequence', { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    materials: materials || [],
    total: materials?.length || 0,
    bom_version: materials?.[0]?.bom_version || null,
    snapshot_at: materials?.[0]?.created_at || null,
  });
}
```

### POST /api/planning/work-orders/:id/snapshot

**File**: `apps/frontend/app/api/planning/work-orders/[id]/snapshot/route.ts`

Example implementation:

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });

  // Get WO with status
  const { data: wo, error: woError } = await supabase
    .from('work_orders')
    .select('id, status, bom_id, planned_quantity')
    .eq('id', params.id)
    .single();

  if (woError || !wo) {
    return NextResponse.json(
      { error: 'Work order not found' },
      { status: 404 }
    );
  }

  // Check if snapshot can be modified
  if (!['draft', 'planned'].includes(wo.status)) {
    return NextResponse.json(
      { error: 'Cannot modify materials after WO is released' },
      { status: 409 }
    );
  }

  if (!wo.bom_id) {
    return NextResponse.json(
      { error: 'Work order has no BOM selected' },
      { status: 400 }
    );
  }

  // Delete existing materials
  await supabase
    .from('wo_materials')
    .delete()
    .eq('wo_id', params.id);

  // Create new snapshot (call service or inline logic)
  const { data: bom } = await supabase
    .from('boms')
    .select(`
      id, version, output_qty,
      bom_items(
        id, product_id, quantity, uom, sequence,
        scrap_percent, is_by_product, yield_percent,
        product:products(id, name, code)
      )
    `)
    .eq('id', wo.bom_id)
    .single();

  if (!bom) {
    return NextResponse.json(
      { error: 'BOM not found' },
      { status: 400 }
    );
  }

  // Scale quantities
  const materials = bom.bom_items.map(item => ({
    wo_id: params.id,
    product_id: item.product_id,
    material_name: item.product?.name || 'Unknown',
    required_qty: item.is_by_product
      ? 0
      : scaleQuantity(
          item.quantity,
          wo.planned_quantity,
          bom.output_qty,
          item.scrap_percent
        ),
    uom: item.uom,
    sequence: item.sequence,
    scrap_percent: item.scrap_percent,
    is_by_product: item.is_by_product,
    yield_percent: item.yield_percent,
    bom_item_id: item.id,
    bom_version: bom.version,
  }));

  // Bulk insert
  const { data } = await supabase
    .from('wo_materials')
    .insert(materials)
    .select();

  return NextResponse.json({
    success: true,
    materials_count: data?.length || 0,
    message: `Snapshot created with ${data?.length || 0} materials`,
  });
}

function scaleQuantity(
  itemQty: number,
  woQty: number,
  bomOutputQty: number,
  scrapPercent: number = 0
): number {
  const scaleFactor = woQty / bomOutputQty;
  const scrapMultiplier = 1 + (scrapPercent / 100);
  const result = itemQty * scaleFactor * scrapMultiplier;
  // Round to 6 decimal places
  return Math.round(result * 1000000) / 1000000;
}
```

## Testing

### Unit Tests

Test the scaling formula:

```typescript
// wo-materials.test.ts
import { describe, it, expect } from 'vitest';
import { scaleQuantity } from '@/lib/services/wo-materials-service';

describe('scaleQuantity', () => {
  it('scales quantity correctly', () => {
    const result = scaleQuantity(5, 250, 100, 5);
    expect(result).toBe(13.125);
  });

  it('handles zero scrap', () => {
    const result = scaleQuantity(5, 250, 100, 0);
    expect(result).toBe(12.5);
  });

  it('rounds to 6 decimal places', () => {
    const result = scaleQuantity(1, 3, 10, 2.5);
    // (3/10) * 1 * 1.025 = 0.3075
    expect(result).toBe(0.3075);
  });
});
```

### API Tests

Test endpoints with fetch or supertest:

```typescript
// materials.test.ts
import { describe, it, expect } from 'vitest';

describe('GET /api/planning/work-orders/:id/materials', () => {
  it('returns materials for valid WO', async () => {
    const response = await fetch(
      '/api/planning/work-orders/wo-123/materials'
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.materials).toBeDefined();
    expect(data.total).toBeGreaterThan(0);
  });

  it('returns 404 for missing WO', async () => {
    const response = await fetch(
      '/api/planning/work-orders/nonexistent/materials'
    );
    expect(response.status).toBe(404);
  });
});
```

### E2E Tests (Playwright)

```typescript
// materials.spec.ts
import { test, expect } from '@playwright/test';

test('View work order materials', async ({ page, context }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'user@test.com');
  await page.fill('[name="password"]', 'password');
  await page.click('[type="submit"]');

  // Navigate to WO
  await page.goto('/planning/work-orders/wo-123');
  await page.click('text=Materials');

  // Verify materials table
  const table = page.locator('table');
  await expect(table).toBeVisible();

  const rows = await page.locator('tbody tr').count();
  expect(rows).toBeGreaterThan(0);
});
```

## Common Patterns

### Error Handling

Always handle errors from API calls:

```typescript
export async function fetchMaterials(woId: string) {
  try {
    const data = await getWOMaterials(woId);
    return data.materials;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Failed to fetch:', error.message);
      // Show toast to user
      toast.error('Failed to load materials');
    }
    return [];
  }
}
```

### Loading States

Use skeleton screens during loading:

```typescript
function MaterialsView({ woId }: { woId: string }) {
  const { data, isLoading } = useWOMaterials(woId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return <MaterialsTable materials={data?.materials} />;
}
```

### Validation

Use Zod schemas for client-side validation:

```typescript
import { z } from 'zod';

const woMaterialSchema = z.object({
  required_qty: z.number()
    .nonnegative('Must be >= 0')
    .refine(val => {
      const decimals = (val.toString().split('.')[1] || '').length;
      return decimals <= 6;
    }, 'Max 6 decimal places'),
  scrap_percent: z.number()
    .min(0, 'Min 0%')
    .max(100, 'Max 100%'),
});

// Validate before sending to API
const validated = woMaterialSchema.parse(material);
```

## Debugging

### Enable Debug Logging

In browser DevTools console:

```typescript
// Log all Supabase queries
localStorage.setItem('supabase.debug', 'true');
```

### Check RLS Policies

If getting "new row violates row-level security policy":

1. Verify user has correct org_id
2. Check policy definition: `SELECT policy FROM pg_policies`
3. Test with admin to bypass RLS

### Test Locally

```bash
# Start dev server
npm run dev

# Run specific test
npm run test wo-materials

# Run E2E tests
npm run test:e2e
```

## Performance Optimization

### Caching Strategy

Materials and operations use React Query with 30-second stale time:

```typescript
const { data } = useWOMaterials(woId);
// Cached for 30 seconds, refetches if stale
```

### Pagination (Future)

Currently fetches all materials at once. For 1000+ materials, implement:

```typescript
const { data: page1 } = await supabase
  .from('wo_materials')
  .select('*')
  .eq('wo_id', woId)
  .range(0, 99); // Pagination
```

### Index Verification

Ensure indexes exist:

```sql
-- In Supabase SQL editor
SELECT * FROM pg_stat_user_indexes
WHERE tablename IN ('wo_materials', 'wo_operations');
```

Should show:
- idx_wo_materials_wo
- idx_wo_materials_org
- idx_wo_ops_wo_id
- idx_wo_ops_status

## Related Documentation

- **Technical Architecture**: [WO Materials & Operations Technical](../technical/wo-materials-operations.md)
- **API Reference**: [Planning API Reference](../api/planning-wo-materials-operations.md)
- **User Guide**: [Work Order Materials & Operations User Guide](../../4-USER-GUIDE/planning/work-order-materials-operations.md)
- **Database Schema**: `.claude/TABLES.md`
- **ADR-002**: BOM Snapshot Pattern
- **ADR-013**: RLS Org Isolation Pattern
