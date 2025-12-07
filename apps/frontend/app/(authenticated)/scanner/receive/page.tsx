/**
 * Scanner Receive Workflow
 * Story 5.34: Scanner Receive Workflow
 * Step-by-step guided receiving for POs and ASNs
 */

'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PackageOpen, Loader2 } from 'lucide-react'
import { ScannerInput } from '@/components/scanner/ScannerInput'
import { ScannerFeedback } from '@/components/scanner/ScannerFeedback'
import { WorkflowProgress } from '@/components/scanner/WorkflowProgress'
import { useToast } from '@/hooks/use-toast'

type WorkflowStep = 'scan-po' | 'select-item' | 'scan-item' | 'enter-qty' | 'complete'

interface POData {
  id: string
  po_number: string
  supplier_name: string
  items: POItem[]
}

interface POItem {
  id: string
  product_id: string
  product_name: string
  product_code: string
  ordered_qty: number
  received_qty: number
  uom: string
}

export default function ScannerReceivePage() {
  const router = useRouter()
  const { toast } = useToast()
  const itemInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<WorkflowStep>('scan-po')
  const [loading, setLoading] = useState(false)
  const [poData, setPOData] = useState<POData | null>(null)
  const [selectedItem, setSelectedItem] = useState<POItem | null>(null)
  const [scannedQty, setScannedQty] = useState('')

  const [feedback, setFeedback] = useState<{
    show: boolean
    type: 'success' | 'error' | 'warning'
    message: string
  }>({ show: false, type: 'success', message: '' })

  const steps = [
    { id: 'scan-po', label: 'Scan PO', description: 'Scan purchase order' },
    { id: 'select-item', label: 'Select Item', description: 'Choose product' },
    { id: 'scan-item', label: 'Scan Product', description: 'Verify product' },
    { id: 'enter-qty', label: 'Enter Qty', description: 'Enter received qty' },
    { id: 'complete', label: 'Complete', description: 'Finish receiving' },
  ]

  const currentStepIndex = steps.findIndex((s) => s.id === step)

  // Step 1: Scan PO
  const handleScanPO = useCallback(
    async (barcode: string) => {
      setLoading(true)
      try {
        const response = await fetch(`/api/planning/purchase-orders?search=${encodeURIComponent(barcode)}&limit=1`)
        if (!response.ok) throw new Error('PO not found')

        const { data } = await response.json()
        const po = data?.[0]

        if (!po) {
          setFeedback({ show: true, type: 'error', message: 'PO Not Found' })
          return
        }

        // Fetch PO lines
        const linesResponse = await fetch(`/api/planning/purchase-orders/${po.id}/lines`)
        const linesData = await linesResponse.json()

        setPOData({
          id: po.id,
          po_number: po.po_number,
          supplier_name: po.supplier?.name || 'Unknown Supplier',
          items: linesData.data || [],
        })

        setFeedback({ show: true, type: 'success', message: 'PO Loaded' })
        setStep('select-item')
      } catch (error) {
        console.error('PO scan error:', error)
        setFeedback({ show: true, type: 'error', message: 'Scan Failed' })
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Step 2: Select item
  const handleSelectItem = (item: POItem) => {
    setSelectedItem(item)
    setStep('scan-item')
  }

  // Step 3: Scan item to verify
  const handleScanItem = useCallback(
    async (barcode: string) => {
      if (!selectedItem) return

      setLoading(true)
      try {
        // Verify scanned barcode matches selected product
        const response = await fetch(`/api/technical/products?search=${encodeURIComponent(barcode)}&limit=1`)
        const { data } = await response.json()
        const product = data?.[0]

        if (!product || product.id !== selectedItem.product_id) {
          setFeedback({ show: true, type: 'error', message: 'Product Mismatch' })
          return
        }

        setFeedback({ show: true, type: 'success', message: 'Product Verified' })
        setStep('enter-qty')
      } catch (error) {
        console.error('Item scan error:', error)
        setFeedback({ show: true, type: 'error', message: 'Verification Failed' })
      } finally {
        setLoading(false)
      }
    },
    [selectedItem]
  )

  // Step 4: Receive quantity
  const handleReceive = async () => {
    if (!poData || !selectedItem || !scannedQty) return

    const qty = parseFloat(scannedQty)
    if (qty <= 0) {
      toast({ title: 'Error', description: 'Invalid quantity', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/warehouse/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          po_id: poData.id,
          po_line_id: selectedItem.id,
          product_id: selectedItem.product_id,
          received_qty: qty,
        }),
      })

      if (!response.ok) throw new Error('Receive failed')

      const result = await response.json()

      setFeedback({ show: true, type: 'success', message: `Received ${qty} ${selectedItem.uom}` })
      toast({
        title: 'Success',
        description: `LP ${result.data?.lp_number} created`,
      })

      // Update local state
      const updatedItems = poData.items.map((item) =>
        item.id === selectedItem.id
          ? { ...item, received_qty: item.received_qty + qty }
          : item
      )
      setPOData({ ...poData, items: updatedItems })

      // Check if more items to receive
      const hasMoreItems = updatedItems.some((item) => item.received_qty < item.ordered_qty)
      if (hasMoreItems) {
        setSelectedItem(null)
        setScannedQty('')
        setStep('select-item')
      } else {
        setStep('complete')
      }
    } catch (error) {
      console.error('Receive error:', error)
      setFeedback({ show: true, type: 'error', message: 'Receive Failed' })
    } finally {
      setLoading(false)
    }
  }

  // Reset workflow
  const handleReset = () => {
    setPOData(null)
    setSelectedItem(null)
    setScannedQty('')
    setStep('scan-po')
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      {/* Progress */}
      <WorkflowProgress steps={steps} currentStep={currentStepIndex} />

      {/* STEP 1: Scan PO */}
      {step === 'scan-po' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageOpen className="h-6 w-6" />
              Scan Purchase Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScannerInput
              onSubmit={handleScanPO}
              loading={loading}
              placeholder="Scan PO barcode..."
              autoFocus
            />
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Select Item */}
      {step === 'select-item' && poData && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-gray-500">Purchase Order</div>
              <div className="text-xl font-bold">{poData.po_number}</div>
              <div className="text-sm text-gray-600">{poData.supplier_name}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Select Item to Receive</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {poData.items.map((item) => {
                const remaining = item.ordered_qty - item.received_qty
                return (
                  <Button
                    key={item.id}
                    variant="outline"
                    className="w-full h-auto py-4 flex flex-col items-start"
                    onClick={() => handleSelectItem(item)}
                    disabled={remaining <= 0}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="font-medium">{item.product_name}</div>
                      <Badge variant={remaining > 0 ? 'default' : 'secondary'}>
                        {remaining > 0 ? `${remaining} ${item.uom}` : 'Complete'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.product_code} • Ordered: {item.ordered_qty} • Received: {item.received_qty}
                    </div>
                  </Button>
                )
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 3: Scan Item */}
      {step === 'scan-item' && selectedItem && (
        <Card>
          <CardHeader>
            <CardTitle>Scan Product to Verify</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-100 rounded-lg">
              <div className="text-sm text-gray-500">Expected Product</div>
              <div className="text-lg font-bold">{selectedItem.product_name}</div>
              <div className="text-sm text-gray-600">{selectedItem.product_code}</div>
            </div>

            <ScannerInput
              ref={itemInputRef}
              onSubmit={handleScanItem}
              loading={loading}
              placeholder="Scan product barcode..."
              autoFocus
            />

            <Button variant="outline" className="w-full" onClick={() => setStep('select-item')}>
              Back to Item List
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: Enter Quantity */}
      {step === 'enter-qty' && selectedItem && (
        <Card>
          <CardHeader>
            <CardTitle>Enter Received Quantity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-100 rounded-lg">
              <div className="text-sm text-gray-500">Product</div>
              <div className="text-lg font-bold">{selectedItem.product_name}</div>
              <div className="text-sm text-gray-600">
                Remaining: {selectedItem.ordered_qty - selectedItem.received_qty} {selectedItem.uom}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity ({selectedItem.uom})</label>
              <input
                type="number"
                value={scannedQty}
                onChange={(e) => setScannedQty(e.target.value)}
                className="w-full h-16 px-4 text-2xl font-mono border rounded-lg"
                placeholder="0"
                autoFocus
              />
            </div>

            <Button
              onClick={handleReceive}
              disabled={loading || !scannedQty || parseFloat(scannedQty) <= 0}
              className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Receive'}
            </Button>

            <Button variant="outline" className="w-full" onClick={() => setStep('scan-item')}>
              Back
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 5: Complete */}
      {step === 'complete' && poData && (
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <PackageOpen className="h-20 w-20 text-green-500 mx-auto" />
            <div className="text-2xl font-bold text-green-600">Receiving Complete!</div>
            <div className="text-lg">{poData.po_number}</div>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button variant="outline" className="h-14" onClick={() => router.push('/scanner')}>
                Scanner Home
              </Button>
              <Button className="h-14 bg-blue-600" onClick={handleReset}>
                Receive Another
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
        onHide={() => setFeedback({ ...feedback, show: false })}
      />
    </div>
  )
}
