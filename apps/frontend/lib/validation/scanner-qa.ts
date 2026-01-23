/**
 * Scanner QA Validation Schemas
 * Story: 06.8 Scanner QA Pass/Fail
 *
 * Zod schemas for scanner API requests and offline queue
 */

import { z } from 'zod'

// =============================================================================
// Quick Inspection Schema (POST /api/quality/scanner/quick-inspection)
// =============================================================================

export const quickInspectionSchema = z.object({
  inspection_id: z.string().uuid('Invalid inspection ID'),
  result: z.enum(['pass', 'fail']),
  result_notes: z.string().max(2000).optional(),
  defects_found: z.number().int().min(0).max(1000).optional(),
  inspection_method: z.literal('scanner'),
  scanner_device_id: z.string().max(100).optional(),
  scanner_location: z.string().max(100).optional(), // GPS coordinates
})

export type QuickInspectionInput = z.infer<typeof quickInspectionSchema>

// =============================================================================
// Offline Action Schema (Queue item)
// =============================================================================

export const offlineActionSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['quick_inspection', 'test_result']),
  payload: z.record(z.any()), // Union of all possible payloads
  timestamp: z.string().datetime(),
})

export type OfflineAction = z.infer<typeof offlineActionSchema>

// =============================================================================
// Sync Offline Schema (POST /api/quality/scanner/sync-offline)
// =============================================================================

export const syncOfflineSchema = z.object({
  actions: z.array(offlineActionSchema).min(1).max(100), // Max 100 actions per sync
})

export type SyncOfflineInput = z.infer<typeof syncOfflineSchema>

// =============================================================================
// Response Types
// =============================================================================

export interface QuickInspectionResponse {
  inspection: {
    id: string
    lp_id: string
    status: string
    result: string
    inspection_method: string
    completed_at?: string
    result_notes?: string
    defects_found?: number
  }
  lp_status_updated: boolean
  lp_new_status: 'passed' | 'failed'
}

export interface SyncOfflineResponse {
  success: number
  failed: number
  errors: {
    action_id: string
    error: string
  }[]
}

export interface InspectionByLPResponse {
  inspection: {
    id: string
    lp_id: string
    inspection_number: string
    status: string
    result: string | null
    created_at: string
  } | null
  lp: {
    id: string
    barcode: string
    product_id: string
    batch_number?: string
    quantity: number
    qa_status: string
  }
  has_pending_inspection: boolean
}
