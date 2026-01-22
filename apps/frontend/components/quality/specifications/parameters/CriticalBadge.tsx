'use client'

/**
 * CriticalBadge Component
 * Story: 06.4 - Test Parameters
 *
 * Visual indicator for critical parameters.
 * Shows red badge with tooltip explaining significance.
 */

import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { AlertCircle } from 'lucide-react'

export interface CriticalBadgeProps {
  /** Show the badge (only renders if true) */
  isCritical: boolean
  /** Size variant */
  size?: 'sm' | 'default'
}

export function CriticalBadge({ isCritical, size = 'default' }: CriticalBadgeProps) {
  if (!isCritical) return null

  const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-xs px-2 py-0.5'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="destructive"
            className={`${sizeClasses} gap-1 cursor-help`}
          >
            <AlertCircle className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
            Critical
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">
            Critical parameter - must pass for overall inspection pass
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default CriticalBadge
