/**
 * Scanner Receive Workflow Page
 * Story 5.34: Scanner Receive Workflow
 * Mobile-first receiving workflow for dock operators
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import {
  PackageOpen,
  Loader2,
  ChevronLeft,
  ArrowRight,
  Scan,
  Check,
  X,
  Plus,
  Minus,
  MapPin,
  FileText,
  Package,
} from 'lucide-react'
import { ScannerInput } from '@/components/scanner/ScannerInput'
import { ScannerFeedback } from '@/components/scanner/ScannerFeedback'

// ============================================================================
// Types
// ============================================================================

type ReceiveStep =
  | 'menu'
  | 'po_scan'
  | 'product'
  | 'qty'
  | 'batch'
  | 'location'
  | 'confirm'
  | 'success'
  | 'error'

interface POLine {
  id: string
  sequence: number
  product_id: string
  product_code: string
  product_name: string
  ordered_qty: number
  received_qty: number
  remaining_qty: number
  uom: string
}

interface ReceiveState {
  step: ReceiveStep
  po_id?: string
  po_number?: string
  po_lines?: POLine[]
  current_line_index: number
  qty: number
  batch_number: string
  manufacture_date?: string
  expiry_date?: string
  location_id?: string
  location_code?: string
  error?: string
  warehouse_id?: string
}

interface FeedbackState {
  show: boolean
  type: 'success' | 'error' | 'warning'
  message: string
}

// ============================================================================
// Component
// ============================================================================

export default function ScannerReceivePage() {
  const router = useRouter()
  const { toast } = useToast()

  const [state, setState] = useState<ReceiveState>({
    step: 'menu',
    current_line_index: 0,
    qty: 0,
    batch_number: '',
  })

  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>({
    show: false,
    type: 'success',
    message: '',
  })

  const poInputRef = useRef<HTMLInputElement>(null)
  const productInputRef = useRef<HTMLInputElement>(null)
  const locationInputRef = useRef<HTMLInputElement>(null)

  // Auto-focus inputs
  useEffect(() => {
    if (state.step === 'po_scan' && poInputRef.current) poInputRef.current.focus()
    if (state.step === 'product' && productInputRef.current) productInputRef.current.focus()
    if (state.step === 'location' && locationInputRef.current) locationInputRef.current.focus()
  }, [state.step])

  const currentLine = state.po_lines?.[state.current_line_index]

  const showFeedback = (type: 'success' | 'error' | 'warning', message: string) => {
    setFeedback({ show: true, type, message })
  }

  const goToMenu = () => {
    setState({ step: 'menu', current_line_index: 0, qty: 0, batch_number: '' })
  }

  // ============================================================================
  // Handlers
  // ============================================================================

  // Step 1: Scan PO
  const handlePOScan = async (barcode: string) => {
    if (!barcode.trim()) return

    setLoading(true)

    try {
      const res = await fetch(`/api/planning/purchase-orders?search=${encodeURIComponent(barcode)}&limit=1`)
      if (!res.ok) throw new Error('Failed to search PO')

      const { data } = await res.json()
      const po = data?.[0]

      if (!po) {
        setState((prev) => ({ ...prev, step: 'error', error: `PO "${barcode}" not found` }))
        showFeedback('error', 'PO Not Found')
        setLoading(false)
        return
      }

      const validStatuses = ['confirmed', 'partiallyreceived', 'partially_received']
      if (!validStatuses.includes(po.status.toLowerCase())) {
        setState((prev) => ({
          ...prev,
          step: 'error',
          error: `PO ${po.po_number} is ${po.status}. Must be Confirmed.`,
        }))
        showFeedback('error', 'Invalid Status')
        setLoading(false)
        return
      }

      const linesRes = await fetch(`/api/planning/purchase-orders/${po.id}/lines`)
      if (!linesRes.ok) throw new Error('Failed to fetch lines')

      const linesData = await linesRes.json()
      const lines: POLine[] = (linesData.data || []).map((line: any, idx: number) => ({
        id: line.id,
        sequence: line.sequence || idx + 1,
        product_id: line.product_id,
        product_code: line.product?.code || '',
        product_name: line.product?.name || '',
        ordered_qty: line.ordered_qty,
        received_qty: line.received_qty || 0,
        remaining_qty: line.ordered_qty - (line.received_qty || 0),
        uom: line.uom,
      }))

      if (lines.length === 0) {
        setState((prev) => ({ ...prev, step: 'error', error: `PO ${po.po_number} has no lines` }))
        showFeedback('error', 'No Lines')
        setLoading(false)
        return
      }

      showFeedback('success', 'PO Loaded')
      setState((prev) => ({
        ...prev,
        step: 'product',
        po_id: po.id,
        po_number: po.po_number,
        po_lines: lines,
        warehouse_id: po.warehouse_id,
        current_line_index: 0,
      }))
    } catch (err) {
      console.error('PO scan error:', err)
      setState((prev) => ({ ...prev, step: 'error', error: 'Failed to load PO' }))
      showFeedback('error', 'Error')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Scan Product
  const handleProductScan = async (barcode: string) => {
    if (!barcode.trim() || !currentLine) return

    setLoading(true)

    try {
      const res = await fetch(`/api/technical/products?search=${encodeURIComponent(barcode)}&limit=1`)
      if (!res.ok) throw new Error('Failed to search product')

      const { data } = await res.json()
      const product = data?.[0]

      if (!product) {
        setState((prev) => ({ ...prev, step: 'error', error: `Product "${barcode}" not found` }))
        showFeedback('error', 'Not Found')
        setLoading(false)
        return
      }

      if (product.id !== currentLine.product_id) {
        setState((prev) => ({
          ...prev,
          step: 'error',
          error: `Mismatch. Expected: ${currentLine.product_name}`,
        }))
        showFeedback('error', 'Mismatch')
        setLoading(false)
        return
      }

      showFeedback('success', 'Matched')
      setState((prev) => ({ ...prev, step: 'qty', qty: currentLine.remaining_qty }))
    } catch (err) {
      console.error('Product scan error:', err)
      setState((prev) => ({ ...prev, step: 'error', error: 'Failed to validate product' }))
      showFeedback('error', 'Error')
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Confirm Qty
  const handleQtyConfirm = () => {
    if (state.qty <= 0) {
      showFeedback('error', 'Invalid Qty')
      return
    }
    setState((prev) => ({ ...prev, step: 'batch' }))
  }

  // Step 4: Batch Confirm
  const handleBatchConfirm = () => {
    if (!state.batch_number.trim()) {
      showFeedback('error', 'Batch Required')
      return
    }
    setState((prev) => ({ ...prev, step: 'location' }))
  }

  // Step 5: Scan Location
  const handleLocationScan = async (barcode: string) => {
    if (!barcode.trim()) return

    setLoading(true)

    try {
      const res = await fetch(
        `/api/settings/locations?search=${encodeURIComponent(barcode)}&warehouse_id=${state.warehouse_id || ''}&limit=1`
      )
      if (!res.ok) throw new Error('Failed to search location')

      const { data } = await res.json()
      const location = data?.[0]

      if (!location) {
        setState((prev) => ({ ...prev, step: 'error', error: `Location "${barcode}" not found` }))
        showFeedback('error', 'Not Found')
        setLoading(false)
        return
      }

      if (!location.is_active) {
        setState((prev) => ({ ...prev, step: 'error', error: `Location ${location.code} is inactive` }))
        showFeedback('error', 'Inactive')
        setLoading(false)
        return
      }

      showFeedback('success', 'Location OK')
      setState((prev) => ({
        ...prev,
        step: 'confirm',
        location_id: location.id,
        location_code: location.code,
      }))
    } catch (err) {
      console.error('Location scan error:', err)
      setState((prev) => ({ ...prev, step: 'error', error: 'Failed to validate location' }))
      showFeedback('error', 'Error')
    } finally {
      setLoading(false)
    }
  }

  // Step 6: Confirm & Receive
  const handleReceiveConfirm = async () => {
    if (!state.po_id || !currentLine || !state.location_id) return

    setLoading(true)

    try {
      const res = await fetch(`/api/warehouse/receiving/from-po`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          po_id: state.po_id,
          items: [
            {
              po_line_id: currentLine.id,
              qty_received: state.qty,
              batch_number: state.batch_number,
              manufacture_date: state.manufacture_date || undefined,
              expiry_date: state.expiry_date || undefined,
              location_id: state.location_id,
            },
          ],
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setState((prev) => ({ ...prev, step: 'error', error: result.message || 'Failed to receive' }))
        showFeedback('error', 'Failed')
        setLoading(false)
        return
      }

      showFeedback('success', 'Received!')

      const updatedLines = state.po_lines?.map((line, idx) =>
        idx === state.current_line_index
          ? { ...line, received_qty: line.received_qty + state.qty, remaining_qty: line.remaining_qty - state.qty }
          : line
      )

      const hasMore = updatedLines?.some((line) => line.remaining_qty > 0)

      if (hasMore) {
        const nextIndex = updatedLines!.findIndex(
          (line, idx) => idx > state.current_line_index && line.remaining_qty > 0
        )

        if (nextIndex !== -1) {
          setState((prev) => ({
            ...prev,
            step: 'product',
            po_lines: updatedLines,
            current_line_index: nextIndex,
            qty: 0,
            batch_number: '',
            manufacture_date: undefined,
            expiry_date: undefined,
            location_id: undefined,
            location_code: undefined,
          }))
        } else {
          setState((prev) => ({ ...prev, step: 'success' }))
        }
      } else {
        setState((prev) => ({ ...prev, step: 'success' }))
      }

      toast({ title: 'Received', description: `LP ${result.data.lp_numbers[0]} created` })
    } catch (err) {
      console.error('Receive error:', err)
      setState((prev) => ({ ...prev, step: 'error', error: 'Network error' }))
      showFeedback('error', 'Error')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // Render
  // ============================================================================

  const progress = state.po_lines
    ? (state.po_lines.filter((l) => l.remaining_qty === 0).length / state.po_lines.length) * 100
    : 0

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-safe">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {state.step !== 'menu' && (
            <Button variant="ghost" size="icon" onClick={goToMenu} className="h-12 w-12">
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          <h1 className="text-xl font-bold">Receive</h1>
        </div>
        {state.po_number && <Badge className="h-8 text-sm">{state.po_number}</Badge>}
      </div>

      {/* Progress */}
      {state.po_lines && state.step !== 'menu' && (
        <div className="mb-4">
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-gray-500 mt-1 text-center">
            {state.po_lines.filter((l) => l.remaining_qty === 0).length} / {state.po_lines.length} lines
          </div>
        </div>
      )}

      {/* MENU */}
      {state.step === 'menu' && (
        <div className="space-y-3">
          <Card
            className="cursor-pointer active:scale-95 transition-transform"
            onClick={() => setState((prev) => ({ ...prev, step: 'po_scan' }))}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg">Receive from PO</div>
                <div className="text-sm text-gray-500">Scan purchase order</div>
              </div>
              <ArrowRight className="h-6 w-6 text-gray-400" />
            </CardContent>
          </Card>

          <Card className="opacity-50">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-purple-100 rounded-lg">
                <ArrowRight className="h-8 w-8 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg">Receive from TO</div>
                <div className="text-sm text-gray-500">Coming soon</div>
              </div>
            </CardContent>
          </Card>

          <Card className="opacity-50">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-green-100 rounded-lg">
                <PackageOpen className="h-8 w-8 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg">Manual Receive</div>
                <div className="text-sm text-gray-500">Coming soon</div>
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full h-14" onClick={() => router.push('/scanner')}>
            <ChevronLeft className="h-5 w-5 mr-2" />
            Back to Scanner
          </Button>
        </div>
      )}

      {/* PO SCAN */}
      {state.step === 'po_scan' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-6 w-6" />
              Scan PO Barcode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScannerInput ref={poInputRef} onSubmit={handlePOScan} loading={loading} placeholder="Scan PO..." />
            <Button variant="outline" className="w-full h-14" onClick={goToMenu}>
              <X className="h-5 w-5 mr-2" />
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      {/* PRODUCT */}
      {state.step === 'product' && currentLine && (
        <div className="space-y-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="text-sm text-blue-700 font-medium">Expected:</div>
              <div className="text-lg font-bold">{currentLine.product_name}</div>
              <div className="text-sm text-gray-600 font-mono">{currentLine.product_code}</div>
              <div className="text-sm text-gray-500 mt-2">
                Remaining: {currentLine.remaining_qty} {currentLine.uom}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-6 w-6" />
                Scan Product
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScannerInput
                ref={productInputRef}
                onSubmit={handleProductScan}
                loading={loading}
                placeholder="Scan product..."
              />
              <Button variant="outline" className="w-full h-14" onClick={goToMenu}>
                <X className="h-5 w-5 mr-2" />
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* QTY */}
      {state.step === 'qty' && currentLine && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-6 w-6" />
              Enter Quantity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-gray-100 rounded-lg">
              <div className="text-gray-500 mb-2">Remaining:</div>
              <div className="text-3xl font-bold">
                {currentLine.remaining_qty} {currentLine.uom}
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14"
                onClick={() => setState((prev) => ({ ...prev, qty: Math.max(0, prev.qty - 1) }))}
                disabled={state.qty <= 0}
              >
                <Minus className="h-6 w-6" />
              </Button>
              <Input
                type="number"
                value={state.qty}
                onChange={(e) => setState((prev) => ({ ...prev, qty: Math.max(0, parseFloat(e.target.value) || 0) }))}
                className="w-32 h-16 text-3xl text-center font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14"
                onClick={() => setState((prev) => ({ ...prev, qty: prev.qty + 1 }))}
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>
            <div className="text-center text-gray-500">{currentLine.uom}</div>

            <Button
              className="w-full h-16 text-xl bg-green-600 hover:bg-green-700"
              onClick={handleQtyConfirm}
              disabled={state.qty <= 0}
            >
              <Check className="h-6 w-6 mr-2" />
              Confirm
            </Button>
          </CardContent>
        </Card>
      )}

      {/* BATCH */}
      {state.step === 'batch' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Batch & Expiry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Batch Number <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Batch..."
                value={state.batch_number}
                onChange={(e) => setState((prev) => ({ ...prev, batch_number: e.target.value }))}
                className="h-14 text-lg"
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Mfg Date (Optional)</label>
              <Input
                type="date"
                value={state.manufacture_date || ''}
                onChange={(e) => setState((prev) => ({ ...prev, manufacture_date: e.target.value }))}
                className="h-14 text-lg"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Expiry (Optional)</label>
              <Input
                type="date"
                value={state.expiry_date || ''}
                onChange={(e) => setState((prev) => ({ ...prev, expiry_date: e.target.value }))}
                className="h-14 text-lg"
              />
            </div>

            <Button
              className="w-full h-16 text-xl bg-green-600 hover:bg-green-700"
              onClick={handleBatchConfirm}
              disabled={!state.batch_number.trim()}
            >
              <Check className="h-6 w-6 mr-2" />
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* LOCATION */}
      {state.step === 'location' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-6 w-6" />
              Scan Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScannerInput
              ref={locationInputRef}
              onSubmit={handleLocationScan}
              loading={loading}
              placeholder="Scan location..."
              icon="search"
            />
            <Button
              variant="outline"
              className="w-full h-14"
              onClick={() => setState((prev) => ({ ...prev, step: 'batch' }))}
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
          </CardContent>
        </Card>
      )}

      {/* CONFIRM */}
      {state.step === 'confirm' && currentLine && (
        <div className="space-y-4">
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-700">Ready to Receive</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Product:</span>
                <span className="font-medium">{currentLine.product_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Qty:</span>
                <span className="font-mono font-bold">
                  {state.qty} {currentLine.uom}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Batch:</span>
                <span className="font-mono font-medium">{state.batch_number}</span>
              </div>
              {state.manufacture_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Mfg:</span>
                  <span className="font-medium">{state.manufacture_date}</span>
                </div>
              )}
              {state.expiry_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Exp:</span>
                  <span className="font-medium">{state.expiry_date}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-mono font-medium">{state.location_code}</span>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full h-16 text-xl bg-green-600 hover:bg-green-700"
            onClick={handleReceiveConfirm}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Check className="h-6 w-6 mr-2" />}
            Confirm & Receive
          </Button>

          <Button
            variant="outline"
            className="w-full h-14"
            onClick={() => setState((prev) => ({ ...prev, step: 'location' }))}
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Back
          </Button>
        </div>
      )}

      {/* SUCCESS */}
      {state.step === 'success' && (
        <Card className="bg-green-600 text-white">
          <CardContent className="p-8 text-center space-y-4">
            <Check className="h-20 w-20 mx-auto" />
            <h2 className="text-2xl font-bold">Complete!</h2>
            <p className="text-green-100">PO {state.po_number} fully received</p>

            <div className="pt-4 space-y-2">
              <Button className="w-full h-14 bg-white text-green-600 hover:bg-gray-100" onClick={goToMenu}>
                Receive Another
              </Button>
              <Button
                variant="outline"
                className="w-full h-14 border-white text-white hover:bg-green-700"
                onClick={() => router.push('/scanner')}
              >
                Back to Scanner
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ERROR */}
      {state.step === 'error' && (
        <Card className="bg-red-600 text-white">
          <CardContent className="p-6 text-center space-y-4">
            <X className="h-16 w-16 mx-auto" />
            <h2 className="text-xl font-bold">Error</h2>
            <p className="text-red-100">{state.error}</p>

            <div className="space-y-2 pt-4">
              <Button
                className="w-full h-14 bg-white text-red-600 hover:bg-gray-100"
                onClick={() =>
                  setState((prev) => ({ ...prev, step: prev.po_id ? 'product' : 'po_scan', error: undefined }))
                }
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                className="w-full h-14 border-white text-white hover:bg-red-700"
                onClick={goToMenu}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
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
