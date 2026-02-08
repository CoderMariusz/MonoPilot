/**
 * Production Work Orders List Page
 * BUG-012 Fix: Added missing page.tsx for /production/work-orders
 *
 * Shows work orders in production-relevant statuses:
 * - released, in_progress, on_hold (paused), completed
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { RefreshCw, Play, Pause, CheckCircle, Clock, AlertCircle, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import type { WOStatus, WOPriority } from '@/lib/types/work-order'

// Production-relevant statuses
const PRODUCTION_STATUSES: WOStatus[] = ['released', 'in_progress', 'on_hold', 'completed']

interface ProductionWorkOrder {
  id: string
  wo_number: string
  product_id: string
  product_code: string
  product_name: string
  planned_quantity: number
  produced_quantity: number
  uom: string
  status: WOStatus
  planned_start_date: string | null
  production_line_id: string | null
  production_line_name: string | null
  priority: WOPriority
  yield_percent: number | null
  started_at: string | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  released: { label: 'Released', color: 'bg-indigo-100 text-indigo-800', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: Play },
  on_hold: { label: 'Paused', color: 'bg-orange-100 text-orange-800', icon: Pause },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
}

const PRIORITY_CONFIG: Record<WOPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-600' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'High', color: 'bg-amber-100 text-amber-700' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700' },
}

export default function ProductionWorkOrdersPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [workOrders, setWorkOrders] = useState<ProductionWorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [lineFilter, setLineFilter] = useState<string>('all')

  // Reference data
  const [productionLines, setProductionLines] = useState<Array<{ id: string; name: string }>>([])

  // Fetch work orders
  const fetchWorkOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('status', PRODUCTION_STATUSES.join(','))
      params.append('limit', '100')
      params.append('sort', 'priority')
      params.append('order', 'desc')

      if (search) params.append('search', search)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (lineFilter !== 'all') params.append('line_id', lineFilter)

      const response = await fetch(`/api/planning/work-orders?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch work orders')
      }

      const data = await response.json()
      setWorkOrders(data.data || [])
    } catch (err) {
      console.error('Error fetching work orders:', err)
      setError(err instanceof Error ? err.message : 'Failed to load work orders')
      toast({
        title: 'Error',
        description: 'Failed to load work orders',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, lineFilter, toast])

  // Fetch production lines
  const fetchProductionLines = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/production-lines?is_active=true&limit=100')
      if (response.ok) {
        const data = await response.json()
        setProductionLines(data.production_lines || data.data || [])
      }
    } catch (err) {
      console.error('Error fetching production lines:', err)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchProductionLines()
    fetchWorkOrders()
  }, [fetchProductionLines, fetchWorkOrders])

  // Calculate progress
  const calculateProgress = (produced: number, planned: number): number => {
    if (planned <= 0) return 0
    return Math.min(100, Math.round((produced / planned) * 100))
  }

  // Get progress bar color
  const getProgressColor = (progress: number): string => {
    if (progress >= 100) return 'bg-green-500'
    if (progress >= 50) return 'bg-blue-500'
    return 'bg-gray-400'
  }

  // Navigate to WO detail
  const handleRowClick = (wo: ProductionWorkOrder) => {
    router.push(`/production/work-orders/${wo.id}`)
  }

  // KPI calculations
  const kpis = {
    released: workOrders.filter(wo => wo.status === 'released').length,
    inProgress: workOrders.filter(wo => wo.status === 'in_progress').length,
    onHold: workOrders.filter(wo => wo.status === 'on_hold').length,
    completed: workOrders.filter(wo => wo.status === 'completed').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/production/dashboard">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Dashboard
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Production Work Orders</h1>
            <p className="text-sm text-gray-500">Manage and execute production orders</p>
          </div>
          <Button onClick={fetchWorkOrders} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('released')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Clock className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpis.released}</p>
                  <p className="text-sm text-gray-500">Released</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('in_progress')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Play className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpis.inProgress}</p>
                  <p className="text-sm text-gray-500">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('on_hold')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Pause className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpis.onHold}</p>
                  <p className="text-sm text-gray-500">On Hold</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('completed')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpis.completed}</p>
                  <p className="text-sm text-gray-500">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by WO number or product..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {PRODUCTION_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_CONFIG[status]?.label || status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={lineFilter} onValueChange={setLineFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Lines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lines</SelectItem>
                  {productionLines.map((line) => (
                    <SelectItem key={line.id} value={line.id}>
                      {line.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(statusFilter !== 'all' || lineFilter !== 'all' || search) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('')
                    setStatusFilter('all')
                    setLineFilter('all')
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Work Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Work Orders</CardTitle>
            <CardDescription>
              {workOrders.length} work orders found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Loading work orders...</div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={fetchWorkOrders} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : workOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-gray-500">No work orders found</p>
                <p className="text-sm text-gray-400 mt-1">
                  {search || statusFilter !== 'all' || lineFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Release work orders from Planning to see them here'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium">WO Number</th>
                      <th className="text-left py-3 px-4 font-medium">Product</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Priority</th>
                      <th className="text-left py-3 px-4 font-medium">Progress</th>
                      <th className="text-left py-3 px-4 font-medium">Line</th>
                      <th className="text-left py-3 px-4 font-medium">Yield</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workOrders.map((wo) => {
                      const progress = calculateProgress(wo.produced_quantity, wo.planned_quantity)
                      const statusConfig = STATUS_CONFIG[wo.status]
                      const priorityConfig = PRIORITY_CONFIG[wo.priority]
                      const StatusIcon = statusConfig?.icon || Clock

                      return (
                        <tr
                          key={wo.id}
                          className="border-b hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleRowClick(wo)}
                        >
                          <td className="py-3 px-4">
                            <span className="font-medium text-blue-600 hover:underline">
                              {wo.wo_number}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{wo.product_name}</p>
                              <p className="text-xs text-gray-500">{wo.product_code}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={statusConfig?.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig?.label || wo.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={priorityConfig?.color}>
                              {priorityConfig?.label || wo.priority}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${getProgressColor(progress)}`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600 w-12">
                                {wo.produced_quantity}/{wo.planned_quantity}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {wo.production_line_name || '-'}
                          </td>
                          <td className="py-3 px-4">
                            {wo.yield_percent != null ? (
                              <span className={wo.yield_percent >= 95 ? 'text-green-600' : wo.yield_percent >= 80 ? 'text-yellow-600' : 'text-red-600'}>
                                {wo.yield_percent.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
