/**
 * Scanner Putaway Wizard Component (Story 05.21)
 * Purpose: 5-step wizard for guided putaway operations
 *
 * Steps:
 * 1. Scan LP - Scan license plate barcode
 * 2. View Suggestion - Display suggested location with reason
 * 3. Scan Location - Scan location barcode for confirmation
 * 4. Confirm - Review and confirm putaway
 * 5. Success - Putaway complete, option for next LP
 */

'use client'

import { useCallback, useReducer } from 'react'
import { useRouter } from 'next/navigation'
import { ScannerHeader } from '../shared/ScannerHeader'
import { StepProgress } from '../shared/StepProgress'
import { LoadingOverlay } from '../shared/LoadingOverlay'
import { ErrorAnimation } from '../shared/ErrorAnimation'
import { AudioFeedback } from '../shared/AudioFeedback'
import { HapticFeedback } from '../shared/HapticFeedback'
import { Step1ScanLP } from './Step1ScanLP'
import { Step2ViewSuggestion } from './Step2ViewSuggestion'
import { Step3ScanLocation } from './Step3ScanLocation'
import { Step4Confirm } from './Step4Confirm'
import { Step5Success } from './Step5Success'
import { Button } from '@/components/ui/button'

const STEP_LABELS = ['Scan LP', 'View Suggestion', 'Scan Location']

// Types
export type PutawayState = 'scan_lp' | 'view_suggestion' | 'scan_location' | 'confirm' | 'success'

export interface LPDetails {
  id: string
  lp_number: string
  product_name: string
  product_code: string
  quantity: number
  uom: string
  batch_number?: string
  expiry_date?: string
  current_location: string
  status: string
}

export interface SuggestedLocation {
  id: string
  location_code: string
  full_path: string
  zone_id?: string
  zone_name?: string
  aisle?: string
  rack?: string
  level?: string
}

export interface LocationSuggestionData {
  suggestedLocation: SuggestedLocation | null
  reason: string
  reasonCode: string
  alternatives: Array<{ id: string; location_code: string; reason: string }>
  strategyUsed: 'fifo' | 'fefo' | 'none'
}

export interface ScannedLocation {
  location_code: string
  matches: boolean
  id?: string
  full_path?: string
  zone_name?: string
}

export interface PutawayResult {
  stockMove: {
    id: string
    move_number: string
    move_type: string
    from_location_id: string
    to_location_id: string
    quantity: number
    status: string
  }
  lp: {
    id: string
    lp_number: string
    location_id: string
    location_path: string
  }
  overrideApplied: boolean
}

interface PutawayFlowState {
  state: PutawayState
  step: number
  lpDetails: LPDetails | null
  suggestion: LocationSuggestionData | null
  scannedLocation: ScannedLocation | null
  override: boolean
  isSubmitting: boolean
  error: { code: string; message: string } | null
  result: PutawayResult | null
}

type PutawayAction =
  | { type: 'SET_LP'; payload: { lp: LPDetails; suggestion: LocationSuggestionData } }
  | { type: 'SET_LP_ERROR'; payload: { code: string; message: string } }
  | { type: 'PROCEED_TO_SCAN_LOCATION' }
  | { type: 'SET_SCANNED_LOCATION'; payload: ScannedLocation }
  | { type: 'SET_LOCATION_ERROR'; payload: { code: string; message: string } }
  | { type: 'SET_OVERRIDE'; payload: boolean }
  | { type: 'PROCEED_TO_CONFIRM' }
  | { type: 'SUBMIT_PUTAWAY' }
  | { type: 'PUTAWAY_SUCCESS'; payload: PutawayResult }
  | { type: 'PUTAWAY_ERROR'; payload: { code: string; message: string } }
  | { type: 'PUTAWAY_ANOTHER' }
  | { type: 'GO_BACK' }
  | { type: 'RESET' }
  | { type: 'CLEAR_ERROR' }

const STEP_MAP: Record<PutawayState, number> = {
  scan_lp: 1,
  view_suggestion: 2,
  scan_location: 3,
  confirm: 3,
  success: 3,
}

const initialState: PutawayFlowState = {
  state: 'scan_lp',
  step: 1,
  lpDetails: null,
  suggestion: null,
  scannedLocation: null,
  override: false,
  isSubmitting: false,
  error: null,
  result: null,
}

function putawayReducer(state: PutawayFlowState, action: PutawayAction): PutawayFlowState {
  switch (action.type) {
    case 'SET_LP':
      return {
        ...state,
        state: 'view_suggestion',
        step: STEP_MAP.view_suggestion,
        lpDetails: action.payload.lp,
        suggestion: action.payload.suggestion,
        error: null,
      }

    case 'SET_LP_ERROR':
      return {
        ...state,
        error: action.payload,
      }

    case 'PROCEED_TO_SCAN_LOCATION':
      return {
        ...state,
        state: 'scan_location',
        step: STEP_MAP.scan_location,
        error: null,
      }

    case 'SET_SCANNED_LOCATION':
      return {
        ...state,
        scannedLocation: action.payload,
        error: null,
      }

    case 'SET_LOCATION_ERROR':
      return {
        ...state,
        error: action.payload,
      }

    case 'SET_OVERRIDE':
      return {
        ...state,
        override: action.payload,
      }

    case 'PROCEED_TO_CONFIRM':
      return {
        ...state,
        state: 'confirm',
        error: null,
      }

    case 'SUBMIT_PUTAWAY':
      return {
        ...state,
        isSubmitting: true,
        error: null,
      }

    case 'PUTAWAY_SUCCESS':
      return {
        ...state,
        state: 'success',
        isSubmitting: false,
        result: action.payload,
        error: null,
      }

    case 'PUTAWAY_ERROR':
      return {
        ...state,
        state: 'confirm',
        isSubmitting: false,
        error: action.payload,
      }

    case 'PUTAWAY_ANOTHER':
      return {
        ...initialState,
      }

    case 'GO_BACK':
      switch (state.state) {
        case 'view_suggestion':
          return {
            ...state,
            state: 'scan_lp',
            step: STEP_MAP.scan_lp,
            lpDetails: null,
            suggestion: null,
            error: null,
          }
        case 'scan_location':
          return {
            ...state,
            state: 'view_suggestion',
            step: STEP_MAP.view_suggestion,
            scannedLocation: null,
            error: null,
          }
        case 'confirm':
          return {
            ...state,
            state: 'scan_location',
            step: STEP_MAP.scan_location,
            error: null,
          }
        default:
          return state
      }

    case 'RESET':
      return initialState

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      }

    default:
      return state
  }
}

interface ScannerPutawayWizardProps {
  onComplete?: () => void
  isLoading?: boolean
  error?: string | null
}

export function ScannerPutawayWizard({ onComplete, isLoading, error: propError }: ScannerPutawayWizardProps) {
  const router = useRouter()
  const [state, dispatch] = useReducer(putawayReducer, initialState)

  // Handle LP scan and suggestion fetch
  const handleLPScanned = useCallback(async (lp: LPDetails, suggestion: LocationSuggestionData) => {
    dispatch({ type: 'SET_LP', payload: { lp, suggestion } })
  }, [])

  // Handle LP scan error
  const handleLPError = useCallback((code: string, message: string) => {
    AudioFeedback.playError()
    HapticFeedback.error()
    dispatch({ type: 'SET_LP_ERROR', payload: { code, message } })
  }, [])

  // Handle proceed to scan location
  const handleProceedToScanLocation = useCallback(() => {
    dispatch({ type: 'PROCEED_TO_SCAN_LOCATION' })
  }, [])

  // Handle location scan
  const handleLocationScanned = useCallback((scannedLocation: ScannedLocation) => {
    dispatch({ type: 'SET_SCANNED_LOCATION', payload: scannedLocation })
    if (scannedLocation.matches) {
      AudioFeedback.playSuccess()
      HapticFeedback.success()
      // Auto-proceed to confirm
      dispatch({ type: 'PROCEED_TO_CONFIRM' })
    }
  }, [])

  // Handle location error
  const handleLocationError = useCallback((code: string, message: string) => {
    AudioFeedback.playError()
    HapticFeedback.error()
    dispatch({ type: 'SET_LOCATION_ERROR', payload: { code, message } })
  }, [])

  // Handle override
  const handleOverride = useCallback(() => {
    AudioFeedback.playSuccess()
    dispatch({ type: 'SET_OVERRIDE', payload: true })
    dispatch({ type: 'PROCEED_TO_CONFIRM' })
  }, [])

  // Handle go back to suggested location
  const handleUseSuggested = useCallback(() => {
    dispatch({ type: 'SET_SCANNED_LOCATION', payload: { location_code: '', matches: false } })
  }, [])

  // Handle confirm putaway
  const handleConfirm = useCallback(async () => {
    dispatch({ type: 'SUBMIT_PUTAWAY' })

    try {
      const locationId = state.override
        ? state.scannedLocation?.id
        : state.suggestion?.suggestedLocation?.id

      const response = await fetch('/api/warehouse/scanner/putaway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lp_id: state.lpDetails?.id,
          location_id: locationId,
          suggested_location_id: state.suggestion?.suggestedLocation?.id,
          override: state.override,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process putaway')
      }

      AudioFeedback.playConfirm()
      HapticFeedback.confirm()

      dispatch({
        type: 'PUTAWAY_SUCCESS',
        payload: {
          stockMove: data.stock_move,
          lp: data.lp,
          overrideApplied: state.override,
        },
      })
    } catch (err) {
      AudioFeedback.playError()
      HapticFeedback.error()
      dispatch({
        type: 'PUTAWAY_ERROR',
        payload: {
          code: 'PUTAWAY_FAILED',
          message: err instanceof Error ? err.message : 'Failed to process putaway',
        },
      })
    }
  }, [state.lpDetails, state.suggestion, state.scannedLocation, state.override])

  // Handle edit from confirm step
  const handleEdit = useCallback(() => {
    dispatch({ type: 'GO_BACK' })
  }, [])

  // Handle putaway another LP
  const handlePutawayAnother = useCallback(() => {
    dispatch({ type: 'PUTAWAY_ANOTHER' })
  }, [])

  // Handle done
  const handleDone = useCallback(() => {
    if (onComplete) {
      onComplete()
    } else {
      router.push('/warehouse/inventory')
    }
  }, [onComplete, router])

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (state.state === 'scan_lp') {
      router.back()
    } else {
      dispatch({ type: 'GO_BACK' })
    }
  }, [state.state, router])

  // Handle retry
  const handleRetry = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  // Build form data for confirm step
  const formData = {
    lp: state.lpDetails,
    fromLocation: state.lpDetails?.current_location || '',
    toLocation: state.override ? state.scannedLocation : (state.suggestion?.suggestedLocation || null),
    override: state.override,
  }

  // Combined error from props or state
  const displayError = propError || state.error?.message

  // Render loading overlay
  if (isLoading || state.isSubmitting) {
    return (
      <div data-testid="scanner-putaway-wizard" className="h-screen min-h-screen flex flex-col bg-white">
        <ScannerHeader title="Putaway" onBack={handleBack} />
        <StepProgress currentStep={state.step} totalSteps={3} stepLabels={STEP_LABELS} />
        <LoadingOverlay show message={state.isSubmitting ? 'Processing putaway...' : 'Loading...'} />
      </div>
    )
  }

  // Render error state with retry
  if (displayError) {
    return (
      <div data-testid="scanner-putaway-wizard" className="h-screen min-h-screen flex flex-col bg-white">
        <ScannerHeader title="Putaway" onBack={handleBack} />
        <StepProgress currentStep={state.step} totalSteps={3} stepLabels={STEP_LABELS} />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <ErrorAnimation show message={displayError} />
          <Button
            onClick={handleRetry}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium min-h-[48px]"
            aria-label="retry"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div data-testid="scanner-putaway-wizard" className="h-screen min-h-screen flex flex-col bg-white">
      <ScannerHeader
        title={state.lpDetails ? state.lpDetails.lp_number : 'Putaway'}
        onBack={state.state !== 'success' ? handleBack : undefined}
        showHelp={state.state !== 'success'}
      />
      {state.state !== 'success' && (
        <StepProgress currentStep={state.step} totalSteps={3} stepLabels={STEP_LABELS} />
      )}

      {state.state === 'scan_lp' && (
        <Step1ScanLP
          onLPScanned={handleLPScanned}
          lpDetails={state.lpDetails}
          error={state.error?.message}
          isLoading={false}
        />
      )}

      {state.state === 'view_suggestion' && state.suggestion && (
        <Step2ViewSuggestion
          suggestion={state.suggestion}
          onNext={handleProceedToScanLocation}
        />
      )}

      {state.state === 'scan_location' && state.suggestion && (
        <Step3ScanLocation
          suggestedLocation={state.suggestion.suggestedLocation}
          scannedLocation={state.scannedLocation}
          onLocationScanned={handleLocationScanned}
          onOverride={handleOverride}
          error={state.error?.message}
        />
      )}

      {state.state === 'confirm' && state.lpDetails && (
        <Step4Confirm
          formData={formData}
          onConfirm={handleConfirm}
          onEdit={handleEdit}
          isLoading={state.isSubmitting}
        />
      )}

      {state.state === 'success' && state.result && (
        <Step5Success
          result={state.result}
          onPutawayAnother={handlePutawayAnother}
          onDone={handleDone}
        />
      )}
    </div>
  )
}

export default ScannerPutawayWizard
