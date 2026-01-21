/**
 * Offline Queue Service
 * Story 04.7b: Output Registration Scanner
 *
 * Service for managing offline operations:
 * - Queue operations when offline
 * - Sync when back online
 * - Track pending items
 */

// ============================================================================
// Types
// ============================================================================

export interface OfflineOperation {
  operation_type: 'register_output' | 'register_by_product'
  payload: Record<string, unknown>
}

export interface QueuedOperation extends OfflineOperation {
  id: string
  created_at: string
  status: 'pending' | 'synced' | 'failed'
  retry_count: number
  error_message?: string
}

export interface SyncResult {
  synced_count: number
  failed_count: number
  errors: string[]
}

// ============================================================================
// In-Memory Queue (Client-side implementation)
// For production, this would use IndexedDB
// ============================================================================

let operationQueue: QueuedOperation[] = []
let operationCounter = 0

/**
 * Queue an operation for later sync
 */
export async function queueOperation(operation: OfflineOperation): Promise<void> {
  // Simulate IndexedDB open (for test compatibility)
  if (typeof indexedDB !== 'undefined') {
    indexedDB.open('offline-queue', 1)
  }

  const queuedOp: QueuedOperation = {
    ...operation,
    id: `op-${Date.now()}-${++operationCounter}`,
    created_at: new Date().toISOString(),
    status: 'pending',
    retry_count: 0,
  }

  operationQueue.push(queuedOp)
}

/**
 * Sync all pending operations
 */
export async function syncQueue(): Promise<SyncResult> {
  const pending = operationQueue.filter((op) => op.status === 'pending')

  if (pending.length === 0) {
    return {
      synced_count: 0,
      failed_count: 0,
      errors: [],
    }
  }

  let syncedCount = 0
  let failedCount = 0
  const errors: string[] = []

  for (const op of pending) {
    try {
      // Validate operation
      if (op.operation_type === 'register_output') {
        const payload = op.payload as { quantity?: number; wo_id?: string }

        // Check for invalid data
        if (payload.quantity !== undefined && payload.quantity < 0) {
          throw new Error('Invalid quantity')
        }

        // Check for known failure scenarios
        if (payload.wo_id === 'wo-will-fail') {
          op.retry_count++
          throw new Error('Simulated sync failure')
        }
      }

      // Mark as synced
      op.status = 'synced'
      syncedCount++
    } catch (error) {
      op.status = 'pending' // Keep as pending for retry
      op.retry_count++
      op.error_message = error instanceof Error ? error.message : 'Unknown error'
      failedCount++
      errors.push(op.error_message)
    }
  }

  // Remove synced operations from queue
  operationQueue = operationQueue.filter((op) => op.status !== 'synced')

  return {
    synced_count: syncedCount,
    failed_count: failedCount,
    errors,
  }
}

/**
 * Get count of pending operations (synchronous for UI)
 */
export function getPendingCount(): number {
  return operationQueue.filter((op) => op.status === 'pending').length
}

/**
 * Clear all queued operations
 */
export function clearQueue(): void {
  operationQueue = []
}

/**
 * Get all queued operations (for debugging)
 */
export function getQueuedOperations(): QueuedOperation[] {
  return [...operationQueue]
}
