/**
 * Scanner Pick Types (Story 07.10)
 * Type definitions for scanner pick workflow
 */

export interface PickListSummary {
  id: string
  pick_list_number: string
  status: 'assigned' | 'in_progress' | 'completed'
  priority: 'urgent' | 'high' | 'normal' | 'low'
  line_count: number
  assigned_to: string
}

export interface PickLineDetail {
  id: string
  pick_list_id: string
  pick_sequence: number
  product: { id: string; name: string; sku: string }
  location: { id: string; code: string; zone: string; path: string }
  quantity_to_pick: number
  quantity_picked: number | null
  status: 'pending' | 'picked' | 'short'
  expected_lp: string | null
  picked_lp: string | null
  lot_number?: string
  bbd?: string
  allergens?: string[]
}

export interface PickListDetail {
  id: string
  pick_list_number: string
  status: 'assigned' | 'in_progress' | 'completed'
  priority: 'urgent' | 'high' | 'normal' | 'low'
  assigned_to: string
  lines: PickLineDetail[]
}

export interface ScannerPickInput {
  pick_line_id: string
  scanned_lp_barcode: string
  quantity_picked: number
  short_pick: boolean
  short_pick_reason?: string
  short_pick_notes?: string
}

export interface ShortPickData {
  reason: string
  notes?: string
  quantity: number
}

export interface PickProgress {
  total_lines: number
  picked_lines: number
  short_lines: number
}

export interface ScannerSettings {
  audio_volume: number
  audio_muted: boolean
  vibration_enabled: boolean
  high_contrast: boolean
  large_text: boolean
  camera_enabled: boolean
}

export interface PickConfirmResponse {
  success: boolean
  pick_line_status: 'picked' | 'short'
  next_line: PickLineDetail | null
  progress: PickProgress
  pick_list_complete: boolean
}

export interface PickSuggestion {
  suggested_lp: string
  suggested_lp_id: string
  alternate_lps: Array<{
    lp_number: string
    lp_id: string
    mfg_date: string
    bbd_date: string
  }>
  fifo_warning: boolean
  fefo_warning: boolean
}

export interface LPLookupResult {
  lp_number: string
  product_id: string
  product_name: string
  product_sku: string
  lot_number: string
  best_before_date: string | null
  on_hand_quantity: number
  location_id: string
  location_path: string
  allergens: string[]
  qa_status: string
}

export interface PickCompleteSummary {
  total_lines: number
  picked_lines: number
  short_picks: number
  total_qty: number
  duration_minutes: number
}
