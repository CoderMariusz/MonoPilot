/**
 * Genealogy Operation Type Badge Component
 * Story 05.2: LP Genealogy Tracking
 */

import { Badge } from '@/components/ui/badge'
import type { OperationType } from '@/lib/types/genealogy'
import { cn } from '@/lib/utils'

interface GenealogyOperationBadgeProps {
  operation: OperationType
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const operationConfig: Record<
  OperationType,
  {
    label: string
    className: string
  }
> = {
  split: {
    label: 'SPLIT',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  },
  merge: {
    label: 'MERGE',
    className: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
  },
  consume: {
    label: 'CONSUME',
    className: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
  },
  output: {
    label: 'OUTPUT',
    className: 'bg-green-100 text-green-800 hover:bg-green-100',
  },
}

export function GenealogyOperationBadge({
  operation,
  size = 'md',
  className,
}: GenealogyOperationBadgeProps) {
  const config = operationConfig[operation]

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  }

  return (
    <Badge
      variant="outline"
      className={cn(config.className, sizeClasses[size], 'font-semibold', className)}
      role="status"
      aria-label={`Operation: ${config.label}`}
      data-testid="operation-badge"
    >
      {config.label}
    </Badge>
  )
}
