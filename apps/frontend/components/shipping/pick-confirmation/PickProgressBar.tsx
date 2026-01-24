/**
 * PickProgressBar Component
 * Story: 07.9 - Pick Confirmation Desktop
 * Phase: GREEN - Full implementation
 *
 * Real-time progress indicator for pick list completion.
 */

'use client'

import React from 'react'

export interface PickProgressBarProps {
  pickedLines: number
  shortLines: number
  totalLines: number
}

export function PickProgressBar({
  pickedLines,
  shortLines,
  totalLines,
}: PickProgressBarProps): React.JSX.Element {
  const completedLines = pickedLines + shortLines
  const percentage = totalLines > 0 ? Math.round((completedLines / totalLines) * 100) : 0

  // Calculate widths for the progress bar segments
  const pickedWidth = totalLines > 0 ? (pickedLines / totalLines) * 100 : 0
  const shortWidth = totalLines > 0 ? (shortLines / totalLines) * 100 : 0

  return (
    <div className="space-y-2">
      {/* Progress bar container */}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
        aria-label={`Pick progress: ${completedLines} of ${totalLines} lines completed, ${percentage}%`}
        className="relative h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
      >
        {/* Picked portion (green) */}
        <div
          data-testid="progress-fill-picked"
          className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-300"
          style={{ width: `${pickedWidth}%` }}
        />
        {/* Short portion (yellow/amber) */}
        <div
          data-testid="progress-fill-short"
          className="absolute top-0 h-full bg-yellow-500 transition-all duration-300"
          style={{ left: `${pickedWidth}%`, width: `${shortWidth}%` }}
        />
      </div>

      {/* Progress text */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {completedLines} of {totalLines} lines ({percentage}%)
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">{pickedLines} picked</span>
          </span>
          {shortLines > 0 && (
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-yellow-500" />
              <span className="text-muted-foreground">{shortLines} short</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
