/**
 * Supplier Delete Modal Component
 * Story: 03.1 - Suppliers CRUD + Master Data
 *
 * Confirmation modal for delete action
 */

'use client'

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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle } from 'lucide-react'
import type { Supplier } from '@/lib/types/supplier'

interface SupplierDeleteModalProps {
  open: boolean
  supplier: Supplier | null
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  error?: string | null
}

export function SupplierDeleteModal({
  open,
  supplier,
  onConfirm,
  onCancel,
  loading = false,
  error = null,
}: SupplierDeleteModalProps) {
  if (!supplier) return null

  const hasDependencies =
    supplier.has_open_pos ||
    (supplier.products_count ?? 0) > 0 ||
    (supplier.purchase_orders_count ?? 0) > 0

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent data-testid={error ? 'modal-error' : undefined}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete supplier <strong>{supplier.code}</strong> (
            {supplier.name})? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Error message if deletion is blocked */}
        {error && (
          <Alert variant="destructive" data-testid="error-details">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Warning about dependencies */}
        {hasDependencies && !error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Cannot delete this supplier because:
              <ul className="list-disc list-inside mt-2">
                {supplier.has_open_pos && <li>Has open purchase orders</li>}
                {(supplier.purchase_orders_count ?? 0) > 0 && (
                  <li>{supplier.purchase_orders_count} purchase orders exist</li>
                )}
                {(supplier.products_count ?? 0) > 0 && (
                  <li>{supplier.products_count} products are assigned</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={loading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading || hasDependencies}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="button-confirm-delete"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
