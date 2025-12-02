/**
 * Work Order Details Page
 * Story 3.10: Work Order CRUD
 * Display WO header information with tabs: Overview, Production
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  ArrowLeft,
  Loader2,
  FileText,
  Factory,
  Calendar,
  Package,
  Clock,
  Cog,
  Boxes,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PlanningHeader } from '@/components/planning/PlanningHeader'
import { WOOperationsList } from '@/components/planning/WOOperationsList'
import { MaterialReservationsTable } from '@/components/production/MaterialReservationsTable'
import WOStartModal from '@/components/production/WOStartModal'
import WOPauseModal from '@/components/production/WOPauseModal'
import WOResumeModal from '@/components/production/WOResumeModal'
import PauseHistoryPanel from '@/components/production/PauseHistoryPanel'
import { WOCompleteModal } from '@/components/production/WOCompleteModal'
import { OperationTimelinePanel } from '@/components/production/OperationTimelinePanel'

interface Product {
  id: string
  code: string
  name: string
  uom: string
}

interface Machine {
  id: string
  code: string
  name: string
}

interface BOM {
  id: string
  version: string
  status: string
}

interface WorkOrder {
  id: string
  org_id: string
  wo_number: string
  product_id: string
  bom_id: string | null
  planned_quantity: number
  produced_quantity: number
  uom: string
  status: string
  planned_start_date: string | null
  planned_end_date: string | null
  actual_start_date: string | null
  actual_end_date: string | null
  production_line_id: string | null
  routing_id: string | null
  notes?: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  products?: Product
  machines?: Machine
  boms?: BOM
  // Story 3.16: Source of Demand
  source_type?: string | null
  source_reference?: string | null
  // Story 4.3: Pause/Resume
  paused_at?: string | null
  paused_by_user_id?: string | null
}

// Source type labels for display (Story 3.16)
const SOURCE_TYPE_LABELS: Record<string, string> = {
  manual: 'Manual',
  po: 'Purchase Order',
  customer_order: 'Customer Order',
  forecast: 'Forecast',
  stock_replenishment: 'Stock Replenishment',
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'gray' },
  released: { label: 'Released', color: 'blue' },
  in_progress: { label: 'In Progress', color: 'yellow' },
  paused: { label: 'Paused', color: 'orange' },
  completed: { label: 'Completed', color: 'green' },
  closed: { label: 'Closed', color: 'purple' },
  cancelled: { label: 'Cancelled', color: 'red' },
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['released', 'cancelled'],
  released: ['in_progress', 'cancelled'],
  in_progress: ['paused', 'completed'],
  paused: ['in_progress', 'completed'],
  completed: ['closed'],
  closed: [],
  cancelled: [],
}

export default function WorkOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [wo, setWO] = useState<WorkOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [paramsId, setParamsId] = useState<string>('')
  const [statusChanging, setStatusChanging] = useState(false)
  const [startModalOpen, setStartModalOpen] = useState(false)
  const [pauseModalOpen, setPauseModalOpen] = useState(false)
  const [resumeModalOpen, setResumeModalOpen] = useState(false)
  const [completeModalOpen, setCompleteModalOpen] = useState(false)
  const [pauseEnabled, setPauseEnabled] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // Unwrap params
  useEffect(() => {
    params.then((p) => setParamsId(p.id))
  }, [params])

  // Fetch WO details
  const fetchWO = useCallback(async () => {
    if (!paramsId) return

    try {
      setLoading(true)

      const response = await fetch(`/api/planning/work-orders/${paramsId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch work order')
      }

      const data = await response.json()
      setWO(data.work_order || data)
    } catch (error) {
      console.error('Error fetching work order:', error)
      toast({
        title: 'Error',
        description: 'Failed to load work order details',
        variant: 'destructive',
      })
      router.push('/planning/work-orders')
    } finally {
      setLoading(false)
    }
  }, [paramsId, toast, router])

  useEffect(() => {
    fetchWO()
  }, [fetchWO])

  // Check if pause is enabled
  useEffect(() => {
    const checkPauseEnabled = async () => {
      try {
        const response = await fetch('/api/production/settings')
        if (response.ok) {
          const { data } = await response.json()
          setPauseEnabled(data?.allow_pause_wo ?? true)
        }
      } catch {
        // Default to true if fetch fails
        setPauseEnabled(true)
      }
    }
    checkPauseEnabled()
  }, [])

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Format datetime
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Format quantity
  const formatQuantity = (qty: number, uom: string) => {
    return `${qty.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} ${uom}`
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || { label: status, color: 'gray' }

    const colorClasses: Record<string, string> = {
      gray: 'bg-gray-100 text-gray-800',
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      orange: 'bg-orange-100 text-orange-800',
      red: 'bg-red-100 text-red-800',
      purple: 'bg-purple-100 text-purple-800',
    }

    return (
      <Badge className={colorClasses[config.color] || colorClasses.gray}>
        {config.label}
      </Badge>
    )
  }

  // Calculate progress
  const getProgress = () => {
    if (!wo || wo.planned_quantity === 0) return 0
    return Math.min(100, (wo.produced_quantity / wo.planned_quantity) * 100)
  }

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    if (!wo) return

    setStatusChanging(true)
    try {
      const response = await fetch(`/api/planning/work-orders/${wo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      toast({
        title: 'Success',
        description: `Status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`,
      })

      fetchWO()
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      })
    } finally {
      setStatusChanging(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    )
  }

  if (!wo) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Work order not found</div>
      </div>
    )
  }

  const allowedTransitions = STATUS_TRANSITIONS[wo.status] || []
  const progress = getProgress()

  return (
    <div>
      <PlanningHeader currentPage="wo" />

      <div className="px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/planning/work-orders')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold font-mono">{wo.wo_number}</h1>
            {getStatusBadge(wo.status)}
          </div>
          <div className="flex items-center gap-2">
            {/* Start Production - only for released */}
            {wo.status === 'released' && (
              <Button
                onClick={() => setStartModalOpen(true)}
                className="gap-2"
              >
                <Factory className="h-4 w-4" />
                Start Production
              </Button>
            )}
            {/* Pause - only for in_progress and if pause enabled */}
            {wo.status === 'in_progress' && pauseEnabled && (
              <Button
                onClick={() => setPauseModalOpen(true)}
                variant="outline"
                className="gap-2 border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                <PauseCircle className="h-4 w-4" />
                Pause
              </Button>
            )}
            {/* Resume - only for paused */}
            {wo.status === 'paused' && (
              <Button
                onClick={() => setResumeModalOpen(true)}
                className="gap-2 bg-green-500 hover:bg-green-600"
              >
                <PlayCircle className="h-4 w-4" />
                Resume
              </Button>
            )}
            {/* Complete WO - for in_progress or paused */}
            {(wo.status === 'in_progress' || wo.status === 'paused') && (
              <Button
                onClick={() => setCompleteModalOpen(true)}
                variant="outline"
                className="gap-2 border-green-500 text-green-600 hover:bg-green-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Complete WO
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <FileText className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="production" className="gap-2">
              <Factory className="h-4 w-4" />
              Production
            </TabsTrigger>
            <TabsTrigger value="operations" className="gap-2">
              <Cog className="h-4 w-4" />
              Operations
            </TabsTrigger>
            <TabsTrigger value="materials" className="gap-2">
              <Boxes className="h-4 w-4" />
              Materials
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* WO Details Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border rounded-lg p-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Work Order Information</h2>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">WO Number:</dt>
                    <dd className="font-medium font-mono">{wo.wo_number}</dd>
                  </div>
                  <div className="flex justify-between items-start">
                    <dt className="text-gray-600">Status:</dt>
                    <dd>
                      {allowedTransitions.length > 0 ? (
                        <Select
                          value={wo.status}
                          onValueChange={handleStatusChange}
                          disabled={statusChanging}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={wo.status}>
                              {STATUS_CONFIG[wo.status]?.label || wo.status}
                            </SelectItem>
                            {allowedTransitions.map((status) => (
                              <SelectItem key={status} value={status}>
                                {STATUS_CONFIG[status]?.label || status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        getStatusBadge(wo.status)
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Product:</dt>
                    <dd className="font-medium">
                      {wo.products?.name}
                      <div className="text-sm text-gray-500">{wo.products?.code}</div>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Production Line:</dt>
                    <dd className="font-medium">
                      {wo.machines ? (
                        <>
                          {wo.machines.name}
                          <div className="text-sm text-gray-500">{wo.machines.code}</div>
                        </>
                      ) : (
                        <span className="text-gray-400">Not assigned</span>
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">BOM:</dt>
                    <dd className="font-medium">
                      {wo.boms ? (
                        <>
                          Version {wo.boms.version}
                          <div className="text-sm text-gray-500">{wo.boms.status}</div>
                        </>
                      ) : (
                        <span className="text-gray-400">No BOM selected</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-4">Quantities</h2>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Planned Quantity:</dt>
                    <dd className="font-medium">{formatQuantity(wo.planned_quantity, wo.uom)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Produced Quantity:</dt>
                    <dd className="font-medium">{formatQuantity(wo.produced_quantity, wo.uom)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Remaining:</dt>
                    <dd className="font-medium">
                      {formatQuantity(Math.max(0, wo.planned_quantity - wo.produced_quantity), wo.uom)}
                    </dd>
                  </div>
                  <div className="pt-2">
                    <dt className="text-gray-600 mb-2">Progress:</dt>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          progress >= 100 ? 'bg-green-500' : progress > 0 ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="text-sm text-gray-500 mt-1 text-right">
                      {progress.toFixed(1)}%
                    </div>
                  </div>
                </dl>
              </div>
            </div>

            {/* Dates Card */}
            <div className="border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Planned
                  </h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Start Date:</dt>
                      <dd className="font-medium">{formatDate(wo.planned_start_date)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">End Date:</dt>
                      <dd className="font-medium">{formatDate(wo.planned_end_date)}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    Actual
                  </h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Start Date:</dt>
                      <dd className="font-medium">{formatDate(wo.actual_start_date)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">End Date:</dt>
                      <dd className="font-medium">{formatDate(wo.actual_end_date)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            {/* Notes & Audit Card */}
            <div className="border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
              <dl className="space-y-3">
                {wo.notes && (
                  <div>
                    <dt className="text-gray-600 mb-1">Notes:</dt>
                    <dd className="text-sm bg-gray-50 p-3 rounded">{wo.notes}</dd>
                  </div>
                )}
                {/* Story 3.16: Source of Demand */}
                {wo.source_type && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Source:</dt>
                    <dd className="font-medium">
                      {SOURCE_TYPE_LABELS[wo.source_type] || wo.source_type}
                      {wo.source_reference && (
                        <span className="text-gray-500 ml-2">({wo.source_reference})</span>
                      )}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-600">Created:</dt>
                  <dd className="font-medium text-sm">{formatDateTime(wo.created_at)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Updated:</dt>
                  <dd className="font-medium text-sm">{formatDateTime(wo.updated_at)}</dd>
                </div>
              </dl>
            </div>
          </TabsContent>

          {/* Production Tab */}
          <TabsContent value="production" className="space-y-6">
            <div className="border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Production Progress</h2>

              {/* Progress Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-700">
                    {formatQuantity(wo.planned_quantity, wo.uom)}
                  </div>
                  <div className="text-sm text-blue-600">Planned</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-700">
                    {formatQuantity(wo.produced_quantity, wo.uom)}
                  </div>
                  <div className="text-sm text-green-600">Produced</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-700">
                    {formatQuantity(Math.max(0, wo.planned_quantity - wo.produced_quantity), wo.uom)}
                  </div>
                  <div className="text-sm text-orange-600">Remaining</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Completion</span>
                  <span className="font-medium">{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all ${
                      progress >= 100 ? 'bg-green-500' : progress > 0 ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
              </div>

              {/* Status-specific content */}
              {wo.status === 'draft' && (
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-gray-600">
                    This work order is in draft status. Release it to start production tracking.
                  </p>
                </div>
              )}

              {wo.status === 'released' && (
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-blue-600">
                    This work order is released and ready for production.
                  </p>
                </div>
              )}

              {wo.status === 'in_progress' && (
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-yellow-700">
                    Production is in progress. Update quantities as production proceeds.
                  </p>
                </div>
              )}

              {wo.status === 'paused' && (
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <p className="text-orange-700">
                    Production is paused. Click Resume to continue production.
                  </p>
                </div>
              )}

              {wo.status === 'completed' && (
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-green-600">
                    Production completed. Close the work order to finalize.
                  </p>
                </div>
              )}

              {wo.status === 'closed' && (
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-purple-600">
                    This work order is closed and archived.
                  </p>
                </div>
              )}

              {wo.status === 'cancelled' && (
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-red-600">
                    This work order has been cancelled.
                  </p>
                </div>
              )}
            </div>

            {/* Operation Timeline - Story 4.20 */}
            <OperationTimelinePanel woId={wo.id} />

            {/* Pause History Panel - Story 4.3 */}
            <PauseHistoryPanel woId={wo.id} />

            {/* BOM/Routing Info placeholder */}
            {wo.routing_id && (
              <div className="border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Routing</h2>
                <p className="text-gray-500 text-sm">
                  Routing ID: {wo.routing_id}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Operations Tab - Story 3.14 */}
          <TabsContent value="operations" className="space-y-6">
            <WOOperationsList woId={wo.id} woStatus={wo.status} />
          </TabsContent>

          {/* Materials Tab - Story 4.7 */}
          <TabsContent value="materials" className="space-y-6">
            <div className="border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Boxes className="h-5 w-5" />
                Material Reservations
              </h2>
              <MaterialReservationsTable woId={wo.id} woStatus={wo.status} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Start Production Modal - Story 4.2 */}
      <WOStartModal
        woId={wo.id}
        open={startModalOpen}
        onOpenChange={setStartModalOpen}
        onSuccess={() => {
          setStartModalOpen(false)
          fetchWO()
        }}
      />

      {/* Pause Modal - Story 4.3 */}
      <WOPauseModal
        woId={wo.id}
        woNumber={wo.wo_number}
        open={pauseModalOpen}
        onOpenChange={setPauseModalOpen}
        onSuccess={() => {
          setPauseModalOpen(false)
          fetchWO()
        }}
      />

      {/* Resume Modal - Story 4.3 */}
      <WOResumeModal
        woId={wo.id}
        woNumber={wo.wo_number}
        pausedAt={wo.paused_at || undefined}
        open={resumeModalOpen}
        onOpenChange={setResumeModalOpen}
        onSuccess={() => {
          setResumeModalOpen(false)
          fetchWO()
        }}
      />

      {/* Complete WO Modal - Story 4.6 */}
      <WOCompleteModal
        woId={wo.id}
        woNumber={wo.wo_number}
        open={completeModalOpen}
        onOpenChange={setCompleteModalOpen}
        onSuccess={() => {
          setCompleteModalOpen(false)
          fetchWO()
        }}
      />
    </div>
  )
}
