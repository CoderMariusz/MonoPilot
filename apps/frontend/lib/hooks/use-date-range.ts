/**
 * Date Range Hook
 * Story: 07.15 - Shipping Dashboard + KPIs
 *
 * Hook for managing date range state
 */

import { useState, useCallback } from 'react'
import type { DateRange, DateRangePreset } from '@/lib/types/shipping-dashboard'

export function useDateRange(initialPreset: DateRangePreset = 'last_30') {
  const getInitialRange = (): DateRange => {
    const now = new Date()
    const to = new Date()
    let from: Date

    switch (initialPreset) {
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

    return { from, to, preset: initialPreset }
  }

  const [dateRange, setDateRange] = useState<DateRange>(getInitialRange)

  const setPreset = useCallback((preset: DateRangePreset) => {
    const now = new Date()
    const to = new Date()
    let from: Date

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

    setDateRange({ from, to, preset })
  }, [])

  return {
    dateRange,
    setDateRange,
    preset: dateRange.preset,
    setPreset,
  }
}
