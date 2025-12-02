'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { OperationTimeline } from './OperationTimeline'

interface OperationTimelinePanelProps {
  woId: string
}

interface Operation {
  id: string
  sequence: number
  operation_name: string
  status: string
  started_at: string | null
  completed_at: string | null
  expected_duration_minutes: number
  actual_duration_minutes: number | null
  actual_yield_percent: number | null
  started_by_user?: {
    first_name: string | null
    last_name: string | null
  } | null
}

export function OperationTimelinePanel({ woId }: OperationTimelinePanelProps) {
  const [operations, setOperations] = useState<Operation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOperations = async () => {
      try {
        const response = await fetch(`/api/production/work-orders/${woId}/operations`)
        if (response.ok) {
          const { data } = await response.json()
          setOperations(data || [])
        }
      } catch (error) {
        console.error('Failed to fetch operations for timeline:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOperations()
  }, [woId])

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <OperationTimeline operations={operations} />
}
