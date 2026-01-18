/**
 * Expiring Items Bulk Actions Component
 * Story: WH-INV-001 - Inventory Browser (Expiring Items Tab)
 *
 * Toolbar with bulk actions for selected items
 */

'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AlertTriangle, FileSpreadsheet, Printer, X } from 'lucide-react'
import type { BulkExpiryAction } from '@/lib/validation/expiry-alert-schema'

interface ExpiringItemsBulkActionsProps {
  selectedCount: number
  onAction: (action: BulkExpiryAction['action']) => Promise<void>
  onClear: () => void
  isLoading?: boolean
  className?: string
}

export function ExpiringItemsBulkActions({
  selectedCount,
  onAction,
  onClear,
  isLoading = false,
  className,
}: ExpiringItemsBulkActionsProps) {
  if (selectedCount === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg bg-accent p-4',
        className
      )}
      role="toolbar"
      aria-label="Bulk actions for selected items"
      data-testid="bulk-actions-toolbar"
    >
      <span className="font-medium text-sm">
        {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
      </span>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onAction('quarantine')}
          disabled={isLoading}
          aria-label="Move selected items to quarantine"
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          Move to Quarantine
        </Button>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => onAction('adjust')}
          disabled={isLoading}
          aria-label="Create adjustment for selected items"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Create Adjustment
        </Button>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => onAction('print_labels')}
          disabled={isLoading}
          aria-label="Print labels for selected items"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print Labels
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={onClear}
          disabled={isLoading}
          aria-label="Clear selection"
        >
          <X className="mr-1 h-4 w-4" />
          Clear
        </Button>
      </div>
    </div>
  )
}
