/**
 * Recent Activity Hook
 * Story: 07.15 - Shipping Dashboard + KPIs
 *
 * Hook for fetching recent activity
 */

import { useQuery } from '@tanstack/react-query'
import type { ActivityItem } from '@/lib/types/shipping-dashboard'

async function fetchRecentActivity(limit: number = 10): Promise<ActivityItem[]> {
  const response = await fetch(`/api/shipping/dashboard/recent-activity?limit=${limit}`)

  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized')
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch recent activity')
  }

  const data = await response.json()
  return data.activities || []
}

export function useRecentActivity(limit: number = 10) {
  return useQuery({
    queryKey: ['shipping-dashboard', 'activity', limit],
    queryFn: () => fetchRecentActivity(limit),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  })
}
