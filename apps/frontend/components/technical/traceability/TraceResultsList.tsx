/**
 * TraceResultsList Component
 * Story 02.10b: Traceability Queries UI
 *
 * Displays trace results as a list/table with LP details.
 * Supports all 4 UI states: loading, error, empty, success.
 * Keyboard navigable for accessibility.
 */

'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AlertCircle, RefreshCw, Package, ChevronRight } from 'lucide-react'
import type { TraceResult, TraceNode, LicensePlate } from '@/lib/types/traceability'

// ============================================================================
// TYPES
// ============================================================================

interface TraceResultsListProps {
  /** Trace result data */
  data: TraceResult | null
  /** Loading state */
  loading?: boolean
  /** Error object if any */
  error?: Error | null
  /** Callback to retry failed request */
  onRetry?: () => void
  /** Callback when LP row is clicked */
  onLPClick?: (lpId: string) => void
  /** Direction of trace (affects labels) */
  direction?: 'forward' | 'backward'
}

interface FlattenedNode {
  lp: LicensePlate
  product_code: string
  product_name: string
  depth: number
  relationship_type: string | null
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Flatten trace tree into a list for table display
 */
function flattenTraceTree(nodes: TraceNode[], maxDepth: number = 10): FlattenedNode[] {
  const result: FlattenedNode[] = []

  function traverse(nodeList: TraceNode[], currentDepth: number) {
    if (currentDepth > maxDepth) return

    for (const node of nodeList) {
      result.push({
        lp: node.lp,
        product_code: node.product_code || node.lp.product_id,
        product_name: node.product_name || 'Unknown Product',
        depth: node.depth ?? currentDepth,
        relationship_type: node.relationship_type,
      })

      if (node.children?.length) {
        traverse(node.children, currentDepth + 1)
      }
    }
  }

  traverse(nodes, 1)
  return result
}

/**
 * Get status badge variant
 */
function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'available':
      return 'default'
    case 'consumed':
      return 'secondary'
    case 'shipped':
      return 'outline'
    case 'quarantine':
    case 'recalled':
      return 'destructive'
    default:
      return 'secondary'
  }
}

// ============================================================================
// LOADING STATE
// ============================================================================

function TraceResultsListLoading() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading trace results">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="border rounded-lg">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ERROR STATE
// ============================================================================

interface TraceResultsListErrorProps {
  error: Error
  onRetry?: () => void
}

function TraceResultsListError({ error, onRetry }: TraceResultsListErrorProps) {
  return (
    <div
      className="flex flex-col items-center justify-center p-8 border rounded-lg bg-destructive/5"
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle className="h-12 w-12 text-destructive mb-4" aria-hidden="true" />
      <h3 className="text-lg font-semibold text-destructive mb-2">Failed to Load Trace Results</h3>
      <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
        {error.message || 'An unexpected error occurred while tracing. Please try again.'}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Retry
        </Button>
      )}
    </div>
  )
}

// ============================================================================
// EMPTY STATE
// ============================================================================

interface TraceResultsListEmptyProps {
  direction: 'forward' | 'backward'
}

function TraceResultsListEmpty({ direction }: TraceResultsListEmptyProps) {
  return (
    <div
      className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/50"
      role="status"
      aria-live="polite"
    >
      <Package className="h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
      <h3 className="text-lg font-semibold mb-2">No Trace Results</h3>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        {direction === 'forward'
          ? 'No downstream products or lots were found for this license plate.'
          : 'No upstream sources or ingredients were found for this license plate.'}
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        The lot may not have been consumed or produced yet.
      </p>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TraceResultsList({
  data,
  loading = false,
  error = null,
  onRetry,
  onLPClick,
  direction = 'forward',
}: TraceResultsListProps) {
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1)

  // Flatten the tree for table display
  const flattenedResults = data?.trace_tree ? flattenTraceTree(data.trace_tree) : []

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number, lpId: string) => {
      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault()
          onLPClick?.(lpId)
          break
        case 'ArrowDown':
          event.preventDefault()
          if (index < flattenedResults.length - 1) {
            setFocusedRowIndex(index + 1)
          }
          break
        case 'ArrowUp':
          event.preventDefault()
          if (index > 0) {
            setFocusedRowIndex(index - 1)
          }
          break
      }
    },
    [flattenedResults.length, onLPClick]
  )

  // Loading state
  if (loading) {
    return <TraceResultsListLoading />
  }

  // Error state
  if (error) {
    return <TraceResultsListError error={error} onRetry={onRetry} />
  }

  // Empty state - no data or empty trace tree
  if (!data || flattenedResults.length === 0) {
    return <TraceResultsListEmpty direction={direction} />
  }

  // Success state
  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {direction === 'forward' ? 'Downstream Products' : 'Upstream Sources'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {flattenedResults.length} {flattenedResults.length === 1 ? 'item' : 'items'} found
            {data.summary?.max_depth && ` across ${data.summary.max_depth} levels`}
          </p>
        </div>
        {data.root_lp && (
          <Badge variant="outline" className="text-sm">
            Root: {data.root_lp.lp_number || data.root_lp.id}
          </Badge>
        )}
      </div>

      {/* Results Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Depth</TableHead>
              <TableHead>LP Number</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flattenedResults.map((node, index) => (
              <TableRow
                key={`${node.lp.id}-${index}`}
                className="cursor-pointer hover:bg-muted/50 focus-within:bg-muted/50"
                tabIndex={0}
                role="button"
                aria-label={`View details for ${node.lp.lp_number || node.lp.id}`}
                onClick={() => onLPClick?.(node.lp.id)}
                onKeyDown={(e) => handleKeyDown(e, index, node.lp.id)}
                data-focused={focusedRowIndex === index}
              >
                <TableCell>
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium"
                    aria-label={`Depth level ${node.depth}`}
                  >
                    {node.depth}
                  </span>
                </TableCell>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2">
                    {node.depth > 1 && (
                      <span
                        className="text-muted-foreground"
                        style={{ paddingLeft: `${(node.depth - 1) * 8}px` }}
                        aria-hidden="true"
                      >
                        |--
                      </span>
                    )}
                    {node.lp.lp_number || node.lp.id.slice(0, 8)}
                  </span>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{node.product_code}</div>
                    <div className="text-sm text-muted-foreground">{node.product_name}</div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="tabular-nums">
                    {node.lp.quantity?.toFixed(2) || '0.00'}
                  </span>
                  <span className="text-muted-foreground ml-1">{node.lp.uom || 'EA'}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(node.lp.status)}>
                    {node.lp.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Link to LP detail */}
      {onLPClick && (
        <p className="text-xs text-muted-foreground text-center">
          Click a row to view LP details. Use arrow keys to navigate, Enter to select.
        </p>
      )}
    </div>
  )
}

export default TraceResultsList
