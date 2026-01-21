/**
 * Scanner Move Wizard Component (Story 05.20)
 * Purpose: 3-step wizard for scanner-based LP movement
 * Steps: 1) Scan LP, 2) Scan Destination, 3) Confirm Move
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
import { Step1ScanLP } from './Step1ScanLP'
import { Step2ScanDestination } from './Step2ScanDestination'
import { Step3Confirm } from './Step3Confirm'
import { MoveSuccessScreen } from './MoveSuccessScreen'
import type {
  LPLookupResult,
  LocationLookupResult,
  ScannerMoveResult,
  RecentMoveResult,
} from '@/lib/validation/scanner-move'

const STEP_LABELS = ['Scan LP', 'Scan Destination', 'Confirm Move']

interface ScannerMoveWizardProps {
  initialStep?: number
  isLoading?: boolean
  error?: string
  onComplete?: () => void
  onStepChange?: (step: number) => void
}

export function ScannerMoveWizard({
  initialStep = 1,
  isLoading: externalLoading,
  error: externalError,
  onComplete,
  onStepChange,
}: ScannerMoveWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Data states
  const [scannedLP, setScannedLP] = useState<LPLookupResult | null>(null)
  const [scannedLocation, setScannedLocation] = useState<LocationLookupResult | null>(null)
  const [moveResult, setMoveResult] = useState<ScannerMoveResult | null>(null)
  const [recentMoves, setRecentMoves] = useState<RecentMoveResult[]>([])
  const [warning, setWarning] = useState<string | null>(null)

  // Load recent moves on mount
  useEffect(() => {
    loadRecentMoves()
  }, [])

  const loadRecentMoves = async () => {
    try {
      const response = await fetch('/api/warehouse/scanner/move/recent?limit=5')
      const data = await response.json()
      if (data.success) {
        setRecentMoves(data.data || [])
      }
    } catch {
      // Silent fail - recent moves are optional
    }
  }

  const handleStepChange = useCallback(
    (step: number) => {
      setCurrentStep(step)
      if (onStepChange) {
        onStepChange(step)
      }
    },
    [onStepChange]
  )

  const lookupLP = async (barcode: string): Promise<LPLookupResult | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/warehouse/scanner/lookup/lp/${encodeURIComponent(barcode)}`
      )
      const data = await response.json()

      if (data.success) {
        return data.data
      } else {
        setError(data.error?.message || 'LP not found')
        return null
      }
    } catch {
      setError('Failed to lookup LP')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const lookupLocation = async (barcode: string): Promise<LocationLookupResult | null> => {
    setIsLoading(true)
    setError(null)
    setWarning(null)

    try {
      const response = await fetch(
        `/api/warehouse/scanner/lookup/location/${encodeURIComponent(barcode)}`
      )
      const data = await response.json()

      if (data.success) {
        const location = data.data as LocationLookupResult
        // Check for capacity warning
        if (location.capacity_pct !== null && location.capacity_pct >= 90) {
          setWarning(`Location at ${location.capacity_pct}% capacity`)
        }
        return location
      } else {
        setError(data.error?.message || 'Location not found')
        return null
      }
    } catch {
      setError('Failed to lookup location')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const handleLPScanned = useCallback(
    async (barcode: string) => {
      const lp = await lookupLP(barcode)

      if (lp) {
        // Check if LP is available
        if (lp.status !== 'available') {
          setError(`LP not available for movement (status: ${lp.status})`)
          AudioFeedback.playError()
          HapticFeedback.error()
          return
        }

        setScannedLP(lp)
        handleStepChange(2)
        AudioFeedback.playSuccess()
        HapticFeedback.success()
      } else {
        AudioFeedback.playError()
        HapticFeedback.error()
      }
    },
    [handleStepChange]
  )

  const handleLocationScanned = useCallback(
    async (barcode: string) => {
      if (!scannedLP) return

      const location = await lookupLocation(barcode)

      if (location) {
        // Check if same as source
        if (location.id === scannedLP.location.id) {
          setError('Destination must be different from current location')
          AudioFeedback.playError()
          HapticFeedback.error()
          return
        }

        // Check if active
        if (!location.is_active) {
          setError('Destination location is inactive')
          AudioFeedback.playError()
          HapticFeedback.error()
          return
        }

        setScannedLocation(location)
        handleStepChange(3)
        AudioFeedback.playSuccess()
        HapticFeedback.success()
      } else {
        AudioFeedback.playError()
        HapticFeedback.error()
      }
    },
    [scannedLP, handleStepChange]
  )

  const handleConfirmMove = useCallback(async () => {
    if (!scannedLP || !scannedLocation) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/warehouse/scanner/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lp_id: scannedLP.id,
          to_location_id: scannedLocation.id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMoveResult(data.data)
        handleStepChange(4)
        AudioFeedback.playConfirm()
        HapticFeedback.confirm()
        // Refresh recent moves
        loadRecentMoves()
      } else {
        setError(data.error?.message || 'Failed to complete move')
        AudioFeedback.playError()
        HapticFeedback.error()
      }
    } catch {
      setError('Failed to complete move')
      AudioFeedback.playAlert()
      HapticFeedback.error()
    } finally {
      setIsLoading(false)
    }
  }, [scannedLP, scannedLocation, handleStepChange])

  const handleMoveAnother = useCallback(() => {
    // Keep destination, start new LP scan
    setScannedLP(null)
    setMoveResult(null)
    setError(null)
    handleStepChange(1)
  }, [handleStepChange])

  const handleNewMove = useCallback(() => {
    // Reset everything
    setScannedLP(null)
    setScannedLocation(null)
    setMoveResult(null)
    setError(null)
    setWarning(null)
    handleStepChange(1)
  }, [handleStepChange])

  const handleDone = useCallback(() => {
    if (onComplete) {
      onComplete()
    } else {
      router.push('/warehouse')
    }
  }, [onComplete, router])

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      handleStepChange(currentStep - 1)
    } else {
      router.back()
    }
  }, [currentStep, handleStepChange, router])

  const handleEditLP = useCallback(() => {
    handleStepChange(1)
  }, [handleStepChange])

  const handleEditDestination = useCallback(() => {
    handleStepChange(2)
  }, [handleStepChange])

  const handleError = useCallback((message: string) => {
    setError(message)
  }, [])

  const handleRetry = useCallback(() => {
    setError(null)
  }, [])

  // Render loading overlay
  if (isLoading || externalLoading) {
    return (
      <div className="h-screen flex flex-col bg-white">
        <ScannerHeader title="Move LP" onBack={handleBack} />
        <LoadingOverlay show message="Processing..." />
      </div>
    )
  }

  // Render error state when stuck
  if ((error || externalError) && currentStep < 4 && !scannedLP && !scannedLocation) {
    return (
      <div className="h-screen flex flex-col bg-white">
        <ScannerHeader title="Move LP" onBack={handleBack} />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <ErrorAnimation show message={error || externalError} />
          <button
            onClick={handleRetry}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium min-h-[48px]"
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
        title="Move LP"
        onBack={currentStep < 4 ? handleBack : undefined}
        showHelp={currentStep < 4}
      />
      {currentStep < 4 && (
        <StepProgress currentStep={currentStep} totalSteps={3} stepLabels={STEP_LABELS} />
      )}

      {currentStep === 1 && (
        <Step1ScanLP
          onLPScanned={handleLPScanned}
          onError={handleError}
          scannedLP={scannedLP || undefined}
          error={error || undefined}
          recentMoves={recentMoves}
        />
      )}

      {currentStep === 2 && scannedLP && (
        <Step2ScanDestination
          lp={scannedLP}
          onLocationScanned={handleLocationScanned}
          onBack={handleBack}
          onError={handleError}
          scannedLocation={scannedLocation || undefined}
          error={error || undefined}
          warning={warning || undefined}
        />
      )}

      {currentStep === 3 && scannedLP && scannedLocation && (
        <Step3Confirm
          lp={scannedLP}
          destination={scannedLocation}
          onConfirm={handleConfirmMove}
          onEditLP={handleEditLP}
          onEditDestination={handleEditDestination}
          onCancel={handleNewMove}
          isLoading={isLoading}
        />
      )}

      {currentStep === 4 && moveResult && (
        <MoveSuccessScreen
          result={moveResult}
          onMoveAnother={handleMoveAnother}
          onNewMove={handleNewMove}
          onDone={handleDone}
        />
      )}
    </div>
  )
}

export default ScannerMoveWizard
