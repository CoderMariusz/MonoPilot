/**
 * Date Range Filter Component
 * Story: 07.15 - Shipping Dashboard + KPIs
 *
 * Filter with preset buttons and custom date picker
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { Calendar as CalendarIcon } from 'lucide-react'
import type { DateRange, DateRangePreset } from '@/lib/types/shipping-dashboard'

export interface DateRangeFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

const presets: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'last_7', label: 'Last 7 days' },
  { value: 'last_30', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom' },
]

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [customDialogOpen, setCustomDialogOpen] = useState(false)
  const [tempFrom, setTempFrom] = useState<Date | undefined>(value.from)
  const [tempTo, setTempTo] = useState<Date | undefined>(value.to)

  const handlePresetClick = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setTempFrom(value.from)
      setTempTo(value.to)
      setCustomDialogOpen(true)
      return
    }

    const now = new Date()
    let from: Date
    const to = new Date()

    switch (preset) {
      case 'today':
        from = new Date(now.setHours(0, 0, 0, 0))
        break
      case 'last_7':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'last_30':
      default:
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
    }

    onChange({ from, to, preset })
  }

  const handleCustomApply = () => {
    if (tempFrom && tempTo) {
      onChange({ from: tempFrom, to: tempTo, preset: 'custom' })
      setCustomDialogOpen(false)
    }
  }

  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Date range filter"
      data-testid="date-range-filter"
    >
      {presets.map((preset) => (
        <Button
          key={preset.value}
          variant={value.preset === preset.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetClick(preset.value)}
          data-active={value.preset === preset.value}
          className="focus-visible:ring-2"
        >
          {preset.value === 'custom' && (
            <CalendarIcon className="h-4 w-4 mr-1" />
          )}
          {preset.label}
        </Button>
      ))}

      <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Select Date Range</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <p className="text-sm font-medium mb-2">From</p>
              <Calendar
                mode="single"
                selected={tempFrom}
                onSelect={setTempFrom}
                disabled={(date) => date > new Date()}
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">To</p>
              <Calendar
                mode="single"
                selected={tempTo}
                onSelect={setTempTo}
                disabled={(date) =>
                  date > new Date() || (tempFrom ? date < tempFrom : false)
                }
              />
            </div>
          </div>
          {tempFrom && tempTo && (
            <p className="text-sm text-gray-500 text-center">
              {Math.ceil(
                (tempTo.getTime() - tempFrom.getTime()) / (1000 * 60 * 60 * 24)
              )}{' '}
              days selected
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCustomApply}
              disabled={!tempFrom || !tempTo}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DateRangeFilter
