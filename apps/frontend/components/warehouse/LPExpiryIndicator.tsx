/**
 * LP Expiry Indicator Component
 * Story 05.1: License Plates UI
 */

import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface LPExpiryIndicatorProps {
  expiryDate: string | null
  format?: 'short' | 'long'
  className?: string
}

export function LPExpiryIndicator({ expiryDate, format = 'short', className }: LPExpiryIndicatorProps) {
  if (!expiryDate) {
    return <span className={cn('text-muted-foreground', className)}>—</span>
  }

  const expiry = new Date(expiryDate)
  const today = new Date()
  const daysRemaining = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  let warningLevel: 'expired' | 'critical' | 'warning' | 'normal'
  let icon: string
  let colorClass: string

  if (daysRemaining < 0) {
    warningLevel = 'expired'
    icon = '🔴'
    colorClass = 'text-red-600 font-medium'
  } else if (daysRemaining <= 7) {
    warningLevel = 'critical'
    icon = '⚠️'
    colorClass = 'text-red-600 font-medium'
  } else if (daysRemaining <= 30) {
    warningLevel = 'warning'
    icon = '⚠️'
    colorClass = 'text-yellow-600'
  } else {
    warningLevel = 'normal'
    icon = '✓'
    colorClass = 'text-green-600'
  }

  const displayText =
    daysRemaining < 0
      ? 'Expired'
      : format === 'long'
        ? `${daysRemaining} days remaining`
        : `${daysRemaining} days`

  const fullDate = expiry.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn('inline-flex items-center gap-1', colorClass, className)}
            data-testid="expiry-indicator"
            data-warning-level={warningLevel}
          >
            <span>{icon}</span>
            <span>{displayText}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Expiry: {fullDate}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
