/**
 * TraceResultsTree Component
 * Story 02.10b: Traceability Queries UI
 *
 * Tree visualization wrapper for trace results using GenealogyTree.
 * Supports all 4 UI states: loading, error, empty, success.
 * Keyboard navigable for accessibility.
 */

'use client'

import { useCallback } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, RefreshCw, TreeDeciduous, Info } from 'lucide-react'
import { GenealogyTree } from '@/components/technical/GenealogyTree'
import type { TraceResult } from '@/lib/types/traceability'

// ============================================================================
// TYPES
// ============================================================================

interface TraceResultsTreeProps {
  /** Trace result data */
  data: TraceResult | null
  /** Loading state */
  loading?: boolean
  /** Error object if any */
  error?: Error | null
  /** Callback to retry failed request */
  onRetry?: () => void
  /** Callback when node is clicked */
  onNodeClick?: (nodeId: string) => void
  /** Direction of trace (affects visualization) */
  direction?: 'forward' | 'backward'
  /** Additional className */
  className?: string
}

// ============================================================================
// LOADING STATE
// ============================================================================

function TraceResultsTreeLoading({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent>
        <div
          className="h-[500px] border rounded-lg bg-muted/20 flex items-center justify-center"
          role="status"
          aria-label="Loading tree visualization"
        >
          <div className="text-center space-y-4">
            <Skeleton className="h-8 w-8 rounded-full mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
            <div className="flex justify-center gap-4">
              <Skeleton className="h-24 w-40" />
              <Skeleton className="h-24 w-40" />
              <Skeleton className="h-24 w-40" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// ERROR STATE
// ============================================================================

interface TraceResultsTreeErrorProps {
  error: Error
  onRetry?: () => void
  className?: string
}

function TraceResultsTreeError({ error, onRetry, className }: TraceResultsTreeErrorProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TreeDeciduous className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          Genealogy Tree
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="flex flex-col items-center justify-center p-8 h-[400px] border rounded-lg bg-destructive/5"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="h-12 w-12 text-destructive mb-4" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-destructive mb-2">
            Failed to Load Tree Visualization
          </h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            {error.message || 'An unexpected error occurred while building the tree. Please try again.'}
          </p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// EMPTY STATE
// ============================================================================

interface TraceResultsTreeEmptyProps {
  direction: 'forward' | 'backward'
  className?: string
}

function TraceResultsTreeEmpty({ direction, className }: TraceResultsTreeEmptyProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TreeDeciduous className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          Genealogy Tree
        </CardTitle>
        <CardDescription>
          {direction === 'forward' ? 'Forward trace visualization' : 'Backward trace visualization'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="flex flex-col items-center justify-center p-8 h-[400px] border rounded-lg bg-muted/50"
          role="status"
          aria-live="polite"
        >
          <Info className="h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
          <h3 className="text-lg font-semibold mb-2">No Tree Data</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {direction === 'forward'
              ? 'No downstream genealogy found. This lot may not have been used in production yet.'
              : 'No upstream genealogy found. This may be a raw material or initial receipt.'}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Run a trace search to populate the tree visualization.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TraceResultsTree({
  data,
  loading = false,
  error = null,
  onRetry,
  onNodeClick,
  direction = 'forward',
  className,
}: TraceResultsTreeProps) {
  // Handle node click with keyboard support
  const handleNodeClick = useCallback(
    (nodeId: string) => {
      onNodeClick?.(nodeId)
    },
    [onNodeClick]
  )

  // Loading state
  if (loading) {
    return <TraceResultsTreeLoading className={className} />
  }

  // Error state
  if (error) {
    return <TraceResultsTreeError error={error} onRetry={onRetry} className={className} />
  }

  // Empty state - no data or empty trace tree
  if (!data || !data.trace_tree || data.trace_tree.length === 0) {
    return <TraceResultsTreeEmpty direction={direction} className={className} />
  }

  // Calculate tree stats
  const totalNodes = countNodes(data.trace_tree)
  const maxDepth = data.summary?.max_depth || calculateMaxDepth(data.trace_tree)

  // Success state
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TreeDeciduous className="h-5 w-5 text-green-600" aria-hidden="true" />
              Genealogy Tree
            </CardTitle>
            <CardDescription>
              {direction === 'forward' ? 'Forward trace' : 'Backward trace'} from{' '}
              {data.root_lp?.lp_number || 'root LP'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {totalNodes} {totalNodes === 1 ? 'node' : 'nodes'}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {maxDepth} {maxDepth === 1 ? 'level' : 'levels'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="border rounded-lg overflow-hidden"
          role="tree"
          aria-label={`${direction} genealogy tree with ${totalNodes} nodes`}
        >
          <GenealogyTree
            traceTree={data.trace_tree}
            direction={direction}
            onNodeClick={handleNodeClick}
          />
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3">
          Pan: Click and drag | Zoom: Mouse wheel | Click a node for details
        </p>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Count total nodes in trace tree
 */
function countNodes(nodes: TraceResult['trace_tree']): number {
  let count = 0

  function traverse(nodeList: TraceResult['trace_tree']) {
    for (const node of nodeList) {
      count++
      if (node.children?.length) {
        traverse(node.children)
      }
    }
  }

  traverse(nodes)
  return count
}

/**
 * Calculate max depth of trace tree
 */
function calculateMaxDepth(nodes: TraceResult['trace_tree']): number {
  let maxDepth = 0

  function traverse(nodeList: TraceResult['trace_tree'], currentDepth: number) {
    for (const node of nodeList) {
      maxDepth = Math.max(maxDepth, currentDepth)
      if (node.children?.length) {
        traverse(node.children, currentDepth + 1)
      }
    }
  }

  traverse(nodes, 1)
  return maxDepth
}

export default TraceResultsTree
