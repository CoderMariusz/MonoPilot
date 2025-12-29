/**
 * CostSummaryLoading Component (Story 02.9)
 * Loading skeleton state for cost summary
 */

'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function CostSummaryLoading() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-28" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cost values grid skeleton */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>

        {/* Cost breakdown chart skeleton */}
        <div className="space-y-3 mt-4">
          <div className="space-y-1">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-3 w-full" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-3 w-3/4" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>

        {/* Margin analysis skeleton */}
        <div className="border-t pt-4 mt-4">
          <Skeleton className="h-4 w-28 mb-3" />
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div>
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-6 w-16" />
            </div>
            <div>
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </div>

        {/* Last calculated skeleton */}
        <Skeleton className="h-4 w-48 mt-4" />
      </CardContent>
    </Card>
  )
}
