'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

interface PurchaseOrder {
  id: string
  po_number: string
  status: string
  expected_delivery_date: string
  total: number
  currency: string
  suppliers?: {
    name: string
    code: string
  }
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  receiving: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
}

export function TopPOCards() {
  const [pos, setPOs] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecentPOs() {
      try {
        const response = await fetch('/api/planning/purchase-orders?limit=3&sort_by=created_at&sort_direction=desc')
        if (response.ok) {
          const data = await response.json()
          setPOs(data.purchase_orders?.slice(0, 3) || [])
        }
      } catch (error) {
        console.error('Error fetching recent POs:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchRecentPOs()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (pos.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No recent purchase orders
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700">Recent Purchase Orders</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {pos.map((po) => (
          <Link key={po.id} href={`/planning/purchase-orders/${po.id}`}>
            <div
              className="border rounded-lg px-3 py-2 hover:shadow-md transition-shadow cursor-pointer bg-white"
              style={{ maxHeight: '80px' }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{po.po_number}</span>
                <Badge className={`text-[10px] px-1.5 py-0 ${statusColors[po.status] || statusColors.draft}`}>
                  {po.status}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 truncate">{po.suppliers?.name || 'No supplier'}</p>
              <p className="text-xs text-gray-400">
                {new Date(po.expected_delivery_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
