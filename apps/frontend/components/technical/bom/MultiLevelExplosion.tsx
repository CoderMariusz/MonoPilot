/**
 * MultiLevelExplosion Component (Story 02.14)
 * Hierarchical tree view of BOM explosion
 * FR-2.29: Multi-level BOM explosion
 *
 * Features:
 * - Collapsible tree structure
 * - Level indentation with visual guides
 * - Cumulative quantity calculation
 * - Highlight raw materials at leaf nodes
 * - Raw materials summary at bottom
 * - All 4 UI states (loading, error, empty, success)
 * - Keyboard navigation
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Package,
  Layers,
  Box,
  AlertTriangle,
  RefreshCw,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useBOMExplosion, buildExplosionTree, flattenTree } from '@/lib/hooks/use-bom-explosion'
import { cn } from '@/lib/utils'
import type { ExplosionTreeNode, RawMaterialSummary } from '@/lib/types/bom-advanced'

// ========================================
// Props Interface
// ========================================

export interface MultiLevelExplosionProps {
  /** BOM ID to explode */
  bomId: string
  /** Maximum depth to traverse (default 10) */
  maxDepth?: number
  /** Additional className */
  className?: string
}

// ========================================
// Component Type Icons & Colors
// ========================================

const componentTypeConfig: Record<string, {
  icon: React.ElementType
  color: string
  bgColor: string
  label: string
}> = {
  raw: {
    icon: Package,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'Raw Material',
  },
  wip: {
    icon: Layers,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'WIP',
  },
  finished: {
    icon: Box,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    label: 'Finished',
  },
  packaging: {
    icon: Package,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    label: 'Packaging',
  },
  RM: {
    icon: Package,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'Raw Material',
  },
  ING: {
    icon: Package,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'Ingredient',
  },
  WIP: {
    icon: Layers,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'WIP',
  },
  FG: {
    icon: Box,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    label: 'Finished',
  },
  PKG: {
    icon: Package,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    label: 'Packaging',
  },
}

const getTypeConfig = (type: string) => {
  return componentTypeConfig[type] || componentTypeConfig.raw
}

// ========================================
// TreeNode Component
// ========================================

interface TreeNodeProps {
  node: ExplosionTreeNode
  expandedNodes: Set<string>
  onToggle: (nodeId: string) => void
  depth: number
}

function TreeNode({ node, expandedNodes, onToggle, depth }: TreeNodeProps) {
  const isExpanded = expandedNodes.has(node.item_id)
  const hasChildren = node.children && node.children.length > 0
  const typeConfig = getTypeConfig(node.component_type)
  const Icon = typeConfig.icon

  // Calculate indentation
  const indent = depth * 24

  return (
    <>
      <TableRow
        className={cn(
          'hover:bg-gray-50 transition-colors',
          !hasChildren && 'bg-green-50/50' // Highlight leaf nodes (raw materials)
        )}
      >
        {/* Expand/Collapse + Component */}
        <TableCell className="py-2">
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${indent}px` }}
          >
            {/* Expand/Collapse Button */}
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onToggle(node.item_id)}
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                aria-expanded={isExpanded}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <div className="w-6" /> // Spacer for alignment
            )}

            {/* Component Icon */}
            <div className={cn('p-1 rounded', typeConfig.bgColor)}>
              <Icon className={cn('h-4 w-4', typeConfig.color)} />
            </div>

            {/* Component Info */}
            <div>
              <span className="font-mono font-medium">{node.component_code}</span>
              <span className="text-muted-foreground ml-2 text-sm">{node.component_name}</span>
            </div>
          </div>
        </TableCell>

        {/* Level Badge */}
        <TableCell className="text-center">
          <Badge variant="outline" className="font-mono text-xs">
            L{node.level}
          </Badge>
        </TableCell>

        {/* Type */}
        <TableCell>
          <Badge className={cn('text-xs', typeConfig.bgColor, typeConfig.color, 'border-0')}>
            {typeConfig.label}
          </Badge>
        </TableCell>

        {/* Direct Quantity */}
        <TableCell className="text-right font-mono">
          {node.quantity.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 4,
          })} {node.uom}
        </TableCell>

        {/* Cumulative Quantity */}
        <TableCell className="text-right font-mono font-medium">
          {node.cumulative_qty.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 4,
          })} {node.uom}
        </TableCell>

        {/* Scrap */}
        <TableCell className="text-right text-muted-foreground">
          {node.scrap_percent > 0 ? `${node.scrap_percent.toFixed(1)}%` : '-'}
        </TableCell>
      </TableRow>

      {/* Render children if expanded */}
      {isExpanded && hasChildren && (
        node.children.map((child) => (
          <TreeNode
            key={child.item_id}
            node={child}
            expandedNodes={expandedNodes}
            onToggle={onToggle}
            depth={depth + 1}
          />
        ))
      )}
    </>
  )
}

// ========================================
// Raw Materials Summary Component
// ========================================

interface RawMaterialsSummaryProps {
  summary: RawMaterialSummary[]
}

function RawMaterialsSummary({ summary }: RawMaterialsSummaryProps) {
  if (summary.length === 0) return null

  return (
    <Card className="bg-green-50 border-green-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 text-green-800">
          <Package className="h-5 w-5" />
          Raw Materials Summary
        </CardTitle>
        <CardDescription className="text-green-700">
          Total quantities needed across all levels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-green-100/50">
              <TableHead>Component</TableHead>
              <TableHead className="text-right">Total Quantity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summary.map((item) => (
              <TableRow key={item.component_id}>
                <TableCell>
                  <div>
                    <span className="font-mono font-medium">{item.component_code}</span>
                    <span className="text-muted-foreground ml-2 text-sm">{item.component_name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono font-medium">
                  {item.total_qty.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 4,
                  })} {item.uom}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// ========================================
// MultiLevelExplosion Component
// ========================================

export function MultiLevelExplosion({
  bomId,
  maxDepth = 10,
  className,
}: MultiLevelExplosionProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  const {
    data: explosionData,
    isLoading,
    error,
    refetch,
  } = useBOMExplosion(bomId, maxDepth)

  // Build tree structure
  const treeNodes = useMemo(() => {
    if (!explosionData) return []
    return buildExplosionTree(explosionData)
  }, [explosionData])

  // Initialize expanded nodes (expand first 2 levels)
  React.useEffect(() => {
    if (explosionData) {
      const initialExpanded = new Set<string>()
      for (const level of explosionData.levels) {
        if (level.level <= 2) {
          for (const item of level.items) {
            initialExpanded.add(item.item_id)
          }
        }
      }
      setExpandedNodes(initialExpanded)
    }
  }, [explosionData])

  // Toggle node expansion
  const handleToggle = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }, [])

  // Expand all / Collapse all
  const expandAll = useCallback(() => {
    if (!explosionData) return
    const allNodes = new Set<string>()
    for (const level of explosionData.levels) {
      for (const item of level.items) {
        allNodes.add(item.item_id)
      }
    }
    setExpandedNodes(allNodes)
  }, [explosionData])

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set())
  }, [])

  // Loading State
  if (isLoading) {
    return <MultiLevelExplosionLoading className={className} />
  }

  // Error State
  if (error) {
    const isCircularError = error.message.includes('circular')

    return (
      <Card className={cn('border-destructive/50', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            BOM Explosion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant={isCircularError ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{isCircularError ? 'Circular Reference Detected' : 'Error'}</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error.message}</span>
              {!isCircularError && (
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Empty State
  if (!explosionData || treeNodes.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-500" />
            Multi-Level Explosion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No items found in this BOM. Add items to see the explosion view.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Success State
  return (
    <div className={cn('space-y-6', className)}>
      {/* Main Explosion Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-500" />
                Multi-Level Explosion
              </CardTitle>
              <CardDescription>
                {explosionData.product_code}: {explosionData.product_name} |
                Output: {explosionData.output_qty} {explosionData.output_uom} |
                {explosionData.total_levels} levels, {explosionData.total_items} items
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Collapse All
              </Button>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[40%]">Component</TableHead>
                  <TableHead className="text-center w-[8%]">Level</TableHead>
                  <TableHead className="w-[12%]">Type</TableHead>
                  <TableHead className="text-right w-[15%]">Direct Qty</TableHead>
                  <TableHead className="text-right w-[15%]">Cumulative</TableHead>
                  <TableHead className="text-right w-[10%]">Scrap</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {treeNodes.map((node) => (
                  <TreeNode
                    key={node.item_id}
                    node={node}
                    expandedNodes={expandedNodes}
                    onToggle={handleToggle}
                    depth={0}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Raw Materials Summary */}
      <RawMaterialsSummary summary={explosionData.raw_materials_summary} />
    </div>
  )
}

// ========================================
// Loading Skeleton
// ========================================

function MultiLevelExplosionLoading({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <div className="h-12 bg-gray-50" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default MultiLevelExplosion
