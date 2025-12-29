/**
 * React Query Hooks for Technical Dashboard (Story 02.12)
 *
 * Provides hooks for:
 * - useDashboardStats: Stats cards (Products, BOMs, Routings, Avg Cost)
 * - useAllergenMatrix: Allergen matrix heatmap
 * - useBomTimeline: BOM version timeline
 * - useRecentActivity: Activity feed
 * - useCostTrends: Cost trends chart data
 */

import { useQuery } from '@tanstack/react-query'
import type {
  DashboardStatsResponse,
  TechnicalAllergenMatrixResponse,
  BomTimelineResponse,
  TechnicalRecentActivityResponse,
  CostTrendsResponse
} from '@/lib/types/dashboard'

// Query keys for cache management
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  allergenMatrix: (productType?: string) => [...dashboardKeys.all, 'allergen-matrix', productType] as const,
  bomTimeline: (productId?: string, months?: number) => [...dashboardKeys.all, 'bom-timeline', productId, months] as const,
  recentActivity: (limit?: number) => [...dashboardKeys.all, 'recent-activity', limit] as const,
  costTrends: (months?: number) => [...dashboardKeys.all, 'cost-trends', months] as const,
}

/**
 * Fetch dashboard stats
 */
async function fetchDashboardStats(): Promise<DashboardStatsResponse> {
  const response = await fetch('/api/technical/dashboard/stats')

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized')
    }
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch dashboard stats')
  }

  return response.json()
}

/**
 * Fetch allergen matrix
 */
async function fetchAllergenMatrix(productType?: string): Promise<TechnicalAllergenMatrixResponse> {
  const params = new URLSearchParams()
  if (productType) {
    params.append('product_types', productType)
  }

  const url = `/api/technical/dashboard/allergen-matrix${params.toString() ? `?${params.toString()}` : ''}`
  const response = await fetch(url)

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized')
    }
    if (response.status === 400) {
      throw new Error('Invalid product type filter')
    }
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch allergen matrix')
  }

  const data = await response.json()

  // Transform from existing format to Story 02.12 format
  return {
    allergens: data.allergens.map((a: any) => ({
      id: a.id,
      code: a.code,
      name: a.name
    })),
    products: data.matrix.map((row: any) => ({
      id: row.product_id,
      code: row.product_code,
      name: row.product_name,
      allergen_relations: Object.fromEntries(
        Object.entries(row.allergens).map(([k, v]) => [
          k,
          v === 'contains' ? 'contains' : v === 'may_contain' ? 'may_contain' : null
        ])
      )
    }))
  }
}

/**
 * Fetch BOM timeline
 */
async function fetchBomTimeline(
  productId?: string,
  months: number = 6,
  limit: number = 50
): Promise<BomTimelineResponse> {
  const params = new URLSearchParams()
  if (productId) params.append('product_id', productId)
  params.append('months', months.toString())
  params.append('limit', limit.toString())

  const response = await fetch(`/api/technical/dashboard/bom-timeline?${params.toString()}`)

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized')
    }
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch BOM timeline')
  }

  return response.json()
}

/**
 * Fetch recent activity for technical dashboard
 */
async function fetchRecentActivity(limit: number = 10): Promise<TechnicalRecentActivityResponse> {
  const response = await fetch(`/api/technical/dashboard/recent-activity?limit=${limit}`)

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized')
    }
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch recent activity')
  }

  const data = await response.json()

  // Transform from existing format to Story 02.12 format
  return {
    activities: (data.activities || []).map((a: any) => ({
      id: a.id,
      type: a.change_type === 'created' ? 'product_created' : 'product_updated',
      entity_type: 'product' as const,
      entity_id: a.product_id,
      description: `Product ${a.product_code} ${a.change_type}`,
      user_id: a.changed_by || '',
      user_name: a.changed_by_name || 'Unknown',
      timestamp: a.changed_at,
      relative_time: formatRelativeTimeClient(a.changed_at),
      link: `/technical/products/${a.product_id}`
    }))
  }
}

/**
 * Fetch cost trends
 */
async function fetchCostTrends(months: number = 6): Promise<CostTrendsResponse> {
  const response = await fetch(`/api/technical/dashboard/cost-trends?months=${months}`)

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized')
    }
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to fetch cost trends')
  }

  return response.json()
}

/**
 * Client-side relative time formatter
 */
function formatRelativeTimeClient(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now.getTime() - date.getTime()

  if (diffMs < 0) return 'just now'

  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Dashboard Stats Hook
 * AC-12.01: Stats cards display within 500ms
 * Stale time: 1 minute
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: fetchDashboardStats,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  })
}

/**
 * Allergen Matrix Hook
 * AC-12.06 to AC-12.12: Allergen heatmap
 * Stale time: 10 minutes
 */
export function useAllergenMatrix(productType?: string) {
  return useQuery({
    queryKey: dashboardKeys.allergenMatrix(productType),
    queryFn: () => fetchAllergenMatrix(productType),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * BOM Timeline Hook
 * AC-12.13 to AC-12.16: BOM version timeline
 * Stale time: 5 minutes
 */
export function useBomTimeline(productId?: string, months: number = 6, limit: number = 50) {
  return useQuery({
    queryKey: dashboardKeys.bomTimeline(productId, months),
    queryFn: () => fetchBomTimeline(productId, months, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Recent Activity Hook
 * AC-12.17 to AC-12.19: Activity feed
 * Stale time: 30 seconds
 */
export function useRecentActivity(limit: number = 10) {
  return useQuery({
    queryKey: dashboardKeys.recentActivity(limit),
    queryFn: () => fetchRecentActivity(limit),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  })
}

/**
 * Cost Trends Hook
 * AC-12.20 to AC-12.22: Cost trends chart
 * Stale time: 5 minutes
 */
export function useCostTrends(months: number = 6) {
  return useQuery({
    queryKey: dashboardKeys.costTrends(months),
    queryFn: () => fetchCostTrends(months),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
