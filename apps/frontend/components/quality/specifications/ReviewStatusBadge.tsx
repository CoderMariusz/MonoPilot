'use client'

/**
 * ReviewStatusBadge Component
 * Story: 06.3 - Product Specifications
 *
 * Color-coded badge showing review date status.
 * Uses color + icon for accessibility (not color alone).
 *
 * Statuses:
 * - ok (green/CheckCircle): More than 30 days until review
 * - due_soon (yellow/Clock): Within 30 days of review
 * - overdue (red/AlertTriangle): Past review date
 */

import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { ReviewStatus } from '@/lib/types/quality'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface ReviewStatusBadgeProps {
  /** Review status */
  status: ReviewStatus
  /** Days until review (negative if overdue) */
  daysUntilReview?: number
  /** Badge size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Show icon alongside text */
  showIcon?: boolean
  /** Show tooltip with details */
  showTooltip?: boolean
  /** Additional CSS classes */
  className?: string
  /** Loading state */
  loading?: boolean
  /** Test ID for testing */
  testId?: string
}

const STATUS_CONFIG = {
  ok: {
    label: 'On Schedule',
    color: 'green',
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    Icon: CheckCircle,
  },
  due_soon: {
    label: 'Review Due Soon',
    color: 'yellow',
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    Icon: Clock,
  },
  overdue: {
    label: 'Review Overdue',
    color: 'red',
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    Icon: AlertTriangle,
  },
}

const SIZE_CONFIG = {
  sm: { padding: 'px-2 py-0.5', font: 'text-xs', icon: 12 },
  md: { padding: 'px-2.5 py-1', font: 'text-sm', icon: 14 },
  lg: { padding: 'px-3 py-1.5', font: 'text-base', icon: 16 },
}

export function ReviewStatusBadge({
  status,
  daysUntilReview,
  size = 'md',
  showIcon = true,
  showTooltip = true,
  className,
  loading = false,
  testId = 'review-status-badge',
}: ReviewStatusBadgeProps) {
  // Loading state
  if (loading) {
    const sizeClass = size === 'sm' ? 'h-5 w-16' : size === 'lg' ? 'h-8 w-28' : 'h-6 w-24'
    return (
      <Skeleton
        className={cn('rounded-md', sizeClass)}
        data-testid={`${testId}-loading`}
      />
    )
  }

  const config = STATUS_CONFIG[status]
  if (!config) {
    return null
  }

  const { Icon } = config
  const sizeConfig = SIZE_CONFIG[size]

  // Generate tooltip message
  const getTooltipMessage = () => {
    if (daysUntilReview === undefined) return config.label
    if (daysUntilReview > 0) {
      return `Review due in ${daysUntilReview} days`
    } else if (daysUntilReview === 0) {
      return 'Review due today'
    } else {
      return `Review overdue by ${Math.abs(daysUntilReview)} days`
    }
  }

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        config.bg,
        config.text,
        config.border,
        sizeConfig.padding,
        sizeConfig.font,
        'border font-medium inline-flex items-center gap-1',
        className
      )}
      role="status"
      aria-label={`Review Status: ${config.label}`}
      data-testid={testId}
    >
      {showIcon && (
        <Icon
          className="flex-shrink-0"
          size={sizeConfig.icon}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </Badge>
  )

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipMessage()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return badge
}

export default ReviewStatusBadge
