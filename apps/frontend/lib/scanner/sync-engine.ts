/**
 * Sync Engine for Scanner Offline Queue
 * Story 5.36: Scanner Offline Queue - Core
 *
 * Features:
 * - Batch size: 10 operations per request
 * - Retry: 3 attempts with exponential backoff (2s, 4s, 8s)
 * - FIFO order
 * - Progress tracking
 */

import { IndexedDBService, type OfflineOperation } from './indexeddb-service'
import { NetworkMonitor } from './network-monitor'

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline'

export interface SyncResult {
  success: boolean
  synced_count: number
  failed_count: number
  total_count: number
  errors: string[]
}

export interface SyncProgress {
  status: SyncStatus
  current: number
  total: number
  message: string
}

type SyncProgressCallback = (progress: SyncProgress) => void

const BATCH_SIZE = 10
const MAX_RETRIES = 3
const BASE_DELAY_MS = 2000 // 2 seconds

class SyncEngineService {
  private _status: SyncStatus = 'idle'
  private _progress: SyncProgress = {
    status: 'idle',
    current: 0,
    total: 0,
    message: '',
  }
  private progressCallbacks: Set<SyncProgressCallback> = new Set()
  private isSyncing = false
  private initialized = false

  /**
   * Initialize the sync engine
   * Must be called on client-side only
   */
  init(): void {
    if (typeof window === 'undefined') return
    if (this.initialized) return

    this.initialized = true

    // Initialize network monitor
    NetworkMonitor.init()

    // Auto-sync on reconnect
    NetworkMonitor.onOnline(() => {
      console.log('[SyncEngine] Network online, starting sync...')
      this.syncQueue()
    })

    // Update status on offline
    NetworkMonitor.onOffline(() => {
      this.updateProgress({
        status: 'offline',
        current: 0,
        total: 0,
        message: 'Offline - operations queued locally',
      })
    })

    // Set initial status based on network
    if (!NetworkMonitor.isOnline()) {
      this._status = 'offline'
      this._progress.status = 'offline'
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    NetworkMonitor.destroy()
    this.progressCallbacks.clear()
    this.initialized = false
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    return this._status
  }

  /**
   * Get current progress
   */
  getProgress(): SyncProgress {
    return { ...this._progress }
  }

  /**
   * Register progress callback
   */
  onProgress(callback: SyncProgressCallback): () => void {
    this.progressCallbacks.add(callback)
    return () => this.progressCallbacks.delete(callback)
  }

  /**
   * Update progress and notify listeners
   */
  private updateProgress(progress: Partial<SyncProgress>): void {
    this._progress = { ...this._progress, ...progress }
    this._status = this._progress.status

    this.progressCallbacks.forEach((cb) => {
      try {
        cb(this._progress)
      } catch (err) {
        console.error('[SyncEngine] Progress callback error:', err)
      }
    })
  }

  /**
   * Manual sync trigger
   */
  async manualSync(): Promise<void> {
    if (!NetworkMonitor.isOnline()) {
      this.updateProgress({
        status: 'offline',
        message: 'Cannot sync - device is offline',
      })
      return
    }

    await this.syncQueue()
  }

  /**
   * Main sync queue method
   */
  async syncQueue(): Promise<SyncResult> {
    // Prevent concurrent syncs
    if (this.isSyncing) {
      return {
        success: false,
        synced_count: 0,
        failed_count: 0,
        total_count: 0,
        errors: ['Sync already in progress'],
      }
    }

    // Check network
    if (!NetworkMonitor.isOnline()) {
      this.updateProgress({
        status: 'offline',
        message: 'Cannot sync - device is offline',
      })
      return {
        success: false,
        synced_count: 0,
        failed_count: 0,
        total_count: 0,
        errors: ['Device is offline'],
      }
    }

    this.isSyncing = true
    const result: SyncResult = {
      success: true,
      synced_count: 0,
      failed_count: 0,
      total_count: 0,
      errors: [],
    }

    try {
      // Get queue
      const queue = await IndexedDBService.getQueue()
      result.total_count = queue.length

      if (queue.length === 0) {
        this.updateProgress({
          status: 'success',
          current: 0,
          total: 0,
          message: 'Queue is empty',
        })
        return result
      }

      this.updateProgress({
        status: 'syncing',
        current: 0,
        total: queue.length,
        message: `Syncing ${queue.length} operations...`,
      })

      // Process in batches
      for (let i = 0; i < queue.length; i += BATCH_SIZE) {
        // Check if still online
        if (!NetworkMonitor.isOnline()) {
          this.updateProgress({
            status: 'offline',
            message: 'Sync interrupted - device went offline',
          })
          result.success = false
          result.errors.push('Device went offline during sync')
          break
        }

        const batch = queue.slice(i, i + BATCH_SIZE)
        const batchResult = await this.syncBatch(batch)

        result.synced_count += batchResult.synced
        result.failed_count += batchResult.failed
        result.errors.push(...batchResult.errors)

        this.updateProgress({
          status: 'syncing',
          current: Math.min(i + BATCH_SIZE, queue.length),
          total: queue.length,
          message: `Synced ${result.synced_count} of ${queue.length}...`,
        })
      }

      // Final status
      if (result.failed_count > 0) {
        this.updateProgress({
          status: 'error',
          current: result.synced_count,
          total: result.total_count,
          message: `Completed with ${result.failed_count} failures`,
        })
        result.success = false
      } else {
        this.updateProgress({
          status: 'success',
          current: result.synced_count,
          total: result.total_count,
          message: `Successfully synced ${result.synced_count} operations`,
        })
      }

      return result
    } catch (err) {
      console.error('[SyncEngine] Sync error:', err)
      this.updateProgress({
        status: 'error',
        message: err instanceof Error ? err.message : 'Sync failed',
      })
      result.success = false
      result.errors.push(err instanceof Error ? err.message : 'Unknown error')
      return result
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * Sync a batch of operations
   */
  private async syncBatch(batch: OfflineOperation[]): Promise<{
    synced: number
    failed: number
    errors: string[]
  }> {
    const result = { synced: 0, failed: 0, errors: [] as string[] }

    try {
      const response = await fetch('/api/scanner/sync-offline-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations: batch }),
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // Remove synced operations from queue
        const syncedIds = batch
          .filter((op) => !data.failed_operations?.find((f: { id: string }) => f.id === op.id))
          .map((op) => op.id)

        await IndexedDBService.removeOperations(syncedIds)
        result.synced = data.synced_count || syncedIds.length

        // Handle failed operations
        if (data.failed_operations?.length > 0) {
          for (const failed of data.failed_operations) {
            const op = batch.find((o) => o.id === failed.id)
            if (op) {
              await this.handleFailedOperation(op, failed.error || 'Unknown error')
              result.failed++
              result.errors.push(`${op.operation_type}: ${failed.error}`)
            }
          }
        }
      } else {
        // Entire batch failed
        throw new Error(data.message || 'Batch sync failed')
      }
    } catch (err) {
      console.error('[SyncEngine] Batch sync error:', err)

      // Retry individual operations
      for (const op of batch) {
        const retryResult = await this.retryOperation(op)
        if (retryResult.success) {
          result.synced++
        } else {
          result.failed++
          result.errors.push(retryResult.error)
        }
      }
    }

    return result
  }

  /**
   * Retry single operation with exponential backoff
   */
  private async retryOperation(
    operation: OfflineOperation
  ): Promise<{ success: boolean; error: string }> {
    let lastError = ''

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      // Check network before retry
      if (!NetworkMonitor.isOnline()) {
        return { success: false, error: 'Device went offline' }
      }

      // Exponential backoff delay (skip first attempt)
      if (attempt > 0) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1)
        await this.sleep(delay)
      }

      try {
        const response = await fetch('/api/scanner/sync-offline-queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operations: [operation] }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.synced_count > 0) {
            await IndexedDBService.removeOperation(operation.id)
            return { success: true, error: '' }
          }
          lastError = data.failed_operations?.[0]?.error || data.message || 'Sync failed'
        } else {
          lastError = `Server error: ${response.status}`
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Network error'
      }

      // Update retry count
      operation.retry_count++
      await IndexedDBService.updateOperation(operation)
    }

    // Max retries exceeded - move to failed queue
    await this.handleFailedOperation(operation, lastError)
    return { success: false, error: lastError }
  }

  /**
   * Handle failed operation
   */
  private async handleFailedOperation(operation: OfflineOperation, error: string): Promise<void> {
    await IndexedDBService.addFailedOperation(operation, error)
    await IndexedDBService.removeOperation(operation.id)
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Singleton instance
export const SyncEngine = new SyncEngineService()

export default SyncEngine
