/**
 * Failed Queue UI
 * Story 5.36: Scanner Offline Queue - Core
 *
 * Shows failed operations with retry/discard options
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertTriangle,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  Package,
  ArrowRight,
  Boxes,
  Calculator,
  Scissors,
} from 'lucide-react'
import { IndexedDBService, type FailedOperation } from '@/lib/scanner/indexeddb-service'
import { SyncEngine } from '@/lib/scanner/sync-engine'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface FailedQueueUIProps {
  className?: string
}

const operationIcons: Record<string, React.ElementType> = {
  receive: Package,
  move: ArrowRight,
  consume: Boxes,
  output: Package,
  split: Scissors,
  count: Calculator,
}

const operationLabels: Record<string, string> = {
  receive: 'Receive',
  move: 'Move',
  consume: 'Consume',
  output: 'Output',
  split: 'Split',
  count: 'Count',
}

export function FailedQueueUI({ className }: FailedQueueUIProps) {
  const { toast } = useToast()
  const [failedOps, setFailedOps] = useState<FailedOperation[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<Set<string>>(new Set())

  // Load failed operations
  const loadFailedOps = async () => {
    try {
      const ops = await IndexedDBService.getFailedQueue()
      setFailedOps(ops)
    } catch (err) {
      console.error('[FailedQueueUI] Failed to load:', err)
    }
  }

  useEffect(() => {
    loadFailedOps()

    // Refresh on sync progress changes
    const unsub = SyncEngine.onProgress(() => {
      loadFailedOps()
    })

    return unsub
  }, [])

  // Toggle expand
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Retry operation
  const handleRetry = async (id: string) => {
    setLoading((prev) => new Set(prev).add(id))
    try {
      await IndexedDBService.retryFailedOperation(id)
      toast({
        title: 'Retry queued',
        description: 'Operation moved back to sync queue',
      })
      await loadFailedOps()

      // Trigger sync
      SyncEngine.syncQueue()
    } catch (err) {
      toast({
        title: 'Retry failed',
        description: err instanceof Error ? err.message : 'Failed to retry',
        variant: 'destructive',
      })
    } finally {
      setLoading((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  // Discard operation
  const handleDiscard = async (id: string) => {
    setLoading((prev) => new Set(prev).add(id))
    try {
      await IndexedDBService.discardFailedOperation(id)
      toast({
        title: 'Discarded',
        description: 'Operation removed from failed queue',
      })
      await loadFailedOps()
    } catch (err) {
      toast({
        title: 'Discard failed',
        description: err instanceof Error ? err.message : 'Failed to discard',
        variant: 'destructive',
      })
    } finally {
      setLoading((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  // Retry all
  const handleRetryAll = async () => {
    for (const op of failedOps) {
      await handleRetry(op.id)
    }
  }

  // Discard all
  const handleDiscardAll = async () => {
    try {
      await IndexedDBService.clearFailedQueue()
      setFailedOps([])
      toast({
        title: 'All discarded',
        description: 'Failed queue cleared',
      })
    } catch (err) {
      toast({
        title: 'Clear failed',
        description: err instanceof Error ? err.message : 'Failed to clear',
        variant: 'destructive',
      })
    }
  }

  if (failedOps.length === 0) {
    return null
  }

  return (
    <Card className={cn('border-red-200', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-base">Failed Operations</CardTitle>
          </div>
          <CardDescription>{failedOps.length} failed</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Bulk actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRetryAll} className="flex-1">
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry All
          </Button>
          <Button variant="outline" size="sm" onClick={handleDiscardAll} className="flex-1">
            <Trash2 className="h-4 w-4 mr-1" />
            Discard All
          </Button>
        </div>

        {/* Failed operations list */}
        <div className="space-y-2">
          {failedOps.map((op) => {
            const Icon = operationIcons[op.operation_type] || Package
            const isExpanded = expandedIds.has(op.id)
            const isLoading = loading.has(op.id)

            return (
              <div
                key={op.id}
                className="border rounded-lg p-3 bg-red-50/50"
              >
                {/* Header */}
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => toggleExpand(op.id)}
                >
                  <Icon className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-sm flex-1">
                    {operationLabels[op.operation_type] || op.operation_type}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(op.failed_at).toLocaleTimeString()}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>

                {/* Error message */}
                <p className="text-xs text-red-600 mt-1 line-clamp-1">{op.error}</p>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-3 space-y-2">
                    <div className="text-xs text-gray-600">
                      <p>
                        <strong>ID:</strong> {op.id}
                      </p>
                      <p>
                        <strong>Performed:</strong>{' '}
                        {new Date(op.performed_at).toLocaleString()}
                      </p>
                      <p>
                        <strong>Retries:</strong> {op.retry_count}
                      </p>
                      <p>
                        <strong>Error:</strong> {op.error}
                      </p>
                    </div>

                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-500">
                        Payload
                      </summary>
                      <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto max-h-32">
                        {JSON.stringify(op.payload, null, 2)}
                      </pre>
                    </details>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRetry(op.id)
                        }}
                        disabled={isLoading}
                        className="flex-1"
                      >
                        <RefreshCw
                          className={cn('h-4 w-4 mr-1', isLoading && 'animate-spin')}
                        />
                        Retry
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDiscard(op.id)
                        }}
                        disabled={isLoading}
                        className="flex-1"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Discard
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default FailedQueueUI
