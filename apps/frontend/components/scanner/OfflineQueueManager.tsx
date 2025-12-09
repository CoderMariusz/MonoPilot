/**
 * Offline Queue Manager
 * Story 5.36: Scanner Offline Queue - Core
 *
 * Main queue state management component
 * Provides context for offline operations
 */

'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { IndexedDBService, type OfflineOperation, type OfflineOperationType } from '@/lib/scanner/indexeddb-service'
import { NetworkMonitor } from '@/lib/scanner/network-monitor'
import { SyncEngine, type SyncProgress, type SyncStatus } from '@/lib/scanner/sync-engine'
import { useToast } from '@/hooks/use-toast'

interface OfflineQueueContextValue {
  isOnline: boolean
  queueCount: number
  failedCount: number
  syncStatus: SyncStatus
  syncProgress: SyncProgress
  maxOperations: number
  warningThreshold: number
  canQueue: boolean

  // Actions
  queueOperation: (type: OfflineOperationType, payload: Record<string, unknown>) => Promise<boolean>
  manualSync: () => Promise<void>
  getQueuedOperations: () => Promise<OfflineOperation[]>
  clearQueue: () => Promise<void>
}

const OfflineQueueContext = createContext<OfflineQueueContextValue | null>(null)

interface OfflineQueueProviderProps {
  children: ReactNode
  userId: string
  orgId: string
  maxOperations?: number
  warningThresholdPct?: number
  autoSyncOnReconnect?: boolean
}

export function OfflineQueueProvider({
  children,
  userId,
  orgId,
  maxOperations = 100,
  warningThresholdPct = 80,
  autoSyncOnReconnect = true,
}: OfflineQueueProviderProps) {
  const { toast } = useToast()
  const [isOnline, setIsOnline] = useState(true)
  const [queueCount, setQueueCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    status: 'idle',
    current: 0,
    total: 0,
    message: '',
  })

  const warningThreshold = Math.floor(maxOperations * (warningThresholdPct / 100))
  const canQueue = queueCount < maxOperations

  // Update counts
  const updateCounts = useCallback(async () => {
    try {
      const [queue, failed] = await Promise.all([
        IndexedDBService.getQueueCount(),
        IndexedDBService.getFailedQueueCount(),
      ])
      setQueueCount(queue)
      setFailedCount(failed)
    } catch (err) {
      console.error('[OfflineQueueManager] Failed to update counts:', err)
    }
  }, [])

  // Initialize
  useEffect(() => {
    NetworkMonitor.init()
    SyncEngine.init()

    setIsOnline(NetworkMonitor.isOnline())

    // Network callbacks
    const unsubOnline = NetworkMonitor.onOnline(() => {
      setIsOnline(true)
      if (autoSyncOnReconnect) {
        toast({
          title: 'Back online',
          description: 'Syncing queued operations...',
        })
      }
    })

    const unsubOffline = NetworkMonitor.onOffline(() => {
      setIsOnline(false)
      toast({
        title: 'Offline',
        description: 'Operations will be queued locally',
        variant: 'destructive',
      })
    })

    // Sync progress
    const unsubProgress = SyncEngine.onProgress((progress) => {
      setSyncProgress(progress)
      setSyncStatus(progress.status)

      // Update counts after sync completes
      if (progress.status === 'success' || progress.status === 'error') {
        updateCounts()

        if (progress.status === 'success' && progress.current > 0) {
          toast({
            title: 'Sync complete',
            description: progress.message,
          })
        } else if (progress.status === 'error') {
          toast({
            title: 'Sync failed',
            description: progress.message,
            variant: 'destructive',
          })
        }
      }
    })

    // Initial counts
    updateCounts()

    // Periodic count update
    const interval = setInterval(updateCounts, 10000)

    return () => {
      unsubOnline()
      unsubOffline()
      unsubProgress()
      clearInterval(interval)
    }
  }, [autoSyncOnReconnect, toast, updateCounts])

  // Queue an operation
  const queueOperation = useCallback(async (
    type: OfflineOperationType,
    payload: Record<string, unknown>
  ): Promise<boolean> => {
    // Check if queue is full
    if (queueCount >= maxOperations) {
      toast({
        title: 'Queue full',
        description: `Cannot queue more operations. Max: ${maxOperations}. Sync required.`,
        variant: 'destructive',
      })
      return false
    }

    // Warn if approaching limit
    if (queueCount >= warningThreshold) {
      toast({
        title: 'Queue warning',
        description: `${queueCount + 1}/${maxOperations} queued. Reconnect to sync.`,
        variant: 'default',
      })
    }

    try {
      const operation: OfflineOperation = {
        id: crypto.randomUUID(),
        operation_type: type,
        payload,
        performed_at: new Date().toISOString(),
        retry_count: 0,
        user_id: userId,
        org_id: orgId,
      }

      await IndexedDBService.addOperation(operation)
      setQueueCount(prev => prev + 1)

      // If online, trigger immediate sync
      if (isOnline) {
        SyncEngine.syncQueue()
      }

      return true
    } catch (err) {
      console.error('[OfflineQueueManager] Failed to queue operation:', err)
      toast({
        title: 'Queue error',
        description: 'Failed to queue operation locally',
        variant: 'destructive',
      })
      return false
    }
  }, [queueCount, maxOperations, warningThreshold, userId, orgId, isOnline, toast])

  // Manual sync
  const manualSync = useCallback(async () => {
    if (!isOnline) {
      toast({
        title: 'Offline',
        description: 'Cannot sync while offline',
        variant: 'destructive',
      })
      return
    }

    await SyncEngine.manualSync()
  }, [isOnline, toast])

  // Get queued operations
  const getQueuedOperations = useCallback(async () => {
    return IndexedDBService.getQueue()
  }, [])

  // Clear queue
  const clearQueue = useCallback(async () => {
    await IndexedDBService.clearQueue()
    setQueueCount(0)
    toast({
      title: 'Queue cleared',
      description: 'All queued operations have been removed',
    })
  }, [toast])

  const value: OfflineQueueContextValue = {
    isOnline,
    queueCount,
    failedCount,
    syncStatus,
    syncProgress,
    maxOperations,
    warningThreshold,
    canQueue,
    queueOperation,
    manualSync,
    getQueuedOperations,
    clearQueue,
  }

  return (
    <OfflineQueueContext.Provider value={value}>
      {children}
    </OfflineQueueContext.Provider>
  )
}

export function useOfflineQueue() {
  const context = useContext(OfflineQueueContext)
  if (!context) {
    throw new Error('useOfflineQueue must be used within OfflineQueueProvider')
  }
  return context
}

export default OfflineQueueProvider
