/**
 * React Hook: Customer Order History
 * Story: 07.6 - SO Allergen Validation
 *
 * Fetches paginated order history for a specific customer.
 */

import { useState, useEffect, useCallback } from 'react'
import type { CustomerOrder } from '@/components/shipping/CustomerOrderHistory'

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface CustomerOrderHistoryResponse {
  orders: CustomerOrder[]
  pagination: PaginationInfo
}

export interface UseCustomerOrderHistoryParams {
  customerId: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  status?: string
}

export interface UseCustomerOrderHistoryResult {
  data: CustomerOrderHistoryResponse | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useCustomerOrderHistory({
  customerId,
  page = 1,
  limit = 20,
  sortBy = 'order_date',
  sortOrder = 'desc',
  status,
}: UseCustomerOrderHistoryParams): UseCustomerOrderHistoryResult {
  const [data, setData] = useState<CustomerOrderHistoryResponse | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  const fetchOrders = useCallback(async () => {
    if (!customerId) {
      setData(undefined)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy,
        sortOrder,
      })

      if (status) {
        params.append('status', status)
      }

      const response = await fetch(
        `/api/shipping/customers/${customerId}/orders?${params.toString()}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch customer order history')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [customerId, page, limit, sortBy, sortOrder, status, refetchTrigger])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1)
  }, [])

  return { data, isLoading, error, refetch }
}
