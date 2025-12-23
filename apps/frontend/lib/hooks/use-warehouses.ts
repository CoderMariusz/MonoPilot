/**
 * React Hook: Warehouses List
 * Story: 01.8 - Warehouse Management CRUD
 *
 * Fetches warehouses list with search, filter, pagination
 */

import { useState, useEffect } from 'react'
import type { Warehouse, WarehouseListParams } from '@/lib/types/warehouse'

interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}

/**
 * Fetches warehouses with optional filters
 */
export function useWarehouses(params: WarehouseListParams = {}) {
  const [data, setData] = useState<PaginatedResult<Warehouse> | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        setIsLoading(true)

        // Build query string
        const queryParams = new URLSearchParams()
        if (params.search) queryParams.append('search', params.search)
        if (params.type) queryParams.append('type', params.type)
        if (params.status) queryParams.append('status', params.status)
        if (params.sort) queryParams.append('sort', params.sort)
        if (params.order) queryParams.append('order', params.order)
        if (params.page) queryParams.append('page', params.page.toString())
        if (params.limit) queryParams.append('limit', params.limit.toString())

        const url = `/api/v1/settings/warehouses${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error('Failed to fetch warehouses')
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWarehouses()
  }, [
    params.search,
    params.type,
    params.status,
    params.sort,
    params.order,
    params.page,
    params.limit,
  ])

  return { data, isLoading, error }
}
