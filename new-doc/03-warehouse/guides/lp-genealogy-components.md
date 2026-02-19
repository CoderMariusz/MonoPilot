# LP Genealogy Components - Integration Guide

**Story**: 05.2 - LP Genealogy Tracking
**Epic**: 05 - Warehouse Module

## Overview

This guide shows how to integrate LP Genealogy features into React components using the provided service layer and React hooks.

## Component Architecture

```
┌─────────────────────────────────────┐
│    Page/Feature Component           │
│  (LPDetailPage, RecallInvestigation)│
└────────────┬────────────────────────┘
             │ uses
┌────────────▼────────────────────────┐
│     React Hooks (React Query)       │
│  - useLPGenealogy()                 │
│  - useForwardTrace()                │
│  - useBackwardTrace()               │
│  - useFullGenealogyTree()           │
└────────────┬────────────────────────┘
             │ calls
┌────────────▼────────────────────────┐
│    LPGenealogyService               │
│  - linkConsumption()                │
│  - getForwardTrace()                │
│  - getBackwardTrace()               │
└─────────────────────────────────────┘
```

## Quick Start

### Basic LP Detail View with Genealogy

```typescript
// app/(authenticated)/warehouse/license-plates/[id]/page.tsx
'use client'

import { useLPGenealogy } from '@/lib/hooks/use-genealogy'
import { GenealogyTree } from '@/components/warehouse/GenealogyTree'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface LPDetailPageProps {
  params: { id: string }
}

export default function LPDetailPage({ params }: LPDetailPageProps) {
  const { data: genealogy, isLoading, error } = useLPGenealogy(params.id, {
    direction: 'both',
    maxDepth: 3
  })

  if (isLoading) {
    return <div>Loading genealogy...</div>
  }

  if (error) {
    return <div>Error: {error.message}</div>
  }

  if (!genealogy?.hasGenealogy) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No genealogy history found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Genealogy Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Genealogy Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Source Materials</dt>
              <dd className="text-2xl font-bold">{genealogy.summary.parentCount}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Derived Products</dt>
              <dd className="text-2xl font-bold">{genealogy.summary.childCount}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Total Operations</dt>
              <dd className="text-2xl font-bold">{genealogy.summary.totalOperations}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Tree Depth</dt>
              <dd className="text-2xl font-bold">
                ↑{genealogy.summary.depth.backward} / ↓{genealogy.summary.depth.forward}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Genealogy Tree Visualization */}
      <GenealogyTree data={genealogy} />
    </div>
  )
}
```

---

## Component Examples

### 1. GenealogyTree Component

**File**: `components/warehouse/GenealogyTree.tsx`

```typescript
'use client'

import { useState } from 'react'
import type { GenealogyTree as GenealogyTreeData } from '@/lib/types/genealogy'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface GenealogyTreeProps {
  data: GenealogyTreeData
}

export function GenealogyTree({ data }: GenealogyTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({})

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }))
  }

  return (
    <div className="space-y-4">
      {/* Ancestors Section */}
      {data.ancestors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Source Materials ({data.ancestors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.ancestors.map(node => (
                <div
                  key={node.lpId}
                  className="flex items-center gap-2 p-2 border rounded"
                  style={{ marginLeft: `${(node.depth - 1) * 24}px` }}
                >
                  <Badge variant="outline">{node.operationType}</Badge>
                  <span className="font-mono text-sm">{node.lpNumber}</span>
                  <span className="text-sm text-muted-foreground">
                    {node.productName}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {node.quantity} kg
                  </span>
                </div>
              ))}
            </div>
            {data.hasMoreLevels.ancestors && (
              <p className="text-sm text-muted-foreground mt-2">
                More levels available. Increase depth to view.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current LP */}
      <Card className="border-2 border-primary">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Badge variant="default">Current LP</Badge>
            <span className="font-mono font-bold">{data.lpNumber}</span>
          </div>
        </CardContent>
      </Card>

      {/* Descendants Section */}
      {data.descendants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Derived Products ({data.descendants.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.descendants.map(node => (
                <div
                  key={node.lpId}
                  className="flex items-center gap-2 p-2 border rounded"
                  style={{ marginLeft: `${(node.depth - 1) * 24}px` }}
                >
                  <Badge variant="outline">{node.operationType}</Badge>
                  <span className="font-mono text-sm">{node.lpNumber}</span>
                  <span className="text-sm text-muted-foreground">
                    {node.productName}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {node.quantity} kg
                  </span>
                </div>
              ))}
            </div>
            {data.hasMoreLevels.descendants && (
              <p className="text-sm text-muted-foreground mt-2">
                More levels available. Increase depth to view.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

---

### 2. Genealogy Stats Widget

**File**: `components/warehouse/GenealogyStats.tsx`

```typescript
'use client'

import { useLPGenealogy } from '@/lib/hooks/use-genealogy'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface GenealogyStatsProps {
  lpId: string
}

export function GenealogyStats({ lpId }: GenealogyStatsProps) {
  const { data, isLoading } = useLPGenealogy(lpId, {
    direction: 'both',
    maxDepth: 3
  })

  if (isLoading || !data?.hasGenealogy) {
    return null
  }

  const stats = [
    {
      label: 'Source Materials',
      value: data.summary.parentCount,
      icon: TrendingDown,
      color: 'text-blue-500'
    },
    {
      label: 'Derived Products',
      value: data.summary.childCount,
      icon: TrendingUp,
      color: 'text-green-500'
    },
    {
      label: 'Total Operations',
      value: data.summary.totalOperations,
      icon: Activity,
      color: 'text-orange-500'
    }
  ]

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map(stat => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold mt-2">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

---

### 3. Recall Investigation Tool

**File**: `components/quality/RecallInvestigation.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useForwardTrace } from '@/lib/hooks/use-genealogy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'

export function RecallInvestigation() {
  const [lpId, setLpId] = useState('')
  const [searchLpId, setSearchLpId] = useState<string | null>(null)

  const { data, isLoading, error } = useForwardTrace(
    searchLpId,
    10,  // Deep search for recalls
    false
  )

  const handleSearch = () => {
    setSearchLpId(lpId)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Recall Investigation Tool</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter LP Number or ID"
              value={lpId}
              onChange={(e) => setLpId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={!lpId}>
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && <div>Searching...</div>}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {data && data.nodes.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Found {data.totalCount} affected License Plates
          </AlertDescription>
        </Alert>
      )}

      {data && data.nodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Affected License Plates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.nodes.map(node => (
                <div
                  key={node.lp_id}
                  className="flex items-center gap-2 p-3 border rounded bg-red-50"
                >
                  <Badge variant="destructive">AFFECTED</Badge>
                  <div className="flex-1">
                    <p className="font-mono text-sm font-medium">
                      {node.lp_number}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {node.product_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Depth: {node.depth}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {node.operation_type}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {data.hasMoreLevels && (
              <Alert className="mt-4">
                <AlertDescription>
                  Additional levels exist beyond depth 10. Contact system administrator.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {data && data.nodes.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-center">
              No affected LPs found
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

---

### 4. Traceability Report Modal

**File**: `components/production/TraceabilityReportModal.tsx`

```typescript
'use client'

import { useLPGenealogy } from '@/lib/hooks/use-genealogy'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface TraceabilityReportModalProps {
  lpId: string
  lpNumber: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TraceabilityReportModal({
  lpId,
  lpNumber,
  open,
  onOpenChange
}: TraceabilityReportModalProps) {
  const { data, isLoading } = useLPGenealogy(lpId, {
    direction: 'both',
    maxDepth: 10
  })

  const handleExportPDF = () => {
    // Export to PDF logic
    console.log('Exporting to PDF:', data)
  }

  const handleExportExcel = () => {
    // Export to Excel logic
    console.log('Exporting to Excel:', data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Traceability Report - {lpNumber}</DialogTitle>
          <DialogDescription>
            Complete genealogy tree for compliance and auditing
          </DialogDescription>
        </DialogHeader>

        {isLoading && <div>Loading report...</div>}

        {data && (
          <div className="space-y-6">
            {/* Summary Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded p-4">
                <h3 className="font-semibold mb-2">Source Materials</h3>
                <p className="text-2xl font-bold">{data.summary.parentCount}</p>
              </div>
              <div className="border rounded p-4">
                <h3 className="font-semibold mb-2">Derived Products</h3>
                <p className="text-2xl font-bold">{data.summary.childCount}</p>
              </div>
            </div>

            {/* Operations Breakdown */}
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-2">Operations Breakdown</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt>Consume:</dt>
                <dd className="font-medium">{data.summary.operationBreakdown.consume}</dd>
                <dt>Output:</dt>
                <dd className="font-medium">{data.summary.operationBreakdown.output}</dd>
                <dt>Split:</dt>
                <dd className="font-medium">{data.summary.operationBreakdown.split}</dd>
                <dt>Merge:</dt>
                <dd className="font-medium">{data.summary.operationBreakdown.merge}</dd>
              </dl>
            </div>

            {/* Ancestors List */}
            {data.ancestors.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Source Materials</h3>
                <div className="border rounded divide-y max-h-64 overflow-y-auto">
                  {data.ancestors.map(node => (
                    <div key={node.lpId} className="p-2 text-sm">
                      <p className="font-mono">{node.lpNumber}</p>
                      <p className="text-muted-foreground">{node.productName}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Descendants List */}
            {data.descendants.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Derived Products</h3>
                <div className="border rounded divide-y max-h-64 overflow-y-auto">
                  {data.descendants.map(node => (
                    <div key={node.lpId} className="p-2 text-sm">
                      <p className="font-mono">{node.lpNumber}</p>
                      <p className="text-muted-foreground">{node.productName}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Export Actions */}
            <div className="flex gap-2 justify-end">
              <Button onClick={handleExportExcel} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

---

### 5. Genealogy Badge (Mini Widget)

**File**: `components/warehouse/GenealogyBadge.tsx`

```typescript
'use client'

import { useLPGenealogy } from '@/lib/hooks/use-genealogy'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Network } from 'lucide-react'

interface GenealogyBadgeProps {
  lpId: string
}

export function GenealogyBadge({ lpId }: GenealogyBadgeProps) {
  const { data, isLoading } = useLPGenealogy(lpId, {
    direction: 'both',
    maxDepth: 1  // Shallow check
  })

  if (isLoading || !data?.hasGenealogy) {
    return null
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge variant="outline" className="gap-1">
          <Network className="h-3 w-3" />
          {data.summary.totalOperations}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">
          {data.summary.parentCount} source(s) | {data.summary.childCount} derived
        </p>
      </TooltipContent>
    </Tooltip>
  )
}
```

---

## Integration Patterns

### Pattern 1: Lazy Loading Genealogy

```typescript
'use client'

import { useState } from 'react'
import { useLPGenealogy } from '@/lib/hooks/use-genealogy'
import { Button } from '@/components/ui/button'
import { GenealogyTree } from '@/components/warehouse/GenealogyTree'

export function LPDetailWithLazyGenealogy({ lpId }: { lpId: string }) {
  const [showGenealogy, setShowGenealogy] = useState(false)

  const { data, isLoading } = useLPGenealogy(
    showGenealogy ? lpId : null,  // Only fetch when shown
    { direction: 'both', maxDepth: 3 }
  )

  return (
    <div>
      {/* Other LP details */}

      {!showGenealogy && (
        <Button onClick={() => setShowGenealogy(true)}>
          Show Genealogy
        </Button>
      )}

      {showGenealogy && isLoading && <div>Loading...</div>}

      {showGenealogy && data && <GenealogyTree data={data} />}
    </div>
  )
}
```

### Pattern 2: Incremental Depth Loading

```typescript
'use client'

import { useState } from 'react'
import { useLPGenealogy } from '@/lib/hooks/use-genealogy'
import { Button } from '@/components/ui/button'

export function GenealogyWithIncrementalDepth({ lpId }: { lpId: string }) {
  const [maxDepth, setMaxDepth] = useState(3)

  const { data, isLoading } = useLPGenealogy(lpId, {
    direction: 'both',
    maxDepth
  })

  const increaseDepth = () => {
    if (maxDepth < 10) {
      setMaxDepth(prev => prev + 2)
    }
  }

  return (
    <div>
      {/* Render genealogy tree */}

      {data?.hasMoreLevels.ancestors || data?.hasMoreLevels.descendants ? (
        <Button onClick={increaseDepth} disabled={isLoading || maxDepth >= 10}>
          Load More Levels
        </Button>
      ) : null}
    </div>
  )
}
```

### Pattern 3: Real-time Genealogy Updates

```typescript
'use client'

import { useQueryClient } from '@tanstack/react-query'
import { genealogyKeys } from '@/lib/hooks/use-genealogy'
import { LPGenealogyService } from '@/lib/services/lp-genealogy-service'
import { createClient } from '@/lib/supabase/client'

export function ProductionConsumptionForm({ woId, outputLpId }: Props) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const handleConsumption = async (consumedLpId: string, quantity: number) => {
    // Create genealogy link
    await LPGenealogyService.linkConsumption(supabase, {
      parentLpId: consumedLpId,
      childLpId: outputLpId,
      woId,
      quantity
    })

    // Invalidate genealogy cache for both LPs
    queryClient.invalidateQueries({
      queryKey: genealogyKeys.lpGenealogy(consumedLpId)
    })
    queryClient.invalidateQueries({
      queryKey: genealogyKeys.lpGenealogy(outputLpId)
    })
  }

  return (
    // ... form UI
  )
}
```

---

## Testing Components

### Unit Test Example

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GenealogyTree } from '@/components/warehouse/GenealogyTree'

const mockGenealogy = {
  lpId: 'lp-123',
  lpNumber: 'LP-2024-123',
  hasGenealogy: true,
  ancestors: [
    {
      lpId: 'lp-001',
      lpNumber: 'LP-2024-001',
      productName: 'Flour',
      operationType: 'consume',
      quantity: 50,
      operationDate: '2024-01-01',
      depth: 1,
      status: 'consumed',
      location: 'A-01',
      batchNumber: null
    }
  ],
  descendants: [],
  summary: {
    originalQuantity: 1000,
    splitOutTotal: 0,
    currentQuantity: 1000,
    childCount: 0,
    parentCount: 1,
    depth: { forward: 0, backward: 1 },
    totalOperations: 1,
    operationBreakdown: { split: 0, consume: 1, output: 0, merge: 0 }
  },
  hasMoreLevels: { ancestors: false, descendants: false }
}

describe('GenealogyTree', () => {
  it('renders genealogy tree with ancestors', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <GenealogyTree data={mockGenealogy} />
      </QueryClientProvider>
    )

    expect(screen.getByText('Source Materials (1)')).toBeInTheDocument()
    expect(screen.getByText('LP-2024-001')).toBeInTheDocument()
    expect(screen.getByText('Flour')).toBeInTheDocument()
  })

  it('shows "no genealogy" message when empty', () => {
    const emptyGenealogy = {
      ...mockGenealogy,
      hasGenealogy: false,
      ancestors: [],
      summary: { ...mockGenealogy.summary, parentCount: 0 }
    }

    render(
      <QueryClientProvider client={new QueryClient()}>
        <GenealogyTree data={emptyGenealogy} />
      </QueryClientProvider>
    )

    // Component should handle empty state gracefully
    expect(screen.queryByText('Source Materials')).not.toBeInTheDocument()
  })
})
```

---

## Best Practices

### 1. Always Handle Loading States

```typescript
const { data, isLoading, error } = useLPGenealogy(lpId)

if (isLoading) return <Skeleton />
if (error) return <ErrorAlert message={error.message} />
if (!data?.hasGenealogy) return <EmptyState />

return <GenealogyTree data={data} />
```

### 2. Optimize for Performance

```typescript
// Use shallow depth for UI displays
const { data } = useLPGenealogy(lpId, {
  direction: 'both',
  maxDepth: 3  // Sufficient for most cases
})

// Use deep search only when needed (recalls, investigations)
const { data: deepTrace } = useForwardTrace(lpId, 10, false)
```

### 3. Implement Cache Invalidation

```typescript
import { useQueryClient } from '@tanstack/react-query'
import { genealogyKeys } from '@/lib/hooks/use-genealogy'

const queryClient = useQueryClient()

// After creating genealogy link
await LPGenealogyService.linkConsumption(supabase, input)

// Invalidate affected queries
queryClient.invalidateQueries({
  queryKey: genealogyKeys.lpGenealogy(input.parentLpId)
})
queryClient.invalidateQueries({
  queryKey: genealogyKeys.lpGenealogy(input.childLpId)
})
```

### 4. Use Type Guards

```typescript
import type { GenealogyTree } from '@/lib/types/genealogy'

function isGenealogyTree(data: unknown): data is GenealogyTree {
  return (
    typeof data === 'object' &&
    data !== null &&
    'lpId' in data &&
    'hasGenealogy' in data &&
    'ancestors' in data &&
    'descendants' in data
  )
}

// Usage
if (isGenealogyTree(data)) {
  return <GenealogyTree data={data} />
}
```

---

## Related Documentation

- **API Reference**: [docs/api/lp-genealogy-tracking.md](../../api/lp-genealogy-tracking.md)
- **Service Guide**: [docs/guides/warehouse/lp-genealogy-service.md](./lp-genealogy-service.md)
- **React Hooks**: [docs/api/lp-genealogy-tracking.md#react-hooks](../../api/lp-genealogy-tracking.md#react-hooks)

---

## Summary

LP Genealogy Components:

- **Use React Query hooks** for data fetching and caching
- **Handle all states** (loading, error, empty)
- **Optimize depth** based on use case (3 for UI, 10 for investigations)
- **Invalidate cache** after mutations
- **Type-safe** via TypeScript interfaces

Ready to integrate genealogy tracking into any component!
