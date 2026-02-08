'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Factory, Loader2, PlayCircle, Workflow } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { WOPauseButton, WOResumeButton, YieldSection, WOPauseHistory } from './components'
import type { PauseReason } from '@/lib/validation/production-schemas'

interface WorkOrderData {
  id: string
  wo_number: string
  status: string
  planned_quantity: number
  produced_quantity: number
  uom: string
  planned_start_date: string | null
  planned_end_date: string | null
  actual_start_date: string | null
  actual_end_date: string | null
  products?: {
    code?: string
    name?: string
    uom?: string
  } | null
  production_line?: {
    name?: string
  } | null
  production_lines?: {
    name?: string
  } | null
}

interface PauseHistoryItem {
  id: string
  paused_at: string
  resumed_at: string | null
  pause_reason: PauseReason | null
  notes?: string | null
  paused_by_user?: {
    id: string
    first_name: string | null
    last_name: string | null
  } | null
}

interface CurrentPause {
  id: string
  paused_at: string
  pause_reason: PauseReason
  notes?: string
  paused_by_user: {
    id: string
    full_name: string
  }
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function statusLabel(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
}

function statusClass(status: string) {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800'
    case 'released':
      return 'bg-blue-100 text-blue-800'
    case 'in_progress':
      return 'bg-amber-100 text-amber-800'
    case 'paused':
      return 'bg-orange-100 text-orange-800'
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-slate-100 text-slate-800'
  }
}

export default function ProductionWorkOrderDetailsPage() {
  const params = useParams()
  const woId = params?.id as string
  const { toast } = useToast()

  const [workOrder, setWorkOrder] = useState<WorkOrderData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState<'start' | 'complete' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPauseEnabled, setIsPauseEnabled] = useState(true)
  const [currentPause, setCurrentPause] = useState<CurrentPause | undefined>(undefined)

  const fetchWorkOrder = useCallback(async () => {
    if (!woId) return

    setIsLoading(true)
    setError(null)

    try {
      const [woRes, settingsRes, pauseRes] = await Promise.all([
        fetch(`/api/planning/work-orders/${woId}`),
        fetch('/api/production/settings'),
        fetch(`/api/production/work-orders/${woId}/pause-history`),
      ])

      if (!woRes.ok) {
        throw new Error(woRes.status === 404 ? 'Work order not found' : 'Failed to load work order')
      }

      const woJson = await woRes.json()
      const woData = woJson.data || woJson
      setWorkOrder(woData)

      if (settingsRes.ok) {
        const settingsJson = await settingsRes.json()
        setIsPauseEnabled(settingsJson.data?.allow_pause_wo ?? settingsJson.settings?.allow_pause_wo ?? true)
      }

      if (pauseRes.ok) {
        const pauseJson = await pauseRes.json()
        const history = (pauseJson.data?.pauses || pauseJson.data || []) as PauseHistoryItem[]
        const activePause = history.find((item) => item.resumed_at === null)

        if (activePause) {
          const firstName = activePause.paused_by_user?.first_name || ''
          const lastName = activePause.paused_by_user?.last_name || ''
          const fullName = `${firstName} ${lastName}`.trim() || 'Unknown'

          setCurrentPause({
            id: activePause.id,
            paused_at: activePause.paused_at,
            pause_reason: activePause.pause_reason || 'other',
            notes: activePause.notes || undefined,
            paused_by_user: {
              id: activePause.paused_by_user?.id || '',
              full_name: fullName,
            },
          })
        } else {
          setCurrentPause(undefined)
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load work order'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [woId])

  useEffect(() => {
    fetchWorkOrder()
  }, [fetchWorkOrder])

  const handleStart = async () => {
    if (!workOrder) return

    setIsActionLoading('start')
    try {
      const response = await fetch(`/api/production/work-orders/${workOrder.id}/start`, { method: 'POST' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Failed to start work order')
      }

      toast({
        title: 'Work order started',
        description: `${workOrder.wo_number} is now in progress`,
      })
      await fetchWorkOrder()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to start work order',
        variant: 'destructive',
      })
    } finally {
      setIsActionLoading(null)
    }
  }

  const handleComplete = async () => {
    if (!workOrder) return

    setIsActionLoading('complete')
    try {
      const response = await fetch(`/api/production/work-orders/${workOrder.id}/complete`, { method: 'POST' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Failed to complete work order')
      }

      toast({
        title: 'Work order completed',
        description: `${workOrder.wo_number} has been completed`,
      })
      await fetchWorkOrder()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to complete work order',
        variant: 'destructive',
      })
    } finally {
      setIsActionLoading(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error || !workOrder) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">{error || 'Work order not found'}</p>
            <Button asChild>
              <Link href="/production/dashboard">Back to Production Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const productName = workOrder.products?.name || 'Unknown Product'
  const productCode = workOrder.products?.code || 'N/A'
  const uom = workOrder.products?.uom || workOrder.uom || 'units'
  const lineName = workOrder.production_lines?.name || workOrder.production_line?.name || 'Unassigned'

  return (
    <div className="space-y-6 p-8" data-testid="production-work-order-details-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/production/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{workOrder.wo_number}</h1>
            <p className="text-sm text-muted-foreground">Production work order details</p>
          </div>
        </div>
        <Badge className={statusClass(workOrder.status)}>{statusLabel(workOrder.status)}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-xs text-muted-foreground">Product</div>
            <div className="font-medium">{productCode}</div>
            <div className="text-sm text-muted-foreground">{productName}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Quantity</div>
            <div className="font-medium">
              {workOrder.produced_quantity.toLocaleString()} / {workOrder.planned_quantity.toLocaleString()} {uom}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Production Line</div>
            <div className="font-medium">{lineName}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Dates</div>
            <div className="text-sm">Planned: {formatDate(workOrder.planned_start_date)} - {formatDate(workOrder.planned_end_date)}</div>
            <div className="text-sm">Actual: {formatDate(workOrder.actual_start_date)} - {formatDate(workOrder.actual_end_date)}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {workOrder.status === 'released' && (
            <Button onClick={handleStart} disabled={isActionLoading !== null}>
              {isActionLoading === 'start' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Start Work Order
                </>
              )}
            </Button>
          )}

          {(workOrder.status === 'in_progress' || workOrder.status === 'paused') && (
            <Button variant="secondary" onClick={handleComplete} disabled={isActionLoading !== null}>
              {isActionLoading === 'complete' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Complete Work Order
                </>
              )}
            </Button>
          )}

          <WOPauseButton
            workOrderId={workOrder.id}
            workOrderNumber={workOrder.wo_number}
            workOrderStatus={workOrder.status as 'draft' | 'released' | 'in_progress' | 'paused' | 'completed' | 'cancelled'}
            isPauseEnabled={isPauseEnabled}
            onPauseSuccess={() => fetchWorkOrder()}
            onPauseError={(err) =>
              toast({ title: 'Pause failed', description: err.message, variant: 'destructive' })
            }
          />

          <WOResumeButton
            workOrderId={workOrder.id}
            workOrderNumber={workOrder.wo_number}
            workOrderStatus={workOrder.status as 'draft' | 'released' | 'in_progress' | 'paused' | 'completed' | 'cancelled'}
            currentPause={currentPause}
            onResumeSuccess={() => fetchWorkOrder()}
            onResumeError={(err) =>
              toast({ title: 'Resume failed', description: err.message, variant: 'destructive' })
            }
          />

          <Button variant="outline" asChild>
            <Link href={`/production/work-orders/${workOrder.id}/operations`}>
              <Workflow className="h-4 w-4 mr-2" />
              Operations
            </Link>
          </Button>

          <Button variant="outline" asChild>
            <Link href={`/production/consumption/${workOrder.id}`}>
              <Factory className="h-4 w-4 mr-2" />
              Consumption
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Yield Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <YieldSection
              woId={workOrder.id}
              plannedQuantity={workOrder.planned_quantity}
              producedQuantity={workOrder.produced_quantity}
              woStatus={workOrder.status as 'draft' | 'released' | 'in_progress' | 'paused' | 'completed' | 'cancelled'}
              uom={uom}
              onYieldUpdate={(result) =>
                setWorkOrder((prev) =>
                  prev
                    ? {
                        ...prev,
                        produced_quantity: result.produced_quantity,
                      }
                    : prev
                )
              }
            />
          </CardContent>
        </Card>

        <WOPauseHistory workOrderId={workOrder.id} showSummary />
      </div>
    </div>
  )
}
