/**
 * SetDefaultConfirmDialog Component
 * Story: 01.8 - Warehouses CRUD
 *
 * Confirmation dialog for setting a warehouse as default
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

interface SetDefaultConfirmDialogProps {
  warehouse: Warehouse | null
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function SetDefaultConfirmDialog({
  warehouse,
  open,
  onConfirm,
  onCancel,
  isLoading = false,
}: SetDefaultConfirmDialogProps) {
  if (!warehouse) return null

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Set as Default Warehouse?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to set <strong>{warehouse.code}</strong> as the default warehouse?
            <br />
            <br />
            The current default warehouse will be unset. New inventory operations will use this
            warehouse by default.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Setting...' : 'Set as Default'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
