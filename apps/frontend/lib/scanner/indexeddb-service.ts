/**
 * IndexedDB Service for Scanner Offline Queue
 * Story 5.36: Scanner Offline Queue - Core
 */

const DB_NAME = 'monopilot-scanner'
const DB_VERSION = 1
const QUEUE_STORE = 'offline_queue'
const FAILED_STORE = 'failed_queue'

export type OfflineOperationType = 'receive' | 'consume' | 'output' | 'move' | 'split' | 'count'

export interface OfflineOperation {
  id: string
  operation_type: OfflineOperationType
  payload: Record<string, unknown>
  performed_at: string // ISO timestamp
  synced_at?: string
  retry_count: number
  user_id: string
  org_id: string
}

export interface FailedOperation extends OfflineOperation {
  error: string
  failed_at: string
}

let dbInstance: IDBDatabase | null = null

/**
 * Get or create the IndexedDB database
 */
async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('IndexedDB error:', request.error)
      reject(new Error('Failed to open IndexedDB'))
    }

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create offline queue store
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        const queueStore = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' })
        queueStore.createIndex('performed_at', 'performed_at', { unique: false })
        queueStore.createIndex('operation_type', 'operation_type', { unique: false })
        queueStore.createIndex('org_id', 'org_id', { unique: false })
      }

      // Create failed queue store
      if (!db.objectStoreNames.contains(FAILED_STORE)) {
        const failedStore = db.createObjectStore(FAILED_STORE, { keyPath: 'id' })
        failedStore.createIndex('failed_at', 'failed_at', { unique: false })
        failedStore.createIndex('operation_type', 'operation_type', { unique: false })
      }
    }
  })
}

/**
 * IndexedDB Service Interface
 */
export const IndexedDBService = {
  /**
   * Add operation to offline queue
   */
  async addOperation(operation: OfflineOperation): Promise<void> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(QUEUE_STORE, 'readwrite')
      const store = transaction.objectStore(QUEUE_STORE)
      const request = store.add(operation)

      request.onerror = () => reject(new Error('Failed to add operation'))
      request.onsuccess = () => resolve()
    })
  },

  /**
   * Get all operations from queue (FIFO order)
   */
  async getQueue(): Promise<OfflineOperation[]> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(QUEUE_STORE, 'readonly')
      const store = transaction.objectStore(QUEUE_STORE)
      const index = store.index('performed_at')
      const request = index.getAll()

      request.onerror = () => reject(new Error('Failed to get queue'))
      request.onsuccess = () => resolve(request.result || [])
    })
  },

  /**
   * Get queue count
   */
  async getQueueCount(): Promise<number> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(QUEUE_STORE, 'readonly')
      const store = transaction.objectStore(QUEUE_STORE)
      const request = store.count()

      request.onerror = () => reject(new Error('Failed to get queue count'))
      request.onsuccess = () => resolve(request.result)
    })
  },

  /**
   * Remove operation from queue
   */
  async removeOperation(id: string): Promise<void> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(QUEUE_STORE, 'readwrite')
      const store = transaction.objectStore(QUEUE_STORE)
      const request = store.delete(id)

      request.onerror = () => reject(new Error('Failed to remove operation'))
      request.onsuccess = () => resolve()
    })
  },

  /**
   * Remove multiple operations from queue
   */
  async removeOperations(ids: string[]): Promise<void> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(QUEUE_STORE, 'readwrite')
      const store = transaction.objectStore(QUEUE_STORE)

      let completed = 0
      const total = ids.length

      if (total === 0) {
        resolve()
        return
      }

      ids.forEach((id) => {
        const request = store.delete(id)
        request.onerror = () => reject(new Error(`Failed to remove operation ${id}`))
        request.onsuccess = () => {
          completed++
          if (completed === total) resolve()
        }
      })
    })
  },

  /**
   * Clear entire queue
   */
  async clearQueue(): Promise<void> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(QUEUE_STORE, 'readwrite')
      const store = transaction.objectStore(QUEUE_STORE)
      const request = store.clear()

      request.onerror = () => reject(new Error('Failed to clear queue'))
      request.onsuccess = () => resolve()
    })
  },

  /**
   * Add failed operation
   */
  async addFailedOperation(operation: OfflineOperation, error: string): Promise<void> {
    const db = await getDB()
    const failedOp: FailedOperation = {
      ...operation,
      error,
      failed_at: new Date().toISOString(),
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(FAILED_STORE, 'readwrite')
      const store = transaction.objectStore(FAILED_STORE)
      const request = store.put(failedOp)

      request.onerror = () => reject(new Error('Failed to add failed operation'))
      request.onsuccess = () => resolve()
    })
  },

  /**
   * Get all failed operations
   */
  async getFailedQueue(): Promise<FailedOperation[]> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(FAILED_STORE, 'readonly')
      const store = transaction.objectStore(FAILED_STORE)
      const index = store.index('failed_at')
      const request = index.getAll()

      request.onerror = () => reject(new Error('Failed to get failed queue'))
      request.onsuccess = () => resolve(request.result || [])
    })
  },

  /**
   * Get failed queue count
   */
  async getFailedQueueCount(): Promise<number> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(FAILED_STORE, 'readonly')
      const store = transaction.objectStore(FAILED_STORE)
      const request = store.count()

      request.onerror = () => reject(new Error('Failed to get failed queue count'))
      request.onsuccess = () => resolve(request.result)
    })
  },

  /**
   * Retry failed operation - move back to main queue
   */
  async retryFailedOperation(id: string): Promise<void> {
    const db = await getDB()

    // Get the failed operation
    const failedOp = await new Promise<FailedOperation | undefined>((resolve, reject) => {
      const transaction = db.transaction(FAILED_STORE, 'readonly')
      const store = transaction.objectStore(FAILED_STORE)
      const request = store.get(id)

      request.onerror = () => reject(new Error('Failed to get failed operation'))
      request.onsuccess = () => resolve(request.result)
    })

    if (!failedOp) {
      throw new Error('Failed operation not found')
    }

    // Create new operation from failed (reset retry count)
    const { error: _error, failed_at: _failed_at, ...baseOp } = failedOp
    const newOp: OfflineOperation = {
      ...baseOp,
      retry_count: 0,
      performed_at: new Date().toISOString(),
    }

    // Add to main queue and remove from failed
    await this.addOperation(newOp)
    await this.discardFailedOperation(id)
  },

  /**
   * Discard failed operation
   */
  async discardFailedOperation(id: string): Promise<void> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(FAILED_STORE, 'readwrite')
      const store = transaction.objectStore(FAILED_STORE)
      const request = store.delete(id)

      request.onerror = () => reject(new Error('Failed to discard failed operation'))
      request.onsuccess = () => resolve()
    })
  },

  /**
   * Clear all failed operations
   */
  async clearFailedQueue(): Promise<void> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(FAILED_STORE, 'readwrite')
      const store = transaction.objectStore(FAILED_STORE)
      const request = store.clear()

      request.onerror = () => reject(new Error('Failed to clear failed queue'))
      request.onsuccess = () => resolve()
    })
  },

  /**
   * Get operation by ID
   */
  async getOperation(id: string): Promise<OfflineOperation | undefined> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(QUEUE_STORE, 'readonly')
      const store = transaction.objectStore(QUEUE_STORE)
      const request = store.get(id)

      request.onerror = () => reject(new Error('Failed to get operation'))
      request.onsuccess = () => resolve(request.result)
    })
  },

  /**
   * Update operation (e.g., increment retry count)
   */
  async updateOperation(operation: OfflineOperation): Promise<void> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(QUEUE_STORE, 'readwrite')
      const store = transaction.objectStore(QUEUE_STORE)
      const request = store.put(operation)

      request.onerror = () => reject(new Error('Failed to update operation'))
      request.onsuccess = () => resolve()
    })
  },
}

export default IndexedDBService
