'use client'

/**
 * PauseReasonSelect Component
 * Story: 04.2b - WO Pause/Resume
 *
 * A reusable select dropdown component for choosing work order pause reasons.
 * Used within WOPauseModal. Displays reason options with icons for quick visual identification.
 *
 * States:
 * - Empty (No Selection): Placeholder text shown
 * - Selected: Selection shown with icon
 * - Focused: Focus ring visible
 * - Error: Red border and error message
 * - Disabled: Opacity reduced, not clickable
 */

import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  Wrench,
  Package,
  Coffee,
  AlertTriangle,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react'
import type { PauseReason } from '@/lib/validation/production-schemas'

/**
 * Pause reason metadata with labels, icons, and colors
 */
interface PauseReasonOption {
  value: PauseReason
  label: string
  icon: LucideIcon
  iconColor: string
  description: string
}

export const PAUSE_REASONS: PauseReasonOption[] = [
  {
    value: 'machine_breakdown',
    label: 'Machine Breakdown',
    icon: Wrench,
    iconColor: 'text-red-500',
    description: 'Equipment failure or maintenance required',
  },
  {
    value: 'material_shortage',
    label: 'Material Shortage',
    icon: Package,
    iconColor: 'text-orange-500',
    description: 'Waiting for materials or supplies',
  },
  {
    value: 'break',
    label: 'Break/Lunch',
    icon: Coffee,
    iconColor: 'text-blue-500',
    description: 'Scheduled break or lunch period',
  },
  {
    value: 'quality_issue',
    label: 'Quality Issue',
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
    description: 'Quality hold or investigation',
  },
  {
    value: 'other',
    label: 'Other',
    icon: MoreHorizontal,
    iconColor: 'text-gray-500',
    description: 'Other reason (specify in notes)',
  },
]

/**
 * Get pause reason option by value
 */
export function getPauseReasonOption(value: PauseReason): PauseReasonOption | undefined {
  return PAUSE_REASONS.find((r) => r.value === value)
}

/**
 * Get pause reason label by value
 */
export function getPauseReasonLabel(value: PauseReason): string {
  return getPauseReasonOption(value)?.label ?? value
}

/**
 * Get icon and color for pause reason
 * Used by WOResumeModal and WOPauseHistory
 */
export function getPauseReasonIcon(reason: PauseReason | null) {
  switch (reason) {
    case 'machine_breakdown':
      return { icon: Wrench, color: 'text-red-500' }
    case 'material_shortage':
      return { icon: Package, color: 'text-orange-500' }
    case 'break':
      return { icon: Coffee, color: 'text-blue-500' }
    case 'quality_issue':
      return { icon: AlertTriangle, color: 'text-yellow-500' }
    case 'other':
    default:
      return { icon: MoreHorizontal, color: 'text-gray-500' }
  }
}

export interface PauseReasonSelectProps {
  value?: PauseReason
  onValueChange: (value: PauseReason) => void
  disabled?: boolean
  error?: string
  className?: string
}

export function PauseReasonSelect({
  value,
  onValueChange,
  disabled = false,
  error,
  className,
}: PauseReasonSelectProps) {
  const selectedOption = value ? getPauseReasonOption(value) : undefined

  return (
    <div className={cn('space-y-1.5', className)}>
      <Select
        value={value}
        onValueChange={(val) => onValueChange(val as PauseReason)}
        disabled={disabled}
      >
        <SelectTrigger
          className={cn(
            'h-12 min-h-[48px]',
            error && 'border-red-500 focus:ring-red-500',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Pause reason"
          aria-required="true"
          aria-invalid={!!error}
          aria-describedby={error ? 'pause-reason-error' : undefined}
        >
          <SelectValue placeholder="Select a reason...">
            {selectedOption && (
              <div className="flex items-center gap-2">
                <selectedOption.icon className={cn('h-4 w-4', selectedOption.iconColor)} />
                <span>{selectedOption.label}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {PAUSE_REASONS.map((reason) => {
            const Icon = reason.icon
            return (
              <SelectItem
                key={reason.value}
                value={reason.value}
                className="py-3 cursor-pointer"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-4 w-4', reason.iconColor)} />
                    <span className="font-medium">{reason.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground pl-6">
                    {reason.description}
                  </span>
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
      {error && (
        <p
          id="pause-reason-error"
          className="text-sm text-red-500"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </p>
      )}
    </div>
  )
}

export default PauseReasonSelect
