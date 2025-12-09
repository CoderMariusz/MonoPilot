/**
 * WO Entry Scanner Page
 * Scanner page for scanning components (License Plates) INTO a Work Order
 * Mobile-first interface for production operators
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Factory,
  ChevronLeft,
  Scan,
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
} from 'lucide-react'
import { LineSelector, useSelectedLine } from '@/components/scanner/LineSelector'
import { ScannerInput } from '@/components/scanner/ScannerInput'
import { ScannerFeedback } from '@/components/scanner/ScannerFeedback'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface WorkOrder {
  id: string
  wo_number: string
  product_code: string
  product_name: string
  target_qty: number
  uom: string
  status: string
  production_line_id: string
}

interface WOMaterial {
  id: string
  product_id: string
  material_name: string
  required_qty: number
  reserved_qty: number
  consumed_qty: number
  uom: string
  consume_whole_lp: boolean
}

interface Reservation {
  id: string
  lp_id: string
  lp_number: string
  reserved_qty: number
  material_name: string
  uom: string
  status: string
  reserved_at: string
}

interface FeedbackState {
  show: boolean
  type: 'success' | 'error' | 'warning'
  message: string
}

type PageView = 'wo-list' | 'wo-details'

// ============================================================================
// Component
// ============================================================================

export default function WOEntryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { selectedLine, isLoading: lineLoading } = useSelectedLine()
  const scanInputRef = useRef<HTMLInputElement>(null)

  const [view, setView] = useState<PageView>('wo-list')
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null)
  const [materials, setMaterials] = useState<WOMaterial[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>({
    show: false,
    type: 'success',
    message: '',
  })

  // Load work orders when line selected
  useEffect(() => {
    if (selectedLine) {
      loadWorkOrders()
    }
  }, [selectedLine])

  // Auto-focus scan input when in details view
  useEffect(() => {
    if (view === 'wo-details' && scanInputRef.current) {
      scanInputRef.current.focus()
    }
  }, [view])

  // ============================================================================
  // Data Loading
  // ============================================================================

  const loadWorkOrders = async () => {
    if (!selectedLine) return

    setLoading(true)
    try {
      const res = await fetch(
        `/api/planning/work-orders?production_line_id=${selectedLine.id}&status=in_progress,released`
      )

      if (!res.ok) throw new Error('Failed to fetch work orders')

      const data = await res.json()
      setWorkOrders(data.work_orders || [])
    } catch (error) {
      console.error('Failed to load work orders:', error)
      toast({
        title: 'Error',
        description: 'Failed to load work orders',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadWODetails = async (wo: WorkOrder) => {
    setLoading(true)
    try {
      // Load materials
      const materialsRes = await fetch(`/api/production/work-orders/${wo.id}/materials`)
      if (!materialsRes.ok) throw new Error('Failed to fetch materials')

      const materialsData = await materialsRes.json()

      // Transform materials data
      const materialsArray: WOMaterial[] = (materialsData.data || []).map((m: any) => ({
        id: m.id,
        product_id: m.product_id,
        material_name: m.material_name,
        required_qty: m.required_qty,
        reserved_qty: m.reserved_qty || 0,
        consumed_qty: m.consumed_qty || 0,
        uom: m.uom,
        consume_whole_lp: m.consume_whole_lp || false,
      }))

      setMaterials(materialsArray)

      // Load reservations
      await loadReservations(wo.id)

      setSelectedWO(wo)
      setView('wo-details')
    } catch (error) {
      console.error('Failed to load WO details:', error)
      toast({
        title: 'Error',
        description: 'Failed to load work order details',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadReservations = async (woId: string) => {
    try {
      const res = await fetch(`/api/production/work-orders/${woId}/materials`)
      if (!res.ok) throw new Error('Failed to fetch reservations')

      const data = await res.json()

      // Extract all reservations from materials
      const allReservations: Reservation[] = []

      if (data.data) {
        data.data.forEach((material: any) => {
          if (material.reservations && Array.isArray(material.reservations)) {
            material.reservations.forEach((res: any) => {
              allReservations.push({
                id: res.id,
                lp_id: res.lp_id,
                lp_number: res.lp_number,
                reserved_qty: res.reserved_qty,
                material_name: material.material_name,
                uom: res.uom || material.uom,
                status: res.status,
                reserved_at: res.reserved_at,
              })
            })
          }
        })
      }

      setReservations(allReservations)
    } catch (error) {
      console.error('Failed to load reservations:', error)
    }
  }

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleWOSelect = (wo: WorkOrder) => {
    loadWODetails(wo)
  }

  const handleBackToList = () => {
    setView('wo-list')
    setSelectedWO(null)
    setMaterials([])
    setReservations([])
    loadWorkOrders()
  }

  const handleScanLP = async (barcode: string) => {
    if (!selectedWO || !barcode.trim()) return

    setScanning(true)

    try {
      // Lookup LP by barcode
      const lookupRes = await fetch(`/api/scanner/lookup?barcode=${encodeURIComponent(barcode)}`)

      if (!lookupRes.ok) {
        showFeedback('error', 'LP Not Found')
        setScanning(false)
        return
      }

      const lookupData = await lookupRes.json()

      if (!lookupData.data || lookupData.data.type !== 'license_plate') {
        showFeedback('error', 'Invalid Barcode')
        setScanning(false)
        return
      }

      const lp = lookupData.data.license_plate

      // Check if LP contains a material from this WO's BOM
      const matchingMaterial = materials.find(m => m.product_id === lp.product_id)

      if (!matchingMaterial) {
        showFeedback('error', 'Material Not in BOM')
        setScanning(false)
        return
      }

      // Reserve entire LP to WO
      const reserveRes = await fetch(`/api/production/work-orders/${selectedWO.id}/materials/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_id: matchingMaterial.id,
          lp_id: lp.id,
          reserved_qty: lp.qty_available,
        }),
      })

      const reserveData = await reserveRes.json()

      if (!reserveRes.ok) {
        showFeedback('error', reserveData.message || 'Reservation Failed')
        toast({
          title: 'Error',
          description: reserveData.message || 'Failed to reserve material',
          variant: 'destructive',
        })
        setScanning(false)
        return
      }

      showFeedback('success', 'LP Scanned')

      toast({
        title: 'Success',
        description: `LP ${lp.lp_number} reserved (${lp.qty_available} ${lp.uom})`,
      })

      // Reload materials and reservations
      await loadWODetails(selectedWO)

    } catch (error) {
      console.error('Scan error:', error)
      showFeedback('error', 'Error')
      toast({
        title: 'Error',
        description: 'Failed to process scan',
        variant: 'destructive',
      })
    } finally {
      setScanning(false)
    }
  }

  const showFeedback = (type: 'success' | 'error' | 'warning', message: string) => {
    setFeedback({ show: true, type, message })
  }

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const getWOStatusColor = (wo: WorkOrder): 'success' | 'warning' | 'destructive' => {
    // Calculate based on materials loaded for this WO
    // For now, use simple status-based coloring
    if (wo.status === 'in_progress') return 'success'
    if (wo.status === 'released') return 'warning'
    return 'destructive'
  }

  const getMaterialStatus = (material: WOMaterial): 'complete' | 'partial' | 'none' => {
    if (material.reserved_qty >= material.required_qty) return 'complete'
    if (material.reserved_qty > 0) return 'partial'
    return 'none'
  }

  const getMaterialStatusIcon = (material: WOMaterial) => {
    const status = getMaterialStatus(material)
    if (status === 'complete') {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />
    }
    if (status === 'partial') {
      return <AlertTriangle className="h-5 w-5 text-orange-500" />
    }
    return <XCircle className="h-5 w-5 text-red-500" />
  }

  // ============================================================================
  // Render
  // ============================================================================

  if (lineLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!selectedLine) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 pb-safe">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push('/scanner')} className="h-12 w-12">
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">WO Entry</h1>
          </div>
        </div>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-6 text-center space-y-4">
            <Factory className="h-16 w-16 mx-auto text-orange-500" />
            <div>
              <h2 className="text-lg font-bold text-orange-900">No Production Line Selected</h2>
              <p className="text-sm text-orange-700 mt-2">
                Please select a production line to continue
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4">
          <LineSelector />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-safe">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {view === 'wo-list' ? (
            <Button variant="ghost" size="icon" onClick={() => router.push('/scanner')} className="h-12 w-12">
              <ChevronLeft className="h-6 w-6" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={handleBackToList} className="h-12 w-12">
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          <h1 className="text-xl font-bold">WO Entry</h1>
        </div>
        <div className="flex items-center gap-2">
          <Factory className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline" className="h-8 text-sm">
            {selectedLine.code}
          </Badge>
        </div>
      </div>

      {/* WO LIST VIEW */}
      {view === 'wo-list' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Work Order</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : workOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No work orders for this line</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {workOrders.map((wo) => (
                    <button
                      key={wo.id}
                      onClick={() => handleWOSelect(wo)}
                      className="w-full text-left border rounded-lg p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold font-mono text-sm">{wo.wo_number}</span>
                            <Badge variant={getWOStatusColor(wo)} className="text-xs">
                              {wo.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 truncate">{wo.product_name}</div>
                          <div className="text-xs text-gray-500 font-mono mt-1">{wo.product_code}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-medium">
                            {wo.target_qty} {wo.uom}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full h-14" onClick={() => router.push('/scanner')}>
            <ChevronLeft className="h-5 w-5 mr-2" />
            Back to Scanner
          </Button>
        </div>
      )}

      {/* WO DETAILS VIEW */}
      {view === 'wo-details' && selectedWO && (
        <div className="space-y-4">
          {/* Output Product Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-blue-700 font-medium mb-1">OUTPUT</div>
                  <div className="font-bold text-lg leading-tight mb-1">{selectedWO.product_name}</div>
                  <div className="text-sm text-gray-600 font-mono">{selectedWO.product_code}</div>
                  <div className="text-sm text-gray-700 mt-2">
                    Target: <span className="font-bold">{selectedWO.target_qty} {selectedWO.uom}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requirements Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : materials.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">No materials required</div>
              ) : (
                <div className="space-y-2">
                  {materials.map((material) => (
                    <div
                      key={material.id}
                      className={cn(
                        'border rounded-lg p-3',
                        getMaterialStatus(material) === 'complete' && 'bg-green-50 border-green-200',
                        getMaterialStatus(material) === 'partial' && 'bg-orange-50 border-orange-200',
                        getMaterialStatus(material) === 'none' && 'bg-red-50 border-red-200'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{material.material_name}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            Need: {material.required_qty} {material.uom}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <div className="text-sm font-bold">
                              {material.reserved_qty} {material.uom}
                            </div>
                            <div className="text-xs text-gray-500">scanned</div>
                          </div>
                          {getMaterialStatusIcon(material)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scan Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Scan className="h-5 w-5" />
                Scan Component LP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScannerInput
                ref={scanInputRef}
                onSubmit={handleScanLP}
                loading={scanning}
                placeholder="Scan LP barcode..."
              />
            </CardContent>
          </Card>

          {/* Scanned LPs Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-5 w-5" />
                Scanned to WO
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reservations.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">No LPs scanned yet</div>
              ) : (
                <div className="space-y-2">
                  {reservations.map((reservation) => (
                    <div key={reservation.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm font-medium">{reservation.lp_number}</div>
                          <div className="text-xs text-gray-600 mt-1 truncate">
                            {reservation.material_name}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold">
                            {reservation.reserved_qty} {reservation.uom}
                          </div>
                          <div className="flex items-center gap-1 justify-end mt-1">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-xs text-gray-500">{reservation.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feedback */}
      <ScannerFeedback
        show={feedback.show}
        type={feedback.type}
        message={feedback.message}
        onHide={() => setFeedback((prev) => ({ ...prev, show: false }))}
      />
    </div>
  )
}
