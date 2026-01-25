'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw } from 'lucide-react'
import type { KPIData, ActiveWorkOrder, Alert } from '@/lib/services/production-dashboard-service'

export default function ProductionDashboardPage() {
  const [kpis, setKpis] = useState<KPIData | null>(null)
  const [activeWOs, setActiveWOs] = useState<ActiveWorkOrder[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshInterval, setRefreshInterval] = useState(30)
  const { toast } = useToast()

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const [kpisRes, wosRes, alertsRes] = await Promise.all([
        fetch('/api/production/dashboard/kpis'),
        fetch('/api/production/dashboard/active-wos'),
        fetch('/api/production/dashboard/alerts'),
      ])

      if (!kpisRes.ok || !wosRes.ok || !alertsRes.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const kpisData = await kpisRes.json()
      const wosData = await wosRes.json()
      const alertsData = await alertsRes.json()

      setKpis(kpisData.data)
      setActiveWOs(wosData.data || [])
      setAlerts(alertsData.data || [])
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Fetch production settings for refresh interval
  const fetchRefreshInterval = useCallback(async () => {
    try {
      const response = await fetch('/api/production/settings')
      if (response.ok) {
        const data = await response.json()
        setRefreshInterval(data.settings?.dashboard_refresh_seconds || 30)
      }
    } catch (error) {
      console.error('Error fetching refresh interval:', error)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchRefreshInterval()
    fetchDashboardData()
  }, [fetchDashboardData, fetchRefreshInterval])

  // Auto-refresh interval
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, refreshInterval * 1000)
    return () => clearInterval(interval)
  }, [refreshInterval, fetchDashboardData])

  const handleManualRefresh = async () => {
    await fetchDashboardData()
    toast({
      title: 'Success',
      description: 'Dashboard refreshed',
    })
  }

  const getYieldColor = (yield_percent: number): string => {
    if (yield_percent >= 95) return 'text-green-600 bg-green-50'
    if (yield_percent >= 80) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getProgressBarColor = (progress: number): string => {
    if (progress >= 100) return 'bg-green-500'
    if (progress >= 50) return 'bg-yellow-500'
    return 'bg-gray-300'
  }

  const getSeverityColor = (severity: string): string => {
    return severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
  }

  if (loading && !kpis) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Production Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Real-time production metrics and status
            {lastUpdated && (
              <span className="ml-2 text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <Button onClick={handleManualRefresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4" data-testid="kpi-cards-grid">
        {/* Orders Today */}
        <Card data-testid="kpi-orders-today">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{kpis?.orders_today || 0}</div>
            <p className="text-xs text-gray-500 mt-2">Work orders completed</p>
          </CardContent>
        </Card>

        {/* Units Produced */}
        <Card data-testid="kpi-units-produced">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Units Produced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{kpis?.units_produced_today || 0}</div>
            <p className="text-xs text-gray-500 mt-2">Total output today</p>
          </CardContent>
        </Card>

        {/* Average Yield */}
        <Card data-testid="kpi-avg-yield">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Yield</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold rounded p-2 ${getYieldColor(kpis?.avg_yield_today || 0)}`}>
              {(kpis?.avg_yield_today || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-2">Weighted average</p>
          </CardContent>
        </Card>

        {/* Active WOs */}
        <Card data-testid="kpi-active-wos">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active WOs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{kpis?.active_wos || 0}</div>
            <p className="text-xs text-gray-500 mt-2">In progress or paused</p>
          </CardContent>
        </Card>

        {/* Material Shortages */}
        <Card data-testid="kpi-material-shortages">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Shortages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{kpis?.material_shortages || 0}</div>
            <p className="text-xs text-gray-500 mt-2">Material alerts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Work Orders Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Active Work Orders</CardTitle>
              <CardDescription>Work orders in progress or paused</CardDescription>
            </CardHeader>
            <CardContent>
              {activeWOs.length === 0 ? (
                <div className="text-center text-gray-500 py-8" data-testid="wos-empty">No active work orders</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="active-wos-table">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-3 px-2">WO Number</th>
                        <th className="text-left py-3 px-2">Product</th>
                        <th className="text-left py-3 px-2">Qty (Plan/Actual)</th>
                        <th className="text-left py-3 px-2">Progress</th>
                        <th className="text-left py-3 px-2">Status</th>
                        <th className="text-left py-3 px-2">Line</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeWOs.map((wo) => (
                        <tr key={wo.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-2">
                            <a href={`/production/work-orders/${wo.id}`} className="text-blue-600 hover:underline font-medium">
                              {wo.wo_number}
                            </a>
                          </td>
                          <td className="py-3 px-2">{wo.product_name}</td>
                          <td className="py-3 px-2">
                            {wo.planned_quantity} / {wo.produced_quantity}
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${getProgressBarColor(wo.progress_percent)}`}
                                  style={{ width: `${Math.min(wo.progress_percent, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600">{wo.progress_percent.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <Badge variant={wo.status === 'in_progress' ? 'default' : 'secondary'}>
                              {wo.status === 'in_progress' ? 'In Progress' : 'Paused'}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 text-gray-600">{wo.line_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Alerts</CardTitle>
              <CardDescription>Active production issues</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center text-gray-500 py-8" data-testid="alerts-empty">No active alerts</div>
              ) : (
                <div className="space-y-3" data-testid="alerts-panel">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded border ${getSeverityColor(alert.severity)}`}
                      data-testid={`alert-${alert.id}`}
                    >
                      <div className="font-medium text-sm">{alert.type.replace(/_/g, ' ').toUpperCase()}</div>
                      <p className="text-xs mt-1">{alert.description}</p>
                      {alert.wo_id && (
                        <a
                          href={`/production/work-orders/${alert.wo_id}`}
                          className="text-xs underline hover:opacity-80 mt-2 inline-block"
                        >
                          View WO →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
