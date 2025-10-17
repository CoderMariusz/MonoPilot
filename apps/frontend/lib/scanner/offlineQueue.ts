/**
 * Offline Queue System for Scanner Operations
 * Handles queuing of scanner requests when network is unavailable
 */

interface QueuedRequest {
  id: string;
  method: string;
  url: string;
  body?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface QueueStatus {
  isOnline: boolean;
  queueLength: number;
  lastSyncTime: number;
}

class OfflineQueue {
  private dbName = 'scanner-offline-queue';
  private version = 1;
  private db: IDBDatabase | null = null;
  private syncInProgress = false;
  private listeners: ((status: QueueStatus) => void)[] = [];

  constructor() {
    this.initDB();
    this.setupOnlineListener();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('requests')) {
          const store = db.createObjectStore('requests', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('retryCount', 'retryCount');
        }
      };
    });
  }

  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      this.setOnline(true);
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.setOnline(false);
    });
  }

  private setOnline(isOnline: boolean): void {
    this.notifyListeners({
      isOnline,
      queueLength: this.getQueueLength(),
      lastSyncTime: Date.now()
    });
  }

  private notifyListeners(status: QueueStatus): void {
    this.listeners.forEach(listener => listener(status));
  }

  private getQueueLength(): number {
    // This would be implemented to get actual queue length
    return 0;
  }

  /**
   * Add a request to the offline queue
   */
  async queueRequest(
    method: string,
    url: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<QueuedRequest> {
    const request: QueuedRequest = {
      id: this.generateId(),
      method,
      url,
      body,
      headers,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };

    await this.storeRequest(request);
    this.notifyListeners({
      isOnline: navigator.onLine,
      queueLength: await this.getStoredQueueLength(),
      lastSyncTime: Date.now()
    });

    return request;
  }

  /**
   * Store request in IndexedDB
   */
  private async storeRequest(request: QueuedRequest): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['requests'], 'readwrite');
      const store = transaction.objectStore('requests');
      const addRequest = store.add(request);

      addRequest.onsuccess = () => resolve();
      addRequest.onerror = () => reject(addRequest.error);
    });
  }

  /**
   * Remove request from IndexedDB
   */
  private async removeRequest(requestId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['requests'], 'readwrite');
      const store = transaction.objectStore('requests');
      const deleteRequest = store.delete(requestId);

      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    });
  }

  /**
   * Get all queued requests
   */
  private async getQueuedRequests(): Promise<QueuedRequest[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['requests'], 'readonly');
      const store = transaction.objectStore('requests');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });
  }

  /**
   * Get queue length from IndexedDB
   */
  private async getStoredQueueLength(): Promise<number> {
    const requests = await this.getQueuedRequests();
    return requests.length;
  }

  /**
   * Process the offline queue when network is available
   */
  async processQueue(): Promise<void> {
    if (this.syncInProgress || !navigator.onLine) return;

    this.syncInProgress = true;

    try {
      const requests = await this.getQueuedRequests();
      
      for (const request of requests) {
        try {
          await this.processRequest(request);
          await this.removeRequest(request.id);
        } catch (error) {
          console.error(`Failed to process request ${request.id}:`, error);
          
          // Increment retry count
          request.retryCount++;
          
          if (request.retryCount >= request.maxRetries) {
            // Max retries reached, remove from queue
            await this.removeRequest(request.id);
            console.error(`Request ${request.id} exceeded max retries, removed from queue`);
          } else {
            // Update retry count in storage
            await this.updateRequest(request);
          }
        }
      }

      this.notifyListeners({
        isOnline: navigator.onLine,
        queueLength: await this.getStoredQueueLength(),
        lastSyncTime: Date.now()
      });
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Process a single queued request
   */
  private async processRequest(request: QueuedRequest): Promise<Response> {
    const fetchOptions: RequestInit = {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        ...request.headers
      }
    };

    if (request.body) {
      fetchOptions.body = JSON.stringify(request.body);
    }

    const response = await fetch(request.url, fetchOptions);

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 409) {
        // Conflict - refresh data and retry
        throw new Error('CONFLICT_NEED_REFRESH');
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }

  /**
   * Update request in IndexedDB
   */
  private async updateRequest(request: QueuedRequest): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['requests'], 'readwrite');
      const store = transaction.objectStore('requests');
      const putRequest = store.put(request);

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    });
  }

  /**
   * Make a request with offline support
   */
  async makeRequest(
    method: string,
    url: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<Response> {
    if (navigator.onLine) {
      try {
        const response = await this.processRequest({
          id: '',
          method,
          url,
          body,
          headers,
          timestamp: Date.now(),
          retryCount: 0,
          maxRetries: 0
        });
        return response;
      } catch (error) {
        // If online request fails, queue it for retry
        await this.queueRequest(method, url, body, headers);
        throw error;
      }
    } else {
      // Offline - queue the request
      await this.queueRequest(method, url, body, headers);
      throw new Error('OFFLINE_QUEUED');
    }
  }

  /**
   * Subscribe to queue status changes
   */
  subscribe(listener: (status: QueueStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current queue status
   */
  async getStatus(): Promise<QueueStatus> {
    return {
      isOnline: navigator.onLine,
      queueLength: await this.getStoredQueueLength(),
      lastSyncTime: Date.now()
    };
  }

  /**
   * Clear all queued requests
   */
  async clearQueue(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['requests'], 'readwrite');
      const store = transaction.objectStore('requests');
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  }

  /**
   * Generate unique request ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const offlineQueue = new OfflineQueue();

// Export types
export type { QueuedRequest, QueueStatus };
