'use client'

/**
 * ParameterTypeBadge Component
 * Story: 06.4 - Test Parameters
 *
 * Color-coded badge showing parameter type.
 * - numeric: blue
 * - text: green
 * - boolean: purple
 * - range: orange
 */

import { Badge } from '@/components/ui/badge'
import type { ParameterType } from '@/lib/types/quality'

export interface ParameterTypeBadgeProps {
  /** Parameter type */
  type: ParameterType
  /** Size variant */
  size?: 'sm' | 'default'
}

const typeConfig: Record<
  ParameterType,
  { label: string; className: string }
> = {
  numeric: {
    label: 'Numeric',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200',
  },
  text: {
    label: 'Text',
    className: 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200',
  },
  boolean: {
    label: 'Boolean',
    className: 'bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200',
  },
  range: {
    label: 'Range',
    className: 'bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200',
  },
}

export function ParameterTypeBadge({ type, size = 'default' }: ParameterTypeBadgeProps) {
  const config = typeConfig[type] || typeConfig.text

  const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-xs px-2 py-0.5'

  return (
    <Badge variant="outline" className={`${sizeClasses} ${config.className}`}>
      {config.label}
    </Badge>
  )
}

export default ParameterTypeBadge
