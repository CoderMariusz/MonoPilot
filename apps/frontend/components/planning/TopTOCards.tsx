'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

interface TransferOrder {
  id: string
  to_number: string
  status: string
  from_warehouse_id: string
  to_warehouse_id: string
  created_at: string
  from_warehouses?: {
    name: string
    code: string
  }
  to_warehouses?: {
    name: string
    code: string
  }
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-700',
  in_transit: 'bg-blue-100 text-blue-700',
  received: 'bg-green-100 text-green-700',
  completed: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
}

export function TopTOCards() {
  const [tos, setTOs] = useState<TransferOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecentTOs() {
      try {
        const response = await fetch('/api/planning/transfer-orders?limit=3&sort_by=created_at&sort_direction=desc')
        if (response.ok) {
          const data = await response.json()
          setTOs(data.transfer_orders?.slice(0, 3) || [])
        }
      } catch (error) {
        console.error('Error fetching recent TOs:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchRecentTOs()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (tos.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No recent transfer orders
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700">Recent Transfer Orders</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {tos.map((to) => (
          <Link key={to.id} href={`/planning/transfer-orders/${to.id}`}>
            <div
              className="border rounded-lg px-3 py-2 hover:shadow-md transition-shadow cursor-pointer bg-white"
              style={{ maxHeight: '100px' }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{to.to_number}</span>
                <Badge className={`text-[10px] px-1.5 py-0 ${statusColors[to.status] || statusColors.draft}`}>
                  {to.status.toLowerCase()}
                </Badge>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-gray-600 truncate">From: {to.from_warehouses?.name || 'Unknown'}</p>
                <p className="text-xs text-gray-600 truncate">To: {to.to_warehouses?.name || 'Unknown'}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
