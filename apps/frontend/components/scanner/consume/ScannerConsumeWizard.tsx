/**
 * Scanner Consume Wizard Component (Story 04.6b)
 * Purpose: 6-step wizard for material consumption
 *
 * Steps:
 * 1. Scan WO - Scan work order barcode
 * 2. Scan LP - Scan license plate barcode
 * 3. Enter Qty - Enter consumption quantity
 * 4. Review - Review before confirmation
 * 5. Confirm - Processing confirmation
 * 6. Next - Success, option for next material
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
import { Step1ScanWO } from './Step1ScanWO'
import { Step2ScanLP } from './Step2ScanLP'
import { Step3EnterQty } from './Step3EnterQty'
import { Step4Review } from './Step4Review'
import { Step5Confirm } from './Step5Confirm'
import { Step6Next } from './Step6Next'
import { useScannerFlow, type WOData, type LPData } from '@/lib/hooks/use-scanner-flow'
import { useRecordConsumption, useConsumptionMaterials } from '@/lib/hooks/use-consumption'
import { validateLP, type ConsumptionMaterial } from '@/lib/services/consumption-service'

const STEP_LABELS = ['Scan WO', 'Scan LP', 'Enter Qty', 'Review', 'Confirm', 'Complete']

interface ScannerConsumeWizardProps {
  onComplete?: () => void
}

export function ScannerConsumeWizard({ onComplete }: ScannerConsumeWizardProps) {
  const router = useRouter()

  // Scanner flow state machine
  const {
    state,
    step,
    totalSteps,
    woData,
    lpData,
    consumeQty,
    isFullLP,
    isSubmitting,
    error,
    handleWOScan,
    handleWOScanError,
    handleLPScan,
    handleLPScanError,
    setConsumeQty,
    handleFullConsumption,
    proceedToReview,
    submitConsumption,
    handleConsumptionSuccess,
    handleConsumptionError,
    handleNextMaterial,
    handleDone,
    goBack,
  } = useScannerFlow()

  // Mutation for recording consumption
  const recordConsumption = useRecordConsumption()

  // Fetch materials when WO is selected
  const { refetch: refetchMaterials } = useConsumptionMaterials(woData?.id || '', {
    enabled: !!woData?.id,
  })

  // Get current material from WO materials
  const currentMaterial = woData?.materials?.[0] as ConsumptionMaterial | undefined

  // Handle WO barcode scan
  const handleWOBarcodeScan = useCallback(
    async (barcode: string) => {
      try {
        // Lookup WO by barcode
        const response = await fetch(`/api/production/work-orders/lookup?barcode=${encodeURIComponent(barcode)}`)
        const data = await response.json()

        if (data.error || !data.data) {
          AudioFeedback.playError()
          HapticFeedback.error()
          handleWOScanError('WO_NOT_FOUND', data.error?.message || 'Work order not found')
          return
        }

        // Transform to WOData
        const wo: WOData = {
          id: data.data.id,
          wo_number: data.data.wo_number,
          product_name: data.data.product_name,
          status: data.data.status,
          materials: data.data.materials || [],
        }

        AudioFeedback.playSuccess()
        HapticFeedback.success()
        handleWOScan(wo)
      } catch (err) {
        AudioFeedback.playError()
        HapticFeedback.error()
        handleWOScanError('SCAN_ERROR', 'Failed to lookup work order')
      }
    },
    [handleWOScan, handleWOScanError]
  )

  // Handle LP barcode scan
  const handleLPBarcodeScan = useCallback(
    async (barcode: string) => {
      if (!currentMaterial) {
        handleLPScanError('NO_MATERIAL', 'No material selected')
        return
      }

      try {
        // Validate LP against material
        const result = await validateLP(woData?.id || '', barcode, currentMaterial)

        if (!result.valid || !result.lp) {
          AudioFeedback.playError()
          HapticFeedback.error()
          handleLPScanError(result.errorCode || 'LP_INVALID', result.error || 'LP validation failed')
          return
        }

        // Transform to LPData
        const lp: LPData = {
          id: result.lp.id,
          lp_number: result.lp.lp_number,
          product_name: currentMaterial.material_name,
          quantity: result.lp.current_qty || result.lp.quantity,
          uom: result.lp.uom,
          batch_number: result.lp.batch_number || undefined,
          expiry_date: result.lp.expiry_date || undefined,
        }

        AudioFeedback.playSuccess()
        HapticFeedback.success()
        handleLPScan(lp)
      } catch (err) {
        AudioFeedback.playError()
        HapticFeedback.error()
        handleLPScanError('SCAN_ERROR', 'Failed to validate LP')
      }
    },
    [woData, currentMaterial, handleLPScan, handleLPScanError]
  )

  // Handle quantity confirmation
  const handleQtyConfirm = useCallback(() => {
    if (!consumeQty || consumeQty <= 0) {
      return
    }

    // Check for full LP required
    if (currentMaterial?.consume_whole_lp && lpData && consumeQty !== lpData.quantity) {
      // Don't allow partial consumption for full LP materials
      return
    }

    proceedToReview()
  }, [consumeQty, currentMaterial, lpData, proceedToReview])

  // Handle consumption submission
  const handleSubmit = useCallback(async () => {
    if (!woData || !lpData || !consumeQty || !currentMaterial) {
      return
    }

    submitConsumption()

    try {
      await recordConsumption.mutateAsync({
        woId: woData.id,
        request: {
          wo_material_id: currentMaterial.id,
          lp_id: lpData.id,
          consume_qty: consumeQty,
        },
      })

      AudioFeedback.playConfirm()
      HapticFeedback.confirm()
      await handleConsumptionSuccess()

      // Refresh materials
      refetchMaterials()
    } catch (err) {
      AudioFeedback.playError()
      HapticFeedback.error()
      handleConsumptionError('CONSUME_FAILED', err instanceof Error ? err.message : 'Consumption failed')
    }
  }, [
    woData,
    lpData,
    consumeQty,
    currentMaterial,
    submitConsumption,
    recordConsumption,
    handleConsumptionSuccess,
    handleConsumptionError,
    refetchMaterials,
  ])

  // Handle done
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

  // Clear error
  const handleClearError = useCallback(() => {
    // Error auto-clears on next action
  }, [])

  // Render loading overlay
  if (isSubmitting) {
    return (
      <div className="h-screen flex flex-col bg-white">
        <ScannerHeader title="Consume Material" onBack={handleBack} />
        <StepProgress currentStep={step} totalSteps={totalSteps} stepLabels={STEP_LABELS} />
        <LoadingOverlay show message="Processing consumption..." />
      </div>
    )
  }

  // Render error state with retry
  if (error) {
    return (
      <div className="h-screen flex flex-col bg-white">
        <ScannerHeader title="Consume Material" onBack={handleBack} />
        <StepProgress currentStep={step} totalSteps={totalSteps} stepLabels={STEP_LABELS} />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <ErrorAnimation show message={error.message} />
          <button
            onClick={handleClearError}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium min-h-[48px]"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      <ScannerHeader
        title={woData ? woData.wo_number : 'Consume Material'}
        onBack={state !== 'next' ? handleBack : undefined}
        showHelp={state !== 'next'}
      />
      {state !== 'next' && (
        <StepProgress currentStep={step} totalSteps={totalSteps} stepLabels={STEP_LABELS} />
      )}

      {state === 'scan_wo' && <Step1ScanWO onScan={handleWOBarcodeScan} />}

      {state === 'scan_lp' && woData && (
        <Step2ScanLP
          woData={woData}
          material={currentMaterial}
          onScan={handleLPBarcodeScan}
        />
      )}

      {state === 'enter_qty' && lpData && currentMaterial && (
        <Step3EnterQty
          lpData={lpData}
          material={currentMaterial}
          value={consumeQty}
          onChange={setConsumeQty}
          onFullConsumption={handleFullConsumption}
          onConfirm={handleQtyConfirm}
        />
      )}

      {state === 'review' && woData && lpData && currentMaterial && (
        <Step4Review
          woData={woData}
          lpData={lpData}
          material={currentMaterial}
          consumeQty={consumeQty || 0}
          isFullLP={isFullLP}
          onBack={goBack}
          onConfirm={handleSubmit}
        />
      )}

      {state === 'confirm' && <Step5Confirm />}

      {state === 'next' && woData && (
        <Step6Next
          woData={woData}
          consumedMaterial={currentMaterial}
          consumeQty={consumeQty || 0}
          onNextMaterial={handleNextMaterial}
          onDone={handleFinish}
        />
      )}
    </div>
  )
}

export default ScannerConsumeWizard
