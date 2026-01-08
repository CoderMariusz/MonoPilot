'use client'

/**
 * OperationStatusBadge Component
 * Story: 04.3 - Operation Start/Complete
 *
 * Color-coded status badge with icon for operation status.
 * Uses color + icon for accessibility (not color alone).
 */

import { Badge } from '@/components/ui/badge'
import { Circle, PlayCircle, CheckCircle, SkipForward } from 'lucide-react'
import { cn } from '@/lib/utils'

export type OperationStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'

export interface OperationStatusBadgeProps {
  status: OperationStatus
  size?: 'sm' | 'md' | 'lg'
}

const STATUS_CONFIG: Record<
  OperationStatus,
  {
    label: string
    bg: string
    text: string
    border: string
    Icon: typeof Circle
  }
> = {
  pending: {
    label: 'Pending',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
    Icon: Circle,
  },
  in_progress: {
    label: 'In Progress',
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
    Icon: PlayCircle,
  },
  completed: {
    label: 'Completed',
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    Icon: CheckCircle,
  },
  skipped: {
    label: 'Skipped',
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200',
    Icon: SkipForward,
  },
}

const SIZE_CONFIG = {
  sm: { padding: 'px-2 py-0.5', font: 'text-xs', icon: 12 },
  md: { padding: 'px-2.5 py-1', font: 'text-sm', icon: 14 },
  lg: { padding: 'px-3 py-1.5', font: 'text-base', icon: 16 },
}

export function OperationStatusBadge({
  status,
  size = 'md',
}: OperationStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const sizeConfig = SIZE_CONFIG[size]
  const { Icon } = config

  return (
    <Badge
      variant="outline"
      className={cn(
        config.bg,
        config.text,
        config.border,
        sizeConfig.padding,
        sizeConfig.font,
        'border font-medium inline-flex items-center gap-1'
      )}
      aria-label={`Status: ${config.label}`}
    >
      <Icon
        className="flex-shrink-0"
        size={sizeConfig.icon}
        aria-hidden="true"
      />
      <span>{config.label}</span>
    </Badge>
  )
}

export default OperationStatusBadge
