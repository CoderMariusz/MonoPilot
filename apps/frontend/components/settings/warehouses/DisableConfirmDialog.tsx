/**
 * DisableConfirmDialog Component
 * Story: 01.8 - Warehouses CRUD
 *
 * Confirmation dialog for disabling a warehouse
 * Shows warnings for active inventory or default status
 */

'use client'

import { useState, useEffect } from 'react'
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
import { AlertTriangle, XCircle } from 'lucide-react'
import type { Warehouse } from '@/lib/types/warehouse'
import { useCanDisableWarehouse } from '@/lib/hooks/use-warehouse-mutations'

interface DisableConfirmDialogProps {
  warehouse: Warehouse | null
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function DisableConfirmDialog({
  warehouse,
  open,
  onConfirm,
  onCancel,
  isLoading = false,
}: DisableConfirmDialogProps) {
  const [canDisable, setCanDisable] = useState<{ allowed: boolean; reason?: string } | null>(null)
  const checkCanDisable = useCanDisableWarehouse()

  // Check if warehouse can be disabled when dialog opens
  useEffect(() => {
    if (open && warehouse) {
      setCanDisable(null)
      checkCanDisable.mutate(warehouse.id, {
        onSuccess: (result) => setCanDisable(result),
        onError: () => setCanDisable({ allowed: false, reason: 'Failed to check disable status' }),
      })
    }
  }, [open, warehouse?.id])

  if (!warehouse) return null

  const isChecking = checkCanDisable.isPending
  const canProceed = canDisable?.allowed === true

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disable Warehouse?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Are you sure you want to disable <strong>{warehouse.code}</strong>?
              </p>

              {isChecking && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="animate-spin">...</span>
                  <span>Checking warehouse status...</span>
                </div>
              )}

              {!isChecking && canDisable && !canDisable.allowed && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-md">
                  <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Cannot disable this warehouse</p>
                    <p className="text-sm text-muted-foreground">{canDisable.reason}</p>
                  </div>
                </div>
              )}

              {!isChecking && canProceed && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-700 dark:text-yellow-500">Warning</p>
                    <p className="text-sm text-muted-foreground">
                      Disabled warehouses cannot be used for new inventory operations. Existing
                      inventory will remain in place.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading || isChecking || !canProceed}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Disabling...' : 'Disable Warehouse'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
