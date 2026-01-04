/**
 * Genealogy Tree Visualization Panel
 * Story 05.2: LP Genealogy Tracking
 *
 * Displays forward and backward traceability through recursive parent-child relationships
 */

'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ChevronRight, ChevronDown, AlertCircle, AlertTriangle, Network } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLPGenealogy } from '@/lib/hooks/use-genealogy'
import type { GenealogyTree, GenealogyNode, TreeNodeState } from '@/lib/types/genealogy'
import { GenealogyOperationBadge } from './GenealogyOperationBadge'
import { LPStatusBadge } from './LPStatusBadge'

interface GenealogyTreePanelProps {
  lpId: string
  lpNumber: string
  className?: string
}

export function GenealogyTreePanel({ lpId, lpNumber, className }: GenealogyTreePanelProps) {
  const [expandedNodes, setExpandedNodes] = useState<TreeNodeState>({})
  const [direction, setDirection] = useState<'both' | 'forward' | 'backward'>('both')

  const { data: genealogy, isLoading, error, refetch } = useLPGenealogy(lpId, {
    direction,
    maxDepth: 10,
  })

  // Default expand first 2 levels
  useMemo(() => {
    if (genealogy && !Object.keys(expandedNodes).length) {
      const initialExpanded: TreeNodeState = {}

      // Expand first 2 levels of ancestors
      genealogy.ancestors.forEach((node, idx) => {
        if (node.depth <= 2) {
          initialExpanded[`ancestor-${node.lpId}`] = true
        }
      })

      // Expand first 2 levels of descendants
      genealogy.descendants.forEach((node, idx) => {
        if (node.depth <= 2) {
          initialExpanded[`descendant-${node.lpId}`] = true
        }
      })

      setExpandedNodes(initialExpanded)
    }
  }, [genealogy])

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }))
  }

  const expandAll = () => {
    if (!genealogy) return
    const allExpanded: TreeNodeState = {}
    genealogy.ancestors.forEach((node) => {
      allExpanded[`ancestor-${node.lpId}`] = true
    })
    genealogy.descendants.forEach((node) => {
      allExpanded[`descendant-${node.lpId}`] = true
    })
    setExpandedNodes(allExpanded)
  }

  const collapseAll = () => {
    setExpandedNodes({})
  }

  // Loading State
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)} data-testid="genealogy-loading">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">License Plate Genealogy</h3>
        </div>
        <div className="space-y-4 p-6 border rounded-lg">
          <div className="text-sm text-muted-foreground mb-4">Loading genealogy tree...</div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6 ml-8" />
          <Skeleton className="h-4 w-4/6 ml-16" />
          <Skeleton className="h-4 w-5/6 ml-8" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className={cn('space-y-4', className)} data-testid="genealogy-error">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">License Plate Genealogy</h3>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to Load Genealogy Tree</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>Unable to retrieve genealogy data from the server.</p>
            <p className="text-sm">
              Error Code: GENEALOGY_QUERY_FAILED
              <br />
              Message: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <div className="mt-4 space-y-1 text-sm">
              <p className="font-medium">Possible causes:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Complex genealogy tree (&gt;100 nodes)</li>
                <li>Database performance issue</li>
                <li>Network connectivity problem</li>
              </ul>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry Query
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDirection('forward')}
              >
                Forward Trace Only
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Empty State - No Genealogy
  if (!genealogy || !genealogy.hasGenealogy) {
    return (
      <div className={cn('space-y-4', className)} data-testid="genealogy-empty">
        <h3 className="text-lg font-semibold">License Plate Genealogy</h3>
        <div className="border rounded-lg p-12 text-center space-y-6">
          <div className="flex justify-center">
            <Network className="h-16 w-16 text-muted-foreground/50" />
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-lg">No Genealogy History</h4>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              This license plate has no split, merge, or consumption history yet.
            </p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              This is an original LP from receipt with no parent or child LPs.
            </p>
          </div>
          <div className="max-w-sm mx-auto border rounded-lg p-4 space-y-2 text-sm">
            <div className="font-semibold">Genealogy will be created when:</div>
            <ul className="text-left space-y-1 text-muted-foreground">
              <li>• LP is split into smaller quantities</li>
              <li>• LP is merged with other LPs</li>
              <li>• LP is consumed in production</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  // Success State - Display Tree
  return (
    <div className={cn('space-y-4', className)} data-testid="genealogy-tree">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-semibold">License Plate Genealogy</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
          <div className="flex gap-1 border rounded-md p-1">
            <Button
              variant={direction === 'both' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setDirection('both')}
              className="text-xs"
            >
              Both
            </Button>
            <Button
              variant={direction === 'forward' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setDirection('forward')}
              className="text-xs"
            >
              Forward Only
            </Button>
            <Button
              variant={direction === 'backward' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setDirection('backward')}
              className="text-xs"
            >
              Backward Only
            </Button>
          </div>
        </div>
      </div>

      {/* Depth Limit Warning */}
      {(genealogy.hasMoreLevels.ancestors || genealogy.hasMoreLevels.descendants) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Genealogy Depth Limit Reached</AlertTitle>
          <AlertDescription>
            This genealogy tree exceeds the maximum depth of 10 levels. Only the first 10 levels
            are displayed. There may be additional ancestors or descendants beyond what is shown.
            <div className="mt-2 text-sm text-muted-foreground">
              Total nodes displayed: {genealogy.ancestors.length + genealogy.descendants.length} |
              Estimated total: {genealogy.summary.totalOperations}+
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Tree Visualization */}
      <div className="border rounded-lg p-6 space-y-6">
        {/* ANCESTORS Section */}
        {direction !== 'forward' && genealogy.ancestors.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                ANCESTORS (Where This Came From)
              </h4>
              <span className="text-xs text-muted-foreground">
                {genealogy.summary.depth.backward} levels backward
              </span>
            </div>
            <div className="border-t-2 pt-4 space-y-2">
              {genealogy.ancestors.map((node) => (
                <GenealogyTreeNode
                  key={`ancestor-${node.lpId}`}
                  node={node}
                  nodeId={`ancestor-${node.lpId}`}
                  isExpanded={expandedNodes[`ancestor-${node.lpId}`]}
                  onToggle={toggleNode}
                  direction="backward"
                />
              ))}
            </div>
          </div>
        )}

        {/* CURRENT LP Section */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            CURRENT LP
          </h4>
          <div className="border-t-2 pt-4">
            <div className="flex items-start gap-3 p-3 bg-primary/5 border-l-4 border-primary rounded-r">
              <div className="flex-shrink-0 mt-1">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{lpNumber}</span>
                  <span className="text-sm text-muted-foreground">
                    {genealogy.summary.currentQuantity.toLocaleString()} kg
                  </span>
                  <LPStatusBadge status="available" size="sm" />
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="font-medium">Status Summary:</div>
                  <div>• Original quantity: {genealogy.summary.originalQuantity.toLocaleString()} kg</div>
                  <div>• Split out: {genealogy.summary.splitOutTotal.toLocaleString()} kg ({genealogy.summary.operationBreakdown.split} operations)</div>
                  <div>• Remaining: {genealogy.summary.currentQuantity.toLocaleString()} kg</div>
                  <div>• Has parent: {genealogy.summary.parentCount > 0 ? 'Yes' : 'No (original receipt)'}</div>
                  <div>• Has children: {genealogy.summary.childCount > 0 ? `Yes (${genealogy.summary.childCount} child LPs)` : 'No'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DESCENDANTS Section */}
        {direction !== 'backward' && genealogy.descendants.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                DESCENDANTS (Where This Went)
              </h4>
              <span className="text-xs text-muted-foreground">
                {genealogy.summary.depth.forward} levels forward
              </span>
            </div>
            <div className="border-t-2 pt-4 space-y-2">
              {genealogy.descendants.map((node) => (
                <GenealogyTreeNode
                  key={`descendant-${node.lpId}`}
                  node={node}
                  nodeId={`descendant-${node.lpId}`}
                  isExpanded={expandedNodes[`descendant-${node.lpId}`]}
                  onToggle={toggleNode}
                  direction="forward"
                />
              ))}
            </div>
          </div>
        )}

        {/* Tree Summary */}
        <div className="border-t pt-4 space-y-2 text-sm">
          <div className="font-semibold">Tree Summary:</div>
          <div className="grid grid-cols-2 gap-2 text-muted-foreground">
            <div>
              • Total operations: {genealogy.summary.totalOperations} (
              {genealogy.summary.operationBreakdown.split} splits,{' '}
              {genealogy.summary.operationBreakdown.consume} consumptions,{' '}
              {genealogy.summary.operationBreakdown.merge} merges,{' '}
              {genealogy.summary.operationBreakdown.output} outputs)
            </div>
            <div>• Tree depth: {genealogy.summary.depth.forward} levels (forward), {genealogy.summary.depth.backward} levels (backward)</div>
            <div>• Total child LPs: {genealogy.summary.childCount}</div>
            <div>
              • Allocated:{' '}
              {(
                (genealogy.summary.splitOutTotal / genealogy.summary.originalQuantity) *
                100
              ).toFixed(1)}
              %
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="text-xs text-muted-foreground space-y-2 px-2">
        <div className="font-semibold">Genealogy Legend:</div>
        <div className="flex flex-wrap gap-4">
          <span>[▼] Expanded node</span>
          <span>[▶] Collapsed node</span>
          <span>◉ Current LP</span>
          <span>[Available] Status badge</span>
        </div>
        <div className="font-semibold mt-2">Operation Types:</div>
        <div className="flex flex-wrap gap-4">
          <span>SPLIT - LP split into smaller quantity</span>
          <span>CONSUME - LP used in production</span>
          <span>MERGE - Multiple LPs combined</span>
          <span>OUTPUT - LP created from production</span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Tree Node Component
// ============================================================================

interface GenealogyTreeNodeProps {
  node: GenealogyNode
  nodeId: string
  isExpanded: boolean
  onToggle: (nodeId: string) => void
  direction: 'forward' | 'backward'
}

function GenealogyTreeNode({
  node,
  nodeId,
  isExpanded,
  onToggle,
  direction,
}: GenealogyTreeNodeProps) {
  const hasChildren = node.outputLps && node.outputLps.length > 0

  return (
    <div
      className="border-l-2 border-muted pl-4 space-y-2"
      style={{ marginLeft: `${node.depth * 16}px` }}
    >
      <div className="flex items-start gap-2">
        {/* Expand/Collapse Icon */}
        {hasChildren ? (
          <button
            onClick={() => onToggle(nodeId)}
            className="flex-shrink-0 mt-1 hover:bg-muted rounded p-0.5"
            aria-label={isExpanded ? 'Collapse node' : 'Expand node'}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-5 h-4" />
        )}

        {/* Node Content */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <GenealogyOperationBadge operation={node.operationType} />
            <button
              className="font-medium hover:underline"
              onClick={() => {
                // Navigate to LP detail page
                window.location.href = `/warehouse/license-plates/${node.lpId}`
              }}
            >
              {node.lpNumber}
            </button>
            <span className="text-sm text-muted-foreground">
              {node.quantity.toLocaleString()} kg
            </span>
            <LPStatusBadge status={node.status as any} size="sm" />
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <div>{node.productName} | Batch: {node.batchNumber || 'N/A'}</div>
            <div>Location: {node.location}</div>
            <div>Date: {new Date(node.operationDate).toLocaleString()}</div>
            {node.woNumber && (
              <div>
                Work Order:{' '}
                <button
                  className="hover:underline text-primary"
                  onClick={() => {
                    window.location.href = `/production/work-orders/${node.woId}`
                  }}
                >
                  {node.woNumber}
                </button>
              </div>
            )}
            {node.reservedFor && (
              <div>
                Reserved for: {node.reservedFor.type} - {node.reservedFor.number}
              </div>
            )}
          </div>

          {/* Output LPs (if expanded) */}
          {isExpanded && hasChildren && node.outputLps && (
            <div className="ml-4 border-l-2 border-muted pl-4 mt-2 space-y-2">
              {node.outputLps.map((output) => (
                <div key={output.lpId} className="text-xs space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      className="font-medium hover:underline"
                      onClick={() => {
                        window.location.href = `/warehouse/license-plates/${output.lpId}`
                      }}
                    >
                      {output.lpNumber}
                    </button>
                    <span className="text-muted-foreground">
                      {output.quantity.toLocaleString()} kg
                    </span>
                    <LPStatusBadge status={output.status as any} size="sm" />
                  </div>
                  <div className="text-muted-foreground">
                    {output.productName} | {output.location}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
