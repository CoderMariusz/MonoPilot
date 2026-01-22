/**
 * BatchLabelQueue Component (Story 07.13)
 * Purpose: Multi-label management table for batch operations
 *
 * Features:
 * - Table with box info, SSCC, weight, status
 * - Status badges (Ready, Error)
 * - Bulk actions: Generate All, Print All
 * - Row actions: Print, Preview, Retry
 * - Selection checkboxes
 * - Batch summary counts
 *
 * AC Coverage:
 * - AC: Batch label generation and printing
 */

'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Printer, Eye, RefreshCw, Barcode } from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

export type BoxStatus = 'ready' | 'error' | 'pending' | 'printing'

export interface BoxItem {
  id: string
  boxNumber: number
  sscc: string | null
  status: BoxStatus
  weight: number
  error?: string
}

export interface BatchLabelQueueProps {
  /** List of boxes */
  boxes: BoxItem[]
  /** Generate all callback */
  onGenerateAll: () => void
  /** Print all callback */
  onPrintAll: (selectedIds?: string[]) => void
  /** Print single box callback */
  onPrintSingle: (boxId: string) => void
  /** Preview single box callback */
  onPreview?: (boxId: string) => void
  /** Retry failed box callback */
  onRetry: (boxId: string) => void
  /** Loading state */
  loading?: boolean
  /** Additional className */
  className?: string
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Format SSCC with spaces for display
 */
function formatSSCC(sscc: string): string {
  if (!sscc || sscc.length !== 18) return sscc || '--'
  return `${sscc.substring(0, 2)} ${sscc.substring(2, 6)} ${sscc.substring(6, 10)} ${sscc.substring(10, 14)} ${sscc.substring(14, 18)}`
}

/**
 * Get status badge classes
 */
function getStatusClasses(status: BoxStatus): string {
  switch (status) {
    case 'ready':
      return 'bg-green-100 text-green-800 green'
    case 'error':
      return 'bg-red-100 text-red-800 red'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'printing':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// =============================================================================
// Component
// =============================================================================

export function BatchLabelQueue({
  boxes,
  onGenerateAll,
  onPrintAll,
  onPrintSingle,
  onPreview,
  onRetry,
  loading = false,
  className,
}: BatchLabelQueueProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Calculate summary counts
  const summary = useMemo(() => {
    const counts = { ready: 0, error: 0, pending: 0, printing: 0 }
    boxes.forEach((box) => {
      counts[box.status] = (counts[box.status] || 0) + 1
    })
    return counts
  }, [boxes])

  // Get ready box count for Print All button
  const readyCount = summary.ready

  // Handle select all
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(boxes.map((b) => b.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  // Handle individual selection
  const handleSelectBox = (boxId: string, checked: boolean) => {
    const newSet = new Set(selectedIds)
    if (checked) {
      newSet.add(boxId)
    } else {
      newSet.delete(boxId)
    }
    setSelectedIds(newSet)
  }

  // Check if all are selected
  const allSelected = boxes.length > 0 && selectedIds.size === boxes.length

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm" data-testid="batch-summary">
          <span data-testid="ready-count">Total: {readyCount} ready</span>
          {summary.error > 0 && (
            <span className="text-red-600" data-testid="error-count">Total: {summary.error} error</span>
          )}
          {summary.pending > 0 && (
            <span className="text-yellow-600">{summary.pending} pending</span>
          )}
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerateAll}
            disabled={loading}
            aria-label="Generate All"
          >
            <Barcode className="h-4 w-4 mr-1" />
            Generate All
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onPrintAll(selectedIds.size > 0 ? Array.from(selectedIds) : undefined)}
            disabled={loading || readyCount === 0}
            aria-label={`Print All (${readyCount})`}
          >
            <Printer className="h-4 w-4 mr-1" />
            Print All ({readyCount})
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full" role="table">
          <thead className="bg-muted/50">
            <tr role="row">
              <th className="w-12 p-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  aria-label="Select all"
                  className="h-4 w-4 rounded border-gray-300"
                />
              </th>
              <th className="w-16 p-3 text-left text-sm font-medium">Box #</th>
              <th className="p-3 text-left text-sm font-medium">SSCC</th>
              <th className="w-24 p-3 text-left text-sm font-medium">Weight</th>
              <th className="w-24 p-3 text-left text-sm font-medium">Status</th>
              <th className="w-32 p-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {boxes.map((box) => (
              <tr key={box.id} role="row" className="border-t">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(box.id)}
                    onChange={(e) => handleSelectBox(box.id, e.target.checked)}
                    aria-label={`Select box ${box.boxNumber}`}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </td>
                <td className="p-3 font-medium">{box.boxNumber}</td>
                <td className="p-3 font-mono text-sm">
                  {box.sscc ? formatSSCC(box.sscc) : '--'}
                </td>
                <td className="p-3">{(box.weight ?? 0).toFixed(1)} kg</td>
                <td className="p-3">
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize',
                      getStatusClasses(box.status)
                    )}
                  >
                    {box.status}
                  </span>
                  {box.error && (
                    <div className="text-xs text-red-600 mt-1">{box.error}</div>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    {box.status === 'ready' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onPrintSingle(box.id)}
                          aria-label="Print"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onPreview?.(box.id)}
                          aria-label="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {box.status === 'error' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRetry(box.id)}
                        aria-label="Retry"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default BatchLabelQueue
