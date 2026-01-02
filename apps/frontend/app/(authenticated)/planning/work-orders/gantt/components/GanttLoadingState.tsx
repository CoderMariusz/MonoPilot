'use client';

/**
 * GanttLoadingState Component (Story 03.15)
 * Loading skeleton for Gantt chart
 */

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function GanttLoadingState() {
  return (
    <div className="space-y-4">
      {/* Filters skeleton */}
      <div className="flex items-center gap-4 flex-wrap">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[150px]" />
        <Skeleton className="h-10 w-[120px]" />
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>

      {/* Legend skeleton */}
      <div className="flex items-center gap-3 bg-white border rounded-lg p-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-[80px]" />
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="border rounded-lg overflow-hidden">
        {/* Timeline header skeleton */}
        <div className="flex border-b bg-gray-50">
          <Skeleton className="w-48 h-14 rounded-none" />
          <div className="flex-1 flex gap-1 p-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="flex-1 h-10" />
            ))}
          </div>
        </div>

        {/* Swimlane skeletons */}
        {Array.from({ length: 5 }).map((_, swimlaneIndex) => (
          <div key={swimlaneIndex} className="flex border-b">
            <Skeleton className="w-48 h-16 rounded-none bg-gray-100" />
            <div className="flex-1 flex items-center gap-2 p-2">
              {Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map(
                (_, barIndex) => (
                  <Skeleton
                    key={barIndex}
                    className="h-10"
                    style={{
                      width: `${Math.floor(Math.random() * 20) + 10}%`,
                      marginLeft: `${Math.floor(Math.random() * 15)}%`,
                    }}
                  />
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Loading text */}
      <div className="text-center text-gray-500 py-4">
        Loading schedule data...
      </div>
    </div>
  );
}

export default GanttLoadingState;
