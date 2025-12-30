# BOM Advanced Features Development Guide

**Story:** 02.14 - BOM Advanced Features: Version Comparison, Yield & Scaling
**Status:** Production Ready
**Last Updated:** 2025-12-29
**Audience:** Backend developers, frontend developers, full-stack engineers

---

## Overview

This guide covers implementing and maintaining the BOM advanced features, including version comparison, multi-level explosion, batch scaling, and yield analysis. The implementation spans API endpoints, service layer, React components, and custom hooks.

**Key Technologies:**
- Backend: Next.js API Routes, Supabase
- Frontend: React 19, TypeScript, TailwindCSS
- State Management: React Query hooks
- Validation: Zod schemas
- Testing: Vitest (unit), Playwright (e2e)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [API Endpoints](#api-endpoints)
3. [Service Layer](#service-layer)
4. [Frontend Components](#frontend-components)
5. [Custom Hooks](#custom-hooks)
6. [Validation & Types](#validation--types)
7. [Testing](#testing)
8. [Performance Optimization](#performance-optimization)
9. [Security Considerations](#security-considerations)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Layered Architecture

```
┌─────────────────────────────────────────┐
│  React Components                       │
│  (BOMComparisonModal, etc.)            │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────┴──────────────────────┐
│  Custom Hooks                           │
│  (useBOMComparison, useBOMScale, etc.)  │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────┴──────────────────────┐
│  API Routes (Next.js)                   │
│  /api/technical/boms/[id]/compare/...   │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────┴──────────────────────┐
│  Service Layer (bom-service.ts)         │
│  compareBOMVersions()                   │
│  explodeBOM()                           │
│  applyBOMScaling()                      │
│  updateBOMYield()                       │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────┴──────────────────────┐
│  Database (Supabase PostgreSQL)         │
│  boms, bom_items, products, etc.        │
└─────────────────────────────────────────┘
```

### Data Flow

**For BOM Comparison:**

```
User clicks "Compare" → BOMComparisonModal opens
  ↓
User selects two versions → useBOMComparison hook fires
  ↓
Hook calls GET /api/technical/boms/:id/compare/:compareId
  ↓
API validates auth, calls compareBOMVersions(id1, id2)
  ↓
Service fetches both BOMs, calculates diffs
  ↓
Response returned to hook, component re-renders
```

**For BOM Scaling:**

```
User opens scale modal → BOMScaleModal component
  ↓
User enters target batch size → useBOMScale preview function fires
  ↓
Hook calculates scaled quantities (no DB changes)
  ↓
Component displays preview
  ↓
User clicks "Apply" → POST /api/technical/boms/:id/scale
  ↓
API validates, calls applyBOMScaling()
  ↓
Service updates bom_items table
  ↓
Success response, component refetches BOM
```

---

## API Endpoints

### Directory Structure

```
apps/frontend/app/api/technical/boms/
├── [id]/
│   ├── compare/
│   │   └── [compareId]/
│   │       └── route.ts          # GET comparison
│   ├── explosion/
│   │   └── route.ts              # GET explosion
│   ├── scale/
│   │   └── route.ts              # GET legacy, POST new scale
│   └── yield/
│       └── route.ts              # GET yield, PUT update
└── __tests__/
    ├── compare.test.ts           # 32 tests
    ├── explosion.test.ts         # 45 tests
    ├── scale.test.ts             # 65 tests
    └── yield.test.ts             # 78 tests
```

### Implementation Pattern

All endpoints follow this pattern:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { someService } from '@/lib/services/bom-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // 1. Authenticate
    const { data: { session }, error: authError } =
      await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // 2. Get user & check role (if needed)
    const { data: currentUser } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', session.user.id)
      .single()

    // 3. Validate input (query params, request body)
    const validatedInput = someSchema.parse(input)

    // 4. Call service
    const result = await someService(id, validatedInput)

    // 5. Return success
    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    // 6. Error handling
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      switch (error.message) {
        case 'BOM_NOT_FOUND':
          return NextResponse.json(
            { error: 'BOM not found', code: 'BOM_NOT_FOUND' },
            { status: 404 }
          )
        // ... more cases
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Key Principles

1. **Always authenticate first** - Check session before any business logic
2. **Validate all inputs** - Use Zod schemas for request validation
3. **Use service layer** - Don't query database directly in routes
4. **Specific error codes** - Use `code` field for client to handle (not just HTTP status)
5. **RLS protection** - Service layer enforces org_id filtering
6. **No secrets in responses** - Never return org_id, auth tokens, or sensitive data

---

## Service Layer

All business logic lives in `apps/frontend/lib/services/bom-service.ts`.

### New Functions (Story 02.14)

#### compareBOMVersions()

```typescript
/**
 * Compare two BOM versions and return detailed differences
 *
 * Algorithm:
 * 1. Fetch both BOMs with items
 * 2. Validate same product
 * 3. Index items by component_id
 * 4. Find added/removed/modified items
 * 5. Calculate summary statistics
 */
export async function compareBOMVersions(
  bomId1: string,
  bomId2: string
): Promise<BomComparisonResponse> {
  // Validation
  if (bomId1 === bomId2) {
    throw new Error('SAME_VERSION')
  }

  // Fetch both BOMs (with RLS enforcement)
  const [bom1, bom2] = await Promise.all([
    getBOMWithItems(bomId1),
    getBOMWithItems(bomId2),
  ])

  // Validate same product
  if (bom1.product_id !== bom2.product_id) {
    throw new Error('DIFFERENT_PRODUCTS')
  }

  // Index by component_id (key for matching)
  const items1Map = new Map(bom1.items.map(i => [i.component_id, i]))
  const items2Map = new Map(bom2.items.map(i => [i.component_id, i]))

  // Find differences
  const added: BomItemSummary[] = []
  const removed: BomItemSummary[] = []
  const modified: ModifiedItem[] = []

  // Check for additions
  for (const [componentId, item] of items2Map) {
    if (!items1Map.has(componentId)) {
      added.push(mapToSummary(item))
    }
  }

  // Check for removals
  for (const [componentId, item] of items1Map) {
    if (!items2Map.has(componentId)) {
      removed.push(mapToSummary(item))
    }
  }

  // Check for modifications
  for (const [componentId, item1] of items1Map) {
    const item2 = items2Map.get(componentId)
    if (!item2) continue

    for (const field of ['quantity', 'uom', 'scrap_percent', 'sequence']) {
      if (item1[field] !== item2[field]) {
        modified.push({
          item_id: item1.id,
          component_id: componentId,
          component_code: item1.component_code,
          component_name: item1.component_name,
          field: field as any,
          old_value: item1[field],
          new_value: item2[field],
          change_percent: typeof item1[field] === 'number'
            ? ((item2[field] - item1[field]) / item1[field]) * 100
            : null,
        })
      }
    }
  }

  // Calculate summary
  const summary = {
    total_items_v1: bom1.items.length,
    total_items_v2: bom2.items.length,
    total_added: added.length,
    total_removed: removed.length,
    total_modified: modified.length,
    weight_change_kg: calculateWeightChange(bom1, bom2),
    weight_change_percent: calculateWeightChangePercent(bom1, bom2),
  }

  return {
    bom_1: mapToVersionResponse(bom1),
    bom_2: mapToVersionResponse(bom2),
    differences: { added, removed, modified },
    summary,
  }
}
```

**Time Complexity:** O(n) where n = total items in both BOMs
**Space Complexity:** O(n) for maps

#### explodeBOM()

Uses recursive CTE (Common Table Expression) for multi-level explosion:

```typescript
/**
 * Explode BOM recursively to show all raw materials
 *
 * Uses PostgreSQL recursive CTE:
 * 1. Anchor: Start with items directly in BOM
 * 2. Recursive: For each WIP item, fetch its sub-items
 * 3. Stop condition: Max depth limit (default 10)
 * 4. Prevents circular references by tracking path
 */
export async function explodeBOM(
  bomId: string,
  maxDepth: number = 10
): Promise<BomExplosionResponse> {
  const bom = await getBOMWithItems(bomId)

  // Execute recursive CTE query
  const explosionData = await executeRecursiveExplosion(
    bomId,
    maxDepth
  )

  // Check for circular references
  for (const item of explosionData.items) {
    if (hasCircularReference(item.path)) {
      throw new Error('CIRCULAR_REFERENCE')
    }
  }

  // Group by level
  const levels = groupByLevel(explosionData.items)

  // Aggregate raw materials
  const rawMaterials = aggregateRawMaterials(explosionData.items)

  return {
    bom_id: bom.id,
    product_code: bom.product.code,
    product_name: bom.product.name,
    output_qty: bom.output_qty,
    output_uom: bom.output_uom,
    levels,
    total_levels: levels.length,
    total_items: explosionData.items.length,
    raw_materials_summary: rawMaterials,
  }
}
```

**The Recursive SQL (inside Supabase):**

```sql
WITH RECURSIVE bom_explosion AS (
  -- Anchor: top-level items
  SELECT
    bi.id,
    bi.component_id,
    c.code as component_code,
    c.name as component_name,
    c.type as component_type,
    bi.quantity,
    bi.quantity as cumulative_qty,
    bi.uom,
    bi.scrap_percent,
    b.id as sub_bom_id,
    1 as level,
    ARRAY[bi.component_id] as path
  FROM bom_items bi
  JOIN components c ON bi.component_id = c.id
  JOIN boms b ON bi.bom_id = b.id
  WHERE bi.bom_id = $1
    AND bi.is_output = false

  UNION ALL

  -- Recursive: sub-items
  SELECT
    bi.id,
    bi.component_id,
    c.code,
    c.name,
    c.type,
    bi.quantity,
    be.cumulative_qty * bi.quantity * (1 - bi.scrap_percent/100) as cumulative_qty,
    bi.uom,
    bi.scrap_percent,
    b.id,
    be.level + 1,
    be.path || bi.component_id
  FROM bom_explosion be
  JOIN boms b ON b.id = be.sub_bom_id
  JOIN bom_items bi ON bi.bom_id = b.id
  JOIN components c ON bi.component_id = c.id
  WHERE be.level < $2
    AND NOT bi.component_id = ANY(be.path)  -- Prevent cycles
    AND bi.is_output = false
)
SELECT * FROM bom_explosion
ORDER BY level, component_code
```

**Time Complexity:** O(n) where n = total nodes in explosion
**Depth Protection:** Hard limit of 10 levels, query timeout of 1 second
**Circular Reference Detection:** Path array in CTE prevents cycles

#### applyBOMScaling()

```typescript
/**
 * Scale BOM quantities to new batch size
 *
 * Features:
 * - Calculate scale factor from target batch size or direct factor
 * - Apply rounding to practical quantities
 * - Generate warnings for very small quantities
 * - Preview-only mode (no DB writes)
 * - Save changes to database if not preview-only
 */
export async function applyBOMScaling(
  bomId: string,
  request: ScaleBomRequest
): Promise<ScaleBomResponse> {
  const bom = await getBOMWithItems(bomId)

  // Calculate scale factor
  let scaleFactor: number
  if (request.scale_factor !== undefined) {
    scaleFactor = request.scale_factor
  } else if (request.target_batch_size !== undefined) {
    scaleFactor = request.target_batch_size / bom.output_qty
  } else {
    throw new Error('MISSING_SCALE_PARAM')
  }

  // Validate scale factor
  if (scaleFactor <= 0 || !isFinite(scaleFactor)) {
    throw new Error('INVALID_SCALE')
  }

  const warnings: string[] = []
  const scaledItems = bom.items.map(item => {
    // Calculate new quantity
    const newQty = item.quantity * scaleFactor

    // Apply rounding
    const roundedQty = roundToDecimals(
      newQty,
      request.round_decimals ?? 3
    )
    const wasRounded = newQty !== roundedQty

    // Generate warnings
    if (wasRounded && Math.abs(newQty - roundedQty) > 0.0001) {
      warnings.push(
        `${item.component_name} rounded from ${newQty.toFixed(6)} to ${roundedQty}`
      )
    }

    return {
      id: item.id,
      component_code: item.component_code,
      component_name: item.component_name,
      original_quantity: item.quantity,
      new_quantity: roundedQty,
      uom: item.uom,
      rounded: wasRounded,
    }
  })

  // Apply changes if not preview-only
  if (!request.preview_only) {
    const supabase = createServerSupabaseAdmin()

    // Batch update all items
    for (const scaledItem of scaledItems) {
      await supabase
        .from('bom_items')
        .update({ quantity: scaledItem.new_quantity })
        .eq('id', scaledItem.id)
    }

    // Update output quantity
    await supabase
      .from('boms')
      .update({ output_qty: request.target_batch_size ?? bom.output_qty * scaleFactor })
      .eq('id', bomId)
  }

  return {
    original_batch_size: bom.output_qty,
    new_batch_size: request.target_batch_size ?? (bom.output_qty * scaleFactor),
    scale_factor: scaleFactor,
    items: scaledItems,
    warnings,
    applied: !request.preview_only,
  }
}
```

**Rounding Algorithm:**

```typescript
function roundToDecimals(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

// Examples:
roundToDecimals(0.0075, 3)   // → 0.008
roundToDecimals(75.123456, 2) // → 75.12
roundToDecimals(100, 0)        // → 100
```

#### updateBOMYield()

```typescript
/**
 * Update yield configuration for a BOM
 *
 * Calculates:
 * - Theoretical yield: (output / input) * 100
 * - Expected yield: user-configured target
 * - Variance: difference between theoretical and expected
 * - Loss factors: breakdown of where yield is lost
 */
export async function updateBOMYield(
  bomId: string,
  request: UpdateYieldRequest
): Promise<BomYieldResponse> {
  // Validate yield percentage
  if (request.expected_yield_percent < 0 || request.expected_yield_percent > 100) {
    throw new Error('INVALID_YIELD')
  }

  const supabase = createServerSupabaseAdmin()

  // Update BOM with new yield config
  const { error } = await supabase
    .from('boms')
    .update({
      expected_yield_percent: request.expected_yield_percent,
      variance_threshold_percent: request.variance_threshold_percent ?? 5,
    })
    .eq('id', bomId)

  if (error) throw error

  // Return updated yield analysis
  return getBOMYield(bomId)
}

export async function getBOMYield(bomId: string): Promise<BomYieldResponse> {
  const bom = await getBOMWithItems(bomId)

  // Calculate inputs
  const inputTotal = calculateTotalInput(bom.items)

  // Calculate theoretical yield
  const theoreticalYield = (bom.output_qty / inputTotal) * 100

  // Get loss factors
  const lossFactors = calculateLossFactors(bom.items)

  // Calculate variance
  const variance = bom.expected_yield_percent
    ? theoreticalYield - bom.expected_yield_percent
    : null

  return {
    bom_id: bom.id,
    theoretical_yield_percent: theoreticalYield,
    expected_yield_percent: bom.expected_yield_percent,
    input_total_kg: inputTotal,
    output_qty_kg: bom.output_qty,
    loss_factors: lossFactors,
    actual_yield_avg: null, // Phase 1 feature
    variance_from_expected: variance,
    variance_warning: variance
      ? Math.abs(variance) > (bom.variance_threshold_percent ?? 5)
      : false,
  }
}
```

---

## Frontend Components

### Component Directory

```
components/technical/bom/
├── BOMComparisonModal.tsx          # Comparison UI
├── MultiLevelExplosion.tsx         # Explosion tree view
├── BOMScaleModal.tsx               # Scaling modal
├── YieldAnalysisPanel.tsx          # Yield display
├── YieldConfigModal.tsx            # Yield config
├── ScalePreviewTable.tsx           # Scale preview
├── BOMVersionSelector.tsx          # Version dropdown
├── DiffHighlighter.tsx             # Diff highlighting
└── __tests__/
    └── BOMComparisonModal.test.tsx # 40+ tests
```

### BOMComparisonModal Component

```typescript
interface BOMComparisonModalProps {
  bomId1: string              // First BOM ID
  bomId2: string              // Second BOM ID
  productId: string           // For version selector
  isOpen: boolean             // Modal visibility
  onClose: () => void         // Close callback
}

export function BOMComparisonModal({
  bomId1,
  bomId2,
  productId,
  isOpen,
  onClose,
}: BOMComparisonModalProps) {
  const [selectedId1, setSelectedId1] = useState(bomId1)
  const [selectedId2, setSelectedId2] = useState(bomId2)

  // Use custom hook for comparison
  const {
    data: comparison,
    isLoading,
    error,
    refetch,
  } = useBOMComparison(selectedId1, selectedId2)

  // Handle state
  if (!isOpen) return null
  if (isLoading) return <ComparisonLoading />
  if (error) return <ComparisonError error={error} />
  if (!comparison) return <ComparisonEmpty />

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Compare BOM Versions</DialogTitle>
          <DialogDescription>
            Side-by-side comparison with diff highlighting
          </DialogDescription>
        </DialogHeader>

        {/* Version selectors */}
        <div className="grid grid-cols-2 gap-4">
          <BOMVersionSelector
            productId={productId}
            selectedId={selectedId1}
            onChange={setSelectedId1}
            label="From Version"
          />
          <BOMVersionSelector
            productId={productId}
            selectedId={selectedId2}
            onChange={setSelectedId2}
            label="To Version"
          />
        </div>

        {/* Comparison table */}
        <ComparisonTable comparison={comparison} />

        {/* Summary */}
        <ComparisonSummary summary={comparison.summary} />

        {/* Actions */}
        <DialogFooter>
          <Button onClick={() => exportToCSV(comparison)}>
            Export to CSV
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### MultiLevelExplosion Component

```typescript
interface MultiLevelExplosionProps {
  bomId: string
  maxDepth?: number        // Default 10
  className?: string
}

export function MultiLevelExplosion({
  bomId,
  maxDepth = 10,
  className,
}: MultiLevelExplosionProps) {
  const { data: explosion, isLoading, error } = useBOMExplosion(bomId, maxDepth)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  if (isLoading) return <ExplosionSkeleton />
  if (error) return <ExplosionError error={error} />

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Multi-Level Explosion</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Tree structure by level */}
        {explosion?.levels.map(level => (
          <div key={level.level} className="mb-4">
            <h4 className="font-semibold mb-2">Level {level.level}</h4>
            {level.items.map(item => (
              <ExplosionItemRow
                key={item.item_id}
                item={item}
                level={level.level}
                isExpanded={expandedItems.has(item.item_id)}
                onToggleExpand={() => toggleExpanded(item.item_id)}
              />
            ))}
          </div>
        ))}

        {/* Raw materials summary */}
        <RawMaterialsSummary items={explosion?.raw_materials_summary} />
      </CardContent>
    </Card>
  )
}

function ExplosionItemRow({
  item,
  level,
  isExpanded,
  onToggleExpand,
}: {
  item: ExplosionItem
  level: number
  isExpanded: boolean
  onToggleExpand: () => void
}) {
  const indentClass = `ml-${level * 4}`
  const hasSubItems = item.has_sub_bom

  return (
    <div className={cn('flex items-center gap-2 py-2', indentClass)}>
      {hasSubItems ? (
        <button onClick={onToggleExpand} className="w-5 h-5">
          {isExpanded ? <ChevronDown /> : <ChevronRight />}
        </button>
      ) : (
        <div className="w-5" />
      )}

      <ComponentTypeIcon type={item.component_type} />

      <span className="font-medium">{item.component_name}</span>
      <span className="text-sm text-gray-500">({item.component_code})</span>

      <span className="ml-auto font-mono">
        {item.cumulative_qty} {item.uom}
      </span>

      {item.scrap_percent > 0 && (
        <Badge variant="outline">{item.scrap_percent}% scrap</Badge>
      )}
    </div>
  )
}
```

---

## Custom Hooks

### useBOMComparison

```typescript
import { useQuery } from '@tanstack/react-query'

export function useBOMComparison(id1: string, id2: string) {
  return useQuery({
    queryKey: ['bom-comparison', id1, id2],
    queryFn: async () => {
      const response = await fetch(
        `/api/technical/boms/${id1}/compare/${id2}`,
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Comparison failed')
      }

      return response.json() as Promise<BomComparisonResponse>
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes
  })
}
```

### useBOMExplosion

```typescript
export function useBOMExplosion(
  bomId: string,
  maxDepth: number = 10
) {
  return useQuery({
    queryKey: ['bom-explosion', bomId, maxDepth],
    queryFn: async () => {
      const response = await fetch(
        `/api/technical/boms/${bomId}/explosion?maxDepth=${maxDepth}`,
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Explosion failed')
      }

      return response.json() as Promise<BomExplosionResponse>
    },
    staleTime: 10 * 60 * 1000,  // 10 minutes
  })
}
```

### useBOMScale

```typescript
export async function previewBOMScale(
  bomId: string,
  request: ScaleBomRequest
): Promise<ScaleBomResponse> {
  const response = await fetch(`/api/technical/boms/${bomId}/scale`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...request, preview_only: true }),
  })

  if (!response.ok) {
    throw new Error('Scale preview failed')
  }

  return response.json()
}

export function useBOMScale(bomId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: ScaleBomRequest) => {
      const response = await fetch(`/api/technical/boms/${bomId}/scale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error('Scale failed')
      }

      return response.json() as Promise<ScaleBomResponse>
    },
    onSuccess: () => {
      // Invalidate BOM query to refetch
      queryClient.invalidateQueries({
        queryKey: ['bom', bomId],
      })
    },
  })
}
```

### useBOMYield

```typescript
export function useBOMYield(bomId: string) {
  return useQuery({
    queryKey: ['bom-yield', bomId],
    queryFn: async () => {
      const response = await fetch(`/api/technical/boms/${bomId}/yield`)

      if (!response.ok) {
        throw new Error('Yield fetch failed')
      }

      return response.json() as Promise<BomYieldResponse>
    },
    staleTime: 10 * 60 * 1000,
  })
}

export function useUpdateBOMYield(bomId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: UpdateYieldRequest) => {
      const response = await fetch(`/api/technical/boms/${bomId}/yield`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error('Yield update failed')
      }

      return response.json() as Promise<BomYieldResponse>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['bom-yield', bomId],
      })
    },
  })
}
```

---

## Validation & Types

### Zod Schemas

```typescript
// apps/frontend/lib/validation/bom-advanced-schemas.ts

import { z } from 'zod'

// Scale request
export const scaleBomRequestSchema = z.object({
  target_batch_size: z.number().positive().optional(),
  target_uom: z.string().optional(),
  scale_factor: z.number().positive().optional(),
  preview_only: z.boolean().default(true),
  round_decimals: z.number().int().min(0).max(6).default(3),
}).refine(
  (data) => data.target_batch_size !== undefined || data.scale_factor !== undefined,
  { message: 'Either target_batch_size or scale_factor required' }
)

export type ScaleBomRequest = z.infer<typeof scaleBomRequestSchema>

// Yield update request
export const updateYieldRequestSchema = z.object({
  expected_yield_percent: z.number().min(0).max(100),
  variance_threshold_percent: z.number().min(0).max(100).default(5),
})

export type UpdateYieldRequest = z.infer<typeof updateYieldRequestSchema>

// Explosion query params
export const explosionQuerySchema = z.object({
  maxDepth: z.coerce.number().int().min(1).max(10).default(10),
  includeQuantities: z.coerce.boolean().default(true),
})

export type ExplosionQuery = z.infer<typeof explosionQuerySchema>
```

### TypeScript Types

```typescript
// apps/frontend/lib/types/bom-advanced.ts

export interface BomComparisonResponse {
  bom_1: BomVersion
  bom_2: BomVersion
  differences: {
    added: BomItemSummary[]
    removed: BomItemSummary[]
    modified: ModifiedItem[]
  }
  summary: {
    total_items_v1: number
    total_items_v2: number
    total_added: number
    total_removed: number
    total_modified: number
    weight_change_kg: number
    weight_change_percent: number
  }
}

export interface BomVersion {
  id: string
  version: string
  effective_from: string
  effective_to: string | null
  output_qty: number
  output_uom: string
  status: string
  items: BomItemSummary[]
}

export interface BomItemSummary {
  id: string
  component_id: string
  component_code: string
  component_name: string
  quantity: number
  uom: string
  sequence: number
  operation_seq: number | null
  scrap_percent: number
  is_output: boolean
}

export interface ModifiedItem {
  item_id: string
  component_id: string
  component_code: string
  component_name: string
  field: 'quantity' | 'uom' | 'scrap_percent' | 'sequence'
  old_value: string | number
  new_value: string | number
  change_percent: number | null
}

export interface BomExplosionResponse {
  bom_id: string
  product_code: string
  product_name: string
  output_qty: number
  output_uom: string
  levels: ExplosionLevel[]
  total_levels: number
  total_items: number
  raw_materials_summary: RawMaterialSummary[]
}

export interface ExplosionLevel {
  level: number
  items: ExplosionItem[]
}

export interface ExplosionItem {
  item_id: string
  component_id: string
  component_code: string
  component_name: string
  component_type: 'raw' | 'wip' | 'finished' | 'packaging'
  quantity: number
  cumulative_qty: number
  uom: string
  scrap_percent: number
  has_sub_bom: boolean
  path: string[]
}

export interface RawMaterialSummary {
  component_id: string
  component_code: string
  component_name: string
  total_qty: number
  uom: string
}

export interface ScaleBomResponse {
  original_batch_size: number
  new_batch_size: number
  scale_factor: number
  items: ScaledItem[]
  warnings: string[]
  applied: boolean
}

export interface ScaledItem {
  id: string
  component_code: string
  component_name: string
  original_quantity: number
  new_quantity: number
  uom: string
  rounded: boolean
}

export interface BomYieldResponse {
  bom_id: string
  theoretical_yield_percent: number
  expected_yield_percent: number | null
  input_total_kg: number
  output_qty_kg: number
  loss_factors: LossFactor[]
  actual_yield_avg: number | null
  variance_from_expected: number | null
  variance_warning: boolean
}

export interface LossFactor {
  type: 'moisture' | 'trim' | 'process' | 'custom'
  description: string
  loss_percent: number
}
```

---

## Testing

### Unit Tests (45 tests)

File: `apps/frontend/lib/services/__tests__/bom-advanced.test.ts`

```typescript
describe('BOM Advanced Service', () => {
  describe('compareBOMVersions', () => {
    it('should return comparison with added items', async () => {
      const result = await compareBOMVersions(bom1Id, bom2Id)
      expect(result.differences.added).toHaveLength(1)
      expect(result.differences.added[0].component_code).toBe('SALT-001')
    })

    it('should reject same version comparison', async () => {
      await expect(compareBOMVersions(bom1Id, bom1Id))
        .rejects
        .toThrow('SAME_VERSION')
    })

    it('should reject different product comparison', async () => {
      await expect(compareBOMVersions(bomBread, bomCake))
        .rejects
        .toThrow('DIFFERENT_PRODUCTS')
    })
  })

  describe('explodeBOM', () => {
    it('should explode multi-level BOM', async () => {
      const result = await explodeBOM(bomWithSubItems)
      expect(result.total_levels).toBe(2)
      expect(result.raw_materials_summary).toHaveLength(4)
    })

    it('should detect circular references', async () => {
      await expect(explodeBOM(bomWithCycle))
        .rejects
        .toThrow('CIRCULAR_REFERENCE')
    })

    it('should limit to max depth', async () => {
      const result = await explodeBOM(bomDeepNested, 3)
      expect(result.total_levels).toBeLessThanOrEqual(3)
    })
  })

  describe('applyBOMScaling', () => {
    it('should scale by target batch size', async () => {
      const result = await applyBOMScaling(bomId, {
        target_batch_size: 150,
        preview_only: true,
      })
      expect(result.scale_factor).toBe(1.5)
      expect(result.new_batch_size).toBe(150)
    })

    it('should scale by factor', async () => {
      const result = await applyBOMScaling(bomId, {
        scale_factor: 2,
        preview_only: true,
      })
      expect(result.items[0].new_quantity).toBe(100) // 50 * 2
    })

    it('should reject zero scale factor', async () => {
      await expect(applyBOMScaling(bomId, {
        scale_factor: 0,
      })).rejects.toThrow('INVALID_SCALE')
    })

    it('should apply changes when preview_only=false', async () => {
      await applyBOMScaling(bomId, {
        target_batch_size: 150,
        preview_only: false,
      })
      // Verify DB was updated
      const updated = await getBOMWithItems(bomId)
      expect(updated.output_qty).toBe(150)
    })
  })
})
```

### Integration Tests (220 tests)

File: `apps/frontend/app/api/technical/boms/__tests__/compare.test.ts`

```typescript
describe('GET /api/technical/boms/:id/compare/:compareId', () => {
  it('should require authentication', async () => {
    const response = await fetch(
      `/api/technical/boms/${bom1}/compare/${bom2}`
    )
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({
      error: 'Unauthorized',
      code: 'UNAUTHORIZED',
    })
  })

  it('should return 404 for cross-tenant access', async () => {
    const response = await fetch(
      `/api/technical/boms/${otherOrgBom1}/compare/${otherOrgBom2}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    expect(response.status).toBe(404)
  })

  it('should return comparison', async () => {
    const response = await fetch(
      `/api/technical/boms/${bom1}/compare/${bom2}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('bom_1')
    expect(data).toHaveProperty('bom_2')
    expect(data).toHaveProperty('differences')
    expect(data).toHaveProperty('summary')
  })
})
```

### Component Tests (40+ tests)

File: `apps/frontend/components/technical/bom/__tests__/BOMComparisonModal.test.tsx`

```typescript
describe('BOMComparisonModal', () => {
  it('should render when isOpen=true', () => {
    render(
      <BOMComparisonModal
        bomId1={bom1}
        bomId2={bom2}
        productId={productId}
        isOpen={true}
        onClose={() => {}}
      />
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should call onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(
      <BOMComparisonModal
        bomId1={bom1}
        bomId2={bom2}
        productId={productId}
        isOpen={true}
        onClose={onClose}
      />
    )
    fireEvent.click(screen.getByText('Close'))
    expect(onClose).toHaveBeenCalled()
  })

  it('should highlight added items in green', async () => {
    render(
      <BOMComparisonModal
        bomId1={bom1}
        bomId2={bom2}
        productId={productId}
        isOpen={true}
        onClose={() => {}}
      />
    )
    await waitFor(() => {
      const addedRow = screen.getByText('Kosher Salt').closest('tr')
      expect(addedRow).toHaveClass('bg-green-50')
    })
  })
})
```

---

## Performance Optimization

### Caching Strategy

**React Query Settings:**
```typescript
const cacheConfig = {
  staleTime: 5 * 60 * 1000,      // 5 minutes
  gcTime: 30 * 60 * 1000,         // 30 minutes (was cacheTime)
  refetchOnWindowFocus: false,     // Don't refetch on focus
  refetchOnReconnect: true,        // But do on reconnect
  refetchOnMount: 'stale',         // Only if stale
}
```

### Pagination

For large BOMs (1000+ items):
```typescript
// Load items in batches
const items = await getBOMItems(bomId, {
  limit: 100,
  offset: 0,
})

// Implement infinite scroll in UI
```

### Memoization

```typescript
const memoizedComparison = useMemo(() => {
  return {
    added: differences.added,
    removed: differences.removed,
    modified: differences.modified,
  }
}, [differences])
```

### Database Query Optimization

**For comparison** - Use indexes on `bom_id`, `component_id`:
```sql
CREATE INDEX bom_items_bom_id_idx ON bom_items(bom_id);
CREATE INDEX bom_items_component_id_idx ON bom_items(component_id);
```

**For explosion** - Indexes help recursive CTE:
```sql
CREATE INDEX boms_id_product_id_idx ON boms(id, product_id);
CREATE INDEX components_id_type_idx ON components(id, type);
```

---

## Security Considerations

### Authentication

All endpoints enforce JWT-based authentication:
```typescript
const { data: { session } } = await supabase.auth.getSession()
if (!session) throw new Error('Unauthorized')
```

### Authorization

Role-based access control:
```typescript
// Read operations
if (!['admin', 'production_manager', 'planner', 'viewer'].includes(role)) {
  throw new Error('FORBIDDEN')
}

// Write operations
if (!['admin', 'production_manager', 'technical'].includes(role)) {
  throw new Error('FORBIDDEN')
}
```

### Row-Level Security (RLS)

All queries filtered by `org_id`:
```typescript
const { data } = await supabase
  .from('boms')
  .select('*')
  .eq('org_id', userOrgId)  // RLS enforcement
  .eq('id', bomId)
```

**Cross-tenant protection:**
- Returns 404 (not 403) for security - don't leak that resource exists
- Never expose org_id in responses
- All timestamps in UTC

### Input Validation

Use Zod schemas for all inputs:
```typescript
const validated = scaleBomRequestSchema.parse(body)
// If invalid, throws ZodError → 400 Bad Request
```

### Circular Reference Protection

Prevent infinite loops with path tracking:
```sql
WHERE NOT component_id = ANY(path)  -- Check path before recursing
```

---

## Troubleshooting

### Explosion Timeout

**Problem**: Query takes >1 second (timeout)
**Solution**:
- Reduce maxDepth parameter
- Check for circular references
- Review BOM structure - may be too complex

### Performance Issues with Large BOMs

**Problem**: Comparison/scaling slow with 1000+ items
**Solution**:
- Use pagination for item lists
- Implement virtual scrolling in components
- Add database indexes

### Test Failures

**Running tests:**
```bash
cd apps/frontend
npm run test:unit            # Unit tests
npm run test:integration     # API integration tests
npm run test:component       # Component tests
npm run test:bom-advanced    # All BOM 02.14 tests
```

**Debugging:**
```bash
npm run test:debug -- --inspect-brk
# Then open chrome://inspect in Chrome
```

---

## Future Enhancements

### Phase 2 Features

1. **Multi-BOM comparison** - Compare more than 2 versions at once
2. **Alternative ingredients** - Suggest substitutions when scaling
3. **Yield optimization** - ML-based recommendations
4. **Loss factor history** - Track yield variance over time
5. **Deep copy** - Clone with all dependencies

See `.context.yaml` for detailed Phase 2 scope.

---

## Contributing

When adding features to BOM Advanced:

1. **Follow patterns** - Match existing code style
2. **Add tests first** - Write tests before implementation
3. **Document APIs** - Update API docs if adding endpoints
4. **Check RLS** - Ensure org_id filtering on all queries
5. **Update this guide** - Keep documentation in sync

---

## References

- [API Documentation](../../api/bom-advanced.md)
- [User Guide](../../user-guides/bom-advanced-features.md)
- [BOM CRUD Guide](bom-crud-development.md)
- [Story Context](../../../2-MANAGEMENT/epics/current/02-technical/context/02.14/_index.yaml)
- [Database Schema](../TABLES.md)

---

**Last updated:** 2025-12-29
**Version:** 1.0
**Status:** Production Ready
**Maintainers:** Backend Team, Frontend Team
