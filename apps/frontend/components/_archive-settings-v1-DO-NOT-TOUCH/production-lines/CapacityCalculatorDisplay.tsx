/**
 * Capacity Calculator Display Component
 * Story: 01.11 - Production Lines CRUD
 * Purpose: Shows calculated capacity with bottleneck tooltip
 */

import { InfoIcon } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface CapacityCalculatorDisplayProps {
  capacity: number | null
  bottleneckMachineCode?: string | null
  className?: string
}

export function CapacityCalculatorDisplay({
  capacity,
  bottleneckMachineCode,
  className,
}: CapacityCalculatorDisplayProps) {
  // Handle no capacity
  if (capacity === null || capacity === undefined) {
    return (
      <span className={`text-muted-foreground ${className || ''}`}>
        Not calculated
      </span>
    )
  }

  return (
    <div className={`flex items-center gap-1.5 ${className || ''}`}>
      <span className="font-medium">{capacity} u/hr</span>
      {bottleneckMachineCode && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Bottleneck: {bottleneckMachineCode} ({capacity}/hr)
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
