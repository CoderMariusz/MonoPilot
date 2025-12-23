/**
 * SetDefaultDialog Component
 * Story: 01.13 - Tax Codes CRUD
 *
 * Confirmation dialog for setting tax code as default
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
import type { TaxCode } from '@/lib/types/tax-code'

interface SetDefaultDialogProps {
  open: boolean
  taxCode: TaxCode | null
  onConfirm: () => void
  onCancel: () => void
}

export function SetDefaultDialog({ open, taxCode, onConfirm, onCancel }: SetDefaultDialogProps) {
  if (!taxCode) return null

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Set Default Tax Code</AlertDialogTitle>
          <AlertDialogDescription>
            Set <strong>{taxCode.code}</strong> as the default tax code? The current default will be unset.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
