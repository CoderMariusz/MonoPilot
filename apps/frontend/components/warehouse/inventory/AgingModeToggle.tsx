/**
 * AgingModeToggle Component
 * Story: WH-INV-001 - Inventory Browser (Aging Report Tab)
 *
 * Toggle between FIFO (First-In-First-Out) and FEFO (First-Expired-First-Out) aging modes.
 * FIFO: Aging calculated by receipt date (created_at)
 * FEFO: Aging calculated by expiry date
 */

'use client'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Clock, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgingModeToggleProps {
  value: 'fifo' | 'fefo'
  onChange: (mode: 'fifo' | 'fefo') => void
  disabled?: boolean
  className?: string
}

export function AgingModeToggle({
  value,
  onChange,
  disabled = false,
  className,
}: AgingModeToggleProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label
        className="text-sm font-medium text-muted-foreground"
        id="aging-mode-label"
      >
        Aging Mode
      </Label>
      <RadioGroup
        value={value}
        onValueChange={(val) => onChange(val as 'fifo' | 'fefo')}
        disabled={disabled}
        className="flex flex-row gap-4"
        aria-labelledby="aging-mode-label"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            value="fifo"
            id="aging-mode-fifo"
            className="peer"
            aria-describedby="fifo-description"
          />
          <Label
            htmlFor="aging-mode-fifo"
            className={cn(
              'flex items-center gap-2 cursor-pointer select-none',
              'text-sm font-medium transition-colors',
              value === 'fifo' ? 'text-foreground' : 'text-muted-foreground',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <Clock className="h-4 w-4" aria-hidden="true" />
            <span>FIFO</span>
            <span className="text-xs text-muted-foreground font-normal hidden sm:inline">
              (by Receipt Date)
            </span>
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            value="fefo"
            id="aging-mode-fefo"
            className="peer"
            aria-describedby="fefo-description"
          />
          <Label
            htmlFor="aging-mode-fefo"
            className={cn(
              'flex items-center gap-2 cursor-pointer select-none',
              'text-sm font-medium transition-colors',
              value === 'fefo' ? 'text-foreground' : 'text-muted-foreground',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <Calendar className="h-4 w-4" aria-hidden="true" />
            <span>FEFO</span>
            <span className="text-xs text-muted-foreground font-normal hidden sm:inline">
              (by Expiry Date)
            </span>
          </Label>
        </div>
      </RadioGroup>
      <p id="fifo-description" className="sr-only">
        First In First Out - aging calculated by receipt date
      </p>
      <p id="fefo-description" className="sr-only">
        First Expired First Out - aging calculated by expiry date
      </p>
    </div>
  )
}
