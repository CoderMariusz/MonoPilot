/**
 * useLocationTree Hook
 * Story: 01.9 - Location Hierarchy Management
 */

'use client'

import { useState, useEffect } from 'react'
import type { LocationTreeResponse, LocationListParams } from '@/lib/types/location'

interface UseLocationTreeResult {
  data: LocationTreeResponse | null
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

export function useLocationTree(
  warehouseId: string,
  params: LocationListParams = {}
): UseLocationTreeResult {
  const [data, setData] = useState<LocationTreeResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refetch = () => {
    setRefreshKey((prev) => prev + 1)
  }

  useEffect(() => {
    const fetchLocationTree = async () => {
      setIsLoading(true)
      setIsError(false)
      setError(null)

      try {
        // Build query params
        const queryParams = new URLSearchParams()
        if (params.view) queryParams.append('view', params.view)
        if (params.level) queryParams.append('level', params.level)
        if (params.type) queryParams.append('type', params.type)
        if (params.parent_id) queryParams.append('parent_id', params.parent_id)
        if (params.search) queryParams.append('search', params.search)
        if (params.include_capacity !== undefined) {
          queryParams.append('include_capacity', params.include_capacity.toString())
        }

        const queryString = queryParams.toString()
        const url = `/api/v1/settings/warehouses/${warehouseId}/locations${queryString ? `?${queryString}` : ''}`

        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })

        const responseData = await response.json()

        if (!response.ok) {
          throw new Error(responseData.error || 'Failed to fetch location tree')
        }

        setData(responseData)
      } catch (err) {
        setIsError(true)
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setIsLoading(false)
      }
    }

    if (warehouseId) {
      fetchLocationTree()
    }
  }, [warehouseId, params.view, params.level, params.type, params.parent_id, params.search, params.include_capacity, refreshKey])

  return { data, isLoading, isError, error, refetch }
}
