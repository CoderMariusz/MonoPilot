/**
 * LP QA Status Badge Component
 * Story 05.1: License Plates UI
 */

import { Badge } from '@/components/ui/badge'
import type { QAStatus } from '@/lib/types/license-plate'
import { cn } from '@/lib/utils'

interface LPQAStatusBadgeProps {
  qaStatus: QAStatus
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const qaStatusConfig: Record<
  QAStatus,
  {
    label: string
    className: string
    icon: string
  }
> = {
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    icon: '⏱️',
  },
  passed: {
    label: 'Passed',
    className: 'bg-green-100 text-green-800 hover:bg-green-100',
    icon: '✓',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-100 text-red-800 hover:bg-red-100',
    icon: '✗',
  },
  quarantine: {
    label: 'Quarantine',
    className: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
    icon: '⚠️',
  },
}

export function LPQAStatusBadge({ qaStatus, size = 'md', className }: LPQAStatusBadgeProps) {
  // Normalize qaStatus to lowercase to handle database enum case differences
  const normalizedStatus = qaStatus?.toLowerCase() as QAStatus
  const config = qaStatusConfig[normalizedStatus] || qaStatusConfig.pending

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  }

  return (
    <Badge
      variant="outline"
      className={cn(config.className, sizeClasses[size], className)}
      role="status"
      aria-label={`QA Status: ${config.label}`}
      data-testid="qa-status-badge"
    >
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  )
}
