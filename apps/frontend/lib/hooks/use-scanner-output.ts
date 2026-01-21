/**
 * useScannerOutput Hook
 * Story 04.7b: Output Registration Scanner
 *
 * 7-step wizard state management for scanner output registration:
 * 1. scan_wo - Scan work order barcode
 * 2. enter_qty - Enter quantity with number pad
 * 3. select_qa - Select QA status
 * 4. review - Review before confirmation
 * 5. lp_created - Success confirmation
 * 6. print_label - Print LP label
 * 7. by_products - By-product registration
 */

'use client'

import { useReducer, useCallback, useEffect, useRef } from 'react'
import type { WOValidationResult, ByProductInfo } from '@/lib/services/scanner-output-service'

// ============================================================================
// Types
// ============================================================================

export type WizardState =
  | 'scan_wo'
  | 'enter_qty'
  | 'select_qa'
  | 'review'
  | 'lp_created'
  | 'print_label'
  | 'by_products'
  | 'complete'

export type QAStatus = 'approved' | 'pending' | 'rejected'

export interface WOData {
  id: string
  wo_number: string
  product_name: string
  product_code?: string
  planned_qty: number
  registered_qty: number
  remaining_qty: number
  progress_percent?: number
  uom: string
  batch_number: string
  shelf_life_days: number
  by_products?: ByProductInfo[]
}

export interface LPData {
  id: string
  lp_number: string
  qty: number
  uom: string
  batch_number: string
  qa_status: string
  expiry_date: string
}

export interface WOProgress {
  output_qty: number
  progress_percent: number
  remaining_qty: number
}

export interface ReviewData {
  product_name: string
  quantity: number
  qa_status: QAStatus
  batch_number: string
  expiry_date: string
  location_name?: string
  lp_preview: string
}

export interface OverproductionWarning {
  excess: number
  remaining: number
  entered: number
}

export interface WizardError {
  code: string
  message: string
}

interface UseScannerOutputOptions {
  settings?: {
    require_qa_on_output?: boolean
  }
  printerStatus?: {
    configured: boolean
  }
}

// ============================================================================
// State
// ============================================================================

interface ScannerOutputState {
  state: WizardState
  step: number
  totalSteps: number
  woData: WOData | null
  quantity: number | null
  qaStatus: QAStatus | null
  lpData: LPData | null
  byProducts: ByProductInfo[]
  currentByProduct: (ByProductInfo & { expected_qty: number }) | null
  byProductIndex: number
  byProductQuantity: number | null
  isSubmitting: boolean
  error: WizardError | null
  overproductionWarning: OverproductionWarning | null
  reviewData: ReviewData | null
  woProgress: WOProgress | null
  canPrint: boolean
  printDisabledReason: string | null
  printStatus: 'idle' | 'printing' | 'success' | 'error' | null
  printMessage: string | null
  canRetryPrint: boolean
  zeroQtyWarning: boolean
  zeroQtyMessage: string | null
  offlineSaved: boolean
  offlineMessage: string | null
  canRetry: boolean
  canSaveOffline: boolean
  completionMessage: string | null
}

// ============================================================================
// Actions
// ============================================================================

type ScannerOutputAction =
  | { type: 'WO_SCANNED'; payload: WOData }
  | { type: 'WO_SCAN_ERROR'; payload: { code: string; message: string } }
  | { type: 'SET_QUANTITY'; payload: number }
  | { type: 'SET_QA_STATUS'; payload: QAStatus }
  | { type: 'PROCEED_TO_QA' }
  | { type: 'PROCEED_TO_REVIEW'; payload: ReviewData }
  | { type: 'SUBMIT_OUTPUT' }
  | { type: 'OUTPUT_SUCCESS'; payload: { lp: LPData; wo_progress: WOProgress } }
  | { type: 'OUTPUT_ERROR'; payload: WizardError }
  | { type: 'ADVANCE_TO_PRINT' }
  | { type: 'SKIP_PRINT' }
  | { type: 'PRINT_SUCCESS' }
  | { type: 'PRINT_ERROR'; payload: string }
  | { type: 'PROCEED_TO_BY_PRODUCTS' }
  | { type: 'SET_BY_PRODUCT_QUANTITY'; payload: number }
  | { type: 'BY_PRODUCT_REGISTERED'; payload: { id: string } }
  | { type: 'BY_PRODUCT_SKIP' }
  | { type: 'BY_PRODUCT_SKIP_ALL' }
  | { type: 'COMPLETE' }
  | { type: 'GO_BACK' }
  | { type: 'RESET' }
  | { type: 'SAVE_OFFLINE' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_OVERPRODUCTION_WARNING'; payload: OverproductionWarning | null }

// ============================================================================
// Reducer
// ============================================================================

const initialState: ScannerOutputState = {
  state: 'scan_wo',
  step: 1,
  totalSteps: 7,
  woData: null,
  quantity: null,
  qaStatus: null,
  lpData: null,
  byProducts: [],
  currentByProduct: null,
  byProductIndex: 0,
  byProductQuantity: null,
  isSubmitting: false,
  error: null,
  overproductionWarning: null,
  reviewData: null,
  woProgress: null,
  canPrint: true,
  printDisabledReason: null,
  printStatus: null,
  printMessage: null,
  canRetryPrint: false,
  zeroQtyWarning: false,
  zeroQtyMessage: null,
  offlineSaved: false,
  offlineMessage: null,
  canRetry: false,
  canSaveOffline: false,
  completionMessage: null,
}

function scannerOutputReducer(
  state: ScannerOutputState,
  action: ScannerOutputAction
): ScannerOutputState {
  switch (action.type) {
    case 'WO_SCANNED':
      return {
        ...state,
        state: 'enter_qty',
        step: 2,
        woData: action.payload,
        byProducts: action.payload.by_products || [],
        error: null,
      }

    case 'WO_SCAN_ERROR':
      return {
        ...state,
        error: { code: action.payload.code, message: action.payload.message },
      }

    case 'SET_QUANTITY':
      if (action.payload === 0) {
        return {
          ...state,
          quantity: action.payload,
          error: { code: 'INVALID_QTY', message: 'Quantity must be greater than 0' },
        }
      }
      return {
        ...state,
        quantity: action.payload,
        error: null,
      }

    case 'SET_OVERPRODUCTION_WARNING':
      return {
        ...state,
        overproductionWarning: action.payload,
      }

    case 'PROCEED_TO_QA':
      return {
        ...state,
        state: 'select_qa',
        step: 3,
        error: null,
      }

    case 'SET_QA_STATUS':
      return {
        ...state,
        qaStatus: action.payload,
      }

    case 'PROCEED_TO_REVIEW':
      return {
        ...state,
        state: 'review',
        step: 4,
        reviewData: action.payload,
        error: null,
      }

    case 'SUBMIT_OUTPUT':
      return {
        ...state,
        isSubmitting: true,
        error: null,
      }

    case 'OUTPUT_SUCCESS':
      return {
        ...state,
        state: 'lp_created',
        step: 5,
        isSubmitting: false,
        lpData: action.payload.lp,
        woProgress: action.payload.wo_progress,
        error: null,
      }

    case 'OUTPUT_ERROR': {
      const isNetworkError = action.payload.code === 'NETWORK_ERROR'
      return {
        ...state,
        isSubmitting: false,
        error: action.payload,
        canRetry: isNetworkError,
        canSaveOffline: isNetworkError,
      }
    }

    case 'ADVANCE_TO_PRINT':
      return {
        ...state,
        state: 'print_label',
        step: 6,
      }

    case 'SKIP_PRINT': {
      // If no by-products, go to complete
      if (state.byProducts.length === 0) {
        return {
          ...state,
          state: 'complete',
          step: 7,
          completionMessage: 'Output registration complete',
        }
      }
      // Otherwise go to by-products
      const firstByProduct = state.byProducts[0]
      const plannedQty = state.woData?.planned_qty || 0
      return {
        ...state,
        state: 'by_products',
        step: 7,
        currentByProduct: {
          ...firstByProduct,
          expected_qty: Math.round((plannedQty * firstByProduct.yield_percent) / 100 * 100) / 100,
        },
        byProductIndex: 0,
      }
    }

    case 'PRINT_SUCCESS':
      return {
        ...state,
        printStatus: 'success',
        printMessage: 'Label printed',
      }

    case 'PRINT_ERROR':
      return {
        ...state,
        printStatus: 'error',
        printMessage: action.payload,
        canRetryPrint: true,
      }

    case 'PROCEED_TO_BY_PRODUCTS': {
      if (state.byProducts.length === 0) {
        return {
          ...state,
          state: 'complete',
          step: 7,
          completionMessage: 'Output registration complete',
        }
      }
      const firstByProduct = state.byProducts[0]
      const plannedQty = state.woData?.planned_qty || 0
      return {
        ...state,
        state: 'by_products',
        step: 7,
        currentByProduct: {
          ...firstByProduct,
          expected_qty: Math.round((plannedQty * firstByProduct.yield_percent) / 100 * 100) / 100,
        },
        byProductIndex: 0,
      }
    }

    case 'SET_BY_PRODUCT_QUANTITY':
      return {
        ...state,
        byProductQuantity: action.payload,
        zeroQtyWarning: action.payload === 0,
        zeroQtyMessage: action.payload === 0 ? 'By-product quantity is 0. Continue?' : null,
      }

    case 'BY_PRODUCT_REGISTERED': {
      const nextIndex = state.byProductIndex + 1
      if (nextIndex >= state.byProducts.length) {
        // All by-products done
        return {
          ...state,
          state: 'complete',
          completionMessage: 'All by-products registered',
        }
      }
      // Next by-product
      const nextByProduct = state.byProducts[nextIndex]
      const plannedQty = state.woData?.planned_qty || 0
      return {
        ...state,
        currentByProduct: {
          ...nextByProduct,
          expected_qty: Math.round((plannedQty * nextByProduct.yield_percent) / 100 * 100) / 100,
        },
        byProductIndex: nextIndex,
        byProductQuantity: null,
        zeroQtyWarning: false,
        zeroQtyMessage: null,
      }
    }

    case 'BY_PRODUCT_SKIP': {
      const nextIndex = state.byProductIndex + 1
      if (nextIndex >= state.byProducts.length) {
        return {
          ...state,
          state: 'complete',
          completionMessage: 'Output registration complete',
        }
      }
      const nextByProduct = state.byProducts[nextIndex]
      const plannedQty = state.woData?.planned_qty || 0
      return {
        ...state,
        currentByProduct: {
          ...nextByProduct,
          expected_qty: Math.round((plannedQty * nextByProduct.yield_percent) / 100 * 100) / 100,
        },
        byProductIndex: nextIndex,
        byProductQuantity: null,
        zeroQtyWarning: false,
        zeroQtyMessage: null,
      }
    }

    case 'BY_PRODUCT_SKIP_ALL':
      return {
        ...state,
        state: 'complete',
        completionMessage: 'Output registration complete',
      }

    case 'COMPLETE':
      return {
        ...state,
        state: 'complete',
        completionMessage: 'Output registration complete',
      }

    case 'GO_BACK': {
      const stepMap: Record<WizardState, { state: WizardState; step: number }> = {
        enter_qty: { state: 'scan_wo', step: 1 },
        select_qa: { state: 'enter_qty', step: 2 },
        review: { state: 'select_qa', step: 3 },
        lp_created: { state: 'review', step: 4 },
        print_label: { state: 'lp_created', step: 5 },
        by_products: { state: 'print_label', step: 6 },
        complete: { state: 'by_products', step: 7 },
        scan_wo: { state: 'scan_wo', step: 1 },
      }
      const prev = stepMap[state.state]
      return {
        ...state,
        state: prev.state,
        step: prev.step,
        error: null,
      }
    }

    case 'RESET':
      return { ...initialState }

    case 'SAVE_OFFLINE':
      return {
        ...state,
        offlineSaved: true,
        offlineMessage: 'Saved for later sync',
        error: null,
      }

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      }

    default:
      return state
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useScannerOutput(options: UseScannerOutputOptions = {}) {
  const [state, dispatch] = useReducer(scannerOutputReducer, {
    ...initialState,
    qaStatus: options.settings?.require_qa_on_output === false ? 'pending' : null,
    canPrint: options.printerStatus?.configured ?? true,
    printDisabledReason: options.printerStatus?.configured === false ? 'No printer configured' : null,
  })

  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-advance from lp_created to print_label after 2 seconds
  useEffect(() => {
    if (state.state === 'lp_created') {
      autoAdvanceTimerRef.current = setTimeout(() => {
        dispatch({ type: 'ADVANCE_TO_PRINT' })
      }, 2000)
    }
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current)
      }
    }
  }, [state.state])

  // Voice announcement and vibration on success
  useEffect(() => {
    if (state.state === 'lp_created' && state.lpData) {
      // Voice announcement
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined') {
        try {
          const utterance = new SpeechSynthesisUtterance('LP created')
          window.speechSynthesis.speak(utterance)
        } catch {
          // Silently ignore if SpeechSynthesis is not available
        }
      }
      // Vibration
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(200)
        } catch {
          // Silently ignore if vibration is not available
        }
      }
    }
  }, [state.state, state.lpData])

  // Actions
  const handleWOScan = useCallback((woData: WOData) => {
    dispatch({ type: 'WO_SCANNED', payload: woData })
  }, [])

  const handleWOScanError = useCallback((code: string, message: string) => {
    dispatch({ type: 'WO_SCAN_ERROR', payload: { code, message } })
  }, [])

  const setQuantity = useCallback(
    (qty: number) => {
      dispatch({ type: 'SET_QUANTITY', payload: qty })

      // Check overproduction
      if (state.woData && qty > state.woData.remaining_qty) {
        dispatch({
          type: 'SET_OVERPRODUCTION_WARNING',
          payload: {
            excess: qty - state.woData.remaining_qty,
            remaining: state.woData.remaining_qty,
            entered: qty,
          },
        })
      } else {
        dispatch({ type: 'SET_OVERPRODUCTION_WARNING', payload: null })
      }
    },
    [state.woData]
  )

  const proceedToQA = useCallback(() => {
    dispatch({ type: 'PROCEED_TO_QA' })
  }, [])

  const setQAStatus = useCallback((status: QAStatus) => {
    dispatch({ type: 'SET_QA_STATUS', payload: status })
  }, [])

  const proceedToReview = useCallback(() => {
    if (!state.woData || !state.quantity || !state.qaStatus) return

    // Calculate expiry date
    const today = new Date()
    const shelfLifeDays = state.woData.shelf_life_days || 90
    const expiryDate = new Date(today)
    expiryDate.setDate(expiryDate.getDate() + shelfLifeDays)
    const expiryDateStr = expiryDate.toISOString().split('T')[0]

    // Generate LP preview
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const lpPreview = `LP-${dateStr}-0001`

    const reviewData: ReviewData = {
      product_name: state.woData.product_name,
      quantity: state.quantity,
      qa_status: state.qaStatus,
      batch_number: state.woData.batch_number,
      expiry_date: expiryDateStr,
      lp_preview: lpPreview,
    }

    dispatch({ type: 'PROCEED_TO_REVIEW', payload: reviewData })
  }, [state.woData, state.quantity, state.qaStatus])

  const submitOutput = useCallback(() => {
    dispatch({ type: 'SUBMIT_OUTPUT' })
  }, [])

  const handleOutputSuccess = useCallback(
    (data: { lp: LPData; wo_progress?: WOProgress }) => {
      dispatch({
        type: 'OUTPUT_SUCCESS',
        payload: {
          lp: data.lp,
          wo_progress: data.wo_progress || {
            output_qty: 0,
            progress_percent: 0,
            remaining_qty: 0,
          },
        },
      })
    },
    []
  )

  const handleOutputError = useCallback((error: WizardError) => {
    dispatch({ type: 'OUTPUT_ERROR', payload: error })
  }, [])

  const skipPrint = useCallback(() => {
    dispatch({ type: 'SKIP_PRINT' })
  }, [])

  const handlePrintSuccess = useCallback(() => {
    dispatch({ type: 'PRINT_SUCCESS' })
  }, [])

  const handlePrintError = useCallback((message: string) => {
    dispatch({ type: 'PRINT_ERROR', payload: message })
  }, [])

  const proceedToByProducts = useCallback(() => {
    dispatch({ type: 'PROCEED_TO_BY_PRODUCTS' })
  }, [])

  const setByProductQuantity = useCallback((qty: number) => {
    dispatch({ type: 'SET_BY_PRODUCT_QUANTITY', payload: qty })
  }, [])

  const handleByProductRegistered = useCallback((data: { id: string }) => {
    dispatch({ type: 'BY_PRODUCT_REGISTERED', payload: data })
  }, [])

  const handleByProductYes = useCallback(() => {
    // Go to by-product registration mini-wizard
    dispatch({ type: 'PROCEED_TO_BY_PRODUCTS' })
  }, [])

  const handleByProductSkip = useCallback(() => {
    dispatch({ type: 'BY_PRODUCT_SKIP' })
  }, [])

  const handleByProductSkipAll = useCallback(() => {
    dispatch({ type: 'BY_PRODUCT_SKIP_ALL' })
  }, [])

  const handleComplete = useCallback(() => {
    dispatch({ type: 'COMPLETE' })
  }, [])

  const goBack = useCallback(() => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current)
    }
    dispatch({ type: 'GO_BACK' })
  }, [])

  const reset = useCallback(() => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current)
    }
    dispatch({ type: 'RESET' })
  }, [])

  const saveOffline = useCallback(() => {
    dispatch({ type: 'SAVE_OFFLINE' })
  }, [])

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  return {
    // State
    state: state.state,
    step: state.step,
    totalSteps: state.totalSteps,
    woData: state.woData,
    quantity: state.quantity,
    qaStatus: state.qaStatus,
    lpData: state.lpData,
    byProducts: state.byProducts,
    currentByProduct: state.currentByProduct,
    byProductIndex: state.byProductIndex,
    byProductQuantity: state.byProductQuantity,
    isSubmitting: state.isSubmitting,
    error: state.error,
    overproductionWarning: state.overproductionWarning,
    reviewData: state.reviewData,
    woProgress: state.woProgress,
    canPrint: state.canPrint,
    printDisabledReason: state.printDisabledReason,
    printStatus: state.printStatus,
    printMessage: state.printMessage,
    canRetryPrint: state.canRetryPrint,
    zeroQtyWarning: state.zeroQtyWarning,
    zeroQtyMessage: state.zeroQtyMessage,
    offlineSaved: state.offlineSaved,
    offlineMessage: state.offlineMessage,
    canRetry: state.canRetry,
    canSaveOffline: state.canSaveOffline,
    completionMessage: state.completionMessage,

    // Actions
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
    setByProductQuantity,
    handleByProductRegistered,
    handleByProductYes,
    handleByProductSkip,
    handleByProductSkipAll,
    handleComplete,
    goBack,
    reset,
    saveOffline,
    clearError,
  }
}

export default useScannerOutput
