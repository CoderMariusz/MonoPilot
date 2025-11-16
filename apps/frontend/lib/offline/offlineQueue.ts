/**
 * Offline Queue Manager - IndexedDB-based offline data persistence
 * Story 1.7.1 - AC-5: Offline Workflow
 *
 * Stores scanned items in IndexedDB when offline, syncs when online.
 * Target: 100% offline capability (0% data loss during network outages)
 *
 * @module OfflineQueue
 */

const DB_NAME = 'MonoPilotOfflineQueue';
const DB_VERSION = 1;
const STORE_NAME = 'scannedItems';

export interface QueuedScan {
  id: string; // UUID for client-side tracking
  asn_id: number;
  scanned_items: any[];
  warehouse_id: number;
  po_id: number;
  po_number: string;
  user_id: string;
  timestamp: number; // Date.now()
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retry_count: number;
  error_message?: string;
}

class OfflineQueueManager {
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB connection
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[OfflineQueue] Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[OfflineQueue] IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });

          // Create indexes
          objectStore.createIndex('status', 'status', { unique: false });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          objectStore.createIndex('asn_id', 'asn_id', { unique: false });

          console.log('[OfflineQueue] Object store created');
        }
      };
    });
  }

  /**
   * Add scanned items to offline queue
   */
  async addToQueue(data: Omit<QueuedScan, 'id' | 'status' | 'retry_count' | 'timestamp'>): Promise<string> {
    if (!this.db) await this.init();

    const id = crypto.randomUUID();
    const queuedScan: QueuedScan = {
      ...data,
      id,
      status: 'pending',
      retry_count: 0,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.add(queuedScan);

      request.onsuccess = () => {
        console.log('[OfflineQueue] Item added to queue:', id);
        resolve(id);
      };

      request.onerror = () => {
        console.error('[OfflineQueue] Failed to add item:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all pending items from queue
   */
  async getPendingItems(): Promise<QueuedScan[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('[OfflineQueue] Failed to get pending items:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Update queue item status
   */
  async updateStatus(id: string, status: QueuedScan['status'], errorMessage?: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const getRequest = objectStore.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result as QueuedScan;
        if (!item) {
          reject(new Error(`Item ${id} not found in queue`));
          return;
        }

        item.status = status;
        if (errorMessage) {
          item.error_message = errorMessage;
        }
        if (status === 'failed') {
          item.retry_count += 1;
        }

        const updateRequest = objectStore.put(item);

        updateRequest.onsuccess = () => {
          console.log('[OfflineQueue] Item status updated:', id, status);
          resolve();
        };

        updateRequest.onerror = () => {
          console.error('[OfflineQueue] Failed to update status:', updateRequest.error);
          reject(updateRequest.error);
        };
      };

      getRequest.onerror = () => {
        console.error('[OfflineQueue] Failed to get item:', getRequest.error);
        reject(getRequest.error);
      };
    });
  }

  /**
   * Remove item from queue (after successful sync)
   */
  async removeFromQueue(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.delete(id);

      request.onsuccess = () => {
        console.log('[OfflineQueue] Item removed from queue:', id);
        resolve();
      };

      request.onerror = () => {
        console.error('[OfflineQueue] Failed to remove item:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get queue count by status
   */
  async getQueueCount(status?: QueuedScan['status']): Promise<number> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);

      let request: IDBRequest;
      if (status) {
        const index = objectStore.index('status');
        request = index.count(status);
      } else {
        request = objectStore.count();
      }

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('[OfflineQueue] Failed to count items:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear all synced items (housekeeping)
   */
  async clearSyncedItems(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index('status');
      const request = index.openCursor(IDBKeyRange.only('synced'));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          console.log('[OfflineQueue] Synced items cleared');
          resolve();
        }
      };

      request.onerror = () => {
        console.error('[OfflineQueue] Failed to clear synced items:', request.error);
        reject(request.error);
      };
    });
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueueManager();
