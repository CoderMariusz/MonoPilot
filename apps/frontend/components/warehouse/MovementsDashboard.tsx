/**
 * Movements Dashboard - Story 5.15b
 * Statistics and overview of all license plate movements
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import {
  TrendingUp,
  Package,
  BarChart3,
  Filter,
  Calendar,
} from 'lucide-react'

interface MovementStats {
  total_movements: number
  by_type: {
    movement_type: string
    count: number
    total_qty_change: number
  }[]
  by_day: {
    date: string
    count: number
  }[]
  top_products: {
    product_code: string
    product_name: string
    movement_count: number
  }[]
}

interface Warehouse {
  id: string
  code: string
  name: string
}

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  creation: 'Created',
  receipt: 'Received',
  consumption: 'Consumed',
  reversal: 'Reversed',
  adjustment: 'Adjusted',
  transfer: 'Transferred',
  split: 'Split',
  merge: 'Merged',
  partial_move: 'Partial Move',
  full_move: 'Moved',
}

const DATE_RANGES = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
]

export function MovementsDashboard() {
  const { toast } = useToast()

  const [stats, setStats] = useState<MovementStats | null>(null)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('30')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWarehouses()
  }, [])

  useEffect(() => {
    fetchStats()
  }, [selectedWarehouse, dateRange])

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/settings/warehouses')
      if (!response.ok) throw new Error('Failed to fetch warehouses')
      const data = await response.json()
      setWarehouses(data.warehouses || [])
    } catch (error) {
      // Silent fail - not critical
    }
  }

  const fetchStats = async () => {
    try {
      setLoading(true)

      const days = parseInt(dateRange)
      const startDate = startOfDay(subDays(new Date(), days))
      const endDate = endOfDay(new Date())

      const params = new URLSearchParams({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      })

      if (selectedWarehouse && selectedWarehouse !== 'all') {
        params.append('warehouse_id', selectedWarehouse)
      }

      const response = await fetch(`/api/warehouse/movements/stats?${params}`)

      if (!response.ok) throw new Error('Failed to fetch stats')

      const data = await response.json()
      setStats(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load movement statistics',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 text-muted-foreground">
          Loading statistics...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Movement Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            Track and analyze license plate movements
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Date Range Filter */}
          <div className="space-y-1.5 flex-1 sm:flex-initial">
            <Label htmlFor="dateRange" className="text-xs flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Period
            </Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger id="dateRange" className="w-full sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGES.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Warehouse Filter */}
          <div className="space-y-1.5 flex-1 sm:flex-initial">
            <Label htmlFor="warehouse" className="text-xs flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Warehouse
            </Label>
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger id="warehouse" className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Movements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Movements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.total_movements || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              In last {dateRange} days
            </p>
          </CardContent>
        </Card>

        {/* Top Movement Types (3 cards) */}
        {stats?.by_type.slice(0, 3).map((type, idx) => (
          <Card key={type.movement_type}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                {MOVEMENT_TYPE_LABELS[type.movement_type] || type.movement_type}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{type.count}</p>
              <p className="text-xs text-muted-foreground mt-1">
                movements
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Movement Types Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Movement Types Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.by_type && stats.by_type.length > 0 ? (
            <div className="space-y-3">
              {stats.by_type.map((type) => {
                const percentage = stats.total_movements > 0
                  ? (type.count / stats.total_movements) * 100
                  : 0

                return (
                  <div key={type.movement_type} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {MOVEMENT_TYPE_LABELS[type.movement_type] || type.movement_type}
                      </span>
                      <span className="text-muted-foreground">
                        {type.count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No movement data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Products */}
      {stats?.top_products && stats.top_products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Most Active Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.top_products.map((product, idx) => (
                <div
                  key={`${product.product_code}-${idx}`}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div>
                    <p className="font-medium text-sm">{product.product_code}</p>
                    <p className="text-xs text-muted-foreground">{product.product_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{product.movement_count}</p>
                    <p className="text-xs text-muted-foreground">movements</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
