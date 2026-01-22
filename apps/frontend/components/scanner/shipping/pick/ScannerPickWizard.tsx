/**
 * Scanner Pick Wizard Component (Story 07.10)
 * Main container for mobile pick workflow
 *
 * States:
 * - pickList: Show list of assigned picks
 * - picking: Active picking workflow
 * - completion: Pick list complete celebration
 * - settings: Settings modal
 */

'use client'

import { useReducer, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScannerHeader } from '../../shared/ScannerHeader'
import { LoadingOverlay } from '../../shared/LoadingOverlay'
import { ErrorAnimation } from '../../shared/ErrorAnimation'
import { AudioFeedback } from '../../shared/AudioFeedback'
import { HapticFeedback } from '../../shared/HapticFeedback'
import { MyPicksList } from './MyPicksList'
import { PickLineCard } from './PickLineCard'
import { ScanInput } from './ScanInput'
import { NumberPad } from '../../shared/NumberPad'
import { ShortPickModal } from './ShortPickModal'
import { AllergenBanner } from './AllergenBanner'
import { FifoWarning } from './FifoWarning'
import { PickComplete } from './PickComplete'
import { ScannerSettings } from './ScannerSettings'
import type {
  PickListSummary,
  PickLineDetail,
  PickListDetail,
  PickProgress,
  ScannerSettings as ScannerSettingsType,
  ShortPickData,
  PickCompleteSummary,
} from '@/lib/types/scanner-pick'

// =============================================================================
// State Types
// =============================================================================

type WizardView = 'pickList' | 'picking' | 'completion' | 'settings'

interface WizardState {
  view: WizardView
  pickLists: PickListSummary[]
  selectedPickListId: string | null
  pickListDetail: PickListDetail | null
  currentLineIndex: number
  progress: PickProgress
  scannedBarcode: string | null
  quantity: string
  isLoading: boolean
  error: string | null
  showShortPickModal: boolean
  showFifoWarning: boolean
  allergenAcknowledged: boolean
  startTime: number | null
  settings: ScannerSettingsType
}

type WizardAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PICK_LISTS'; payload: PickListSummary[] }
  | { type: 'SELECT_PICK_LIST'; payload: string }
  | { type: 'SET_PICK_LIST_DETAIL'; payload: PickListDetail }
  | { type: 'SET_SCANNED_BARCODE'; payload: string }
  | { type: 'SET_QUANTITY'; payload: string }
  | { type: 'ADVANCE_TO_NEXT_LINE' }
  | { type: 'COMPLETE_PICK_LIST' }
  | { type: 'SHOW_SHORT_PICK_MODAL'; payload: boolean }
  | { type: 'SHOW_FIFO_WARNING'; payload: boolean }
  | { type: 'SET_ALLERGEN_ACKNOWLEDGED'; payload: boolean }
  | { type: 'OPEN_SETTINGS' }
  | { type: 'CLOSE_SETTINGS' }
  | { type: 'UPDATE_SETTINGS'; payload: ScannerSettingsType }
  | { type: 'RETURN_TO_MY_PICKS' }
  | { type: 'RESET' }

const DEFAULT_SETTINGS: ScannerSettingsType = {
  audio_volume: 70,
  audio_muted: false,
  vibration_enabled: true,
  high_contrast: false,
  large_text: false,
  camera_enabled: false,
}

const initialState: WizardState = {
  view: 'pickList',
  pickLists: [],
  selectedPickListId: null,
  pickListDetail: null,
  currentLineIndex: 0,
  progress: { total_lines: 0, picked_lines: 0, short_lines: 0 },
  scannedBarcode: null,
  quantity: '',
  isLoading: false,
  error: null,
  showShortPickModal: false,
  showFifoWarning: false,
  allergenAcknowledged: false,
  startTime: null,
  settings: DEFAULT_SETTINGS,
}

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: null }

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }

    case 'SET_PICK_LISTS':
      return { ...state, pickLists: action.payload, isLoading: false }

    case 'SELECT_PICK_LIST':
      return {
        ...state,
        selectedPickListId: action.payload,
        isLoading: true,
        startTime: Date.now(),
      }

    case 'SET_PICK_LIST_DETAIL':
      const detail = action.payload
      const pendingLines = detail.lines.filter((l) => l.status === 'pending')
      return {
        ...state,
        view: 'picking',
        pickListDetail: detail,
        currentLineIndex: 0,
        progress: {
          total_lines: detail.lines.length,
          picked_lines: detail.lines.filter((l) => l.status === 'picked').length,
          short_lines: detail.lines.filter((l) => l.status === 'short').length,
        },
        quantity: pendingLines[0]?.quantity_to_pick.toString() || '',
        isLoading: false,
      }

    case 'SET_SCANNED_BARCODE':
      return { ...state, scannedBarcode: action.payload }

    case 'SET_QUANTITY':
      return { ...state, quantity: action.payload }

    case 'ADVANCE_TO_NEXT_LINE':
      const nextIndex = state.currentLineIndex + 1
      const lines = state.pickListDetail?.lines || []
      const nextPending = lines.slice(nextIndex).find((l) => l.status === 'pending')

      if (!nextPending) {
        // All lines complete
        return {
          ...state,
          view: 'completion',
          scannedBarcode: null,
          quantity: '',
        }
      }

      return {
        ...state,
        currentLineIndex: lines.indexOf(nextPending),
        scannedBarcode: null,
        quantity: nextPending.quantity_to_pick.toString(),
        progress: {
          ...state.progress,
          picked_lines: state.progress.picked_lines + 1,
        },
        allergenAcknowledged: false,
      }

    case 'COMPLETE_PICK_LIST':
      return {
        ...state,
        view: 'completion',
        scannedBarcode: null,
        quantity: '',
      }

    case 'SHOW_SHORT_PICK_MODAL':
      return { ...state, showShortPickModal: action.payload }

    case 'SHOW_FIFO_WARNING':
      return { ...state, showFifoWarning: action.payload }

    case 'SET_ALLERGEN_ACKNOWLEDGED':
      return { ...state, allergenAcknowledged: action.payload }

    case 'OPEN_SETTINGS':
      return { ...state, view: 'settings' }

    case 'CLOSE_SETTINGS':
      return {
        ...state,
        view: state.pickListDetail ? 'picking' : 'pickList',
      }

    case 'UPDATE_SETTINGS':
      return { ...state, settings: action.payload }

    case 'RETURN_TO_MY_PICKS':
      return {
        ...initialState,
        settings: state.settings,
      }

    case 'RESET':
      return { ...initialState, settings: state.settings }

    default:
      return state
  }
}

// =============================================================================
// Component
// =============================================================================

interface ScannerPickWizardProps {
  className?: string
}

export function ScannerPickWizard({ className }: ScannerPickWizardProps) {
  const router = useRouter()
  const [state, dispatch] = useReducer(wizardReducer, initialState)

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('scanner-settings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        dispatch({ type: 'UPDATE_SETTINGS', payload: parsed })
      } catch {
        // Ignore invalid settings
      }
    }
  }, [])

  // Save settings to localStorage
  const handleUpdateSettings = useCallback((settings: ScannerSettingsType) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings })
    localStorage.setItem('scanner-settings', JSON.stringify(settings))
  }, [])

  // Load my picks on mount
  useEffect(() => {
    const loadMyPicks = async () => {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        const response = await fetch('/api/shipping/pick-lists/my-picks')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to load picks')
        }

        dispatch({ type: 'SET_PICK_LISTS', payload: data.pick_lists || [] })
      } catch (err) {
        dispatch({
          type: 'SET_ERROR',
          payload: err instanceof Error ? err.message : 'Failed to load picks',
        })
      }
    }

    loadMyPicks()
  }, [])

  // Select pick list handler
  const handleSelectPickList = useCallback(async (pickListId: string) => {
    dispatch({ type: 'SELECT_PICK_LIST', payload: pickListId })

    try {
      // Start pick list
      await fetch(`/api/shipping/pick-lists/${pickListId}/start`, {
        method: 'POST',
      })

      // Get pick list detail
      const response = await fetch(`/api/shipping/pick-lists/${pickListId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to load pick list')
      }

      AudioFeedback.playSuccess()
      HapticFeedback.success()
      dispatch({ type: 'SET_PICK_LIST_DETAIL', payload: data.pick_list })
    } catch (err) {
      AudioFeedback.playError()
      HapticFeedback.error()
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Failed to load pick list',
      })
    }
  }, [])

  // Handle scan input
  const handleScan = useCallback(
    async (barcode: string) => {
      dispatch({ type: 'SET_SCANNED_BARCODE', payload: barcode })
      AudioFeedback.playSuccess()
      HapticFeedback.success()
    },
    []
  )

  // Handle confirm pick
  const handleConfirmPick = useCallback(async () => {
    const currentLine = state.pickListDetail?.lines[state.currentLineIndex]
    if (!currentLine || !state.scannedBarcode) return

    const qty = parseInt(state.quantity, 10)
    if (isNaN(qty) || qty <= 0) {
      dispatch({ type: 'SET_ERROR', payload: 'Invalid quantity' })
      return
    }

    // Check for short pick
    if (qty < currentLine.quantity_to_pick) {
      dispatch({ type: 'SHOW_SHORT_PICK_MODAL', payload: true })
      return
    }

    dispatch({ type: 'SET_LOADING', payload: true })

    try {
      const response = await fetch(
        `/api/shipping/pick-lists/${state.selectedPickListId}/lines/${currentLine.id}/pick`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scanned_lp_barcode: state.scannedBarcode,
            quantity_picked: qty,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to confirm pick')
      }

      AudioFeedback.playSuccess()
      HapticFeedback.success()

      if (data.pick_list_complete) {
        dispatch({ type: 'COMPLETE_PICK_LIST' })
      } else {
        dispatch({ type: 'ADVANCE_TO_NEXT_LINE' })
      }
    } catch (err) {
      AudioFeedback.playError()
      HapticFeedback.error()
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Failed to confirm pick',
      })
    }
  }, [state.pickListDetail, state.currentLineIndex, state.scannedBarcode, state.quantity, state.selectedPickListId])

  // Handle short pick
  const handleShortPick = useCallback(
    async (shortPickData: ShortPickData) => {
      const currentLine = state.pickListDetail?.lines[state.currentLineIndex]
      if (!currentLine || !state.scannedBarcode) return

      dispatch({ type: 'SHOW_SHORT_PICK_MODAL', payload: false })
      dispatch({ type: 'SET_LOADING', payload: true })

      try {
        const response = await fetch(
          `/api/shipping/pick-lists/${state.selectedPickListId}/lines/${currentLine.id}/short-pick`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scanned_lp_barcode: state.scannedBarcode,
              quantity_picked: shortPickData.quantity,
              short_pick_reason: shortPickData.reason,
              short_pick_notes: shortPickData.notes,
            }),
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to record short pick')
        }

        AudioFeedback.playWarning()
        HapticFeedback.warning()

        if (data.pick_list_complete) {
          dispatch({ type: 'COMPLETE_PICK_LIST' })
        } else {
          dispatch({ type: 'ADVANCE_TO_NEXT_LINE' })
        }
      } catch (err) {
        AudioFeedback.playError()
        HapticFeedback.error()
        dispatch({
          type: 'SET_ERROR',
          payload: err instanceof Error ? err.message : 'Failed to record short pick',
        })
      }
    },
    [state.pickListDetail, state.currentLineIndex, state.scannedBarcode, state.selectedPickListId]
  )

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (state.view === 'picking') {
      dispatch({ type: 'RETURN_TO_MY_PICKS' })
    } else if (state.view === 'settings') {
      dispatch({ type: 'CLOSE_SETTINGS' })
    } else {
      router.back()
    }
  }, [state.view, router])

  // Calculate completion summary
  const completionSummary: PickCompleteSummary = {
    total_lines: state.progress.total_lines,
    picked_lines: state.progress.picked_lines,
    short_picks: state.progress.short_lines,
    total_qty: state.pickListDetail?.lines.reduce(
      (sum, l) => sum + (l.quantity_picked || 0),
      0
    ) || 0,
    duration_minutes: state.startTime
      ? Math.round((Date.now() - state.startTime) / 60000)
      : 0,
  }

  // Get current pick line
  const currentLine = state.pickListDetail?.lines[state.currentLineIndex]

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div
      data-testid="scanner-pick-wizard"
      className={cn(
        'min-h-screen flex flex-col bg-slate-50',
        className
      )}
    >
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between safe-area-top">
        <div className="flex items-center gap-3">
          {state.view !== 'completion' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-12 w-12 min-h-[48px] min-w-[48px]"
              aria-label="back"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
          )}
          <h1 className="text-lg font-semibold text-gray-900">
            {state.view === 'pickList' ? 'My Picks' : 'Scanner Pick'}
          </h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => dispatch({ type: 'OPEN_SETTINGS' })}
          className="h-12 w-12 min-h-[48px] min-w-[48px]"
          aria-label="Settings"
        >
          <Settings className="h-6 w-6" />
        </Button>
      </header>

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
        <main className="flex-1 p-4 overflow-y-auto">
          {/* My Picks List View */}
          {state.view === 'pickList' && (
            <MyPicksList
              pick_lists={state.pickLists}
              onSelectPickList={handleSelectPickList}
              isLoading={false}
            />
          )}

          {/* Picking View */}
          {state.view === 'picking' && currentLine && (
            <div className="flex flex-col gap-4">
              {/* Pick line card */}
              <PickLineCard
                pickLine={currentLine}
                progress={state.progress}
              />

              {/* Allergen banner */}
              {currentLine.allergens && currentLine.allergens.length > 0 && (
                <AllergenBanner
                  allergens={currentLine.allergens}
                  customer_restrictions={[]} // Would come from SO
                  onAcknowledge={() => dispatch({ type: 'SET_ALLERGEN_ACKNOWLEDGED', payload: true })}
                  acknowledged={state.allergenAcknowledged}
                />
              )}

              {/* Scan input */}
              <ScanInput
                onScan={handleScan}
                placeholder="Scan LP Barcode"
                autoFocus
              />

              {/* Number pad for quantity */}
              {state.scannedBarcode && (
                <>
                  <div className="text-center text-sm text-gray-500">
                    Scanned: {state.scannedBarcode}
                  </div>
                  <NumberPad
                    value={state.quantity}
                    onChange={(v) => dispatch({ type: 'SET_QUANTITY', payload: v })}
                    maxValue={currentLine.quantity_to_pick}
                    allowDecimal={false}
                  />
                  <Button
                    onClick={handleConfirmPick}
                    disabled={!state.quantity || parseInt(state.quantity, 10) <= 0}
                    className="w-full h-14 min-h-[56px] text-lg font-semibold bg-green-600 hover:bg-green-700"
                  >
                    Confirm Pick
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Completion View */}
          {state.view === 'completion' && state.pickListDetail && (
            <PickComplete
              pick_list={state.pickListDetail}
              summary={completionSummary}
              onReturnToHome={() => dispatch({ type: 'RETURN_TO_MY_PICKS' })}
            />
          )}
        </main>
      )}

      {/* Short Pick Modal */}
      {state.showShortPickModal && currentLine && (
        <ShortPickModal
          quantity_to_pick={currentLine.quantity_to_pick}
          quantity_available={parseInt(state.quantity, 10) || 0}
          onConfirm={handleShortPick}
          onCancel={() => dispatch({ type: 'SHOW_SHORT_PICK_MODAL', payload: false })}
        />
      )}

      {/* Settings Modal */}
      {state.view === 'settings' && (
        <ScannerSettings
          onClose={() => dispatch({ type: 'CLOSE_SETTINGS' })}
          currentSettings={state.settings}
          onUpdate={handleUpdateSettings}
        />
      )}
    </div>
  )
}

export default ScannerPickWizard
