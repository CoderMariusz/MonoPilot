/**
 * ProductTypeBadge Component (Story 02.1 - TEC-001)
 * Displays product type with color coding and accessibility
 *
 * WCAG 2.1 AA Compliant:
 * - Color contrast ratios >= 4.5:1 (using Yellow-900 for WIP)
 * - Icon + text (not color-only)
 * - ARIA labels for screen readers
 */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Package, Wrench, CheckCircle, Box, Recycle } from 'lucide-react'

interface ProductTypeBadgeProps {
  type: 'RM' | 'WIP' | 'FG' | 'PKG' | 'BP'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const typeConfig = {
  RM: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    label: 'Raw Material',
    code: 'RM',
    icon: Package,
  },
  WIP: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-900', // Using yellow-900 for better contrast (8.82:1)
    label: 'Work in Progress',
    code: 'WIP',
    icon: Wrench,
  },
  FG: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    label: 'Finished Goods',
    code: 'FG',
    icon: CheckCircle,
  },
  PKG: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    label: 'Packaging',
    code: 'PKG',
    icon: Box,
  },
  BP: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    label: 'Byproduct',
    code: 'BP',
    icon: Recycle,
  },
}

const sizeConfig = {
  sm: {
    text: 'text-xs',
    icon: 'w-3 h-3',
    gap: 'gap-1',
  },
  md: {
    text: 'text-sm',
    icon: 'w-4 h-4',
    gap: 'gap-1.5',
  },
  lg: {
    text: 'text-base',
    icon: 'w-5 h-5',
    gap: 'gap-2',
  },
}

export function ProductTypeBadge({
  type,
  size = 'md',
  showLabel = false,
  className,
}: ProductTypeBadgeProps) {
  const config = typeConfig[type]
  const sizeStyles = sizeConfig[size]
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      role="status"
      aria-label={`Product type: ${config.label}`}
      title={config.label}
      className={cn(
        'inline-flex items-center font-medium border-0',
        config.bg,
        config.text,
        sizeStyles.gap,
        sizeStyles.text,
        className
      )}
    >
      <Icon className={cn(sizeStyles.icon)} aria-hidden="true" />
      {showLabel ? config.label : config.code}
    </Badge>
  )
}
