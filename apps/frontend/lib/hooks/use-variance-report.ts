/**
 * useVarianceReport Hook (Story 02.15)
 * React Query hook for fetching variance analysis data
 */

import { useQuery } from '@tanstack/react-query'
import type { VarianceReportResponse } from '@/lib/types/variance'

// Query keys for cache management
export const varianceReportKeys = {
  all: ['variance-report'] as const,
  detail: (productId: string, periodDays: number) =>
    [...varianceReportKeys.all, productId, periodDays] as const,
}

/**
 * Fetch variance report data from API
 */
async function fetchVarianceReport(
  productId: string,
  periodDays: number
): Promise<VarianceReportResponse> {
  const params = new URLSearchParams({
    productId,
    period: String(periodDays),
  })

  const url = `/api/technical/costing/variance/report?${params.toString()}`
  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || error.error || 'Failed to fetch variance report')
  }

  return response.json()
}

/**
 * Hook to fetch variance report for a product
 * @param productId - Product ID to fetch variance for
 * @param periodDays - Number of days to analyze (7, 30, 90, 365)
 * @returns React Query result with VarianceReportResponse
 */
export function useVarianceReport(productId: string, periodDays: number = 30) {
  return useQuery<VarianceReportResponse, Error>({
    queryKey: varianceReportKeys.detail(productId, periodDays),
    queryFn: () => fetchVarianceReport(productId, periodDays),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!productId,
  })
}
