/**
 * Supplier Bulk Actions Component
 * Story: 03.1 - Suppliers CRUD + Master Data
 *
 * Bulk action bar: Deactivate, Activate, Export
 */

'use client'

import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Download, Power, PowerOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { Supplier, BulkActionResult } from '@/lib/types/supplier'

interface SupplierBulkActionsProps {
  selectedIds: string[]
  selectedSuppliers: Supplier[]
  allSelected: boolean
  someSelected: boolean
  onSelectAll: () => void
  onDeactivate: () => Promise<BulkActionResult | void>
  onActivate: () => Promise<BulkActionResult | void>
  onExport: () => Promise<void>
  loading?: boolean
}

export function SupplierBulkActions({
  selectedIds,
  selectedSuppliers,
  allSelected,
  someSelected,
  onSelectAll,
  onDeactivate,
  onActivate,
  onExport,
  loading = false,
}: SupplierBulkActionsProps) {
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [activateDialogOpen, setActivateDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [lastResult, setLastResult] = useState<BulkActionResult | null>(null)

  const hasActiveSelected = selectedSuppliers.some((s) => s.is_active)
  const hasInactiveSelected = selectedSuppliers.some((s) => !s.is_active)
  const selectedCount = selectedIds.length

  const handleDeactivate = async () => {
    setActionLoading(true)
    try {
      const result = await onDeactivate()
      if (result) {
        setLastResult(result)
      }
    } finally {
      setActionLoading(false)
      setDeactivateDialogOpen(false)
    }
  }

  const handleActivate = async () => {
    setActionLoading(true)
    try {
      const result = await onActivate()
      if (result) {
        setLastResult(result)
      }
    } finally {
      setActionLoading(false)
      setActivateDialogOpen(false)
    }
  }

  const handleExport = async () => {
    setActionLoading(true)
    try {
      await onExport()
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-4 py-2 px-4 bg-muted/50 rounded-lg">
        {/* Select All Checkbox */}
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            ref={(ref) => {
              if (ref) {
                ref.dataset.state = someSelected && !allSelected ? 'indeterminate' : undefined
              }
            }}
            onCheckedChange={onSelectAll}
            aria-label="Select all suppliers"
          />
          <span className="text-sm text-muted-foreground">
            {selectedCount > 0 ? `${selectedCount} selected` : 'Select All'}
          </span>
        </div>

        {/* Bulk Actions */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            {/* Deactivate Button - Only show if active suppliers selected */}
            {hasActiveSelected && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeactivateDialogOpen(true)}
                disabled={loading || actionLoading}
                data-testid="button-deactivate-selected"
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PowerOff className="mr-2 h-4 w-4" />
                )}
                Deactivate
              </Button>
            )}

            {/* Activate Button - Only show if inactive suppliers selected */}
            {hasInactiveSelected && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActivateDialogOpen(true)}
                disabled={loading || actionLoading}
                data-testid="button-activate-selected"
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Power className="mr-2 h-4 w-4" />
                )}
                Activate
              </Button>
            )}

            {/* Export Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={loading || actionLoading}
              data-testid="button-export"
            >
              {actionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export to Excel
            </Button>
          </div>
        )}
      </div>

      {/* Bulk Result Display */}
      {lastResult && lastResult.failed_count > 0 && (
        <div
          data-testid="bulk-result-details"
          className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <p className="text-sm font-medium text-yellow-800" data-testid="toast-bulk-result">
            {lastResult.success_count} deactivated, {lastResult.failed_count} failed
          </p>
          <ul className="mt-2 text-sm text-yellow-700">
            {lastResult.results
              .filter((r) => r.status === 'failed')
              .map((r) => (
                <li key={r.id}>
                  {r.code || r.id}: {r.error}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Suppliers</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {selectedSuppliers.filter((s) => s.is_active).length}{' '}
              supplier(s)? They will no longer appear in purchase order dropdowns.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={actionLoading}
              data-testid="button-confirm-deactivate"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deactivating...
                </>
              ) : (
                'Deactivate'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate Confirmation Dialog */}
      <AlertDialog open={activateDialogOpen} onOpenChange={setActivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate Suppliers</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to activate{' '}
              {selectedSuppliers.filter((s) => !s.is_active).length} supplier(s)?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActivate}
              disabled={actionLoading}
              data-testid="button-confirm-activate"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Activating...
                </>
              ) : (
                'Activate'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
