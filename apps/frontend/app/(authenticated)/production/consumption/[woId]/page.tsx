/**
 * Material Consumption Page (Story 04.6a)
 * Desktop interface for consuming materials from work orders
 *
 * Route: /production/consumption/:woId
 *
 * Features:
 * - WO Summary Card
 * - Required Materials Table with progress
 * - Add Consumption Modal (two-step)
 * - Consumption History with reversal
 * - Manager-only reverse functionality
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  ArrowLeft,
  RefreshCw,
  ClipboardList,
  Package,
  History,
  BarChart2,
} from 'lucide-react'
import {
  WOSummaryCard,
  MaterialsTable,
  AddConsumptionModal,
  ConsumptionHistoryTableEnhanced,
} from '@/components/production/consumption'
import {
  useConsumptionMaterials,
  useConsumptionHistory,
} from '@/lib/hooks/use-consumption'
import type { ConsumptionMaterial } from '@/lib/services/consumption-service'

interface WorkOrderData {
  id: string
  wo_number: string
  status: string
  product_name: string
  product_code: string
  batch_number: string | null
  planned_quantity: number
  actual_quantity: number
  uom: string
  production_line_name: string | null
}

export default function MaterialConsumptionPage() {
  const params = useParams()
  const router = useRouter()
  const woId = params?.woId as string

  const [workOrder, setWorkOrder] = useState<WorkOrderData | null>(null)
  const [isLoadingWO, setIsLoadingWO] = useState(true)
  const [woError, setWoError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('')

  const [selectedMaterial, setSelectedMaterial] = useState<ConsumptionMaterial | null>(null)
  const [consumptionModalOpen, setConsumptionModalOpen] = useState(false)

  // Fetch WO materials
  const {
    data: materialsData,
    isLoading: isLoadingMaterials,
    error: materialsError,
    refetch: refetchMaterials,
  } = useConsumptionMaterials(woId)

  // Fetch consumption history
  const {
    data: historyData,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useConsumptionHistory(woId)

  // Fetch work order details
  useEffect(() => {
    const fetchWorkOrder = async () => {
      try {
        setIsLoadingWO(true)
        const response = await fetch(`/api/planning/work-orders/${woId}`)

        if (!response.ok) {
          if (response.status === 404) {
            setWoError('Work order not found')
          } else {
            setWoError('Failed to load work order')
          }
          return
        }

        const data = await response.json()

        setWorkOrder({
          id: data.id,
          wo_number: data.wo_number,
          status: data.status,
          product_name: data.products?.name || data.product_name || 'Unknown',
          product_code: data.products?.code || data.product_code || 'N/A',
          batch_number: data.batch_number,
          planned_quantity: data.planned_quantity || 0,
          actual_quantity: data.actual_quantity || 0,
          uom: data.products?.uom || data.uom || 'units',
          production_line_name: data.production_lines?.name || null,
        })
        setWoError(null)
      } catch (error) {
        console.error('Error fetching work order:', error)
        setWoError('Failed to load work order')
      } finally {
        setIsLoadingWO(false)
      }
    }

    if (woId) {
      fetchWorkOrder()
    }
  }, [woId])

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setUserRole(data.user?.role || '')
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
      }
    }
    fetchUserRole()
  }, [])

  // Calculate materials progress
  const calculateProgress = useCallback(() => {
    if (!materialsData?.materials) {
      return { consumed: 0, total: 0, percentage: 0 }
    }

    const materials = materialsData.materials.filter((m) => !m.is_by_product)
    const total = materials.length
    const consumed = materials.filter(
      (m) => m.consumed_qty >= m.required_qty && m.required_qty > 0
    ).length

    return {
      consumed,
      total,
      percentage: total > 0 ? Math.round((consumed / total) * 100) : 0,
    }
  }, [materialsData])

  // Handle consume action
  const handleConsume = (material: ConsumptionMaterial) => {
    setSelectedMaterial(material)
    setConsumptionModalOpen(true)
  }

  // Handle consumption success
  const handleConsumptionSuccess = () => {
    setConsumptionModalOpen(false)
    setSelectedMaterial(null)
    refetchMaterials()
    refetchHistory()
  }

  // Handle refresh all
  const handleRefreshAll = () => {
    refetchMaterials()
    refetchHistory()
  }

  // Check if user can reverse
  const canReverse =
    ['admin', 'manager'].includes(userRole.toLowerCase()) &&
    workOrder?.status === 'in_progress'

  // Loading state
  if (isLoadingWO || isLoadingMaterials) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // Error state
  if (woError || materialsError) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">
              {woError || materialsError?.message || 'An error occurred'}
            </p>
            <Button onClick={() => router.push('/production/work-orders')}>
              Back to Work Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6" data-testid="consumption-page">
      {/* Breadcrumb */}
      <Breadcrumb data-testid="breadcrumb">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/production">Production</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/production/work-orders">Work Orders</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{workOrder?.wo_number || 'Material Consumption'}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/production/work-orders/${woId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Material Consumption</h1>
        </div>
        <Button variant="outline" onClick={handleRefreshAll}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* WO Summary Card */}
      <WOSummaryCard
        wo={workOrder}
        materialsProgress={calculateProgress()}
        isLoading={isLoadingWO}
      />

      {/* Required Materials Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Required Materials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MaterialsTable
            materials={materialsData?.materials || []}
            isLoading={isLoadingMaterials}
            onConsume={handleConsume}
            onRefresh={() => refetchMaterials()}
            woStatus={workOrder?.status}
          />
        </CardContent>
      </Card>

      {/* Consumption History Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Consumption History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ConsumptionHistoryTableEnhanced
            woId={woId}
            consumptions={historyData?.consumptions || []}
            isLoading={isLoadingHistory}
            canReverse={canReverse}
            onRefresh={() => refetchHistory()}
          />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link href={`/production/work-orders/${woId}`}>
            <ClipboardList className="h-4 w-4 mr-2" />
            View WO Detail
          </Link>
        </Button>
        <Button variant="outline" disabled>
          <BarChart2 className="h-4 w-4 mr-2" />
          Material Variance Report
        </Button>
      </div>

      {/* Add Consumption Modal */}
      <AddConsumptionModal
        woId={woId}
        material={selectedMaterial}
        open={consumptionModalOpen}
        onClose={() => {
          setConsumptionModalOpen(false)
          setSelectedMaterial(null)
        }}
        onSuccess={handleConsumptionSuccess}
      />
    </div>
  )
}
