/**
 * ProductStatusBadge Component (Story 02.1 - TEC-001)
 * Displays product status with color coding and accessibility
 *
 * WCAG 2.1 AA Compliant:
 * - Color contrast ratios >= 4.5:1
 * - Not color-only (dot + text)
 * - ARIA labels for screen readers
 */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ProductStatusBadgeProps {
  status: 'active' | 'inactive' | 'discontinued'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const statusConfig = {
  active: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    dot: 'bg-green-500',
    label: 'Active',
  },
  inactive: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    dot: 'bg-gray-500',
    label: 'Inactive',
  },
  discontinued: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    dot: 'bg-red-500',
    label: 'Discontinued',
  },
}

const sizeConfig = {
  sm: {
    text: 'text-xs',
    dot: 'w-1.5 h-1.5',
    gap: 'gap-1',
  },
  md: {
    text: 'text-sm',
    dot: 'w-2 h-2',
    gap: 'gap-1.5',
  },
  lg: {
    text: 'text-base',
    dot: 'w-2.5 h-2.5',
    gap: 'gap-2',
  },
}

export function ProductStatusBadge({
  status,
  size = 'md',
  className,
}: ProductStatusBadgeProps) {
  const config = statusConfig[status]
  const sizeStyles = sizeConfig[size]

  return (
    <Badge
      variant="outline"
      role="status"
      aria-label={`Status: ${config.label}`}
      className={cn(
        'inline-flex items-center font-medium border-0',
        config.bg,
        config.text,
        sizeStyles.gap,
        sizeStyles.text,
        className
      )}
    >
      <span
        className={cn('rounded-full', config.dot, sizeStyles.dot)}
        aria-hidden="true"
      />
      {config.label}
    </Badge>
  )
}
