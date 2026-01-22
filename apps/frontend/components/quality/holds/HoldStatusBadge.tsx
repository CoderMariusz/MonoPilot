/**
 * Hold Status Badge Component
 * Story: 06.2 - Quality Holds CRUD
 * AC-2.8: Display status badge in hold details
 * AC-2.11: Show released status with release information
 *
 * Displays hold status as a colored badge
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { HoldStatus } from '@/lib/validation/quality-hold-validation'

interface HoldStatusBadgeProps {
  status: HoldStatus
  className?: string
}

const STATUS_CONFIG: Record<HoldStatus, { label: string; className: string }> = {
  active: {
    label: 'Active',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  released: {
    label: 'Released',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  disposed: {
    label: 'Disposed',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
}

export function HoldStatusBadge({ status, className }: HoldStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.active

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}

/**
 * Hold Priority Badge
 * Displays hold priority as a colored badge
 */

import type { Priority } from '@/lib/validation/quality-hold-validation'

interface HoldPriorityBadgeProps {
  priority: Priority
  className?: string
}

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
  low: {
    label: 'Low',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  medium: {
    label: 'Medium',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  high: {
    label: 'High',
    className: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  critical: {
    label: 'Critical',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
}

export function HoldPriorityBadge({ priority, className }: HoldPriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}

/**
 * Hold Type Badge
 * Displays hold type as a descriptive badge
 */

import type { HoldType } from '@/lib/validation/quality-hold-validation'

interface HoldTypeBadgeProps {
  holdType: HoldType
  className?: string
}

const HOLD_TYPE_CONFIG: Record<HoldType, { label: string; className: string }> = {
  qa_pending: {
    label: 'QA Pending',
    className: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  investigation: {
    label: 'Investigation',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  recall: {
    label: 'Recall',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
  quarantine: {
    label: 'Quarantine',
    className: 'bg-rose-100 text-rose-700 border-rose-200',
  },
}

export function HoldTypeBadge({ holdType, className }: HoldTypeBadgeProps) {
  const config = HOLD_TYPE_CONFIG[holdType] || HOLD_TYPE_CONFIG.qa_pending

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}

/**
 * Disposition Badge
 * Displays disposition decision as a badge
 */

import type { Disposition } from '@/lib/validation/quality-hold-validation'

interface DispositionBadgeProps {
  disposition: Disposition
  className?: string
}

const DISPOSITION_CONFIG: Record<Disposition, { label: string; className: string }> = {
  release: {
    label: 'Released',
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  rework: {
    label: 'Rework',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  scrap: {
    label: 'Scrap',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
  return: {
    label: 'Return',
    className: 'bg-orange-100 text-orange-700 border-orange-200',
  },
}

export function DispositionBadge({ disposition, className }: DispositionBadgeProps) {
  const config = DISPOSITION_CONFIG[disposition] || DISPOSITION_CONFIG.release

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
