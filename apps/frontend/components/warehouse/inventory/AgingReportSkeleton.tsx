/**
 * AgingReportSkeleton Component
 * Story: WH-INV-001 - Inventory Browser (Aging Report Tab)
 *
 * Loading skeleton for the aging report tab.
 */

'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function AgingReportSkeleton() {
  return (
    <div className="space-y-6" data-testid="aging-report-skeleton">
      {/* Mode Toggle and Filters Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        {/* Mode Toggle */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-10 w-[180px]" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-[180px]" />
          </div>
        </div>
      </div>

      {/* Chart Skeleton */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table and Widget Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Skeleton */}
        <div className="lg:col-span-2 rounded-md border">
          {/* Table Header */}
          <div className="border-b p-4">
            <div className="flex gap-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
          {/* Table Rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border-b p-4">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-14 w-20" />
                <Skeleton className="h-14 w-20" />
                <Skeleton className="h-14 w-20" />
                <Skeleton className="h-14 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
          {/* Pagination */}
          <div className="p-4 flex justify-between items-center">
            <Skeleton className="h-4 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </div>

        {/* Widget Skeleton */}
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg border">
                  <div className="flex justify-between">
                    <div className="flex-1">
                      <Skeleton className="h-4 w-28 mb-2" />
                      <Skeleton className="h-3 w-36 mb-2" />
                      <div className="flex gap-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-3 w-20 mt-1" />
                    </div>
                    <div className="flex flex-col items-end">
                      <Skeleton className="h-4 w-4 mb-1" />
                      <Skeleton className="h-4 w-8 mb-1" />
                      <Skeleton className="h-3 w-6" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Skeleton className="h-9 w-full mt-3" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
