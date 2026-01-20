/**
 * useScannerFlow Hook - Scanner State Machine
 * Story 04.6b: Material Consumption Scanner
 *
 * 6-step consumption flow:
 * 1. scan_wo - Scan work order barcode
 * 2. scan_lp - Scan license plate barcode
 * 3. enter_qty - Enter consumption quantity
 * 4. review - Review before confirmation
 * 5. confirm - Processing confirmation
 * 6. next - Success, option for next material
 */

import { useCallback, useReducer } from 'react'

// Types
export type ScannerState = 'scan_wo' | 'scan_lp' | 'enter_qty' | 'review' | 'confirm' | 'next'

export interface WOMaterial {
  id: string
  material_name: string
  required_qty: number
  consumed_qty: number
  product_id?: string
}

export interface WOData {
  id: string
  wo_number: string
  product_name: string
  status: string
  materials: WOMaterial[]
}

export interface LPData {
  id: string
  lp_number: string
  product_name: string
  quantity: number
  uom: string
  batch_number?: string
  expiry_date?: string
}

export interface ScannerError {
  code: string
  message: string
}

interface ScannerFlowState {
  state: ScannerState
  step: number
  woData: WOData | null
  lpData: LPData | null
  consumeQty: number | null
  isFullLP: boolean
  isSubmitting: boolean
  error: ScannerError | null
}

type ScannerAction =
  | { type: 'SET_WO'; payload: WOData }
  | { type: 'SET_WO_ERROR'; payload: ScannerError }
  | { type: 'SET_LP'; payload: LPData }
  | { type: 'SET_LP_ERROR'; payload: ScannerError }
  | { type: 'SET_CONSUME_QTY'; payload: number }
  | { type: 'SET_FULL_CONSUMPTION' }
  | { type: 'PROCEED_TO_REVIEW' }
  | { type: 'SUBMIT_CONSUMPTION' }
  | { type: 'CONSUMPTION_SUCCESS' }
  | { type: 'CONSUMPTION_ERROR'; payload: ScannerError }
  | { type: 'NEXT_MATERIAL' }
  | { type: 'GO_BACK' }
  | { type: 'RESET' }

const STEP_MAP: Record<ScannerState, number> = {
  scan_wo: 1,
  scan_lp: 2,
  enter_qty: 3,
  review: 4,
  confirm: 5,
  next: 6,
}

const initialState: ScannerFlowState = {
  state: 'scan_wo',
  step: 1,
  woData: null,
  lpData: null,
  consumeQty: null,
  isFullLP: false,
  isSubmitting: false,
  error: null,
}

function scannerReducer(state: ScannerFlowState, action: ScannerAction): ScannerFlowState {
  switch (action.type) {
    case 'SET_WO':
      return {
        ...state,
        state: 'scan_lp',
        step: STEP_MAP.scan_lp,
        woData: action.payload,
        error: null,
      }

    case 'SET_WO_ERROR':
      return {
        ...state,
        error: action.payload,
      }

    case 'SET_LP':
      return {
        ...state,
        state: 'enter_qty',
        step: STEP_MAP.enter_qty,
        lpData: action.payload,
        error: null,
      }

    case 'SET_LP_ERROR':
      return {
        ...state,
        error: action.payload,
      }

    case 'SET_CONSUME_QTY':
      return {
        ...state,
        consumeQty: action.payload,
        isFullLP: false,
        error: null,
      }

    case 'SET_FULL_CONSUMPTION':
      return {
        ...state,
        state: 'review',
        step: STEP_MAP.review,
        consumeQty: state.lpData?.quantity || 0,
        isFullLP: true,
        error: null,
      }

    case 'PROCEED_TO_REVIEW':
      return {
        ...state,
        state: 'review',
        step: STEP_MAP.review,
        error: null,
      }

    case 'SUBMIT_CONSUMPTION':
      return {
        ...state,
        state: 'confirm',
        step: STEP_MAP.confirm,
        isSubmitting: true,
        error: null,
      }

    case 'CONSUMPTION_SUCCESS':
      return {
        ...state,
        state: 'next',
        step: STEP_MAP.next,
        isSubmitting: false,
        error: null,
      }

    case 'CONSUMPTION_ERROR':
      return {
        ...state,
        state: 'review',
        step: STEP_MAP.review,
        isSubmitting: false,
        error: action.payload,
      }

    case 'NEXT_MATERIAL':
      return {
        ...state,
        state: 'scan_lp',
        step: STEP_MAP.scan_lp,
        lpData: null,
        consumeQty: null,
        isFullLP: false,
        error: null,
      }

    case 'GO_BACK':
      switch (state.state) {
        case 'scan_lp':
          return {
            ...state,
            state: 'scan_wo',
            step: STEP_MAP.scan_wo,
            woData: null,
            error: null,
          }
        case 'enter_qty':
          return {
            ...state,
            state: 'scan_lp',
            step: STEP_MAP.scan_lp,
            lpData: null,
            consumeQty: null,
            error: null,
          }
        case 'review':
          return {
            ...state,
            state: 'enter_qty',
            step: STEP_MAP.enter_qty,
            error: null,
          }
        default:
          return state
      }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

export function useScannerFlow() {
  const [state, dispatch] = useReducer(scannerReducer, initialState)

  const handleWOScan = useCallback(async (woData: WOData) => {
    dispatch({ type: 'SET_WO', payload: woData })
  }, [])

  const handleWOScanError = useCallback(async (code: string, message: string) => {
    dispatch({ type: 'SET_WO_ERROR', payload: { code, message } })
  }, [])

  const handleLPScan = useCallback(async (lpData: LPData) => {
    dispatch({ type: 'SET_LP', payload: lpData })
  }, [])

  const handleLPScanError = useCallback(async (code: string, message: string) => {
    dispatch({ type: 'SET_LP_ERROR', payload: { code, message } })
  }, [])

  const setConsumeQty = useCallback((qty: number) => {
    dispatch({ type: 'SET_CONSUME_QTY', payload: qty })
  }, [])

  const handleFullConsumption = useCallback(() => {
    dispatch({ type: 'SET_FULL_CONSUMPTION' })
  }, [])

  const proceedToReview = useCallback(() => {
    dispatch({ type: 'PROCEED_TO_REVIEW' })
  }, [])

  const submitConsumption = useCallback(() => {
    dispatch({ type: 'SUBMIT_CONSUMPTION' })
  }, [])

  const handleConsumptionSuccess = useCallback(async () => {
    dispatch({ type: 'CONSUMPTION_SUCCESS' })
  }, [])

  const handleConsumptionError = useCallback(async (code: string, message: string) => {
    dispatch({ type: 'CONSUMPTION_ERROR', payload: { code, message } })
  }, [])

  const handleNextMaterial = useCallback(() => {
    dispatch({ type: 'NEXT_MATERIAL' })
  }, [])

  const handleDone = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  const goBack = useCallback(() => {
    dispatch({ type: 'GO_BACK' })
  }, [])

  return {
    // State
    state: state.state,
    step: state.step,
    totalSteps: 6,
    woData: state.woData,
    lpData: state.lpData,
    consumeQty: state.consumeQty,
    isFullLP: state.isFullLP,
    isSubmitting: state.isSubmitting,
    error: state.error,

    // Actions
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
  }
}

export default useScannerFlow
