/**
 * Dashboard Alerts Hook
 * Story: 07.15 - Shipping Dashboard + KPIs
 *
 * Hook for fetching dashboard alerts
 */

import { useQuery } from '@tanstack/react-query'
import type { DashboardAlerts } from '@/lib/types/shipping-dashboard'

async function fetchDashboardAlerts(): Promise<DashboardAlerts> {
  const response = await fetch('/api/shipping/dashboard/alerts')

  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized')
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch dashboard alerts')
  }

  return response.json()
}

export function useDashboardAlerts() {
  const now = new Date()
  const dateKey = now.toISOString().split('T')[0]

  return useQuery({
    queryKey: ['shipping-dashboard', 'alerts', dateKey],
    queryFn: fetchDashboardAlerts,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  })
}
