/**
 * Offline Sync Service
 * Story: 06.8 Scanner QA Pass/Fail
 * AC-8.7, AC-8.8, AC-8.9: Offline Mode & Auto-Sync
 *
 * Manages IndexedDB queue and connectivity for scanner operations:
 * - Initialize IndexedDB for offline queue
 * - Detect online/offline status
 * - Trigger sync when back online
 * - Track queue count
 */

import type { SyncOfflineResponse } from '@/lib/validation/scanner-qa'

const DB_NAME = 'monopilot-scanner'
const DB_VERSION = 1
const STORE_NAME = 'offline_queue'

// =============================================================================
// Types
// =============================================================================

export interface OfflineQueueItem {
  id: string
  type: 'quick_inspection' | 'test_result'
  payload: Record<string, unknown>
  timestamp: string
  synced: boolean
  retry_count: number
}

// =============================================================================
// IndexedDB Initialization
// =============================================================================

let dbInstance: IDBDatabase | null = null

/**
 * Initialize IndexedDB with offline_queue store
 */
export async function init(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance
  }

  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'))
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

      // Create offline_queue store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('by_timestamp', 'timestamp')
        store.createIndex('by_type', 'type')
        store.createIndex('by_synced', 'synced')
      }

      // Create settings store if it doesn't exist
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' })
      }
    }
  })
}

// =============================================================================
// Online/Offline Detection
// =============================================================================

/**
 * Check if device is online
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') {
    return true
  }
  return navigator.onLine
}

/**
 * Listen for online/offline events
 * Returns unsubscribe function
 */
export function onConnectivityChange(callback: (online: boolean) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Return unsubscribe function
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

// =============================================================================
// Queue Management
// =============================================================================

/**
 * Get count of pending actions in queue
 */
export async function getQueueCount(): Promise<number> {
  try {
    const db = await init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        const items = request.result as OfflineQueueItem[]
        const pendingCount = items.filter((item) => !item.synced).length
        resolve(pendingCount)
      }

      request.onerror = () => reject(request.error)
    })
  } catch {
    return 0
  }
}

/**
 * Add action to offline queue
 */
export async function addToQueue(item: Omit<OfflineQueueItem, 'synced' | 'retry_count'>): Promise<void> {
  const db = await init()

  // Check queue size limit (50 max)
  const count = await getQueueCount()
  if (count >= 50) {
    throw new Error('Queue limit exceeded (max 50)')
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const queueItem: OfflineQueueItem = {
      ...item,
      synced: false,
      retry_count: 0,
    }
    const request = store.add(queueItem)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get all items from queue
 */
export async function getQueue(): Promise<OfflineQueueItem[]> {
  try {
    const db = await init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result as OfflineQueueItem[])
      }

      request.onerror = () => reject(request.error)
    })
  } catch {
    return []
  }
}

/**
 * Clear synced items from queue
 */
export async function clearSynced(actionIds: string[]): Promise<void> {
  const db = await init()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

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
        if (completed === total) {
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    }
  })
}

// =============================================================================
// Sync Operations
// =============================================================================

/**
 * Trigger sync of offline queue
 * Calls API to sync actions and clears synced items
 */
export async function syncNow(): Promise<SyncOfflineResponse> {
  // If offline, return without syncing
  if (!isOnline()) {
    return {
      success: 0,
      failed: 0,
      errors: [],
    }
  }

  try {
    const items = await getQueue()
    const pendingItems = items.filter((item) => !item.synced)

    if (pendingItems.length === 0) {
      return {
        success: 0,
        failed: 0,
        errors: [],
      }
    }

    // Sort by timestamp (oldest first)
    const sortedItems = pendingItems.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    // Call sync API
    const response = await fetch('/api/quality/scanner/sync-offline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        actions: sortedItems.map((item) => ({
          id: item.id,
          type: item.type,
          payload: item.payload,
          timestamp: item.timestamp,
        })),
      }),
    })

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`)
    }

    const result: SyncOfflineResponse = await response.json()

    // Clear successfully synced items
    if (result.success > 0) {
      const syncedIds = sortedItems
        .filter((_, index) => {
          // Remove items that didn't fail
          const failedIds = result.errors.map((e) => e.action_id)
          return !failedIds.includes(sortedItems[index].id)
        })
        .map((item) => item.id)

      await clearSynced(syncedIds)
    }

    return result
  } catch (error) {
    return {
      success: 0,
      failed: 0,
      errors: [
        {
          action_id: 'sync',
          error: error instanceof Error ? error.message : 'Unknown sync error',
        },
      ],
    }
  }
}

// =============================================================================
// Default Export
// =============================================================================

export const OfflineSyncService = {
  init,
  isOnline,
  onConnectivityChange,
  getQueueCount,
  addToQueue,
  getQueue,
  clearSynced,
  syncNow,
}

export default OfflineSyncService
