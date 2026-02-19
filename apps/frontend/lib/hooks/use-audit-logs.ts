/**
 * React Hook: Audit Logs
 * Story: 01.17 - Audit Trail
 *
 * Fetches audit logs with search, filters, and infinite scroll pagination
 * Uses React Query for caching and infinite query support
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import type { AuditLog, AuditLogListParams, PaginatedResult } from '@/lib/types/audit-log'

const DEFAULT_LIMIT = 100

/**
 * Fetches audit logs with infinite scroll pagination
 */
export function useAuditLogs(filters: Omit<AuditLogListParams, 'page' | 'offset' | 'limit'> = {}) {
  return useInfiniteQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async ({ pageParam = 0 }) => {
      // Build query string
      const queryParams = new URLSearchParams()
      if (filters.search) queryParams.append('search', filters.search)
      if (filters.user_id?.length) queryParams.append('user_id', filters.user_id.join(','))
      if (filters.action?.length) queryParams.append('action', filters.action.join(','))
      if (filters.entity_type?.length) queryParams.append('entity_type', filters.entity_type.join(','))
      if (filters.date_from) queryParams.append('date_from', filters.date_from)
      if (filters.date_to) queryParams.append('date_to', filters.date_to)
      queryParams.append('limit', DEFAULT_LIMIT.toString())
      queryParams.append('offset', pageParam.toString())

      const url = `/api/settings/audit-logs?${queryParams.toString()}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs')
      }

      return response.json() as Promise<PaginatedResult<AuditLog>>
    },
    getNextPageParam: (lastPage) => {
      const nextOffset = lastPage.page * lastPage.limit
      return nextOffset < lastPage.total ? nextOffset : undefined
    },
    initialPageParam: 0,
    staleTime: 30000, // Cache for 30 seconds
  })
}

/**
 * Fetches audit logs with standard pagination (for export)
 */
export function useAuditLogsPaginated(params: AuditLogListParams = {}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['audit-logs-paginated', params],
    queryFn: async () => {
      // Build query string
      const queryParams = new URLSearchParams()
      if (params.search) queryParams.append('search', params.search)
      if (params.user_id?.length) queryParams.append('user_id', params.user_id.join(','))
      if (params.action?.length) queryParams.append('action', params.action.join(','))
      if (params.entity_type?.length) queryParams.append('entity_type', params.entity_type.join(','))
      if (params.date_from) queryParams.append('date_from', params.date_from)
      if (params.date_to) queryParams.append('date_to', params.date_to)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())

      const url = `/api/settings/audit-logs?${queryParams.toString()}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs')
      }

      return response.json() as Promise<PaginatedResult<AuditLog>>
    },
    staleTime: 30000,
  })

  return { data, isLoading, error, refetch }
}

/**
 * Fetches total count of audit logs for export warning
 */
export function useAuditLogsCount(filters: Omit<AuditLogListParams, 'page' | 'offset' | 'limit'> = {}) {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs-count', filters],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (filters.search) queryParams.append('search', filters.search)
      if (filters.user_id?.length) queryParams.append('user_id', filters.user_id.join(','))
      if (filters.action?.length) queryParams.append('action', filters.action.join(','))
      if (filters.entity_type?.length) queryParams.append('entity_type', filters.entity_type.join(','))
      if (filters.date_from) queryParams.append('date_from', filters.date_from)
      if (filters.date_to) queryParams.append('date_to', filters.date_to)

      const url = `/api/settings/audit-logs/count?${queryParams.toString()}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs count')
      }

      const result = await response.json()
      return result.count as number
    },
    staleTime: 30000,
  })

  return { count: data ?? 0, isLoading }
}
