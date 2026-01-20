/**
 * Materials Table Component (Story 04.6a)
 * Displays required materials with consumption progress
 *
 * Wireframe: PROD-003 - Required Materials table
 *
 * Features:
 * - Progress bar per material (consumed/required)
 * - Variance percentage with color coding
 * - 'Full LP Required' badge for consume_whole_lp=true
 * - Over-consumed warning indicator
 * - [+] button to open AddConsumptionModal
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Check,
  AlertTriangle,
  Lock,
  RefreshCw,
  Package,
} from 'lucide-react'
import type { ConsumptionMaterial } from '@/lib/services/consumption-service'

type FilterStatus = 'all' | 'partial' | 'completed' | 'over-consumed'
type SortBy = 'sequence' | 'name' | 'progress'

interface MaterialsTableProps {
  materials: ConsumptionMaterial[]
  isLoading?: boolean
  onConsume: (material: ConsumptionMaterial) => void
  onRefresh?: () => void
  woStatus?: string
}

export function MaterialsTable({
  materials,
  isLoading,
  onConsume,
  onRefresh,
  woStatus,
}: MaterialsTableProps) {
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [sortBy, setSortBy] = useState<SortBy>('sequence')

  const canConsume = woStatus === 'in_progress'

  // Calculate progress for each material
  const materialsWithProgress = materials.map((m) => {
    const consumed = m.consumed_qty || 0
    const required = m.required_qty || 0
    const remaining = Math.max(0, required - consumed)
    const progress = required > 0 ? Math.min(100, (consumed / required) * 100) : 0
    const variance = required > 0 ? ((consumed - required) / required) * 100 : 0
    const isOverConsumed = consumed > required

    return {
      ...m,
      consumed,
      required,
      remaining,
      progress,
      variance,
      isOverConsumed,
      isComplete: consumed >= required && required > 0,
    }
  })

  // Filter materials
  const filteredMaterials = materialsWithProgress.filter((m) => {
    switch (filter) {
      case 'partial':
        return m.consumed > 0 && m.consumed < m.required
      case 'completed':
        return m.isComplete && !m.isOverConsumed
      case 'over-consumed':
        return m.isOverConsumed
      default:
        return true
    }
  })

  // Sort materials
  const sortedMaterials = [...filteredMaterials].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.material_name.localeCompare(b.material_name)
      case 'progress':
        return b.progress - a.progress
      default:
        return a.sequence - b.sequence
    }
  })

  // Get variance color
  const getVarianceColor = (variance: number, isOverConsumed: boolean) => {
    if (isOverConsumed) return 'text-yellow-600'
    if (variance === 0) return 'text-green-600'
    return 'text-green-600'
  }

  // Get variance indicator
  const getVarianceIndicator = (variance: number, isOverConsumed: boolean) => {
    if (isOverConsumed) return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    return <span className="text-green-500">OK</span>
  }

  // Format quantity
  const formatQty = (qty: number, uom: string) =>
    `${qty.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${uom}`

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="materials-table-loading">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {[...Array(8)].map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(8)].map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  if (materials.length === 0) {
    return (
      <div
        className="text-center py-12 text-muted-foreground"
        data-testid="materials-table-empty"
      >
        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No materials defined for this work order</p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-4" data-testid="materials-table">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as FilterStatus)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="over-consumed">Over-Consumed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sequence">Sequence</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Component</TableHead>
                <TableHead className="text-right">Required</TableHead>
                <TableHead className="text-right">Consumed</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead className="w-32">Progress</TableHead>
                <TableHead className="text-center">Variance</TableHead>
                <TableHead className="w-20 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMaterials.map((material) => (
                <TableRow
                  key={material.id}
                  className={material.isOverConsumed ? 'bg-yellow-50' : ''}
                >
                  <TableCell className="font-mono text-muted-foreground">
                    {material.sequence}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{material.material_name}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{material.product?.code || 'N/A'}</span>
                        {material.product?.product_type && (
                          <Badge variant="outline" className="text-xs">
                            {material.product.product_type}
                          </Badge>
                        )}
                      </div>
                      {material.consume_whole_lp && (
                        <div className="flex items-center gap-1 text-xs text-amber-600">
                          <Lock className="h-3 w-3" />
                          Full LP Required
                        </div>
                      )}
                      {material.isOverConsumed && (
                        <div className="flex items-center gap-1 text-xs text-yellow-600">
                          <AlertTriangle className="h-3 w-3" />
                          Over-consumed
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatQty(material.required, material.uom)}
                  </TableCell>
                  <TableCell
                    className="text-right font-mono"
                    data-testid="consumed-qty"
                  >
                    {formatQty(material.consumed, material.uom)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {material.remaining < 0 ? (
                      <span className="text-yellow-600">
                        {formatQty(Math.abs(material.remaining), material.uom)} over
                      </span>
                    ) : (
                      formatQty(material.remaining, material.uom)
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Progress
                        value={Math.min(100, material.progress)}
                        className={`h-2 ${
                          material.isOverConsumed ? '[&>div]:bg-yellow-500' : ''
                        }`}
                      />
                      <div className="text-xs text-muted-foreground text-center">
                        {Math.round(material.progress)}%
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={`flex items-center justify-center gap-1 ${getVarianceColor(material.variance, material.isOverConsumed)}`}>
                      {material.variance !== 0 && (
                        <span className="font-mono text-sm">
                          {material.variance > 0 ? '+' : ''}{Math.round(material.variance)}%
                        </span>
                      )}
                      {getVarianceIndicator(material.variance, material.isOverConsumed)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {material.isComplete && !material.isOverConsumed ? (
                      <Tooltip>
                        <TooltipTrigger>
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        </TooltipTrigger>
                        <TooltipContent>Consumption complete</TooltipContent>
                      </Tooltip>
                    ) : canConsume ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onConsume(material)}
                        data-testid="add-consumption"
                        aria-label={`Add consumption for ${material.material_name}`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger>
                          <Button variant="outline" size="sm" disabled>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          WO must be in progress to consume
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="text-sm text-muted-foreground">
          Showing {sortedMaterials.length} of {materials.length} materials
        </div>
      </div>
    </TooltipProvider>
  )
}
