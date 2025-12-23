/**
 * React Hook: Allergens List
 * Story: 01.12 - Allergens Management
 *
 * Fetches global allergens list (14 EU-mandated allergens)
 * No org_id filtering - global reference data
 */

import { useState, useEffect } from 'react'
import type { Allergen } from '@/lib/types/allergen'

interface UseAllergensResult {
  data: Allergen[] | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Fetches all 14 EU allergens
 * No parameters needed - always returns all allergens sorted by display_order
 */
export function useAllergens(): UseAllergensResult {
  const [data, setData] = useState<Allergen[] | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  useEffect(() => {
    const fetchAllergens = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch('/api/v1/settings/allergens')

        if (!response.ok) {
          throw new Error('Failed to fetch allergens')
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllergens()
  }, [refetchTrigger])

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1)
  }

  return { data, isLoading, error, refetch }
}
