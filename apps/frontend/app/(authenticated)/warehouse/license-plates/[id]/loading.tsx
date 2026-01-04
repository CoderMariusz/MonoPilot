/**
 * License Plate Detail Loading State
 * Story 05.6: LP Detail Page
 *
 * Skeleton loader matching the final layout
 */

import { Skeleton } from '@/components/ui/skeleton'

export default function LicensePlateDetailLoading() {
  return (
    <div className="container mx-auto py-6 space-y-6" data-testid="lp-detail-loading">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* LP Number & Status Skeleton */}
      <div className="border-b pb-4 space-y-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-6">
        <div className="flex gap-2 border-b">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>

        {/* Content Skeleton - Grid of Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-3/4" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-5 w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
