/**
 * Scanner QA Service
 * Story: 06.8 Scanner QA Pass/Fail
 *
 * Business logic for scanner QA operations:
 * - LP lookup with inspection check
 * - Quick pass/fail inspection workflow
 * - Bulk sync of offline actions
 * - Offline queue management
 */

import { createClient } from '@/lib/supabase/client'
import type {
  QuickInspectionInput,
  QuickInspectionResponse,
  SyncOfflineResponse,
  OfflineAction,
} from '@/lib/validation/scanner-qa'

// =============================================================================
// Types
// =============================================================================

export interface LicensePlate {
  id: string
  barcode: string
  product_id: string
  batch_number?: string
  quantity: number
  qa_status: string
  org_id: string
}

export interface QualityInspection {
  id: string
  lp_id: string
  inspection_number: string
  status: string
  result: string | null
  result_notes?: string
  defects_found?: number
  inspection_method?: string
  scanner_device_id?: string
  completed_at?: string
  created_at: string
}

export interface LPLookupResult {
  lp: LicensePlate
  inspection: QualityInspection | null
}

// =============================================================================
// Constants
// =============================================================================

const MAX_QUEUE_SIZE = 50
const MAX_SYNC_ACTIONS = 100

// Inspection statuses
const INSPECTION_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const

// LP QA statuses
const LP_QA_STATUS = {
  PENDING: 'pending',
  PASSED: 'passed',
  FAILED: 'failed',
} as const

// Sync statuses
const SYNC_STATUS = {
  SYNCED: 'synced',
  FAILED: 'failed',
  DUPLICATE: 'duplicate',
} as const

// Audit actions
const AUDIT_ACTION = {
  SCANNER_COMPLETE: 'scanner_complete',
} as const

// Error messages
const ERROR_MESSAGES = {
  LP_NOT_FOUND: 'LP not found',
  INSPECTION_NOT_FOUND: 'Inspection not found',
  INSPECTION_ALREADY_COMPLETED: 'Inspection already completed',
  FAILED_TO_UPDATE_INSPECTION: 'Failed to update inspection',
  FAILED_TO_UPDATE_LP_STATUS: 'Failed to update LP status',
  QUEUE_LIMIT_EXCEEDED: 'Queue limit exceeded',
  INDEXEDDB_NOT_AVAILABLE: 'IndexedDB not available',
} as const

// =============================================================================
// IndexedDB Queue Management (Client-side)
// =============================================================================

const DB_NAME = 'monopilot-scanner-qa'
const DB_VERSION = 1
const STORE_NAME = 'offline_queue'

let dbInstance: IDBDatabase | null = null

async function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance

  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error(ERROR_MESSAGES.INDEXEDDB_NOT_AVAILABLE))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      dbInstance = request.result
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('by_timestamp', 'timestamp')
        store.createIndex('by_type', 'type')
        store.createIndex('by_synced', 'synced')
      }
    }
  })
}

// =============================================================================
// LP Lookup Functions
// =============================================================================

/**
 * Lookup LP and check for pending inspection
 * AC-8.2: Scan LP to Load Inspection
 */
export async function lookupLPForInspection(barcode: string): Promise<LPLookupResult> {
  const supabase = createClient()

  // Lookup LP by barcode
  const { data: lp, error: lpError } = await supabase
    .from('license_plates')
    .select('*')
    .eq('barcode', barcode.toUpperCase())
    .single()

  if (lpError || !lp) {
    throw new Error(ERROR_MESSAGES.LP_NOT_FOUND)
  }

  // Lookup pending inspection for LP
  const { data: inspection } = await supabase
    .from('quality_inspections')
    .select('*')
    .eq('lp_id', lp.id)
    .in('status', [INSPECTION_STATUS.SCHEDULED, INSPECTION_STATUS.IN_PROGRESS])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return {
    lp,
    inspection: inspection || null,
  }
}

// =============================================================================
// Quick Inspection Functions
// =============================================================================

/**
 * Quick pass/fail inspection (simplified workflow)
 * AC-8.4, AC-8.5: Quick Pass/Fail Workflow
 */
export async function quickInspection(input: QuickInspectionInput): Promise<QuickInspectionResponse> {
  const supabase = createClient()

  // Verify inspection exists and is not already completed
  const { data: existingInspection, error: lookupError } = await supabase
    .from('quality_inspections')
    .select('*')
    .eq('id', input.inspection_id)
    .single()

  if (lookupError || !existingInspection) {
    throw new Error(ERROR_MESSAGES.INSPECTION_NOT_FOUND)
  }

  if (existingInspection.status === INSPECTION_STATUS.COMPLETED) {
    throw new Error(ERROR_MESSAGES.INSPECTION_ALREADY_COMPLETED)
  }

  // Map result to LP QA status
  const lpQAStatus = input.result === 'pass' ? LP_QA_STATUS.PASSED : LP_QA_STATUS.FAILED

  // Update inspection
  const { data: updatedInspection, error: updateError } = await supabase
    .from('quality_inspections')
    .update({
      status: INSPECTION_STATUS.COMPLETED,
      result: input.result,
      result_notes: input.result_notes,
      defects_found: input.defects_found,
      inspection_method: input.inspection_method,
      scanner_device_id: input.scanner_device_id,
      scanner_location: input.scanner_location,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.inspection_id)
    .select()
    .single()

  if (updateError) {
    throw new Error(ERROR_MESSAGES.FAILED_TO_UPDATE_INSPECTION)
  }

  // Update LP QA status
  const { error: lpUpdateError } = await supabase
    .from('license_plates')
    .update({
      qa_status: lpQAStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingInspection.lp_id)

  if (lpUpdateError) {
    throw new Error(ERROR_MESSAGES.FAILED_TO_UPDATE_LP_STATUS)
  }

  // Log audit trail
  await supabase.from('quality_audit_log').insert({
    entity_type: 'inspection',
    entity_id: input.inspection_id,
    action: AUDIT_ACTION.SCANNER_COMPLETE,
    old_value: JSON.stringify({
      status: existingInspection.status,
      result: existingInspection.result,
    }),
    new_value: JSON.stringify({
      status: INSPECTION_STATUS.COMPLETED,
      result: input.result,
    }),
    change_reason: input.result === 'pass' ? 'Scanner quick pass' : 'Scanner quick fail',
    metadata: JSON.stringify({
      inspection_method: 'scanner',
      device_id: input.scanner_device_id || null,
      offline_queued: false,
    }),
  })

  return {
    inspection: updatedInspection,
    lp_status_updated: true,
    lp_new_status: lpQAStatus as 'passed' | 'failed',
  }
}

// =============================================================================
// Offline Sync Functions
// =============================================================================

/**
 * Helper to log sync queue entry
 */
async function logSyncQueueEntry(
  supabase: ReturnType<typeof createClient>,
  orgId: string | undefined,
  userId: string | undefined,
  action: OfflineAction,
  syncStatus: typeof SYNC_STATUS[keyof typeof SYNC_STATUS],
  errorMessage?: string
): Promise<void> {
  await supabase.from('scanner_offline_queue').insert({
    org_id: orgId,
    user_id: userId,
    action_type: action.type,
    action_payload: action.payload,
    created_at_local: action.timestamp,
    sync_status: syncStatus,
    error_message: errorMessage,
  })
}

/**
 * Sync offline actions in bulk
 * AC-8.9: Auto-Sync When Online
 */
export async function syncOfflineActions(
  actions: OfflineAction[]
): Promise<SyncOfflineResponse> {
  // Validate max actions
  if (actions.length > MAX_SYNC_ACTIONS) {
    throw new Error(`Number of actions (${actions.length}) exceeds maximum of ${MAX_SYNC_ACTIONS}`)
  }

  // Sort by timestamp (process oldest first)
  const sortedActions = [...actions].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  const supabase = createClient()

  // Get user info once at the start
  const { data: { user } } = await supabase.auth.getUser()
  const orgId = user?.user_metadata?.org_id
  const userId = user?.id

  let success = 0
  let failed = 0
  const errors: { action_id: string; error: string }[] = []

  for (const action of sortedActions) {
    try {
      if (action.type === 'quick_inspection') {
        const payload = action.payload as QuickInspectionInput

        // Check if inspection already completed (duplicate prevention)
        const { data: existing } = await supabase
          .from('quality_inspections')
          .select('status')
          .eq('id', payload.inspection_id)
          .single()

        if (existing?.status === INSPECTION_STATUS.COMPLETED) {
          errors.push({
            action_id: action.id,
            error: ERROR_MESSAGES.INSPECTION_ALREADY_COMPLETED,
          })
          failed++

          // Log duplicate attempt
          await logSyncQueueEntry(
            supabase,
            orgId,
            userId,
            action,
            SYNC_STATUS.DUPLICATE,
            ERROR_MESSAGES.INSPECTION_ALREADY_COMPLETED
          )

          continue
        }

        // Process action
        await quickInspection(payload)

        // Log successful sync
        await logSyncQueueEntry(supabase, orgId, userId, action, SYNC_STATUS.SYNCED)

        success++
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      failed++
      errors.push({
        action_id: action.id,
        error: errorMessage,
      })

      // Log failed sync
      await logSyncQueueEntry(
        supabase,
        orgId,
        userId,
        action,
        SYNC_STATUS.FAILED,
        errorMessage
      )
    }
  }

  return {
    success,
    failed,
    errors,
  }
}

// =============================================================================
// Offline Queue Management (Client-side IndexedDB)
// =============================================================================

interface QueuedAction extends OfflineAction {
  synced: boolean
  retry_count: number
}

/**
 * Queue action for offline sync
 * AC-8.8: Offline Action Queue
 */
export async function queueOfflineAction(
  action: Omit<OfflineAction, 'id'> & { id?: string }
): Promise<void> {
  const db = await openDB()

  // Check queue size
  const queue = await getOfflineQueue()
  if (queue.length >= MAX_QUEUE_SIZE) {
    throw new Error(ERROR_MESSAGES.QUEUE_LIMIT_EXCEEDED)
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    const queuedAction: QueuedAction = {
      id: action.id || crypto.randomUUID(),
      type: action.type,
      payload: action.payload,
      timestamp: action.timestamp,
      synced: false,
      retry_count: 0,
    }

    const request = store.add(queuedAction)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get offline queue from IndexedDB
 */
export async function getOfflineQueue(): Promise<QueuedAction[]> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      const items = request.result || []
      resolve(items.filter((item: QueuedAction) => !item.synced))
    }

    request.onerror = () => reject(request.error)
  })
}

/**
 * Clear synced actions from queue
 */
export async function clearSyncedActions(actionIds: string[]): Promise<void> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    let completed = 0
    const total = actionIds.length

    if (total === 0) {
      resolve()
      return
    }

    for (const id of actionIds) {
      const request = store.delete(id)
      request.onsuccess = () => {
        completed++
        if (completed >= total) {
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    }
  })
}

// =============================================================================
// Default Export
// =============================================================================

export const ScannerQAService = {
  lookupLPForInspection,
  quickInspection,
  syncOfflineActions,
  queueOfflineAction,
  getOfflineQueue,
  clearSyncedActions,
}

export default ScannerQAService
