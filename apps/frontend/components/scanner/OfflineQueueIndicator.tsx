/**
 * Offline Queue Indicator
 * Story 5.36: Scanner Offline Queue - Core
 *
 * Shows:
 * - Network status badge (Online/Offline)
 * - Queue counter
 * - Sync status
 */

'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, Package, Loader2, Check, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NetworkMonitor } from '@/lib/scanner/network-monitor'
import { SyncEngine, type SyncProgress } from '@/lib/scanner/sync-engine'
import { IndexedDBService } from '@/lib/scanner/indexeddb-service'

interface OfflineQueueIndicatorProps {
  maxOperations?: number
  warningThresholdPct?: number
  className?: string
}

export function OfflineQueueIndicator({
  maxOperations = 100,
  warningThresholdPct = 80,
  className,
}: OfflineQueueIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [queueCount, setQueueCount] = useState(0)
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    status: 'idle',
    current: 0,
    total: 0,
    message: '',
  })

  // Calculate warning threshold
  const warningThreshold = Math.floor(maxOperations * (warningThresholdPct / 100))
  const isWarning = queueCount >= warningThreshold && queueCount < maxOperations
  const isFull = queueCount >= maxOperations

  // Initialize monitors
  useEffect(() => {
    NetworkMonitor.init()
    SyncEngine.init()

    // Set initial state
    setIsOnline(NetworkMonitor.isOnline())

    // Network callbacks
    const unsubOnline = NetworkMonitor.onOnline(() => setIsOnline(true))
    const unsubOffline = NetworkMonitor.onOffline(() => setIsOnline(false))

    // Sync progress callback
    const unsubProgress = SyncEngine.onProgress((progress) => {
      setSyncProgress(progress)
    })

    // Initial queue count
    updateQueueCount()

    // Periodic queue count update
    const interval = setInterval(updateQueueCount, 5000)

    return () => {
      unsubOnline()
      unsubOffline()
      unsubProgress()
      clearInterval(interval)
    }
  }, [])

  // Update queue count
  const updateQueueCount = async () => {
    try {
      const count = await IndexedDBService.getQueueCount()
      setQueueCount(count)
    } catch (err) {
      console.error('Failed to get queue count:', err)
    }
  }

  // Determine status icon
  const StatusIcon = () => {
    if (syncProgress.status === 'syncing') {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }
    if (syncProgress.status === 'success') {
      return <Check className="h-4 w-4" />
    }
    if (syncProgress.status === 'error') {
      return <AlertTriangle className="h-4 w-4" />
    }
    return null
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Network Status Badge */}
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
          isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        )}
      >
        {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
      </div>

      {/* Queue Counter (when > 0) */}
      {queueCount > 0 && (
        <div
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
            isFull
              ? 'bg-red-100 text-red-700'
              : isWarning
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-blue-100 text-blue-700'
          )}
        >
          <Package className="h-3 w-3" />
          <span>
            {queueCount}
            {maxOperations && `/${maxOperations}`}
          </span>
        </div>
      )}

      {/* Sync Status */}
      {syncProgress.status !== 'idle' && syncProgress.status !== 'offline' && (
        <div
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
            syncProgress.status === 'syncing' && 'bg-blue-100 text-blue-700',
            syncProgress.status === 'success' && 'bg-green-100 text-green-700',
            syncProgress.status === 'error' && 'bg-red-100 text-red-700'
          )}
        >
          <StatusIcon />
          <span className="hidden sm:inline">
            {syncProgress.status === 'syncing' && 'Syncing...'}
            {syncProgress.status === 'success' && 'Synced'}
            {syncProgress.status === 'error' && 'Error'}
          </span>
        </div>
      )}
    </div>
  )
}

export default OfflineQueueIndicator
