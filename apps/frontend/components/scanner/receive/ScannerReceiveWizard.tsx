/**
 * Scanner Receive Wizard Component (Story 05.19)
 * Purpose: 5-step wizard for scanner-based receiving
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScannerHeader } from '../shared/ScannerHeader'
import { StepProgress } from '../shared/StepProgress'
import { LoadingOverlay } from '../shared/LoadingOverlay'
import { ErrorAnimation } from '../shared/ErrorAnimation'
import { AudioFeedback } from '../shared/AudioFeedback'
import { HapticFeedback } from '../shared/HapticFeedback'
import { Step1SelectPO } from './Step1SelectPO'
import { Step2ReviewLines } from './Step2ReviewLines'
import { Step3EnterDetails } from './Step3EnterDetails'
import { Step4ReviewConfirm } from './Step4ReviewConfirm'
import { Step5Success } from './Step5Success'
import type {
  PendingReceiptSummary,
  POLineForScanner,
  ScannerReceiveResult,
} from '@/lib/validation/scanner-receive'

const STEP_LABELS = ['Select PO', 'Review Lines', 'Enter Details', 'Confirm', 'Complete']

interface FormData {
  poId: string
  poLineId: string
  productName: string
  productCode: string
  receivedQty: number
  uom: string
  batchNumber: string
  expiryDate: string
  locationId: string
  locationPath: string
}

interface ScannerReceiveWizardProps {
  initialStep?: number
  isLoading?: boolean
  error?: string
  onComplete?: () => void
}

export function ScannerReceiveWizard({
  initialStep = 1,
  isLoading: externalLoading,
  error: externalError,
  onComplete,
}: ScannerReceiveWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Data states
  const [pendingPOs, setPendingPOs] = useState<PendingReceiptSummary[]>([])
  const [selectedPO, setSelectedPO] = useState<PendingReceiptSummary | null>(null)
  const [poLines, setPOLines] = useState<POLineForScanner[]>([])
  const [selectedLine, setSelectedLine] = useState<POLineForScanner | null>(null)
  const [formData, setFormData] = useState<FormData | null>(null)
  const [result, setResult] = useState<ScannerReceiveResult | null>(null)

  // Warehouse settings
  const [requireBatch, setRequireBatch] = useState(false)
  const [requireExpiry, setRequireExpiry] = useState(false)

  // Load pending POs on mount
  useEffect(() => {
    loadPendingPOs()
    loadWarehouseSettings()
  }, [])

  const loadPendingPOs = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/warehouse/scanner/pending-receipts')
      const data = await response.json()

      if (data.success) {
        setPendingPOs(data.data)
      } else {
        setError(data.error?.message || 'Failed to load pending receipts')
      }
    } catch (err) {
      setError('Failed to load pending receipts')
    } finally {
      setIsLoading(false)
    }
  }

  const loadWarehouseSettings = async () => {
    // In a real app, this would fetch from API
    // For now, use defaults
    setRequireBatch(false)
    setRequireExpiry(false)
  }

  const loadPOLines = async (poId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/warehouse/scanner/lookup/po/${encodeURIComponent(poId)}`)
      const data = await response.json()

      if (data.success) {
        setPOLines(data.data.lines || [])
        setSelectedPO({
          id: data.data.id,
          po_number: data.data.po_number,
          supplier_name: data.data.supplier_name,
          expected_date: data.data.expected_date,
          lines_total: data.data.lines?.length || 0,
          lines_pending: data.data.lines?.filter((l: POLineForScanner) => l.remaining_qty > 0).length || 0,
          total_qty_ordered: 0,
          total_qty_received: 0,
        })
        setCurrentStep(2)
        AudioFeedback.playSuccess()
        HapticFeedback.success()
      } else {
        setError(data.error?.message || 'PO not found')
        AudioFeedback.playError()
        HapticFeedback.error()
      }
    } catch (err) {
      setError('Failed to load PO details')
      AudioFeedback.playError()
      HapticFeedback.error()
    } finally {
      setIsLoading(false)
    }
  }

  const handlePOSelected = useCallback((poId: string) => {
    loadPOLines(poId)
  }, [])

  const handleLineSelected = useCallback(
    (lineId: string) => {
      const line = poLines.find((l) => l.id === lineId)
      if (line) {
        setSelectedLine(line)
        setCurrentStep(3)
      }
    },
    [poLines]
  )

  const handleDetailsSubmit = useCallback(
    (data: { receivedQty: string; batchNumber: string; expiryDate: string; locationId: string }) => {
      if (!selectedLine || !selectedPO) return

      setFormData({
        poId: selectedPO.id,
        poLineId: selectedLine.id,
        productName: selectedLine.product_name,
        productCode: selectedLine.product_code,
        receivedQty: parseFloat(data.receivedQty) || 0,
        uom: selectedLine.uom,
        batchNumber: data.batchNumber,
        expiryDate: data.expiryDate,
        locationId: data.locationId,
        locationPath: '', // Would be set from location lookup
      })
      setCurrentStep(4)
    },
    [selectedLine, selectedPO]
  )

  const handleConfirm = useCallback(async () => {
    if (!formData) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/warehouse/scanner/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          po_id: formData.poId,
          po_line_id: formData.poLineId,
          warehouse_id: 'default-warehouse', // Would come from context
          location_id: formData.locationId || 'default-location', // Would come from form
          received_qty: formData.receivedQty,
          batch_number: formData.batchNumber || null,
          expiry_date: formData.expiryDate || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResult({
          grn: data.data.grn,
          lp: data.data.lp,
          poLineStatus: data.data.po_line_status,
          poStatus: data.data.po_status,
          printJobId: data.data.print_job_id,
        })
        setCurrentStep(5)
        AudioFeedback.playConfirm()
        HapticFeedback.confirm()
      } else {
        setError(data.error?.message || 'Failed to process receipt')
        AudioFeedback.playError()
        HapticFeedback.error()
      }
    } catch (err) {
      setError('Failed to process receipt')
      AudioFeedback.playAlert()
      HapticFeedback.error()
    } finally {
      setIsLoading(false)
    }
  }, [formData])

  const handleReceiveMore = useCallback(() => {
    // Go back to step 2 to receive more from same PO
    setSelectedLine(null)
    setFormData(null)
    setResult(null)
    setCurrentStep(2)
    loadPOLines(selectedPO?.id || '')
  }, [selectedPO])

  const handleNewPO = useCallback(() => {
    // Reset and go to step 1
    setSelectedPO(null)
    setSelectedLine(null)
    setPOLines([])
    setFormData(null)
    setResult(null)
    setCurrentStep(1)
    loadPendingPOs()
  }, [])

  const handleDone = useCallback(() => {
    if (onComplete) {
      onComplete()
    } else {
      router.push('/warehouse')
    }
  }, [onComplete, router])

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      router.back()
    }
  }, [currentStep, router])

  const handleEdit = useCallback((step: number) => {
    setCurrentStep(step)
  }, [])

  const handleRetry = useCallback(() => {
    setError(null)
    if (currentStep === 1) {
      loadPendingPOs()
    }
  }, [currentStep])

  // Render loading overlay
  if (isLoading || externalLoading) {
    return (
      <div className="h-screen flex flex-col bg-white">
        <ScannerHeader title="Receive Goods" onBack={handleBack} />
        <LoadingOverlay show message="Loading..." />
      </div>
    )
  }

  // Render error state
  if (error || externalError) {
    return (
      <div className="h-screen flex flex-col bg-white">
        <ScannerHeader title="Receive Goods" onBack={handleBack} />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <ErrorAnimation show message={error || externalError} />
          <button
            onClick={handleRetry}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      <ScannerHeader
        title="Receive Goods"
        onBack={currentStep < 5 ? handleBack : undefined}
        showHelp={currentStep < 5}
      />
      {currentStep < 5 && (
        <StepProgress currentStep={currentStep} totalSteps={5} stepLabels={STEP_LABELS} />
      )}

      {currentStep === 1 && (
        <Step1SelectPO
          pendingPOs={pendingPOs}
          isLoading={isLoading}
          onPOSelected={handlePOSelected}
        />
      )}

      {currentStep === 2 && selectedPO && (
        <Step2ReviewLines
          poId={selectedPO.id}
          poNumber={selectedPO.po_number}
          supplierName={selectedPO.supplier_name}
          lines={poLines}
          onLineSelected={handleLineSelected}
        />
      )}

      {currentStep === 3 && selectedLine && (
        <Step3EnterDetails
          line={selectedLine}
          requireBatch={requireBatch}
          requireExpiry={requireExpiry}
          onSubmit={handleDetailsSubmit}
        />
      )}

      {currentStep === 4 && formData && (
        <Step4ReviewConfirm
          formData={formData}
          isLoading={isLoading}
          onConfirm={handleConfirm}
          onEdit={handleEdit}
        />
      )}

      {currentStep === 5 && result && (
        <Step5Success
          result={result}
          onReceiveMore={handleReceiveMore}
          onNewPO={handleNewPO}
          onDone={handleDone}
        />
      )}
    </div>
  )
}

export default ScannerReceiveWizard
