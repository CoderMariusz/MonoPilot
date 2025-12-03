/**
 * Scanner Output Registration Page
 * Story 4.13: Output Registration (Scanner)
 * Touch-optimized UI for production output registration
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ScanBarcode,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Printer,
  Loader2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ByProductRegistrationDialog } from '@/components/production/ByProductRegistrationDialog'

// Scanner workflow states
type ScannerState =
  | 'idle'           // Waiting for WO scan
  | 'wo_found'       // WO loaded, ready for qty
  | 'qty_entered'    // Qty entered, QA status selection
  | 'over_consumption' // Over-consumption warning
  | 'over_production'  // Over-production LP selection
  | 'submitting'     // API call in progress
  | 'success'        // Output registered

interface WOData {
  id: string
  wo_number: string
  product_name: string
  planned_qty: number
  output_qty: number
  uom: string
  status: string
}

interface AllocationPreview {
  is_over_consumption: boolean
  cumulative_after: number
  remaining_unallocated: number
  total_reserved: number
  reserved_lps: Array<{ id: string; lp_number: string; qty: number }>
}

interface OutputResult {
  output: {
    id: string
    lp_id: string
    lp_number: string
    quantity: number
  }
}

export default function ScannerOutputPage() {
  const router = useRouter()
  const { toast } = useToast()
  const barcodeInputRef = useRef<HTMLInputElement>(null)

  // State
  const [state, setState] = useState<ScannerState>('idle')
  const [barcode, setBarcode] = useState('')
  const [woData, setWoData] = useState<WOData | null>(null)
  const [qty, setQty] = useState('')
  const [qaStatus, setQaStatus] = useState<'passed' | 'hold' | 'rejected' | 'pending'>('passed')
  const [preview, setPreview] = useState<AllocationPreview | null>(null)
  const [selectedParentLpId, setSelectedParentLpId] = useState('')
  const [outputResult, setOutputResult] = useState<OutputResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [printStatus, setPrintStatus] = useState<'pending' | 'success' | 'failed'>('pending')
  // By-product state (AC-4.13.11)
  const [showByProductDialog, setShowByProductDialog] = useState(false)

  // Focus barcode input on mount
  useEffect(() => {
    if (state === 'idle' && barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }, [state])

  // Handle WO barcode scan (AC-4.13.2)
  const handleBarcodeScan = useCallback(async () => {
    if (!barcode.trim()) return

    setLoading(true)
    try {
      // Look up WO by number
      const response = await fetch(`/api/planning/work-orders?search=${encodeURIComponent(barcode)}`)
      if (!response.ok) throw new Error('Failed to search WO')

      const { data } = await response.json()
      const wo = data?.find((w: WOData) => w.wo_number === barcode || w.id === barcode)

      if (!wo) {
        toast({ title: 'Error', description: 'Work Order not found', variant: 'destructive' })
        setBarcode('')
        return
      }

      if (wo.status !== 'in_progress') {
        toast({ title: 'Error', description: 'Work Order must be In Progress', variant: 'destructive' })
        setBarcode('')
        return
      }

      setWoData(wo)
      setState('wo_found')
    } catch (error) {
      console.error('Barcode scan error:', error)
      toast({ title: 'Error', description: 'Failed to look up Work Order', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [barcode, toast])

  // Handle numpad input (AC-4.13.3)
  const handleNumpadPress = (value: string) => {
    if (value === 'C') {
      setQty('')
    } else if (value === '←') {
      setQty((prev) => prev.slice(0, -1))
    } else if (value === '.') {
      if (!qty.includes('.')) {
        setQty((prev) => prev + '.')
      }
    } else {
      setQty((prev) => prev + value)
    }
  }

  // Check allocation preview when qty is entered
  const handleContinueFromQty = async () => {
    const qtyNum = parseFloat(qty)
    if (!qtyNum || qtyNum <= 0 || !woData) {
      toast({ title: 'Error', description: 'Enter a valid quantity', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/production/work-orders/${woData.id}/outputs/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qty: qtyNum }),
      })

      if (response.ok) {
        const { data } = await response.json()
        setPreview(data)

        if (data.is_over_consumption && data.remaining_unallocated > 0) {
          // True over-production - need LP selection
          setState('over_production')
        } else if (data.is_over_consumption) {
          // Over-consumption warning
          setState('over_consumption')
        } else {
          // Normal flow - go to QA status
          setState('qty_entered')
        }
      } else {
        setState('qty_entered')
      }
    } catch {
      setState('qty_entered')
    } finally {
      setLoading(false)
    }
  }

  // Submit output registration (AC-4.13.8)
  const handleSubmit = async () => {
    if (!woData) return

    setState('submitting')
    setLoading(true)

    try {
      const response = await fetch(`/api/production/work-orders/${woData.id}/outputs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qty: parseFloat(qty),
          qa_status: qaStatus,
          is_over_production: state === 'over_production',
          over_production_parent_lp_id: selectedParentLpId || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409 && result.requires_confirmation) {
          // Over-consumption needs confirmation
          setPreview(result.details)
          setState('over_consumption')
          return
        }
        throw new Error(result.message || 'Failed to register output')
      }

      setOutputResult(result.data)

      // Attempt label printing (AC-4.13.9)
      await printLabel(result.data.output)

      // Check if WO has by-products (AC-4.13.11)
      try {
        const bpResponse = await fetch(`/api/production/work-orders/${woData.id}/by-products`)
        if (bpResponse.ok) {
          const { data: byProducts } = await bpResponse.json()
          if (byProducts && byProducts.length > 0) {
            // Show by-product dialog before success screen
            setShowByProductDialog(true)
            setState('success')
            return
          }
        }
      } catch (err) {
        console.error('Failed to check by-products:', err)
      }

      setState('success')
    } catch (error) {
      console.error('Submit error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to register output',
        variant: 'destructive',
      })
      setState('qty_entered')
    } finally {
      setLoading(false)
    }
  }

  // Print ZPL label (AC-4.13.9)
  const printLabel = async (output: OutputResult['output']) => {
    try {
      const response = await fetch('/api/printer/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lp_number: output.lp_number,
          quantity: output.quantity,
          uom: woData?.uom,
          product_name: woData?.product_name,
          batch_number: woData?.wo_number,
        }),
      })

      if (response.ok) {
        setPrintStatus('success')
      } else {
        setPrintStatus('failed')
      }
    } catch {
      setPrintStatus('failed')
      console.warn('Label print failed - printer may be offline')
    }
  }

  // Reset for next scan (AC-4.13.10)
  const handleScanNext = () => {
    setState('idle')
    setBarcode('')
    setWoData(null)
    setQty('')
    setQaStatus('passed')
    setPreview(null)
    setSelectedParentLpId('')
    setOutputResult(null)
    setPrintStatus('pending')
    setShowByProductDialog(false)
    setTimeout(() => barcodeInputRef.current?.focus(), 100)
  }

  // Render based on state
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push('/scanner')}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <Package className="h-8 w-8 text-emerald-600" />
        <h1 className="text-2xl font-bold">Output Registration</h1>
      </div>

      {/* STATE: Idle - Scan WO Barcode (AC-4.13.1) */}
      {state === 'idle' && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanBarcode className="h-6 w-6" />
              Scan Work Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              ref={barcodeInputRef}
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBarcodeScan()}
              placeholder="Scan WO barcode..."
              className="text-xl h-14 font-mono"
              autoFocus
            />
            <Button
              onClick={handleBarcodeScan}
              disabled={loading || !barcode}
              className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Find Work Order'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STATE: WO Found - Enter Qty (AC-4.13.2, AC-4.13.3) */}
      {state === 'wo_found' && woData && (
        <div className="max-w-md mx-auto space-y-4">
          {/* WO Summary */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="flex justify-between text-lg">
                <span className="font-bold">{woData.wo_number}</span>
                <span className="text-emerald-600">In Progress</span>
              </div>
              <div className="text-gray-600">{woData.product_name}</div>
              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-xs text-gray-500">Planned</div>
                  <div className="font-mono font-bold">{woData.planned_qty}</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-xs text-gray-500">Produced</div>
                  <div className="font-mono font-bold">{woData.output_qty || 0}</div>
                </div>
                <div className="bg-blue-50 p-2 rounded">
                  <div className="text-xs text-gray-500">Remaining</div>
                  <div className="font-mono font-bold text-blue-600">
                    {woData.planned_qty - (woData.output_qty || 0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Qty Input with Numpad */}
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-1">Output Quantity</div>
                <div className="text-4xl font-mono font-bold h-14 flex items-center justify-center border-b-2 border-emerald-500">
                  {qty || '0'} <span className="text-lg ml-2 text-gray-400">{woData.uom}</span>
                </div>
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-4 gap-2">
                {['1', '2', '3', 'C', '4', '5', '6', '←', '7', '8', '9', '.', '0'].map((key) => (
                  <Button
                    key={key}
                    variant={key === 'C' ? 'destructive' : 'outline'}
                    className={`h-14 text-xl font-bold ${key === '0' ? 'col-span-2' : ''}`}
                    onClick={() => handleNumpadPress(key)}
                  >
                    {key}
                  </Button>
                ))}
              </div>

              <Button
                onClick={handleContinueFromQty}
                disabled={loading || !qty || parseFloat(qty) <= 0}
                className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Continue'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STATE: QA Status Selection (AC-4.13.4) */}
      {state === 'qty_entered' && woData && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>QA Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant={qaStatus === 'passed' ? 'default' : 'outline'}
              className={`w-full h-16 text-xl justify-start gap-3 ${
                qaStatus === 'passed' ? 'bg-green-600 hover:bg-green-700' : ''
              }`}
              onClick={() => setQaStatus('passed')}
            >
              <CheckCircle2 className="h-8 w-8" />
              PASS
            </Button>
            <Button
              variant={qaStatus === 'rejected' ? 'default' : 'outline'}
              className={`w-full h-16 text-xl justify-start gap-3 ${
                qaStatus === 'rejected' ? 'bg-red-600 hover:bg-red-700' : ''
              }`}
              onClick={() => setQaStatus('rejected')}
            >
              <XCircle className="h-8 w-8" />
              FAIL
            </Button>
            <Button
              variant={qaStatus === 'pending' ? 'default' : 'outline'}
              className={`w-full h-16 text-xl justify-start gap-3 ${
                qaStatus === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700' : ''
              }`}
              onClick={() => setQaStatus('pending')}
            >
              <Clock className="h-8 w-8" />
              PENDING
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700 mt-4"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Register Output'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STATE: Over-Consumption Warning (AC-4.13.6) */}
      {state === 'over_consumption' && preview && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-6 w-6" />
              Over-Consumption Detected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                <div className="space-y-1">
                  <div>Reserved: {preview.total_reserved} {woData?.uom}</div>
                  <div>Total after: {preview.cumulative_after} {woData?.uom}</div>
                </div>
              </AlertDescription>
            </Alert>

            <div className="text-center text-lg font-medium">Do you want to proceed?</div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-14 text-lg"
                onClick={() => setState('qty_entered')}
              >
                NO
              </Button>
              <Button
                className="h-14 text-lg bg-orange-600 hover:bg-orange-700"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'YES'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STATE: Over-Production LP Selection (AC-4.13.7) */}
      {state === 'over_production' && preview && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              Over-Production
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                All reserved materials consumed. Select source LP for {preview.remaining_unallocated} {woData?.uom} over-production.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              {preview.reserved_lps?.map((lp) => (
                <Button
                  key={lp.id}
                  variant={selectedParentLpId === lp.id ? 'default' : 'outline'}
                  className={`w-full h-14 justify-between ${
                    selectedParentLpId === lp.id ? 'bg-blue-600' : ''
                  }`}
                  onClick={() => setSelectedParentLpId(lp.id)}
                >
                  <span className="font-mono">{lp.lp_number}</span>
                  <span>{lp.qty} {woData?.uom}</span>
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-14"
                onClick={() => setState('qty_entered')}
              >
                CANCEL
              </Button>
              <Button
                className="h-14 bg-red-600 hover:bg-red-700"
                onClick={handleSubmit}
                disabled={loading || !selectedParentLpId}
              >
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'CONFIRM'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STATE: Submitting */}
      {state === 'submitting' && (
        <Card className="max-w-md mx-auto">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-emerald-600" />
            <div className="mt-4 text-lg">Registering output...</div>
          </CardContent>
        </Card>
      )}

      {/* STATE: Success (AC-4.13.10) */}
      {state === 'success' && outputResult && (
        <Card className="max-w-md mx-auto">
          <CardContent className="py-8 text-center space-y-4">
            <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
            <div className="text-2xl font-bold text-green-600">SUCCESS</div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="text-lg">
                Output: <span className="font-bold">{qty} {woData?.uom}</span>
              </div>
              <div className="font-mono text-xl">{outputResult.output.lp_number}</div>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm">
              <Printer className="h-4 w-4" />
              {printStatus === 'success' && <span className="text-green-600">Label printed</span>}
              {printStatus === 'failed' && <span className="text-orange-600">Print failed - retry from WO</span>}
              {printStatus === 'pending' && <span className="text-gray-500">Printing...</span>}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button variant="outline" className="h-14" onClick={() => router.push(`/planning/work-orders/${woData?.id}`)}>
                Go to WO
              </Button>
              <Button className="h-14 bg-emerald-600 hover:bg-emerald-700" onClick={handleScanNext}>
                Scan Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* By-Product Registration Dialog (AC-4.13.11) */}
      {woData && outputResult && (
        <ByProductRegistrationDialog
          open={showByProductDialog}
          onOpenChange={setShowByProductDialog}
          woId={woData.id}
          woNumber={woData.wo_number}
          mainOutputId={outputResult.output.id}
          mainOutputQty={parseFloat(qty)}
          requireQaStatus={true}
          onComplete={() => {
            setShowByProductDialog(false)
          }}
        />
      )}
    </div>
  )
}
