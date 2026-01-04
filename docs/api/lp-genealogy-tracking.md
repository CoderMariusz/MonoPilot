# LP Genealogy Tracking API Reference

**Story**: 05.2 - LP Genealogy Tracking
**Epic**: 05 - Warehouse Module
**Status**: Implemented & QA Passed

## Overview

The LP Genealogy Tracking system provides complete traceability of License Plates (LPs) through the production lifecycle. Track parent-child relationships from raw materials through production to finished goods.

**Critical for**: Epic 04 Production - Material Traceability

## Quick Start

```typescript
import { createClient } from '@/lib/supabase/client'
import { LPGenealogyService } from '@/lib/services/lp-genealogy-service'

const supabase = createClient()

// Link consumed LP to output LP in production
await LPGenealogyService.linkConsumption(supabase, {
  parentLpId: 'lp-flour-001',
  childLpId: 'lp-bread-batch-123',
  woId: 'wo-789',
  quantity: 50.0,
  operationId: 'op-456'
})

// Get complete genealogy tree
const tree = await LPGenealogyService.getFullTree(
  supabase,
  'lp-bread-batch-123',
  'both',
  5
)
```

## API Endpoints

### GET /api/warehouse/license-plates/:id/genealogy

Fetch genealogy tree for LP detail view.

**Query Parameters:**
- `direction` (string, optional): `forward` | `backward` | `both` (default: `both`)
- `maxDepth` (number, optional): Maximum tree depth 1-10 (default: `3`)
- `includeReversed` (boolean, optional): Include reversed links (default: `false`)

**Response:**
```typescript
{
  lpId: string
  lpNumber: string
  hasGenealogy: boolean
  ancestors: GenealogyNode[]
  descendants: GenealogyNode[]
  summary: {
    originalQuantity: number
    splitOutTotal: number
    currentQuantity: number
    childCount: number
    parentCount: number
    depth: { forward: number, backward: number }
    totalOperations: number
    operationBreakdown: {
      split: number
      consume: number
      output: number
      merge: number
    }
  }
  hasMoreLevels: {
    ancestors: boolean
    descendants: boolean
  }
}
```

**Example:**
```bash
curl -X GET \
  "https://api.monopilot.app/api/warehouse/license-plates/lp-123/genealogy?direction=both&maxDepth=5" \
  -H "Authorization: Bearer {token}"
```

## Service Methods

### LPGenealogyService.linkConsumption()

Link a consumed LP to an output LP in production context.

**Called by**: Epic 04 Consumption (04.6a-e)

```typescript
async function linkConsumption(
  supabase: SupabaseClient,
  input: LinkConsumptionInput
): Promise<GenealogyLink>

interface LinkConsumptionInput {
  parentLpId: string      // Consumed material LP
  childLpId: string       // Output product LP
  woId: string            // Work Order reference
  quantity: number        // Quantity consumed
  operationId?: string    // Optional WO operation reference
}
```

**Example:**
```typescript
const link = await LPGenealogyService.linkConsumption(supabase, {
  parentLpId: 'lp-flour-001',
  childLpId: 'lp-bread-batch-123',
  woId: 'wo-789',
  quantity: 50.0,
  operationId: 'op-456'
})
```

**Validation:**
- Parent and child LPs must exist
- Parent and child must be in same organization
- Self-referencing not allowed (parent ≠ child)
- Duplicate links rejected
- Quantity must be positive

**Throws:**
- `"Parent LP not found"` - Invalid parent LP ID
- `"Child LP not found"` - Invalid child LP ID
- `"LPs belong to different organizations"` - Org mismatch
- `"Cannot create self-referencing genealogy link"` - Self-reference
- `"Genealogy link already exists between these LPs"` - Duplicate

---

### LPGenealogyService.linkOutput()

Link multiple consumed LPs to a single output LP.

**Called by**: Epic 04 Output Registration (04.7a-d)

```typescript
async function linkOutput(
  supabase: SupabaseClient,
  input: LinkOutputInput
): Promise<GenealogyLink[]>

interface LinkOutputInput {
  consumedLpIds: string[]  // Array of consumed material LPs
  outputLpId: string       // Single output LP
  woId: string             // Work Order reference
}
```

**Example:**
```typescript
const links = await LPGenealogyService.linkOutput(supabase, {
  consumedLpIds: ['lp-flour-001', 'lp-yeast-002', 'lp-salt-003'],
  outputLpId: 'lp-bread-batch-123',
  woId: 'wo-789'
})
// Returns array of 3 GenealogyLink records
```

**Validation:**
- At least one consumed LP required
- Output LP must exist
- All links created in single transaction

**Throws:**
- `"At least one consumed LP required"` - Empty consumedLpIds array
- `"Output LP not found"` - Invalid output LP ID

---

### LPGenealogyService.linkSplit()

Link a split operation (source LP → new LP).

**Called by**: Story 05.6 Split/Merge

```typescript
async function linkSplit(
  supabase: SupabaseClient,
  input: LinkSplitInput
): Promise<GenealogyLink>

interface LinkSplitInput {
  sourceLpId: string  // Original LP being split
  newLpId: string     // New LP created from split
  quantity: number    // Quantity moved to new LP
}
```

**Example:**
```typescript
const link = await LPGenealogyService.linkSplit(supabase, {
  sourceLpId: 'lp-pallet-001',
  newLpId: 'lp-pallet-002',
  quantity: 500.0
})
```

**Validation:**
- Quantity must be positive
- Self-referencing not allowed
- Source LP must exist (in production)

---

### LPGenealogyService.linkMerge()

Link a merge operation (multiple source LPs → target LP).

**Called by**: Story 05.6 Split/Merge

```typescript
async function linkMerge(
  supabase: SupabaseClient,
  input: LinkMergeInput
): Promise<GenealogyLink[]>

interface LinkMergeInput {
  sourceLpIds: string[]  // LPs being merged
  targetLpId: string     // Target LP receiving merge
}
```

**Example:**
```typescript
const links = await LPGenealogyService.linkMerge(supabase, {
  sourceLpIds: ['lp-partial-001', 'lp-partial-002'],
  targetLpId: 'lp-full-003'
})
```

**Validation:**
- At least one source LP required
- Target LP cannot be in source list
- All source LPs must exist

---

### LPGenealogyService.reverseLink()

Mark a genealogy link as reversed (for corrections).

```typescript
async function reverseLink(
  supabase: SupabaseClient,
  genealogyId: string
): Promise<GenealogyLink>
```

**Example:**
```typescript
const reversed = await LPGenealogyService.reverseLink(supabase, 'gen-123')
```

**Fields Updated:**
- `is_reversed`: Set to `true`
- `reversed_at`: Current timestamp
- `reversed_by`: Current user ID

**Note**: Reversed links are excluded from traces by default (unless `includeReversed=true`).

---

### LPGenealogyService.getForwardTrace()

Get all descendants of an LP (where did this LP go?).

```typescript
async function getForwardTrace(
  supabase: SupabaseClient,
  lpId: string,
  maxDepth?: number,          // Default: 10
  includeReversed?: boolean   // Default: false
): Promise<GenealogyTraceResult>

interface GenealogyTraceResult {
  lpId: string
  nodes: GenealogyNode[]
  hasMoreLevels: boolean
  totalCount: number
}
```

**Example:**
```typescript
const trace = await LPGenealogyService.getForwardTrace(
  supabase,
  'lp-flour-001',
  5,
  false
)
console.log(`Found ${trace.totalCount} descendant LPs`)
trace.nodes.forEach(node => {
  console.log(`Depth ${node.depth}: ${node.lp_number} (${node.product_name})`)
})
```

**Performance:**
- Uses recursive CTE in PostgreSQL
- Maximum depth enforced: 10 levels
- Includes cycle detection
- Sorted by depth ascending

---

### LPGenealogyService.getBackwardTrace()

Get all ancestors of an LP (where did this LP come from?).

```typescript
async function getBackwardTrace(
  supabase: SupabaseClient,
  lpId: string,
  maxDepth?: number,
  includeReversed?: boolean
): Promise<GenealogyTraceResult>
```

**Example:**
```typescript
const trace = await LPGenealogyService.getBackwardTrace(
  supabase,
  'lp-bread-batch-123',
  10,
  false
)
// Returns all raw materials used to create this LP
```

---

### LPGenealogyService.getFullTree()

Get complete genealogy tree (both ancestors and descendants).

```typescript
async function getFullTree(
  supabase: SupabaseClient,
  lpId: string,
  direction?: 'forward' | 'backward' | 'both',  // Default: 'both'
  maxDepth?: number                              // Default: 5
): Promise<{
  ancestors: GenealogyNode[]
  descendants: GenealogyNode[]
  hasMoreLevels: { ancestors: boolean, descendants: boolean }
}>
```

**Example:**
```typescript
const tree = await LPGenealogyService.getFullTree(
  supabase,
  'lp-intermediate-product',
  'both',
  5
)
console.log(`Ancestors: ${tree.ancestors.length}`)
console.log(`Descendants: ${tree.descendants.length}`)
```

**Use Cases:**
- LP detail view (default depth: 3)
- Traceability investigation (depth: 10)
- Recall tracking (full tree)

---

### LPGenealogyService.getGenealogyByWO()

Get all genealogy records for a Work Order.

```typescript
async function getGenealogyByWO(
  supabase: SupabaseClient,
  woId: string
): Promise<{
  consume: GenealogyLink[]
  output: GenealogyLink[]
}>
```

**Example:**
```typescript
const woGenealogy = await LPGenealogyService.getGenealogyByWO(
  supabase,
  'wo-789'
)
console.log(`Consumed LPs: ${woGenealogy.consume.length}`)
console.log(`Output LPs: ${woGenealogy.output.length}`)
```

**Returns:**
- `consume`: Parent→Child links (materials consumed)
- `output`: Parent→Child links (products output)
- Includes parent and child LP details
- Excludes reversed links

---

### LPGenealogyService.hasGenealogyLink()

Check if genealogy link exists between two LPs.

```typescript
async function hasGenealogyLink(
  supabase: SupabaseClient,
  parentLpId: string,
  childLpId: string,
  operationType: OperationType
): Promise<boolean>

type OperationType = 'consume' | 'output' | 'split' | 'merge'
```

**Example:**
```typescript
const exists = await LPGenealogyService.hasGenealogyLink(
  supabase,
  'lp-flour-001',
  'lp-bread-batch-123',
  'consume'
)
if (exists) {
  console.log('Link already exists')
}
```

---

### LPGenealogyService.getGenealogyCount()

Get count of genealogy links for an LP.

```typescript
async function getGenealogyCount(
  supabase: SupabaseClient,
  lpId: string
): Promise<number>
```

**Example:**
```typescript
const count = await LPGenealogyService.getGenealogyCount(
  supabase,
  'lp-flour-001'
)
console.log(`${count} genealogy links found`)
```

**Returns:**
- Count of all links where LP is parent OR child
- Excludes reversed links

---

## React Hooks

### useLPGenealogy()

Fetch genealogy tree for LP detail page.

```typescript
import { useLPGenealogy } from '@/lib/hooks/use-genealogy'

function LPDetailPage({ lpId }: { lpId: string }) {
  const { data, isLoading, error } = useLPGenealogy(lpId, {
    direction: 'both',
    maxDepth: 3,
    includeReversed: false
  })

  if (isLoading) return <div>Loading genealogy...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!data?.hasGenealogy) return <div>No genealogy found</div>

  return (
    <div>
      <h3>Ancestors: {data.ancestors.length}</h3>
      <h3>Descendants: {data.descendants.length}</h3>
      <h3>Total Operations: {data.summary.totalOperations}</h3>
    </div>
  )
}
```

**Query Key**: `['genealogy', 'lp', lpId, params]`
**Stale Time**: 60 seconds
**Refetch**: On window focus

---

### useForwardTrace()

Fetch forward trace (descendants only).

```typescript
import { useForwardTrace } from '@/lib/hooks/use-genealogy'

function ForwardTracePage({ lpId }: { lpId: string }) {
  const { data, isLoading } = useForwardTrace(lpId, 10, false)

  return (
    <div>
      {data?.nodes.map(node => (
        <div key={node.lp_id}>
          Depth {node.depth}: {node.lp_number}
        </div>
      ))}
    </div>
  )
}
```

---

### useBackwardTrace()

Fetch backward trace (ancestors only).

```typescript
import { useBackwardTrace } from '@/lib/hooks/use-genealogy'

function BackwardTracePage({ lpId }: { lpId: string }) {
  const { data, isLoading } = useBackwardTrace(lpId, 10, false)

  return (
    <div>
      <h3>Raw Materials Used:</h3>
      {data?.nodes.map(node => (
        <div key={node.lp_id}>
          {node.product_name} ({node.quantity} kg)
        </div>
      ))}
    </div>
  )
}
```

---

### useFullGenealogyTree()

Fetch complete genealogy tree (both directions).

```typescript
import { useFullGenealogyTree } from '@/lib/hooks/use-genealogy'

function GenealogyTreePage({ lpId }: { lpId: string }) {
  const { data, isLoading } = useFullGenealogyTree(lpId, {
    direction: 'both',
    maxDepth: 5
  })

  return (
    <div>
      <section>
        <h2>Ancestors ({data?.ancestors.length})</h2>
        {/* Render ancestor tree */}
      </section>
      <section>
        <h2>Descendants ({data?.descendants.length})</h2>
        {/* Render descendant tree */}
      </section>
    </div>
  )
}
```

---

## Validation Schemas

All inputs validated using Zod schemas.

### linkConsumptionSchema

```typescript
import { linkConsumptionSchema } from '@/lib/validation/lp-genealogy-schemas'

const input = linkConsumptionSchema.parse({
  parentLpId: 'lp-flour-001',
  childLpId: 'lp-bread-batch-123',
  woId: 'wo-789',
  quantity: 50.0,
  operationId: 'op-456'  // Optional
})
```

**Validation Rules:**
- `parentLpId`: Must be valid UUID
- `childLpId`: Must be valid UUID, cannot equal parentLpId
- `woId`: Must be valid UUID
- `quantity`: Must be positive number
- `operationId`: Optional UUID

---

### linkOutputSchema

```typescript
import { linkOutputSchema } from '@/lib/validation/lp-genealogy-schemas'

const input = linkOutputSchema.parse({
  consumedLpIds: ['lp-flour-001', 'lp-yeast-002'],
  outputLpId: 'lp-bread-batch-123',
  woId: 'wo-789'
})
```

**Validation Rules:**
- `consumedLpIds`: Array of valid UUIDs, minimum 1 item
- `outputLpId`: Must be valid UUID
- `woId`: Must be valid UUID

---

### linkSplitSchema

```typescript
import { linkSplitSchema } from '@/lib/validation/lp-genealogy-schemas'

const input = linkSplitSchema.parse({
  sourceLpId: 'lp-pallet-001',
  newLpId: 'lp-pallet-002',
  quantity: 500.0
})
```

**Validation Rules:**
- `sourceLpId`: Must be valid UUID
- `newLpId`: Must be valid UUID, cannot equal sourceLpId
- `quantity`: Must be positive number

---

### linkMergeSchema

```typescript
import { linkMergeSchema } from '@/lib/validation/lp-genealogy-schemas'

const input = linkMergeSchema.parse({
  sourceLpIds: ['lp-partial-001', 'lp-partial-002'],
  targetLpId: 'lp-full-003'
})
```

**Validation Rules:**
- `sourceLpIds`: Array of valid UUIDs, minimum 1 item
- `targetLpId`: Must be valid UUID, cannot be in sourceLpIds array

---

### traceQuerySchema

```typescript
import { traceQuerySchema } from '@/lib/validation/lp-genealogy-schemas'

const params = traceQuerySchema.parse({
  maxDepth: '5',          // Coerced to number
  includeReversed: 'true'  // Coerced to boolean
})
```

**Validation Rules:**
- `maxDepth`: Integer between 1 and 10 (default: 10)
- `includeReversed`: Boolean (default: false)

---

## Error Handling

All service methods throw descriptive errors:

```typescript
try {
  await LPGenealogyService.linkConsumption(supabase, input)
} catch (error) {
  if (error.message.includes('not found')) {
    // Handle missing LP
  } else if (error.message.includes('self-referencing')) {
    // Handle self-reference
  } else if (error.message.includes('already exists')) {
    // Handle duplicate
  } else {
    // Handle other errors
  }
}
```

**Common Errors:**
- `"Parent LP not found"` - Invalid parent LP ID
- `"Child LP not found"` - Invalid child LP ID
- `"LPs belong to different organizations"` - Org mismatch
- `"Cannot create self-referencing genealogy link"` - Self-reference
- `"Genealogy link already exists"` - Duplicate link
- `"At least one consumed LP required"` - Empty array
- `"Quantity must be positive"` - Invalid quantity
- `"Target LP cannot be in source list"` - Invalid merge
- `"Genealogy link not found"` - Invalid ID for reversal

---

## Performance Considerations

### Recursive CTE Queries

Forward and backward traces use PostgreSQL recursive CTEs:

```sql
-- Forward trace (descendants)
WITH RECURSIVE forward_trace AS (
  SELECT child_lp_id, operation_type, quantity, 1 AS depth
  FROM lp_genealogy
  WHERE parent_lp_id = :lp_id

  UNION ALL

  SELECT g.child_lp_id, g.operation_type, g.quantity, ft.depth + 1
  FROM lp_genealogy g
  JOIN forward_trace ft ON g.parent_lp_id = ft.child_lp_id
  WHERE ft.depth < :max_depth
    AND NOT (g.child_lp_id = ANY(ft.path))  -- Cycle detection
)
SELECT * FROM forward_trace
```

**Optimizations:**
- Maximum depth enforced: 10 levels
- Cycle detection prevents infinite loops
- Indexes on `parent_lp_id`, `child_lp_id`, `org_id`
- `is_reversed` filter index

### Index Coverage

```sql
CREATE INDEX idx_genealogy_org ON lp_genealogy(org_id);
CREATE INDEX idx_genealogy_operation_type ON lp_genealogy(org_id, operation_type);
CREATE INDEX idx_genealogy_date ON lp_genealogy(operation_date);
CREATE INDEX idx_genealogy_wo ON lp_genealogy(wo_id) WHERE wo_id IS NOT NULL;
CREATE INDEX idx_genealogy_reversed ON lp_genealogy(is_reversed) WHERE is_reversed = false;
```

**Query Performance:**
- Forward trace: O(n * depth) where n = children per level
- Backward trace: O(n * depth) where n = parents per level
- Typical depth: 3-5 levels
- Typical execution: <50ms for depth 5

### Caching Recommendations

```typescript
// React Query cache configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,      // 1 minute
      cacheTime: 300000,     // 5 minutes
      refetchOnWindowFocus: true,
    }
  }
})
```

**Cache Invalidation:**
- Invalidate on LP status change
- Invalidate on new genealogy link creation
- Invalidate on link reversal

---

## Security & RLS

All queries enforce organization isolation via Row Level Security (RLS).

### RLS Policies

```sql
-- Read policy
CREATE POLICY "Genealogy org isolation read" ON lp_genealogy
  FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Write policy (technical, admin, qc_manager, warehouse, production roles)
CREATE POLICY "Genealogy org isolation write" ON lp_genealogy
  FOR INSERT
  WITH CHECK (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('technical', 'admin', 'qc_manager', 'warehouse', 'production')
  );

-- Update policy (for reversals)
CREATE POLICY "Genealogy org isolation update" ON lp_genealogy
  FOR UPDATE
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('technical', 'admin', 'qc_manager', 'warehouse', 'production')
  );
```

### SECURITY DEFINER Functions

Recursive trace functions use `SECURITY DEFINER` with internal org_id validation:

```sql
CREATE OR REPLACE FUNCTION get_lp_forward_trace(
  p_lp_id UUID,
  p_org_id UUID,
  p_max_depth INT DEFAULT 10,
  p_include_reversed BOOLEAN DEFAULT false
)
RETURNS TABLE (...)
AS $$
DECLARE
  v_caller_org_id UUID;
BEGIN
  -- SECURITY: Validate org_id matches caller's organization
  v_caller_org_id := (auth.jwt() ->> 'org_id')::uuid;

  IF p_org_id != v_caller_org_id THEN
    RAISE EXCEPTION 'Access denied: org_id mismatch';
  END IF;

  -- Execute recursive CTE query...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Security Guarantees:**
- Users can only query genealogy within their organization
- `SECURITY DEFINER` functions validate org_id before execution
- RLS policies prevent cross-organization data access
- Write operations restricted to authorized roles

---

## Testing

### Unit Tests

Test file: `apps/frontend/lib/services/__tests__/lp-genealogy-service.test.ts`

```typescript
import { LPGenealogyService } from '@/lib/services/lp-genealogy-service'
import { createMockSupabaseClient } from '@/lib/test-utils/mock-supabase'

describe('LPGenealogyService.linkConsumption', () => {
  it('creates genealogy link successfully', async () => {
    const supabase = createMockSupabaseClient()

    const result = await LPGenealogyService.linkConsumption(supabase, {
      parentLpId: 'lp-001',
      childLpId: 'lp-002',
      woId: 'wo-789',
      quantity: 50.0
    })

    expect(result.parent_lp_id).toBe('lp-001')
    expect(result.child_lp_id).toBe('lp-002')
    expect(result.operation_type).toBe('consume')
  })

  it('rejects self-referencing link', async () => {
    const supabase = createMockSupabaseClient()

    await expect(
      LPGenealogyService.linkConsumption(supabase, {
        parentLpId: 'lp-001',
        childLpId: 'lp-001',  // Same as parent
        woId: 'wo-789',
        quantity: 50.0
      })
    ).rejects.toThrow('Cannot create self-referencing genealogy link')
  })
})
```

**Test Coverage**: 138/138 tests passing

### API Tests

Test file: `apps/frontend/__tests__/api/warehouse/lp-genealogy.test.ts`

```typescript
describe('GET /api/warehouse/license-plates/:id/genealogy', () => {
  it('returns genealogy tree successfully', async () => {
    const response = await fetch('/api/warehouse/license-plates/lp-123/genealogy')
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.lpId).toBe('lp-123')
    expect(data.hasGenealogy).toBeDefined()
    expect(data.ancestors).toBeArray()
    expect(data.descendants).toBeArray()
  })

  it('validates maxDepth parameter', async () => {
    const response = await fetch('/api/warehouse/license-plates/lp-123/genealogy?maxDepth=20')

    expect(response.status).toBe(400)
  })
})
```

---

## Migration History

### Migration 089: Enhance LP Genealogy

**File**: `supabase/migrations/089_enhance_lp_genealogy_for_story_05_2.sql`

**Changes:**
- Added `org_id` column with FK to organizations
- Added `operation_type` enum: consume, output, split, merge
- Added `is_reversed`, `reversed_at`, `reversed_by` for reversal tracking
- Added `wo_id` and `operation_id` for production context
- Created indexes on `org_id`, `operation_type`, `operation_date`, `wo_id`, `is_reversed`
- Created RLS policies for org isolation
- Created `get_lp_forward_trace()` RPC function
- Created `get_lp_backward_trace()` RPC function

### Migration 090: Security Fix

**File**: `supabase/migrations/090_fix_lp_genealogy_security.sql`

**Changes:**
- Enabled Row Level Security on `lp_genealogy` table
- Added org_id validation to SECURITY DEFINER functions
- Prevents cross-organization data access in recursive CTEs

---

## Related Documentation

- **Database Schema**: [docs/database/lp-genealogy-schema.md](../database/lp-genealogy-schema.md)
- **Service Guide**: [docs/guides/warehouse/lp-genealogy-service.md](../guides/warehouse/lp-genealogy-service.md)
- **Component Integration**: [docs/guides/warehouse/lp-genealogy-components.md](../guides/warehouse/lp-genealogy-components.md)
- **Story Completion**: [docs/2-MANAGEMENT/epics/current/05-warehouse/05.2-STORY-COMPLETION-REPORT.md](../../2-MANAGEMENT/epics/current/05-warehouse/05.2-STORY-COMPLETION-REPORT.md)

---

## Support

**Questions?** Check the story completion report or contact the warehouse module maintainer.

**Found a bug?** File an issue with story reference 05.2.
