/**
 * DisableConfirmDialog Component
 * Story: 01.8 - Warehouse Management CRUD
 *
 * Confirmation dialog for disabling a warehouse
 * Shows warning if warehouse has active inventory or is default
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
import type { Warehouse } from '@/lib/types/warehouse'

interface DisableConfirmDialogProps {
  warehouse: Warehouse | null
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DisableConfirmDialog({
  warehouse,
  open,
  onConfirm,
  onCancel,
}: DisableConfirmDialogProps) {
  if (!warehouse) return null

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disable Warehouse?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to disable warehouse <strong>{warehouse.code}</strong>?
            This warehouse will no longer be available for new operations.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Disable</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
