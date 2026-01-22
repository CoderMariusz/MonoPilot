/**
 * Scanner Pack Wizard Component (Story 07.12)
 * Main container for mobile packing workflow
 *
 * 6-step wizard:
 * - Step 1: Select Shipment
 * - Step 2: Box Management
 * - Step 3: Scan Item (LP)
 * - Step 4: Quantity Entry
 * - Step 5: Close Box
 * - Step 6: Complete
 *
 * States: loading, error, empty, success
 */

'use client'

import { useReducer, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Settings, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StepProgress } from '../../shared/StepProgress'
import { LoadingOverlay } from '../../shared/LoadingOverlay'
import { ErrorAnimation } from '../../shared/ErrorAnimation'
import { AudioFeedback } from '../../shared/AudioFeedback'
import { HapticFeedback } from '../../shared/HapticFeedback'
import { Step1SelectShipment } from './Step1SelectShipment'
import { Step2BoxManagement } from './Step2BoxManagement'
import { Step3ScanItem } from './Step3ScanItem'
import { Step4QuantityEntry } from './Step4QuantityEntry'
import { Step5CloseBox } from './Step5CloseBox'
import { Step6Complete } from './Step6Complete'
import { AllergenWarningBanner } from './AllergenWarningBanner'
import type {
  PendingShipment,
  ShipmentBox,
  LPLookupResult,
  BoxContent,
} from '@/lib/hooks/use-scanner-pack'

// =============================================================================
// State Types
// =============================================================================

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6

interface PackProgress {
  linesTotal: number
  linesPacked: number
  remaining: number
}

interface WizardState {
  currentStep: WizardStep
  selectedShipment: PendingShipment | null
  boxes: ShipmentBox[]
  activeBoxId: string | null
  currentLP: LPLookupResult | null
  quantity: string
  boxContents: BoxContent[]
  packProgress: PackProgress
  isLoading: boolean
  error: string | null
  allergenWarningVisible: boolean
  allergenAcknowledged: boolean
  totalWeight: number
}

type WizardAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SELECT_SHIPMENT'; payload: PendingShipment }
  | { type: 'SET_BOXES'; payload: ShipmentBox[] }
  | { type: 'ADD_BOX'; payload: ShipmentBox }
  | { type: 'SELECT_BOX'; payload: string }
  | { type: 'SET_LP'; payload: LPLookupResult }
  | { type: 'SET_QUANTITY'; payload: string }
  | { type: 'SET_BOX_CONTENTS'; payload: BoxContent[] }
  | { type: 'ADD_BOX_CONTENT'; payload: BoxContent }
  | { type: 'UPDATE_PROGRESS'; payload: PackProgress }
  | { type: 'SET_STEP'; payload: WizardStep }
  | { type: 'CLOSE_BOX'; payload: ShipmentBox }
  | { type: 'SHOW_ALLERGEN_WARNING'; payload: boolean }
  | { type: 'SET_ALLERGEN_ACKNOWLEDGED'; payload: boolean }
  | { type: 'SET_TOTAL_WEIGHT'; payload: number }
  | { type: 'RESET' }
  | { type: 'RESET_LP' }

const initialState: WizardState = {
  currentStep: 1,
  selectedShipment: null,
  boxes: [],
  activeBoxId: null,
  currentLP: null,
  quantity: '',
  boxContents: [],
  packProgress: { linesTotal: 0, linesPacked: 0, remaining: 0 },
  isLoading: false,
  error: null,
  allergenWarningVisible: false,
  allergenAcknowledged: false,
  totalWeight: 0,
}

// Helper to create initial state with optional shipmentId loading
function createInitialState(hasShipmentId: boolean): WizardState {
  return {
    ...initialState,
    isLoading: hasShipmentId,
  }
}

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: null }

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }

    case 'SELECT_SHIPMENT':
      return {
        ...state,
        selectedShipment: action.payload,
        currentStep: 2,
        allergenWarningVisible: action.payload.allergenAlert,
        packProgress: {
          linesTotal: action.payload.linesTotal,
          linesPacked: action.payload.linesPacked,
          remaining: action.payload.linesTotal - action.payload.linesPacked,
        },
        isLoading: false,
      }

    case 'SET_BOXES':
      const boxesArray = Array.isArray(action.payload) ? action.payload : []
      const firstOpen = boxesArray.find((b) => b.status === 'open')
      return {
        ...state,
        boxes: boxesArray,
        activeBoxId: firstOpen?.id || boxesArray[0]?.id || null,
      }

    case 'ADD_BOX':
      return {
        ...state,
        boxes: [...state.boxes, action.payload],
        activeBoxId: action.payload.id,
      }

    case 'SELECT_BOX':
      return { ...state, activeBoxId: action.payload }

    case 'SET_LP':
      return {
        ...state,
        currentLP: action.payload,
        quantity: String(action.payload.availableQty),
        currentStep: 4,
      }

    case 'SET_QUANTITY':
      return { ...state, quantity: action.payload }

    case 'SET_BOX_CONTENTS':
      return { ...state, boxContents: action.payload }

    case 'ADD_BOX_CONTENT':
      return {
        ...state,
        boxContents: [...state.boxContents, action.payload],
        currentLP: null,
        quantity: '',
        currentStep: 2,
        packProgress: {
          ...state.packProgress,
          linesPacked: state.packProgress.linesPacked + 1,
          remaining: state.packProgress.remaining - 1,
        },
      }

    case 'UPDATE_PROGRESS':
      return { ...state, packProgress: action.payload }

    case 'SET_STEP':
      return { ...state, currentStep: action.payload }

    case 'CLOSE_BOX':
      return {
        ...state,
        boxes: state.boxes.map((b) =>
          b.id === action.payload.id ? { ...b, status: 'closed' as const } : b
        ),
        totalWeight: state.totalWeight + (action.payload.weight || 0),
      }

    case 'SHOW_ALLERGEN_WARNING':
      return { ...state, allergenWarningVisible: action.payload }

    case 'SET_ALLERGEN_ACKNOWLEDGED':
      return { ...state, allergenAcknowledged: action.payload }

    case 'SET_TOTAL_WEIGHT':
      return { ...state, totalWeight: action.payload }

    case 'RESET_LP':
      return {
        ...state,
        currentLP: null,
        quantity: '',
        currentStep: 3,
        allergenAcknowledged: false,
      }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

// =============================================================================
// Component
// =============================================================================

interface ScannerPackWizardProps {
  shipmentId?: string
  onComplete?: () => void
  onCancel?: () => void
  className?: string
}

const STEP_LABELS = [
  'Select Shipment',
  'Box Management',
  'Scan Item',
  'Enter Quantity',
  'Close Box',
  'Complete',
]

export function ScannerPackWizard({
  shipmentId,
  onComplete,
  onCancel,
  className,
}: ScannerPackWizardProps) {
  const router = useRouter()
  // Use initializer function to set isLoading=true when shipmentId is provided
  // This prevents Step1 from rendering and making its own fetch before our useEffect runs
  const [state, dispatch] = useReducer(
    wizardReducer,
    shipmentId,
    (id) => createInitialState(!!id)
  )

  // If shipmentId provided, start at step 2
  useEffect(() => {
    if (shipmentId) {
      // Load shipment details and boxes
      const loadShipmentAndBoxes = async () => {
        dispatch({ type: 'SET_LOADING', payload: true })
        try {
          // Load shipment
          const response = await fetch(`/api/shipping/scanner/pack/lookup/${shipmentId}`)
          if (!response.ok) {
            throw new Error('Shipment not found')
          }
          const shipmentData = await response.json()
          const shipment = shipmentData.data

          // Load or create boxes
          const boxResponse = await fetch(
            `/api/shipping/scanner/pack/shipments/${shipment.id}/boxes`
          )
          const boxData = await boxResponse.json()
          let boxes = boxData.data || []

          // If no boxes, create first box
          if (boxes.length === 0) {
            const createResponse = await fetch('/api/shipping/scanner/pack/box/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ shipment_id: shipment.id }),
            })
            const createData = await createResponse.json()
            boxes = [createData.data]
          }

          dispatch({ type: 'SET_BOXES', payload: boxes })
          dispatch({ type: 'SELECT_SHIPMENT', payload: shipment })
        } catch (err) {
          dispatch({
            type: 'SET_ERROR',
            payload: err instanceof Error ? err.message : 'Failed to load shipment',
          })
        }
      }
      loadShipmentAndBoxes()
    }
  }, [shipmentId])

  // Handle shipment selection (Step 1 -> Step 2)
  const handleSelectShipment = useCallback(async (shipment: PendingShipment) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      // Load or create first box
      const boxResponse = await fetch(
        `/api/shipping/scanner/pack/shipments/${shipment.id}/boxes`
      )
      const boxData = await boxResponse.json()
      let boxes = boxData.data || []

      // If no boxes, create first box
      if (boxes.length === 0) {
        const createResponse = await fetch('/api/shipping/scanner/pack/box/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shipment_id: shipment.id }),
        })
        const createData = await createResponse.json()
        boxes = [createData.data]
      }

      dispatch({ type: 'SET_BOXES', payload: boxes })
      dispatch({ type: 'SELECT_SHIPMENT', payload: shipment })
      AudioFeedback.playSuccess()
      HapticFeedback.success()
    } catch (err) {
      AudioFeedback.playError()
      HapticFeedback.error()
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Failed to load shipment',
      })
    }
  }, [])

  // Handle create new box (Step 2)
  const handleCreateBox = useCallback(async () => {
    if (!state.selectedShipment) return

    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const response = await fetch('/api/shipping/scanner/pack/box/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipment_id: state.selectedShipment.id }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to create box')
      }

      const data = await response.json()
      dispatch({ type: 'ADD_BOX', payload: data.data })
      AudioFeedback.playSuccess()
      HapticFeedback.success()
    } catch (err) {
      AudioFeedback.playError()
      HapticFeedback.error()
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Failed to create box',
      })
    }
  }, [state.selectedShipment])

  // Handle select box (Step 2)
  const handleSelectBox = useCallback((boxId: string) => {
    dispatch({ type: 'SELECT_BOX', payload: boxId })
  }, [])

  // Handle proceed to scan (Step 2 -> Step 3)
  const handleProceedToScan = useCallback(() => {
    dispatch({ type: 'SET_STEP', payload: 3 })
  }, [])

  // Handle LP scanned (Step 3 -> Step 4)
  const handleItemScanned = useCallback(
    async (lpData: LPLookupResult) => {
      // Check for allergen conflict
      if (
        state.selectedShipment?.allergenAlert &&
        lpData.allergens &&
        lpData.allergens.length > 0
      ) {
        dispatch({ type: 'SHOW_ALLERGEN_WARNING', payload: true })
      }

      dispatch({ type: 'SET_LP', payload: lpData })
      AudioFeedback.playSuccess()
      HapticFeedback.success()
    },
    [state.selectedShipment]
  )

  // Handle quantity confirmation (Step 4 -> Step 2)
  const handleConfirmQuantity = useCallback(
    async (qty: number) => {
      if (!state.currentLP || !state.activeBoxId || !state.selectedShipment) return

      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        const response = await fetch('/api/shipping/scanner/pack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shipment_id: state.selectedShipment.id,
            box_id: state.activeBoxId,
            license_plate_id: state.currentLP.id,
            so_line_id: state.currentLP.soLineId,
            quantity: qty,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error?.message || 'Failed to add item')
        }

        const data = await response.json()

        // Add content to local state
        const newContent: BoxContent = {
          id: data.data.boxContent.id,
          boxId: state.activeBoxId,
          licensePlateId: state.currentLP.id,
          soLineId: state.currentLP.soLineId || '',
          productId: state.currentLP.productId,
          productName: state.currentLP.productName,
          quantity: qty,
          lotNumber: state.currentLP.lotNumber,
          lpNumber: state.currentLP.lpNumber,
          uom: state.currentLP.uom,
        }

        dispatch({ type: 'ADD_BOX_CONTENT', payload: newContent })
        AudioFeedback.playConfirm()
        HapticFeedback.confirm()
      } catch (err) {
        AudioFeedback.playError()
        HapticFeedback.error()
        dispatch({
          type: 'SET_ERROR',
          payload: err instanceof Error ? err.message : 'Failed to add item',
        })
      }
    },
    [state.currentLP, state.activeBoxId, state.selectedShipment]
  )

  // Handle close box (Step 5)
  const handleCloseBox = useCallback(
    async (weight?: number, dimensions?: { length: number; width: number; height: number }) => {
      if (!state.activeBoxId) return

      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        const response = await fetch('/api/shipping/scanner/pack/box/close', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            box_id: state.activeBoxId,
            weight,
            ...dimensions,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error?.message || 'Failed to close box')
        }

        const data = await response.json()
        dispatch({ type: 'CLOSE_BOX', payload: data.data })
        AudioFeedback.playConfirm()
        HapticFeedback.confirm()

        // Check if all items packed
        if (state.packProgress.remaining <= 0) {
          dispatch({ type: 'SET_STEP', payload: 6 })
        } else {
          // Create new box and go back to step 2
          const createResponse = await fetch('/api/shipping/scanner/pack/box/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shipment_id: state.selectedShipment?.id }),
          })
          const createData = await createResponse.json()
          dispatch({ type: 'ADD_BOX', payload: createData.data })
          dispatch({ type: 'SET_STEP', payload: 2 })
        }
      } catch (err) {
        AudioFeedback.playError()
        HapticFeedback.error()
        dispatch({
          type: 'SET_ERROR',
          payload: err instanceof Error ? err.message : 'Failed to close box',
        })
      }
    },
    [state.activeBoxId, state.packProgress.remaining, state.selectedShipment]
  )

  // Handle completion
  const handleDone = useCallback(() => {
    if (onComplete) {
      onComplete()
    } else {
      router.push('/scanner')
    }
  }, [onComplete, router])

  // Handle new order
  const handleNewOrder = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel()
    } else {
      router.back()
    }
  }, [onCancel, router])

  // Handle back navigation
  const handleBack = useCallback(() => {
    switch (state.currentStep) {
      case 2:
        dispatch({ type: 'RESET' })
        break
      case 3:
        dispatch({ type: 'SET_STEP', payload: 2 })
        break
      case 4:
        dispatch({ type: 'RESET_LP' })
        break
      case 5:
        dispatch({ type: 'SET_STEP', payload: 2 })
        break
      default:
        handleCancel()
    }
  }, [state.currentStep, handleCancel])

  // Get active box
  const activeBox = state.boxes.find((b) => b.id === state.activeBoxId)
  const boxContentsForActiveBox = state.boxContents.filter(
    (c) => c.boxId === state.activeBoxId
  )

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div
      data-testid="scanner-pack-wizard"
      className={cn(
        'min-h-screen flex flex-col bg-slate-50',
        className
      )}
    >
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between safe-area-top">
        <div className="flex items-center gap-3">
          {state.currentStep !== 6 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-12 w-12 min-h-[48px] min-w-[48px]"
              aria-label="back"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          )}
          <h1 className="text-lg font-semibold text-gray-900">Pack Shipment</h1>
        </div>
      </header>

      {/* Step Progress */}
      <StepProgress
        data-testid="step-progress"
        currentStep={state.currentStep}
        totalSteps={6}
        stepLabels={STEP_LABELS}
      />

      {/* Allergen Banner (persistent across steps) */}
      {state.allergenWarningVisible && state.selectedShipment && (
        <AllergenWarningBanner
          restrictions={state.selectedShipment.allergenRestrictions || []}
          visible={true}
          productAllergens={state.currentLP?.allergens || []}
          onAcknowledge={() => dispatch({ type: 'SET_ALLERGEN_ACKNOWLEDGED', payload: true })}
          acknowledged={state.allergenAcknowledged}
        />
      )}

      {/* Loading overlay */}
      {state.isLoading && (
        <LoadingOverlay show message="Loading..." />
      )}

      {/* Error state */}
      {state.error && (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <ErrorAnimation show message={state.error} />
          <Button
            onClick={() => dispatch({ type: 'SET_ERROR', payload: null })}
            className="mt-4 min-h-[48px]"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Main content */}
      {!state.isLoading && !state.error && (
        <main className="flex-1 overflow-y-auto">
          {/* Step 1: Select Shipment */}
          {state.currentStep === 1 && (
            <div data-testid="step1-select-shipment">
              <Step1SelectShipment
                onSelect={handleSelectShipment}
                onCancel={handleCancel}
              />
            </div>
          )}

          {/* Step 2: Box Management */}
          {state.currentStep === 2 && state.selectedShipment && (
            <div data-testid="step2-box-management">
              <Step2BoxManagement
                shipment={state.selectedShipment}
                boxes={state.boxes}
                activeBoxId={state.activeBoxId}
                boxContents={boxContentsForActiveBox}
                packProgress={state.packProgress}
                onCreateBox={handleCreateBox}
                onSelectBox={handleSelectBox}
                onProceed={handleProceedToScan}
                onCloseBox={() => dispatch({ type: 'SET_STEP', payload: 5 })}
              />
            </div>
          )}

          {/* Step 3: Scan Item */}
          {state.currentStep === 3 && state.selectedShipment && activeBox && (
            <div data-testid="step3-scan-item">
              <Step3ScanItem
                box={activeBox}
                shipment={state.selectedShipment}
                onItemScanned={handleItemScanned}
                onCancel={() => dispatch({ type: 'SET_STEP', payload: 2 })}
              />
            </div>
          )}

          {/* Step 4: Quantity Entry */}
          {state.currentStep === 4 && state.currentLP && (
            <div data-testid="step4-quantity-entry">
              <Step4QuantityEntry
                lp={state.currentLP}
                availableQty={state.currentLP.availableQty}
                defaultQty={state.currentLP.availableQty}
                allergenWarning={state.allergenWarningVisible && !state.allergenAcknowledged}
                onConfirm={handleConfirmQuantity}
                onCancel={() => dispatch({ type: 'RESET_LP' })}
              />
            </div>
          )}

          {/* Step 5: Close Box */}
          {state.currentStep === 5 && activeBox && (
            <div data-testid="step5-close-box">
              <Step5CloseBox
                box={activeBox}
                contents={boxContentsForActiveBox}
                boxNumber={activeBox.boxNumber}
                onClose={handleCloseBox}
                onCreateNext={() => {
                  handleCreateBox()
                  dispatch({ type: 'SET_STEP', payload: 2 })
                }}
                onCancel={() => dispatch({ type: 'SET_STEP', payload: 2 })}
              />
            </div>
          )}

          {/* Step 6: Complete */}
          {state.currentStep === 6 && state.selectedShipment && (
            <div data-testid="step6-complete">
              <Step6Complete
                shipment={state.selectedShipment}
                totalBoxes={state.boxes.filter((b) => b.status === 'closed').length}
                totalWeight={state.totalWeight}
                onDone={handleDone}
                onNewOrder={handleNewOrder}
              />
            </div>
          )}
        </main>
      )}
    </div>
  )
}

export default ScannerPackWizard
