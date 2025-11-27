'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

interface WorkOrder {
  id: string
  wo_number: string
  status: string
  planned_start_date: string | null
  produced_quantity: number
  planned_quantity: number
  machines?: {
    name: string
    code: string
  }
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  released: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-green-100 text-green-700',
  completed: 'bg-purple-100 text-purple-700',
  closed: 'bg-gray-200 text-gray-800',
  cancelled: 'bg-red-100 text-red-700',
}

export function TopWOCards() {
  const [wos, setWOs] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecentWOs() {
      try {
        const response = await fetch('/api/planning/work-orders?limit=3&sort_by=created_at&sort_direction=desc')
        if (response.ok) {
          const data = await response.json()
          setWOs(data.work_orders?.slice(0, 3) || [])
        }
      } catch (error) {
        console.error('Error fetching recent WOs:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchRecentWOs()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (wos.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No recent work orders
      </div>
    )
  }

  const getProgressPercentage = (produced: number, planned: number) => {
    if (planned === 0) return 0
    return Math.min(100, Math.round((produced / planned) * 100))
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700">Recent Work Orders</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {wos.map((wo) => {
          const progress = getProgressPercentage(wo.produced_quantity, wo.planned_quantity)
          return (
            <Link key={wo.id} href={`/planning/work-orders/${wo.id}`}>
              <div
                className="border rounded-lg px-3 py-2 hover:shadow-md transition-shadow cursor-pointer bg-white"
                style={{ maxHeight: '100px' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{wo.wo_number}</span>
                  <Badge className={`text-[10px] px-1.5 py-0 ${statusColors[wo.status] || statusColors.draft}`}>
                    {wo.status.replace(/_/g, ' ').toLowerCase()}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 truncate">{wo.machines?.name || 'No machine'}</p>
                <div className="mt-1.5">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-gray-500">Progress</span>
                    <span className="text-xs font-medium text-gray-700">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
