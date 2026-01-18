/**
 * Expiring Days Slider Component
 * Story: WH-INV-001 - Inventory Browser (Expiring Items Tab)
 *
 * Slider to control the expiring items threshold (7-90 days)
 */

'use client'

import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

interface ExpiringDaysSliderProps {
  days: number
  onDaysChange: (value: number) => void
  disabled?: boolean
  className?: string
}

export function ExpiringDaysSlider({
  days,
  onDaysChange,
  disabled = false,
  className,
}: ExpiringDaysSliderProps) {
  return (
    <div
      className={cn('space-y-3', className)}
      data-testid="expiring-days-slider"
    >
      <div className="flex items-center justify-between">
        <Label
          htmlFor="expiring-days-slider"
          className="text-sm font-medium"
        >
          Show items expiring within{' '}
          <span className="font-bold text-primary">{days}</span> days
        </Label>
      </div>

      <Slider
        id="expiring-days-slider"
        value={days}
        onChange={onDaysChange}
        min={7}
        max={90}
        step={1}
        disabled={disabled}
        aria-label={`Show items expiring within ${days} days`}
        aria-valuemin={7}
        aria-valuemax={90}
        aria-valuenow={days}
      />

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>7 days</span>
        <span>30 days</span>
        <span>60 days</span>
        <span>90 days</span>
      </div>
    </div>
  )
}
