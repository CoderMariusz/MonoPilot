/**
 * Scanner State Management
 * Manages staging, caching, and state for scanner operations
 */

import { offlineQueue, QueueStatus } from './offlineQueue';

interface StagedLP {
  id: number;
  lp_number: string;
  product_id: number;
  quantity: number;
  qa_status: string;
  stage_suffix?: string;
  reserved_at: number;
}

interface OperationCache {
  woId: number;
  operationSeq: number;
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface ScannerState {
  // Current operation
  currentWOId: number | null;
  currentOperationSeq: number | null;
  
  // Staging state
  stagedLPs: Map<number, StagedLP[]>; // operationSeq -> StagedLPs
  
  // Cache
  operationCache: Map<string, OperationCache>;
  
  // Offline status
  isOnline: boolean;
  queueLength: number;
  lastSyncTime: number;
}

class ScannerStateManager {
  private state: ScannerState = {
    currentWOId: null,
    currentOperationSeq: null,
    stagedLPs: new Map(),
    operationCache: new Map(),
    isOnline: navigator.onLine,
    queueLength: 0,
    lastSyncTime: Date.now()
  };

  private listeners: ((state: ScannerState) => void)[] = [];
  private unsubscribeQueue?: () => void;

  constructor() {
    this.setupOfflineListener();
    this.loadFromLocalStorage();
  }

  /**
   * Setup offline queue listener
   */
  private setupOfflineListener(): void {
    this.unsubscribeQueue = offlineQueue.subscribe((queueStatus: QueueStatus) => {
      this.state.isOnline = queueStatus.isOnline;
      this.state.queueLength = queueStatus.queueLength;
      this.state.lastSyncTime = queueStatus.lastSyncTime;
      this.notifyListeners();
      this.saveToLocalStorage();
    });
  }

  /**
   * Set current work order and operation
   */
  setCurrentOperation(woId: number, operationSeq: number): void {
    this.state.currentWOId = woId;
    this.state.currentOperationSeq = operationSeq;
    this.notifyListeners();
    this.saveToLocalStorage();
  }

  /**
   * Get current operation info
   */
  getCurrentOperation(): { woId: number | null; operationSeq: number | null } {
    return {
      woId: this.state.currentWOId,
      operationSeq: this.state.currentOperationSeq
    };
  }

  /**
   * Stage an LP for an operation
   */
  stageLP(operationSeq: number, lp: Omit<StagedLP, 'reserved_at'>): void {
    const stagedLP: StagedLP = {
      ...lp,
      reserved_at: Date.now()
    };

    if (!this.state.stagedLPs.has(operationSeq)) {
      this.state.stagedLPs.set(operationSeq, []);
    }

    const existingLPs = this.state.stagedLPs.get(operationSeq)!;
    const existingIndex = existingLPs.findIndex(existing => existing.id === lp.id);

    if (existingIndex >= 0) {
      // Update existing staged LP
      existingLPs[existingIndex] = stagedLP;
    } else {
      // Add new staged LP
      existingLPs.push(stagedLP);
    }

    this.notifyListeners();
    this.saveToLocalStorage();
  }

  /**
   * Unstage an LP from an operation
   */
  unstageLP(operationSeq: number, lpId: number): void {
    const stagedLPs = this.state.stagedLPs.get(operationSeq);
    if (stagedLPs) {
      const index = stagedLPs.findIndex(lp => lp.id === lpId);
      if (index >= 0) {
        stagedLPs.splice(index, 1);
        this.notifyListeners();
        this.saveToLocalStorage();
      }
    }
  }

  /**
   * Get staged LPs for an operation
   */
  getStagedLPs(operationSeq: number): StagedLP[] {
    return this.state.stagedLPs.get(operationSeq) || [];
  }

  /**
   * Clear staged LPs for an operation
   */
  clearStagedLPs(operationSeq: number): void {
    this.state.stagedLPs.delete(operationSeq);
    this.notifyListeners();
    this.saveToLocalStorage();
  }

  /**
   * Get all staged LPs
   */
  getAllStagedLPs(): Map<number, StagedLP[]> {
    return new Map(this.state.stagedLPs);
  }

  /**
   * Cache operation data
   */
  cacheOperationData(woId: number, operationSeq: number, data: any, ttl: number = 300000): void {
    const key = `${woId}-${operationSeq}`;
    const cacheEntry: OperationCache = {
      woId,
      operationSeq,
      data,
      timestamp: Date.now(),
      ttl
    };

    this.state.operationCache.set(key, cacheEntry);
    this.notifyListeners();
    this.saveToLocalStorage();
  }

  /**
   * Get cached operation data
   */
  getCachedOperationData(woId: number, operationSeq: number): any | null {
    const key = `${woId}-${operationSeq}`;
    const cacheEntry = this.state.operationCache.get(key);

    if (!cacheEntry) {
      return null;
    }

    // Check if cache entry has expired
    if (Date.now() - cacheEntry.timestamp > cacheEntry.ttl) {
      this.state.operationCache.delete(key);
      this.notifyListeners();
      this.saveToLocalStorage();
      return null;
    }

    return cacheEntry.data;
  }

  /**
   * Clear cache for a specific operation
   */
  clearOperationCache(woId: number, operationSeq: number): void {
    const key = `${woId}-${operationSeq}`;
    this.state.operationCache.delete(key);
    this.notifyListeners();
    this.saveToLocalStorage();
  }

  /**
   * Clear all cached data
   */
  clearAllCache(): void {
    this.state.operationCache.clear();
    this.notifyListeners();
    this.saveToLocalStorage();
  }

  /**
   * Get current state
   */
  getState(): ScannerState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: ScannerState) => void): () => void {
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
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  /**
   * Save state to localStorage
   */
  private saveToLocalStorage(): void {
    try {
      const stateToSave = {
        currentWOId: this.state.currentWOId,
        currentOperationSeq: this.state.currentOperationSeq,
        stagedLPs: Array.from(this.state.stagedLPs.entries()),
        operationCache: Array.from(this.state.operationCache.entries()),
        lastSyncTime: this.state.lastSyncTime
      };
      
      localStorage.setItem('scanner-state', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Failed to save scanner state to localStorage:', error);
    }
  }

  /**
   * Load state from localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      const savedState = localStorage.getItem('scanner-state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        
        this.state.currentWOId = parsed.currentWOId;
        this.state.currentOperationSeq = parsed.currentOperationSeq;
        this.state.stagedLPs = new Map(parsed.stagedLPs || []);
        this.state.operationCache = new Map(parsed.operationCache || []);
        this.state.lastSyncTime = parsed.lastSyncTime || Date.now();
        
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to load scanner state from localStorage:', error);
    }
  }

  /**
   * Clear all state
   */
  clearAll(): void {
    this.state.currentWOId = null;
    this.state.currentOperationSeq = null;
    this.state.stagedLPs.clear();
    this.state.operationCache.clear();
    this.notifyListeners();
    this.saveToLocalStorage();
  }

  /**
   * Cleanup expired cache entries
   */
  cleanupExpiredCache(): void {
    const now = Date.now();
    let hasChanges = false;

    for (const [key, cacheEntry] of this.state.operationCache.entries()) {
      if (now - cacheEntry.timestamp > cacheEntry.ttl) {
        this.state.operationCache.delete(key);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      this.notifyListeners();
      this.saveToLocalStorage();
    }
  }

  /**
   * Destroy the state manager
   */
  destroy(): void {
    if (this.unsubscribeQueue) {
      this.unsubscribeQueue();
    }
    this.listeners = [];
  }
}

// Export singleton instance
export const scannerState = new ScannerStateManager();

// Export types
export type { StagedLP, OperationCache, ScannerState };
