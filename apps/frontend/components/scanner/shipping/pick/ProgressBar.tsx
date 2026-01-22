/**
 * Progress Bar Component (Story 07.10)
 * Visual progress indicator for pick list completion
 */

'use client'

import { cn } from '@/lib/utils'

interface ProgressBarProps {
  total_lines: number
  picked_lines: number
  short_lines: number
  className?: string
}

export function ProgressBar({
  total_lines,
  picked_lines,
  short_lines,
  className,
}: ProgressBarProps) {
  const completedLines = picked_lines + short_lines
  const percentage = total_lines > 0 ? Math.round((completedLines / total_lines) * 100) : 0

  return (
    <div
      data-testid="progress-bar"
      className={cn('w-full', className)}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          {completedLines} of {total_lines}
        </span>
        <span className="text-sm font-medium text-gray-500">{percentage}%</span>
      </div>
      <progress
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        value={percentage}
        max={100}
        className="w-full h-2 rounded-full appearance-none [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-gray-200 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-green-500 [&::-moz-progress-bar]:bg-green-500"
      />
    </div>
  )
}

export default ProgressBar
