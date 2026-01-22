/**
 * Shipping Dashboard Hooks
 * Story: 07.15 - Shipping Dashboard + KPIs
 *
 * React Query hooks for dashboard data
 */

import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useCallback } from 'react'
import type {
  DashboardKPIs,
  DashboardAlerts,
  ActivityItem,
  DateRange,
} from '@/lib/types/shipping-dashboard'

// ============================================================================
// Query Keys
// ============================================================================

export const shippingDashboardKeys = {
  all: ['shipping-dashboard'] as const,
  kpis: (dateRange: string) => [...shippingDashboardKeys.all, 'kpis', dateRange] as const,
  alerts: (dateRange: string) => [...shippingDashboardKeys.all, 'alerts', dateRange] as const,
  activity: (limit: number) => [...shippingDashboardKeys.all, 'activity', limit] as const,
}

// ============================================================================
// Fetch Functions
// ============================================================================

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

async function fetchDashboardAlerts(): Promise<DashboardAlerts> {
  const response = await fetch('/api/shipping/dashboard/alerts')

  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized')
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch dashboard alerts')
  }

  return response.json()
}

async function fetchRecentActivity(limit: number = 10): Promise<ActivityItem[]> {
  const response = await fetch(`/api/shipping/dashboard/recent-activity?limit=${limit}`)

  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized')
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch recent activity')
  }

  const data = await response.json()
  return data.activities
}

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook for dashboard KPIs
 */
export function useDashboardKPIs(dateRange: DateRange) {
  const dateKey = `${dateRange.from.toISOString().split('T')[0]}_${dateRange.to.toISOString().split('T')[0]}`

  return useQuery({
    queryKey: shippingDashboardKeys.kpis(dateKey),
    queryFn: () => fetchDashboardKPIs(dateRange),
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  })
}

/**
 * Hook for dashboard alerts
 */
export function useDashboardAlerts() {
  const now = new Date()
  const dateKey = now.toISOString().split('T')[0]

  return useQuery({
    queryKey: shippingDashboardKeys.alerts(dateKey),
    queryFn: fetchDashboardAlerts,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  })
}

/**
 * Hook for recent activity
 */
export function useRecentActivity(limit: number = 10) {
  return useQuery({
    queryKey: shippingDashboardKeys.activity(limit),
    queryFn: () => fetchRecentActivity(limit),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  })
}

// ============================================================================
// Auto-Refresh Hook
// ============================================================================

export interface UseAutoRefreshOptions {
  intervalSeconds?: number
  enabled?: boolean
  onRefresh: () => void
}

export function useAutoRefresh({
  intervalSeconds = 30,
  enabled: initialEnabled = true,
  onRefresh,
}: UseAutoRefreshOptions) {
  const [isEnabled, setIsEnabled] = useState(initialEnabled)
  const [nextRefreshIn, setNextRefreshIn] = useState(intervalSeconds)

  useEffect(() => {
    if (!isEnabled) {
      setNextRefreshIn(0)
      return
    }

    setNextRefreshIn(intervalSeconds)

    const countdownInterval = setInterval(() => {
      setNextRefreshIn((prev) => {
        if (prev <= 1) {
          onRefresh()
          return intervalSeconds
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countdownInterval)
  }, [isEnabled, intervalSeconds, onRefresh])

  const toggle = useCallback((newValue?: boolean) => {
    setIsEnabled((prev) => (newValue !== undefined ? newValue : !prev))
  }, [])

  const refetch = useCallback(() => {
    onRefresh()
    setNextRefreshIn(intervalSeconds)
  }, [onRefresh, intervalSeconds])

  return {
    isEnabled,
    toggle,
    nextRefreshIn,
    refetch,
  }
}

// ============================================================================
// Date Range Hook
// ============================================================================

export function useDateRange(initialPreset: DateRange['preset'] = 'last_30') {
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

  const setPreset = useCallback((preset: DateRange['preset']) => {
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
