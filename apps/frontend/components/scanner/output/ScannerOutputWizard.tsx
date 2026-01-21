/**
 * Scanner Output Wizard Component (Story 04.7b)
 * Purpose: 7-step wizard for production output registration
 *
 * Steps:
 * 1. Scan WO - Scan work order barcode
 * 2. Enter Qty - Enter quantity with number pad
 * 3. Select QA - Select QA status
 * 4. Review - Review before confirmation
 * 5. LP Created - Success confirmation
 * 6. Print Label - Print LP label
 * 7. By-Products - By-product registration
 */

'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ScannerHeader } from '../shared/ScannerHeader'
import { StepProgress } from '../shared/StepProgress'
import { LoadingOverlay } from '../shared/LoadingOverlay'
import { ErrorAnimation } from '../shared/ErrorAnimation'
import { AudioFeedback } from '../shared/AudioFeedback'
import { HapticFeedback } from '../shared/HapticFeedback'
import { ScanWOStep } from './ScanWOStep'
import { EnterQuantityStep } from './EnterQuantityStep'
import { SelectQAStatusStep } from './SelectQAStatusStep'
import { ReviewOutputStep } from './ReviewOutputStep'
import { LPCreatedStep } from './LPCreatedStep'
import { PrintLabelStep } from './PrintLabelStep'
import { ByProductPromptStep } from './ByProductPromptStep'
import { useScannerOutput, type WOData, type QAStatus } from '@/lib/hooks/use-scanner-output'

const STEP_LABELS = ['Scan WO', 'Enter Qty', 'QA Status', 'Review', 'LP Created', 'Print Label', 'By-Products']

interface ScannerOutputWizardProps {
  onComplete?: () => void
}

export function ScannerOutputWizard({ onComplete }: ScannerOutputWizardProps) {
  const router = useRouter()

  // Scanner output state machine
  const {
    state,
    step,
    totalSteps,
    woData,
    quantity,
    qaStatus,
    lpData,
    byProducts,
    currentByProduct,
    isSubmitting,
    error,
    overproductionWarning,
    reviewData,
    woProgress,
    canPrint,
    printDisabledReason,
    completionMessage,
    handleWOScan,
    handleWOScanError,
    setQuantity,
    proceedToQA,
    setQAStatus,
    proceedToReview,
    submitOutput,
    handleOutputSuccess,
    handleOutputError,
    skipPrint,
    handlePrintSuccess,
    handlePrintError,
    proceedToByProducts,
    handleByProductRegistered,
    handleByProductSkip,
    handleByProductSkipAll,
    goBack,
    reset,
  } = useScannerOutput()

  // Handle WO barcode scan
  const handleWOBarcodeScan = useCallback(
    async (barcode: string) => {
      try {
        const response = await fetch('/api/production/output/validate-wo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barcode }),
        })

        const data = await response.json()

        if (!response.ok || !data.valid) {
          AudioFeedback.playError()
          HapticFeedback.error()
          handleWOScanError(
            response.status === 404 ? 'WO_NOT_FOUND' : 'INVALID_WO',
            data.error || 'Work order validation failed'
          )
          return
        }

        // Transform to WOData
        const wo: WOData = {
          id: data.wo.id,
          wo_number: data.wo.wo_number,
          product_name: data.wo.product_name,
          product_code: data.wo.product_code,
          planned_qty: data.wo.planned_qty,
          registered_qty: data.wo.registered_qty,
          remaining_qty: data.wo.remaining_qty,
          progress_percent: data.wo.progress_percent,
          uom: data.wo.uom,
          batch_number: data.wo.batch_number,
          shelf_life_days: data.wo.shelf_life_days,
          by_products: data.by_products || [],
        }

        AudioFeedback.playSuccess()
        HapticFeedback.success()
        handleWOScan(wo)
      } catch (err) {
        AudioFeedback.playError()
        HapticFeedback.error()
        handleWOScanError('SCAN_ERROR', 'Failed to validate work order')
      }
    },
    [handleWOScan, handleWOScanError]
  )

  // Handle quantity confirmation
  const handleQuantityConfirm = useCallback(
    (qty: number) => {
      if (qty <= 0) return
      setQuantity(qty)
      proceedToQA()
    },
    [setQuantity, proceedToQA]
  )

  // Handle QA status selection
  const handleQASelection = useCallback(
    (status: QAStatus) => {
      setQAStatus(status)
      proceedToReview()
    },
    [setQAStatus, proceedToReview]
  )

  // Handle output submission
  const handleSubmit = useCallback(async () => {
    if (!woData || !quantity || !qaStatus) return

    submitOutput()

    try {
      // Calculate expiry date
      const today = new Date()
      const shelfLifeDays = woData.shelf_life_days || 90
      const expiryDate = new Date(today)
      expiryDate.setDate(expiryDate.getDate() + shelfLifeDays)

      const response = await fetch('/api/production/output/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wo_id: woData.id,
          quantity,
          qa_status: qaStatus,
          batch_number: woData.batch_number,
          expiry_date: expiryDate.toISOString(),
          location_id: '00000000-0000-0000-0000-000000000001', // Default location - should come from context
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        AudioFeedback.playError()
        HapticFeedback.error()
        handleOutputError({
          code: 'REGISTER_FAILED',
          message: data.error || 'Failed to register output',
        })
        return
      }

      AudioFeedback.playConfirm()
      HapticFeedback.confirm()
      handleOutputSuccess({
        lp: data.lp,
        wo_progress: data.wo_progress,
      })
    } catch (err) {
      AudioFeedback.playError()
      HapticFeedback.error()
      handleOutputError({
        code: 'NETWORK_ERROR',
        message: 'Network error. Retry?',
      })
    }
  }, [woData, quantity, qaStatus, submitOutput, handleOutputSuccess, handleOutputError])

  // Handle print
  const handlePrint = useCallback(async () => {
    if (!lpData) return

    try {
      // Generate ZPL content (simplified for now)
      const zplContent = `^XA^FO50,50^BY3^BC,100,Y,N,N^FD${lpData.lp_number}^FS^XZ`

      const response = await fetch('/api/production/output/print-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zpl_content: zplContent }),
      })

      if (!response.ok) {
        handlePrintError('Printer not responding. Retry?')
        return
      }

      handlePrintSuccess()
      // Auto-advance to by-products after successful print
      setTimeout(() => {
        if (byProducts.length > 0) {
          proceedToByProducts()
        } else {
          skipPrint()
        }
      }, 1000)
    } catch (err) {
      handlePrintError('Print timeout. Retry?')
    }
  }, [lpData, byProducts, handlePrintSuccess, handlePrintError, proceedToByProducts, skipPrint])

  // Handle finish
  const handleFinish = useCallback(() => {
    if (onComplete) {
      onComplete()
    } else {
      router.push('/production/work-orders')
    }
  }, [onComplete, router])

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (step === 1) {
      router.back()
    } else {
      goBack()
    }
  }, [step, goBack, router])

  // Render loading overlay
  if (isSubmitting) {
    return (
      <div className="h-screen flex flex-col bg-slate-900">
        <ScannerHeader title="Register Output" onBack={handleBack} />
        <StepProgress currentStep={step} totalSteps={totalSteps} stepLabels={STEP_LABELS} />
        <LoadingOverlay show message="Registering output..." />
      </div>
    )
  }

  // Render error state
  if (error && state !== 'scan_wo') {
    return (
      <div className="h-screen flex flex-col bg-slate-900">
        <ScannerHeader title="Register Output" onBack={handleBack} />
        <StepProgress currentStep={step} totalSteps={totalSteps} stepLabels={STEP_LABELS} />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <ErrorAnimation show message={error.message} />
          <button
            onClick={goBack}
            className="mt-4 px-6 py-3 bg-cyan-600 text-white rounded-lg font-medium min-h-[48px]"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Render completion state
  if (state === 'complete') {
    return (
      <div className="h-screen flex flex-col bg-slate-900">
        <ScannerHeader title="Complete" />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6">
            <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{completionMessage}</h2>
          <div className="flex gap-4 mt-8">
            <button
              onClick={reset}
              className="px-6 py-3 bg-slate-700 text-white rounded-lg font-medium min-h-[48px]"
            >
              Register Another
            </button>
            <button
              onClick={handleFinish}
              className="px-6 py-3 bg-cyan-600 text-white rounded-lg font-medium min-h-[48px]"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <ScannerHeader
        title={woData ? woData.wo_number : 'Register Output'}
        onBack={state !== 'lp_created' ? handleBack : undefined}
      />
      <StepProgress currentStep={step} totalSteps={totalSteps} stepLabels={STEP_LABELS} />

      {state === 'scan_wo' && (
        <ScanWOStep
          onScan={handleWOBarcodeScan}
          error={error}
          onClearError={() => handleWOScanError('', '')}
        />
      )}

      {state === 'enter_qty' && woData && (
        <EnterQuantityStep
          woData={woData}
          overproductionWarning={overproductionWarning}
          onConfirm={handleQuantityConfirm}
          onBack={goBack}
        />
      )}

      {state === 'select_qa' && woData && (
        <SelectQAStatusStep
          productName={woData.product_name}
          quantity={quantity || 0}
          batchNumber={woData.batch_number}
          onSelect={handleQASelection}
          onBack={goBack}
        />
      )}

      {state === 'review' && woData && reviewData && (
        <ReviewOutputStep
          woData={woData}
          reviewData={reviewData}
          onConfirm={handleSubmit}
          onBack={goBack}
          onEditQuantity={() => goBack()}
          onEditQAStatus={() => goBack()}
        />
      )}

      {state === 'lp_created' && lpData && woProgress && (
        <LPCreatedStep
          lpData={lpData}
          woProgress={woProgress}
          onNext={() => {}}
        />
      )}

      {state === 'print_label' && lpData && (
        <PrintLabelStep
          lpData={lpData}
          canPrint={canPrint}
          printDisabledReason={printDisabledReason}
          onPrint={handlePrint}
          onSkip={skipPrint}
        />
      )}

      {state === 'by_products' && currentByProduct && (
        <ByProductPromptStep
          byProduct={currentByProduct}
          onYes={handleByProductRegistered}
          onSkip={handleByProductSkip}
          onSkipAll={handleByProductSkipAll}
        />
      )}
    </div>
  )
}

export default ScannerOutputWizard
