/**
 * BOMStatusBadge Component (Story 02.4)
 * Status indicator badge with colors for BOM status
 *
 * Features:
 * - Color-coded by status
 * - WCAG 2.1 AA compliant color contrast
 * - Status icon indicators
 * - Size variants
 *
 * Statuses:
 * - draft: Gray with warning icon
 * - active: Green with check icon
 * - phased_out: Yellow with clock icon
 * - inactive: Gray outline
 */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Circle,
} from 'lucide-react'
import type { BOMStatus } from '@/lib/types/bom'

interface BOMStatusBadgeProps {
  status: BOMStatus
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

const statusConfig: Record<
  BOMStatus,
  {
    bg: string
    text: string
    border: string
    label: string
    Icon: React.ComponentType<{ className?: string }>
  }
> = {
  draft: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
    label: 'Draft',
    Icon: AlertTriangle,
  },
  active: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
    label: 'Active',
    Icon: CheckCircle,
  },
  phased_out: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
    label: 'Phased Out',
    Icon: Clock,
  },
  inactive: {
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    border: 'border-gray-200',
    label: 'Inactive',
    Icon: Circle,
  },
}

const sizeConfig = {
  sm: {
    text: 'text-xs',
    icon: 'w-3 h-3',
    gap: 'gap-1',
    padding: 'px-2 py-0.5',
  },
  md: {
    text: 'text-sm',
    icon: 'w-3.5 h-3.5',
    gap: 'gap-1.5',
    padding: 'px-2.5 py-0.5',
  },
  lg: {
    text: 'text-base',
    icon: 'w-4 h-4',
    gap: 'gap-2',
    padding: 'px-3 py-1',
  },
}

export function BOMStatusBadge({
  status,
  size = 'md',
  showIcon = true,
  className,
}: BOMStatusBadgeProps) {
  const config = statusConfig[status]
  const sizeStyles = sizeConfig[size]
  const Icon = config.Icon

  return (
    <Badge
      variant="outline"
      role="status"
      aria-label={`Status: ${config.label}`}
      className={cn(
        'inline-flex items-center font-medium',
        config.bg,
        config.text,
        config.border,
        sizeStyles.gap,
        sizeStyles.text,
        sizeStyles.padding,
        className
      )}
    >
      {showIcon && (
        <Icon
          className={cn(sizeStyles.icon)}
          aria-hidden="true"
        />
      )}
      {config.label}
    </Badge>
  )
}

export default BOMStatusBadge
