'use client'

/**
 * SpecificationStatusBadge Component
 * Story: 06.3 - Product Specifications
 *
 * Color-coded badge showing specification status.
 * Uses color + icon for accessibility (not color alone).
 *
 * Statuses:
 * - draft (gray/FileText): Initial state, editable
 * - active (green/CheckCircle): Approved and in use
 * - expired (orange/Clock): Past expiry_date
 * - superseded (blue/ArrowRight): Replaced by newer version
 */

import { Badge } from '@/components/ui/badge'
import { FileText, CheckCircle, Clock, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { SpecificationStatus } from '@/lib/types/quality'

export interface SpecificationStatusBadgeProps {
  /** Specification status */
  status: SpecificationStatus
  /** Badge size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Show icon alongside text */
  showIcon?: boolean
  /** Additional CSS classes */
  className?: string
  /** Loading state */
  loading?: boolean
  /** Test ID for testing */
  testId?: string
}

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    description: 'Initial state, editable',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
    Icon: FileText,
  },
  active: {
    label: 'Active',
    description: 'Approved and in use',
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    Icon: CheckCircle,
  },
  expired: {
    label: 'Expired',
    description: 'Past expiry date',
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200',
    Icon: Clock,
  },
  superseded: {
    label: 'Superseded',
    description: 'Replaced by newer version',
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
    Icon: ArrowRight,
  },
}

const SIZE_CONFIG = {
  sm: { padding: 'px-2 py-0.5', font: 'text-xs', icon: 12 },
  md: { padding: 'px-2.5 py-1', font: 'text-sm', icon: 14 },
  lg: { padding: 'px-3 py-1.5', font: 'text-base', icon: 16 },
}

export function SpecificationStatusBadge({
  status,
  size = 'md',
  showIcon = true,
  className,
  loading = false,
  testId = 'spec-status-badge',
}: SpecificationStatusBadgeProps) {
  // Loading state
  if (loading) {
    const sizeClass = size === 'sm' ? 'h-5 w-14' : size === 'lg' ? 'h-8 w-24' : 'h-6 w-18'
    return (
      <Skeleton
        className={cn('rounded-md', sizeClass)}
        data-testid={`${testId}-loading`}
      />
    )
  }

  const config = STATUS_CONFIG[status]
  if (!config) {
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-600">
        Unknown
      </Badge>
    )
  }

  const { Icon } = config
  const sizeConfig = SIZE_CONFIG[size]

  return (
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
      aria-label={`Status: ${config.label}`}
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
}

export default SpecificationStatusBadge
