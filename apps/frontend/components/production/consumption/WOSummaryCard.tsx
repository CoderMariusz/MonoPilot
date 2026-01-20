/**
 * WO Summary Card Component (Story 04.6a)
 * Displays work order summary with materials progress
 *
 * Wireframe: PROD-003 - Work Order Summary section
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ClipboardList } from 'lucide-react'

interface WorkOrder {
  id: string
  wo_number: string
  status: string
  product_name: string
  product_code: string
  batch_number: string | null
  planned_quantity: number
  actual_quantity: number
  uom: string
  production_line_name?: string | null
}

interface MaterialsProgress {
  consumed: number
  total: number
  percentage: number
}

interface WOSummaryCardProps {
  wo: WorkOrder | null
  materialsProgress: MaterialsProgress
  isLoading?: boolean
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  planned: 'bg-blue-100 text-blue-800',
  released: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-green-100 text-green-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
}

export function WOSummaryCard({
  wo,
  materialsProgress,
  isLoading,
}: WOSummaryCardProps) {
  if (isLoading) {
    return (
      <Card data-testid="wo-summary-card-loading">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!wo) {
    return (
      <Card data-testid="wo-summary-card-empty">
        <CardContent className="py-8 text-center text-muted-foreground">
          Work order not found
        </CardContent>
      </Card>
    )
  }

  const actualPercent =
    wo.planned_quantity > 0
      ? Math.round((wo.actual_quantity / wo.planned_quantity) * 100)
      : 0

  return (
    <Card data-testid="wo-summary-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="h-5 w-5" />
          Work Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* WO Header */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-lg" data-testid="wo-number">
              {wo.wo_number}
            </span>
            <span className="text-muted-foreground">
              : {wo.product_name} ({wo.product_code})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusColors[wo.status] || 'bg-gray-100'}>
              {wo.status.replace('_', ' ')}
            </Badge>
            {wo.production_line_name && (
              <Badge variant="outline">{wo.production_line_name}</Badge>
            )}
          </div>
        </div>

        {/* Batch and Quantities */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {wo.batch_number && (
            <span>
              Batch: <span className="font-mono text-foreground">{wo.batch_number}</span>
            </span>
          )}
          <span>
            Planned:{' '}
            <span className="font-mono text-foreground">
              {wo.planned_quantity.toLocaleString()} {wo.uom}
            </span>
          </span>
          <span>
            Actual:{' '}
            <span className="font-mono text-foreground">
              {wo.actual_quantity.toLocaleString()} {wo.uom} ({actualPercent}%)
            </span>
          </span>
        </div>

        {/* Materials Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Materials Progress:{' '}
              <span className="font-medium text-foreground">
                {materialsProgress.consumed} of {materialsProgress.total} components consumed
              </span>
            </span>
            <span className="font-medium">
              {materialsProgress.percentage}%
            </span>
          </div>
          <Progress
            value={materialsProgress.percentage}
            className="h-2"
            data-testid="materials-progress"
          />
        </div>
      </CardContent>
    </Card>
  )
}
