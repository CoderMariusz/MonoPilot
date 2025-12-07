/**
 * Expiring License Plates Widget
 * Stories 5.1-5.4: LP Core UI
 * Dashboard widget showing LPs expiring soon
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format, differenceInDays } from 'date-fns'
import { AlertTriangle, ChevronRight, Package } from 'lucide-react'

interface LicensePlate {
  id: string
  lp_number: string
  product?: {
    code: string
    name: string
  }
  current_qty: number
  uom: string
  expiry_date: string
  warehouse?: {
    code: string
  }
}

interface ExpiringLPsWidgetProps {
  className?: string
}

export function ExpiringLPsWidget({ className }: ExpiringLPsWidgetProps) {
  const router = useRouter()
  const [lps7Days, setLps7Days] = useState<LicensePlate[]>([])
  const [lps14Days, setLps14Days] = useState<LicensePlate[]>([])
  const [lps30Days, setLps30Days] = useState<LicensePlate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExpiringLPs()
  }, [])

  const fetchExpiringLPs = async () => {
    try {
      setLoading(true)

      const today = new Date()
      const date7 = new Date()
      date7.setDate(date7.getDate() + 7)
      const date14 = new Date()
      date14.setDate(date14.getDate() + 14)
      const date30 = new Date()
      date30.setDate(date30.getDate() + 30)

      // Fetch 7 days
      const response7 = await fetch(
        `/api/warehouse/license-plates?status=available&expiry_before=${date7.toISOString().split('T')[0]}&expiry_after=${today.toISOString().split('T')[0]}&limit=5`
      )
      if (response7.ok) {
        const data7 = await response7.json()
        setLps7Days(data7.data || [])
      }

      // Fetch 14 days
      const response14 = await fetch(
        `/api/warehouse/license-plates?status=available&expiry_before=${date14.toISOString().split('T')[0]}&expiry_after=${today.toISOString().split('T')[0]}&limit=5`
      )
      if (response14.ok) {
        const data14 = await response14.json()
        setLps14Days(data14.data || [])
      }

      // Fetch 30 days
      const response30 = await fetch(
        `/api/warehouse/license-plates?status=available&expiry_before=${date30.toISOString().split('T')[0]}&expiry_after=${today.toISOString().split('T')[0]}&limit=5`
      )
      if (response30.ok) {
        const data30 = await response30.json()
        setLps30Days(data30.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch expiring LPs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysUntilExpiry = (expiryDate: string) => {
    return differenceInDays(new Date(expiryDate), new Date())
  }

  const handleViewAll = (days: number) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    router.push(`/warehouse/inventory?expiry_filter=${days}`)
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            Expiring License Plates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          Expiring License Plates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleViewAll(7)}
            className="bg-red-50 border border-red-200 rounded-lg p-3 text-center hover:bg-red-100 transition-colors"
          >
            <p className="text-2xl font-bold text-red-600">{lps7Days.length}</p>
            <p className="text-xs text-red-800">7 days</p>
          </button>

          <button
            onClick={() => handleViewAll(14)}
            className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center hover:bg-orange-100 transition-colors"
          >
            <p className="text-2xl font-bold text-orange-600">{lps14Days.length}</p>
            <p className="text-xs text-orange-800">14 days</p>
          </button>

          <button
            onClick={() => handleViewAll(30)}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center hover:bg-yellow-100 transition-colors"
          >
            <p className="text-2xl font-bold text-yellow-600">{lps30Days.length}</p>
            <p className="text-xs text-yellow-800">30 days</p>
          </button>
        </div>

        {/* Top 5 Expiring Soon */}
        {lps7Days.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Expiring in Next 7 Days
            </p>
            <div className="space-y-2">
              {lps7Days.slice(0, 5).map((lp) => {
                const daysLeft = getDaysUntilExpiry(lp.expiry_date)
                return (
                  <button
                    key={lp.id}
                    onClick={() => router.push(`/warehouse/inventory/${lp.id}`)}
                    className="w-full flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate flex items-center gap-2">
                        <Package className="h-3 w-3 flex-shrink-0" />
                        {lp.lp_number}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {lp.product?.code} - {lp.product?.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Badge
                        variant="destructive"
                        className={daysLeft === 0 ? 'bg-red-600' : daysLeft <= 3 ? 'bg-orange-600' : ''}
                      >
                        {daysLeft === 0 ? 'Today' : `${daysLeft}d`}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* No Expiring LPs */}
        {lps7Days.length === 0 && lps14Days.length === 0 && lps30Days.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              No license plates expiring in the next 30 days
            </p>
          </div>
        )}

        {/* View All Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => router.push('/warehouse/inventory')}
        >
          View All Inventory
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  )
}
