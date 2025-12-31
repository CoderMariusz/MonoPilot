/**
 * TO Line Progress Bar Component
 * Story 03.9a: TO Partial Shipments (Basic)
 * Visual progress indicator for shipped/received quantities
 */

'use client'

import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface TOLineProgressBarProps {
  shipped: number
  received: number
  total: number
  type: 'ship' | 'receive'
  showLabel?: boolean
  className?: string
}

/**
 * Progress bar for TO line shipment/receipt tracking
 * - Ship mode: shows shipped / total
 * - Receive mode: shows received / shipped
 * - Green checkmark at 100%
 * - Yellow bar for partial
 * - Gray for 0%
 */
export function TOLineProgressBar({
  shipped,
  received,
  total,
  type,
  showLabel = true,
  className,
}: TOLineProgressBarProps) {
  // Calculate current/max based on type
  const current = type === 'ship' ? shipped : received
  const max = type === 'ship' ? total : shipped
  const percent = max > 0 ? Math.round((current / max) * 100) : 0

  // Determine progress bar color class
  const getProgressColor = () => {
    if (percent === 0) return 'bg-gray-200 [&>div]:bg-gray-400'
    if (percent >= 100) return 'bg-green-100 [&>div]:bg-green-500'
    return 'bg-yellow-100 [&>div]:bg-yellow-500'
  }

  // Format numbers for display
  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Progress
        value={percent}
        className={cn('w-20 h-2', getProgressColor())}
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${type === 'ship' ? 'Shipped' : 'Received'} ${current} of ${max} units`}
      />
      {showLabel && (
        <span className="text-sm whitespace-nowrap flex items-center gap-1">
          {formatNumber(current)} / {formatNumber(max)}
          {percent >= 100 && (
            <>
              <span className="sr-only">Complete</span>
              <span className="text-green-500" aria-hidden="true">
                &#10003;
              </span>
            </>
          )}
        </span>
      )}
    </div>
  )
}

export default TOLineProgressBar
