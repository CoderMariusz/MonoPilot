/**
 * Traceability Viewer Component
 * Story 5.28: Forward/Backward Traceability
 *
 * Displays LP genealogy tree/timeline with:
 * - Tree visualization with operation type badges
 * - Clickable source document links (GRN, WO)
 * - Export to CSV functionality
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LPStatusBadge } from '@/components/warehouse/LPStatusBadge'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  ArrowRight,
  ArrowLeft,
  Download,
  Loader2,
  Package,
  Calendar,
  FileText,
  Factory,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { format } from 'date-fns'

// ============================================
// Types
// ============================================

interface TraceNode {
  lp_id: string
  lp_number: string
  product_id: string
  product_code: string
  product_name: string
  current_qty: number
  uom: string
  status: string
  batch_number: string | null
  expiry_date: string | null
  operation_type: string
  wo_id: string | null
  wo_number: string | null
  grn_id: string | null
  grn_number: string | null
  quantity_used: number
  relationship_created_at: string
  depth: number
}

interface TraceTree {
  root: {
    lp_id: string
    lp_number: string
    product_code: string
    product_name: string
    current_qty: number
    status: string
  }
  nodes: TraceNode[]
  summary: {
    total_count: number
    max_depth: number
    by_operation_type: Record<string, number>
    by_status: Record<string, number>
  }
}

interface TraceabilityViewerProps {
  lpId: string
  lpNumber?: string
  className?: string
}

// ============================================
// Operation Type Badge Colors
// ============================================

const operationTypeConfig: Record<string, { color: string; label: string }> = {
  split: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Split' },
  merge: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Merge' },
  combine: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Combine' },
  consume: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Consume' },
  production: { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Production' },
  transform: { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Transform' },
}

function OperationTypeBadge({ type }: { type: string }) {
  const config = operationTypeConfig[type] || {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    label: type,
  }

  return (
    <Badge variant="outline" className={cn('text-xs', config.color)}>
      {config.label}
    </Badge>
  )
}

// ============================================
// Trace Node Component
// ============================================

interface TraceNodeItemProps {
  node: TraceNode
  direction: 'forward' | 'backward'
  onLPClick: (lpId: string) => void
  onWOClick?: (woId: string) => void
  onGRNClick?: (grnId: string) => void
}

function TraceNodeItem({
  node,
  direction,
  onLPClick,
  onWOClick,
  onGRNClick,
}: TraceNodeItemProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div
      className={cn(
        'relative',
        node.depth > 1 && 'ml-6'
      )}
    >
      {/* Connector line */}
      {node.depth > 1 && (
        <div className="absolute left-[-12px] top-0 bottom-0 w-px bg-border" />
      )}

      <div
        className={cn(
          'group border rounded-lg p-3 mb-2 transition-all hover:shadow-sm cursor-pointer',
          'hover:border-primary/50 hover:bg-muted/30'
        )}
        onClick={() => onLPClick(node.lp_id)}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-mono font-medium text-sm group-hover:text-primary truncate">
              {node.lp_number}
            </span>
            <LPStatusBadge status={node.status as any} />
            <OperationTypeBadge type={node.operation_type} />
          </div>

          <div className="text-right flex-shrink-0">
            <div className="text-sm font-medium">
              {node.current_qty} {node.uom}
            </div>
            <div className="text-xs text-muted-foreground">
              ({node.quantity_used} used)
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="mt-2 ml-6 text-xs text-muted-foreground space-y-1">
          <div>
            <span className="font-medium">{node.product_code}</span> - {node.product_name}
          </div>

          {node.batch_number && (
            <div>Batch: {node.batch_number}</div>
          )}

          {node.expiry_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Expires: {format(new Date(node.expiry_date), 'MMM d, yyyy')}
            </div>
          )}

          {/* Source Document Links */}
          <div className="flex items-center gap-3 mt-1">
            {node.wo_number && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onWOClick?.(node.wo_id!)
                }}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
              >
                <Factory className="h-3 w-3" />
                WO: {node.wo_number}
              </button>
            )}

            {node.grn_number && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onGRNClick?.(node.grn_id!)
                }}
                className="flex items-center gap-1 text-green-600 hover:text-green-800 hover:underline"
              >
                <FileText className="h-3 w-3" />
                GRN: {node.grn_number}
              </button>
            )}

            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(node.relationship_created_at), 'MMM d, yyyy HH:mm')}
            </span>
          </div>
        </div>

        {/* Depth indicator */}
        <div className="absolute left-[-20px] top-4 w-4 h-px bg-border" />
      </div>
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export function TraceabilityViewer({
  lpId,
  lpNumber,
  className,
}: TraceabilityViewerProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<'forward' | 'backward'>('forward')
  const [forwardData, setForwardData] = useState<TraceTree | null>(null)
  const [backwardData, setBackwardData] = useState<TraceTree | null>(null)
  const [loadingForward, setLoadingForward] = useState(false)
  const [loadingBackward, setLoadingBackward] = useState(false)
  const [executionTime, setExecutionTime] = useState<{ forward?: number; backward?: number }>({})

  // Fetch forward trace
  const fetchForwardTrace = useCallback(async () => {
    try {
      setLoadingForward(true)
      const response = await fetch(`/api/warehouse/license-plates/${lpId}/trace/forward`)

      if (!response.ok) {
        throw new Error('Failed to fetch forward trace')
      }

      const result = await response.json()
      setForwardData(result.data)
      setExecutionTime(prev => ({ ...prev, forward: result.meta?.execution_time_ms }))
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load forward trace',
        variant: 'destructive',
      })
    } finally {
      setLoadingForward(false)
    }
  }, [lpId, toast])

  // Fetch backward trace
  const fetchBackwardTrace = useCallback(async () => {
    try {
      setLoadingBackward(true)
      const response = await fetch(`/api/warehouse/license-plates/${lpId}/trace/backward`)

      if (!response.ok) {
        throw new Error('Failed to fetch backward trace')
      }

      const result = await response.json()
      setBackwardData(result.data)
      setExecutionTime(prev => ({ ...prev, backward: result.meta?.execution_time_ms }))
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load backward trace',
        variant: 'destructive',
      })
    } finally {
      setLoadingBackward(false)
    }
  }, [lpId, toast])

  // Fetch data on mount
  useEffect(() => {
    fetchForwardTrace()
    fetchBackwardTrace()
  }, [fetchForwardTrace, fetchBackwardTrace])

  // Navigation handlers
  const handleLPClick = (targetLpId: string) => {
    router.push(`/warehouse/inventory/${targetLpId}`)
  }

  const handleWOClick = (woId: string) => {
    router.push(`/production/work-orders/${woId}`)
  }

  const handleGRNClick = (grnId: string) => {
    router.push(`/warehouse/receiving/grn/${grnId}`)
  }

  // Export to CSV
  const handleExportCSV = async (direction: 'forward' | 'backward') => {
    try {
      const response = await fetch(
        `/api/warehouse/license-plates/${lpId}/trace/${direction}?format=csv`
      )

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${direction}-trace-${lpNumber || lpId}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Success',
        description: 'CSV exported successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export CSV',
        variant: 'destructive',
      })
    }
  }

  // Render trace content
  const renderTraceContent = (
    data: TraceTree | null,
    loading: boolean,
    direction: 'forward' | 'backward'
  ) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading trace...</span>
        </div>
      )
    }

    if (!data || data.nodes.length === 0) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">
            No {direction === 'forward' ? 'descendants' : 'ancestors'} found for this license plate
          </p>
        </div>
      )
    }

    // Group nodes by depth
    const nodesByDepth: Record<number, TraceNode[]> = {}
    data.nodes.forEach(node => {
      if (!nodesByDepth[node.depth]) {
        nodesByDepth[node.depth] = []
      }
      nodesByDepth[node.depth].push(node)
    })

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">
              Total: <span className="font-medium text-foreground">{data.summary.total_count}</span> LPs
            </span>
            <span className="text-muted-foreground">
              Depth: <span className="font-medium text-foreground">{data.summary.max_depth}</span> levels
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportCSV(direction)}
          >
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </div>

        {/* Operation type breakdown */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.summary.by_operation_type).map(([type, count]) => (
            <div key={type} className="flex items-center gap-1">
              <OperationTypeBadge type={type} />
              <span className="text-xs text-muted-foreground">({count})</span>
            </div>
          ))}
        </div>

        {/* Root LP */}
        <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <span className="font-mono font-bold">{data.root.lp_number}</span>
            <LPStatusBadge status={data.root.status as any} />
          </div>
          <div className="text-sm text-muted-foreground ml-7">
            {data.root.product_code} - {data.root.product_name}
          </div>
          <div className="text-xs text-muted-foreground ml-7 mt-1">
            Current: {data.root.current_qty}
          </div>
        </div>

        {/* Direction indicator */}
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          {direction === 'forward' ? (
            <>
              <span className="text-xs">Downstream</span>
              <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            <>
              <ArrowLeft className="h-4 w-4" />
              <span className="text-xs">Upstream</span>
            </>
          )}
        </div>

        {/* Trace nodes */}
        <div className="border-l-2 border-muted pl-4 ml-4">
          {data.nodes.map((node) => (
            <TraceNodeItem
              key={node.lp_id}
              node={node}
              direction={direction}
              onLPClick={handleLPClick}
              onWOClick={handleWOClick}
              onGRNClick={handleGRNClick}
            />
          ))}
        </div>

        {/* Execution time */}
        {executionTime[direction] && (
          <div className="text-xs text-muted-foreground text-right">
            Query time: {executionTime[direction]}ms
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          Traceability
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="forward" className="flex items-center gap-1">
              <ArrowRight className="h-4 w-4" />
              Forward ({forwardData?.summary.total_count || 0})
            </TabsTrigger>
            <TabsTrigger value="backward" className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Backward ({backwardData?.summary.total_count || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="forward" className="mt-4">
            {renderTraceContent(forwardData, loadingForward, 'forward')}
          </TabsContent>

          <TabsContent value="backward" className="mt-4">
            {renderTraceContent(backwardData, loadingBackward, 'backward')}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
