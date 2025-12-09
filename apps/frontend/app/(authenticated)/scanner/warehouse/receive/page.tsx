/**
 * Scanner Warehouse Receive Page
 * Operator receives materials from PO (Purchase Order) or TO (Transfer Order)
 * Flow: Scan PO/TO barcode → Select line → Enter qty → Batch → Location → Confirm
 * BUG-004 FIX: Changed from dropdown selection to barcode-first approach
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
  ChevronLeft,
  FileText,
  ArrowRight,
  Scan,
  Check,
  X,
  Plus,
  Minus,
  MapPin,
  Package,
  Loader2,
} from 'lucide-react'
import { ScannerInput } from '@/components/scanner/ScannerInput'
import { ScannerFeedback } from '@/components/scanner/ScannerFeedback'

// ============================================================================
// Types
// ============================================================================

type ReceiveStep =
  | 'scan_document'
  | 'line_select'
  | 'qty'
  | 'batch'
  | 'location'
  | 'confirm'
  | 'success'
  | 'error'

type DocumentType = 'PO' | 'TO'

interface DocumentLine {
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
  document_type?: DocumentType
  document_id?: string
  document_number?: string
  warehouse_id?: string
  lines?: DocumentLine[]
  selected_line?: DocumentLine
  qty: number
  batch_number: string
  manufacture_date?: string
  expiry_date?: string
  location_id?: string
  location_code?: string
  error?: string
}

interface FeedbackState {
  show: boolean
  type: 'success' | 'error' | 'warning'
  message: string
}

// ============================================================================
// Component
// ============================================================================

export default function ScannerWarehouseReceivePage() {
  const router = useRouter()
  const { toast } = useToast()

  const [state, setState] = useState<ReceiveState>({
    step: 'scan_document',
    qty: 0,
    batch_number: '',
  })

  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>({
    show: false,
    type: 'success',
    message: '',
  })

  const scannerInputRef = useRef<HTMLInputElement>(null)
  const locationInputRef = useRef<HTMLInputElement>(null)

  // Auto-focus location input
  useEffect(() => {
    if (state.step === 'location' && locationInputRef.current) {
      locationInputRef.current.focus()
    }
  }, [state.step])

  const showFeedback = (type: 'success' | 'error' | 'warning', message: string) => {
    setFeedback({ show: true, type, message })
  }

  const resetToStart = () => {
    setState({ step: 'scan_document', qty: 0, batch_number: '' })
  }

  const progress = state.lines
    ? (state.lines.filter((l) => l.remaining_qty === 0).length / state.lines.length) * 100
    : 0

  // ============================================================================
  // Handlers
  // ============================================================================

  // Step 1: Scan Document (PO or TO)
  const handleDocumentScan = async (barcode: string) => {
    setLoading(true)
    try {
      // Use scanner lookup API
      const res = await fetch(`/api/scanner/lookup?barcode=${encodeURIComponent(barcode)}`)

      if (!res.ok) {
        showFeedback('error', 'Document Not Found')
        setLoading(false)
        return
      }

      const { data } = await res.json()

      // Validate it's a PO or TO
      if (data.type !== 'purchase_order' && data.type !== 'transfer_order') {
        showFeedback('error', 'Invalid barcode - not a PO/TO')
        setLoading(false)
        return
      }

      // Determine document type
      const docType: DocumentType = data.type === 'purchase_order' ? 'PO' : 'TO'
      const docNumber = data.details.po_number || data.details.to_number

      // Load document lines
      await loadDocumentLines(data.id, docType, docNumber)
    } catch (err) {
      console.error('Document scan error:', err)
      setState((prev) => ({ ...prev, step: 'error', error: 'Failed to scan document' }))
      showFeedback('error', 'Scan Failed')
      setLoading(false)
    }
  }

  // Step 2: Load Document Lines
  const loadDocumentLines = async (docId: string, docType: DocumentType, docNumber: string) => {
    try {
      let linesUrl = ''
      if (docType === 'PO') {
        linesUrl = `/api/planning/purchase-orders/${docId}/lines`
      } else {
        linesUrl = `/api/planning/transfer-orders/${docId}/lines`
      }

      const res = await fetch(linesUrl)
      if (!res.ok) throw new Error('Failed to load lines')

      const result = await res.json()
      const linesData = result.data || []

      const lines: DocumentLine[] = linesData.map((line: any, idx: number) => ({
        id: line.id,
        sequence: line.sequence || idx + 1,
        product_id: line.product_id,
        product_code: line.product?.code || '',
        product_name: line.product?.name || '',
        ordered_qty: line.ordered_qty || line.qty,
        received_qty: line.received_qty || 0,
        remaining_qty: (line.ordered_qty || line.qty) - (line.received_qty || 0),
        uom: line.uom,
      }))

      if (lines.length === 0) {
        setState((prev) => ({
          ...prev,
          step: 'error',
          error: `Document ${docNumber} has no lines`
        }))
        showFeedback('error', 'No Lines')
        setLoading(false)
        return
      }

      showFeedback('success', 'Document Loaded')
      setState((prev) => ({
        ...prev,
        step: 'line_select',
        document_type: docType,
        document_id: docId,
        document_number: docNumber,
        lines,
        warehouse_id: undefined, // Will be determined by document type
      }))
    } catch (err) {
      console.error('Load lines error:', err)
      setState((prev) => ({ ...prev, step: 'error', error: 'Failed to load document lines' }))
      showFeedback('error', 'Error')
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Select Line to Receive
  const handleLineSelect = (line: DocumentLine) => {
    if (line.remaining_qty <= 0) {
      showFeedback('warning', 'Already Received')
      return
    }

    setState((prev) => ({
      ...prev,
      step: 'qty',
      selected_line: line,
      qty: line.remaining_qty,
    }))
  }

  // Step 5: Confirm Quantity
  const handleQtyConfirm = () => {
    if (state.qty <= 0) {
      showFeedback('error', 'Invalid Qty')
      return
    }
    setState((prev) => ({ ...prev, step: 'batch' }))
  }

  // Step 6: Batch Confirm
  const handleBatchConfirm = () => {
    if (!state.batch_number.trim()) {
      showFeedback('error', 'Batch Required')
      return
    }
    setState((prev) => ({ ...prev, step: 'location' }))
  }

  // Step 7: Scan Location
  const handleLocationScan = async (barcode: string) => {
    if (!barcode.trim()) return

    setLoading(true)

    try {
      const res = await fetch(
        `/api/settings/locations?search=${encodeURIComponent(barcode)}&limit=1`
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

  // Step 8: Confirm & Receive
  const handleReceiveConfirm = async () => {
    if (!state.document_id || !state.selected_line || !state.location_id) return

    setLoading(true)

    try {
      const endpoint = state.document_type === 'PO'
        ? '/api/warehouse/receiving/from-po'
        : '/api/warehouse/receiving/from-to'

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [state.document_type === 'PO' ? 'po_id' : 'to_id']: state.document_id,
          items: [
            {
              [state.document_type === 'PO' ? 'po_line_id' : 'to_line_id']: state.selected_line.id,
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

      // Update lines with new received qty
      const updatedLines = state.lines?.map((line) =>
        line.id === state.selected_line?.id
          ? {
              ...line,
              received_qty: line.received_qty + state.qty,
              remaining_qty: line.remaining_qty - state.qty
            }
          : line
      )

      const hasMore = updatedLines?.some((line) => line.remaining_qty > 0)

      if (hasMore) {
        // Go back to line selection
        setState((prev) => ({
          ...prev,
          step: 'line_select',
          lines: updatedLines,
          selected_line: undefined,
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

      const lpNumber = result.data?.lp_numbers?.[0] || result.data?.lp_number
      if (lpNumber) {
        toast({ title: 'Received', description: `LP ${lpNumber} created` })
      }
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

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-safe">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {state.step !== 'scan_document' && (
            <Button variant="ghost" size="icon" onClick={resetToStart} className="h-12 w-12">
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          <h1 className="text-xl font-bold">Warehouse Receive</h1>
        </div>
        {state.document_number && (
          <Badge className="h-8 text-sm font-mono">{state.document_number}</Badge>
        )}
      </div>

      {/* Progress */}
      {state.lines && state.step !== 'scan_document' && (
        <div className="mb-4">
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-gray-500 mt-1 text-center">
            {state.lines.filter((l) => l.remaining_qty === 0).length} / {state.lines.length} lines received
          </div>
        </div>
      )}

      {/* STEP: Scan Document (PO or TO) */}
      {state.step === 'scan_document' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-6 w-6" />
                Scan PO or TO Barcode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <Scan className="h-12 w-12 mx-auto text-blue-600 mb-2" />
                <p className="text-sm text-gray-600">
                  Scan Purchase Order (PO) or Transfer Order (TO) barcode to start receiving
                </p>
              </div>

              <ScannerInput
                ref={scannerInputRef}
                onSubmit={handleDocumentScan}
                loading={loading}
                placeholder="Scan PO/TO barcode..."
                autoFocus
              />
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full h-14" onClick={() => router.push('/scanner')}>
            <ChevronLeft className="h-5 w-5 mr-2" />
            Back to Scanner
          </Button>
        </div>
      )}

      {/* STEP: Line Selection */}
      {state.step === 'line_select' && state.lines && (
        <div className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-6 w-6" />
                Select Line to Receive
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {state.lines.map((line) => (
                <Card
                  key={line.id}
                  className={`cursor-pointer hover:bg-gray-50 active:scale-95 transition-transform ${
                    line.remaining_qty === 0 ? 'opacity-50' : ''
                  }`}
                  onClick={() => handleLineSelect(line)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="font-bold">{line.product_name}</div>
                        <div className="text-sm text-gray-600 font-mono">{line.product_code}</div>
                      </div>
                      {line.remaining_qty === 0 && (
                        <Check className="h-6 w-6 text-green-600" />
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="text-gray-500">Ordered</div>
                        <div className="font-mono font-bold">{line.ordered_qty} {line.uom}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Received</div>
                        <div className="font-mono font-bold">{line.received_qty} {line.uom}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Remaining</div>
                        <div className="font-mono font-bold text-blue-600">
                          {line.remaining_qty} {line.uom}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full h-14" onClick={resetToStart}>
            <ChevronLeft className="h-5 w-5 mr-2" />
            Back to Scan
          </Button>
        </div>
      )}

      {/* STEP: Quantity */}
      {state.step === 'qty' && state.selected_line && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-6 w-6" />
              Enter Quantity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-700 font-medium">Receiving:</div>
              <div className="text-lg font-bold">{state.selected_line.product_name}</div>
              <div className="text-sm text-gray-600 font-mono">{state.selected_line.product_code}</div>
            </div>

            <div className="text-center p-4 bg-gray-100 rounded-lg">
              <div className="text-gray-500 mb-2">Remaining:</div>
              <div className="text-3xl font-bold">
                {state.selected_line.remaining_qty} {state.selected_line.uom}
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
            <div className="text-center text-gray-500">{state.selected_line.uom}</div>

            <Button
              className="w-full h-16 text-xl bg-green-600 hover:bg-green-700"
              onClick={handleQtyConfirm}
              disabled={state.qty <= 0}
            >
              <Check className="h-6 w-6 mr-2" />
              Continue
            </Button>

            <Button
              variant="outline"
              className="w-full h-14"
              onClick={() => setState((prev) => ({ ...prev, step: 'line_select', selected_line: undefined }))}
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP: Batch/Lot */}
      {state.step === 'batch' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Batch & Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Batch Number <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter batch..."
                value={state.batch_number}
                onChange={(e) => setState((prev) => ({ ...prev, batch_number: e.target.value }))}
                className="h-14 text-lg"
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Manufacturing Date (Optional)</label>
              <Input
                type="date"
                value={state.manufacture_date || ''}
                onChange={(e) => setState((prev) => ({ ...prev, manufacture_date: e.target.value }))}
                className="h-14 text-lg"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Expiry Date (Optional)</label>
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

            <Button
              variant="outline"
              className="w-full h-14"
              onClick={() => setState((prev) => ({ ...prev, step: 'qty' }))}
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP: Location */}
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

      {/* STEP: Confirm */}
      {state.step === 'confirm' && state.selected_line && (
        <div className="space-y-4">
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-700">Ready to Receive</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Product:</span>
                <span className="font-medium">{state.selected_line.product_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Qty:</span>
                <span className="font-mono font-bold">
                  {state.qty} {state.selected_line.uom}
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

      {/* STEP: Success */}
      {state.step === 'success' && (
        <Card className="bg-green-600 text-white">
          <CardContent className="p-8 text-center space-y-4">
            <Check className="h-20 w-20 mx-auto" />
            <h2 className="text-2xl font-bold">Complete!</h2>
            <p className="text-green-100">{state.document_number} fully received</p>

            <div className="pt-4 space-y-2">
              <Button className="w-full h-14 bg-white text-green-600 hover:bg-gray-100" onClick={resetToStart}>
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

      {/* STEP: Error */}
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
                  setState((prev) => ({
                    ...prev,
                    step: prev.document_id ? 'line_select' : 'document_select',
                    error: undefined,
                  }))
                }
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                className="w-full h-14 border-white text-white hover:bg-red-700"
                onClick={resetToStart}
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
