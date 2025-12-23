/**
 * React Hook: Single Machine
 * Story: 01.10 - Machines CRUD
 *
 * Fetches a single machine by ID
 */

import { useState, useEffect } from 'react'
import type { Machine } from '@/lib/types/machine'

/**
 * Fetches single machine by ID
 */
export function useMachine(id: string | null) {
  const [data, setData] = useState<Machine | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!id) {
      setData(undefined)
      setIsLoading(false)
      return
    }

    const fetchMachine = async () => {
      try {
        setIsLoading(true)

        const url = `/api/v1/settings/machines/${id}`
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error('Failed to fetch machine')
        }

        const result = await response.json()
        setData(result.machine)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMachine()
  }, [id])

  return { data, isLoading, error }
}
