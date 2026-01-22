/**
 * Dashboard KPIs Hook
 * Story: 07.15 - Shipping Dashboard + KPIs
 *
 * Hook for fetching dashboard KPIs
 */

import { useQuery } from '@tanstack/react-query'
import type { DashboardKPIs, DateRange } from '@/lib/types/shipping-dashboard'

async function fetchDashboardKPIs(dateRange: DateRange): Promise<DashboardKPIs> {
  const params = new URLSearchParams()

  if (dateRange.preset !== 'custom') {
    params.set('date_range', dateRange.preset)
  } else {
    params.set('date_from', dateRange.from.toISOString().split('T')[0])
    params.set('date_to', dateRange.to.toISOString().split('T')[0])
  }

  const response = await fetch(`/api/shipping/dashboard?${params.toString()}`)

  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized')
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch dashboard KPIs')
  }

  return response.json()
}

export function useDashboardKPIs(dateRange: DateRange) {
  const dateKey = `${dateRange.from.toISOString().split('T')[0]}_${dateRange.to.toISOString().split('T')[0]}`

  return useQuery({
    queryKey: ['shipping-dashboard', 'kpis', dateKey],
    queryFn: () => fetchDashboardKPIs(dateRange),
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  })
}
