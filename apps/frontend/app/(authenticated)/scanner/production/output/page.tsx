/**
 * Scanner WO Output Registration Page
 * Production output registration with material consumption validation
 * Mobile-first, touch-optimized UI
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { LineSelector, useSelectedLine } from '@/components/scanner/LineSelector'
import { ScannerFeedback } from '@/components/scanner/ScannerFeedback'
import {
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  Loader2,
  Minus,
  Plus,
  Factory,
  Box,
} from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

interface WorkOrder {
  id: string
  wo_number: string
  status: string
  planned_quantity: number
  output_qty: number
  uom: string
  product?: {
    id: string
    name: string
  }
}

interface Material {
  id: string
  product_id: string
  material_name: string
  required_qty: number
  reserved_qty: number
  consumed_qty: number
  uom: string
  ratio?: number // BOM ratio per output unit
}

interface Reservation {
  id: string
  lp_id: string
  lp_number: string
  reserved_qty: number
  material_id: string
  material_name: string
}

interface ConsumptionPreview {
  material_id: string
  material_name: string
  needed_qty: number
  available_qty: number
  sufficient: boolean
  uom: string
}

interface ProductionSettings {
  block_output_without_materials: boolean
}

type PageState = 'loading' | 'wo-select' | 'output-form' | 'submitting' | 'success' | 'error'

// ============================================================================
// Component
// ============================================================================

export default function ScannerProductionOutputPage() {
  const { selectedLine } = useSelectedLine()
  const { toast } = useToast()

  // State
  const [state, setState] = useState<PageState>('loading')
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [settings, setSettings] = useState<ProductionSettings>({ block_output_without_materials: false })

  // Output form state
  const [outputQty, setOutputQty] = useState<string>('')
  const [consumptionPreview, setConsumptionPreview] = useState<ConsumptionPreview[]>([])

  // Feedback state
  const [feedback, setFeedback] = useState<{
    show: boolean
    type: 'success' | 'error' | 'warning'
    message: string
  }>({ show: false, type: 'success', message: '' })

  // ============================================================================
  // Load WOs for selected line
  // ============================================================================

  const loadWorkOrders = useCallback(async () => {
    if (!selectedLine) {
      setState('wo-select')
      setWorkOrders([])
      return
    }

    setState('loading')
    try {
      const response = await fetch(
        `/api/planning/work-orders?production_line_id=${selectedLine.id}&status=in_progress`
      )

      if (!response.ok) throw new Error('Failed to load work orders')

      const result = await response.json()
      setWorkOrders(result.work_orders || result.data || [])
      setState('wo-select')
    } catch (error) {
      console.error('Failed to load WOs:', error)
      toast({
        title: 'Error',
        description: 'Failed to load work orders',
        variant: 'destructive',
      })
      setState('error')
    }
  }, [selectedLine, toast])

  // Load WOs when line changes
  useEffect(() => {
    loadWorkOrders()
  }, [loadWorkOrders])

  // Load production settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/settings/production-settings')
        if (response.ok) {
          const result = await response.json()
          if (result.data) {
            setSettings({
              block_output_without_materials: result.data.block_output_without_materials ?? false,
            })
          }
        }
      } catch (error) {
        console.error('Failed to load production settings:', error)
      }
    }
    loadSettings()
  }, [])

  // ============================================================================
  // WO Selection
  // ============================================================================

  const handleSelectWO = async (wo: WorkOrder) => {
    setSelectedWO(wo)
    setState('loading')

    try {
      // Load WO materials with BOM ratios
      const [materialsRes, reservationsRes] = await Promise.all([
        fetch(`/api/production/work-orders/${wo.id}/materials`),
        fetch(`/api/production/work-orders/${wo.id}/materials/reservations`),
      ])

      if (!materialsRes.ok || !reservationsRes.ok) {
        throw new Error('Failed to load WO details')
      }

      const materialsData = await materialsRes.json()
      const reservationsData = await reservationsRes.json()

      setMaterials(materialsData.data || [])
      setReservations(reservationsData.data || [])
      setState('output-form')

      // Set default qty to remaining
      const remaining = wo.planned_quantity - (wo.output_qty || 0)
      if (remaining > 0) {
        setOutputQty(remaining.toString())
        calculateConsumption(remaining, materialsData.data || [], reservationsData.data || [])
      }
    } catch (error) {
      console.error('Failed to load WO details:', error)
      toast({
        title: 'Error',
        description: 'Failed to load work order details',
        variant: 'destructive',
      })
      setState('wo-select')
      setSelectedWO(null)
    }
  }

  // ============================================================================
  // Consumption Calculation
  // ============================================================================

  const calculateConsumption = (qty: number, mats: Material[], reservs: Reservation[]) => {
    if (!qty || qty <= 0) {
      setConsumptionPreview([])
      return
    }

    const preview: ConsumptionPreview[] = mats.map((material) => {
      // Calculate needed qty from BOM ratio
      // If ratio exists, use it; otherwise assume 1:1
      const ratio = material.ratio || (material.required_qty / (selectedWO?.planned_quantity || 1))
      const neededQty = qty * ratio

      // Get available qty from reservations
      const materialReservations = reservs.filter(r => r.material_id === material.id)
      const availableQty = materialReservations.reduce((sum, r) => sum + r.reserved_qty, 0)

      return {
        material_id: material.id,
        material_name: material.material_name,
        needed_qty: neededQty,
        available_qty: availableQty,
        sufficient: availableQty >= neededQty,
        uom: material.uom,
      }
    })

    setConsumptionPreview(preview)
  }

  // Handle qty change
  const handleQtyChange = (value: string) => {
    setOutputQty(value)
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue > 0) {
      calculateConsumption(numValue, materials, reservations)
    } else {
      setConsumptionPreview([])
    }
  }

  // ============================================================================
  // Submit Output
  // ============================================================================

  const handleSubmit = async () => {
    if (!selectedWO) return

    const qty = parseFloat(outputQty)
    if (isNaN(qty) || qty <= 0) {
      toast({
        title: 'Invalid Quantity',
        description: 'Please enter a valid output quantity',
        variant: 'destructive',
      })
      return
    }

    // Check if materials are sufficient
    const hasMissingMaterials = consumptionPreview.some(p => !p.sufficient)

    if (hasMissingMaterials && settings.block_output_without_materials) {
      toast({
        title: 'Insufficient Materials',
        description: 'Cannot proceed. Not enough materials scanned.',
        variant: 'destructive',
      })
      return
    }

    setState('submitting')

    try {
      const response = await fetch(`/api/production/work-orders/${selectedWO.id}/outputs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qty,
          qa_status: 'passed',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to register output')
      }

      // Show success feedback
      setFeedback({
        show: true,
        type: 'success',
        message: `${qty} ${selectedWO.uom} registered`,
      })

      // Reset after feedback
      setTimeout(() => {
        setFeedback({ show: false, type: 'success', message: '' })
        resetForm()
        loadWorkOrders()
      }, 2000)
    } catch (error) {
      console.error('Output registration error:', error)
      setFeedback({
        show: true,
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to register output',
      })
      setTimeout(() => {
        setFeedback({ show: false, type: 'error', message: '' })
        setState('output-form')
      }, 2000)
    }
  }

  // ============================================================================
  // Reset
  // ============================================================================

  const resetForm = () => {
    setSelectedWO(null)
    setMaterials([])
    setReservations([])
    setOutputQty('')
    setConsumptionPreview([])
    setState('wo-select')
  }

  // ============================================================================
  // Render Helper
  // ============================================================================

  const getProgressPercent = (wo: WorkOrder) => {
    if (!wo.planned_quantity) return 0
    return Math.min(100, ((wo.output_qty || 0) / wo.planned_quantity) * 100)
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-safe">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-bold">WO Output</h1>
        </div>
        <LineSelector compact />
      </div>

      {/* LOADING STATE */}
      {state === 'loading' && (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-lg">Loading...</p>
        </div>
      )}

      {/* WO SELECT STATE */}
      {state === 'wo-select' && (
        <div className="space-y-4">
          {!selectedLine && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <p className="text-yellow-800">Please select a production line</p>
              </CardContent>
            </Card>
          )}

          {selectedLine && workOrders.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <Box className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No in-progress work orders</p>
                <p className="text-sm mt-1">for {selectedLine.code}</p>
              </CardContent>
            </Card>
          )}

          {selectedLine && workOrders.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Factory className="h-5 w-5" />
                  {selectedLine.code} - Select Work Order
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {workOrders.map((wo) => (
                  <Button
                    key={wo.id}
                    variant="outline"
                    className="w-full h-auto py-4 px-4 justify-start text-left"
                    onClick={() => handleSelectWO(wo)}
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">{wo.wo_number}</span>
                        <Badge variant="secondary" className="text-xs">
                          {getProgressPercent(wo).toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {wo.product?.name || 'Unknown Product'}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">
                          Target: <strong>{wo.planned_quantity} {wo.uom}</strong>
                        </span>
                        <span className="text-blue-600">
                          Produced: <strong>{wo.output_qty || 0} {wo.uom}</strong>
                        </span>
                      </div>
                      <Progress value={getProgressPercent(wo)} className="h-2" />
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* OUTPUT FORM STATE */}
      {state === 'output-form' && selectedWO && (
        <div className="space-y-4">
          {/* WO Header */}
          <Card className="bg-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-bold text-lg">{selectedWO.wo_number}</div>
                  <div className="text-blue-100 text-sm">
                    {selectedLine?.code}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-blue-700"
                  onClick={resetForm}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </div>
              <div className="text-sm text-blue-100 mb-3">
                {selectedWO.product?.name}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-blue-700 rounded p-2">
                  <div className="text-xs text-blue-200">Target</div>
                  <div className="font-bold">{selectedWO.planned_quantity}</div>
                </div>
                <div className="bg-blue-700 rounded p-2">
                  <div className="text-xs text-blue-200">Produced</div>
                  <div className="font-bold">{selectedWO.output_qty || 0}</div>
                </div>
                <div className="bg-blue-500 rounded p-2">
                  <div className="text-xs text-blue-100">Remaining</div>
                  <div className="font-bold">
                    {selectedWO.planned_quantity - (selectedWO.output_qty || 0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Materials */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                Available Materials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reservations.length === 0 ? (
                <div className="text-center text-gray-500 py-4 text-sm">
                  No materials scanned yet
                </div>
              ) : (
                <div className="space-y-1">
                  {materials.map((material) => {
                    const matReservations = reservations.filter(r => r.material_id === material.id)
                    const totalScanned = matReservations.reduce((sum, r) => sum + r.reserved_qty, 0)

                    return (
                      <div
                        key={material.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                      >
                        <span className="flex-1 truncate">{material.material_name}</span>
                        <span className="font-mono font-medium">
                          {totalScanned} {material.uom}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quantity Input */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Enter quantity produced</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12"
                  onClick={() => {
                    const num = Math.max(0, parseFloat(outputQty || '0') - 1)
                    handleQtyChange(num.toString())
                  }}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    type="number"
                    value={outputQty}
                    onChange={(e) => handleQtyChange(e.target.value)}
                    className="text-center text-2xl font-mono h-14 pr-16"
                    placeholder="0"
                    min="0"
                    step="1"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    {selectedWO.uom}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12"
                  onClick={() => {
                    const num = parseFloat(outputQty || '0') + 1
                    handleQtyChange(num.toString())
                  }}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Consumption Preview */}
          {consumptionPreview.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Will consume (from BOM)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {consumptionPreview.map((item) => (
                  <div
                    key={item.material_id}
                    className={`flex items-center justify-between p-3 rounded border ${
                      item.sufficient
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.material_name}</div>
                      <div className="text-xs text-gray-600">
                        Need: {item.needed_qty.toFixed(2)}, Have: {item.available_qty.toFixed(2)} {item.uom}
                      </div>
                      {!item.sufficient && (
                        <div className="text-xs text-red-600 font-medium mt-1">
                          Missing: {(item.needed_qty - item.available_qty).toFixed(2)} {item.uom}
                        </div>
                      )}
                    </div>
                    {item.sufficient ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    )}
                  </div>
                ))}

                {consumptionPreview.some(p => !p.sufficient) && (
                  <Alert variant="destructive" className="mt-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {settings.block_output_without_materials ? (
                        <strong>Cannot proceed. Not enough materials scanned.</strong>
                      ) : (
                        <span>
                          <strong>Warning:</strong> Not enough materials. Confirm to proceed anyway.
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-14"
              onClick={resetForm}
            >
              Cancel
            </Button>
            <Button
              className={`flex-1 h-14 text-lg ${
                consumptionPreview.some(p => !p.sufficient) && !settings.block_output_without_materials
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              onClick={handleSubmit}
              disabled={
                !outputQty ||
                parseFloat(outputQty) <= 0 ||
                (consumptionPreview.some(p => !p.sufficient) && settings.block_output_without_materials)
              }
            >
              {consumptionPreview.some(p => !p.sufficient) && !settings.block_output_without_materials
                ? 'Confirm Anyway'
                : 'Confirm'}
            </Button>
          </div>
        </div>
      )}

      {/* SUBMITTING STATE */}
      {state === 'submitting' && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-blue-600" />
            <div className="mt-4 text-lg">Registering output...</div>
          </CardContent>
        </Card>
      )}

      {/* Scanner Feedback Overlay */}
      <ScannerFeedback
        show={feedback.show}
        type={feedback.type}
        message={feedback.message}
        onHide={() => setFeedback({ ...feedback, show: false })}
      />
    </div>
  )
}
