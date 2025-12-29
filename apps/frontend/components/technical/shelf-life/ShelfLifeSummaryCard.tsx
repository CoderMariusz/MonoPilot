/**
 * Shelf Life Summary Card Component
 * Story: 02.11 - Shelf Life Calculation + Expiry Management
 *
 * Compact display for product detail page:
 * - Shows shelf life days
 * - Override indicator badge
 * - Needs recalculation badge
 * - Configure button to open modal
 */

'use client'

import { Clock, AlertTriangle, Settings, Edit2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface ShelfLifeSummaryCardProps {
  productId: string
  shelfLifeDays: number | null
  isOverride: boolean
  needsRecalculation: boolean
  onConfigureClick: () => void
  isLoading?: boolean
}

export function ShelfLifeSummaryCard({
  shelfLifeDays,
  isOverride,
  needsRecalculation,
  onConfigureClick,
  isLoading = false,
}: ShelfLifeSummaryCardProps) {
  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Shelf Life
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (shelfLifeDays == null) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Shelf Life
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-center py-4">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Not configured</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onConfigureClick}
            aria-label="Configure shelf life"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure Shelf Life
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Success state
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Shelf Life
          </CardTitle>
          {needsRecalculation && (
            <Badge
              variant="outline"
              className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300"
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Needs Recalc
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Shelf life display */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{shelfLifeDays}</span>
          <span className="text-muted-foreground">days</span>
          {isOverride && (
            <Badge variant="secondary" className="text-xs">
              Override
            </Badge>
          )}
        </div>

        {/* Configure button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onConfigureClick}
          aria-label="Configure shelf life"
        >
          <Edit2 className="h-4 w-4 mr-2" />
          Configure
        </Button>
      </CardContent>
    </Card>
  )
}
