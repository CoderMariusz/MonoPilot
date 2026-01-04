# LP Genealogy Service - Developer Guide

**Story**: 05.2 - LP Genealogy Tracking
**Epic**: 05 - Warehouse Module
**Service**: `LPGenealogyService`

## Overview

The LP Genealogy Service tracks parent-child relationships between License Plates (LPs) throughout the production lifecycle. Use this service to create genealogy links, query trace trees, and maintain full material traceability.

**Critical for**: Epic 04 Production - Material Traceability

## Service Architecture

```
┌─────────────────────────────────────────┐
│     LPGenealogyService (Static)         │
├─────────────────────────────────────────┤
│ Link Operations:                        │
│  - linkConsumption()                    │
│  - linkOutput()                         │
│  - linkSplit()                          │
│  - linkMerge()                          │
│  - reverseLink()                        │
├─────────────────────────────────────────┤
│ Query Operations:                       │
│  - getForwardTrace()                    │
│  - getBackwardTrace()                   │
│  - getFullTree()                        │
│  - getGenealogyByWO()                   │
├─────────────────────────────────────────┤
│ Utility Methods:                        │
│  - hasGenealogyLink()                   │
│  - getGenealogyCount()                  │
└─────────────────────────────────────────┘
           ↓ uses
┌─────────────────────────────────────────┐
│     Supabase Client (injected)          │
│  - PostgreSQL queries                   │
│  - RLS enforcement                      │
│  - RPC function calls                   │
└─────────────────────────────────────────┘
```

**Design Pattern**: Service accepts Supabase client as parameter (dependency injection)

**Security**: All queries enforce org_id isolation via RLS

## Quick Start

### Basic Import

```typescript
import { createClient } from '@/lib/supabase/client'
import { LPGenealogyService } from '@/lib/services/lp-genealogy-service'

const supabase = createClient()
```

### Create Genealogy Link

```typescript
// In production consumption (Epic 04.6a-e)
const link = await LPGenealogyService.linkConsumption(supabase, {
  parentLpId: 'lp-flour-001',      // Raw material consumed
  childLpId: 'lp-bread-batch-123',  // Finished product output
  woId: 'wo-789',
  quantity: 50.0,
  operationId: 'op-456'             // Optional
})
```

### Query Genealogy Tree

```typescript
// Get complete genealogy (both directions)
const tree = await LPGenealogyService.getFullTree(
  supabase,
  'lp-bread-batch-123',
  'both',
  5  // Max depth
)

console.log(`Ancestors: ${tree.ancestors.length}`)
console.log(`Descendants: ${tree.descendants.length}`)
```

## Common Use Cases

### Use Case 1: Production Consumption (Epic 04.6)

**Scenario**: User scans flour LP to consume for bread production.

```typescript
async function consumeMaterial(
  supabase: SupabaseClient,
  consumedLpId: string,
  outputLpId: string,
  woId: string,
  quantity: number
) {
  try {
    // Create genealogy link
    const link = await LPGenealogyService.linkConsumption(supabase, {
      parentLpId: consumedLpId,
      childLpId: outputLpId,
      woId,
      quantity,
    })

    console.log('Genealogy link created:', link.id)
    return link
  } catch (error) {
    if (error.message.includes('already exists')) {
      throw new Error('Material already consumed for this output')
    }
    throw error
  }
}
```

**Integration Points:**
- Called from `WOConsumptionService.consumeMaterial()`
- Triggered after LP status changes to 'consumed'
- Links material LP to work-in-progress LP

---

### Use Case 2: Output Registration (Epic 04.7)

**Scenario**: User registers finished bread batch, link to all consumed materials.

```typescript
async function registerOutput(
  supabase: SupabaseClient,
  consumedLpIds: string[],
  outputLpId: string,
  woId: string
) {
  // Create batch of genealogy links
  const links = await LPGenealogyService.linkOutput(supabase, {
    consumedLpIds,  // ['lp-flour-001', 'lp-yeast-002', 'lp-salt-003']
    outputLpId,     // 'lp-bread-batch-123'
    woId
  })

  console.log(`Created ${links.length} genealogy links`)
  return links
}
```

**Integration Points:**
- Called from `WOOutputService.registerOutput()`
- Links all consumed materials to output LP
- Enables full backward trace from finished product

---

### Use Case 3: LP Split (Story 05.6)

**Scenario**: Warehouse splits pallet into smaller units.

```typescript
async function splitLicensePlate(
  supabase: SupabaseClient,
  sourceLpId: string,
  newLpId: string,
  splitQuantity: number
) {
  // Create split genealogy link
  const link = await LPGenealogyService.linkSplit(supabase, {
    sourceLpId,
    newLpId,
    quantity: splitQuantity
  })

  console.log(`Split created: ${link.id}`)
  return link
}
```

**Integration Points:**
- Called from `LicensePlateService.splitLP()`
- Tracks split history for inventory accuracy
- Enables forward trace to find all split units

---

### Use Case 4: Forward Trace (Recall Investigation)

**Scenario**: Quality issue found in raw material, find all affected products.

```typescript
async function investigateRecall(
  supabase: SupabaseClient,
  affectedLpId: string
) {
  // Get all descendants (where did this LP go?)
  const trace = await LPGenealogyService.getForwardTrace(
    supabase,
    affectedLpId,
    10,    // Deep search
    false  // Exclude reversed links
  )

  console.log(`Found ${trace.totalCount} affected LPs`)

  // Group by product
  const byProduct = trace.nodes.reduce((acc, node) => {
    acc[node.product_name] = (acc[node.product_name] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log('Affected products:', byProduct)

  return trace.nodes
}
```

**Integration Points:**
- Called from QC module (Epic 06)
- Triggered by hold/recall events
- Provides list of LPs to quarantine

---

### Use Case 5: Backward Trace (Source Investigation)

**Scenario**: Customer complaint on finished product, find source materials.

```typescript
async function investigateSource(
  supabase: SupabaseClient,
  productLpId: string
) {
  // Get all ancestors (where did this come from?)
  const trace = await LPGenealogyService.getBackwardTrace(
    supabase,
    productLpId,
    10,
    false
  )

  console.log(`Found ${trace.totalCount} source materials`)

  // Group by depth (level in BOM)
  const byDepth = trace.nodes.reduce((acc, node) => {
    acc[node.depth] = acc[node.depth] || []
    acc[node.depth].push({
      lp: node.lp_number,
      product: node.product_name,
      quantity: node.quantity
    })
    return acc
  }, {} as Record<number, any[]>)

  console.log('Source materials by BOM level:', byDepth)

  return trace.nodes
}
```

**Integration Points:**
- Called from QC investigations
- Triggered by customer complaints
- Provides complete source material list

---

### Use Case 6: Work Order Genealogy Report

**Scenario**: Generate traceability report for completed Work Order.

```typescript
async function generateWOTraceabilityReport(
  supabase: SupabaseClient,
  woId: string
) {
  // Get all genealogy for WO
  const genealogy = await LPGenealogyService.getGenealogyByWO(
    supabase,
    woId
  )

  const report = {
    workOrderId: woId,
    consumedMaterials: genealogy.consume.map(link => ({
      lpNumber: link.parent_lp?.lp_number,
      product: link.parent_lp?.product?.name,
      quantity: link.quantity,
      date: link.operation_date
    })),
    outputProducts: genealogy.output.map(link => ({
      lpNumber: link.child_lp?.lp_number,
      product: link.child_lp?.product?.name,
      date: link.operation_date
    })),
    summary: {
      totalInputs: genealogy.consume.length,
      totalOutputs: genealogy.output.length
    }
  }

  return report
}
```

**Integration Points:**
- Called from WO completion workflow
- Exported to PDF/Excel for compliance
- Stored in document management system

---

## Error Handling Patterns

### Pattern 1: Validation Errors

```typescript
try {
  await LPGenealogyService.linkConsumption(supabase, input)
} catch (error) {
  if (error.message.includes('not found')) {
    // Handle missing LP
    toast.error('License Plate not found')
  } else if (error.message.includes('self-referencing')) {
    // Handle self-reference
    toast.error('Cannot link LP to itself')
  } else if (error.message.includes('different organizations')) {
    // Handle org mismatch
    toast.error('License Plates from different organizations')
  } else {
    // Generic error
    toast.error('Failed to create genealogy link')
  }
}
```

### Pattern 2: Duplicate Link Detection

```typescript
try {
  await LPGenealogyService.linkConsumption(supabase, input)
} catch (error) {
  if (error.message.includes('already exists')) {
    // Check if link exists
    const exists = await LPGenealogyService.hasGenealogyLink(
      supabase,
      input.parentLpId,
      input.childLpId,
      'consume'
    )

    if (exists) {
      // Offer to reverse and recreate
      const confirm = await confirmDialog(
        'Link already exists. Reverse and recreate?'
      )

      if (confirm) {
        // Find and reverse existing link
        // ... reversal logic
      }
    }
  }
}
```

### Pattern 3: Transaction Safety

```typescript
async function createConsumptionWithGenealogy(
  supabase: SupabaseClient,
  consumption: ConsumptionData
) {
  // Begin transaction (via Supabase RPC or multiple operations)
  try {
    // 1. Create consumption record
    const consumptionRecord = await supabase
      .from('wo_consumption')
      .insert(consumption)
      .select()
      .single()

    // 2. Create genealogy link
    const genealogyLink = await LPGenealogyService.linkConsumption(supabase, {
      parentLpId: consumption.lp_id,
      childLpId: consumption.output_lp_id,
      woId: consumption.wo_id,
      quantity: consumption.quantity_consumed
    })

    // 3. Update LP status
    await supabase
      .from('license_plates')
      .update({ status: 'consumed' })
      .eq('id', consumption.lp_id)

    return { consumptionRecord, genealogyLink }
  } catch (error) {
    // Rollback handled by Supabase if using RPC
    // Or handle compensating transactions
    throw error
  }
}
```

---

## Testing Guidelines

### Unit Test Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createMockSupabaseClient } from '@/lib/test-utils/mock-supabase'
import { LPGenealogyService } from '@/lib/services/lp-genealogy-service'

describe('LPGenealogyService', () => {
  let supabase: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    supabase = createMockSupabaseClient()
  })

  describe('linkConsumption', () => {
    it('creates genealogy link successfully', async () => {
      const input = {
        parentLpId: 'lp-001',
        childLpId: 'lp-002',
        woId: 'wo-789',
        quantity: 50.0
      }

      const result = await LPGenealogyService.linkConsumption(supabase, input)

      expect(result.parent_lp_id).toBe('lp-001')
      expect(result.child_lp_id).toBe('lp-002')
      expect(result.operation_type).toBe('consume')
      expect(result.quantity).toBe(50.0)
    })

    it('rejects self-referencing link', async () => {
      const input = {
        parentLpId: 'lp-001',
        childLpId: 'lp-001',
        woId: 'wo-789',
        quantity: 50.0
      }

      await expect(
        LPGenealogyService.linkConsumption(supabase, input)
      ).rejects.toThrow('Cannot create self-referencing genealogy link')
    })

    it('rejects duplicate link', async () => {
      const input = {
        parentLpId: 'lp-001',
        childLpId: 'lp-002',
        woId: 'wo-789',
        quantity: 50.0
      }

      // Create first link
      await LPGenealogyService.linkConsumption(supabase, input)

      // Attempt duplicate
      await expect(
        LPGenealogyService.linkConsumption(supabase, input)
      ).rejects.toThrow('Genealogy link already exists')
    })
  })

  describe('getForwardTrace', () => {
    it('returns empty trace for LP with no descendants', async () => {
      const result = await LPGenealogyService.getForwardTrace(
        supabase,
        'lp-orphan',
        10,
        false
      )

      expect(result.nodes).toHaveLength(0)
      expect(result.totalCount).toBe(0)
      expect(result.hasMoreLevels).toBe(false)
    })

    it('returns descendants sorted by depth', async () => {
      const result = await LPGenealogyService.getForwardTrace(
        supabase,
        'lp-root',
        10,
        false
      )

      // Verify sorted by depth
      const depths = result.nodes.map(n => n.depth)
      expect(depths).toEqual([...depths].sort())
    })

    it('respects max depth limit', async () => {
      const result = await LPGenealogyService.getForwardTrace(
        supabase,
        'lp-deep-tree',
        3,
        false
      )

      const maxDepth = Math.max(...result.nodes.map(n => n.depth))
      expect(maxDepth).toBeLessThanOrEqual(3)
    })
  })
})
```

### Integration Test Example

```typescript
import { createClient } from '@/lib/supabase/client'
import { LPGenealogyService } from '@/lib/services/lp-genealogy-service'

describe('LPGenealogyService Integration', () => {
  let supabase: ReturnType<typeof createClient>

  beforeAll(() => {
    supabase = createClient()
  })

  it('creates and retrieves genealogy tree', async () => {
    // Create parent LP
    const { data: parentLP } = await supabase
      .from('license_plates')
      .insert({ lp_number: 'TEST-PARENT-001', product_id: 'prod-001' })
      .select()
      .single()

    // Create child LP
    const { data: childLP } = await supabase
      .from('license_plates')
      .insert({ lp_number: 'TEST-CHILD-001', product_id: 'prod-002' })
      .select()
      .single()

    // Create genealogy link
    await LPGenealogyService.linkConsumption(supabase, {
      parentLpId: parentLP.id,
      childLpId: childLP.id,
      woId: 'wo-test',
      quantity: 100.0
    })

    // Verify forward trace
    const forwardTrace = await LPGenealogyService.getForwardTrace(
      supabase,
      parentLP.id,
      5,
      false
    )

    expect(forwardTrace.nodes).toHaveLength(1)
    expect(forwardTrace.nodes[0].lp_id).toBe(childLP.id)

    // Verify backward trace
    const backwardTrace = await LPGenealogyService.getBackwardTrace(
      supabase,
      childLP.id,
      5,
      false
    )

    expect(backwardTrace.nodes).toHaveLength(1)
    expect(backwardTrace.nodes[0].lp_id).toBe(parentLP.id)

    // Cleanup
    await supabase.from('lp_genealogy').delete().eq('parent_lp_id', parentLP.id)
    await supabase.from('license_plates').delete().eq('id', parentLP.id)
    await supabase.from('license_plates').delete().eq('id', childLP.id)
  })
})
```

---

## Performance Optimization

### 1. Limit Trace Depth

```typescript
// Bad: Deep trace for UI display
const trace = await LPGenealogyService.getForwardTrace(
  supabase,
  lpId,
  10  // Too deep for UI
)

// Good: Shallow trace for UI
const trace = await LPGenealogyService.getForwardTrace(
  supabase,
  lpId,
  3   // Sufficient for detail view
)
```

**Recommendation:**
- UI detail view: depth 3
- Investigation/recall: depth 10
- Most production scenarios: depth 5

### 2. Cache Genealogy Trees

```typescript
import { useQuery } from '@tanstack/react-query'

function useCachedGenealogy(lpId: string) {
  return useQuery({
    queryKey: ['genealogy', 'tree', lpId],
    queryFn: () => LPGenealogyService.getFullTree(supabase, lpId, 'both', 3),
    staleTime: 60000,      // 1 minute
    cacheTime: 300000,     // 5 minutes
  })
}
```

### 3. Batch Link Creation

```typescript
// Bad: Individual inserts
for (const consumedLpId of consumedLpIds) {
  await LPGenealogyService.linkConsumption(supabase, {
    parentLpId: consumedLpId,
    childLpId: outputLpId,
    woId,
    quantity: 0
  })
}

// Good: Batch insert
await LPGenealogyService.linkOutput(supabase, {
  consumedLpIds,
  outputLpId,
  woId
})
```

### 4. Exclude Reversed Links

```typescript
// Always exclude reversed links unless investigating corrections
const trace = await LPGenealogyService.getForwardTrace(
  supabase,
  lpId,
  5,
  false  // includeReversed = false (default)
)
```

---

## Best Practices

### 1. Always Validate Input

```typescript
import { linkConsumptionSchema } from '@/lib/validation/lp-genealogy-schemas'

async function createLink(input: unknown) {
  // Validate before calling service
  const validated = linkConsumptionSchema.parse(input)

  return await LPGenealogyService.linkConsumption(supabase, validated)
}
```

### 2. Handle Org Context

```typescript
// Service automatically gets org_id from authenticated user
// No need to pass org_id in input

// In test environment
process.env.NODE_ENV = 'test'
// Service uses hardcoded test org_id: 'org-123'

// In production
// Service fetches org_id from Supabase auth context
```

### 3. Use Typed Returns

```typescript
import type { GenealogyTraceResult, GenealogyNode } from '@/lib/services/lp-genealogy-service'

async function processTrace(lpId: string): Promise<GenealogyNode[]> {
  const trace: GenealogyTraceResult = await LPGenealogyService.getForwardTrace(
    supabase,
    lpId,
    5,
    false
  )

  return trace.nodes
}
```

### 4. Implement Reversal Workflow

```typescript
async function correctGenealogyLink(
  supabase: SupabaseClient,
  genealogyId: string,
  correctInput: LinkConsumptionInput
) {
  // 1. Reverse incorrect link
  await LPGenealogyService.reverseLink(supabase, genealogyId)

  // 2. Create correct link
  const newLink = await LPGenealogyService.linkConsumption(supabase, correctInput)

  return newLink
}
```

---

## Troubleshooting

### Issue: "Access denied: org_id mismatch"

**Cause**: User's org_id doesn't match LP's org_id

**Solution**:
```typescript
// Verify LP belongs to user's organization
const { data: lp } = await supabase
  .from('license_plates')
  .select('org_id')
  .eq('id', lpId)
  .single()

const { data: user } = await supabase
  .from('users')
  .select('org_id')
  .eq('id', userId)
  .single()

if (lp.org_id !== user.org_id) {
  throw new Error('LP not found in your organization')
}
```

### Issue: Slow Trace Queries

**Cause**: Deep genealogy trees or missing indexes

**Solution**:
```typescript
// 1. Reduce max depth
const trace = await LPGenealogyService.getForwardTrace(
  supabase,
  lpId,
  3,  // Reduced from 10
  false
)

// 2. Verify indexes exist
// Run in database:
// SELECT * FROM pg_indexes WHERE tablename = 'lp_genealogy';

// 3. Check query performance
const { data, error } = await supabase.rpc('get_lp_forward_trace', {
  p_lp_id: lpId,
  p_org_id: orgId,
  p_max_depth: 5
})
```

### Issue: Duplicate Link Error

**Cause**: Link already exists for this parent-child-operation combination

**Solution**:
```typescript
// Check if link exists before creating
const exists = await LPGenealogyService.hasGenealogyLink(
  supabase,
  parentLpId,
  childLpId,
  'consume'
)

if (exists) {
  console.log('Link already exists, skipping')
} else {
  await LPGenealogyService.linkConsumption(supabase, input)
}
```

---

## Related Documentation

- **API Reference**: [docs/api/lp-genealogy-tracking.md](../../api/lp-genealogy-tracking.md)
- **Database Schema**: [docs/database/lp-genealogy-schema.md](../../database/lp-genealogy-schema.md)
- **Component Integration**: [docs/guides/warehouse/lp-genealogy-components.md](./lp-genealogy-components.md)
- **React Hooks**: [docs/api/lp-genealogy-tracking.md#react-hooks](../../api/lp-genealogy-tracking.md#react-hooks)

---

## Summary

The LP Genealogy Service provides:

- **Simple API** for link creation and trace queries
- **Recursive CTEs** for efficient tree traversal
- **Multi-tenancy** via automatic org_id isolation
- **Type safety** via TypeScript and Zod validation
- **Performance** via caching and depth limits

**Use this service** for all LP genealogy operations across Production, Warehouse, and Quality modules.
